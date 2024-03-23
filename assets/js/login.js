// New Vue instance
var App = new Vue({
// Vue instance options here
    el: '#app', //
    data : {
        user_id : null,
        first_name : null,
        last_name : null,
        user_email : null,
        password : null,
        new_password : null,
        confirm_new_password: null,
        loginResponse: null,
        showResponse: true,
        registerResponse: null,
        loginStep: false,
        role: null,
    },
    methods : {
        verifyEmail : function(){
            this.showResponse = false;
            if (this.user_email != null){
                let postForm = new FormData();
                postForm.set("email", this.user_email)
                axios({
                    method: 'post',
                    url: '/verify_email',
                    data: postForm,
                    headers: {'Content-Type': 'multipart/form-data' }
                })
                .then(response => {
                    if (response.status !== 200) {
                        this.registerResponse = "Email Not Found"
                        this.showResponse = true;
                        return
                    }
                    console.log(response)
                    this.user_id = response.data["user_id"]
                    this.role = response.data["role"]
                    this.loginStep = true
                })
                .catch(error => {
                    this.registerResponse = "Email Not Found"
                    this.showResponse = true;
                });
            }
        },
        registerUser : function(){
            this.showResponse = false;
            if (this.new_password !== this.confirm_new_password){
                this.showResponse = true;
                this.registerResponse = "Passwords Do Not Match"
                return
            }
            if ((this.user_id == null) || (this.first_name == null) || (this.new_password == null) || (this.last_name == null) || (this.confirm_new_password == null)) {
                this.showResponse = true;
                this.registerResponse = "All Fields Required"
                return
            }
            let postForm = new FormData();
            postForm.set("user_id", this.user_id)
            postForm.set("password", this.new_password)
            postForm.set("first_name", this.first_name)
            postForm.set("last_name", this.last_name)
            postForm.set("role", this.role)
            axios({
                method: 'post',
                url: '/register_user',
                data: postForm,
                headers: {'Content-Type': 'multipart/form-data' }
            })
            .then(response => {
                if (response.status !== 200) {
                    this.registerResponse = "Registration Failed"
                    return
                }
                let token = response.data["token"];
                console.log(token)
                localStorage.setItem('snowpack_token', token)
                tokenJson = parseJwt(token)
                if (response.status === 200 && tokenJson["isStaff"] === true) {
                    window.location.assign("/admin");
                } else if (response.status === 200 && tokenJson["isStaff"] === false) {
                    window.location.assign("/cronos")
                }
                else {
                    this.registerResponse = "Registration Failed"
                }
            })
            .catch(error => {});
        },

        login : function(){
            this.showResponse = false;
            var postForm = new FormData();
            postForm.set("password", this.password)
            postForm.set("email", this.user_email)
            axios({
                method: 'post',
                url: '/verify_login',
                data: postForm,
                headers: {'Content-Type': 'multipart/form-data' }
            })
            .then(response => {
                if (response.status !== 200) {
                    this.showResponse = true;
                    this.loginResponse = response.data['message']
                    return
                }
                let token = response.data["token"];
                console.log(token)
                tokenJson = parseJwt(token)
                localStorage.setItem('snowpack_token', token)
                if (response.status === 200 && tokenJson["isStaff"] === true) {
                    window.location.assign("/admin");
                } else if (response.status === 200 && tokenJson["isStaff"] === false) {
                    window.location.assign("/cronos")
                }
                else {
                    this.registerResponse = "Registration Failed"
                }
            })
            .catch(error => {});
        },
    }
})

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

Vue.config.devtools = true;

