# See README.md for the steps to activate this.
# this script can be used for loggin into the website, querying GCP directly, and anything else in GCP

#!/bin/zsh

# sourcing file so that we can use this script in a future cron job for internal bruin etl
source ~/.zshrc

# Run gcloud authentication.
gcloud auth application-default login
# Check if the authentication was successful.
if [ $? -eq 0 ]; then
  # Start the Cloud SQL Proxy.The "&" runs the process in the background in same terminal window.
  ~/cloud-sql-proxy --port 3306 "${GCP_HOST}" &
else
  echo "gcloud authentication failed. Aborting."
  exit 1
fi