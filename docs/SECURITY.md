# GymOS Security Architecture & OWASP Top 10 Audit Report

## 1. Executive Summary

GymOS is built from the ground up for strict multi-tenant isolation, enterprise-grade access control, and defense-in-depth security. This document details the security posture, vulnerability mitigations, architectural safeguards, and incident response procedures implemented across the platform.

---

## 2. OWASP Top 10 & Threat Mitigation Matrix

| OWASP Vulnerability | Risk Category | GymOS Architectural Defense | Implementation Reference |
| :--- | :--- | :--- | :--- |
| **A01: Broken Access Control** | High | Cryptographic tenant isolation enforced via `AsyncLocalStorage` and MongoDB query filtering. Multi-tier RBAC (`SUPER_ADMIN`, `GYM_OWNER`, `BRANCH_MANAGER`, `STAFF`, `TRAINER`, `NUTRITIONIST`, `MEMBER`). Cross-tenant access attempts immediately yield HTTP 403. | `requestContextGuard.ts`, `tenantIsolationPlugin.ts` |
| **A02: Cryptographic Failures** | High | Argon2id for password hashing with high work factors. AES-256-GCM encryption for stored API keys (WhatsApp tokens, biometric secrets). HTTPS required in production with HSTS. | `password.ts`, `crypto.ts` |
| **A03: Injection (NoSQL / SQL)** | Critical | Recursive sanitization middleware stripping all MongoDB query operators (`$ne`, `$gt`, `$gte`, `$where`, `$regex`, `$options`) from query strings, route params, and request bodies. Parameterized Mongoose queries; zero raw string concatenation. | `sanitizeInput.ts`, `noSqlSanitizer` |
| **A04: Insecure Design** | Medium | Negative permission defaults, rate-limiting on sensitive endpoints, audit logging for all mutations, idempotency keys for billing and financial operations. | `auditLogger.ts`, `billingService.ts` |
| **A05: Security Misconfiguration**| Medium | Multi-stage Docker builds running as non-root unprivileged `node` user. Helmet HTTP security headers enabled (HSTS, X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff). | `Dockerfile`, `app.ts` |
| **A06: Vulnerable Components** | Medium | Pinned dependency tree managed via `pnpm-lock.yaml`. Regular automated audits via `pnpm audit`. Minimum Node 20 LTS runtime. | `package.json`, CI pipeline |
| **A07: Identification & Auth Failures** | High | Brute-force mitigation with sliding window rate limiting (30 attempts / 15 min). Signed HTTP-only, secure, SameSite cookies for refresh tokens. Time-based One-Time Password (TOTP) 2FA support. | `rateLimiter.ts`, `authService.ts` |
| **A08: Software & Data Integrity**| Medium | Strict Zod input validation schemas rejecting unwhitelisted mass-assignment fields. Webhook HMAC-SHA256 signature verification for Razorpay and WhatsApp. | `webhookGuard.ts`, `@gymos/shared` |
| **A09: Logging & Monitoring Failures** | Medium | Structured JSON logging with Correlation IDs (`X-Correlation-Id`), audit trails for all tenant modifications, automated exception reporting via Sentry. | `requestContextGuard.ts`, `sentry.ts` |
| **A10: Server-Side Request Forgery (SSRF)** | High | Strict outbound URL validation (`ssrfGuard`) blocking loopback addresses (`127.0.0.1`, `localhost`), cloud metadata services (`169.254.169.254`), and RFC1918 private subnets. | `ssrfGuard.ts` |

---

## 3. Deep Dive: NoSQL Operator Injection Hardening

### Threat Model
In MongoDB and Mongoose applications, unsanitized inputs containing JSON objects such as `{"email": {"$ne": null}}` can bypass authentication or extract unauthorized records if passed directly into query functions.

### GymOS Defense
1. **Global Request Interception**:
   The `noSqlSanitizer` middleware runs before all route handlers and inspects `req.body`, `req.query`, and `req.params`.
2. **Recursive Traversal**:
   Any key prefixed with `$` or containing `.` (dot notation property pollution) triggers immediate request termination with HTTP 400 and code `INVALID_INPUT_OPERATOR`.
3. **Strict Schema Parsing**:
   Zod schemas explicitly type all incoming fields as strings or primitives; object inputs attempting operator injection fail validation before Mongoose query execution.

---

## 4. Multi-Tenant Cryptographic Isolation

Tenant isolation in GymOS is non-bypassable:
- **AsyncLocalStorage Context**: Every authenticated request binds `{ tenantId, userId, role, isSuperAdmin }` to Node's asynchronous execution context.
- **Mongoose Query Middleware**: The `tenantIsolationPlugin` automatically merges `{ tenantId: context.tenantId }` into all `find`, `findOne`, `countDocuments`, `update`, and `delete` queries.
- **Fail-Closed Policy**: If a non-super-admin request executes a query without an established tenant context, the plugin throws a fatal `Tenant context missing` exception, halting query execution.

---

## 5. Mass Assignment Protection

GymOS prevents privilege escalation via mass assignment:
- User registration and profile updates accept only explicitly defined Zod schema properties.
- Sensitive fields such as `role`, `isSuperAdmin`, `tenantId`, `tier`, and `status` are stripped or rejected upon submission.
- Role transitions can only be performed by authorized administrators via dedicated, audit-logged endpoints.

---

## 6. Rate Limiting & Denial of Service (DoS)

- **Standard API Endpoints**: 500 requests per 15-minute sliding window per client IP.
- **Authentication Routes (`/api/auth/login`)**: 30 attempts per 15-minute sliding window to mitigate password dictionary and credential stuffing attacks.
- **Health Checks & Probes**: Excluded from rate limits to prevent orchestrator false-positives.

---

## 7. File Upload Hardening

- Maximum upload size restricted to 10MB.
- Content-type validation against approved MIME types (JPEG, PNG, WebP, PDF).
- File storage uses randomized UUID filenames to prevent path traversal or file overwrites.
- Serving uploaded files bypasses executable execution permissions.

---

## 8. Continuous Security & Secret Scanning

- Run dependency vulnerability scan:
  ```bash
  pnpm audit --audit-level=high
  ```
- Run placeholder and credential leak check:
  ```bash
  pnpm check:placeholders
  ```

---

## 9. Responsible Disclosure

To report a suspected security vulnerability in GymOS, please contact security@techofay.com. We acknowledge receipt within 24 hours and provide an remediation timeline based on CVSS severity.
