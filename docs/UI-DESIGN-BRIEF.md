# UI Design Brief: Norsk Data Software Archive

## What this is

A web-based tool for browsing, searching, and importing historical Norsk Data floppy disk images. Currently 111 images across 16 products, growing to 1000+. Each image is a raw dump of a 1970s-80s floppy disk containing files from the NDFS (Norsk Data File System).

The tool runs locally at `http://localhost:3000` and is used by archivists/collectors importing floppy images into a preservation archive.

---

## The Data Hierarchy

The data has a strict hierarchy that the UI must reflect:

```
Product (e.g., ND-10079 "NOTIS-WP")
  |
  +-- Version (e.g., M07)
  |     |
  |     +-- Language variant (XX = international, NO = Norwegian, EN = English)
  |     |     |
  |     |     +-- Disk 1 of N  (a single .img floppy image)
  |     |     +-- Disk 2 of N
  |     |     +-- Disk 3 of N  ...up to 9 disks in a set
  |     |
  |     +-- Another language variant
  |
  +-- Another Version (e.g., M08)
  |     +-- ...
  |
  +-- Another Version (e.g., L00)
        +-- ...
```

### Real example: ND-10079 "NOTIS-WP" (19 floppy images)

```
ND-10079 - NOTIS-WP
  |
  +-- Version L00 (1984)  -- 2 disks
  |     +-- NO (Norwegian): Disk 1, Disk 2
  |
  +-- Version M05 (1986)  -- 3 disks (one per language)
  |     +-- EN (English): 1 disk (616p, double density)
  |     +-- NO (Norwegian): 1 disk
  |     +-- XX (International): 1 disk
  |
  +-- Version M07 (1987)  -- 7 disks
  |     +-- NO: Disk 1, Disk 2, Disk 3, Disk 4
  |     +-- XX: Disk 1, Disk 2, Disk 3
  |
  +-- Version M08 (1988)  -- 7 disks
        +-- NO: Disk 1, Disk 2, Disk 3, Disk 4
        +-- XX: Disk 1, Disk 2, Disk 3
```

### Other real examples

- **ND-210691 "NOTIS-DS"**: 12 images across 2 versions (D03, D04), up to 9 disks per version
- **ND-210337 "Backup-System"**: 7 images across 3 versions (H07, I04, I05)
- **ND-10022 "SINTRAN Utility Programs"**: 1 image, 1 version (T)

### Things that don't fit the hierarchy

- **OS distribution floppies**: Named like `N-900-188-I` through `N-900-188-IV` (SINTRAN III distribution set). No ND product number. Grouped by distribution name.
- **Patch floppies**: Named `PATCH-SINTRAN` or `ND-PATCH-SIN-J`. Grouped as patches.
- **Uncategorized**: Items like `GRAFS-1` through `GRAFS-5` (Norwegian graphics package), `NTH-Kermit`, `RDIR`, `FLOPPY`, `UNIQUE`. No ND product number, no standard naming.

---

## What metadata exists per floppy image

Each floppy image has this data available:

### Identity
| Field | Example | Description |
|-------|---------|-------------|
| id | `nd-10079-m07-d1-62caae43` | Unique content-derived ID |
| volumeName | `10079M07-NO-1S` | NDFS directory name from the disk |
| productId | `ND-10079` | Matched ND product number |
| version | `M07` | Software version |
| diskNumber | `1` | Which disk in a multi-disk set |
| language | `NO` | NO=Norwegian, EN=English, XX=International |

### Physical media
| Field | Example | Description |
|-------|---------|-------------|
| imageSizeBytes | `315392` | Raw image size (308 KB = single density, 1.2 MB = double density) |
| totalPages | `154` | NDFS pages (154 = 360KB floppy, 616 = 1.2MB floppy, 640 = 1.25MB) |
| bootFormat | `flomon` | `flomon` (bootable), `binary`, `bpun`, or `none` |
| controller | `floppy` | Always "floppy" for this collection |

### NDFS file listing (the files INSIDE the floppy image)
Each floppy contains files in the ND File System. Example from `10079M07-NO-1S`:

| File Name | Type | Pages | Size | Created | Last Written |
|-----------|------|-------|------|---------|-------------|
| WP-MAIN-NO-M07:PROG | PROG | 49 | 200,704 | 1987-04-24 17:34:07 | 1987-04-24 17:34:09 |
| NYE-FUNK-WP-NO-M:STXT | STXT | 5 | 9,216 | 1985-07-25 14:03:53 | 1985-08-20 11:13:40 |
| NYE-FUNK-WP-NO-M:BDT | BDT | 11 | 22,528 | 1985-07-25 14:05:45 | 1985-08-20 11:14:00 |
| NYE-FUNK-WP-NO-M:TEXT | TEXT | 2 | 2,055 | 1985-07-25 14:04:21 | 1985-08-20 11:14:22 |
| LANGUAGE-DEP-NO:LDEP | LDEP | 1 | 346 | 1985-07-16 20:11:14 | 1985-08-02 10:10:46 |

