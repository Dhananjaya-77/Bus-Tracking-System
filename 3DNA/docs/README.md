# 3DNA Real-Time Bus Tracking System - Documentation

## Project Overview

3DNA Bus Tracking System is a comprehensive real-time bus tracking web application that enables passengers to track buses in real-time, drivers to manage their trips, and administrators to control the entire fleet operations.

**Key Features:**
- ✅ Real-time GPS bus tracking with 2-second updates
- ✅ Interactive map using Leaflet & OpenStreetMap
- ✅ Driver login and trip management
- ✅ Admin dashboard for fleet management
- ✅ Passenger tracking interface
- ✅ Route and bus management
- ✅ Activity logging and analytics
- ✅ Mobile-responsive design
- ✅ Secure authentication with tokens

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      3DNA BUS TRACKING                   │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   FRONTEND       │  │   BACKEND        │  │    DATABASE      │
│   (HTML/CSS/JS)  │  │   (PHP APIs)     │  │    (MySQL)       │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │                     │                     │
        ├─ Landing Page       ├─ auth.php           ├─ users table
        ├─ Tracking Map       ├─ buses.php          ├─ buses table
        ├─ Driver Dashboard   ├─ routes.php         ├─ routes table
        ├─ Admin Dashboard    ├─ drivers.php        ├─ driver_locations
        └─ Authentication     ├─ locations.php      ├─ bus_status
                              ├─ trips.php          └─ stops table
                              ├─ logs.php
                              ├─ analytics.php
                              └─ config/Database.php

Real-time Communication:
- AJAX Polling (2-3 second interval)
- JSON API responses
- Token-based authentication
```

---

## Database Schema

### Tables Overview

#### 1. **users** - User accounts (admin, driver, passenger)
```sql
- user_id (PK)
- user_type (admin/driver/passenger)
- email (UNIQUE)
- password_hash
- full_name
- phone
- is_active
- created_at, updated_at
```

#### 2. **routes** - Bus routes
```sql
- route_id (PK)
- route_number
- route_name
- start_location
- end_location
- distance_km
- estimated_time_minutes
- is_active
```

#### 3. **buses** - Bus fleet information
```sql
- bus_id (PK)
- bus_number
- registration_plate
- route_id (FK)
- driver_id (FK)
- capacity
- status (active/inactive/maintenance/stopped)
- model, color
```

#### 4. **driver_locations** - Real-time GPS tracking
```sql
- location_id (PK)
- bus_id (FK)
- driver_id (FK)
- latitude, longitude
- speed_kmh
- accuracy_meters
- created_at
```

#### 5. **bus_status** - Current bus operational status
```sql
- status_id (PK)
- bus_id (FK, UNIQUE)
- current_latitude, current_longitude
- current_passengers
- is_running
- last_update
```

#### 6. **stops** - Bus route stops
```sql
- stop_id (PK)
- route_id (FK)
- stop_name
- latitude, longitude
- estimated_wait_time_minutes
```

#### 7. **activity_logs** - System activity tracking
```sql
- log_id (PK)
- user_id (FK)
- action_type
- entity_type, entity_id
- description
- created_at
```

---

## API Endpoints Documentation

### Authentication API (`/backend/api/auth.php`)

#### Login
```
POST /backend/api/auth.php?action=login
Content-Type: application/json

Request:
{
    "email": "driver1@3dna.local",
    "password": "password",
    "user_type": "driver"
}

Response:
{
    "success": true,
    "user_id": 2,
    "user_type": "driver",
    "full_name": "John Driver",
    "token": "abc123def456..."
}
```

#### Register
```
POST /backend/api/auth.php?action=register
Content-Type: application/json

Request:
{
    "email": "new@example.com",
    "password": "secure123",
    "full_name": "New User",
    "user_type": "passenger",
    "phone": "5555555555"
}

Response:
{
    "success": true,
    "user_id": 5,
    "token": "..."
}
```

### Buses API (`/backend/api/buses.php`)

#### List All Buses
```
GET /backend/api/buses.php?action=list

