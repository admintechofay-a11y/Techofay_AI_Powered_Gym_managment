# Techofay GymOS - Phase 2: Core Management Architecture & Technical Reference

## Executive Summary
Phase 2 transitions Techofay GymOS from foundational multi-tenant infrastructure into an active, operational gym operating system. This phase delivers high-precision membership lifecycle operations, automated turnstile hardware integration, Indian GST tax invoicing in integer paise with financial year sequencing, and a comprehensive 200-member operational seed dataset.

---

## 1. Domain Modules & Capabilities

### 1.1 Members Module (`/api/v1/members`)
- **Atomic Member Code Sequence:** Generates unique, immutable codes per financial year (`MEM-2026-27-0001`) backed by MongoDB atomic `$inc` counters.
- **Biometric & Photographic Verification:** WebRTC live camera capture for front-desk photo registration with instant local data URI or MinIO S3 object storage upload.
- **PAR-Q & Liability E-Sign:** Embedded Physical Activity Readiness Questionnaire (PAR-Q) with digital legal signature, IP tracking, and audit timestamp recording.
- **Document & Medical Vault:** Secure storage for government IDs (Aadhaar, PAN), medical clearance notes, and emergency contact registries.
- **Member 360 History Drawer:** Unified audit viewer across 4 core tabs:
  1. *Memberships:* Active, frozen, expired, and pending plans.
  2. *Invoices & Settlements:* Gapless invoices, payment transactions, and remaining dues.
  3. *Attendance:* Historical punch records, check-in devices, and stay duration.
  4. *Documents & Waivers:* Signed liability contracts and verified identity cards.
- **Bulk CSV Importer:** Streaming CSV parser with row-by-row validation report, pre-flight error rejection, and duplicate detection by phone or email.

### 1.2 Membership Lifecycle Engine (`/api/v1/memberships`)
- **Supported Plan Tiers:** Single, Couple, Family, Corporate, Off-Peak, Custom, and Trial durations (Monthly, Quarterly, Half-Yearly, Annual).
- **Calendar Date Arithmetic:**
  - Robust handling of calendar month boundaries (e.g., Jan 31 + 1 month = Feb 28/29).
  - Leap year awareness for 365/366-day calculations.
  - Daylight savings and timezone immunity using strict UTC midnight timestamps.
- **Freeze & Extension Engine:**
  - Dynamic end-date calculation shifting membership expiration by the exact count of frozen days upon unfreeze.
  - Enforcement of maximum allowed freeze days per plan tier.
- **Prorated Upgrades & Downgrades:**
  - Strictly integer paise mathematical proration:
    $$\text{Unused Value} = \text{round}\left(\text{Original Price} \times \frac{\text{Remaining Days}}{\text{Total Days}}\right)$$
  - Unused value credited toward higher plan cost, generating adjustment invoices with zero floating-point drift.
- **Automated Midnight Expiry Job:**
  - Scheduled batch evaluation identifying memberships reaching `endDate < today`.
  - Transitions membership status to `EXPIRED` and dispatches renewal reminders.

### 1.3 Turnstile Hardware Gate & Attendance (`/api/v1/attendance`)
- **Access Verification Gate Rules:**
  - Instant access denial for non-active statuses (`EXPIRED`, `FROZEN`, `SUSPENDED`, `CANCELLED`) with explicit failure diagnostic codes.
  - Anti-passback duplicate protection: Denies subsequent punches within 5 minutes of a verified check-in.
- **IoT / RFID / Biometric Endpoint:**
  - Accepts device scans via QR code, RFID tag UID, member code, or registered phone number.
  - Simulator test bench with interactive turnstile visual LED pulses (Green: Access Granted, Red: Access Denied).
- **Live Floor Capacity Tracking:**
  - Real-time gauge calculating active presence on the gym floor (`checkInTime` present, `checkOutTime` null).
  - Automated checkout capability for end-of-day reconciliation.

### 1.4 GST Invoicing & Financial Settlement (`/api/v1/billing`)
- **Indian Tax Computation (SAC Code 999723):**
  - Intra-State Transactions (Gym state equals billing state): CGST 9% + SGST 9%.
  - Inter-State Transactions (Gym state differs from billing state): IGST 18%.
  - All calculations stored as integer paise to prevent fractional rupee rounding issues.
- **Gapless Sequence Invoicing:**
  - Statutory compliance with Indian Goods and Services Tax guidelines using sequence format: `INV-2026-27-0001`.
- **Payment Settlements:**
  - Support for Cash, UPI, Card, Net Banking, and Bank Transfer.
  - Partial payments with dynamic balance due calculations.
  - Credit note generation for refunds and adjustments.
