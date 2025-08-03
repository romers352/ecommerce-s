import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { sequelize } from './config/database';
import routes from './routes';
import {
  errorHandler,
  notFoundHandler,
  handlePromiseRejection,
} from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { checkMaintenanceMode } from './middleware/maintenanceMode';

// Handle unhandled promise rejections
handlePromiseRejection();

// Create Express app
const app = express();

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://localhost:3001',
    'http://localhost:3005',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3005',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'x-session-id',
  ],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
app.use(generalLimiter);

// Maintenance mode check (before routes)
app.use(checkMaintenanceMode);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'E-commerce API Server',
    version: '1.0.0',
    documentation: '/api/v1/health',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Database connection and server startup
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    // console.log('✅ Database connection established successfully.');

    // Sync database models (only in development)
    if (NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      // console.log('✅ Database models synchronized.');
    }

    // Start server
    const server = app.listen(PORT, () => {
      // console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      // console.log(`📖 API Documentation: http://localhost:${PORT}/api/v1/health`);
      // console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (_signal: string) => {
      // console.log(`\n${_signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        // console.log('HTTP server closed.');
        
        try {
          await sequelize.close();
          // console.log('Database connection closed.');
          process.exit(0);
        } catch (error) {
          // console.error('Error during database shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    // console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

export default app;