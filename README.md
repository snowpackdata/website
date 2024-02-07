# website
Code to manage the snowpack website.

## Installation

To install and run this application locally, follow these steps:

1. Go download the latest version of Go from [here](https://golang.org/dl/)
2. Clone this repository to your local machine.
3. Navigate to the project directory in your terminal.
4. Run `go run.` to build and run the executable file.

## Configuration

Get access to the bitwarden password account and add the variables in the Secure Note titled "Snowpack Website" to your .zshrc file

## Developing Locally

Make sure you go uncomment the migration function in [main.go](https://github.com/snowpackdata/website/blob/269448c814c605d980a061d0746bf5ff85237089/main.go#L44-L45)

## Contributing a Blog Post

To add a new Blog Post to the site, please follow these steps:

1. Create a new branch for your blog post
2. Create the relevant json and html files. Make sure to grab a free image that is unique to your blog post you can try a site like [unsplash](unsplash.com). Make sure to increment the ID of your blog post and add relevant tags.
3. Test your changes to ensure they work as expected.
4. Create a PR to put it up for review, and make sure the checks pass.
6. Once you merge, go to github actions and run the action: Deploy to Google App Engine