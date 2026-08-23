# The ND-110 emulator distribution — full tree survey

Source: the ND-110 emulator distribution (top folder dated 02-07-2021), contributor "cvs" (Carl-Victor).
Nothing in the distribution and nothing in this archive was modified, copied or imported for this survey.
Decoding of the ImageDisk containers was done in a scratch directory outside the repository.

Scope: the whole tree. The `(IMAGES)` folder had already been surveyed separately; it is
included here only where it bears on the two questions below.

---

## 1. `RSH-CLIEN-D01:PROG` — NOT FOUND

**Result: the name `RSH-CLIEN-D01` does not occur anywhere in the distribution** — not as a
file name, not as a string inside any file, and not inside any disk image.

### What was searched

- **File names.** A case-insensitive name search over all 723 files for `*rsh*` and `*clien*`
  returned four files, all in `(XMSG)`: `CLIENT.BRF`, `CLIENT.MODE`, `CLIENT.PROG`,
  `CLIENT.SYMB`. None is `RSH-CLIEN*`. `CLIENT.SYMB` is FORTRAN source whose first lines read
  `C file=(XMSG)CLIENT:SYMB` and `PROGRAM CLIENT`, calling `OPEN_CLIENT('ServerX', ...)` — an
  XMSG demonstration client, unrelated to a remote shell.
- **Raw bytes of every file**, including all 37 `*.IMAG` raw floppy images. Every
  case-insensitive `RSH` hit was read in context at its byte offset. All are false positives:

  | File | offset(s) | actual text |
  |---|---|---|
  | `(DDBTABLES)/VTM-COMPOUND-G02.PROG` | 271036, 271164, 285424, 285552 | `CURSHDNO` / `CURSHD` (VTM symbol names) |
  | `(IMAGES)/210455G02-XX-01D.IMAG` | 701168, 701296, 715452, 715580 | `CURSHDNO` / `CURSHD` |
  | `(IMAGES)/211068A00-EN-02D.IMAG` | 812000 | `CURSHOME` |
  | `(IMAGES)/211024C01-XX-01D.IMAG` | 730686 | `CURSHOME` |
  | `(OE)/FILE-MAN-EN-C00.PROG` | 263136 | `CURSHOME` |
  | `(SYSTEM)/FORTRAN-100-G02.PROG` | 136321 | `IRSHFT` (FORTRAN intrinsic name) |
  | `(IMAGES)/210079N07-EN-01D.IMAG` | 341338, 343111, 356942 | `SUPERSHIFT` |
  | `(WP)/NOTIS-WP-EN-N04.HELP` | 318030, 332871, 335194 | `SUPERSHIFT` |
  | `(IMAGES)/NDDISK34.IMD` (and its decode, offset 233512) | 216394 | `SUPERSHIFT` (Swedish text) |
  | `(NO-GA)/INFO-SPILL.TEXT` | 956 | postal address `til RSH, Norsk Data A/S, Postboks 25 Bogerud, OSLO 6` — three initials of a person, not a program name |
  | `(IMAGES)/ND-GAMES.IMAG` | 1258428 | the same postal address (that image contains `INFO-SPILL:TEXT`) |
  | `ND110-NEW.EXE` | 38945, 230322 | x86 instruction bytes that happen to spell `uRSh`; not text |

  No hit is an NDFS directory entry. An NDFS entry would show the name immediately followed by
  a type field in the object-file area; every hit above sits in the middle of a longer word.

