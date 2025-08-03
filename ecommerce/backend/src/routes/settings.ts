import { Router } from 'express';
import {
  getSiteSettings,
  updateSiteSettings,
  uploadSiteAsset,
  getHomePageSections,
  getActiveHomePageSections,
  createHomePageSection,
  updateHomePageSection,
  deleteHomePageSection,
  reorderHomePageSections,
  getPaymentMethods,
  getActivePaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '../controllers/settingsController';
import {
  authenticateAdmin,
} from '../middleware/adminAuth';
import {
  generalLimiter,
  uploadLimiter,
} from '../middleware/rateLimiter';
import { uploadSiteAssets } from '../middleware/upload';

const router = Router();

// Public routes (no rate limiting for site settings to fix favicon/logo loading)
router.get('/site', getSiteSettings);
router.get('/home-sections/active', getActiveHomePageSections);
router.get('/payment-methods/active', getActivePaymentMethods);

// Admin routes - Site Settings
router.put('/site', authenticateAdmin, generalLimiter, updateSiteSettings);
router.post('/site/upload/:type', authenticateAdmin, uploadLimiter, uploadSiteAssets, uploadSiteAsset);

// Admin routes - Home Page Sections
router.get('/home-sections', authenticateAdmin, generalLimiter, getHomePageSections);
router.post('/home-sections', authenticateAdmin, generalLimiter, createHomePageSection);
router.put('/home-sections/:id', authenticateAdmin, generalLimiter, updateHomePageSection);
router.delete('/home-sections/:id', authenticateAdmin, generalLimiter, deleteHomePageSection);
router.put('/home-sections/reorder', authenticateAdmin, generalLimiter, reorderHomePageSections);

// Admin routes - Payment Methods
router.get('/payment-methods', authenticateAdmin, generalLimiter, getPaymentMethods);
router.post('/payment-methods', authenticateAdmin, generalLimiter, createPaymentMethod);
router.put('/payment-methods/:id', authenticateAdmin, generalLimiter, updatePaymentMethod);
router.delete('/payment-methods/:id', authenticateAdmin, generalLimiter, deletePaymentMethod);

export default router;