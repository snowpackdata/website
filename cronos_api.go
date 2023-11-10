package main

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/snowpackdata/cronos"
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
	a.cronosApp.DB.Preload("Rate").Find(&billingCodes)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(&billingCodes)
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
			start, err := time.Parse("2006-01-02 15:04", r.FormValue("active_start"))
			if err != nil {
				fmt.Println(err)
			}
			project.ActiveStart = start
		}
		if r.FormValue("active_end") != "" {
			// first convert the string to a time.Time object
			endtime, err := time.Parse("2006-01-02 15:04", r.FormValue("active_end"))
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
		a.cronosApp.DB.Save(&project)
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		_ = json.NewEncoder(w).Encode(&project)
		return
	case r.Method == "POST":
		project.Name = r.FormValue("name")
		project.ActiveStart, _ = time.Parse("2006-01-02 15:04", r.FormValue("active_start"))
		project.ActiveEnd, _ = time.Parse("2006-01-02 15:04", r.FormValue("active_end"))
		project.BudgetHours, _ = strconv.Atoi(r.FormValue("budget_hours"))
		project.BudgetDollars, _ = strconv.Atoi(r.FormValue("budget_dollars"))
		project.Internal, _ = strconv.ParseBool(r.FormValue("internal"))
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
		if r.FormValue("admin_id") != "" {
			var admin cronos.User
			a.cronosApp.DB.Where("id = ?", r.FormValue("admin_id")).First(&admin)
			account.AdminID = admin.ID
			account.Admin = admin
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
			start, err := time.Parse("2006-01-02 15:04", r.FormValue("active_start"))
			if err != nil {
				fmt.Println(err)
			}
			billingCode.ActiveStart = start
		}
		if r.FormValue("active_end") != "" {
			// first convert the string to a time.Time object
			endtime, err := time.Parse("2006-01-02 15:04", r.FormValue("active_end"))
			if err != nil {
				fmt.Println(err)
			}
			billingCode.ActiveEnd = endtime
		}
		if r.FormValue("internal") != "" {
			internal, _ := strconv.ParseBool(r.FormValue("internal"))
			billingCode.Internal = internal
		}
		if r.FormValue("rate_id") != "" {
			var rate cronos.Rate
			a.cronosApp.DB.Where("id = ?", r.FormValue("rate_id")).First(&rate)
			billingCode.RateID = rate.ID
			billingCode.Rate = rate
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
		billingCode.ActiveStart, _ = time.Parse("2006-01-02 15:04", r.FormValue("active_start"))
		billingCode.ActiveEnd, _ = time.Parse("2006-01-02 15:04", r.FormValue("active_end"))
		billingCode.Internal, _ = strconv.ParseBool(r.FormValue("internal"))
		var project cronos.Project
		a.cronosApp.DB.Where("id = ?", r.FormValue("project_id")).First(&project)
		billingCode.ProjectID = project.ID
		project.BillingCodes = append(project.BillingCodes, billingCode)
		a.cronosApp.DB.Save(&project)
		var rate cronos.Rate
		a.cronosApp.DB.Where("id = ?", r.FormValue("rate_id")).First(&rate)
		billingCode.RateID = rate.ID
		billingCode.Rate = rate
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
			start, err := time.Parse("2006-01-02 15:04", r.FormValue("active_from"))
			if err != nil {
				fmt.Println(err)
			}
			rate.ActiveFrom = start
		}
		if r.FormValue("active_to") != "" {
			// first convert the string to a time.Time object
			endtime, err := time.Parse("2006-01-02 15:04", r.FormValue("active_to"))
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
		rate.ActiveFrom, _ = time.Parse("2006-01-02 15:04", r.FormValue("active_from"))
		rate.ActiveTo, _ = time.Parse("2006-01-02 15:04", r.FormValue("active_to"))
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
