import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Review, Product, User, Order, OrderItem } from '../models';
import {
  asyncHandler,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../middleware/errorHandler';
import {
  AuthenticatedRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types';

/**
 * Get reviews for a product
 */
export const getProductReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { productId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = 'newest',
    rating,
    verified,
  } = req.query;

  // Verify product exists
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Build where conditions
  const whereConditions: any = {
    productId,
    isApproved: true,
  };
  
  if (rating) {
    whereConditions.rating = parseInt(rating as string);
  }
  
  if (verified !== undefined) {
    whereConditions.isVerified = verified === 'true';
  }

  // Build order conditions
  let orderConditions: any[];
  switch (sortBy) {
    case 'oldest':
      orderConditions = [['createdAt', 'ASC']];
      break;
    case 'rating_high':
      orderConditions = [['rating', 'DESC'], ['createdAt', 'DESC']];
      break;
    case 'rating_low':
      orderConditions = [['rating', 'ASC'], ['createdAt', 'DESC']];
      break;
    case 'helpful':
      orderConditions = [['helpfulCount', 'DESC'], ['createdAt', 'DESC']];
      break;
    case 'newest':
    default:
      orderConditions = [['createdAt', 'DESC']];
      break;
  }

  // Calculate pagination
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  // Fetch reviews
  const { count, rows: reviews } = await Review.findAndCountAll({
    where: whereConditions,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'avatar'],
      },
    ],
    order: orderConditions,
    limit: parseInt(limit as string),
    offset,
  });

  // Get rating distribution
  const _ratingDistribution = await Review.getRatingDistribution(parseInt(productId));

  // Calculate pagination info
  const totalPages = Math.ceil(count / parseInt(limit as string));
  const hasNextPage = parseInt(page as string) < totalPages;
  const hasPrevPage = parseInt(page as string) > 1;

  const response: PaginatedResponse<any> = {
    data: reviews,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: count,
      totalPages,
      hasNext: hasNextPage,
      hasPrev: hasPrevPage,
    },
  };

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'Product reviews retrieved successfully',
    data: response,
  };

  res.json(_apiResponse);
});

/**
 * Get user's reviews
 */
export const getUserReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const {
    page = 1,
    limit = 10,
    sortBy = 'newest',
  } = req.query;

  // Build order conditions
  let orderConditions: any[];
  switch (sortBy) {
    case 'oldest':
      orderConditions = [['createdAt', 'ASC']];
      break;
    case 'rating_high':
      orderConditions = [['rating', 'DESC'], ['createdAt', 'DESC']];
      break;
    case 'rating_low':
      orderConditions = [['rating', 'ASC'], ['createdAt', 'DESC']];
      break;
    case 'newest':
    default:
      orderConditions = [['createdAt', 'DESC']];
      break;
  }

  // Calculate pagination
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  // Fetch reviews
  const { count, rows: reviews } = await Review.findAndCountAll({
    where: { userId },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'images'],
      },
    ],
    order: orderConditions,
    limit: parseInt(limit as string),
    offset,
  });

  // Calculate pagination info
  const totalPages = Math.ceil(count / parseInt(limit as string));
  const hasNextPage = parseInt(page as string) < totalPages;
  const hasPrevPage = parseInt(page as string) > 1;

  const response: PaginatedResponse<any> = {
    data: reviews,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: count,
      totalPages,
      hasNext: hasNextPage,
      hasPrev: hasPrevPage,
    },
  };

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'User reviews retrieved successfully',
    data: response,
  };

  res.json(_apiResponse);
});

/**
 * Get single review
 */
export const getReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const review = await Review.findOne({
    where: {
      id,
      isApproved: true,
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'avatar'],
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'images'],
      },
    ],
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'Review retrieved successfully',
    data: review,
  };

  res.json(_apiResponse);
});

/**
 * Create a new review
 */
