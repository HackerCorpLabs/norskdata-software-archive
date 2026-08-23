# Frode source folders: did the archive keep the groupings?

Read-only analysis of whether the `.img` files that sat in one folder of the Frode source tree ended up assigned to one product in this archive. Nothing was changed: no YAML edited, no product reassigned, no catalog rebuilt, nothing committed.

## How the Frode entries were identified

Two independent handles, and they agree exactly:

1. **MD5 of the raw `.img`.** Every `.img` in the Frode source tree was hashed and each hash looked up in the `md5` field of `catalog/floppies.json`.
2. **`provenance.contributor` + `provenance.originalPath`.** All matched entries carry `provenance.contributor: fvdm`, and the parent folder in `provenance.originalPath` is byte-for-byte the source folder name in every one of the 113 cases (checked; zero mismatches). No entry was picked up by the provenance rule that the MD5 rule missed.

`provenance.source` does not exist on any entry in `catalog/floppies.json` (all 1066 entries have it undefined), so it could not be used.

## Summary counts

| Measure | Value |
|---|---|
| `.img` files in the Frode source tree | 114 |
| Distinct MD5s among them | 113 (one byte-identical duplicate pair, see below) |
| Source folders (the tree is one level deep, no nesting) | 41 |
| Catalog entries traced back to the Frode tree | 113 |
| Frode source images **not** in the archive | 0 |

Verdicts per source folder:

| Verdict | Folders |
|---|---|
| Consistent (all images in one product) | 37 |
| Split across more than one product | 4 |
| Partly unassigned (some images have `productId: null`) | 0 |
| Entirely unassigned | 0 |

**Every one of the 113 Frode entries has a non-null `productId`.** There is no unassigned Frode material at all.

### The duplicate source file

In the folder `Sintran III Version H 85-04-17` two files have the same MD5 `7983326120224feda6f3410ab5ae60a8`:

- `SINTRAN III H, N-10-203-I, 85.04.17.img`
- `SINTRAN III H, N-10-203-I, 85.04.17 (backup).img`

They are byte-identical, so the archive holds one entry for them (`os-n-10-203-i-79833261`). That is correct deduplication by MD5, not a lost image. It is the only reason 114 source files map to 113 catalog entries.

## Missing images

None. All 114 `.img` files in the Frode source tree have their MD5 present in `catalog/floppies.json`.

## The four split folders

Four folders have their images assigned to more than one product. In all four the folder name is a **category name**, not a single ND product number, and the ND volume name written on each disk is a different ND part number. Reading that evidence, the split looks correct and the folder was a mixed box rather than one product set - but that reading is inferred from the volume names, not something recorded anywhere in the archive. Ronny decides.

### `Subsystem Packages` - split across 2 products

| Source file | Entry id | MD5 (first 12) | volumeName | Assigned product |
|---|---|---|---|---|
| `ND-10044R.img` | `nd-10044-r-d1-b6b58c67` | `b6b58c673014` | `ND-10044R` | ND-10044 Subsystem Package (48-bit) |
| `ND-10400A.img` | `nd-10400-a-d1-10d6c2c7` | `10d6c2c73db9` | `ND-10400A` | ND-10400 Subsystem Package II |

All 2 are `filesystem: ndfs`, none carries a `condition` block, and each is a separate physical disk (2 distinct read groups, no repeat reads).

### `Test Programs` - split across 3 products

| Source file | Entry id | MD5 (first 12) | volumeName | Assigned product |
|---|---|---|---|---|
| `ND-10324F.img` | `nd-10324-f-d1-631189ec` | `631189ec9b5e` | `ND-10324F` | ND-10324 Test programs No. 1 for ND-10, ND-12 and ND-100 |
| `ND-10325C.img` | `nd-10325-c-d1-2cb9ffb6` | `2cb9ffb6b37d` | `ND-10325C` | ND-10325 Test programs No. 2 for ND-10, ND-12 and ND-100 |
| `ND-10326C.img` | `nd-10326-c-d1-b6682207` | `b66822076141` | `ND-10326C` | ND-10326 Test programs No. 3 for ND-10, ND-12 and ND-100 |

All 3 are `filesystem: ndfs`, none carries a `condition` block, and each is a separate physical disk (3 distinct read groups, no repeat reads).

### `Unique II (5.25 inch)` - split across 3 products

| Source file | Entry id | MD5 (first 12) | volumeName | Assigned product |
|---|---|---|---|---|
| `210729C06-XX-01D.img` | `nd-210729-c06-d1-9591c485` | `9591c485d18a` | `210729C06-XX-01D` | ND-210729 UNIQUE-II SIBAS for ND-100 |
| `211005C05-NO-01D.img` | `nd-211005-c05-d1-20d14c06` | `20d14c064f56` | `211005C05-NO-01D` | ND-211005 UNIQUE Text System |
| `211245C06-XX-01D.img` | `nd-211245-c06-d1-e430d2f4` | `e430d2f4f464` | `211245C06-XX-01D` | ND-211245 UNIQUE XTRA SIBAS for ND-110 |

