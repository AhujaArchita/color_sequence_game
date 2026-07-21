<?php
// backend/api/scores/leaderboard.php

// CORS and response headers
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

// Include database connection
require_once '../../config/db.php';

$conn = getDbConnection();

// Start session if not started to determine which row belongs to the current user
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$current_user_id = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;

// Read query parameters
$time_scope = isset($_GET['time_scope']) ? trim($_GET['time_scope']) : 'all-time';
$rules_mode = isset($_GET['rules_mode']) ? trim($_GET['rules_mode']) : '';
$game_mode = isset($_GET['game_mode']) ? trim($_GET['game_mode']) : '';
$difficulty = isset($_GET['difficulty']) ? trim($_GET['difficulty']) : '';
$search = isset($_GET['q']) ? trim($_GET['q']) : '';

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) {
    $page = 1;
}
if ($limit < 1) {
    $limit = 10;
}
if ($limit > 100) {
    $limit = 100;
}
$offset = ($page - 1) * $limit;

// Verify valid time scope parameter
$allowed_time_scopes = ['daily', 'weekly', 'monthly', 'all-time'];
if (!in_array($time_scope, $allowed_time_scopes)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "SYS_ERR: Invalid time scope parameter."
    ]);
    exit();
}

try {
    // Build conditions dynamically for the WHERE clause
    $conditions = [];
    $params = [];
    $types = '';
    
    // Add time scope filter
    if ($time_scope === 'daily') {
        $conditions[] = "s.played_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
    } elseif ($time_scope === 'weekly') {
        $conditions[] = "s.played_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } elseif ($time_scope === 'monthly') {
        $conditions[] = "s.played_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    }
    
    // Optional filters
    if ($rules_mode !== '') {
        $conditions[] = "s.rules_mode = ?";
        $params[] = $rules_mode;
        $types .= 's';
    }
    
    if ($game_mode !== '') {
        $conditions[] = "s.game_mode = ?";
        $params[] = $game_mode;
        $types .= 's';
    }
    
    if ($difficulty !== '') {
        $conditions[] = "s.difficulty = ?";
        $params[] = $difficulty;
        $types .= 's';
    }
    
    if ($search !== '') {
        $conditions[] = "u.username LIKE ?";
        $search_wildcard = "%" . $search . "%";
        $params[] = $search_wildcard;
        $types .= 's';
    }
    
    $where_clause = '';
    if (!empty($conditions)) {
        $where_clause = " WHERE " . implode(" AND ", $conditions);
    }
    
    // 1. Count distinct users that have scores matching criteria
    $count_query = "SELECT COUNT(DISTINCT s.user_id) as total 
                    FROM scores s 
                    INNER JOIN users u ON s.user_id = u.id" . $where_clause;
                    
    $count_stmt = $conn->prepare($count_query);
    if (!empty($params)) {
        $count_stmt->bind_param($types, ...$params);
    }
    $count_stmt->execute();
    $count_res = $count_stmt->get_result()->fetch_assoc();
    $total_records = (int)$count_res['total'];
    $count_stmt->close();
    
    // 2. Fetch leaders - each user's single highest score, sorted by score & accuracy
    $query = "SELECT u.id as user_id, u.username, s.score, s.level, s.accuracy, s.streak, s.played_at 
              FROM scores s
              INNER JOIN users u ON s.user_id = u.id
              INNER JOIN (
                  SELECT user_id, MAX(score) as max_score 
                  FROM scores s2
                  INNER JOIN users u2 ON s2.user_id = u2.id
                  " . (!empty($conditions) ? str_replace(['s.', 'u.'], ['s2.', 'u2.'], $where_clause) : '') . "
                  GROUP BY user_id
              ) ms ON s.user_id = ms.user_id AND s.score = ms.max_score
              " . $where_clause . "
              GROUP BY s.user_id
              ORDER BY s.score DESC, s.accuracy DESC, s.played_at ASC
              LIMIT ? OFFSET ?";
              
    $stmt = $conn->prepare($query);
    
    // Double params because the subquery and outer query share the same WHERE parameters
    $double_types = $types . $types . 'ii';
    $double_params = array_merge($params, $params, [$limit, $offset]);
    
    $stmt->bind_param($double_types, ...$double_params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $rows = [];
    $rank = $offset + 1;
    while ($row = $result->fetch_assoc()) {
        $rows[] = [
            "rank" => $rank++,
            "name" => $row['username'],
            "score" => number_format((int)$row['score']),
            "raw_score" => (int)$row['score'],
            "level" => (int)$row['level'],
            "accuracy" => (float)$row['accuracy'],
            "streak" => (int)$row['streak'],
            "isUser" => ($current_user_id > 0 && (int)$row['user_id'] === $current_user_id),
            "played_at" => $row['played_at']
        ];
    }
    $stmt->close();
    
    $total_pages = ($total_records > 0) ? (int)ceil($total_records / $limit) : 0;
    
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => [
            "rows" => $rows,
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
