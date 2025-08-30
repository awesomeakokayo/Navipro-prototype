// Backend URL configuration
const AUTH_BACKEND_URL = "https://naviproai-1.onrender.com"; // Your Node.js auth backend
const APP_BACKEND_URL = "https://backend-b7ak.onrender.com"; // Your Python backend

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

// Utility function for authenticated requests to Python backend
async function authenticatedFetch(endpoint, options = {}) {
  const token = localStorage.getItem("jwtToken");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${APP_BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token might be expired or invalid
    localStorage.removeItem("jwtToken");
    window.location.href = "./index.html"; // Redirect to login
    throw new Error("Authentication failed");
  }

  return response;
}

// Function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Handle form submission
const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // Clear previous errors
  document.querySelectorAll(".error-message").forEach((el) => {
    el.textContent = "";
    el.style.display = "none";
  });

  let hasErrors = false;

  // Frontend validations
  if (!email) {
    showError("emailError", "Email is required");
    hasErrors = true;
  } else if (!isValidEmail(email)) {
    showError("emailError", "Please enter a valid email address");
    hasErrors = true;
  }

  if (!password) {
    showError("passwordError", "Password is required");
    hasErrors = true;
  }

  if (hasErrors) {
    return;
  }

  // Show loading state
  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = "Logging in...";
  submitButton.disabled = true;

  // Send data to backend
  try {
    const response = await fetch(`${AUTH_BACKEND_URL}/auth/login`, {
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
      // Store the JWT token
      if (data.access_token) {
        localStorage.setItem("jwtToken", data.access_token);
        console.log("JWT token stored successfully");
      }

      // Show success message
      showSuccess("Login successful! Redirecting...");

      // Redirect after a brief delay
      setTimeout(() => {
        window.location.href = "../Dashboard/index.html";
      }, 1000);
    } else {
      // Show error from server
      showError(
        "formError",
        data.message || "Login failed. Please check your credentials."
      );
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  } catch (error) {
    console.error("Error during login:", error);
    showError("formError", "An error occurred. Please try again later.");
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
});

// Google login handler
document.getElementById("googleLogin").addEventListener("click", () => {
  window.location.href = `${AUTH_BACKEND_URL}/auth/google`;
});

// Helper function to show error messages
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
  } else {
    // Create a general error element if specific one doesn't exist
    const formError =
      document.getElementById("formError") || createFormErrorElement();
    formError.textContent = message;
    formError.style.display = "block";
  }
}

// Helper function to show success messages
function showSuccess(message) {
  const successElement =
    document.getElementById("successMessage") || createSuccessElement();
  successElement.textContent = message;
  successElement.style.display = "block";

  // Hide any visible errors
  document.querySelectorAll(".error-message").forEach((el) => {
    el.style.display = "none";
  });
}

// Create form error element if it doesn't exist
function createFormErrorElement() {
  const errorDiv = document.createElement("div");
  errorDiv.id = "formError";
  errorDiv.className = "error-message";
  form.parentNode.insertBefore(errorDiv, form.nextSibling);
  return errorDiv;
}

// Create success message element if it doesn't exist
function createSuccessElement() {
  const successDiv = document.createElement("div");
  successDiv.id = "successMessage";
  successDiv.className = "success-message";
  form.parentNode.insertBefore(successDiv, form.nextSibling);
  return successDiv;
}

// Check if user is already logged in
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("jwtToken");
  if (token) {
    // Verify token is still valid
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 > Date.now()) {
        // Token is still valid, redirect to dashboard
        window.location.href = "../Dashboard/index.html";
      } else {
        // Token expired, remove it
        localStorage.removeItem("jwtToken");
      }
    } catch (e) {
      console.error("Invalid token format", e);
      localStorage.removeItem("jwtToken");
    }
  }
});

// Forgot password functionality (if implemented)
document.getElementById("forgotPassword")?.addEventListener("click", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();

  if (!email || !isValidEmail(email)) {
    showError(
      "emailError",
      "Please enter a valid email address to reset password"
    );
    return;
  }

  // Implement forgot password logic here
  alert(`Password reset functionality would be triggered for: ${email}`);
});
// After successful login/registration
if (data.access_token) {
  localStorage.setItem("jwtToken", data.access_token);
  console.log("JWT token stored successfully");
}
