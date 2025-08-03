import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Admin } from '../models/Admin';
import {
  asyncHandler,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
} from '../middleware/errorHandler';
import { AuthenticatedAdminRequest, ApiResponse, AuthTokens } from '../types';

/**
 * Generate JWT tokens for admin
 */
const generateAdminTokens = (payload: { id: number; email: string; username: string; isSuperAdmin: boolean }): AuthTokens => {
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

/**
 * Set admin auth cookies
 */
const setAdminAuthCookies = (res: Response, tokens: AuthTokens): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('adminAccessToken', tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('adminRefreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clear admin auth cookies
 */
const clearAdminAuthCookies = (res: Response): void => {
  res.clearCookie('adminAccessToken');
  res.clearCookie('adminRefreshToken');
};

/**
 * Admin login
 */
export const adminLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { identifier, password } = req.body; // identifier can be email or username

  // Find admin by email or username
  const admin = await (Admin as any).scope('withPassword').findOne({
    where: {
      [require('sequelize').Op.or]: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    }
  });

  if (!admin) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Check if admin is active
  if (!admin.isActive) {
    throw new AuthenticationError('Admin account is deactivated');
  }

  // Check if admin is locked
  if (admin.isLocked()) {
    const lockTimeRemaining = Math.ceil((admin.lockUntil!.getTime() - Date.now()) / (1000 * 60));
    throw new AuthenticationError(`Account is locked. Try again in ${lockTimeRemaining} minutes.`);
  }

  // Verify password
  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    await admin.incrementLoginAttempts();
    throw new AuthenticationError('Invalid credentials');
  }

  // Reset login attempts on successful login
  await admin.resetLoginAttempts();

  // Update last login
  await admin.update({ lastLogin: new Date() });

  // Generate tokens
  const tokens = generateAdminTokens({
    id: admin.id,
    email: admin.email,
    username: admin.username,
    isSuperAdmin: admin.isSuperAdmin
  });

  // Set auth cookies
  setAdminAuthCookies(res, tokens);

  // Remove sensitive data from response
  const adminResponse = admin.toJSON();

  const response: ApiResponse<{ admin: any; tokens: AuthTokens }> = {
    success: true,
    message: 'Admin logged in successfully',
    data: {
      admin: adminResponse,
      tokens,
    },
  };

  res.json(response);
});

/**
 * Admin logout
 */
export const adminLogout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Clear auth cookies
  clearAdminAuthCookies(res);

  const response: ApiResponse<null> = {
    success: true,
    message: 'Admin logged out successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Refresh admin token
 */
export const adminRefreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.adminRefreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new AuthenticationError('Refresh token not provided');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    // Find admin
    const admin = await Admin.findByPk(decoded.id);
    if (!admin || !admin.isActive) {
      throw new AuthenticationError('Admin not found or inactive');
    }

    // Generate new tokens
    const tokens = generateAdminTokens({
      id: admin.id,
      email: admin.email,
      username: admin.username,
      isSuperAdmin: admin.isSuperAdmin
    });

    // Set new auth cookies
    setAdminAuthCookies(res, tokens);

    const response: ApiResponse<{ tokens: AuthTokens }> = {
      success: true,
      message: 'Tokens refreshed successfully',
      data: { tokens },
    };

    res.json(response);
  } catch (error) {
    clearAdminAuthCookies(res);
    throw new AuthenticationError('Invalid refresh token');
  }
});

/**
 * Get current admin profile
 */
export const getAdminProfile = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const admin = await Admin.findByPk(req.admin!.id);
  
  if (!admin) {
    throw new NotFoundError('Admin not found');
  }

  const response: ApiResponse<{ admin: any }> = {
    success: true,
    message: 'Admin profile retrieved successfully',
    data: { admin },
  };

  res.json(response);
});

/**
 * Update admin profile
 */
