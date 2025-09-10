// Replace with your actual backend root URL
const backendURL = "https://naviprobackend.onrender.com/api";

let currentUserId = null;
let currentTaskId = null;
let progressChart = null;
let momentumChart = null;

function getAuthHeaders(additional = {}) {
  const tokenFromAuth =
    typeof auth !== "undefined" && auth.getToken ? auth.getToken() : null;
  const tokenFromStorage =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    null;
  const token = tokenFromAuth || tokenFromStorage || null;

  const storedUserId =
    localStorage.getItem("user_id") || localStorage.getItem("userId") || null;

  const headers = {
    "Content-Type": "application/json",
    ...additional,
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (storedUserId) headers["X-User-ID"] = storedUserId;

  // Debug
  console.debug(
    "[getAuthHeaders] tokenPresent:",
    !!token,
    "userIdPresent:",
    !!storedUserId
  );

  return headers;
}

function parseJwt(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const part = token.split(".")[1];
    if (!part) return null;
    const payloadStr = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    try {
      return JSON.parse(decodeURIComponent(escape(payloadStr)));
    } catch (e) {
      return JSON.parse(payloadStr);
    }
  } catch (e) {
    return null;
  }
}

async function initializeUserSession() {
  console.debug("[initializeUserSession] start");

  // 1) Auth shim
  if (
    typeof auth !== "undefined" &&
    typeof auth.isAuthenticated === "function" &&
    auth.isAuthenticated()
  ) {
    try {
      const uid =
        typeof auth.getUserId === "function" ? auth.getUserId() : null;
      if (uid) {
        currentUserId = uid;
        console.log("[auth] auth shim provided user:", currentUserId);
        return true;
      }
    } catch (e) {
      console.warn(
        "[initializeUserSession] auth shim present but failed to getUserId:",
        e
      );
    }
  }

  // 2) LocalStorage
  const storedId =
    localStorage.getItem("user_id") || localStorage.getItem("userId") || null;
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    null;

  if (storedId) {
    currentUserId = storedId;
    console.log("[auth] using stored user_id:", currentUserId);
    return true;
  }

  // 3) Token decode
  if (token) {
    const payload = parseJwt(token);
    const derived =
      payload &&
      (payload.sub || payload.user_id || payload.uid || payload.id || null);
    if (derived) {
      currentUserId = derived;
      localStorage.setItem("user_id", currentUserId);
      localStorage.setItem("userId", currentUserId);
      console.log("[auth] derived user_id from token payload:", currentUserId);
      return true;
    }

    // 4) Try /auth/me
    try {
      console.debug(
        "[initializeUserSession] trying auth /auth/me for user info"
      );
      const meResp = await fetch(`${backendURL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (meResp.ok) {
        const meData = await meResp.json();
        const uid =
          meData.user_id || meData.userId || meData.id || meData.sub || null;
        if (uid) {
          currentUserId = uid;
          localStorage.setItem("user_id", uid);
          localStorage.setItem("userId", uid);
          console.log("[auth] fetched user_id from auth /auth/me:", uid);
          return true;
        } else {
          console.warn(
            "[initializeUserSession] /auth/me returned ok but no id in body:",
            meData
          );
        }
      } else {
        console.warn(
          "[initializeUserSession] auth /auth/me returned status:",
          meResp.status
        );
      }
    } catch (err) {
      console.warn("[initializeUserSession] fetch /auth/me failed:", err);
    }
  }

  // 5) Fallback
  console.warn(
    "[initializeUserSession] no auth shim, no stored userId, no token-derived id -> redirecting to login"
  );
  window.location.href = "../login/index.html";
  return false;
}

// === NEW: Load roadmap from backend ===
async function loadRoadmap() {
  if (!currentUserId) {
    console.error("No user ID found, cannot load roadmap");
    return;
  }

  try {
    const res = await fetch(`${backendURL}/roadmap/${currentUserId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      if (res.status === 404) {
        console.log("[dashboard] No roadmap found, showing create option");
        showCreateRoadmapOption();
        return;
      }
      throw new Error(`Failed to fetch roadmap (status ${res.status})`);
    }

    const data = await res.json();
    console.log("[dashboard] Loaded roadmap:", data);

    if (data && data.roadmap) {
      renderRoadmap(data.roadmap); // <-- implement your renderer
    } else {
      showCreateRoadmapOption();
    }
  } catch (err) {
    console.error("[dashboard] loadRoadmap error:", err);
    showCreateRoadmapOption();
  }
}

// === Entry point ===
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await initializeUserSession();
  if (ok) {
    loadRoadmap();
  }
});

