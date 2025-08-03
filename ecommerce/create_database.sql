-- SQL script to create the ecommerce database in XAMPP
-- Run this in phpMyAdmin (http://localhost/phpmyadmin)

CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

-- The application will automatically create tables when it starts
-- No need to create tables manually - Sequelize will handle this

SELECT 'Database ecommerce_db created successfully!' AS message;