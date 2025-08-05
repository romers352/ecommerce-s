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
    // If user exists but email is not verified, allow re-registration
    if (!existingUser.emailVerified) {
      // Generate new OTP code and expiry
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update existing user with new details and OTP
      await existingUser.update({
        firstName,
        lastName,
        password,
        role,
        otpCode: otpCode,
        otpExpires: otpExpires,
      });

      // Send OTP email asynchronously (don't wait for completion)
  setImmediate(async () => {
    try {
      const emailService = (await import('../services/emailService')).default;
      await emailService.sendOTPVerification(existingUser.email, otpCode, `${existingUser.firstName} ${existingUser.lastName}`);
      console.log('✅ OTP verification sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      // Log error but don't fail the registration
    }
  });

      const response: ApiResponse<null> = {
        success: true,
        message: 'Registration updated! Please check your email for the verification code.',
        data: null,
      };

      res.status(200).json(response);
      return;
    } else {
      throw new ConflictError('User with this email already exists and is verified. Please login instead.');
    }
  }

  // Generate OTP code and expiry
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create new user (not verified by default)
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    otpCode: otpCode,
    otpExpires: otpExpires,
    emailVerified: false,
  });

  // Send OTP email asynchronously (don't wait for completion)
  setImmediate(async () => {
    try {
      const emailService = (await import('../services/emailService')).default;
      await emailService.sendOTPVerification(user.email, otpCode, `${user.firstName} ${user.lastName}`);
      console.log('✅ OTP verification sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      // Log error but don't fail the registration
    }
  });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Registration successful! Please check your email for the verification code.',
    data: null,
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

  // Check if email is verified
  if (!user.emailVerified) {
    throw new AuthenticationError('Please verify your email address before logging in. Check your inbox for the verification link.');
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
      message: 'If the email exists, a password reset code has been sent',
      data: null,
    };
    res.json(response);
    return;
  }

  // Generate 6-digit OTP
  const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save reset OTP to user
  await user.update({
    passwordResetOtp: resetOtp,
    passwordResetOtpExpires: resetOtpExpires,
  });

  // Send email with reset OTP asynchronously
  setImmediate(async () => {
    try {
      console.log('🔄 Attempting to send password reset OTP to:', user.email);
      const emailService = (await import('../services/emailService')).default;
      const result = await emailService.sendPasswordResetOTP(user.email, resetOtp, `${user.firstName} ${user.lastName}`);
      console.log('📧 Email service result:', result);
      if (result.success) {
        console.log('✅ Password reset OTP sent successfully');
      } else {
        console.error('❌ Email service returned error:', result.error);
      }
    } catch (emailError) {
      console.error('❌ Failed to send password reset OTP:', emailError);
    }
  });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Password reset code has been sent to your email',
    data: null,
  };

  res.json(response);
});

/**
 * Reset password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, otpCode, newPassword } = req.body;

  // Find user by email and reset OTP
  const user = await (User as any).scope('withTokens').findOne({
    where: {
      email: email.toLowerCase(),
      passwordResetOtp: otpCode,
      passwordResetOtpExpires: {
        [require('sequelize').Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    throw new ValidationError('Invalid or expired reset code');
  }

  // Update password and clear reset OTP
  await user.update({
    password: newPassword,
    passwordResetOtp: null,
    passwordResetOtpExpires: null,
  });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Password reset successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Verify email with OTP
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, otpCode } = req.body;

  // Find user by email and OTP
  const user = await User.findOne({
    where: {
      email: email.toLowerCase(),
      otpCode: otpCode,
      otpExpires: {
        [require('sequelize').Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    throw new ValidationError('Invalid or expired verification code');
  }

  // Mark email as verified
  await user.update({
    emailVerified: true,
    otpCode: undefined,
    otpExpires: undefined,
  });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Email verified successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Resend email verification OTP
 */
export const resendEmailVerification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.emailVerified) {
    throw new ValidationError('Email is already verified');
  }

  // Generate new OTP code
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await user.update({
    otpCode: otpCode,
    otpExpires: otpExpires,
  });

  // Send OTP email asynchronously (don't wait for completion)
  setImmediate(async () => {
    try {
      const emailService = (await import('../services/emailService')).default;
      await emailService.sendOTPVerification(user.email, otpCode, `${user.firstName} ${user.lastName}`);
      console.log('✅ OTP verification resent successfully');
    } catch (emailError) {
      console.error('❌ Failed to resend OTP email:', emailError);
      // Log error but don't fail the request
    }
  });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Verification code sent successfully',
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