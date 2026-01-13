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

  // Email subscription form handling
  const emailForm = document.getElementById("emailForm");
  const emailFormBottom = document.getElementById("emailFormBottom");

  const handleEmailSubmit = async (e, formId) => {
    e.preventDefault();
    const form = e.target;
    const emailInput = form.querySelector('input[type="email"]');
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (!emailInput.value) {
      alert("Please enter a valid email address");
      return;
    }

    const email = emailInput.value;
    
    // Store email in localStorage for now (you can replace this with API call later)
    try {
      // Example: Save to localStorage
      const subscribers = JSON.parse(localStorage.getItem("navipro_subscribers") || "[]");
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem("navipro_subscribers", JSON.stringify(subscribers));
      }
      
      // Show success message
      const originalText = submitButton.textContent;
      submitButton.textContent = "✓ Email Saved!";
      submitButton.disabled = true;
      
      emailInput.value = "";
      
      setTimeout(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }, 3000);
      
      console.log(`Email subscribed: ${email}`);
    } catch (error) {
      console.error("Error saving email:", error);
      alert("There was an error. Please try again.");
    }
  };

  if (emailForm) {
    emailForm.addEventListener("submit", (e) => handleEmailSubmit(e, "emailForm"));
  }

  if (emailFormBottom) {
    emailFormBottom.addEventListener("submit", (e) => handleEmailSubmit(e, "emailFormBottom"));
  }
});
z