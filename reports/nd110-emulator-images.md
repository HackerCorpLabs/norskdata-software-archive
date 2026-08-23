# ND-110 emulator (IMAGES) folder — analysis

Read-only analysis of the 36 `*.IMAG` files in the ND-110 emulator (IMAGES) folder,
part of an ND-110 emulator distribution dated 02-07-2021. Contributor would be
"cvs" (Carl-Victor).

Nothing was imported, copied, renamed or modified. No file under `images/`,
`products/`, `catalog/` or `collections/` was written.

## How the facts below were produced

- **MD5 and archive membership** — `tools/scripts/scan-external.mjs` run with
  `--ext IMAG`. The script defaults to `.img`/`.image`, but `--ext` is a
  supported option, so the `.IMAG` files were hashed in place without renaming
  anything. It compares against the `md5` (and `variants[].md5`) of every entry
  in `catalog/floppies.json`: 1066 hashes across 1066 entries.
- **Filesystem, volume name, boot format, users, file listing** — the repo's own
  detectors: `tools/src/api/filesystem-detect.ts` (`detectFilesystem`),
  `tools/src/lib/ndfsalign/` (`pageAlign`) and the bundled NDFS parser in
  `externals/norskdata-ndfs/ndfs-ts`. The `identify` CLI subcommand
  (`tools/src/api/identify.ts`) was also run per file and agrees. The CLI's
  folder walk was not usable directly: `IMAGE_EXTENSIONS` in
  `tools/src/api/identify.ts` does not include `.IMAG`, so it reported "No disk
  images found"; each file was passed individually instead.
- **Implied product number** — `matchProduct()` from
  `tools/src/api/product-matcher.ts`, applied to both the NDFS volume name and
  the bare file name, so the result is what the importer itself would derive.
  `tools/src/api/name-parser.ts` was read as well; its patterns are the same
  family. Product existence was checked by reading the `id:` field of every
  `products/*.yaml`.

## (a) Summary counts

| Count | Meaning |
|---:|---|
| 36 | `*.IMAG` files in the folder |
| 36 | parse as NDFS — `filesystem: ndfs` |
| 0 | DOS, tar, BACKUP-SYSTEM, WINCH-TO-FLOPP or `none` |
| 0 | unreadable / damaged (no NDFS parse failure, no `condition: damaged` case) |
| 12 | already in the archive by exact MD5 |
| 24 | not in the archive by exact MD5 |
| 2 | of those 24 are a **byte-identical prefix** of an image already held |
| **22** | **genuinely new content** |

Distinct images: the 36 files carry 34 distinct MD5s — `FF210523-01d.IMAG`,
`TP100-210523-01.IMAG` and `TPND.IMAG` are three copies of one and the same
byte sequence.

Sizes seen: 1,261,568 bytes (616 pages of 2048) on 33 files, 315,392 bytes
(154 pages) on 3 files, and 1,260,544 bytes on `NDCSTOOLS900525.IMAG` — that
one is 1024 bytes short of a whole page, the exact case `lib/ndfsalign/` exists
to handle, and it parsed after padding.

Boot format: `flomon` on 6 files, `binary` on 1 (`NDCSTOOLS900525.IMAG`),
`none` on the remaining 29.

Every implied product number already has a `products/*.yaml`. **No new product
file is required for any of these images.** Three volumes imply no ND product
number at all (`OSM`, `CS-TOOLS`, `S12`).

## (b) The 24 not held by MD5

`Prefix?` marks the two files whose bytes are already preserved inside a longer
archive image (see section (d)).