Response:
{
    "success": true,
    "buses": [
        {
            "bus_id": 1,
            "bus_number": "BUS-001",
            "route_number": "RT-001",
            "current_latitude": 40.7128,
            "current_longitude": -74.0060,
            "current_passengers": 35,
            "status": "active"
        }
    ]
}
```

#### Get Single Bus
```
GET /backend/api/buses.php?action=get&id=1

Response: Single bus object with full details
```

#### Create Bus
```
POST /backend/api/buses.php?action=create
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
    "bus_number": "BUS-005",
    "registration_plate": "XYZ9999",
    "route_id": 1,
    "capacity": 50,
    "model": "Mercedes",
    "color": "White"
}
```

#### Get Bus Stats
```
GET /backend/api/buses.php?action=stats

Response:
{
    "success": true,
    "total": 4,
    "active": 3,
    "inactive": 1
}
```

### Routes API (`/backend/api/routes.php`)

#### List Routes
```
GET /backend/api/routes.php?action=list

Response: Array of route objects
```

#### Get Route Stops
```
GET /backend/api/routes.php?action=stops&id=1

Response: Array of stops for the route
```

#### Create Route
```
POST /backend/api/routes.php?action=create
Authorization: Bearer {token}

Request:
{
    "route_number": "RT-005",
    "route_name": "New Route",
    "start_location": "Location A",
    "end_location": "Location B",
    "distance_km": 15.5,
    "estimated_time_minutes": 30
}
```

### Locations API (`/backend/api/locations.php`)

#### Update GPS Location
```
POST /backend/api/locations.php?action=update
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
    "bus_id": 1,
    "driver_id": 2,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "speed_kmh": 45.5,
    "accuracy_meters": 10
}

Response:
{
    "success": true,
    "location_id": 12345
}
```

#### Get Current Location
```
GET /backend/api/locations.php?action=current&bus_id=1

Response:
{
    "success": true,
    "location": {
        "location_id": 12345,
        "bus_id": 1,
        "latitude": 40.7128,
        "longitude": -74.0060,
        "speed_kmh": 45.5,
        "created_at": "2025-11-22 10:30:00"
    }
}
```

### Drivers API (`/backend/api/drivers.php`)

#### Get Assigned Bus
```
GET /backend/api/drivers.php?action=assigned_bus&user_id=2
Authorization: Bearer {token}

Response:
{
    "success": true,
    "bus": {
        "bus_id": 1,
        "bus_number": "BUS-001",
        "route_number": "RT-001",
        "current_latitude": 40.7128,
        "current_longitude": -74.0060,
        "total_stops": 8
    }
}
```

#### Get Route Stops
```
GET /backend/api/drivers.php?action=route_stops&bus_id=1
```

### Trips API (`/backend/api/trips.php`)

#### Start Trip
```
POST /backend/api/trips.php?action=start
Authorization: Bearer {token}

Request:
{
    "bus_id": 1,
    "driver_id": 2
}
```

#### End Trip
```
POST /backend/api/trips.php?action=end
Authorization: Bearer {token}

Request:
{
    "bus_id": 1
}
```

### Users API (`/backend/api/users.php`)

#### List Users
```
GET /backend/api/users.php?action=list&type=driver
Authorization: Bearer {token}
```

#### Create User
```
POST /backend/api/users.php?action=create
Authorization: Bearer {token}

Request:
{
    "user_type": "driver",
    "email": "new_driver@example.com",
    "password": "secure123",
    "full_name": "Driver Name",
    "phone": "5555555555"
}
```

### Analytics API (`/backend/api/analytics.php`)

#### Get Overview
```
GET /backend/api/analytics.php?action=overview

