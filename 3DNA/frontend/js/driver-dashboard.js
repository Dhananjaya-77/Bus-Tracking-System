/* ============================================
   3DNA BUS TRACKING - DRIVER DASHBOARD
   ============================================ */

let driverMap;
let driverMarker = null;
let accuracyCircle = null;
let tripActive = false;
let gpsUpdateInterval = null;
let currentBusId = null;
const API_BASE = '../../backend/api';

// Initialize driver dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initDriverMap();
    loadBusAssignment();
    setupEventListeners();
});

// Check authentication
function checkAuth() {
    const userType = localStorage.getItem('user_type');
    if (userType !== 'driver') {
        window.location.href = 'index.html';
    }
    
    const driverName = localStorage.getItem('user_email');
    document.getElementById('driver-name').textContent = driverName || 'Driver';
}

// Initialize map
function initDriverMap() {
    // Center map on Institute of Technology - University of Moratuwa
    // Coordinates: approx. 6.7958 N, 79.9000 E
    driverMap = L.map('driver-map').setView([6.7958, 79.9000], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    }).addTo(driverMap);

    // Add a marker for the Institute of Technology, University of Moratuwa
    const moratuwaMarker = L.marker([6.7958, 79.9000]).addTo(driverMap);
    moratuwaMarker.bindPopup('<strong>Institute of Technology</strong><br>University of Moratuwa').openPopup();
}

// Load bus assignment for this driver
async function loadBusAssignment() {
    try {
        const userId = localStorage.getItem('user_id');
        const response = await fetch(`${API_BASE}/drivers.php?action=assigned_bus&user_id=${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        
        const data = await response.json();
        if (data.success && data.bus) {
            const bus = data.bus;
            currentBusId = bus.bus_id;
            
            document.getElementById('bus-number').textContent = bus.bus_number;
            document.getElementById('route-name').textContent = `${bus.route_number} - ${bus.route_name}`;
            
            // Initialize route
            if (bus.current_latitude && bus.current_longitude) {
                driverMap.setView([bus.current_latitude, bus.current_longitude], 14);
            }
        }
    } catch (error) {
        console.error('Error loading bus assignment:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('auto-gps').addEventListener('change', (e) => {
        if (e.target.checked && tripActive) {
            startAutoGPS();
        } else {
            stopAutoGPS();
        }
    });
    
    document.getElementById('update-interval').addEventListener('change', (e) => {
        if (gpsUpdateInterval) {
            stopAutoGPS();
            startAutoGPS();
        }
    });
}

// Start trip
async function startTrip() {
    // Ensure a bus is assigned before starting
    if (!currentBusId) {
        alert('No bus assigned to you. Please contact admin to assign a bus before starting a trip.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/trips.php?action=start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                bus_id: currentBusId,
                driver_id: localStorage.getItem('user_id')
            })
        });

        let data = null;
        try {
            data = await response.json();
        } catch (e) {
            console.error('Non-JSON response from trips API', e);
            alert('Server error while starting trip');
            return;
        }

        if (data.success) {
            tripActive = true;
            updateTripUI();

            if (document.getElementById('auto-gps').checked) {
                startAutoGPS();
            }

            alert('Trip started!');
        } else {
            alert('Failed to start trip: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        alert('Error starting trip: ' + error.message);
    }
}

// Stop trip
async function stopTrip() {
    if (confirm('End trip? This will stop GPS tracking.')) {
        try {
            stopAutoGPS();
            
            const response = await fetch(`${API_BASE}/trips.php?action=end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    bus_id: currentBusId
                })
            });
            
            const data = await response.json();
            if (data.success) {
                tripActive = false;
                updateTripUI();
                alert('Trip ended!');
            }
        } catch (error) {
            alert('Error ending trip: ' + error.message);
        }
    }
}

// Pause trip
async function pauseTrip() {
    try {
        stopAutoGPS();
        tripActive = false;
        updateTripUI();
        alert('Trip paused!');
    } catch (error) {
        alert('Error pausing trip: ' + error.message);
    }
}

