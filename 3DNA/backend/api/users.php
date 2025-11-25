<?php
/**
 * Users API
 * Handle user management (drivers, passengers, admins)
 */

require_once '../config/Database.php';

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        listUsers();
    } elseif ($action === 'get') {
        getUser($_GET['id'] ?? 0);
    } elseif ($action === 'stats') {
        getUserStats($_GET['type'] ?? '');
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'create') {
        createUser();
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if ($action === 'delete') {
        deleteUser($_GET['id'] ?? 0);
    }
}

function listUsers() {
    global $pdo;
    
    $type = $_GET['type'] ?? '';
    
    try {
        if ($type) {
            $stmt = $pdo->prepare('
                SELECT u.*, b.bus_number
                FROM users u
                LEFT JOIN buses b ON u.user_id = b.driver_id
                WHERE u.user_type = ?
                ORDER BY u.full_name
            ');
            $stmt->execute([$type]);
        } else {
            $stmt = $pdo->prepare('
                SELECT u.*, b.bus_number
                FROM users u
                LEFT JOIN buses b ON u.user_id = b.driver_id
                ORDER BY u.user_type, u.full_name
            ');
            $stmt->execute();
        }
        
        $users = $stmt->fetchAll();
        
        sendResponse(true, 'Users retrieved', ['users' => $users]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getUser($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('
            SELECT u.*, b.bus_id, b.bus_number
            FROM users u
            LEFT JOIN buses b ON u.user_id = b.driver_id
            WHERE u.user_id = ?
        ');
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendResponse(false, 'User not found');
        }
        
        sendResponse(true, 'User retrieved', ['user' => $user]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getUserStats($type) {
    global $pdo;
    
    try {
        if ($type) {
            $stmt = $pdo->prepare('
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
                FROM users
                WHERE user_type = ?
            ');
            $stmt->execute([$type]);
        } else {
            $stmt = $pdo->prepare('
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
                FROM users
            ');
            $stmt->execute();
        }
        
        $stats = $stmt->fetch();
        
        sendResponse(true, 'Stats retrieved', $stats);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function createUser() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $user_type = $input['user_type'] ?? '';
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $full_name = $input['full_name'] ?? '';
    $phone = $input['phone'] ?? '';
    
    if (empty($user_type) || empty($email) || empty($password) || empty($full_name)) {
        sendResponse(false, 'Required fields missing');
    }
    
    try {
        // Check if user exists
        $checkStmt = $pdo->prepare('SELECT user_id FROM users WHERE email = ?');
        $checkStmt->execute([$email]);
        
        if ($checkStmt->fetch()) {
            sendResponse(false, 'Email already exists');
        }
        
        // Create user
        $password_hash = password_hash($password, PASSWORD_BCRYPT);
        
        $stmt = $pdo->prepare('
            INSERT INTO users (user_type, email, password_hash, full_name, phone, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        ');
        $stmt->execute([$user_type, $email, $password_hash, $full_name, $phone]);
        
        $user_id = $pdo->lastInsertId();
        
        // Log the creation
        $logStmt = $pdo->prepare('
            INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, description)
            VALUES (?, ?, ?, ?, ?)
        ');
        $logStmt->execute([
            $_SESSION['user_id'] ?? null,
            'user_created',
            'user',
            $user_id,
            "New {$user_type} user created: {$full_name}"
        ]);
        
        sendResponse(true, 'User created successfully', ['user_id' => $user_id]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

function deleteUser($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('DELETE FROM users WHERE user_id = ?');
        $stmt->execute([$id]);
        
        sendResponse(true, 'User deleted successfully');
        
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

?>
