# Norsk Data Software Archive

[![CI](https://github.com/HackerCorpLabs/norskdata-software-archive/actions/workflows/validate.yml/badge.svg)](https://github.com/HackerCorpLabs/norskdata-software-archive/actions/workflows/validate.yml)

A preservation project for software from [Norsk Data](https://en.wikipedia.org/wiki/Norsk_Data), a Norwegian minicomputer manufacturer (1967--1998). This archive catalogs and preserves floppy disk images, with full NDFS filesystem metadata, from the NORD and ND series of minicomputers.

**Live site**: [labs.hackercorp.no/norskdata-software-archive](http://labs.hackercorp.no/norskdata-software-archive/)

## What this is

- A git repository containing compressed floppy disk images (`.img.gz`) with per-image YAML metadata
- A searchable web catalog with NDFS filesystem browsing, BPUN checksum validation, and label photo viewing
- Import tools for adding new disk images with automatic product matching
- An MCP server for LLM integration with the [nd100x emulator](https://github.com/HackerCorpLabs/nd100x)

## Architecture

```
GitHub repo (this)              Internet Archive
  images/{md5}/                   norskdata-software collection
    image.img.gz                  (permanent binary storage)
    metadata.yaml                  stable download URLs
  collections/{product}/          shared "set" photos (one copy per product+version)
  catalog/floppies.json           generated from the YAML
  tools/ (CLI + web UI + MCP)
  site/                           generated + gitignored (GitHub Pages preview)
```

- **YAML per floppy is the source of truth.** Each `.img.gz` has a `.yaml` file next to it with all metadata. `catalog/floppies.json`, `catalog/products.json`, `catalog/index.json` and `site/` are all **generated** from the YAML -- never edited by hand. `site/` is gitignored (CI rebuilds it on every push).
- **Content-addressed storage.** Each image lives in `images/{md5}/` -- the folder is named by the full MD5 hash of the raw image. Folders never change, even when metadata is updated.
- **NDFS parsing.** Every image is parsed using the [norskdata-ndfs](https://github.com/HackerCorpLabs/norskdata-ndfs) library to extract volume name, boot format, user listings, and file listings.
- **Floppy images in git.** Images <=1.3 MB are stored compressed in the repo. Larger artifacts (HDD images, tapes) go to Internet Archive.

---

## Reading the catalog JSON (C, C#, TypeScript)

`catalog/floppies.json` is a JSON array of floppy objects. Property names use **camelCase** (`volumeName`, `md5`, `productId`, `bootFormat`, …) -- the standard convention for JSON data interchange. Nested objects follow the same convention (`storage.git.imagePath`, `ndfs.files[].name`, `provenance.contributor`).

```jsonc
{
  "id": "nd-10079-m08-d4-a34ba51c",
  "volumeName": "10079M08-NO-4S",
  "md5": "a34ba51ce14eb2e4e78b11c9fd1dc149",
  "productId": "ND-10079",
  "bootFormat": "none",
  "ndfs": { "files": [ { "name": "WP-MAIN-NO:BPUN", "userName": "FLOPPY-USER", "bytes": 32790 } ] }
}
```

### TypeScript / JavaScript -- native, no config

```ts
const floppies = JSON.parse(await fs.readFile('catalog/floppies.json', 'utf-8'));
console.log(floppies[0].volumeName, floppies[0].md5);
```

### C# -- set the camelCase naming policy

The JSON is camelCase, so map your PascalCase C# properties to it with `JsonNamingPolicy.CamelCase`. **Do not** use serializer defaults (they expect PascalCase) -- they would read every property as `null`.

```csharp
using System.Text.Json;

public class Floppy {
    public string Id { get; set; }
    public string? VolumeName { get; set; }
    public string Md5 { get; set; }
    public string? ProductId { get; set; }
    public string? BootFormat { get; set; }
    // ... other fields
}

var options = new JsonSerializerOptions {
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,   // VolumeName  <-  "volumeName"
    PropertyNameCaseInsensitive = true,                  // belt-and-suspenders
};
var floppies = JsonSerializer.Deserialize<List<Floppy>>(
    File.ReadAllText("catalog/floppies.json"), options);
```

Newtonsoft.Json alternative: annotate with `[JsonProperty("volumeName")]`, or set
`ContractResolver = new CamelCasePropertyNamesContractResolver()`.

### C -- access by the literal JSON key string (cJSON)

Casing is just the literal key string; use the exact camelCase names.

```c
cJSON *root = cJSON_Parse(buf);
cJSON *e    = cJSON_GetArrayItem(root, 0);
const char *vol = cJSON_GetObjectItem(e, "volumeName")->valuestring;
const char *md5 = cJSON_GetObjectItem(e, "md5")->valuestring;

cJSON *ndfs  = cJSON_GetObjectItem(e, "ndfs");
cJSON *files = ndfs ? cJSON_GetObjectItem(ndfs, "files") : NULL;     /* nested */
```

---

## Quick Start

```bash
git clone https://github.com/HackerCorpLabs/norskdata-software-archive.git
cd norskdata-software-archive
make setup
make import
```

This starts the web UI at **http://localhost:3000** where you can browse the catalog, view NDFS filesystem contents, manage products, import new images, and commit changes. (`make serve` is a backward-compatible alias for `make import`.)

For the read-only static site:

```bash
make static-site
make site-serve    # serves on port 8000
```

---

## Importing Floppy Images

### Primary: web UI

```bash
make import
```

Start the server and go to **http://localhost:3000/#/import**, then use either:
- **Folder scan** -- point at a folder of `.img` files, preview, then import
- **File upload** -- drag and drop a single `.img` file

This is the recommended path: it imports *and* lets you map floppies to products (Matcher) and commit changes, all in the browser.

### Console wizard (CLI)

```bash
make import-cli
```

Interactive terminal prompts for path, contributor name, and source description.

### Non-interactive (scripted)

```bash
make import-folder SRC=/path/to/folder CONTRIBUTOR="Name" SOURCE="description" RECURSIVE=1
make import-file FILE=/path/to/image.img CONTRIBUTOR="Name" SOURCE="description"
```

The console paths (`import-cli`, `import-folder`, `import-file`) **only import** -- unmatched floppies still need to be assigned to products in the web UI's Matcher. They are otherwise equivalent to the web UI: every import path leaves the catalog, search index and static site in the same state (see below).

### What happens during import

1. Reads the `.img` file and computes MD5 checksum
2. Parses the NDFS filesystem (volume name, boot format, users, file listings)
3. Validates BPUN checksums where applicable
4. Matches the volume name against known ND product number patterns. The match is recorded as a *suggestion* -- the floppy is left **unassigned** so you confirm it in the Matcher; it is not auto-linked.
5. Checks for duplicates (same MD5 = skip)
6. Compresses the image and stores it in `images/{md5}/`
7. Copies label photos and transcriptions alongside the image (per-disk photos stay with the image; shared "set" photos are consolidated into the product group folder under `collections/`)
8. Generates a `.yaml` metadata file as the source of truth

After the import finishes, **all derived artifacts are regenerated automatically** -- `catalog/floppies.json` + `catalog/products.json` (from the YAML), the `catalog/index.json` search index, and the static site in `site/`. This happens for **every** import path (web UI and the `import-*` CLI commands), so you never need a manual "rebuild" step. (The live GitHub Pages site is still rebuilt by CI on push; the local `site/` is just a preview.)

---

## Product Matching

Volume names are matched against Norsk Data naming patterns:

| Pattern | Example | Result |
|---------|---------|--------|
| `ND-{digits}{version}` | `ND-10325C` | Product: ND-10325, Version: C |
| `{digits}{ver}-{lang}-{disk}{density}` | `210691D03-NO-01S` | Product: ND-210691, Version: D03, Disk: 1, Language: NO |
| `N-{digits}-{digits}` | `N-900-188-I` | OS distribution |
| Patch keywords | `ND-PATCH-SIN-J` | Patch floppy |

Unmatched images go through the **Matcher** (web UI) where you can manually assign products or create new ones.

---

## Image Organization

Each floppy image lives in its own folder named by its full MD5 hash:

```
images/
  78a2647e91efedd6c2192e24f76497c9/
    ND-10022T.img.gz                    Compressed floppy image
    ND-10022T.yaml                      Metadata (source of truth)
    DSC_0789.JPG                        Label photo
  62caae43d67b7bfedb18bf17dc079e0d/
    10079M07-NO-01S.img.gz
    10079M07-NO-01S.yaml
    DSC_0775.JPG
    labels.txt                          Label transcription
```

The YAML file contains all classification (product, version, tags). The folder structure is purely content-addressed and never changes.

**Per-disk vs. set photos.** A photo whose name matches the disk (e.g. `ND-10022T.JPG`) stays in the image folder as that disk's photo. A *shared* "set" photo (one label/box photo for a whole multi-disk product) is consolidated into a product group folder, `collections/{product}-{version}/`, so it is stored once and attached to every disk in that set instead of duplicated per image.

---

## Web UI (localhost:3000)

The local web UI provides:

- **Dashboard** -- overview stats, match queue status, contributors
- **Catalog** -- searchable, sortable table of all floppy images
- **Products** -- product list with categories, platform, and image counts
- **Import** -- folder scan or file upload for new images
- **Matcher** -- assign unmatched floppies to products
- **Changes** -- review uncommitted changes, commit, and push
- **Help** -- step-by-step workflow guide

### NDFS Viewer

Click any floppy image to open the NDFS filesystem viewer:
- Browse files and users
- View file contents in hex or text
- Extract individual files
- Validate BPUN checksums
- View label photographs with zoom, rotate, and pan

---

## Static Site (GitHub Pages)

A read-only catalog is deployed to GitHub Pages with:
- Client-side search across volume names, products, MD5, tags, and NDFS filenames
- Sortable catalog and products tables
- NDFS filesystem viewer (runs entirely in the browser using a bundled NDFS parser)
- Per-product detail pages with floppy listings
- Dark/light theme
- WCAG 2.1 AA compliant colors

### Static vs. dynamic: two different "sites" for two different audiences

There are two separate front-ends. They serve **different people for different
purposes**, and they work in opposite ways:

| | Web UI (`localhost:3000`) | Static site (`site/`, GitHub Pages) |
|---|---|---|
| **Who it's for** | **Contributors / maintainers** -- the people adding and curating floppies in the repo | **The public** -- anyone browsing the archive online |
| **What it's for** | **Importing and editing**: scan/upload `.img` files, match them to products, review and commit changes | **Read-only browsing**: search, view NDFS contents, look at label photos |
| **Where it runs** | Locally, on your own machine, while you work on the repo | Publicly, at the GitHub Pages URL |
| How pages are produced | **Dynamically**, on each request, by the Express server (`server.ts`) | **Pre-rendered** to flat `.html` files at build time by `static-site-builder.ts` |
| Needs a running server? | Yes -- the Node process renders every page live | No -- it's just files served by a static host |
| Can import / edit data? | Yes (import, matcher, commit) | No -- read-only |

In short: the **dynamic web UI is the workbench** you run locally to get new floppies
into the repo; the **static site is the published, read-only window** onto what the
repo already contains, for public consumption on GitHub Pages.

GitHub Pages can only serve **static files** -- it cannot run server-side code. So
the builder generates the whole catalog ahead of time, including **one HTML file
per product** (`site/products/ND-XXXXX.html`). When you import a floppy for a new
product, the next build produces a new page for it; when a product's data changes,
its page is re-rendered and its HTML changes. This is why a build can show many
changed/added files under `site/` -- they are generated output, not hand-written.

### How the live site is deployed

The live site is **built by CI from source on every push**, not served from the
`site/` files in the repo. The `.github/workflows/pages.yml` workflow runs
`static-site-builder.ts` against the YAML/catalog, uploads the freshly generated
`site/` folder as the Pages artifact, and deploys that. The deploy is triggered by
changes under `catalog/`, `products/`, `categories/`, `images/**/*.yaml`, or the
builder itself.

Because CI regenerates `site/` from source every time, any copy of `site/` produced
locally is a throwaway build artifact -- the deployed site never uses it.

Locally, `site/` is **rebuilt automatically after every import** (web UI and CLI
alike), so the `:8000` preview stays current without a manual step. You can still
force a rebuild with `make static-site`. Product/Matcher edits made *after* an
import are reflected live on the dynamic `:3000` UI immediately; they reach the
`:8000` static preview on the next import or `make static-site`.

---

## MCP Server

The MCP server exposes this archive to LLMs (Claude Code, Claude Desktop, Cursor, etc.) via the [Model Context Protocol](https://modelcontextprotocol.io/). It lets an assistant search and read the catalog directly, instead of you copy-pasting data into a chat.

### What `make mcp` does

```bash
make mcp
```

`make mcp` builds the tools (if needed) and runs `tools/dist/mcp/server.js`. The server:

- Communicates over **stdio** (standard input/output) using the MCP protocol -- it is **not** an HTTP server and prints nothing useful when run by hand. It is meant to be **launched by an MCP client**, not run in a terminal you watch.
- On startup, loads `catalog/floppies.json` and `catalog/products.json` into memory and builds a search index.
- Reads the archive location from the `ARCHIVE_ROOT` environment variable (defaults to the repo root). The bundled `.mcp.json` sets `ARCHIVE_ROOT` to `.`.

It is **read-only**: it never imports, edits, or commits anything. Use the web UI (`make import`) for write operations.

### Tools the LLM can call

| Tool | What it returns |
|------|-----------------|
| `search_floppies` | Full-text search across volume names, product IDs, NDFS file names, tags, and directory content. Args: `query`, optional `limit` (default 10). |
| `get_floppy` | Full metadata for one image, looked up by catalog ID, MD5, SHA256, or volume name. |
| `list_product_floppies` | All floppy images for a given `productId` (e.g. `ND-10325`). |
| `list_products` | Every known product with its image count, sorted by count. |
| `download_floppy` | The local `.img.gz` path and/or Internet Archive URL for an image (no actual download -- it returns where the bytes live). |
| `list_floppy_files` | The NDFS users and files inside an image, from cached metadata -- no download or parsing needed. |
| `get_archive_stats` | Summary stats: totals, breakdown by storage class and boot format, top products. |

### What an LLM can use it for

- **Discovery** -- "Find all floppies that contain a file named `SINTRAN`", "list every disk for product ND-210337", "which products have the most images?"
- **Inspection without downloading** -- read a floppy's NDFS file listing, boot format, volume name, contributor, and BPUN validation status straight from the catalog.
- **Locating the actual image** -- get the local path or Internet Archive URL so it (or you) can fetch the `.img.gz` for use with an emulator such as [nd100x](https://github.com/HackerCorpLabs/nd100x).
- **Research questions over the whole archive** -- cross-reference products, versions, languages, and file contents that would be tedious to grep by hand.

It is **not** for adding or modifying images -- there are no write tools. Importing and product mapping stay in the web UI.

### Installing it in an MCP client

The repo ships a pre-configured `.mcp.json` at its root:

```json
{
  "mcpServers": {
    "norskdata-software": {
      "command": "node",
      "args": ["tools/dist/mcp/server.js"],
      "env": { "ARCHIVE_ROOT": "." }
    }
  }
}
```

**Prerequisite (once):** build the tools so `tools/dist/mcp/server.js` exists:

```bash
make setup
```

**Claude Code** -- run inside the repo so it picks up `.mcp.json` automatically:

```bash
cd norskdata-software-archive
claude          # Claude Code reads ./.mcp.json and offers the "norskdata-software" server
```

The `args` path is relative to the repo root, so launch Claude Code from there. To register it explicitly (or from elsewhere), use an absolute path:

```bash
claude mcp add norskdata-software \
  --env ARCHIVE_ROOT=/abs/path/to/norskdata-software-archive \
  -- node /abs/path/to/norskdata-software-archive/tools/dist/mcp/server.js
```

Verify with `claude mcp list`, or ask Claude something like *"Use the norskdata archive to list the products with the most floppy images."*

**Claude Desktop / Cursor / other clients** -- add the same block to that client's MCP config (for Claude Desktop, `claude_desktop_config.json`), using **absolute paths** for `args` and `ARCHIVE_ROOT` since those clients don't run from the repo directory. Restart the client afterwards.

> The client starts the server itself -- you do **not** need to keep `make mcp` running. `make mcp` is only for manually testing that the server boots.

---

## Make Targets

```
make setup          Build tools and dependencies
make import         Start the web UI on port 3000 (primary import + product mapping)
make serve          Alias for 'make import'
make import-cli     Console import wizard (interactive prompts)

make search Q=...   Search the catalog
make check          Validate catalog integrity
make check-deps     Check prerequisites (node, npm, git)

make static-site    Build the GitHub Pages static site
make site-build     Build per-product HTML pages
make site-serve     Build and serve on port 8000
make mcp            Start the MCP server

make import-folder  Non-interactive folder import (scripted)
make import-file    Non-interactive single file import (scripted)

make ia-sync        Incremental sync to Internet Archive
make ia-verify      Verify IA checksums
make ia-upload      Upload a single item to IA
```

---

## Repository Structure

```
catalog/                    Generated catalog data and schemas
  floppies.json               Generated from YAML files
  products.json               Generated product index
  schema/                     JSON Schema definitions

images/                     Compressed floppy images + metadata
  {md5}/                      One folder per image (MD5 hash)
    filename.img.gz             Compressed floppy image
    filename.yaml               Metadata (source of truth)
    *.JPG                       Per-disk label photos
    labels.txt                  Label transcription

collections/                Shared "set" photos, grouped by product+version
  {product}-{version}/        One folder per set; photos attached to every disk
    group.yaml                  Which photos belong to the set
    *.JPG                       The shared set/box photos

products/                   Product YAML files (id, name, categories, platform)

categories/                 Product category definitions
  product-categories.yaml

tools/                      Node.js/TypeScript tooling
  src/
    server.ts                 Express web UI backend
    cli.ts                    CLI with all subcommands
    interactive-import.ts     Interactive CLI import
    api/
      import.ts               Single image import pipeline
      import-folder.ts        Batch folder import
      product-matcher.ts      ND product number matching
      catalog.ts              YAML/JSON catalog read/write (single persist path)
      static-site-builder.ts  GitHub Pages generator (main site)
      site-builder.ts         Per-product HTML pages
    mcp/
      server.ts               MCP server
    ui/
      index.html              Web UI (single-page app)
  scripts/
    persistence-proof.sh      Proof: mutations survive a regenerate-from-YAML
    roundtrip-proof.mjs       Proof: every field round-trips through YAML

site/                       GitHub Pages static site (generated, gitignored)
```

---

## Related Projects

| Project | Description |
|---------|-------------|
| [norskdata-docs-archive](https://github.com/HackerCorpLabs/norskdata-docs-archive) | ND documentation preservation (PDFs, manuals, OCR text) |
| [NDInsight](https://github.com/HackerCorpLabs/NDInsight) | Curated research: OS install guides, hardware analysis, numbering reference |
| [norskdata-ndfs](https://github.com/HackerCorpLabs/norskdata-ndfs) | NDFS filesystem library (TypeScript, Python, C) |
| [nd100x](https://github.com/HackerCorpLabs/nd100x) | ND-100 minicomputer emulator |
| [nd-120](https://github.com/HackerCorpLabs/nd-120) | ND-120 CPU FPGA recreation |

## Further Documentation

- [INSTALL.md](/INSTALL.md) -- Prerequisites and setup guide
- [CONTRIBUTING.md](/CONTRIBUTING.md) -- How to contribute floppy images
- [BACKUP.md](/BACKUP.md) -- Backup and disaster recovery strategy
- [images/README.md](/images/README.md) -- Image storage model
- [docs/STORAGE-LAYOUT.md](/docs/STORAGE-LAYOUT.md) -- Detailed storage layout documentation

## License

This is a historical preservation project. Original software is copyright Norsk Data A/S.
Catalog metadata and tooling are provided for research and preservation purposes.
