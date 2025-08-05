import { Response } from 'express';
import { Op } from 'sequelize';
// @ts-ignore
import bcrypt from 'bcryptjs';
// Add type declaration for bcryptjs
// Instead of augmenting the bcryptjs module, we should install @types/bcryptjs
// npm install --save-dev @types/bcryptjs
import { User, Order, Review } from '../models';
import {
  asyncHandler,
  NotFoundError,
  ValidationError,
  ConflictError,
  AuthorizationError,
} from '../middleware/errorHandler';
import {
  AuthenticatedRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types';
import { getFileUrl } from '../middleware/upload';

/**
 * Get user profile
 */
export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const response: ApiResponse<any> = {
    success: true,
    message: 'Profile retrieved successfully',
    data: user,
  };

  res.json(response);
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const {
    firstName,
    lastName,
    phone: _phone,
    dateOfBirth: _dateOfBirth,
    gender: _gender,
    addresses: _addresses,
    preferences: _preferences,
  } = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Update user profile
  await user.update({
    firstName,
    lastName,
    // Note: phone, dateOfBirth, gender, addresses, preferences not implemented in User model yet
  });

  // Return updated user without password
  const updatedUser = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser,
  };

  res.json(response);
});

/**
 * Change password
 */
export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new ValidationError('Current password is incorrect');
  }

  // Hash new password
  const saltRounds = 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await user.update({ password: hashedNewPassword });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Password changed successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Update user avatar
 */
export const updateAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  
  if (!req.file) {
    throw new ValidationError('Avatar file is required');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Generate the file URL
  const avatarUrl = getFileUrl(req.file.path);

  // Update user avatar
  await user.update({ avatar: avatarUrl });

  // Get updated user data
  const updatedUser = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Avatar updated successfully',
    data: updatedUser,
  };

  res.json(response);
});

/**
 * Get user dashboard data
 */
export const getDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  // Get user's recent orders
  const recentOrders = await Order.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 5,
    attributes: ['id', 'orderNumber', 'status', 'total', 'createdAt'],
  });

  // Get order statistics
  const totalOrders = await Order.count({ where: { userId } });
  const totalSpent = await Order.sum('total', {
    where: {
      userId,
      status: { [Op.notIn]: ['cancelled'] },
    },
  }) || 0;

  // Get review statistics
  const totalReviews = await Review.count({ where: { userId } });
  const averageRating = await Review.findOne({
    where: { userId },
    attributes: [
      [Review.sequelize!.fn('AVG', Review.sequelize!.col('rating')), 'average'],
    ],
    raw: true,
  });

  // Get recent reviews
  const recentReviews = await Review.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 3,
    include: [
      {
        model: User.sequelize!.models.Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'images'],
      },
    ],
  });

  const dashboardData = {
    user: {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
    },
    orders: {
      total: totalOrders,
      totalSpent,
      recent: recentOrders,
    },
    reviews: {
      total: totalReviews,
      averageRating: (averageRating as any)?.average || 0,
      recent: recentReviews,
    },
  };

  const response: ApiResponse<any> = {
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: dashboardData,
  };

  res.json(response);
});

/**
 * Delete user account
 */
export const deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { password, reason: _reason } = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ValidationError('Password is incorrect');
  }

  // Check for pending orders
  const pendingOrders = await Order.count({
    where: {
      userId,
      status: { [Op.in]: ['pending', 'confirmed', 'processing', 'shipped'] },
    },
  });

  if (pendingOrders > 0) {
    throw new ConflictError('Cannot delete account with pending orders');
  }

  // Soft delete user (deactivate)
  await user.update({
    isActive: false,
    email: `deleted_${Date.now()}_${user.email}`,
  });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Account deleted successfully',
    data: null,
  };

  res.json(response);
});

// Admin-only functions

/**
 * Get all users (Admin only)
 */
export const getAllUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    role,
    isActive,
    search,
    page = 1,
    limit = 20,
    sortBy = 'newest',
    sortOrder = 'desc',
  } = req.query;

  // Build where conditions
  const whereConditions: any = {};
  
  if (role) {
    whereConditions.role = role;
  }
  
  if (isActive !== undefined) {
    whereConditions.isActive = isActive === 'true';
  }
  
  if (search) {
    whereConditions[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Build order conditions
  let orderConditions: any[];
  switch (sortBy) {
    case 'name':
      orderConditions = [['firstName', (sortOrder as string).toUpperCase()]];
      break;
    case 'email':
      orderConditions = [['email', (sortOrder as string).toUpperCase()]];
      break;
    case 'role':
      orderConditions = [['role', (sortOrder as string).toUpperCase()]];
      break;
    case 'oldest':
      orderConditions = [['createdAt', 'ASC']];
      break;
    case 'newest':
    default:
      orderConditions = [['createdAt', (sortOrder as string).toUpperCase()]];
      break;
  }

  // Calculate pagination
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  // Fetch users with order and review counts
  const { count, rows: users } = await User.findAndCountAll({
    where: whereConditions,
    attributes: {
      exclude: ['password'],
      include: [
        [
          User.sequelize!.literal('(SELECT COUNT(*) FROM orders WHERE orders.user_id = User.id)'),
          'orderCount'
        ],
        [
          User.sequelize!.literal('(SELECT COUNT(*) FROM reviews WHERE reviews.user_id = User.id)'),
          'reviewCount'
        ]
      ]
    },
    order: orderConditions,
    limit: parseInt(limit as string),
    offset,
  });

  // Transform users to include _count structure expected by frontend
  const transformedUsers = users.map(user => {
    const userData = user.toJSON() as any;
    return {
      ...userData,
      _count: {
        orders: userData.orderCount || 0,
        reviews: userData.reviewCount || 0
      }
    };
  });

  // Calculate pagination info
  const totalPages = Math.ceil(count / parseInt(limit as string));
  const hasNextPage = parseInt(page as string) < totalPages;
  const hasPrevPage = parseInt(page as string) > 1;

  const response: PaginatedResponse<any> = {
    data: transformedUsers,
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
    message: 'Users retrieved successfully',
    data: response,
  };

  res.json(_apiResponse);
});

