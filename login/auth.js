// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const userId = localStorage.getItem('user_id') || localStorage.getItem('userId');
    return !!(token && userId);
}

// Verify token is still valid
async function verifyToken() {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (!token) return false;

    try {
        const response = await fetch(`${backendURL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // Clear invalid tokens
            localStorage.removeItem('token');
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('userId');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Token verification failed:', error);
        return false;
    }
}

// Redirect to login if not authenticated
async function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '../login/index.html';
        return false;
    }

    // Verify token is still valid
    const isValid = await verifyToken();
    if (!isValid) {
        window.location.href = '../login/index.html';
        return false;
    }

    return true;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isAuthenticated, verifyToken, requireAuth };
} else {
    window.auth = { isAuthenticated, verifyToken, requireAuth };
}