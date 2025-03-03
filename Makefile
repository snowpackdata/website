.PHONY: build-admin run-dev run-dev-watch run-dev-hot build-all

# Build the Vue Admin app
build-admin:
	cd admin && npm install && npm run build

# Run the Go server in development mode with pre-built admin
run-dev: build-admin
	ENVIRONMENT=local go run ./


# Run the Go server with hot reloading enabled
run-dev-hot:
	@echo "Installing air for hot reloading if not already installed..."
	@command -v air > /dev/null 2>&1 || go install github.com/air-verse/air@latest
	@echo "Starting Vue dev server and Go server with hot reloading in parallel..."
	@(cd admin && npm install && npm run dev) & \
	ENVIRONMENT=local air

# Run both Vue and Go with hot reloading 
run-staging-hot:
	@echo "Installing air for hot reloading if not already installed..."
	@command -v air > /dev/null 2>&1 || go install github.com/air-verse/air@latest
	@echo "Starting Vue dev server and Go server with hot reloading in parallel..."
	@(cd admin && npm install && npm run dev) & \
	ENVIRONMENT=development air

