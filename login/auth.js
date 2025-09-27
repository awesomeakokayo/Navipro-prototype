// auth.js 
const Auth = (function () {
  const KEYS = {
    TOKEN: "token",
    ACCESS_TOKEN: "access_token",
    JWT: "jwt",
    USER_ID: "user_id",
    USERID_ALT: "userId",
  };

  function _readToken() {
    return (
      localStorage.getItem(KEYS.TOKEN) ||
      localStorage.getItem(KEYS.ACCESS_TOKEN) ||
      null
    );
  }
  function _readUserId() {
    return (
      localStorage.getItem(KEYS.USER_ID) ||
      localStorage.getItem(KEYS.USERID_ALT) ||
      null
    );
  }

  function setAuth(token, userId) {
    if (token) {
      localStorage.setItem(KEYS.TOKEN, token);
      localStorage.setItem(KEYS.ACCESS_TOKEN, token);
      localStorage.setItem(KEYS.JWT, token);
    }
    if (userId) {
      localStorage.setItem(KEYS.USER_ID, userId);
      localStorage.setItem(KEYS.USERID_ALT, userId);
    }
  }

  function clearAuth() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  }

  function isAuthenticated() {
    return !!(_readToken() && _readUserId());
  }

  // Verify token by calling backend /auth/me (should return user info)
  async function verifyToken(backendURL) {
    const token = _readToken();
    if (!token)
      return { valid: false, status: null, networkError: false, data: null };

    try {
      const res = await fetch(`${backendURL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let data = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        // non-json body is possible, but treat as error
        data = null;
      }

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // token invalid — clear stored credentials
          clearAuth();
          console.warn("[auth] Token invalid, cleared stored auth");
        }
        // 404 can be treated as missing endpoint — caller decides
        return { valid: false, status: res.status, networkError: false, data };
      }

      // success — ensure we store any user id returned
      const userId =
        data?.user_id ||
        data?.userId ||
        data?.id ||
        (data.user && (data.user.id || data.user._id || data.user.userId)) ||
        null;

      if (userId) setAuth(token, userId);

      return { valid: true, status: res.status, networkError: false, data };
    } catch (err) {
      console.error("[auth] verifyToken network error:", err);
      return { valid: false, status: null, networkError: true, data: null };
    }
  }

  // requireAuth: used on protected pages to redirect to login if needed.
  async function requireAuth(backendURL, options = {}) {
    // options: { loginPage: '/login/index.html' }
    const loginPage = options.loginPage || "/login/index.html";

    // If already on login pages, don't redirect
    const path = window.location.pathname.toLowerCase();
    if (
      path.includes("/login") ||
      path.includes("/register") ||
      path.includes("/create-account") ||
      path.includes("/callback")
    ) {
      return false;
    }

    if (!isAuthenticated()) {
      window.location.href = loginPage;
      return false;
    }

    const res = await verifyToken(backendURL);
    if (res.valid) return true;
    if (res.networkError) {
      console.warn(
        "[auth] Network error verifying token — allowing session to continue (be cautious)"
      );
      return true;
    }

    // invalid token
    window.location.href = loginPage;
    return false;
  }

  return {
    isAuthenticated,
    verifyToken,
    requireAuth,
    setAuth,
    clearAuth,
    _internal: { _readToken, _readUserId }, // small helpers for debug/testing
  };
})();

// Expose for CommonJS/env
if (typeof module !== "undefined" && module.exports) {
  module.exports = Auth;
} else {
  window.auth = Auth;
}
