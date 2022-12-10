package main

// Post is object to read in/out a JSON post into our web pages
type Post struct {
	ID      int64    `json:"id"`
	Title   string   `json:"title"`
	Content string   `json:"content"`
	Slugs   []string `json:"slugs"`
}
