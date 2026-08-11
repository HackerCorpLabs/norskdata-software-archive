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
make site-serve     # build the static site + serve site/ on :8000
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

There is **no test suite and no linter** — `make check` (the `check` CLI subcommand) is the validation gate. CI enforces it: `.github/workflows/validate.yml` builds the NDFS submodule, builds the tools, and runs `make check` on every push and PR to `main`. `.github/workflows/pages.yml` regenerates `site/` from source and deploys it; `.github/workflows/ia-verify.yml` checks Internet Archive checksums. CLI subcommands: `import`, `import-folder`, `search`, `check`, `check-deps`, `ia-sync`/`ia-verify`/`ia-upload`, `build-static-site`, `rebuild-catalog`, `migrate-products`, `extract-legacy`, `mcp`.

Two proof scripts under `tools/scripts/` are the closest thing to tests, and they assert the "one persist path" rule below:

```bash
node tools/scripts/roundtrip-proof.mjs        # every YAML field survives write -> reload
bash tools/scripts/persistence-proof.sh       # needs the dev server on :3000 (make import)
```

`roundtrip-proof.mjs` sets a sentinel on every field of a real entry, writes YAML, reloads it, and asserts each sentinel came back — a field that does not come back is a read-without-write gap. `persistence-proof.sh` injects a field straight into `floppies.json` and proves a regenerate wipes it (JSON is a pure projection of YAML), then proves every mutation endpoint's change survives the same regenerate, and statically asserts no `saveCatalog()` call is reachable from live code.

## Architecture & data model

**YAML per floppy is the source of truth.** Every image lives in `images/{md5}/` where `{md5}` is the full MD5 of the raw `.img`. The folder holds `<name>.img.gz`, `<name>.yaml` (all metadata/classification), label photos (`*.JPG`), and optional `labels.txt`. Folders are content-addressed and **never renamed**, even when metadata changes. `catalog/floppies.json` and `catalog/products.json` are **generated** from the YAML files — never hand-edit them; run `rebuild-catalog` (or import, which auto-regenerates).

Products are separate YAML under `products/` (`id`, `name`, `categories`, `platform`, `docs`); categories are defined in `categories/product-categories.yaml`. A floppy's `product.id` links it to a product file.

**ND documentation.** `docs/nd/product-info/` and `docs/nd/installation-description/` hold ND's Product Information sheets and Program/Installation Descriptions as markdown, named by ND document number. A product's `docs:` block references them by id — one document often describes several products (`ND-10174-10-EN` covers ND-10174, ND-10575 and ND-10576), so documents are stored once and referenced, never copied per product. `api/nd-docs.ts` is the shared resolver used by both the static-site builder and the MCP server; `static-site-builder.ts` pre-renders each referenced document to `site/docs/<id>.html` at build time rather than inlining it, so `site/index.html` stays small and the no-`fetch()`/`file://` property holds.

**NDFS parsing** is done by the bundled submodule at `externals/norskdata-ndfs/ndfs-ts` (imported as `norskdata-ndfs` via a `file:` dependency). It extracts volume name, boot format, users, file listings, and BPUN checksum validation. The same parser is bundled into the static site so the browser-based NDFS viewer runs client-side. If NDFS behavior looks wrong, the bug is likely in the submodule, not in `tools/src/`.

**Import pipeline** (`tools/src/api/import.ts`, `import-folder.ts`): read `.img` → MD5 → parse NDFS → validate BPUN → match volume name against ND product-number patterns (`product-matcher.ts` + `name-parser.ts`) — recorded as a *suggestion*; the floppy is left **unassigned** (productId null) so it is confirmed in the Matcher, never auto-linked → dedup by MD5 (`dedup.ts`) → gzip into `images/{md5}/` → copy photos (per-disk photos stay with the image; shared "set" photos consolidate into `collections/{product}/`) → write YAML → regenerate derived artifacts.

**One persist path.** After any import or product assignment, derived artifacts are regenerated from the YAML source of truth — never from an in-memory snapshot. `catalog.ts` `persistCatalog()` = `consolidateGroupPhotos` + `generateCatalogJson` (floppies.json + products.json). The web UI import/assign endpoints and the CLI (`import-runner.ts`) both then rebuild the `catalog/index.json` search index (`writeIndex`) and the static site (`buildStaticSite`), so every import path — web UI and `import-*` CLI — leaves the repo in an identical state. Do **not** persist the catalog by writing the in-memory catalog to JSON (`saveCatalog`) without regenerating from YAML; that can drift to a partial catalog.

**Two front-ends, two audiences.** The Express server (`server.ts`, `make import`, port 3000) is the *contributor workbench*: it renders every page live from the running Node process and is the only place that imports, assigns products, or commits. The static site (`static-site-builder.ts`, `make static-site`, output in `site/`) is the *public read-only window*: flat pre-rendered HTML, one file per product, served by GitHub Pages, which cannot run server-side code. `site/` is gitignored and rebuilt by CI from the YAML/catalog on every push, so any local `site/` is a throwaway preview — never edit it, and do not treat a large diff under `site/` as meaningful work.

### `tools/src/` map

- `cli.ts` — Commander entry point wiring all subcommands.
- `server.ts` — Express backend for the local web UI (`src/ui/index.html` is a single-page app served from `dist/ui/`).
- `interactive-import.ts` — prompted CLI import.
- `api/catalog.ts` — read/write YAML ↔ generated JSON; the catalog generation logic.
- `api/static-site-builder.ts` — the GitHub Pages generator (the only site builder; it writes the whole self-contained `site/index.html`).
- `api/product-matcher.ts` / `api/name-parser.ts` — ND volume-name → product/version/disk/language matching.
- `api/ia-sync.ts` — Internet Archive sync (large artifacts go to IA; floppies ≤1.3 MB stay in git).
- `mcp/server.ts` — read-only MCP server (stdio) exposing the catalog to LLMs; see below.
- `migrate*.ts`, `extract-legacy.ts`, `merge-legacy.ts` — one-off data migration scripts; not part of normal flow.
- `types.ts` — shared types; `zod` is used for schema validation.

**MCP server** (`mcp/server.ts`): a stdio MCP server, **read-only**, that loads `catalog/floppies.json` + `catalog/products.json` and exposes 10 tools (`search_floppies`, `get_floppy`, `list_product_floppies`, `list_products`, `download_floppy`, `list_floppy_files`, `get_archive_stats`, `list_product_documents`, `read_document`, `search_documents`). It reads `ARCHIVE_ROOT` (defaults to repo root). MCP clients launch it themselves via the repo's `.mcp.json`; `make mcp` is only for manually testing that it boots. It has no write tools — imports/edits stay in the web UI.

## Conventions

- After editing image/product/category metadata, run `make check` and regenerate the catalog (`rebuild-catalog`) so `catalog/*.json` stays in sync with YAML.
- `make setup` must succeed before anything; if the NDFS submodule is missing, run `git submodule update --init --recursive`.
- Storage policy: floppy images ≤1.3 MB are committed compressed; HDD images / tapes go to Internet Archive (`storageClass` + `internetArchive` fields in YAML drive this).

## Git in this repo

- **Never `git add -A` / `git add .`** here. Imported floppy data routinely sits uncommitted in the working tree, so a blanket add sweeps unrelated images and YAML into someone else's commit. Always stage explicit paths.
- **Imported floppy data and metadata** (`images/`, `collections/`, `products/`, `categories/`, `catalog/`) go on a branch and through a PR, so the import can be reviewed before it lands.
- **Code and tooling changes** (`tools/`, `Makefile`, docs) push straight to `main`.
