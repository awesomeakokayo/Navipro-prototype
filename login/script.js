// Password visibility toggle
function togglePassword(inputId, toggleButton) {
  const passwordInput = document.getElementById(inputId);
  const eyeIcon = toggleButton.querySelector("span");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeIcon.className = "eye-closed";
  } else {
    passwordInput.type = "password";
    eyeIcon.className = "eye-open";
  }
}

// Handle form submission
const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email) {
    alert("Email is required");
    return;
  }

  if (!password) {
    alert("Password is required");
    return;
  }

  // Send data to backend
  try {
    const response = await fetch(`${backendURL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store the access token
      localStorage.setItem("access_token", data.access_token);
      // login.js - improved login that ensures user_id is captured

      // Replace this with your actual auth host variable
      // const backendURL = "https://naviproai-1.onrender.com";

      function togglePassword(inputId, toggleButton) {
        const passwordInput = document.getElementById(inputId);
        const eyeIcon = toggleButton.querySelector("span");
        if (!passwordInput || !eyeIcon) return;
        if (passwordInput.type === "password") {
          passwordInput.type = "text";
          eyeIcon.className = "eye-closed";
        } else {
          passwordInput.type = "password";
          eyeIcon.className = "eye-open";
        }
      }

      /**
       * Try to decode a JWT safely (no verification) and return payload object or null
       */
      function parseJwt(token) {
        try {
          if (!token || typeof token !== "string") return null;
          const parts = token.split(".");
          if (parts.length < 2) return null;
          const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const json = decodeURIComponent(
            atob(payload)
              .split("")
              .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join("")
          );
          return JSON.parse(json);
        } catch (e) {
          console.warn("parseJwt failed:", e);
          return null;
        }
      }

      /**
       * Try to obtain user data by calling auth backend's /me or /user endpoint.
       * Returns an object { user_id } or null.
       */
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
            if (!res.ok) {
              // try next path
              continue;
            }
            const body = await res.json();
            // Accept several possible keys
            const uid = body?.user_id || body?.userId || body?.id || body?.sub;
            if (uid) return { user_id: uid, body };
          } catch (e) {
            // network / CORS / not implemented etc. -> ignore and try next candidate
            console.warn(`fetchUserFromAuth: ${p} failed:`, e);
            continue;
          }
        }
        return null;
      }

      async function handleLoginSubmit(e) {
        e.preventDefault();

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value.trim() : "";

        if (!email) {
          alert("Email is required");
          return;
        }
        if (!password) {
          alert("Password is required");
          return;
        }

        // UI feedback: disable submit button while authenticating
        const submitBtn = document.querySelector("form button[type=submit]");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.dataset.origText = submitBtn.textContent;
          submitBtn.textContent = "Signing in...";
        }

        try {
          const res = await fetch(`${backendURL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          // try to parse JSON safely
          let data = null;
          try {
            data = await res.json();
          } catch (e) {
            console.error("Login response not JSON", e);
          }

          if (!res.ok) {
            const msg =
              (data && (data.message || data.error)) ||
              `Login failed (status ${res.status})`;
            alert(msg);
            throw new Error(msg);
          }

          // Prefer common token keys (access_token, token, accessToken)
          const token =
            (data &&
              (data.access_token ||
                data.token ||
                data.accessToken ||
                data.accessTokenJwt)) ||
            null;

          if (!token) {
            // If no token provided, but auth returns a user id directly:
            if (data && (data.user_id || data.userId || data.id)) {
              const uid = data.user_id || data.userId || data.id;
              localStorage.setItem("user_id", uid);
              localStorage.setItem("userId", uid);
              console.log("Stored user_id from login response:", uid);
              // No token to store; continue to dashboard
              // (If your backend requires token for other endpoints, those endpoints may fail.)
              window.location.href = "../Dashboard/index.html";
              return;
            }

            // No token AND no user_id in response -> fail safe
            alert(
              "Login succeeded but no token/user_id returned by auth service."
            );
            throw new Error("No token or user_id in auth response");
          }

          // store token
          localStorage.setItem("access_token", token);

          // Try to get user_id through three methods (1) direct from response, (2) decode token, (3) /auth/me call
          let userId =
            (data && (data.user_id || data.userId || data.id)) || null;

          if (!userId) {
            // try decode jwt payload
            const payload = parseJwt(token);
            if (payload) {
              userId =
                payload.sub ||
                payload.user_id ||
                payload.uid ||
                payload.id ||
                null;
              if (userId) {
                console.log("Derived user_id from token payload:", userId);
              }
            }
          }

          if (!userId) {
            // try hitting auth /me endpoint with token
            const fetched = await fetchUserFromAuth(token);
            if (fetched && fetched.user_id) {
              userId = fetched.user_id;
              console.log("Fetched user_id from auth /me:", userId);
            }
          }

          if (userId) {
            // store both keys for compatibility
            localStorage.setItem("user_id", userId);
            localStorage.setItem("userId", userId);
          } else {
            // If we still couldn't get a user id, warn but still avoid silent redirect loops.
            console.warn(
              "Login completed but user_id could not be resolved after decode and /auth/me checks."
            );
            alert(
              "Login succeeded but we couldn't confirm your user identity. Please try reloading or contact support."
            );
            // optional: don't redirect — let user retry or show a manual continue button
            // For now, we'll redirect to dashboard (but note: some features requiring user_id may fail).
            window.location.href = "../Dashboard/index.html";
            return;
          }

          // everything OK — redirect to dashboard
          window.location.href = "../Dashboard/index.html";
        } catch (err) {
          console.error("Error during login flow:", err);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.origText || "Sign in";
          }
        }
      }

      // attach form submit
      const form = document.querySelector("form");
      if (form) form.addEventListener("submit", handleLoginSubmit);

      // attach google register handler if element exists
      const googleBtn = document.getElementById("googleRegister");
      if (googleBtn) {
        googleBtn.addEventListener("click", () => {
          window.location.href = `${backendURL}/auth/google`;
        });
      }

      // Optional: if you want to auto-redirect if a valid token+userId already exist
      document.addEventListener("DOMContentLoaded", () => {
        const token = localStorage.getItem("access_token");
        const userId =
          localStorage.getItem("user_id") || localStorage.getItem("userId");
        if (token && userId) {
          // Note: we don't assume token is valid; if backend rejects it the dashboard logic will handle re-login.
          window.location.href = "../Dashboard/index.html";
        }
      });

      // Store the user_id if the backend sends it
      if (data.user_id) {
        localStorage.setItem("user_id", data.user_id);
      } else {
        console.warn(" No user_id received from backend!");
      }

      // Redirect to dashboard or appropriate page
      window.location.href = "../Dashboard/index.html";
    } else {
      alert(data.message || "Login failed. Please try again.");
    }
  } catch (error) {
    console.error("Error during login:", error);
    alert("An error occurred. Please try again later.");
  }
});

// Google register handler
document.getElementById("googleRegister").addEventListener("click", () => {
  window.location.href = `${backendURL}/auth/google`;
});

// Check if we have a token in localStorage and redirect if already logged in
// window.addEventListener("DOMContentLoaded", () => {
//   const token = localStorage.getItem("access_token");
//   if (token) {
//     window.location.href = "../Dashboard/index.html";
//   }
// });
