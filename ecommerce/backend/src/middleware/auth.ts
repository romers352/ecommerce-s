import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models';
import { AuthenticatedRequest, JWTPayload } from '../types';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Ensure secrets are strings
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined');
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: 'UNAUTHORIZED',
      });
      return;
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Handle both user tokens (userId) and admin tokens (id)
    const userId = decoded.userId || decoded.id;
    
    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        error: 'ACCOUNT_DEACTIVATED',
      });
      return;
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token has expired',
        error: 'TOKEN_EXPIRED',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN',
      });
      return;
    }

    // console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
      error: 'FORBIDDEN',
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user is a customer
 */
export const requireCustomer = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED',
    });
    return;
  }

  if (req.user.role !== 'customer') {
    res.status(403).json({
      success: false,
      message: 'Customer access required',
      error: 'FORBIDDEN',
    });
    return;
  }

  next();
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.accessToken;

    if (!token) {
      next();
      return;
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Find the user
    const user = await User.findByPk(decoded.userId);
    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }

    next();
  } catch (error) {
    // Ignore errors in optional auth
    next();
  }
};

/**
 * Middleware to verify refresh token
 */
export const verifyRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const cookieRefreshToken = req.cookies?.refreshToken;
    
    const token = refreshToken || cookieRefreshToken;
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Refresh token is required',
        error: 'REFRESH_TOKEN_REQUIRED',
      });
      return;
    }

    // Verify the refresh token
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    
    // Find the user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        error: 'ACCOUNT_DEACTIVATED',
      });
      return;
    }

    // Attach user info to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Refresh token has expired',
        error: 'REFRESH_TOKEN_EXPIRED',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: 'INVALID_REFRESH_TOKEN',
      });
      return;
    }

    // console.error('Refresh token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during token verification',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Middleware to check if user owns the resource or is admin
 */
export const requireOwnershipOrAdmin = (resourceUserIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED',
      });
      return;
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      res.status(400).json({
        success: false,
        message: 'Resource user ID not found',
        error: 'RESOURCE_USER_ID_MISSING',
      });
      return;
    }

    if (parseInt(resourceUserId) !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        error: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user can access their own profile or admin can access any
 */
export const requireSelfOrAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED',
    });
    return;
  }

  const targetUserId = parseInt(req.params.userId || req.params.id || '0');
  
  // Admin can access any user
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // User can only access their own profile
  if (req.user.id !== targetUserId) {
    res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own profile.',
      error: 'FORBIDDEN',
    });
    return;
  }

  next();
};

/**
 * Utility function to generate JWT tokens
 */
export const generateTokens = (user: { id: number; email: string; role: string }) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

/**
 * Utility function to set auth cookies
 */
export const setAuthCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Utility function to clear auth cookies
 */
export const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

export default {
  authenticate,
  requireAdmin,
  requireCustomer,
  optionalAuth,
  verifyRefreshToken,
  requireOwnershipOrAdmin,
  requireSelfOrAdmin,
  generateTokens,
  setAuthCookies,
  clearAuthCookies,
};