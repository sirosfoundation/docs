# SIROS Documentation Makefile
# ============================

.PHONY: help install build start stop restart serve clean typecheck lint deploy watch

# Default target
help:
	@echo "SIROS Documentation"
	@echo "==================="
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Development:"
	@echo "  install    Install dependencies"
	@echo "  start      Start development server (port 3000)"
	@echo "  stop       Stop development server"
	@echo "  restart    Restart development server"
	@echo "  watch      Start dev server in background and tail logs"
	@echo ""
	@echo "Building:"
	@echo "  build      Build production site"
	@echo "  serve      Serve production build locally"
	@echo "  clean      Clear build cache and output"
	@echo ""
	@echo "Quality:"
	@echo "  typecheck  Run TypeScript type checking"
	@echo "  lint       Check for broken links (via build)"
	@echo ""
	@echo "Deployment:"
	@echo "  deploy     Deploy to GitHub Pages"
	@echo ""

# Configuration
PORT ?= 3000
HOST ?= 0.0.0.0

# Install dependencies
install:
	pnpm install

# Start development server
start:
	@echo "Starting development server on http://$(HOST):$(PORT)"
	npx docusaurus start --host $(HOST) --port $(PORT)

# Start development server in background
start-bg:
	@echo "Starting development server in background..."
	@nohup npx docusaurus start --host $(HOST) --port $(PORT) > .docusaurus.log 2>&1 &
	@sleep 2
	@echo "Server started. View logs with: tail -f .docusaurus.log"

# Stop development server
stop:
	@echo "Stopping development server..."
	@pkill -f "docusaurus start" 2>/dev/null || true
	@pkill -f "node.*docusaurus" 2>/dev/null || true
	@echo "Server stopped."

# Restart development server
restart: stop
	@sleep 1
	$(MAKE) start

# Watch mode - start in background and tail logs
watch: stop
	@$(MAKE) start-bg
	@tail -f .docusaurus.log

# Build production site
build:
	@echo "Building production site..."
	npm run build
	@echo "Build complete. Output in ./build/"

# Serve production build
serve: build
	@echo "Serving production build on http://localhost:3000"
	npm run serve

# Clear cache and build output
clean:
	@echo "Clearing cache and build output..."
	npm run clear
	rm -rf build/
	rm -rf .docusaurus/
	rm -f .docusaurus.log
	@echo "Clean complete."

# TypeScript type checking
typecheck:
	@echo "Running TypeScript type check..."
	npm run typecheck

# Check for broken links (runs build with strict mode)
lint: build
	@echo "Link checking completed (part of build process)"

# Deploy to GitHub Pages
deploy:
	@echo "Deploying to GitHub Pages..."
	npm run deploy

# Show server status
status:
	@if pgrep -f "docusaurus start" > /dev/null; then \
		echo "✅ Development server is running"; \
		pgrep -fa "docusaurus start"; \
	else \
		echo "❌ Development server is not running"; \
	fi

# Open in browser (macOS/Linux)
open:
	@if command -v xdg-open > /dev/null; then \
		xdg-open http://localhost:$(PORT); \
	elif command -v open > /dev/null; then \
		open http://localhost:$(PORT); \
	else \
		echo "Open http://localhost:$(PORT) in your browser"; \
	fi

# Quick development cycle
dev: install start

# Full rebuild
rebuild: clean build
