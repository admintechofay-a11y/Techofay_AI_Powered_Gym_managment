# GymOS User Guide (Role-by-Role Operations)

Welcome to the GymOS User Guide. This manual explains workflows and interfaces customized for each organizational role in the platform.

---

## 1. Role: Super Admin (Platform Operator)

### Core Responsibilities
- Manage multi-tenant lifecycle across all customer gyms
- Monitor SaaS platform revenue, tier limits, and system health
- Provide tier-3 customer support via tenant impersonation

### Key Workflows
1. **Tenant Onboarding**:
   - Navigate to `/super-admin/tenants`.
   - Click **Onboard New Tenant**. Fill in gym name, desired subdomain slug, primary owner email, and subscription plan (Starter, Professional, Enterprise).
2. **Subscription Tier Enforcement**:
   - Gym limits (members count, branches, AI queries) are automatically throttled when quotas are reached.
   - Adjust tier or quota overrides directly in the tenant details pane.
3. **Audited Impersonation**:
   - Click **Impersonate** next to any tenant to diagnose issues from the owner's perspective.
   - An immutable record is created in the global audit trail recording timestamp, admin ID, and reason.

---

## 2. Role: Gym Owner / General Manager

### Core Responsibilities
- Multi-branch oversight, financial health, AI analytics, and marketing automation
- Staff hiring and branch assignment

### Key Workflows
1. **Executive Dashboard**:
   - Access real-time revenue, active memberships, churn forecast, and live floor occupancy across all gym branches.
2. **AI Churn Prevention**:
   - Review the **At-Risk Members** tab on the AI Analytics page.
   - Click **Send Retention Offer** to trigger personalized WhatsApp messages with 1-click renewal links.
3. **Natural Language Reports**:
   - Open **AI Business Assistant**.
   - Type queries such as: `"What was our revenue by branch this quarter?"` or `"Which membership tier had the highest renewal rate?"`
   - Review parameterised aggregates with zero manual spreadsheet exporting.

---

## 3. Role: Front Desk & Reception Staff

### Core Responsibilities
- Fast member check-in processing, walk-in inquiries, membership renewals, and POS retail transactions

### Key Workflows
1. **Turnstile QR Check-in**:
   - Navigate to `/attendance`.
   - Scan the member's digital QR code using the webcam or barcode scanner.
   - The screen instantly indicates access status (Green: Valid, Yellow: Dues Pending, Red: Membership Expired).
2. **Registering a Walk-in Lead**:
   - Open `/crm`. Click **New Lead**.
   - Input name, phone number, and fitness goal. Assign initial lead source (e.g. Walk-in, Referral).
3. **Collecting Fees & Generating Invoices**:
   - Go to member profile -> **Billing**.
   - Click **Record Payment**. Select payment mode (UPI, Card, Cash).
   - Enter payment amount and click **Print GST Invoice** to issue receipt.

---

## 4. Role: Personal Trainer

### Core Responsibilities
- Conduct fitness assessments, build structured workout regimens, track client adherence, and lead group fitness classes

### Key Workflows
1. **Workout Plan Creator**:
   - Go to `/fitness/workouts`. Select assigned member.
   - Select exercises from the exercise library, configuring sets, reps, and rest periods.
   - Submit plan. Status transitions to `ACTIVE` for the assigned member.
2. **Reviewing AI-Generated Regimens**:
   - AI-recommended workout routines appear in `DRAFT` status under **Pending Reviews**.
   - Review exercise selection, adjust weights or volume, and click **Approve** to publish to member's mobile view.
3. **Class Roster & Attendance**:
   - Open `/classes`. View registered members and waitlisted participants for upcoming HIIT or Yoga slots.

---

## 5. Role: Nutritionist & Dietitian

### Core Responsibilities
- Design calorie and macronutrient meal plans, conduct dietary consultations, and review client food logs

### Key Workflows
1. **Meal Plan Builder**:
   - Navigate to `/fitness/nutrition`. Select client profile.
   - Configure total daily caloric target and macronutrient split (Protein %, Carbs %, Fats %).
   - Add meal schedule (Breakfast, Lunch, Pre-Workout, Dinner).
2. **Hydration & Calorie Tracking**:
   - Review weekly compliance charts submitted via the member PWA.

---

## 6. Role: Gym Member (Mobile PWA)

### Core Responsibilities
- Check-in to gym, book fitness classes, follow daily workout plans, track weights, and pay renewals

### Key Workflows
1. **Digital Access Card**:
   - Open GymOS mobile web app on smartphone and add to Home Screen.
   - Present the dynamic check-in QR code at the turnstile gate.
2. **Booking Class Slots**:
   - Tap **Classes**. Browse schedule for today and tomorrow.
   - Tap **Book Slot**. If class is full, automatically join the waitlist with real-time position display.
3. **Workout Logger**:
   - Tap **Today's Workout**.
   - Check off completed sets, enter weights lifted, and record rest times.
