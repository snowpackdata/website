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
  let surveyId = 0;

  // Add event listeners to the buttons
  startButton.addEventListener('click', handleStart);
  nextButton.addEventListener('click', handleNext);
  prevButton.addEventListener('click', handlePrevious);
  submitButton.addEventListener('click', handleSubmit);

  // FORM SUBMISSION HANDLER
  async function submitJsonAsForm(jsonObject, actionUrl) {
    // Create a form element
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = actionUrl;

    // Iterate over the JSON object and create input elements
    for (const key in jsonObject) {
        if (jsonObject.hasOwnProperty(key)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = jsonObject[key];
            form.appendChild(input);
        }
    }

    // Create a FormData object from the form
    const formData = new FormData(form);

    // Use fetch to submit the form and return the response
    const response = await fetch(actionUrl, {
      method: 'POST',
      body: formData
      });
    // Parse the response as JSON
    const responseData = response.json();
    return responseData;
  }

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
    if (!isEmailValid()) {
        emailError.style.display = 'block';          
    } 
    if(isEmailValid() && isCurrentQuestionAnswered()) {
        emailError.style.display = 'none';
        document.getElementById('email-question').style.display = 'none';  // Hide email question
        startButton.style.display = 'none'; // Hide Start button
        navButtonContainer.style.display = 'flex'; // Show Next/Previous navigation buttons
        navButtonContainer.style.justifyContent = 'right'; // Align Next button to the right
        currentQuestionIndex++;
        questions[currentQuestionIndex].style.display = 'block';
        updateProgressBar();
        progressContainer.style.display = 'block'; // Show progress bar
        nextButton.style.display = 'block'; // Show next button

        // API call to create the survey
        createOrUpdateSurvey();
    }
  }


  // Actions when "Next" button is clicked
  function handleNext() {
    progressContainer.style.display = 'block'; // Show progress bar
    if (isCurrentQuestionAnswered()) {
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
      saveSurveyResponse(currentQuestionIndex-1);
      }
  }
  

  // Actions when "Previous" button is clicked
  function handlePrevious() {
    questions[currentQuestionIndex].style.display = 'none';
    currentQuestionIndex--;
    questions[currentQuestionIndex].style.display = 'block';
    hideError(questions[currentQuestionIndex]);
    updateProgressBar();

    if (currentQuestionIndex === 1) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'block';
        navButtonContainer.style.justifyContent = 'right'; // Align Next button to the right
    }

    if (currentQuestionIndex > 1) {
        navButtonContainer.style.justifyContent = 'space-between'; // Ensure "next" button is always right-aligned
        nextButton.style.display = 'block';
    } 

    submitButton.style.display = 'none';
  }

  // Actions when "Submit" button is clicked    
  function handleSubmit(event) {
    // Prevent the form from reloading the page
    event.preventDefault();

    // Save the last response and mark the survey as complete
    saveSurveyResponse(currentQuestionIndex, true)
      .then(() => {
        // questions[currentQuestionIndex].style.display = 'none'; // Hide the current question
        // submitButton.style.display = 'none'; // Hide the submit button
        // progressContainer.style.display = 'none'; // Hide the progress bar
        const surveyContainer = document.querySelector('.survey-container');
        surveyContainer.style.display = 'none'; // Hide the entire survey container

        // Show the confirmation screen
        const confirmationScreen = document.querySelector('.confirmation-screen-container');
        confirmationScreen.style.display = 'block';
    })
    .catch(error => {
      console.error("Error submitting final response:", error);
    });
  }

  // Function to create or update survey
  async function createOrUpdateSurvey() {
    const surveyData = {
      survey_type: "data_maturity_benchmark", 
      user_email: emailInput.value,
      user_role: userRoleInput.value,
      company_name: companyNameInput.value,
    };
    // You will need to await for the response to get the survey ID
    // these functions are asynchronous because they are network requests so
    // if you don't include the await keyword the code will continue to run
    await submitJsonAsForm(surveyData, '/surveys/new')
        .then(data => {
            // Here we can handle the return data
            console.log(data);
            surveyId = data.ID
        })
        .catch(error => console.error(error));
  }

  // Function to save survey response
  async function saveSurveyResponse(stepIndex, isComplete = false) {
    if (!surveyId) {
      console.error("Survey ID is missing. Cannot save response.");
      return;
    }

    const currentQuestion = questions[stepIndex];
    const questionText = currentQuestion.querySelector('label').innerText.trim();
    const inputs = Array.from(currentQuestion.querySelectorAll('input[type="radio"], input[type="checkbox"]'));
    const selectedInputs = inputs.filter(input => input.checked)
    const structuredAnswer = selectedInputs.map(input => input.value).join(',');
    const freeformAnswer = currentQuestion.querySelector('textarea')?.value || '';
    let answerType = '';

    // Get answer type based on the first input type found
    if (selectedInputs.length > 0) {
        answerType = selectedInputs[0].type; // Will be either 'radio' or 'checkbox'
    }

    const responseData = {
      step: stepIndex,
      question: questionText,
      structured_answer: structuredAnswer,
      answer_type: answerType,
      unstructured_answer: freeformAnswer,
      completed: isComplete,
      survey_id: surveyId
    };

    // You will need to await for the response to get the survey ID
    // these functions are asynchronous because they are network requests so
    // if you don't include the await keyword the code will continue to run
    await submitJsonAsForm(responseData, `/surveys/${surveyId}/response`)
        .then(data => {
            // Here we can handle the return data
            console.log(data);
        })
        .catch(error => console.error(error));
  }

    // Check if the current question is answered
    function isCurrentQuestionAnswered() {
      const currentQuestion = questions[currentQuestionIndex];
      const radioInputs = currentQuestion.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      const companyInput = currentQuestion.querySelector('input[id="company-name"]');
      const titleInput = currentQuestion.querySelector('input[id="responder-title"]');
      let isAnswered = false;
      let isFilledIn = false;
  
      // If question 1 (user info), make sure text inputs have been filled in
      if (currentQuestionIndex === 0) {
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
  
      if (currentQuestionIndex === 0 && !isFilledIn) {
          showError(currentQuestion, "Please fill in both fields to begin.");
      } else if (!isAnswered) {
          showError(currentQuestion, "Please select an option before proceeding.");
      } else {
          hideError(currentQuestion);
      }
  
      if (currentQuestionIndex === 0) {
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

  const questions = Array.from(document.getElementsByClassName('question'));
  // Show the first question and hide the others
  questions.forEach((q, index) => q.style.display = index === currentQuestionIndex ? 'block' : 'none');

  // Initialize progress bar and hide it initially
  progressContainer.style.display = 'none';  // Hide progress container initially
  updateProgressBar();

});
