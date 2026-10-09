# GymOS — AI-Powered Multi-Tenant SaaS Gym Management Platform

> Enterprise-grade, multi-tenant gym and fitness management operating system built for high-throughput turnstile check-ins, race-safe class bookings, automated WhatsApp marketing, and AI-driven retention intelligence.

[![CI Acceptance Gate](https://github.com/techofay/gymos/actions/workflows/ci.yml/badge.svg)](https://github.com/techofay/gymos/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-%3E%3D9.0.0-orange.svg)](https://pnpm.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 1. Architectural Highlights

- **Multi-Tenant Cryptographic Isolation**: Tenant IDs are verified at the gateway and bound to Node's `AsyncLocalStorage`. Mongoose automatically enforces tenant boundaries on all reads, writes, and aggregations.
- **Race-Safe Concurrency**: Atomic conditional updates (`findOneAndUpdate`) guarantee zero overbooking during high-concurrency group fitness class booking stampedes.
- **Enterprise Security (OWASP Top 10 Hardened)**: Recursive NoSQL operator injection sanitizer (`$ne`, `$gt`, `$where`), mass assignment defenses, SSRF outbound guard, rate limiting, and SameSite HTTP-only cookies.
- **AI Analytics & Intelligence**: Dual-mode AI service with offline heuristic/statistical fallback and Claude Anthropic adapter for churn prediction, lead scoring, and natural language business intelligence.
- **Indian Gym Localization**: Strict integer paise currency convention (`100 paise = ₹1.00`), GST tax invoicing (CGST/SGST/IGST breakdown), and WhatsApp Business API integration.

---

## 2. Monorepo Structure

```text
techofay-gymos/
├── apps/
│   ├── api/             # Express.js REST API with Mongoose, Redis, Sentry & OpenAPI
│   └── web/             # Vite + React 18 SPA with Tailwind CSS, Lucide & Recharts
├── packages/
│   └── shared/          # Universal TypeScript types, Zod schemas, constants & enums
├── load-tests/          # k6 load testing scripts & Node.js concurrency benchmark
├── scripts/             # Backup/restore scripts, dead-link checker, placeholder validator
└── docs/                # Comprehensive engineering and operational documentation
    ├── SECURITY.md      # OWASP Top 10 evaluation & NoSQL injection mitigation
    ├── DEPLOYMENT.md    # Production deployment guide (Docker, Atlas, Nginx, Vercel)
    ├── API.md           # REST API manual with error codes & payload contracts
    ├── USER_GUIDE.md    # Role-by-role user manual (Super Admin to Gym Member)
    ├── RUNBOOK.md       # Operational runbook, disaster recovery & PITR instructions
    └── PROGRESS.md      # Detailed phase completion & verification ledger
```

---

## 3. Getting Started

### Prerequisites
- Node.js `>= 20.0.0`
- pnpm `>= 9.0.0`
- MongoDB 7.0+ (Replica Set enabled)
- Redis 7.0+

### Installation & Local Setup

```bash
# 1. Clone repository
git clone https://github.com/techofay/gymos.git
cd gymos

# 2. Install workspace dependencies
pnpm install

# 3. Start local development infrastructure (MongoDB replica set & Redis)
docker compose up -d

# 4. Copy environment variables
cp .env.example .env

# 5. Seed initial database with sample tenants, branches, and memberships
pnpm seed

# 6. Launch development servers (API on :5000, Web on :3000)
pnpm dev
```

---

## 4. Quality & Acceptance Gate Commands

```bash
# Code Style & Linting
pnpm lint
pnpm format:check

# Strict TypeScript Verification
pnpm typecheck

# Unit & Integration Tests (106 tests across 15 test suites)
pnpm test

# End-to-End Browser Tests (Playwright)
pnpm test:e2e

# Concurrency & Load Benchmark
pnpm test:load

# Production Build Monorepo
pnpm build

# Quality & Placeholder Audit
pnpm check:links
pnpm check:placeholders
```

---

## 5. System Roles & Capabilities

| Role | Access Level | Primary Features |
| :--- | :--- | :--- |
| **Super Admin** | Platform-Wide | Tenant onboarding, subscription tier limits, platform MRR, audited impersonation |
| **Gym Owner** | Organization | Multi-branch financials, AI churn intelligence, automated marketing, staff roles |
| **Branch Manager**| Branch | Daily floor operations, shift scheduling, expense tracking, local equipment |
| **Front Desk** | Reception Desk | Turnstile QR/RFID check-in, guest passes, walk-in CRM leads, POS receipt printing |
| **Trainer** | Fitness Floor | Workout plan builder, AI draft workout approvals, class rosters, member measurements |
| **Nutritionist** | Wellness Floor | Calorie & macro targets, customized meal planning, dietary compliance tracking |
| **Member** | Mobile PWA | Digital membership card, QR entry, class booking & waitlist, workout logger |

---

## 6. Documentation Index

- [Security Policy & OWASP Report](docs/SECURITY.md)
- [Production Deployment Guide](docs/DEPLOYMENT.md)
- [REST API Specification](docs/API.md)
- [User Guide per Role](docs/USER_GUIDE.md)
- [Operational Runbook & Disaster Recovery](docs/RUNBOOK.md)
- [Architecture & Phase Ledger](docs/PROGRESS.md)
