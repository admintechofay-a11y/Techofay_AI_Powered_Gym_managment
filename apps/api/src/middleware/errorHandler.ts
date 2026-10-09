import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Sentry } from '../config/sentry.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const requestId = req.correlationId || 'unknown';

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input parameters',
        details: err.flatten().fieldErrors,
        requestId,
      },
    });
  }

  // 2. MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyPattern || {});
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: `A record with this ${keys.join(', ') || 'field'} already exists`,
        details: err.keyValue,
        requestId,
      },
    });
  }

  // 3. Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_IDENTIFIER',
        message: `Invalid format for field: ${err.path}`,
        requestId,
      },
    });
  }

  // 4. JWT Authentication Error
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token signature',
        requestId,
      },
    });
  }

  // 5. Tenant Isolation Violation
  if (
    typeof err.message === 'string' &&
    (err.message.includes('Tenant context missing') ||
      err.message.includes('Tenant mismatch') ||
      err.message.includes('Cross-tenant violation'))
  ) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_ISOLATION_ERROR',
        message: err.message,
        requestId,
      },
    });
  }

  // 6. Generic App Error with Custom Status
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message =
    statusCode === 500
      ? 'An unexpected internal server error occurred. Please try again.'
      : err.message || 'Error processing request';

  if (statusCode === 500) {
    Sentry.captureException(err, {
      requestId,
      path: req.path,
      method: req.method,
    });
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message,
      requestId,
    },
  });
}
