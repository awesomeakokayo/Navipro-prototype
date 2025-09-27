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

// scripts.js - login logic (simplified)
function parseJwt(token) {
  try {
    if (!token) return null;
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

async function fetchUserFromAuth(token, backendURL) {
  if (!token) return null;
  const paths = ['/auth/me', '/auth/user', '/user/me', '/user'];
  for (const p of paths) {
    try {
      const r = await fetch(`${backendURL}${p}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!r.ok) continue;
      const body = await r.json();
      const uid = body?.user_id || body?.userId || body?.id || body?.sub || null;
      if (uid) return { user_id: uid, body };
    } catch (e) {
      console.warn('[login] fetchUserFromAuth failed for', p, e);
      continue;
    }
  }
  return null;
}

function storeAuth(token, userId) {
  if (token) {
    localStorage.setItem('access_token', token);
    localStorage.setItem('token', token);
    localStorage.setItem('jwt', token);
  }
  if (userId) {
    localStorage.setItem('user_id', userId);
    localStorage.setItem('userId', userId);
  }
  localStorage.removeItem('pendingVerification');
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('email') || {}).value?.trim();
      const password = (document.getElementById('password') || {}).value?.trim();
      if (!email || !password) return alert('Email and password are required');

      const submitBtn = form.querySelector('button[type=submit]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Signing in...'; }

      try {
        const res = await fetch(`${backendURL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await (res.headers.get('content-type')?.includes('application/json') ? res.json() : {});
        if (!res.ok) {
          const msg = (data && (data.message || data.error)) || `Login failed (status ${res.status})`;
          alert(msg);
          throw new Error(msg);
        }

        const token = data?.access_token || data?.token || data?.accessToken || data?.jwt || null;
        let userId = data?.user_id || data?.userId || data?.id || (data.user && (data.user.id || data.user._id)) || null;

        // fallback: parse userId from token
        if (!userId && token) {
          const payload = parseJwt(token);
          userId = payload?.sub || payload?.user_id || payload?.uid || payload?.id || payload?.userId || null;
        }

        if (userId) {
          storeAuth(token, userId);
          // navigate to dashboard (fragment used historically)
          const frag = `#user_id=${encodeURIComponent(userId)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
          window.location.href = `../Dashboard/index.html${frag}`;
          return;
        }

        // If token present but no userId, try fetching /auth/me
        if (token) {
          const fetched = await fetchUserFromAuth(token, backendURL);
          if (fetched && fetched.user_id) {
            storeAuth(token, fetched.user_id);
            const frag = `#user_id=${encodeURIComponent(fetched.user_id)}&token=${encodeURIComponent(token)}`;
            window.location.href = `../Dashboard/index.html${frag}`;
            return;
          }
        }

        // check for verification redirect
        if (data && data.redirectUrl && data.redirectUrl.includes('verification')) {
          localStorage.setItem('pendingVerification', 'true');
          window.location.href = '../Account Verification/index.html';
          return;
        }

        alert('Login succeeded but server returned no token or user id. Contact support.');
        console.error('[login] response had no token and no user id:', data);
      } catch (err) {
        console.error('[login] error', err);
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.origText || 'Sign in'; }
      }
    });
  }

  // Google button
  const googleBtn = document.getElementById('googleRegister');
  if (googleBtn) {
    googleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // callback must exactly match the OAuth app settings
      const origin = window.location.origin;
      const callbackAbsolute = `${origin}/login/callback.html`;
      const oauthUrl = `${backendURL}/auth/google?redirect=${encodeURIComponent(callbackAbsolute)}`;
      console.log('[login] redirecting to Google OAuth ->', oauthUrl);
      window.location.href = oauthUrl;
    });
  }

  // If token/userId exists; attempt a quick verify
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const userId = localStorage.getItem('user_id') || localStorage.getItem('userId');
    if (token && userId && window.auth && typeof auth.startBackgroundTokenRetry === 'function') {
      // optional: start small background retry if desired (not necessary)
      // auth.startBackgroundTokenRetry(5000, 6);
    }
  } catch (e) {
    console.warn('[login] background check init failed', e);
  }
});