<?php
// backend/config/create_db.php

// Database connection parameters without selecting a database
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');

header("Content-Type: application/json; charset=UTF-8");

// Enable exception throwing for mysqli errors
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    // Establish connection to MySQL server
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS);
    
    // SQL query to create database
    $sql = "CREATE DATABASE IF NOT EXISTS neon_sequence CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
    
    if ($conn->query($sql) === TRUE) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Database 'neon_sequence' created or verified successfully."
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error creating database."
        ]);
    }
    
    $conn->close();
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection/execution failure: " . $e->getMessage()
    ]);
}
?>
