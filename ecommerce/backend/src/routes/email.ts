import { Router } from 'express';
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { authenticate, requireAdmin } from '../middleware/auth';
import emailService from '../services/emailService';
import imapService from '../services/imapService';
import { ApiResponse } from '../types';

const router = Router();





/**
 * Get IMAP connection status
 * @route GET /api/v1/email/imap/status
 * @access Admin
 */
router.get('/imap/status', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const connectionInfo = imapService.getConnectionInfo();

  const response: ApiResponse<typeof connectionInfo> = {
    success: true,
    message: 'IMAP connection status retrieved',
    data: connectionInfo
  };

  res.json(response);
}));

/**
 * Connect to IMAP server
 * @route POST /api/v1/email/imap/connect
 * @access Admin
 */
router.post('/imap/connect', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const connected = await imapService.connect();

  const response: ApiResponse<{ connected: boolean }> = {
    success: connected,
    message: connected ? 'Connected to IMAP server successfully' : 'Failed to connect to IMAP server',
    data: { connected }
  };

  res.status(connected ? 200 : 500).json(response);
}));

/**
 * Disconnect from IMAP server
 * @route POST /api/v1/email/imap/disconnect
 * @access Admin
 */
router.post('/imap/disconnect', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await imapService.disconnect();

  const response: ApiResponse<null> = {
    success: true,
    message: 'Disconnected from IMAP server',
    data: null
  };

  res.json(response);
}));

/**
 * Get email folders
 * @route GET /api/v1/email/imap/folders
 * @access Admin
 */
router.get('/imap/folders', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const folders = await imapService.getFolders();

    const response: ApiResponse<typeof folders> = {
      success: true,
      message: 'Email folders retrieved successfully',
      data: folders
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve folders'
    });
  }
}));

/**
 * Get messages from a folder
 * @route GET /api/v1/email/imap/messages
 * @access Admin
 */
router.get('/imap/messages', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    folder = 'INBOX',
    limit = '10',
    offset = '0',
    unreadOnly = 'false'
  } = req.query;

  try {
    const messages = await imapService.getMessages({
      folder: folder as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      unreadOnly: unreadOnly === 'true'
    });

    const response: ApiResponse<typeof messages> = {
      success: true,
      message: 'Messages retrieved successfully',
      data: messages
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve messages'
    });
  }
}));

/**
 * Get a specific message
 * @route GET /api/v1/email/imap/messages/:uid
 * @access Admin
 */
router.get('/imap/messages/:uid', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { uid } = req.params;
  const { folder = 'INBOX' } = req.query;

  try {
    const message = await imapService.getMessage(parseInt(uid), folder as string);

    if (!message) {
      res.status(404).json({
        success: false,
        message: 'Message not found'
      });
      return;
    }

    const response: ApiResponse<typeof message> = {
      success: true,
      message: 'Message retrieved successfully',
      data: message
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve message'
    });
  }
}));

/**
 * Mark message as read
 * @route PUT /api/v1/email/imap/messages/:uid/read
 * @access Admin
 */
router.put('/imap/messages/:uid/read', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { uid } = req.params;
  const { folder = 'INBOX' } = req.body;

  try {
    const success = await imapService.markAsRead(parseInt(uid), folder);

    const response: ApiResponse<{ success: boolean }> = {
      success: success,
      message: success ? 'Message marked as read' : 'Failed to mark message as read',
      data: { success }
    };

    res.status(success ? 200 : 500).json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark message as read'
    });
  }
}));

/**
 * Mark message as unread
 * @route PUT /api/v1/email/imap/messages/:uid/unread
 * @access Admin
 */
router.put('/imap/messages/:uid/unread', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { uid } = req.params;
  const { folder = 'INBOX' } = req.body;

  try {
    const success = await imapService.markAsUnread(parseInt(uid), folder);

    const response: ApiResponse<{ success: boolean }> = {
      success: success,
      message: success ? 'Message marked as unread' : 'Failed to mark message as unread',
      data: { success }
    };

    res.status(success ? 200 : 500).json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark message as unread'
    });
  }
}));

/**
 * Delete message
 * @route DELETE /api/v1/email/imap/messages/:uid
 * @access Admin
 */
router.delete('/imap/messages/:uid', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { uid } = req.params;
  const { folder = 'INBOX' } = req.query;

  try {
    const success = await imapService.deleteMessage(parseInt(uid), folder as string);

    const response: ApiResponse<{ success: boolean }> = {
      success: success,
      message: success ? 'Message deleted successfully' : 'Failed to delete message',
      data: { success }
    };

    res.status(success ? 200 : 500).json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete message'
    });
  }
}));

/**
 * Search messages
 * @route POST /api/v1/email/imap/search
 * @access Admin
 */
router.post('/imap/search', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const searchCriteria = req.body;

  try {
    const messages = await imapService.searchMessages(searchCriteria);

    const response: ApiResponse<typeof messages> = {
      success: true,
      message: 'Search completed successfully',
      data: messages
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Search failed'
    });
  }
}));

/**
 * Send newsletter to all subscribers
 * @route POST /api/v1/email/newsletter/send
 * @access Admin
 */
router.post('/newsletter/send', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { subject, content } = req.body;

  if (!subject || !content) {
    res.status(400).json({
      success: false,
      message: 'Subject and content are required'
    });
    return;
  }

  try {
    // Get all active newsletter subscribers
    const Newsletter = (await import('../models/Newsletter')).default;
    const subscribers = await Newsletter.getActiveSubscribers();
    
    if (subscribers.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No active subscribers found'
      });
      return;
    }

    const emails = subscribers.map(sub => sub.email);
    const results = await emailService.sendNewsletter(emails, subject, content);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    const response: ApiResponse<{
      totalSubscribers: number;
      successCount: number;
      failureCount: number;
      results: typeof results;
    }> = {
      success: successCount > 0,
      message: `Newsletter sent to ${successCount} subscribers. ${failureCount} failed.`,
      data: {
        totalSubscribers: subscribers.length,
        successCount,
        failureCount,
        results
      }
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send newsletter'
    });
  }
}));

export default router;