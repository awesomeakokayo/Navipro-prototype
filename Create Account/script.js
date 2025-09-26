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

  // Get input values
  const firstname = document.getElementById("firstname").value.trim();
  const lastname = document.getElementById("lastname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document
    .getElementById("confirmpassword")
    .value.trim();

  // Frontend validations
  if (!firstname) {
    alert("First name is required");
    return;
  }

  if (!lastname) {
    alert("Last name is required");
    return;
  }

  if (!email) {
    alert("Email is required");
    return;
  }

  if (!password) {
    alert("Password is required");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords don't match");
    return;
  }

  // Combine names
  const fullName = `${firstname} ${lastname}`;

  // Send data to backend
  try {
    console.log("[register] Attempting registration");
    const response = await fetch(`${backendURL}/auth/register`, {
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
    console.log("[register] Registration response:", data);

    if (response.ok) {
      // Try to extract and store token/user ID if they're in the registration response
      const token = data.token || data.access_token || data.accessToken || null;
      let userId = data.user_id || data.userId || data.id || 
        (data.user && (data.user.id || data.user._id || data.user.userId)) || null;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("access_token", token);
        console.log("[register] Stored token from registration");
      }
      
      if (userId) {
        localStorage.setItem("user_id", userId);
        localStorage.setItem("userId", userId);
        console.log("[register] Stored user ID from registration:", userId);
      }

      window.location.href = "../Verify Email/index.html";
    } else {
      console.error("[register] Registration failed:", data);
      alert(data.message || "Registration failed. Please try again.");
    }
  } catch (error) {
    console.error("Error during registration:", error);
    alert("An error occurred. Please try again later.");
  }
});

document.getElementById("googleRegister").addEventListener("click", () => {
  window.location.href = `${backendURL}/auth/google`;
});