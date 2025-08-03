const mysql = require('mysql2/promise');
require('dotenv').config();

async function addCategoryHierarchy() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ecommerce_db'
    });

    console.log('Connected to MySQL database');

    // Check if columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories' 
      AND COLUMN_NAME IN ('parent_id', 'is_main_category')
    `, [process.env.DB_NAME || 'ecommerce_db']);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    if (existingColumns.includes('parent_id') && existingColumns.includes('is_main_category')) {
      console.log('Category hierarchy columns already exist');
      return;
    }

    // Add parent_id column if it doesn't exist
    if (!existingColumns.includes('parent_id')) {
      await connection.execute(`
        ALTER TABLE categories 
        ADD COLUMN parent_id INT NULL,
        ADD CONSTRAINT fk_categories_parent 
        FOREIGN KEY (parent_id) REFERENCES categories(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('Added parent_id column with foreign key constraint');
    }

    // Add is_main_category column if it doesn't exist
    if (!existingColumns.includes('is_main_category')) {
      await connection.execute(`
        ALTER TABLE categories 
        ADD COLUMN is_main_category BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log('Added is_main_category column');
    }

    // Add indexes for better performance
    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)
    `);
    
    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_categories_is_main ON categories(is_main_category)
    `);
    
    console.log('Added indexes for parent_id and is_main_category');

    // Convert existing categories to main categories (max 3)
    const [existingCategories] = await connection.execute(`
      SELECT id, name FROM categories 
      WHERE is_active = 1 
      ORDER BY sort_order ASC, name ASC 
      LIMIT 3
    `);

    if (existingCategories.length > 0) {
      const categoryIds = existingCategories.map(cat => cat.id);
      await connection.execute(`
        UPDATE categories 
        SET is_main_category = TRUE 
        WHERE id IN (${categoryIds.map(() => '?').join(',')})
      `, categoryIds);
      
      console.log(`Converted ${existingCategories.length} existing categories to main categories:`);
      existingCategories.forEach(cat => {
        console.log(`- ${cat.name} (ID: ${cat.id})`);
      });
    }

    console.log('\n✅ Category hierarchy migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart your development server');
    console.log('2. Use the admin panel to manage main categories (max 3) and subcategories (max 30 per main category)');
    console.log('3. Main categories will appear in the navbar and footer');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  addCategoryHierarchy()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = addCategoryHierarchy;