| File | Bytes | FS | Volume name | Boot | Files/Users | Implied product | Product exists | Name = volume | Prefix? |
|---|---:|---|---|---|---|---|---|---|---|
| 10724B03-XX-02D.IMAG | 1261568 | ndfs | 10724B03-XX-02D | none | 11 / 1 | ND-10724 NOTIS-BG for ND-100 (Business Graphics) 48 bits floating format | yes | yes | |
| 10724B03-XX-03D.IMAG | 1261568 | ndfs | 10724B03-XX-03D | none | 4 / 1 | ND-10724 NOTIS-BG for ND-100 (Business Graphics) 48 bits floating format | yes | yes | |
| 10724B04-EN-01D.IMAG | 1261568 | ndfs | 10724B04-EN-01D | none | 10 / 1 | ND-10724 NOTIS-BG for ND-100 (Business Graphics) 48 bits floating format | yes | yes | |
| 210079N07-EN-01D.IMAG | 1261568 | ndfs | 210079N07-EN-01D | none | 11 / 1 | ND-210079 NOTIS-WP for ND-100 | yes | yes | |
| 210079N07-EN-02D.IMAG | 1261568 | ndfs | 210079N07-EN-02D | none | 2 / 1 | ND-210079 NOTIS-WP for ND-100 | yes | yes | |
| 210079N07-XX-01D.IMAG | 1261568 | ndfs | 210079N07-XX-01D | none | 9 / 1 | ND-210079 NOTIS-WP for ND-100 | yes | yes | |
| 210079N07-XX-02D.IMAG | 1261568 | ndfs | 210079N07-XX-02D | none | 5 / 1 | ND-210079 NOTIS-WP for ND-100 | yes | yes | |
| 210373L03-XX-01D.IMAG | 1261568 | ndfs | 210373L03-XX-01D | none | 20 / 1 | ND-210373 X-Message (XMSG) | yes | yes | **prefix** |
| 210507B01-XX-01S.IMAG | 315392 | ndfs | 210507B01-XX-01S | none | 3 / 1 (SYSTEM) | ND-210507 Software Keys | yes | yes | |
| 210518C02-EN-01D.IMAG | 1261568 | ndfs | 210518C02-EN-01D | none | 16 / 1 | ND-210518 User-Environment | yes | yes | |
| 210518C02-XX-02D.IMAG | 1261568 | ndfs | 210518C02-XX-02D | none | 12 / 1 | ND-210518 User-Environment | yes | yes | |
| 210913A00-XX-01D.IMAG | 1261568 | ndfs | 210913A00-XX-01D | none | 4 / 1 | ND-210913 SINTRAN III Monitor Call Package | yes | yes | **prefix** |
| 211005C04-EN-01D.IMAG | 1261568 | ndfs | 211005C04-EN-01D | none | 45 / 1 | ND-211005 UNIQUE Text System | yes | yes | |
| 211056A02-EN-01D.IMAG | 1261568 | ndfs | 211056A02-EN-01D | none | 5 / 1 | ND-211056 SPRINT Spooling system | yes | yes | |
| 211056A02-XX-01D.IMAG | 1261568 | ndfs | 211056A02-XX-01D | none | 7 / 1 | ND-211056 SPRINT Spooling system | yes | yes | |
| 211056A02-XX-02D.IMAG | 1261568 | ndfs | 211056A02-XX-02D | none | 6 / 1 | ND-211056 SPRINT Spooling system | yes | yes | |
| COB-210177K01-D.IMAG | 1261568 | ndfs | 210177K01-XX-01D | none | 12 / 1 | ND-210177 COBOL-85 for ND-500/5000 | yes | no | |
| ND-10005U.IMAG | 315392 | ndfs | ND-10005U | flomon | 8 / 1 | ND-10005 Subsystem Package (32-bit) | yes | yes | |
| ND-10076J.IMAG | 1261568 | ndfs | ND-10076J | none | 4 / 1 | ND-10076 Pascal (48-bit) | yes | yes | |
| ND-10133J.IMAG | 1261568 | ndfs | ND-10133J | none | 4 / 1 | ND-10133 Pascal (32-bit) | yes | yes | |
| ND211004A01-01D.IMAG | 1261568 | ndfs | 211004A01-NO-01D | none | 2 / 1 | ND-211004 NOTIS-ENCRYPT for ND-100 | yes | no | |
| NDCSTOOLS900525.IMAG | 1260544 | ndfs | CS-TOOLS | binary | 1 / 1 | none — volume name is not an ND part number | n/a | no | |
| PC-LINK-10561A.IMAG | 1261568 | ndfs | ND-10561A | none | 5 / 1 | ND-10561 PC-LINK | yes | no | |
| S12-19851220.IMAG | 1261568 | ndfs | S12 | none | 11 / 1 (SYSTEM) | none — volume name is not an ND part number | n/a | no | |

