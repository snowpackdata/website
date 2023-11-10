package main

import (
	"encoding/json"
	"fmt"
	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/snowpackdata/cronos"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net/http"
	"strconv"
	"time"
)

// RegistrationLandingHandler serves the registration page when accessed via GET request
func (a *App) RegistrationLandingHandler(w http.ResponseWriter, req *http.Request) {
	http.ServeFile(w, req, "./templates/registration.html")
}

// RegisterUser creates a new user in the database when accessed via POST request
func (a *App) RegisterUser(w http.ResponseWriter, req *http.Request) {
	// Read email and password from the post request
	formRole := req.FormValue("role")
	formUserID, err := strconv.ParseUint(req.FormValue("user_id"), 10, 32)
	if err != nil {
		log.Println(err)
	}
	formFirstName := req.FormValue("first_name")
	formLastName := req.FormValue("last_name")
	formPassword := req.FormValue("password")

	// Create a new client object and fill in the fields
	var user cronos.User
	isStaff := false
	switch formRole {
	case cronos.UserRoleClient.String():
		client := cronos.Client{UserID: uint(formUserID)}
		if a.cronosApp.DB.Where("user_id = ?", formUserID).First(&client).RowsAffected == 0 {
			a.cronosApp.DB.Create(&client)
		}
		client.FirstName = formFirstName
		client.LastName = formLastName
		user = client.User
	case cronos.UserRoleStaff.String():
		employee := cronos.Employee{UserID: uint(formUserID)}
		if a.cronosApp.DB.Where("user_id = ?", formUserID).First(&employee).RowsAffected == 0 {
			a.cronosApp.DB.Create(&employee)
		}
		employee.FirstName = formFirstName
		employee.LastName = formLastName
		employee.StartDate = time.Now()
		user = employee.User
		isStaff = true
	case cronos.UserRoleAdmin.String():
		employee := cronos.Employee{UserID: uint(formUserID)}
		if a.cronosApp.DB.Where("user_id = ?", formUserID).First(&employee).RowsAffected == 0 {
			a.cronosApp.DB.Create(&employee)
		}
		employee.FirstName = formFirstName
		employee.LastName = formLastName
		employee.StartDate = time.Now()
		user = employee.User
		isStaff = true
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(formPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Println(err)
	}

	user.Password = string(hashedPassword)
	claims := Claims{
		UserID:  user.ID,
		Email:   user.Email,
		IsStaff: isStaff,
		RegisteredClaims: &jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 720)),
		},
	}
	token := jwt.NewWithClaims(jwt.GetSigningMethod("HS256"), claims)
	tokenString, err := token.SignedString([]byte("secret"))
	if err != nil {
		fmt.Println(err)
	}
	var resp = map[string]interface{}{}
	resp["token"] = tokenString //Store the token in the response
	err = json.NewEncoder(w).Encode(resp)
	if err != nil {
		log.Println(err)
	}
	w.WriteHeader(http.StatusOK)
	return
}

func (a *App) VerifyEmail(w http.ResponseWriter, req *http.Request) {
	// Read email from the post request and check if the email exists as an account in
	// our database. If so send a 200
	// if not send a 300
	formEmail := req.FormValue("email")
	log.Println(formEmail)
	var User cronos.User
	if a.cronosApp.DB.Where("email = ?", formEmail).First(&User).RowsAffected != 0 {
		var response = map[string]interface{}{}
		response["user_id"] = User.ID
		response["role"] = User.Role
		err := json.NewEncoder(w).Encode(response)
		if err != nil {
			log.Println(err)
		}
		w.WriteHeader(http.StatusOK)
		return
	} else {
		w.WriteHeader(http.StatusNotFound)
	}
}