Response:
{
    "success": true,
    "total_buses": 4,
    "active_buses": 3,
    "inactive_buses": 1,
    "trips_today": 12,
    "total_distance_km": 245.5,
    "total_passengers": 125
}
```

---

## Frontend Pages

### 1. **Landing Page** (`frontend/pages/index.html`)
- Overview of the system
- Features showcase
- Quick access to tracking and login

### 2. **Real-Time Tracking Map** (`frontend/pages/tracking-map.html`)
- Interactive Leaflet map
- Bus marker display with real-time updates
- Side panel for bus list and filters
- Details panel for selected bus
- Auto-refresh every 2 seconds

### 3. **Driver Login** (`frontend/pages/driver-login.html`)
- Email and password authentication
- Remember me option
- Demo credentials: `driver1@3dna.local` / `password`

### 4. **Driver Dashboard** (`frontend/pages/driver-dashboard.html`)
- Bus assignment and route info
- Trip start/stop controls
- GPS auto-update settings
- Real-time location on map
- Daily statistics
- Passenger count management

### 5. **Admin Login** (`frontend/pages/admin-login.html`)
- Admin authentication
- Demo: `admin@3dna.local` / `password`

### 6. **Admin Dashboard** (`frontend/pages/admin-dashboard.html`)
- Fleet overview stats
- Bus management (CRUD)
- Route management
- Driver management
- User management
- Activity logs
- Analytics and reports

---

## JavaScript Modules

### `frontend/js/tracking-map.js`
- Map initialization with Leaflet
- Real-time bus marker updates
- Bus list management
- Event handlers for bus selection
- Auto-refresh polling (2 seconds)

### `frontend/js/admin-dashboard.js`
- Section navigation
- CRUD operations for buses, routes, drivers
- Dashboard stats loading
- Modal forms
- Table data management

### `frontend/js/driver-dashboard.js`
- Driver map initialization
- GPS location capture and update
- Trip lifecycle management
- Auto-GPS polling with configurable intervals
- Statistics tracking

### `frontend/js/auth.js`
- Authentication state management
- Token handling
- Auth header generation
- Logout functionality

---

## CSS Styling

### Theme Colors (3DNA)
- **Primary Blue**: `#0066cc`
- **Neon Green**: `#00ff41`
- **Dark Background**: `#0a0e27`
- **Light Background**: `#f5f7fa`

### CSS Files
1. **styles.css** - Global styles (navbar, buttons, forms, utilities)
2. **landing.css** - Landing page styles
3. **auth.css** - Authentication pages
4. **tracking-map.css** - Tracking map layout and styles
5. **admin-dashboard.css** - Admin dashboard layout
6. **driver-dashboard.css** - Driver dashboard layout

---

## Deployment Guide

### Prerequisites
- PHP 7.4+ with PDO MySQL extension
- MySQL 5.7+
- Apache web server (XAMPP/WAMP)
- Modern web browser

### Installation Steps

#### 1. **Database Setup**
```bash
# Access MySQL
mysql -u root -p

# Create database
mysql> CREATE DATABASE bus_tracking_db;
mysql> USE bus_tracking_db;

# Import schema
mysql> source /path/to/database/schema.sql;
```

#### 2. **Configure Database Connection**
Edit `backend/config/Database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // Your MySQL password
define('DB_NAME', 'bus_tracking_db');
```

#### 3. **Deploy Files**
```bash
# Copy project to web root
cp -r 3DNA-Bus-Tracking /xampp/htdocs/

# Set permissions
chmod -R 755 /xampp/htdocs/3DNA-Bus-Tracking/
```

#### 4. **Access Application**
- **Landing Page**: `http://localhost/3DNA-Bus-Tracking/frontend/pages/index.html`
- **Tracking Map**: `http://localhost/3DNA-Bus-Tracking/frontend/pages/tracking-map.html`
- **Driver Login**: `http://localhost/3DNA-Bus-Tracking/frontend/pages/driver-login.html`
- **Admin Login**: `http://localhost/3DNA-Bus-Tracking/frontend/pages/admin-login.html`

#### 5. **Demo Credentials**

**Admin Account:**
- Email: `admin@3dna.local`
- Password: `password`

**Driver Accounts:**
- Email: `driver1@3dna.local` | Password: `password`
- Email: `driver2@3dna.local` | Password: `password`
- Email: `driver3@3dna.local` | Password: `password`

