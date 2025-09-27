// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const userId = localStorage.getItem('user_id') || localStorage.getItem('userId');
    console.log('[auth] Checking authentication:', { hasToken: !!token, hasUserId: !!userId });
    return !!(token && userId);
}

// Verify token is still valid
// Returns a detailed object: { valid: boolean, status: number|null, networkError: boolean, data: any }
async function verifyToken() {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token') || null;
  const userId = localStorage.getItem('user_id') || localStorage.getItem('userId') || null;

  // If we have both, try a normal bearer verify (existing behavior)
  if (token) {
    try {
      const res = await fetch(`${backendURL}/auth/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) return { valid: true, status: res.status, data: await res.json() };
      return { valid: false, status: res.status, networkError: false };
    } catch (e) {
      return { valid: false, status: null, networkError: true, error: e };
    }
  }

  // NO token but we DO have userId: try cookie-based /auth/me once before giving up
  if (!token && userId) {
    try {
      const res = await fetch(`${backendURL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const body = await res.json();
        // if backend returns a token, save it
        const newToken = body?.access_token || body?.token || null;
        const fetchedId = body?.user_id || body?.userId || body?.id || null;
        if (newToken) {
          localStorage.setItem('token', newToken);
          localStorage.setItem('access_token', newToken);
        }
        if (fetchedId && !localStorage.getItem('user_id')) {
          localStorage.setItem('user_id', fetchedId);
          localStorage.setItem('userId', fetchedId);
        }
        return { valid: true, status: res.status, data: body };
      } else {
        // treat 401/404 as invalid but log for debugging
        return { valid: false, status: res.status, networkError: false };
      }
    } catch (e) {
      return { valid: false, status: null, networkError: true, error: e };
    }
  }

  // nothing to verify
  return { valid: false, status: null, networkError: false };
}

// Function to check if we're on a login-related page
function isLoginPage() {
    const path = window.location.pathname.toLowerCase();
    return path.includes('login') || 
           path.includes('register') || 
           path.includes('create-account') ||
           path.includes('callback.html');
}

// Redirect to login if not authenticated
async function requireAuth() {
    console.log('[auth] Checking authentication requirements...');

    // If we're already on a login page, don't redirect
    if (isLoginPage()) {
        console.log('[auth] Currently on login page, skipping redirect');
        return false;
    }

    // First check stored credentials
    if (!isAuthenticated()) {
        console.log('[auth] No stored credentials, redirecting to login');
        window.location.href = '../login/index.html';
        return false;
    }

    // Then verify token is still valid
    console.log('[auth] Verifying token validity...');
    const result = await verifyToken();

    // If verification succeeded, continue
    if (result && result.valid) {
        console.log('[auth] Token valid');
        return true;
    }

    // If network error (TLS/connection), allow staying on the page but warn
    if (result && result.networkError) {
        console.warn('[auth] Token verification could not complete due to network/TLS error; allowing session for now');
        return true; // allow and attempt background re-check in the app if desired
    }

    // If token explicitly invalid (401/403) or verification failed, redirect to login
    console.log('[auth] Token invalid or verification failed, redirecting to login');
    window.location.href = '../login/index.html';
    return false;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isAuthenticated, verifyToken, requireAuth };
} else {
    // Background token retry: if verifyToken returned networkError, we can retry later
    let _backgroundRetryHandle = null;
    async function startBackgroundTokenRetry(intervalMs = 5000, maxAttempts = 6) {
        let attempts = 0;
        if (_backgroundRetryHandle) return; // already running
        _backgroundRetryHandle = setInterval(async () => {
            attempts++;
            console.log('[auth] Background token retry attempt', attempts);
            const result = await verifyToken();
            if (result && result.valid) {
                console.log('[auth] Background retry succeeded, stopping retries');
                clearInterval(_backgroundRetryHandle);
                _backgroundRetryHandle = null;
            } else if (attempts >= maxAttempts) {
                console.warn('[auth] Background retry max attempts reached, stopping');
                clearInterval(_backgroundRetryHandle);
                _backgroundRetryHandle = null;
            }
        }, intervalMs);
    }

    window.auth = { isAuthenticated, verifyToken, requireAuth, startBackgroundTokenRetry };
}