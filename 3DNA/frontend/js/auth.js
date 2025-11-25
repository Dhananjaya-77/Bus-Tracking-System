/* ============================================
   3DNA BUS TRACKING - AUTHENTICATION
   ============================================ */

// Check if user is authenticated
function checkAuth() {
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('auth_token');
    
    if (!userId || !token) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Logout user
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_email');
        localStorage.removeItem('auth_token');
        window.location.href = 'index.html';
    }
}

// Get auth headers for API calls
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    };
}

// API call with auth
async function authenticatedFetch(url, options = {}) {
    options.headers = getAuthHeaders();
    const response = await fetch(url, options);
    
    if (response.status === 401) {
        logout();
        return null;
    }
    
    return response;
}
