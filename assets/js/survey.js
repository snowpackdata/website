document.addEventListener('DOMContentLoaded', () => {
  const surveyForm = document.getElementById('data-maturity-survey');
  const startBtn = document.getElementById('start-btn');
  const nextButton = document.getElementById('next-btn');
  const prevButton = document.getElementById('prev-btn');
  const submitButton = document.getElementById('submit-btn');
  const emailInput = document.getElementById('email');
  const progressBar = document.getElementById('progress-bar');
  const progressContainer = document.querySelector('.progress-container');
  const navButtonContainer = document.querySelector('.navigation-button-container')
  const emailError = document.getElementById('email-error');
  let currentQuestionIndex = 0;

  const questions = Array.from(document.getElementsByClassName('question'));
  questions.forEach((q, index) => q.style.display = index === currentQuestionIndex ? 'block' : 'none');

  startBtn.addEventListener('click', function() {
      if (!isEmailValid()) {
          emailError.style.display = 'block';
      } else {
          emailError.style.display = 'none';
          document.getElementById('email-question').style.display = 'none';  // Hide email question
          questions[1].style.display = 'block';                              // Show the first question
          startBtn.style.display = 'none';                                   // Hide Start button
          navButtonContainer.style.display = 'flex';
          navButtonContainer.style.justifyContent = 'right';
          currentQuestionIndex++;
          updateProgressBar();
          progressContainer.style.display = 'block';                         // Show progress bar
      }
  });

  // Show the first question and hide the others
  questions.forEach((question, index) => {
      if (index !== currentQuestionIndex) question.style.display = 'none';
  });

  // Update progress bar
  function updateProgressBar() {
      const progress = (currentQuestionIndex / (questions.length - 1)) * 100;
      progressBar.style.width = `${progress}%`;
  }

  // Function to validate email and show error if invalid
  function isEmailValid() {
      const emailValue = emailInput.value.trim();
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
        if (companyInput.value.length >= 3 && titleInput.value.length >= 3) {
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

  // Show the next question
  nextButton.addEventListener('click', () => {
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
      }
  });

  // Show the previous question
  prevButton.addEventListener('click', () => {
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
  });

  // Initialize progress bar and hide it initially
  progressContainer.style.display = 'none';  // Hide progress container initially
  updateProgressBar();
});
