document.addEventListener('DOMContentLoaded', function() {
    // Get roadmap data from localStorage
    const roadmapData = JSON.parse(localStorage.getItem('roadmapData') || '{}');
    const userId = localStorage.getItem('userId');
    
    if (!roadmapData.roadmap || !userId) {
        // Redirect back to onboarding if no data
        window.location.href = "../onboarding/index.html";
        return;
    }
    
    // Store user ID globally for this page
    window.currentUserId = userId;

    // Update page content with roadmap data
    updateRoadmapDisplay(roadmapData);
    
    // Set up progress tracking
    setupProgressTracking(userId);
});

function updateRoadmapDisplay(roadmapData) {
    // Update header information
    updateHeaderInfo(roadmapData);
    
    // Update progress section
    updateProgressSection(roadmapData);
    
    // Generate roadmap content
    generateRoadmapContent(roadmapData);
    
    // Update footer
    updateFooter(roadmapData);
}

function updateProgressSection(roadmapData) {
    // Update goal with the actual goal from backend
    const goalElement = document.querySelector('.progress-info h1');
    if (goalElement) {
        goalElement.textContent = `Goal: ${roadmapData.goal}`;
    }
    
    // Update progress info with proper month counting
    const progressInfo = document.querySelector('.progress-info p');
    if (progressInfo) {
        const progress = roadmapData.progress || {};
        const currentMonth = progress.current_month || 1;
        const totalMonths = roadmapData.roadmap ? roadmapData.roadmap.length : 0;
        progressInfo.textContent = `Month ${currentMonth} of ${totalMonths} • Keep going`;
    }
    
    // Update progress percentage
    const progressPercentage = document.querySelector('.progress-percentage p');
    if (progressPercentage) {
        const progress = roadmapData.progress || {};
        const totalTasks = calculateTotalTasks(roadmapData);
        const completedTasks = progress.total_tasks_completed || 0;
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        progressPercentage.textContent = `${percentage}%`;
    }
}

function updateHeaderInfo(roadmapData) {
    // Update title with target role from backend
    const title = document.querySelector('.title');
    if (title) {
        title.textContent = `Your ${roadmapData.target_role} Career Path`;
    }
    
    // Update timeline
    const timeline = document.querySelector('.period');
    if (timeline) {
        const timeframeMap = {
            '3_months': '3 Months',
            '6_months': '6 Months',
            '1_year': '1 Year',
            'not_sure': '3 Months'
        };
        timeline.textContent = timeframeMap[roadmapData.timeframe] || '3 Months';
    }
}

function updateProgressBar(roadmapData) {
    const progress = roadmapData.progress || {};
    const totalTasks = calculateTotalTasks(roadmapData);
    const completedTasks = progress.total_tasks_completed || 0;
    const percentage = totalTasks > 0 ? ((completedTasks / totalTasks) * 100) : 0;

    const progressBar = document.getElementById('filling');
    progressBar.style.width = `${percentage}%`;
}

function generateRoadmapContent(roadmapData) {
    const roadmapContainer = document.querySelector('.monthly-roadmap');
    if (!roadmapContainer) return;
    
    // Clear existing content
    roadmapContainer.innerHTML = '';
    
    // Generate content for each month
    roadmapData.roadmap.forEach((month, monthIndex) => {
        // Create month header
        const monthElement = createMonthElement(month, monthIndex + 1);
        roadmapContainer.appendChild(monthElement);
        
        // Generate weeks for this month
        month.weeks.forEach((week, weekIndex) => {
            const weekElement = createWeekElement(week, monthIndex + 1, weekIndex + 1);
            roadmapContainer.appendChild(weekElement);
        });
    });
}

function createMonthElement(month, monthNumber) {
    const monthDiv = document.createElement('div');
    monthDiv.className = 'month';
    
    monthDiv.innerHTML = `
        <div class="spot">${monthNumber}</div>
        <span class="month-info"> 
            <h1>Month ${monthNumber}</h1>
            <p>${month.month_title || month.focus || 'Skills Building'}</p>
        </span>
    `;
    
    return monthDiv;
}

