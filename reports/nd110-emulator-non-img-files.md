# ND-110 emulator (IMAGES) folder — the four .IMD files and the three loose ND files

Scope: the 7 files listed below, found in the ND-110 emulator (IMAGES) folder.
The 36 `*.IMAG` raw floppy images in the same folder are **not** covered here.

Everything below was read from the actual bytes of those files, or from source
files in this repository. Statements that could not be verified are marked
**unknown** or **inferred**.

Nothing in the source folder was modified, renamed, copied or converted.
Nothing was imported. This report file is the only thing written.

| File | Size (bytes) | Filesystem date |
|---|---:|---|
| `DISK34.IMD` | 44,245 | 2020-03-22 |
| `NDDISK19.IMD` | 34,004 | 2019-07-16 |
| `NDDISK22.IMD` | 261,390 | 2019-12-30 |
| `NDDISK34.IMD` | 283,861 | 2019-09-10 |
| `GRAPHIC-TERM-B00.FONT` | 3,082 | 1986-04-17 |
| `INST-ENCRYPT-A01.PROG` | 148,180 | 1986-01-22 |
| `NOTIS-ENCR-NO-A0.PROG` | 264,192 | 1985-12-11 |

---

## Headline result

All four `.IMD` files decode to **315,392 bytes**, **zero bad-CRC sectors, zero
unavailable sectors** — every one read cleanly.

**Three of the four decode byte-for-byte identical to floppies the archive
already holds.** Their MD5s are already in `catalog/floppies.json`:

| .IMD file | MD5 of decoded raw | Already in archive? |
|---|---|---|
| `DISK34.IMD` | `d0bc9b6edfb83f66c5a4c8713b181d8f` | **yes** — `nd-10534-a-d1-d0bc9b6e` |
| `NDDISK22.IMD` | `9835fd230b057293aa95307064e70ce3` | **yes** — `nd-10058-o-d1-9835fd23` |
| `NDDISK34.IMD` | `2e8b3e9cb2ca8e064a7f9e73013c2399` | **yes** — `img-2e8b3e9cb2ca` |
| `NDDISK19.IMD` | `2d097f33224fdd79a052e39025745b12` | **no** — new read of a volume already present under a different MD5 |

That triple match is also the proof that the decoding below is correct: three
independently produced decodes landed exactly on images already in the archive,
which no wrong decoder would do.

---

## A. The four .IMD files

### A1. Header banner and comment, quoted exactly

Each file begins with an ASCII banner, then a free-text comment, then the byte
`0x1A`. Read from offset 0 to the first `0x1A`.

**`DISK34.IMD`** — `0x1A` at offset 109

```
IMD 1.18:  3/07/1996  2:58:24
JEC
(JOB EXECUTION CONTROL)

DIR. NAME: ND-10534A
USER NAME: FLOPPY-USER
```

**`NDDISK19.IMD`** — `0x1A` at offset 88

```
IMD 1.18: 14/05/1996  3:05:10
SINTRAN III
VSE/VSX
UTILITY PROGRAMS
10628D00-XX-02S
```

**`NDDISK22.IMD`** — `0x1A` at offset 79

```
IMD 1.18: 14/05/1996  3:18:00
48 BITS FLOATING POINT
ND-100580          
```

