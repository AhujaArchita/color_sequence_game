<?php
// backend/config/db.php

// Database configuration constants
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'neon_sequence');

/**
 * Establishes and returns a MySQLi database connection.
 * 
 * @return mysqli The active database connection object.
 */
function getDbConnection() {
    // Enable exception throwing for mysqli errors
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        // Set charset to utf8mb4 for proper UTF-8 handling
        $conn->set_charset("utf8mb4");
        return $conn;
    } catch (mysqli_sql_exception $e) {
        // Set JSON response header and exit on connection failure
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Database connection failure: " . $e->getMessage()
        ]);
        exit();
    }
}
?>
