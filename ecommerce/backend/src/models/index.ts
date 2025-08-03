import { sequelize } from '../config/database';
import User from './User';
import Admin from './Admin';

import Category from './Category';
import Product from './Product';
import Review from './Review';
import CartItem from './CartItem';
import Wishlist from './Wishlist';
import { Order, OrderItem } from './Order';
import Contact from './Contact';
import Newsletter from './Newsletter';
import { SiteSettings } from './SiteSettings';
import { HomePageSection } from './HomePageSection';
import { PaymentMethod } from './PaymentMethod';

// Define model associations

// User associations
User.hasMany(Review, {
  foreignKey: 'userId',
  as: 'reviews',
  onDelete: 'CASCADE',
});

User.hasMany(CartItem, {
  foreignKey: 'userId',
  as: 'cartItems',
  onDelete: 'CASCADE',
});

User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders',
  onDelete: 'CASCADE',
});

User.hasMany(Wishlist, {
  foreignKey: 'userId',
  as: 'wishlistItems',
  onDelete: 'CASCADE',
});

// Category associations
Category.hasMany(Product, {
  foreignKey: 'categoryId',
  as: 'products',
  onDelete: 'RESTRICT', // Prevent deletion of category if it has products
});

// Product associations
Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

Product.hasMany(Review, {
  foreignKey: 'productId',
  as: 'reviews',
  onDelete: 'CASCADE',
});

Product.hasMany(CartItem, {
  foreignKey: 'productId',
  as: 'cartItems',
  onDelete: 'CASCADE',
});

Product.hasMany(OrderItem, {
  foreignKey: 'productId',
  as: 'orderItems',
  onDelete: 'RESTRICT', // Prevent deletion of product if it's in orders
});

Product.hasMany(Wishlist, {
  foreignKey: 'productId',
  as: 'wishlistItems',
  onDelete: 'CASCADE',
});

// Review associations
Review.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Review.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// CartItem associations
CartItem.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

CartItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// Order associations
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE',
});

// OrderItem associations
OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// Wishlist associations
Wishlist.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Wishlist.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// Contact associations
Contact.belongsTo(User, {
  foreignKey: 'repliedBy',
  as: 'repliedByUser',
});

User.hasMany(Contact, {
  foreignKey: 'repliedBy',
  as: 'repliedContacts',
});

// Export all models
export {
  sequelize,
  User,
  Admin,

  Category,
  Product,
  Review,
  CartItem,
  Wishlist,
  Order,
  OrderItem,
  Contact,
  Newsletter,
  SiteSettings,
  HomePageSection,
  PaymentMethod,
};

// Export models object for easier access
export const models = {
  User,
  Admin,

  Category,
  Product,
  Review,
  CartItem,
  Wishlist,
  Order,
  OrderItem,
  Contact,
  Newsletter,
  SiteSettings,
  HomePageSection,
  PaymentMethod,
};

// Function to sync all models
export const syncModels = async (force: boolean = false): Promise<void> => {
  await sequelize.sync({ force });
  // console.log('✅ Database models synchronized successfully');
};

