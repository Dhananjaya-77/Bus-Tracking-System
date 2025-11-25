-- ============================================
-- 3DNA BUS TRACKING SYSTEM - DATABASE SCHEMA
-- ============================================
-- Created: November 2025
-- Team: 3DNA
-- Purpose: Real-time bus tracking system

-- Create database
CREATE DATABASE IF NOT EXISTS bus_tracking_db;
USE bus_tracking_db;

-- ============================================
-- USERS TABLE - Store all users (Admin, Driver, Passenger)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    user_type ENUM('admin', 'driver', 'passenger') NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    full_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50),
    profile_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ROUTES TABLE - Store bus routes
-- ============================================
CREATE TABLE IF NOT EXISTS routes (
    route_id INT PRIMARY KEY AUTO_INCREMENT,
    route_name VARCHAR(100) NOT NULL UNIQUE,
    route_number VARCHAR(50) NOT NULL UNIQUE,
    start_location VARCHAR(150) NOT NULL,
    end_location VARCHAR(150) NOT NULL,
    distance_km DECIMAL(10, 2),
    estimated_time_minutes INT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_route_number (route_number),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BUSES TABLE - Store bus information
-- ============================================
CREATE TABLE IF NOT EXISTS buses (
    bus_id INT PRIMARY KEY AUTO_INCREMENT,
    bus_number VARCHAR(50) NOT NULL UNIQUE,
    registration_plate VARCHAR(50) NOT NULL UNIQUE,
    route_id INT NOT NULL,
    driver_id INT,
    capacity INT DEFAULT 50,
    model VARCHAR(100),
    color VARCHAR(50),
    purchase_date DATE,
    last_service_date DATE,
    status ENUM('active', 'inactive', 'maintenance', 'stopped') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_route_id (route_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_status (status),
    INDEX idx_bus_number (bus_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DRIVER LOCATIONS TABLE - Store real-time GPS coordinates
-- ============================================
CREATE TABLE IF NOT EXISTS driver_locations (
    location_id INT PRIMARY KEY AUTO_INCREMENT,
    bus_id INT NOT NULL,
    driver_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed_kmh DECIMAL(10, 2) DEFAULT 0,
    direction_degrees INT,
    accuracy_meters INT,
    gps_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_bus_id (bus_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_created_at (created_at),
    INDEX idx_gps_timestamp (gps_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BUS STATUS TABLE - Store current bus status
-- ============================================
CREATE TABLE IF NOT EXISTS bus_status (
    status_id INT PRIMARY KEY AUTO_INCREMENT,
    bus_id INT NOT NULL UNIQUE,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    current_passengers INT DEFAULT 0,
    total_stops INT DEFAULT 0,
    completed_stops INT DEFAULT 0,
    next_stop_name VARCHAR(150),
    estimated_arrival_time TIME,
    total_distance_today_km DECIMAL(10, 2) DEFAULT 0,
    is_running BOOLEAN DEFAULT FALSE,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_bus_id (bus_id),
    INDEX idx_is_running (is_running),
    INDEX idx_last_update (last_update)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STOPS TABLE - Store bus stops
-- ============================================
CREATE TABLE IF NOT EXISTS stops (
    stop_id INT PRIMARY KEY AUTO_INCREMENT,
    route_id INT NOT NULL,
    stop_name VARCHAR(100) NOT NULL,
    stop_number INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    estimated_wait_time_minutes INT DEFAULT 5,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_route_stop (route_id, stop_number),
    INDEX idx_route_id (route_id),
    INDEX idx_stop_name (stop_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ACTIVITY LOGS TABLE - Track system activities
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at),
    INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA - Test Data for Development
-- ============================================

-- Insert Admin User
INSERT INTO users (user_type, email, password_hash, full_name, phone, is_active) VALUES
('admin', 'admin@3dna.local', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/M7C', 'Admin User', '1234567890', TRUE);

-- Insert Sample Drivers
INSERT INTO users (user_type, email, password_hash, full_name, phone, is_active) VALUES
('driver', 'driver1@3dna.local', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/M7C', 'John Driver', '9876543210', TRUE),
('driver', 'driver2@3dna.local', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/M7C', 'Sarah Driver', '8765432109', TRUE),
('driver', 'driver3@3dna.local', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/M7C', 'Mike Driver', '7654321098', TRUE);

-- Insert Sample Passengers
INSERT INTO users (user_type, email, password_hash, full_name, phone, is_active) VALUES
('passenger', 'passenger1@3dna.local', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/M7C', 'Alice Passenger', '5555555551', TRUE),
('passenger', 'passenger2@3dna.local', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/M7C', 'Bob Passenger', '5555555552', TRUE);

-- Insert Sample Routes
INSERT INTO routes (route_name, route_number, start_location, end_location, distance_km, estimated_time_minutes, description) VALUES
('City Center to Airport', 'RT-001', 'Main Station', 'Airport Terminal', 25.5, 45, 'Express route to airport'),
('Downtown Express', 'RT-002', 'Downtown Hub', 'Suburban Center', 18.3, 35, 'Regular city route'),
('Beach Route', 'RT-003', 'City Center', 'Beach Area', 12.7, 25, 'Scenic beach route'),
('Industrial Zone', 'RT-004', 'Main Hub', 'Industrial Area', 20.1, 40, 'Industrial park connector');

-- Insert Sample Buses
INSERT INTO buses (bus_number, registration_plate, route_id, driver_id, capacity, model, color, status) VALUES
('BUS-001', 'ABC1234', 1, 2, 50, 'Mercedes Benz', 'White', 'active'),
('BUS-002', 'DEF5678', 2, 3, 45, 'Volvo', 'Blue', 'active'),
('BUS-003', 'GHI9012', 3, 4, 40, 'Tata', 'Green', 'active'),
('BUS-004', 'JKL3456', 4, NULL, 55, 'Scania', 'Red', 'inactive');

-- Insert Sample Bus Status
INSERT INTO bus_status (bus_id, current_latitude, current_longitude, current_passengers, total_stops, is_running) VALUES
(1, 40.7128, -74.0060, 35, 8, TRUE),
(2, 40.7580, -73.9855, 42, 6, TRUE),
(3, 40.6892, -74.0445, 28, 7, TRUE),
(4, NULL, NULL, 0, 0, FALSE);

-- Insert Sample Stops for Route 1
INSERT INTO stops (route_id, stop_name, stop_number, latitude, longitude, estimated_wait_time_minutes) VALUES
(1, 'Main Station', 1, 40.7128, -74.0060, 3),
(1, 'Central Park', 2, 40.7829, -73.9654, 5),
(1, 'Grand Central', 3, 40.7527, -73.9772, 4),
(1, 'Penn Station', 4, 40.7505, -73.9972, 3),
(1, 'Times Square', 5, 40.7580, -73.9855, 5),
(1, 'Lincoln Center', 6, 40.7733, -73.9820, 4),
(1, 'Airport Terminal', 7, 40.6895, -74.1745, 2);

-- Insert Sample Driver Location (Current)
INSERT INTO driver_locations (bus_id, driver_id, latitude, longitude, speed_kmh, direction_degrees, accuracy_meters) VALUES
(1, 2, 40.7128, -74.0060, 45.5, 90, 10),
(2, 3, 40.7580, -73.9855, 38.2, 180, 12),
(3, 4, 40.6892, -74.0445, 52.1, 45, 8);

-- ============================================
-- INDEXES OPTIMIZATION
-- ============================================
-- These indexes are already included in table definitions
-- Additional composite indexes can be added as needed based on query patterns
