// Centralized Authentication Utility for NaviPRO
// This file handles JWT token management and user authentication across all pages

class AuthManager {
    constructor() {
        this.AUTH_BACKEND_URL = "https://naviproai-1.onrender.com";
        this.APP_BACKEND_URL = "https://backend-b7ak.onrender.com";
        this.tokenKey = "jwtToken";
        this.userKey = "userData";
    }

    // Get JWT token from localStorage
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Store JWT token in localStorage
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
        console.log("JWT token stored successfully");
    }

    // Remove JWT token from localStorage
    removeToken() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        console.log("JWT token removed");
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const payload = this.decodeToken(token);
            if (payload.exp * 1000 > Date.now()) {
                return true;
            } else {
                // Token expired, remove it
                this.removeToken();
                return false;
            }
        } catch (e) {
            console.error("Invalid token format", e);
            this.removeToken();
            return false;
        }
    }

    // Decode JWT token payload
    decodeToken(token) {
        try {
            return JSON.parse(atob(token.split(".")[1]));
        } catch (e) {
            throw new Error("Invalid token format");
        }
    }

    // Get user ID from token
    getUserId() {
        if (!this.isAuthenticated()) return null;
        
        try {
            const token = this.getToken();
            const payload = this.decodeToken(token);
            return payload.user_id || payload.sub || payload.id;
        } catch (e) {
            console.error("Error getting user ID from token:", e);
            return null;
        }
    }

    // Get user data from token
    getUserData() {
        if (!this.isAuthenticated()) return null;
        
        try {
            const token = this.getToken();
            const payload = this.decodeToken(token);
            return {
                id: payload.user_id || payload.sub || payload.id,
                email: payload.email,
                name: payload.name,
                role: payload.role
            };
        } catch (e) {
            console.error("Error getting user data from token:", e);
            return null;
        }
    }

    // Redirect to login if not authenticated
    requireAuth(redirectUrl = "../login/index.html") {
        if (!this.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    // Make authenticated request to Python backend
    async authenticatedFetch(endpoint, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error("User not authenticated");
        }

        const token = this.getToken();
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...options.headers,
        };

        const response = await fetch(`${this.APP_BACKEND_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Token expired or invalid
            this.removeToken();
            window.location.href = "../login/index.html";
            throw new Error("Authentication failed - token expired");
        }

        return response;
    }

    // Make authenticated request to auth backend
    async authBackendFetch(endpoint, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error("User not authenticated");
        }

        const token = this.getToken();
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...options.headers,
        };

        const response = await fetch(`${this.AUTH_BACKEND_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Token expired or invalid
            this.removeToken();
            window.location.href = "../login/index.html";
            throw new Error("Authentication failed - token expired");
        }

        return response;
    }

    // Logout user
    logout() {
        this.removeToken();
        window.location.href = "../index.html";
    }

    // Refresh token (if your backend supports it)
    async refreshToken() {
        try {
            const response = await fetch(`${this.AUTH_BACKEND_URL}/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    refresh_token: localStorage.getItem("refreshToken")
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.setToken(data.access_token);
                return true;
            }
        } catch (error) {
            console.error("Failed to refresh token:", error);
        }
        
        return false;
    }
}

// Create global instance
const auth = new AuthManager();

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
    module.exports = { AuthManager, auth };
} else {
    // Make available globally for browser
    window.auth = auth;
    window.AuthManager = AuthManager;
}

// Auto-check authentication on page load
document.addEventListener("DOMContentLoaded", () => {
    // Check if we're on a protected page
    const protectedPages = [
        "/Dashboard/",
        "/roadmap/",
        "/Course Recommendation/",
        "/onboarding/"
    ];
    
    const currentPath = window.location.pathname;
    const isProtectedPage = protectedPages.some(page => currentPath.includes(page));
    
    if (isProtectedPage && !auth.isAuthenticated()) {
        auth.logout();
    }
});

console.log("AuthManager initialized");
