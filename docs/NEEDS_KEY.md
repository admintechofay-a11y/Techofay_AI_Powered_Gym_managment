# Techofay GymOS - Integration Keys & Production Credentials (NEEDS KEY)

This document catalogs all third-party integrations, external provider accounts, API keys, and environment variables required to transition each adapter from **Demo / Mock Mode** to **Real Production Mode**.

Each adapter operates in **Demo Mode** by default when credentials are absent, providing realistic test payloads and simulating real-world network responses.

---

## 1. Payment Gateway (Razorpay India)
- **Adapter Path:** `apps/api/src/integrations/adapters/RazorpayPaymentAdapter.ts`
- **Current Mode:** Mock Mode (`MockPaymentAdapter.ts`)
- **Portal to Obtain Keys:** [Razorpay Dashboard > Settings > API Keys](https://dashboard.razorpay.com/#/access/api-keys)
- **Required Environment Variables:**
  ```env
  PAYMENT_ADAPTER=real
  RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
  RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
  RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
  ```
- **Webhook Events to Subscribe:**
  - `order.paid`
  - `payment.captured`
  - `payment.failed`
  - `refund.processed`

---

## 2. WhatsApp Business API (Meta Cloud API)
- **Adapter Path:** `apps/api/src/integrations/adapters/WhatsAppAdapter.ts`
- **Current Mode:** Mock Mode (`MockWhatsAppAdapter.ts`)
- **Portal to Obtain Keys:** [Meta for Developers > WhatsApp > API Setup](https://developers.facebook.com/apps/)
- **Required Environment Variables:**
  ```env
  WHATSAPP_ADAPTER=real
  WHATSAPP_PHONE_NUMBER_ID=109283746501928
  WHATSAPP_ACCESS_TOKEN=EAABxxxxxxxxxxxxxxxxxxxxxxxxx
  WHATSAPP_WEBHOOK_VERIFY_TOKEN=gymos_wa_secret_verify_token_2026
  ```
- **Approved HSM Templates Needed:**
  - `member_welcome_card` (Member ID, Branch, Access QR Link)
  - `renewal_reminder_7d` (Days remaining, UPI payment link)
  - `payment_receipt` (Invoice number, amount in INR, PDF download link)
  - `birthday_congratulations` (Complimentary personal training session coupon)

---

## 3. Transactional SMS Gateway (Fast2SMS / Twilio)
- **Adapter Path:** `apps/api/src/integrations/adapters/SmsAdapter.ts`
- **Current Mode:** Mock Mode (`MockSmsAdapter.ts`)
- **Portal to Obtain Keys:** [Fast2SMS Console](https://www.fast2sms.com/dashboard) or [Twilio Console](https://console.twilio.com/)
- **DLT Entity Registration:** Telecom Regulatory Authority of India (TRAI) Principal Entity ID and DLT Header required for India delivery.
- **Required Environment Variables:**
  ```env
  SMS_ADAPTER=real
  FAST2SMS_API_KEY=f2s_live_xxxxxxxxxxxxxxxxxxxxxxxxxx
  # Or Twilio:
  TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_FROM_NUMBER=+1234567890
  ```

---

## 4. AI & Intelligence (Anthropic Claude 3.5 Sonnet)
- **Adapter Path:** `apps/api/src/integrations/adapters/AiAdapter.ts`
- **Current Mode:** Mock Mode (`MockAiAdapter.ts`)
- **Portal to Obtain Keys:** [Anthropic Console > API Keys](https://console.anthropic.com/settings/keys)
- **Required Environment Variables:**
  ```env
  AI_ADAPTER=real
  ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxx
  ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
  ```
- **Capabilities Powered:**
  - Dynamic walk-in lead conversion likelihood scoring (0-100)
  - Member workout plan generation based on fitness assessments and injury history
  - Churn risk detection alerting gym owners to drop-offs in weekly attendance

---

## 5. Object Storage Vault (MinIO S3 / AWS S3)
- **Adapter Path:** `apps/api/src/integrations/adapters/StorageAdapter.ts`
- **Current Mode:** Real MinIO S3 (Included in `docker-compose.yml`)
- **Production AWS S3 (Optional Alternative):**
  ```env
  STORAGE_ADAPTER=real
  S3_ENDPOINT=https://s3.ap-south-1.amazonaws.com
  S3_REGION=ap-south-1
  S3_ACCESS_KEY=AKIAxxxxxxxxxxxxxxxx
  S3_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  S3_BUCKET=techofay-gymos-vault-prod
  ```
- **Data Stored:** Member Aadhaar/Govt ID scans, digital signed contracts, webcam profile pictures, gym logos.

---

## 6. Biometric Hardware Bridge (ZKTeco / eSSL Push SDK)
- **Adapter Path:** `apps/api/src/integrations/adapters/BiometricAdapter.ts`
- **Current Mode:** Mock Mode (`MockBiometricAdapter.ts`)
- **Hardware Compatibility:**
  - ZKTeco uFace 800 / IN01-A / SilkBio-101TC
  - eSSL K90 / MB20 / MultiBio 700
- **Required Configuration:**
  ```env
  BIOMETRIC_ADAPTER=real
  BIOMETRIC_PUSH_PORT=8099
  BIOMETRIC_DEVICE_KEY=zk_secret_device_auth_key_2026
  ```

---

## 7. Web Push Notifications (VAPID)
- **Adapter Path:** `apps/api/src/integrations/adapters/PushAdapter.ts`
- **Current Mode:** Mock Mode (`MockPushAdapter.ts`)
- **Generate Keys:** `npx web-push generate-vapid-keys`
- **Required Environment Variables:**
  ```env
  PUSH_ADAPTER=real
  VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  VAPID_SUBJECT=mailto:security@techofay.com
  ```

---

## 8. Transactional Email (SMTP / Mailpit)
- **Adapter Path:** `apps/api/src/integrations/adapters/EmailAdapter.ts`
- **Current Mode:** Real Mailpit (Local development via docker-compose on port 1025, web UI on port 8025)
- **Production Production SMTP (SendGrid / AWS SES):**
  ```env
  EMAIL_ADAPTER=real
  SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
  SMTP_PORT=587
  SMTP_USER=AKIAxxxxxxxxxxxxxxxx
  SMTP_PASS=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  SMTP_FROM="Techofay GymOS <billing@techofay.com>"
  ```
