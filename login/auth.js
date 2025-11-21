function storeSessionCredentials({ token, userId }) {
    if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('access_token', token);
    }
    if (userId) {
        localStorage.setItem('user_id', userId);
        localStorage.setItem('userId', userId);
    }
}

async function fetchUserViaSessionCookie() {
    const url = `${backendURL}/auth/me`;
    try {
        console.log('[auth] Attempting to hydrate session via cookie', url);
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        let data = null;
        try {
            data = await response.json();
        } catch (e) {
            console.warn('[auth] fetchUserViaSessionCookie: JSON parse failed', e);
        }

        if (!response.ok) {
            console.warn('[auth] fetchUserViaSessionCookie failed', response.status, data);
            return { ok: false, status: response.status, data };
        }

        const token =
            data?.access_token ||
            data?.token ||
            data?.jwt ||
            null;

        const userId =
            data?.user_id ||
            data?.userId ||
            data?.id ||
            (data?.user && (data.user.id || data.user._id || data.user.userId)) ||
            null;

        if (token || userId) {
            storeSessionCredentials({ token, userId });
        }

        return {
            ok: true,
            status: response.status,
            data,
            token,
            userId,
        };
    } catch (error) {
        console.error('[auth] fetchUserViaSessionCookie network error', error);
        return { ok: false, status: null, networkError: true, data: null };
    }
}

function isAuthenticated() {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const userId = localStorage.getItem('user_id') || localStorage.getItem('userId');
    console.log('[auth] Checking authentication:', { hasToken: !!token, hasUserId: !!userId });
    return !!(token && userId);
}

async function verifyToken() {
    let token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (!token) {
        console.log('[auth] No token found — attempting cookie hydration');
        const sessionResult = await fetchUserViaSessionCookie();
        if (sessionResult?.ok && sessionResult.userId) {
            token = sessionResult.token || localStorage.getItem('token') || localStorage.getItem('access_token');
            return {
                valid: true,
                status: sessionResult.status,
                networkError: false,
                data: sessionResult.data,
            };
        }

        if (sessionResult?.networkError) {
            return { valid: false, status: null, networkError: true, data: null };
        }

        return { valid: false, status: sessionResult?.status ?? null, networkError: false, data: sessionResult?.data ?? null };
    }

    try {
        console.log('[auth] Verifying token with backend...');
        const response = await fetch(`${backendURL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        let data = null;
        try {
            data = await response.json();
        } catch (e) {
            console.warn('[auth] verifyToken: failed to parse JSON', e);
        }

        console.log('[auth] Token verification response:', response.status, data);

        if (!response.ok) {
            // If 401 or 403, clear credentials and treat as invalid
            if (response.status === 401 || response.status === 403) {
                console.log('[auth] Token invalid (401/403), clearing credentials');
                localStorage.removeItem('token');
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_id');
                localStorage.removeItem('userId');
                return { valid: false, status: response.status, networkError: false, data };
            }

            // Treat 404 as non-fatal when we already have a token/userId locally
            if (response.status === 404) {
                const hasLocalUser = !!(localStorage.getItem('user_id') || localStorage.getItem('userId'));
                console.warn('[auth] /auth/me returned 404. hasLocalUser:', hasLocalUser);
                return { valid: hasLocalUser, status: response.status, networkError: false, data };
            }

            // For other non-OK responses, return invalid but do not necessarily clear stored values
            return { valid: false, status: response.status, networkError: false, data };
        }

        // If we got a user ID in the response, update it
        const userId = data?.user_id || data?.userId || data?.id ||
                      (data && data.user && (data.user.id || data.user._id || data.user.userId));
        if (userId) {
            console.log('[auth] Updating user ID from verification response');
            localStorage.setItem('user_id', userId);
            localStorage.setItem('userId', userId);
        }

        return { valid: true, status: response.status, networkError: false, data };
    } catch (error) {
        console.error('[auth] Token verification failed (network?):', error);
        // Network or TLS error - don't immediately clear stored credentials; treat as network issue
        return { valid: false, status: null, networkError: true, data: null };
    }
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
    module.exports = { isAuthenticated, verifyToken, requireAuth, fetchUserViaSessionCookie };
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
