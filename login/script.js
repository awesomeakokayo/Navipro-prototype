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
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("access_token");
  if (token) {
    window.location.href = "../Dashboard/index.html";
  }
});
