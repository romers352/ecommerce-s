import { Router } from 'express';
import {
  getProducts,
  getFeaturedProducts,
  getSaleProducts,
  getProduct,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductReviews,
  searchProducts,
  getSearchSuggestions,
  getAllProductsAdmin,
  exportProducts,
  exportProductsCSV,
  exportProductsPDF,
  bulkUploadProducts,
  downloadBulkTemplate,
} from '../controllers/productsController';
import {
  authenticate,
  requireAdmin,
} from '../middleware/auth';
import {
  authenticateAdmin,
} from '../middleware/adminAuth';
import {
  validateProductCreate,
  validateProductUpdate,
  validatePagination,
  validateProductFilters,
} from '../middleware/validation';
import {
  generalLimiter,
  searchLimiter,
  uploadLimiter,
} from '../middleware/rateLimiter';
import { uploadProductImages, uploadSingleToMemory } from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', generalLimiter, validateProductFilters, getProducts);
router.get('/featured', generalLimiter, validatePagination, getFeaturedProducts);
router.get('/sale', generalLimiter, validatePagination, getSaleProducts);
router.get('/search', searchLimiter, searchProducts);
router.get('/suggestions', generalLimiter, getSearchSuggestions);
router.get('/:id', generalLimiter, getProduct);
router.get('/:id/related', generalLimiter, validatePagination, getRelatedProducts);
router.get('/:id/reviews', generalLimiter, validatePagination, getProductReviews);

// Admin routes
router.get('/admin/all', authenticateAdmin, generalLimiter, validatePagination, getAllProductsAdmin);
router.get('/admin/export', authenticateAdmin, generalLimiter, exportProducts);
router.get('/admin/export-csv', authenticateAdmin, generalLimiter, exportProductsCSV);
router.get('/admin/export-pdf', authenticateAdmin, generalLimiter, exportProductsPDF);
router.get('/admin/bulk-template', authenticateAdmin, generalLimiter, downloadBulkTemplate);
router.post('/admin/bulk-upload', authenticateAdmin, uploadLimiter, uploadSingleToMemory, bulkUploadProducts);
// router.post('/admin/bulk-upload-csv', authenticateAdmin, uploadLimiter, uploadSingleToMemory, bulkUploadProductsCSV); // Temporarily disabled
router.post('/', authenticateAdmin, uploadLimiter, uploadProductImages, validateProductCreate, createProduct);
router.put('/:id', authenticateAdmin, uploadLimiter, uploadProductImages, validateProductUpdate, updateProduct);
router.delete('/:id', authenticateAdmin, deleteProduct);
router.patch('/:id/stock', authenticateAdmin, updateStock);

export default router;