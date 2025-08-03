import { Router } from 'express';
import authRoutes from './auth';
import adminAuthRoutes from './adminAuth';
import userRoutes from './users';
import productRoutes from './products';
import categoryRoutes from './categories';
import cartRoutes from './cart';
import wishlistRoutes from './wishlist';
import orderRoutes from './orders';
import reviewRoutes from './reviews';
import adminRoutes from './admin';

import contactRoutes from './contact';
import newsletterRoutes from './newsletter';
import settingsRoutes from './settings';
import emailRoutes from './email';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/admin/auth', adminAuthRoutes); // Must come before /admin
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/contact', contactRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/settings', settingsRoutes);
router.use('/email', emailRoutes);
router.use('/admin/analytics', adminRoutes); // More specific path to avoid conflicts


export default router;