export const createReview = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { productId, rating, title, comment } = req.body;

  // Verify product exists
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check if user has already reviewed this product
  const existingReview = await Review.hasUserReviewed(userId, productId);
  if (existingReview) {
    throw new ConflictError('You have already reviewed this product');
  }

  // Check if user has purchased this product (for verified reviews)
  const hasPurchased = await OrderItem.findOne({
    include: [
      {
        model: Order,
        as: 'order',
        where: {
          userId,
          status: 'delivered',
        },
      },
    ],
    where: {
      productId,
    },
  });

  // Create review
  const review = await Review.create({
    userId,
    productId,
    rating,
    title,
    comment,
    isVerified: !!hasPurchased,
    isApproved: true, // Auto-approve for now, can be changed to require moderation
  });

  // Fetch created review with associations
  const createdReview = await Review.findByPk(review.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'avatar'],
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug'],
      },
    ],
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Review created successfully',
    data: createdReview,
  };

  res.status(201).json(response);
});

/**
 * Update a review
 */
export const updateReview = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { rating, title, comment } = req.body;

  const review = await Review.findOne({
    where: {
      id,
      userId, // Users can only update their own reviews
    },
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  // Update review
  await review.update({
    rating,
    title,
    comment,
    isApproved: true, // Re-approve after update
  });

  // Fetch updated review with associations
  const updatedReview = await Review.findByPk(review.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'avatar'],
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug'],
      },
    ],
  });

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'Review updated successfully',
    data: updatedReview,
  };

  res.json(_apiResponse);
});

/**
 * Delete a review
 */
export const deleteReview = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Build where conditions (users can only delete their own reviews, admins can delete any)
  const whereConditions: any = { id };
  if (userRole !== 'admin') {
    whereConditions.userId = userId;
  }

  const review = await Review.findOne({
    where: whereConditions,
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  await review.destroy();

  const _response: ApiResponse<null> = {
    success: true,
    message: 'Review deleted successfully',
    data: null,
  };

  res.json(_response);
});

/**
 * Mark review as helpful
 */
export const markReviewHelpful = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const review = await Review.findByPk(id);
  if (!review) {
    throw new NotFoundError('Review not found');
  }

  await review.markAsHelpful();

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'Review marked as helpful',
    data: {
      id: review.id,
      helpfulCount: review.helpfulCount,
    },
  };

  res.json(_apiResponse);
});

/**
 * Get all reviews (Admin only)
 */
export const getAllReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'newest',
    status,
  } = req.query;

  // Build order conditions
  let orderConditions: any[];
  switch (sortBy) {
    case 'oldest':
      orderConditions = [['createdAt', 'ASC']];
      break;
    case 'rating_high':
      orderConditions = [['rating', 'DESC'], ['createdAt', 'DESC']];
      break;
    case 'rating_low':
      orderConditions = [['rating', 'ASC'], ['createdAt', 'DESC']];
      break;
    case 'newest':
    default:
      orderConditions = [['createdAt', 'DESC']];
      break;
  }

  // Build where conditions based on status filter
  const whereConditions: any = {};
  if (status === 'pending') {
    whereConditions.isApproved = false;
  } else if (status === 'approved') {
    whereConditions.isApproved = true;
  }
  // If no status filter, get all reviews

  // Calculate pagination
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  // Fetch all reviews (bypass default scope that filters for approved only)
  const { count, rows: reviews } = await Review.unscoped().findAndCountAll({
    where: whereConditions,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug'],
      },
    ],
    order: orderConditions,
    limit: parseInt(limit as string),
    offset,
  });

  // Calculate pagination info
  const totalPages = Math.ceil(count / parseInt(limit as string));
  const hasNextPage = parseInt(page as string) < totalPages;
  const hasPrevPage = parseInt(page as string) > 1;

  const response: PaginatedResponse<any> = {
    data: reviews,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: count,
      totalPages,
      hasNext: hasNextPage,
      hasPrev: hasPrevPage,
    },
  };

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'All reviews retrieved successfully',
    data: response,
  };

  res.json(response);
});

