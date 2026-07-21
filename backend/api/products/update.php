<?php
// backend/api/products/update.php

// CORS headers
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

// Include database connection
require_once '../../config/db.php';

$conn = getDbConnection();

// Read input values from $_POST (since request is multipart/form-data)
$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$category_id = isset($_POST['category_id']) ? (int)$_POST['category_id'] : 0;
$description = isset($_POST['description']) ? trim($_POST['description']) : null;
$price = isset($_POST['price']) ? (float)$_POST['price'] : -1.0;
$stock_quantity = isset($_POST['stock_quantity']) ? (int)$_POST['stock_quantity'] : -1;

// Validations
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Valid product ID is required."]);
    exit();
}

if (empty($name)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Product name is required."]);
    exit();
}

if ($category_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Valid category ID is required."]);
    exit();
}

if ($price < 0.0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Price cannot be negative."]);
    exit();
}

if ($stock_quantity < 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Stock quantity cannot be negative."]);
    exit();
}

try {
    // 1. Fetch current product details to handle old image deletion
    $prod_stmt = $conn->prepare("SELECT category_id, name, description, price, stock_quantity, image_url FROM products WHERE id = ?");
    $prod_stmt->bind_param("i", $id);
    $prod_stmt->execute();
    $result = $prod_stmt->get_result();
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Product with ID $id not found."]);
        $prod_stmt->close();
        exit();
    }
    $existing_product = $result->fetch_assoc();
    $prod_stmt->close();

    // 2. Verify that category exists in the database
    $cat_stmt = $conn->prepare("SELECT id FROM categories WHERE id = ?");
    $cat_stmt->bind_param("i", $category_id);
    $cat_stmt->execute();
    $cat_stmt->store_result();
    if ($cat_stmt->num_rows === 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Category with ID $category_id does not exist."]);
        $cat_stmt->close();
        exit();
    }
    $cat_stmt->close();

    // 3. Handle image upload if a new file is provided
    $image_path = $existing_product['image_url']; // Keep existing image path by default
    
    if (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
        $file = $_FILES['image'];
        
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "File upload error code: " . $file['error']]);
            exit();
        }
        
        // Validate size (max 2MB)
        if ($file['size'] > 2 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Image file size exceeds limit of 2MB."]);
            exit();
        }
        
        // Validate MIME type
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        $file_mime = mime_content_type($file['tmp_name']);
        if (!in_array($file_mime, $allowed_types)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed."]);
            exit();
        }
        
        // Determine file extension
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        if (empty($ext)) {
            $ext_map = ['image/jpeg' => 'jpg', 'image/jpg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
            $ext = $ext_map[$file_mime] ?? 'jpg';
        }
        
        // Generate a safe unique name
        $new_filename = uniqid('prod_', true) . '.' . $ext;
        
        // Ensure uploads directory exists
        $upload_dir = '../../uploads/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        
        $destination = $upload_dir . $new_filename;
        if (move_uploaded_file($file['tmp_name'], $destination)) {
            $image_path = 'uploads/' . $new_filename;
            
            // Delete the old image file from disk if it exists
            if (!empty($existing_product['image_url'])) {
                $old_file_path = '../../' . $existing_product['image_url'];
                if (file_exists($old_file_path)) {
                    unlink($old_file_path);
                }
            }
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to save uploaded image file."]);
            exit();
        }
    }

    // 4. Update the database record using MySQLi prepared statements
    $stmt = $conn->prepare("UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, stock_quantity = ?, image_url = ? WHERE id = ?");
    $stmt->bind_param("issdisi", $category_id, $name, $description, $price, $stock_quantity, $image_path, $id);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Product updated successfully.",
            "data" => [
                "id" => $id,
                "category_id" => $category_id,
                "name" => $name,
                "description" => $description,
                "price" => $price,
                "stock_quantity" => $stock_quantity,
                "image_url" => $image_path
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to update product details."]);
    }
    $stmt->close();
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
} finally {
    $conn->close();
}
?>
