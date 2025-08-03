import { Router } from 'express';
import {
  getCart,
  getCartSummary,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart,
  validateCart,
  getCartCount,
  applyCoupon,
  removeCoupon,
} from '../controllers/cartController';
import {
  authenticate,
  optionalAuth,
} from '../middleware/auth';
import {
  validateCartItem,
  validateCartUpdate,
} from '../middleware/validation';
import {
  generalLimiter,
} from '../middleware/rateLimiter';

const router = Router();

// Cart routes (support both authenticated users and guest sessions)
router.get('/', optionalAuth, generalLimiter, getCart);
router.get('/summary', optionalAuth, generalLimiter, getCartSummary);
router.get('/count', optionalAuth, generalLimiter, getCartCount);
router.post('/items', optionalAuth, generalLimiter, validateCartItem, addToCart);
router.put('/items/:id', optionalAuth, generalLimiter, validateCartUpdate, updateCartItem);
router.delete('/items/:id', optionalAuth, generalLimiter, removeFromCart);
router.delete('/clear', optionalAuth, generalLimiter, clearCart);
router.post('/merge', authenticate, generalLimiter, mergeCart);
router.post('/validate', optionalAuth, generalLimiter, validateCart);

// Coupon routes
router.post('/coupon', optionalAuth, generalLimiter, applyCoupon);
router.delete('/coupon', optionalAuth, generalLimiter, removeCoupon);

export default router;