The `:TYPE` suffix indicates the file type: BPUN (binary loadable), PROG (program), DATA, TEXT, SYMB (symbol table), etc.

Dates are decoded from the original ND-100 packed 32-bit timestamps. Some floppies have dates (like these from 1985-1988), others may not (zero = unknown).

### Checksums
| Field | Example |
|-------|---------|
| md5 | `62caae43d67b7bfedb18bf17dc079e0d` |
| sha256 | `19268f4e66c628de24f9eb923c9249ac10d013b...` |

### Provenance
| Field | Example |
|-------|---------|
| contributor | `Frode` |
| originalPath | `/mnt/d/ND/Frode/10079M07-NO/10079M07-NO-01S.img` |

### Photos and labels
- **Label photos**: JPG photos of the physical floppy disk label. Usually 1 per disk (or shared across a set). Located alongside the .img.gz file.
- **Label transcription** (`labels.txt`): Hand-typed text from the physical label. Contains product name, directory name, user name, production/release dates. Shared across all disks in a folder.
- **Imaging logs**: Text files from the disk imaging process (Greaseweazle read output, SCP-to-IMG conversion logs).

Example label transcription:
```
10079M07-XX-01S:

    PRODUCT: NOTIS
    WP for ND-100
    Dir. name: 10079M07-XX-01S
    User name: FLOPPY-USER
    Prod./release date: 870512 870508
```

### Storage
- **Git path**: `images/62caae43d67b7bfedb18bf17dc079e0d/10079M07-NO-01S.img.gz` (compressed in the repo)
- **Internet Archive**: Eventually uploaded to IA with a permanent download URL (sync status: pending/uploaded)

### Documentation references (planned, currently null)
- PI (Product Information) sheet reference
- PD (Program Description) sheet reference
- Related manual ND document numbers

---

## Current UI problems

1. **Flat table**: Everything is in one giant table. A 7-disk NOTIS-WP M07 set shows as 7 separate rows with no visual grouping. You can't tell it's one product with multiple versions with multiple disks.

2. **No hierarchy navigation**: Can't drill from product -> version -> language -> disk. You see individual images with no context of what they belong to.

