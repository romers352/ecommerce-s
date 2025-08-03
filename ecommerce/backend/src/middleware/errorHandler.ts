import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

/**
 * Custom error class for application-specific errors
 */
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined error classes for common scenarios
 */
export class ValidationError extends CustomError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, true, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, true, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends CustomError {
  constructor(message: string = 'External service error', details?: any) {
    super(message, 502, true, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

/**
 * Error handler for Sequelize database errors
 */
const handleSequelizeError = (error: any): CustomError => {
  switch (error.name) {
    case 'SequelizeValidationError': {
      const validationErrors = error.errors.map((err: any) => ({
        field: err.path,
        message: err.message,
      }));
      return new ValidationError('Validation failed', validationErrors);
    }
    case 'SequelizeUniqueConstraintError': {
      const field = error.errors[0]?.path || 'field';
      return new ConflictError(`${field} already exists`);
    }

    case 'SequelizeForeignKeyConstraintError':
      return new ValidationError('Invalid reference to related resource');

    case 'SequelizeConnectionError':
    case 'SequelizeConnectionRefusedError':
    case 'SequelizeHostNotFoundError':
    case 'SequelizeHostNotReachableError':
    case 'SequelizeInvalidConnectionError':
    case 'SequelizeConnectionTimedOutError':
      return new DatabaseError('Database connection failed');

    case 'SequelizeDatabaseError':
      return new DatabaseError('Database operation failed');

    case 'SequelizeTimeoutError':
      return new DatabaseError('Database operation timed out');

    default:
      return new DatabaseError('Database error occurred');
  }
};

/**
 * Error handler for JWT errors
 */
const handleJWTError = (error: any): CustomError => {
  switch (error.name) {
    case 'JsonWebTokenError':
      return new AuthenticationError('Invalid token');
    case 'TokenExpiredError':
      return new AuthenticationError('Token expired');
    case 'NotBeforeError':
      return new AuthenticationError('Token not active');
    default:
      return new AuthenticationError('Token verification failed');
  }
};

/**
 * Error handler for Multer file upload errors
 */
const handleMulterError = (error: any): CustomError => {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new ValidationError('File size too large');
    case 'LIMIT_FILE_COUNT':
      return new ValidationError('Too many files');
    case 'LIMIT_FIELD_KEY':
      return new ValidationError('Field name too long');
    case 'LIMIT_FIELD_VALUE':
      return new ValidationError('Field value too long');
    case 'LIMIT_FIELD_COUNT':
      return new ValidationError('Too many fields');
    case 'LIMIT_UNEXPECTED_FILE':
      return new ValidationError('Unexpected file field');
    case 'MISSING_FIELD_NAME':
      return new ValidationError('Missing field name');
    default:
      return new ValidationError('File upload error');
  }
};

/**
 * Error handler for Stripe errors
 */
const handleStripeError = (error: any): CustomError => {
  switch (error.type) {
    case 'StripeCardError':
      return new ValidationError('Card was declined', {
        code: error.code,
        decline_code: error.decline_code,
      });
    case 'StripeRateLimitError':
      return new RateLimitError('Too many requests to Stripe');
    case 'StripeInvalidRequestError':
      return new ValidationError('Invalid payment request');
    case 'StripeAPIError':
    case 'StripeConnectionError':
    case 'StripeAuthenticationError':
      return new ExternalServiceError('Payment service error');
    default:
      return new ExternalServiceError('Payment processing failed');
  }
};

/**
 * Main error handling middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let customError: CustomError;

  // Handle known error types
  if (error instanceof CustomError) {
    customError = error;
  } else if (error.name?.startsWith('Sequelize')) {
    customError = handleSequelizeError(error);
  } else if (error.name?.includes('JsonWebToken') || error.name?.includes('Token')) {
    customError = handleJWTError(error);
  } else if (error.name === 'MulterError') {
    customError = handleMulterError(error);
  } else if (error.type?.startsWith('Stripe')) {
    customError = handleStripeError(error);
  } else if (error.name === 'CastError') {
    customError = new ValidationError('Invalid ID format');
  } else if (error.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(error.keyValue)[0];
    customError = new ConflictError(`${field} already exists`);
  } else {
    // Unknown error
    customError = new CustomError(
      process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
      500,
      false
    );
  }

  // Log error for debugging
  if (!customError.isOperational || customError.statusCode >= 500) {
    console.error('Error:', {
      message: customError.message,
      originalError: error.message,
      originalStack: error.stack,
      statusCode: customError.statusCode,
      stack: customError.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    });
  }

  // Send error response
  const response: any = {
    success: false,
    message: customError.message,
    code: customError.code,
  };

  // Include additional details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = customError.stack;
    response.details = customError.details;
  } else if (customError.details && customError.isOperational) {
    // Include details for operational errors in production
    response.details = customError.details;
  }

  res.status(customError.statusCode).json(response);
};

/**
 * Middleware to handle 404 errors for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Utility function to create and throw custom errors
 */
export const throwError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): never => {
  throw new CustomError(message, statusCode, true, code, details);
};

/**
 * Utility function to handle promise rejections
 */
export const handlePromiseRejection = () => {
  process.on('unhandledRejection', (_reason: any, _promise: Promise<any>) => {
    // console.error('Unhandled Promise Rejection:', reason);
    // Close server gracefully
    process.exit(1);
  });

  process.on('uncaughtException', (_error: Error) => {
    // console.error('Uncaught Exception:', error);
    // Close server gracefully
    process.exit(1);
  });
};

export default {
  CustomError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  throwError,
  handlePromiseRejection,
};