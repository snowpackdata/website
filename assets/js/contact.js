
// Add a module to allow the user to send a message to the website owner
// This module will be used in the contact.html page

const company = document.getElementById('company');
const firstName = document.getElementById('first-name');
const lastName = document.getElementById('last-name');
const email = document.getElementById('email');
const message = document.getElementById('message');
const success = document.getElementById('emailSuccess');
const error = document.getElementById('emailError');
const sendButton = document.getElementById('send-email');
const emailError = document.getElementById('email-error');
const emailErrorIcon = document.getElementById('error-icon');
const messageError = document.getElementById('message-error');


// Function to validate email and show error if invalid
function isEmailValid() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim()) {
        emailError.textContent = "Please enter your email.";
        emailError.style.display = 'block';
        emailErrorIcon.style.display = 'flex';
        return false;
    } else if (!emailRegex.test(email.value)) {
        emailError.textContent = "Please enter a valid email address.";
        emailError.style.display = 'block';
        emailErrorIcon.style.display = 'flex';
        return false;
    } else {
        emailError.style.display = 'none';  // Hide error if email is valid
        emailErrorIcon.style.display = 'none';
        return true;
    }
  }

function isMessageValid() {
    if (!message.value.trim()) {
        messageError.textContent = "Please include a message in your response.";
        messageError.style.display = 'block';
        return false;
    } else {
        messageError.style.display = 'none';
        return true;
    }
}


function submitForm() {
    const isEmailOk = isEmailValid();
    const isMessageOk = isMessageValid();

    if (isEmailOk && isMessageOk) {
        console.log('Success!');
    }
    // sendMessage();

}


async function sendMessage() {
    console.log('Sending Message');

    // Submit Login Form
    let postForm = new FormData();
    postForm.append('email', email.value);
    postForm.append('first_name', firstName.value);
    postForm.append('last_name', lastName.value);
    postForm.append('company', company.value);
    postForm.append('message', message.value);
    const requestOptions = {
      method: "POST",
      body: postForm,
      redirect: "follow"
    };
    fetch("/contact-us-submit", requestOptions)
        .then((response) => {
            if (response.status !== 200) {
                error.style.display = "block";
                console.log(response)
                return
            }
            if (response.status === 200) {
                success.style.display = "block";
                sendButton.style.display = 'none';
            }
        })
        .catch((error) => {
            console.log('error', error);
        });
}


sendButton.addEventListener('click',  submitForm);
