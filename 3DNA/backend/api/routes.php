<?php
/**
 * Routes API
 * Handle route management and bus stop operations
 */

require_once '../config/Database.php';

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        listRoutes();
    } elseif ($action === 'get') {
        getRoute($_GET['id'] ?? 0);
    } elseif ($action === 'stats') {
        getRouteStats();
    } elseif ($action === 'stops') {
        getStops($_GET['id'] ?? 0);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'create') {
        createRoute();
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if ($action === 'delete') {
        deleteRoute($_GET['id'] ?? 0);
    }
}

function listRoutes() {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('
            SELECT r.*, COUNT(s.stop_id) as stop_count
            FROM routes r
            LEFT JOIN stops s ON r.route_id = s.route_id
            WHERE r.is_active = 1
            GROUP BY r.route_id
            ORDER BY r.route_number
        ');
        $stmt->execute();
        $routes = $stmt->fetchAll();
        
        sendResponse(true, 'Routes retrieved', ['routes' => $routes]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getRoute($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('
            SELECT r.*, COUNT(s.stop_id) as stop_count
            FROM routes r
            LEFT JOIN stops s ON r.route_id = s.route_id
            WHERE r.route_id = ?
            GROUP BY r.route_id
        ');
        $stmt->execute([$id]);
        $route = $stmt->fetch();
        
        if (!$route) {
            sendResponse(false, 'Route not found');
        }
        
        sendResponse(true, 'Route retrieved', ['route' => $route]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getRouteStats() {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('
            SELECT COUNT(*) as total, 
                   SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
            FROM routes
        ');
        $stmt->execute();
        $stats = $stmt->fetch();
        
        sendResponse(true, 'Stats retrieved', $stats);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getStops($route_id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('
            SELECT * FROM stops
            WHERE route_id = ?
            ORDER BY stop_number
        ');
        $stmt->execute([$route_id]);
        $stops = $stmt->fetchAll();
        
        sendResponse(true, 'Stops retrieved', ['stops' => $stops]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function createRoute() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $route_number = $input['route_number'] ?? '';
    $route_name = $input['route_name'] ?? '';
    $start_location = $input['start_location'] ?? '';
    $end_location = $input['end_location'] ?? '';
    $distance_km = $input['distance_km'] ?? 0;
    $estimated_time_minutes = $input['estimated_time_minutes'] ?? 0;
    
    if (empty($route_number) || empty($route_name)) {
        sendResponse(false, 'Required fields missing');
    }
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO routes (route_number, route_name, start_location, end_location, distance_km, estimated_time_minutes, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        ');
        $stmt->execute([$route_number, $route_name, $start_location, $end_location, $distance_km, $estimated_time_minutes]);
        
        $route_id = $pdo->lastInsertId();
        
        sendResponse(true, 'Route created successfully', ['route_id' => $route_id]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

function deleteRoute($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('DELETE FROM routes WHERE route_id = ?');
        $stmt->execute([$id]);
        
        sendResponse(true, 'Route deleted successfully');
        
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

?>