MD5 of each, in the same order:

```
bce578118a06c8ee7d200d139cd616d4  10724B03-XX-02D.IMAG
d9e0b34c58a454f3a59d98604dfd4390  10724B03-XX-03D.IMAG
37f576820d5f4f1c3f18fc6c70656770  10724B04-EN-01D.IMAG
f867eb2b96ee4a038aa242b760375568  210079N07-EN-01D.IMAG
7f6ecba58f7a8be54d3ffb5b3ef85efa  210079N07-EN-02D.IMAG
64c99e2979af5aa074cfae82dfa74927  210079N07-XX-01D.IMAG
189a3326f21ac82b92a1cb67258a45a5  210079N07-XX-02D.IMAG
cf8bdf212504e924fdec22fb17436de5  210373L03-XX-01D.IMAG
eced8bb83d39464002b43b26a41845b7  210507B01-XX-01S.IMAG
c339bde88a55217fd71d5cf62e744eb5  210518C02-EN-01D.IMAG
a4ee8563f54800d37923bd9e2933e19d  210518C02-XX-02D.IMAG
ee9a9b4fca692a18e9de5b7b1be9a3ff  210913A00-XX-01D.IMAG
b28dde0a425175b48c87cf207cb5c295  211005C04-EN-01D.IMAG
fd6710baf32609bb6d3eca254326536f  211056A02-EN-01D.IMAG
61af1cc929a00385a05390966eec5c6e  211056A02-XX-01D.IMAG
d0592d495c6cfeae335404d0d358ea6e  211056A02-XX-02D.IMAG
fa18a911abf47789f61c65075661f566  COB-210177K01-D.IMAG
443fa6d40243280f4b73d658bb1493c1  ND-10005U.IMAG
3172a8b9bf2780bd3ce3b7a5676e2952  ND-10076J.IMAG
35ece9b0d6755bdce61f641c1b80c6d2  ND-10133J.IMAG
215e1892756481efe87945febe882f5c  ND211004A01-01D.IMAG
1e3786e161a4edb2684c458e39ae8548  NDCSTOOLS900525.IMAG
4f3e1ab4fd4609982f89a1912ac77967  PC-LINK-10561A.IMAG
69a99dc7586021d8342ef008dadcc76b  S12-19851220.IMAG
```

### The three volumes with no ND part number

- `NDCSTOOLS900525.IMAG` — volume `CS-TOOLS`, one file: `CHEDIR:PROG`. Boot
  format `binary`. The `900525` in the file name is a date (1990-05-25),
  inferred from its form, not read from the media.
- `S12-19851220.IMAG` — volume `S12`, user `SYSTEM`, 11 files:
  `PERFORM-G00:PROG`, `PERFORM-LIB-G00:MCRO`, `PERF-500-LIB-G00:MCRO`,
  `UE-ERMSG-EN-B02:OLD`, `UE-ERMSG-ENG-A03:ERR`, `UE-ERMSG-NOR-A00:ERR`,
  `UE-ERMSG-EN-B03:ERR`, `UE-ERMSG-NO-B02:ERR`, `FILE-MAN-PRI-B00:PROG`,
  `FILE-MAN-NO-B00:PROG`, `UE-LOAD-NO:MODE`. A mixed service floppy: PERFORM
  plus User-Environment error-message files. Which product it belongs to is
  unknown from the media alone.
