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
        body?.userId || // camelCase support
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

      console.log("[login] Found token:", token ? "yes" : "no");

      // Try to find user_id directly in response
      let userId = data && (
        data.user_id ||
        data.userId ||
        data.id ||
        (data.user && (data.user.id || data.user._id || data.user.userId)) ||
        (data.data && (data.data.user_id || data.data.userId || data.data.id))
      ) || null;
      
      console.log("[login] Initial user ID search result:", userId);

      // If no token and userId present, store and continue
      if (!token && userId) {
        storeAuth(null, userId);
        console.log("[login] stored user id from response (no token)");
        window.location.href = "../Dashboard/index.html";
        return;
      }

      // If token present, store it
      if (token) {
        localStorage.setItem("access_token", token);
        localStorage.setItem("token", token);
      }

      // If no user id in response, try to decode token
      if (!userId && token) {
        const payload = parseJwt(token);
        if (payload) {
          userId =
            payload.sub ||
            payload.user_id ||
            payload.uid ||
            payload.id ||
            payload.userId || // camelCase fix
            null;
          if (userId) {
            console.log("[login] derived user_id from token payload:", userId);
            storeAuth(token, userId);
            window.location.href = "../Dashboard/index.html";
            return;
          }
        }
      }

      // If still no user id but token present, try calling /auth/me
      if (!userId && token) {
        const fetched = await fetchUserFromAuth(token);
        if (fetched && fetched.user_id) {
          userId = fetched.user_id;
          console.log("[login] fetched user id from auth/me:", userId);
          storeAuth(token, userId);
          window.location.href = "../Dashboard/index.html";
          return;
        }
      }

      // If no token but we did get user_id earlier, already handled.
      // Otherwise, if we have token but no user id, make one final attempt to get user info
      if (token && !userId) {
        console.log("[login] No user ID found in initial response, trying /auth/me endpoint");
        try {
          const userInfoResponse = await fetch(`${backendURL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const userInfo = await userInfoResponse.json();
          console.log("[login] /auth/me response:", userInfo);
          
          userId = userInfo && (
            userInfo.user_id ||
            userInfo.userId ||
            userInfo.id ||
            (userInfo.user && (userInfo.user.id || userInfo.user._id || userInfo.user.userId))
          );

          if (userId) {
            console.log("[login] Successfully retrieved user ID from /auth/me:", userId);
            storeAuth(token, userId);
            window.location.href = "../Dashboard/index.html";
            return;
          } else {
            throw new Error("No user ID in /auth/me response");
          }
        } catch (error) {
          console.error("[login] Failed to get user info from /auth/me:", error);
          alert("Failed to retrieve user information. Please try again or contact support.");
          return;
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
    window.location.href = `${backendURL}/auth/google`;
  });
}