function loadSectionContent(sectionName) {
  const mainContent = document.getElementById("mainContent");
  if (!mainContent) return console.error("No #mainContent element found");
  mainContent.innerHTML =
    '<div style="text-align:center;padding:50px;"><h3>Loading...</h3></div>';

  switch (sectionName) {
    case "dashboard":
      loadDashboardContent();
      break;
    case "tasks":
      loadTasksContent();
      break;
    case "roadmap":
      loadRoadmapContent();
      break;
    case "resources":
      loadResourcesContent();
      break;
    default:
      loadDashboardContent();
  }
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-button");
  if (!btn) return;

  e.preventDefault();
  document
    .querySelectorAll(".nav-button")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  const raw = btn.getAttribute("data-section") || btn.textContent || "";
  const section = raw.trim().toLowerCase();

  if (section === "dashboard") loadSectionContent("dashboard");
  else if (section === "my tasks" || section === "tasks")
    loadSectionContent("tasks");
  else if (section === "my career path" || section === "roadmap")
    loadSectionContent("roadmap");
  else if (section === "resources") loadSectionContent("resources");
  else loadSectionContent("dashboard");
});

function loadDashboardContent() {
  const mainContent = document.getElementById("mainContent");
  if (!mainContent) return;

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
            <button class="talk-to-navi" id="talkToNaviBtn">Talk to Navi</button>
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
            <div id="taskContainer" class="task"></div>
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
                  <h3 class="completed-tasks">0</h3>
                  <p>Completed</p>
                </div>
                <div class="summary-box1">
                  <img class="middle-icon" height="25" width="25" src="https://img.icons8.com/?size=100&id=82767&format=png&color=FFFFFF" alt="">
                  <h3 class="in-progress-tasks">0</h3>
                  <p>In progress</p>
                </div>
                <div class="summary-box">
                  <img class="last-icon" width="27" height="27" src="https://img.icons8.com/?size=100&id=59878&format=png&color=FFFFFF" alt="">
                  <h3 class="upcoming-tasks">0</h3>
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
              <div id="videoContainer" class="recommendations"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const talkBtn = document.getElementById("talkToNaviBtn");
  if (talkBtn)
    talkBtn.addEventListener(
      "click",
      () => (window.location.href = "../Navi/index.html")
    );

  setTimeout(() => {
    initCharts();
    displayTodaysTask();
    displayWeeklyVideos();
    updateProgressSection();
    displayWeeksFocus();
  }, 80);
}

function loadTasksContent() {
  const mainContent = document.getElementById("mainContent");
  if (!mainContent) return;
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
  if (!mainContent) return;

  if (!currentUserId) {
    mainContent.innerHTML = `<div class="error">User not found. Please login again.</div>`;
    return;
  }

  try {
    const response = await fetch(
      "https://naviprobackend.onrender.com/api/user_roadmap",
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        mainContent.innerHTML = `<div>No roadmap found. <a href="../onboarding/index.html">Create one now</a></div>`;
        return;
      } else {
        throw new Error("Failed to fetch roadmap: " + response.status);
      }
    }

    const roadmapData = await response.json();
    mainContent.innerHTML = `
      <div class="roadmap-container" style="width:100%; height:100vh; overflow-y:auto;">
        <iframe id="roadmapFrame" src="../roadmap/index.html" style="width:100%; height:100%; border:none;"></iframe>
      </div>
    `;

    const iframe = document.getElementById("roadmapFrame");
    iframe?.addEventListener("load", () => {
      iframe.contentWindow.postMessage(roadmapData, "*");
    });
  } catch (error) {
    console.error("Error loading roadmap:", error);
    mainContent.innerHTML = `<div class="error"><p>Failed to load roadmap. Please try again.</p></div>`;
  }
}

