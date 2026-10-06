import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';
import { getRequestContext } from '../context/requestContext.js';

export interface LogAuditParams {
  tenantId?: string | Types.ObjectId;
  branchId?: string | Types.ObjectId;
  userId?: string | Types.ObjectId;
  userEmail?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId: string | Types.ObjectId;
  beforeSnapshot?: Record<string, any>;
  afterSnapshot?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

const REDACTED_FIELDS = new Set([
  'password',
  'passwordHash',
  'totpSecret',
  'token',
  'refreshToken',
  'accessToken',
  'refreshTokenHash',
]);

function sanitizeSnapshot(obj?: Record<string, any>): Record<string, any> | undefined {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_FIELDS.has(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof Types.ObjectId)) {
      sanitized[key] = sanitizeSnapshot(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export class AuditLogService {
  public static async record(params: LogAuditParams): Promise<void> {
    try {
      const context = getRequestContext();
      const tenantId = params.tenantId || context?.tenantId;

      if (!tenantId) {
        // SuperAdmin or system-level actions without tenant
        return;
      }

      const tenantObjectId =
        typeof tenantId === 'string' ? new Types.ObjectId(tenantId) : tenantId;
      const branchObjectId = params.branchId
        ? typeof params.branchId === 'string'
          ? new Types.ObjectId(params.branchId)
          : params.branchId
        : context?.branchId
          ? new Types.ObjectId(context.branchId)
          : undefined;

      const userObjectId = params.userId
        ? Types.ObjectId.isValid(params.userId)
          ? new Types.ObjectId(params.userId)
          : undefined
        : context?.userId && Types.ObjectId.isValid(context.userId)
          ? new Types.ObjectId(context.userId)
          : undefined;

      await AuditLog.create({
        tenantId: tenantObjectId,
        branchId: branchObjectId,
        userId: userObjectId,
        userEmail: params.userEmail,
        userRole: params.userRole || context?.role,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId.toString(),
        beforeSnapshot: sanitizeSnapshot(params.beforeSnapshot),
        afterSnapshot: sanitizeSnapshot(params.afterSnapshot),
        ipAddress: params.ipAddress || '127.0.0.1',
        userAgent: params.userAgent || 'system',
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('AuditLogService: Failed to record audit log:', error);
      // Audit log failure must not crash the primary transaction
    }
  }
}
