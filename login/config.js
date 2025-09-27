(function () {
  const _url = "https://naviproai-1.onrender.com";
  if (typeof window !== "undefined") {
    window.backendURL = window.backendURL || _url;
    console.log("Using backend URL:", window.backendURL);
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { backendURL: _url };
  }
})();
