
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

sendButton.addEventListener('click',  sendMessage);