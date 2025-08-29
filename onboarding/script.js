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

    // Handle input field (Step 2)
    if (targetRoleInput) {
        targetRoleInput.addEventListener('input', function() {
            const nextBtn = steps[1].querySelector('.next-btn');
            if (this.value.trim() !== '') {
                enableNextButton(1);
                formData.target_role = this.value.trim();
                updateStepCompletion();
            } else {
                disableNextButton(1);
                formData.target_role = '';
                updateStepCompletion();
            }
        });
    }

    // Handle next button clicks
    nextButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Store target role when moving from step 2
            if (currentStep === 2 && targetRoleInput) {
                formData.target_role = targetRoleInput.value.trim();
            }
            
            if (currentStep < steps.length) {
                steps[currentStep - 1].classList.remove('active');
                steps[currentStep].classList.add('active');
                currentStep++;
                updateProgressBar();
            }
        });
    });

    // Handle back button clicks
    backButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentStep > 1) {
                steps[currentStep - 1].classList.remove('active');
                steps[currentStep - 2].classList.add('active');
                currentStep--;
                updateProgressBar();
                
                // Clear form data for steps after current step to prevent validation issues
                clearFormDataAfterStep(currentStep);
            }
        });
    });
    
    // Function to clear form data for steps after current step
    function clearFormDataAfterStep(step) {
        if (step < 5) formData.learning_style = '';
        if (step < 6) formData.learning_speed = '';
        if (step < 7) formData.skill_level = '';
        console.log('Form data after clearing:', formData);
    }

    // Helper functions
    function updateProgressBar() {
        const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function enableNextButton(stepIndex) {
        const nextBtn = steps[stepIndex].querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.removeAttribute('disabled');
            nextBtn.style.background = '#FF9E00';
        }
    }

    function disableNextButton(stepIndex) {
        const nextBtn = steps[stepIndex].querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.setAttribute('disabled', '');
            nextBtn.style.background = '#B9B9B9';
        }
    }

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

                // Send to backend
                const response = await fetch(
                  "https://backend-b7ak.onrender.com/api/generate_roadmap",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(roadmapRequest),
                  }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.success) {
                    // Store roadmap data and user ID in localStorage
                    localStorage.setItem('roadmapData', JSON.stringify(data.roadmap));
                    localStorage.setItem('userId', data.user_id);

                    // Redirect to Dashboard page
                    window.location.href = "../Dashboard/index.html";
                } else {
                    throw new Error(data.message || "Failed to generate roadmap");
                }

            } catch (error) {
                console.error("Error generating roadmap:", error);
                alert("Failed to generate roadmap. Please try again.");
                
                // Reset button
                finishBtn.textContent = "Generate roadmap";
                finishBtn.disabled = false;
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
