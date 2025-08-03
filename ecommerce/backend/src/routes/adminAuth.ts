import { Router } from 'express';
import {
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
} from '../controllers/adminAuthController';
import {
  authenticateAdmin,
  requireSuperAdmin,
} from '../middleware/adminAuth';
import {
  validateAdminLogin,
  validateAdminRegistration,
  validateAdminUpdate,
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

// Public admin auth routes
router.post('/login', authLimiter, validateAdminLogin, adminLogin);
router.post('/logout', adminLogout);
router.post('/refresh-token', adminRefreshToken);

// Admin password reset routes
router.post('/password-reset/request', passwordResetLimiter, validatePasswordResetRequest, requestAdminPasswordReset);
router.post('/password-reset/confirm', passwordResetLimiter, validatePasswordReset, resetAdminPassword);

// Protected admin routes
router.get('/profile', authenticateAdmin, getAdminProfile);
router.put('/profile', authenticateAdmin, validateAdminUpdate, updateAdminProfile);
router.put('/profile/avatar', authenticateAdmin, uploadUserAvatar, updateAdminProfile);
router.put('/change-password', authenticateAdmin, strictLimiter, validatePasswordChange, changeAdminPassword);
router.get('/validate-token', authenticateAdmin, validateAdminToken);

// Super admin only routes
router.post('/create', authenticateAdmin, requireSuperAdmin, validateAdminRegistration, createAdmin);

export default router;