<?php
// backend/api/products/delete.php

// CORS headers
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

// Include database connection
require_once '../../config/db.php';

$conn = getDbConnection();

// Read JSON input from request body
$data = json_decode(file_get_contents("php://input"), true);

// Validate input data
if (empty($data['id']) || (int)$data['id'] <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Unable to delete product. A valid 'id' is required."
    ]);
    exit();
}

$id = (int)$data['id'];

try {
    // 1. Fetch product record first to locate the image path
    $select_stmt = $conn->prepare("SELECT image_url FROM products WHERE id = ?");
    $select_stmt->bind_param("i", $id);
    $select_stmt->execute();
    $result = $select_stmt->get_result();
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Product not found."
        ]);
        $select_stmt->close();
        exit();
    }
    $product = $result->fetch_assoc();
    $select_stmt->close();
    
    // 2. Delete the associated image file from disk if it exists
    if (!empty($product['image_url'])) {
        $file_path = '../../' . $product['image_url'];
        if (file_exists($file_path)) {
            unlink($file_path);
        }
    }
    
    // 3. Delete the product record from the database using MySQLi prepared statements
    $delete_stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
    $delete_stmt->bind_param("i", $id);
    
    if ($delete_stmt->execute()) {
        if ($delete_stmt->affected_rows > 0) {
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Product deleted successfully."
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Product not found or already deleted."
            ]);
        }
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to delete product."
        ]);
    }
    $delete_stmt->close();
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
} finally {
    $conn->close();
}
?>
