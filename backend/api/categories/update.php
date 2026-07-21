<?php
// backend/api/categories/update.php

// Set headers for JSON response and CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, PUT");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST' && $method !== 'PUT') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed. Only POST or PUT requests are accepted."
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
if (empty($data['id']) || (int)$data['id'] <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Unable to update category. A valid 'id' is required."
    ]);
    exit();
}

if (empty($data['name']) || trim($data['name']) === '') {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Unable to update category. 'name' is required and cannot be empty."
    ]);
    exit();
}

$id = (int)$data['id'];
$name = trim($data['name']);
$description = isset($data['description']) ? trim($data['description']) : null;

try {
    // Prepare UPDATE query using MySQLi prepared statements
    $stmt = $conn->prepare("UPDATE categories SET name = ?, description = ? WHERE id = ?");
    
    // Bind parameters ("ssi" for string, string, integer)
    $stmt->bind_param("ssi", $name, $description, $id);
    
    // Execute query
    if ($stmt->execute()) {
        // affected_rows can be 0 if the values updated are identical to existing ones.
        // Thus, we check success of query execution itself.
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Category updated successfully.",
            "data" => [
                "id" => $id,
                "name" => $name,
                "description" => $description
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to update category."
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
