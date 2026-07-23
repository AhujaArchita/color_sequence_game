<?php
// backend/config/setup_tables.php

// Include database connection config
require_once 'db.php';
$conn = getDbConnection();

header("Content-Type: application/json; charset=UTF-8");

try {
    // 1. Create users table query
    $users_table = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $conn->query($users_table);

    // 2. Create scores table query
    $scores_table = "CREATE TABLE IF NOT EXISTS scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        score INT NOT NULL,
        level INT NOT NULL,
        accuracy DECIMAL(5, 2) NOT NULL,
        streak INT NOT NULL,
        game_mode VARCHAR(20) NOT NULL,
        rules_mode VARCHAR(20) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $conn->query($scores_table);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Database tables ('users' and 'scores') created or verified successfully in 'neon_sequence' database."
    ]);
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error creating tables: " . $e->getMessage()
    ]);
} finally {
    $conn->close();
}
?>
