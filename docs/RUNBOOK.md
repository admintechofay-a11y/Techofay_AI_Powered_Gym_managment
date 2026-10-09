# GymOS Production Runbook & Disaster Recovery Manual

## 1. Incident Severity Definitions & Escalation

| Severity | Definition | Target Response (MTTA) | Target Resolution (MTTR) |
| :--- | :--- | :--- | :--- |
| **P1 - Critical** | Whole system down, turnstiles unable to check-in, data corruption, database offline | < 15 minutes | < 2 hours |
| **P2 - Major** | Core feature impaired (e.g. online booking failing, payment webhooks failing) | < 30 minutes | < 6 hours |
| **P3 - Minor** | Non-critical feature bug, reporting UI delay, cosmetic defect | < 4 hours | < 24 hours |

---

## 2. Health Monitoring & Observability Probes

GymOS provides dual Kubernetes/Docker compliant health probes:

- **Liveness Probe**: `GET /health`
  - Validates process vitality, Node event loop responsiveness, and basic process metrics.
  - Expected: HTTP 200 `{ "status": "healthy", "service": "gymos-api" }`.
- **Readiness Probe**: `GET /ready`
  - Validates deep connectivity: MongoDB replica set ping, Redis connectivity, and writable storage.
  - If database is disconnected, returns HTTP 503 `{ "status": "unavailable", "database": "disconnected" }`.

---

## 3. Database Backup & Point-in-Time Recovery (PITR)

### Automated Daily Backups
The automated backup runner executes via cron at `02:00 UTC` daily using `scripts/backup-db.sh`.
Archives are stored with gzip compression and the MongoDB `--oplog` flag enabled, capturing ongoing transactions.

### Manual On-Demand Backup
```bash
./scripts/backup-db.sh
```

### Full Disaster Recovery Restore Procedure
1. Identify the latest valid archive in `/opt/gymos/backups/` or Cloud Storage.
2. Stop active API server traffic to prevent conflicting write operations:
   ```bash
   docker stop gymos-prod-api
   ```
3. Execute restore with the `--oplogReplay` flag:
   ```bash
   ./scripts/restore-db.sh /opt/gymos/backups/gymos_backup_20261007_020000.archive.gz
   ```
4. Verify record integrity via mongosh:
   ```bash
   mongosh "mongodb://localhost:27017/gymos" --eval "db.tenants.countDocuments(); db.members.countDocuments();"
   ```
5. Restart backend API:
   ```bash
   docker start gymos-prod-api
   ```

---

## 4. Zero-Downtime Deployment & Rolling Update Strategy

When rolling out new application versions:

1. **Pre-Deployment Verification**:
   Ensure CI acceptance gate has passed (`pnpm lint && pnpm typecheck && pnpm test && pnpm build`).
2. **Database Backward Compatibility**:
   Ensure schema changes are additive (no dropping required fields without two-stage deprecation).
3. **Rolling Container Update**:
   ```bash
   # 1. Pull new container image
   docker pull ghcr.io/techofay/gymos-api:latest

   # 2. Re-create API container with health check grace period
   docker compose -f docker-compose.prod.yml up -d --no-deps --build api
   ```
4. **Traffic Verification**:
   Inspect container logs:
   ```bash
   docker logs -f --tail 100 gymos-prod-api
   ```
   Confirm incoming requests show HTTP 200 with zero unhandled exceptions.

---

## 5. Database Schema Migration Strategy (`migrate-mongo`)

For stateful structural changes:
1. Migration files are stored in `packages/migrations/`.
2. Every migration file exports an `up(db)` and `down(db)` method.
3. Migrations are executed prior to container startup:
   ```bash
   npx migrate-mongo up
   ```
4. If a step fails, rollback using:
   ```bash
   npx migrate-mongo down
   ```

---

## 6. High Availability & Failover Scenarios

### Scenario A: MongoDB Primary Node Failure
- The MongoDB replica set automatically elects a new primary from the secondary members within 5-10 seconds.
- The Node.js MongoDB driver automatically buffers write operations during election (`retryWrites=true`).
- **Action**: Check `rs.status()` in mongosh to confirm successful primary election.

### Scenario B: Redis Cache Unavailability
- GymOS is built with resilient fallback:
- If Redis is down, the `cacheService` transparently routes queries to its in-process LRU cache and logs a non-fatal warning.
- Application API endpoints remain fully functional without downtime.
- **Action**: Restart Redis container:
  ```bash
  docker restart gymos-prod-redis
  ```

---

## 7. Emergency Contacts & Escalation Matrix

- **Platform Engineering Lead**: devops@techofay.com
- **Database Administration**: dba@techofay.com
- **Security Incident Response Team**: security@techofay.com
