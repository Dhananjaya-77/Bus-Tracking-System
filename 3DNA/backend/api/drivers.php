<?php
/**
 * Drivers API
 * Handle driver-specific operations and assignments
 */

require_once '../config/Database.php';

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'assigned_bus') {
        getAssignedBus($_GET['user_id'] ?? 0);
    } elseif ($action === 'route_stops') {
        getRouteStops($_GET['bus_id'] ?? 0);
    } elseif ($action === 'current_status') {
        getCurrentStatus($_GET['bus_id'] ?? 0);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'assign_bus') {
        assignBusToDriver();
    }
}

function getAssignedBus($driver_id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('
            SELECT b.*, r.route_number, r.route_name, r.start_location, r.end_location, r.distance_km, r.estimated_time_minutes,
                   bs.current_latitude, bs.current_longitude, bs.current_passengers, bs.is_running,
                   COUNT(s.stop_id) as total_stops
            FROM buses b
            LEFT JOIN routes r ON b.route_id = r.route_id
            LEFT JOIN bus_status bs ON b.bus_id = bs.bus_id
            LEFT JOIN stops s ON r.route_id = s.route_id
            WHERE b.driver_id = ?
            GROUP BY b.bus_id
        ');
        $stmt->execute([$driver_id]);
        $bus = $stmt->fetch();
        
        if (!$bus) {
            sendResponse(false, 'No bus assigned to this driver');
        }
        
        sendResponse(true, 'Bus assignment retrieved', ['bus' => $bus]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getRouteStops($bus_id) {
    global $pdo;
    
    try {
        // Get route from bus
        $busStmt = $pdo->prepare('SELECT route_id FROM buses WHERE bus_id = ?');
        $busStmt->execute([$bus_id]);
        $bus = $busStmt->fetch();
        
        if (!$bus) {
            sendResponse(false, 'Bus not found');
        }
        
        // Get all stops for the route
        $stopStmt = $pdo->prepare('
            SELECT * FROM stops
            WHERE route_id = ?
            ORDER BY stop_number ASC
        ');
        $stopStmt->execute([$bus['route_id']]);
        $stops = $stopStmt->fetchAll();
        
        sendResponse(true, 'Route stops retrieved', ['stops' => $stops]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getCurrentStatus($bus_id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('
            SELECT * FROM bus_status
            WHERE bus_id = ?
        ');
        $stmt->execute([$bus_id]);
        $status = $stmt->fetch();
        
        if (!$status) {
            sendResponse(false, 'Bus status not found');
        }
        
        sendResponse(true, 'Bus status retrieved', ['status' => $status]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function assignBusToDriver() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $driver_id = $input['driver_id'] ?? '';
    $bus_id = $input['bus_id'] ?? '';
    
    if (empty($driver_id) || empty($bus_id)) {
        sendResponse(false, 'Driver ID and Bus ID required');
    }
    
    try {
        $stmt = $pdo->prepare('
            UPDATE buses
            SET driver_id = ?
            WHERE bus_id = ?
        ');
        $stmt->execute([$driver_id, $bus_id]);
        
        sendResponse(true, 'Bus assigned to driver successfully');
        
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

?>