(the trailing run of spaces after `ND-100580` is literal in the file; the
volume name recovered from the decoded image is `ND-10058O` — letter O, not
zero — so the comment text `ND-100580` is the transcriber's rendering)

**`NDDISK34.IMD`** — `0x1A` at offset 66

```
IMD 1.18: 14/05/1996  4:37:07
NOTIS
SWEDISH   
ND-10079K-SWE-1
```

Line endings in all four are CR LF. Three of the four carry the same imaging
session date, 14/05/1996; `DISK34.IMD` carries 3/07/1996. All four were written
by ImageDisk version 1.18. The 2019/2020 filesystem timestamps on the files are
therefore copy dates, not imaging dates.

### A2. Track structure — how it was decoded

Decoding starts at the byte after the `0x1A`. Each track record is read as:

| Offset within track record | Field |
|---|---|
| +0 | mode |
| +1 | cylinder |
| +2 | head (bit 7 = cylinder map follows, bit 6 = head map follows) |
| +3 | number of sectors |
| +4 | sector-size code; size = `128 << code` |
| +5 … | sector-numbering map, one byte per sector |
| then | optional cylinder map / head map, one byte per sector each, only when head bits 7/6 are set |
| then | one data record per sector |

Each data record starts with a type byte: `0x00` unavailable (no bytes follow),
odd types `0x01/0x03/0x05/0x07` followed by a full sector of data, even types
`0x02/0x04/0x06/0x08` followed by a single fill byte standing for the whole
sector. Types `0x03`/`0x04` mark a deleted address mark, `0x05` and above mark a
CRC error.

The decoder consumed **exactly** the full file length for all four files
(44,245 / 34,004 / 261,390 / 283,861 bytes, no leftover bytes, no overrun),
which confirms the field layout above was applied correctly.

### Result, identical geometry in all four files

| Property | Value (all four files) |
|---|---|
| Track records | 77 |
| Cylinders | 77 (0–76) |
| Heads | 1 (head 0 only) |
| Sectors per track | 8 |
| Sector numbering | 1,2,3,4,5,6,7,8 — in order, no interleave in the map |
| Sector size code | 2 → **512 bytes** |
| Mode | 0 = 500 kbps FM (single density) |
| Cylinder map / head map present | no (head byte has bits 7 and 6 clear) |

### Data-record types per file — read cleanly or not

| File | type 1 (normal) | type 2 (uniform fill) | type 0 (unavailable) | types ≥3 (deleted AM / **bad CRC**) |
|---|---:|---:|---:|---:|
| `DISK34.IMD` | 82 | 534 | 0 | **0** |
| `NDDISK19.IMD` | 62 | 554 | 0 | **0** |
| `NDDISK22.IMD` | 507 | 109 | 0 | **0** |
| `NDDISK34.IMD` | 551 | 65 | 0 | **0** |

616 sectors each (77 × 8), all accounted for.

**No sector in any of the four files is marked bad-CRC, deleted-address-mark, or
unavailable.** All four disks read cleanly. The large differences in file size
come only from how much of each disk is uniform filler: `DISK34.IMD` and
`NDDISK19.IMD` are mostly empty pages stored as one fill byte each, which is why
they are 44 KB and 34 KB on disk while decoding to the same 315,392 bytes.

### A3. Decoded size and whether the archive's NDFS reader can parse it

77 cylinders × 1 head × 8 sectors × 512 bytes = **315,392 bytes**, and the
decoder produced exactly that for all four.

This is the archive's stated single-density ND 8-inch raw size. It is also
315,392 ÷ 2048 = **exactly 154 NDFS pages** — the 154-page geometry named in
`CLAUDE.md`. `tools/src/lib/ndfsalign/index.ts` defines
`NDFS_PAGE_SIZE = 2048` and `isPageAligned()` returns true when the length is a
whole multiple of it, so 315,392 needs **no padding at all** and
`pageAlign()` returns the buffer untouched.

`tools/src/api/filesystem-detect.ts` line 153 records `ndfs` whenever the NDFS
parser succeeds, before any other test.

This is not a prediction. The archive already holds three of these four images
as raw files, and their catalog entries read:

| Catalog id | volumeName | filesystem | imageSizeBytes | totalPages | pageSize | bootFormat | files listed |
|---|---|---|---:|---:|---:|---|---:|
| `nd-10534-a-d1-d0bc9b6e` | ND-10534A | ndfs | 315392 | 154 | 2048 | none | 3 |
| `nd-10058-o-d1-9835fd23` | ND-10058O | ndfs | 315392 | 154 | 2048 | none | 16 |
| `img-2e8b3e9cb2ca` | ND-10079K-SWE-1 | ndfs | 315392 | 154 | 2048 | flomon | 5 |
| `nd-10628-d00-d2-5b418f8f` | 10628D00-XX-02S | ndfs | 315392 | 154 | 2048 | flomon | 2 |

So: **yes**, a decoded image of this geometry parses with the archive's NDFS
reader — it already has, for these exact byte sequences.

### A4. Does the archive read ImageDisk today? — **No**

Verified by searching `tools/src/`, `tools/scripts/`, `docs/`, `Makefile` and
`README.md` for `imagedisk`, `.imd` and `imd2raw`, case-insensitive:
**zero hits**. There is no ImageDisk decoder anywhere in the tooling.

A repository-wide `find` for `*.imd` (excluding `.git`) returns nothing: the
archive holds **no** ImageDisk file.

One thing does exist, and it is only a label. `catalog/schema/floppy.schema.json`
declares:

```
"imageFormat": { "type": "string", "enum": ["raw", "imd", "td0", "hfe", "scp"] }
```

so the schema can *record* that an entry came from an IMD, but nothing reads the
format. `tools/src/api/catalog.ts` line 313 defaults `imageFormat` to `'raw'`,
and line 297 derives the image path as the YAML basename plus `.img.gz` — the
importer only ever expects a raw image. Every one of the 1,066 catalog entries
would have to be checked to state the count of non-`raw` entries; that was not
done, so the number of entries already labelled `imd` is **unknown**.

Regarding the roughly 320 `.imd` files reported elsewhere on Ronny's disks:
**there is no support for them at all in this repository today** — no decoder,
no import path, no identify path. `tools/src/api/identify.ts` and
`filesystem-detect.ts` both operate on a raw buffer and would classify an
undecoded `.IMD` as holding no filesystem.

### A5. Converters present on this machine

Checked with `command -v`. Nothing was installed, and nothing was converted.

| Tool | Present | What it is |
|---|---|---|
| `imd2raw` | **yes**, on the PATH (a locally installed binary, not a distribution package) | a dedicated ImageDisk-to-raw converter, ELF x86-64, not stripped. Run with no arguments it prints `File doesn't start with 'IMD'`, confirming it is a real IMD reader. Origin and build provenance **unknown**. |
| `dsktrans`, `dskid`, `dskform`, `dskscan`, `dskutil` | **yes**, on the PATH (distribution package `libdsk-utils`) | libdsk 1.5.9 command-line tools. `dsktrans` converts between disc image types via `-itype`/`-otype`. Whether libdsk 1.5.9 lists `imd` among its input types was **not** checked — that requires running `dsktrans -types`, which was not done. |
| `samdisk` / `SAMdisk` | no | |
| `dskconv`, `cpmtools`, `hxcfe`, `greaseweazle`, `fluxengine` | no | |
| `dtc` | present but **irrelevant** | the `dtc` on the PATH is device-tree-compiler 1.6.1, not the KryoFlux `dtc`. |

So conversion tooling **is** available on this machine. Whether to run it is
Ronny's call; nothing was converted here.

### A6. Contents read straight out of the .IMD sector data

Sector data was reassembled in memory only, by a throwaway script under the
session scratchpad directory, never inside the repository, and never written to
disk as an image. ND `NAME:TYPE` strings were then searched for in the plain
byte stream and in the even-byte, odd-byte and low-7-bit views.

**`DISK34.IMD`** — volume `ND-10534A`, user `FLOPPY-USER`. Almost the whole disk
is uniform filler byte `0x5E`. One ND name is visible: `OS-CONNECT-TO:PROG`.
The archive's own entry for this image lists 3 files. Product
**ND-10534 Job Execution Control** (`products/ND-10534.yaml`), which matches the
comment text `JEC (JOB EXECUTION CONTROL)`.

**`NDDISK19.IMD`** — volume string `10628D00-XX-02S` in page 0. Page 0 also
carries an ND floppy-monitor command table, readable verbatim:
`LIST-FILE`, `LOAD-FILE`, `PLACE-FILE`, `OPCOM`, `HELP`, and the error texts
`$TOO LONG LINE$`, `$ILLEGAL CHARACTER$`, `$LOG. DEV: `, `$FILE NAME: `,
`$EMPTY FILE$`, `$NO BIT FILE$`, `$WRONG WORDCOUNT$`, `$CHECKSUM ERR$`,
`$PLACED$`. No ND `NAME:TYPE` entries were recovered by the string scan — the
handful the regular expression matched are random byte coincidences, not names.
Product **ND-10628 SINTRAN III VSE/VSX Utility Programs**
(`products/ND-10628.yaml`), matching the comment text.

**`NDDISK22.IMD`** — volume `ND-10058O`. Rich file listing recovered:

```
SIMULA:BPUN        N10-SIMULA:BPUN    ND-10058:SYST
SIMULA3:SIM        SIMULA3-O:SIM
SIMSET3:SIM        SIMSET3-O:SIM
SIMRT3:SIM         SIMRT3-O:SIM
SIMRAND3:SIM       SIMRAND3-O:SIM
SIMBASE3:SIM       SIMBASE3-O:SIM
SIMMAT:SIM         SIMMAT-O:SIM
SIMERR:DATA        SIMERR-O:DATA
SIMERC:DATA        SIMERC-O:DATA
SIMDEBUG:PROG      SIMDEBUG-O:PROG    SIM-DEBUG:PROG
S-LOAD:PROG        S-LOAD-O:PROG
DRA-DYNRTS:SIM     DRC-LOAD:MODE
```

Product **ND-10058 NORD Simula (48-bit)** (`products/ND-10058.yaml`). The disk
comment `48 BITS FLOATING POINT` and the contents agree.

**`NDDISK34.IMD`** — volume `ND-10079K-SWE-1`. Names recovered:
`NOTIS-WP-SWE-K:INIT`, `VTM-EMBD:BRF`, `DDBTABLES:VTM`. Page 0 carries the same
ND floppy-monitor command table as `NDDISK19.IMD`. Product
**ND-10079 NOTIS-WP** (`products/ND-10079.yaml`), Swedish version, disk 1.

---

## B. The two .PROG files and the .FONT file

### B1. Sizes, first bytes, and whether they are BPUN

**`GRAPHIC-TERM-B00.FONT`** — 3,082 bytes (1.5049 NDFS pages).
First 16 bytes:

```
01 02 01 1f 01 2a 01 34 01 3f 01 45 01 50 01 5a
```

This is a table of big-endian 16-bit values that rise monotonically
(0x0102, 0x011f, 0x012a, 0x0134, …) — an offset table into glyph data, which is
what a font file would carry. That reading is **inferred** from the monotonic
progression; no format definition for `:FONT` files exists in this repository.

**Not BPUN**: the byte `0x21` (`!`) does not occur anywhere in the file at all.

**`INST-ENCRYPT-A01.PROG`** — 148,180 bytes (72.35 NDFS pages).
First 32 bytes:

```
00 00 00 01 00 00 7f 62 00 00 20 69 00 00 00 00
00 00 00 00 43 52 59 50 54 49 4f 4e 0a 19 07 a3
```

Bytes 20–27 are the ASCII text `CRYPTION`. The four 32-bit-looking fields at the
start (`00000001`, `00007f62`, `00002069`, `00000000`) are **unknown** — this
repository defines no `:PROG` file header layout anywhere, so no field meaning
is claimed.

**`NOTIS-ENCR-NO-A0.PROG`** — 264,192 bytes, which is exactly **129 NDFS pages**.
First 16 bytes:

```
06 6e 06 6e 00 00 53 89 00 00 1b b5 00 00 00 00
```

Same situation: header fields **unknown**.

**On BPUN.** The repository's only definition of BPUN is in
`externals/norskdata-ndfs/ndfs-ts/src/boot-loader.ts`. It scans for the byte
`0x21` and reads a 16-bit address and a 16-bit count immediately after it;
address 0 and count 0 means FloMon, count > 0 means BPUN. Critically, that scan
is bounded: line 20 sets `BOOT_SCAN_LIMIT = Math.min(1024, MASTER_BLOCK_OFFSET)`,
so only the first 1,024 bytes are examined, and the test is meant for **page 0
of a disk image**, not for a standalone file.

The second BPUN handler is in `tools/src/api/import.ts` lines 116–142. It only
runs when an NDFS object entry has `type === 'BPUN'`, finds the first `0x21`
anywhere in the file, then sums `count` big-endian 16-bit words after it and
compares against the stored checksum.

Applying the `0x21` test to the loose files:

| File | first `0x21` at offset | within the 1,024-byte boot scan window? |
|---|---:|---|
| `GRAPHIC-TERM-B00.FONT` | none — byte absent entirely | no |
| `INST-ENCRYPT-A01.PROG` | 1,366 | no |
| `NOTIS-ENCR-NO-A0.PROG` | 1,655 | no |

**None of the three is a BPUN file.** In all three, the `0x21` occurrences that
do exist are ordinary `!` characters inside text and data far past any header.
This agrees with the ND file types themselves — `:BPUN` is a distinct ND file
type from `:PROG` and `:FONT`, and none of these three files carries the `:BPUN`
type in its name.

### B2. Readable strings

**`GRAPHIC-TERM-B00.FONT`** — two readable strings only: `TIMES BOLD` (padded
with trailing spaces) and `TMSBL`. Everything else is glyph bitmap data.

**`NOTIS-ENCR-NO-A0.PROG`** — this is the **Norwegian-language NOTIS encryption
program**, and it identifies itself in plain text. The banner, quoted verbatim:

```
N O T I S - K R Y P T E R I N G
--------------------------------------------------------------------------------
          Med dette programmet kan du kryptere en SINTRAN Fil eller et
          NOTIS-DS Dokument.  Programmet kan ogsa dekryptere en
          tidligere kryptert fil eller dokument.
          For a kryptere en fil eller et dokument ma du gi
          en krypterings NOKKEL.
          Den krypterte filen/dokumentet blir lagret under sitt
          opprinnelige navn.

ADVARSEL: En kryptert fil eller dokument kan bare bli dekryptert
          ved a oppgi krypterings NOKKELEN.  Denne koden blir ikke
          lagret noen plass.  Sa IKKE GLEM krypterings nokkelen.
```

(Norwegian letters O-slash and A-ring appear as high-bit or substituted bytes in
the raw file and are written here as `O` and `A`.)

Its prompts, verbatim:

```
Krypter en SINTRAN fil eller et NOTIS-DS dokument (S/N) :
Gi navn pa SINTRAN fil, inkludert type    :
Gi NOTIS-DS bruker (standard = navarende) :
            skuff                         :
            mappe                         :
            dokument                      :
Gi krypteringsnokkel (maksimum 30 tegn)   :
Krypteringen er ferdig
HUSK NOKKELEN for dekryptering
```

Other embedded names: `ENCRYPT:PROG`, `ENCRYPT-TEMPFILE:TEMP`, `DSSYSTEM`,
`*IDSYSTEM`, `DSSERVER`, `*IDSERVER`, `UE-ERMSG-EN-B`, `SYMBREADWRITE`, and the
error text `DDBTABLES-E:VTM FILE DOES NOT EXIST`.

**No version banner, copyright line or date string was found anywhere in this
file.** The only date evidence is the filesystem timestamp, 1985-12-11.
The `A0` in the file name is **inferred** to be the version letter, matching the
naming pattern `NOTIS-ENCR-<lang>-<version>` seen below.

**`INST-ENCRYPT-A01.PROG`** — this is the **installer** for the above, and it is
not a compiled program at all: it is an **XCOM (Extended COMmand processor) save
file**. `XCOM-A02:PROG` appears at offset 590, `XCOM-LIBRARY` at 145,130, and
XCOM's own runtime messages are present (`XCOM needs at least 50 pages for MODE
and SAVE file.`, `XCOM needs 2 files - MODE and SAVE file.`, `Extended COMmand
processor`).

The installation script it carries is readable verbatim, at offsets 147,782 to
148,126 — the tail of the file:

```
^TYPE Installation of NOTIS-ENCRYPT starts ....
^ASK ANS Do you want English (EN) or Norwegian (NO) version ?
^TYPE There will be an error if the current user doesn't have 33 free pages.
^TYPE Wait .... copying the program
^TYPE $NOTIS-ENCRYPT is copied to this user
```

and the copy target, at offset 132,258:

```
^EXIT $NOTIS-ENCRYPT is copied to this user:FLOPPY-USER)NOTIS-ENCR-<ANS>-A0:PROG
```

`<ANS>` is the answer to the language question, so the installer expects to find
`(FLOPPY-USER)NOTIS-ENCR-EN-A0:PROG` and `(FLOPPY-USER)NOTIS-ENCR-NO-A0:PROG` on
the same floppy. **`NOTIS-ENCR-NO-A0.PROG` is precisely the `NO` half of that
pair; the `EN` half is not in the ND-110 emulator (IMAGES) folder.**

Development provenance is also embedded, verbatim:

```
(PACK-2-GYDA:MERETE-JORDAL)INSTALL-ENCRYPT:PROG;1
DUMP (PACK-2-GYDA:MERETE-JORDAL)INSTALL-ENCRYPT:PROG 0 1
```

so the installer was dumped from user `MERETE-JORDAL` on pack `PACK-2-GYDA`.

A leftover fragment from XCOM's own bug-tracking sits at offset 66,119, verbatim:

```
Nummer:277    Type:Feil               Mottatt fra:Arne W Normann
Mottatt dato: 840920
Det blir ikke gitt feilmelding hvis mer enn 50 kommandoer/ alternativer
i grammatikkfilen (Parameter MAXCOM)
Antatt modul:SYSGEN         Database: Alle       Hovedansvarlig: A Fougner
Verifisert: Ja
Rettet : Ja         Rettet dato: 841005   Rettet av: A Fougner
Rettet moduler: SI-SG-GRAM   Rettet rutiner: GRAMGN
                SI-COM-COMNDS                ERRMESS
