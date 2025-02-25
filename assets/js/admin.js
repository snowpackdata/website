var App = new Vue({
// Vue instance options here
    el: '#app', //
    data : {
        workingScreen : {
            home : true,
            admin: false,
            invoices: false,
            bills: false,
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
        active_billing_codes: null,
        accounts : null,
        projects : null,
        draftInvoices : null,
        acceptedInvoices: null,
        staffBills : null,
        projectTypes: [
            { name : 'New Business', value: 'PROJECT_TYPE_NEW'},
            { name : 'Existing Business', value: 'PROJECT_TYPE_EXISTING'},
        ],

        // This is the data that will be used to populate the detail view
        detailProject : null,
        selectedAccountName : null,
        detailAccount : null,
        detailBillingCode : null,
        detailRate : null,
        showDetail : false,
        isNew : false,
        showModal: false,
        selectedEntry: {
            billing_code_id:  null,
            billing_code : null,
            entry_id: null,
            notes: null,
            start: null,
            end: null,
            start_hour: null,
            start_day_of_week: null,
            duration_hours: null,

        },
        invitedUserEmail : null,
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
        billingFrequencies: [
            { name : 'Monthly', value: 'BILLING_TYPE_MONTHLY'},
            { name : 'Project', value: 'BILLING_TYPE_PROJECT'},
            { name : 'BiWeekly', value: 'BILLING_TYPE_BIWEEKLY'},
            { name : 'Weekly', value: 'BILLING_TYPE_WEEKLY'},
        ],
        adjustmentTypes : [
            {name : 'Credit', value : 'ADJUSTMENT_TYPE_CREDIT', factor : -1},
            {name : 'Fee', value: 'ADJUSTMENT_TYPE_FEE', factor : 1},
        ],
        newAdjustment : {type : '', amount: 0, notes: ''},
        calendarWidth: 135, // Adjust as needed, represents the percentage width of the calendar
        hourBlockHeight: 45, // Adjust as needed, represents the height of each hour block in pixels
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        currentWeek : Date,
        currentWeekDays : [Date],
        currentWeekDaysFormatted : [],
        hours : [
            {hour: 8, display: '8:00 AM'},
            {hour: 9, display : '9:00 AM'},
            {hour: 10, display: '10:00 AM'},
            {hour: 11, display: '11:00 AM'},
            {hour: 12, display: '12:00 PM'},
            {hour: 13, display: '1:00 PM'},
            {hour: 14, display: '2:00 PM'},
            {hour: 15, display: '3:00 PM'},
            {hour: 16, display: '4:00 PM'},
            {hour: 17, display: '5:00 PM'},
            {hour: 18, display: '6:00 PM'},
            {hour: 19, display: '7:00 PM'},
            {hour: 20, display: '8:00 PM'},
            {hour: 21, display: '9:00 PM'},
            {hour: 22, display: '10:00 PM'}
        ],
        // Example data for entries
        entries: [],
        weeklyEntries : [],

        // Data for dragging
        isDragging: false,
        dragDate: null,
        dragStartHour: null,
        dragEndHour: null,
    },
    filters: {
        truncate: function (text, length, suffix) {
            if (text.length > length) {
                return text.substring(0, length) + suffix;
            } else {
                return text;
            }
        },
        currency(value) {
            return new Intl.NumberFormat("en-US",
        { style: "currency", currency: "USD" }).format(value);
        },
        round(value, decimals = 2) {
            const factor = Math.pow(10, decimals);
            return Math.round(value * factor) / factor;
        },
        generateInvoiceNumber(invoiceId) {
            const year = new Date().getFullYear();
            return year.toString() + "00" + invoiceId.toString();
        }
    },
    methods : {
        editEntry(invoice, entry) {
            this.$set(entry, 'editable', true);
            entry.editable = true;
        },
        updateEditedValue(entry, event) {
            const newValue = event.target.innerText;
            entry.notes = newValue;
        },
        saveEntry(invoice, entry) {
            this.$set(entry, 'editable', false);
            entry.editable = false;
            let postForm = new FormData();
            postForm.set("notes", entry.notes)
            axios({
                method: 'put',
                url: '/api/entries/' + entry.entry_id.toString(),
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                data: postForm,
            })
            .then(response => {
                console.log(response)
                entry = response.data
            })
            .catch(error => {
                console.log(error)
            })
        },
        toggleVoidEntry(invoice, entry) {
            if (entry.state === 'ENTRY_STATE_VOID') {
                newStatus = 'draft'
                entry.state = 'ENTRY_STATE_DRAFT'
                this.$set(entry, 'editable', false);
                invoice.total_hours = invoice.total_hours + entry.duration_hours;
                invoice.total_fees = invoice.total_fees + entry.fee;
                invoice.total_amount = invoice.total_fees + invoice.total_adjustments;
            } else {
                newStatus = 'void'
                this.$set(entry, 'editable', false);
                entry.editable = false;
                entry.state = 'ENTRY_STATE_VOID';
                invoice.total_hours = invoice.total_hours - entry.duration_hours;
                invoice.total_fees = invoice.total_fees - entry.fee;
                invoice.total_amount = invoice.total_fees + invoice.adjustments;
            }
            axios({
                method: 'post',
                url: '/api/entries/state/' + entry.entry_id.toString() + '/' + newStatus,
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
            .then(response => {
                console.log(response)
                entry.state = response.data.State
            })
            .catch(error => {
                console.log(error)
            })

        },
        editAdjustment(invoice, adjustment) {
            this.$set(adjustment, 'editable', true);
            adjustment.editable = true;
        },
        updateAdjustmentValue(adjustment, value, event) {
            var newValue = event.target.innerText;
            if (value === 'amount') {
                // strip off the dollar sign if it's there
                newValue = newValue.replace('$', '');
                newValue = parseFloat(newValue);
            }
            adjustment[value] = newValue;
        },
        saveAdjustment(invoice, adjustment) {
            this.$set(adjustment, 'editable', false);
            adjustment.editable = false;
            let postForm = new FormData();
            postForm.set("notes", adjustment.notes)
            postForm.set("amount", adjustment.amount)
            axios({
                method: 'put',
                url: '/api/adjustments/' + adjustment.ID.toString(),
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                data: postForm,
            })
            .then(response => {
                console.log(response)
                adjustment = response.data
                multiplier = 1.0
                if (adjustment.type === 'ADJUSTMENT_TYPE_CREDIT') {
                    multiplier = -1
                }
                // re-sum the total adjustments
                invoice.total_adjustments = 0;
                invoice.adjustments.forEach(adjustment => {
                    multiplier = 1.0
                    if (adjustment.type === 'ADJUSTMENT_TYPE_CREDIT') {
                        multiplier = -1
                    }
                    invoice.total_adjustments = invoice.total_adjustments + (adjustment.amount * multiplier);
                })
                invoice.total_amount = invoice.total_fees + invoice.total_adjustments;
            })
            .catch(error => {
                console.log(error)
            })
        },
        toggleVoidAdjustment(invoice, adjustment) {
            multiplier = 1.0
            if (adjustment.type === 'ADJUSTMENT_TYPE_CREDIT') {
                multiplier = -1
            }
            if (adjustment.state === 'ADJUSTMENT_STATE_VOID') {
                newStatus = 'draft'
                adjustment.state = 'ADJUSTMENT_STATE_DRAFT'
                this.$set(adjustment, 'editable', false);
                invoice.total_adjustments = invoice.total_adjustments + (adjustment.amount * multiplier);
                invoice.total_amount = invoice.total_fees + invoice.total_adjustments;
            } else {
                newStatus = 'void'
                this.$set(adjustment, 'editable', false);
                adjustment.editable = false;
                adjustment.state = 'ADJUSTMENT_STATE_VOID';
                invoice.total_adjustments = invoice.total_adjustments - (adjustment.amount * multiplier);
                invoice.total_amount = invoice.total_fees + invoice.total_adjustments;

            }
            axios({
                method: 'post',
                url: '/api/adjustments/state/' + adjustment.ID.toString() + '/' + newStatus,
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
                .then(response => {
                    console.log(response)
                    adjustment.state = response.data.state
                })
                .catch(error => {
                    console.log(error)
                })
        },
        getAdjustmentType(type) {
            let index = this.adjustmentTypes.findIndex(x => x.value === type);
            return this.adjustmentTypes[index];
        },
        addInvoiceAdjustment(invoice) {
            let postForm = new FormData();
            postForm.set("invoice_id", this.newAdjustment.invoice_id)
            postForm.set("type", this.newAdjustment.type)
            postForm.set("amount", this.newAdjustment.amount)
            postForm.set("notes", this.newAdjustment.notes)
            axios({
                method: 'post',
                url: '/api/adjustments/0',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                data: postForm,
            })
            .then(response => {
                console.log(response)
                adjustment = response.data
                invoice.adjustments.push(adjustment)
                multiplier = 1.0
                if (adjustment.type === 'ADJUSTMENT_TYPE_CREDIT') {
                    multiplier = -1
                }
                invoice.total_adjustments = invoice.total_adjustments + (adjustment.amount * multiplier);
                invoice.total_amount = invoice.total_fees + invoice.total_adjustments;
                this.hideAdjustmentModal();
            })
            .catch(error => {
                alert(error)
            })
        },
        markInvoiceApproved(invoice) {
            axios({
                method: 'post',
                url: '/api/invoices/' + invoice.ID.toString() + '/approve',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
                .then(response => {
                    console.log(response)
                    invoice.State = response.data.State
                })
                .catch(error => {
                    console.log(error)
                })
            this.draftInvoices = this.draftInvoices.filter(function(el) { return el.ID !== invoice.ID; })
        },
        markInvoiceSent(invoice) {
            axios({
                method: 'post',
                url: '/api/invoices/' + invoice.ID.toString() + '/send',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
                .then(response => {
                    console.log(response)
                    invoice.State = response.data.State
                })
                .catch(error => {
                    console.log(error)
                })
            this.acceptedInvoices = this.fetchAcceptedInvoices();
        },
        markInvoicePaid(invoice) {
            axios({
                method: 'post',
                url: '/api/invoices/' + invoice.ID.toString() + '/paid',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
                .then(response => {
                    console.log(response)
                    invoice.State = response.data.State
                })
                .catch(error => {
                    console.log(error)
                })
            this.acceptedInvoices = this.fetchAcceptedInvoices();
        },
        markInvoiceVoid(invoice) {
            axios({
                method: 'post',
                url: '/api/invoices/' + invoice.ID.toString() + '/void',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
                .then(response => {
                    console.log(response)
                    invoice.State = response.data.State
                })
                .catch(error => {
                    console.log(error)
                })
            this.fetchAcceptedInvoices();
        },

        markBillPaid(bill) {
            axios({
                method: 'post',
                url: '/api/bills/' + bill.ID.toString() + '/paid',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
                .then(response => {
                    console.log(response)
                })
                .catch(error => {
                    console.log(error)
                })
            this.fetchBills();
        },
        markBillVoid(bill) {
            axios({
                method: 'post',
                url: '/api/bills/' + bill.ID.toString() + '/void',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
                .then(response => {
                    console.log(response)
                })
                .catch(error => {
                    console.log(error)
                })
            this.fetchBills();
        },

        refreshBill(bill) {
            axios({
                method: 'post',
                url: '/api/bills/' + bill.ID.toString() + '/regenerate',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
                .then(response => {
                    console.log(response)
                })
                .catch(error => {
                    console.log(error)
                })
            console.log('testing')
            window.location.reload();
        },

        getEntries(day, hour) {
            return this.weeklyEntries.filter(entry => (entry.start_day_of_week === day && entry.start_hour === hour));
        },
       // Functions used to calculate the position and size of each entry
        calculateEntryTop(entry) {
            // Use the minutes to calculate the top position of the entry in relation to the current cell
            const top = (entry.start_minute / 60) * this.hourBlockHeight;
            return top
        },

        calculateEntryLeft(pageEntry, dayIndex, hourIndex) {
                let entries = this.getEntries(dayIndex, hourIndex);
                if (entries.length <= 1) {
                    return 0;
                }
                // If it's greater than 0, sort the entries by entry_id
                entries.sort((a, b) => (a.entry_id > b.entry_id) ? 1 : -1);
                // find what index number this entry is in the list of entries for this hour
                let index = entries.findIndex(entry => entry.entry_id === pageEntry.entry_id);
                // calculate the left
                return (index * (this.getColumnWidth()/entries.length)) + (index*2) // add 4px for each entry to account for margin;

        },

        calculateEntryHeight(entry) {
            const maxDuration = this.hours.length - this.hours.indexOf(entry.start_hour);
            const maxBlockHeight = this.hourBlockHeight * maxDuration;
            const entryHeight = Math.min(entry.duration_hours * this.hourBlockHeight, maxBlockHeight);
            return entryHeight - 4 // account for margin;
        },

        calculateEntryWidth(day, hourIndex) {
            let entries = this.getEntries(day, hourIndex);
            if (entries.length <= 1) {
                return this.getColumnWidth();
            }
            return ((this.getColumnWidth()/entries.length) - (entries.length*2)) // subtract 4px for each entry to account for margin;
        },

        displayEntryState(state) {
            const stateMapping = {
                ENTRY_STATE_UNAFFILIATED: 'Unaffiliated',
                ENTRY_STATE_DRAFT: 'Draft',
                ENTRY_STATE_APPROVED: 'Approved',
                ENTRY_STATE_SENT: 'Sent',
                ENTRY_STATE_PAID: 'Paid',
                ENTRY_STATE_VOID: 'Void'
            };

            return stateMapping[state] || state;
        },

        updateEventSizes() {
            // This function is invoked whenever the page is resized, it retrieves each of the entries on the page
            // and recalculates their size. This is a bit involved because they are no longer bounded objects
            // but rather divs that are positioned absolutely. So we retrieve the ID from the element to do the math.
            // const columnWidth = this.getColumnWidth();
            // const hourBlockHeight = this.getHourBlockHeight();
            // Update the width and height of each event based on the column width and hour block height
            const entries = document.querySelectorAll('.entry');
            entries.forEach(entry => {
                // retrieve the entry from the id
                const entryId = entry.getAttribute('id');
                // cast the id to an int
                const entryIdNumber = parseInt(entryId);
                const entryObj = this.entries.find(entry => entry.entry_id === entryIdNumber);
                entry.style.width = this.calculateEntryWidth(entryObj.start_day_of_week, entryObj.start_hour) + 'px';
                entry.style.left = this.calculateEntryLeft(entryObj, entryObj.start_day_of_week, entryObj.start_hour) + 'px';
            });
        },

        getHourBlockHeight() {
            // Calculate the height of each hour block
            const table = document.getElementById('calendar');
            if (!table) {
                return this.hourBlockHeight;
            }
            const firstRowCells = table.rows[0].cells;
            if (!firstRowCells) {
                return this.hourBlockHeight;
            }
            // Use getComputedStyle to get the accurate height, including padding and borders
            const hourBlockHeight = getComputedStyle(firstRowCells[0]).height;
            if (!hourBlockHeight) {
                return this.hourBlockHeight;
            }
            return parseFloat(hourBlockHeight);
        },

        getColumnWidth() {
            // Calculate the width of each column
            const table = document.getElementById('calendar');
            if (!table) {
                return this.calendarWidth;
            }
            const firstRowCells = table.rows[0].cells;
            if (!firstRowCells) {
                return this.calendarWidth;
            }
            const columnWidth = firstRowCells[1].getBoundingClientRect().width;
            this.calendarWidth = columnWidth;
            return columnWidth - 8;
        },
        showNewEntryModal() {
            this.isNew = true;
            let defaultStart = new Date();
            defaultStart.setMinutes(0,0,0);

            defaultEnd = new Date();
            defaultEnd.setHours(defaultStart.getHours() + 1, 0,0,0);
            let blankEntry = {
                billing_code_id : null,
                entry_id: null,
                notes: null,
                start: null,
                end: null,
                start_vis : moment(defaultStart).format( 'yyyy-MM-DDTHH:mm'),
                end_vis : moment(defaultEnd).format( 'yyyy-MM-DDTHH:mm'),
                duration_hours: 1,

            }
            this.selectedEntry = blankEntry;

            $('#entry-modal').modal('show');
        },
        showNewEntryModalPopulated(day, hourStart, hourEnd) {
            this.isNew = true;
            let defaultStart = new Date(day);
            defaultStart.setHours(hourStart, 0, 0, 0)

            defaultEnd = new Date(day);
            defaultEnd.setHours(hourEnd + 1, 0,0,0);
            let blankEntry = {
                billing_code_id : null,
                entry_id: null,
                notes: null,
                start: null,
                end: null,
                start_vis : moment(defaultStart).format( 'yyyy-MM-DDTHH:mm'),
                end_vis : moment(defaultEnd).format( 'yyyy-MM-DDTHH:mm'),
                duration_hours: hourEnd+1 - hourStart,
                start_day_of_week: day,
                start_hour: hourStart,
            }
            this.selectedEntry = blankEntry;

            $('#entry-modal').modal('show');
        },
        showEntryModal(entry) {
            console.log(this.selectedEntry)
            this.selectedEntry = entry;
            this.selectedEntry.start_vis = this.parseDate(this.selectedEntry.start, 'yyyy-MM-DDTHH:mm');
            this.selectedEntry.end_vis = this.parseDate(this.selectedEntry.end, 'yyyy-MM-DDTHH:mm');
            $('#entry-modal').modal('show');
        },
        hideModal() {
            $('#entry-modal').modal('hide');
        },
        showAdjustmentModal(invoice) {
            this.newAdjustment = {type : '', amount: 0, notes: '', 'invoice_id': invoice.ID};
            $('#adjustment-modal').modal('show');
        },
        hideAdjustmentModal() {
            $('#adjustment-modal').modal('hide');
        },

        updateWorkingScreen(screen) {
            this.detailRate = null;
            this.detailBillingCode = null;
            this.detailProject = null;
            this.detailAccount = null;
            this.showDetail = false;
            if (screen === 'admin') {
                this.fetchDraftInvoices();
                console.log(this.draftInvoices)
            }
            if (screen === 'invoices') {
                this.fetchAcceptedInvoices();
            }
            if (screen === 'bills') {
                this.fetchBills();
            }
            for (var key in this.workingScreen) {
                this.workingScreen[key] = false;
            }
            this.workingScreen[screen] = true;
        },
        parseDate: function (text, format) {
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
        getDateByOffset(offset) {
            const current_week_start = getCurrentWeek()
            const futureDate = current_week_start.addDays(offset)
            return moment(futureDate).format('MM/DD/YYYY')
        },

        formatDate : function (date, format) {
           return moment(date).format(format);
        },
        // Fetch all the draft invoices
        fetchDraftInvoices(){
            axios({
                method: 'get',
                url: '/api/invoices/draft',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
            .then (response => {
                this.draftInvoices = response.data
            })
            .catch(error => {
                console.log(error)
            })
            return this.draftInvoices
        },
        fetchAcceptedInvoices(){
            axios({
                method: 'get',
                url: '/api/invoices/accepted',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
            .then (response => {
                this.acceptedInvoices = response.data
            })
            .catch(error => {
                console.log(error)
            })
            return this.acceptedInvoices
        },
        fetchBills() {
            axios({
                method: 'get',
                url: '/api/bills',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
            .then (response => {
                this.staffBills = response.data
            })
            .catch(error => {
                console.log(error)
            })
            return this.staffBills
        },
        filterInvoices(status) {
            try {
                let output = this.acceptedInvoices.filter(function(el) { return el.state === status;})
                return output
            } catch {
                return []
            }
        },
        filterBills(unpaid=true) {
            if (unpaid === true) {
                try {
                    let output = this.staffBills.filter(function (el) {
                        return el.closed_at === null;
                    })
                    return output
                } catch {
                    return []
                }
            }
            if (unpaid === false) {
                try {
                    let output = this.staffBills.filter(function (el) {
                        return el.closed_at !== null;
                    })
                    return output
                } catch {
                    return []
                }
            }
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
        fetchActiveBillingCodes(){
            axios({
                method: 'get',
                url: '/api/active_billing_codes',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
                .then(response => {
                    this.active_billing_codes = response.data
                    console.log("retrieved active billing codes")
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
        fetchEntries(){
            axios({
                method: 'get',
                url: '/api/entries',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
            })
            .then(response => {

                this.entries = response.data
                this.weeklyEntries = this.getWeeklyEntries();
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
                console.log(this.detailProject.active_start_vis)
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
                   internal: false,
                   project_type: 'PROJECT_TYPE_NEW',
                   ae_id: null,
                   sdr_id: null
               };
           } else if (detail_type === 'billing_code') {
               this.detailBillingCode = {
                   name : '',
                   type : '',
                   code : '',
                   rate : {ID : null},
                   internal_rate : {ID : null},
                   active_start : null,
                   active_end : null,
                   rate_id : null,
                   internal_rate_id: null,
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
                   address: '',
                   clients :  null,
                   billing_frequency: '',
                   budget_hours: 0,
                   budget_dollars: 0,
                   projects_single_invoice: true
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
                postForm.set("active_start", this.detailProject.active_start_vis)
                postForm.set("active_end", this.detailProject.active_end_vis)
                postForm.set("internal", this.detailProject.internal)
                postForm.set("project_type", this.detailProject.project_type)
                postForm.set("ae_id", this.detailProject.ae_id)
                postForm.set("sdr_id", this.detailProject.sdr_id)
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
                    this.detailProject.active_start = response.data.active_start
                    this.detailProject.active_end = response.data.active_end
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
                postForm.set("active_start", this.detailBillingCode.active_start_vis)
                postForm.set("active_end", this.detailBillingCode.active_end_vis)
                postForm.set('type', this.detailBillingCode.type)
                postForm.set("rate_id", this.detailBillingCode.rate_id)
                postForm.set("internal_rate_id", this.detailBillingCode.internal_rate_id)
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
                    this.detailBillingCode.active_start = response.data.active_start
                    this.detailBillingCode.active_end = response.data.active_end
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
                postForm.set("active_from", this.detailRate.active_start_vis)
                postForm.set("active_to", this.detailRate.active_end_vis)

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
                        this.detailRate.active_from = response.data.active_from
                        this.detailRate.active_to = response.data.active_to
                        if (this.isNew) {
                            this.rates.push(this.detailRate)
                        } else {
                        }
                    })
                    .catch(error => {
                        console.log(error)
                    })
            } else if (detail_type === 'account'){
                let postForm = new FormData();
                postForm.set("name", this.detailAccount.name)
                postForm.set("website", this.detailAccount.website)
                postForm.set("email", this.detailAccount.email)
                postForm.set("type", this.detailAccount.type)
                postForm.set('legal_name', this.detailAccount.legal_name)
                postForm.set("address", this.detailAccount.address)
                postForm.set("billing_frequency", this.detailAccount.billing_frequency)
                postForm.set("budget_hours", this.detailAccount.budget_hours)
                postForm.set("budget_dollars", this.detailAccount.budget_dollars)
                postForm.set("projects_single_invoice", this.detailAccount.projects_single_invoice)
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
            } else if (detail_type === 'entry'){
                let postForm = new FormData();
                postForm.set("billing_code_id", this.selectedEntry.billing_code_id)
                postForm.set("start", this.parseDate(this.selectedEntry.start_vis, 'yyyy-MM-DDTHH:mm'))
                postForm.set("end", this.parseDate(this.selectedEntry.end_vis, 'yyyy-MM-DDTHH:mm'))
                postForm.set("notes", this.selectedEntry.notes)
                if (this.isNew) {
                    method = 'post'
                    posturl = '/api/entries/0'
                } else {
                    method = 'put'
                    posturl = '/api/entries/' + this.selectedEntry.entry_id.toString()
                }
                axios({
                    method: method,
                    url: posturl,
                    headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                    data: postForm
                })
                .then(response => {
                    console.log(response.data)
                    this.selectedEntry = response.data
                    if (this.isNew === true) {
                        this.entries.push(this.selectedEntry)
                        this.weeklyEntries = this.getWeeklyEntries();
                     } else {
                        this.entries = this.entries.filter(function(el) { return el.entry_id !== response.data.entry_id; })
                        this.entries.push(this.selectedEntry)
                        this.weeklyEntries = this.getWeeklyEntries();
                    }
                    this.hideModal();
                })
                .catch(error => {
                    alert('There was an error saving the entry. Please contact support.');
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
            } else if (object_type === 'entry'){
                this.entries = this.entries.filter(function(el) { return el.entry_id !== object.entry_id; })
                axios({
                    method: 'delete',
                    url: '/api/entries/' + object.entry_id,
                    headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                })
                .then(response => {
                    this.entries = this.entries.filter(function(el) { return el.entry_id !== object.entry_id; })
                    this.weeklyEntries = this.weeklyEntries.filter(function(el) { return el.entry_id !== object.entry_id; })
                    this.hideModal();
                })
                .catch(error => {
                    console.log(error)
                })
            }
        },
        inviteUser (account) {
            let postForm = new FormData();
            postForm.set("email", this.invitedUserEmail)

            axios({
                method: 'post',
                url: '/api/accounts/' + account.ID.toString() + '/invite',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                data: postForm,
            })
            .then(response => {
                user = response.data
                this.detailAccount.clients.push(user)
            })
            .catch(error => {
                console.log(error)
            })
        },
        incrementWeek() {
            this.currentWeek = getNextWeek(this.currentWeek);
            // this.currentWeekDays = getDaysInWeek(this.currentWeek);
            this.currentWeekDaysFormatted = getDaysInWeekFormatted(this.currentWeek, 'MM/DD/YYYY');
            this.weeklyEntries = this.getWeeklyEntries();
        },
        decrementWeek() {
            this.currentWeek = getPreviousWeek(this.currentWeek);
            // this.currentWeekDays = getDaysInWeek(this.currentWeek);
            this.currentWeekDaysFormatted = getDaysInWeekFormatted(this.currentWeek, 'MM/DD/YYYY');
            this.weeklyEntries = this.getWeeklyEntries();
        },

        getWeeklyEntries() {
            let weeklyEntries = this.entries.filter(entry => {
                const entryDate = new Date(entry.start);
                return entryDate >= this.currentWeek && entryDate < getNextWeek(this.currentWeek);
            });
            return weeklyEntries
        },

        sumEntryHours(day = null) {
            if (day !== null) {
                let hoursForDay = 0;
                this.weeklyEntries.forEach(entry => {
                    const entryDate = new Date(entry.start);
                    if (entryDate.getDay() === day && entry.state !== 'ENTRY_STATE_UNAFFILIATED' && entry.state !== 'ENTRY_STATE_VOID') { // Check if entry is for the specified day
                        hoursForDay += entry.duration_hours;
                    }
                });
                return hoursForDay;
            } else {
                let totalHours = 0;
                this.weeklyEntries.forEach(entry => {
                    if (entry.state !== 'ENTRY_STATE_UNAFFILIATED' && entry.state !== 'ENTRY_STATE_VOID') {
                        totalHours += entry.duration_hours;
                    }
                });
                return totalHours;
            }
        },

        sumEntryFee(day = null) {
            if (day !== null) {
                let feeForDay = 0;
                this.weeklyEntries.forEach(entry => {
                    const entryDate = new Date(entry.start);
                    if (entryDate.getDay() === day && entry.state !== 'ENTRY_STATE_UNAFFILIATED' && entry.state !== 'ENTRY_STATE_VOID') { 
                        // Check if entry is for the specified day and state is not UNAFFILIATED or VOID
                        feeForDay += entry.fee;
                    }
                });
                return feeForDay;
            } else {
                let totalFee = 0;
                this.weeklyEntries.forEach(entry => {
                    if (entry.state !== 'ENTRY_STATE_UNAFFILIATED' && entry.state !== 'ENTRY_STATE_VOID') { 
                        // Check if state is not UNAFFILIATED or VOID
                        totalFee += entry.fee;
                    }
                });
                return totalFee;
            }
        },

        backfillProjectEntries(project) {
            let postForm = new FormData();
            postForm.set("project_id", project.ID)
            axios({
                method: 'post',
                url: '/api/projects/' + project.ID + '/backfill',
                headers: {'Content-Type': 'application/json', 'x-access-token': window.localStorage.snowpack_token},
                data: postForm,
            })
                .then(response => {
                    console.log(response)
                })
                .catch(error => {
                    console.log(error)
                })
        },

        // Code below is all used for dragging and selecting in the calendar window
        // StartDrag is used on an MouseDown Event in the calendar to begin a drag operation
        startDrag(day, hour, event) {
            this.isDragging = true;
            this.dragDate = day
            this.dragStart = hour;
            this.dragEnd = hour;
            event.target.classList.add('highlight');
          },
        onDragOver(day, hour, event) {
            if (!this.isDragging) return;
            if (this.dragDate !== day) return;
            if (hour < this.dragStart) {
                this.dragStart = hour;
            }
            if (hour > this.dragEnd) {
                this.dragEnd = hour;
            }
            event.target.classList.add('highlight');
        },
        endDrag(day, hour, event) {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.showNewEntryModalPopulated(this.dragDate, this.dragStart, this.dragEnd);
            this.dragDate = null;
            this.dragStart = null;
            this.dragEnd = null;
            this.removeHighlighting();
        },
        removeHighlighting() {
            const cells = document.querySelectorAll('.calendar-cell');
            cells.forEach(cell => {
                cell.classList.remove('highlight');
            });
        },
        autoSelectSDR() {
            // If AE is selected, set SDR to the same value
            if (this.detailProject.ae_id) {
                this.detailProject.sdr_id = this.detailProject.ae_id;
            }
        },
    },
    watch: {
        // Watch for changes to the 'editable' property of each entry within each invoice
        'draftInvoices': {
            deep: true,
            handler(newInvoices) {
                newInvoices.forEach(invoice => {
                    invoice.line_items.forEach(entry => {
                        this.$nextTick(() => {
                            const tdElements = document.querySelectorAll(`td[contenteditable="${entry.editable}"]`);
                            tdElements.forEach(td => {
                                td.setAttribute('contenteditable', entry.editable);
                                if (entry.state == 'ENTRY_STATE_VOID') {
                                    console.log(entry.state)
                                    td.classList.add('strikeout');
                                } else {
                                    td.classList.remove('strikeout')
                                }
                            });

                        });
                    });
                });
            }
        }
    },
    mounted() {
        // Call the updateEventSizes method on initial mount
        this.currentWeek = getCurrentWeek();
        this.currentWeekDaysFormatted = getDaysInWeekFormatted(this.currentWeek, 'MM/DD/YYYY');
        this.getWeeklyEntries();
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

// PURE JS UTILITY FUNCTIONS

function getPreviousWeek(week) {
    // This function will return the previous week
    let previous_week = new Date(week).addDays(-7);
    return previous_week;
}
function getNextWeek(week) {
    // This function will return the next week
    let next_week = new Date(week).addDays(7)
    return next_week;
}

function getCurrentWeek() {
    // This function will return the current week
    let today = new Date();
    let week = new Date();
    week.setDate(today.getDate() - today.getDay());
    week.setHours(0,0,0,0);
    return week;
}


function getDaysInWeekFormatted(week, format) {
    // This function will return a list of days in a week
    let days = [];
    for (var i = 0; i < 7; i++) {
        days.push(moment(week).format(format));
        week = week.addDays(1);
    }
    return days;
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

