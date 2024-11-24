// Index.js supports the index page javascript functionality

// Add state management on the menu button
const openMenu = document.getElementById("openMenu");
const closeMenu = document.getElementById("closeMenu");
const menu = document.getElementById("menu");

openMenu.addEventListener("click", function(){
    if (menu.style.display === "none") {
        menu.style.display = "block";
    } else {
        menu.style.display = "none";
    }
});

closeMenu.addEventListener("click", function(){
    menu.style.display = "none";
    openMenu.style.display = "block";
});


// When Clicking on the Login Button execute an attempt to log in the user
// If a user has an access token, redirect them to the appropriate page (admin or cronos)
// Otherwise send them to the login page
const loginButton = document.getElementById("login");
loginButton.addEventListener("click", function(){
  // if we do not have a token, send them to the login page
    if (localStorage.snowpack_token === undefined) {
        location.href = "/login"
    }
  jsonpayload = parseJwt(localStorage.snowpack_token)
    if (jsonpayload.IsStaff === true) {
        location.href = "/admin"
    } else {
        location.href = "/cronos"
    }
})

// Parse JWT for persisted logins and check if we can route to the correct page
function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}