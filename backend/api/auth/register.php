<?php
// backend/api/auth/register.php

// CORS and response headers
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

$conn = getDbConnection();

// Read JSON input from request body
$data = json_decode(file_get_contents("php://input"), true);

$username = isset($data['username']) ? trim($data['username']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';

// Server-side validation matching frontend patterns
if (empty($username) || !preg_match('/^[a-zA-Z0-9_]{3,15}$/', $username)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "SYS_ERR: Username must be alphanumeric or underscore, between 3 and 15 characters."
    ]);
    exit();
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "SYS_ERR: Invalid email format."
    ]);
    exit();
}

if (empty($password) || strlen($password) < 8) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "SYS_ERR: Password must be at least 8 characters long."
    ]);
    exit();
}

// Securely hash password using bcrypt
$password_hash = password_hash($password, PASSWORD_BCRYPT);

try {
    // Insert new user into database
    $stmt = $conn->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $username, $email, $password_hash);
    
    if ($stmt->execute()) {
        http_response_code(201); // 201 Created
        echo json_encode([
            "success" => true,
            "message" => "SYS_MSG: CALLSIGN ALLOCATED SUCCESSFULLY!"
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "SYS_ERR: Failed to create user registry."
        ]);
    }
    $stmt->close();
} catch (mysqli_sql_exception $e) {
    // Handle duplicate constraints
    if ($e->getCode() === 1062) {
        http_response_code(409); // 409 Conflict
        
        // Detect conflicting field
        $error_msg = "SYS_ERR: Callsign or email already registered.";
        if (strpos($e->getMessage(), 'username') !== false) {
            $error_msg = "SYS_ERR: CALLSIGN_ALREADY_REGISTERED";
        } elseif (strpos($e->getMessage(), 'email') !== false) {
            $error_msg = "SYS_ERR: EMAIL_ALREADY_REGISTERED";
        }
        
        echo json_encode([
            "success" => false,
            "message" => $error_msg
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
