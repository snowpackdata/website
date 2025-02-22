
const loginButton = document.getElementById('loginSubmit');
const loginEmail = document.getElementById('email');
const loginPassword = document.getElementById('password');
const loginError = document.getElementById('loginError');

loginButton.addEventListener('click', async (e) => {
    loginError.innerText = '';
    e.preventDefault();
    // Submit Login Form
    let postForm = new FormData();
    postForm.append('email', loginEmail.value);
    postForm.append('password', loginPassword.value);
    const requestOptions = {
      method: "POST",
      body: postForm,
      redirect: "follow"
    };
    fetch("/verify_login", requestOptions)
    .then((response) => response.text())
    .then((result) => {
        result = JSON.parse(result);
        if (result.status !== 200) {
            loginError.innerText = result.message;
            return;
        }
        let token = result.token;
        localStorage.setItem('snowpack_token', token);
        tokenJson = parseJwt(token);
        if (tokenJson.IsStaff === true) {
            window.location.assign('/admin');
        } else {
            window.location.assign('/cronos');
        }
    })
    .catch((error) => {
        console.log('error', error);
    });
    return
});

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}


