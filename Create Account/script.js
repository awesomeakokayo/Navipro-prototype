// Create Account functionality using centralized AuthManager
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

// Function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to validate password strength
function validatePassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

// Handle form submission
const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get input values
  const firstname = document.getElementById("firstname").value.trim();
  const lastname = document.getElementById("lastname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document
    .getElementById("confirmpassword")
    .value.trim();

  // Clear previous errors
  document.querySelectorAll(".error-message").forEach((el) => {
    el.textContent = "";
    el.style.display = "none";
  });

  let hasErrors = false;

  // Frontend validations
  if (!firstname) {
    showError("firstnameError", "First name is required");
    hasErrors = true;
  }

  if (!lastname) {
    showError("lastnameError", "Last name is required");
    hasErrors = true;
  }

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
  } else if (!validatePassword(password)) {
    showError(
      "passwordError",
      "Password must be at least 8 characters with uppercase, lowercase, and number"
    );
    hasErrors = true;
  }

  if (password !== confirmPassword) {
    showError("confirmPasswordError", "Passwords don't match");
    hasErrors = true;
  }

  if (hasErrors) {
    return;
  }

  // Show loading state
  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = "Creating account...";
  submitButton.disabled = true;

  // Combine names
  const fullName = `${firstname} ${lastname}`;

  // Send data to backend
  try {
    const response = await fetch(`${auth.AUTH_BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: fullName,
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store the JWT token if provided using AuthManager
      if (data.access_token) {
        auth.setToken(data.access_token);
        
        // Store user data if provided
        if (data.user) {
          localStorage.setItem("userData", JSON.stringify(data.user));
        }
      }

      // Show success message
      showSuccess("Account created successfully! Redirecting...");

      // Redirect after a brief delay
      setTimeout(() => {
        window.location.href = "../Verify Email/index.html";
      }, 1500);
    } else {
      // Show error from server
      showError(
        "formError",
        data.message || "Registration failed. Please try again."
      );
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  } catch (error) {
    console.error("Error during registration:", error);
    showError("formError", "An error occurred. Please try again later.");
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
});

// Google register handler
document.getElementById("googleRegister").addEventListener("click", () => {
  window.location.href = `${auth.AUTH_BACKEND_URL}/auth/google`;
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
  if (auth.isAuthenticated()) {
    // User is already authenticated, redirect to dashboard
    window.location.href = "../Dashboard/index.html";
  }
});