- `ND-GAMES.IMAG` — volume `OSM` — is already held, see section (c).

## (c) The 12 already held, by exact MD5

| File | MD5 | Existing archive entry | Entry product | Volume name |
|---|---|---|---|---|
| 210375C00-XX-01D.IMAG | 7ecdace16ce91b7b88d4d8e5b74a5483 | `nd-210375-c00-d1-7ecdace1` | ND-210375 Telefix for User Sites | 210375C00-XX-01D |
| 210455G02-XX-01D.IMAG | bbe7c22adb602a08ebfe2f334cd588e8 | `nd-210455-g02-d1-bbe7c22a` | ND-210455 VTM terminal tables (Standard) | 210455G02-XX-01D |
| 210518C01-NO-01S.IMAG | 7b702305be59d587abf07941b313e367 | `nd-210518-c01-d1-7b702305` | ND-210518 User-Environment | 210518C01-NO-01S |
| 211024C01-XX-01D.IMAG | 16cba2c64ed5eb44812c587eec65694d | `nd-211024-c01-d1-16cba2c6` | ND-211024 SINTRAN III Configuration Program | 211024C01-XX-01D |
| 211068A00-EN-01D.IMAG | eef71cbf9ce82d2562857b1126e2990b | `nd-211068-a00-d1-eef71cbf` | ND-211068 Operator Environment | 211068A00-EN-01D |
| 211068A00-EN-02D.IMAG | 63860f9ed0da1cbef9cd80edb060d537 | `nd-211068-a00-d2-63860f9e` | ND-211068 Operator Environment | 211068A00-EN-02D |
| F210523G02-01D.IMAG | 25c60c575c01e3e700e47a611925a34a | `nd-210523-g02-d1-25c60c57` | ND-210523 Test programs for ND-100/110/120 | 210523G02-XX-01D |
| F210523G02-02D.IMAG | 9d62fc96d6337cd17366813beed88102 | `nd-210523-g02-d2-9d62fc96` | ND-210523 Test programs for ND-100/110/120 | 210523G02-XX-02D |
| FF210523-01d.IMAG | a32d604a0f7a37c40879cfa1cc49827d | `nd-210523-e00-d1-a32d604a` | ND-210523 Test programs for ND-100/110/120 | 210523E00-XX-01D |
| TP100-210523-01.IMAG | a32d604a0f7a37c40879cfa1cc49827d | `nd-210523-e00-d1-a32d604a` | ND-210523 Test programs for ND-100/110/120 | 210523E00-XX-01D |
| TPND.IMAG | a32d604a0f7a37c40879cfa1cc49827d | `nd-210523-e00-d1-a32d604a` | ND-210523 Test programs for ND-100/110/120 | 210523E00-XX-01D |
| ND-GAMES.IMAG | c617dfb8c9b275fc4d50f0e0038143f7 | `img-c617dfb8c9b2` | **unassigned** (productId null) | OSM |

`ND-GAMES.IMAG` is held but its catalog entry has no product assigned. Volume
`OSM`, three users (`FLOPPY-USER`, `SYSTEM`, `GAMES`), 40 files including
`DIGGER-48-NO:PROG`, `FIDO-48-NO:PROG`, `MACMAN-48-NO:PROG`,
`TERRANOVA-48-NO:PROG`, `TRON-48-NO:PROG`, `MASTERMIND-48-NO:PROG`,
`YATZY:PROG`, `BACKGAMMON:PROG`, `LABYRINT:PROG`, `CASTLE:PROG`,
`BREAKOUT:PROG`. The volume name carries no ND part number, so
`matchProduct()` returns null and the entry stays unassigned. Nothing to import
here; only the assignment is open, and that is Ronny's call.

## (d) Near-duplicates and repeated content

### 1. Three files, one byte sequence