All 3 are `filesystem: ndfs`, none carries a `condition` block, and each is a separate physical disk (3 distinct read groups, no repeat reads).

### `VMT Terminal Tables` - split across 2 products

| Source file | Entry id | MD5 (first 12) | volumeName | Assigned product |
|---|---|---|---|---|
| `ND-10455C.img` | `nd-10455-c-d1-102aa64e` | `102aa64e024d` | `ND-10455C` | ND-10455 VTM Terminal Tables (Standard) - older number for ND-210455 |
| `ND-10459A.img` | `nd-10459-a-d1-f3c4b253` | `f3c4b2532040` | `ND-10459A` | ND-10459 VTM/VMT Terminal Table product (UNVERIFIED) |

All 2 are `filesystem: ndfs`, none carries a `condition` block, and each is a separate physical disk (2 distinct read groups, no repeat reads).

## Folders where some images are assigned and others are not

None. Every Frode entry has a product.

## Repeat reads

Applying the same grouping rule as `tools/src/lib/readgroups/index.ts` (`diskOf()`: the image file name with a trailing retry letter and any `-trackN` suffix stripped, qualified by the source folder), **no Frode source folder contains two reads of the same physical disk.** Every folder has as many read groups as it has entries. So no split or duplication in this material is explained by retries.

Two cases look like retries by file name but are not, by that rule:

- `Sintran III J Patch 11100` holds `PATCH-SIN-J-11100, 86.10.23.HKE.img` and `PATCH-SIN-J-11100, 86.10.23.HKE (2).img`, different MD5s (`b1d5cb5c21cf`, `de68282393b9`), both 6 files, both assigned to ND-211291 SINTRAN III Patch Files. Whether these are two physical disks or two reads of one disk is **unknown** - the archive does not record it and the file names alone do not settle it.
- The `-NO-` / `-XX-` pairs in the NOTIS-WP and NOTIS-DS folders (for example `10079M07-NO-01S.img` and `10079M07-XX-01S.img`) have different MD5s, different volume names (`10079M07-NO-1S` vs `10079M07-XX-1S`) and different file counts, so they are distinct disks, not retries.

## Reverse direction: products drawing on several Frode folders

Observation only. A product spanning folders can be entirely legitimate - several versions or several patch levels of the same product each got their own folder.

| Product | Source folders |
|---|---|
| KERMIT Kermit file transfer program (university port) | `NTH-Kermit`, `NTH-Ketmit (5.25 inch)` |
| ND-10142 DDPP (48-bit) | `ND-10142B (5.25 inch)`, `ND-10142B` |
| ND-10079 NOTIS-WP | `10079L00 (5.25 inch)`, `10079L01 (5.25 inch)`, `10079M05 (5.25 inch)`, `10079M07-NO`, `10079M08-NO` |
| ND-210337 Backup-System | `210337H07-EN`, `210337I04-XX`, `210337I05-XX` |
| ND-210628 SINTRAN III Utility programs | `210628F00-XX-S01 løs`, `210628F00-XX` |
| ND-210691 NOTIS-DS for ND-100 | `210691D03-NO`, `210691D04-NO` |
| ND-10174 SINTRAN III/VSE Operating system | `Sintran III Version H 85-04-17`, `Standard Satellite-9 83.01.06 ver H`, `Sintran III Version J 86-08-04`, `Sintran III Version J 86-11-26`, `Sintran III Version J 86-12-09` |
| ND-211291 SINTRAN III Patch Files | `Sintran III J Patch 11110`, `Sintran III J Patch 10300`, `Sintran III J Patch 11100`, `Sintran III K Patch 011411 (211291K12, 5.25 inch)`, `Sintran III H Patch 17`, `Sintran III H Patch 223` |

The largest two - ND-10174 SINTRAN III/VSE Operating system over 5 folders and ND-211291 SINTRAN III Patch Files over 6 folders - are folders named by version or patch number, which is consistent with one product having several releases. ND-10079 NOTIS-WP over 5 folders is the same pattern (L00, L01, M05, M07, M08 are version letters). `NTH-Kermit` and `NTH-Ketmit (5.25 inch)` are the 8-inch and 5.25-inch copies of the same material; "Ketmit" is a typo in the source folder name.

## Full per-folder table

