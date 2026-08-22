# SIROS Documentation Makefile
# ============================

.PHONY: help install build start stop restart serve clean typecheck lint deploy watch fetch-api-specs \
	fetch-config-docs fetch-config-docs-latest fetch-config-docs-versions _fetch-config-doc _fetch-config-doc-versions \
	fetch-release-notes

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
	@echo "API Specs:"
	@echo "  fetch-api-specs          Fetch latest OpenAPI/Swagger specs from source repos"
	@echo "  fetch-config-docs        Fetch config reference docs (vc, go-wallet-backend, go-trust): default branch + per-release"
	@echo "  fetch-config-docs-latest   ...just the default-branch snapshot"
	@echo "  fetch-config-docs-versions ...just the per-tagged-release snapshots"
	@echo "  fetch-release-notes      Fetch generated release notes from opted-in repos"
	@echo ""

# Configuration
PORT ?= 3000
HOST ?= 0.0.0.0

# API spec sources (GitHub raw URLs, default branch)
API_DIR := static/api
GITHUB_RAW := https://raw.githubusercontent.com

SPEC_SOURCES := \
	$(API_DIR)/go-trust-swagger.yaml=$(GITHUB_RAW)/sirosfoundation/go-trust/main/docs/swagger/swagger.yaml \
	$(API_DIR)/wallet-backend-admin-openapi.yaml=$(GITHUB_RAW)/sirosfoundation/go-wallet-backend/main/docs/openapi-admin.yaml \
	$(API_DIR)/vc-apigw-swagger.yaml=$(GITHUB_RAW)/SUNET/vc/main/docs/apigw/swagger.yaml \
	$(API_DIR)/vc-issuer-swagger.yaml=$(GITHUB_RAW)/SUNET/vc/main/docs/issuer/swagger.yaml \
	$(API_DIR)/vc-registry-swagger.yaml=$(GITHUB_RAW)/SUNET/vc/main/docs/registry/swagger.yaml \
	$(API_DIR)/vc-verifier-swagger.yaml=$(GITHUB_RAW)/SUNET/vc/main/docs/verifier/swagger.yaml

