const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'ecommerce_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false
  }
);

// Define Product model (simplified)
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  salePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true
});

// Sample products data
const sampleProducts = [
  {
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with advanced camera system and A17 Pro chip',
    price: 999.99,
    salePrice: 899.99,
    stock: 50,
    sku: 'IPHONE15PRO-001',
    categoryId: 1, // Electronics
    images: [],
    isActive: true,
    isFeatured: true
  },
  {
    name: 'Samsung Galaxy S24',
    description: 'Flagship Android smartphone with AI features',
    price: 849.99,
    stock: 30,
    sku: 'GALAXY-S24-001',
    categoryId: 1, // Electronics
    images: [],
    isActive: true,
    isFeatured: true
  },
  {
    name: 'Nike Air Max 270',
    description: 'Comfortable running shoes with Air Max technology',
    price: 150.00,
    salePrice: 120.00,
    stock: 100,
    sku: 'NIKE-AM270-001',
    categoryId: 5, // Sports
    images: [],
    isActive: true,
    isFeatured: false
  },
  {
    name: 'Levi\'s 501 Jeans',
    description: 'Classic straight-fit jeans in vintage blue',
    price: 89.99,
    stock: 75,
    sku: 'LEVIS-501-001',
    categoryId: 2, // Clothing
    images: [],
    isActive: true,
    isFeatured: false
  },
  {
    name: 'The Great Gatsby',
    description: 'Classic American novel by F. Scott Fitzgerald',
    price: 12.99,
    stock: 200,
    sku: 'BOOK-GATSBY-001',
    categoryId: 3, // Books
    images: [],
    isActive: true,
    isFeatured: false
  },
  {
    name: 'Succulent Plant Set',
    description: 'Set of 6 assorted succulent plants for home decoration',
    price: 29.99,
    salePrice: 24.99,
    stock: 40,
    sku: 'PLANT-SUCC-001',
    categoryId: 4, // Home & Garden
    images: [],
    isActive: true,
    isFeatured: true
  },
  {
    name: 'MacBook Air M2',
    description: 'Lightweight laptop with M2 chip and 13-inch display',
    price: 1199.99,
    stock: 25,
    sku: 'MACBOOK-AIR-M2',
    categoryId: 1, // Electronics
    images: [],
    isActive: true,
    isFeatured: true
  },
  {
    name: 'Adidas Ultraboost 22',
    description: 'Premium running shoes with Boost midsole technology',
    price: 180.00,
    stock: 60,
    sku: 'ADIDAS-UB22-001',
    categoryId: 5, // Sports
    images: [],
    isActive: true,
    isFeatured: false
  }
];

async function seedProducts() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync the model
    await Product.sync();
    console.log('Product model synced.');

    // Check existing products
    const existingCount = await Product.count();
    console.log(`Current products count: ${existingCount}`);

    // Insert sample products
    for (const productData of sampleProducts) {
      try {
        const [product, created] = await Product.findOrCreate({
          where: { sku: productData.sku },
          defaults: productData
        });
        
        if (created) {
          console.log(`Created product: ${product.name}`);
        } else {
          console.log(`Product already exists: ${product.name}`);
        }
      } catch (error) {
        console.error(`Error creating product ${productData.name}:`, error.message);
      }
    }

    // Final count
    const finalCount = await Product.count();
    console.log(`\nSeeding completed! Total products: ${finalCount}`);

  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the seeding
seedProducts();