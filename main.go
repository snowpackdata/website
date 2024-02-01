package main

import (
	"context"
	"fmt"
	"github.com/snowpackdata/cronos"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

// App holds our information for accessing various applications and methods across modules
type App struct {
	cronosApp *cronos.App
}

func main() {

	var wait time.Duration

	// We must initialize the cronos app to access its databases and methods
	// and then add it to our webapp struct to access it across handlers
	user := os.Getenv("CLOUD_SQL_USERNAME")
	password := os.Getenv("CLOUD_SQL_PASSWORD")
	dbHost := os.Getenv("CLOUD_SQL_CONNECTION_NAME")
	databaseName := os.Getenv("CLOUD_SQL_DATABASE_NAME")
	socketPath := "/cloudsql/" + dbHost
	cronosApp := cronos.App{}
	dbURI := fmt.Sprintf("user=%s password=%s database=%s host=%s", user, password, databaseName, socketPath)
	fmt.Println(dbURI)
	if os.Getenv("ENVIRONMENT") == "production" {
		cronosApp.InitializeCloud(dbURI)
	} else {
		cronosApp.InitializeLocal(user, password, dbHost, databaseName)
	}
	//cronosApp.Migrate()

	// Initialize our Storage Client
	//cronosApp.Migrate()

	a := &App{cronosApp: &cronosApp}

	// Test the Invoice
	var invoice cronos.Invoice
	a.cronosApp.DB.Where("id = ?", 6).First(&invoice)
	err := a.cronosApp.SaveInvoiceToGCS(&invoice)
	if err != nil {
		log.Println(err)
	}

	r := mux.NewRouter()
	// Define a subrouter to handle files at static for accessing static content
	static := r.PathPrefix("/assets").Subrouter()
	static.Handle("/{*}/{*}", http.StripPrefix("/assets/", http.FileServer(http.Dir("./assets"))))
	api := r.PathPrefix("/api").Subrouter()
	api.Use(JwtVerify)

	r.HandleFunc("/", indexHandler)
	r.HandleFunc("/services", servicesHandler)
	r.HandleFunc("/reports/examples/nba-report", exampleReportHandler)
	r.HandleFunc("/blog", blogLandingHandler)
	r.HandleFunc("/blog/{slug}", blogHandler)

	// Cronos Application pages, internal and external
	r.HandleFunc("/admin", a.AdminLandingHandler).Methods("GET")
	r.HandleFunc("/cronos", a.CronosLandingHandler).Methods("GET")
	// Our login and registration handlers are not protected by JWT
	r.HandleFunc("/login", a.LoginLandingHandler).Methods("GET")
	r.HandleFunc("/verify_login", a.VerifyLogin).Methods("POST")
	r.HandleFunc("/register", a.RegistrationLandingHandler).Methods("GET")
	r.HandleFunc("/register_user", a.RegisterUser).Methods("POST")
	r.HandleFunc("/verify_email", a.VerifyEmail).Methods("POST")
	api.HandleFunc("/invoices/draft", a.DraftInvoiceListHandler).Methods("GET")
	api.HandleFunc("/invoices/accepted", a.InvoiceListHandler).Methods("GET")
	api.HandleFunc("/invoices/{id:[0-9]+}/{state:(?:approve)|(?:send)|(?:paid)|(?:void)}", a.InvoiceStateHandler).Methods("POST")
	api.HandleFunc("/projects", a.ProjectsListHandler).Methods("GET")
	api.HandleFunc("/projects/{id:[0-9]+}", a.ProjectHandler).Methods("GET", "PUT", "POST", "DELETE")
	api.HandleFunc("/projects/{id:[0-9]+}/backfill", a.BackfillProjectInvoicesHandler).Methods("POST")
	api.HandleFunc("/entries", a.EntriesListHandler).Methods("GET")
	api.HandleFunc("/entries/{id:[0-9]+}", a.EntryHandler).Methods("GET", "PUT", "POST", "DELETE")
	api.HandleFunc("/entries/state/{id:[0-9]+}/{state:(?:void)|(?:draft)|(?:approve)}", a.EntryStateHandler).Methods("POST")
	api.HandleFunc("/staff", a.StaffListHandler).Methods("GET")
	api.HandleFunc("/accounts", a.AccountsListHandler).Methods("GET")
	api.HandleFunc("/accounts/{id:[0-9]+}", a.AccountHandler).Methods("GET", "PUT", "POST", "DELETE")
	api.HandleFunc("/accounts/{id:[0-9]+}/invite", a.InviteUserHandler).Methods("POST")
	api.HandleFunc("/rates", a.RatesListHandler).Methods("GET")
	api.HandleFunc("/rates/{id:[0-9]+}", a.RateHandler).Methods("GET", "PUT", "POST", "DELETE")
	api.HandleFunc("/billing_codes", a.BillingCodesListHandler).Methods("GET")
	api.HandleFunc("/billing_codes/{id:[0-9]+}", a.BillingCodeHandler).Methods("GET", "PUT", "POST", "DELETE")

	// Logging for web server
	f, _ := os.Create("/var/log/golang/golang-server.log")
	defer func() {
		_ = f.Close()
	}()
	logger := handlers.CombinedLoggingHandler(f, r)

	// Logging for dev
	//logger := handlers.CombinedLoggingHandler(os.Stdout, r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
		log.Printf("Defaulting to port %s", port)
	}

	srv := &http.Server{
		Addr: ":" + port,
		// Good practice to set timeouts to avoid Slowloris attacks.
		WriteTimeout: time.Second * 15,
		ReadTimeout:  time.Second * 15,
		IdleTimeout:  time.Second * 60,
		Handler:      logger, // Pass our instance of gorilla/mux in.
	}

	// Run our server in a goroutine so that it doesn't block.
	go func() {
		log.Printf("Server Running on %q\n", srv.Addr)
		if err := srv.ListenAndServe(); err != nil {
			log.Println(err)
		}
	}()

	c := make(chan os.Signal, 1)
	// We'll accept graceful shutdowns when quit via SIGINT (Ctrl+C)
	// SIGKILL, SIGQUIT or SIGTERM (Ctrl+/) will not be caught.
	signal.Notify(c, os.Interrupt)

	// Block until we receive our signal.
	<-c

	// Create a deadline to wait for.
	ctx, cancel := context.WithTimeout(context.Background(), wait)
	defer cancel()
	// Doesn't block if no connections, but will otherwise wait
	// until the timeout deadline.
	srv.Shutdown(ctx)
	// Optionally, you could run srv.Shutdown in a goroutine and block on
	// <-ctx.Done() if your application should wait for other services
	// to finalize based on context cancellation.
	log.Println("shutting down")
	os.Exit(0)

}
