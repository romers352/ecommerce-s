import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models';
import { generateTokens, setAuthCookies, clearAuthCookies } from '../middleware/auth';
import {
  asyncHandler,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
} from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse, AuthTokens } from '../types';

/**
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password, role = 'customer' } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Create new user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    emailVerificationToken: crypto.randomBytes(32).toString('hex'),

  });

  // Generate tokens
  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

  // Set auth cookies
  setAuthCookies(res, tokens);

  // Remove sensitive data from response
  const userResponse = user.toJSON();
  delete userResponse.password;
  delete userResponse.emailVerificationToken;
  delete userResponse.emailVerificationExpires;
  delete userResponse.passwordResetToken;
  delete userResponse.passwordResetExpires;

  const response: ApiResponse<{ user: any; tokens: AuthTokens }> = {
    success: true,
    message: 'User registered successfully',
    data: {
      user: userResponse,
      tokens,
    },
  };

  res.status(201).json(response);
});

/**
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Find user by email
  const user = await (User as any).scope('withPassword').findOne({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Update last login
  await user.update({ lastLogin: new Date() });

  // Generate tokens
  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

  // Set auth cookies
  setAuthCookies(res, tokens);

  // Remove sensitive data from response
  const userResponse = user.toJSON();
  delete userResponse.password;
  delete userResponse.emailVerificationToken;
  delete userResponse.emailVerificationExpires;
  delete userResponse.passwordResetToken;
  delete userResponse.passwordResetExpires;

  const response: ApiResponse<{ user: any; tokens: AuthTokens }> = {
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      tokens,
    },
  };

  res.json(response);
});

/**
 * Logout user
 */
export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Clear auth cookies
  clearAuthCookies(res);

  const response: ApiResponse<null> = {
    success: true,
    message: 'Logout successful',
    data: null,
  };

  res.json(response);
});

/**
 * Refresh access token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken: token } = req.cookies;

  if (!token) {
    throw new AuthenticationError('Refresh token not provided');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
    
    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

    // Set new auth cookies
    setAuthCookies(res, tokens);

    const response: ApiResponse<{ tokens: AuthTokens }> = {
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens },
    };

    res.json(response);
  } catch (error) {
    clearAuthCookies(res);
    throw new AuthenticationError('Invalid refresh token');
  }
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = await User.findByPk(req.user!.id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const response: ApiResponse<{ user: any }> = {
    success: true,
    message: 'Profile retrieved successfully',
    data: { user },
  };

  res.json(response);
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { firstName, lastName, email } = req.body;
  const userId = req.user!.id;

  // Check if email is being changed and if it's already taken
  if (email) {
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictError('Email is already taken');
    }
  }

  // Update user
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  await user.update({
    firstName: firstName || user.firstName,
    lastName: lastName || user.lastName,
    email: email || user.email,
  });

  const response: ApiResponse<{ user: any }> = {
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  };

  res.json(response);
});

/**
 * Change password
 */
export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.id;

  // Find user with password
  const user = await (User as any).scope('withPassword').findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Update password
  await user.update({ password: newPassword });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Password changed successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Request password reset
 */
export const requestPasswordReset = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if email exists or not
    const response: ApiResponse<null> = {
      success: true,
      message: 'If the email exists, a password reset link has been sent',
      data: null,
    };
    res.json(response);
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Save reset token to user
  await user.update({
    passwordResetToken: resetToken,
    passwordResetExpires: resetExpires,
  });

  // Send email with reset link
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  try {
    console.log('🔄 Attempting to send password reset email to:', user.email);
    const emailService = (await import('../services/emailService')).default;
    const result = await emailService.sendPasswordResetEmail(user.email, resetUrl, `${user.firstName} ${user.lastName}`);
    console.log('📧 Email service result:', result);
    if (result.success) {
      console.log('✅ Password reset email sent successfully');
    } else {
      console.error('❌ Email service returned error:', result.error);
    }
  } catch (emailError) {
    console.error('❌ Failed to send password reset email:', emailError);
    // Continue with the response even if email fails
  }

  const response: ApiResponse<null> = {
    success: true,
    message: 'Password reset link has been sent to your email',
    data: null,
  };

  res.json(response);
});

/**
 * Reset password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  // Find user by reset token
  const user = await User.findOne({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        [require('sequelize').Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    throw new ValidationError('Invalid or expired reset token');
  }

  // Update password and clear reset token
  await user.update({
    password: newPassword,
    passwordResetToken: undefined,
    passwordResetExpires: undefined,
  });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Password reset successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Verify email
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  // Find user by verification token
  const user = await User.findOne({
    where: {
      emailVerificationToken: token,
      emailVerificationExpires: {
        [require('sequelize').Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    throw new ValidationError('Invalid or expired verification token');
  }

  // Mark email as verified
  await user.update({
    emailVerified: true,
    emailVerificationToken: undefined,
    emailVerificationExpires: undefined,
  });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Email verified successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Resend email verification
 */
export const resendEmailVerification = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.emailVerified) {
    throw new ValidationError('Email is already verified');
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await user.update({
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires,
  });

  // Send verification email
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  try {
    const emailService = (await import('../services/emailService')).default;
    await emailService.sendEmailVerification(user.email, verificationUrl, `${user.firstName} ${user.lastName}`);
    console.log('✅ Email verification sent successfully');
  } catch (emailError) {
    console.error('❌ Failed to send verification email:', emailError);
    // Continue with the response even if email fails
  }

  const response: ApiResponse<null> = {
    success: true,
    message: 'Verification email sent successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Check if email exists
 */
export const checkEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required');
  }

  const user = await User.findByEmail(email);
  const exists = !!user;

  const response: ApiResponse<{ exists: boolean }> = {
    success: true,
    message: 'Email check completed',
    data: { exists },
  };

  res.json(response);
});

/**
 * Validate token
 */
export const validateToken = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // If we reach here, the token is valid (middleware already validated it)
  const response: ApiResponse<{ valid: boolean; user: any }> = {
    success: true,
    message: 'Token is valid',
    data: {
      valid: true,
      user: req.user,
    },
  };

  res.json(response);
});

export default {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendEmailVerification,
  checkEmail,
  validateToken,
};