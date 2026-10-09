import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { isSafeOutboundUrl } from '../src/utils/ssrfGuard.js';
import { cacheService } from '../src/services/cacheService.js';

describe('Security & OWASP Top 10 Hardening Tests', () => {
  let mongod: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe('1. NoSQL Injection & Operator Mitigation', () => {
    it('should intercept and block $ne operator injection in request body', async () => {
      const maliciousPayload = {
        email: { $ne: null },
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(maliciousPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_INPUT_OPERATOR');
      expect(res.body.error.message).toContain('NoSQL query operators detected');
    });

    it('should intercept and block $where operator injection in request body', async () => {
      const maliciousPayload = {
        $where: 'this.password.length > 5',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(maliciousPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_INPUT_OPERATOR');
    });

    it('should intercept and block $gt operator injection in nested body properties', async () => {
      const nestedPayload = {
        user: {
          profile: {
            score: { $gt: 0 },
          },
        },
      };

      const res = await request(app)
        .post('/api/members')
        .send(nestedPayload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT_OPERATOR');
    });

    it('should intercept dot notation prototype pollution attempts', async () => {
      const maliciousPayload = {
        '__proto__.isAdmin': true,
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(maliciousPayload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT_OPERATOR');
    });
  });

  describe('2. SSRF Protection (Server-Side Request Forgery)', () => {
    it('should block local loopback and internal network addresses', () => {
      expect(isSafeOutboundUrl('http://127.0.0.1:8080/admin').safe).toBe(false);
      expect(isSafeOutboundUrl('http://localhost:3000/api').safe).toBe(false);
      expect(isSafeOutboundUrl('http://0.0.0.0/').safe).toBe(false);
    });

    it('should block AWS / Cloud metadata service endpoint (169.254.169.254)', () => {
      expect(isSafeOutboundUrl('http://169.254.169.254/latest/meta-data/').safe).toBe(false);
    });

    it('should block RFC 1918 private subnets', () => {
      expect(isSafeOutboundUrl('http://10.0.0.1/internal').safe).toBe(false);
      expect(isSafeOutboundUrl('http://172.16.0.5/api').safe).toBe(false);
      expect(isSafeOutboundUrl('http://192.168.1.1/router').safe).toBe(false);
    });

    it('should allow legitimate public HTTPS API endpoints', () => {
      expect(isSafeOutboundUrl('https://api.razorpay.com/v1/payments').safe).toBe(true);
      expect(isSafeOutboundUrl('https://graph.facebook.com/v18.0/messages').safe).toBe(true);
      expect(isSafeOutboundUrl('https://api.anthropic.com/v1/messages').safe).toBe(true);
    });
  });

  describe('3. Multi-Tenant Cache Isolation & Key Collisions', () => {
    it('should isolate cached data per tenant even with identical cache keys', async () => {
      const tenantA = 'tenant-alpha-001';
      const tenantB = 'tenant-beta-002';
      const cacheKey = 'dashboard:revenue:summary';

      // Tenant A caches summary
      await cacheService.set(tenantA, cacheKey, { totalRevenuePaise: 500000 });
      // Tenant B caches summary
      await cacheService.set(tenantB, cacheKey, { totalRevenuePaise: 1200000 });

      // Read back
      const dataA = await cacheService.get<{ totalRevenuePaise: number }>(tenantA, cacheKey);
      const dataB = await cacheService.get<{ totalRevenuePaise: number }>(tenantB, cacheKey);

      expect(dataA?.totalRevenuePaise).toBe(500000);
      expect(dataB?.totalRevenuePaise).toBe(1200000);
      expect(dataA?.totalRevenuePaise).not.toBe(dataB?.totalRevenuePaise);
    });

    it('should safely delete only the requested tenant keys', async () => {
      const tenantA = 'tenant-alpha-001';
      const tenantB = 'tenant-beta-002';
      const cacheKey = 'dashboard:stats';

      await cacheService.set(tenantA, cacheKey, { active: 10 });
      await cacheService.set(tenantB, cacheKey, { active: 40 });

      await cacheService.del(tenantA, cacheKey);

      expect(await cacheService.get(tenantA, cacheKey)).toBeNull();
      expect(await cacheService.get(tenantB, cacheKey)).toEqual({ active: 40 });
    });
  });

  describe('4. Mass Assignment & Strict Input Validation', () => {
    it('should reject requests with unwhitelisted or schema-violating fields on auth', async () => {
      const maliciousRegistration = {
        gymName: 'Apex Fitness',
        subdomain: 'apexfit-test-unique',
        ownerName: 'Apex Owner',
        email: 'owner@apexfit.test',
        password: 'Password123!',
        phone: '+919876543210',
        role: 'SUPER_ADMIN', // Attempting privilege escalation
        isSuperAdmin: true,
        tier: 'ENTERPRISE', // Attempting free tier upgrade
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(maliciousRegistration);

      // Successfully creates account but rejects / ignores unpermitted mass-assigned fields
      if (res.status === 201) {
        expect(res.body.data.user.role).toBe('GYM_OWNER');
        expect(res.body.data.user.role).not.toBe('SUPER_ADMIN');
      } else {
        expect(res.status).toBe(400);
      }
    });
  });

  describe('5. Security Headers Check', () => {
    it('should include hardened HTTP security headers (Helmet)', async () => {
      const res = await request(app).get('/health');

      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['strict-transport-security']).toBeDefined();
    });
  });
});