// Update Location
async function updateLocation() {
    if (navigator.geolocation) {
        // Disable update button while fetching
        const btn = document.getElementById('update-location-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Updating...';
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const speed = position.coords.speed || 0;
            const accuracy = position.coords.accuracy;

            try {
                // Build payload; include bus_id only if we have one
                const payload = {
                    driver_id: localStorage.getItem('user_id'),
                    latitude: lat,
                    longitude: lng,
                    speed_kmh: (speed ? speed * 3.6 : 0),
                    accuracy_meters: Math.round(accuracy || 0)
                };
                if (currentBusId) payload.bus_id = currentBusId;

                const response = await fetch(`${API_BASE}/locations.php?action=update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    },
                    body: JSON.stringify(payload)
                });

                // Try to parse JSON safely
                let data = null;
                try {
                    data = await response.json();
                } catch (e) {
                    console.error('Non-JSON response from locations API', e);
                }

                if (data && data.success) {
                    updateMapWithLocation(lat, lng, accuracy);
                    document.getElementById('current-location').textContent = 
                        `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    document.getElementById('current-speed').textContent = 
                        ((speed || 0) * 3.6).toFixed(1);
                    document.getElementById('last-update').textContent = 
                        new Date().toLocaleTimeString();
                } else {
                    const msg = (data && data.message) ? data.message : 'Failed to send location to server';
                    alert(msg);
                }
            } catch (error) {
                console.error('Error updating location:', error);
                alert('Error updating location: ' + error.message);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = '📍 Update Location';
                }
            }
        }, (error) => {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '📍 Update Location';
            }
            alert('GPS Error: ' + error.message);
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

// Start Auto GPS
function startAutoGPS() {
    const interval = parseInt(document.getElementById('update-interval').value) * 1000;
    
    gpsUpdateInterval = setInterval(() => {
        updateLocation();
    }, interval);
}

// Stop Auto GPS
function stopAutoGPS() {
    if (gpsUpdateInterval) {
        clearInterval(gpsUpdateInterval);
        gpsUpdateInterval = null;
    }
}

// Update map with driver location
function updateMapWithLocation(lat, lng, accuracyMeters = 0) {
    const popupContent = `<strong>Your location</strong><br>${lat.toFixed(5)}, ${lng.toFixed(5)}<br><small>${new Date().toLocaleTimeString()}</small>`;

    if (driverMarker) {
        driverMarker.setLatLng([lat, lng]);
        driverMarker.setPopupContent(popupContent);
    } else {
        driverMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                html: `<div style="font-size: 2rem;">📍</div>`,
                iconSize: [30, 30],
                className: 'driver-marker'
            })
        }).addTo(driverMap).bindPopup(popupContent);
    }

    // Show accuracy circle
    if (accuracyMeters && accuracyMeters > 0) {
        if (accuracyCircle) {
            accuracyCircle.setLatLng([lat, lng]);
            accuracyCircle.setRadius(accuracyMeters);
        } else {
            accuracyCircle = L.circle([lat, lng], {
                radius: accuracyMeters,
                color: '#3388ff',
                fillColor: '#3388ff',
                fillOpacity: 0.15,
                weight: 1
            }).addTo(driverMap);
        }
    }

    driverMarker.openPopup();
    driverMap.setView([lat, lng], 16);
}

// Update Trip UI
function updateTripUI() {
    const startBtn = document.getElementById('start-trip-btn');
    const stopBtn = document.getElementById('stop-trip-btn');
    const pauseBtn = document.getElementById('pause-trip-btn');
    
    if (tripActive) {
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        pauseBtn.classList.remove('hidden');
        
        document.getElementById('status-dot').className = 'status-dot active';
        document.getElementById('status-text').textContent = 'Active';
    } else {
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        pauseBtn.classList.add('hidden');
        
        document.getElementById('status-dot').className = 'status-dot offline';
        document.getElementById('status-text').textContent = 'Offline';
    }
}

// Update passenger count
document.getElementById('passenger-count-input')?.addEventListener('change', async (e) => {
    try {
        const response = await fetch(`${API_BASE}/buses.php?action=update_passengers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                bus_id: currentBusId,
                current_passengers: parseInt(e.target.value)
            })
        });
        
        const data = await response.json();
        if (data.success) {
            document.getElementById('passenger-count').textContent = e.target.value;
        }
    } catch (error) {
        console.error('Error updating passenger count:', error);
    }
});

// Logout
function logout() {
    if (confirm('Logout?')) {
        stopAutoGPS();
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopAutoGPS();
});
