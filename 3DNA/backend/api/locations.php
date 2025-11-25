<?php
/**
 * GPS Locations API
 * Handle real-time GPS location updates from drivers
 */

require_once '../config/Database.php';

$action = $_GET['action'] ?? '';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'current') {
        getCurrentLocation($_GET['bus_id'] ?? 0);
    } elseif ($action === 'history') {
        getLocationHistory($_GET['bus_id'] ?? 0);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'update') {
        updateLocation();
    }
}

function updateLocation() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $bus_id = $input['bus_id'] ?? '';
    $driver_id = $input['driver_id'] ?? '';
    $latitude = $input['latitude'] ?? '';
    $longitude = $input['longitude'] ?? '';
    $speed_kmh = $input['speed_kmh'] ?? 0;
    $accuracy_meters = $input['accuracy_meters'] ?? 0;
    
    if (empty($bus_id) || empty($driver_id) || empty($latitude) || empty($longitude)) {
        sendResponse(false, 'Required fields missing');
    }
    
    try {
        // Insert new location record
        $stmt = $pdo->prepare('
            INSERT INTO driver_locations (bus_id, driver_id, latitude, longitude, speed_kmh, accuracy_meters)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$bus_id, $driver_id, $latitude, $longitude, $speed_kmh, $accuracy_meters]);
        
        // Update bus status with latest location
        $updateStmt = $pdo->prepare('
            UPDATE bus_status 
            SET current_latitude = ?, 
                current_longitude = ?, 
                last_update = NOW()
            WHERE bus_id = ?
        ');
        $updateStmt->execute([$latitude, $longitude, $bus_id]);
        
        sendResponse(true, 'Location updated successfully', [
            'location_id' => $pdo->lastInsertId()
        ]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

function getCurrentLocation($bus_id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare('
            SELECT * FROM driver_locations
            WHERE bus_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        ');
        $stmt->execute([$bus_id]);
        $location = $stmt->fetch();
        
        if (!$location) {
            sendResponse(false, 'Location not found');
        }
        
        sendResponse(true, 'Location retrieved', ['location' => $location]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function getLocationHistory($bus_id) {
    global $pdo;
    
    $limit = $_GET['limit'] ?? 50;
    
    try {
        $stmt = $pdo->prepare('
            SELECT * FROM driver_locations
            WHERE bus_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        ');
        $stmt->execute([$bus_id, (int)$limit]);
        $locations = $stmt->fetchAll();
        
        sendResponse(true, 'History retrieved', ['locations' => $locations]);
        
    } catch (PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

?>
