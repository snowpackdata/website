package main

import (
	"encoding/json"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"sort"
	"strings"

	"github.com/gorilla/mux"
)

func loadBlogs() map[string]Post {
	var postsMap = make(map[string]Post)

	// iterate through all posts in our blog
	files, err := ioutil.ReadDir("./blog/posts")
	if err != nil {
		log.Fatal(err)
	}
	// for every file in the articles folder
	for _, file := range files {
		// The following line reads the file we are on
		pageFile, err := ioutil.ReadFile("./blog/posts/" + file.Name())
		if err != nil {
			log.Fatal(err)
		}
		var post Post
		// Unmarshal the json found in the file we read into the page.
		err = json.Unmarshal(pageFile, &post)
		if err != nil {
			log.Fatal(err)
		}

		// add posts to our hashmap with the ID as the key
		postsMap[post.Slug] = post
	}

	// Sort the posts by ID
	keys := make([]string, 0, len(postsMap))
	for key := range postsMap {
		keys = append(keys, key)
	}
	sort.Slice(keys, func(i, j int) bool { return postsMap[keys[i]].ID > postsMap[keys[j]].ID })
	returnMap := make(map[string]Post)
	for _, key := range keys {
		returnMap[key] = postsMap[key]
	}
	return returnMap
}

// Index Page as Follows are all URL Pathways
func indexHandler(w http.ResponseWriter, req *http.Request) {
	http.ServeFile(w, req, "./templates/index.html")
}

// Services page for all /services url requests
func servicesHandler(w http.ResponseWriter, req *http.Request) {
	http.ServeFile(w, req, "./templates/services.html")
}

// Example report page for all /example_report url requests
func exampleReportHandler(w http.ResponseWriter, req *http.Request) {
	http.ServeFile(w, req, "./templates/example_report.html")
}

// Data Assessment page for all /free-assessment url requests
func dataAssessmentHandler(w http.ResponseWriter, req *http.Request) {
	http.ServeFile(w, req, "./templates/data_assessment.html")
}

func blogLandingHandler(w http.ResponseWriter, req *http.Request) {
	blogPosts := loadBlogs()
	// Sort the posts by ID
	keys := make([]string, 0, len(blogPosts))
	for key := range blogPosts {
		keys = append(keys, key)
	}
	sort.Slice(keys, func(i, j int) bool { return blogPosts[keys[i]].ID > blogPosts[keys[j]].ID })
	returnMap := make(map[string]Post)
	for _, key := range keys {
		returnMap[key] = blogPosts[key]
	}
	var sortedPosts []Post
	for _, key := range keys {
		sortedPosts = append(sortedPosts, blogPosts[key])
	}

	landingTemplate, _ := template.ParseFiles("./templates/blog_landing.gohtml")
	err := landingTemplate.Execute(w, sortedPosts)
	if err != nil {
		log.Fatal(err)
	}
}

func blogTagHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	tag := vars["tag"]
	blogs := loadBlogs()
	caseStudies := make(map[string]Post)
	for key, value := range blogs {
		for _, itag := range value.Tags {
			if strings.ToLower(itag) == strings.ToLower(tag) {
				caseStudies[key] = value
			}
		}
	}

	// if the map is empty, then redirect to the main blog page
	if len(caseStudies) == 0 {
		http.Error(w, "404 page not found", http.StatusNotFound)
		return
	}

	landingTemplate, _ := template.ParseFiles("./templates/blog_landing.gohtml")
	err := landingTemplate.Execute(w, caseStudies)
	if err != nil {
		log.Fatal(err)
	}
}

func caseStudyLandingHandler(w http.ResponseWriter, req *http.Request) {
	tag := "case-study"
	blogs := loadBlogs()
	caseStudies := make(map[string]Post)
	for key, value := range blogs {
		for _, itag := range value.Tags {
			if strings.ToLower(itag) == strings.ToLower(tag) {
				caseStudies[key] = value
			}
		}
	}

	landingTemplate, _ := template.ParseFiles("./templates/blog_landing.gohtml")
	err := landingTemplate.Execute(w, caseStudies)
	if err != nil {
		log.Fatal(err)
	}
	return
}

func blogHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	var slugText = vars["slug"]
	blogPosts := loadBlogs()
	displayPost := blogPosts[slugText]
	blogTemplate, _ := template.ParseFiles("./templates/blog_template.gohtml")
	err := blogTemplate.Execute(w, displayPost)
	if err != nil {
		log.Fatal(err)
	}
}
