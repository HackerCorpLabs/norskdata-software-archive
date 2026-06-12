# Storage Layout

## Principles

1. **YAML per floppy is the source of truth.** Each `.img.gz` file has a `.yaml` file next to it containing all metadata: checksums, NDFS file listing, provenance, photo references, and documentation links.
2. **Product YAMLs describe products.** Each known ND product has a YAML file in `products/` with its product ID and name.
3. **Content-addressed folders.** Each floppy image lives in `images/{md5}/` -- the full MD5 hash of the raw image. The folder never changes, even when a floppy is assigned to a product.
4. **Photos sit flat with their image.** Label photos and transcriptions go directly in the MD5 folder alongside the `.img.gz` and `.yaml`.
5. **Catalog JSON is generated, not hand-edited.** `catalog/floppies.json` is rebuilt by scanning all `.yaml` files on server start.
6. **MD5 deduplication.** Re-importing the same floppy image (identical MD5) does nothing.

## Directory Overview

```
norskdata-software-archive/
  images/
    {md5}/                              # One folder per floppy, named by MD5 hash
      filename.img.gz                   # Floppy image (gzipped raw)
      filename.yaml                     # Metadata for this specific floppy
      photo.JPG                         # Label photo(s)
      labels.txt                        # Label transcription

  products/                             # One YAML per known product
    ND-10022.yaml
    ND-10079.yaml
    ...

  collections/                          # Groupings of related products
    notis-wp-m07-no.yaml

  catalog/
    floppies.json                       # GENERATED from YAML files on server start
    legacy.json                         # Metadata-only entries from old ndfloppy database (no .img.gz)
    products.json                       # GENERATED product index
    releases.json                       # GENERATED release index
    index.json                          # GENERATED master index
    SHA256SUMS.txt                      # Checksums for catalog files
    schema/
      floppy.schema.json                # JSON Schema for floppy entries
      product.schema.json               # JSON Schema for product entries
      release.schema.json               # JSON Schema for release entries
```

## Floppy YAML (Source of Truth)

Every imported floppy image has a `.yaml` file sitting next to its `.img.gz`. This YAML contains everything: identity, checksums, NDFS content listing, provenance, photo references, and documentation links.

**Location:** `images/{md5}/{filename}.yaml`

**Real example:** `images/78a2647e91efedd6c2192e24f76497c9/ND-10022T.yaml`

```yaml
id: nd-10022-t-d1-78a2647e
volumeName: ND-10022T
md5: 78a2647e91efedd6c2192e24f76497c9
sha256: a5599b617755d772c4b7c4540b525ca9c370af63c92b4c47b7d70bf5eae04be9
product:
  id: ND-10022
  version: T
image:
  sizeBytes: 315392
  format: raw
  controller: floppy
  totalPages: 154
  pageSize: 2048
  bootFormat: flomon
ndfs:
  users:
    - name: FLOPPY-USER
      pagesUsed: 133
  files:
    - name: DMAC-1915E:BPUN
      type: BPUN
      pages: 18
      bytes: 36805
      userName: FLOPPY-USER
      dateCreatedStr: "1982-12-03 13:21:47"
    # ... more files
provenance:
  contributor: cont1
  originalPath: /mnt/d/ND/Frode/ND-10022T/ND-10022T.img
  importedAt: "2026-05-29T08:10:32.641Z"
photos:
  disk: []
  set:
    - DSC_0789.JPG
tags: []
docs:
  piDocId: null
  pdDocId: null
  relatedDocIds: []
  externalUrls: []
storageClass: floppy-in-git
internetArchive:
  itemId: norskdata-floppy-nd-10022-t-d1-78a2647e
  syncStatus: pending
```

## Product YAML

Each known ND product number has a short YAML in `products/`.

**Location:** `/home/ronny/repos/norskdata-software-archive/products/{productId}.yaml`

```yaml
id: ND-10022
name: SINTRAN Utility Programs
```

There are currently 210 product YAML files.

## Collection YAML

Collections group related products into logical sets (e.g., all the disks needed for a specific software installation).

**Location:** `/home/ronny/repos/norskdata-software-archive/collections/{collection-name}.yaml`

```yaml
name: NOTIS-WP M07 Norwegian
description: NOTIS Word Processor M07 for ND-100, Norwegian edition
items:
  - productId: ND-10079
    version: M07
    role: Application disks
```

## Real Example: ND-10022 Version T

```
images/78a2647e91efedd6c2192e24f76497c9/
  ND-10022T.img.gz            # Gzipped floppy image (161 KB)
  ND-10022T.yaml              # All metadata for this floppy
  DSC_0789.JPG                # Label photo
```

The `.yaml`, `.img.gz`, and photos all sit flat in the MD5 folder. No subcategories or nesting.

## What Goes Where

| File type | Location | Example |
|-----------|----------|---------|
| Floppy image | `images/{md5}/{filename}.img.gz` | `images/78a264.../ND-10022T.img.gz` |
| Floppy metadata | `images/{md5}/{filename}.yaml` | `images/78a264.../ND-10022T.yaml` |
| Label photo | `images/{md5}/{photo}.JPG` | `images/78a264.../DSC_0789.JPG` |
| Label transcription | `images/{md5}/labels.txt` | `images/78a264.../labels.txt` |
| Product metadata | `products/{productId}.yaml` | `products/ND-10022.yaml` |
| Collection | `collections/{name}.yaml` | `collections/notis-wp-m07-no.yaml` |

## Catalog (Generated)

The catalog JSON files under `catalog/` are **not hand-edited**. They are regenerated by scanning all floppy YAML files when the server starts.

- **`catalog/floppies.json`** -- Array of all floppy entries, built from `images/**/*.yaml`.
- **`catalog/legacy.json`** -- Holds metadata-only entries migrated from the old ndfloppy database. These represent floppies we have metadata for but no actual `.img.gz` file.
- **`catalog/products.json`** -- Product index.
- **`catalog/releases.json`** -- Release index.
- **`catalog/index.json`** -- Master index.

## How the Import Tool Works

1. User points at a source folder containing `.img` files.
2. Tool parses each `.img` file: extracts product ID and version from the NDFS volume name.
3. Tool computes the MD5 checksum of the image.
4. **Deduplication check**: if an image with the same MD5 already exists in the archive, the import is skipped entirely.
5. Tool creates `images/{md5}/` folder for this image.
6. Tool gzip-compresses the image and places it in the MD5 folder.
7. Tool generates the `.yaml` file next to the image with all extracted metadata, checksums, provenance, and photo references.
8. Photos are copied flat into the MD5 folder alongside the image.

## Safety

- **MD5 dedup prevents duplicates.** Importing the same floppy twice does nothing.
- **Content-addressed folders are stable.** Assigning a product or changing metadata only updates the YAML, never the folder.
- **YAML is the source of truth.** If catalog JSON is lost or corrupted, it can be fully regenerated from the YAML files.
