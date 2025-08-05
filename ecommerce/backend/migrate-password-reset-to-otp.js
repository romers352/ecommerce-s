const mysql = require('mysql2/promise');
require('dotenv').config();

async function migratePasswordResetToOTP() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ecommerce_db'
    });

    console.log('🔗 Connected to database');

    // Check if columns exist before making changes
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    `, [process.env.DB_NAME || 'ecommerce_db']);

    const columnNames = columns.map(col => col.COLUMN_NAME);
    console.log('📋 Current columns:', columnNames);

    // Add password reset OTP columns if they don't exist
    if (!columnNames.includes('password_reset_otp')) {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN password_reset_otp VARCHAR(6) NULL AFTER password_reset_expires
      `);
      console.log('✅ Added password_reset_otp column');
    }

    if (!columnNames.includes('password_reset_otp_expires')) {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN password_reset_otp_expires DATETIME NULL AFTER password_reset_otp
      `);
      console.log('✅ Added password_reset_otp_expires column');
    }

    // Remove old password reset token columns if they exist
    if (columnNames.includes('password_reset_token')) {
      await connection.execute(`
        ALTER TABLE users 
        DROP COLUMN password_reset_token
      `);
      console.log('✅ Removed password_reset_token column');
    }

    if (columnNames.includes('password_reset_expires')) {
      await connection.execute(`
        ALTER TABLE users 
        DROP COLUMN password_reset_expires
      `);
      console.log('✅ Removed password_reset_expires column');
    }

    console.log('🎉 Migration to OTP-based password reset completed successfully!');
    console.log('📧 Users will now receive 6-digit OTP codes via email for password reset');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
migratePasswordResetToOTP();