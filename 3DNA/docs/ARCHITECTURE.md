# System Architecture & Flow Diagrams

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    3DNA BUS TRACKING SYSTEM                         │
└─────────────────────────────────────────────────────────────────────┘

                        ┌──────────────────┐
                        │   WEB BROWSER    │
                        │  (Passenger/     │
                        │   Driver/Admin)  │
                        └──────────┬───────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
            ┌───────▼──────┐  ┌───▼────────┐  ┌─▼───────────┐
            │   Landing    │  │ Tracking   │  │ Driver      │
            │   Page       │  │ Map        │  │ Dashboard   │
            │ index.html   │  │            │  │             │
            └───────┬──────┘  └───┬────────┘  └─┬───────────┘
                    │             │             │
            ┌───────────────────────────────────┴──────┐
            │  Real-Time AJAX Polling (2 seconds)    │
            └─────────────────────┬────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   API LAYER (PHP)        │
                    │   RESTful Endpoints      │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼──────────────────────────┐
        │                         │                          │
    ┌───▼───┐          ┌──────────▼────────┐      ┌─────────▼─────┐
    │auth   │          │buses/routes/      │      │locations/     │
    │.php   │          │drivers/users.php  │      │trips/logs.php │
    │       │          │                   │      │               │
    └───┬───┘          └──────────┬────────┘      └─────────┬─────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │    DATABASE (MySQL)       │
                    │    bus_tracking_db        │
                    └─────────────┬──────────────┘
                                  │
        ┌─────────┬──────────┬────┼────┬─────────┬─────────┐
        │         │          │    │    │         │         │
    ┌───▼─┐   ┌──▼─┐   ┌────▼──┐ │ ┌──▼──┐  ┌──▼───┐  ┌─▼────┐
    │users│   │buses│   │routes │ │ │stops│  │driver│  │logs  │
    │     │   │     │   │       │ │ │     │  │_loca│  │      │
    └─────┘   └─────┘   └───────┘ │ └─────┘  │tions│  └──────┘
                                    │         └─────┘
                            ┌───────▼────────┐
                            │  bus_status    │
                            │                │
                            └────────────────┘
```

## Real-Time Update Flow

```
DRIVER DEVICE (GPS Enabled)
        │
        ├─→ Browser Geolocation API
        │   (latitude, longitude, speed)
        │
        ├─→ Driver clicks "Update Location"
        │   or Auto-GPS enabled
        │
        ├─→ JavaScript: updateLocation()
        │
        ├─→ POST /api/locations.php?action=update
        │   {bus_id, driver_id, latitude, longitude, speed_kmh}
        │
        └─→ Backend:
            ├─ INSERT into driver_locations
            ├─ UPDATE bus_status with latest coords
            └─ Return success/error


PASSENGER DEVICE (Tracking)
        │
        ├─→ Access tracking-map.html
        │
        ├─→ Load map with Leaflet
        │
        ├─→ JavaScript: loadBuses() [AJAX]
        │   GET /api/buses.php?action=list
        │   (every 2 seconds)
        │
        ├─→ Backend returns:
        │   ├─ All active buses
        │   ├─ Current coordinates
        │   ├─ Route info
        │   └─ Status
        │
        ├─→ JavaScript updates:
        │   ├─ Map markers positions
        │   ├─ Sidebar bus list
        │   └─ Details panel
        │
        └─→ Display Real-Time Tracking


ADMIN DASHBOARD
        │
        ├─→ Admin logs in
        │   POST /api/auth.php?action=login
        │
        ├─→ Token stored in localStorage
        │
        ├─→ Dashboard loads:
        │   ├─ GET /api/buses.php?action=stats
        │   ├─ GET /api/routes.php?action=stats
        │   ├─ GET /api/analytics.php?action=overview
        │   └─ GET /api/logs.php?action=recent
        │
        ├─→ Display stats and analytics
        │
        ├─→ Admin can:
        │   ├─ Add/Edit/Delete buses (POST/DELETE)
        │   ├─ Manage routes
        │   ├─ Manage drivers
        │   └─ View activity logs
        │
        └─→ All changes logged in activity_logs