`files` is the number of file entries the catalog records for that image (`ndfs.files`). All 113 Frode entries are `filesystem: ndfs`; none has a `condition` block, so none is recorded as damaged. Every volume name below comes from the `volumeName` field - no Frode entry falls back to `volumeLabel`.

### `10079L00 (5.25 inch)`

Source images: 3 - catalog entries: 3 - distinct physical disks: 3 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `10079L00-NO-01S.img` | `nd-10079-l00-d1-d755d0bc` | `d755d0bc3c5e` | `10079L00-NO-1` | 5 | ND-10079 NOTIS-WP |
| `10079L00-NO-02S.img` | `nd-10079-l00-d2-bce8af07` | `bce8af079200` | `10079L00-NO-2` | 3 | ND-10079 NOTIS-WP |
| `10079L00-XX-02S.img` | `nd-10079-l00-d2-d8e7cffc` | `d8e7cffc0201` | `10079L00-2` | 3 | ND-10079 NOTIS-WP |

### `10079L01 (5.25 inch)`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `10079L01-XX-01S.img` | `nd-10079-l01-d1-94431c61` | `94431c610794` | `10079L01-1` | 6 | ND-10079 NOTIS-WP |

### `10079M05 (5.25 inch)`

Source images: 3 - catalog entries: 3 - distinct physical disks: 3 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `10079M05-XX-1D.img` | `nd-10079-m05-d1-d0ec36d0` | `d0ec36d09bbd` | `10079M05-XX-1D` | 9 | ND-10079 NOTIS-WP |
| `10079M05-EN-1D.img` | `nd-10079-m05-d1-e16f390c` | `e16f390cae36` | `10079M05-EN-1D` | 11 | ND-10079 NOTIS-WP |
| `10079M05-NO-1D.img` | `nd-10079-m05-d1-f5eae5c2` | `f5eae5c20b16` | `10079M05-NO-1D` | 11 | ND-10079 NOTIS-WP |

### `10079M07-NO`

Source images: 7 - catalog entries: 7 - distinct physical disks: 7 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `10079M07-NO-01S.img` | `nd-10079-m07-d1-62caae43` | `62caae43d67b` | `10079M07-NO-1S` | 5 | ND-10079 NOTIS-WP |
| `10079M07-XX-01S.img` | `nd-10079-m07-d1-cc897a69` | `cc897a69c669` | `10079M07-XX-1S` | 5 | ND-10079 NOTIS-WP |
| `10079M07-NO-02S.img` | `nd-10079-m07-d2-1be01d4d` | `1be01d4de7bb` | `10079M07-NO-2S` | 1 | ND-10079 NOTIS-WP |
| `10079M07-XX-02S.img` | `nd-10079-m07-d2-64c4e685` | `64c4e685863f` | `10079M07-XX-2S` | 2 | ND-10079 NOTIS-WP |
| `10079M07-XX-03S.img` | `nd-10079-m07-d3-52dfb5fa` | `52dfb5fa7ec3` | `10079M07-XX-3S` | 3 | ND-10079 NOTIS-WP |
| `10079M07-NO-03S.img` | `nd-10079-m07-d3-b19a430e` | `b19a430e79c8` | `10079M07-NO-3S` | 1 | ND-10079 NOTIS-WP |
| `10079M07-NO-04S.img` | `nd-10079-m07-d4-df7fe893` | `df7fe893cf47` | `10079M07-NO-4S` | 5 | ND-10079 NOTIS-WP |

### `10079M08-NO`

Source images: 7 - catalog entries: 7 - distinct physical disks: 7 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `10079M08-NO-01S.img` | `nd-10079-m08-d1-b77fa9c2` | `b77fa9c246f2` | `10079M08-NO-1S` | 5 | ND-10079 NOTIS-WP |
| `10079M08-XX-01S.img` | `nd-10079-m08-d1-ff060602` | `ff060602701c` | `10079M08-XX-1S` | 5 | ND-10079 NOTIS-WP |
| `10079M08-XX-02S.img` | `nd-10079-m08-d2-420c29d7` | `420c29d708e0` | `10079M08-XX-2S` | 2 | ND-10079 NOTIS-WP |
| `10079M08-NO-02S.img` | `nd-10079-m08-d2-5afb6f9d` | `5afb6f9d6584` | `10079M08-NO-2S` | 1 | ND-10079 NOTIS-WP |
| `10079M08-NO-03S.img` | `nd-10079-m08-d3-737358ac` | `737358acd680` | `10079M08-NO-3S` | 1 | ND-10079 NOTIS-WP |
| `10079M08-XX-03S.img` | `nd-10079-m08-d3-b01034fd` | `b01034fd4087` | `10079M08-XX-3S` | 3 | ND-10079 NOTIS-WP |
| `10079M08-NO-04S.img` | `nd-10079-m08-d4-a34ba51c` | `a34ba51ce14e` | `10079M08-NO-4S` | 5 | ND-10079 NOTIS-WP |

