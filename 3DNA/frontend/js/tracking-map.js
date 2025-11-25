/* ============================================
   3DNA BUS TRACKING - REAL-TIME MAP
   ============================================ */

let map;
let busMarkers = {};
let selectedBusId = null;
let autoUpdateInterval = null;
const API_BASE = '../../backend/api';

// Initialize map on page load
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadRoutes();
    loadBuses();
    
    // Auto-refresh every 2 seconds
    autoUpdateInterval = setInterval(loadBuses, 2000);
    
    // Event listeners
    document.getElementById('route-filter').addEventListener('change', filterBuses);
    document.getElementById('refresh-btn').addEventListener('click', loadBuses);
    document.getElementById('center-map-btn').addEventListener('click', centerMap);
    document.getElementById('auto-update-toggle').addEventListener('click', toggleAutoUpdate);
});

// Initialize Leaflet Map
function initMap() {
    map = L.map('map').setView([40.7128, -74.0060], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
}

// Load all routes for filter dropdown
async function loadRoutes() {
    try {
        const response = await fetch(`${API_BASE}/routes.php?action=list`);
        const data = await response.json();
        
        if (data.success && data.routes) {
            const select = document.getElementById('route-filter');
            data.routes.forEach(route => {
                const option = document.createElement('option');
                option.value = route.route_id;
                option.textContent = `${route.route_number} - ${route.route_name}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading routes:', error);
    }
}

// Load all buses and display on map
async function loadBuses() {
    try {
        const response = await fetch(`${API_BASE}/buses.php?action=list`);
        const data = await response.json();
        
        if (data.success && data.buses) {
            updateBusList(data.buses);
            updateMapMarkers(data.buses);
        }
    } catch (error) {
        console.error('Error loading buses:', error);
    }
}

// Update bus list in sidebar
function updateBusList(buses) {
    const busList = document.getElementById('bus-list');
    const selectedRoute = document.getElementById('route-filter').value;
    
    let filteredBuses = buses;
    if (selectedRoute) {
        filteredBuses = buses.filter(bus => bus.route_id == selectedRoute);
    }
    
    if (filteredBuses.length === 0) {
        busList.innerHTML = '<div class="loading">No buses found</div>';
        return;
    }
    
    busList.innerHTML = filteredBuses.map(bus => `
        <div class="bus-item ${bus.bus_id === selectedBusId ? 'active' : ''}" onclick="selectBus(${bus.bus_id})">
            <div class="bus-item-header">
                <span class="bus-item-name">🚌 ${bus.bus_number}</span>
                <span class="bus-status-badge ${bus.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${bus.status}
                </span>
            </div>
            <div class="bus-item-info">
                <p><strong>Route:</strong> ${bus.route_number}</p>
                <p><strong>Plate:</strong> ${bus.registration_plate}</p>
                <p><strong>Passengers:</strong> ${bus.current_passengers || 0}</p>
            </div>
        </div>
    `).join('');
}

// Update markers on map
function updateMapMarkers(buses) {
    buses.forEach(bus => {
        const lat = bus.current_latitude;
        const lng = bus.current_longitude;
        
        if (lat && lng) {
            if (busMarkers[bus.bus_id]) {
                // Update existing marker
                busMarkers[bus.bus_id].setLatLng([lat, lng]);
            } else {
                // Create new marker
                const marker = L.marker([lat, lng], {
                    icon: L.divIcon({
                        html: `<div class="bus-marker" style="font-size: 1.8rem;">🚌</div>`,
                        iconSize: [35, 35],
                        className: 'bus-marker-container'
                    })
                }).addTo(map)
                .bindPopup(() => createBusPopup(bus));
                
                marker.on('click', () => selectBus(bus.bus_id));
                busMarkers[bus.bus_id] = marker;
            }
        }
    });
}

// Create popup content for bus marker
function createBusPopup(bus) {
    return `
        <div style="min-width: 250px;">
            <h4>🚌 ${bus.bus_number}</h4>
            <p><strong>Route:</strong> ${bus.route_number}</p>
            <p><strong>Driver:</strong> ${bus.driver_name || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="bus-status-badge status-${bus.status}">${bus.status}</span></p>
            <p><strong>Passengers:</strong> ${bus.current_passengers || 0}/${bus.capacity}</p>
            <p><strong>Speed:</strong> ${bus.speed_kmh || 0} km/h</p>
            <p><strong>Last Update:</strong> ${new Date(bus.gps_timestamp).toLocaleTimeString()}</p>
        </div>
    `;
}

// Select bus and show details
function selectBus(busId) {
    selectedBusId = busId;
    const busList = document.querySelectorAll('.bus-item');
    busList.forEach(item => item.classList.remove('active'));
    
    const selectedItem = document.querySelector(`.bus-item[onclick*="${busId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    // Show bus details
    showBusDetails(busId);
    
    // Center map on bus
    if (busMarkers[busId]) {
        map.setView(busMarkers[busId].getLatLng(), 14);
    }
}

// Show detailed information for selected bus
async function showBusDetails(busId) {
    try {
        const response = await fetch(`${API_BASE}/buses.php?action=get&id=${busId}`);
        const data = await response.json();
        
        if (data.success && data.bus) {
            const bus = data.bus;
            const detailsPanel = document.getElementById('bus-details');
            
            detailsPanel.innerHTML = `
                <div class="detail-item">
                    <div class="detail-label">Bus Number</div>
                    <div class="detail-value">${bus.bus_number}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Registration Plate</div>
                    <div class="detail-value">${bus.registration_plate}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Route</div>
                    <div class="detail-value">${bus.route_number} - ${bus.route_name}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Driver</div>
                    <div class="detail-value">${bus.driver_name || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Capacity</div>
                    <div class="detail-value">${bus.capacity}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Current Passengers</div>
                    <div class="detail-value">${bus.current_passengers || 0}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value" style="text-transform: uppercase;">
                        <span class="bus-status-badge status-${bus.status}">${bus.status}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Current Location</div>
                    <div class="detail-value">${bus.current_latitude?.toFixed(4)}, ${bus.current_longitude?.toFixed(4)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Speed</div>
                    <div class="detail-value">${bus.speed_kmh || 0} km/h</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Last Update</div>
                    <div class="detail-value">${new Date(bus.gps_timestamp).toLocaleTimeString()}</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading bus details:', error);
    }
}

// Filter buses by route
function filterBuses() {
    loadBuses();
}

// Close bus details popup
function closeBusPopup() {
    document.getElementById('bus-details-popup').classList.add('hidden');
}

// Center map on selected bus
function centerMap() {
    if (selectedBusId && busMarkers[selectedBusId]) {
        map.setView(busMarkers[selectedBusId].getLatLng(), 14);
    } else if (Object.keys(busMarkers).length > 0) {
        // Center on all buses
        const group = new L.featureGroup(Object.values(busMarkers));
        map.fitBounds(group.getBounds());
    }
}

// Toggle auto-update
function toggleAutoUpdate() {
    const btn = document.getElementById('auto-update-toggle');
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        autoUpdateInterval = null;
        btn.classList.remove('active');
    } else {
        autoUpdateInterval = setInterval(loadBuses, 2000);
        btn.classList.add('active');
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
    }
});
