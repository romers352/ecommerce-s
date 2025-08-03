const mysql = require('mysql2/promise');
require('dotenv').config();

async function disableMaintenanceMode() {
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
    
    // Update maintenance mode setting to false
    await connection.execute(
      "UPDATE SiteSettings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?",
      ['false', 'maintenance_mode']
    );
    
    console.log('✅ Maintenance mode disabled');
    
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

disableMaintenanceMode();