### `210337H07-EN`

Source images: 3 - catalog entries: 3 - distinct physical disks: 3 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `210337H07-EN-01S.img` | `nd-210337-h07-d1-04130279` | `04130279dd38` | `210337H07-EN-01S` | 4 | ND-210337 Backup-System |
| `210337H07-EN-02S.img` | `nd-210337-h07-d2-58a3c362` | `58a3c362501b` | `210337H07-EN-02S` | 1 | ND-210337 Backup-System |
| `210337H07-EN-03S.img` | `nd-210337-h07-d3-9bc498a3` | `9bc498a3fdb7` | `210337H07-EN-03S` | 2 | ND-210337 Backup-System |

### `210337I04-XX`

Source images: 3 - catalog entries: 3 - distinct physical disks: 3 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `210337I04-XX-01S.img` | `nd-210337-i04-d1-2b3843b6` | `2b3843b6929c` | `210337I04-XX-01S` | 4 | ND-210337 Backup-System |
| `210337I04-XX-02S.img` | `nd-210337-i04-d2-b584478b` | `b584478b182e` | `210337I04-XX-02S` | 1 | ND-210337 Backup-System |
| `210337I04-XX-03S.img` | `nd-210337-i04-d3-d6749a71` | `d6749a7190f4` | `210337I04-XX-03S` | 1 | ND-210337 Backup-System |

### `210337I05-XX`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `210337I05-XX-01D.img` | `nd-210337-i05-d1-39598299` | `395982991324` | `210337I05-XX-01D` | 6 | ND-210337 Backup-System |

### `210523G02 (5.25 inch)`

Source images: 2 - catalog entries: 2 - distinct physical disks: 2 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `210523G02-XX-01D.img` | `nd-210523-g02-d1-b9f3070e` | `b9f3070eb1d3` | `210523G02-XX-01D` | 34 | ND-210523 Test programs for ND-100/110/120 |
| `210523G02-XX-02D.img` | `nd-210523-g02-d2-314b223b` | `314b223be248` | `210523G02-XX-02D` | 7 | ND-210523 Test programs for ND-100/110/120 |

### `210628F00-XX`

Source images: 2 - catalog entries: 2 - distinct physical disks: 2 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `210628F00-XX-01S.img` | `nd-210628-f00-d1-648d24de` | `648d24def781` | `210628F00-XX-01S` | 4 | ND-210628 SINTRAN III Utility programs |
| `210628F00-XX-02S.img` | `nd-210628-f00-d2-fc0a4211` | `fc0a4211417a` | `210628F00-XX-02S` | 3 | ND-210628 SINTRAN III Utility programs |

### `210628F00-XX-S01 løs`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `210628F00-XX-01S.img` | `nd-210628-f00-d1-2b67cb97` | `2b67cb970875` | `210628F00-XX-01S` | 4 | ND-210628 SINTRAN III Utility programs |

### `210691D03-NO`

Source images: 9 - catalog entries: 9 - distinct physical disks: 9 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `210691D03-NO-01S.img` | `nd-210691-d03-d1-80a3b5c8` | `80a3b5c8c573` | `210691D03-NO-01S` | 2 | ND-210691 NOTIS-DS for ND-100 |
| `210691D03-XX-01S.img` | `nd-210691-d03-d1-f6f6511f` | `f6f6511f1a43` | `210691D03-XX-01S` | 4 | ND-210691 NOTIS-DS for ND-100 |
| `210691D03-XX-02S.img` | `nd-210691-d03-d2-5bb6ff00` | `5bb6ff003ba7` | `210691D03-XX-02S` | 2 | ND-210691 NOTIS-DS for ND-100 |
| `210691D03-NO-02S.img` | `nd-210691-d03-d2-b4b08e29` | `b4b08e29297e` | `210691D03-NO-02S` | 2 | ND-210691 NOTIS-DS for ND-100 |
| `210691D03-NO-03S.img` | `nd-210691-d03-d3-419e58da` | `419e58daee82` | `210691D03-NO-03S` | 3 | ND-210691 NOTIS-DS for ND-100 |
| `210691D03-XX-03S.img` | `nd-210691-d03-d3-ff79606c` | `ff79606c7c98` | `210691D03-XX-03S` | 3 | ND-210691 NOTIS-DS for ND-100 |
| `210691D03-XX-04S.img` | `nd-210691-d03-d4-a0cc3c70` | `a0cc3c70ef88` | `210691D03-XX-04S` | 2 | ND-210691 NOTIS-DS for ND-100 |
| `210691D03-XX-05S.img` | `nd-210691-d03-d5-7ee15023` | `7ee150230ad5` | `210691D03-XX-05S` | 2 | ND-210691 NOTIS-DS for ND-100 |
| `210691D03-XX-06S.img` | `nd-210691-d03-d6-d8bc1c74` | `d8bc1c74bc7f` | `210691D03-XX-06S` | 2 | ND-210691 NOTIS-DS for ND-100 |