export const updateAdminProfile = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const { firstName, lastName, email, username } = req.body;
  const adminId = req.admin!.id;

  // Check if email is being changed and if it's already taken
  if (email) {
    const existingAdmin = await Admin.findByEmail(email);
    if (existingAdmin && existingAdmin.id !== adminId) {
      throw new ConflictError('Email is already taken');
    }
  }

  // Check if username is being changed and if it's already taken
  if (username) {
    const existingAdmin = await Admin.findByUsername(username);
    if (existingAdmin && existingAdmin.id !== adminId) {
      throw new ConflictError('Username is already taken');
    }
  }

  // Update admin
  const admin = await Admin.findByPk(adminId);
  if (!admin) {
    throw new NotFoundError('Admin not found');
  }

  await admin.update({
    firstName: firstName || admin.firstName,
    lastName: lastName || admin.lastName,
    email: email || admin.email,
    username: username || admin.username,
  });

  const response: ApiResponse<{ admin: any }> = {
    success: true,
    message: 'Admin profile updated successfully',
    data: { admin },
  };

  res.json(response);
});

/**
 * Change admin password
 */
export const changeAdminPassword = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const adminId = req.admin!.id;

  // Find admin with password
  const admin = await (Admin as any).scope('withPassword').findByPk(adminId);
  if (!admin) {
    throw new NotFoundError('Admin not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Update password
  await admin.update({ password: newPassword });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Admin password changed successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Request admin password reset
 */
export const requestAdminPasswordReset = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { identifier } = req.body; // email or username

  // Find admin by email or username
  const admin = await Admin.findByEmailOrUsername(identifier);
  if (!admin) {
    // Don't reveal if admin exists or not
    const response: ApiResponse<null> = {
      success: true,
      message: 'If the admin account exists, a password reset link has been sent',
      data: null,
    };
    res.json(response);
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Save reset token to admin
  await admin.update({
    passwordResetToken: resetToken,
    passwordResetExpires: resetExpires,
  });

  // TODO: Send email with reset link
  // const resetUrl = `${process.env.ADMIN_FRONTEND_URL}/reset-password?token=${resetToken}`;
  // await sendAdminPasswordResetEmail(admin.email, resetUrl);

  const response: ApiResponse<null> = {
    success: true,
    message: 'Password reset link has been sent to your email',
    data: null,
  };

  res.json(response);
});

/**
 * Reset admin password
 */
export const resetAdminPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  // Find admin by reset token
  const admin = await Admin.findOne({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        [require('sequelize').Op.gt]: new Date(),
      },
    },
  });

  if (!admin) {
    throw new ValidationError('Invalid or expired reset token');
  }

  // Update password and clear reset token
  await admin.update({
    password: newPassword,
    passwordResetToken: undefined,
    passwordResetExpires: undefined,
  });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Admin password reset successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Validate admin token
 */
export const validateAdminToken = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  // If we reach here, the token is valid (middleware already validated it)
  const response: ApiResponse<{ valid: boolean; admin: any }> = {
    success: true,
    message: 'Admin token is valid',
    data: {
      valid: true,
      admin: req.admin,
    },
  };

  res.json(response);
});

/**
 * Create new admin (Super Admin only)
 */
export const createAdmin = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const { firstName, lastName, email, username, password, permissions, isSuperAdmin } = req.body;

  // Only super admins can create new admins
  if (!req.admin!.isSuperAdmin) {
    throw new AuthenticationError('Only super admins can create new admin accounts');
  }

  // Check if admin already exists
  const existingAdmin = await Admin.findByEmailOrUsername(email || username);
  if (existingAdmin) {
    throw new ConflictError('Admin with this email or username already exists');
  }

  // Create new admin
  const admin = await Admin.create({
    firstName,
    lastName,
    email,
    username,
    password,
    permissions: permissions || [],
    isSuperAdmin: isSuperAdmin || false,
  });

  // Remove sensitive data from response
  const adminResponse = admin.toJSON();

  const response: ApiResponse<{ admin: any }> = {
    success: true,
    message: 'Admin created successfully',
    data: { admin: adminResponse },
  };

  res.status(201).json(response);
});

export default {
  adminLogin,
  adminLogout,
  adminRefreshToken,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  requestAdminPasswordReset,
  resetAdminPassword,
  validateAdminToken,
  createAdmin,
};