function loadResourcesContent() {
  const mainContent = document.getElementById("mainContent");
  if (!mainContent) return;
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

async function getUserProgress() {
  if (!currentUserId) return null;
  try {
    const response = await fetch(
      "https://naviprobackend.onrender.com/api/user_progress",
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.error("Error fetching progress:", e);
    return null;
  }
}

async function getWeeklyProgress() {
  if (!currentUserId) {
    return {
      completed_hours: [4.5, 6.5, 2.5, 5, 3, 0, 0],
      planned_hours: [1.5, 2, 1, 2, 2, 7, 6],
    };
  }
  try {
    const response = await fetch(
      "https://naviprobackend.onrender.com/api/weekly_progress",
      {
        headers: getAuthHeaders(),
      }
    );
    if (response.status === 404) {
      return {
        completed_hours: [4.5, 6.5, 2.5, 5, 3, 0, 0],
        planned_hours: [1.5, 2, 1, 2, 2, 7, 6],
      };
    }
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.error("Error fetching weekly progress:", e);
    return {
      completed_hours: [4.5, 6.5, 2.5, 5, 3, 0, 0],
      planned_hours: [1.5, 2, 1, 2, 2, 7, 6],
    };
  }
}

async function getTodaysTask() {
  if (!currentUserId) return null;
  try {
    const response = await fetch(
      "https://naviprobackend.onrender.com/api/daily_task",
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      console.error("Failed to get today's task", response.status);
      return null;
    }
    return await response.json();
  } catch (e) {
    console.error("Error fetching task:", e);
    return null;
  }
}

async function getWeeklyVideos() {
  if (!currentUserId) return null;
  try {
    const response = await fetch(
      "https://naviprobackend.onrender.com/api/week_videos",
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      console.error("Failed to get weekly videos", response.status);
      return null;
    }
    return await response.json();
  } catch (e) {
    console.error("Error fetching videos:", e);
    return null;
  }
}

async function initCharts() {
  const progressCanvas = document.getElementById("progressChart");
  const momentumCanvas = document.getElementById("momentumChart");

  if (!progressCanvas || !momentumCanvas) {
    console.error("Canvas elements not found");
    return;
  }

  const progress = await getUserProgress();
  const weeklyProgress = await getWeeklyProgress();

  if (progressChart) progressChart.destroy();
  if (momentumChart) momentumChart.destroy();

  if (progress) {
    const totalTasks = progress.total_tasks || 0;
    const completedTasks = progress.completed_tasks || 0;
    const inProgressTasks = Math.min(
      5,
      Math.max(0, totalTasks - completedTasks)
    );
    const upcomingTasks = Math.max(
      0,
      totalTasks - completedTasks - inProgressTasks
    );

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
            const total =
              chart.data.datasets[0].data.reduce((a, b) => a + b, 0) || 1;
            const completed = chart.data.datasets[0].data[0] || 0;
            const percentage = Math.round((completed / total) * 100);
            const fontSize = (height / 8).toFixed(2);
            ctx.font = `bold ${fontSize}px Poppins`;
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillStyle = "#1B455B";
            ctx.fillText(`${percentage}%`, width / 2, height / 2);
            ctx.save();
          },
        },
      ],
    });
  }

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
            barThickness: 30,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              font: { padding: 8, size: 14, family: "Poppins" },
              color: "#666",
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            max: 8,
            ticks: {
              stepSize: 2,
              font: { size: 15, family: "Poppins" },
              color: "#666",
              padding: 10,
            },
            grid: { color: "#f0f0f0" },
          },
        },
      },
    });
  }
}

