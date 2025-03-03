package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	jwt "github.com/golang-jwt/jwt/v5"
)

// AppContextKey is used as the key for storing and retrieving the App from the context
type AppContextKey string

// AppContextMiddleware adds the App instance to the request context
func (a *App) AppContextMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Create a new context with the App instance
		ctx := context.WithValue(r.Context(), AppContextKey("app"), a)
		// Call the next handler with the updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

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
		// Handle OPTIONS requests for CORS preflight
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		log.Printf("JwtVerify: Processing request for %s", r.URL.Path)

		// Get the App instance from the context
		appInstance, _ := r.Context().Value(AppContextKey("app")).(*App)
		log.Printf("JwtVerify: App instance retrieved from context: %v", appInstance != nil)

		// Check if request is from development environment
		origin := r.Header.Get("Origin")
		referer := r.Header.Get("Referer")
		isDev := strings.Contains(origin, "localhost") || strings.Contains(referer, "localhost")
		host := r.Host
		isLocalhost := strings.Contains(host, "localhost")
		inDevMode := isDev || isLocalhost || os.Getenv("ENVIRONMENT") == "local"

		// Log request details for debugging
		log.Printf("JwtVerify: Request from: %s, Origin: %s, Referer: %s, Host: %s, isDev: %v, isLocalhost: %v, ENVIRONMENT=%s, inDevMode: %v",
			r.RemoteAddr, origin, referer, host, isDev, isLocalhost, os.Getenv("ENVIRONMENT"), inDevMode)

		// the first action is to retrieve the token from the header and trim whitespace
		var header = r.Header.Get("x-access-token") //Grab the token from the header
		header = strings.TrimSpace(header)
		hasToken := header != ""
		log.Printf("JwtVerify: Token from header exists: %v", hasToken)

		var userId uint = 0
		var userEmail string = ""
		var isUserStaff bool = false

		if hasToken {
			// Log first 10 chars of token for debugging (don't log full token for security)
			tokenPrefix := header
			if len(header) > 10 {
				tokenPrefix = header[:10]
			}
			log.Printf("JwtVerify: Token prefix: %s...", tokenPrefix)

			// Debug - log token parts
			parts := strings.Split(header, ".")
			log.Printf("JwtVerify: Token has %d parts", len(parts))
		}

		// Check if we're in development mode and have a dev token
		if inDevMode && appInstance != nil && appInstance.DevToken != "" && header == "" {
			log.Printf("JwtVerify: Using development JWT token (first 10 chars): %s...", appInstance.DevToken[:10])
			header = appInstance.DevToken
		}

		// If there is no header provided we'll return a 403 and an error message
		if header == "" {
			log.Println("JwtVerify: No token found, returning 403")
			//Token is missing, returns with error code 403 Unauthorized
			w.WriteHeader(http.StatusForbidden)
			err := json.NewEncoder(w).Encode(Exception{Message: "Missing auth token"})
			if err != nil {
				log.Println(err)
			}
			return
		}

		// Log JWT secret info (first few chars only for security)
		secretPrefix := JWTSecret
		if len(JWTSecret) > 5 {
			secretPrefix = JWTSecret[:5]
		}
		log.Printf("JwtVerify: Using JWT secret with prefix: %s...", secretPrefix)

		// In dev mode with token from the app, extract claims directly without validation
		if inDevMode && appInstance != nil && header == appInstance.DevToken {
			log.Printf("JwtVerify: In development mode using app token, bypassing token validation")

			// For dev mode, we'll extract the user ID from the token without validation
			parts := strings.Split(header, ".")
			if len(parts) >= 2 {
				// Try to decode the payload
				// Base64 decode the payload (middle part)
				// Add padding if needed
				payload := parts[1]
				if l := len(payload) % 4; l > 0 {
					payload += strings.Repeat("=", 4-l)
				}

				decoded, err := base64.URLEncoding.DecodeString(payload)
				if err != nil {
					log.Printf("JwtVerify: Error decoding token payload: %v", err)
				} else {
					// Parse JSON payload to extract UserID
					var claims map[string]interface{}
					if err := json.Unmarshal(decoded, &claims); err != nil {
						log.Printf("JwtVerify: Error parsing claims JSON: %v", err)
					} else {
						// Extract user ID
						if uid, ok := claims["UserID"].(float64); ok {
							userId = uint(uid)
							log.Printf("JwtVerify: Extracted UserID from dev token: %d", userId)
						}
						if email, ok := claims["Email"].(string); ok {
							userEmail = email
							log.Printf("JwtVerify: Extracted Email from dev token: %s", userEmail)
						}
						if isStaff, ok := claims["IsStaff"].(bool); ok {
							isUserStaff = isStaff
							log.Printf("JwtVerify: Extracted IsStaff from dev token: %v", isUserStaff)
						}
					}
				}
			}

			// Add user ID to context and proceed
			if userId > 0 {
				log.Printf("JwtVerify: Setting user_id context to %d (dev mode)", userId)
				ctx := context.WithValue(r.Context(), "user_id", userId)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}
		}

		// Parse the token using our custom Claims struct
		token, err := jwt.ParseWithClaims(header, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			// Log the signing method
			log.Printf("JwtVerify: Token algorithm: %v", token.Method.Alg())
			return []byte(JWTSecret), nil
		})

		if err != nil {
			log.Printf("JwtVerify: Token validation error: %v", err)

			// In development mode, we'll allow invalid tokens as a fallback
			if inDevMode {
				log.Printf("JwtVerify: In development mode, proceeding despite invalid token")
				// Use user ID 1 (development user)
				ctx := context.WithValue(r.Context(), "user_id", uint(1))
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			w.WriteHeader(http.StatusForbidden)
			err = json.NewEncoder(w).Encode(Exception{Message: err.Error()})
			if err != nil {
				log.Println(err)
			}
			return
		}

		if !token.Valid {
			log.Println("JwtVerify: Token is invalid")

			// In development mode, we'll allow invalid tokens
			if inDevMode {
				log.Printf("JwtVerify: In development mode, proceeding despite invalid token")
				// Use user ID 1 (development user)
				ctx := context.WithValue(r.Context(), "user_id", uint(1))
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			w.WriteHeader(http.StatusForbidden)
			err = json.NewEncoder(w).Encode(Exception{Message: "Invalid authorization token"})
			if err != nil {
				log.Println(err)
			}
			return
		}

		// Extract the claims from the token
		claims, ok := token.Claims.(*Claims)
		if !ok {
			log.Println("JwtVerify: Failed to parse claims")

			// In development mode, we'll allow failed claim parsing
			if inDevMode {
				log.Printf("JwtVerify: In development mode, proceeding despite failed claim parsing")
				// Use user ID 1 (development user)
				ctx := context.WithValue(r.Context(), "user_id", uint(1))
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			w.WriteHeader(http.StatusForbidden)
			err = json.NewEncoder(w).Encode(Exception{Message: "Invalid token claims"})
			if err != nil {
				log.Println(err)
			}
			return
		}

		log.Printf("JwtVerify: Token is valid, UserID: %v, Email: %s", claims.UserID, claims.Email)

		// Add user details to the context
		ctx := context.WithValue(r.Context(), "user_id", claims.UserID)
		log.Printf("JwtVerify: Added user_id to context: %v", claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
