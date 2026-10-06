import { Request, Response, NextFunction } from 'express';
import { runInContext, type RequestStore } from '../context/requestContext.js';
import crypto from 'node:crypto';

declare global {
  namespace Express {
    interface Request {
      context?: RequestStore;
      correlationId?: string;
    }
  }
}

/**
 * Request context middleware.
 * Initializes the AsyncLocalStorage store for every incoming HTTP request.
 */
export function requestContextGuard(req: Request, res: Response, next: NextFunction) {
  const correlationId =
    (req.headers['x-request-id'] as string) ||
    (req.headers['x-correlation-id'] as string) ||
    crypto.randomUUID();

  // Attach correlation ID to response headers
  res.setHeader('X-Request-Id', correlationId);
  req.correlationId = correlationId;

  // Header fallback for tenantId in development/api testing if not in JWT
  const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
  const headerBranchId = req.headers['x-branch-id'] as string | undefined;

  const initialStore: RequestStore = {
    correlationId,
    tenantId: headerTenantId,
    branchId: headerBranchId,
  };

  req.context = initialStore;

  runInContext(initialStore, () => {
    next();
  });
}
