import { Response } from 'express';
import { CartItem, Product, Category } from '../models';
import {
  asyncHandler,
  NotFoundError,
  ValidationError,
} from '../middleware/errorHandler';
import {
  AuthenticatedRequest,
  ApiResponse,
} from '../types';

/**
 * Get user's cart items
 */
export const getCart = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'] as string;

  let cartItems: any[];
  if (userId) {
    cartItems = await CartItem.findByUser(userId);
  } else if (sessionId) {
    cartItems = await CartItem.findBySession(sessionId);
  } else {
    cartItems = [];
  }

  // Get cart summary
  const summary = await CartItem.getCartSummary(userId, sessionId);

  const response: ApiResponse<{ items: any[]; summary: any }> = {
    success: true,
    message: 'Cart retrieved successfully',
    data: {
      items: cartItems,
      summary,
    },
  };

  res.json(response);
});

/**
 * Add item to cart
 */
export const addToCart = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'] as string;

  if (!userId && !sessionId) {
    throw new ValidationError('User ID or session ID is required');
  }

  // Verify product exists and is active
  const product = await Product.findByPk(productId);
  if (!product || !product.isActive) {
    throw new NotFoundError('Product not found or inactive');
  }

  // Check stock availability
  if (product.stock < quantity) {
    throw new ValidationError(`Only ${product.stock} items available in stock`);
  }

  // Check if item already exists in cart
  const existingItem = await CartItem.findOne({
    where: {
      ...(userId ? { userId } : { sessionId }),
      productId,
    },
  });

  let cartItem;
  if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + quantity;
      
      // Check stock for new quantity
      if (product.stock < newQuantity) {
        throw new ValidationError(`Only ${product.stock} items available in stock`);
      }

      await existingItem.updateQuantity(newQuantity);
      cartItem = existingItem;
  } else {
      // Create new cart item
      cartItem = await CartItem.addItem(
        productId,
        quantity,
        userId,
        userId ? undefined : sessionId  // Only pass sessionId if no userId
      );
    }

  // Fetch updated cart item with product details
  const updatedItem = await CartItem.findByPk(cartItem.id, {
    include: [
      {
        model: Product,
        as: 'product',
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug'],
          },
        ],
      },
    ],
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Item added to cart successfully',
    data: updatedItem,
  };

  res.status(201).json(response);
});

/**
 * Update cart item quantity
 */
export const updateCartItem = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { quantity } = req.body;
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'] as string;

  if (quantity < 0) {
    throw new ValidationError('Quantity cannot be negative');
  }

  // Find cart item
  const cartItem = await CartItem.findOne({
    where: {
      id,
      ...(userId ? { userId } : { sessionId }),
    },
    include: [
      {
        model: Product,
        as: 'product',
      },
    ],
  });

  if (!cartItem) {
    throw new NotFoundError('Cart item not found');
  }

  // If quantity is 0, remove the item
  if (quantity === 0) {
    await cartItem.destroy();
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Item removed from cart successfully',
      data: null,
    };
    
    res.json(response);
    return;
  }

  // Check stock availability
  if (cartItem.product.stock < quantity) {
    throw new ValidationError(`Only ${cartItem.product.stock} items available in stock`);
  }

  // Update quantity
  await cartItem.updateQuantity(quantity);
  
  // Reload the cart item to get updated data
  const updatedItem = await CartItem.findByPk(cartItem.id, {
    include: [
      {
        model: Product,
        as: 'product',
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug'],
          },
        ],
      },
    ],
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Cart item updated successfully',
    data: updatedItem,
  };

  res.json(response);
});

/**
 * Remove item from cart
 */
export const removeFromCart = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'] as string;

  // Find and remove cart item
  const cartItem = await CartItem.findOne({
    where: {
      id,
      ...(userId ? { userId } : { sessionId }),
    },
  });

  if (!cartItem) {
    throw new NotFoundError('Cart item not found');
  }

  await cartItem.destroy();

  const response: ApiResponse<null> = {
    success: true,
    message: 'Item removed from cart successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Clear entire cart
 */
export const clearCart = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'] as string;

  if (!userId && !sessionId) {
    throw new ValidationError('User ID or session ID is required');
  }

  await CartItem.clearCart(userId, sessionId);

  const response: ApiResponse<null> = {
    success: true,
    message: 'Cart cleared successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Get cart summary (totals, counts, etc.)
 */
export const getCartSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'] as string;

  const summary = await CartItem.getCartSummary(userId, sessionId);

  const response: ApiResponse<any> = {
    success: true,
    message: 'Cart summary retrieved successfully',
    data: summary,
  };

  res.json(response);
});