function createWeekElement(week, monthNumber, weekNumber) {
    const weekDiv = document.createElement('div');
    weekDiv.className = weekNumber % 2 === 1 ? 'week-right' : 'week-right';
    
    // Determine if this is an odd or even week for layout
    const isOddWeek = weekNumber % 2 === 1;
    
    if (isOddWeek) {
        weekDiv.innerHTML = `
            <div class="week-content">
                <h3><span class="week-number">${week.week_number || weekNumber}</span> Week ${week.week_number || weekNumber}</h3>
                <p class="week-focus">${week.focus}</p>
                <ul>
                    ${week.daily_tasks.map(task => `<li>${task.title}</li>`).join('')}
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
        `;
    } else {
        weekDiv.innerHTML = `
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
                <p class="week-focus">${week.focus}</p>
                <ul>
                    ${week.daily_tasks.map(task => `<li>${task.title}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    return weekDiv;
}

function getWeekIcon(weekNumber) {
    const icons = [
        'Hourglass', 'paintpalette', 'Laptop (1)', 'zip',
        'presentation', 'clipboard', 'refresh', 'target',
        'balance', 'padlock', 'rocket', 'Calendar (1)'
    ];
    
    return icons[(weekNumber - 1) % icons.length] || 'Hourglass';
}

function updateFooter(roadmapData) {
    const footer = document.querySelector('.footer h3');
    if (footer) {
        footer.innerHTML = `<span><img src="Images/Vector (1).png" alt=""></span> Roadmap Completed 🎉`;
    }
    
    const footerText = document.querySelector('.footer p');
    if (footerText) {
        // Use goal instead of target_role for more accuracy
        footerText.innerHTML = `Congratulations on your journey to achieving your goal:<br> <b>${roadmapData.target_role || 'Career Development'}</b>`;
    }
}

function calculateTotalTasks(roadmapData) {
    let total = 0;
    roadmapData.roadmap.forEach(month => {
        month.weeks.forEach(week => {
            total += week.daily_tasks.length;
        });
    });
    return total;
}

function setupProgressTracking(userId) {
    // Add click handlers for task completion
    const taskItems = document.querySelectorAll('.week-content li, .week-content2 li');
    
    taskItems.forEach((taskItem, index) => {
        taskItem.addEventListener('click', async function() {
            if (this.classList.contains('completed')) return;
            
            try {
                const response = await fetch(
                  `http://https://naviprobackend.onrender.com/api/complete_task/${userId}`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ task_completed: true }),
                  }
                );
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.status === 'success') {
                        // Mark task as completed
                        this.classList.add('completed');
                        this.style.textDecoration = 'line-through';
                        this.style.opacity = '0.6';
                        
                        // Update progress display
                        updateProgressDisplay(result);
                        
                        // Show completion message
                        showCompletionMessage(result.message);
                    }
                }
            } catch (error) {
                console.error('Error completing task:', error);
            }
        });
    });
}

function updateProgressDisplay(result) {
    // Update progress percentage
    const progressPercentage = document.querySelector('.progress-percentage p');
    if (progressPercentage) {
        const currentProgress = roadmapData.progress || {};
        const totalTasks = calculateTotalTasks(roadmapData);
        const completedTasks = result.total_completed || 0;
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        progressPercentage.textContent = `${percentage}%`;
    }
    
    // Update progress bar
    const progressBar = document.querySelector('.filling');
    if (progressBar) {
        const roadmapData = JSON.parse(localStorage.getItem('roadmapData') || '{}');
        const totalTasks = calculateTotalTasks(roadmapData);
        const completedTasks = result.total_completed || 0;
        const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        progressBar.style.width = `${percentage}%`;
    }
}

function showCompletionMessage(message) {
    // Create a temporary notification
    const notification = document.createElement('div');
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
const style = document.createElement('style');
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
