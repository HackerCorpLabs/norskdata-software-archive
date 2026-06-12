# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A preservation archive for Norsk Data minicomputer software. It stores compressed floppy disk images (`.img.gz`) with per-image YAML metadata, plus the TypeScript tooling (CLI, web UI, MCP server, static-site generator) that catalogs, imports, and serves them. It is a **data + tooling** repo, not an application — most "work" is either editing the TypeScript under `tools/src/` or curating the image/product/category metadata.

## Build & run

All tooling lives in `tools/` (Node.js, ESM, TypeScript compiled to `tools/dist/`). The Makefile is the entry point — every target depends on `setup`, which inits the git submodule, builds the bundled NDFS library, and compiles the tools.

```bash
make setup          # git submodule init + build externals/norskdata-ndfs + tsc tools
make import         # PRIMARY: web UI on http://localhost:3000 (import + map products + commit)
                    # 'make serve' is a backward-compat alias
make import-cli     # interactive console import wizard (import only)
make import-folder SRC=... CONTRIBUTOR=... SOURCE=... [RECURSIVE=1]   # scripted folder import
make import-file   FILE=... CONTRIBUTOR=... SOURCE=...                # scripted single-file import
make static-site    # build GitHub Pages site into site/
make site-serve     # build per-product pages + serve site/ on :8000
make mcp            # run the MCP server (stdio; launched by MCP clients, not watched in a terminal)
make check          # validate catalog integrity (run after metadata edits)
make search Q=...    # search the catalog
```

When iterating on TypeScript without the full Makefile flow, work directly in `tools/`:

```bash
cd tools && npm run build      # tsc + copies src/ui/index.html into dist/ui/
cd tools && npm run watch      # tsc --watch
cd tools && node dist/cli.js <subcommand>   # run any CLI command directly
```

There is **no test suite and no linter** — `make check` (the `check` CLI subcommand) is the validation gate. CLI subcommands: `import`, `import-folder`, `search`, `check`, `check-deps`, `ia-sync`/`ia-verify`/`ia-upload`, `build-site`, `build-static-site`, `rebuild-catalog`, `migrate-products`, `extract-legacy`, `export-compat`, `mcp`.

## Architecture & data model

**YAML per floppy is the source of truth.** Every image lives in `images/{md5}/` where `{md5}` is the full MD5 of the raw `.img`. The folder holds `<name>.img.gz`, `<name>.yaml` (all metadata/classification), label photos (`*.JPG`), and optional `labels.txt`. Folders are content-addressed and **never renamed**, even when metadata changes. `catalog/floppies.json` and `catalog/products.json` are **generated** from the YAML files — never hand-edit them; run `rebuild-catalog` (or import, which auto-regenerates). The top-level `floppies.json` is a legacy compat export for the `ndfloppy` app, produced by `export-compat`.

Products are separate YAML under `products/` (`id`, `name`, `categories`, `platform`); categories are defined in `categories/product-categories.yaml`. A floppy's `product.id` links it to a product file.

**NDFS parsing** is done by the bundled submodule at `externals/norskdata-ndfs/ndfs-ts` (imported as `norskdata-ndfs` via a `file:` dependency). It extracts volume name, boot format, users, file listings, and BPUN checksum validation. The same parser is bundled into the static site so the browser-based NDFS viewer runs client-side. If NDFS behavior looks wrong, the bug is likely in the submodule, not in `tools/src/`.

**Import pipeline** (`tools/src/api/import.ts`, `import-folder.ts`): read `.img` → MD5 → parse NDFS → validate BPUN → match volume name against ND product-number patterns (`product-matcher.ts` + `name-parser.ts`) → dedup by MD5 (`dedup.ts`) → gzip into `images/{md5}/` → copy photos → write YAML → regenerate catalog.

### `tools/src/` map

- `cli.ts` — Commander entry point wiring all subcommands.
- `server.ts` — Express backend for the local web UI (`src/ui/index.html` is a single-page app served from `dist/ui/`).
- `interactive-import.ts` — prompted CLI import.
- `api/catalog.ts` — read/write YAML ↔ generated JSON; the catalog generation logic.
- `api/static-site-builder.ts` — main GitHub Pages generator; `api/site-builder.ts` — per-product HTML pages.
- `api/product-matcher.ts` / `api/name-parser.ts` — ND volume-name → product/version/disk/language matching.
- `api/ia-sync.ts` — Internet Archive sync (large artifacts go to IA; floppies ≤1.3 MB stay in git).
- `mcp/server.ts` — read-only MCP server (stdio) exposing the catalog to LLMs; see below.
- `migrate*.ts`, `extract-legacy.ts`, `merge-legacy.ts` — one-off data migration scripts; not part of normal flow.
- `types.ts` — shared types; `zod` is used for schema validation.

**MCP server** (`mcp/server.ts`): a stdio MCP server, **read-only**, that loads `catalog/floppies.json` + `catalog/products.json` and exposes 7 tools (`search_floppies`, `get_floppy`, `list_product_floppies`, `list_products`, `download_floppy`, `list_floppy_files`, `get_archive_stats`). It reads `ARCHIVE_ROOT` (defaults to repo root). MCP clients launch it themselves via the repo's `.mcp.json`; `make mcp` is only for manually testing that it boots. It has no write tools — imports/edits stay in the web UI.

## Conventions

- After editing image/product/category metadata, run `make check` and regenerate the catalog (`rebuild-catalog`) so `catalog/*.json` stays in sync with YAML.
- `make setup` must succeed before anything; if the NDFS submodule is missing, run `git submodule update --init --recursive`.
- Storage policy: floppy images ≤1.3 MB are committed compressed; HDD images / tapes go to Internet Archive (`storageClass` + `internetArchive` fields in YAML drive this).
