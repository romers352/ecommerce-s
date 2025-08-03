import express from 'express';
import newsletterController from '../controllers/newsletterController';
const { subscribe, unsubscribe, getStats, getSubscribers, deleteSubscriber, exportSubscribers } = newsletterController;
import { authenticate, requireAdmin } from '../middleware/auth';
import { authenticateAdmin } from '../middleware/adminAuth';
import { generalLimiter } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * @route   POST /api/v1/newsletter/subscribe
 * @desc    Subscribe to newsletter
 * @access  Public
 */
router.post('/subscribe', generalLimiter, subscribe);

/**
 * @route   POST /api/v1/newsletter/unsubscribe
 * @desc    Unsubscribe from newsletter
 * @access  Public
 */
router.post('/unsubscribe', generalLimiter, unsubscribe);

/**
 * @route   GET /api/v1/newsletter/stats
 * @desc    Get newsletter statistics
 * @access  Private/Admin
 */
router.get('/stats', authenticateAdmin, getStats);

/**
 * @route   GET /api/v1/newsletter/subscribers
 * @desc    Get all newsletter subscribers
 * @access  Private/Admin
 */
router.get('/subscribers', authenticateAdmin, getSubscribers);

/**
 * @route   DELETE /api/v1/newsletter/subscribers/:id
 * @desc    Delete a newsletter subscriber
 * @access  Private/Admin
 */
router.delete('/subscribers/:id', authenticateAdmin, deleteSubscriber);

/**
 * @route   GET /api/v1/newsletter/export
 * @desc    Export newsletter subscribers as CSV
 * @access  Private/Admin
 */
router.get('/export', authenticateAdmin, exportSubscribers);

export default router;