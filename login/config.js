(function () {
  const _url = "https://naviproai-1.onrender.com";
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { backendURL: _url };
  }
  if (typeof window !== "undefined") {
    if (!window.backendURL) window.backendURL = _url;
    try {
      console.log(`Using backend URL: ${window.backendURL}`);
    } catch (e) {}
  }
})();
