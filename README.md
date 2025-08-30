# NaviPRO JWT Authentication System

This document explains how the JWT (JSON Web Token) authentication system works in NaviPRO and how to use it across all pages.

## Overview

The JWT authentication system provides secure user authentication and authorization across the entire NaviPRO platform. When a user logs in or creates an account, they receive a JWT token that serves as their unique identifier and authentication credential for all subsequent requests.

## Architecture

```
Frontend (HTML/JS) ←→ Auth Backend (https://naviproai-1.onrender.com)
       ↓
   JWT Token Storage (localStorage)
       ↓
   Python Backend (https://backend-b7ak.onrender.com)
       ↓
   Database (User data, roadmaps, progress)
```

## How It Works

### 1. User Authentication Flow

1. **Login/Create Account**: User authenticates with the auth backend
2. **Token Generation**: Auth backend generates a JWT token containing user information
3. **Token Storage**: Frontend stores the token in localStorage
4. **API Requests**: All subsequent requests include the token in Authorization header
5. **Token Verification**: Python backend verifies the token with the auth backend
6. **Data Access**: User data is accessed using the user ID from the verified token

### 2. JWT Token Structure

The JWT token contains:
- **Header**: Algorithm and token type
- **Payload**: User information (user_id, email, name, role, exp)
- **Signature**: Cryptographic signature for verification

Example payload:
```json
{
  "user_id": "12345",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "exp": 1640995200
}
```

## Frontend Implementation

### 1. Centralized Authentication Manager

All authentication logic is centralized in `auth.js`:

```javascript
// Check if user is authenticated
if (auth.isAuthenticated()) {
    // User is logged in
}

// Get user ID from token
const userId = auth.getUserId();

// Make authenticated API calls
const response = await auth.authenticatedFetch("/api/user_roadmap");
```

### 2. Page Protection

Protected pages automatically check authentication:

```javascript
// In protected pages (Dashboard, Roadmap, etc.)
if (!auth.requireAuth()) {
    return; // Redirects to login if not authenticated
}
```

### 3. Token Management

```javascript
// Store token after login
auth.setToken(accessToken);

// Remove token on logout
auth.logout();

// Check token validity
if (auth.isAuthenticated()) {
    // Token is valid
}
```

## Backend Implementation

### 1. Token Verification

The Python backend verifies JWT tokens using the `@require_auth` decorator:

```python
@app.route('/api/user_roadmap', methods=['GET'])
@require_auth
def get_user_roadmap():
    user_id = request.user.get('user_id')
    # Access user-specific data using user_id
```

### 2. User Context

After token verification, user data is available in `request.user`:

```python
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Verify token and add user data to request
        request.user = user_data
        return f(*args, **kwargs)
    return decorated_function
```

## API Endpoints

### Authentication Required Endpoints

All these endpoints require a valid JWT token in the Authorization header:

- `GET /api/user_roadmap` - Get user's learning roadmap
- `POST /api/generate_roadmap` - Generate new roadmap
- `POST /api/complete_task` - Mark task as completed
- `GET /api/user_progress` - Get user's learning progress
- `GET /api/course_recommendations` - Get personalized course recommendations

### Request Format

```javascript
// Frontend request
const response = await auth.authenticatedFetch("/api/user_roadmap", {
    method: "GET"
});

// Backend receives
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Security Features

### 1. Token Expiration

- JWT tokens have an expiration time (exp)
- Expired tokens are automatically removed
- Users are redirected to login when tokens expire

### 2. Automatic Logout

- Invalid tokens trigger automatic logout
- Users are redirected to login page
- Local storage is cleared

### 3. CORS Protection

- Backend validates origin of requests
- Only authenticated requests are processed
- Unauthorized requests return 401 status

## Database Integration

### 1. User Identification

All user data is linked using the user ID from the JWT token:

```python
# Example database queries
user_id = request.user.get('user_id')

# Get user's roadmap
roadmap = get_roadmap_by_user_id(user_id)

# Update user progress
update_progress(user_id, task_id, completed=True)

# Get user's course recommendations
recommendations = get_recommendations_for_user(user_id)
```

### 2. Data Isolation

- Each user can only access their own data
- User ID from token ensures data privacy
- No cross-user data access possible

## Error Handling

### 1. Authentication Errors

```javascript
// Frontend error handling
try {
    const response = await auth.authenticatedFetch("/api/endpoint");
    // Handle success
} catch (error) {
    if (error.message.includes("Authentication failed")) {
        // Token expired, user redirected to login
    }
}
```

### 2. Backend Error Responses

```python
# Invalid token
return jsonify({"error": "Invalid or expired token"}), 401

# Missing authorization header
return jsonify({"error": "No authorization header"}), 401

# Token verification failed
return jsonify({"error": "Token verification failed"}), 401
```

## Testing the System

### 1. Login Flow

1. Navigate to `/login/index.html`
2. Enter valid credentials
3. Check browser console for "JWT token stored successfully"
4. Verify token in localStorage: `localStorage.getItem('jwtToken')`

### 2. Protected Page Access

1. After login, navigate to `/Dashboard/index.html`
2. Page should load without redirect
3. Check browser console for user session initialization

### 3. API Calls

1. Open browser DevTools → Network tab
2. Navigate to roadmap or other protected pages
3. Verify API requests include Authorization header
4. Check response status codes

## Troubleshooting

### Common Issues

1. **Token not stored**: Check login response for `access_token` field
2. **401 errors**: Verify token is valid and not expired
3. **Redirect loops**: Check authentication logic in protected pages
4. **CORS errors**: Ensure backend allows frontend origin

### Debug Commands

```javascript
// Check authentication status
console.log("Is authenticated:", auth.isAuthenticated());

// Check token
console.log("Token:", auth.getToken());

// Check user data
console.log("User data:", auth.getUserData());

// Check user ID
console.log("User ID:", auth.getUserId());
```

## Best Practices

1. **Always use `auth.authenticatedFetch()`** for API calls to protected endpoints
2. **Check authentication before page load** in protected pages
3. **Handle token expiration gracefully** with automatic logout
4. **Validate user permissions** on both frontend and backend
5. **Use HTTPS** in production for secure token transmission
6. **Implement token refresh** for long user sessions

## File Structure

```
host/
├── auth.js                    # Centralized authentication manager
├── login/
│   ├── index.html            # Login page
│   ├── script.js             # Login logic
│   └── style.css
├── Create Account/
│   ├── index.html            # Registration page
│   ├── script.js             # Registration logic
│   └── style.css
├── Dashboard/
│   ├── index.html            # Protected dashboard
│   ├── script.js             # Dashboard logic
│   └── style.css
├── roadmap/
│   ├── index.html            # Protected roadmap page
│   ├── script.js             # Roadmap logic
│   └── style.css
├── backend_example.py        # Example Python backend
└── README.md                 # This file
```

## Support

For issues or questions about the JWT authentication system:

1. Check browser console for error messages
2. Verify token format in localStorage
3. Check network requests in DevTools
4. Ensure backend endpoints are accessible
5. Verify CORS configuration

The system is designed to be robust and secure, providing seamless authentication across all NaviPRO pages while maintaining user data privacy and security.
