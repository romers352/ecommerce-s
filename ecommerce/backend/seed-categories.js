const { Category } = require('./dist/models/index');
require('dotenv').config();

async function seedCategories() {
  try {
    console.log('🌱 Starting categories seeding...');
    
    // Check if categories already exist
    const categoryCount = await Category.count();
    console.log(`Current categories count: ${categoryCount}`);
    
    if (categoryCount > 0) {
      console.log('📊 Categories already exist, skipping seed');
      return;
    }
    
    // Create categories (8 total with 3 main categories)
    const categories = await Category.bulkCreate([
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices, gadgets, and technology products',
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'Clothing & Fashion',
        slug: 'clothing-fashion',
        description: 'Fashion, apparel, and accessories for all ages',
        isActive: true,
        sortOrder: 2,
      },
      {
        name: 'Home & Living',
        slug: 'home-living',
        description: 'Home improvement, furniture, and living essentials',
        isActive: true,
        sortOrder: 3,
      },
      {
        name: 'Sports & Outdoors',
        slug: 'sports-outdoors',
        description: 'Sports equipment, outdoor gear, and fitness products',
        isActive: true,
        sortOrder: 4,
      },
      {
        name: 'Books & Media',
        slug: 'books-media',
        description: 'Books, magazines, and educational materials',
        isActive: true,
        sortOrder: 5,
      },
      {
        name: 'Health & Beauty',
        slug: 'health-beauty',
        description: 'Health products, cosmetics, and personal care',
        isActive: true,
        sortOrder: 6,
      },
      {
        name: 'Toys & Games',
        slug: 'toys-games',
        description: 'Toys, games, and entertainment for children and adults',
        isActive: true,
        sortOrder: 7,
      },
      {
        name: 'Automotive',
        slug: 'automotive',
        description: 'Car accessories, parts, and automotive products',
        isActive: true,
        sortOrder: 8,
      },
    ]);
    
    console.log(`✅ Created ${categories.length} categories successfully`);
    
    // Verify categories were created
    const newCount = await Category.count();
    console.log(`New categories count: ${newCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();