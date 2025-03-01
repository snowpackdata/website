.PHONY: build-admin run-dev build-all

# Build the Vue Admin app
build-admin:
	cd admin && npm install && npm run build

# Run the Go server in development mode
run-dev: build-admin
	ENVIRONMENT=local go run .

# Build everything for production
build-all: build-admin
	go build -o cronos-server .

# Run the server in production mode
run-prod: build-all
	ENVIRONMENT=production ./cronos-server 