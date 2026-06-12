# Floppy Image Storage

This directory stores gzip-compressed floppy disk images directly in the git repository.

## Storage Model

- **Floppy images** (<= ~1.3 MB raw, 700 NDFS pages or fewer) are stored as `.img.gz` files
  in this directory tree. At roughly 7:1 compression, the full set of ~548 floppy images
  occupies approximately 38 MB compressed -- well within GitHub's limits.

- **Hard disk / large images** (> ~1.3 MB raw) are stored on the Internet Archive only.
  Their metadata lives in `catalog/floppies.json` with `storageClass: "ia-only"`.

- **Label photos** (`.JPG`) from physical floppy labels are stored alongside their
  corresponding images. These are typically small files (< 200 KB each).

- **Label transcriptions** (`labels.txt`) contain human-readable text transcribed from
  physical floppy labels, preserved with provenance information.

## Directory Layout

Each floppy image gets its own folder named by its full MD5 hash:

```
images/
  {md5}/                 # One folder per floppy image
    filename.img.gz      # Compressed floppy image
    filename.yaml        # Metadata (source of truth)
    photo.JPG            # Label photo(s)
    labels.txt           # Label transcription
```

The folder name is the content-derived MD5 checksum of the raw image. This means:
- Folders never need renaming when a floppy gets assigned to a product
- No category-based hierarchy to maintain
- All metadata lives in the YAML file, not in the folder structure

## Usage

To decompress an image for use with an emulator or analysis tool:

```bash
gunzip -k image.img.gz
```

The `-k` flag keeps the compressed file in place. Most tools in this repository
handle `.img.gz` files transparently.

## Catalog Integration

Each image stored here has a corresponding entry in `catalog/floppies.json` with:

- `storageClass`: `"floppy-in-git"` or `"both"` (if also on Internet Archive)
- `storage.git.imagePath`: relative path to the `.img.gz` file from the repo root
- `storage.git.labelPhotos`: array of paths to label photo files (if any)
- `storage.git.labelTranscription`: path to `labels.txt` (if any)
