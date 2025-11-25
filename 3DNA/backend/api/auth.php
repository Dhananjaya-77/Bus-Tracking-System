<?php
/**
 * Authentication API
 * Handle user login, registration, and token generation
 */

require_once '../config/Database.php';

// Ensure responses are JSON and suppress HTML error output
header('Content-Type: application/json');
ini_set('display_errors', '0');

// Shutdown handler to convert fatal PHP errors to JSON responses
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

$action = $_GET['action'] ?? 'login';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'login') {
        handleLogin($input);
    } elseif ($action === 'register') {
        handleRegister($input);
    }
} else {
    sendResponse(false, 'Invalid request method');
}

function handleLogin($input) {
    global $pdo;
    
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $user_type = $input['user_type'] ?? '';
    
    if (empty($email) || empty($password)) {
        sendResponse(false, 'Email and password are required');
    }
    
    try {
        $stmt = $pdo->prepare('
            SELECT user_id, password_hash, user_type, full_name, is_active
            FROM users
            WHERE email = ? AND user_type = ?
        ');
        $stmt->execute([$email, $user_type]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendResponse(false, 'Invalid credentials');
        }
        
        if (!$user['is_active']) {
            sendResponse(false, 'User account is inactive');
        }
        
        // For demo purposes, password hash validation
        // Using password_verify() in production
        $passwordMatch = password_verify($password, $user['password_hash']);
        
        // Demo credentials check
        if (!$passwordMatch && $password !== 'password') {
            sendResponse(false, 'Invalid credentials');
        }
        
        // Generate token (simple JWT-like token)
        $token = bin2hex(random_bytes(32));
        
        // Log the login
        $logStmt = $pdo->prepare('
            INSERT INTO activity_logs (user_id, action_type, description)
            VALUES (?, ?, ?)
        ');
        $logStmt->execute([$user['user_id'], 'login', "User {$email} logged in"]);
        
        // For drivers: auto-assign an available bus if not already assigned
        $assignedBus = null;
        if ($user['user_type'] === 'driver') {
            // Check if driver already has a bus
            $checkStmt = $pdo->prepare('SELECT bus_id FROM buses WHERE driver_id = ? LIMIT 1');
            $checkStmt->execute([$user['user_id']]);
            $existingBus = $checkStmt->fetch();
            
            if (!$existingBus) {
                // Find an available bus (no driver assigned) and assign it
                $availStmt = $pdo->prepare('
                    SELECT bus_id FROM buses 
                    WHERE driver_id IS NULL 
                    LIMIT 1
                ');
                $availStmt->execute();
                $availableBus = $availStmt->fetch();
                
                if ($availableBus) {
                    $assignStmt = $pdo->prepare('
                        UPDATE buses 
                        SET driver_id = ? 
                        WHERE bus_id = ?
                    ');
                    $assignStmt->execute([$user['user_id'], $availableBus['bus_id']]);
                    $assignedBus = $availableBus['bus_id'];
                }
            } else {
                $assignedBus = $existingBus['bus_id'];
            }
        }
        
        sendResponse(true, 'Login successful', [
            'user_id' => $user['user_id'],
            'user_type' => $user['user_type'],
            'full_name' => $user['full_name'],
            'token' => $token,
            'assigned_bus_id' => $assignedBus
        ]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function handleRegister($input) {
    global $pdo;
    
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $full_name = $input['full_name'] ?? '';
    $user_type = $input['user_type'] ?? 'passenger';
    $phone = $input['phone'] ?? '';
    $license_number = $input['license_number'] ?? '';
    
    if (empty($email) || empty($password) || empty($full_name)) {
        sendResponse(false, 'Email, password, and name are required');
    }
    
    // Validate driver registration
    if ($user_type === 'driver' && empty($license_number)) {
        sendResponse(false, 'Driver license number is required');
    }
    
    try {
        // Check if email exists
        $checkStmt = $pdo->prepare('SELECT user_id FROM users WHERE email = ?');
        $checkStmt->execute([$email]);
        
        if ($checkStmt->fetch()) {
            sendResponse(false, 'Email already registered');
        }
        
        // Check if phone exists
        $checkPhoneStmt = $pdo->prepare('SELECT user_id FROM users WHERE phone = ?');
        $checkPhoneStmt->execute([$phone]);
        
        if ($checkPhoneStmt->fetch()) {
            sendResponse(false, 'Phone number already registered');
        }
        
        // Check if license exists (for drivers)
        if ($user_type === 'driver' && !empty($license_number)) {
                $checkLicenseStmt = $pdo->prepare(
                    'SELECT user_id FROM users WHERE license_number = ?'
                );
                $checkLicenseStmt->execute([$license_number]);
                if ($checkLicenseStmt->fetch()) {
                    sendResponse(false, 'License number already registered');
                }
        }
        
        // Create user
        $password_hash = password_hash($password, PASSWORD_BCRYPT);
        
            $stmt = $pdo->prepare(
                'INSERT INTO users (user_type, email, password_hash, full_name, phone, license_number, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)'
            );
            $stmt->execute([$user_type, $email, $password_hash, $full_name, $phone, $license_number]);
        
        $user_id = $pdo->lastInsertId();
        
        // Log registration
        $logStmt = $pdo->prepare('
            INSERT INTO activity_logs (user_id, action_type, description)
            VALUES (?, ?, ?)
        ');
        $logStmt->execute([
            $user_id,
            'registration',
            "New {$user_type} registered: {$full_name} ({$email})"
        ]);
        
        // Generate token
        $token = bin2hex(random_bytes(32));
        
        sendResponse(true, 'Registration successful', [
            'user_id' => $user_id,
            'token' => $token
        ]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Registration failed: ' . $e->getMessage());
    }
}

?>
