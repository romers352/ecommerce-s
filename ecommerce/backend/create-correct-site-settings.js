const mysql = require('mysql2/promise');
require('dotenv').config();

async function createCorrectSiteSettingsTable() {
  try {
    console.log('🔄 Connecting to MySQL database...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ecommerce_db'
    });
    
    console.log('✅ Connected to MySQL database');
    
    // Create site_settings table (matching Sequelize model)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site_name VARCHAR(255) NOT NULL DEFAULT 'E-Commerce Store',
        site_description TEXT NOT NULL DEFAULT 'Your one-stop shop for quality products',
        favicon VARCHAR(255) NULL,
        logo VARCHAR(255) NULL,
        footer_logo VARCHAR(255) NULL,
        contact_email VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(255) NULL,
        address TEXT NULL,
        social_links JSON NOT NULL DEFAULT '{}',
        seo_title VARCHAR(255) NULL,
        seo_description TEXT NULL,
        seo_keywords TEXT NULL,
        maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ site_settings table created');
    
    // Insert default settings with maintenance mode enabled
    await connection.execute(`
      INSERT IGNORE INTO site_settings (
        site_name, 
        site_description, 
        contact_email, 
        maintenance_mode,
        social_links
      ) VALUES (
        'E-Commerce Store',
        'Your one-stop shop for quality products',
        'contact@example.com',
        TRUE,
        '{}'
      )
    `);
    
    console.log('✅ Default settings with maintenance mode enabled inserted');
    
    // Verify the settings
    const [rows] = await connection.execute('SELECT * FROM site_settings');
    console.log('🔍 Current settings:');
    rows.forEach(row => {
      console.log(`   ID: ${row.id}`);
      console.log(`   Site Name: ${row.site_name}`);
      console.log(`   Contact Email: ${row.contact_email}`);
      console.log(`   Maintenance Mode: ${row.maintenance_mode}`);
      console.log('   ---');
    });
    
    await connection.end();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createCorrectSiteSettingsTable();