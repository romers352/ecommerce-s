const mysql = require('mysql2/promise');
require('dotenv').config();

async function toggleMaintenanceMode(enable = true) {
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
    
    // Update maintenance mode setting
    await connection.execute(
      "UPDATE site_settings SET maintenance_mode = ?, updated_at = NOW() WHERE id = 1",
      [enable]
    );
    
    console.log(`✅ Maintenance mode ${enable ? 'enabled' : 'disabled'}`);
    
    // Verify the change
    const [verification] = await connection.execute(
      "SELECT id, site_name, maintenance_mode FROM site_settings WHERE id = 1"
    );
    
    console.log('🔍 Current maintenance mode setting:', verification[0]);
    
    await connection.end();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get command line argument to enable/disable
const action = process.argv[2];
if (action === 'disable') {
  toggleMaintenanceMode(false);
} else {
  toggleMaintenanceMode(true);
}