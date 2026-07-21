-- backend/config/schema.sql

CREATE DATABASE IF NOT EXISTS neon_sequence CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE neon_sequence;

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create scores table with foreign key linkage to users
CREATE TABLE IF NOT EXISTS scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score INT NOT NULL,
    level INT NOT NULL,
    accuracy DECIMAL(5, 2) NOT NULL,
    streak INT NOT NULL,
    game_mode VARCHAR(20) NOT NULL, -- 'normal', 'advanced'
    rules_mode VARCHAR(20) NOT NULL, -- 'classic', 'timer', 'survival', 'daily'
    difficulty VARCHAR(20) NOT NULL, -- 'easy', 'medium', 'hard'
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
