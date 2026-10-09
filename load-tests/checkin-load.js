import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Load Test: Member Turnstile Check-In Peak Hours
 * Simulates morning peak gym check-ins (06:00 - 08:30)
 *
 * Target:
 * - 100 concurrent VUs
 * - Sub-200ms p95 latency
 * - 0% error rate under burst traffic
 */

export const options = {
  stages: [
    { duration: '15s', target: 20 },  // Ramp-up
    { duration: '30s', target: 100 }, // Peak turnstile traffic
    { duration: '15s', target: 0 },   // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<400'], // 95% of check-ins within 200ms
    http_req_failed: ['rate<0.01'],                 // Error rate < 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';
const TENANT_ID = __ENV.TEST_TENANT_ID || 'tenant_production_sample_01';
const BRANCH_ID = __ENV.TEST_BRANCH_ID || 'branch_flagship_01';

export default function () {
  const memberCode = `MEM-${Math.floor(1000 + Math.random() * 9000)}`;

  const payload = JSON.stringify({
    memberCode,
    branchId: BRANCH_ID,
    method: 'QR_SCAN',
    deviceId: 'TURNSTILE_GATE_01',
    timestamp: new Date().toISOString(),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID,
      'X-Branch-Id': BRANCH_ID,
      'X-Correlation-Id': `k6-checkin-${__VU}-${__ITER}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/attendance/check-in`, payload, params);

  check(res, {
    'status is 200 or 400 (controlled response)': (r) => r.status === 200 || r.status === 400,
    'response time < 250ms': (r) => r.timings.duration < 250,
  });

  sleep(0.1); // 100ms throttle between member scans
}
