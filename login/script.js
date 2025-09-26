// Toggle password visibility
function togglePassword(inputId, toggleButton) {
  const passwordInput = document.getElementById(inputId);
  const eyeIcon = toggleButton && toggleButton.querySelector("span");
  if (!passwordInput || !eyeIcon) return;
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeIcon.className = "eye-closed";
  } else {
    passwordInput.type = "password";
    eyeIcon.className = "eye-open";
  }
}

// Decode JWT payload
function parseJwt(token) {
  try {
    if (!token) return null;
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    try {
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch (e) {
      return JSON.parse(json);
    }
  } catch (e) {
    console.warn("parseJwt failed:", e);
    return null;
  }
}

// Try calling auth backend to get user info using token
async function fetchUserFromAuth(token) {
  if (!token) return null;
  const candidatePaths = ["/auth/me", "/auth/user", "/user/me", "/user"];
  for (const p of candidatePaths) {
    try {
      const res = await fetch(`${backendURL}${p}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) continue;
      const body = await res.json();
      const uid =
        body?.user_id ||
        body?.userId ||
        body?.id ||
        body?.sub ||
        null;
      if (uid) return { user_id: uid, body };
    } catch (err) {
      console.warn("fetchUserFromAuth failed for", p, err);
      continue;
    }
  }
  return null;
}

// Centralized store function
function storeAuth(token, userId) {
  if (token) {
    localStorage.setItem("access_token", token);
    localStorage.setItem("token", token);
  }
  if (userId) {
    localStorage.setItem("user_id", userId);
    localStorage.setItem("userId", userId);
  }
  // Clear any pending verification flag if we're storing auth
  localStorage.removeItem("pendingVerification");
}

// The submit handler
const form = document.querySelector("form");
if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = (document.getElementById("email") || {}).value?.trim() || "";
    const password =
      (document.getElementById("password") || {}).value?.trim() || "";

    if (!email) return alert("Email is required");
    if (!password) return alert("Password is required");

    const submitBtn = form.querySelector("button[type=submit]");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.origText = submitBtn.textContent;
      submitBtn.textContent = "Signing in...";
    }

    try {
      console.log("[login] Attempting login to:", `${backendURL}/auth/login`);
      const res = await fetch(`${backendURL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Always try to get JSON body for debugging
      let data = null;
      try {
        data = await res.json();
        console.log("[login] Auth response:", data);
      } catch (err) {
        console.error("[login] Failed to parse response as JSON:", err);
        throw new Error("Invalid response from server");
      }

      // Debug: show what auth returned
      console.debug("[login] /auth/login status:", res.status, "body:", data);

      if (!res.ok) {
        const msg =
          (data && (data.message || data.error)) ||
          `Login failed (status ${res.status})`;
        alert(msg);
        throw new Error(msg);
      }

      // Try to find token in common locations
      const token =
        (data &&
          (data.access_token || data.token || data.accessToken || data.jwt)) ||
        null;

      // Try to find user_id directly in response or token payload first
      let userId = data && (
        data.user_id ||
        data.userId ||
        data.id ||
        (data.user && (data.user.id || data.user._id || data.user.userId))
      ) || null;

      // If no direct user ID, try to get it from token payload
      if (!userId && token) {
        const payload = parseJwt(token);
        if (payload) {
          userId = payload.sub ||
            payload.user_id ||
            payload.uid ||
            payload.id ||
            payload.userId || null;
          console.log("[login] Found user ID in token payload:", userId);
        }
      }

      // If we have a user ID, they're verified - go to dashboard
      if (userId) {
        console.log("[login] User ID found:", userId);
        console.log("[login] Storing auth credentials...");
        storeAuth(token, userId);
        
        // Verify credentials were stored
        const storedToken = localStorage.getItem('token') || localStorage.getItem('access_token');
        const storedUserId = localStorage.getItem('user_id') || localStorage.getItem('userId');
        console.log("[login] Stored credentials check:", { 
            hasToken: !!storedToken, 
            hasUserId: !!storedUserId 
        });

        // Double check auth before redirect
        if (!storedToken || !storedUserId) {
            console.error("[login] Failed to store credentials");
            alert("Error saving login information. Please try again.");
            return;
        }

        console.log("[login] Redirecting to dashboard...");
        window.location.href = "../Dashboard/index.html";
        return;
      }

      // Only check for verification redirect if we don't have a user ID
      if (data && data.redirectUrl && data.redirectUrl.includes("verification")) {
        console.log("[login] No user ID found, user needs verification. Redirecting to:", data.redirectUrl);
        localStorage.setItem("pendingVerification", "true");
        // Convert the getnavipro.com URL to our local path
        window.location.href = "../Account Verification/index.html";
        return;
      }

      console.log("[login] Found token:", token ? "yes" : "no");
      
      // If token present, store it
      if (token) {
        localStorage.setItem("access_token", token);
        localStorage.setItem("token", token);
      }

      // Only check for verification redirect if we don't have a user ID
      if (data && data.redirectUrl && data.redirectUrl.includes("verification")) {
        console.log("[login] No user ID found, user needs verification. Redirecting to:", data.redirectUrl);
        localStorage.setItem("pendingVerification", "true");
        // Convert the getnavipro.com URL to our local path
        window.location.href = "../Account Verification/index.html";
        return;
      }

      // If still no user id but token present, try calling /auth/me as a final attempt
      if (!userId && token) {
        const fetched = await fetchUserFromAuth(token);
        if (fetched && fetched.user_id) {
          userId = fetched.user_id;
          console.log("[login] fetched user id from auth/me:", userId);
          storeAuth(token, userId);
          window.location.href = "../Dashboard/index.html";
          return;
        } else {
          console.log("[login] No user ID found in /auth/me response");
        }
      }

      // If the auth gave neither token nor user id - critical failure
      alert(
        "Login succeeded but server returned no token or user id. Contact support."
      );
      console.error("[login] auth returned no token and no user_id:", data);
    } catch (err) {
      console.error("Login flow error:", err);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.origText || "Sign in";
      }
    }
  });
}

// Google button handler (if present)
const googleBtn = document.getElementById("googleRegister");
if (googleBtn) {
  googleBtn.addEventListener("click", () => {
    // Construct the OAuth URL with redirect_uri
    const redirectUri = `${window.location.origin}${window.location.pathname.replace('index.html', 'callback.html')}`;
    const oauthUrl = `${backendURL}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = oauthUrl;
  });
}

// If a token exists but verification may have failed due to transient network issues,
// start a background retry to attempt to validate the token shortly after page load.
(function startBackgroundRetryIfNeeded() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const userId = localStorage.getItem('user_id') || localStorage.getItem('userId');
    if (token && userId && window.auth && typeof auth.startBackgroundTokenRetry === 'function') {
      console.log('[login] Starting background token retry to handle transient network/TLS errors');
      auth.startBackgroundTokenRetry(5000, 6);
    }
  } catch (e) {
    console.warn('[login] could not start background token retry', e);
  }
})();
