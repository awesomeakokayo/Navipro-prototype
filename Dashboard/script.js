function loadPage(page) {
  document.getElementById("mainFrame").src = page;
}

// Global user ID management
let currentUserId = null;

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
                            <div class="skill">
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

// Add this to your roadmap page (../roadmap/index.html) to handle the posted message
window.addEventListener('message', function(event) {
    // Verify the origin if needed for security
    // if (event.origin !== "https://yourdomain.com") return;
    
    const roadmapData = event.data;
    if (roadmapData && roadmapData.roadmap) {
        // Use the roadmap data instead of fetching from localStorage
        updateRoadmapDisplay(roadmapData);
        setupProgressTracking(roadmapData.userId || localStorage.getItem("userId"));
    }
});

// Also modify your roadmap page to check for message data on load
document.addEventListener("DOMContentLoaded", function() {
    // Check if we have data from the parent page first
    // If not, then try to fetch from backend
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId') || localStorage.getItem("userId");
    
    if (window.roadmapData) {
        // Data was passed via postMessage
        updateRoadmapDisplay(window.roadmapData);
        setupProgressTracking(window.roadmapData.userId || userId);
    } else if (userId) {
        // Fetch data from backend
        fetchRoadmapFromBackend(userId);
    } else {
        // No user ID, redirect to onboarding
        window.location.href = "../index.html";
    }
});

async function fetchRoadmapFromBackend(userId) {
    try {
        const response = await fetch(`https://naviprobackend.onrender.com/api/user_roadmap/${userId}`);
        if (response.ok) {
            const roadmapData = await response.json();
            updateRoadmapDisplay(roadmapData);
            setupProgressTracking(userId);
        } else {
            throw new Error("Failed to fetch roadmap");
        }
    } catch (error) {
        console.error("Error fetching roadmap:", error);
        // Show error message to user
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

// Add this at the top of your file
let progressChart = null;
let momentumChart = null;

// 1) Nav‑button active state
const navButtons = document.querySelectorAll(".nav-button");
navButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  })
);

//  USER PROGRESS TRACKING

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
      /*
            Returns:
            {
                "goal": "Land my first job",
                "total_tasks": 60,
                "completed_tasks": 5,
                "completion_percentage": 8.3,
                "current_month": 1,
                "current_week": 1,
                "current_day": 6,
                "start_date": "2024-01-15T10:00:00"
            }
            */
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
 * Display user progress
 */
async function displayUserProgress() {
  const progress = await getUserProgress();

  if (!progress) {
    document.getElementById("progressContainer").innerHTML =
      "<p>Progress data not available.</p>";
    return;
  }

  document.getElementById("progressContainer").innerHTML = `
        <div class="progress-section">
            <h3>📊 Your Learning Progress</h3>
            <p><strong>Goal:</strong> ${progress.goal}</p>
            
            <div class="progress-stats">
                <div class="stat-item">
                    <h4>${progress.completed_tasks}</h4>
                    <p>Tasks Completed</p>
                </div>
                <div class="stat-item">
                    <h4>${progress.total_tasks}</h4>
                    <p>Total Tasks</p>
                </div>
                <div class="stat-item">
                    <h4>${progress.completion_percentage}%</h4>
                    <p>Complete</p>
                </div>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${
                  progress.completion_percentage
                }%"></div>
            </div>
            
            <div class="current-position">
                <p><strong>Current Position:</strong> Month ${
                  progress.current_month
                }, Week ${progress.current_week}, Day ${
    progress.current_day
  }</p>
                <p><strong>Started:</strong> ${new Date(
                  progress.start_date
                ).toLocaleDateString()}</p>
            </div>
        </div>
    `;
}

