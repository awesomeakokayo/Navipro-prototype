
document.addEventListener("DOMContentLoaded", async function () {
    // Simulate user ID and preferences for demo purposes
    localStorage.setItem("userId", "demo-user-123");
    localStorage.setItem("userPreferences", JSON.stringify({
        goal: "Become a Full Stack Developer",
        targetRole: "Full Stack Developer",
        timeframe: "6_months",
        hoursPerWeek: "15",
        learningStyle: "visual",
        learningSpeed: "average",
        skillLevel: "beginner"
    }));

    const userId = localStorage.getItem("userId");

    if (!userId) {
        window.location.href = "../index.html";
        return;
    }

    try {
        // In a real scenario, this would fetch from your backend
        // For demo, we'll use mock data
        const roadmapData = await fetchRoadmapData(userId);
        updateRoadmapDisplay(roadmapData);
        setupProgressTracking(userId, roadmapData);
    } catch (err) {
        console.error("Failed to load roadmap:", err);
        alert("Could not load roadmap. Please try again later.");
    }
});

// Mock function to simulate fetching roadmap data
async function fetchRoadmapData(userId) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data
    return {
        goal: "Become a Full Stack Developer",
        target_role: "Full Stack Developer",
        timeframe: "6_months",
        progress: {
            current_month: 1,
            total_tasks_completed: 0,
            completed_task_ids: []
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
        roadmapData.roadmap.forEach((month, monthIndex) => {
            const monthElement = createMonthElement(month, monthIndex + 1);
            roadmapContainer.appendChild(monthElement);

            if (month.weeks && month.weeks.length > 0) {
                month.weeks.forEach((week, weekIndex) => {
                    const weekElement = createWeekElement(week, monthIndex + 1, weekIndex + 1, roadmapData.progress.completed_task_ids);
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
                        <img width="45" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0RjQ2RTUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWZlYXRoZXIiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIj48L2NpcmNsZT48cGF0aCBkPSJNMTIgOGwtNCA0IDQtNCI+PC9wYXRoPjxwYXRoIGQ9Ik0xMiAxMlYxNiI+PC9wYXRoPjxwYXRoIGQ9Ik0xNiAxMkgyMCI+PC9wYXRoPjwvc3ZnPg==" alt="Number ${weekNumber}">
                    </span>
                </div>
                <div class="week-icon">
                    <img width="300" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzRFNDZFNSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1jb2RlIj48cG9seWxpbmUgcG9pbnRzPSIxNiAxOCAyMiAxMiAxNiA2Ij48L3BvbHlsaW5lPjxwb2x5bGluZSBwb2ludHM9IjggNiAyIDEyIDggMTgiPjwvcG9seWxpbmU+PC9zdmc+" alt="Week ${weekNumber} Icon">
                </div>
            </div>
        `;
    } else {
        weekDiv.innerHTML = `
            <div class="week-right">
                <div class="week-icon2">
                    <img width="300" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzRFNDZFNSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1jb2RlIj48cG9seWxpbmUgcG9pbnRzPSIxNiAxOCAyMiAxMiAxNiA2Ij48L3BvbHlsaW5lPjxwb2x5bGluZSBwb2ludHM9IjggNiAyIDEyIDggMTgiPjwvcG9seWxpbmU+PC9zdmc+" alt="Week ${weekNumber} Icon">
                </div>
                <div class="number2">
                    <span class="number">
                        <img width="45" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0RjQ2RTUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWZlYXRoZXIiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIj48L2NpcmNsZT48cGF0aCBkPSJNMTIgOGwtNCA0IDQtNCI+PC9wYXRoPjxwYXRoIGQ9Ik0xMiAxMlYxNiI+PC9wYXRoPjxwYXRoIGQ9Ik0xNiAxMkgyMCI+PC9wYXRoPjwvc3ZnPg==" alt="Number ${weekNumber}">
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

function updateFooter(roadmapData) {
    const footer = document.querySelector(".footer h3");
    if (footer) {
        footer.innerHTML = `<span><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWFpcnJwb3J0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjE5IiByPSIyIj48L2NpcmNsZT48cGF0aCBkPSJNMTYuNSAxOS41YzEuMi0xLjIyIDIuNS0yLjU2IDMuODQtNC4wMiAxLjMtMS40NCAyLjU5LTIuOTYgMy44OC00LjUxIj48L3BhdGg+PHBhdGggZD0iTTEuNDQgMTQuNjNjMS42NS0yLjA3IDMuMjUtNC4xIDQuODgtNi4wM0M3Ljk1IDYuNTcgOS42IDQuNjMgMTEuMjUgMi42NCI+PC9wYXRoPjxwYXRoIGQ9Ik04LjU2IDE5LjY4YzEuMTQtMS4yNSAyLjI5LTIuNDkgMy40NS0zLjcyIDEuMTUtMS4yMyAyLjMxLTIuNDYgMy40Ny0zLjY4Ij48L3BhdGg+PHBhdGggZD0iTTMuNjkgMTQuNjNjMS44Mi0yLjI3IDMuNjQtNC41NCA140uODEiPjwvcGF0aD48L3N2Zz4=" alt=""></span> Roadmap Progress`;
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
                // For demo, we'll simulate the API call
                const result = await completeTask(userId, taskId, !alreadyCompleted);
                
                if (result.status === "success") {
                    // Update UI based on completion status
                    if (!alreadyCompleted) {
                        this.classList.add("completed");
                        showCompletionMessage("Task completed! Great job!");
                    } else {
                        this.classList.remove("completed");
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

// Mock function to simulate completing a task
async function completeTask(userId, taskId, complete) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real scenario, this would be your fetch call to the backend
    /*
    const response = await fetch(
        `https://naviprobackend.onrender.com/api/complete_task/${userId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                task_id: taskId,
                task_completed: complete,
            }),
        }
    );
    
    if (!response.ok) {
        throw new Error(`Server responded with error: ${response.status}`);
    }
    
    return await response.json();
    */
    
    // For demo, return mock response
    return {
        status: "success",
        message: complete ? "Task marked as completed" : "Task marked as incomplete",
        total_completed: complete ? 1 : 0, // This would be the actual total from the backend
        progress: {
            current_month: 1,
            total_tasks_completed: complete ? 1 : 0 // This would be the actual total from the backend
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