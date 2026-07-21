<?php
// backend/api/categories/read.php

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
    $total_records = 0;
    $categories = [];
    
    if ($search !== '') {
        // 1. Get total records count matching the search query
        $count_query = "SELECT COUNT(*) as total FROM categories WHERE name LIKE ? OR description LIKE ?";
        $count_stmt = $conn->prepare($count_query);
        $search_wildcard = "%" . $search . "%";
        $count_stmt->bind_param("ss", $search_wildcard, $search_wildcard);
        $count_stmt->execute();
        $result = $count_stmt->get_result();
        $row = $result->fetch_assoc();
        $total_records = (int)$row['total'];
        $count_stmt->close();
        
        // 2. Fetch search results with pagination parameters
        $query = "SELECT id, name, description FROM categories WHERE name LIKE ? OR description LIKE ? LIMIT ? OFFSET ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ssii", $search_wildcard, $search_wildcard, $limit, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $categories[] = $row;
        }
        $stmt->close();
    } else {
        // 1. Get total records count for all categories
        $count_query = "SELECT COUNT(*) as total FROM categories";
        $count_stmt = $conn->prepare($count_query);
        $count_stmt->execute();
        $result = $count_stmt->get_result();
        $row = $result->fetch_assoc();
        $total_records = (int)$row['total'];
        $count_stmt->close();
        
        // 2. Fetch all categories with pagination parameters
        $query = "SELECT id, name, description FROM categories LIMIT ? OFFSET ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ii", $limit, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $categories[] = $row;
        }
        $stmt->close();
    }
    
    // Calculate total pages
    $total_pages = ($total_records > 0) ? (int)ceil($total_records / $limit) : 0;
    
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => [
            "categories" => $categories,
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
