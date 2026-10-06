import mongoose, { Schema, Query, Types } from 'mongoose';
import { getRequestContext } from '../context/requestContext.js';

export interface TenantIsolationOptions {
  bypassParam?: string;
}

/**
 * Tenant Isolation Mongoose Plugin.
 * Guarantees that all queries, updates, deletions, aggregations, and document saves
 * are strictly scoped to the active tenant in requestContext.
 */
export function tenantIsolationPlugin(schema: any, _options: TenantIsolationOptions = {}) {
  // Ensure tenantId field exists on schema
  if (!schema.path('tenantId')) {
    schema.add({
      tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true,
      },
    });
  }

  // Pre-validate/save hook
  schema.pre('save', function (this: any, next: (err?: Error) => void) {
    const context = getRequestContext();
    if (context?.isSuperAdmin) {
      return next();
    }

    const contextTenantId = context?.tenantId;
    const docTenantId = this.get('tenantId')?.toString();

    if (contextTenantId) {
      if (this.isNew && !docTenantId) {
        this.set('tenantId', new Types.ObjectId(contextTenantId));
      } else if (docTenantId && docTenantId !== contextTenantId) {
        return next(new Error('Cross-tenant violation: document tenantId does not match request context'));
      }
    } else {
      // No tenant in context (e.g. registration, initial onboarding, background worker)
      if (!docTenantId) {
        return next(new Error('Tenant context missing: cannot save document without tenantId'));
      }
    }

    next();
  });

  // Query hook using regex
  schema.pre(
    /^(find|findOne|findOneAndUpdate|findOneAndDelete|findOneAndReplace|updateOne|updateMany|deleteOne|deleteMany|countDocuments|distinct)$/,
    function (this: Query<any, any>) {
    const queryOptions = this.getOptions();
    if (queryOptions.bypassTenantIsolation) {
      return;
    }

    const context = getRequestContext();
    if (context?.isSuperAdmin) {
      return;
    }

    const tenantId = context?.tenantId;
    const filter = this.getFilter();

    if (tenantId) {
      const targetTenantObjectId = new Types.ObjectId(tenantId);
      if (filter.tenantId) {
        const existingTenantId = filter.tenantId.toString();
        if (existingTenantId !== tenantId) {
          throw new Error('Tenant mismatch: cross-tenant access prohibited');
        }
      } else {
        this.where({ tenantId: targetTenantObjectId });
      }
    } else {
      // No tenant in context. If query explicitly specifies a tenantId filter, allow.
      // Otherwise, prevent unbounded cross-tenant querying on tenant-scoped models.
      if (!filter.tenantId && !queryOptions.allowAgnosticQuery) {
        throw new Error('Tenant context missing: cannot execute query on tenant-scoped model');
      }
    }
  });

  // Aggregate hook
  schema.pre('aggregate', function (this: any) {
    const context = getRequestContext();
    if (context?.isSuperAdmin) {
      return;
    }

    const tenantId = context?.tenantId;
    if (!tenantId) {
      return;
    }

    const targetTenantObjectId = new Types.ObjectId(tenantId);
    const pipeline = this.pipeline();

    // Check if pipeline has $match at top or insert it
    const firstStage = pipeline[0] as { $match?: Record<string, any> } | undefined;
    if (firstStage && firstStage.$match) {
      if (firstStage.$match.tenantId && firstStage.$match.tenantId.toString() !== tenantId) {
        throw new Error('Tenant mismatch in aggregation pipeline: cross-tenant access prohibited');
      }
      firstStage.$match.tenantId = targetTenantObjectId;
    } else {
      pipeline.unshift({ $match: { tenantId: targetTenantObjectId } });
    }
  });
}