async function initCharts() {
  console.log("Initializing charts...");

  const progressCanvas = document.getElementById("progressChart");
  const momentumCanvas = document.getElementById("momentumChart");

  if (!progressCanvas || !momentumCanvas) {
    console.error("Canvas elements not found!", {
      progressCanvas: !!progressCanvas,
      momentumCanvas: !!momentumCanvas,
    });
    return;
  }

  // Set default values
  const chartData = {
    completedTasks: 8,
    inProgressTasks: 12,
    upcomingTasks: 20,
  };

  // Clean up existing charts
  if (progressChart) progressChart.destroy();
  if (momentumChart) momentumChart.destroy();

  // Initialize progress chart with center text
  progressChart = new Chart(progressCanvas.getContext("2d"), {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: [
            chartData.completedTasks,
            chartData.inProgressTasks,
            chartData.upcomingTasks,
          ],
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

  // Initialize momentum chart
  momentumChart = new Chart(momentumCanvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Completed work",
          data: [4.5, 6.5, 2.5, 5, 3, 0, 0],
          backgroundColor: "#264653",
          stack: "a",
          barThickness: 30,
        },
        {
          label: "Proposed effort",
          data: [1.5, 2, 1, 2, 2, 7, 6],
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

  console.log("Charts initialized successfully");
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
      /*
      Returns:
            {
                "task_id": "m1_w1_d1",
                "title": "Learn HTML Basics",
                "description": "Study HTML elements, tags, and document structure",
                "goal": "Understand how HTML creates web page structure",
                "estimated_time": "2 hours",
                "resources": ["MDN HTML Basics", "FreeCodeCamp HTML section"],
                "week_focus": "HTML Fundamentals and Structure",
                "motivation_message": "🚀 Great job! You're 0 steps closer to 'Land my first job'. Every expert was once a beginner!",
                "progress": {
                    "current_day": 1,
                    "current_week": 1,
                    "current_month": 1,
                    "total_completed": 0
                }
            }
            */
    } else {
      console.error("Failed to get today's task");
      return null;
    }
  } catch (error) {
    console.error("Error fetching task:", error);
    return null;
  }
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

    document.getElementById("skillContainer").innerHTML = `
        <div class="skill">
            <div class="skill-header">
                <span class="skill-header-left">
                    <img width="25" height="25" src="Images/fatrows (1).png" alt=""> Skill Momentum
                </span>
                <span class="skill-header-right">
                    <img width="25" height="25" src="https://img.icons8.com/?size=100&id=16140&format=png&color=737373" alt="">
                </span>
            </div>

            <div class="middle">
                <p>This weeks skill focus: </p>
                <p>  • ${task.week_focus}</p>
            </div>

            <div class="explore-task">
                <span></span>
                <span><a class="explore-" href="#">Explore tasks →</a></span>
            </div>
            <div>
              <span class="bottom">
                      <img width="30" height="30" src="Images/Frame 3.png" alt=""> <span><span class="task-navi-ai">Navi:</span> You're doing great! - you've completed ${task.total_completed} task for this week</span>
              </span>
            </div>
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
      /**
      Returns:
      {
          "status": "success",
          "message": "Task completed! 🎉",
          "completed_task": "Learn HTML Basics",
          "total_completed": 1
      }
       */
      // Show success message
      alert(result.message);

      // Show success message
      alert(result.message);

      // Refresh the task display to show next task
      await displayTodaysTask();
      
      // Update progress section
      await updateProgressSection();
      
      // Update charts
      updateChartsWithRealData();
      
    } else {
      console.error("Failed to complete task");
      alert("Failed to mark task as complete");
    }
  } catch (error) {
    console.error("Error completing task:", error);
    alert("Error occurred while completing task");
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
      /*
      Returns:
      {
        "week_focus": "HTML Fundamentals and Structure",
        "week_info": "Month 1, Week 1",
        "videos": [
          {
            "title": "HTML Fundamentals - Complete Tutorial",
            "url": "https://www.youtube.com/watch?v=xyz123",
            "thumbnail": "https://i.ytimg.com/vi/xyz123/mqdefault.jpg",
            "channel": "Programming with Mosh",
            "duration": "PT25M30S",
            "views": "150000",
            "description": "Learn HTML fundamentals in this comprehensive tutorial..."
          }
        ],
        "total_videos": 6
      }
      */
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
      "<p>No videos available at the moment.</P>";
    return;
  }

  // Function to format video duration
  function formatDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    if (hours < 0) {
      return `<1h`;
    } else if (hours >= 3) {
      return `>3h`;
    } else if (hours >= 2) {
      return `>2h`;
    } else if (hours >= 1) {
      return `>1h`;
    } else {
      return `${hours}h`;
    }
  }

  // Display videos in UI
  document.getElementById("videoContainer").innerHTML = `
    <div id="videoContainer" class="recommendations">
      <span class="video-content">
        ${videoData.videos
          .map(
            (video) => `
          <span><a href="${
            video.url
          }"><img class="video-cover" width="80" height="50" src="${
              video.thumbnail
            }" alt=""></a></span>
        <span class="video-about">
          <span class="video-title">
              <a class="video-title" href="${video.url}">${video.title}</a>
          </span>
          <span class="video-detail">
            <span class="author-duration">
              <span class="video-author">${video.channel} • </span>
              <span class="video-duration"> ${formatDuration(
                video.duration
              )} • </span>
            </span>
            <span class="source"> <img width="25" height="15" src="https://png.pngtree.com/png-vector/20221018/ourmid/pngtree-youtube-social-media-icon-png-image_6315995.png" alt=""></span>
          </span>
        </span>
        <span class="ratings">
          <span class="star">
            <img width="15" height="15" src="https://img.icons8.com/?size=100&id=MVWV8hpGIZqp&format=png&color=FD7E14" alt="">
          </span> 
          <span class="rating">${video.rating || 3.8}</span>
        </span>
        `
          )
          .join("")}
      </span>

      <button onclick="refreshWeeklyVideos()" class="refresh-btn">
         Refresh Videos
      </button>
    </div>
  `;
}

/**
 * Refresh weekly videos (useful if user wants new recommendations)
 */
async function refreshWeeklyVideos() {
  document.getElementById("videoContainer").innerHTML =
    "<p>Loading fresh video recommendations</p>";
  await displayWeeklyVideos();
}

// Refresh chart when needed
function refreshChart() {
  if (momentumChart) momentumChart.destroy();
  if (progressChart) progressChart.destroy();
  initCharts();
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
      const inProgressTasks =
        weeklyTasks - (progress.completed_tasks % weeklyTasks);
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

// Initialize dashboard when DOM is loaded
window.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize charts
    initCharts();
    
    // Load user data
    await displayTodaysTask();
    await updateProgressSection();
    await displayWeeklyVideos();
    
    // Update charts with real data
    updateChartsWithRealData();
    
  } catch (error) {
    console.error("Error initializing dashboard:", error);
  }
});

// Add refresh function for periodic updates
function refreshProgressSection() {
  updateProgressSection();
}

// Optional: Refresh every 5 minutes
setInterval(refreshProgressSection, 300000);

// Handle iframe loading errors
function handleIframeError(section) {
    console.error(`Failed to load ${section} iframe`);
    const fallbackElement = document.getElementById(`${section}-fallback`);
    if (fallbackElement) {
        fallbackElement.style.display = 'block';
    }
}

// Add iframe timeout handling
function setupIframeTimeout(iframe, section, timeout = 10000) {
    setTimeout(() => {
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
            console.log(`${section} loaded successfully`);
        } else {
            console.warn(`${section} loading timeout`);
            handleIframeError(section);
        }
    }, timeout);
}

// Update charts with real data from backend
async function updateChartsWithRealData() {
  try {
    const progress = await getUserProgress();
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
    if (momentumChart) {
      // Get weekly progress data (you can enhance this with actual weekly data)
      const weeklyProgress = [4.5, 6.5, 2.5, 5, 3, 0, 0];
      momentumChart.data.datasets[0].data = weeklyProgress;
      momentumChart.update();
    }

  } catch (error) {
    console.error("Error updating charts with real data:", error);
  }
}

// Add at the end of your existing JavaScript
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

  // Adjust charts on window resize
  window.addEventListener("resize", function () {
    if (window.innerWidth <= 768) {
      if (momentumChart) {
        momentumChart.options.maintainAspectRatio = false;
        momentumChart.update();
      }
      if (progressChart) {
        progressChart.options.maintainAspectRatio = false;
        progressChart.update();
      }
    } else {
      if (momentumChart) {
        momentumChart.options.maintainAspectRatio = true;
        momentumChart.update();
      }
      if (progressChart) {
        progressChart.options.maintainAspectRatio = true;
        progressChart.update();
      }
    }
  });
});

function initializeRoadmap(roadmapData) {
    const iframe = document.querySelector('.roadmap-container iframe');
    if (!iframe) return;

    // Wait for iframe to load
    iframe.addEventListener('load', () => {
        try {
            // Send roadmap data to iframe
            iframe.contentWindow.postMessage({
                type: 'INIT_ROADMAP',
                data: roadmapData
            }, '*');
        } catch (error) {
            console.error('Error initializing roadmap:', error);
        }
    });
}