- **The four ImageDisk containers** in `(IMAGES)` were decoded to raw sector images first
  (they are RLE-compressed, so a raw grep is not conclusive) and then searched. All four are
  77-cylinder, 1-head, 8-sector, 512-byte, single-density floppies (315,392 bytes each), every
  sector read cleanly. Their IMD banner comments are:
  - `DISK34.IMD` — `JEC | (JOB EXECUTION CONTROL) | DIR. NAME: ND-10534A | USER NAME: FLOPPY-USER`
  - `NDDISK19.IMD` — `SINTRAN III | VSE/VSX | UTILITY PROGRAMS | 10628D00-XX-02S`
  - `NDDISK22.IMD` — `48 BITS FLOATING POINT | ND-10058O`
  - `NDDISK34.IMD` — `NOTIS | SWEDISH | ND-10079K-SWE-1`

  Searching the decoded images for `RSH` gave exactly one hit (`SUPERSHIFT`, listed above) and
  for `CLIEN` gave none.

### Does this archive already hold anything named RSH?

**No.** `catalog/floppies.json` (1067 entries) contains no occurrence of the string `RSH` and no
occurrence of `CLIEN` in any field, including `ndfs.files[].name`, `dosFiles` and `backupFiles`.
There are no entry ids and no products to report.

---

## 2. Inventory of the whole tree

723 files in 34 folders. `(ACCOUNTS)`, `(RT)`, `(UE)` and `(EMULATOR)/New folder` are empty.

### Top level

| File | Size | Modified | What it is (evidence) |
|---|---|---|---|
| `ND110` | 1,672,368 | 2021-07-02 | ELF 64-bit x86-64 PIE, GNU/Linux, not stripped, with debug info |
| `ND110.exe` | 722,944 | 2021-07-02 | PE32 console executable, Intel 80386, MS Windows |
| `ND110-NEW.EXE` | 818,176 | 2022-10-22 | PE32 console executable, Intel 80386 |
| `ND110pi` | 1,056,304 | 2021-07-02 | ELF 32-bit ARM EABI5, GNU/Linux — Raspberry Pi build |
| `XROUT` | 155,336 | 2021-02-17 | ELF 64-bit x86-64 PIE |
| `XROUT.exe` | 473,600 | 2021-02-17 | PE32 console executable |
| `XROUTpi` | 88,164 | 2021-02-17 | ELF 32-bit ARM EABI5 |
| `XROUT-LOCK` | 0 | 2025-09-01 | empty file, presumably a lock marker (inferred — content is zero bytes) |
| `README.txt` | 721 | 2019-05-27 | ASCII. States the emulator covers ND-10/110/120, runs SINTRAN III **background** programs only, emulates a number of `MON` calls for file I/O, and that user folders `SYSTEM`, `RT` etc. come with it |
| `Doc/NDEmulatorUserManual.pdf` | 2,713,331 | 2021-06-27 | PDF 1.7 |

The parenthesised folder names are the emulator's rendering of SINTRAN user directories
(`(SYSTEM)`, `(RT)`, `(FLOPPY-USER)` …), and the files inside them are individual **preserved ND
files** stored as host files with the ND `NAME:TYPE` colon flattened to a dot. Extension counts
across the whole tree:

```
PROG 136   SYMB 86   VTM 60   BRF 59   TEST 38   IMAG 37   DATA 34   BPUN 32
TXT  23    MODE 21   UNIQ 16  UCOM 16  NEXT 16   ERR  15   SGNO 14   CONF 14
TEXT  7    HELP  7   COM  7   PLOT  6  ORG   5   NRF   5   NDPF  5   GROG  5
MCRO  4    IMD   4   XCOM 3   UTXT  3  FONT  3   EXE   3   plus ~30 singletons
```

`PROG`, `BPUN`, `BRF`, `SYMB`, `NRF`, `MODE`, `DATA`, `TEXT`, `FONT`, `HELP`, `MCRO` are all ND
file types, so those files are preserved ND files by naming. Several were also confirmed by
content: `(TSS)/TSS1.SYMB` decodes (after clearing the parity bit) to
`TIME SHARING SYSTEM BY ... NDA`; `(EMULATOR)/SINTRAN.DATA` decodes to a SINTRAN
patching-macro instruction sheet listing `PCCST`, `PRDAT`, `PSYSG`, `PFILS`, `P500M` and the
warning that `PEND` must precede a start.