### `210691D04-NO`

Source images: 3 - catalog entries: 3 - distinct physical disks: 3 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `210691D04-NO-01D.img` | `nd-210691-d04-d1-6c63dc47` | `6c63dc47a88a` | `210691D04-NO-01D` | 7 | ND-210691 NOTIS-DS for ND-100 |
| `210691D04-XX-01D.img` | `nd-210691-d04-d1-73abcb7e` | `73abcb7e552e` | `210691D04-XX-01D` | 7 | ND-210691 NOTIS-DS for ND-100 |
| `210691D04-XX-02D.img` | `nd-210691-d04-d2-fd949346` | `fd9493465927` | `210691D04-XX-02D` | 8 | ND-210691 NOTIS-DS for ND-100 |

### `Fortran (5.25 inch)`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `Fortran.img` | `img-b1cf6b1be691` | `b1cf6b1be691` | `FLOPPY` | 5 | ND-10191 FORTRAN For ND-100/NORD-10 |

### `GRAFS Norsk versjon`

Source images: 5 - catalog entries: 5 - distinct physical disks: 5 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `GRAFS-2, Norsk versjon, 5-5-81.img` | `img-1c81d9f06255` | `1c81d9f06255` | `GRAFS-2` | 32 | GRAFS GRAFS |
| `GRAFS-3, Norsk versjon, 5-5-81.img` | `img-a2c9f0faa70a` | `a2c9f0faa70a` | `GRAFS-3` | 3 | GRAFS GRAFS |
| `GRAFS-1, Norsk versjon, 5-5-81.img` | `img-b154be0f7b24` | `b154be0f7b24` | `GRAFS-1` | 9 | GRAFS GRAFS |
| `GRAFS-4, Norsk versjon, 5-5-81.img` | `img-f36c4e59b776` | `f36c4e59b776` | `GRAFS-4` | 2 | GRAFS GRAFS |
| `GRAFS-5, Norsk versjon, 5-5-81.img` | `img-fd990abb1746` | `fd990abb1746` | `GRAFS-5` | 2 | GRAFS GRAFS |

### `ND-10022T`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `ND-10022T.img` | `nd-10022-t-d1-78a2647e` | `78a2647e91ef` | `ND-10022T` | 10 | ND-10022 SINTRAN Utility Programs |

### `ND-10142B`

Source images: 6 - catalog entries: 6 - distinct physical disks: 6 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `ND-10142B-PART1.img` | `nd-10142-b-d1-64358e7b` | `64358e7bd16c` | `ND-10142B-PART1` | 12 | ND-10142 DDPP (48-bit) |
| `ND-10142B-PART2.img` | `nd-10142-b-d2-174048ee` | `174048ee0af5` | `ND-10142B-PART2` | 7 | ND-10142 DDPP (48-bit) |
| `ND-10142B-PART3.img` | `nd-10142-b-d3-8d3eabae` | `8d3eabae040b` | `ND-10142B-PART3` | 12 | ND-10142 DDPP (48-bit) |
| `ND-10142B-PART4.img` | `nd-10142-b-d4-d2fbf7e8` | `d2fbf7e839b5` | `ND-10142B-PART4` | 8 | ND-10142 DDPP (48-bit) |
| `ND-10142B-PART5.img` | `nd-10142-b-d5-91de1e9b` | `91de1e9bacb1` | `ND-10142B-PART5` | 19 | ND-10142 DDPP (48-bit) |
| `ND-10142B-PART6.img` | `nd-10142-b-d6-1ff63420` | `1ff63420cb8f` | `ND-10142B-PART6` | 7 | ND-10142 DDPP (48-bit) |

### `ND-10142B (5.25 inch)`

