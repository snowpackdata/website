package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func main() {
	var wait time.Duration
	// SET ROUTES HERE
	r := mux.NewRouter()
	// Define a subrouter to handle files at static for accessing static content
	static := r.PathPrefix("/assets").Subrouter()
	static.Handle("/{*}/{*}", http.StripPrefix("/assets/", http.FileServer(http.Dir("./assets"))))

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
	// logger := handlers.CombinedLoggingHandler(os.Stdout, r)

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
