document.getElementById('data-maturity-survey').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent form from submitting the default way

  const emailField = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  
  // Clear any previous error messages
  emailError.textContent = '';
  
  // Basic email validation
  if (!emailField.value) {
      emailError.textContent = 'Email is required to receive your results and benchmarking summary.';
      return;  // Stop form submission
  } else if (!validateEmail(emailField.value)) {
      emailError.textContent = 'Please enter a valid email address.';
      return;  // Stop form submission
  }

  // Gather all responses
  const formData = {
      email: emailField.value,
      responses: getSurveyResponses()
  };

  // Now send the data to the backend (e.g., via an API or server)
  sendSurveyData(formData);
});

function validateEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

function getSurveyResponses() {
  const responses = {};

  // Loop through each question
  const questions = document.querySelectorAll('.question');
  questions.forEach((question, index) => {
      const questionId = `q${index + 1}`;
      const selectedOption = document.querySelector(`input[name="${questionId}"]:checked`);
      const additionalText = question.querySelector('textarea').value || '';

      responses[questionId] = {
          answer: selectedOption ? selectedOption.value : null,
          additionalInfo: additionalText
      };
  });

  return responses;
}

function sendSurveyData(formData) {
  // Assuming you have a backend endpoint to receive the data, such as:
  // POST /submit-survey
  fetch('/submit-survey', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
      console.log('Success:', data);
      alert('Survey submitted successfully!');
  })
  .catch((error) => {
      console.error('Error:', error);
      alert('There was an issue submitting the survey.');
  });
}
