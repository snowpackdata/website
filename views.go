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
		switch post.Author {
		case "Nate Robinson":
			post.AuthorImage = "nate-profile.jpeg"
		case "Danny Blumenthal":
			post.AuthorImage = "danny-profile.jpeg"
		case "Kevin Koenitzer":
			post.AuthorImage = "kevin-profile.jpeg"
		case "David Olodort":
			post.AuthorImage = "anon-profile.jpeg"
		case "David Shore":
			post.AuthorImage = "shore-profile.jpeg"
		default:
			post.AuthorImage = "anon-profile.jpeg"
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
func (a *App) indexHandler(w http.ResponseWriter, req *http.Request) {
	// Load the most recent three blogs
	blogPosts := loadBlogs()

	// Get only "front-page" tagged posts
	frontPagePosts := filterBlogsByTag(blogPosts, "data")
	sortedBlogs := sortBlogsByID(frontPagePosts)

	lastThreeBlogs := sortedBlogs[0:3]
	type PageData struct {
		Posts   []Post
		GitHash string
	}
	pageData := PageData{
		Posts:   lastThreeBlogs,
		GitHash: a.GitHash,
	}
	indexTemplate, _ := template.ParseFiles("./templates/index.html")
	err := indexTemplate.Execute(w, pageData)
	if err != nil {
		http.Error(w, "500 Internal Server Error", http.StatusInternalServerError)
	}
}

func (a *App) aboutHandler(w http.ResponseWriter, req *http.Request) {
	aboutTemplate, _ := template.ParseFiles("./templates/about.html")
	err := aboutTemplate.Execute(w, a.GitHash)
	if err != nil {
		http.Error(w, "500 Internal Server Error", http.StatusInternalServerError)
	}
}

// Services page for all /services url requests
func (a *App) servicesHandler(w http.ResponseWriter, req *http.Request) {
	servicesTemplate, _ := template.ParseFiles("./templates/services.html")
	err := servicesTemplate.Execute(w, a.GitHash)
	if err != nil {
		http.Error(w, "500 Internal Server Error", http.StatusInternalServerError)
	}
}

// Example report page for all /example_report url requests
func exampleReportHandler(w http.ResponseWriter, req *http.Request) {
	http.ServeFile(w, req, "./templates/example_report.html")
}

// Data Assessment page for all /free-assessment url requests
func (a *App) dataAssessmentHandler(w http.ResponseWriter, req *http.Request) {
	assessmentTemplate, _ := template.ParseFiles("./templates/data_assessment.html")
	err := assessmentTemplate.Execute(w, a.GitHash)
	if err != nil {
		http.Error(w, "500 Internal Server Error", http.StatusInternalServerError)
	}
}

func (a *App) contactHandler(w http.ResponseWriter, req *http.Request) {
	contactTemplate, _ := template.ParseFiles("./templates/contact.html")
	err := contactTemplate.Execute(w, a.GitHash)
	if err != nil {
		http.Error(w, "500 Internal Server Error", http.StatusInternalServerError)
	}
}

func (a *App) blogLandingHandler(w http.ResponseWriter, req *http.Request) {
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
	type PageData struct {
		Posts   []Post
		GitHash string
	}
	pageData := PageData{
		Posts:   sortedPosts,
		GitHash: a.GitHash,
	}
	landingTemplate, _ := template.ParseFiles("./templates/blog_landing.gohtml")
	err := landingTemplate.Execute(w, pageData)
	if err != nil {
		http.Error(w, "500 Internal Server Error", http.StatusInternalServerError)
	}
}

// Function to filter blogs by tag
func filterBlogsByTag(blogs map[string]Post, tag string) []Post {
	filteredBlogs := []Post{}
	for _, value := range blogs {
		for _, itag := range value.Tags {
			if strings.ToLower(itag) == strings.ToLower(tag) {
				filteredBlogs = append(filteredBlogs, value)
			}
		}
	}
	return filteredBlogs
}

// Function to sort blogs by ID in descending order
func sortBlogsByID(blogs []Post) []Post {
	sort.Slice(blogs, func(i, j int) bool {
		return blogs[i].ID > blogs[j].ID // Sort by ID in descending order
	})
	return blogs
}

func (a *App) blogTagHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	tag := vars["tag"]
	blogs := loadBlogs()

	// Use the utility function to filter and sort by tag
	filteredBlogs := filterBlogsByTag(blogs, tag)

	// Sort blogs by id in descending order
	sortedBlogs := sortBlogsByID(filteredBlogs)

	// If no posts match the tag, return a 404 error
	if len(sortedBlogs) == 0 {
		http.Error(w, "404 page not found", http.StatusNotFound)
		return
	}
	type PageData struct {
		Posts   []Post
		GitHash string
		Subject string
	}
	pageData := PageData{
		Posts:   sortedBlogs,
		GitHash: a.GitHash,
		Subject: tag,
	}

	// Render the template with filtered blogs
	landingTemplate, _ := template.ParseFiles("./templates/blog_landing.gohtml")
	err := landingTemplate.Execute(w, pageData)
	if err != nil {
		http.Error(w, "500 Internal Server Error", http.StatusInternalServerError)
	}
}

func (a *App) caseStudyLandingHandler(w http.ResponseWriter, req *http.Request) {
	tag := "case-study"
	blogs := loadBlogs()

	// Use the utility function to filter and sort by the "case-study" tag
	caseStudies := filterBlogsByTag(blogs, tag)

	// Sort blogs by id in descending order
	sortedBlogs := sortBlogsByID(caseStudies)

	// If no case studies match, return a 404 error
	if len(sortedBlogs) == 0 {
		http.Error(w, "404 page not found", http.StatusNotFound)
		return
	}
	type PageData struct {
		Posts   []Post
		GitHash string
	}
	pageData := PageData{
		Posts:   sortedBlogs,
		GitHash: a.GitHash,
	}

	// Render the template with filtered case studies
	landingTemplate, _ := template.ParseFiles("./templates/blog_landing.gohtml")
	err := landingTemplate.Execute(w, pageData)
	if err != nil {
		http.Error(w, "500 Internal Server Error", http.StatusInternalServerError)
	}
}

func (a *App) blogHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	var slugText = vars["slug"]
	blogPosts := loadBlogs()
	displayPost := blogPosts[slugText]

	type PageData struct {
		Post    Post
		GitHash string
	}
	pageData := PageData{
		Post:    displayPost,
		GitHash: a.GitHash,
	}

	// If the post is not found, return a 404 error
	blogTemplate, _ := template.ParseFiles("./templates/blog_template.gohtml")
	err := blogTemplate.Execute(w, pageData)
	if err != nil {
		http.Error(w, "500 Internal Server Error", http.StatusInternalServerError)

	}
}

func notFoundHandler(writer http.ResponseWriter, request *http.Request) {
	http.ServeFile(writer, request, "./templates/404.html")
}
