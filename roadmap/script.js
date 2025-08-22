document.addEventListener("DOMContentLoaded", async function () {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    // No user, redirect back to onboarding
    window.location.href = "../index.html";
    return;
  }

  try {
    // First, try to get the user's existing roadmap from the backend
    const roadmapResponse = await fetch(
      `https://naviprobackend.onrender.com/api/user_roadmap/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (roadmapResponse.ok) {
      // User has an existing roadmap, use it
      const roadmapData = await roadmapResponse.json();
      updateRoadmapDisplay(roadmapData);
      setupProgressTracking(userId);
    } else if (roadmapResponse.status === 404) {
      // No existing roadmap, generate a new one
      await generateNewRoadmap(userId);
    } else {
      throw new Error(`Backend error: ${roadmapResponse.status}`);
    }
  } catch (err) {
    console.error("Failed to fetch roadmap:", err);
    alert("Could not load roadmap. Please try again later.");
  }
});

async function generateNewRoadmap(userId) {
  try {
    // Get user preferences from localStorage (set during onboarding)
    const userPreferences = JSON.parse(
      localStorage.getItem("userPreferences") || "{}"
    );

    // Call your Render backend with proper data structure
    const response = await fetch(
      "https://naviprobackend.onrender.com/api/generate_roadmap",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: userPreferences.goal || "Learn full-stack development",
          target_role: userPreferences.targetRole || "",
          timeframe: userPreferences.timeframe || "6_months",
          hours_per_week: userPreferences.hoursPerWeek || "10",
          learning_style: userPreferences.learningStyle || "visual",
          learning_speed: userPreferences.learningSpeed || "average",
          skill_level: userPreferences.skillLevel || "beginner",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Roadmap generation failed");
    }

    // Store the new user ID if this is a new user
    if (result.user_id && result.user_id !== userId) {
      localStorage.setItem("userId", result.user_id);
      userId = result.user_id;
    }

    const roadmapData = result.roadmap;

    // Update UI with the new roadmap
    updateRoadmapDisplay(roadmapData);
    setupProgressTracking(userId);
  } catch (err) {
    console.error("Failed to generate roadmap:", err);
    alert("Could not generate roadmap. Please try again later.");
  }
}

function updateRoadmapDisplay(roadmapData) {
  // Update header information
  updateHeaderInfo(roadmapData);

  // Update progress section
  updateProgressSection(roadmapData);

  // Generate roadmap content
  generateRoadmapContent(roadmapData);

  // Update footer
  updateFooter(roadmapData);

  // Update progress bar
  updateProgressBar(roadmapData);
}

function updateProgressSection(roadmapData) {
  // Update goal with the actual goal from backend
  const goalElement = document.querySelector(".progress-info h1");
  if (goalElement) {
    goalElement.textContent = `Goal: ${
      roadmapData.goal || "Career Development"
    }`;
  }

  // Update progress info with proper month counting
  const progressInfo = document.querySelector(".progress-info p");
  if (progressInfo) {
    const progress = roadmapData.progress || {};
    const currentMonth = progress.current_month || 1;
    const totalMonths = roadmapData.roadmap ? roadmapData.roadmap.length : 0;
    progressInfo.textContent = `Month ${currentMonth} of ${totalMonths} • Keep going`;
  }

  // Update progress percentage
  const progressPercentage = document.querySelector(".progress-percentage p");
  if (progressPercentage) {
    const progress = roadmapData.progress || {};
    const totalTasks = calculateTotalTasks(roadmapData);
    const completedTasks = progress.total_tasks_completed || 0;
    const percentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    progressPercentage.textContent = `${percentage}%`;
  }
}

function updateHeaderInfo(roadmapData) {
  // Update title with target role from backend
  const title = document.querySelector(".title");
  if (title) {
    title.textContent = `Your ${roadmapData.target_role || "Career"} Path`;
  }

  // Update timeline
  const timeline = document.querySelector(".period");
  if (timeline) {
    const timeframeMap = {
      "3_months": "3 Months",
      "6_months": "6 Months",
      "1_year": "1 Year",
      not_sure: "3 Months",
    };
    timeline.textContent = timeframeMap[roadmapData.timeframe] || "3 Months";
  }
}

function updateProgressBar(roadmapData) {
  const progress = roadmapData.progress || {};
  const totalTasks = calculateTotalTasks(roadmapData);
  const completedTasks = progress.total_tasks_completed || 0;
  const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const progressBar = document.getElementById("filling");
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
}

function generateRoadmapContent(roadmapData) {
  const roadmapContainer = document.querySelector(".monthly-roadmap");
  if (!roadmapContainer) return;

  // Clear existing content
  roadmapContainer.innerHTML = "";

  // Generate content for each month
  if (roadmapData.roadmap && roadmapData.roadmap.length > 0) {
    roadmapData.roadmap.forEach((month, monthIndex) => {
      // Create month header
      const monthElement = createMonthElement(month, monthIndex + 1);
      roadmapContainer.appendChild(monthElement);

      // Generate weeks for this month
      if (month.weeks && month.weeks.length > 0) {
        month.weeks.forEach((week, weekIndex) => {
          const weekElement = createWeekElement(
            week,
            monthIndex + 1,
            weekIndex + 1
          );
          roadmapContainer.appendChild(weekElement);
        });
      }
    });
  } else {
    roadmapContainer.innerHTML =
      "<p>No roadmap data available. Please try again later.</p>";
  }
}

function createMonthElement(month, monthNumber) {
  const monthDiv = document.createElement("div");
  monthDiv.className = "month";

  monthDiv.innerHTML = `
        <div class="spot">${monthNumber}</div>
        <span class="month-info"> 
            <h1>Month ${monthNumber}</h1>
            <p>${month.month_title || month.focus || "Skills Building"}</p>
        </span>
    `;

  return monthDiv;
}

function createWeekElement(week, monthNumber, weekNumber) {
  const weekDiv = document.createElement("div");
  weekDiv.className = weekNumber % 2 === 1 ? "week-right" : "week-left";

  // Determine if this is an odd or even week for layout
  const isOddWeek = weekNumber % 2 === 1;

  if (isOddWeek) {
    weekDiv.innerHTML = `
            <div class="week-content">
                <h3><span class="week-number">${
                  week.week_number || weekNumber
                }</span> Week ${week.week_number || weekNumber}</h3>
                <p class="week-focus">${week.focus || "Weekly Focus"}</p>
                <ul>
                    ${(week.daily_tasks || [])
                      .map(
                        (task) =>
                          `<li data-task-id="${task.task_id || ""}">${
                            task.title || "Task"
                          }</li>`
                      )
                      .join("")}
                </ul>
            </div>
            <div class="number">
                <span class="number">
                    <img width="45" src="Images/number${
                      weekNumber % 4 === 1
                        ? "one"
                        : weekNumber % 4 === 2
                        ? "two"
                        : weekNumber % 4 === 3
                        ? "three"
                        : "four"
                    }.png" alt="">
                </span>
            </div>
            <div class="week-icon">
                <img width="300" src="Images/${getWeekIcon(
                  weekNumber
                )}.png" alt="">
            </div>
        `;
  } else {
    weekDiv.innerHTML = `
            <div class="week-icon2">
                <img width="300" src="Images/${getWeekIcon(
                  weekNumber
                )}.png" alt="">
            </div>
            <div class="number2">
                <span class="number">
                    <img width="45" src="Images/number${
                      weekNumber % 4 === 1
                        ? "one"
                        : weekNumber % 4 === 2
                        ? "two"
                        : weekNumber % 4 === 3
                        ? "three"
                        : "four"
                    }.png" alt="">
                </span>
            </div>
            <div class="week-content2">
                <h3><span class="week-number">${
                  week.week_number || weekNumber
                }</span> Week ${week.week_number || weekNumber}</h3>
                <p class="week-focus">${week.focus || "Weekly Focus"}</p>
                <ul>
                    ${(week.daily_tasks || [])
                      .map(
                        (task) =>
                          `<li data-task-id="${task.task_id || ""}">${
                            task.title || "Task"
                          }</li>`
                      )
                      .join("")}
                </ul>
            </div>
        `;
  }

  return weekDiv;
}

function getWeekIcon(weekNumber) {
  const icons = [
    "Hourglass",
    "paintpalette",
    "Laptop (1)",
    "zip",
    "presentation",
    "clipboard",
    "refresh",
    "target",
    "balance",
    "padlock",
    "rocket",
    "Calendar (1)",
  ];

  return icons[(weekNumber - 1) % icons.length] || "Hourglass";
}

function updateFooter(roadmapData) {
  const footer = document.querySelector(".footer h3");
  if (footer) {
    footer.innerHTML = `<span><img src="Images/Vector (1).png" alt=""></span> Roadmap Progress`;
  }

  const footerText = document.querySelector(".footer p");
  if (footerText) {
    // Use goal instead of target_role for more accuracy
    footerText.innerHTML = `Working towards your goal:<br> <b>${
      roadmapData.goal || "Career Development"
    }</b>`;
  }
}

function calculateTotalTasks(roadmapData) {
  let total = 0;
  if (roadmapData.roadmap) {
    roadmapData.roadmap.forEach((month) => {
      if (month.weeks) {
        month.weeks.forEach((week) => {
          total += (week.daily_tasks || []).length;
        });
      }
    });
  }
  return total;
}

function setupProgressTracking(userId) {
  // Remove existing listeners to avoid duplicates
  document
    .querySelectorAll(".week-content li, .week-content2 li")
    .forEach((li) => {
      li.replaceWith(li.cloneNode(true));
    });

  // Add click handlers for task completion
  const taskItems = document.querySelectorAll(
    ".week-content li, .week-content2 li"
  );

  taskItems.forEach((taskItem) => {
    taskItem.addEventListener("click", async function () {
      if (this.classList.contains("completed")) return;

      const taskId = this.getAttribute("data-task-id");
      if (!taskId) {
        console.error("No task ID found for this task");
        return;
      }

      // Optional: confirm the user only clicks the current task,
      // or let server accept any task_id (we updated backend for that).
      try {
        const response = await fetch(
          `https://naviprobackend.onrender.com/api/complete_task/${encodeURIComponent(
            userId
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              task_id: taskId,
              task_completed: true,
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();

          if (result.status === "success") {
            // If backend returned a fresh roadmap snapshot, re-render fully
            if (result.roadmap) {
              // Rebuild whole roadmap using server snapshot
              generateRoadmapContent(result.roadmap);
              updateProgressSection(result.roadmap);
              updateProgressBar(result.roadmap);

              // Rebind listeners to the newly created DOM nodes
              setupProgressTracking(userId);
            } else {
              // Fallback: mark clicked item visually and refresh progress
              this.classList.add("completed");
              this.style.textDecoration = "line-through";
              this.style.opacity = "0.6";

              // Refresh partial data
              refreshRoadmapData(userId);
            }

            // Show completion message
            showCompletionMessage(result.message || "Task completed!");
          } else {
            console.error("Unexpected response structure", result);
          }
        } else {
          console.error("Server responded with error:", response.status);
          const text = await response.text();
          console.error("Server message:", text);
        }
      } catch (error) {
        console.error("Error completing task:", error);
      }
    });
  });
}


