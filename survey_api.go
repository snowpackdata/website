package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/snowpackdata/cronos"
)

func (a *App) sendSlackNotification(message map[string]string, webhookURL string) {
	jsonMessage, _ := json.Marshal(message)
	req, err := http.NewRequest("POST", webhookURL, bytes.NewBuffer(jsonMessage))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending Slack message: %s", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		log.Printf("Slack notification sent successfully.")
	} else {
		log.Printf("Failed to send Slack notification. Status: %d", resp.StatusCode)
	}
}

func (a *App) alertOnSurveyCompletion(surveyID uint) error {
	// Retrieve the survey (and included questions)
	var survey cronos.Survey
	result := a.cronosApp.DB.Preload("SurveyResponses").First(&survey, surveyID)
	if result.Error != nil {
		log.Printf("Error retrieving survey: %s", result.Error)
		return result.Error
	}

	// Prepare the Slack message: it should contain the survey ID and all of its relevant, non-deleted questions
	var messageText string
	messageText = fmt.Sprintf("<!channel> A new survey has been submitted: (*Survey ID: %d*)\n*Responder:* %s\n*Company:* %s\n*Role:* %s\n\n",
		survey.ID, survey.UserEmail, survey.CompanyName, survey.UserRole)

	// Append each survey response to the message
	for _, response := range survey.SurveyResponses {
		formattedResponse := fmt.Sprintf("*Question %d:* %s\n- *Response*: %s\n*- Freeform Response*: %s\n\n",
			response.Step, response.Question, response.StructuredAnswer, response.FreeformAnswer)
		messageText += formattedResponse
	}

	// Send the message to Slack
	message := map[string]string{
		"text": messageText,
	}

	webhookURL := os.Getenv("SLACK_WEBHOOK_URL")
	if webhookURL == "" {
		return errors.New("no Slack webhook URL provided")
	}

	a.sendSlackNotification(message, webhookURL)

	return nil
}

// SurveyUpsert
// Create an UPSERT API for generating a new survey from form data on the front end
// The API should be a POST request to /api/survey
// The API should accept a JSON object with the following fields:
// - survey_name (string)
// - user_email (string)
// - user_role (string)
// - company_name (string)
func (a *App) SurveyUpsert(w http.ResponseWriter, r *http.Request) {
	// Parse the JSON request body
	// Create a new survey in the database
	// Return the survey ID

	var survey cronos.Survey
	survey.SurveyType = r.FormValue("survey_type")
	survey.UserEmail = r.FormValue("user_email")
	// TODO: Check if they've already submitted a survey w/ this email

	survey.UserRole = r.FormValue("user_role")
	survey.CompanyName = r.FormValue("company_name")
	a.cronosApp.DB.Create(&survey)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(survey)
}

func (a *App) SurveyResponse(w http.ResponseWriter, r *http.Request) {
	// Parse the JSON request body
	// Retrieve the survey from the database
	// Return a 200
	vars := mux.Vars(r)
	surveyIdStr := vars["id"]
	surveyId, err := strconv.Atoi(surveyIdStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	stepInt, err := strconv.Atoi(r.FormValue("step"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	var surveyResponse cronos.SurveyResponse

	surveyResponse.SurveyID = uint(surveyId)
	surveyResponse.Step = stepInt
	surveyResponse.Question = r.FormValue("question")
	surveyResponse.StructuredAnswer = r.FormValue("structured_answer")
	surveyResponse.AnswerType = r.FormValue("answer_type")
	surveyResponse.FreeformAnswer = r.FormValue("unstructured_answer")
	// TODO: Check to make sure there's no sql injection here

	// Begin a transaction
	tx := a.cronosApp.DB.Begin()
	if tx.Error != nil {
		log.Printf("Error starting transaction: %s", tx.Error)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Check if a response already exists for a given question (step) and survey_id
	// If so, delete the previous record
	var existingSurveyResponse cronos.SurveyResponse
	tx.Where("survey_id = ? AND step = ?", surveyResponse.SurveyID, surveyResponse.Step).First(&existingSurveyResponse)
	if existingSurveyResponse.ID != 0 {
		tx.Delete(&existingSurveyResponse)
	}

	// Save the survey response
	if err := tx.Create(&surveyResponse).Error; err != nil {
		log.Printf("Error saving survey response: %s", tx.Error)
		tx.Rollback() // Rollback transaction if there's an error
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("Error committing transaction: %s", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// If the survey is completed, update the survey to reflect that
	if r.FormValue("completed") == "true" {
		var survey cronos.Survey
		a.cronosApp.DB.First(&survey, surveyId)
		survey.Completed = true
		a.cronosApp.DB.Save(&survey)
		err := a.alertOnSurveyCompletion(survey.ID)
		if err != nil {
			log.Printf("Failed at Slack alert step on survey completion")
		}
	}

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(surveyResponse)
}
