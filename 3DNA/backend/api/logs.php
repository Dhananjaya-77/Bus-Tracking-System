<?php
/**
 * Activity Logs API
 * Handle activity logging and retrieval
 */

require_once '../config/Database.php';

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'recent') {
        getRecentLogs();
    } elseif ($action === 'user') {
        getUserLogs($_GET['user_id'] ?? 0);
    } elseif ($action === 'entity') {
        getEntityLogs($_GET['entity_type'] ?? '', $_GET['entity_id'] ?? 0);
    }
}

function getRecentLogs() {
    global $pdo;
    
    $limit = $_GET['limit'] ?? 20;
    
    try {
        $stmt = $pdo->prepare('
            SELECT al.*, u.full_name as user_name
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.user_id
            ORDER BY al.created_at DESC
            LIMIT ?
        ');
        $stmt->execute([(int)$limit]);
        $logs = $stmt->fetchAll();
        
        sendResponse(true, 'Logs retrieved', ['logs' => $logs]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getUserLogs($user_id) {
    global $pdo;
    
    $limit = $_GET['limit'] ?? 50;
    
    try {
        $stmt = $pdo->prepare('
            SELECT *
            FROM activity_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        ');
        $stmt->execute([$user_id, (int)$limit]);
        $logs = $stmt->fetchAll();
        
        sendResponse(true, 'Logs retrieved', ['logs' => $logs]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getEntityLogs($entity_type, $entity_id) {
    global $pdo;
    
    $limit = $_GET['limit'] ?? 50;
    
    try {
        $stmt = $pdo->prepare('
            SELECT al.*, u.full_name as user_name
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.user_id
            WHERE al.entity_type = ? AND al.entity_id = ?
            ORDER BY al.created_at DESC
            LIMIT ?
        ');
        $stmt->execute([$entity_type, $entity_id, (int)$limit]);
        $logs = $stmt->fetchAll();
        
        sendResponse(true, 'Logs retrieved', ['logs' => $logs]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

?>
