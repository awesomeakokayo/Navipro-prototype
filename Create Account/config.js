// config.js - Direct connection to Render backend
const backendURL = "https://naviproai-1.onrender.com";

// Export the backend URL
if (typeof module !== "undefined" && module.exports) {
  module.exports = { backendURL };
} else {
  window.backendURL = backendURL;
}
