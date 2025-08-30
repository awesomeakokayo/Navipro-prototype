// Backend URL configuration
const APP_BACKEND_URL = 'https://backend-b7ak.onrender.com';

// Utility function for authenticated requests
async function authenticatedFetch(endpoint, options = {}) {
  const token = localStorage.getItem('jwtToken');
  
  if (!token) {
    console.error('No JWT token found in localStorage');
    window.location.href = '../Login/index.html';
    throw new Error('Authentication required');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  headers['Authorization'] = `Bearer ${token}`;
  
  try {
    const response = await fetch(`${APP_BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('jwtToken');
      window.location.href = '../Login/index.html';
      throw new Error('Authentication failed');
    }
    
    return response;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

document.addEventListener('DOMContentLoaded', function() {
    // Get all necessary elements
    const steps = document.querySelectorAll('.step');
    const nextButtons = document.querySelectorAll('.next-btn');
    const backButtons = document.querySelectorAll('.back-btn');
    const progressBar = document.getElementById('progress-bar-fill');
    const optionButtons = document.querySelectorAll('.option-btn');
    const selectButtons = document.querySelectorAll('.select-btn');
    const targetRoleInput = document.querySelector('#target-role');

    // Store form data
    let formData = {
        career_goal: '',
        target_role: '',
        timeframe: '',
        hours_per_week: '',
        learning_style: '',
        learning_speed: '',
        skill_level: ''
    };

    // Check if user has a JWT token
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = "../Login/index.html";
        return;
    }

    // Initialize first step
    let currentStep = 1;
    steps[0].classList.add('active');
    updateProgressBar();
    
    function getStepData(stepNumber) {
        switch(stepNumber) {
            case 1: return formData.career_goal;
            case 2: return formData.target_role;
            case 3: return formData.timeframe;
            case 4: return formData.hours_per_week;
            case 5: return formData.learning_style;
            case 6: return formData.learning_speed;
            case 7: return formData.skill_level;
            default: return '';
        }
    }

    // Handle option button clicks (Step 1, 6, 7)
    optionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const parentStep = this.closest('.step');
            parentStep.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            
            // Store data based on current step
            const stepNumber = parseInt(parentStep.getAttribute('data-step'));
            const selectedValue = this.getAttribute('data-value');
            
            if (stepNumber === 1) {
                formData.career_goal = selectedValue;
            } else if (stepNumber === 6) {
                formData.learning_speed = selectedValue;
            } else if (stepNumber === 7) {
                formData.skill_level = selectedValue;
            }
            
            console.log(`Step ${stepNumber}: ${selectedValue}`);
            console.log('Form data:', formData);
            
            enableNextButton(stepNumber - 1);
            updateStepCompletion();
        });
    });

    // Handle select button clicks (Step 3, 4, 5)
    selectButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const parentStep = this.closest('.step');
            parentStep.querySelectorAll('.select-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            this.classList.add('selected');
            
            // Store data based on current step
            const stepNumber = parseInt(parentStep.getAttribute('data-step'));
            const selectedValue = this.getAttribute('data-value');
            
            if (stepNumber === 3) {
                formData.timeframe = selectedValue;
            } else if (stepNumber === 4) {
                formData.hours_per_week = selectedValue;
            } else if (stepNumber === 5) {
                formData.learning_style = selectedValue;
            }
            
            console.log(`Step ${stepNumber}: ${selectedValue}`);
            console.log('Form data:', formData);
            
            enableNextButton(stepNumber - 1);
            updateStepCompletion();
        });
    });

 // Handle final step - generate roadmap
    const finalStep = steps[steps.length - 1];
    const finishBtn = finalStep.querySelector(".next-btn");

    if (finishBtn) {
        finishBtn.addEventListener("click", async function (e) {
            e.preventDefault();
            
            // Debug: Log current form data
            console.log('Final form data check:', formData);
            
            // Validate all required fields are filled
            const missingFields = [];
            if (!formData.career_goal) missingFields.push('Career Goal (Step 1)');
            if (!formData.target_role) missingFields.push('Target Role (Step 2)');
            if (!formData.timeframe) missingFields.push('Timeframe (Step 3)');
            if (!formData.hours_per_week) missingFields.push('Hours per Week (Step 4)');
            if (!formData.learning_style) missingFields.push('Learning Style (Step 5)');
            if (!formData.learning_speed) missingFields.push('Learning Speed (Step 6)');
            if (!formData.skill_level) missingFields.push('Skill Level (Step 7)');
            
            if (missingFields.length > 0) {
                alert(`Please complete the following steps:\n\n${missingFields.join('\n')}`);
                console.log('Missing fields:', missingFields);
                return;
            }

            // Show loading state
            finishBtn.textContent = "Generating...";
            finishBtn.disabled = true;

            try {
                // Prepare data for backend
                const roadmapRequest = {
                    goal: formData.target_role,
                    target_role: formData.target_role,
                    timeframe: formData.timeframe,
                    hours_per_week: formData.hours_per_week,
                    learning_style: formData.learning_style,
                    learning_speed: formData.learning_speed,
                    skill_level: formData.skill_level
                };

                // Use a direct fetch call instead of authenticatedFetch to avoid automatic redirect
                const token = localStorage.getItem('jwtToken');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await fetch(`${APP_BACKEND_URL}/api/generate_roadmap`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(roadmapRequest),
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        // Handle authentication error specifically
                        localStorage.removeItem('jwtToken');
                        throw new Error('Your session has expired. Please log in again.');
                    } else {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                }

                const data = await response.json();
                
                if (data.success) {
                    // Store roadmap data in localStorage
                    localStorage.setItem('roadmapData', JSON.stringify(data.roadmap));
                    
                    // Store user preferences for future reference
                    localStorage.setItem('userPreferences', JSON.stringify(formData));

                    // Redirect to Dashboard page
                    window.location.href = "../Dashboard/index.html";
                } else {
                    throw new Error(data.message || "Failed to generate roadmap");
                }

            } catch (error) {
                console.error("Error generating roadmap:", error);
                
                // Show user-friendly error message instead of redirecting
                if (error.message.includes('session has expired')) {
                    alert('Your session has expired. Please log in again.');
                    window.location.href = "../Login/index.html";
                } else {
                    alert("Failed to generate roadmap. Please try again.");
                    
                    // Reset button
                    finishBtn.textContent = "Generate roadmap";
                    finishBtn.disabled = false;
                }
            }
        });
    }

    // In your onboarding completion handler
    async function handleOnboardingComplete(roadmapData) {
        // Save roadmap data
        localStorage.setItem('roadmapData', JSON.stringify(roadmapData));
        localStorage.setItem('newRoadmapGenerated', 'true');
        
        // Redirect to dashboard
        window.location.href = '../Dashboard/index.html';
    }
});