/**
 * Get single user (Admin only)
 */
export const getUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] },
    include: [
      {
        model: Order,
        as: 'orders',
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'orderNumber', 'status', 'total', 'createdAt'],
      },
      {
        model: Review,
        as: 'reviews',
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'rating', 'title', 'createdAt'],
      },
    ],
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Get user statistics
  const totalOrders = await Order.count({ where: { userId: id } });
  const totalSpent = await Order.sum('total', {
    where: {
      userId: id,
      status: { [Op.notIn]: ['cancelled'] },
    },
  }) || 0;
  const totalReviews = await Review.count({ where: { userId: id } });

  const userData = {
    ...user.toJSON(),
    statistics: {
      totalOrders,
      totalSpent,
      totalReviews,
    },
  };

  const response: ApiResponse<any> = {
    success: true,
    message: 'User retrieved successfully',
    data: userData,
  };

  res.json(response);
});

/**
 * Update user (Admin only)
 */
export const updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    email,
    role,
    isActive,
    emailVerified,
  } = req.body;

  const user = await User.findByPk(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }
  }

  // Update user
  await user.update({
    firstName,
    lastName,
    email,
    role,
    isActive,
    emailVerified,
  });

  // Return updated user without password
  const updatedUser = await User.findByPk(id, {
    attributes: { exclude: ['password'] },
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'User updated successfully',
    data: updatedUser,
  };

  res.json(response);
});

/**
 * Delete user (Admin only)
 */
export const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { force = false } = req.query;

  const user = await User.findByPk(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Prevent deleting admin users
  if (user.role === 'admin') {
    throw new AuthorizationError('Cannot delete admin users');
  }

  // Check for pending orders
  const pendingOrders = await Order.count({
    where: {
      userId: id,
      status: { [Op.in]: ['pending', 'confirmed', 'processing', 'shipped'] },
    },
  });

  if (pendingOrders > 0 && !force) {
    throw new ConflictError('Cannot delete user with pending orders. Use force=true to override.');
  }

  if (force === 'true') {
    // Hard delete
    await user.destroy();
  } else {
    // Soft delete
    await user.update({
      isActive: false,
      email: `deleted_${Date.now()}_${user.email}`,
    });
  }

  const response: ApiResponse<null> = {
    success: true,
    message: 'User deleted successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Get user statistics (Admin only)
 */
export const getUserStats = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

  // Get user statistics
  const totalUsers = await User.count();
  const activeUsers = await User.count({ where: { isActive: true } });
  const newUsersThisMonth = await User.count({
    where: {
      createdAt: { [Op.gte]: startDate },
    },
  });

  const adminUsers = await User.count({ where: { role: 'admin' } });

  const usersByRole = await User.findAll({
    attributes: [
      'role',
      [User.sequelize!.fn('COUNT', User.sequelize!.col('id')), 'count'],
    ],
    group: ['role'],
    raw: true,
  });

  const verifiedUsers = await User.count({ where: { emailVerified: true } });

  // Get registration trend
  const registrationTrend = await User.findAll({
    where: {
      createdAt: { [Op.gte]: startDate },
    },
    attributes: [
      [User.sequelize!.fn('DATE', User.sequelize!.col('created_at')), 'date'],
      [User.sequelize!.fn('COUNT', User.sequelize!.col('id')), 'registrations'],
    ],
    group: [User.sequelize!.fn('DATE', User.sequelize!.col('created_at'))],
    order: [[User.sequelize!.fn('DATE', User.sequelize!.col('created_at')), 'ASC']],
    raw: true,
  });

  const stats = {
    period,
    totalUsers,
    activeUsers,
    adminUsers,
    newUsersThisMonth,
    verifiedUsers,
    usersByRole,
    registrationTrend,
    activeRate: totalUsers > 0 ? (Number(activeUsers) / Number(totalUsers)) * 100 : 0,
    verificationRate: totalUsers > 0 ? (Number(verifiedUsers) / Number(totalUsers)) * 100 : 0,
  };

  const response: ApiResponse<any> = {
    success: true,
    message: 'User statistics retrieved successfully',
    data: stats,
  };

  res.json(response);
});

/**
 * Create new user (Admin only)
 */
export const createUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { firstName, lastName, email, password, role = 'customer', isActive = true, emailVerified = false } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Create new user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    isActive,
    emailVerified,
  });

  // Remove sensitive data from response
  const userResponse = user.toJSON();
  delete userResponse.password;
  delete userResponse.otpCode;
  delete userResponse.otpExpires;
  delete userResponse.passwordResetOtp;
  delete userResponse.passwordResetOtpExpires;

  const response: ApiResponse<any> = {
    success: true,
    message: 'User created successfully',
    data: userResponse,
  };

  res.status(201).json(response);
});

export default {
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
};