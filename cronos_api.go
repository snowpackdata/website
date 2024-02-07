package main

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/snowpackdata/cronos"
	"gorm.io/gorm"
	"log"
	"net/http"
	"strconv"
	"time"
)

// List Handlers will provide a list of objects for a given resource

// ProjectsListHandler provides a list of Projects
func (a *App) ProjectsListHandler(w http.ResponseWriter, r *http.Request) {
	var projects []cronos.Project
	a.cronosApp.DB.Preload("BillingCodes").Preload("Account").Find(&projects)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(&projects)
}

// StaffListHandler provides a list of Projects
func (a *App) StaffListHandler(w http.ResponseWriter, r *http.Request) {
	var staff []cronos.Employee
	a.cronosApp.DB.Preload("Entries").Find(&staff)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(&staff)
}

// AccountsListHandler provides a list of Accounts
func (a *App) AccountsListHandler(w http.ResponseWriter, r *http.Request) {
	var accounts []cronos.Account
	a.cronosApp.DB.Preload("Projects").Preload("Clients").Find(&accounts)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(&accounts)
}

// RatesListHandler provides a list of Rates that are available
func (a *App) RatesListHandler(w http.ResponseWriter, r *http.Request) {
	var rates []cronos.Rate
	a.cronosApp.DB.Preload("BillingCodes").Find(&rates)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(&rates)
}

// BillingCodesListHandler provides a list of BillingCodes that are available
func (a *App) BillingCodesListHandler(w http.ResponseWriter, r *http.Request) {
	var billingCodes []cronos.BillingCode
	a.cronosApp.DB.Preload("Rate").Preload("InternalRate").Find(&billingCodes)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(&billingCodes)
}

// EntriesListHandler provides a list of Entries that are available
func (a *App) EntriesListHandler(w http.ResponseWriter, r *http.Request) {
	var entries []cronos.Entry

	var employee cronos.Employee
	userIDInt := r.Context().Value("user_id")
	a.cronosApp.DB.Where("user_id = ?", userIDInt).First(&employee)

	a.cronosApp.DB.Preload("BillingCode").Preload("Employee").Preload("LinkedEntry").Where("employee_id = ?", employee.ID).Where("internal = ?", false).Find(&entries)
	apiEntries := make([]cronos.ApiEntry, len(entries))
	for i, entry := range entries {
		apiEntry := entry.GetAPIEntry()
		apiEntries[i] = apiEntry
	}
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(&apiEntries)
}

// DraftInvoiceListHandler provides a list of Draft Invoices that are available and associated entries
func (a *App) DraftInvoiceListHandler(w http.ResponseWriter, r *http.Request) {
	var invoices []cronos.Invoice
	a.cronosApp.DB.Preload("Entries", func(db *gorm.DB) *gorm.DB {
		return db.Order("entries.start ASC")
	}).Preload("Project").Where("state = ? and type = ?", cronos.InvoiceStateDraft, cronos.InvoiceTypeAR).Find(&invoices)
	var draftInvoices = make([]cronos.DraftInvoice, len(invoices))
	for i, invoice := range invoices {
		draftInvoice := a.cronosApp.GetDraftInvoice(&invoice)
		draftInvoices[i] = draftInvoice
	}
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(draftInvoices)
}

// InvoiceListHandler provides access to all approved/pending/paid invoices. These invoices may be filtered by project
// and provide access to line items only via inspection.
func (a *App) InvoiceListHandler(w http.ResponseWriter, r *http.Request) {
	var invoices []cronos.Invoice
	a.cronosApp.DB.Preload("Project").Preload("Project.Account").Where("state = ? or state = ? or state = ?", cronos.InvoiceStateApproved, cronos.InvoiceStateSent, cronos.InvoiceStatePaid).Find(&invoices)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(invoices)
}

// Individual CRUD handlers for each specific model

