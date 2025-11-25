<?php
/**
 * Database Configuration
 * Connection settings for MySQL database
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'bus_tracking_db');

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Emulate prepares to allow LIMIT placeholders and wider compatibility
            PDO::ATTR_EMULATE_PREPARES => true
        ]
    );
} catch (PDOException $e) {
    // Output JSON on connection failure
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Suppress direct HTML error output and convert fatal errors to JSON responses
ini_set('display_errors', '0');
register_shutdown_function(function () {
    $err = error_get_last();
    if ($err !== null) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Server error: ' . ($err['message'] ?? 'Unknown')
        ]);
        exit;
    }
});

// Start session if not already started (some APIs use $_SESSION)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Function to send JSON response
function sendResponse($success, $message = '', $data = []) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        ...$data
    ]);
    exit;
}

// Function to get auth token
function getAuthToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $matches = [];
        if (preg_match('/Bearer\s+(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

// Simple token validation (in production, use JWT)
function validateToken($token) {
    // For demo, just check if token exists in session/cache
    // In production, use proper JWT validation
    return !empty($token);
}

?>
