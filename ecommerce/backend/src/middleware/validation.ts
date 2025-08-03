import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../types';

/**
 * Generic validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log(`[VALIDATION] ${req.method} ${req.path} - Validating ${property}:`, JSON.stringify(req[property], null, 2));
    
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      console.log(`[VALIDATION] Error:`, error.details);
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      const errors: ValidationError[] = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        details: errorMessage,
      });
      return;
    }

    console.log(`[VALIDATION] Success - Transformed data:`, JSON.stringify(value, null, 2));
    // Replace the original data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Common validation schemas

// User validation schemas
export const userRegistrationSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required',
  }),
  role: Joi.string().valid('customer', 'admin').default('customer'),
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const userUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
  }),
  lastName: Joi.string().min(2).max(50).messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
  }),
  email: Joi.string().email().messages({
    'string.email': 'Please provide a valid email address',
  }),
  isActive: Joi.boolean(),
  role: Joi.string().valid('customer', 'admin'),
  emailVerified: Joi.boolean(),
});

export const userCreateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required',
  }),
  role: Joi.string().valid('customer', 'admin').default('customer'),
  isActive: Joi.boolean().default(true),
  emailVerified: Joi.boolean().default(false),
});

export const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string().min(6).max(128).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'string.max': 'New password cannot exceed 128 characters',
    'any.required': 'New password is required',
  }),
});

export const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

export const passwordResetSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required',
  }),
  newPassword: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'New password is required',
  }),
});

// Category validation schemas
export const categoryCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Category name must be at least 2 characters long',
    'string.max': 'Category name cannot exceed 100 characters',
    'any.required': 'Category name is required',
  }),
  description: Joi.string().max(1000).allow('').messages({
    'string.max': 'Description cannot exceed 1000 characters',
  }),
  image: Joi.string().uri().allow('').messages({
    'string.uri': 'Image must be a valid URL',
  }),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0).messages({
    'number.min': 'Sort order must be a positive number',
  }),
});

export const categoryUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    'string.min': 'Category name must be at least 2 characters long',
    'string.max': 'Category name cannot exceed 100 characters',
  }),
  description: Joi.string().max(1000).allow('').messages({
    'string.max': 'Description cannot exceed 1000 characters',
  }),
  image: Joi.string().uri().allow('').messages({
    'string.uri': 'Image must be a valid URL',
  }),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0).messages({
    'number.min': 'Sort order must be a positive number',
  }),
  parentId: Joi.custom((value, helpers) => {
    // Handle null or undefined
    if (value === null || value === undefined) {
      return null;
    }
    // Handle empty string - convert to null
    if (value === '') {
      return null;
    }
    // Handle numeric values
    if (typeof value === 'number') {
      if (Number.isInteger(value) && value > 0) {
        return value;
      }
      return helpers.error('any.invalid');
    }
    // Handle string numeric values
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        return num;
      }
      return helpers.error('any.invalid');
    }
    return helpers.error('any.invalid');
  }).messages({
    'any.invalid': 'Parent ID must be a positive number, empty string, or null',
  }),
  isMainCategory: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid('true', 'false').custom((value) => value === 'true')
  ),
});

// Product validation schemas
export const productCreateSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Product name must be at least 2 characters long',
    'string.max': 'Product name cannot exceed 255 characters',
    'any.required': 'Product name is required',
  }),
  description: Joi.string().min(10).max(5000).required().messages({
    'string.min': 'Description must be at least 10 characters long',
    'string.max': 'Description cannot exceed 5000 characters',
    'any.required': 'Product description is required',
  }),
  shortDescription: Joi.string().max(500).allow('').messages({
    'string.max': 'Short description cannot exceed 500 characters',
  }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Price must be greater than 0',
    'any.required': 'Price is required',
  }),
  salePrice: Joi.number().positive().precision(2).messages({
    'number.positive': 'Sale price must be greater than 0',
  }),
  sku: Joi.string().min(2).max(100).required().messages({
    'string.min': 'SKU must be at least 2 characters long',
    'string.max': 'SKU cannot exceed 100 characters',
    'any.required': 'SKU is required',
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.min': 'Stock cannot be negative',
    'any.required': 'Stock is required',
  }),
  images: Joi.array().items(Joi.string().uri()).default([]).messages({
    'string.uri': 'Each image must be a valid URL',
  }),
  categoryId: Joi.number().integer().positive().required().messages({
    'number.positive': 'Category ID must be a positive number',
    'any.required': 'Category is required',
  }),
  isActive: Joi.boolean().default(true),
  isFeatured: Joi.boolean().default(false),
  isDigital: Joi.boolean().default(false),
  weight: Joi.number().positive().precision(2).messages({
    'number.positive': 'Weight must be greater than 0',
  }),
  dimensions: Joi.string().max(100).allow('').messages({
    'string.max': 'Dimensions cannot exceed 100 characters',
  }),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().max(50)),
    Joi.string().max(1000)
  ).default([]).messages({
    'string.max': 'Tags cannot exceed 1000 characters',
  }),
  metaTitle: Joi.string().max(255).allow('').messages({
    'string.max': 'Meta title cannot exceed 255 characters',
  }),
  metaDescription: Joi.string().max(500).allow('').messages({
    'string.max': 'Meta description cannot exceed 500 characters',
  }),
});

export const productUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    'string.min': 'Product name must be at least 2 characters long',
    'string.max': 'Product name cannot exceed 255 characters',
  }),
  description: Joi.string().min(10).max(5000).messages({
    'string.min': 'Description must be at least 10 characters long',
    'string.max': 'Description cannot exceed 5000 characters',
  }),
  shortDescription: Joi.string().max(500).allow('').messages({
    'string.max': 'Short description cannot exceed 500 characters',
  }),
  price: Joi.number().positive().precision(2).messages({
    'number.positive': 'Price must be greater than 0',
  }),
  salePrice: Joi.number().positive().precision(2).allow(null).messages({
    'number.positive': 'Sale price must be greater than 0',
  }),
  sku: Joi.string().min(2).max(100).messages({
    'string.min': 'SKU must be at least 2 characters long',
    'string.max': 'SKU cannot exceed 100 characters',
  }),
  stock: Joi.number().integer().min(0).messages({
    'number.min': 'Stock cannot be negative',
  }),
  images: Joi.array().items(Joi.string().uri()).messages({
    'string.uri': 'Each image must be a valid URL',
  }),
  categoryId: Joi.number().integer().positive().messages({
    'number.positive': 'Category ID must be a positive number',
  }),
  isActive: Joi.boolean(),
  isFeatured: Joi.boolean(),
  isDigital: Joi.boolean(),
  weight: Joi.number().positive().precision(2).allow(null).messages({
    'number.positive': 'Weight must be greater than 0',
  }),
  dimensions: Joi.string().max(100).allow('').messages({
    'string.max': 'Dimensions cannot exceed 100 characters',
  }),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().max(50)),
    Joi.string().max(1000)
  ).messages({
    'string.max': 'Tags cannot exceed 1000 characters',
  }),
  metaTitle: Joi.string().max(255).allow('').messages({
    'string.max': 'Meta title cannot exceed 255 characters',
  }),
  metaDescription: Joi.string().max(500).allow('').messages({
    'string.max': 'Meta description cannot exceed 500 characters',
  }),
});

// Review validation schemas
export const reviewCreateSchema = Joi.object({
  productId: Joi.number().integer().positive().required().messages({
    'number.positive': 'Product ID must be a positive number',
    'any.required': 'Product ID is required',
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
    'any.required': 'Rating is required',
  }),
  title: Joi.string().max(255).allow('').messages({
    'string.max': 'Review title cannot exceed 255 characters',
  }),
  comment: Joi.string().max(2000).allow('').messages({
    'string.max': 'Review comment cannot exceed 2000 characters',
  }),
});

// Cart validation schemas
export const cartItemSchema = Joi.object({
  productId: Joi.number().integer().positive().required().messages({
    'number.positive': 'Product ID must be a positive number',
    'any.required': 'Product ID is required',
  }),
  quantity: Joi.number().integer().min(1).max(999).required().messages({
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Quantity cannot exceed 999',
    'any.required': 'Quantity is required',
  }),
});

export const cartUpdateSchema = Joi.object({
  quantity: Joi.number().integer().min(0).max(999).required().messages({
    'number.min': 'Quantity cannot be negative',
    'number.max': 'Quantity cannot exceed 999',
    'any.required': 'Quantity is required',
  }),
});

// Address validation schema
export const addressSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required',
  }),
  company: Joi.string().max(100).allow('').messages({
    'string.max': 'Company name cannot exceed 100 characters',
  }),
  address1: Joi.string().min(5).max(255).required().messages({
    'string.min': 'Address must be at least 5 characters long',
    'string.max': 'Address cannot exceed 255 characters',
    'any.required': 'Address is required',
  }),
  address2: Joi.string().max(255).allow('').messages({
    'string.max': 'Address line 2 cannot exceed 255 characters',
  }),
  city: Joi.string().min(2).max(100).required().messages({
    'string.min': 'City must be at least 2 characters long',
    'string.max': 'City cannot exceed 100 characters',
    'any.required': 'City is required',
  }),
  state: Joi.string().min(2).max(100).required().messages({
    'string.min': 'State must be at least 2 characters long',
    'string.max': 'State cannot exceed 100 characters',
    'any.required': 'State is required',
  }),
  postalCode: Joi.string().min(3).max(20).required().messages({
    'string.min': 'Postal code must be at least 3 characters long',
    'string.max': 'Postal code cannot exceed 20 characters',
    'any.required': 'Postal code is required',
  }),
  country: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Country must be at least 2 characters long',
    'string.max': 'Country cannot exceed 100 characters',
    'any.required': 'Country is required',
  }),
  phone: Joi.string().min(10).max(20).allow('').messages({
    'string.min': 'Phone number must be at least 10 characters long',
    'string.max': 'Phone number cannot exceed 20 characters',
  }),
});

// Order validation schemas
export const orderCreateSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().min(1).max(999).required(),
      price: Joi.number().positive().precision(2).required(),
    })
  ).min(1).required().messages({
    'array.min': 'Order must contain at least one item',
    'any.required': 'Order items are required',
  }),
  shippingAddress: addressSchema.required(),
  billingAddress: addressSchema.required(),
  paymentMethod: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Payment method must be at least 2 characters long',
    'string.max': 'Payment method cannot exceed 50 characters',
    'any.required': 'Payment method is required',
  }),
  notes: Joi.string().max(1000).allow('').messages({
    'string.max': 'Notes cannot exceed 1000 characters',
  }),
});

// Query parameter validation schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
});

export const productFiltersSchema = Joi.object({
  search: Joi.string().max(255).allow('').messages({
    'string.max': 'Search query cannot exceed 255 characters',
  }),
  categoryId: Joi.number().integer().positive().messages({
    'number.positive': 'Category ID must be a positive number',
  }),
  categoryIds: Joi.string().pattern(/^\d+(,\d+)*$/).messages({
    'string.pattern.base': 'Category IDs must be comma-separated positive numbers',
  }),
  minPrice: Joi.number().positive().precision(2).messages({
    'number.positive': 'Minimum price must be greater than 0',
  }),
  maxPrice: Joi.number().positive().precision(2).messages({
    'number.positive': 'Maximum price must be greater than 0',
  }),
  minRating: Joi.number().min(1).max(5).messages({
    'number.min': 'Minimum rating must be at least 1',
    'number.max': 'Minimum rating cannot exceed 5',
  }),
  inStock: Joi.boolean(),
  onSale: Joi.boolean(),
  sortBy: Joi.string().valid('name', 'price', 'rating', 'newest', 'featured').default('newest'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
}).options({ allowUnknown: false, stripUnknown: false });

// ID parameter validation
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.positive': 'ID must be a positive number',
    'any.required': 'ID is required',
  }),
});

export const slugParamSchema = Joi.object({
  slug: Joi.string().min(1).max(275).required().messages({
    'string.min': 'Slug is required',
    'string.max': 'Slug cannot exceed 275 characters',
    'any.required': 'Slug is required',
  }),
});

// Export validation middleware functions
export const validateUserRegistration = validate(userRegistrationSchema);
export const validateUserLogin = validate(userLoginSchema);
export const validateUserUpdate = validate(userUpdateSchema);
export const validateUserCreate = validate(userCreateSchema);
export const validatePasswordChange = validate(passwordChangeSchema);
export const validatePasswordResetRequest = validate(passwordResetRequestSchema);
export const validatePasswordReset = validate(passwordResetSchema);

export const validateCategoryCreate = validate(categoryCreateSchema);
export const validateCategoryUpdate = validate(categoryUpdateSchema);

export const validateProductCreate = validate(productCreateSchema);
export const validateProductUpdate = validate(productUpdateSchema);

export const validateReviewCreate = validate(reviewCreateSchema);

export const validateCartItem = validate(cartItemSchema);
export const validateCartUpdate = validate(cartUpdateSchema);

export const validateOrderCreate = validate(orderCreateSchema);

// Admin validation schemas
export const adminLoginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'any.required': 'Email or username is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required',
  }),
});

export const adminRegistrationSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required',
  }),
  username: Joi.string().alphanum().min(3).max(50).required().messages({
    'string.alphanum': 'Username can only contain letters and numbers',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot exceed 50 characters',
    'any.required': 'Username is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required',
  }),
  permissions: Joi.array().items(Joi.string()).default([]),
  isSuperAdmin: Joi.boolean().default(false),
});

export const adminUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
  }),
  lastName: Joi.string().min(2).max(50).messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
  }),
  username: Joi.string().alphanum().min(3).max(50).messages({
    'string.alphanum': 'Username can only contain letters and numbers',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot exceed 50 characters',
  }),
  email: Joi.string().email().messages({
    'string.email': 'Please provide a valid email address',
  }),
});

// Admin validation middleware
export const validateAdminLogin = validate(adminLoginSchema);
export const validateAdminRegistration = validate(adminRegistrationSchema);
export const validateAdminUpdate = validate(adminUpdateSchema);

export const validatePagination = validate(paginationSchema, 'query');
export const validateProductFilters = validate(productFiltersSchema, 'query');
export const validateIdParam = validate(idParamSchema, 'params');
export const validateSlugParam = validate(slugParamSchema, 'params');



export default {
  validate,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateUserCreate,
  validatePasswordChange,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateAdminLogin,
  validateAdminRegistration,
  validateAdminUpdate,
  validateCategoryCreate,
  validateCategoryUpdate,
  validateProductCreate,
  validateProductUpdate,
  validateReviewCreate,
  validateCartItem,
  validateCartUpdate,
  validateOrderCreate,
  validatePagination,
  validateProductFilters,
  validateIdParam,
  validateSlugParam,

};