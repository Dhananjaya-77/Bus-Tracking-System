<?php
/**
 * Trip Management API
 * Handle trip start, end, and tracking
 */

require_once '../config/Database.php';

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'start') {
        startTrip();
    } elseif ($action === 'end') {
        endTrip();
    } elseif ($action === 'pause') {
        pauseTrip();
    } elseif ($action === 'resume') {
        resumeTrip();
    }
}

function startTrip() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $bus_id = $input['bus_id'] ?? '';
    $driver_id = $input['driver_id'] ?? '';
    
    if (empty($bus_id) || empty($driver_id)) {
        sendResponse(false, 'Bus ID and Driver ID required');
    }
    
    try {
        // Start trip
        $stmt = $pdo->prepare('
            UPDATE bus_status
            SET is_running = 1, last_update = NOW()
            WHERE bus_id = ?
        ');
        $stmt->execute([$bus_id]);
        
        // Update bus status to active
        $busStmt = $pdo->prepare('
            UPDATE buses
            SET status = \'active\'
            WHERE bus_id = ?
        ');
        $busStmt->execute([$bus_id]);
        
        // Log the action
        $logStmt = $pdo->prepare('
            INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, description)
            VALUES (?, ?, ?, ?, ?)
        ');
        $logStmt->execute([
            $driver_id,
            'trip_started',
            'bus',
            $bus_id,
            "Trip started for bus ID {$bus_id}"
        ]);
        
        sendResponse(true, 'Trip started successfully');
        
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

function endTrip() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $bus_id = $input['bus_id'] ?? '';
    
    if (empty($bus_id)) {
        sendResponse(false, 'Bus ID required');
    }
    
    try {
        // End trip
        $stmt = $pdo->prepare('
            UPDATE bus_status
            SET is_running = 0, last_update = NOW()
            WHERE bus_id = ?
        ');
        $stmt->execute([$bus_id]);
        
        // Update bus status
        $busStmt = $pdo->prepare('
            UPDATE buses
            SET status = \'stopped\'
            WHERE bus_id = ?
        ');
        $busStmt->execute([$bus_id]);
        
        sendResponse(true, 'Trip ended successfully');
        
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

function pauseTrip() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $bus_id = $input['bus_id'] ?? '';
    
    if (empty($bus_id)) {
        sendResponse(false, 'Bus ID required');
    }
    
    try {
        $stmt = $pdo->prepare('
            UPDATE buses
            SET status = \'paused\'
            WHERE bus_id = ?
        ');
        $stmt->execute([$bus_id]);
        
        sendResponse(true, 'Trip paused successfully');
        
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

function resumeTrip() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $bus_id = $input['bus_id'] ?? '';
    
    if (empty($bus_id)) {
        sendResponse(false, 'Bus ID required');
    }
    
    try {
                $stmt = $pdo->prepare('
                    UPDATE buses
                    SET status = \'active\'
                    WHERE bus_id = ?
                ');
        $stmt->execute([$bus_id]);
        
        sendResponse(true, 'Trip resumed successfully');
        
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

?>
