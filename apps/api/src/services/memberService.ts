import QRCode from 'qrcode';
import { Types } from 'mongoose';
import { Member, IMember } from '../models/Member.js';
import { Counter } from '../models/Counter.js';
import { Membership } from '../models/Membership.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Attendance } from '../models/Attendance.js';
import { Waiver } from '../models/Waiver.js';
import { AuditLogService } from './auditLogService.js';
import { MEMBER_STATUS } from '@gymos/shared';

export interface RegisterMemberInput {
  tenantId: string;
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
  fitnessProfile?: {
    goals?: string[];
    medicalConditions?: string[];
    injuries?: string[];
  };
  waiverAgreement?: {
    signedText: string;
    signatureDataUrl?: string;
    ipAddress?: string;
  };
  registeredByUserId?: string;
}

export class MemberService {
  /**
   * Register a new member with atomic Member ID, QR code, and duplicate detection.
   */
  static async registerMember(input: RegisterMemberInput): Promise<IMember> {
    const tenantObjectId = new Types.ObjectId(input.tenantId);
    const branchObjectId = new Types.ObjectId(input.branchId);

    // 1. Duplicate detection within tenant
    const existingMember = await Member.findOne({
      tenantId: tenantObjectId,
      $or: [{ phone: input.phone }, { email: input.email.toLowerCase() }],
    });

    if (existingMember) {
      if (existingMember.phone === input.phone) {
        throw new Error(`Member with phone number ${input.phone} already exists (ID: ${existingMember.memberCode})`);
      }
      throw new Error(`Member with email ${input.email} already exists (ID: ${existingMember.memberCode})`);
    }

    // 2. Generate atomic Member ID
    const memberCode = await Counter.getNextSequence(input.tenantId, 'MEMBER', 'GYM');

    // 3. Generate QR code payload and data URL
    const qrPayload = JSON.stringify({
      t: input.tenantId,
      m: memberCode,
      p: input.phone,
      issuedAt: Date.now(),
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 1,
    });

    const formattedAddress = input.address
      ? typeof input.address === 'string'
        ? input.address
        : `${input.address.line1 || ''}, ${input.address.city || ''} ${input.address.pincode || ''}`.trim()
      : undefined;

    // 4. Create member document
    const member = await Member.create({
      tenantId: tenantObjectId,
      branchId: branchObjectId,
      memberCode,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      gender: input.gender || 'OTHER',
      dob: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      status: MEMBER_STATUS.ACTIVE,
      emergencyContact: input.emergencyContact,
      address: formattedAddress,
      fitnessGoals: input.fitnessProfile?.goals || [],
      joinDate: new Date(),
    });

    // 5. Store signed digital waiver if provided
    if (input.waiverAgreement) {
      await Waiver.create({
        tenantId: tenantObjectId,
        memberId: member._id,
        version: 'v2026.1',
        signedAt: new Date(),
        signedBy: `${input.firstName} ${input.lastName}`,
        ipAddress: input.waiverAgreement.ipAddress || '127.0.0.1',
        signatureUrl: input.waiverAgreement.signatureDataUrl || '',
        termsAgreed: true,
      });
    }

    // 6. Audit log entry
    if (input.registeredByUserId) {
      await AuditLogService.record({
        tenantId: input.tenantId,
        userId: input.registeredByUserId,
        action: 'MEMBER_REGISTER',
        entity: 'Member',
        entityId: member._id.toString(),
        afterSnapshot: member.toObject(),
      });
    }

    return member;
  }

  /**
   * Retrieves complete chronological history tab for a member.
   */
  static async getMemberHistory(tenantId: string, memberIdStr: string) {
    const member = await Member.findOne({
      $or: [
        { _id: Types.ObjectId.isValid(memberIdStr) ? new Types.ObjectId(memberIdStr) : undefined },
        { memberCode: memberIdStr },
      ].filter(Boolean),
    });

    if (!member) {
      throw new Error(`Member ${memberIdStr} not found`);
    }

    const [memberships, invoices, payments, attendances, waivers] = await Promise.all([
      Membership.find({ memberId: member._id }).sort({ createdAt: -1 }),
      Invoice.find({ memberId: member._id }).sort({ createdAt: -1 }),
      Payment.find({ memberId: member._id }).sort({ createdAt: -1 }),
      Attendance.find({ memberId: member._id }).sort({ checkInTime: -1 }).limit(100),
      Waiver.find({ memberId: member._id }).sort({ signedAt: -1 }),
    ]);

    return {
      member,
      memberships,
      invoices,
      payments,
      attendances,
      waivers,
    };
  }

  /**
   * Bulk CSV import processor with detailed line-by-line validation report.
   */
  static async importMembersFromCsv(
    tenantId: string,
    branchId: string,
    csvContent: string,
    importedByUserId?: string,
  ): Promise<{
    totalRows: number;
    successfulCount: number;
    failedCount: number;
    createdMembers: { memberId: string; name: string }[];
    errors: { row: number; field: string; message: string; rawRow: string }[];
  }> {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const dataRows = lines.slice(1);

    const createdMembers: { memberId: string; name: string }[] = [];
    const errors: { row: number; field: string; message: string; rawRow: string }[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const rowNum = i + 2; // 1-indexed, skipping header
      const rowStr = dataRows[i];
      const cols = rowStr.split(',').map((c) => c.trim());

      const rowMap: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowMap[h] = cols[idx] || '';
      });

      const firstName = rowMap['firstname'] || rowMap['first_name'] || rowMap['name']?.split(' ')[0] || '';
      const lastName = rowMap['lastname'] || rowMap['last_name'] || rowMap['name']?.split(' ').slice(1).join(' ') || 'Member';
      const email = rowMap['email'] || '';
      const phone = rowMap['phone'] || rowMap['mobile'] || '';

      // Validation
      if (!firstName) {
        errors.push({ row: rowNum, field: 'firstName', message: 'First name is required', rawRow: rowStr });
        continue;
      }
      if (!phone || phone.length < 10) {
        errors.push({ row: rowNum, field: 'phone', message: 'Valid 10+ digit phone number is required', rawRow: rowStr });
        continue;
      }
      if (!email || !email.includes('@')) {
        errors.push({ row: rowNum, field: 'email', message: 'Valid email address is required', rawRow: rowStr });
        continue;
      }

      try {
        const member = await this.registerMember({
          tenantId,
          branchId,
          firstName,
          lastName,
          email,
          phone,
          registeredByUserId: importedByUserId,
        });

        createdMembers.push({
          memberId: member.memberCode,
          name: `${member.firstName} ${member.lastName}`,
        });
      } catch (err: any) {
        errors.push({
          row: rowNum,
          field: 'duplicate',
          message: err.message || 'Failed to save member',
          rawRow: rowStr,
        });
      }
    }

    return {
      totalRows: dataRows.length,
      successfulCount: createdMembers.length,
      failedCount: errors.length,
      createdMembers,
      errors,
    };
  }
}