3. **NDFS files hidden**: File listings are only visible if you click to expand a row. This is the most interesting data (what's actually ON the floppy) but it's buried.

4. **Photos not prominent**: Label photos exist but are tiny thumbnails in the detail view. The physical labels are important provenance -- they should be easy to see.

5. **No multi-disk context**: When looking at "disk 3 of 7", there's no way to see disk 1-7 as a set. You don't know what the complete installation requires.

6. **No visual distinction**: OS distributions, patches, and uncategorized items all look the same in the table. Different categories need different visual treatment.

---

## What the UI needs to show

### Level 1: Product overview (the entry point)

A grid/card view of products, showing:
- Product ID (e.g., `ND-10079`)
- Product name (e.g., `NOTIS-WP`)
- Number of versions available
- Total number of floppy images
- Date range (earliest to latest file dates across all images)
- Category badge: Product / OS Distribution / Patch / Uncategorized
- A representative label photo (if available)

Clicking a product opens the product detail page.

### Level 2: Product detail (versions and disk sets)

Shows all versions of a product, grouped as sets:

```
ND-10079 - NOTIS-WP                               [19 images, 4 versions]

Version M08 (1988)                                                  7 disks
+-----------------------------------------------------------------------+
| Norwegian (NO)          | International (XX)                          |
| [photo] [photo]         | [photo] [photo] [photo]                     |
| Disk 1: 10079M08-NO-1S  | Disk 1: 10079M08-XX-1S                     |
| Disk 2: 10079M08-NO-2S  | Disk 2: 10079M08-XX-2S                     |
| Disk 3: 10079M08-NO-3S  | Disk 3: 10079M08-XX-3S                     |
| Disk 4: 10079M08-NO-4S  |                                             |
+-----------------------------------------------------------------------+
Label text: "PRODUCT: NOTIS WP for ND-110, PART 1 OF 7"

Version M07 (1987)                                                  7 disks
+-----------------------------------------------------------------------+
| ...                                                                   |
+-----------------------------------------------------------------------+

Version M05 (1986)                                                  3 disks
Version L00 (1984)                                                  2 disks
```

Each disk in the set is clickable to see its detail.

### Level 3: Individual floppy detail

When clicking a specific disk, show:

**Header area:**
- Volume name, product, version, disk number
- Boot format badge (color-coded: FLOMON=green, Binary=blue, None=gray)
- Physical specs: 154 pages / 308 KB / Single density
- MD5 and SHA256 (copyable)
- Label photo (large, zoomable)

**NDFS file listing** (the main content - this is what people want to see):
```
Volume: 10079M07-NO-1S          User: FLOPPY-USER (74 pages used)

Name                          Type   Pages    Size   Created              Written
WP-MAIN-NO-M07:PROG          PROG      49   196 KB  1987-04-24 17:34:07  1987-04-24 17:34:09
NYE-FUNK-WP-NO-M:STXT        STXT       5     9 KB  1985-07-25 14:03:53  1985-08-20 11:13:40
NYE-FUNK-WP-NO-M:BDT         BDT       11    22 KB  1985-07-25 14:05:45  1985-08-20 11:14:00
NYE-FUNK-WP-NO-M:TEXT        TEXT        2     2 KB  1985-07-25 14:04:21  1985-08-20 11:14:22
LANGUAGE-DEP-NO:LDEP         LDEP        1   346 B   1985-07-16 20:11:14  1985-08-02 10:10:46
```

**Provenance section:**
- Contributor, imaging method, original path
- Label transcription text (if available)
- Imaging logs (if available)

**Navigation:**
- Previous/Next disk in the set
- Back to product detail
- Related: other versions of this product, related products

---

## Special categories need different treatment

### OS Distributions
```
SINTRAN III Distributions
+-- Version H (1985-04-17)
|     +-- N-10-203-I, N-10-203-III
+-- Version J (3 dated snapshots)
|     +-- 1986-08-04: N-900-188-I through IV
|     +-- 1986-11-26: N-900-188-I through IV
|     +-- 1986-12-09: N-900-188-I through IV
+-- Satellite-9 / COSMOS (1983-01-06)
      +-- N-900-000-I through III
```

### Patches
```
SINTRAN III Patches
+-- Version H
|     +-- Patch 17 (PATCH-SINTRAN)
|     +-- Patch 223 (PATCH-SINTRAN)
+-- Version J
|     +-- Patch 10300, 1986-05-14
|     +-- Patch 11100, 1986-10-23 (2 copies)
|     +-- Patch 11110, 1987-08-13
+-- Version K
      +-- Patch 011411 (211291K12-XX-01D)
```

### Uncategorized
Grid of individual images with volume name and label photo if available.

---

## Import workflow (existing, needs better design)

The import tab currently has:
1. **Upload mode**: Drag-drop .img files
2. **Folder scan mode**: Enter a local path, scan for images, preview results, import

The folder scan preview shows per-image: filename, detected volume name, matched product, boot format, size, and status (Ready / Duplicate / Variant).

Duplicates are highlighted with orange badges showing the existing entry they match.

Import needs:
- Clear progress indication during import
- After import: show what was added, link to the new entries in the catalog
- Batch metadata fields: contributor name, source description (applied to all images in the batch)

---

## Data inventory (current)

| Metric | Value |
|--------|-------|
| Total floppy images | 111 |
| Products matched | 16 |
| Uncategorized images | 57 |
| Images with NDFS file listings | 111 (all) |
| Images with dates | 111 (all) |
| Images with label photos | 55 |
| Images with label transcriptions | 8 sets |
| Date range of files on floppies | 1981 to 1988 |
| Total NDFS files across all images | ~550 |

---

## Technical constraints

- Single HTML file with inline CSS/JS (no build step for frontend)
- No external CSS/JS dependencies
- Must work on localhost:3000 (Express backend serves API + static files)
- WCAG 2.1 Level AA compliant colors:
  - Blue: Fill #E3F2FD / Stroke #0D47A1
  - Teal: Fill #E0F7FA / Stroke #00838F
  - Green: Fill #E8F5E9 / Stroke #2E7D32
  - Purple: Fill #F3E5F5 / Stroke #7B1FA2
  - Orange: Fill #FFF3E0 / Stroke #E65100
- Dark theme preferred (background: #1a1a2e, cards: #16213e, text: #e0e0e0)
- Responsive layout

## API endpoints available

| Endpoint | Returns |
|----------|---------|
| `GET /api/catalog` | Array of all entries (summary fields) |
| `GET /api/catalog/:id` | Full entry with NDFS files, dates, storage, provenance |
| `GET /api/products` | Products with image counts |
| `GET /api/search?q=...` | Search results |
| `GET /api/stats` | Summary statistics |
| `GET /api/images/{path}` | Serve .img.gz files and label photos from images/ directory |
| `POST /api/import/file` | Upload single image |
| `POST /api/import/folder` | Scan folder (preview) |
| `POST /api/import/folder/confirm` | Execute import |
| `GET /api/git/status` | Git clean/dirty status |
| `POST /api/git/commit` | Create git commit |
