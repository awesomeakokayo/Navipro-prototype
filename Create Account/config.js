// config.js - Direct connection to Render backend
const backendURL = "https://naviproai-1.onrender.com";

// Export the backend URL
if (typeof module !== "undefined" && module.exports) {
  module.exports = { backendURL };
} else {
  window.backendURL = backendURL;
}

// Log the backend URL for debugging
console.log(`Using backend URL: ${backendURL}`);
