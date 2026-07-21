<?php
// backend/api/categories/delete.php

// Set headers for JSON response and CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST' && $method !== 'DELETE') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed. Only POST or DELETE requests are accepted."
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
        "message" => "Unable to delete category. A valid 'id' is required."
    ]);
    exit();
}

$id = (int)$data['id'];

try {
    // Prepare DELETE query using MySQLi prepared statements
    $stmt = $conn->prepare("DELETE FROM categories WHERE id = ?");
    
    // Bind parameters ("i" for integer)
    $stmt->bind_param("i", $id);
    
    // Execute query
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Category deleted successfully."
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Category not found or already deleted."
            ]);
        }
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to delete category."
        ]);
    }
    
    $stmt->close();
} catch (mysqli_sql_exception $e) {
    // Check for foreign key constraint violation (error code 1451)
    if ($e->getCode() === 1451) {
        http_response_code(409); // 409 Conflict
        echo json_encode([
            "success" => false,
            "message" => "Cannot delete category. There are active products linked to this category."
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