Note that `file(1)` type guesses on these are meaningless — ND binaries have no host magic —
so classification above rests on the ND naming convention plus the decoded content, not on
`file(1)`.

### Per folder

| Folder | Files | Bytes | Contents |
|---|---|---|---|
| `(ACCOUNTS)` | 0 | 0 | empty |
| `(BPUN)` | 16 | 525,577 | Stand-alone `:BPUN` binary programs, 1981–1988: `ACCOUNTS-2183A`, `COP-VERIFY-2035D`, `DITAP-1880D`, `DMAC-1915D`, `DUMPFL-2327A`, `FILSYS-INV-2135H`, `FLOPPY-MON-2010F`, `MCOPY-HP-1650G`, `MCOPY-TANB-1649I`, `MEMTOF-2326A`, `PERFORM-2412D`, `PED-ENG-J`, `TPE-MON-100-A02`, `TPE-MON-100-B00`; plus `GRAPHIC-TERM-B00.FONT`, `MACRO1.MODE` |
| `(DDBTABLES)` | 38 | 925,767 | VTM terminal-definition tables `DDBnnn-*-G02.VTM` (1986–87), `DDBTABLES-G02.VTM`, `INST-TABLES-G02.PROG`, `VTM-COMPOUND-G02.PROG`, `VTM-1B/2B-ARRAY-G02.BRF`, `VTM-ARRAYS-G02.NRF` |
| `(EMULATOR)` | 26 | 1,135,816 | Emulator-side ND material: `ASSEMBLER-500.PROG`, `MACM-1718L.BPUN`, `CONFIGURATIO-C08.BPUN`, `INSTRUCTION-B.BPUN`, `FLOPPY-FU-1986F.BPUN`, `FLOPPY-MON-2010G.BPUN`, `ONE-CHECK-1192A.BPUN`, `TWO-CHECK-1190A.BPUN`, `THREE-CH-1528D.BPUN`, `four-ch-1418e.bpun`, `RTC.BPUN`, `NEW-SYSTEM.PROG`, `TPE-MON-100-A01.BPUN`, `SINTRAN.DATA`, plus small hand-written `BM.*`, `FLOTE.*`, `RONNY.SYMB`, `EXAMPLE.SYMB`, `ABSTR.SYMB`. Sub-folder `New folder` is empty |
| `(FLOPPY-USER)` | 11 | 573,316 | `SNPCAL.*` (BRF/DATA/MODE/OUT/PROG/SYMB), `SNPPIC.*`, `FILESIZE-100-N06.NXCM`, `UE-INSTALL-C.COM/.PROG` |
| `(FORTRAN)` | 4 | 30,720 | `MON-CALL-1B-A00.BRF`, `MON-CALL-2B-A00.BRF`, `MON-CALL-LIB-A00.NRF`, `MON-CALL-NAMES-A.DATA` |
| `(IMAGES)` | 43 | 43,615,850 | 37 `*.IMAG` raw floppy images (a 37th, `KERMIT`-unrelated, is counted here), 4 `*.IMD` ImageDisk containers, plus 2 other files. Surveyed previously |
| `(JPASCAL)` | 4 | 219,136 | Pascal J-version libraries: `PASCAL-2LIB-J.BRF`, `PASCAL-COD-J.BRF`, `PASCAL-ERR-J.SYMB`, `PASCAL-LIB-J.BRF` |
| `(KERMIT)` | 5 | 1,362,609 | `KERMIT.PROG` (45,568), `KERMIT.HELP` (6,915), `KERMIT.HLIB` (420), **`KERMIT.IMAG` — a disk image, see section 3**, and `norskdata.zip` (48,138) holding 27 Kermit-85 sources dated 1985-06-24: `ndkbas.pas`, `ndkcom.pas`, `ndkcon.pas`, `ndkdco.pas`, `ndkdeb.pas`, `ndkerm.hfi`, `ndkerm.pas`, `ndkermhlp.txt`, `ndkerp.mcr`, `ndkext.pas`, `ndkfau.pas`, `ndkfil.pas`, `ndkhau.pas`, `ndkhde.pas`, `ndkhex.pas`, `ndkhit.pas`, `ndkhli.pas`, `ndkhma.pas`, `ndkins.bwr`, `ndkmap.txt`, `ndkmon.mac`, `ndkpla.txt`, `ndkrea.pas`, `ndksen.pas`, `ndktyp.pas`, `ndkuti.pas`, `ndkvar.pas` |
| `(ND-OPERATIONS)` | 2 | 96,085 | `SSY-SYSF-A02.DATA`; `moncalls.txt` — despite the name it is a personal scratch note (model-railway prices, an eBay link) with two lines about `(USER-ENVIRONMENT)UE-USER-PROFILE.DATA` and a `FILESIZE-100-N.*XCM` deabbreviation attempt |
| `(NDCSTOOLS)` | 1 | 251,904 | `CHEDIR.PROG` (1990-05-25) |
| `(NO-GA)` | 38 | 1,271,808 | Norwegian games, 1984–85: `BACKGAMMON`, `BONDESJAKK`, `BREAKOUT`, `CASTLE`, `DIGGER-48-NO`, `FIDO-48-NO`, `FYR-LAUS`, `KALENDER`, `LABYRINT`, `MACMAN-48-NO`, `MASTERMIND-48-NO`, `ORM`, `SPILL-48`, `TERRANOVA-48-NO`, `TRON-48-NO`, `YATZY` plus their `.DATA`/`.SYMB` companions and `INFO-SPILL.TEXT` |
| `(NOTIS)` | 3 | 548,096 | `NOTIS-ENCR-NO-A0.PROG`, `NOTIS-WP-NO-M.ERR`, `NOTIS-WP-NO-M.ERRx` |
| `(NOTIS-BG)` | 25 | 727,040 | NOTIS Business Graphics B03/B04: `BG-DRIV01..05,15-B03.BRF`, `BG-PART1..6`, `BG-EX01..06-EN-B04.PLOT`, `INST-BG148-B04.COM/.PROG`, `XCOM.PROG`, `DDBTABLES-E02.VTM` |
| `(OE)` | 18 | 2,783,232 | ND Operator Environment A00/C00, 1987: `FILE-MAN-EN-C00.PROG`, `FM-SIN-EN-C00.PROG`, `FM-PICS-EN-C00.NDPF`, `INSTAL-OE-A00.PROG`, `INSTAL-OE-EN-A00.XCOM`, `OEA/OEB/OEC/OEF/OEM/OEP/OES/OEV-*.CONF`, `UE-ERMSG-EN-C02.ERR` |
| `(PASCAL)` | 8 | 355,291 | `PASCAL.PROG` (139,263) plus the J libraries and `PATCH-SINTRAN-J.SYMB` |
| `(RT)` | 0 | 0 | empty |
| `(SCRATCH)` | 8 | 4,002,558 | `SCRATCH01..08.DATA`. `01` and `03` begin `\x00\x02 MAIN ... PASTE` — NOTIS-WP scratch buffers (inferred from the `MAIN`/`PASTE` buffer names). `03` contains the banner `NCT emulator program , prepared for ICAN / Version 2 20/9-85 / C-V. Sundling I.F.E. Halden`. `02` and `08` hold ND assembler text (`MON 2;MON 65`, `MON1:SYMB`, `LDX (BYTES;`). `04` is a segment-number map (`200 WPEDITM wp-editor-m06`, `201 WPCMDM wp-cmd-m06`, `300 T1 simple-main`, …) |
| `(SOFT-KEYS)` | 3 | 313,344 | `INSERT-SOFTK-B01.PROG`, `KEYS-B01.DATA`, `LIST-LEGALNO-B01.PROG` |
| `(SPRINT)` | 18 | 3,170,305 | SPRINT / SSY A02, Oct–Nov 1987: `SSY-MAIN`, `SSY-SECO`, `SSY-PSHA`, `SSY-SERVER`, `SSY-INST`, `VISI-SERVER`, `SSYLIB-1B/2B-A02.BRF`, `SSYLIB-500-A02.NRF`, `SSYLIB-A02.DEFS/.IMPT`, `PRM-SERVER-A02.DFIL/.PFIL`, `SSY-PICT-EN-A02.CONF/.NDPF`, `DDBTABLES-E07.VTM` |
| `(SUBSYSTEM)` | 10 | 291,892 | `BRF-EDITOR-1858F.BPUN`, `F32-EXTR-2232B..BPUN`, `FTN.BPUN`, `GPM-2365B.BPUN`, `GPM-LIBR-2366B.SYMB`, `LOOK-FILE-2244E.BPUN`, `NRL-1935J.BPUN`, `PERFORM-2412F.BPUN`, `PERFORM-LIBRARY.MCRO` |
| `(SYSTEM)` | 123 | 10,391,020 | The largest folder: compilers and system utilities — `FORTRAN-100-G02.PROG`, `PLANC-100-A-I01.PROG`, `NPL.PROG`, `MAC.PROG`, `ASSEMBLER-500.PROG`, `NDP-COMPILER-D.PROG`, `BRF-LINKER.PROG`, `BRF-EDITOR.PROG`, `NRL-1935L.PROG`, `PED.PROG`, `QED.PROG`, `JEC.PROG`, `DEBUGGER.PROG`, `LOOK-FILE.PROG`, `SORT-MERGE.PROG`, `P-BACKUP-25I.PROG`, `ISAM-INTER-K01`/`ISAM-SERVICE-K02`, `S3-CONFIG-E01.PROG`, `XMSG-COMMAND.PROG`, `SERVER-ADM.PROG`, NOTIS WP/TF/CALC parts, the FORTRAN/PLANC/PASCAL/BASIC libraries, `MON-CALL-*.BRF`, `MON-CALL-NAMES.DATA`, and 14 `SEGFILE_*.SGNO` segment files (2017–2020) |
| `(TELEFIX)` | 3 | 2,048 | `TELEFIX-A-RECE-C.PROG` and `TELEFIX-A-TRAN-C.PROG` are **0 bytes**; only `TELEFIX-FILE-TR.MODE` (2,048, 1987-06-04) has content |
| `(TPE-MON)` | 81 | 5,228,595 | ND Test Program Executive material. Vendor `*.TEST` / `*.NEXT` diagnostics 1986–88: `CACHE-100/110/120/1X0`, `INSTRUCTION-C00/C03`, `PAGING-C00/C02`, `MEMORY-D00/D04`, `DISC-TEMA-I11`, `DISK-MM-B00`, `FLOPPY-STREA-C00/C02`, `PRINTERS-A00/B00` + 8 `PRINTERS-00n-B00.NEXT` overlays, `SCSI-TV-B00` + 4 overlays, `PIOC-ETHER-A00/B01`, `NET-ONE-A00`, `OCTOBUS-B00`, `HDLC-MEGALIN-D00`, `MAGTAPE-B00`, `SYNC-MODEM-B00`, `TERMINAL-ASY-F00/F01`, `COLOUR-TERM-A00`, `GRAPHIC-TERM-B00`, `LP-TEST-E00/E01`, `UNIVERS-DMA-C00/C01`, `POWER-FAIL-A00/A01`, `CONFIGURATIO-D00/D04`. Plus 2019-era reverse-engineering working files: `KKK.SYMB` (946,952), `INS-1/2/3.SYMB`, `LIST-1/2/3.SYMB`, `MY-TPE.PROG`, `TPE-1/2.PROG`, `F32.*`, `FL1.*`, `set-par.txt` (289,428), `MOVEW.txt`, `float48.txt`, `reveng.txt` (hand notes with octal addresses and TPE-MON strings) |
| `(TSS)` | 39 | 2,241,683 | Time Sharing System source, every `*.SYMB` paired with an identical-size `*.SYMB.TXT`: `TSS1..TSS5.SYMB` (+ `.ORG`), `LIST.SYMB`, `LIST1..LIST5.SYMB`, `ASYMB`, `BSYMB`, `ASSYSA`, `ASSYSB`, `MINIT`, `TDUMP`. `TSS1.SYMB` decodes to a header reading `TIME SHARING SYSTEM BY ... NDA` with a symbol/default table |
| `(UE)` | 0 | 0 | empty |
| `(UNIQUE)` | 51 | 663,552 | UNIQUE II C-version, 1987: `*-EN-C.UNIQ` definitions with matching 0-byte `*.UCOM` files, `DIA-DRL-F/R-EN-C.SYMB`, `DIALOGUE-DDC-C.SYMB`, `TEXT-SYS-IN.PROG`, `UNIQUE-EN-C00.HELP`, `UNIQUE-EN-C04.UTXT`, `QUICK-EN-C03.UTXT`, `XTRA-EN-C00.UTXT`, `UE-ERMSG-EN-C03.ERR` |
| `(USER-ENVIRONMENT)` | 32 | 2,490,367 | ND User Environment C01/C02, 1987: `UE-FUNC-C02.PROG`, `UE-PSERVER-C02.PROG`, `UE-INSTALL-C01.PROG`, `UE-RENAME-A01.PROG`, `UE-CH-LAMU-C00.PROG`, `NDP-COMPILER-E.PROG`, the `UE-*-EN-C02.CONF` screens, `UE-HIERAR-EN-C02.MENU`, `UE-PLIB-*` libraries, `UE-USER-PROFILE.DATA`, `UE-IS75B-POOL.DATA` |
| `(WP)` | 28 | 2,657,739 | NOTIS-WP N04/N05 and TF: `WP-MAIN`, `WP-EDITOR`, `WP-CMD`, `WP-PRINT`, `WP-RES`, `WP-IO`, `WP-SPOL`, `WP-N-TO-M`, `WP-OUT-TO-S`, `TF-MAIN-N05`, `TF-UTIL-N05`, `TF-LIB-COMPRESS`, `NOTIS-TF-EN-N04.LIB`, `NOTIS-WP-EN-N04.HELP`, exercise texts `WP-EX-*`, `TAB-HY-EN-K00.HBRF`, `COMPRESSED.LIB` |
| `(X14)` | 8 | 222,347 | `PC-LINK.PROG`, `VTM-COMPOUND-A-C.PROG`, `VTM-COMPOUND-D-C.PROG`, `DDBTABLES-C.VTM`, `VTM-ALL-TYPES.VTM`, `DDB079-A-A.VTM`, and two 0-byte `DDB052.VTM` / `DDB999.VTM` |
| `(XMSG)` | 45 | 310,656 | XMSG inter-process-messaging examples written 2020–21: `CLIENT.*`, `SERVER.*`, `TASK1.*`, `TASK2.*`, `XTEST.*`, `XLIB.SYMB`, `XMSG-LIBRARY.*`, `FORTRAN-XLIB.*`, `NAME-PORT.*`, `LETTER.*`, `NONAME.*`, `T1.*` |
| `(ZDDBTABLES)` | 22 | 1,342,821 | A 2004-dated copy set: `DDBTABLES-C10/D10/E10/G05.VTM`, `DDB0nn` tables, `MICRO-15213.DATA`, `MICRO-PROG.OLD`, `PED-ENG-J/K.HELP`, `S3-CONFIG-E00.CNFG`, `SYMBOLS.FADM`, five `UE-ERMSG-*.ERR` |
| `Doc` | 1 | 2,713,331 | `NDEmulatorUserManual.pdf` |

