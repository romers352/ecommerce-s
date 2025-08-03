import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin';
import { AuthenticatedAdminRequest } from '../types';

/**
 * Admin authentication middleware
 */
export const authenticateAdmin = async (
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies.adminAccessToken;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Admin authentication required',
        error: 'ADMIN_UNAUTHORIZED',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Find admin
    const admin = await Admin.findByPk(decoded.id);
    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Admin not found',
        error: 'ADMIN_NOT_FOUND',
      });
      return;
    }

    // Check if admin is active
    if (!admin.isActive) {
      res.status(401).json({
        success: false,
        message: 'Admin account is deactivated',
        error: 'ADMIN_DEACTIVATED',
      });
      return;
    }

    // Check if admin is locked
    if (admin.isLocked()) {
      res.status(401).json({
        success: false,
        message: 'Admin account is locked',
        error: 'ADMIN_LOCKED',
      });
      return;
    }

    // Attach admin to request
    req.admin = {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      firstName: admin.firstName,
      lastName: admin.lastName,
      isSuperAdmin: admin.isSuperAdmin,
      permissions: admin.permissions,
      isActive: admin.isActive,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid admin token',
        error: 'ADMIN_INVALID_TOKEN',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Admin token expired',
        error: 'ADMIN_TOKEN_EXPIRED',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Admin authentication error',
      error: 'ADMIN_AUTH_ERROR',
    });
  }
};

/**
 * Middleware to check if admin is a super admin
 */
export const requireSuperAdmin = (
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.admin) {
    res.status(401).json({
      success: false,
      message: 'Admin authentication required',
      error: 'ADMIN_UNAUTHORIZED',
    });
    return;
  }

  if (!req.admin.isSuperAdmin) {
    res.status(403).json({
      success: false,
      message: 'Super admin access required',
      error: 'ADMIN_FORBIDDEN',
    });
    return;
  }

  next();
};

/**
 * Middleware to check if admin has specific permission
 */
export const requireAdminPermission = (permission: string) => {
  return (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Admin authentication required',
        error: 'ADMIN_UNAUTHORIZED',
      });
      return;
    }

    // Super admins have all permissions
    if (req.admin.isSuperAdmin) {
      next();
      return;
    }

    // Check if admin has the required permission
    if (!req.admin.permissions.includes(permission)) {
      res.status(403).json({
        success: false,
        message: `Permission '${permission}' required`,
        error: 'ADMIN_INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if admin has any of the specified permissions
 */
export const requireAnyAdminPermission = (permissions: string[]) => {
  return (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Admin authentication required',
        error: 'ADMIN_UNAUTHORIZED',
      });
      return;
    }

    // Super admins have all permissions
    if (req.admin.isSuperAdmin) {
      next();
      return;
    }

    // Check if admin has any of the required permissions
    const hasPermission = permissions.some(permission => 
      req.admin!.permissions.includes(permission)
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: `One of the following permissions required: ${permissions.join(', ')}`,
        error: 'ADMIN_INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if admin can access their own profile or is super admin
 */
export const requireSelfOrSuperAdmin = (
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.admin) {
    res.status(401).json({
      success: false,
      message: 'Admin authentication required',
      error: 'ADMIN_UNAUTHORIZED',
    });
    return;
  }

  const targetAdminId = parseInt(req.params.adminId || req.params.id || '0');
  
  // Super admin can access any admin
  if (req.admin.isSuperAdmin) {
    next();
    return;
  }

  // Admin can only access their own profile
  if (req.admin.id !== targetAdminId) {
    res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own profile.',
      error: 'ADMIN_FORBIDDEN',
    });
    return;
  }

  next();
};

/**
 * Optional admin authentication middleware (doesn't fail if no token)
 */
export const optionalAdminAuth = async (
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies.adminAccessToken;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      next();
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Find admin
    const admin = await Admin.findByPk(decoded.id);
    if (!admin || !admin.isActive || admin.isLocked()) {
      next();
      return;
    }

    // Attach admin to request
    req.admin = {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      firstName: admin.firstName,
      lastName: admin.lastName,
      isSuperAdmin: admin.isSuperAdmin,
      permissions: admin.permissions,
      isActive: admin.isActive,
    };

    next();
  } catch (error) {
    // If token is invalid, just continue without admin
    next();
  }
};

/**
 * Utility function to clear admin auth cookies
 */
export const clearAdminAuthCookies = (res: Response) => {
  res.clearCookie('adminAccessToken');
  res.clearCookie('adminRefreshToken');
};

export default {
  authenticateAdmin,
  requireSuperAdmin,
  requireAdminPermission,
  requireAnyAdminPermission,
  requireSelfOrSuperAdmin,
  optionalAdminAuth,
  clearAdminAuthCookies,
};