```

## Database Relationships

```
users (1:Many) ──── buses (1:Many) ──────── driver_locations
  ▲                    │                          │
  │                    │ (1:1)                    │
  │                    ▼                          │
  │              bus_status ◄──────────────────────
  │                    
  │ (1:Many)           (1:Many)
  │              routes (1:Many)
  └──────────────────────┬──────────────── stops
                         │
                    (1:Many)
                    bus_status


User Types:
- admin (manage everything)
- driver (manage their assigned bus)
- passenger (view tracking only)
```

## AJAX Polling Sequence

```
Time  | Passenger Browser      | Server        | Database
─────────────────────────────────────────────────────────
T=0s  | Load map
      | Call loadBuses()
T=0.1 | GET /api/buses.php ──→│
      |                        │ Query buses
      |                        │ & locations ──→ SELECT
      |                        │ ◄─────────────
      | ◄─────────────────────│
      | Receive JSON
      | updateMapMarkers()
      | Update 4 buses on map

T=2s  | Call loadBuses() again
      | GET /api/buses.php ──→│
      |                        │ Query updated
      |                        │ coordinates ──→ SELECT
      |                        │ ◄─────────────
      | ◄─────────────────────│
      | Receive JSON
      | Move markers to new
      | positions on map

T=4s  | Call loadBuses()
      | ... (repeats)
```

## User Authentication Flow

```
┌─────────────────┐
│  Login Page     │
└────────┬────────┘
         │
         ├─→ User enters email/password
         │
         ├─→ Form validation (JavaScript)
         │
         ├─→ POST /api/auth.php?action=login
         │   {email, password, user_type}
         │
         ├─→ Backend:
         │   ├─ SELECT user WHERE email
         │   ├─ Verify password (password_verify)
         │   ├─ Generate token
         │   └─ INSERT into activity_logs
         │
         ├─→ Response: {user_id, token, user_type}
         │
         ├─→ JavaScript:
         │   ├─ localStorage.setItem('user_id', ...)
         │   ├─ localStorage.setItem('auth_token', ...)
         │   └─ Redirect to dashboard
         │
         └─→ Authenticated User
             ├─ All API calls include:
             │  Authorization: Bearer {token}
             │
             └─ If token invalid/expired → Logout
```

## Real-Time Bus Tracking Map Updates

```
MAP DISPLAY (Leaflet.js)

Initial Load:
├─ Create map centered at 40.7128, -74.0060
├─ Load OSM tiles
└─ Initialize empty bus marker objects

Update Cycle (every 2 seconds):
├─ Fetch /api/buses.php?action=list
├─ Response: [{bus_id, lat, lng, speed, status, ...}]
├─ For each bus:
│  ├─ If marker exists:
│  │  └─ marker.setLatLng([lat, lng])
│  └─ Else:
│     ├─ Create new marker
│     ├─ Add popup with bus info
│     └─ bindClick event for selection
├─ Update sidebar bus list
└─ Update details panel


MAP INTERACTIONS:

Click on Bus Marker:
├─ selectBus(busId)
├─ Highlight in sidebar
├─ Load detailed info from /api/buses.php?action=get&id=busId
├─ Display in right panel
└─ Center map on bus

Select Route Filter:
├─ filterBuses()
├─ Call loadBuses() with filter
└─ Show only buses on selected route

Click "Center Map":
├─ If bus selected: centerMap on that bus
├─ Else: fitBounds all bus markers

Toggle Auto-Update:
├─ If enabled: start 2-second polling
└─ If disabled: stop polling
```

## Data Flow Summary

```
DRIVER → GPS Device → Browser → API → Database
                      ↓        ↓
                   JavaScript MySQL
                      ↑        ↑
PASSENGER → Browser → AJAX → API → Database

ADMIN → Browser → Auth → Dashboard → CRUD → Database
                   ↓                 ↓
                Token                SQL
```

This ensures:
✅ Real-time updates
✅ Secure authentication
✅ Efficient database queries
✅ Responsive user interface

