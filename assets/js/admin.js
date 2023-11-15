// New Vue instance
var App = new Vue({
// Vue instance options here
    el: '#app', //
    data : {
        workingScreen : {
            home : true,
            projects : false,
            accounts : false,
            staff : false,
            rates : false,
            billing_codes : false,
            clients : false,
        },
        users : null,
        staff : null,
        rates : null,
        billing_codes : null,
        accounts : null,
        projects : null,

        // This is the data that will be used to populate the detail view
        detailProject : null,
        selectedAccountName : null,
        detailAccount : null,
        detailBillingCode : null,
        detailRate : null,
        showDetail : false,
        isNew : false,
        showModal: false,
        selectedEntry: null,
        billingCategories : [
            { internal: true, name : "Internal Client Non-Billable", value: 'RATE_TYPE_INTERNAL_CLIENT_NON_BILLABLE' },
            { internal: true, name : "Internal Client", value: 'RATE_TYPE_INTERNAL_CLIENT_BILLABLE' },
            { internal: true, name : "Internal Administrative Non-Billable", value: 'RATE_TYPE_INTERNAL_ADMINISTRATIVE_NON_BILLABLE' },
            { internal: true, name : "Internal Administrative", value: 'RATE_TYPE_INTERNAL_ADMINISTRATIVE' },
            { internal: false, name : "External Client", value: 'RATE_TYPE_EXTERNAL_CLIENT_BILLABLE' },
            { internal: false, name : "External Client Non-Billable", value: 'RATE_TYPE_EXTERNAL_CLIENT_NON_BILLABLE' },
            { internal: true, name : "Internal Project", value: 'RATE_TYPE_INTERNAL_PROJECT' },
        ],
        accountTypes : [
            { internal : true, name: 'Internal', type: 'ACCOUNT_TYPE_INTERNAL'},
            { internal : false, name : 'Client', type: 'ACCOUNT_TYPE_CLIENT'},
        ],

        calendarWidth: 12.5, // Adjust as needed, represents the percentage width of the calendar
        hourBlockHeight: 40, // Adjust as needed, represents the height of each hour block in pixels
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        hours: ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'],
        // Example data for entries
        entries: [
            { id: 1, day: 'Monday', startHour: '8:00 AM', duration: 5, project: 'Project A' }, // spans 5 hours
            { id: 2, day: 'Wednesday', startHour: '11:00 AM', duration: 3, project: 'Project B' }, // spans 3 hours
            // Add more entries as needed
        ]
    },
    filters: {
        truncate: function (text, length, suffix) {
            if (text.length > length) {
                return text.substring(0, length) + suffix;
            } else {
                return text;
            }
        },
    },
    methods : {
        getEntries(day, hour) {
            return this.entries.filter(entry => entry.day === day && entry.startHour === hour);
        },
        calculateEntryHeight(entry) {
            const maxDuration = this.hours.length - this.hours.indexOf(entry.startHour);
            const maxBlockHeight = this.hourBlockHeight * maxDuration;
            const entryHeight = Math.min(entry.duration * this.hourBlockHeight, maxBlockHeight);
            return entryHeight;
        },

        calculateEntryTop(entry) {
            return 0
        },

        calculateEntryLeft(dayIndex) {
            const daysCount = this.days.length;
            return dayIndex * (this.calendarWidth / daysCount);
        },

        calculateEntryWidth(dayIndex) {
            const daysCount = this.days.length;
            return this.calendarWidth / daysCount;
        },

        updateEventSizes() {
            const columnWidth = this.getColumnWidth();
            const hourBlockHeight = this.getHourBlockHeight();
            console.log(columnWidth, hourBlockHeight)
            // Update the width and height of each event based on the column width and hour block height
            const entries = document.querySelectorAll('.entry');
            entries.forEach(entry => {
                entry.style.width = columnWidth + 'px';
                entry.style.height = this.calculateEntryHeight(entry, hourBlockHeight) + 'px';
            });
        },
        getHourBlockHeight() {
            // Calculate the height of each hour block
            const table = document.getElementById('calendar');
            const firstRowCells = table.rows[0].cells;

            // Use getComputedStyle to get the accurate height, including padding and borders
            const hourBlockHeight = getComputedStyle(firstRowCells[0]).height;

            return parseFloat(hourBlockHeight);
        },

        getColumnWidth() {
            // Calculate the width of each column
            const table = document.getElementById('calendar');
            const firstRowCells = table.rows[0].cells;
            const columnWidth = firstRowCells[1].getBoundingClientRect().width;

            return columnWidth * .95;
        },

        updateWorkingScreen(screen) {
            this.detailRate = null;
            this.detailBillingCode = null;
            this.detailProject = null;
            this.detailAccount = null;
            this.showDetail = false;
            for (var key in this.workingScreen) {
                this.workingScreen[key] = false;
            }
            this.workingScreen[screen] = true;
        },
        parseDate: function (text, format) {
            var date = Date.parse(text);
            if (format === 'datetime') {
                return date
            }
            return moment(date).format(format);
        },
        // All the standard fetchall methods to populate our page
        fetchStaff(){
            axios({
            method: 'get',
            url: '/api/staff',
            headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
            .then(response => {
                this.staff = response.data
            })
            .catch(error => {
                console.log(error)
            })
        },
        fetchProjects(){
            axios({
                method: 'get',
                url: '/api/projects',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
            .then(response => {
                this.projects = response.data
            })
            .catch(error => {
                console.log(error)
            })
        },
        fetchRates(){
            axios({
                method: 'get',
                url: '/api/rates',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
            .then(response => {
                this.rates = response.data
            })
            .catch(error => {
                console.log(error)
            })
        },
        fetchBillingCodes(){
            axios({
                method: 'get',
                url: '/api/billing_codes',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
            .then(response => {
                this.billing_codes = response.data
            })
            .catch(error => {
                console.log(error)
            })
        },
        fetchAccounts(){
            axios({
                method: 'get',
                url: '/api/accounts',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
            .then(response => {
                this.accounts = response.data
            })
            .catch(error => {
                console.log(error)
            })
        },
        exitDetail(detail_type) {
          this.showDetail = false;
        },
        editDetail(object, detail_type){
            this.showDetail = true;
            this.isNew = false;
            if (detail_type === 'project') {
                this.detailProject = object;
                this.detailProject.active_start_vis = this.parseDate(this.detailProject.active_start, 'yyyy-MM-DD');
                this.detailProject.active_end_vis = this.parseDate(this.detailProject.active_end, 'yyyy-MM-DD');
            } else if (detail_type === 'billing_code') {
                this.detailBillingCode = object;
                this.detailBillingCode.active_start_vis = this.parseDate(this.detailBillingCode.active_start, 'yyyy-MM-DD');
                this.detailBillingCode.active_end_vis = this.parseDate(this.detailBillingCode.active_end, 'yyyy-MM-DD');
            } else if (detail_type === 'rate') {
                this.detailRate = object;
                this.detailRate.active_start_vis = this.parseDate(this.detailRate.active_from, 'yyyy-MM-DD');
                this.detailRate.active_end_vis = this.parseDate(this.detailRate.active_to, 'yyyy-MM-DD');
            } else if (detail_type === 'account') {
                this.detailAccount = object;
            }
        },
        createNew(detail_type){
           this.showDetail = true;
           this.isNew = true;
           if (detail_type === 'project'){
               this.detailProject = {
                   name : '',
                   account : {},
                   budget_hours: 0,
                   budget_dollars: 0,
                   active_start_vis : null,
                   active_end_vis : null,
               };
           } else if (detail_type === 'billing_code') {
               this.detailBillingCode = {
                   name : '',
                   type : '',
                   code : '',
                   internal : null,
                   rate : {},
                   active_start : null,
                   active_end : null,
                   rate_id : null,
                   project: null,
               };
           } else if (detail_type === 'rate') {
               this.detailRate = {
                   name : '',
                   amount : null,
                   active_from : null,
                   active_to : null,
                   active_start_vis : null,
                   active_end_vis : null,
               };
           } else if (detail_type === 'account') {
               this.detailAccount = {
                   name : '',
                   website: '',
                   email : '',
                   clients :  null,
               };
           }
        },
        submitPostPut(detail_type){
            if (detail_type === 'project'){
                let postForm = new FormData();
                postForm.set("name", this.detailProject.name)
                postForm.set("account_id", this.detailProject.account.ID)
                postForm.set("budget_hours", this.detailProject.budget_hours)
                postForm.set("budget_dollars", this.detailProject.budget_dollars)
                postForm.set("active_start", this.parseDate(this.detailProject.active_start_vis, 'yyyy-MM-DDT00:00'))
                postForm.set("active_end", this.parseDate(this.detailProject.active_start_vis, 'yyyy-MM-DDT00:00'))
                postForm.set("internal", this.detailProject.internal)
                let selectedAccount = retrieveFromList(this.accounts, 'name', this.detailProject.account.name)
                postForm.set("account_id", selectedAccount.ID)
               if (this.isNew) {
                   method = 'post'
                   posturl = '/api/projects/0'
               } else {
                   method = 'put'
                   posturl = '/api/projects/' + this.detailProject.ID.toString()
               }
               axios({
                    method: method,
                    url: posturl,
                    headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                    data: postForm
               })
                .then(response => {
                    console.log(response)
                    this.detailProject = response.data
                    this.detailProject.active_start = this.parseDate(response.data.active_start, 'yyyy-MM-DD')
                    this.detailProject.active_end = this.parseDate(response.data.active_end, 'yyyy-MM-DD')
                    if (this.isNew) {
                        this.projects.push(this.detailProject)
                    } else {
                    }
                })
                .catch(error => {
                    console.log(error)
                })
            }else if (detail_type === 'billing_code'){
                // Duplicate the same logic for billing codes
                let postForm = new FormData();
                postForm.set("name", this.detailBillingCode.name)
                postForm.set("code", this.detailBillingCode.code)
                postForm.set("active_start", this.parseDate(this.detailBillingCode.active_start_vis, 'yyyy-MM-DDT00:00'))
                postForm.set("active_end", this.parseDate(this.detailBillingCode.active_start_vis, 'yyyy-MM-DDT00:00'))
                postForm.set("internal", this.detailBillingCode.internal)
                postForm.set('type', this.detailBillingCode.type)
                let selectedRate = retrieveFromList(this.rates, 'name', this.detailBillingCode.rate.name)
                postForm.set("rate_id", selectedRate.ID)
                postForm.set("project_id", this.detailBillingCode.project)
                if (this.isNew) {
                    method = 'post'
                    posturl = '/api/billing_codes/0'
                } else {
                    method = 'put'
                    posturl = '/api/billing_codes/' + this.detailBillingCode.ID.toString()
                }
                axios({
                    method: method,
                    url: posturl,
                    headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                    data: postForm
                })
                .then(response => {
                    console.log(response)
                    this.detailBillingCode = response.data
                    this.detailBillingCode.active_start = this.parseDate(response.data.active_start, 'yyyy-MM-DD')
                    this.detailBillingCode.active_end = this.parseDate(response.data.active_end, 'yyyy-MM-DD')
                    if (this.isNew) {
                        this.billing_codes.push(this.detailBillingCode)
                    } else {
                    }
                })
                .catch(error => {
                    console.log(error)
                })
            }else if (detail_type === 'rate'){
                // Duplicate the same logic for billing codes
                let postForm = new FormData();
                postForm.set("name", this.detailRate.name)
                postForm.set("amount", this.detailRate.amount)
                postForm.set("active_from", this.parseDate(this.detailRate.active_start_vis, 'yyyy-MM-DDT00:00'))
                postForm.set("active_to", this.parseDate(this.detailRate.active_start_vis, 'yyyy-MM-DDT00:00'))

                if (this.isNew) {
                    method = 'post'
                    posturl = '/api/rates/0'
                } else {
                    method = 'put'
                    posturl = '/api/rates/' + this.detailRate.ID.toString()
                }
                axios({
                    method: method,
                    url: posturl,
                    headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                    data: postForm
                })
                .then(response => {
                        console.log(response)
                        this.detailRate = response.data
                        this.detailRate.active_from = this.parseDate(response.data.active_from, 'yyyy-MM-DD')
                        this.detailRate.active_to = this.parseDate(response.data.active_to, 'yyyy-MM-DD')
                        if (this.isNew) {
                            this.rates.push(this.detailRate)
                        } else {
                        }
                    })
                    .catch(error => {
                        console.log(error)
                    })
            } else if (detail_type === 'account'){
                // Duplicate the same logic for billing codes
                let postForm = new FormData();
                postForm.set("name", this.detailAccount.name)
                postForm.set("website", this.detailAccount.website)
                postForm.set("email", this.detailAccount.email)
                postForm.set("type", this.detailAccount.type)
                postForm.set('legal_name', this.detailAccount.legal_name)
                if (this.isNew) {
                    method = 'post'
                    posturl = '/api/accounts/0'
                } else {
                    method = 'put'
                    posturl = '/api/accounts/' + this.detailAccount.ID.toString()
                }
                axios({
                    method: method,
                    url: posturl,
                    headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                    data: postForm
                })
                .then(response => {
                    console.log(response)
                    this.detailAccount = response.data
                    if (this.isNew) {
                        this.accounts.push(this.detailAccount)
                    } else {
                    }
                })
                .catch(error => {
                    console.log(error)
                })
            }
            this.showDetail = false;
        },
        deleteObject(object, object_type){
            if (object_type === 'project'){
                this.projects = this.projects.filter(function(el) { return el.ID !== object.ID; })
                axios({
                    method: 'delete',
                    url: '/api/projects/' + object.ID,
                    headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                })
                .then(response => {
                    console.log(response)
                    this.showDetail = false;
                })
                .catch(error => {
                    console.log(error)
                })
            } else if (object_type === 'billing_code'){
                this.billing_codes = this.billing_codes.filter(function(el) { return el.ID !== object.ID; })
                axios({
                    method: 'delete',
                    url: '/api/billing_codes/' + object.ID,
                    headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                })
                .then(response => {
                    console.log(response)
                    this.showDetail = false;
                })
                .catch(error => {
                    console.log(error)
                })
            } else if (object_type === 'rate'){
                this.rates = this.rates.filter(function(el) { return el.ID !== object.ID; })
                axios({
                    method: 'delete',
                    url: '/api/rates/' + object.ID,
                    headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                })
                .then(response => {
                    console.log(response)
                    this.showDetail = false;
                })
                .catch(error => {
                    console.log(error)
                })
            } else if (object_type === 'account'){
                this.accounts = this.accounts.filter(function(el) { return el.ID !== object.ID; })
                axios({
                    method: 'delete',
                    url: '/api/accounts/' + object.ID,
                    headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                })
                .then(response => {
                    console.log(response)
                    this.showDetail = false;
                })
                .catch(error => {
                    console.log(error)
                })
            }
        },
    },
    mounted() {
        // Call the updateEventSizes method on initial mount
        this.updateEventSizes();

        // Listen for window resize events and update event sizes
        window.addEventListener('resize', this.updateEventSizes);
    },
})

function retrieveFromList(list, key, value) {
    // This function will retrieve an object from a list
    // based on a key value pair
    for (var i = 0; i < list.length; i++) {
        if (list[i][key] === value) {
            return list[i];
        }
    }
}