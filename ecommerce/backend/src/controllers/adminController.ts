import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { User, Product, Order, Review, Category } from '../models';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, AuthenticatedRequest } from '../types';

/**
 * Get dashboard statistics
 */
export const getDashboardStats = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Get total counts
  const totalProducts = await Product.count({ where: { isActive: true } });
  const totalOrders = await Order.count();
  const totalUsers = await User.count({ where: { role: 'customer' } });
  
  // Get total revenue (excluding cancelled orders)
  const totalRevenue = await Order.sum('total', {
    where: {
      status: { [Op.notIn]: ['cancelled'] },
    },
  }) || 0;

  // Get recent orders
  const recentOrders = await Order.findAll({
    order: [['createdAt', 'DESC']],
    limit: 5,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName'],
      },
    ],
    attributes: ['id', 'orderNumber', 'status', 'total', 'createdAt'],
  });

  // Get monthly sales data for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlySales = await Order.findAll({
    where: {
      createdAt: { [Op.gte]: sixMonthsAgo },
      status: { [Op.notIn]: ['cancelled'] },
    },
    attributes: [
      [Order.sequelize!.fn('DATE_FORMAT', Order.sequelize!.col('created_at'), '%Y-%m'), 'month'],
      [Order.sequelize!.fn('SUM', Order.sequelize!.col('total')), 'revenue'],
      [Order.sequelize!.fn('COUNT', Order.sequelize!.col('id')), 'orders'],
    ],
    group: [Order.sequelize!.fn('DATE_FORMAT', Order.sequelize!.col('created_at'), '%Y-%m')],
    order: [[Order.sequelize!.fn('DATE_FORMAT', Order.sequelize!.col('created_at'), '%Y-%m'), 'ASC']],
    raw: true,
  });

  // Get top selling products
  const topProducts = await Product.findAll({
    attributes: [
      'id',
      'name',
      'price',
      'stock',
      [Product.sequelize!.literal('(SELECT COUNT(*) FROM order_items WHERE order_items.product_id = Product.id)'), 'totalSold'],
    ],
    order: [[Product.sequelize!.literal('totalSold'), 'DESC']],
    limit: 5,
    where: { isActive: true },
  });

  // Get order status distribution
  const orderStatusStats = await Order.findAll({
    attributes: [
      'status',
      [Order.sequelize!.fn('COUNT', Order.sequelize!.col('id')), 'count'],
    ],
    group: ['status'],
    raw: true,
  });

  // Get low stock products (stock < 10)
  const lowStockProducts = await Product.findAll({
    where: {
      stock: { [Op.lt]: 10 },
      isActive: true,
    },
    attributes: ['id', 'name', 'stock', 'sku'],
    order: [['stock', 'ASC']],
    limit: 10,
  });

  const dashboardData = {
    totalProducts,
    totalOrders,
    totalUsers,
    totalRevenue: Number(totalRevenue),
    recentOrders,
    monthlySales,
    topProducts,
    orderStatusStats,
    lowStockProducts,
  };

  const response: ApiResponse<any> = {
    success: true,
    message: 'Dashboard statistics retrieved successfully',
    data: dashboardData,
  };

  res.json(response);
});

/**
 * Get sales data for analytics
 */
export const getSalesData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { period = '30d', startDate, endDate } = req.query;

  let dateFilter: any = {};
  
  if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      },
    };
  } else {
    // Default period filters
    const now = new Date();
    let daysBack = 30;
    
    switch (period) {
      case '7d':
        daysBack = 7;
        break;
      case '30d':
        daysBack = 30;
        break;
      case '90d':
        daysBack = 90;
        break;
      case '1y':
        daysBack = 365;
        break;
      default:
        daysBack = 30;
    }
    
    const startPeriod = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    dateFilter = {
      createdAt: { [Op.gte]: startPeriod },
    };
  }

  // Get daily sales data
  const dailySales = await Order.findAll({
    where: {
      ...dateFilter,
      status: { [Op.notIn]: ['cancelled'] },
    },
    attributes: [
      [Order.sequelize!.fn('DATE', Order.sequelize!.col('createdAt')), 'date'],
      [Order.sequelize!.fn('DATE', Order.sequelize!.col('created_at')), 'date'],
      [Order.sequelize!.fn('COUNT', Order.sequelize!.col('id')), 'orders'],
    ],
    group: [Order.sequelize!.fn('DATE', Order.sequelize!.col('created_at'))],
    order: [[Order.sequelize!.fn('DATE', Order.sequelize!.col('created_at')), 'ASC']],
    raw: true,
  });

  // Get category sales
  const categorySales = await Order.findAll({
    where: {
      ...dateFilter,
      status: { [Op.notIn]: ['cancelled'] },
    },
    include: [
      {
        model: Order.sequelize!.models.OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
      },
    ],
    attributes: [],
  });

  const salesData = {
    period,
    dailySales,
    categorySales: [], // This would need more complex processing
  };

  const response: ApiResponse<any> = {
    success: true,
    message: 'Sales data retrieved successfully',
    data: salesData,
  };

  res.json(response);
});

/**
 * Get general analytics data
 */
export const getAnalyticsData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Get user registration trends
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const userRegistrations = await User.findAll({
    where: {
      createdAt: { [Op.gte]: thirtyDaysAgo },
      role: 'customer',
    },
    attributes: [
      [User.sequelize!.fn('DATE', User.sequelize!.col('created_at')), 'date'],
      [User.sequelize!.fn('COUNT', User.sequelize!.col('id')), 'registrations'],
    ],
    group: [User.sequelize!.fn('DATE', User.sequelize!.col('created_at'))],
    order: [[User.sequelize!.fn('DATE', User.sequelize!.col('created_at')), 'ASC']],
    raw: true,
  });

  // Get product performance
  const productPerformance = await Product.findAll({
    attributes: [
      'id',
      'name',
      'price',
      'stock',
      'views', // Assuming this field exists
      [Product.sequelize!.literal('(SELECT COUNT(*) FROM reviews WHERE reviews.product_id = Product.id)'), 'reviewCount'],
      [Product.sequelize!.literal('(SELECT AVG(rating) FROM reviews WHERE reviews.product_id = Product.id)'), 'averageRating'],
    ],
    where: { isActive: true },
    order: [['createdAt', 'DESC']],
    limit: 20,
  });

  // Get review statistics
  const reviewStats = await Review.findAll({
    attributes: [
      'rating',
      [Review.sequelize!.fn('COUNT', Review.sequelize!.col('id')), 'count'],
    ],
    group: ['rating'],
    order: [['rating', 'ASC']],
    raw: true,
  });

  const analyticsData = {
    userRegistrations,
    productPerformance,
    reviewStats,
  };

  const response: ApiResponse<any> = {
    success: true,
    message: 'Analytics data retrieved successfully',
    data: analyticsData,
  };

  res.json(response);
});