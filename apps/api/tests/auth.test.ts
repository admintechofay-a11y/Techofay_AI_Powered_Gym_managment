import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/models/Tenant.js';
import { User } from '../src/models/User.js';

describe('Authentication & Security Suite', () => {
  let mongod: MongoMemoryServer;
  let app: any;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    app = createApp();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  test('1. Register tenant creates organization, branch and owner with Argon2 password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        gymName: 'Olympus Gym',
        subdomain: 'olympus',
        ownerName: 'Alexander King',
        email: 'alex@olympusgym.com',
        phone: '+919876543210',
        password: 'Password@123',
        branchName: 'Olympus Flagship',
        city: 'Pune',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alex@olympusgym.com');
    expect(res.body.data.user.role).toBe('GYM_OWNER');
    expect(res.body.data.tenant.subdomain).toBe('olympus');
    expect(res.body.data.accessToken).toBeDefined();

    // Verify in database
    const savedUser = await User.findOne({ email: 'alex@olympusgym.com' }, null, {
      bypassTenantIsolation: true,
    });
    expect(savedUser).not.toBeNull();
    expect(savedUser?.passwordHash).toMatch(/^\$argon2id\$/); // Argon2id hash verified!
  });

  test('2. Login with valid credentials succeeds and creates active session', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'alex@olympusgym.com',
      password: 'Password@123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('3. Repeated password failures lock out the account after 5 attempts', async () => {
    // Attempt 1 to 4: returns 401
    for (let i = 1; i <= 4; i++) {
      const res = await request(app).post('/api/auth/login').send({
        email: 'alex@olympusgym.com',
        password: 'WrongPassword',
      });
      expect(res.status).toBe(401);
    }

    // Attempt 5: triggers lockout (HTTP 429)
    const lockoutRes = await request(app).post('/api/auth/login').send({
      email: 'alex@olympusgym.com',
      password: 'WrongPassword',
    });
    expect(lockoutRes.status).toBe(429);
    expect(lockoutRes.body.error.message).toContain('locked');

    // Attempt 6 (even with correct password) remains locked
    const lockedRes = await request(app).post('/api/auth/login').send({
      email: 'alex@olympusgym.com',
      password: 'Password@123',
    });
    expect(lockedRes.status).toBe(429);
  });
});
