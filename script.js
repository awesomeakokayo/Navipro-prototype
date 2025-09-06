fetch("https://naviprobackend.onrender.com/api/generate_roadmap", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-User-ID": currentUserId, // string from your auth flow
  },
  body: JSON.stringify(payload),
})
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);

document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  if (!hamburger || !navLinks) {
    console.error(
      "Missing #hamburger or #navLinks — check IDs and that script runs after DOM"
    );
    return;
  }

  // accessibility: mark button/expanded state
  hamburger.setAttribute("role", "button");
  hamburger.setAttribute("tabindex", "0");
  hamburger.setAttribute("aria-expanded", "false");

  const toggleNav = () => {
    const isOpen = navLinks.classList.toggle("active");
    hamburger.classList.toggle("open", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
  };

  hamburger.addEventListener("click", toggleNav);

  // keyboard access: Enter and Space should toggle
  hamburger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleNav();
    }
  });
});
