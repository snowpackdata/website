// New Vue instance
var App = new Vue({
// Vue instance options here
    el: '#app', //
    data : {
        invoices : [],
    },
    methods : {
        // Vue instance methods here
        filterInvoices(status) {
            try {
                let output = this.invoices.filter(function(el) { return el.state === status;})
                return output
            } catch {
                return []
            }
        },
        fetchInvoices(){
            axios({
                method: 'get',
                url: '/api/user/invoices',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
                .then (response => {
                    this.invoices = response.data
                })
                .catch(error => {
                    console.log(error)
                })
        },
        parseDate(text, format) {
            var date = null;
            if (text.match(/Z/i)) {
                let timezoneless = text.replace("Z", "");
                date = Date.parse(timezoneless);

            } else {
                date = Date.parse(text);
            }
            if (format === 'datetime') {
                return date
            }
            return moment(date).format(format);
        },
    },
})
Vue.config.devtools = true;

