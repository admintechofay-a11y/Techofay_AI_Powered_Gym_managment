# Techofay GymOS - Database Architecture & Schema Documentation

Techofay GymOS is built on a multi-tenant MongoDB architecture utilizing a single-node replica set to support multi-document ACID transactions across billing, memberships, counters, and payments.

All financial amounts are stored as integer **paise** (1 INR = 100 paise) to prevent floating-point rounding errors. All dates are recorded in **UTC** and presented in Indian Standard Time (IST) on client applications.

---

## 1. Entity Relationship & Collections Diagram

```mermaid
erDiagram
    TENANT ||--o{ BRANCH : "has many"
    TENANT ||--o{ USER : "has many"
    TENANT ||--o{ ROLE : "has many"
    TENANT ||--o{ MEMBER : "owns"
    TENANT ||--o{ PLAN : "configures"
    TENANT ||--o{ INVOICE : "bills"
    TENANT ||--o{ AUDIT_LOG : "records"
    
    BRANCH ||--o{ MEMBER : "enrolled in"
    BRANCH ||--o{ CLASS : "conducts"
    BRANCH ||--o{ ATTENDANCE : "logs"
    BRANCH ||--o{ INVENTORY : "stores"
    BRANCH ||--o{ EXPENSE : "incurs"

    MEMBER ||--o{ MEMBERSHIP : "holds"
    MEMBER ||--o{ ATTENDANCE : "records"
    MEMBER ||--o{ INVOICE : "billed to"
    MEMBER ||--o{ BOOKING : "reserves"
    MEMBER ||--o{ ASSESSMENT : "evaluates"
    MEMBER ||--o{ WORKOUT_PLAN : "assigned"
    MEMBER ||--o{ NUTRITION : "prescribed"
    MEMBER ||--o{ WALLET : "maintains"

    PLAN ||--o{ MEMBERSHIP : "instantiates"
    MEMBERSHIP ||--o{ FREEZE : "paused by"
    MEMBERSHIP ||--o{ INVOICE : "generates"

    INVOICE ||--o{ PAYMENT : "settled with"
    PAYMENT ||--o{ REFUND : "reversed by"

    LEAD ||--o{ LEAD_ACTIVITY : "engages"
    LEAD ||--o{ TRIAL : "books"
    LEAD ||--o| MEMBER : "converts to"

    TRAINER ||--o{ CLASS : "leads"
    TRAINER ||--o{ WORKOUT_PLAN : "designs"
    TRAINER ||--o{ COMMISSION : "earns"
```

---

## 2. Comprehensive Collection Index Reference