`FF210523-01d.IMAG`, `TP100-210523-01.IMAG` and `TPND.IMAG` all hash to
`a32d604a0f7a37c40879cfa1cc49827d`. Byte-identical, not merely similar. All
three are volume `210523E00-XX-01D`, 21 files, boot `flomon`, and all three are
already held as `nd-210523-e00-d1-a32d604a`.

### 2. Two files are a byte-prefix of an image already held

Every image in `catalog/floppies.json` was decompressed and the MD5 of its
first 1,261,568 and first 315,392 bytes computed, then compared with the 24
"new" hashes. Exactly two matched:

- `210373L03-XX-01D.IMAG` (1,261,568 bytes) is byte-for-byte identical to the
  first 1,261,568 bytes of archive entry `nd-210373-l03-d1-75382260`
  (1,310,720 bytes). Zero differing bytes over the whole overlap. Same 20
  files.
- `210913A00-XX-01D.IMAG` (1,261,568 bytes) is byte-for-byte identical to the
  first 1,261,568 bytes of archive entry `nd-210913-a00-d1-dff64661`
  (1,310,720 bytes). Zero differing bytes over the whole overlap. Same 4 files.

1,261,568 bytes is 616 pages of 2048; 1,310,720 is 640 pages. The archive
already holds the longer read of both disks, so these two carry no content the
archive lacks. Their MD5s differ only because the files are shorter.

The other 22 matched no archive image at either prefix length.

### 3. Same volume name, different bytes — ND-210177 COBOL-85

`COB-210177K01-D.IMAG` (volume `210177K01-XX-01D`, 1,261,568 bytes) and archive
entry `nd-210177-k01-d1-6a774ca2` (1,310,720 bytes) are **not** in a prefix
relation. What was measured:

- The 12 directory entries are identical in every field compared — object name,
  type, `pagesInFile`, `bytesInFile` and `dateCreated`. Example:
  `COBOL-85-K01:PSEG pages=130 bytes=265213 created=2627907993` on both.
- The raw bytes differ from offset 0x0: page 0 of the `.IMAG` is filled with
  0x40 bytes, page 0 of the archive image with 0xF6 bytes.
- 1,131,968 of the 1,261,568 overlapping bytes differ.
- Comparing 2048-byte pages by hash: of the 616 pages in the `.IMAG`, 10 sit at
  the same page index in the archive image, 495 appear in it at a *different*
  page index, and 111 do not appear in it at all. The commonest displacement is
  −4 pages (284 pages), then +71 (119 pages), then −125 (56 pages) — no single
  constant shift.

So the two hold the same 12 files with the same sizes and timestamps but a
different physical page layout and different fill bytes. Why the layouts differ
is **unknown** from the bytes alone; two candidates that would need testing are
a different read tool writing sectors in a different order, and two separately
written copies of the same master. Importing `COB-210177K01-D.IMAG` would add a
second read of a disk whose files are already preserved.

### 4. Same file names, different content — the two Pascal floppies

`ND-10076J.IMAG` and `ND-10133J.IMAG` list exactly the same four names —
`PASCAL-COD-J:BRF`, `PASCAL-LIB-J:BRF`, `PASCAL-2LIB-J:BRF`,
`PASCAL-ERR-J:SYMB` — but different volume names (`ND-10076J` vs `ND-10133J`)
and 298,564 differing bytes, first at offset 0x7E5. These are **not** two reads
of one disk: `ND-10076` is Pascal (48-bit) and `ND-10133` is Pascal (32-bit).
Both are genuinely new.

### 5. Language-variant pairs — not duplicates

Several `-EN-` / `-XX-` / `-NO-` pairs of the same product and version are
present. They are separate floppies, not repeated reads, and each has its own
volume name:

- `210079N07-EN-01D` (11 files) vs `210079N07-XX-01D` (9 files): first differing
  byte at 0x7EA, 1,001,918 differing bytes.
- `211056A02-EN-01D` (5 files) vs `211056A02-XX-01D` (7 files): differ from
  offset 0x0, 996,730 differing bytes.