**Passenger Accounts:**
- Email: `passenger1@3dna.local` | Password: `password`
- Email: `passenger2@3dna.local` | Password: `password`

---

## Real-Time Update Flow

```
Driver Device
    │
    ├─→ getLocation() [Geolocation API]
    │
    ├─→ POST /api/locations.php
    │
    └─→ Update driver_locations table

Passenger Device
    │
    ├─→ GET /api/buses.php?action=list [AJAX Poll - every 2s]
    │
    ├─→ Receive JSON with all active buses
    │
    └─→ Update map markers with new coordinates

Admin Dashboard
    │
    ├─→ GET /api/analytics.php [AJAX Poll - every 5s]
    │
    ├─→ Receive fleet statistics
    │
    └─→ Update dashboard widgets
```

---

## Security Best Practices

1. **Password Security**
   - Use `password_hash()` and `password_verify()`
   - Enforce strong password policies
   - Implement password reset functionality

2. **Authentication**
   - Use JWT tokens for API authentication
   - Implement token expiration
   - Validate tokens on every request

3. **Data Protection**
   - Use prepared statements (PDO) to prevent SQL injection
   - Validate all user inputs
   - Sanitize output for XSS prevention

4. **HTTPS**
   - Always use HTTPS in production
   - Configure SSL certificates

5. **Database**
   - Regular backups
   - Use least privilege database users
   - Enable query logging for debugging

6. **CORS**
   - Restrict CORS headers appropriately
   - Validate origin in production

---

## Performance Optimization

### Current Implementation
- **GPS Update Interval**: 2 seconds (configurable)
- **API Response Format**: JSON
- **Database Indexes**: On frequently queried columns

### Optimizations for Production
1. **Caching**
   - Redis for route and bus data caching
   - Browser caching for static assets

2. **Database**
   - Add composite indexes on `(bus_id, created_at)`
   - Archive old location data periodically
   - Use partitioning for large tables

3. **Frontend**
   - Lazy load map tiles
   - Implement WebSocket for real-time updates instead of polling
   - Service Workers for offline functionality

4. **API**
   - Rate limiting per user/IP
   - Response compression (gzip)
   - Request queuing

---

## Future Features & Recommendations

### Phase 2 Features
1. **WebSocket Implementation**
   - Real-time bidirectional communication
   - Reduce server load vs. polling
   - Instant updates for all clients

2. **Mobile App**
   - Native iOS/Android apps
   - Offline maps support
   - Push notifications

3. **Advanced Analytics**
   - AI-based ETA prediction
   - Route optimization algorithms
   - Fuel consumption tracking

4. **QR Ticketing System**
   - Digital ticket generation
   - NFC/QR code scanning
   - Automated fare collection

5. **Driver Monitoring**
   - Route compliance tracking
   - Speed monitoring and alerts
   - Break time management

### Technical Improvements
1. Implement JWT for better token management
2. Add rate limiting and API throttling
3. Implement microservices architecture
4. Add comprehensive logging and monitoring
5. Implement CI/CD pipeline
6. Add automated testing
7. Docker containerization
8. Load balancing for scalability

---

## Troubleshooting

### Common Issues

**1. Database Connection Error**
- Verify MySQL is running
- Check credentials in Database.php
- Ensure database exists

**2. GPS Not Updating**
- Check browser geolocation permissions
- Verify HTTPS (required for geolocation in production)
- Check network connectivity

**3. Map Not Loading**
- Verify Leaflet library is loaded
- Check browser console for JavaScript errors
- Verify OpenStreetMap is accessible

**4. Login Not Working**
- Check browser localStorage
- Clear cookies and cache
- Verify API endpoint URLs

---

## Support & Contact

**Project Team:** 3DNA Development Team
**Email:** support@3dna-tracking.com
**Documentation Version:** 1.0
**Last Updated:** November 2025

---

## License

This project is proprietary software. All rights reserved.

