<?php
/**
 * Health check endpoint for the API
 * Returns JSON status and verifies DB connectivity
 */

require_once '../config/Database.php';

// At this point Database.php sets Content-Type and registers shutdown handler
try {
    // Quick test query
    $stmt = $pdo->prepare('SELECT 1');
    $stmt->execute();

    sendResponse(true, 'API healthy', [
        'db' => 'connected'
    ]);
} catch (PDOException $e) {
    sendResponse(false, 'DB test failed: ' . $e->getMessage());
}
