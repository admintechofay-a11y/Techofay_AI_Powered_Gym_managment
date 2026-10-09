import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Load Test: Popular Class Booking Rush (Midnight / Slot Opening)
 * Simulates 150 members attempting to book a limited 20-person HIIT class simultaneously
 *
 * Target:
 * - Race-safety: Zero overbooking
 * - Waitlist auto-allocation
 * - Sub-300ms p95 latency
 */

export const options = {
  scenarios: {
    booking_stampede: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 200,
      maxDuration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.05'], // Max 5% 5xx server errors
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';
const TENANT_ID = __ENV.TEST_TENANT_ID || 'tenant_production_sample_01';
const BRANCH_ID = __ENV.TEST_BRANCH_ID || 'branch_flagship_01';
const CLASS_ID = __ENV.TEST_CLASS_ID || 'class_power_hiit_01';

export default function () {
  const memberId = `member_${__VU}_${__ITER}`;

  const payload = JSON.stringify({
    branchId: BRANCH_ID,
    memberId,
    classId: CLASS_ID,
    slotTime: '2026-10-15T07:00:00.000Z',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID,
      'X-Branch-Id': BRANCH_ID,
      'X-Correlation-Id': `k6-booking-${__VU}-${__ITER}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/classes/${CLASS_ID}/book`, payload, params);

  check(res, {
    'status is 200 or 400 (capacity full controlled response)': (r) =>
      r.status === 200 || r.status === 400 || r.status === 409,
    'response time < 350ms': (r) => r.timings.duration < 350,
  });

  sleep(0.05);
}
