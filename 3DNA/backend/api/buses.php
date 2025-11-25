<?php
/**
 * Buses API
 * Handle bus management, listing, and updates
 */

require_once '../config/Database.php';

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        listBuses();
    } elseif ($action === 'get') {
        getBus($_GET['id'] ?? 0);
    } elseif ($action === 'stats') {
        getBusStats();
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'create') {
        createBus();
    } elseif ($action === 'update_passengers') {
        updatePassengers();
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if ($action === 'delete') {
        deleteBus($_GET['id'] ?? 0);
    }
}

function listBuses() {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('
            SELECT b.*, 
                   r.route_number, r.route_name,
                   u.full_name as driver_name,
                   bs.current_latitude, bs.current_longitude, 
                   bs.current_passengers,
                   dl.speed_kmh, dl.gps_timestamp
            FROM buses b
            LEFT JOIN routes r ON b.route_id = r.route_id
            LEFT JOIN users u ON b.driver_id = u.user_id
            LEFT JOIN bus_status bs ON b.bus_id = bs.bus_id
            LEFT JOIN driver_locations dl ON b.bus_id = dl.bus_id
            ORDER BY b.bus_number
        ');
        $stmt->execute();
        $buses = $stmt->fetchAll();
        
        sendResponse(true, 'Buses retrieved', ['buses' => $buses]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getBus($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('
            SELECT b.*, 
                   r.route_number, r.route_name,
                   u.full_name as driver_name,
                   bs.current_latitude, bs.current_longitude, 
                   bs.current_passengers,
                   dl.speed_kmh, dl.gps_timestamp
            FROM buses b
            LEFT JOIN routes r ON b.route_id = r.route_id
            LEFT JOIN users u ON b.driver_id = u.user_id
            LEFT JOIN bus_status bs ON b.bus_id = bs.bus_id
            LEFT JOIN driver_locations dl ON b.bus_id = dl.bus_id
            WHERE b.bus_id = ?
        ');
        $stmt->execute([$id]);
        $bus = $stmt->fetch();
        
        if (!$bus) {
            sendResponse(false, 'Bus not found');
        }
        
        sendResponse(true, 'Bus retrieved', ['bus' => $bus]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getBusStats() {
    global $pdo;
    
    try {
        $totalStmt = $pdo->prepare('SELECT COUNT(*) as total FROM buses');
        $totalStmt->execute();
        $total = $totalStmt->fetch()['total'];
        
        $activeStmt = $pdo->prepare("SELECT COUNT(*) as active FROM buses WHERE status = 'active'");
        $activeStmt->execute();
        $active = $activeStmt->fetch()['active'];
        
        sendResponse(true, 'Stats retrieved', [
            'total' => $total,
            'active' => $active,
            'inactive' => $total - $active
        ]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function createBus() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $bus_number = $input['bus_number'] ?? '';
    $registration_plate = $input['registration_plate'] ?? '';
    $route_id = $input['route_id'] ?? '';
    $capacity = $input['capacity'] ?? 50;
    $model = $input['model'] ?? '';
    $color = $input['color'] ?? '';
    
    if (empty($bus_number) || empty($registration_plate) || empty($route_id)) {
        sendResponse(false, 'Required fields missing');
    }
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO buses (bus_number, registration_plate, route_id, capacity, model, color, status)
            VALUES (?, ?, ?, ?, ?, ?, \'active\')
        ');
        $stmt->execute([$bus_number, $registration_plate, $route_id, $capacity, $model, $color]);
        
        $bus_id = $pdo->lastInsertId();
        
        // Create bus status entry
        $statusStmt = $pdo->prepare('
            INSERT INTO bus_status (bus_id) VALUES (?)
        ');
        $statusStmt->execute([$bus_id]);
        
        sendResponse(true, 'Bus created successfully', ['bus_id' => $bus_id]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

function updatePassengers() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $bus_id = $input['bus_id'] ?? '';
    $current_passengers = $input['current_passengers'] ?? 0;
    
    if (empty($bus_id)) {
        sendResponse(false, 'Bus ID required');
    }
    
    try {
        $stmt = $pdo->prepare('
            UPDATE bus_status SET current_passengers = ? WHERE bus_id = ?
        ');
        $stmt->execute([$current_passengers, $bus_id]);
        
        sendResponse(true, 'Passenger count updated');
        
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

function deleteBus($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('DELETE FROM buses WHERE bus_id = ?');
        $stmt->execute([$id]);
        
        sendResponse(true, 'Bus deleted successfully');
        
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

?>
