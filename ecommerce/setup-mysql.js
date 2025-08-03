const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupMySQL() {
  console.log('🚀 Setting up MySQL database for ecommerce application...');
  
  try {
    // Create connection without database first
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Create database
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'ecommerce_db'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${process.env.DB_NAME || 'ecommerce_db'}' created/verified`);
    
    // Grant privileges
    await connection.execute(`GRANT ALL PRIVILEGES ON ${process.env.DB_NAME || 'ecommerce_db'}.* TO '${process.env.DB_USER || 'root'}'@'localhost'`);
    await connection.execute('FLUSH PRIVILEGES');
    console.log('✅ Privileges granted');
    
    await connection.end();
    
    console.log('\n🎉 MySQL database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Make sure XAMPP MySQL service is running');
    console.log('2. Run: npm run dev (in backend folder)');
    console.log('3. Your application will now use MySQL instead of SQLite');
    
  } catch (error) {
    console.error('❌ Error setting up MySQL:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure XAMPP is installed and MySQL service is running');
    console.log('2. Check your .env file database credentials');
    console.log('3. Ensure MySQL port 3306 is not blocked');
  }
}

setupMySQL();