<?php
// backend/api/scores/submit.php

// CORS and response headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Start secure session if not started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 1. Verify user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // 401 Unauthorized
    echo json_encode([
        "success" => false,
        "message" => "SYS_ERR: Authentication required. Please log in to sync scores."
    ]);
    exit();
}

$user_id = (int)$_SESSION['user_id'];

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

$score = isset($data['score']) ? (int)$data['score'] : -1;
$level = isset($data['level']) ? (int)$data['level'] : 0;
$accuracy = isset($data['accuracy']) ? (float)$data['accuracy'] : -1.0;
$streak = isset($data['streak']) ? (int)$data['streak'] : -1;
$game_mode = isset($data['game_mode']) ? trim($data['game_mode']) : '';
$rules_mode = isset($data['rules_mode']) ? trim($data['rules_mode']) : '';
$difficulty = isset($data['difficulty']) ? trim($data['difficulty']) : '';

// Validation of inputs
if ($score < 0 || $level < 1 || $accuracy < 0.0 || $accuracy > 100.00 || $streak < 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "SYS_ERR: Invalid metrics data (score, level, accuracy, or streak values)."
    ]);
    exit();
}

$allowed_game_modes = ['normal', 'advanced'];
$allowed_rules_modes = ['classic', 'timer', 'survival', 'daily'];
$allowed_difficulties = ['easy', 'medium', 'hard'];

if (!in_array($game_mode, $allowed_game_modes) || 
    !in_array($rules_mode, $allowed_rules_modes) || 
    !in_array($difficulty, $allowed_difficulties)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "SYS_ERR: Invalid game parameters (mode, rules mode, or difficulty)."
    ]);
    exit();
}

try {
    // Save the score in the database linked to the user
    $stmt = $conn->prepare("INSERT INTO scores (user_id, score, level, accuracy, streak, game_mode, rules_mode, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("iiiidsss", $user_id, $score, $level, $accuracy, $streak, $game_mode, $rules_mode, $difficulty);
    
    if ($stmt->execute()) {
        http_response_code(201); // 201 Created
        echo json_encode([
            "success" => true,
            "message" => "SYS_MSG: SCORE SYNCED SUCCESSFULLY!",
            "data" => [
                "id" => $conn->insert_id,
                "score" => $score,
                "level" => $level,
                "accuracy" => $accuracy,
                "streak" => $streak
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "SYS_ERR: Unable to write score details to server registry."
        ]);
    }
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
