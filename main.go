package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/snowpackdata/cronos"
)

// App holds our information for accessing various applications and methods across modules
type App struct {
	cronosApp *cronos.App
	logger    *log.Logger
	GitHash   string
}

func main() {

	var wait time.Duration

	// We must initialize the cronos app to access its databases and methods
	// and then add it to our webapp struct to access it across handlers
	user := os.Getenv("CLOUD_SQL_USERNAME")
	password := os.Getenv("CLOUD_SQL_PASSWORD")
	dbHost := os.Getenv("CLOUD_SQL_CONNECTION_NAME")
	databaseName := os.Getenv("CLOUD_SQL_DATABASE_NAME")
	// Get the GIT_HASH value (default to "dev" if not set)
	gitHash := os.Getenv("GIT_HASH")
	if gitHash == "" {
		gitHash = "dev"
	}

	socketPath := "/cloudsql/" + dbHost
	cronosApp := cronos.App{}
	dbURI := fmt.Sprintf("user=%s password=%s database=%s host=%s", user, password, databaseName, socketPath)
	fmt.Println(dbURI)

	// Establish a different connection based on the environment
	if os.Getenv("ENVIRONMENT") == "production" {
		// Production environments should have a production flag to default to the google cloud
		// database connection provided through the application default credentials
		cronosApp.InitializeCloud(dbURI)
	} else if os.Getenv("ENVIRONMENT") == "development" {
		// Development environments should have a development flag to default to the local
		// database connection which must be established via a local cloud sql proxy
		cronosApp.InitializeLocal(user, password, dbHost, databaseName)
		// Only call migration when we are in development mode
		// I often comment this out if I'm doing a fast development cycle
		//cronosApp.Migrate()
	} else {
		// If no environment is set, default to the local database connection
		// which must be established via a local SQLite instance, you will need to
		// run the migration to create the database schema
		cronosApp.InitializeSQLite()
		cronosApp.Migrate()
	}

	// Add the cronos app to our webapp struct to access it across handlers
	a := &App{
		cronosApp: &cronosApp,
		logger:    log.New(os.Stdout, "http: ", log.LstdFlags),
		GitHash:   gitHash,
	}

	// Mux is a subrouter generator that allows us to handle requests and route them to the appropriate handler
	// the router allows us to handle a couple high level subrouters and then specific routes.
	r := mux.NewRouter()
	// Define a subrouter to handle files at static for accessing static content
	// static, api, and r are all subrouters that allow us to handle different types of requests

	static := r.PathPrefix("/assets").Subrouter()
	static.Handle("/{*}/{*}", http.StripPrefix("/assets/", http.FileServer(http.Dir("./assets"))))

	branding := r.PathPrefix("/branding").Subrouter()
	branding.Handle("/{*}/{*}", http.StripPrefix("/branding/", http.FileServer(http.Dir("./branding"))))
	// All requests to the api subrouter will be verified by the JwtVerify middleware
	api := r.PathPrefix("/api").Subrouter()
	api.Use(JwtVerify)

	// our main routes are handled by the main router and are not protected by JWT
	r.HandleFunc("/", a.indexHandler)
	r.NotFoundHandler = http.HandlerFunc(notFoundHandler)
	r.HandleFunc("/services", a.servicesHandler)
	r.HandleFunc("/about", a.aboutHandler)
	r.HandleFunc("/contact", a.contactHandler)
	r.HandleFunc("/free-assessment", a.dataAssessmentHandler)
	r.HandleFunc("/reports/examples/nba-report", exampleReportHandler)
	r.HandleFunc("/blog", a.blogLandingHandler)
	r.HandleFunc("/case-studies", a.caseStudyLandingHandler)
	r.HandleFunc("/articles/{tag}", a.blogTagHandler)
	r.HandleFunc("/blog/{slug}", a.blogHandler)
	r.HandleFunc("/contact-us-submit", a.ContactPageEmail).Methods("POST")

	// Cronos Application pages, internal and external
	r.HandleFunc("/admin", a.AdminLandingHandler).Methods("GET")
	r.HandleFunc("/cronos", a.CronosLandingHandler).Methods("GET")
	// Our login and registration handlers are not protected by JWT
	r.HandleFunc("/login", a.LoginLandingHandler).Methods("GET")
	r.HandleFunc("/verify_login", a.VerifyLogin).Methods("POST")
	r.HandleFunc("/register", a.RegistrationLandingHandler).Methods("GET")
	r.HandleFunc("/register_user", a.RegisterUser).Methods("POST")
	r.HandleFunc("/verify_email", a.VerifyEmail).Methods("POST")
	r.HandleFunc("/surveys/new", a.SurveyUpsert).Methods("POST")
	r.HandleFunc("/surveys/{id:[0-9]+}/response", a.SurveyResponse).Methods("POST")

	// Our API routes are protected by JWT
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
	api.HandleFunc("/active_billing_codes", a.ActiveBillingCodesListHandler).Methods("GET")
	api.HandleFunc("/adjustments/{id:[0-9]+}", a.AdjustmentHandler).Methods("GET", "PUT", "POST", "DELETE")
	api.HandleFunc("/adjustments/state/{id:[0-9]+}/{state:(?:void)|(?:draft)|(?:approve)}", a.AdjustmentStateHandler).Methods("POST")
	api.HandleFunc("/user/invoices", a.ClientInvoiceHandler).Methods("GET")
	api.HandleFunc("/bills", a.BillListHandler).Methods("GET")
	api.HandleFunc("/bills/{id:[0-9]+}", a.BillHandler).Methods("GET")
	api.HandleFunc("/bills/{id:[0-9]+}/regenerate", a.RegenerateBillHandler).Methods("POST")
	api.HandleFunc("/bills/{id:[0-9]+}/{state:(?:paid)|(?:void)}", a.BillStateHandler).Methods("POST")

	// Logging for web server
	f, _ := os.Create("/var/log/golang/golang-server.log")
	defer func() {
		_ = f.Close()
	}()
	logger := handlers.CombinedLoggingHandler(f, r)

	// Logging for dev
	//logger := handlers.CombinedLoggingHandler(os.Stdout, r)

	port := os.Getenv("PORT")
	// GCP will set the port for us, but if it is not set, default to 8080
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
