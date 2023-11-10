// New Vue instance
var App = new Vue({
// Vue instance options here
    el: '#app', //
    data : {
        testValue: "hello world",
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
                if (response.status === 200) {
                    window.location.assign("/admin");
                } else {
                 window.location.assign("/cronos")
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
                localStorage.setItem('snowpack_token', token)
                window.location.assign("/home");
            })
            .catch(error => {});
        },
    }
})
Vue.config.devtools = true;

