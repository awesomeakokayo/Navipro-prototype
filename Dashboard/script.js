
  // Global variables
  let currentUserId = null;
  let progressChart = null;
  let momentumChart = null;
  
  // Initialize user session
  function initializeUserSession() {
      const userId = localStorage.getItem('userId');
      const roadmapData = localStorage.getItem('roadmapData');
      
      if (!userId || !roadmapData) {
          console.log('No user session found, redirecting to onboarding...');
          window.location.href = '../onboarding/index.html';
          return false;
      }
      
      currentUserId = userId;
      console.log('User session initialized:', currentUserId);
      
      // After roadmap generation, automatically load career path
      if (localStorage.getItem('newRoadmapGenerated') === 'true') {
          console.log('New roadmap detected, loading roadmap...');
          loadSectionContent('roadmap');
          localStorage.removeItem('newRoadmapGenerated'); // Clear the flag

          // Highlight the roadmap nav button
          document.querySelectorAll(".nav-button").forEach((btn, index) => {
              btn.classList.remove("active");
              if (index === 2) { // Roadmap button index
                  btn.classList.add("active");
              }
          });
          return true;
      }
      
      return true;
  }

  // Update welcome message with user's goal
  function updateWelcomeMessage(roadmap) {
      const welcomeElement = document.querySelector('.welcome-user h2');
      if (welcomeElement && roadmap.goal) {
          welcomeElement.textContent = `Stay focused on your core mission - ${roadmap.goal}`;
      }
      
      const nameElement = document.querySelector('.welcome-user .name');
      if (nameElement) {
          nameElement.textContent = `Welcome to your ${roadmap.target_role || 'Career'} Journey`;
      }
  }

  document.addEventListener("DOMContentLoaded", function () {
      // Initialize user session first
      if (!initializeUserSession()) {
          return;
      }
      
      const mainContent = document.getElementById("mainContent");

      // Function to load pages
      function loadPage(url) {
          fetch(url)
            .then((response) => {
              if (!response.ok) throw new Error("Page not found: " + url);
              return response.text();
            })
            .then((htmlText) => {
              // Create a virtual DOM from the loaded HTML
              let parser = new DOMParser();
              let doc = parser.parseFromString(htmlText, "text/html");

              // Find the mainContent in the loaded file
              let newContent = doc.querySelector("#mainContent");

              if (newContent) {
                document.getElementById("mainContent").innerHTML =
                  newContent.innerHTML;
              } else {
                document.getElementById("mainContent").innerHTML =
                  "<p style='color:red;'>No #mainContent found in file.</p>";
              }
            })
            .catch((error) => {
              mainContent.innerHTML = `<p style="color:red;">Error loading page</p>`;
              console.error(error);
            });
      }

      // Content loading system for different sections
      function loadSectionContent(sectionName) {
          const mainContent = document.getElementById("mainContent");
          
          // Show loading indicator
          mainContent.innerHTML = '<div style="text-align: center; padding: 50px;"><h3>Loading...</h3></div>';
          
          // Load content based on section
          switch(sectionName) {
              case 'dashboard':
                  loadDashboardContent();
                  break;
              case 'tasks':
                  loadTasksContent();
                  break;
              case 'roadmap':
                  loadRoadmapContent();
                  break;
              case 'resources':
                  loadResourcesContent();
                  break;
              default:
                  loadDashboardContent();
          }
      }
      
      // Load dashboard content (default view)
      function loadDashboardContent() {
          const mainContent = document.getElementById("mainContent");
          mainContent.innerHTML = `
              <div class="dashboard-layout">
                  <div class="icons">
                      <div class="icons-left">
                          <img width="20" height="20" src="https://img.icons8.com/fluency-systems-regular/48/1A1A1A/dashboard-layout.png" alt="dashboard-layout"/> <span>Dashboard</span>
                      </div>
                      <div class="icons-left"> 
                          <img class="left-icon" width="27" height="27" src="https://img.icons8.com/?size=100&id=59878&format=png&color=1A1A1A" alt="">
                          <img class="left-icon" width="27" height="27" src="https://img.icons8.com/?size=100&id=kGXPXvA8Atz6&format=png&color=737373" alt="notification">
                          <img width="30" height="30" class="profile" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzy13J-IV2y1EcJeCV2lWYml38i4JHyyXQ2g&s" alt="profile">
                      </div>
                  </div>
                  <div class="content">
                      <div class="welcome">
                          <div class="welcome-user">
                              <p class="name">Welcome to your Career Journey</p>
                              <h2>Stay focused on your core mission</h2>
                          </div>
                          <div>
                              <button class="talk-to-navi" onclick="window.location.href='../Navi/index.html'">Talk to Navi</button>
                          </div>
                      </div>
                      <div class="progress-section">
                          <div class="left-progress-section">
                              <div class="tracker-card">
                                  <div class="header"> <span class="label"><img width="30" height="30" src="Images/chart.png" alt="">Momentum tracker</span> <span class="time" >Daily</span></div>
                                  <div class="custom-legend">
                                      <div class="legend-item">
                                          <div class="legend-dot" style="background-color: #264653;"></div>
                                          Completed work
                                      </div>
                                      <div class="legend-item">
                                          <div class="legend-dot" style="background-color: #f4a261;"></div>
                                          Proposed effort
                                      </div>
                                  </div>
                                  <canvas id="momentumChart" width="250" height="150"></canvas>
                                  <div class="navi-box">
                                      <img src="Images/Frame 3.png" class="navi-icon" alt="Navi Icon">
                                      <div class="navi-text"><span>Navi:</span> We planned 5hrs today and only did 3. Shall we try reviewing your task load?</div>
                                  </div>
                              </div>
                              <div id="taskContainer" class="task">
                                  <!-- Task content will be loaded dynamically -->
                              </div>
                              <div id="skill" class="skill">
                                  <div class="skill-header">
                                      <span class="skill-header-left">
                                          <img width="25" height="25" src="Images/fatrows (1).png" alt=""> Skill Momentum
                                      </span>
                                  </div>
                                  <div class="middle">
                                      <p>This weeks skill focus: </p>
                                      <p>  • Wireframing</p>
                                      <p>  • Visual hierarchy</p>
                                      <p>  • Interaction Patterns</p>
                                  </div>
                              </div>
                          </div>
                          <div class="right-progress-section">
                              <div class="progress-card">
                                  <div class="title">
                                      <img width="24" height="24" src="Images/chart1.png" />
                                      <span class="title1">Your overall progress</span>
                                  </div>
                                  <div class="progress-section1">
                                      <div class="doughnut">
                                          <canvas id="progressChart" width="200" height="200"></canvas>
                                      </div>
                                      <div class="milestone">
                                          <a href="#" class="milestone-title"><img width="23" height="23" src="Images/next.png" alt="">Next Milestone</a>
                                          <div class="milestone-sub">Design Systems</div>
                                          <a class="advance-button1" href="#"> <button class="advance-button">Advance →</button></a>
                                          <div class="streak">🔥 5 - day streak</div>
                                      </div>
                                  </div>
                                  <div class="summary">
                                      <div class="summary-box">
                                          <img class="second-icon" width="25" height="25" src="https://img.icons8.com/?size=100&id=11751&format=png&color=FFFFFF" alt="">
                                          <h3 class="completed-tasks">8</h3>
                                          <p>Completed</p>
                                      </div>
                                      <div class="summary-box1">
                                          <img class="middle-icon" height="25" width="25" src="https://img.icons8.com/?size=100&id=82767&format=png&color=FFFFFF" alt="">
                                          <h3 class="in-progress-tasks">12</h3>
                                          <p>In progress</p>
                                      </div>
                                      <div class="summary-box">
                                          <img class="last-icon" width="27" height="27" src="https://img.icons8.com/?size=100&id=59878&format=png&color=FFFFFF" alt="">
                                          <h3 class="upcoming-tasks">20</h3>
                                          <p>Upcoming</p>
                                      </div>
                                  </div>
                              </div>
                              <div class="video-recommendation">
                                  <div class="video-recommendation-header">
                                      <span class="video-recommendation-left">
                                          <img width="25" height="25" src="https://img.icons8.com/?size=100&id=LVtMPps1ASuP&format=png&color=737373" alt=""> Suggested for you
                                      </span>
                                  </div>
                                  <div id="videoContainer" class="recommendations">
                                      <!-- Video content will be loaded dynamically -->
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          `;
          
          // Initialize dashboard features
          initCharts();
          displayTodaysTask();
          displayWeeklyVideos();
          updateProgressSection();
          displayWeeksFocus();
      }
      
      // Load tasks content
      function loadTasksContent() {
          const mainContent = document.getElementById("mainContent");
          mainContent.innerHTML = `
              <div class="section-header">
                  <h2>My Tasks</h2>
                  <p>Manage and track your learning tasks</p>
              </div>
              <div class="tasks-content">
                  <iframe src="../Task Generator/index.html" width="100%" height="800px" frameborder="0" 
                          onload="console.log('Tasks loaded successfully')" 
                          onerror="handleIframeError('tasks')"></iframe>
                  <div id="tasks-fallback" style="display: none; text-align: center; padding: 50px;">
                      <h3>Tasks Section</h3>
                      <p>Unable to load Task Generator. <a href="../Task Generator/index.html" target="_blank">Open in new tab</a></p>
                  </div>
              </div>
          `;
      }

      async function loadRoadmapContent() {
          const mainContent = document.getElementById("mainContent");
          const userId = localStorage.getItem("userId");
          
          if (!userId) {
              mainContent.innerHTML = `<div class="error">User not found. Please login again.</div>`;
              return;
          }

          try {
              // Fetch roadmap data from backend database
              const response = await fetch(`https://naviprobackend.onrender.com/api/user_roadmap/${userId}`, {
                  method: "GET",
                  headers: {
                      "Content-Type": "application/json",
                  }
              });

              if (!response.ok) {
                  throw new Error(`Failed to fetch roadmap: ${response.status}`);
              }

              const roadmapData = await response.json();
              
              // Display the roadmap using an iframe or direct rendering
              mainContent.innerHTML = `
                      <div class="roadmap-container" style="width: 100%; height: 100vh; overflow-y: auto;">
                          <iframe 
                              src="../roadmap/index.html" 
                              style="width: 100%; height: 100%; border: none;"
                              onload="this.contentWindow.postMessage(${JSON.stringify(roadmapData)}, '*')"
                          ></iframe>
                      </div>
                  `;
          } catch (error) {
              console.error("Error loading roadmap:", error);
              mainContent.innerHTML = `
                  <div class="error">
                      <p>Failed to load roadmap. Please try again.</p>
                      <button onclick="loadRoadmapContent()" class="retry-btn">Retry</button>
                  </div>
              `;
          }
      }
      
      // Load resources content
      function loadResourcesContent() {
          const mainContent = document.getElementById("mainContent");
          mainContent.innerHTML = `
              <div class="section-header">
                  <h2>Learning Resources</h2>
                  <p>Discover courses and materials for your journey</p>
              </div>
              <div class="resources-content">
                  <iframe src="../Course Recommendation/index.html" width="100%" height="800px" frameborder="0"
                          onload="console.log('Resources loaded successfully')" 
                          onerror="console.error('Failed to load resources')"></iframe>
              </div>
          `;
      }
      
      // Assign click events to your nav buttons
      document.querySelectorAll(".nav-button").forEach((btn) => {
          btn.addEventListener("click", (e) => {
              e.preventDefault();
              
              // Get the button's data attribute or text content to determine which section to load
              const section = btn.getAttribute('data-section') || btn.textContent.trim().toLowerCase();
              
              // Remove active class from all buttons
              document.querySelectorAll(".nav-button").forEach(b => b.classList.remove("active"));
              // Add active class to clicked button
              btn.classList.add("active");

              console.log('Loading section:', section);
              
              switch(section) {
                  case 'dashboard':
                      loadSectionContent('dashboard');
                      break;
                  case 'my tasks':
                      loadSectionContent('tasks');
                      break;
                  case 'my career path':
                      loadSectionContent('roadmap');
                      break;
                  case 'resources':
                      loadSectionContent('resources');
                      break;
                  default:
                      console.log('Unknown section:', section);
                      loadSectionContent('dashboard');
              }
          });
      });
      
      // Load dashboard by default
      loadSectionContent('dashboard');
  });

  // USER PROGRESS TRACKING

  /**
   * Get user's overall progress
   */
  async function getUserProgress() {
      if (!currentUserId) {
          console.error("No user ID available");
          return null;
      }

      try {
          const response = await fetch(
              `https://naviprobackend.onrender.com/api/user_progress/${currentUserId}`
          );

          if (response.ok) {
              const progressData = await response.json();
              return progressData;
          } else {
              console.error("Failed to get user progress");
              return null;
          }
      } catch (error) {
          console.error("Error fetching progress:", error);
          return null;
      }
  }

  /**
   * Get user's weekly progress for momentum chart
   */
  async function getWeeklyProgress() {
      if (!currentUserId) {
          console.error("No user ID available");
          return null;
      }

      try {
          const response = await fetch(
              `https://naviprobackend.onrender.com/api/weekly_progress/${currentUserId}`
          );

          if (response.ok) {
              const weeklyData = await response.json();
              return weeklyData;
          } else {
              console.error("Failed to get weekly progress");
              return null;
          }
      } catch (error) {
          console.error("Error fetching weekly progress:", error);
          return null;
      }
  }

  /**
   * Initialize charts with real data
   */
  async function initCharts() {
      console.log("Initializing charts with real data...");

      const progressCanvas = document.getElementById("progressChart");
      const momentumCanvas = document.getElementById("momentumChart");

      if (!progressCanvas || !momentumCanvas) {
          console.error("Canvas elements not found!");
          return;
      }

      // Get real progress data
      const progress = await getUserProgress();
      const weeklyProgress = await getWeeklyProgress();

      // Clean up existing charts
      if (progressChart) progressChart.destroy();
      if (momentumChart) momentumChart.destroy();

      // Initialize progress chart with center text
      if (progress) {
          const totalTasks = progress.total_tasks;
          const completedTasks = progress.completed_tasks;
          const inProgressTasks = Math.min(5, totalTasks - completedTasks);
          const upcomingTasks = totalTasks - completedTasks - inProgressTasks;

          progressChart = new Chart(progressCanvas.getContext("2d"), {
              type: "doughnut",
              data: {
                  datasets: [
                      {
                          data: [completedTasks, inProgressTasks, upcomingTasks],
                          backgroundColor: ["#2ecc71", "#264653", "#b0b0b0"],
                          cutout: "75%",
                          borderWidth: 0,
                      },
                  ],
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      tooltip: { enabled: false },
                      legend: { display: false },
                  },
              },
              plugins: [
                  {
                      id: "centerText",
                      beforeDraw: function (chart) {
                          const width = chart.width;
                          const height = chart.height;
                          const ctx = chart.ctx;

                          ctx.restore();

                          // Calculate percentage
                          const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                          const completed = chart.data.datasets[0].data[0];
                          const percentage = Math.round((completed / total) * 100);

                          // Font size relative to chart size
                          const fontSize = (height / 8).toFixed(2);
                          ctx.font = `bold ${fontSize}px Poppins`;
                          ctx.textBaseline = "middle";
                          ctx.textAlign = "center";

                          // Draw percentage
                          const text = `${percentage}%`;
                          const textX = width / 2;
                          const textY = height / 2;

                          ctx.fillStyle = "#1B455B";
                          ctx.fillText(text, textX, textY);

                          ctx.save();
                      },
                  },
              ],
          });
      }

      // Initialize momentum chart with real data
      if (weeklyProgress) {
          momentumChart = new Chart(momentumCanvas.getContext("2d"), {
              type: "bar",
              data: {
                  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                  datasets: [
                      {
                          label: "Completed work",
                          data: weeklyProgress.completed_hours || [4.5, 6.5, 2.5, 5, 3, 0, 0],
                          backgroundColor: "#264653",
                          stack: "a",
                          barThickness: 30,
                      },
                      {
                          label: "Proposed effort",
                          data: weeklyProgress.planned_hours || [1.5, 2, 1, 2, 2, 7, 6],
                          backgroundColor: "#f4a261",
                          stack: "a",
                          borderRadius: { topLeft: 5, topRight: 5 },
                          barThickness: 30,
                      },
                  ],
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: {
                          display: false,
                      },
                  },
                  scales: {
                      x: {
                          stacked: true,
                          grid: {
                              display: false,
                          },
                          ticks: {
                              font: {
                                  padding: 8,
                                  size: 14,
                                  family: "Poppins",
                              },
                              color: "#666",
                          },
                      },
                      y: {
                          stacked: true,
                          beginAtZero: true,
                          max: 8,
                          ticks: {
                              stepSize: 2,
                              font: {
                                  size: 15,
                                  family: "Poppins",
                              },
                              color: "#666",
                              padding: 10,
                          },
                          grid: {
                              color: "#f0f0f0",
                          },
                      },
                  },
                  layout: {
                      padding: {
                          top: 10,
                          right: 15,
                          bottom: 10,
                          left: 5,
                      },
                  },
                  responsive: true,
                  responsiveAnimationDuration: 0,
              },
          });
      }

      console.log("Charts initialized with real data");
  }

  // DAILY TASK SYSTEM

  /**
   * Get today's task for user
   */
  async function getTodaysTask() {
      if (!currentUserId) {
          console.error("No user ID available");
          return null;
      }

      try {
          const response = await fetch(
              `https://naviprobackend.onrender.com/api/daily_task/${currentUserId}`
          );

          if (response.ok) {
              const taskData = await response.json();
              return taskData;
          } else {
              console.error("Failed to get today's task");
              return null;
          }
      } catch (error) {
          console.error("Error fetching task:", error);
          return null;
      }
  }

  // Display week's focus
  async function displayWeeksFocus() {
    const focus = await getTodaysTask();

    if (!focus) {
      document.getElementById("skill").innerHTML = `
      <div class="skill-header">
          <span class="skill-header-left">
              <img width="25" height="25" src="Images/fatrows (1).png" alt=""> Skill Momentum
          </span>
      </div>
      <div class="middle">
          <p>This weeks skill focus: </p>
          <p>  None Available</p>
      </div>
      `; return
    }

    document.getElementById("skill").innerHTML = `
      <div class="skill-header">
          <span class="skill-header-left">
              <img width="25" height="25" src="Images/fatrows (1).png" alt=""> Skill Momentum
          </span>
      </div>
      <div class="middle">
          <p>This weeks skill focus: </p>
          <p>  • ${focus.week_focus}</p>
      </div>
      `;
    }

  /**
   * Display today's task
   */
  async function displayTodaysTask() {
      const task = await getTodaysTask();

      if (!task) {
          document.getElementById("taskContainer").innerHTML = `
              <div class="task-header">
                  <span class="active-task">
                      <img width="25" height="25" src="https://img.icons8.com/?size=100&id=KPXIRLDghgMh&format=png&color=737373" alt="">
                      <span>No Active Tasks</span>
                  </span>
              </div>
              <p style="text-align: center; padding: 20px;">All tasks completed! 🎉</p>
          `;
          return;
      }

      document.getElementById("taskContainer").innerHTML = `
          <div class="task-header">
              <span class="active-task">
                  <img width="25" height="25" src="https://img.icons8.com/?size=100&id=KPXIRLDghgMh&format=png&color=737373" alt="">
                  <span>Active Task</span>
              </span>
              <span>
                  <img width="25" height="25" src="https://img.icons8.com/?size=100&id=16140&format=png&color=737373" alt="">
              </span>
          </div>
          
          <div class="task-list">
              <div class="task-lists">
                  <img class="first-icon" width="25" height="25" src="https://img.icons8.com/?size=100&id=rA9oA5mjJS1I&format=png&color=FFFFFF" alt="">
                  <span>Task: <b>${task.title}</b></span>
              </div>

              <div class="task-lists">
                  <img class="second-icon" width="25" height="25" src="https://img.icons8.com/?size=100&id=11751&format=png&color=FFFFFF" alt="">
                  <span>Goal: ${task.goal}</span>
              </div>
              
              <div class="task-lists1">
                  <div class="task-lists">
                      <img class="third-icon" height="25" width="25" src="https://img.icons8.com/?size=100&id=82767&format=png&color=FFFFFF" alt="">
                      <span>Estimated time: ${task.estimated_time}</span>
                  </div>
                  <div class="task-lists">
                      <button id="completeTaskBtn" onclick="completeTask()" class="done">
                          Done <img style="margin-left: 6px;" width="15" height="15" src="https://img.icons8.com/?size=100&id=15478&format=png&color=40C057" alt="">
                      </button>
                  </div>
              </div>
          </div>

          <div class="task-navi">
              <span class="bottom">
                  <img width="30" height="30" src="Images/Frame 3.png" alt="">
                  <span>
                      <span class="task-navi-ai">Navi:</span> ${task.motivation_message}
                  </span>
              </span>
          </div>
      `;
  }

  /**
   * Mark current task as completed
   */
  async function completeTask() {
      if (!currentUserId) {
          alert("No user session found");
          return;
      }

      try {
          const response = await fetch(
              `https://naviprobackend.onrender.com/api/complete_task/${currentUserId}`,
              {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                      task_completed: true,
                  }),
              }
          );
          
          if (response.ok) {
              const result = await response.json();
              
              // Show success message
              alert(result.message);

              // Refresh the task display to show next task
              await displayTodaysTask();

              await displayWeeksFocus();
              
              // Update progress section
              await updateProgressSection();
              
              // Update charts with real data
              await updateChartsWithRealData();
              
          } else {
              console.error("Failed to complete task");
              alert("Failed to mark task as complete");
          }
      } catch (error) {
          console.error("Error completing task:", error);
      }
  }

  // YOUTUBE VIDEO RECOMMENDATIONS
  /**
   * Get Youtube videos for current week's focus
   */
  async function getWeeklyVideos() {
      if (!currentUserId) {
          console.error("No user ID available");
          return null;
      }

      try {
          const response = await fetch(
              `https://naviprobackend.onrender.com/api/week_videos/${currentUserId}`
          );

          if (response.ok) {
              const videoData = await response.json();
              return videoData;
          } else {
              console.error("Failed to get weekly videos");
              return null;
          }
      } catch (error) {
          console.error("Error fetching videos:", error);
          return null;
      }
  }

  /**
   * Display weekly videos in UI
   */
  async function displayWeeklyVideos() {
      const videoData = await getWeeklyVideos();

      if (!videoData) {
          document.getElementById("videoContainer").innerHTML =
              "<p>No videos available at the moment.</p>";
          return;
      }

      // Function to format video duration
      function formatDuration(duration) {
          const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          if (!match) return duration;

          const hours = parseInt(match[1] || 0);
          const minutes = parseInt(match[2] || 0);
          const seconds = parseInt(match[3] || 0);

          if (hours > 0) {
              return `${hours}h ${minutes}m`;
          } else if (minutes > 0) {
              return `${minutes}m ${seconds}s`;
          } else {
              return `${seconds}s`;
          }
      }

      // Display videos in UI
      document.getElementById("videoContainer").innerHTML = `
          <div class="video-content">
              ${videoData.videos.map(video => `
                  <div style="display: flex; gap: 10px; margin-bottom: 15px; align-items: center;">
                      <a href="${video.url}"><img class="video-cover" width="80" height="50" src="${video.thumbnail}" alt=""></a>
                      <div class="video-about" style="flex: 1;">
                          <a class="video-title" href="${video.url}">${video.title}</a>
                          <div class="video-detail">
                              <span class="video-author">${video.channel} • </span>
                              <span class="video-duration">${formatDuration(video.duration)}</span>
                          </div>
                      </div>
                      <div class="ratings">
                          <span class="star">
                              <img width="15" height="15" src="https://img.icons8.com/?size=100&id=MVWV8hpGIZqp&format=png&color=FD7E14" alt="">
                          </span> 
                          <span class="rating">${video.rating || 3.8}</span>
                      </div>
                  </div>
              `).join('')}
          </div>

          <button onclick="refreshWeeklyVideos()" class="refresh-btn">
              Refresh Videos
          </button>
      `;
  }

  /**
   * Refresh weekly videos (useful if user wants new recommendations)
   */
  async function refreshWeeklyVideos() {
      document.getElementById("videoContainer").innerHTML =
          "<p>Loading fresh video recommendations...</p>";
      await displayWeeklyVideos();
  }

  // Add this function to update the milestone and summary boxes
  async function updateProgressSection() {
      const progress = await getUserProgress();
      if (!progress) {
          console.error("Could not fetch progress data");
          return;
      }

      try {
          // Update completed tasks
          const completedTasksElement = document.querySelector(".completed-tasks");
          if (completedTasksElement) {
              completedTasksElement.textContent = progress.completed_tasks;
          }

          // Calculate and update in-progress tasks
          const inProgressElement = document.querySelector(".in-progress-tasks");
          if (inProgressElement) {
              const weeklyTasks = 5;
              const inProgressTasks = weeklyTasks - (progress.completed_tasks % weeklyTasks);
              inProgressElement.textContent = inProgressTasks;
          }

          // Calculate and update upcoming tasks
          const upcomingElement = document.querySelector(".upcoming-tasks");
          if (upcomingElement) {
              const upcomingTasks = progress.total_tasks - progress.completed_tasks;
              upcomingElement.textContent = upcomingTasks;
          }
      } catch (error) {
          console.error("Error updating progress section:", error);
      }
  }

  // Update charts with real data from backend
  async function updateChartsWithRealData() {
      try {
          const progress = await getUserProgress();
          const weeklyProgress = await getWeeklyProgress();
          
          if (!progress) return;

          // Update progress chart with real data
          if (progressChart) {
              const totalTasks = progress.total_tasks;
              const completedTasks = progress.completed_tasks;
              const inProgressTasks = Math.min(5, totalTasks - completedTasks);
              const upcomingTasks = totalTasks - completedTasks - inProgressTasks;

              progressChart.data.datasets[0].data = [completedTasks, inProgressTasks, upcomingTasks];
              progressChart.update();
          }

          // Update momentum chart with weekly progress
          if (momentumChart && weeklyProgress) {
              momentumChart.data.datasets[0].data = weeklyProgress.completed_hours || [4.5, 6.5, 2.5, 5, 3, 0, 0];
              momentumChart.data.datasets[1].data = weeklyProgress.planned_hours || [1.5, 2, 1, 2, 2, 7, 6];
              momentumChart.update();
          }

      } catch (error) {
          console.error("Error updating charts with real data:", error);
      }
  }

  // Initialize dashboard when DOM is loaded
  window.addEventListener("DOMContentLoaded", async () => {
      try {
          // Initialize charts with real data
          await initCharts();
          
          // Load user data
          await displayTodaysTask();
          await displayWeeksFocus();
          await updateProgressSection();
          await displayWeeklyVideos();
          
      } catch (error) {
          console.error("Error initializing dashboard:", error);
      }
  });

  // Handle iframe loading errors
  function handleIframeError(section) {
      console.error(`Failed to load ${section} iframe`);
      const fallbackElement = document.getElementById(`${section}-fallback`);
      if (fallbackElement) {
          fallbackElement.style.display = 'block';
      }
  }

  // Mobile menu toggle
  document.addEventListener("DOMContentLoaded", function () {
      const menuToggle = document.getElementById("menuToggle");
      const navigation = document.getElementById("navigation");

      if (menuToggle) {
          menuToggle.addEventListener("click", function () {
              navigation.classList.toggle("active");
              menuToggle.classList.toggle("active");
          });
      }

      // Close menu when clicking outside
      document.addEventListener("click", function (e) {
          if (!navigation.contains(e.target) && !menuToggle.contains(e.target)) {
              navigation.classList.remove("active");
              menuToggle.classList.remove("active");
          }
      });
  });