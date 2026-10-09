import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { runInContext, getRequestContext } from '../context/requestContext.js';
import type { JwtTokenPayload } from '@gymos/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JwtTokenPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required',
        requestId: req.correlationId,
      },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtTokenPayload;
    req.user = decoded;

    // Update AsyncLocalStorage context
    const existing = getRequestContext() || {};
    const updatedStore = {
      ...existing,
      tenantId: decoded.tenantId,
      userId: decoded.userId,
      role: decoded.role,
      branchId: decoded.branchId,
      isSuperAdmin: decoded.role === 'SUPER_ADMIN',
    };

    req.context = updatedStore;

    runInContext(updatedStore, () => {
      next();
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid authentication token',
        requestId: req.correlationId,
      },
    });
  }
}

export const requireAuth = authMiddleware;

