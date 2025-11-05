-- ================================================
-- Create Tables Script for Patient Database
-- ================================================
-- This script creates all required tables for the Diabetes Risk & AI Nutrition Assistant
-- ================================================

USE patient_db;

-- ================================================
-- Table: users
-- Description: Stores patient/user account information
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table: health_assessments
-- Description: Stores patient health assessment questionnaire data and AI risk predictions
-- ================================================
CREATE TABLE IF NOT EXISTS health_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(50) NOT NULL,
    height DECIMAL(10, 2) NOT NULL,
    weight DECIMAL(10, 2) NOT NULL,
    family_history BOOLEAN NOT NULL DEFAULT FALSE,
    activity VARCHAR(100) NOT NULL,
    smoking BOOLEAN NOT NULL DEFAULT FALSE,
    alcohol VARCHAR(50) NOT NULL,
    diet VARCHAR(50) NOT NULL,
    sleep INT NOT NULL,
    symptoms TEXT,
    risk_level VARCHAR(50) NOT NULL DEFAULT 'Pending',
    ai_reason TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_risk_level (risk_level),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table: meals
-- Description: Stores patient meal logs with AI-analyzed nutrition data
-- ================================================
CREATE TABLE IF NOT EXISTS meals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    meal_type VARCHAR(50) NOT NULL,
    meal_text TEXT NOT NULL,
    calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
    carbs DECIMAL(10, 2) NOT NULL DEFAULT 0,
    protein DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fat DECIMAL(10, 2) NOT NULL DEFAULT 0,
    sugar DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fiber DECIMAL(10, 2) NOT NULL DEFAULT 0,
    impact VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_meal_type (meal_type),
    INDEX idx_created_at (created_at),
    INDEX idx_impact (impact)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table: chats
-- Description: Stores patient chat interactions with AI health assistant
-- ================================================
CREATE TABLE IF NOT EXISTS chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Verification Queries
-- ================================================
SELECT 'Table: users created successfully' AS Status;
SELECT 'Table: health_assessments created successfully' AS Status;
SELECT 'Table: meals created successfully' AS Status;
SELECT 'Table: chats created successfully' AS Status;

-- Display table information
SHOW TABLES;

