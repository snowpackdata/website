document.addEventListener('DOMContentLoaded', () => {
  const surveyForm = document.getElementById('data-maturity-survey');
  const startButton = document.getElementById('start-btn');
  const nextButton = document.getElementById('next-btn');
  const prevButton = document.getElementById('prev-btn');
  const submitButton = document.getElementById('submit-btn');
  const emailInput = document.getElementById('email');
  const companyNameInput = document.getElementById('company-name');
  const userRoleInput = document.getElementById('responder-title');
  const progressBar = document.getElementById('progress-bar');
  const progressContainer = document.querySelector('.progress-container');
  const navButtonContainer = document.querySelector('.navigation-button-container')
  const emailError = document.getElementById('email-error');
  let currentQuestionIndex = 0;
  let surveyId = null;

    // Function to validate email and show error if invalid
    function isEmailValid() {
      const emailValue = document.getElementById('email').value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailValue) {
          emailError.textContent = "Please enter your email.";
          emailError.style.display = 'block';
          return false;
      } else if (!emailRegex.test(emailValue)) {
          emailError.textContent = "Please enter a valid email address.";
          emailError.style.display = 'block';
          return false;
      } else {
          emailError.style.display = 'none';  // Hide error if email is valid
          return true;
      }
    }

    function handleStart() {
      console.log(isEmailValid())
      if (!isEmailValid()) {
          emailError.style.display = 'block';          
      } else {
          emailError.style.display = 'none';
          document.getElementById('email-question').style.display = 'none';  // Hide email question
          document.getElementById('user-info-question').style.display = 'block'; // Show user info question
          startButton.style.display = 'none'; // Hide Start button
          navButtonContainer.style.display = 'flex'; // Show Next/Previous navigation buttons
          navButtonContainer.style.justifyContent = 'right'; // Align Next button to the right
          currentQuestionIndex++;
          updateProgressBar();
          progressContainer.style.display = 'block'; // Show progress bar

          // API call to create the survey
          createOrUpdateSurvey();
      }
    }


    // Actions when "Next" button is clicked
    function handleNext() {
      progressContainer.style.display = 'block'; // Show progress bar
      if (isCurrentQuestionAnswered()) {
          // Save responses for the user info question (if it is the second question)
          if (currentQuestionIndex === 1) {
            // Call createOrUpdateSurvey at user-info question to update the overall survey
            createOrUpdateSurvey();
          } else {
            // Save response for other steps
            saveSurveyResponse(currentQuestionIndex);
          }

          questions[currentQuestionIndex].style.display = 'none';
          currentQuestionIndex++;
          questions[currentQuestionIndex].style.display = 'block';
          updateProgressBar();

          if (currentQuestionIndex > 1) {
            navButtonContainer.style.justifyContent = 'space-between';
          } // Ensure "next" button is always right-aligned

          if (currentQuestionIndex === questions.length - 1) {
              nextButton.style.display = 'none';
              submitButton.style.display = 'block';
          } else {
              nextButton.style.display = 'block';
              submitButton.style.display = 'none';
          }

          if (currentQuestionIndex > 1) {
              prevButton.style.display = 'block';
          }

        // API call to save the response for the current step
        postSurveyData(currentQuestionIndex);
        }
    }
  

    // Actions when "Previous" button is clicked
    function handlePrevious() {
      questions[currentQuestionIndex].style.display = 'none';
      currentQuestionIndex--;
      questions[currentQuestionIndex].style.display = 'block';
      hideError(questions[currentQuestionIndex]);
      updateProgressBar();

      if (currentQuestionIndex === 0) {
          prevButton.style.display = 'none';
          progressContainer.style.display = 'none';  // Hide progress bar on email input
          navButtonContainer.style.justifyContent = 'right'; // Ensure "next" button is right-aligned
      }

      if (currentQuestionIndex > 0) {
          navButtonContainer.style.justifyContent = 'space-between'; 
      } // Ensure "next" button is always right-aligned

      nextButton.style.display = 'block';
      submitButton.style.display = 'none';
    }

  // Actions when "Submit" button is clicked    
  function handleSubmit() {
    // Save the last response and mark the survey as complete
    saveSurveyResponse(currentQuestionIndex, true);  
  }

  // Function to create or update survey
  function createOrUpdateSurvey() {
    const surveyData = {
      survey_type: "data_maturity_benchmark", 
      user_email: emailInput.value,
      user_role: userRoleInput.value,
      company_name: companyNameInput.value,
    };

    fetch('/api/survey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(surveyData),
    })
    .then(response => response.json())
    .then(data => {
      surveyId = data.id;  // Store the survey ID for subsequent responses
    })
    .catch(error => {
      console.error('Error creating/updating survey:', error);
    });
  }

  // Function to save survey response
  function saveSurveyResponse(stepIndex, isComplete = false) {
    if (!surveyId) {
      console.error("Survey ID is missing. Cannot save response.");
      return;
    }

    const currentQuestion = questions[stepIndex];
    const questionText = currentQuestion.querySelector('label').innerText.trim();
    const structuredAnswer = Array.from(currentQuestion.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked'))
                                 .map(input => input.value)
                                 .join(',');
    const freeformAnswer = currentQuestion.querySelector('textarea')?.value || '';

    const responseData = {
      step: stepIndex + 1,
      question: questionText,
      structured_answer: structuredAnswer,
      unstructured_answer: freeformAnswer,
      completed: isComplete
    };

    fetch(`/api/survey-response/${surveyId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Survey response saved:', data);
    })
    .catch(error => {
      console.error('Error saving survey response:', error);
    });
  }

  // Check if the current question is answered
  function isCurrentQuestionAnswered() {
    const currentQuestion = questions[currentQuestionIndex];
    const radioInputs = currentQuestion.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    const companyInput = currentQuestion.querySelector('input[id="company-name"]');
    const titleInput = currentQuestion.querySelector('input[id="responder-title"]');
    let isAnswered = false;
    let isFilledIn = false;

    // Skip email step validation
    if (currentQuestionIndex === 0) {
        return true;  // Email already validated
    }

    // If question 1 (user info), make sure text inputs have been filled in
    if (currentQuestionIndex === 1) {
      if (companyInput.value.trim().length >= 3 && titleInput.value.trim().length >= 3) {
        isFilledIn = true;
      } else {
        isFilledIn = false;
      }
    }

    // Check if one of the radio buttons or checkboxes is selected for other questions
    radioInputs.forEach(input => {
        if (input.checked) isAnswered = true;
    });

    if (currentQuestionIndex === 1 && !isFilledIn) {
        showError(currentQuestion, "Please fill in both fields to begin.");
    } else if (!isAnswered) {
        showError(currentQuestion, "Please select an option before proceeding.");
    } else {
        hideError(currentQuestion);
    }

    if (currentQuestionIndex === 1) {
      return isFilledIn;
    } else {
      return isAnswered;
    }
  }
  
  // Function to show error messages below the question/input
  function showError(element, message) {
    let errorElement = element.querySelector('.error-message');
    errorElement.innerText = message;
    errorElement.style.display = 'block';
  }

  // Function to hide error messages
  function hideError(element) {
    const errorElement = element.querySelector('.error-message');
    if (errorElement) {
        errorElement.innerText = '';
        errorElement.style.display = 'none';
    }
  }

  // Update progress bar
  function updateProgressBar() {
    const progress = (currentQuestionIndex / (questions.length - 1)) * 100;
    progressBar.style.width = `${progress}%`;
  }

  // Add event listeners after defining the functions
  startButton.addEventListener('click', handleStart);
  nextButton.addEventListener('click', handleNext);
  prevButton.addEventListener('click', handlePrevious);
  submitButton.addEventListener('click', handleSubmit);

  const questions = Array.from(document.getElementsByClassName('question'));
  // Show the first question and hide the others
  questions.forEach((q, index) => q.style.display = index === currentQuestionIndex ? 'block' : 'none');

  // Initialize progress bar and hide it initially
  progressContainer.style.display = 'none';  // Hide progress container initially
  updateProgressBar();

});
