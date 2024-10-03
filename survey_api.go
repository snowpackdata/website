package main

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/snowpackdata/cronos"
)

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

	// Check if a response already exists for a given question (step) and survey_id
	// If so, delete the previous record
	var existingSurveyResponse cronos.SurveyResponse
	a.cronosApp.DB.Where("survey_id = ? AND step = ?", surveyResponse.SurveyID, surveyResponse.Step).First(&existingSurveyResponse)
	if existingSurveyResponse.ID != 0 {
		// existingSurveyResponse.DeletedAt = time.Now()
		a.cronosApp.DB.Delete(&existingSurveyResponse)
	}

	a.cronosApp.DB.Create(&surveyResponse)
	// If the survey is completed, update the survey to reflect that
	if r.FormValue("completed") == "true" {
		var survey cronos.Survey
		a.cronosApp.DB.First(&survey, surveyId)
		survey.Completed = true
		a.cronosApp.DB.Save(&survey)
	}
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(surveyResponse)

}