async function displayWeeksFocus() {
  const focus = await getTodaysTask();
  const skillEl = document.getElementById("skill");
  if (!skillEl) return;

  if (!focus) {
    skillEl.innerHTML = `
      <div class="skill-header">
        <span class="skill-header-left"><img width="25" height="25" src="Images/fatrows (1).png" alt=""> Skill Momentum</span>
      </div>
      <div class="middle">
        <p>This weeks skill focus: </p>
        <p>  None Available</p>
      </div>
    `;
    return;
  }

  skillEl.innerHTML = `
    <div class="skill-header">
      <span class="skill-header-left"><img width="25" height="25" src="Images/fatrows (1).png" alt=""> Skill Momentum</span>
    </div>
    <div class="middle">
      <p>This weeks skill focus: </p>
      <p>  • ${focus.week_focus || "N/A"}</p>
      <p>  - Today's task description: ${
        focus.description || "No description"
      }</p>
    </div>
  `;
}

async function displayTodaysTask() {
  const task = await getTodaysTask();
  currentTaskId = null;
  const container = document.getElementById("taskContainer");
  if (!container) return;

  if (!task || task.message === "All tasks completed! 🎉") {
    container.innerHTML = `
      <div class="task-header">
        <span class="active-task">
          <img width="25" height="25" src="https://img.icons8.com/?size=100&id=KPXIRLDghgMh&format=png&color=737373" alt="">
          <span>No Active Tasks</span>
        </span>
      </div>
      <p style="text-align:center;padding:20px;">All tasks completed! 🎉</p>
    `;
    return;
  }

  currentTaskId = task.task_id || null;

  container.innerHTML = `
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
        <span>Task: <b>${task.title || "Untitled task"}</b></span>
      </div>
      <div class="task-lists">
        <img class="second-icon" width="25" height="25" src="https://img.icons8.com/?size=100&id=11751&format=png&color=FFFFFF" alt="">
        <span>Goal: ${task.goal || "—"}</span>
      </div>
      <div class="task-lists1">
        <div class="task-lists">
          <img class="third-icon" height="25" width="25" src="https://img.icons8.com/?size=100&id=82767&format=png&color=FFFFFF" alt="">
          <span>Estimated time: ${task.estimated_time || "N/A"}</span>
        </div>
        <div class="task-lists">
          <button id="completeTaskBtn" class="done">Done <img style="margin-left:6px;" width="15" height="15" src="https://img.icons8.com/?size=100&id=15478&format=png&color=40C057" alt=""></button>
        </div>
      </div>
    </div>
    <div class="task-navi">
      <span class="bottom">
        <img width="30" height="30" src="Images/Frame 3.png" alt="">
        <span><span class="task-navi-ai">Navi:</span> ${
          task.motivation_message || ""
        }</span>
      </span>
    </div>
  `;

  const completeBtn = document.getElementById("completeTaskBtn");
  if (completeBtn) completeBtn.addEventListener("click", () => completeTask());
}

async function completeTask() {
  if (!currentUserId) {
    alert("No user session found");
    return;
  }

  try {
    const body = { task_completed: true };
    if (currentTaskId) body.task_id = currentTaskId;

    const response = await fetch(
      "https://naviprobackend.onrender.com/api/complete_task",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      console.error("Failed to complete task", response.status);
      alert("Failed to mark task as complete");
      return;
    }

    const result = await response.json();
    alert(result.message || "Task completed!");
    await displayTodaysTask();
    await displayWeeksFocus();
    await updateProgressSection();
    await updateChartsWithRealData();
  } catch (e) {
    console.error("Error completing task:", e);
  }
}

