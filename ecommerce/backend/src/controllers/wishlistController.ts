import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import Wishlist from '../models/Wishlist';
import Product from '../models/Product';

/**
 * Get user's wishlist
 */
export const getWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const wishlistItems = await Wishlist.getUserWishlist(userId);
  const totalItems = await Wishlist.getWishlistCount(userId);

  const response: ApiResponse<any> = {
    success: true,
    message: 'Wishlist retrieved successfully',
    data: {
      items: wishlistItems,
      totalItems,
    },
  };

  res.json(response);
});

/**
 * Add product to wishlist
 */
export const addToWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { productId } = req.body;

  if (!productId) {
    throw new ValidationError('Product ID is required');
  }

  // Check if product exists and is active
  const product = await Product.findOne({
    where: { id: productId, isActive: true },
  });

  if (!product) {
    throw new NotFoundError('Product not found or inactive');
  }

  // Add to wishlist
  const wishlistItem = await Wishlist.addToWishlist(userId, productId);

  const response: ApiResponse<any> = {
    success: true,
    message: 'Product added to wishlist successfully',
    data: wishlistItem,
  };

  res.status(201).json(response);
});

/**
 * Remove product from wishlist
 */
export const removeFromWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { productId } = req.params;

  if (!productId) {
    throw new ValidationError('Product ID is required');
  }

  const removed = await Wishlist.removeFromWishlist(userId, parseInt(productId));

  if (!removed) {
    throw new NotFoundError('Product not found in wishlist');
  }

  const response: ApiResponse<any> = {
    success: true,
    message: 'Product removed from wishlist successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Toggle product in wishlist (add if not present, remove if present)
 */
export const toggleWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { productId } = req.body;

  if (!productId) {
    throw new ValidationError('Product ID is required');
  }

  // Check if product exists and is active
  const product = await Product.findOne({
    where: { id: productId, isActive: true },
  });

  if (!product) {
    throw new NotFoundError('Product not found or inactive');
  }

  // Check if product is already in wishlist
  const isInWishlist = await Wishlist.isInWishlist(userId, productId);

  let message: string;
  let data: any = null;

  if (isInWishlist) {
    // Remove from wishlist
    await Wishlist.removeFromWishlist(userId, productId);
    message = 'Product removed from wishlist successfully';
  } else {
    // Add to wishlist
    data = await Wishlist.addToWishlist(userId, productId);
    message = 'Product added to wishlist successfully';
  }

  const response: ApiResponse<any> = {
    success: true,
    message,
    data: {
      isInWishlist: !isInWishlist,
      wishlistItem: data,
    },
  };

  res.json(response);
});

/**
 * Check if product is in user's wishlist
 */
export const checkWishlistStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { productId } = req.params;

  if (!productId) {
    throw new ValidationError('Product ID is required');
  }

  const isInWishlist = await Wishlist.isInWishlist(userId, parseInt(productId));

  const response: ApiResponse<any> = {
    success: true,
    message: 'Wishlist status retrieved successfully',
    data: {
      isInWishlist,
      productId: parseInt(productId),
    },
  };

  res.json(response);
});

/**
 * Get wishlist count for user
 */
export const getWishlistCount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const count = await Wishlist.getWishlistCount(userId);

  const response: ApiResponse<any> = {
    success: true,
    message: 'Wishlist count retrieved successfully',
    data: {
      count,
    },
  };

  res.json(response);
});