Source images: 7 - catalog entries: 7 - distinct physical disks: 7 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `ND-10142B-PATCH.img` | `img-cc455546e6b3` | `cc455546e6b3` | `ND-10142B-PATCH1` | 2 | ND-10142 DDPP (48-bit) |
| `ND-10142B-PART1.img` | `nd-10142-b-d1-697dc8bb` | `697dc8bb5611` | `ND-10142B-PART1` | 12 | ND-10142 DDPP (48-bit) |
| `ND-10142B-PART2.img` | `nd-10142-b-d2-911be913` | `911be91372bb` | `ND-10142B-PART2` | 7 | ND-10142 DDPP (48-bit) |
| `ND-10142B-PART3.img` | `nd-10142-b-d3-f8fc222e` | `f8fc222e250d` | `ND-10142B-PART3` | 12 | ND-10142 DDPP (48-bit) |
| `ND-10142B-PART4.img` | `nd-10142-b-d4-68b2aaa1` | `68b2aaa1b836` | `ND-10142B-PART4` | 8 | ND-10142 DDPP (48-bit) |
| `ND-10142B-PART5.img` | `nd-10142-b-d5-3c3efc1f` | `3c3efc1fa727` | `ND-10142B-PART5` | 19 | ND-10142 DDPP (48-bit) |
| `ND-10142B-PART6.img` | `nd-10142-b-d6-995b9407` | `995b94075d70` | `ND-10142B-PART6` | 7 | ND-10142 DDPP (48-bit) |

### `ND-10315D`

Source images: 3 - catalog entries: 3 - distinct physical disks: 3 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `ND-10315D-PART1.img` | `nd-10315-d-d1-9111dff9` | `9111dff9d1c9` | `ND-10315D-PART1` | 2 | ND-10315 SINTRAN III Accounting System |
| `ND-10315D-PART2.img` | `nd-10315-d-d2-e8584b9d` | `e8584b9d2332` | `ND-10315D-PART2` | 1 | ND-10315 SINTRAN III Accounting System |
| `ND-10315D-PART3.img` | `nd-10315-d-d3-e9c99728` | `e9c997280a5f` | `ND-10315D-PART3` | 1 | ND-10315 SINTRAN III Accounting System |

### `ND-10336C`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `ND-10336C.img` | `nd-10336-c-d1-e4b6cac6` | `e4b6cac60e4c` | `ND-10336C` | 1 | ND-10336 ND-100 Symbolic Debugger (48-bit) |

### `ND-10337C`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `ND-10337C.img` | `nd-10337-c-d1-ce55a023` | `ce55a023547e` | `ND-10337C` | 1 | ND-10337 Backup-System |

### `NTH-Kermit`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `NTH-Kermit.img` | `img-101f51540b0a` | `101f51540b0a` | `FLOPPY` | 4 | KERMIT Kermit file transfer program (university port) |

### `NTH-Ketmit (5.25 inch)`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `NORA-UIO F-U, Kermit.img` | `img-86791f282d6b` | `86791f282d6b` | `NORA-UIO` | 4 | KERMIT Kermit file transfer program (university port) |

### `RDIR`

Source images: 4 - catalog entries: 4 - distinct physical disks: 4 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `RDIR Nr1.img` | `img-00fef8df45e2` | `00fef8df45e2` | `RDIR` | 3 | ND-10152 NOTIS-IR |
| `RDIR Nr2.img` | `img-53a4d08df9af` | `53a4d08df9af` | `RDIR` | 4 | ND-10152 NOTIS-IR |
| `RDIR Nr4.img` | `img-6d200001bc4c` | `6d200001bc4c` | `RDIR` | 1 | ND-10152 NOTIS-IR |
| `RDIR Nr3.img` | `img-aa3e2e05cbf9` | `aa3e2e05cbf9` | `RDIR` | 3 | ND-10152 NOTIS-IR |

### `Sintran III H Patch 17`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `Patchfile-17.img` | `patch-patch-sintran-20de65a7` | `20de65a73ec0` | `PATCH-SINTRAN` | 8 | ND-211291 SINTRAN III Patch Files |

### `Sintran III H Patch 223`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `SINTRAN III H Patchfile 223 (backup).img` | `patch-patch-sintran-b4c16a60` | `b4c16a6064c8` | `PATCH-SINTRAN` | 7 | ND-211291 SINTRAN III Patch Files |

### `Sintran III J Patch 10300`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `PATCH-SIN-J-10300, 86.05.14.img` | `patch-nd-patch-sin-j-43b01e04` | `43b01e040523` | `ND-PATCH-SIN-J` | 6 | ND-211291 SINTRAN III Patch Files |

### `Sintran III J Patch 11100`

Source images: 2 - catalog entries: 2 - distinct physical disks: 2 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `PATCH-SIN-J-11100, 86.10.23.HKE.img` | `patch-nd-patch-sin-j-b1d5cb5c` | `b1d5cb5c21cf` | `ND-PATCH-SIN-J` | 6 | ND-211291 SINTRAN III Patch Files |
| `PATCH-SIN-J-11100, 86.10.23.HKE (2).img` | `patch-nd-patch-sin-j-de682823` | `de68282393b9` | `ND-PATCH-SIN-J` | 6 | ND-211291 SINTRAN III Patch Files |

