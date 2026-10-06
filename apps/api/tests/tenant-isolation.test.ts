import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Tenant } from '../src/models/Tenant.js';
import { Branch } from '../src/models/Branch.js';
import { Member } from '../src/models/Member.js';
import { runInContext } from '../src/context/requestContext.js';
import { MEMBER_STATUS } from '@gymos/shared';

describe('Tenant Isolation Core Tests', () => {
  let mongod: MongoMemoryServer;
  let tenantAId: Types.ObjectId;
  let tenantBId: Types.ObjectId;
  let branchAId: Types.ObjectId;
  let branchBId: Types.ObjectId;
  let memberAId: Types.ObjectId;
  let memberBId: Types.ObjectId;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // Create Tenant A & B
    const tenantA = await Tenant.create({
      name: 'IronGym Mumbai',
      subdomain: 'irongym',
      contactEmail: 'contact@irongym.com',
      contactPhone: '+919000000001',
    });
    tenantAId = tenantA._id as Types.ObjectId;

    const tenantB = await Tenant.create({
      name: 'TitanFitness Delhi',
      subdomain: 'titanfitness',
      contactEmail: 'contact@titanfitness.com',
      contactPhone: '+919000000002',
    });
    tenantBId = tenantB._id as Types.ObjectId;

    // Create Branches
    const branchA = await Branch.create({
      tenantId: tenantAId,
      name: 'Bandra Branch',
      code: 'BANDRA',
      address: 'Bandra',
      city: 'Mumbai',
      state: 'MH',
      pincode: '400050',
      phone: '+919000000001',
      email: 'b@irongym.com',
    });
    branchAId = branchA._id as Types.ObjectId;

    const branchB = await Branch.create({
      tenantId: tenantBId,
      name: 'Connaught Place',
      code: 'CP',
      address: 'CP',
      city: 'Delhi',
      state: 'DL',
      pincode: '110001',
      phone: '+919000000002',
      email: 'cp@titanfitness.com',
    });
    branchBId = branchB._id as Types.ObjectId;

    // Seed Member A in Tenant A context
    await runInContext({ tenantId: tenantAId.toString() }, async () => {
      const m = await Member.create({
        tenantId: tenantAId,
        branchId: branchAId,
        memberCode: 'MEM-0001',
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul@irongym.com',
        phone: '+919811111111',
        gender: 'MALE',
        status: MEMBER_STATUS.ACTIVE,
      });
      memberAId = m._id as Types.ObjectId;
    });

    // Seed Member B in Tenant B context
    await runInContext({ tenantId: tenantBId.toString() }, async () => {
      const m = await Member.create({
        tenantId: tenantBId,
        branchId: branchBId,
        memberCode: 'MEM-0001', // Note: duplicate memberCode across different tenants is valid!
        firstName: 'Siddharth',
        lastName: 'Verma',
        email: 'sid@titanfitness.com',
        phone: '+919822222222',
        gender: 'MALE',
        status: MEMBER_STATUS.ACTIVE,
      });
      memberBId = m._id as Types.ObjectId;
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  test('1. Member.find() strictly scopes results to the active tenant in context', async () => {
    await runInContext({ tenantId: tenantAId.toString() }, async () => {
      const members = await Member.find();
      expect(members.length).toBe(1);
      expect(members[0]._id.toString()).toBe(memberAId.toString());
      expect(members[0].firstName).toBe('Rahul');
    });

    await runInContext({ tenantId: tenantBId.toString() }, async () => {
      const members = await Member.find();
      expect(members.length).toBe(1);
      expect(members[0]._id.toString()).toBe(memberBId.toString());
      expect(members[0].firstName).toBe('Siddharth');
    });
  });

  test('2. Member.findOne() cannot access another tenant document by ID', async () => {
    await runInContext({ tenantId: tenantAId.toString() }, async () => {
      // Tenant A tries to access Tenant B's member by ID
      const result = await Member.findById(memberBId);
      expect(result).toBeNull();
    });
  });

  test('3. Cross-tenant update is prevented and does not modify target document', async () => {
    await runInContext({ tenantId: tenantAId.toString() }, async () => {
      const res = await Member.updateOne({ _id: memberBId }, { firstName: 'Hacked' });
      expect(res.matchedCount).toBe(0);
      expect(res.modifiedCount).toBe(0);
    });

    // Verify member B remains unchanged
    await runInContext({ tenantId: tenantBId.toString() }, async () => {
      const target = await Member.findById(memberBId);
      expect(target).not.toBeNull();
      expect(target?.firstName).toBe('Siddharth');
    });
  });

  test('4. Cross-tenant deletion is impossible', async () => {
    await runInContext({ tenantId: tenantAId.toString() }, async () => {
      const res = await Member.deleteOne({ _id: memberBId });
      expect(res.deletedCount).toBe(0);
    });

    // Verify Member B is still intact
    await runInContext({ tenantId: tenantBId.toString() }, async () => {
      const count = await Member.countDocuments({ _id: memberBId });
      expect(count).toBe(1);
    });
  });

  test('5. Aggregation pipeline automatically injects tenant filter at the first stage', async () => {
    await runInContext({ tenantId: tenantAId.toString() }, async () => {
      const results = await Member.aggregate([{ $project: { firstName: 1 } }]);
      expect(results.length).toBe(1);
      expect(results[0].firstName).toBe('Rahul');
    });
  });

  test('6. Explicit cross-tenant query mismatch throws an error', async () => {
    await runInContext({ tenantId: tenantAId.toString() }, async () => {
      await expect(Member.find({ tenantId: tenantBId })).rejects.toThrow(
        'Tenant mismatch: cross-tenant access prohibited',
      );
    });
  });

  test('7. Super admin context can bypass tenant isolation when needed', async () => {
    await runInContext({ isSuperAdmin: true }, async () => {
      const allMembers = await Member.find();
      expect(allMembers.length).toBe(2);
    });
  });
});
