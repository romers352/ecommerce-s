import { body, query } from 'express-validator';

// Validation for creating a contact message
export const validateCreateContact = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must be less than 20 characters')
    .matches(/^[+\d\s()-]+$/)
    .withMessage('Please provide a valid phone number'),

  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high')
];

// Validation for updating a contact (Admin only)
export const validateUpdateContact = [
  body('status')
    .optional()
    .isIn(['new', 'read', 'replied', 'closed'])
    .withMessage('Status must be one of: new, read, replied, closed'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),

  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Admin notes must be less than 5000 characters'),

  body('repliedBy')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Replied by must be a valid user ID')
];

// Validation for getting contacts with filters (Admin only)
export const validateGetContacts = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['new', 'read', 'replied', 'closed'])
    .withMessage('Status must be one of: new, read, replied, closed'),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
];

// Validation for bulk update
export const validateBulkUpdateContacts = [
  body('contactIds')
    .isArray({ min: 1 })
    .withMessage('Contact IDs must be a non-empty array')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(id => Number.isInteger(id) && id > 0);
    })
    .withMessage('All contact IDs must be positive integers'),

  body('updateData')
    .isObject()
    .withMessage('Update data must be an object'),

  body('updateData.status')
    .optional()
    .isIn(['new', 'read', 'replied', 'closed'])
    .withMessage('Status must be one of: new, read, replied, closed'),

  body('updateData.priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high')
];

export default {
  validateCreateContact,
  validateUpdateContact,
  validateGetContacts,
  validateBulkUpdateContacts
};