/**
 * Merge session cart with user cart (when user logs in)
 */
export const mergeCart = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { sessionId } = req.body;

  if (!userId) {
    throw new ValidationError('User must be authenticated');
  }

  if (!sessionId) {
    throw new ValidationError('Session ID is required');
  }

  await CartItem.mergeSessionCart(sessionId, userId);

  // Get updated cart
  const cartItems = await CartItem.findByUser(userId);
  const summary = await CartItem.getCartSummary(userId);

  const response: ApiResponse<{ items: any[]; summary: any }> = {
    success: true,
    message: 'Cart merged successfully',
    data: {
      items: cartItems,
      summary,
    },
  };

  res.json(response);
});

/**
 * Validate cart items (check stock, prices, etc.)
 */
export const validateCart = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'] as string;

  let cartItems: any[];
  if (userId) {
    cartItems = await CartItem.findByUser(userId);
  } else if (sessionId) {
    cartItems = await CartItem.findBySession(sessionId);
  } else {
    cartItems = [];
  }

  const validationResults = {
    valid: true,
    issues: [] as any[],
    updatedItems: [] as any[],
  };

  for (const item of cartItems) {
    const product = item.product;
    let hasIssue = false;
    const issues = [];

    // Check if product is still active
    if (!product.isActive) {
      issues.push('Product is no longer available');
      hasIssue = true;
    }

    // Check stock availability
    if (product.stock < item.quantity) {
      if (product.stock === 0) {
        issues.push('Product is out of stock');
      } else {
        issues.push(`Only ${product.stock} items available`);
        // Update quantity to available stock
        await item.updateQuantity(product.stock);
        validationResults.updatedItems.push({
          id: item.id,
          oldQuantity: item.quantity,
          newQuantity: product.stock,
        });
      }
      hasIssue = true;
    }

    // Check if price has changed
    const currentPrice = product.getDisplayPrice();
    if (Math.abs(item.price - currentPrice) > 0.01) {
      issues.push(`Price has changed from $${item.price} to $${currentPrice}`);
      // Update price
      await item.updatePrice();
      validationResults.updatedItems.push({
        id: item.id,
        oldPrice: item.price,
        newPrice: currentPrice,
      });
      hasIssue = true;
    }

    if (hasIssue) {
      validationResults.valid = false;
      validationResults.issues.push({
        itemId: item.id,
        productId: product.id,
        productName: product.name,
        issues,
      });
    }
  }

  const response: ApiResponse<any> = {
    success: true,
    message: validationResults.valid ? 'Cart is valid' : 'Cart validation completed with issues',
    data: validationResults,
  };

  res.json(response);
});

/**
 * Apply coupon to cart
 */
export const applyCoupon = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { couponCode: _couponCode } = req.body;
  const _userId = req.user?.id;
  const _sessionId = req.sessionID || req.headers['x-session-id'] as string;

  // TODO: Implement coupon validation and application
  // This would involve:
  // 1. Validate coupon code
  // 2. Check if coupon is active and not expired
  // 3. Check if user is eligible for the coupon
  // 4. Calculate discount
  // 5. Apply discount to cart

  // For now, return a placeholder response
  const response: ApiResponse<any> = {
    success: false,
    message: 'Coupon functionality not implemented yet',
    data: null,
  };

  res.status(501).json(response);
});

/**
 * Remove coupon from cart
 */
export const removeCoupon = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const _userId = req.user?.id;
  const _sessionId = req.sessionID || req.headers['x-session-id'] as string;

  // TODO: Implement coupon removal
  // This would involve removing any applied discounts

  const response: ApiResponse<any> = {
    success: false,
    message: 'Coupon functionality not implemented yet',
    data: null,
  };

  res.status(501).json(response);
});

/**
 * Get cart item count
 */
export const getCartCount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'] as string;

  let count = 0;
  if (userId) {
    count = await CartItem.count({ where: { userId } });
  } else if (sessionId) {
    count = await CartItem.count({ where: { sessionId } });
  }

  const response: ApiResponse<{ count: number }> = {
    success: true,
    message: 'Cart count retrieved successfully',
    data: { count },
  };

  res.json(response);
});

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
  mergeCart,
  validateCart,
  applyCoupon,
  removeCoupon,
  getCartCount,
};