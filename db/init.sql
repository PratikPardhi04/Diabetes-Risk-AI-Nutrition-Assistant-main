-- ================================================
-- Database Initialization Script
-- ================================================
-- This script initializes the patient_db database
-- It is automatically executed when the MySQL container starts for the first time
-- ================================================

-- Create database if it doesn't exist (already created by MYSQL_DATABASE env var, but included for safety)
CREATE DATABASE IF NOT EXISTS patient_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE patient_db;

-- Grant privileges to admin user (already granted by MYSQL_USER env var, but included for clarity)
GRANT ALL PRIVILEGES ON patient_db.* TO 'admin'@'%';
FLUSH PRIVILEGES;

-- Display success message
SELECT 'Database patient_db initialized successfully!' AS Status;