### `Sintran III J Patch 11110`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `PATCH-SIN-J-11110, 87.08.13.img` | `patch-nd-patch-sin-j-02c1a288` | `02c1a288c022` | `ND-PATCH-SIN-J` | 6 | ND-211291 SINTRAN III Patch Files |

### `Sintran III K Patch 011411 (211291K12, 5.25 inch)`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `211291K12-XX-01D.img` | `patch-nd-patch-sin-k-33a02cb7` | `33a02cb7dc37` | `ND-PATCH-SIN-K` | 6 | ND-211291 SINTRAN III Patch Files |

### `Sintran III Version H 85-04-17`

Source images: 3 - catalog entries: 2 - distinct physical disks: 2 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `SINTRAN III H, N-10-203-I, 85.04.17 (backup).img` | `os-n-10-203-i-79833261` | `798332612022` | `N-10-203-I` | 2 | ND-10174 SINTRAN III/VSE Operating system |
| `SINTRAN III H, N-10-203-III, 85.04.17 (backup).img` | `os-n-10-203-i-85270dce` | `85270dce1dbd` | `N-10-203-III` | 9 | ND-10174 SINTRAN III/VSE Operating system |

### `Sintran III Version J 86-08-04`

Source images: 4 - catalog entries: 4 - distinct physical disks: 4 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `N-900-188-I.img` | `os-n-900-188-i-0e6ba1a2` | `0e6ba1a295eb` | `N-900-188-I` | 2 | ND-10174 SINTRAN III/VSE Operating system |
| `N-900-188-III.img` | `os-n-900-188-i-35e9b435` | `35e9b435cf36` | `N-900-188-III` | 7 | ND-10174 SINTRAN III/VSE Operating system |
| `N-900-188-IV.img` | `os-n-900-188-i-4b33e5a0` | `4b33e5a0db17` | `N-900-188-IV` | 3 | ND-10174 SINTRAN III/VSE Operating system |
| `N-900-188-II.img` | `os-n-900-188-i-658d00ba` | `658d00ba4552` | `N-900-188-II` | 1 | ND-10174 SINTRAN III/VSE Operating system |

### `Sintran III Version J 86-11-26`

Source images: 4 - catalog entries: 4 - distinct physical disks: 4 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `N-900-188-IV.img` | `os-n-900-188-i-2269d6ac` | `2269d6ac60d7` | `N-900-188-IV` | 3 | ND-10174 SINTRAN III/VSE Operating system |
| `N-900-188-III.img` | `os-n-900-188-i-a3bc360b` | `a3bc360bf3ab` | `N-900-188-III` | 7 | ND-10174 SINTRAN III/VSE Operating system |
| `N-900-188-I.img` | `os-n-900-188-i-ac337cef` | `ac337cefca36` | `N-900-188-I` | 2 | ND-10174 SINTRAN III/VSE Operating system |
| `N-900-188-II.img` | `os-n-900-188-i-b36c84c8` | `b36c84c8e1d5` | `N-900-188-II` | 1 | ND-10174 SINTRAN III/VSE Operating system |

### `Sintran III Version J 86-12-09`

Source images: 4 - catalog entries: 4 - distinct physical disks: 4 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `N-900-188-II.img` | `os-n-900-188-i-2277dda2` | `2277dda25ccc` | `N-900-188-II` | 1 | ND-10174 SINTRAN III/VSE Operating system |
| `N-900-188-IV.img` | `os-n-900-188-i-41603789` | `41603789633b` | `N-900-188-IV` | 3 | ND-10174 SINTRAN III/VSE Operating system |
| `N-900-188-III.img` | `os-n-900-188-i-7c3244d8` | `7c3244d83f6b` | `N-900-188-III` | 7 | ND-10174 SINTRAN III/VSE Operating system |
| `N-900-188-I.img` | `os-n-900-188-i-aef8d67e` | `aef8d67eb0d4` | `N-900-188-I` | 2 | ND-10174 SINTRAN III/VSE Operating system |

### `Standard Satellite-9 83.01.06 ver H`

Source images: 3 - catalog entries: 3 - distinct physical disks: 3 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `COSMOS Version Diskette 3.img` | `os-n-900-000-i-2e4e34e0` | `2e4e34e09016` | `N-900-000-III` | 9 | ND-10174 SINTRAN III/VSE Operating system |
| `COSMOS Version Diskette 2.img` | `os-n-900-000-i-b8451475` | `b84514757360` | `N-900-000-II` | 1 | ND-10174 SINTRAN III/VSE Operating system |
| `COSMOS Version Diskette 1.img` | `os-n-900-000-i-ee0ac9c7` | `ee0ac9c73064` | `N-900-000-I` | 2 | ND-10174 SINTRAN III/VSE Operating system |

### `Subsystem Packages`

