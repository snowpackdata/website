package main

import (
	"context"
	"embed"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path"
	"strings"
	"time"

	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/snowpackdata/cronos"
	"golang.org/x/crypto/bcrypt"
)

//go:embed static/admin/assets
var adminAssets embed.FS

// App holds our information for accessing various applications and methods across modules
type App struct {
	cronosApp *cronos.App
	logger    *log.Logger
	GitHash   string
	DevToken  string // JWT token for development environment
}

// createFileServer creates a file server for embedded assets with proper MIME types
func createFileServer(embeddedFS embed.FS, fsRoot string) http.Handler {
	// Get a sub-filesystem at the specified root
	subFS, err := fs.Sub(embeddedFS, fsRoot)
	if err != nil {
		log.Fatal("Failed to create sub-filesystem:", err)
	}

	// Return a handler that sets the correct MIME type before serving files
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Debug log to see what path is being requested
		log.Printf("Serving embedded file: %s from root %s", r.URL.Path, fsRoot)

		// Get the file extension and set appropriate Content-Type header
		ext := path.Ext(r.URL.Path)
		switch ext {
		case ".css":
			w.Header().Set("Content-Type", "text/css; charset=utf-8")
		case ".js":
			w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		case ".svg":
			w.Header().Set("Content-Type", "image/svg+xml")
		case ".woff":
			w.Header().Set("Content-Type", "font/woff")
		case ".woff2":
			w.Header().Set("Content-Type", "font/woff2")
		case ".ttf":
			w.Header().Set("Content-Type", "font/ttf")
		}

		// Serve the file from the embedded filesystem
		http.FileServer(http.FS(subFS)).ServeHTTP(w, r)
	})
}

