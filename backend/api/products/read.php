<?php
// backend/api/products/read.php

// Set headers for JSON response and CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Check if request method is GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed. Only GET requests are accepted."
    ]);
    exit();
}

// Include database connection configuration
require_once '../../config/db.php';

// Get database connection
$conn = getDbConnection();

// Read query parameters
$search = isset($_GET['q']) ? trim($_GET['q']) : '';
$category_id = isset($_GET['category_id']) ? (int)$_GET['category_id'] : 0;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

// Validate pagination inputs
if ($page < 1) {
    $page = 1;
}
if ($limit < 1) {
    $limit = 10;
}
if ($limit > 100) {
    $limit = 100; // Cap maximum limit to prevent excessive loading
}

$offset = ($page - 1) * $limit;

try {
    // Dynamically build the SQL statement conditions
    $conditions = [];
    $params = [];
    $types = '';
    
    // Add search condition
    if ($search !== '') {
        $conditions[] = "(p.name LIKE ? OR p.description LIKE ?)";
        $search_wildcard = "%" . $search . "%";
        $params[] = $search_wildcard;
        $params[] = $search_wildcard;
        $types .= 'ss';
    }
    
    // Add category filter condition
    if ($category_id > 0) {
        $conditions[] = "p.category_id = ?";
        $params[] = $category_id;
        $types .= 'i';
    }
    
    // Combine conditions
    $where_clause = '';
    if (!empty($conditions)) {
        $where_clause = " WHERE " . implode(" AND ", $conditions);
    }
    
    // 1. Get total records count matching the conditions
    $count_query = "SELECT COUNT(*) as total FROM products p" . $where_clause;
    $count_stmt = $conn->prepare($count_query);
    if (!empty($params)) {
        $count_stmt->bind_param($types, ...$params);
    }
    $count_stmt->execute();
    $count_result = $count_stmt->get_result();
    $row = $count_result->fetch_assoc();
    $total_records = (int)$row['total'];
    $count_stmt->close();
    
    // 2. Fetch product records with category details and pagination
    $query = "SELECT p.id, p.category_id, c.name as category_name, p.name, p.description, p.price, p.stock_quantity, p.image_url, p.created_at 
              FROM products p 
              INNER JOIN categories c ON p.category_id = c.id" . 
              $where_clause . " 
              ORDER BY p.created_at DESC 
              LIMIT ? OFFSET ?";
              
    $stmt = $conn->prepare($query);
    
    // Append limit and offset parameters
    $data_types = $types . 'ii';
    $data_params = array_merge($params, [$limit, $offset]);
    
    $stmt->bind_param($data_types, ...$data_params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = [
            "id" => (int)$row['id'],
            "category" => [
                "id" => (int)$row['category_id'],
                "name" => $row['category_name']
            ],
            "name" => $row['name'],
            "description" => $row['description'],
            "price" => (float)$row['price'],
            "stock_quantity" => (int)$row['stock_quantity'],
            "image_url" => $row['image_url'],
            "created_at" => $row['created_at']
        ];
    }
    $stmt->close();
    
    // Calculate pagination metadata
    $total_pages = ($total_records > 0) ? (int)ceil($total_records / $limit) : 0;
    
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => [
            "products" => $products,
            "pagination" => [
                "total_records" => $total_records,
                "total_pages" => $total_pages,
                "current_page" => $page,
                "limit" => $limit
            ]
        ]
    ]);
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
