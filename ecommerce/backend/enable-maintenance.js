const mysql = require('mysql2/promise');
require('dotenv').config();

async function enableMaintenanceMode() {
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
    
    // Check if SiteSettings table exists
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'SiteSettings'",
      [process.env.DB_NAME || 'ecommerce_db']
    );
    
    if (tables.length === 0) {
      console.log('❌ SiteSettings table does not exist');
      await connection.end();
      return;
    }
    
    console.log('✅ SiteSettings table found');
    
    // Check current maintenance mode status
    const [rows] = await connection.execute(
      "SELECT * FROM SiteSettings WHERE setting_key = 'maintenance_mode'"
    );
    
    if (rows.length === 0) {
      // Insert maintenance mode setting
      await connection.execute(
        "INSERT INTO SiteSettings (setting_key, setting_value, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
        ['maintenance_mode', 'true']
      );
      console.log('✅ Maintenance mode enabled (inserted new record)');
    } else {
      // Update existing maintenance mode setting
      await connection.execute(
        "UPDATE SiteSettings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?",
        ['true', 'maintenance_mode']
      );
      console.log('✅ Maintenance mode enabled (updated existing record)');
    }
    
    // Verify the change
    const [verification] = await connection.execute(
      "SELECT * FROM SiteSettings WHERE setting_key = 'maintenance_mode'"
    );
    
    console.log('🔍 Current maintenance mode setting:', verification[0]);
    
    await connection.end();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

enableMaintenanceMode();