document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('data-maturity-survey');
  const questions = document.querySelectorAll('.question');
  const nextButton = document.getElementById('next-btn');
  const prevButton = document.getElementById('prev-btn');
  const submitButton = document.getElementById('submit-btn');
  const emailInput = document.getElementById('email');
  const progressBar = document.getElementById('progress-bar');
  let currentQuestionIndex = 0;

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
      const emailError = document.getElementById('email-error');

      if (!emailValue) {
          emailError.style.display = 'block';
          emailError.textContent = "Please enter your email.";
          return false;
      } else if (!emailRegex.test(emailValue)) {
          emailError.style.display = 'block';
          emailError.textContent = "Please enter a valid email address.";
          return false;
      } else {
          emailError.style.display = 'none'; // Hide error if email is valid
          return true;
      }
  }

  // Check if the current question is answered
  function isCurrentQuestionAnswered() {
      const currentQuestion = questions[currentQuestionIndex];
      const radioInputs = currentQuestion.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      let isAnswered = false;

      // Check email validity for the first step
      if (currentQuestionIndex === 0) {
          return isEmailValid();
      }

      // Check if one of the radio buttons or checkboxes is selected for other questions
      radioInputs.forEach(input => {
          if (input.checked) isAnswered = true;
      });

      if (!isAnswered) {
          showError(currentQuestion, "Please select an option before proceeding.");
      } else {
          hideError(currentQuestion);
      }

      return isAnswered;
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
      if (isCurrentQuestionAnswered()) {
          questions[currentQuestionIndex].style.display = 'none';
          currentQuestionIndex++;
          questions[currentQuestionIndex].style.display = 'block';
          updateProgressBar();

          if (currentQuestionIndex === questions.length - 1) {
              nextButton.style.display = 'none';
              submitButton.style.display = 'block';
          } else {
              nextButton.style.display = 'block';
              submitButton.style.display = 'none';
          }

          if (currentQuestionIndex > 0) {
              prevButton.style.display = 'block';
          }

          // Show the progress bar after email input step
          if (currentQuestionIndex === 1) {
              progressBar.style.display = 'block';  // Show after email step
          }
      }
  });

  // Show the previous question
  prevButton.addEventListener('click', () => {
      questions[currentQuestionIndex].style.display = 'none';
      currentQuestionIndex--;
      questions[currentQuestionIndex].style.display = 'block';
      updateProgressBar();

      if (currentQuestionIndex === 0) {
          prevButton.style.display = 'none';
          progressBar.style.display = 'none';  // Hide progress bar on email input
      }

      nextButton.style.display = 'block';
      submitButton.style.display = 'none';
  });

  // Initialize progress bar and hide it initially
  progressBar.style.display = 'none';
  updateProgressBar();
});
