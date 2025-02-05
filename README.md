# website
Code to manage the snowpack website.

## ENV
Make sure you have the following environment variables set in your ~/.zshrc, the secrets will come from bitwarden
```
CLOUD_SQL_USERNAME=<secret>
CLOUD_SQL_PASSWORD=<secret>
CLOUD_SQL_DATABASE_NAME=<secret>
CLOUD_SQL_CONNECTION_NAME=snowpack-368423:us-central1:cronos
ENVIRONMENT=development
GCP_PROJECT=snowpack-368423
GCP_HOST=snowpack-368423:us-central1:cronos
GCS_BUCKET=snowpack
SENDGRID_API_KEY=<secret>
```

## Installation

To install and run this application locally, follow these steps:

1. Go download the latest version of Go from [here](https://golang.org/dl/)
2. Clone this repository to your local machine.
3. Navigate to the project directory in your terminal

To run the application you will need to run the go executable. First you will need the necessary secrets and a cloudsql proxy connection
1. Download the [cloudsqlproxy](https://cloud.google.com/sql/docs/mysql/connect-instance-auth-proxy) executable if you haven't already.
2. Install the [google cloud cli](https://cloud.google.com/sdk/docs/install) on your computer at your root.
3. Add to your ~/.zshrc these lines, ensuring the file path matches where you stored the gcloud sdk
```
# google cloud/GCP access
# The next line updates PATH for the Google Cloud SDK.
if [ -f '/[your-path-here]/google-cloud-sdk/path.zsh.inc' ]; then . '/[your-path-here]/google-cloud-sdk/path.zsh.inc'; fi
# The next line enables shell command completion for gcloud.
if [ -f '/[your-path-here]/google-cloud-sdk/completion.zsh.inc' ]; then . '/[your-path-here]/google-cloud-sdk/completion.zsh.inc'; fi
# shortcut
alias start_gcloud="~/.start_gcloud.sh"
```
3. Run `start_gcloud` in CLI. A browser window should open to have you click through authentication using your Snowpack Gmail account. Once done 
5. Run `go run .` from the root github directory to build and run the executable file.

## Configuration

Get access to the bitwarden password account and add the variables in the Secure Note titled "Snowpack Website" to your .zshrc file

## Developing Locally

Make sure you go uncomment the migration function in [main.go](https://github.com/snowpackdata/website/blob/269448c814c605d980a061d0746bf5ff85237089/main.go#L44-L45)

When developing locally we will be using TailwindCSS to style the website. To run Tailwind you will need to follow the following steps to install npm which will be used to compile our TailwindCSS files.

```bash
# Install npm
brew install npm

# Install tailwind with npm
npm install tailwindcss@latest

# add the post form tailwind module
npm install -D @tailwindcss/forms

# Finally you can run the following command to recompile the css file with any updates to relevant files
npx tailwindcss -i ./assets/css/main.css -o ./assets/css/outputs.css --watch
```

You can read more about how tailwind works [here](https://tailwindcss.com/docs/installation) but the general idea is that you can use tailwind classes natively in html files to style the website, or add any custom classes to the `main.css` file. When we run the tailwind executable it will find all of the css classes that are either accessed in html files, or are in the `main.css` file and compile them into the `outputs.css` file which is the file that is used to style the website.

## Contributing a Blog Post

To add a new Blog Post to the site, please follow these steps:

1. Create a new branch for your blog post
2. Create the relevant json and html files. Make sure to grab a free image that is unique to your blog post you can try a site like [unsplash](unsplash.com). Make sure to increment the ID of your blog post and add relevant tags.
3. Test your changes to ensure they work as expected.
4. Create a PR to put it up for review, and make sure the checks pass.
6. Once you merge, go to github actions and run the action: Deploy to Google App Engine

## Best Practices & Tips
- favicons: for free options, peruse https://heroicons.com/ and https://fontawesome.com/