# Fetch latest API specs from source repositories
fetch-api-specs:
	@echo "Fetching latest API specs..."
	@mkdir -p $(API_DIR)
	@for entry in $(SPEC_SOURCES); do \
		dest=$${entry%%=*}; \
		url=$${entry#*=}; \
		echo "  $$dest <- $$url"; \
		curl -sfL -o "$$dest" "$$url" || echo "  ⚠ Failed to fetch $$dest"; \
	done
	@echo "Done."

# Source branch for each repo's generated CONFIGURATION.md, overridable per-invocation
# e.g. `make fetch-config-docs VC_DOCS_BRANCH=my-feature-branch`
VC_DOCS_BRANCH ?= main
WALLET_BACKEND_DOCS_BRANCH ?= main
GO_TRUST_DOCS_BRANCH ?= main

# How many of the most recent tagged releases (per repo) get their own
# published config-doc snapshot, newest first. Bounds build time/requests
# as tag history grows; raise if older releases are still worth publishing.
CONFIG_DOC_MAX_VERSIONS ?= 20

# Fetch generated configuration reference docs from source repos: the
# current default branch, plus a snapshot pinned to each of the most
# recent tagged releases. Wrapped with Docusaurus frontmatter (mdx.format:
# md forces plain CommonMark parsing — these files contain raw
# <placeholder> tokens and {"json":"examples"} that MDX would otherwise
# try to parse as JSX/expressions and fail the build) and passed through
# scripts/escape-placeholder-tags.py (backtick-wraps bare <TOKEN>
# placeholders so the browser's HTML parser doesn't treat them as real,
# unclosed tags and silently mis-nest the page).
fetch-config-docs: fetch-config-docs-latest fetch-config-docs-versions

fetch-config-docs-latest:
	@echo "Fetching configuration reference docs ($(VC_DOCS_BRANCH) / $(WALLET_BACKEND_DOCS_BRANCH))..."
	@$(MAKE) --no-print-directory _fetch-config-doc \
		SRC_URL="$(GITHUB_RAW)/SUNET/vc/$(VC_DOCS_BRANCH)/docs/CONFIGURATION.md" \
		DEST="docs/sirosid/reference/vc-configuration/index.md" \
		ID="vc-configuration" \
		SLUG="/sirosid/reference/vc-configuration" \
		TITLE="VC Configuration Reference" \
		SOURCE_LABEL="SUNET/vc@$(VC_DOCS_BRANCH)" \
		SOURCE_URL="https://github.com/SUNET/vc/blob/$(VC_DOCS_BRANCH)/docs/CONFIGURATION.md" \
		VERSIONS_NOTE="Looking for a specific release instead of $(VC_DOCS_BRANCH)? Expand **VC Configuration Reference** in the sidebar — every published release has its own page."
	@$(MAKE) --no-print-directory _fetch-config-doc \
		SRC_URL="$(GITHUB_RAW)/sirosfoundation/go-wallet-backend/$(WALLET_BACKEND_DOCS_BRANCH)/docs/CONFIGURATION.md" \
		DEST="docs/wallet/wallet-backend-configuration/index.md" \
		ID="wallet-backend-configuration" \
		SLUG="/wallet/wallet-backend-configuration" \
		TITLE="Wallet Backend Configuration Reference" \
		SOURCE_LABEL="go-wallet-backend@$(WALLET_BACKEND_DOCS_BRANCH)" \
		SOURCE_URL="https://github.com/sirosfoundation/go-wallet-backend/blob/$(WALLET_BACKEND_DOCS_BRANCH)/docs/CONFIGURATION.md" \
		VERSIONS_NOTE="Looking for a specific release instead of $(WALLET_BACKEND_DOCS_BRANCH)? Expand **Wallet Backend Configuration Reference** in the sidebar — every published release has its own page."
	@$(MAKE) --no-print-directory _fetch-config-doc \
		SRC_URL="$(GITHUB_RAW)/sirosfoundation/go-trust/$(GO_TRUST_DOCS_BRANCH)/docs/CONFIGURATION.md" \
		DEST="docs/sirosid/trust/go-trust-configuration/index.md" \
		ID="go-trust-configuration" \
		SLUG="/sirosid/trust/go-trust-configuration" \
		TITLE="Go-Trust Configuration Reference" \
		SOURCE_LABEL="go-trust@$(GO_TRUST_DOCS_BRANCH)" \
		SOURCE_URL="https://github.com/sirosfoundation/go-trust/blob/$(GO_TRUST_DOCS_BRANCH)/docs/CONFIGURATION.md" \
		VERSIONS_NOTE="Looking for a specific release instead of $(GO_TRUST_DOCS_BRANCH)? Expand **Go-Trust Configuration Reference** in the sidebar — every published release has its own page."
	@echo "Done."

# Helper: fetch one CONFIGURATION.md and prepend frontmatter. Not called directly.
# ID/SLUG give the doc a stable id and URL independent of where it physically
# lives (docs/.../<component>-configuration/index.md) — see the _category_.json
# next to it, which links the category itself to this doc, so every other
# doc in that same folder (each tagged release, see _fetch-config-doc-versions
# below) renders nested underneath it in the sidebar instead of as a flat
# sibling. That nesting is what prevents two components' version lists from
# ever looking like the same, ambiguous sidebar row: each is scoped under its
# own component-named category instead of sharing a flat label.
_fetch-config-doc:
	@mkdir -p $(dir $(DEST))
	@echo "  $(DEST) <- $(SRC_URL)"
	@body="$$(curl -sfL "$(SRC_URL)" | python3 scripts/escape-placeholder-tags.py)" && { \
		echo "---"; \
		echo "id: $(ID)"; \
		echo "slug: $(SLUG)"; \
		echo "title: $(TITLE)"; \
		echo "mdx:"; \
		echo "  format: md"; \
		echo "---"; \
		echo ""; \
		echo "> **Auto-generated.** Fetched from [$(SOURCE_LABEL)]($(SOURCE_URL)) at build time via \`make fetch-config-docs\`. Do not edit this file directly — changes are overwritten on the next fetch; update the source repo's config structs instead. $(VERSIONS_NOTE)"; \
		echo ""; \
		echo "$$body"; \
	} > "$(DEST)" || echo "  ⚠ Failed to fetch $(DEST)"

# Fetch a pinned config-doc snapshot for each of the most recent tagged
# releases of each repo (skipping tags that predate the generator, i.e.
# have no docs/CONFIGURATION.md — this is expected for older releases,
# not an error). Each snapshot is a normal, fully listed and indexed doc —
# no `unlisted` flag, no separate hand-maintained "see older releases"
# links page — living right alongside the default/latest doc inside the
# same category folder, so it just shows up as another nested child under
# that component's own category as soon as it's fetched.
fetch-config-docs-versions:
	@echo "Fetching per-release configuration reference docs (up to $(CONFIG_DOC_MAX_VERSIONS) most recent tags each)..."
	@mkdir -p docs/sirosid/reference/vc-configuration docs/wallet/wallet-backend-configuration docs/sirosid/trust/go-trust-configuration
	@$(MAKE) --no-print-directory _fetch-config-doc-versions \
		GH_REPO="SUNET/vc" \
		DEST_DIR="docs/sirosid/reference/vc-configuration" \
		TITLE_PREFIX="VC Configuration Reference" \
		LATEST_PATH="/sirosid/reference/vc-configuration"
	@$(MAKE) --no-print-directory _fetch-config-doc-versions \
		GH_REPO="sirosfoundation/go-wallet-backend" \
		DEST_DIR="docs/wallet/wallet-backend-configuration" \
		TITLE_PREFIX="Wallet Backend Configuration Reference" \
		LATEST_PATH="/wallet/wallet-backend-configuration"
	@$(MAKE) --no-print-directory _fetch-config-doc-versions \
		GH_REPO="sirosfoundation/go-trust" \
		DEST_DIR="docs/sirosid/trust/go-trust-configuration" \
		TITLE_PREFIX="Go-Trust Configuration Reference" \
		LATEST_PATH="/sirosid/trust/go-trust-configuration"
	@echo "Done."

# Helper: fetch CONFIGURATION.md at each of a repo's N most recent tags.
# Not called directly. Each tag's doc gets its own id (derived from the
# filename) so it never collides with the default/latest doc's fixed id
# in the same folder; sidebar_position sorts newest-first.
_fetch-config-doc-versions:
	@tags="$$(git ls-remote --tags --refs https://github.com/$(GH_REPO).git | awk -F'refs/tags/' '{print $$2}' | sort -rV | head -n $(CONFIG_DOC_MAX_VERSIONS))"; \
	fetched=0; skipped=0; pos=1; \
	for tag in $$tags; do \
		url="$(GITHUB_RAW)/$(GH_REPO)/$$tag/docs/CONFIGURATION.md"; \
		dest="$(DEST_DIR)/$$tag.md"; \
		body="$$(curl -sfL "$$url" 2>/dev/null | python3 scripts/escape-placeholder-tags.py)"; \
		if [ -n "$$body" ]; then \
			{ \
				echo "---"; \
				echo "title: $(TITLE_PREFIX) ($$tag)"; \
				echo "sidebar_label: $$tag"; \
				echo "sidebar_position: $$pos"; \
				echo "mdx:"; \
				echo "  format: md"; \
				echo "---"; \
				echo ""; \
				echo "> **Pinned to release [$$tag](https://github.com/$(GH_REPO)/blob/$$tag/docs/CONFIGURATION.md).** For the current default branch, see [$(TITLE_PREFIX)]($(LATEST_PATH))."; \
				echo ""; \
				echo "$$body"; \
			} > "$$dest"; \
			fetched=$$((fetched + 1)); \
			pos=$$((pos + 1)); \
		else \
			skipped=$$((skipped + 1)); \
		fi; \
	done; \
	echo "  $(GH_REPO): $$fetched version page(s) written to $(DEST_DIR)/, $$skipped tag(s) skipped (no docs/CONFIGURATION.md at that ref)"

# Release notes generated by release-notes-bot in each producing repo. Unlike
# the config docs above there's no per-tag page tree: release notes read as one
# scrolling history, and every version already gets its own linkable anchor
# from its `## [vX.Y.Z]` heading, which is also what feeds the page's
# right-hand outline. One page per repo is the whole story.
#
# One line per opted-in repo, same as the config-docs components — a repo
# appears here once its RELEASE_NOTES.md exists. Repos that haven't opted in
# (or haven't bootstrapped yet) are skipped with a notice, not an error.
# slug=owner/repo=Sidebar_Label — underscores in the label become spaces, since
# this is a space-separated Make list and a literal space would split the entry.
RELEASE_NOTES_SOURCES := \
	go-trust=sirosfoundation/go-trust=Go-Trust \
	go-wallet-backend=sirosfoundation/go-wallet-backend=Wallet_Backend

RELEASE_NOTES_DIR := docs/opensource/release-notes

fetch-release-notes:
	@echo "Fetching release notes..."
	@mkdir -p $(RELEASE_NOTES_DIR)
	@pos=1; index_items=""; \
	for entry in $(RELEASE_NOTES_SOURCES); do \
		slug=$$(echo "$$entry" | cut -d= -f1); \
		repo=$$(echo "$$entry" | cut -d= -f2); \
		label=$$(echo "$$entry" | cut -d= -f3 | tr '_' ' '); \
		dest="$(RELEASE_NOTES_DIR)/$$slug.md"; \
		url="$(GITHUB_RAW)/$$repo/main/RELEASE_NOTES.md"; \
		body="$$(curl -sfL "$$url" 2>/dev/null \
			| python3 scripts/prepare-release-notes.py "$$label" \
			| python3 scripts/escape-placeholder-tags.py)"; \
		if [ -n "$$body" ]; then \
			{ \
				echo "---"; \
				echo "title: $$label Release Notes"; \
				echo "sidebar_label: $$label"; \
				echo "sidebar_position: $$pos"; \
				echo "mdx:"; \
				echo "  format: md"; \
				echo "---"; \
				echo ""; \
				echo "> Generated from [$$repo](https://github.com/$$repo)'s \`RELEASE_NOTES.md\`, fetched at build time. Corrections belong in that file, not here."; \
				echo ""; \
				echo "$$body"; \
			} > "$$dest"; \
			echo "  $$dest <- $$url"; \
			index_items="$$index_items- [$$label](/opensource/release-notes/$$slug) — from [$$repo](https://github.com/$$repo)\n"; \
			pos=$$((pos + 1)); \
		else \
			echo "  (skipping $$repo — no RELEASE_NOTES.md on main yet)"; \
		fi; \
	done; \
	{ \
		echo "---"; \
		echo "id: release-notes-index"; \
		echo "slug: /opensource/release-notes"; \
		echo "title: Release Notes"; \
		echo "sidebar_position: 0"; \
		echo "---"; \
		echo ""; \
		echo "Release notes for SIROS Foundation components that publish them, generated from each repository's own \`RELEASE_NOTES.md\` and fetched when this site builds."; \
		echo ""; \
		if [ -n "$$index_items" ]; then \
			printf "%b" "$$index_items"; \
		else \
			echo "_No component has published release notes yet._"; \
		fi; \
	} > $(RELEASE_NOTES_DIR)/index.md
	@echo "Done."

# Install dependencies
install:
	pnpm install

# Start development server
start:
	@echo "Starting development server on http://$(HOST):$(PORT)"
	pnpm start --host $(HOST) --port $(PORT)

# Start development server in background
start-bg:
	@echo "Starting development server in background..."
	@nohup pnpm start --host $(HOST) --port $(PORT) > .docusaurus.log 2>&1 &
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
build: fetch-api-specs fetch-config-docs fetch-release-notes
	@echo "Building production site..."
	pnpm run build
	@echo "Build complete. Output in ./build/"

# Serve production build
serve: build
	@echo "Serving production build on http://localhost:3000"
	pnpm run serve

# Clear cache and build output
clean:
	@echo "Clearing cache and build output..."
	pnpm run clear
	rm -rf build/
	rm -rf .docusaurus/
	rm -f .docusaurus.log
	@echo "Clean complete."

# TypeScript type checking
typecheck:
	@echo "Running TypeScript type check..."
	pnpm run typecheck

# Check for broken links (runs build with strict mode)
lint: build
	@echo "Link checking completed (part of build process)"

# Deploy to GitHub Pages
deploy:
	@echo "Deploying to GitHub Pages..."
	pnpm run deploy

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
