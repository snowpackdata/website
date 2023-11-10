package main

import (
	"context"
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

	// We must initialize the cronos app to access it's databases and methods
	// and then add it to our webapp struct to access it across handlers
	cronosApp := cronos.App{}
	cronosApp.Initialize()
	a := &App{cronosApp: &cronosApp}

	r := mux.NewRouter()
	// Define a subrouter to handle files at static for accessing static content
	static := r.PathPrefix("/assets").Subrouter()
	static.Handle("/{*}/{*}", http.StripPrefix("/assets/", http.FileServer(http.Dir("./assets"))))
	admin := r.PathPrefix("/admin").Subrouter()
	admin.Use(JwtVerify)
	// Our login and registration handlers are not protected by JWT
	r.HandleFunc("/register", a.RegistrationLandingHandler).Methods("GET")
	r.HandleFunc("/register", a.RegisterUser).Methods("POST")
	r.HandleFunc("/verify-email", a.VerifyEmail).Methods("POST")

	r.HandleFunc("/", indexHandler)
	r.HandleFunc("/services", servicesHandler)
	r.HandleFunc("/reports/examples/nba-report", exampleReportHandler)
	r.HandleFunc("/blog", blogLandingHandler)
	r.HandleFunc("/blog/{slug}", blogHandler)

	// Logging for web server
	f, _ := os.Create("/var/log/golang/golang-server.log")
	defer f.Close()
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
