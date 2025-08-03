import { Router } from 'express';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getAllOrders,
  downloadInvoice,
} from '../controllers/ordersController';
import {
  authenticate,
  requireAdmin,
  requireOwnershipOrAdmin,
} from '../middleware/auth';
import {
  authenticateAdmin,
} from '../middleware/adminAuth';
import {
  validateOrderCreate,
  validatePagination,
} from '../middleware/validation';
import {
  generalLimiter,
  orderLimiter,
  strictLimiter,
  adminLimiter,
} from '../middleware/rateLimiter';

const router = Router();

// User order routes
router.get('/', authenticate, generalLimiter, validatePagination, getOrders);
router.get('/invoice/:orderNumber', authenticate, generalLimiter, downloadInvoice);
router.get('/:id', authenticate, generalLimiter, requireOwnershipOrAdmin, getOrder);
router.post('/', authenticate, orderLimiter, validateOrderCreate, createOrder);
router.patch('/:id/cancel', authenticate, strictLimiter, requireOwnershipOrAdmin, cancelOrder);

// Admin order routes
router.get('/admin/all', authenticateAdmin, generalLimiter, validatePagination, getAllOrders);
router.get('/admin/stats', authenticateAdmin, generalLimiter, getOrderStats);
router.patch('/:id/status', authenticateAdmin, adminLimiter, updateOrderStatus);

export default router;