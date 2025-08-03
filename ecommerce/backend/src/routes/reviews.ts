import { Router } from 'express';
import {
  getProductReviews,
  getUserReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getAllReviews,
  getPendingReviews,
  moderateReview,
  getReviewStats,
} from '../controllers/reviewsController';
import {
  authenticate,
  requireAdmin,
  requireOwnershipOrAdmin,
} from '../middleware/auth';
import {
  authenticateAdmin,
} from '../middleware/adminAuth';
import {
  validateReviewCreate,
  validatePagination,
} from '../middleware/validation';
import {
  generalLimiter,
  reviewLimiter,
  strictLimiter,
  adminLimiter,
} from '../middleware/rateLimiter';

const router = Router();

// Public review routes
router.get('/product/:productId', generalLimiter, validatePagination, getProductReviews);
router.get('/:id', generalLimiter, getReview);

// User review routes
router.get('/user/my-reviews', authenticate, generalLimiter, validatePagination, getUserReviews);
router.post('/', authenticate, reviewLimiter, validateReviewCreate, createReview);
router.put('/:id', authenticate, requireOwnershipOrAdmin, updateReview);
router.delete('/:id', authenticate, strictLimiter, requireOwnershipOrAdmin, deleteReview);
router.patch('/:id/helpful', authenticate, generalLimiter, markReviewHelpful);

// Admin review routes
router.get('/admin/all', authenticateAdmin, generalLimiter, validatePagination, getAllReviews);
router.get('/admin/pending', authenticateAdmin, generalLimiter, validatePagination, getPendingReviews);
router.get('/admin/stats', authenticateAdmin, generalLimiter, getReviewStats);
router.patch('/:id/moderate', authenticateAdmin, adminLimiter, moderateReview);

export default router;