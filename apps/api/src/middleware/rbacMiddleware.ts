import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import {
  USER_ROLES,
  DEFAULT_PERMISSION_MATRIX,
  type UserRole,
  type AppModule,
  type PermissionAction,
} from '@gymos/shared';
import { Role } from '../models/Role.js';

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role as UserRole | undefined;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to access this resource',
          requestId: req.correlationId,
        },
      });
    }

    if (userRole === USER_ROLES.SUPER_ADMIN || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Role ${userRole} is not authorized for this action`,
        requestId: req.correlationId,
      },
    });
  };
}

export function requirePermission(moduleOrPermission: AppModule | string, action?: PermissionAction) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !user.role) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          requestId: req.correlationId,
        },
      });
    }

    const role = user.role as UserRole;

    // Super Admin has unrestricted access to all modules and actions
    if (role === USER_ROLES.SUPER_ADMIN) {
      return next();
    }

    let permissionKey: string;
    let module: AppModule;
    let act: PermissionAction;

    if (action) {
      module = moduleOrPermission as AppModule;
      act = action;
      permissionKey = `${module}:${act}`;
    } else {
      permissionKey = moduleOrPermission;
      if (moduleOrPermission.includes(':')) {
        const parts = moduleOrPermission.split(':');
        // Supports both action:module and module:action formats
        module = (parts[0] || 'crm') as AppModule;
        act = (parts[1] || 'view') as PermissionAction;
      } else {
        module = moduleOrPermission as AppModule;
        act = 'view' as PermissionAction;
      }
    }


    // 1. Check user-specific direct overrides
    if (user.permissionsOverride && Array.isArray(user.permissionsOverride)) {
      if (user.permissionsOverride.includes(permissionKey)) {
        return next();
      }
    }

    // 2. Check tenant-configured role permissions if custom role exists
    if (mongoose.connection?.readyState === 1 && user.tenantId) {
      try {
        const customRole = await Role.findOne({
          tenantId: user.tenantId,
          code: role,
        }).lean();

        if (customRole && Array.isArray(customRole.permissions)) {
          if (customRole.permissions.includes(permissionKey)) {
            return next();
          }
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: `Permission denied: ${permissionKey} is not granted for role ${role}`,
              requestId: req.correlationId,
            },
          });
        }
      } catch {
        // Fallback to default matrix on lookup error
      }
    }

    // 3. Fallback to default permission matrix
    const rolePermissions = DEFAULT_PERMISSION_MATRIX[role]?.[module];
    if (rolePermissions && rolePermissions.includes(act)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Permission denied: ${permissionKey} is not allowed for role ${role}`,
        requestId: req.correlationId,
      },
    });
  };
}