Source images: 2 - catalog entries: 2 - distinct physical disks: 2 - **verdict: SPLIT across 2 products**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `ND-10044R.img` | `nd-10044-r-d1-b6b58c67` | `b6b58c673014` | `ND-10044R` | 8 | ND-10044 Subsystem Package (48-bit) |
| `ND-10400A.img` | `nd-10400-a-d1-10d6c2c7` | `10d6c2c73db9` | `ND-10400A` | 6 | ND-10400 Subsystem Package II |

### `Test Programs`

Source images: 3 - catalog entries: 3 - distinct physical disks: 3 - **verdict: SPLIT across 3 products**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `ND-10324F.img` | `nd-10324-f-d1-631189ec` | `631189ec9b5e` | `ND-10324F` | 15 | ND-10324 Test programs No. 1 for ND-10, ND-12 and ND-100 |
| `ND-10325C.img` | `nd-10325-c-d1-2cb9ffb6` | `2cb9ffb6b37d` | `ND-10325C` | 25 | ND-10325 Test programs No. 2 for ND-10, ND-12 and ND-100 |
| `ND-10326C.img` | `nd-10326-c-d1-b6682207` | `b66822076141` | `ND-10326C` | 17 | ND-10326 Test programs No. 3 for ND-10, ND-12 and ND-100 |

### `Unique II (5.25 inch)`

Source images: 3 - catalog entries: 3 - distinct physical disks: 3 - **verdict: SPLIT across 3 products**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `210729C06-XX-01D.img` | `nd-210729-c06-d1-9591c485` | `9591c485d18a` | `210729C06-XX-01D` | 12 | ND-210729 UNIQUE-II SIBAS for ND-100 |
| `211005C05-NO-01D.img` | `nd-211005-c05-d1-20d14c06` | `20d14c064f56` | `211005C05-NO-01D` | 45 | ND-211005 UNIQUE Text System |
| `211245C06-XX-01D.img` | `nd-211245-c06-d1-e430d2f4` | `e430d2f4f464` | `211245C06-XX-01D` | 11 | ND-211245 UNIQUE XTRA SIBAS for ND-110 |

### `Unique On Line II (5.25 inch)`

Source images: 1 - catalog entries: 1 - distinct physical disks: 1 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `Unique On Line II.img` | `img-6d8d16eac40d` | `6d8d16eac40d` | `UNIQUE` | 14 | ND-210731 UNIQUE-II ISAM for ND-100 |

### `Unique Start (5.25 inch)`

Source images: 2 - catalog entries: 2 - distinct physical disks: 2 - **verdict: CONSISTENT (one product)**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `Unique START part 1.img` | `img-20a30b63e1dc` | `20a30b63e1dc` | `UNIQUE` | 9 | ND-211249 UNIQUE START SIBAS for ND-500/5000 |
| `Unique START part 2.img` | `img-af1c6cb25946` | `af1c6cb25946` | `UNIQUE` | 7 | ND-211249 UNIQUE START SIBAS for ND-500/5000 |

### `VMT Terminal Tables`

Source images: 2 - catalog entries: 2 - distinct physical disks: 2 - **verdict: SPLIT across 2 products**

| Source file | Entry id | MD5 (first 12) | volumeName | files | Product |
|---|---|---|---|---|---|
| `ND-10455C.img` | `nd-10455-c-d1-102aa64e` | `102aa64e024d` | `ND-10455C` | 18 | ND-10455 VTM Terminal Tables (Standard) - older number for ND-210455 |
| `ND-10459A.img` | `nd-10459-a-d1-f3c4b253` | `f3c4b2532040` | `ND-10459A` | 6 | ND-10459 VTM/VMT Terminal Table product (UNVERIFIED) |

## What could not be verified

- Whether a source folder was physically one box of floppies is not recorded anywhere in the repo. The verdicts above measure only whether the archive assigned one product per folder; they cannot prove a folder *should* have been one product.
- Whether `PATCH-SIN-J-11100, 86.10.23.HKE.img` and its `(2)` twin are two disks or two reads of one disk. Unknown.
- The product ND-10459 is named "VTM/VMT Terminal Table product (UNVERIFIED)" in `products/ND-10459.yaml`; that uncertainty is the product record's own, and this analysis did not investigate it.
- 23 further entries carry `provenance.contributor: fvdm` but no MD5 match anywhere in the Frode source tree, in provenance folders `Disk Images` (14), `Windows 2.10` (5), `Desk Top Manager For OWS` (2), `ND Keyboard Drivers for DOS & VKM` (1) and `ON-Word Win. 1.0` (1). Those folder names do not exist in the tree that was scanned, so they came from some other Frode-contributed source that is not present on this machine. They are outside the scope of this report.
