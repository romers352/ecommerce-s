-- Create database for ecommerce application
CREATE DATABASE IF NOT EXISTS ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE ecommerce_db;

-- Grant privileges to root user (for XAMPP)
GRANT ALL PRIVILEGES ON ecommerce_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

-- Show confirmation
SELECT 'Database ecommerce_db created successfully!' AS message;