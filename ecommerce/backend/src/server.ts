import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Configure dotenv with explicit path
dotenv.config({ path: path.join(__dirname, '../.env') });
console.log('🔧 Environment variables loaded from:', path.join(__dirname, '../.env'));
console.log('🔧 EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔧 EMAIL_PASS:', process.env.EMAIL_PASS ? '***HIDDEN***' : 'MISSING');

// Import configurations and utilities
import { sequelize } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import models to ensure associations are loaded
import './models';

// Import routes
import authRoutes from './routes/auth';
import adminAuthRoutes from './routes/adminAuth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import reviewRoutes from './routes/reviews';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import wishlistRoutes from './routes/wishlist';
import contactRoutes from './routes/contact';
import newsletterRoutes from './routes/newsletter';
import settingsRoutes from './routes/settings';

import emailRoutes from './routes/email';

const app: Application = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Rate limiting (adjusted for development)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: NODE_ENV === 'development' ? 2000 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disable CSP for development
}));

// Additional headers for CORS and resource sharing
app.use((req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, expires, pragma');
  next();
});

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-session-id', 'Cache-Control', 'expires', 'pragma'],
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting (apply to all requests)
app.use('/api/', limiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/images', express.static(path.join(__dirname, '../uploads/images')));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/admin/auth`, adminAuthRoutes);
app.use(`${API_PREFIX}/admin/analytics`, adminRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
// app.use(`${API_PREFIX}/admin`, adminRoutes); // Removed - handled in main routes
app.use(`${API_PREFIX}/wishlist`, wishlistRoutes);
app.use(`${API_PREFIX}/contact`, contactRoutes);
app.use(`${API_PREFIX}/newsletter`, newsletterRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);

app.use(`${API_PREFIX}/email`, emailRoutes);

// Welcome route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to E-commerce API',
    version: process.env.npm_package_version || '1.0.0',
    environment: NODE_ENV,
    documentation: '/api/docs',
    health: '/health',
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  // console.log('SIGTERM received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  // console.log('SIGINT received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Initialize email service
    console.log('📧 Initializing email service...');
    try {
      const emailService = (await import('./services/emailService')).default;
      const emailVerified = await emailService.verifyConnection();
      if (emailVerified) {
        console.log('✅ Email service initialized and verified successfully');
      } else {
        console.log('⚠️ Email service initialized but SMTP verification failed');
      }
    } catch (emailError) {
      console.log('⚠️ Email service initialization failed:', emailError);
      console.log('📧 Email functionality will be limited');
    }
    
    // Sync database in development (be careful in production)
    if (NODE_ENV === 'development') {
      // Skip sync to avoid index conflicts with existing database
      // await sequelize.sync({ alter: true });
      console.log('✅ Database sync skipped - using existing database.');
    }
    
    // Start listening
    console.log('🔄 Starting server...');
    // Force restart to pick up new PORT - rate limiting fix applied
    // Rate limiting updated for development
// Email configuration updated - debug added - restart
// Force restart for email config update 7 - fix sender address
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📱 Environment: ${NODE_ENV}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
      console.log(`📧 Email API: http://localhost:${PORT}${API_PREFIX}/email`);
      
      if (NODE_ENV === 'development') {
        console.log(`🔧 Frontend URL: ${process.env.CORS_ORIGIN}`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;












 