- `210518C01-NO-01S` (3 files, 315,392 bytes) vs `210518C02-EN-01D` (16 files):
  different version as well as language.

Across all 34 distinct images, no pair with different MD5s shares a file listing
at 50% or better except the ND-10076J / ND-10133J pair in item 4 and two
incidental low-count overlaps (`210079N07-EN-02D` vs `211056A02-EN-01D`, one
shared name; `210518C01-NO-01S` vs `210518C02-EN-01D`, two shared names).

## Volume name vs file name

For 27 of the 36 files the file name equals the NDFS volume name exactly. The
nine that disagree, with the volume name read from the bytes:

| File name | Volume name in the bytes | Comment |
|---|---|---|
| COB-210177K01-D.IMAG | 210177K01-XX-01D | `COB-` prefix added by whoever named the file; `matchProduct()` returns null on the file name, ND-210177 on the volume name |
| F210523G02-01D.IMAG | 210523G02-XX-01D | `F` prefix; language field `XX` dropped from the file name |
| F210523G02-02D.IMAG | 210523G02-XX-02D | as above |
| FF210523-01d.IMAG | 210523E00-XX-01D | file name omits the version `E00` entirely |
| TP100-210523-01.IMAG | 210523E00-XX-01D | same bytes as `FF210523-01d.IMAG` |
| TPND.IMAG | 210523E00-XX-01D | same bytes as `FF210523-01d.IMAG` |
| ND-GAMES.IMAG | OSM | descriptive file name; the volume is `OSM` |
| ND211004A01-01D.IMAG | 211004A01-NO-01D | file name drops the `NO` language field |
| NDCSTOOLS900525.IMAG | CS-TOOLS | descriptive file name plus a date |
| PC-LINK-10561A.IMAG | ND-10561A | descriptive prefix; volume is the plain ND part number |
| S12-19851220.IMAG | S12 | file name adds a date |

In every disagreeing case the volume name is the trustworthy one: it was read
from the media, the file name was typed by a person. The importer would reach
the same conclusion, because `classifyForQueue()` in `tools/src/server.ts`
matches on `volumeName ?? volumeLabel`, never on the file name.

No case was found where the file name claims one product number and the volume
claims a different one. The disagreements are all prefixes, dates, or omitted
fields.

## Other files in the same folder — not analysed

The folder also holds seven files that are not `*.IMAG` and were outside this
task:

- `DISK34.IMD` (44,245 bytes), `NDDISK19.IMD` (34,004), `NDDISK22.IMD`
  (261,390), `NDDISK34.IMD` (283,861) — ImageDisk format, which is a
  track-structured container, not a raw sector image. The repo has no ImageDisk
  reader, so these cannot be hashed against the archive meaningfully as they
  stand; they would need converting to raw first. Not examined.
- `GRAPHIC-TERM-B00.FONT` (3,082 bytes), `INST-ENCRYPT-A01.PROG` (148,180),
  `NOTIS-ENCR-NO-A0.PROG` (264,192) — loose files, not disk images. Worth
  noting that `INST-ENCRYPT-A01` and `NOTIS-ENCR-NO-A0` are exactly the two
  files held on `ND211004A01-01D.IMAG` (volume `211004A01-NO-01D`,
  ND-211004 NOTIS-ENCRYPT for ND-100), so they were, inferred from the name
  match, extracted from that floppy.

## What is unknown

- Whether `NDCSTOOLS900525.IMAG` (volume `CS-TOOLS`) and `S12-19851220.IMAG`
  (volume `S12`) belong to any ND product. The media carries no part number.
- Which of `COB-210177K01-D.IMAG` and archive entry `nd-210177-k01-d1-6a774ca2`
  is the better read, and why their page layouts differ.
- Whether the `900525` and `19851220` in two file names are dates. Their form
  suggests it; nothing in the media was checked against it.
- What the four `.IMD` files hold.
