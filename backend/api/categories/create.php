<?php
// backend/api/categories/create.php

// Set headers for JSON response and CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed. Only POST requests are accepted."
    ]);
    exit();
}

// Include database connection configuration
require_once '../../config/db.php';

// Get database connection
$conn = getDbConnection();

// Read JSON input from request body
$data = json_decode(file_get_contents("php://input"), true);

// Validate input data
if (empty($data['name']) || trim($data['name']) === '') {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Unable to create category. 'name' is required and cannot be empty."
    ]);
    exit();
}

$name = trim($data['name']);
$description = isset($data['description']) ? trim($data['description']) : null;

try {
    // Prepare INSERT query using MySQLi prepared statements
    $stmt = $conn->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
    
    // Bind parameters ("s" for string)
    $stmt->bind_param("ss", $name, $description);
    
    // Execute query
    if ($stmt->execute()) {
        $last_id = $conn->insert_id;
        http_response_code(201); // 201 Created
        echo json_encode([
            "success" => true,
            "message" => "Category created successfully.",
            "data" => [
                "id" => $last_id,
                "name" => $name,
                "description" => $description
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to create category."
        ]);
    }
    
    $stmt->close();
} catch (mysqli_sql_exception $e) {
    // Check for duplicate entry constraint violation (error code 1062)
    if ($e->getCode() === 1062) {
        http_response_code(409); // 409 Conflict
        echo json_encode([
            "success" => false,
            "message" => "Category name already exists. Please choose a unique name."
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ]);
    }
} finally {
    $conn->close();
}
?>
