package main

import (
	"context"
	"encoding/json"
	jwt "github.com/golang-jwt/jwt/v5"
	"log"
	"net/http"
	"strings"
)

// Claims is a non-persistent object that is used to store the JWT token and associated information
type Claims struct {
	UserID           uint
	Email            string
	IsStaff          bool
	RegisteredClaims *jwt.RegisteredClaims
}

func (c Claims) GetExpirationTime() (*jwt.NumericDate, error) {
	return c.RegisteredClaims.ExpiresAt, nil
}

func (c Claims) GetIssuedAt() (*jwt.NumericDate, error) {
	return c.RegisteredClaims.IssuedAt, nil
}

func (c Claims) GetNotBefore() (*jwt.NumericDate, error) {
	return c.RegisteredClaims.NotBefore, nil
}

func (c Claims) GetIssuer() (string, error) {
	return "snowpackdata.com", nil
}

func (c Claims) GetSubject() (string, error) {
	return c.Email, nil
}

func (c Claims) GetAudience() (jwt.ClaimStrings, error) {
	return c.RegisteredClaims.Audience, nil
}

func CommonMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, Access-Control-Request-Headers, Access-Control-Request-Method, Connection, Host, Origin, User-Agent, Referer, Cache-Control, X-header")
		next.ServeHTTP(w, r)
	})
}
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Do stuff here
		log.Println(r.RequestURI)
		// Call the next handler, which can be another middleware in the chain, or the final handler.
		next.ServeHTTP(w, r)
	})
}

// Exception sends messages to frontend via json
type Exception struct {
	Message string `json:"message"`
}

// JwtVerify is a middlware function to parse x-access-token
func JwtVerify(next http.Handler) http.Handler {
	// This is a middleware function and so it simply returns another handler
	// from within itself.
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// the first action is to retrieve the token from the header and trim whitespace
		var header = r.Header.Get("x-access-token") //Grab the token from the header
		header = strings.TrimSpace(header)

		// If there is no header provided we'll return a 403 and an error message
		if header == "" {
			//Token is missing, returns with error code 403 Unauthorized
			w.WriteHeader(http.StatusForbidden)
			err := json.NewEncoder(w).Encode(Exception{Message: "Missing auth token"})
			if err != nil {
				log.Println(err)
			}
			return
		}

		// With the header parsed, next parse the token and write the claims to a Claims object so
		// that we can access the user_id in the context of the request
		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(header, &claims, func(token *jwt.Token) (interface{}, error) {
			return []byte("secret"), nil
		})
		if err != nil {
			w.WriteHeader(http.StatusForbidden)
			err = json.NewEncoder(w).Encode(Exception{Message: err.Error()})
			if err != nil {
				log.Println(err)
			}
			return
		}
		if !token.Valid {
			w.WriteHeader(http.StatusForbidden)
			err = json.NewEncoder(w).Encode(Exception{Message: "Invalid authorization token"})
			if err != nil {
				log.Println(err)
			}
			return
		}
		// Finally we'll pass the user ID to the context variable so that we can access it in
		// the subsequent handler functions
		ctx := context.WithValue(r.Context(), "user_id", claims["UserID"])
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