/**
 * Get pending reviews (Admin only)
 */
export const getPendingReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'newest',
  } = req.query;

  // Build order conditions
  let orderConditions: any[];
  switch (sortBy) {
    case 'oldest':
      orderConditions = [['createdAt', 'ASC']];
      break;
    case 'rating_high':
      orderConditions = [['rating', 'DESC'], ['createdAt', 'DESC']];
      break;
    case 'rating_low':
      orderConditions = [['rating', 'ASC'], ['createdAt', 'DESC']];
      break;
    case 'newest':
    default:
      orderConditions = [['createdAt', 'DESC']];
      break;
  }

  // Calculate pagination
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  // Fetch pending reviews
  const { count, rows: reviews } = await Review.findAndCountAll({
    where: {
      isApproved: false,
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug'],
      },
    ],
    order: orderConditions,
    limit: parseInt(limit as string),
    offset,
  });

  // Calculate pagination info
  const totalPages = Math.ceil(count / parseInt(limit as string));
  const hasNextPage = parseInt(page as string) < totalPages;
  const hasPrevPage = parseInt(page as string) > 1;

  const response: PaginatedResponse<any> = {
    data: reviews,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: count,
      totalPages,
      hasNext: hasNextPage,
      hasPrev: hasPrevPage,
    },
  };

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'Pending reviews retrieved successfully',
    data: response,
  };

  res.json(response);
});

/**
 * Approve/Reject review (Admin only)
 */
export const moderateReview = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { action, reason: _reason } = req.body; // action: 'approve' | 'reject'

  const review = await Review.findByPk(id);
  if (!review) {
    throw new NotFoundError('Review not found');
  }

  if (action === 'approve') {
    await review.approve();
  } else if (action === 'reject') {
    await review.reject();
  } else {
    throw new ValidationError('Invalid action. Must be "approve" or "reject"');
  }

  const response: ApiResponse<any> = {
    success: true,
    message: `Review ${action}d successfully`,
    data: review,
  };

  res.json(response);
});

/**
 * Get review statistics (Admin only)
 */
export const getReviewStats = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { period = '30d' } = req.query;

  // Calculate date range
  let startDate: Date;
  switch (period) {
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get review statistics
  const totalReviews = await Review.count({
    where: {
      createdAt: { [Op.gte]: startDate },
    },
  });

  const approvedReviews = await Review.count({
    where: {
      createdAt: { [Op.gte]: startDate },
      isApproved: true,
    },
  });

  const pendingReviews = await Review.count({
    where: {
      isApproved: false,
    },
  });

  const verifiedReviews = await Review.count({
    where: {
      createdAt: { [Op.gte]: startDate },
      isVerified: true,
    },
  });

  const averageRating = await Review.findOne({
    where: {
      createdAt: { [Op.gte]: startDate },
      isApproved: true,
    },
    attributes: [
      [Review.sequelize!.fn('AVG', Review.sequelize!.col('rating')), 'average'],
    ],
    raw: true,
  });

  const ratingDistribution = await Review.findAll({
    where: {
      createdAt: { [Op.gte]: startDate },
      isApproved: true,
    },
    attributes: [
      'rating',
      [Review.sequelize!.fn('COUNT', Review.sequelize!.col('id')), 'count'],
    ],
    group: ['rating'],
    order: [['rating', 'ASC']],
    raw: true,
  });

  const stats = {
    period,
    totalReviews,
    approvedReviews,
    pendingReviews,
    verifiedReviews,
    averageRating: (averageRating as any)?.average || 0,
    ratingDistribution,
    approvalRate: totalReviews > 0 ? (approvedReviews / totalReviews) * 100 : 0,
    verificationRate: totalReviews > 0 ? (verifiedReviews / totalReviews) * 100 : 0,
  };

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'Review statistics retrieved successfully',
    data: stats,
  };

  res.json(_apiResponse);
});

export default {
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
};