// config.js - Direct connection to Render backend
// Avoid redeclaring backendURL if it's already defined on the page
;(function() {
  const _url = "https://naviproai-1.onrender.com";
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { backendURL: _url };
  }
  if (typeof window !== 'undefined') {
    if (!window.backendURL) window.backendURL = _url;
    // Expose a safe accessor
    try {
      console.log(`Using backend URL: ${window.backendURL}`);
    } catch (e) {}
  }
})();