Kommentarer: Antall kommandoer er utvidet til 100.
```

That fixes 1984-10-05 as the date of the XCOM build these files were dumped
with; it says nothing about NOTIS-ENCRYPT's own version.

No copyright line was found in either .PROG file.

### B3. Matching ND product in the archive — found

**ND-211004 NOTIS-ENCRYPT for ND-100** — `products/ND-211004.yaml`:

```yaml
id: ND-211004
name: NOTIS-ENCRYPT for ND-100
platform:
  - "100"
docs:
  productInfo:
    - ND-211004-A1-EN
```

The Product Information sheet `docs/nd/product-info/ND-211004-A1-EN.md` is
present and describes exactly this program: *"NOTIS-ENCRYPT is a tool for the
security-conscious. It will encrypt all types of files based on individual
encryption keys… The encryption key is not stored on the system."* It also
states *"NOTIS-ENCRYPTION consists of one program (31 pages)"* and *"requires
SINTRAN-III, version J or later"*, and names a description card `ND 99.004 EN`.

Two independent corroborations of the match, from the bytes:

1. The installer's own message says the user needs **33 free pages**, against
   the sheet's **31 pages** for the program itself — the same order of size,
   with two pages of slack. (Note that `NOTIS-ENCR-NO-A0.PROG` on disk is 129
   pages, not 31. Whether the 31-page figure refers to the executing program
   rather than the stored file is **unknown**.)
2. The sheet's description of the workflow — user supplies a key, key never
   stored, file keeps its original name, NOTIS-DS documents supported — matches
   the Norwegian program's on-screen text line for line.

**No floppy in the archive is assigned to ND-211004.** Verified against
`catalog/floppies.json`: zero entries have `productId: "ND-211004"`, and a
search of every recorded NDFS file listing for the substrings `ENCR` and `CRYPT`
returns **zero** hits across all 1,066 entries. The floppy these two files came
off is **not in the archive**.

No other encryption-related ND product was found. The only other hit for
`crypt` in the documentation is the word "cryptic" in an unrelated SIBAS error
message in `docs/nd/installation-description/ND-895615-1-EN.md`.

### B3b. The .FONT file is already in the archive — inside a floppy image

`GRAPHIC-TERM-B00:FONT` **is** in the catalog, as a file inside six existing
floppy images, all belonging to product **ND-210523 Test programs for
ND-100/110/120** (`products/ND-210523.yaml`): entries
`nd-210523-e00-d1-a32d604a`, `nd-210523-g02-d1-25c60c57`,
`nd-210523-g02-d1-b9f3070e`, `nd-210523-h00-d1-2a675221`,
`nd-210523-h00-d1-d5a87fd4`, `nd-210523-i01-d1-5297b177`.

The recorded metadata matches the loose file exactly:

```
name: GRAPHIC-TERM-B00:FONT   type: FONT   pages: 2   bytes: 3082
userName: FLOPPY-USER
dateCreated:     1986-04-17 14:45:45
lastDateWritten: 1986-04-17 14:47:07
```

3,082 bytes and 1986-04-17 — the same size and the same date as the loose file.

Byte-level confirmation: the image
`images/a32d604a0f7a37c40879cfa1cc49827d/210523E00-XX-01D.image.img.gz` was
decompressed to the scratchpad and searched. Bytes 0–2047 of the loose file
occur at image offset 663,552 (page 324), and bytes 2048–3081 occur at image
offset 661,504 (page 323). **Every byte of the loose file is present in the
archived image**, in the disk's two allocated pages, which sit in a different
order on the media than in the extracted file — which is what an NDFS-aware
extractor following the page index produces.

So `GRAPHIC-TERM-B00.FONT` carries no new data. It was extracted from an
ND-210523 test floppy the archive already holds.

### B4. Can the data model hold loose extracted files? — **No**

The archive stores **whole media images only**. Evidence:

`catalog/schema/floppy.schema.json` requires
`["schemaVersion", "id", "type", "md5", "imageFormat"]` on every entry, and
constrains `type` to `["floppy", "hdd", "rom", "tape", "firmware"]`. There is no
`file` member of that enum. Every content field in the schema
(`ndfs`, `dosFiles`, `backupFiles`, `volumeName`, `volumeLabel`, `totalPages`,
`bootFormat`, `condition`) describes a *volume*, and file listings exist only as
arrays nested inside a volume entry — never as entries in their own right.

`tools/src/api/catalog.ts` enforces the same thing structurally.
`loadCatalog()` scans `images/**/*.yaml` and accepts a document only when it has
both `id` **and** `md5` (`if (doc && doc.id && doc.md5)`). `yamlDocToEntry()`
then derives the binary's location purely from the YAML file's own name:

```
const yamlBaseName = basename(yamlRelPath, '.yaml');
const imgGzPath = join(dirname(yamlRelPath), yamlBaseName + '.img.gz');
```

and hard-codes `type: 'floppy'` for every entry it builds. The folder name
`images/{md5}` is the MD5 of the raw `.img`. There is no path in this code that
stores, addresses, or serves an individual extracted file.

One partial exception exists but does not help here: `loadCatalog()` step 2
loads *legacy* entries from `catalog/legacy.json`, described in the comment as
"metadata-only, no `.img.gz`". Those are records about media that has no image,
not a container for loose files.

**Plain answer: `GRAPHIC-TERM-B00.FONT`, `INST-ENCRYPT-A01.PROG` and
`NOTIS-ENCR-NO-A0.PROG` cannot be preserved in the archive as they are.** The
data model has no place for a file that is not part of a disk image. To preserve
the two NOTIS-ENCRYPT files, the floppy they were extracted from would have to
be found and imaged — and that floppy is not currently in the archive.

---

## What could not be verified

- The header field meanings in the two `.PROG` files. This repository defines no
  `:PROG` file header layout, and none was invented here.
- The internal format of a `:FONT` file. The rising 16-bit table at its start is
  an inference from the byte pattern, nothing more.
- The version of `NOTIS-ENCR-NO-A0.PROG`. No version banner exists in the file.
  The `A0` is read from the file name only.
- Whether libdsk 1.5.9 accepts `imd` as an input type — that needs
  `dsktrans -types`, which was not run.
- The provenance and build of the `imd2raw` binary present on this machine.
- How many of the 1,066 existing catalog entries already carry a non-`raw`
  `imageFormat`; that was not counted.
- Whether the roughly 320 `.imd` files elsewhere on Ronny's disks are also
  duplicates of images already held. Three of the four checked here were, but
  four files is not a basis for a claim about 320.