function formatDuration(duration) {
  const match = (duration || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration || "";
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

async function displayWeeklyVideos() {
  const videoData = await getWeeklyVideos();
  const container = document.getElementById("videoContainer");
  if (!container) return;

  if (!videoData || !videoData.videos || videoData.videos.length === 0) {
    container.innerHTML = "<p>No videos available at the moment.</p>";
    return;
  }

  container.innerHTML = `
    <div class="video-content">
      ${videoData.videos
        .map(
          (video) => `
        <div style="display:flex;gap:10px;margin-bottom:15px;align-items:center;">
          <a href="${
            video.url
          }" target="_blank"><img class="video-cover" width="80" height="50" src="${
            video.thumbnail
          }" alt=""></a>
          <div class="video-about" style="flex:1;">
            <a class="video-title" href="${video.url}" target="_blank">${
            video.title
          }</a>
            <div class="video-detail">
              <span class="video-author">${video.channel} • </span>
              <span class="video-duration">${formatDuration(
                video.duration
              )}</span>
            </div>
          </div>
          <div class="ratings">
            <span class="star"><img width="15" height="15" src="https://img.icons8.com/?size=100&id=MVWV8hpGIZqp&format=png&color=FD7E14" alt=""></span>
            <span class="rating">${video.rating || 3.8}</span>
          </div>
        </div>`
        )
        .join("")}
    </div>
    <button id="refreshVideosBtn" class="refresh-btn">Refresh Videos</button>
  `;

  const refreshBtn = document.getElementById("refreshVideosBtn");
  if (refreshBtn)
    refreshBtn.addEventListener("click", async () => {
      container.innerHTML = "<p>Loading fresh video recommendations...</p>";
      await displayWeeklyVideos();
    });
}

async function updateProgressSection() {
  const progress = await getUserProgress();
  if (!progress) return;

  try {
    const completedTasksElement = document.querySelector(".completed-tasks");
    if (completedTasksElement)
      completedTasksElement.textContent = progress.completed_tasks || 0;

    const inProgressElement = document.querySelector(".in-progress-tasks");
    if (inProgressElement) {
      const weeklyTasks = 5;
      const inProgressTasks =
        weeklyTasks - ((progress.completed_tasks || 0) % weeklyTasks);
      inProgressElement.textContent = inProgressTasks;
    }

    const upcomingElement = document.querySelector(".upcoming-tasks");
    if (upcomingElement) {
      const upcomingTasks = Math.max(
        0,
        (progress.total_tasks || 0) - (progress.completed_tasks || 0)
      );
      upcomingElement.textContent = upcomingTasks;
    }
  } catch (e) {
    console.error("Error updating progress section:", e);
  }
}

async function updateChartsWithRealData() {
  try {
    const progress = await getUserProgress();
    const weeklyProgress = await getWeeklyProgress();
    const todays = await getTodaysTask();

    if (progressChart && progress) {
      const totalTasks = progress.total_tasks || 0;
      const completedTasks = progress.completed_tasks || 0;
      const inProgressTasks = Math.min(
        5,
        Math.max(0, totalTasks - completedTasks)
      );
      const upcomingTasks = Math.max(
        0,
        totalTasks - completedTasks - inProgressTasks
      );
      progressChart.data.datasets[0].data = [
        completedTasks,
        inProgressTasks,
        upcomingTasks,
      ];
      progressChart.update();
    }

    if (momentumChart && weeklyProgress) {
      const timeVal =
        todays &&
        todays.estimated_time &&
        typeof todays.estimated_time === "number"
          ? todays.estimated_time
          : 2;
      momentumChart.data.datasets[0].data = weeklyProgress.completed_hours || [
        4.5, 6.5, 2.5, 5, 3, 0, 0,
      ];
      momentumChart.data.datasets[1].data = weeklyProgress.planned_hours || [
        timeVal,
        timeVal,
        timeVal,
        timeVal,
        timeVal,
        timeVal,
        timeVal,
      ];
      momentumChart.update();
    }
  } catch (e) {
    console.error("Error updating charts:", e);
  }
}

function handleIframeError(section) {
  const fallbackElement = document.getElementById(`${section}-fallback`);
  if (fallbackElement) fallbackElement.style.display = "block";
}

(function wireMobileToggle() {
  const menuToggle = document.getElementById("menuToggle");
  const navigation = document.getElementById("navigation");
  if (!menuToggle || !navigation) return;
  menuToggle.addEventListener("click", function () {
    navigation.classList.toggle("active");
    menuToggle.classList.toggle("active");
  });
  document.addEventListener("click", function (e) {
    if (!navigation.contains(e.target) && !menuToggle.contains(e.target)) {
      navigation.classList.remove("active");
      menuToggle.classList.remove("active");
    }
  });
})();

document.addEventListener("DOMContentLoaded", async () => {
  const ok = await initializeUserSession();
  if (!ok) return;
  loadSectionContent("dashboard");
});
