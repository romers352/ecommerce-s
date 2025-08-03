const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSiteSettingsTable() {
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
    
    // Create SiteSettings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS SiteSettings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(255) NOT NULL UNIQUE,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ SiteSettings table created');
    
    // Insert default maintenance mode setting
    await connection.execute(`
      INSERT IGNORE INTO SiteSettings (setting_key, setting_value) 
      VALUES ('maintenance_mode', 'true')
    `);
    
    console.log('✅ Default maintenance mode setting inserted');
    
    // Insert other default settings
    const defaultSettings = [
      ['site_name', 'E-commerce Store'],
      ['site_description', 'Your one-stop shop for digital products'],
      ['contact_email', 'contact@yourstore.com'],
      ['maintenance_message', 'We are currently performing scheduled maintenance. Please check back soon.']
    ];
    
    for (const [key, value] of defaultSettings) {
      await connection.execute(
        'INSERT IGNORE INTO SiteSettings (setting_key, setting_value) VALUES (?, ?)',
        [key, value]
      );
    }
    
    console.log('✅ Default settings inserted');
    
    // Verify the settings
    const [rows] = await connection.execute('SELECT * FROM SiteSettings');
    console.log('🔍 Current settings:');
    rows.forEach(row => {
      console.log(`   ${row.setting_key}: ${row.setting_value}`);
    });
    
    await connection.end();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createSiteSettingsTable();