<?php
/**
 * Analytics API
 * Provide fleet analytics and reporting
 */

require_once '../config/Database.php';

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'overview') {
        getOverview();
    } elseif ($action === 'daily_stats') {
        getDailyStats();
    } elseif ($action === 'route_performance') {
        getRoutePerformance();
    }
}

function getOverview() {
    global $pdo;
    
    try {
        // Total buses
        $totalStmt = $pdo->prepare('SELECT COUNT(*) as total FROM buses');
        $totalStmt->execute();
        $total_buses = $totalStmt->fetch()['total'];
        
        // Active buses
        $activeStmt = $pdo->prepare("SELECT COUNT(*) as active FROM buses WHERE status = 'active'");
        $activeStmt->execute();
        $active_buses = $activeStmt->fetch()['active'];
        
        // Inactive buses
        $inactive_buses = $total_buses - $active_buses;
        
        // Today's trips
        $tripsStmt = $pdo->prepare('
            SELECT COUNT(DISTINCT bus_id) as trips
            FROM driver_locations
            WHERE DATE(created_at) = CURDATE()
        ');
        $tripsStmt->execute();
        $trips_today = $tripsStmt->fetch()['trips'];
        
        // Total distance
        $distStmt = $pdo->prepare('
            SELECT SUM(distance_km) as total_distance FROM (
                SELECT DISTINCT b.bus_id, r.distance_km
                FROM driver_locations dl
                JOIN buses b ON dl.bus_id = b.bus_id
                JOIN routes r ON b.route_id = r.route_id
                WHERE DATE(dl.created_at) = CURDATE()
            ) as today_trips
        ');
        $distStmt->execute();
        $total_distance_km = $distStmt->fetch()['total_distance'] ?? 0;
        
        // Total passengers
        $passengerStmt = $pdo->prepare('
            SELECT SUM(current_passengers) as total
            FROM bus_status
        ');
        $passengerStmt->execute();
        $total_passengers = $passengerStmt->fetch()['total'] ?? 0;
        
        sendResponse(true, 'Analytics overview retrieved', [
            'total_buses' => (int)$total_buses,
            'active_buses' => (int)$active_buses,
            'inactive_buses' => (int)$inactive_buses,
            'trips_today' => (int)$trips_today,
            'total_distance_km' => round($total_distance_km, 2),
            'total_passengers' => (int)$total_passengers
        ]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getDailyStats() {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('
            SELECT 
                DATE(dl.created_at) as date,
                COUNT(DISTINCT dl.bus_id) as buses_active,
                COUNT(DISTINCT dl.driver_id) as drivers_active,
                MAX(dl.speed_kmh) as max_speed,
                AVG(dl.speed_kmh) as avg_speed
            FROM driver_locations dl
            GROUP BY DATE(dl.created_at)
            ORDER BY date DESC
            LIMIT 30
        ');
        $stmt->execute();
        $stats = $stmt->fetchAll();
        
        sendResponse(true, 'Daily stats retrieved', ['stats' => $stats]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getRoutePerformance() {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('
            SELECT 
                r.route_id,
                r.route_number,
                r.route_name,
                COUNT(DISTINCT b.bus_id) as buses,
                COUNT(dl.location_id) as gps_points,
                AVG(dl.speed_kmh) as avg_speed,
                MAX(dl.speed_kmh) as max_speed
            FROM routes r
            LEFT JOIN buses b ON r.route_id = b.route_id
            LEFT JOIN driver_locations dl ON b.bus_id = dl.bus_id
            GROUP BY r.route_id
            ORDER BY gps_points DESC
        ');
        $stmt->execute();
        $performance = $stmt->fetchAll();
        
        sendResponse(true, 'Route performance retrieved', ['routes' => $performance]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

?>
