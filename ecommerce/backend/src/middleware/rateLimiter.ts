import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest } from '../types';
import { RateLimitError } from './errorHandler';

// Store for tracking rate limit violations
const violationStore = new Map<string, { count: number; lastViolation: Date }>();

// Custom rate limit handler
const rateLimitHandler = (req: Request, res: Response): void => {
  const clientId = req.ip || 'unknown';
  
  // Track violations
  const violation = violationStore.get(clientId);
  if (violation) {
    violation.count += 1;
    violation.lastViolation = new Date();
  } else {
    violationStore.set(clientId, { count: 1, lastViolation: new Date() });
  }

  // Log rate limit violation
  // console.warn(`Rate limit exceeded for IP: ${clientId}`, {
  //   url: req.url,
  //   method: req.method,
  //   userAgent: req.get('User-Agent'),
  //   timestamp: new Date().toISOString(),
  // });

  const error = new RateLimitError('Too many requests, please try again later');
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.code,
    retryAfter: Math.ceil(60), // seconds
  });
};

// Skip rate limiting for certain conditions
const skipRateLimit = (req: Request): boolean => {
  // Skip for health checks
  if (req.path === '/health' || req.path === '/api/health') {
    return true;
  }

  // Skip for settings endpoints to fix favicon loading
  if (req.path.includes('/settings/site') || req.path.includes('/uploads/assets')) {
    return true;
  }

  // Skip for trusted IPs (if configured)
  const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
  if (trustedIPs.includes(req.ip || '')) {
    return true;
  }

  return false;
};

// Generate key for rate limiting (can be customized per endpoint)
const generateKey = (req: AuthenticatedRequest): string => {
  // Use IP address as default key
  let key = req.ip || 'unknown';
  
  // For authenticated requests, use user ID if available
  if (req.user?.id) {
    key = `user:${req.user.id}`;
  }
  
  return key;
};

// General rate limiter (adjusted for development)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: rateLimitHandler,
  skip: skipRateLimit,
  keyGenerator: generateKey,
});

// Strict rate limiter for sensitive operations (5 requests per minute)
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests for this operation, please try again later',
    code: 'STRICT_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  keyGenerator: generateKey,
});

// Admin operations rate limiter (more lenient for admin tasks)
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 200, // Higher limit for admin operations
  message: {
    success: false,
    message: 'Too many admin requests, please try again later',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  keyGenerator: generateKey,
});

// Authentication rate limiter (adjusted for development)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 200 : 50, // Higher limit for development
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  keyGenerator: (req: Request) => {
    // For auth endpoints, use IP + email if available
    const email = req.body?.email || '';
    const ip = req.ip || 'unknown';
    return email ? `${ip}:${email}` : ip;
  },
});

// Password reset rate limiter (adjusted for development)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 50 : 3, // Higher limit for development
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  keyGenerator: (req: Request) => {
    // Use email for password reset attempts
    const email = req.body?.email || req.ip || 'unknown';
    return `password-reset:${email}`;
  },
});

// File upload rate limiter (20 uploads per hour)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 uploads per windowMs
  message: {
    success: false,
    message: 'Too many file uploads, please try again later',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  keyGenerator: generateKey,
});

// API rate limiter for external API calls (1000 requests per hour)
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'API rate limit exceeded, please try again later',
    code: 'API_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  keyGenerator: (req: Request) => {
    // For API endpoints, prefer API key or user ID
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      return `api:${apiKey}`;
    }
    return generateKey(req);
  },
});

// Search rate limiter (100 searches per hour)
export const searchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each IP to 100 searches per windowMs
  message: {
    success: false,
    message: 'Too many search requests, please try again later',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  keyGenerator: generateKey,
});

// Order creation rate limiter (50 orders per hour for development)
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 orders per windowMs
  message: {
    success: false,
    message: 'Too many order attempts, please try again later',
    code: 'ORDER_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  keyGenerator: (req: AuthenticatedRequest) => {
    // Use user ID for order rate limiting
    return req.user?.id ? `order:${req.user.id}` : `order:${req.ip}`;
  },
});

// Review creation rate limiter (5 reviews per day)
export const reviewLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // limit each user to 5 reviews per day
  message: {
    success: false,
    message: 'Too many review submissions, please try again tomorrow',
    code: 'REVIEW_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  keyGenerator: (req: AuthenticatedRequest) => {
    // Use user ID for review rate limiting
    return req.user?.id ? `review:${req.user.id}` : `review:${req.ip}`;
  },
});

// Contact form rate limiter (environment-based limits)
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 50 : 3, // Higher limit for development
  message: {
    success: false,
    message: 'Too many contact form submissions, please try again later',
    code: 'CONTACT_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  keyGenerator: generateKey,
});

// Newsletter subscription rate limiter (5 subscriptions per day)
export const newsletterLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // limit each IP to 5 newsletter subscriptions per day
  message: {
    success: false,
    message: 'Too many newsletter subscription attempts, please try again tomorrow',
    code: 'NEWSLETTER_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  keyGenerator: generateKey,
});

// Clean up violation store periodically
setInterval(() => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  for (const [key, violation] of violationStore.entries()) {
    if (violation.lastViolation < oneHourAgo) {
      violationStore.delete(key);
    }
  }
}, 15 * 60 * 1000); // Clean up every 15 minutes

// Utility function to get violation count for an IP
export const getViolationCount = (ip: string): number => {
  const violation = violationStore.get(ip);
  return violation ? violation.count : 0;
};

// Utility function to check if IP is currently rate limited
export const isRateLimited = (ip: string, maxViolations: number = 10): boolean => {
  const violationCount = getViolationCount(ip);
  return violationCount >= maxViolations;
};

// Utility function to reset violations for an IP
export const resetViolations = (ip: string): void => {
  violationStore.delete(ip);
};

export default {
  generalLimiter,
  strictLimiter,
  adminLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  apiLimiter,
  searchLimiter,
  orderLimiter,
  reviewLimiter,
  contactLimiter,
  newsletterLimiter,
  getViolationCount,
  isRateLimited,
  resetViolations,
};