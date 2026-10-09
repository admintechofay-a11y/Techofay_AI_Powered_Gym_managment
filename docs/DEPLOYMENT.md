# GymOS Production Deployment Guide

This guide provides step-by-step instructions for deploying GymOS in enterprise production environments.

---

## 1. System Requirements

### Recommended Hardware (Production Host)
- **CPU**: 4 vCPU cores (x86_64 or arm64)
- **RAM**: 8 GB minimum (16 GB recommended for 50,000+ members)
- **Disk**: 50 GB NVMe SSD with automated snapshots
- **OS**: Ubuntu 22.04 LTS / Debian 12 / RHEL 9

### Managed Infrastructure Pre-requisites
- **MongoDB**: Version 7.0+ Replica Set (e.g. MongoDB Atlas M10+ tier). Replica set is required for ACID transactions and oplog change streams.
- **Redis**: Version 7.0+ with persistence enabled (AOF or RDB).
- **Domain**: Custom domain with wildcard DNS support (`*.gymos.techofay.com`) for multi-tenant subdomain routing.

---

## 2. Environment Configuration

Create a production `.env` file on your host machine:

```env
# Application Runtime
NODE_ENV=production
PORT=5000
WEB_URL=https://app.gymos.techofay.com

# Databases
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/gymos?retryWrites=true&w=majority
REDIS_URL=rediss://default:<password>@redis-host:6379

# Cryptographic Secrets (Generate with `openssl rand -hex 32`)
JWT_ACCESS_SECRET=c3b018e69e2c45168e3a246985a1cfbe339e8751fa0ef58a74e50eb1c841e7d2
JWT_REFRESH_SECRET=7f51172f3e823908b17bce628fa6a88b56d39ad288c3f4e259b19df5f5e3e204
COOKIE_SECRET=92b77a06f3630f5b4e18378d3809e6fc0683a45657dfbcbbec8cbbbf37d825ae

# Object Storage (MinIO or AWS S3)
STORAGE_TYPE=s3
S3_BUCKET=gymos-production-media
S3_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Monitoring & Error Reporting
SENTRY_DSN=https://your-dsn@o0.ingest.sentry.io/0
LOG_LEVEL=info
```

---

## 3. Deployment Option A: Self-Hosted Docker Compose

This option runs the entire stack (MongoDB replica set, Redis, API, and Nginx Web) on a single or clustered Docker host.

### Step 1: Clone Repository & Setup Secrets
```bash
git clone https://github.com/techofay/gymos.git /opt/gymos
cd /opt/gymos
cp .env.example .env
# Edit .env with your production credentials
```

### Step 2: Build & Start Containers
```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Step 3: Verify Container Health
```bash
docker compose -f docker-compose.prod.yml ps
```
Both `gymos-prod-api` and `gymos-prod-web` should display `(healthy)`.

---

## 4. Deployment Option B: Hybrid Cloud (Atlas + Docker API + Vercel Web)

### Step 1: Database (MongoDB Atlas)
1. Deploy a MongoDB Atlas M10+ cluster in your primary AWS region (e.g., `ap-south-1` Mumbai).
2. Configure IP Access List to allow your API server IP address.
3. Retrieve the SRV connection string: `mongodb+srv://...`.

### Step 2: Backend API Container
1. Build the production Docker image using GitHub Actions CI/CD or locally:
   ```bash
   docker build -t ghcr.io/techofay/gymos-api:latest -f apps/api/Dockerfile .
   ```
2. Run on your container runtime (AWS ECS / Render / Fly.io / VPS) with environment variables injected.

### Step 3: Frontend Web SPA (Vercel / Netlify / Cloudflare Pages)
1. Link your repository to Vercel or Netlify.
2. Configure build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm --filter @gymos/shared build && pnpm --filter @gymos/web build`
   - **Output Directory**: `dist`
3. Environment variables:
   - `VITE_API_URL=https://api.gymos.techofay.com`

---

## 5. SSL / TLS & Reverse Proxy Setup (Nginx + Certbot)

For a VPS host running Nginx as the edge gateway:

```nginx
server {
    server_name app.gymos.techofay.com *.gymos.techofay.com;

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Obtain wildcard SSL certificate:
```bash
sudo certbot --nginx -d app.gymos.techofay.com -d *.gymos.techofay.com
```

---

## 6. Post-Deployment Verification

1. Health Check API:
   ```bash
   curl -I https://api.gymos.techofay.com/health
   # Expected: HTTP 200 OK
   ```
2. Readiness Check:
   ```bash
   curl https://api.gymos.techofay.com/ready
   # Expected: {"status":"ready","database":"connected","redis":"connected"}
   ```
3. Run Database Migrations & Seeds:
   ```bash
   pnpm --filter @gymos/api seed
   ```
