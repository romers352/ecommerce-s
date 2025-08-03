import { Request, Response } from 'express';
import { ValidationError, UniqueConstraintError } from 'sequelize';
import Newsletter from '../models/Newsletter';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import { AuthenticatedRequest } from '../types';
import { Parser } from 'json2csv';

/**
 * Subscribe to newsletter
 * @route POST /api/v1/newsletter/subscribe
 * @access Public
 */
export const subscribe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
      success: false,
      message: 'Email is required'
    });
    return;
  }

  try {
    // Check if email already exists
    const existingSubscription = await Newsletter.findByEmail(email);
    
    if (existingSubscription) {
      if (existingSubscription.isActive) {
        res.status(409).json({
          success: false,
          message: 'Email is already subscribed to our newsletter'
        });
        return;
      } else {
        // Reactivate subscription
        await existingSubscription.resubscribe();
        
        const response: ApiResponse<{ subscription: any }> = {
          success: true,
          message: 'Successfully resubscribed to newsletter',
          data: { subscription: existingSubscription }
        };
        
        res.status(200).json(response);
        return;
      }
    }

    // Create new subscription
    const subscription = await Newsletter.create({
      email,
      isActive: true,
      subscribedAt: new Date()
    });

    const response: ApiResponse<{ subscription: any }> = {
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: { subscription }
    };

    res.status(201).json(response);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
      return;
    }

    if (error instanceof UniqueConstraintError) {
      res.status(409).json({
        success: false,
        message: 'Email is already subscribed'
      });
      return;
    }

    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to newsletter'
    });
  }
});

/**
 * Unsubscribe from newsletter
 * @route POST /api/v1/newsletter/unsubscribe
 * @access Public
 */
export const unsubscribe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
      success: false,
      message: 'Email is required'
    });
    return;
  }

  try {
    const subscription = await Newsletter.findByEmail(email);
    
    if (!subscription) {
      res.status(404).json({
        success: false,
        message: 'Email not found in our newsletter list'
      });
      return;
    }

    if (!subscription.isActive) {
      res.status(400).json({
        success: false,
        message: 'Email is already unsubscribed'
      });
      return;
    }

    await subscription.unsubscribe();

    const response: ApiResponse<null> = {
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      data: null
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from newsletter'
    });
  }
});

/**
 * Get newsletter statistics (Admin only)
 * @route GET /api/v1/newsletter/stats
 * @access Private/Admin
 */
export const getStats = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalSubscribers = await Newsletter.getSubscriberCount();
    const totalSubscriptions = await Newsletter.count();
    const unsubscribedCount = totalSubscriptions - totalSubscribers;
    
    // Get recent subscriptions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSubscriptions = await Newsletter.count({
      where: {
        subscribedAt: {
          [require('sequelize').Op.gte]: thirtyDaysAgo
        },
        isActive: true
      }
    });

    const response: ApiResponse<{
      totalSubscribers: number;
      activeSubscribers: number;
      totalSubscriptions: number;
      unsubscribedCount: number;
      recentSubscriptions: number;
    }> = {
      success: true,
      message: 'Newsletter statistics retrieved successfully',
      data: {
        totalSubscribers,
        activeSubscribers: totalSubscribers, // Active subscribers is the same as total subscribers
        totalSubscriptions,
        unsubscribedCount,
        recentSubscriptions
      }
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Newsletter stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve newsletter statistics'
    });
  }
});

/**
 * Get all newsletter subscribers (Admin only)
 * @route GET /api/v1/newsletter/subscribers
 * @access Private/Admin
 */
export const getSubscribers = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const status = req.query.status as string; // 'active', 'inactive', or 'all'

    let whereClause: any = {};
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }
    // If status is 'all' or undefined, don't add where clause

    const { count, rows: subscribers } = await Newsletter.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['subscribedAt', 'DESC']],
      attributes: ['id', 'email', 'isActive', 'subscribedAt', 'unsubscribedAt', 'createdAt']
    });

    const response: ApiResponse<{
      subscribers: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }> = {
      success: true,
      message: 'Newsletter subscribers retrieved successfully',
      data: {
        subscribers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      }
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Newsletter subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve newsletter subscribers'
    });
  }
});

/**
 * Delete a newsletter subscriber (Admin only)
 * @route DELETE /api/v1/newsletter/subscribers/:id
 * @access Private/Admin
 */
export const deleteSubscriber = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const subscriber = await Newsletter.findByPk(id);
    
    if (!subscriber) {
      res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
      return;
    }

    await subscriber.destroy();

    const response: ApiResponse<null> = {
      success: true,
      message: 'Subscriber deleted successfully',
      data: null
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Delete subscriber error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subscriber'
    });
  }
});

/**
 * Export newsletter subscribers as CSV (Admin only)
 * @route GET /api/v1/newsletter/export
 * @access Private/Admin
 */
export const exportSubscribers = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string; // 'active', 'inactive', or 'all'

    let whereClause: any = {};
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    const subscribers = await Newsletter.findAll({
      where: whereClause,
      order: [['subscribedAt', 'DESC']],
      attributes: ['id', 'email', 'isActive', 'subscribedAt', 'unsubscribedAt', 'createdAt']
    });

    const fields = [
      {
        label: 'ID',
        value: 'id'
      },
      {
        label: 'Email',
        value: 'email'
      },
      {
        label: 'Status',
        value: (row: any) => row.isActive ? 'Active' : 'Unsubscribed'
      },
      {
        label: 'Subscribed Date',
        value: (row: any) => row.subscribedAt ? new Date(row.subscribedAt).toLocaleDateString() : ''
      },
      {
        label: 'Unsubscribed Date',
        value: (row: any) => row.unsubscribedAt ? new Date(row.unsubscribedAt).toLocaleDateString() : ''
      },
      {
        label: 'Created At',
        value: (row: any) => new Date(row.createdAt).toLocaleDateString()
      }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(subscribers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csv);
  } catch (error: any) {
    console.error('Export subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export subscribers'
    });
  }
});

export default {
  subscribe,
  unsubscribe,
  getStats,
  getSubscribers,
  deleteSubscriber,
  exportSubscribers
};