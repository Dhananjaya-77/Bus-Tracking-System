<?php
require_once '../config/Database.php';

// Check buses
echo "=== BUSES ===\n";
$stmt = $pdo->prepare('SELECT bus_id, bus_number, route_id, driver_id, status FROM buses LIMIT 5');
$stmt->execute();
$buses = $stmt->fetchAll();
echo json_encode($buses, JSON_PRETTY_PRINT) . "\n\n";

// Check routes
echo "=== ROUTES ===\n";
$stmt = $pdo->prepare('SELECT route_id, route_number, route_name FROM routes LIMIT 5');
$stmt->execute();
$routes = $stmt->fetchAll();
echo json_encode($routes, JSON_PRETTY_PRINT) . "\n\n";

// Check drivers (users with user_type='driver')
echo "=== DRIVERS ===\n";
$stmt = $pdo->prepare('SELECT user_id, email, full_name, license_number FROM users WHERE user_type = ? LIMIT 5');
$stmt->execute(['driver']);
$drivers = $stmt->fetchAll();
echo json_encode($drivers, JSON_PRETTY_PRINT) . "\n\n";

// Check bus_status
echo "=== BUS_STATUS ===\n";
$stmt = $pdo->prepare('SELECT bus_id, is_running, current_latitude, current_longitude FROM bus_status LIMIT 5');
$stmt->execute();
$statuses = $stmt->fetchAll();
echo json_encode($statuses, JSON_PRETTY_PRINT) . "\n";
?>
