.PHONY: all setup import serve import-cli import-folder import-file search check check-deps ia-sync ia-verify ia-upload site-build site-serve static-site mcp cache-clean export-compat rebuild-catalog migrate-products extract-legacy help

# Default: build tools and start the web UI (the primary import tool)
all: setup import

# PRIMARY: the visual web UI - import floppies, map them to products, review, and commit
import: setup
	@echo "Starting Norsk Data Software Archive at http://localhost:3000"
	@echo "Import floppies, map them to products, and commit - all in the browser."
	@cd tools && node dist/server.js

# Backward-compatible alias for 'make import'
serve: import

setup:
	@git submodule update --init --recursive
	@cd externals/norskdata-ndfs/ndfs-ts && npm install --silent && npx tsc
	@cd tools && npm install --silent && npm run build

# Console import wizard - interactive prompts in the terminal.
# Imports only; map unmatched floppies to products afterwards in the web UI (make import).
import-cli: setup
	@cd tools && node dist/interactive-import.js

# Non-interactive folder import (for scripting). Map products afterwards in the web UI.
import-folder: setup
	cd tools && node dist/cli.js import-folder $(SRC) --contributor "$(CONTRIBUTOR)" --source "$(SOURCE)" $(if $(RECURSIVE),--recursive)

# Non-interactive single-file import (for scripting). Map products afterwards in the web UI.
import-file: setup
	cd tools && node dist/cli.js import $(FILE) --contributor "$(CONTRIBUTOR)" --source "$(SOURCE)"

# Search the catalog
search: setup
	@cd tools && node dist/cli.js search "$(Q)"

# Validate catalog
check: setup
	@cd tools && node dist/cli.js check

# Check prerequisites
check-deps:
	@cd tools && node dist/cli.js check-deps

# Internet Archive
ia-sync: setup
	cd tools && node dist/cli.js ia-sync $(if $(DRY),--dry-run)

ia-verify: setup
	cd tools && node dist/cli.js ia-verify

ia-upload: setup
	cd tools && node dist/cli.js ia-upload $(ITEM)

# Compat export
export-compat: setup
	@cd tools && node dist/cli.js export-compat

# Site
site-build: setup
	@cd tools && node dist/cli.js build-site

site-serve: site-build
	@cd tools && npx serve ../site -p 8000

static-site: setup
	@cd tools && node dist/cli.js build-static-site

# MCP server
mcp: setup
	@cd tools && node dist/mcp/server.js

# Rebuild catalog JSON from YAML files
rebuild-catalog: setup
	@cd tools && node dist/cli.js rebuild-catalog

# Migrate products to YAML
migrate-products: setup
	@cd tools && node dist/cli.js migrate-products

# Extract legacy entries
extract-legacy: setup
	@cd tools && node dist/cli.js extract-legacy

# Cache
cache-clean:
	rm -rf ~/.norskdata/cache/*

# Help
help:
	@echo ""
	@echo "  Norsk Data Software Archive - Makefile targets"
	@echo "  =============================================="
	@echo ""
	@echo "  make import       PRIMARY: start the visual web UI (import + map products + commit)"
	@echo "  make              Same as 'make import'"
	@echo "  make import-cli   Console import wizard (interactive prompts in the terminal)"
	@echo "  make search Q=... Search the catalog"
	@echo "  make check        Validate catalog integrity"
	@echo "  make check-deps   Check if prerequisites are installed"
	@echo "  make export-compat Generate legacy floppies.json for ndfloppy app"
	@echo "  make site-build   Build the GitHub Pages static site"
	@echo "  make site-serve   Build and serve the site locally on port 8000"
	@echo "  make mcp          Start the MCP server"
	@echo ""
	@echo "  Console import (import only - map products afterwards in the web UI):"
	@echo "  make import-cli                                       Interactive wizard"
	@echo "  make import-folder SRC=/path/to/folder CONTRIBUTOR='Name' SOURCE='desc' [RECURSIVE=1]"
	@echo "  make import-file   FILE=/path/to/file.img CONTRIBUTOR='Name' SOURCE='desc'"
	@echo ""
	@echo "  Internet Archive (deferred):"
	@echo "  make ia-sync      Incremental sync to IA (DRY=1 for dry run)"
	@echo "  make ia-verify    Verify IA checksums"
	@echo "  make ia-upload ITEM=id  Upload single item"
	@echo ""
