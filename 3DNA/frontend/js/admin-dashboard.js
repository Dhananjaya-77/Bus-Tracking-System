/* ============================================
   3DNA BUS TRACKING - ADMIN DASHBOARD
   ============================================ */

const API_BASE = '../../backend/api';
let currentSection = 'dashboard';

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadSection('dashboard');
});

// Check authentication
function checkAuth() {
    const userType = localStorage.getItem('user_type');
    if (userType !== 'admin') {
        window.location.href = 'index.html';
    }
}

// Load dashboard section
function loadSection(section) {
    currentSection = section;
    
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    
    // Show selected section
    const sectionElement = document.getElementById(section);
    if (sectionElement) {
        sectionElement.classList.add('active');
    }
    
    // Mark menu item active (safe: `event` may be undefined when called programmatically)
    if (typeof event !== 'undefined' && event && event.target) {
        event.target.classList.add('active');
    } else {
        // Fallback: try to find a menu item that references this section
        const menuItem = document.querySelector(`.menu-item[data-section="${section}"]`);
        if (menuItem) menuItem.classList.add('active');
    }
    
    // Load section data
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'buses':
            loadBuses();
            break;
        case 'routes':
            loadRoutes();
            break;
        case 'drivers':
            loadDrivers();
            break;
        case 'users':
            loadUsers();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

// Load Dashboard Overview
async function loadDashboard() {
    try {
        // Load stats
        const busesRes = await fetch(`${API_BASE}/buses.php?action=stats`);
        const routesRes = await fetch(`${API_BASE}/routes.php?action=stats`);
        const driversRes = await fetch(`${API_BASE}/users.php?action=stats&type=driver`);
        
        const busesData = await busesRes.json();
        const routesData = await routesRes.json();
        const driversData = await driversRes.json();
        
        // Update stat cards
        document.getElementById('stat-buses').textContent = busesData.total || 0;
        document.getElementById('stat-active').textContent = busesData.active || 0;
        document.getElementById('stat-drivers').textContent = driversData.total || 0;
        document.getElementById('stat-routes').textContent = routesData.total || 0;
        
        // Load activity log
        loadActivityLog();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load Activity Log
async function loadActivityLog() {
    try {
        const response = await fetch(`${API_BASE}/logs.php?action=recent`);
        const data = await response.json();
        
        const logContainer = document.getElementById('activity-log');
        if (data.success && data.logs) {
            logContainer.innerHTML = data.logs.map(log => `
                <div class="activity-item">
                    <div class="activity-time">${new Date(log.created_at).toLocaleTimeString()}</div>
                    <div class="activity-text">
                        <strong>${log.user_name}</strong> - ${log.action_type}
                        <p style="font-size: 0.85rem; color: #999; margin-top: 3px;">${log.description}</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading activity log:', error);
    }
}

// Load Buses Management
async function loadBuses() {
    try {
        const response = await fetch(`${API_BASE}/buses.php?action=list`);
        const data = await response.json();
        
        const tableBody = document.getElementById('buses-list');
        if (data.success && data.buses) {
            tableBody.innerHTML = data.buses.map(bus => `
                <tr>
                    <td>${bus.bus_number}</td>
                    <td>${bus.registration_plate}</td>
                    <td>${bus.route_number}</td>
                    <td>${bus.driver_name || 'Unassigned'}</td>
                    <td><span class="status-badge status-${bus.status}">${bus.status}</span></td>
                    <td>${bus.capacity}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn action-btn-view" onclick="viewBus(${bus.bus_id})">View</button>
                            <button class="action-btn action-btn-edit" onclick="editBus(${bus.bus_id})">Edit</button>
                            <button class="action-btn action-btn-delete" onclick="deleteBus(${bus.bus_id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading buses:', error);
    }
}

// Load Routes Management
async function loadRoutes() {
    try {
        const response = await fetch(`${API_BASE}/routes.php?action=list`);
        const data = await response.json();
        
        const tableBody = document.getElementById('routes-list');
        if (data.success && data.routes) {
            tableBody.innerHTML = data.routes.map(route => `
                <tr>
                    <td>${route.route_number}</td>
                    <td>${route.route_name}</td>
                    <td>${route.start_location}</td>
                    <td>${route.end_location}</td>
                    <td>${route.distance_km} km</td>
                    <td>${route.estimated_time_minutes} min</td>
                    <td>${route.stop_count || 0}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn action-btn-edit" onclick="editRoute(${route.route_id})">Edit</button>
                            <button class="action-btn action-btn-delete" onclick="deleteRoute(${route.route_id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading routes:', error);
    }
}

// Load Drivers Management
async function loadDrivers() {
    try {
        const response = await fetch(`${API_BASE}/users.php?action=list&type=driver`);
        const data = await response.json();
        
        const tableBody = document.getElementById('drivers-list');
        if (data.success && data.users) {
            tableBody.innerHTML = data.users.map(user => `
                <tr>
                    <td>${user.user_id}</td>
                    <td>${user.full_name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone || '-'}</td>
                    <td>${user.bus_number || 'No bus assigned'}</td>
                    <td><span class="status-badge status-${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn action-btn-edit" onclick="editDriver(${user.user_id})">Edit</button>
                            <button class="action-btn action-btn-delete" onclick="deleteDriver(${user.user_id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading drivers:', error);
    }
}

// Load Users Management
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/users.php?action=list`);
        const data = await response.json();
        
        const tableBody = document.getElementById('users-list');
        if (data.success && data.users) {
            tableBody.innerHTML = data.users.map(user => `
                <tr>
                    <td>${user.user_id}</td>
                    <td>${user.full_name}</td>
                    <td>${user.email}</td>
                    <td>${user.user_type}</td>
                    <td>${user.phone || '-'}</td>
                    <td><span class="status-badge status-${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn action-btn-edit" onclick="editUser(${user.user_id})">Edit</button>
                            <button class="action-btn action-btn-delete" onclick="deleteUser(${user.user_id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Load Analytics
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/analytics.php?action=overview`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('fleet-status').innerHTML = `
                <p>Total Buses: <strong>${data.total_buses}</strong></p>
                <p>Active: <strong>${data.active_buses}</strong></p>
                <p>Inactive: <strong>${data.inactive_buses}</strong></p>
            `;
            
            document.getElementById('daily-trips').innerHTML = `
                <p>Trips Today: <strong>${data.trips_today}</strong></p>
                <p>Total Distance: <strong>${data.total_distance_km} km</strong></p>
                <p>Passengers: <strong>${data.total_passengers}</strong></p>
            `;
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Show Add Bus Form
function showAddBusForm() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h2>Add New Bus</h2>
        <form onsubmit="saveBus(event)">
            <div class="form-group">
                <label>Bus Number</label>
                <input type="text" id="bus_number" required>
            </div>
            <div class="form-group">
                <label>Registration Plate</label>
                <input type="text" id="registration_plate" required>
            </div>
            <div class="form-group">
                <label>Route</label>
                <select id="route_id" required>
                    <option value="">Select Route</option>
                </select>
            </div>
            <div class="form-group">
                <label>Capacity</label>
                <input type="number" id="capacity" value="50">
            </div>
            <div class="form-group">
                <label>Model</label>
                <input type="text" id="model">
            </div>
            <div class="form-group">
                <label>Color</label>
                <input type="text" id="color">
            </div>
            <button type="submit" class="btn btn-primary">Save Bus</button>
        </form>
    `;
    loadRouteOptions('#route_id');
    document.getElementById('modal').classList.remove('hidden');
}

// Load Route Options for Select
async function loadRouteOptions(selector) {
    try {
        const response = await fetch(`${API_BASE}/routes.php?action=list`);
        const data = await response.json();
        
        if (data.success && data.routes) {
            const select = document.querySelector(selector);
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

// Save Bus
async function saveBus(event) {
    event.preventDefault();
    try {
        const response = await fetch(`${API_BASE}/buses.php?action=create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                bus_number: document.getElementById('bus_number').value,
                registration_plate: document.getElementById('registration_plate').value,
                route_id: document.getElementById('route_id').value,
                capacity: document.getElementById('capacity').value,
                model: document.getElementById('model').value,
                color: document.getElementById('color').value
            })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Bus added successfully!');
            closeModal();
            loadBuses();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('Error saving bus: ' + error.message);
    }
}

// Show Add Route Form
function showAddRouteForm() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h2>Add New Route</h2>
        <form onsubmit="saveRoute(event)">
            <div class="form-group">
                <label>Route Number</label>
                <input type="text" id="route_number" required>
            </div>
            <div class="form-group">
                <label>Route Name</label>
                <input type="text" id="route_name" required>
            </div>
            <div class="form-group">
                <label>Start Location</label>
                <input type="text" id="start_location" required>
            </div>
            <div class="form-group">
                <label>End Location</label>
                <input type="text" id="end_location" required>
            </div>
            <div class="form-group">
                <label>Distance (km)</label>
                <input type="number" id="distance_km" step="0.1">
            </div>
            <div class="form-group">
                <label>Estimated Time (minutes)</label>
                <input type="number" id="estimated_time_minutes">
            </div>
            <button type="submit" class="btn btn-primary">Save Route</button>
        </form>
    `;
    document.getElementById('modal').classList.remove('hidden');
}

// Save Route
async function saveRoute(event) {
    event.preventDefault();
    try {
        const response = await fetch(`${API_BASE}/routes.php?action=create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                route_number: document.getElementById('route_number').value,
                route_name: document.getElementById('route_name').value,
                start_location: document.getElementById('start_location').value,
                end_location: document.getElementById('end_location').value,
                distance_km: document.getElementById('distance_km').value,
                estimated_time_minutes: document.getElementById('estimated_time_minutes').value
            })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Route added successfully!');
            closeModal();
            loadRoutes();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('Error saving route: ' + error.message);
    }
}

// Show Add Driver Form
function showAddDriverForm() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h2>Add New Driver</h2>
        <form onsubmit="saveDriver(event)">
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="full_name" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="email" required>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="tel" id="phone">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="password" required>
            </div>
            <button type="submit" class="btn btn-primary">Add Driver</button>
        </form>
    `;
    document.getElementById('modal').classList.remove('hidden');
}

// Save Driver
async function saveDriver(event) {
    event.preventDefault();
    try {
        const response = await fetch(`${API_BASE}/users.php?action=create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                user_type: 'driver',
                full_name: document.getElementById('full_name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                password: document.getElementById('password').value
            })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Driver added successfully!');
            closeModal();
            loadDrivers();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('Error saving driver: ' + error.message);
    }
}

// Show Add User Form
function showAddUserForm() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h2>Add New User</h2>
        <form onsubmit="saveUser(event)">
            <div class="form-group">
                <label>User Type</label>
                <select id="user_type" required>
                    <option value="">Select Type</option>
                    <option value="passenger">Passenger</option>
                    <option value="driver">Driver</option>
                </select>
            </div>
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="full_name" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="email" required>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="tel" id="phone">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="password" required>
            </div>
            <button type="submit" class="btn btn-primary">Add User</button>
        </form>
    `;
    document.getElementById('modal').classList.remove('hidden');
}

// Save User
async function saveUser(event) {
    event.preventDefault();
    try {
        const response = await fetch(`${API_BASE}/users.php?action=create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                user_type: document.getElementById('user_type').value,
                full_name: document.getElementById('full_name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                password: document.getElementById('password').value
            })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('User added successfully!');
            closeModal();
            loadUsers();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('Error saving user: ' + error.message);
    }
}

// Delete functions (simplified)
function deleteBus(busId) {
    if (confirm('Are you sure you want to delete this bus?')) {
        fetch(`${API_BASE}/buses.php?action=delete&id=${busId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        }).then(() => loadBuses());
    }
}

function deleteRoute(routeId) {
    if (confirm('Are you sure you want to delete this route?')) {
        fetch(`${API_BASE}/routes.php?action=delete&id=${routeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        }).then(() => loadRoutes());
    }
}

function deleteDriver(userId) {
    if (confirm('Are you sure you want to delete this driver?')) {
        fetch(`${API_BASE}/users.php?action=delete&id=${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        }).then(() => loadDrivers());
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        fetch(`${API_BASE}/users.php?action=delete&id=${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        }).then(() => loadUsers());
    }
}

// View, Edit functions (simplified)
function viewBus(busId) {
    alert('View Bus #' + busId);
}

function editBus(busId) {
    alert('Edit Bus #' + busId);
}

function editRoute(routeId) {
    alert('Edit Route #' + routeId);
}

function editDriver(userId) {
    alert('Edit Driver #' + userId);
}

function editUser(userId) {
    alert('Edit User #' + userId);
}

// Close Modal
function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

// Logout
function logout() {
    if (confirm('Logout?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}