// registerDevUser creates a test user with ID 1 for local development testing
func (a *App) registerDevUser() string {
	// Check if user with ID 1 exists
	var user cronos.User
	if a.cronosApp.DB.Where("id = ?", 1).First(&user).RowsAffected == 0 {
		log.Println("Creating development user with ID 1")
		// Create a new user if it doesn't exist
		user = cronos.User{
			Email: "dev@example.com",
			Role:  cronos.UserRoleAdmin.String(),
		}
		a.cronosApp.DB.Create(&user)

		// Set ID to 1 explicitly if needed
		a.cronosApp.DB.Model(&user).Update("id", 1)
	} else {
		log.Println("Development user with ID 1 already exists")
	}

	// Set password for the user
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("devpassword"), bcrypt.DefaultCost)
	if err != nil {
		log.Println("Error generating password hash:", err)
		return ""
	}
	user.Password = string(hashedPassword)
	a.cronosApp.DB.Save(&user)

	// Create or update employee record for admin user
	var employee cronos.Employee
	if a.cronosApp.DB.Where("user_id = ?", 1).First(&employee).RowsAffected == 0 {
		log.Println("Creating employee record for development user")
		employee = cronos.Employee{
			UserID:    1,
			FirstName: "Dev",
			LastName:  "User",
			StartDate: time.Now(),
		}
		a.cronosApp.DB.Create(&employee)
	} else {
		log.Println("Updating existing employee record for development user")
		employee.FirstName = "Dev"
		employee.LastName = "User"
		a.cronosApp.DB.Save(&employee)
	}

	// Generate JWT token
	claims := Claims{
		UserID:  1,
		Email:   user.Email,
		IsStaff: true, // Admin users are staff
		RegisteredClaims: &jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 720)),
		},
	}
	token := jwt.NewWithClaims(jwt.GetSigningMethod("HS256"), claims)
	tokenString, err := token.SignedString([]byte(JWTSecret))
	if err != nil {
		log.Println("Error signing JWT token:", err)
		return ""
	}

	log.Printf("Created development JWT token for user_id=1 (first 10 chars: %s...)", tokenString[:10])
	return tokenString
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
		// Remove the existing database and create a new one
		cronosApp.InitializeSQLite()
		cronosApp.Migrate()
	}

	// Add the cronos app to our webapp struct to access it across handlers
	a := &App{
		cronosApp: &cronosApp,
		logger:    log.New(os.Stdout, "http: ", log.LstdFlags),
		GitHash:   gitHash,
	}

	// Register a development user and get a JWT token in local/dev environment
	env := os.Getenv("ENVIRONMENT")
	if env == "local" || env == "development" {
		log.Println("Development environment detected, registering dev user")
		// Register a dev user and get JWT token
		a.DevToken = a.registerDevUser()
		log.Println("Development JWT token created")
	}

	// Mux is a subrouter generator that allows us to handle requests and route them to the appropriate handler
	// the router allows us to handle a couple high level subrouters and then specific routes.
	r := mux.NewRouter()

	// Add the App context middleware to all routes
	r.Use(a.AppContextMiddleware)

	// Define a subrouter to handle files at static for accessing static content
	// static, api, and r are all subrouters that allow us to handle different types of requests

	static := r.PathPrefix("/assets").Subrouter()
	static.Handle("/{*}/{*}", http.StripPrefix("/assets/", http.FileServer(http.Dir("./assets"))))

	branding := r.PathPrefix("/branding").Subrouter()
	branding.Handle("/{*}/{*}", http.StripPrefix("/branding/", http.FileServer(http.Dir("./branding"))))

	// Add a static file server for admin assets using embedded files
	adminStatic := r.PathPrefix("/admin/assets/").Subrouter()
	adminStatic.PathPrefix("/").Handler(http.StripPrefix("/admin/assets/", createFileServer(adminAssets, "static/admin/assets")))

	// Add a direct handler that can handle path mismatches by checking all files
	r.PathPrefix("/admin/assets/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Log the requested path
		requestedPath := r.URL.Path
		log.Printf("Direct file request: %s", requestedPath)

		// Always set text/css for CSS files regardless of path
		if strings.HasSuffix(requestedPath, ".css") {
			w.Header().Set("Content-Type", "text/css; charset=utf-8")

			// If it's a specific CSS file that doesn't exist but we have another one, serve that
			if strings.Contains(requestedPath, "index-") && strings.HasSuffix(requestedPath, ".css") {
				// List the files in the embedded directory to find any CSS file
				entries, err := adminAssets.ReadDir("static/admin/assets")
				if err != nil {
					http.Error(w, "Failed to read directory", http.StatusInternalServerError)
					return
				}

				// Look for any CSS file to serve instead
				for _, entry := range entries {
					if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".css") && strings.HasPrefix(entry.Name(), "index-") {
						log.Printf("Found substitute CSS file: %s for requested: %s", entry.Name(), requestedPath)

						// Open the found CSS file
						cssFile, err := adminAssets.Open("static/admin/assets/" + entry.Name())
						if err != nil {
							continue // Try the next file
						}
						defer cssFile.Close()

						// Get file info
						stat, err := cssFile.Stat()
						if err != nil {
							continue // Try the next file
						}

						// Serve the CSS file with the proper MIME type
						http.ServeContent(w, r, stat.Name(), stat.ModTime(), cssFile.(io.ReadSeeker))
						return
					}
				}
			}
		}

		// Strip the prefix and try to serve from the embedded filesystem
		path := strings.TrimPrefix(requestedPath, "/admin/assets/")
		file, err := adminAssets.Open("static/admin/assets/" + path)
		if err != nil {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}
		defer file.Close()

		// Get file info to check if it's a directory
		stat, err := file.Stat()
		if err != nil {
			http.Error(w, "Failed to get file info", http.StatusInternalServerError)
			return
		}

		// If it's a directory, return 404 (or you could implement directory listing)
		if stat.IsDir() {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}

		// Copy the file content to the response
		http.ServeContent(w, r, stat.Name(), stat.ModTime(), file.(io.ReadSeeker))
	})

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
	// Add a catch-all route for the Vue Router's history mode
	r.HandleFunc("/admin/{any:.*}", a.AdminLandingHandler).Methods("GET")
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

	// Apply CORS middleware for development
	corsMiddleware := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization", "x-access-token", "*"}),
		handlers.AllowCredentials(),
		handlers.MaxAge(86400),
	)

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
		Handler:      corsMiddleware(logger), // Apply CORS middleware to the logger handler
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
