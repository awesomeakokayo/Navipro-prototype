      document.addEventListener("DOMContentLoaded", async function () {
          const userId = localStorage.getItem("userId");

          if (!userId) {
              window.location.href = "../index.html";
              return;
          }

          try {
              // In a real scenario, this would fetch from your backend
              const roadmapData = await fetchRoadmapData(userId);
              updateRoadmapDisplay(roadmapData);
              setupProgressTracking(userId, roadmapData);
              
              // Also update dashboard
              updateDashboard(roadmapData);
          } catch (err) {
              console.error("Failed to load roadmap:", err);
              alert("Could not load roadmap. Please try again later.");
          }
      });

      // Function to fetch roadmap data
      async function fetchRoadmapData(userId) {
          // Get completed tasks from localStorage
          const completedTasks = JSON.parse(localStorage.getItem(`completedTasks_${userId}`) || "[]");
          
          // Return mock data (in a real app, you would fetch from your backend)
          return {
              goal: "Become a Full Stack Developer",
              target_role: "Full Stack Developer",
              timeframe: "6_months",
              progress: {
                  current_month: 1,
                  total_tasks_completed: completedTasks.length,
                  completed_task_ids: completedTasks
              },
              roadmap: [
                  {
                      month_title: "Foundation Building",
                      focus: "HTML, CSS, and JavaScript Basics",
                      weeks: [
                          {
                              week_number: 1,
                              focus: "HTML Fundamentals",
                              daily_tasks: [
                                  { task_id: "task-1-1-1", title: "Learn HTML structure and semantics" },
                                  { task_id: "task-1-1-2", title: "Practice creating basic pages" },
                                  { task_id: "task-1-1-3", title: "Build a simple portfolio page" }
                              ]
                          },
                          {
                              week_number: 2,
                              focus: "CSS Styling",
                              daily_tasks: [
                                  { task_id: "task-1-2-1", title: "Learn CSS selectors and properties" },
                                  { task_id: "task-1-2-2", title: "Practice responsive design" },
                                  { task_id: "task-1-2-3", title: "Style your portfolio page" }
                              ]
                          },
                          {
                              week_number: 3,
                              focus: "JavaScript Basics",
                              daily_tasks: [
                                  { task_id: "task-1-3-1", title: "Learn JavaScript syntax" },
                                  { task_id: "task-1-3-2", title: "Practice DOM manipulation" },
                                  { task_id: "task-1-3-3", title: "Add interactivity to your portfolio" }
                              ]
                          },
                          {
                              week_number: 4,
                              focus: "Project Week",
                              daily_tasks: [
                                  { task_id: "task-1-4-1", title: "Plan a personal website" },
                                  { task_id: "task-1-4-2", title: "Implement the website design" },
                                  { task_id: "task-1-4-3", title: "Add JavaScript functionality" },
                                  { task_id: "task-1-4-4", title: "Test and deploy your website" }
                              ]
                          }
                      ]
                  }
              ]
          };
      }

      function updateRoadmapDisplay(roadmapData) {
          updateHeaderInfo(roadmapData);
          updateProgressSection(roadmapData);
          generateRoadmapContent(roadmapData);
          updateFooter(roadmapData);
          updateProgressBar(roadmapData);
      }

      function updateDashboard(roadmapData) {
          const dashboardContainer = document.querySelector(".dashboard-tasks");
          if (!dashboardContainer) return;
          
          // Get completed tasks from localStorage
          const userId = localStorage.getItem("userId");
          const completedTasks = JSON.parse(localStorage.getItem(`completedTasks_${userId}`) || "[]");
          
          // Clear existing content
          dashboardContainer.innerHTML = "";
          
          // Generate dashboard tasks
          if (roadmapData.roadmap && roadmapData.roadmap.length > 0) {
              roadmapData.roadmap.forEach((month, monthIndex) => {
                  if (month.weeks && month.weeks.length > 0) {
                      month.weeks.forEach((week, weekIndex) => {
                          const weekElement = createDashboardWeekElement(week, monthIndex + 1, weekIndex + 1, completedTasks);
                          dashboardContainer.appendChild(weekElement);
                      });
                  }
              });
          } else {
              dashboardContainer.innerHTML = "<p>No tasks available. Please try again later.</p>";
          }
          
          // Setup dashboard task tracking
          setupDashboardProgressTracking(userId);
      }

      function createDashboardWeekElement(week, monthNumber, weekNumber, completedTasks = []) {
          const weekDiv = document.createElement("div");
          weekDiv.className = "task-card";
          
          weekDiv.innerHTML = `
              <h3>Month ${monthNumber}, Week ${weekNumber}</h3>
              <p>${week.focus || "Weekly Focus"}</p>
              <ul>
                  ${(week.daily_tasks || [])
                      .map(
                          (task) => {
                              const isCompleted = completedTasks.includes(task.task_id);
                              return `<li data-task-id="${task.task_id || ""}" class="${isCompleted ? 'completed' : ''}">${task.title || "Task"}</li>`;
                          }
                      )
                      .join("")}
              </ul>
          `;
          
          return weekDiv;
      }

      function updateProgressSection(roadmapData) {
          const goalElement = document.querySelector(".progress-info h1");
          if (goalElement) {
              goalElement.textContent = `Goal: ${roadmapData.goal || "Career Development"}`;
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
              const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
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
              timeline.textContent = timeframeMap[roadmapData.timeframe] || "6 Months";
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
                          const weekElement = createWeekElement(week, monthIndex + 1, weekIndex + 1, completedTaskIds);
                          roadmapContainer.appendChild(weekElement);
                      });
                  }
              });
          } else {
              roadmapContainer.innerHTML = "<p>No roadmap data available. Please try again later.</p>";
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

      function createWeekElement(week, monthNumber, weekNumber, completedTaskIds = []) {
          const weekDiv = document.createElement("div");
          weekDiv.className = weekNumber % 2 === 1 ? "week-right" : "week-left";

          const isOddWeek = weekNumber % 2 === 1;

          if (isOddWeek) {
              weekDiv.innerHTML = `
                  <div class="week-right">
                      <div class="week-content">
                          <h3><span class="week-number">${week.week_number || weekNumber}</span> Week ${week.week_number || weekNumber}</h3>
                          <p class="week-focus">${week.focus || "Weekly Focus"}</p>
                          <ul>
                              ${(week.daily_tasks || [])
                                  .map(
                                      (task) => {
                                          const isCompleted = completedTaskIds.includes(task.task_id);
                                          return `<li data-task-id="${task.task_id || ""}" class="${isCompleted ? 'completed' : ''}">${task.title || "Task"}</li>`;
                                      }
                                  )
                                  .join("")}
                          </ul>
                      </div>
                      <div class="number">
                          <span class="number">
                              <img width="45" src="Images/number${weekNumber % 4 === 1 ? 'one' : weekNumber % 4 === 2 ? 'two' : weekNumber % 4 === 3 ? 'three' : 'four'}.png" alt="">
                          </span>
                      </div>
                      <div class="week-icon">
                          <img width="300" src="Images/${getWeekIcon(weekNumber)}.png" alt="">
                      </div>
                  </div>
              `;
          } else {
              weekDiv.innerHTML = `
                  <div class="week-right">
                      <div class="week-icon2">
                          <img width="300" src="Images/${getWeekIcon(weekNumber)}.png" alt="">
                      </div>
                      <div class="number2">
                          <span class="number">
                              <img width="45" src="Images/number${weekNumber % 4 === 1 ? 'one' : weekNumber % 4 === 2 ? 'two' : weekNumber % 4 === 3 ? 'three' : 'four'}.png" alt="">
                          </span>
                      </div>
                      <div class="week-content2">
                          <h3><span class="week-number">${week.week_number || weekNumber}</span> Week ${week.week_number || weekNumber}</h3>
                          <p class="week-focus">${week.focus || "Weekly Focus"}</p>
                          <ul>
                              ${(week.daily_tasks || [])
                                  .map(
                                      (task) => {
                                          const isCompleted = completedTaskIds.includes(task.task_id);
                                          return `<li data-task-id="${task.task_id || ""}" class="${isCompleted ? 'completed' : ''}">${task.title || "Task"}</li>`;
                                      }
                                  )
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
              footerText.innerHTML = `Working towards your goal:<br> <b>${roadmapData.goal || "Career Development"}</b>`;
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

      function setupProgressTracking(userId, roadmapData) {
          const taskItems = document.querySelectorAll(".week-content li, .week-content2 li");

          taskItems.forEach((taskItem) => {
              taskItem.addEventListener("click", async function () {
                  const taskId = this.getAttribute("data-task-id");
                  if (!taskId) {
                      console.error("No task ID found for this task");
                      return;
                  }

                  // Check if already completed to prevent double counting
                  const alreadyCompleted = this.classList.contains("completed");
                  
                  try {
                      // In a real scenario, this would call your backend
                      const result = await completeTask(userId, taskId, !alreadyCompleted);
                      
                      if (result.status === "success") {
                          // Update UI based on completion status
                          if (!alreadyCompleted) {
                              this.classList.add("completed");
                              showCompletionMessage("Task completed! Great job!");
                              
                              // Update dashboard as well
                              updateDashboardAfterTaskCompletion(taskId, true);
                          } else {
                              this.classList.remove("completed");
                              
                              // Update dashboard as well
                              updateDashboardAfterTaskCompletion(taskId, false);
                          }
                          
                          // Update progress display
                          updateProgressDisplay(result, roadmapData);
                      }
                  } catch (error) {
                      console.error("Error completing task:", error);
                  }
              });
          });
      }

      function setupDashboardProgressTracking(userId) {
          const taskItems = document.querySelectorAll(".task-card li");

          taskItems.forEach((taskItem) => {
              taskItem.addEventListener("click", async function () {
                  const taskId = this.getAttribute("data-task-id");
                  if (!taskId) {
                      console.error("No task ID found for this task");
                      return;
                  }

                  // Check if already completed to prevent double counting
                  const alreadyCompleted = this.classList.contains("completed");
                  
                  try {
                      // In a real scenario, this would call your backend
                      const result = await completeTask(userId, taskId, !alreadyCompleted);
                      
                      if (result.status === "success") {
                          // Update UI based on completion status
                          if (!alreadyCompleted) {
                              this.classList.add("completed");
                              showCompletionMessage("Task completed! Great job!");
                              
                              // Update roadmap as well
                              updateRoadmapAfterTaskCompletion(taskId, true);
                          } else {
                              this.classList.remove("completed");
                              
                              // Update roadmap as well
                              updateRoadmapAfterTaskCompletion(taskId, false);
                          }
                          
                          // Update progress display
                          updateProgressDisplay(result, await fetchRoadmapData(userId));
                      }
                  } catch (error) {
                      console.error("Error completing task:", error);
                  }
              });
          });
      }

      function updateRoadmapAfterTaskCompletion(taskId, completed) {
          const roadmapTask = document.querySelector(`.week-content li[data-task-id="${taskId}"], .week-content2 li[data-task-id="${taskId}"]`);
          if (roadmapTask) {
              if (completed) {
                  roadmapTask.classList.add("completed");
              } else {
                  roadmapTask.classList.remove("completed");
              }
          }
      }

      function updateDashboardAfterTaskCompletion(taskId, completed) {
          const dashboardTask = document.querySelector(`.task-card li[data-task-id="${taskId}"]`);
          if (dashboardTask) {
              if (completed) {
                  dashboardTask.classList.add("completed");
              } else {
                  dashboardTask.classList.remove("completed");
              }
          }
      }

      // Function to complete a task
      async function completeTask(userId, taskId, complete) {
          // Get current completed tasks from localStorage
          let completedTasks = JSON.parse(localStorage.getItem(`completedTasks_${userId}`) || "[]");
          
          if (complete) {
              // Add task to completed list if not already there
              if (!completedTasks.includes(taskId)) {
                  completedTasks.push(taskId);
              }
          } else {
              // Remove task from completed list
              completedTasks = completedTasks.filter(id => id !== taskId);
          }
          
          // Save updated completed tasks to localStorage
          localStorage.setItem(`completedTasks_${userId}`, JSON.stringify(completedTasks));
          
          // Return response
          return {
              status: "success",
              message: complete ? "Task marked as completed" : "Task marked as incomplete",
              total_completed: completedTasks.length,
              progress: {
                  current_month: 1,
                  total_tasks_completed: completedTasks.length
              }
          };
      }

      function updateProgressDisplay(result, roadmapData) {
          // Update progress percentage
          const progressPercentage = document.querySelector(".progress-percentage p");
          if (progressPercentage) {
              const totalTasks = calculateTotalTasks(roadmapData);
              const completedTasks = result.progress.total_tasks_completed || 0;
              const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
              progressPercentage.textContent = `${percentage}%`;
          }

          // Update progress bar
          const progressBar = document.getElementById("filling");
          if (progressBar) {
              const totalTasks = calculateTotalTasks(roadmapData);
              const completedTasks = result.progress.total_tasks_completed || 0;
              const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
              progressBar.style.width = `${percentage}%`;
          }

          // Update progress info text
          const progressInfo = document.querySelector(".progress-info p");
          if (progressInfo) {
              const progress = roadmapData.progress || {};
              const currentMonth = progress.current_month || 1;
              const totalMonths = roadmapData.roadmap ? roadmapData.roadmap.length : 0;
              progressInfo.textContent = `Month ${currentMonth} of ${totalMonths} • Keep going`;
          }
      }

      function showCompletionMessage(message) {
          const notification = document.createElement("div");
          notification.className = "notification";
          notification.innerHTML = `
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              ${message}
          `;

          document.body.appendChild(notification);

          setTimeout(() => {
              notification.remove();
          }, 3000);
      }