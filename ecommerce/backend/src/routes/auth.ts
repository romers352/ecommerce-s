import { Router } from 'express';
import {
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
} from '../controllers/authController';
import {
  authenticate,
} from '../middleware/auth';
import {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange,
  validatePasswordResetRequest,
  validatePasswordReset,
} from '../middleware/validation';
import {
  authLimiter,
  passwordResetLimiter,
  strictLimiter,
} from '../middleware/rateLimiter';
import { uploadUserAvatar } from '../middleware/upload';

const router = Router();

// Public routes
router.post('/register', authLimiter, validateUserRegistration, register);
router.post('/login', authLimiter, validateUserLogin, login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/check-email', checkEmail);

// Password reset routes
router.post('/password-reset/request', passwordResetLimiter, validatePasswordResetRequest, requestPasswordReset);
router.post('/password-reset/confirm', passwordResetLimiter, validatePasswordReset, resetPassword);

// Email verification with OTP
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/resend-verification', authLimiter, resendEmailVerification);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validateUserUpdate, updateProfile);
router.put('/profile/avatar', authenticate, uploadUserAvatar, updateProfile);
router.put('/change-password', authenticate, strictLimiter, validatePasswordChange, changePassword);

export default router;