document.addEventListener("DOMContentLoaded", function () {
  const steps = document.querySelectorAll(".step");
  const nextButtons = document.querySelectorAll(".next-btn");
  const backButtons = document.querySelectorAll(".back-btn");
  const progressBar = document.getElementById("progress-bar-fill");
  const optionButtons = document.querySelectorAll(".option-btn");
  const selectButtons = document.querySelectorAll(".select-btn");
  const targetRoleInput = document.querySelector("#target-role");

  let formData = {
    career_goal: "",
    target_role: "",
    timeframe: "",
    hours_per_week: "",
    learning_style: "",
    learning_speed: "",
    skill_level: "",
  };

  let currentStep = 1;
  steps[0].classList.add("active");
  updateProgressBar();

function getAuthHeaders(additional = {}) {
  const token =
    typeof auth !== "undefined" && auth.getToken
      ? auth.getToken()
      : localStorage.getItem("token");

  const headers = { "Content-Type": "application/json", ...additional };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return headers;
}

  function getStepData(stepNumber) {
    switch (stepNumber) {
      case 1:
        return formData.career_goal;
      case 2:
        return formData.target_role;
      case 3:
        return formData.timeframe;
      case 4:
        return formData.hours_per_week;
      case 5:
        return formData.learning_style;
      case 6:
        return formData.learning_speed;
      case 7:
        return formData.skill_level;
      default:
        return "";
    }
  }

  optionButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const parentStep = this.closest(".step");
      parentStep
        .querySelectorAll(".option-btn")
        .forEach((btn) => btn.classList.remove("selected"));
      this.classList.add("selected");

      const stepNumber = parseInt(parentStep.getAttribute("data-step"));
      const selectedValue = this.getAttribute("data-value");

      if (stepNumber === 1) formData.career_goal = selectedValue;
      else if (stepNumber === 6) formData.learning_speed = selectedValue;
      else if (stepNumber === 7) formData.skill_level = selectedValue;

      enableNextButton(stepNumber - 1);
      updateStepCompletion();
    });
  });

  selectButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const parentStep = this.closest(".step");
      parentStep
        .querySelectorAll(".select-btn")
        .forEach((btn) => btn.classList.remove("selected"));
      this.classList.add("selected");

      const stepNumber = parseInt(parentStep.getAttribute("data-step"));
      const selectedValue = this.getAttribute("data-value");

      if (stepNumber === 3) formData.timeframe = selectedValue;
      else if (stepNumber === 4) formData.hours_per_week = selectedValue;
      else if (stepNumber === 5) formData.learning_style = selectedValue;

      enableNextButton(stepNumber - 1);
      updateStepCompletion();
    });
  });

  if (targetRoleInput) {
    targetRoleInput.addEventListener("input", function () {
      const nextBtn = steps[1].querySelector(".next-btn");
      if (this.value.trim() !== "") {
        enableNextButton(1);
        formData.target_role = this.value.trim();
        updateStepCompletion();
      } else {
        disableNextButton(1);
        formData.target_role = "";
        updateStepCompletion();
      }
    });
  }

  nextButtons.forEach((button, index) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      if (currentStep === 2 && targetRoleInput)
        formData.target_role = targetRoleInput.value.trim();

      if (currentStep < steps.length) {
        steps[currentStep - 1].classList.remove("active");
        steps[currentStep].classList.add("active");
        currentStep++;
        updateProgressBar();
      }
    });
  });

  backButtons.forEach((button, index) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      if (currentStep > 1) {
        steps[currentStep - 1].classList.remove("active");
        steps[currentStep - 2].classList.add("active");
        currentStep--;
        updateProgressBar();
        clearFormDataAfterStep(currentStep);
      }
    });
  });

  function clearFormDataAfterStep(step) {
    if (step < 5) formData.learning_style = "";
    if (step < 6) formData.learning_speed = "";
    if (step < 7) formData.skill_level = "";
  }

  function updateProgressBar() {
    const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
    if (progressBar) progressBar.style.width = `${progress}%`;
  }

  function enableNextButton(stepIndex) {
    const nextBtn = steps[stepIndex].querySelector(".next-btn");
    if (nextBtn) {
      nextBtn.removeAttribute("disabled");
      nextBtn.style.background = "#FF9E00";
    }
  }

  function disableNextButton(stepIndex) {
    const nextBtn = steps[stepIndex].querySelector(".next-btn");
    if (nextBtn) {
      nextBtn.setAttribute("disabled", "");
      nextBtn.style.background = "#B9B9B9";
    }
  }

  function updateStepCompletion() {
    // optional: visual indicators per step can be updated here
  }

  const finalStep = steps[steps.length - 1];
  const finishBtn = finalStep.querySelector(".next-btn");

  if (finishBtn) {
    finishBtn.addEventListener("click", async function (e) {
      e.preventDefault();

      const missingFields = [];
      if (!formData.career_goal) missingFields.push("Career Goal (Step 1)");
      if (!formData.target_role) missingFields.push("Target Role (Step 2)");
      if (!formData.timeframe) missingFields.push("Timeframe (Step 3)");
      if (!formData.hours_per_week)
        missingFields.push("Hours per Week (Step 4)");
      if (!formData.learning_style)
        missingFields.push("Learning Style (Step 5)");
      if (!formData.learning_speed)
        missingFields.push("Learning Speed (Step 6)");
      if (!formData.skill_level) missingFields.push("Skill Level (Step 7)");

      if (missingFields.length > 0) {
        alert(
          `Please complete the following steps:\n\n${missingFields.join("\n")}`
        );
        return;
      }

      finishBtn.textContent = "Generating...";
      finishBtn.disabled = true;

      try {
        const roadmapRequest = {
          goal: formData.target_role,
          target_role: formData.target_role,
          timeframe: formData.timeframe,
          hours_per_week: formData.hours_per_week,
          learning_style: formData.learning_style,
          learning_speed: formData.learning_speed,
          skill_level: formData.skill_level,
        };

        const response = await fetch(
          "https://navipro-backend.onrender.com/api/generate_roadmap",
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(roadmapRequest),
          }
        );

        if (response.status === 401) {
          // Auth failed — token missing/expired. Force user to login.
          alert("Your session has expired. Please log in again.");
          if (auth && typeof auth.logout === "function") auth.logout();
          window.location.href = "../login/index.html";
          return;
        }

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (data.success) {
          localStorage.setItem("roadmapData", JSON.stringify(data.roadmap));
          localStorage.setItem(
            "userId",
            data.user_id || data.userId || data.user
          ); // save whatever backend returned
          localStorage.setItem("newRoadmapGenerated", "true");

          window.location.href = "../Dashboard/index.html";
        } else {
          throw new Error(data.message || "Failed to generate roadmap");
        }
      } catch (error) {
        console.error("Error generating roadmap:", error);
        alert("Failed to generate roadmap. Please try again.");
        finishBtn.textContent = "Generate roadmap";
        finishBtn.disabled = false;
      }
    });
  }

  async function handleOnboardingComplete(roadmapData) {
    localStorage.setItem("roadmapData", JSON.stringify(roadmapData));
    localStorage.setItem("newRoadmapGenerated", "true");
    window.location.href = "../Dashboard/index.html";
  }
});