| Collection | Model Name | Primary Indexes & Compound Keys | Isolation & Constraints |
| :--- | :--- | :--- | :--- |
| `tenants` | `Tenant` | `subdomain` (Unique), `status, createdAt` | Root organization table |
| `branches` | `Branch` | `{ tenantId: 1, code: 1 }` (Unique), `{ tenantId: 1, city: 1 }` | Scoped by tenant |
| `users` | `User` | `{ tenantId: 1, email: 1 }` (Unique), `{ tenantId: 1, role: 1 }`, `{ tenantId: 1, phone: 1 }` | Scoped by tenant |
| `roles` | `Role` | `{ tenantId: 1, code: 1 }` (Unique) | Configurable per tenant |
| `permissions` | `Permission` | `{ tenantId: 1, module: 1, action: 1 }` (Unique) | System / custom |
| `members` | `Member` | `{ tenantId: 1, memberCode: 1 }` (Unique), `{ tenantId: 1, phone: 1 }` (Unique), `{ tenantId: 1, status: 1 }` | Soft delete (`isDeleted`) |
| `plans` | `Plan` | `{ tenantId: 1, code: 1 }` (Unique), `{ tenantId: 1, isActive: 1 }` | Integer paise pricing |
| `memberships` | `Membership` | `{ tenantId: 1, memberId: 1, status: 1 }`, `{ tenantId: 1, endDate: 1 }` | State lifecycle |
| `freezes` | `Freeze` | `{ tenantId: 1, membershipId: 1, status: 1 }` | Extension dates |
| `attendance` | `Attendance` | `{ tenantId: 1, branchId: 1, checkInTime: -1 }`, `{ tenantId: 1, memberId: 1, checkInTime: -1 }` | Fast timeline lookups |
| `invoices` | `Invoice` | `{ tenantId: 1, invoiceNumber: 1 }` (Unique), `{ tenantId: 1, financialYear: 1 }`, `{ tenantId: 1, status: 1, dueDate: 1 }` | Snapshot isolation |
| `payments` | `Payment` | `{ tenantId: 1, paymentNumber: 1 }` (Unique), `{ tenantId: 1, idempotencyKey: 1 }` (Unique), `{ tenantId: 1, invoiceId: 1 }` | Idempotent |
| `refunds` | `Refund` | `{ tenantId: 1, paymentId: 1 }`, `{ tenantId: 1, status: 1 }` | Audit tracked |
| `coupons` | `Coupon` | `{ tenantId: 1, code: 1 }` (Unique) | Discount logic |
| `leads` | `Lead` | `{ tenantId: 1, phone: 1 }`, `{ tenantId: 1, pipelineStatus: 1 }`, `{ tenantId: 1, branchId: 1, createdAt: -1 }` | CRM Pipeline |
| `lead_activities`| `LeadActivity`| `{ tenantId: 1, leadId: 1, createdAt: -1 }` | Timeline |
| `trials` | `Trial` | `{ tenantId: 1, branchId: 1, slotTime: 1 }` | Slot booking |
| `bookings` | `Booking` | `{ tenantId: 1, classId: 1, slotTime: 1, memberId: 1 }`, `{ tenantId: 1, memberId: 1, status: 1 }` | Capacity guard |
| `classes` | `Class` | `{ tenantId: 1, branchId: 1, isActive: 1 }` | Schedule |
| `trainers` | `Trainer` | `{ tenantId: 1, userId: 1 }` (Unique) | Availability |
| `pt_packages` | `PtPackage` | `{ tenantId: 1, name: 1 }` (Unique) | Package sales |
| `exercises` | `Exercise` | `{ tenantId: 1, name: 1 }` (Unique), `{ tenantId: 1, targetMuscleGroup: 1 }` | Muscle targeting |
| `workout_plans`| `WorkoutPlan`| `{ tenantId: 1, memberId: 1, isActive: 1 }` | Member schedule |
| `nutrition` | `Nutrition` | `{ tenantId: 1, memberId: 1, isActive: 1 }` | Diet planning |
| `foods` | `Food` | `{ tenantId: 1, name: 1 }` (Unique) | Calorie database |
| `assessments` | `Assessment` | `{ tenantId: 1, memberId: 1, date: -1 }` | Body composition |
| `notifications`| `Notification`| `{ tenantId: 1, userId: 1, isRead: 1 }`, `{ tenantId: 1, memberId: 1, isRead: 1 }` | Multi-channel |
| `templates` | `Template` | `{ tenantId: 1, name: 1 }` (Unique) | Template engine |
| `campaigns` | `Campaign` | `{ tenantId: 1, status: 1 }` | Marketing runs |
| `segments` | `Segment` | `{ tenantId: 1, name: 1 }` (Unique) | Audience rules |
| `expenses` | `Expense` | `{ tenantId: 1, branchId: 1, date: -1 }`, `{ tenantId: 1, category: 1 }` | Accounting |
| `inventory` | `Inventory` | `{ tenantId: 1, sku: 1 }` (Unique), `{ tenantId: 1, isLowStock: 1 }` | Stock alert |
| `suppliers` | `Supplier` | `{ tenantId: 1, name: 1 }` (Unique) | Vendor directory |
| `staff` | `Staff` | `{ tenantId: 1, userId: 1 }` (Unique) | HR / Payroll |
| `commissions` | `Commission` | `{ tenantId: 1, staffId: 1, periodMonthYear: 1 }` | Trainer earnings |
| `tickets` | `Ticket` | `{ tenantId: 1, status: 1, createdAt: -1 }` | Support desk |
| `subscriptions`| `Subscription`| `{ tenantId: 1, status: 1 }` | SaaS tier limits |
| `feature_flags`| `FeatureFlag` | `{ tenantId: 1, key: 1 }` (Unique) | Gradual rollout |
| `audit_logs` | `AuditLog` | `{ tenantId: 1, entity: 1, entityId: 1 }`, `{ tenantId: 1, timestamp: -1 }` | Immutable ledger |
| `login_history`| `LoginHistory`| `{ tenantId: 1, email: 1, timestamp: -1 }` | Security audit |
| `consents` | `Consent` | `{ tenantId: 1, memberId: 1, consentType: 1 }` | DPDP Act compliance |
| `lockers` | `Locker` | `{ tenantId: 1, branchId: 1, lockerNumber: 1 }` (Unique) | Facility asset |
| `waivers` | `Waiver` | `{ tenantId: 1, memberId: 1 }` | Legal records |
| `referrals` | `Referral` | `{ tenantId: 1, referrerMemberId: 1 }` | Growth rewards |
| `wallets` | `Wallet` | `{ tenantId: 1, memberId: 1 }` (Unique) | Ledger transactions |
| `reviews` | `Review` | `{ tenantId: 1, branchId: 1, rating: -1 }` | Ratings & sentiment |
| `counters` | `Counter` | `{ tenantId: 1, key: 1, financialYear: 1 }` (Unique) | Atomic gapless numbers |
| `idempotency_keys` | `IdempotencyKey` | `{ tenantId: 1, key: 1 }` (Unique), `{ expiresAt: 1 }` (TTL Index) | Duplicate payment safety |
