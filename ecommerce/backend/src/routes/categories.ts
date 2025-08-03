import { Router } from 'express';
import {
  getCategories,
  getActiveCategories,
  getMainCategories,
  getCategoryHierarchy,
  getSubcategories,
  getCategory,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  getCategoryStats,
} from '../controllers/categoriesController';
import {
  authenticate,
  requireAdmin,
} from '../middleware/auth';
import {
  authenticateAdmin,
} from '../middleware/adminAuth';
import {
  validateCategoryCreate,
  validateCategoryUpdate,
  validatePagination,
} from '../middleware/validation';
import {
  generalLimiter,
  uploadLimiter,
} from '../middleware/rateLimiter';
import { uploadCategoryImage } from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', generalLimiter, getCategories);
router.get('/active', generalLimiter, getActiveCategories);
router.get('/main', generalLimiter, getMainCategories);
router.get('/hierarchy', generalLimiter, getCategoryHierarchy);
router.get('/:parentId/subcategories', generalLimiter, getSubcategories);
router.get('/:id', generalLimiter, getCategory);
router.get('/:id/products', generalLimiter, validatePagination, getCategoryProducts);

// Admin routes
router.post('/', authenticateAdmin, uploadLimiter, uploadCategoryImage, validateCategoryCreate, createCategory);
router.put('/:id', authenticateAdmin, uploadLimiter, uploadCategoryImage, validateCategoryUpdate, updateCategory);
router.delete('/:id', authenticateAdmin, deleteCategory);
router.patch('/reorder', authenticateAdmin, reorderCategories);
router.get('/admin/stats', authenticateAdmin, getCategoryStats);

export default router;