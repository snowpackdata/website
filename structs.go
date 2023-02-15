package main

import (
	"html/template"
	"io/ioutil"
)

// Post is object to read in/out a JSON post into our web pages
// the Content references an HTML file that contains the inner HTML for the blog Post
type Post struct {
	ID       int64    `json:"id"`
	Title    string   `json:"title"`
	Subtitle string   `json:"subtitle"`
	Splash   string   `json:"splash"`
	Content  string   `json:"content"`
	Slug     string   `json:"slug"`
	Tags     []string `json:"tags"`
	Date     string   `json:"date"`
	Author   string   `json:"author"`
}

// RenderContent : Parses HTML File and renders on page
func (p Post) RenderContent() template.HTML {
	parsedFile, _ := ioutil.ReadFile("./blog/html_files/" + p.Content)
	output := template.HTML(parsedFile)
	return output
}
