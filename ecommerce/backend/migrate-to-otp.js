const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateToOTP() {
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

    // Add OTP columns if they don't exist
    if (!columnNames.includes('otp_code')) {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN otp_code VARCHAR(6) NULL AFTER email_verified
      `);
      console.log('✅ Added otp_code column');
    }

    if (!columnNames.includes('otp_expires')) {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN otp_expires DATETIME NULL AFTER otp_code
      `);
      console.log('✅ Added otp_expires column');
    }

    // Remove old email verification columns if they exist
    if (columnNames.includes('email_verification_token')) {
      await connection.execute(`
        ALTER TABLE users 
        DROP COLUMN email_verification_token
      `);
      console.log('✅ Removed email_verification_token column');
    }

    if (columnNames.includes('email_verification_expires')) {
      await connection.execute(`
        ALTER TABLE users 
        DROP COLUMN email_verification_expires
      `);
      console.log('✅ Removed email_verification_expires column');
    }

    // Update any unverified users to have verified status (for existing users)
    const [result] = await connection.execute(`
      UPDATE users 
      SET email_verified = 1 
      WHERE email_verified = 0 AND created_at < DATE_SUB(NOW(), INTERVAL 1 DAY)
    `);
    
    if (result.affectedRows > 0) {
      console.log(`✅ Updated ${result.affectedRows} old unverified users to verified status`);
    }

    console.log('🎉 Migration to OTP verification completed successfully!');
    console.log('📧 Users will now receive 6-digit OTP codes via email for verification');

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
migrateToOTP();