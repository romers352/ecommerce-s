import { Router } from 'express';
import {
  getDashboardStats,
  getSalesData,
  getAnalyticsData,
} from '../controllers/adminController';
import {
  authenticateAdmin,
} from '../middleware/adminAuth';
import {
  generalLimiter,
} from '../middleware/rateLimiter';

const router = Router();

// All admin routes require admin authentication
router.use(authenticateAdmin);

// Analytics routes
router.get('/dashboard', generalLimiter, getDashboardStats);
router.get('/sales', generalLimiter, getSalesData);
router.get('/data', generalLimiter, getAnalyticsData);

export default router;