async function refreshRoadmapData(userId) {
  try {
    const response = await fetch(
      `https://naviprobackend.onrender.com/api/user_roadmap/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const roadmapData = await response.json();
      updateProgressSection(roadmapData);
      updateProgressBar(roadmapData);
    }
  } catch (error) {
    console.error("Error refreshing roadmap data:", error);
  }
}

function updateProgressDisplay(result) {
  // Update progress percentage
  const progressPercentage = document.querySelector(".progress-percentage p");
  if (progressPercentage) {
    progressPercentage.textContent = `${result.total_completed || 0}%`;
  }

  // Update progress bar
  const progressBar = document.getElementById("filling");
  if (progressBar) {
    progressBar.style.width = `${result.total_completed || 0}%`;
  }

  // Update progress info text
  const progressInfo = document.querySelector(".progress-info p");
  if (progressInfo && result.progress) {
    progressInfo.textContent = `Month ${
      result.progress.current_month || 1
    } of ${result.total_months || 0} • Keep going`;
  }
}

function showCompletionMessage(message) {
  // Create a temporary notification
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Add some CSS for completed tasks
const style = document.createElement("style");
style.textContent = `
    .week-content li.completed,
    .week-content2 li.completed {
        text-decoration: line-through;
        opacity: 0.6;
        cursor: pointer;
    }
    
    .week-content li,
    .week-content2 li {
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .week-content li:hover,
    .week-content2 li:hover {
        background-color: rgba(255, 158, 0, 0.1);
        padding-left: 10px;
    }
`;
document.head.appendChild(style);