// Function to create initial data
export const seedDatabase = async (): Promise<void> => {
    // Check if data already exists
    const userCount = await User.count();
    if (userCount > 0) {
      // console.log('📊 Database already has data, skipping seed');
      return;
    }

    // console.log('🌱 Seeding database with initial data...');

    // Create admin user
    await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@ecommerce.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    });



    // Create categories
    const categories = await Category.bulkCreate([
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        isActive: true,
        sortOrder: 1,
        isMainCategory: true,
      },
      {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        isActive: true,
        sortOrder: 2,
        isMainCategory: true,
      },
      {
        name: 'Books',
        slug: 'books',
        description: 'Books and literature',
        isActive: true,
        sortOrder: 3,
        isMainCategory: true,
      },
      {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home improvement and gardening',
        isActive: true,
        sortOrder: 4,
        isMainCategory: false,
      },
      {
        name: 'Sports',
        slug: 'sports',
        description: 'Sports and outdoor equipment',
        isActive: true,
        sortOrder: 5,
        isMainCategory: false,
      },
    ]);

    // Create sample products
    const products = await Product.bulkCreate([
      {
        name: 'Wireless Bluetooth Headphones',
        slug: 'wireless-bluetooth-headphones',
        description: 'High-quality wireless headphones with noise cancellation and long battery life. Perfect for music lovers and professionals who demand crystal-clear audio quality.',
        shortDescription: 'Premium wireless headphones with excellent sound quality.',
        price: 199.99,
        salePrice: 149.99,
        sku: 'WBH-001',
        stock: 50,
        images: ['/uploads/products/headphones-1.svg'],
        categoryId: categories[0].id,
        isActive: true,
        isFeatured: true,
        isDigital: false,
        weight: 0.3,
        tags: ['wireless', 'bluetooth', 'headphones', 'audio'],
      },
      {
        name: 'Gaming Laptop Pro',
        slug: 'gaming-laptop-pro',
        description: 'High-performance gaming laptop with latest GPU, fast SSD, and premium display. Built for gamers and content creators who need maximum performance.',
        shortDescription: 'Powerful gaming laptop for professionals.',
        price: 1299.99,
        salePrice: 1199.99,
        sku: 'GLP-001',
        stock: 25,
        images: ['/uploads/products/laptop-1.svg'],
        categoryId: categories[0].id,
        isActive: true,
        isFeatured: true,
        isDigital: false,
        weight: 2.5,
        tags: ['laptop', 'gaming', 'computer', 'performance'],
      },
      {
        name: 'Smartphone Pro Max',
        slug: 'smartphone-pro-max',
        description: 'Latest flagship smartphone with advanced camera system, 5G connectivity, and all-day battery life. Experience the future of mobile technology.',
        shortDescription: 'Premium smartphone with advanced features.',
        price: 999.99,
        salePrice: 899.99,
        sku: 'SPM-001',
        stock: 40,
        images: ['/uploads/products/smartphone-1.svg'],
        categoryId: categories[0].id,
        isActive: true,
        isFeatured: true,
        isDigital: false,
        weight: 0.2,
        tags: ['smartphone', 'mobile', '5g', 'camera'],
      },
      {
        name: 'Premium Cotton T-Shirt',
        slug: 'premium-cotton-t-shirt',
        description: '100% organic cotton t-shirt with comfortable fit and breathable fabric. Sustainably sourced and ethically manufactured for conscious consumers.',
        shortDescription: 'Comfortable organic cotton t-shirt.',
        price: 29.99,
        salePrice: 24.99,
        sku: 'PCT-001',
        stock: 75,
        images: ['/uploads/products/tshirt-1.svg'],
        categoryId: categories[1].id,
        isActive: true,
        isFeatured: true,
        isDigital: false,
        weight: 0.2,
        tags: ['cotton', 'tshirt', 'clothing', 'organic'],
      },
      {
        name: 'Running Sneakers Elite',
        slug: 'running-sneakers-elite',
        description: 'Professional running shoes with advanced cushioning technology and breathable mesh upper. Designed for serious athletes and fitness enthusiasts.',
        shortDescription: 'High-performance running shoes.',
        price: 159.99,
        salePrice: 129.99,
        sku: 'RSE-001',
        stock: 60,
        images: ['/uploads/products/sneaker-1.svg'],
        categoryId: categories[4].id,
        isActive: true,
        isFeatured: true,
        isDigital: false,
        weight: 0.8,
        tags: ['sneakers', 'running', 'sports', 'fitness'],
      },
      {
        name: 'JavaScript Mastery Guide',
        slug: 'javascript-mastery-guide',
        description: 'Comprehensive guide to modern JavaScript development, covering ES6+, frameworks, and best practices. Perfect for developers looking to master JavaScript.',
        shortDescription: 'Complete JavaScript development guide.',
        price: 49.99,
        salePrice: 39.99,
        sku: 'JMG-001',
        stock: 100,
        images: ['/uploads/products/book-1.svg'],
        categoryId: categories[2].id,
        isActive: true,
        isFeatured: true,
        isDigital: true,
        tags: ['javascript', 'programming', 'book', 'development'],
      },
    ]);



    // Update product ratings
    for (const product of products) {
      await product.updateRating();
    }

  // console.log('✅ Database seeded successfully');
  // console.log(`👤 Admin user created: admin@ecommerce.com / admin123`);

  // console.log(`📦 Created ${categories.length} categories`);
  // console.log(`🛍️ Created ${products.length} products`);
};

// Function to drop all tables (use with caution)
export const dropAllTables = async (): Promise<void> => {
  await sequelize.drop();
  // console.log('🗑️ All tables dropped successfully');
};

// Export default
export default {
  sequelize,
  models,
  syncModels,
  seedDatabase,
  dropAllTables,
};