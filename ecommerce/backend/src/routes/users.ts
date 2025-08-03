import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  updateAvatar,
  getDashboard,
  deleteAccount,
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from '../controllers/usersController';
import {
  authenticate,
  requireAdmin,
  requireSelfOrAdmin,
} from '../middleware/auth';
import {
  authenticateAdmin,
} from '../middleware/adminAuth';
import {
  validateUserUpdate,
  validateUserCreate,
  validatePasswordChange,
  validatePagination,
} from '../middleware/validation';
import {
  generalLimiter,
  strictLimiter,
  uploadLimiter,
  adminLimiter,
} from '../middleware/rateLimiter';
import { uploadUserAvatar } from '../middleware/upload';

const router = Router();

// User profile routes
router.get('/profile', authenticate, generalLimiter, getProfile);
router.put('/profile', authenticate, generalLimiter, validateUserUpdate, updateProfile);
router.put('/profile/avatar', authenticate, uploadLimiter, uploadUserAvatar, updateAvatar);
router.put('/change-password', authenticate, strictLimiter, validatePasswordChange, changePassword);
router.get('/dashboard', authenticate, generalLimiter, getDashboard);
router.delete('/account', authenticate, strictLimiter, deleteAccount);

// Admin user management routes
router.get('/admin/all', authenticateAdmin, generalLimiter, validatePagination, getAllUsers);
router.get('/admin/stats', authenticateAdmin, generalLimiter, getUserStats);
router.post('/admin/create', authenticateAdmin, generalLimiter, validateUserCreate, createUser);
router.get('/:id', authenticate, requireSelfOrAdmin, generalLimiter, getUser);
router.put('/:id', authenticateAdmin, validateUserUpdate, updateUser);
router.delete('/:id', authenticateAdmin, adminLimiter, deleteUser);

export default router;