### Anything that is or could be a disk image

Every one of the 723 files was passed through this repository's own detector
(`tools/dist/api/identify.js`, i.e. the `identify` CLI's engine) regardless of extension, not
just the files whose extension looked like an image. Exactly **38 files** were recognised as
carrying a filesystem: the 37 `*.IMAG` files in `(IMAGES)` and one file outside it.

Two caveats about the tooling, worth recording:

- `IMAGE_EXTENSIONS` in `tools/src/api/identify.ts` is `['.img', '.image', '.ima', '.dsk', '.gz']`.
  `.IMAG` and `.IMD` are **not** in that list, so `identify` run against a *folder* reports
  "No disk images found" for `(IMAGES)` and `(KERMIT)` alike. Handing `identify` the file path
  directly bypasses the extension filter and works. The scan above called the detector per file,
  so the extension filter did not affect the result.
- The detector does not understand ImageDisk. The four `*.IMD` files were decoded to raw sector
  images in the scratch directory before being examined.

No hard-disk or SMD image was found anywhere in the tree. The largest non-image files are
`Doc/NDEmulatorUserManual.pdf` (2,713,331), `(SCRATCH)/SCRATCH03.DATA` (2,021,376) and
`(TPE-MON)/KKK.SYMB` (946,952); none of them carries a filesystem, and none matches an ND
floppy geometry. `(EMULATOR)/SINTRAN.DATA` (699,199) is *not* a bootable SINTRAN image — after
clearing the parity bit it is plain text, a patch-macro instruction sheet.

---

## 3. The one disk image outside `(IMAGES)`

**`(KERMIT)/KERMIT.IMAG`** — 1,261,568 bytes (ND 8-inch DSDD), modified 2019-04-25.

| Property | Value |
|---|---|
| MD5 of the raw image | `0f9be52d61f157cc32bf2c96fa55a39e` |
| Filesystem | `ndfs` |
| Volume / directory name | `KOM` |
| Users | 1 — `FLOPPY-USER`, 610 pages reserved, 32 used |
| Files | 3 |

Directory listing read from the image:

```
KERMIT:PROG    23 pages    45,568 bytes
KERMIT:HLIB     1 page        420 bytes
KERMIT:HELP     4 pages     6,915 bytes
```

Those three sizes are byte-for-byte the sizes of the three loose files sitting beside it in
`(KERMIT)`, so the folder copy and the image copy hold the same three files.

**The archive does not hold this image.** `0f9be52d61f157cc32bf2c96fa55a39e` appears zero times
in `catalog/floppies.json`, and there is no `images/0f9be52d61f157cc32bf2c96fa55a39e/` folder.
No catalog entry has volume name `KOM`.

Related but not the same disk: three catalog entries mention KERMIT, and two of them list
KERMIT files — `img-101f51540b0a` (md5 `101f51540b0ab5eb162bf54f28e4ebfc`) and `img-86791f282d6b`
(md5 `86791f282d6b8920f541cd0b9a4c762e`), both currently with no volume name and **no product
assigned**. Each holds four files: `KERMIT:PROG` (23 pages), `KERMIT:HELP` (4), `KERMIT:HLIB` (1)
and additionally `KERMIT:DOC` (1). The third, `img-47ea59ee5250`, matched on the string KERMIT
somewhere in its record but lists no KERMIT files. So the archive already has a KERMIT floppy
with one file more than the emulator distribution's copy; the two are different reads or
different revisions, not duplicates.

---

## 4. Other material of preservation interest

- **The emulator itself**, in three builds each for the emulator and for XROUT: Windows PE32,
  Linux x86-64 ELF, and Raspberry Pi ARM ELF. Plus `Doc/NDEmulatorUserManual.pdf`.
  `ND110-NEW.EXE` (2022-10-22) is a later Windows build than `ND110.exe` (2021-07-02).
- **`(TSS)` — Time Sharing System source in ND assembler**, 39 files, with each `*.SYMB` mirrored
  by a same-size `*.SYMB.TXT`. Confirmed by decoding `TSS1.SYMB`, whose header reads
  `TIME SHARING SYSTEM BY ... NDA`. This is source, not a binary, and is the single largest body
  of readable ND source in the tree.
- **`(TPE-MON)` — 40-odd vendor hardware diagnostics** (`*.TEST` / `*.NEXT`, 1986–88) covering
  cache, paging, memory, instruction set, disk, floppy-streamer, printers, SCSI, Ethernet PIOC,
  Octobus, HDLC/Megalink, magtape, sync modem, async terminals, colour and graphic terminals,
  universal DMA and power-fail. Alongside them sit 2019-dated reverse-engineering notes
  (`reveng.txt`, `set-par.txt`, `MOVEW.txt`, `float48.txt`) with octal addresses and extracted
  strings such as `INSTRUCTION - Version: C03 - 1988-03-04`.
- **`(SCRATCH)/SCRATCH03.DATA`** carries the banner
  `NCT emulator program , prepared for ICAN / Version 2 20/9-85 / C-V. Sundling I.F.E. Halden` —
  the contributor's own name and institute (Institutt for energiteknikk, Halden), dated 1985.
- **`(KERMIT)/norskdata.zip`** — 27 Kermit-85 source files dated 1985-06-24, mostly Pascal
  (`*.pas`) with one MACRO source (`ndkmon.mac`) and one `.mcr`. This is the host-side ND Kermit
  source, distinct from the `KERMIT:PROG` binary.
- **`(XMSG)`** — a set of small FORTRAN XMSG client/server examples written 2020–21 (modern work,
  not vendor material), including `XLIB.SYMB` and `XMSG-LIBRARY.SYMB`.
- **`(SYSTEM)` segment files** `SEGFILE_200..204`, `SEGFILE_300..302`, `SEGFILE_400..404` plus
  `xxSEGFILE_400.SGNO` — these are the emulator's SINTRAN segment files, dated 2017–2020.
  `(SCRATCH)/SCRATCH04.DATA` is the matching segment-number map (`200 WPEDITM wp-editor-m06`,
  `300 T1 simple-main`, `400` range, …).
- **Empty files worth flagging** because their names promise content: both TELEFIX programs
  (`(TELEFIX)/TELEFIX-A-RECE-C.PROG`, `(TELEFIX)/TELEFIX-A-TRAN-C.PROG`) are 0 bytes, as are
  `(X14)/DDB052.VTM`, `(X14)/DDB999.VTM`, `(SYSTEM)/INST-BG148.COM`, `(SYSTEM)/PC-LINK_PROG.SYMB`,
  and all sixteen `(UNIQUE)/*.UCOM` files.

---

## 5. What could not be verified

- Whether `(SCRATCH)/SCRATCH01.DATA` and `SCRATCH03.DATA` are NOTIS-WP scratch buffers is
  **inferred** from the buffer names `MAIN` and `PASTE` at offsets 2 and 0x1C. No WP scratch-file
  format specification was consulted.
- What `XROUT-LOCK` is for is **unknown** — it is a zero-byte file; the name is the only evidence.
- The 37 `*.IMAG` images and 4 `*.IMD` containers in `(IMAGES)` were not re-checked against the
  archive here; that folder was covered by the earlier survey. The only claim made about them in
  this report is what the `RSH` / `CLIEN` byte search found.
- Whether any file in `(TPE-MON)`, `(TSS)` or `(SYSTEM)` also exists inside one of the archive's
  floppies was not checked — the archive is content-addressed on whole raw images, and these are
  loose files, so an MD5 comparison would not answer it. Answering it would need a per-file
  extraction of every archived NDFS image and a name+size comparison.
