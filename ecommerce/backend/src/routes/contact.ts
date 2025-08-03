import { Router } from 'express';
import {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats,
  bulkUpdateContacts,
  respondToContact
} from '../controllers/contactController';
import {
  validateCreateContact,
  validateUpdateContact,
  validateGetContacts,
  validateBulkUpdateContacts
} from '../middleware/contactValidation';
import { authenticate, requireAdmin } from '../middleware/auth';
import { authenticateAdmin } from '../middleware/adminAuth';
import { contactLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
// POST /api/v1/contact - Create a new contact message
router.post(
  '/',
  contactLimiter,
  validateCreateContact,
  createContact
);

// Admin routes (require authentication and admin role)
// GET /api/v1/contact/admin/all - Get all contacts with filters
router.get(
  '/admin/all',
  authenticateAdmin,
  validateGetContacts,
  getAllContacts
);

// GET /api/v1/contact/admin/stats - Get contact statistics
router.get(
  '/admin/stats',
  authenticateAdmin,
  getContactStats
);

// GET /api/v1/contact/admin/:id - Get contact by ID
router.get(
  '/admin/:id',
  authenticateAdmin,
  getContactById
);

// PUT /api/v1/contact/admin/:id - Update contact
router.put(
  '/admin/:id',
  authenticateAdmin,
  validateUpdateContact,
  updateContact
);

// DELETE /api/v1/contact/admin/:id - Delete contact
router.delete(
  '/admin/:id',
  authenticateAdmin,
  deleteContact
);

// POST /api/v1/contact/admin/:id/respond - Respond to contact
router.post(
  '/admin/:id/respond',
  authenticateAdmin,
  respondToContact
);

// PUT /api/v1/contact/admin/bulk-update - Bulk update contacts
router.put(
  '/admin/bulk-update',
  authenticateAdmin,
  validateBulkUpdateContacts,
  bulkUpdateContacts
);

export default router;