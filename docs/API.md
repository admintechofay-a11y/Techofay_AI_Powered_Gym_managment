# GymOS REST API Reference Manual

## 1. Overview & Protocol Standards

The GymOS API provides programmatic access to multi-tenant gym management, biometric attendance, AI analytics, billing, and member engagement features.

- **Base URL**: `https://api.gymos.techofay.com/api` (Production) | `http://localhost:5000/api` (Local Dev)
- **Interactive OpenAPI Documentation**: `http://localhost:5000/api/docs`
- **Data Format**: `application/json` (UTF-8)
- **Currency Convention**: All monetary amounts are handled strictly as integer paise (e.g. ₹5,000.00 = `500000`).

---

## 2. Authentication & Request Headers

Authentication is handled via short-lived JWT Access Tokens (15 min) and long-lived Refresh Tokens (7 days).

### Required Request Headers

```http
Authorization: Bearer <access_token>
X-Tenant-Id: <mongo_object_id>
X-Branch-Id: <mongo_object_id>
X-Tenant-Subdomain: <subdomain_slug>
X-Correlation-Id: <uuid_v4>
Content-Type: application/json
```

---

## 3. Standard Response Format

All responses conform to a unified JSON envelope:

### Success Response (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Resource created or retrieved successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8,
    "requestId": "req_8f1a23bc"
  }
}
```

### Error Response (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request input parameters",
    "details": {
      "email": ["Invalid email address format"]
    },
    "requestId": "req_8f1a23bc"
  }
}
```

---

## 4. Standard Error Codes

| Error Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Zod schema validation failed for body/query params |
| `INVALID_INPUT_OPERATOR` | 400 | NoSQL operator injection attempt blocked ($ne, $gt, etc.) |
| `INVALID_TOKEN` | 401 | Missing, malformed, or expired JWT access token |
| `UNAUTHORIZED` | 401 | Invalid login credentials or session terminated |
| `FORBIDDEN` | 403 | RBAC role insufficient to execute requested operation |
| `TENANT_ISOLATION_ERROR` | 403 | Missing or mismatched tenant execution context |
| `ROUTE_NOT_FOUND` | 404 | The requested endpoint does not exist |
| `DUPLICATE_RESOURCE` | 409 | Unique constraint conflict (e.g. email or phone exists) |
| `RATE_LIMIT_EXCEEDED` | 429 | Exceeded 500 requests per 15-minute sliding window |
| `AUTH_RATE_LIMIT_EXCEEDED`| 429 | Exceeded 30 login attempts per 15-minute sliding window |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server error (reported to Sentry) |

---

## 5. Core API Endpoints

### 5.1 Authentication (`/api/auth`)
- `POST /api/auth/register` - Create new gym organization and initial owner account
- `POST /api/auth/login` - Authenticate with email and password
- `POST /api/auth/refresh` - Rotate access token using HTTP-only cookie
- `POST /api/auth/logout` - Invalidate session and clear auth cookies
- `GET /api/auth/me` - Retrieve current authenticated user profile and tenant metadata

### 5.2 Members (`/api/members`)
- `GET /api/members` - List paginated members with search, branch, and status filters
- `POST /api/members` - Register a new member with membership plan assignment
- `GET /api/members/:id` - Fetch comprehensive member profile including attendance history
- `PATCH /api/members/:id` - Update member demographic details (sanitized against mass assignment)
- `DELETE /api/members/:id` - Soft-delete or archive member record

### 5.3 Attendance (`/api/attendance`)
- `POST /api/attendance/check-in` - Record turnstile QR or RFID scan check-in
- `GET /api/attendance/logs` - Fetch branch attendance timeline with date range filtering
- `GET /api/attendance/stats` - Daily, weekly, and peak-hour density metrics

### 5.4 Classes & Bookings (`/api/classes`, `/api/booking`)
- `GET /api/classes` - List active group fitness classes and schedules
- `POST /api/classes/:id/book` - Race-safe slot booking with atomic waitlist management
- `POST /api/bookings/:id/cancel` - Cancel booking and auto-promote top waitlisted member
- `GET /api/bookings/calendar` - Unified calendar schedule view

### 5.5 Billing & Payments (`/api/billing`)
- `POST /api/billing/invoices` - Generate tax invoice with GST breakdown
- `POST /api/billing/payments` - Process offline or online payment with idempotency key
- `GET /api/billing/invoices/:id/pdf` - Download branded PDF invoice

### 5.6 AI & Analytics (`/api/ai`, `/api/analytics`)
- `GET /api/ai/churn-risk` - Predict at-risk members with retention suggestions
- `POST /api/ai/report-query` - Natural language query to parameterised tenant metric aggregation
- `GET /api/analytics/financial-summary` - MRR, ARR, branch comparisons, and collection ratios

### 5.7 Super Admin Platform (`/api/super-admin`)
- `GET /api/super-admin/tenants` - Platform-wide tenant directory and health status
- `POST /api/super-admin/tenants/:id/suspend` - Suspend or reactivate tenant
- `POST /api/super-admin/impersonate` - Generate temporary impersonation token with audit trail
- `GET /api/super-admin/revenue` - Platform SaaS subscription revenue and tier metrics

### 5.8 Public & Member PWA (`/api/public`, `/api/member-pwa`)
- `GET /api/public/landing/:subdomain` - Fetch gym branding, hero copy, and pricing plans
- `POST /api/public/lead` - Capture prospective member leads from public web landing
- `GET /api/member-pwa/dashboard` - Member mobile portal with digital membership card and workouts
