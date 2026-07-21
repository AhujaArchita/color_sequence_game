<?php
// backend/api/auth/login.php

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

$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';

// Validate fields
if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "SYS_ERR: Neural address and decrypt key are required."
    ]);
    exit();
}

try {
    // Retrieve user record by email
    $stmt = $conn->prepare("SELECT id, username, email, password_hash FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        // Verify the decrypt key (password) against the hash
        if (password_verify($password, $user['password_hash'])) {
            // Configure session security settings
            ini_set('session.cookie_httponly', 1);
            ini_set('session.use_only_cookies', 1);
            
            // Start secure session if not started
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            // Store session data
            $_SESSION['user_id'] = (int)$user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['email'] = $user['email'];
            
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "SYS_MSG: NEURAL LINK SYNCED!",
                "data" => [
                    "id" => (int)$user['id'],
                    "username" => $user['username'],
                    "email" => $user['email']
                ]
            ]);
            $stmt->close();
            exit();
        }
    }
    
    // Generic mismatch response for security
    http_response_code(401); // 401 Unauthorized
    echo json_encode([
        "success" => false,
        "message" => "ACCESS_DENIED: NEURAL_SIGNATURE_MISMATCH_OR_KEY_EXPIRED"
    ]);
    $stmt->close();
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