- **ACID Transaction Resilience:**
  - Full multi-document ACID transactions executed on MongoDB replica sets (`rs0`).
  - Resilient single-node fallback mode for development and CI testing environments.
- **Idempotency Guard:**
  - Replay protection with client-supplied `Idempotency-Key` headers stored with SHA-256 request payload hashes.

---

## 2. API Route Catalog

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/members` | List members with search, filter, and pagination | Staff, Manager, Owner |
| `POST` | `/api/v1/members` | Register member with atomic counter and waiver | Front Desk, Manager, Owner |
| `GET` | `/api/v1/members/:id/history` | Full 360-degree member audit history | Front Desk, Trainer, Owner |
| `POST` | `/api/v1/members/import` | Bulk CSV import with validation error report | Manager, Owner |
| `POST` | `/api/v1/memberships/buy` | Purchase and activate membership plan | Front Desk, Manager, Owner |
| `POST` | `/api/v1/memberships/:id/freeze` | Freeze membership with date hold | Front Desk, Manager, Owner |
| `POST` | `/api/v1/memberships/:id/unfreeze` | Unfreeze and extend expiration date | Front Desk, Manager, Owner |
| `POST` | `/api/v1/memberships/:id/upgrade` | Prorated plan upgrade with credit calculation | Front Desk, Manager, Owner |
| `POST` | `/api/v1/attendance/check-in` | Member check-in with gate rule verification | All Staff Roles |
| `POST` | `/api/v1/attendance/check-out` | Manual or auto checkout | All Staff Roles |
| `GET` | `/api/v1/attendance/live-capacity` | Live gym floor count and active occupants | All Staff Roles |
| `POST` | `/api/v1/attendance/hardware-punch` | Biometric/RFID turnstile simulator endpoint | Device API Key / Staff |
| `POST` | `/api/v1/billing/invoices` | Generate GST tax invoice with sequence | Front Desk, Manager, Owner |
| `POST` | `/api/v1/billing/invoices/:id/pay` | Record partial or full payment settlement | Front Desk, Manager, Owner |
| `GET` | `/api/v1/billing/invoices/:id/print` | Render printable HTML tax invoice | Front Desk, Manager, Owner |
| `GET` | `/api/v1/operations/dashboard-kpis` | Real-time owner KPIs and revenue analytics | Manager, Owner |
| `GET` | `/api/v1/operations/lockers` | Locker allocation and status overview | Front Desk, Manager, Owner |

---

## 3. Seed Dataset Verification

The enhanced seed script (`pnpm seed`) creates a fully operational multi-branch ecosystem:
- **Tenants:**
  - *IronPulse Fitness Club* (Mumbai, Maharashtra, GSTIN: `27AABCI1234F1Z1`)
  - *PowerFit Wellness Studio* (Bengaluru, Karnataka, GSTIN: `29AABCP5678G1Z2`)
- **Branches:**
  - Bandra West Flagship (Mumbai) - 1,200 member capacity
  - Andheri East Studio (Mumbai) - 600 member capacity
  - Indiranagar Flagship (Bengaluru) - 800 member capacity
- **Members & Data Records:**
  - 200 realistic members with complete Indian demographic profiles and phone numbers.
  - Active, Expired, Frozen, and Suspended memberships across all plan tiers.
  - 20 currently active check-ins on gym floor for real-time turnstile demonstration.
  - 20 smart lockers assigned with access codes.
  - Full invoices and payments recorded in integer paise.

---

## 4. Verification & Test Metrics

- **Unit & Integration Test Suites:** 8 passed, 8 total
- **Total Test Cases:** 42 passed, 42 total
  - `membership-date-math.test.ts` (10 tests): Leap years, month boundaries, freeze day extensions, integer proration.
  - `attendance-blocking.test.ts` (8 tests): Gate denial rules, anti-passback cooldown, live capacity.
  - `membership-lifecycle.test.ts` (8 tests): Plan purchase, freeze, unfreeze extension, midnight expiry batch.
  - `billing-acid.test.ts` (8 tests): CGST/SGST/IGST splits, sequence numbers, partial settlements, idempotency replay.
  - `rbac.test.ts` (4 tests): Role authorization and permission matrices.
  - `auth.test.ts` (2 tests): Argon2id hashing and account lockout protection.
  - `tenant-isolation.test.ts` (1 test): Multi-tenant query isolation and leak prevention.
  - `integrations.test.ts` (1 test): Dual-mode adapter fallback execution.
