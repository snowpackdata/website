package main

import (
	"encoding/json"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func loadBlogs() map[string]Post {
	// Create a map to hold our data
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
	return postsMap
}

// Index Page as Follows are all URL Pathways
func indexHandler(w http.ResponseWriter, req *http.Request) {
	http.ServeFile(w, req, "./templates/index.html")
}

func blogHandler(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	var slugText = vars["slug"]
	blogPosts := loadBlogs()
	displayPost := blogPosts[slugText]
	blogTemplate, _ := template.ParseFiles("./templates/blog_template.gohtml")
	blogTemplate.Execute(w, displayPost)
}
