import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { requireRole, requirePermission } from '../src/middleware/rbacMiddleware.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { USER_ROLES, APP_MODULES, PERMISSION_ACTIONS } from '@gymos/shared';

describe('RBAC & Permission Matrix Middleware Tests', () => {
  const app = express();
  app.use(express.json());

  // Test setup: mock authentication middleware setting req.user
  app.use((req: any, _res: Response, next: NextFunction) => {
    const roleHeader = req.headers['x-test-role'];
    if (roleHeader) {
      req.user = {
        userId: '507f1f77bcf86cd799439011',
        tenantId: '507f1f77bcf86cd799439012',
        role: roleHeader,
        email: 'test@gymos.com',
      };
    }
    next();
  });

  // Role-guarded endpoint
  app.get(
    '/api/test/owners-only',
    requireRole([USER_ROLES.GYM_OWNER]),
    (_req: Request, res: Response) => {
      res.json({ success: true, message: 'Welcome Owner' });
    },
  );

  // Permission-guarded endpoints
  app.get(
    '/api/test/members/view',
    requirePermission(APP_MODULES.MEMBERS, PERMISSION_ACTIONS.VIEW),
    (_req: Request, res: Response) => {
      res.json({ success: true, message: 'Members list' });
    },
  );

  app.post(
    '/api/test/billing/create',
    requirePermission(APP_MODULES.BILLING, PERMISSION_ACTIONS.CREATE),
    (_req: Request, res: Response) => {
      res.json({ success: true, message: 'Invoice created' });
    },
  );

  app.get(
    '/api/test/expenses/view',
    requirePermission(APP_MODULES.EXPENSES, PERMISSION_ACTIONS.VIEW),
    (_req: Request, res: Response) => {
      res.json({ success: true, message: 'Expenses view' });
    },
  );

  app.use(errorHandler);

  test('1. Unauthenticated request without user role returns 401', async () => {
    const res = await request(app).get('/api/test/owners-only');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('2. Super Admin can access owner-only endpoint', async () => {
    const res = await request(app)
      .get('/api/test/owners-only')
      .set('x-test-role', USER_ROLES.SUPER_ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Welcome Owner');
  });

  test('3. Receptionist is denied from owner-only endpoint with 403', async () => {
    const res = await request(app)
      .get('/api/test/owners-only')
      .set('x-test-role', USER_ROLES.RECEPTIONIST);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('4. Receptionist CAN view members (allowed by default matrix)', async () => {
    const res = await request(app)
      .get('/api/test/members/view')
      .set('x-test-role', USER_ROLES.RECEPTIONIST);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Members list');
  });

  test('5. Trainer CANNOT create billing invoices (denied by default matrix)', async () => {
    const res = await request(app)
      .post('/api/test/billing/create')
      .set('x-test-role', USER_ROLES.TRAINER);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('6. Accountant CAN create billing invoices', async () => {
    const res = await request(app)
      .post('/api/test/billing/create')
      .set('x-test-role', USER_ROLES.ACCOUNTANT);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Invoice created');
  });

  test('7. Member CANNOT view operational expenses', async () => {
    const res = await request(app)
      .get('/api/test/expenses/view')
      .set('x-test-role', USER_ROLES.MEMBER);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
