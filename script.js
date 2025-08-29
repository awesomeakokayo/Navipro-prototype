// Backend URL configuration
const APP_BACKEND_URL = 'https://backend-b7ak.onrender.com'; // Your Python backend

// Utility function for authenticated requests to Python backend
async function authenticatedFetch(endpoint, options = {}) {
  const token = localStorage.getItem('jwtToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${APP_BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    // Token might be expired or invalid
    localStorage.removeItem('jwtToken');
    window.location.href = '../Login/index.html';
    throw new Error('Authentication failed');
  }
  
  return response;
}

document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("jwtToken");

  if (!token) {
    window.location.href = "../Login/index.html";
    return;
  }

  try {
    const roadmapResponse = await authenticatedFetch('/api/user_roadmap', {
      method: "GET"
    });

    if (roadmapResponse.ok) {
      const roadmapData = await roadmapResponse.json();
      updateRoadmapDisplay(roadmapData);
      setupProgressTracking();
    } else if (roadmapResponse.status === 404) {
      await generateNewRoadmap();
    } else {
      throw new Error(`Backend error: ${roadmapResponse.status}`);
    }
  } catch (err) {
    console.error("Failed to fetch roadmap:", err);
    alert("Could not load roadmap. Please try again later.");
  }
});

async function generateNewRoadmap() {
  try {
    const userPreferences = JSON.parse(
      localStorage.getItem("userPreferences") || "{}"
    );

    const response = await authenticatedFetch('/api/generate_roadmap', {
      method: "POST",
      body: JSON.stringify({
        goal: userPreferences.goal || "Learn full-stack development",
        target_role: userPreferences.targetRole || "",
        timeframe: userPreferences.timeframe || "6_months",
        hours_per_week: userPreferences.hoursPerWeek || "10",
        learning_style: userPreferences.learningStyle || "visual",
        learning_speed: userPreferences.learningSpeed || "average",
        skill_level: userPreferences.skillLevel || "beginner",
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Roadmap generation failed");
    }

    const roadmapData = result.roadmap;
    updateRoadmapDisplay(roadmapData);
    setupProgressTracking();
  } catch (err) {
    console.error("Failed to generate roadmap:", err);
    alert("Could not generate roadmap. Please try again later.");
  }
}

function updateRoadmapDisplay(roadmapData) {
  updateHeaderInfo(roadmapData);
  updateProgressSection(roadmapData);
  generateRoadmapContent(roadmapData);
  updateFooter(roadmapData);
  updateProgressBar(roadmapData);
}

function updateProgressSection(roadmapData) {
  const goalElement = document.querySelector(".progress-info h1");
  if (goalElement) {
    goalElement.textContent = `Goal: ${
      roadmapData.goal || "Career Development"
    }`;
  }

  const progressInfo = document.querySelector(".progress-info p");
  if (progressInfo) {
    const progress = roadmapData.progress || {};
    const currentMonth = progress.current_month || 1;
    const totalMonths = roadmapData.roadmap ? roadmapData.roadmap.length : 0;
    progressInfo.textContent = `Month ${currentMonth} of ${totalMonths} • Keep going`;
  }

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
  const title = document.querySelector(".title");
  if (title) {
    title.textContent = `Your ${roadmapData.target_role || "Career"} Path`;
  }

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

  roadmapContainer.innerHTML = "";

  if (roadmapData.roadmap && roadmapData.roadmap.length > 0) {
    // Get completed task IDs from progress data
    const completedTaskIds = roadmapData.progress?.completed_task_ids || [];

    roadmapData.roadmap.forEach((month, monthIndex) => {
      const monthElement = createMonthElement(month, monthIndex + 1);
      roadmapContainer.appendChild(monthElement);

      if (month.weeks && month.weeks.length > 0) {
        month.weeks.forEach((week, weekIndex) => {
          const weekElement = createWeekElement(
            week,
            monthIndex + 1,
            weekIndex + 1,
            completedTaskIds
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

function createWeekElement(
  week,
  monthNumber,
  weekNumber,
  completedTaskIds = []
) {
  const weekDiv = document.createElement("div");
  weekDiv.className = weekNumber % 2 === 1 ? "week-right" : "week-left";

  const isOddWeek = weekNumber % 2 === 1;

  if (isOddWeek) {
    weekDiv.innerHTML = `
          <div class="week-right">
            <div class="week-content">
                <h3><span class="week-number">${
                  week.week_number || weekNumber
                }</span> Week ${week.week_number || weekNumber}</h3>
                <p class="week-focus">${week.focus || "Weekly Focus"}</p>
                <ul>
                    ${(week.daily_tasks || [])
                      .map((task) => {
                        const isCompleted = completedTaskIds.includes(
                          task.task_id
                        );
                        return `<li data-task-id="${
                          task.task_id || ""
                        }" class="${isCompleted ? "completed" : ""}">${
                          task.title || "Task"
                        }</li>`;
                      })
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
          </div>
        `;
  } else {
    weekDiv.innerHTML = `
          <div class="week-right">
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
                      .map((task) => {
                        const isCompleted = completedTaskIds.includes(
                          task.task_id
                        );
                        return `<li data-task-id="${
                          task.task_id || ""
                        }" class="${isCompleted ? "completed" : ""}">${
                          task.title || "Task"
                        }</li>`;
                      })
                      .join("")}
                </ul>
            </div>
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

function setupProgressTracking() {
  const taskItems = document.querySelectorAll(
    ".week-content li, .week-content2 li"
  );

  taskItems.forEach((taskItem) => {
    taskItem.addEventListener("click", async function () {
      const taskId = this.getAttribute("data-task-id");
      if (!taskId) {
        console.error("No task ID found for this task");
        return;
      }

      try {
        const response = await authenticatedFetch('/api/complete_task', {
          method: "POST",
          body: JSON.stringify({
            task_id: taskId,
            task_completed: true,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === "success") {
            // Mark task as completed
            this.classList.add("completed");

            // Update progress display
            updateProgressDisplay(result);

            // Show completion message
            showCompletionMessage(result.message);

            // Refresh the roadmap data from the backend to ensure UI is in sync
            refreshRoadmapData();
          }
        } else {
          console.error("Server responded with error:", response.status);
        }
      } catch (error) {
        console.error("Error completing task:", error);
      }
    });
  });
}

async function refreshRoadmapData() {
  try {
    const response = await authenticatedFetch('/api/user_roadmap', {
      method: "GET"
    });

    if (response.ok) {
      const roadmapData = await response.json();
      updateProgressSection(roadmapData);
      updateProgressBar(roadmapData);

      // Update task completion status without refreshing the whole page
      const completedTaskIds = roadmapData.progress?.completed_task_ids || [];
      document
        .querySelectorAll(".week-content li, .week-content2 li")
        .forEach((li) => {
          const taskId = li.getAttribute("data-task-id");
          if (completedTaskIds.includes(taskId)) {
            li.classList.add("completed");
          } else {
            li.classList.remove("completed");
          }
        });
    }
  } catch (error) {
    console.error("Error refreshing roadmap data:", error);
  }
}

function updateProgressDisplay(result) {
  const progressPercentage = document.querySelector(".progress-percentage p");
  if (progressPercentage) {
    progressPercentage.textContent = `${result.total_completed || 0}%`;
  }

  const progressBar = document.getElementById("filling");
  if (progressBar) {
    progressBar.style.width = `${result.total_completed || 0}%`;
  }

  const progressInfo = document.querySelector(".progress-info p");
  if (progressInfo && result.progress) {
    progressInfo.textContent = `Month ${
      result.progress.current_month || 1
    } of ${result.total_months || 0} • Keep going`;
  }
}

function showCompletionMessage(message) {
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

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Add CSS for completed tasks
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
