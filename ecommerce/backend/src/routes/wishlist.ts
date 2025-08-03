import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  checkWishlistStatus,
  getWishlistCount,
} from '../controllers/wishlistController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// All wishlist routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/wishlist
 * @desc    Get user's wishlist
 * @access  Private
 */
router.get('/', getWishlist);

/**
 * @route   GET /api/v1/wishlist/count
 * @desc    Get user's wishlist count
 * @access  Private
 */
router.get('/count', getWishlistCount);

// Validation schemas
const productIdBodySchema = Joi.object({
  productId: Joi.number().integer().positive().required().messages({
    'number.positive': 'Product ID must be a positive number',
    'any.required': 'Product ID is required',
  }),
});

const productIdParamSchema = Joi.object({
  productId: Joi.number().integer().positive().required().messages({
    'number.positive': 'Product ID must be a positive number',
    'any.required': 'Product ID is required',
  }),
});

/**
 * @route   POST /api/v1/wishlist
 * @desc    Add product to wishlist
 * @access  Private
 */
router.post(
  '/',
  validate(productIdBodySchema),
  addToWishlist
);

/**
 * @route   POST /api/v1/wishlist/toggle
 * @desc    Toggle product in wishlist (add/remove)
 * @access  Private
 */
router.post(
  '/toggle',
  validate(productIdBodySchema),
  toggleWishlist
);

/**
 * @route   DELETE /api/v1/wishlist/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
router.delete(
  '/:productId',
  validate(productIdParamSchema, 'params'),
  removeFromWishlist
);

/**
 * @route   GET /api/v1/wishlist/check/:productId
 * @desc    Check if product is in user's wishlist
 * @access  Private
 */
router.get(
  '/check/:productId',
  validate(productIdParamSchema, 'params'),
  checkWishlistStatus
);

export default router;