// ProjectHandler Provides CRUD interface for the project object
func (a *App) ProjectHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	var project cronos.Project
	switch {
	case r.Method == "GET":
		a.cronosApp.DB.First(&project, vars["id"])
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")

		if err := json.NewEncoder(w).Encode(&project); err != nil {
			log.Println(err)
		}
		return
	case r.Method == "PUT":
		a.cronosApp.DB.First(&project, vars["id"])
		if r.FormValue("name") != "" {
			project.Name = r.FormValue("name")
		}
		if r.FormValue("account_id") != "" {
			var account cronos.Account
			a.cronosApp.DB.Where("id = ?", r.FormValue("account_id")).First(&account)
			project.AccountID = account.ID
			project.Account = account
		}
		if r.FormValue("active_start") != "" {
			// first convert the string to a time.Time object
			start, err := time.Parse("2006-01-02", r.FormValue("active_start"))
			start.In(time.UTC)
			if err != nil {
				fmt.Println(err)
			}
			project.ActiveStart = start
		}
		if r.FormValue("active_end") != "" {
			// first convert the string to a time.Time object
			endtime, err := time.Parse("2006-01-02", r.FormValue("active_end"))
			if err != nil {
				fmt.Println(err)
			}
			project.ActiveEnd = endtime
		}
		if r.FormValue("budget_hours") != "" {
			hoursInt, _ := strconv.Atoi(r.FormValue("budget_hours"))
			project.BudgetHours = hoursInt
		}
		if r.FormValue("budget_dollars") != "" {
			dollarsInt, _ := strconv.Atoi(r.FormValue("budget_dollars"))
			project.BudgetDollars = dollarsInt
		}
		if r.FormValue("internal") != "" {
			internal, _ := strconv.ParseBool(r.FormValue("internal"))
			project.Internal = internal
		}
		if r.FormValue("billing_frequency") != "" {
			billingFrequencyValue := r.FormValue("billing_frequency")
			project.BillingFrequency = billingFrequencyValue
		}
		a.cronosApp.DB.Save(&project)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(&project)
		return
	case r.Method == "POST":
		project.Name = r.FormValue("name")
		project.ActiveStart, _ = time.Parse("2006-01-02", r.FormValue("active_start"))
		project.ActiveEnd, _ = time.Parse("2006-01-02", r.FormValue("active_end"))
		project.BudgetHours, _ = strconv.Atoi(r.FormValue("budget_hours"))
		project.BudgetDollars, _ = strconv.Atoi(r.FormValue("budget_dollars"))
		project.Internal, _ = strconv.ParseBool(r.FormValue("internal"))
		project.BillingFrequency = r.FormValue("billing_frequency")
		var account cronos.Account
		a.cronosApp.DB.Where("id = ?", r.FormValue("account_id")).First(&account)
		project.AccountID = account.ID
		project.Account = account
		a.cronosApp.DB.Create(&project)

		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(&project)
		return
	case r.Method == "DELETE":
		a.cronosApp.DB.Where("id = ?", vars["id"]).Delete(&cronos.Project{})
		_ = json.NewEncoder(w).Encode("Deleted Record")
		return
	default:
		fmt.Println("Fatal Error")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

// AccountHandler Provides CRUD interface for the account object
func (a *App) AccountHandler(w http.ResponseWriter, r *http.Request) {
	// Account handler is identical to the project handler except with the account model
	vars := mux.Vars(r)
	var account cronos.Account
	switch {
	case r.Method == "GET":
		a.cronosApp.DB.First(&account, vars["id"])
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(&account)
		return
	case r.Method == "PUT":
		a.cronosApp.DB.First(&account, vars["id"])
		if r.FormValue("name") != "" {
			account.Name = r.FormValue("name")
		}
		if r.FormValue("type") != "" {
			account.Type = r.FormValue("type")
		}
		if r.FormValue("legal_name") != "" {
			account.LegalName = r.FormValue("legal_name")
		}
		if r.FormValue("email") != "" {
			account.Email = r.FormValue("email")
		}
		if r.FormValue("website") != "" {
			account.Website = r.FormValue("website")
		}
		if r.FormValue("address") != "" {
			account.Address = r.FormValue("address")
		}
		a.cronosApp.DB.Save(&account)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(&account)
		return
	case r.Method == "POST":
		account.Name = r.FormValue("name")
		account.Type = r.FormValue("type")
		account.LegalName = r.FormValue("legal_name")
		account.Email = r.FormValue("email")
		account.Website = r.FormValue("website")
		account.Address = r.FormValue("address")
		a.cronosApp.DB.Create(&account)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(&account)
		return
	case r.Method == "DELETE":
		a.cronosApp.DB.Where("id = ?", vars["id"]).Delete(&cronos.Account{})
		_ = json.NewEncoder(w).Encode("Deleted Record")
		return
	default:
		fmt.Println("Fatal Error")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

// BillingCodeHandler Provides CRUD interface for the billing code object
func (a *App) BillingCodeHandler(w http.ResponseWriter, r *http.Request) {
	// BillingCode handler is identical to the project handler except with the billing code model
	vars := mux.Vars(r)
	var billingCode cronos.BillingCode
	switch {
	case r.Method == "GET":
		a.cronosApp.DB.First(&billingCode, vars["id"])
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(&billingCode)
		return
	case r.Method == "PUT":
		a.cronosApp.DB.First(&billingCode, vars["id"])
		if r.FormValue("name") != "" {
			billingCode.Name = r.FormValue("name")
		}
		if r.FormValue("type") != "" {
			billingCode.RateType = r.FormValue("type")
		}
		if r.FormValue("category") != "" {
			billingCode.Category = r.FormValue("category")
		}
		if r.FormValue("code") != "" {
			billingCode.Code = r.FormValue("code")
		}
		if r.FormValue("rounded_to") != "" {
			roundedToInt, _ := strconv.Atoi(r.FormValue("rounded_to"))
			billingCode.RoundedTo = roundedToInt
		}
		if r.FormValue("project_id") != "" {
			var project cronos.Project
			a.cronosApp.DB.Where("id = ?", r.FormValue("project_id")).First(&project)
			billingCode.ProjectID = project.ID
			project.BillingCodes = append(project.BillingCodes, billingCode)
			a.cronosApp.DB.Save(&project)
		}
		if r.FormValue("active_start") != "" {
			// first convert the string to a time.Time object
			start, err := time.Parse("2006-01-02", r.FormValue("active_start"))
			if err != nil {
				fmt.Println(err)
			}
			billingCode.ActiveStart = start
		}
		if r.FormValue("active_end") != "" {
			// first convert the string to a time.Time object
			endtime, err := time.Parse("2006-01-02", r.FormValue("active_end"))
			if err != nil {
				fmt.Println(err)
			}
			billingCode.ActiveEnd = endtime
		}
		if r.FormValue("rate_id") != "" {
			var rate cronos.Rate
			a.cronosApp.DB.Where("id = ?", r.FormValue("rate_id")).First(&rate)
			billingCode.RateID = rate.ID
			billingCode.Rate = rate
		}
		if r.FormValue("internal_rate_id") != "" {
			var internalRate cronos.Rate
			a.cronosApp.DB.Where("id = ?", r.FormValue("internal_rate_id")).First(&internalRate)
			billingCode.InternalRateID = internalRate.ID
			billingCode.InternalRate = internalRate
		}
		a.cronosApp.DB.Save(&billingCode)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(&billingCode)
		return
	case r.Method == "POST":
		billingCode.Name = r.FormValue("name")
		billingCode.RateType = r.FormValue("type")
		billingCode.Category = r.FormValue("category")
		billingCode.Code = r.FormValue("code")
		billingCode.RoundedTo, _ = strconv.Atoi(r.FormValue("rounded_to"))
		billingCode.ActiveStart, _ = time.Parse("2006-01-02", r.FormValue("active_start"))
		billingCode.ActiveEnd, _ = time.Parse("2006-01-02", r.FormValue("active_end"))
		var project cronos.Project
		a.cronosApp.DB.Where("id = ?", r.FormValue("project_id")).First(&project)
		billingCode.ProjectID = project.ID
		project.BillingCodes = append(project.BillingCodes, billingCode)
		a.cronosApp.DB.Save(&project)
		externalRateID, _ := strconv.Atoi(r.FormValue("rate_id"))
		internalRateID, _ := strconv.Atoi(r.FormValue("internal_rate_id"))
		billingCode.RateID = uint(externalRateID)
		billingCode.InternalRateID = uint(internalRateID)

		a.cronosApp.DB.Create(&billingCode)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(&billingCode)
		return
	case r.Method == "DELETE":
		a.cronosApp.DB.Where("id = ?", vars["id"]).Delete(&cronos.BillingCode{})
		_ = json.NewEncoder(w).Encode("Deleted Record")
		return
	default:
		fmt.Println("Fatal Error")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

// RateHandler Provides CRUD interface for the rate object
func (a *App) RateHandler(w http.ResponseWriter, r *http.Request) {
	// Rate handler is identical to the project handler except with the rate model
	vars := mux.Vars(r)
	var rate cronos.Rate
	switch {
	case r.Method == "GET":
		a.cronosApp.DB.First(&rate, vars["id"])
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(&rate)
		return
	case r.Method == "PUT":
		a.cronosApp.DB.First(&rate, vars["id"])
		if r.FormValue("name") != "" {
			rate.Name = r.FormValue("name")
		}
		if r.FormValue("amount") != "" {
			amountFloat, _ := strconv.ParseFloat(r.FormValue("amount"), 64)
			rate.Amount = amountFloat
		}
		if r.FormValue("active_from") != "" {
			// first convert the string to a time.Time object
			start, err := time.Parse("2006-01-02", r.FormValue("active_from"))
			if err != nil {
				fmt.Println(err)
			}
			rate.ActiveFrom = start
		}
		if r.FormValue("active_to") != "" {
			// first convert the string to a time.Time object
			endtime, err := time.Parse("2006-01-02", r.FormValue("active_to"))
			if err != nil {
				fmt.Println(err)
			}
			rate.ActiveTo = endtime
		}
		if r.FormValue("internal_only") != "" {
			internalOnly, _ := strconv.ParseBool(r.FormValue("internal_only"))
			rate.InternalOnly = internalOnly
		}
		a.cronosApp.DB.Save(&rate)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(&rate)
		return
	case r.Method == "POST":
		rate.Name = r.FormValue("name")
		rate.Amount, _ = strconv.ParseFloat(r.FormValue("amount"), 64)
		rate.ActiveFrom, _ = time.Parse("2006-01-02", r.FormValue("active_from"))
		rate.ActiveTo, _ = time.Parse("2006-01-02", r.FormValue("active_to"))
		rate.InternalOnly, _ = strconv.ParseBool(r.FormValue("internal_only"))
		a.cronosApp.DB.Create(&rate)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(&rate)
		return
	case r.Method == "DELETE":
		a.cronosApp.DB.Where("id = ?", vars["id"]).Delete(&cronos.Rate{})
		_ = json.NewEncoder(w).Encode("Deleted Record")
		return
	default:
		fmt.Println("Fatal Error")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

// EntryHandler Provides CRUD interface for the entry object
// The entry object is a bit more nuanced because for each entry we want to create a dual-entry
func (a *App) EntryHandler(w http.ResponseWriter, r *http.Request) {
	// Initial setup for the entry handler is similar to all the above handlers
	vars := mux.Vars(r)
	var entry cronos.Entry
	switch {
	case r.Method == "GET":
		a.cronosApp.DB.First(&entry, vars["id"])
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(entry.GetAPIEntry())
		return
	case r.Method == "PUT":
		a.cronosApp.DB.First(&entry, vars["id"])
		// We cannot edit entries that are approved, paid, or voided
		if entry.State == cronos.EntryStateApproved.String() || entry.State == cronos.EntryStatePaid.String() || entry.State == cronos.EntryStateVoid.String() {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		if r.FormValue("billing_code_id") != "" {
			var billingCode cronos.BillingCode
			a.cronosApp.DB.Where("id = ?", r.FormValue("billing_code_id")).First(&billingCode)
			entry.BillingCodeID = billingCode.ID
			entry.BillingCode = billingCode
		}
		if r.FormValue("start") != "" {
			// first convert the string to a time.Time object
			start, err := time.Parse("2006-01-02T15:04", r.FormValue("start"))
			if err != nil {
				fmt.Println(err)
			}
			entry.Start = start
		}
		if r.FormValue("end") != "" {
			// first convert the string to a time.Time object
			endtime, err := time.Parse("2006-01-02T15:04", r.FormValue("end"))
			if err != nil {
				fmt.Println(err)
			}
			entry.End = endtime
		}
		if r.FormValue("notes") != "" {
			entry.Notes = r.FormValue("notes")
		}
		var linkedEntry cronos.Entry
		a.cronosApp.DB.Where("id = ?", entry.LinkedEntryID).First(&linkedEntry)
		err := a.cronosApp.AssociateEntry(&entry, entry.ProjectID)
		if err != nil {
			fmt.Println(err)
		}
		a.cronosApp.DB.Save(&entry)
		var billingCode cronos.BillingCode
		a.cronosApp.DB.Where("id = ?", r.FormValue("billing_code_id")).First(&billingCode)
		linkedEntry.BillingCodeID = entry.BillingCodeID
		entry.BillingCode = billingCode
		linkedEntry.Start = entry.Start
		linkedEntry.End = entry.End
		linkedEntry.Notes = entry.Notes
		err = a.cronosApp.AssociateEntry(&linkedEntry, linkedEntry.ProjectID)
		if err != nil {
			fmt.Println(err)
		}
		a.cronosApp.DB.Save(&linkedEntry)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(entry.GetAPIEntry())
		return
	case r.Method == "POST":
		entry.Start, _ = time.Parse("2006-01-02T15:04", r.FormValue("start"))
		entry.End, _ = time.Parse("2006-01-02T15:04", r.FormValue("end"))
		var employee cronos.Employee
		userID := r.Context().Value("user_id")
		a.cronosApp.DB.Where("user_id = ?", userID).First(&employee)
		entry.EmployeeID = employee.ID

		// Retrieve the billing code so we can get the project off it
		var billingCode cronos.BillingCode
		a.cronosApp.DB.Where("id = ?", r.FormValue("billing_code_id")).First(&billingCode)
		entry.BillingCodeID = billingCode.ID
		entry.BillingCode = billingCode
		entry.ProjectID = billingCode.ProjectID
		entry.Internal = false
		entry.Notes = r.FormValue("notes")

		// right now journalID is always set to accounts receivable
		//journalID, _ := strconv.Atoi(r.FormValue("journal_id"))
		journalID := 1
		entry.JournalID = uint(journalID)
		linkedEntry := a.generateLinkedEntry(&entry)
		// Finally, update the invoice status
		err := a.cronosApp.AssociateEntry(&entry, entry.ProjectID)
		if err != nil {
			fmt.Println(err)
		}
		// For now we are not associating linked entries as we're only doing external invoicing
		//err = a.cronosApp.AssociateEntry(&linkedEntry, linkedEntry.ProjectID)
		//if err != nil {
		//	fmt.Println(err)
		//}

		// Need to first create the entries before we can associate them
		a.cronosApp.DB.Omit("LinkedEntry").Create(&entry)
		a.cronosApp.DB.Omit("LinkedEntry").Create(&linkedEntry)
		// Next add associations
		entry.LinkedEntryID = &linkedEntry.ID
		entry.LinkedEntry = &linkedEntry
		linkedEntry.LinkedEntryID = &entry.ID
		linkedEntry.LinkedEntry = &entry

		a.cronosApp.DB.Omit("LinkedEntry").Save(&entry)
		a.cronosApp.DB.Omit("LinkedEntry").Save(&linkedEntry)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(entry.GetAPIEntry())
		if err != nil {
			fmt.Println(err)
		}
		return
	case r.Method == "DELETE":
		a.cronosApp.DB.Where("id = ?", vars["id"]).Delete(&cronos.Entry{})
		_ = json.NewEncoder(w).Encode("Deleted Record")
		return
	default:
		fmt.Println("Fatal Error")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func (a *App) InviteUserHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	var account cronos.Account
	a.cronosApp.DB.First(&account, vars["id"])
	if account.Type == cronos.AccountTypeInternal.String() {
		err := a.cronosApp.RegisterStaff(r.FormValue("email"), account.ID)
		if err != nil {
			fmt.Println(err)
		}
	} else if account.Type == cronos.AccountTypeClient.String() {
		err := a.cronosApp.RegisterClient(r.FormValue("email"), account.ID)
		if err != nil {
			fmt.Println(err)
		}
	}
	// Retrieve the user we just created
	var user cronos.User
	a.cronosApp.DB.Where("email = ?", r.FormValue("email")).First(&user)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusCreated)
	err := json.NewEncoder(w).Encode(user)
	if err != nil {
		fmt.Println(err)
	}
	return
}

// EntryStateHandler allows us to toggle the state of entries on an invoice
func (a *App) EntryStateHandler(w http.ResponseWriter, r *http.Request) {
	// Toggle the state of the entry to approved
	vars := mux.Vars(r)
	var entry cronos.Entry
	a.cronosApp.DB.First(&entry, vars["id"])
	status := vars["state"]
	switch {
	case status == "approve":
		entry.State = cronos.EntryStateApproved.String()
		a.cronosApp.DB.Save(&entry)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(struct{ State string }{cronos.EntryStateVoid.String()})
		return
	case status == "void":
		entry.State = cronos.EntryStateVoid.String()
		a.cronosApp.DB.Save(&entry)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(struct{ State string }{cronos.EntryStateVoid.String()})
		return
	case status == "draft":
		entry.State = cronos.EntryStateDraft.String()
		a.cronosApp.DB.Save(&entry)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(struct{ State string }{cronos.EntryStateDraft.String()})
	}
}

// InvoiceStateHandler allows us to accept invoices
func (a *App) InvoiceStateHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieve the invoice and entries
	vars := mux.Vars(r)
	// Retrieve the url variables of invoice and state
	var invoice cronos.Invoice
	a.cronosApp.DB.Preload("Entries").First(&invoice, vars["id"])
	state := vars["state"]
	switch {
	case state == "approve":
		// Set the invoice state to approved and mark the time
		invoice.State = cronos.InvoiceStateApproved.String()
		invoice.AcceptedAt = time.Now()
		a.cronosApp.DB.Save(&invoice)
		// Retrieve the entries as they stand from the acceptance page -- disassociate the voided entries
		// and mark all the draft entries as accepted
		entries := invoice.Entries
		for i, _ := range entries {
			// Only move the non-voided entries through. We keep the voided ones for reference.
			if entries[i].State == cronos.EntryStateDraft.String() {
				// Set the individual entry states to approved if they are in draft
				entries[i].State = cronos.EntryStateApproved.String()
			}
		}
		a.cronosApp.DB.Save(&entries)
		// Update the invoice totals from the associated entries
		a.cronosApp.UpdateInvoiceTotals(&invoice)
		// Save the invoice

		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(struct {
			State string
			ID    uint
		}{cronos.InvoiceStateApproved.String(), invoice.ID})
		return
	case state == "void":
		// Set the invoice state to void and mark the time
		invoice.State = cronos.InvoiceStateVoid.String()
		invoice.ClosedAt = time.Now()
		a.cronosApp.DB.Save(&invoice)
		// Retrieve the entries and mark all as voided
		entries := invoice.Entries
		for i, _ := range entries {
			entries[i].State = cronos.EntryStateVoid.String()
		}
		// Save the entries
		a.cronosApp.DB.Save(&entries)
		// Save the invoice
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(struct {
			State string
			ID    uint
		}{cronos.InvoiceStateVoid.String(), invoice.ID})
		return
	case state == "send":
		invoice.State = cronos.InvoiceStateSent.String()
		invoice.SentAt = time.Now()
		invoice.DueAt = time.Now().AddDate(0, 0, 30)
		// Save the invoice
		a.cronosApp.DB.Save(&invoice)
		var entries []cronos.Entry
		a.cronosApp.DB.Where("invoice_id = ?", invoice.ID).Find(&entries)
		for i, _ := range entries {
			if entries[i].State == cronos.EntryStateApproved.String() {
				entries[i].State = cronos.EntryStateSent.String()
			}
		}
		a.cronosApp.DB.Save(&entries)
		// Save the locked file to GCS
		err := a.cronosApp.SaveInvoiceToGCS(&invoice)
		if err != nil {
			fmt.Println(err)
		}
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(struct {
			State string
			ID    uint
		}{cronos.InvoiceStateSent.String(), invoice.ID})
		return

	case state == "paid":
		invoice.State = cronos.InvoiceStatePaid.String()
		invoice.ClosedAt = time.Now()
		// Save the invoice
		a.cronosApp.DB.Save(&invoice)
		var entries []cronos.Entry
		a.cronosApp.DB.Where("invoice_id = ?", invoice.ID).Find(&entries)
		for i, _ := range entries {
			entries[i].State = cronos.EntryStatePaid.String()
		}
		a.cronosApp.DB.Save(&entries)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(struct {
			State string
			ID    uint
		}{cronos.InvoiceStatePaid.String(), invoice.ID})
		return
	}
}

func (a *App) AdjustmentHandler(w http.ResponseWriter, r *http.Request) {
	// CRUD for our Adjustment Object
	vars := mux.Vars(r)
	var adjustment cronos.Adjustment
	switch {
	case r.Method == "GET":
		a.cronosApp.DB.First(&adjustment, vars["id"])
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(&adjustment)
		return
	case r.Method == "PUT":
		a.cronosApp.DB.First(&adjustment, vars["id"])
		if r.FormValue("amount") != "" {
			amountFloat, _ := strconv.ParseFloat(r.FormValue("amount"), 64)
			adjustment.Amount = amountFloat
		}
		if r.FormValue("notes") != "" {
			adjustment.Notes = r.FormValue("notes")
		}
		a.cronosApp.DB.Save(&adjustment)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(&adjustment)
		return
	case r.Method == "POST":
		invoiceID, _ := strconv.Atoi(r.FormValue("invoice_id"))
		adjustment.InvoiceID = uint(invoiceID)
		amountFloat, _ := strconv.ParseFloat(r.FormValue("amount"), 64)
		adjustment.Amount = amountFloat
		adjustment.Notes = r.FormValue("notes")
		a.cronosApp.DB.Create(&adjustment)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(&adjustment)
		return
	case r.Method == "DELETE":
		a.cronosApp.DB.Where("id = ?", vars["id"]).Delete(&cronos.Adjustment{})
		_ = json.NewEncoder(w).Encode("Deleted Record")
		return
	default:
		fmt.Println("Fatal Error")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func (a *App) AdjustmentStateHandler(w http.ResponseWriter, r *http.Request) {
	// State handler for adjustments, functionally identical to the invoice state handler
	vars := mux.Vars(r)
	var adjustment cronos.Adjustment
	a.cronosApp.DB.First(&adjustment, vars["id"])
	status := vars["state"]
	switch {
	case status == "approve":
		adjustment.State = cronos.AdjustmentStateApproved.String()
		a.cronosApp.DB.Save(&adjustment)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(struct{ State string }{cronos.AdjustmentStateApproved.String()})
		return
	case status == "void":
		adjustment.State = cronos.AdjustmentStateVoid.String()
		a.cronosApp.DB.Save(&adjustment)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(struct{ State string }{cronos.AdjustmentStateVoid.String()})
		return
	case status == "draft":
		adjustment.State = cronos.AdjustmentStateDraft.String()
		a.cronosApp.DB.Save(&adjustment)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(struct{ State string }{cronos.AdjustmentStateDraft.String()})
		return
	}
}

func (a *App) BackfillProjectInvoicesHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieve the project and backfill all the invoices
	vars := mux.Vars(r)
	projectID := vars["id"]
	go a.cronosApp.BackfillEntriesForProject(projectID)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	return
}

func (a *App) generateLinkedEntry(entry *cronos.Entry) cronos.Entry {
	var linkedEntry cronos.Entry
	linkedEntry.ProjectID = entry.ProjectID
	linkedEntry.EmployeeID = entry.EmployeeID
	linkedEntry.BillingCodeID = entry.BillingCodeID
	linkedEntry.Start = entry.Start
	linkedEntry.End = entry.End
	linkedEntry.Internal = true
	linkedEntry.Notes = entry.Notes
	linkedEntry.JournalID = 2
	return linkedEntry
}
