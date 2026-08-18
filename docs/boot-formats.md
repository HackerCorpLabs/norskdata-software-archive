# The boot area of page 0: BPUN and FLO-MON

An NDFS floppy keeps its filesystem structures in the pages the master block
points at, and the master block sits at offset 2016 of page 0. The 2016 bytes
in front of it are the boot area.

Two different things are recorded about it, because they are two different
kinds of thing:

- `bootFormat` - what the boot area **is**: `bpun`, `binary` or `none`.
- `bootProgram` - which **program** it carries, when the image says so:
  `flomon`, or nothing.

## BPUN is a file format

BPUN ("bootable punched tape") is Norsk Data's absolute-binary container: a
memory image with a load address, a word count and a checksum. It began as a
paper tape format and was carried onto floppies and disk files unchanged, which
is why files inside the filesystem are named `NAME:BPUN`. It is produced by the
MACM assembler's `)BPUN` command and by the RT loader's BINARY-DUMP.

Layout, big-endian throughout:

| field | size | content |
|---|---|---|
| preamble | variable | optional ASCII: an octal bootstrap plus the start address and boot flags. May be absent when the file is not meant to boot stand-alone. |
| `!` | 1 | 0x21, start of data - a reader scans forward to it |
| E | 2 | load address |
| F | 2 | word count. **F = 0 means 65536 words**, not none. |
| G | F*2 | the data words |
| H | 2 | checksum: the sum of the data words, modulo 2^16 |
| I | 2 | action code / start word, 0 for no autostart |
| padding | | zeros allowed |

One BPUN file is one contiguous memory image - no relocation, no symbols, no
sections. Relocatable object code is a different ND format, BRF.

Two traps, both real: the preamble is variable-length, so never assume a fixed
header size - find the `!`; and a reader that treats F = 0 as an empty block
loads nothing from a 128 KB firmware bank file, which is exactly what F = 0 with
65536 data words is.

## FLO-MON is a program

FLO-MON (FLOPPY-MON, product LDR-2010F) is the ND floppy monitor: a small
stand-alone loader the ND-100 boots from a diskette. The operator presses
Master Clear and types `1560&`. It prints `*` and takes two commands -
`LIST-FILE` to list the `:BPUN` files on the diskette and `LOAD-FILE` to load
one into memory and start it. A diskette holding exactly one `:BPUN` file can be
autoloaded without the prompt.

FLO-MON is itself distributed as a BPUN and written into the diskette's boot
area. So a bootable ND floppy is an ND filesystem holding `:BPUN` files plus
FLO-MON as the bootstrap that reads and starts them.

The name also appears in hardware status codes: the intelligent floppy
controller's autoload firmware reports 050 for no bootstrap found on the
diskette and 051 for a wrong bootstrap, "too old flo-mon version". That is a
statement about the bootstrap program's version, still not about a data format.

Sources for both sections: ND-10022S *SINTRAN Utility Programs* (FLOPPY-MON
LDR-2010F: `1560&`, LIST-FILE / LOAD-FILE, single-file autoload), ND-06.015.02
*ND-100 Functional Description* (status 051), and the same codes in the SINTRAN
III J floppy driver comments in `S3VS-6:SYMB`, which this archive holds on
`images/8e13636b4b058f65b3868efbeec01951/AUX-SINTRAN.img.gz`.

## How it sits on the floppy

On these floppies the BPUN byte stream is written **one byte per 16-bit word** -
the high byte of every word is zero. Take the low byte of each word of page 0
and the stream reads out directly. On
`images/4db6fc93636a68b44718dce9191cacd9/DISK6.img.gz`, directory `N-10-102-I`:

```
30 2f 32 0d 0a 32 21 | 00 00 | 00 40 | 03 9a 07 52 eb 72 ... 1d 08 | c3 d6
 0  /  2 CR LF  2  !   E=0     F=64      <------- 64 data words -------> H=0xC3D6
```

`sum(data) & 0xFFFF` is `0xC3D6`, matching the stored checksum. Measured over
the archive: **215 images hold a checksum-valid block**, and the preamble in
front of the `!` states the load address in octal, twice, separated by CR LF -
proved by the images that load somewhere other than 0:

| image | preamble | E |
|---|---|---|
| `images/1329ee9dca35e3b82a1c9f672630a12d/ND-disk-00491.img.gz` | `174000` CR LF `174000` | 0174000 |
| `images/5441a618735f8140881b08b466520256/DISK28.img.gz` | `002000` CR LF `002000` | 0002000 |
| `images/72e6a915c59d77dfebd32a12780b8641/ND-disk-00319.img.gz` | `066000` CR LF `066000` | 0066000 |

The FLO-MON floppies load at 0, so their preamble should read `0` CR LF `0`. It
reads `0/2` CR LF `2`. **What `/2` and the second `2` mean is unknown** - the
byte sequence appears nowhere else in any image here, packed or one byte per
word, and nothing under `docs/nd/` explains it.

## What the 64 words are: the floppy bootstrap

The data section is a sector-read loop against the FLP-PIO1 floppy controller at
device numbers 1560-1567, with a retry path through the second status register.
Disassembled at load address 0:

```
000002  165562   IOX 1562        read status
000005  165563   IOX 1563        write control word
000007  165565   IOX 1565        write drive address
000016  165567   IOX 1567        write sector
000021  165562   IOX 1562        poll
000025  124017   JMP 17          error path, reads status register 2
000033  165560   IOX 1560        read data buffer
000041  006400   STA ,X ,B 0     store the word into memory
000042  132776   JMP -2          transfer loop
000043  125032   JMP I 32        enter the monitor
000050  151077   WAIT
```

Device 1560 is the controller the operator addresses with `1560&`.

## The monitor above it

On most of these floppies the rest of page 0 holds FLO-MON itself, packed 16
bits to the word. Layout on `DISK6.img.gz`:

| bytes | content |
|---|---|
| 0 - 281 | the BPUN block, one byte per word, 141 words |
| 282 - 283 | `00 00` |
| 284 - 319 | 36 bytes of fill (`0x5E` here; `0xE5`, `0x40` or `0xF6` on other builds) |
| 320 - 2003 | the FLO-MON program, packed 16 bits to the word |
| 2004 - 2015 | 12 bytes of the same fill |
| 2016 | the NDFS master block |

Byte 284 is where the high bytes stop being zero, and it is not a free
parameter - it is where the load block ends.

At byte 320 sits a null-terminated table of (name pointer, routine address) word
pairs, then the command names `LIST-FILE'` `LOAD-FILE'` `PLACE-FILE'` `OPCOM'`
`HELP'` and the messages `$TOO LONG LINE$'` `$ILLEGAL CHARACTER$'`
`$LOG. DEV: '` `$FILE NAME: '` `$EMPTY FILE$'` `$NO BIT FILE$'`
`$WRONG WORDCOUNT$'` `$CHECKSUM ERR$'` `$PLACED$'`. Page-0 word index minus 80
gives the FLO-MON address - verified on all 14 name pointers of three different
builds. The routine addresses in that table run past the end of page 0, so the
monitor's body continues on the sectors the bootstrap reads. **Which sectors,
and where in memory they land, is not established here.**

Those command names are how `bootProgram` is decided. 195 images carry them.
25 images hold a valid block with no monitor text on page 0 at all - the
bootstrap is there and the monitor body is not (`KALIFENS-SKIFA-2`, `OLLE-OE-1`,
`MIKAEL-6` among them); they are recorded as `bootFormat: bpun` with no
`bootProgram`.

## The boot areas are not all the same

Hashing bytes 18..2015 gives **48 distinct boot areas** across the 202 images
that carry the standard leader: group sizes 36, 20, 20, 19, 15, 14, 9, 6 and a
tail of 27 singletons. They do not follow product, directory name or geometry -
the largest group spans 11 products and four page counts. They follow the
FLO-MON build:

- one build has only `LIST-FILE` and `LOAD-FILE` and says `$NO SUCH COMMAND$`,
  `$END OF FILE$`, `$FATAL ERROR$`;
- another adds `PLACE-FILE`, `OPCOM` and `HELP` and says `$ILLEGAL CHARACTER$`,
  `$WRONG WORDCOUNT$`, `$CHECKSUM ERR$`;
- a third spells those out as `$TRANSFER ERROR$` and `$CHECKSUM ERROR$`;
- one has no `OPCOM` and an extra `$NO USER 0$`.

No version string is stored in the boot area, so **the builds cannot be
ordered** - the wording differences are all there is. The 64-word bootstrap
underneath is far more stable than the monitor above it: only 10 distinct blocks
across the same images.

## How this repo detects it

`tools/src/api/boot-format.ts` reads the low byte of every word, tries **every**
`!` on the page rather than only the first, and accepts a block only when the
checksum adds up. `readBootBlock()` returns the load address, the word count
(reporting F = 0 as 65536), the checksum, the action word and the preamble text.
`detectBootFormat()` returns `bpun` when a block validates, `binary` when the
area holds something that is not a block, `none` when it is empty or one
repeated fill value. `detectBootProgram()` returns `flomon` on the monitor's
command names.

This replaced `detectBootFormat()` in the bundled parser
(`externals/norskdata-ndfs/ndfs-ts/src/boot-loader.ts`, lines 25-68), which is
still wrong there and is no longer called by this repo. It reads the words after
the first `0x21` **packed**, so it validates nothing:

- Scanning every `!` position in page 0 of all 1102 images and validating packed
  gives **zero** valid blocks under either checksum convention. Scanning one
  byte per word gives 215. Every one of the 233 `bpun` results the old test
  produced was a stray `0x21` in ordinary data followed by a non-zero word.
- 16 images with a checksum-valid block were reported as `bpun` or as nothing;
  in 12 of them the 64-word bootstrap is byte-identical to one on a floppy the
  old test did recognise.
- `loadBootCode()` sums `address + count + data` (lines 148-153). Under that
  rule 0 images validate; under the sum of the data words alone, 200 of the 202
  do. `count` is certainly not in the sum. Whether `address` is cannot be
  decided from this archive, because it is 0 on every image that has a monitor.
- The old test also had no idea what medium it was reading: a BACKUP-SYSTEM
  volume (`VOL1`, owner `AGNETA`, set `INVENT`) came back as a boot format
  because a `0x21` at offset 283 was followed by four zero bytes. `bootFormat`
  is now written only for `filesystem: ndfs` and for images with no readable
  filesystem, never for DOS, tar, BACKUP-SYSTEM or WINCH-TO-FLOPP volumes.

`MasterBlock.fromBytes()` carries a second copy of the old FLOMON test
(`master-block.ts`, `detectFlomon`, lines 120-140) which scans only the first
256 bytes; it is unused by this repo and equally unvalidated.

## A boot area survives a filesystem that does not

The boot area is independent of the filesystem structures - reading it needs
page 0 and nothing else - so a floppy whose master block or index pages are
damaged still says what its boot area holds.

The importer does not take advantage of that: `tools/src/api/import.ts`
constructs the filesystem first and reads the boot area only afterwards, so when
the parse throws the boot format is lost with it.
`images/5abb5522f2307a0e61bf5e98d5838ae9/DISK1.img.gz` is the example that
prompted this file - a valid BPUN block, the FLO-MON monitor, an intact master
block (`N-10-102-I`, object 149 / user 151 / bit 153), and exactly one bad page,
151, the user index, which is enough to make the parser throw.

## Unknowns

- What `/2` and the trailing `2` in the FLO-MON preamble mean.
- Whether the checksum includes the address word; it is 0 wherever it could be
  tested here.
- Which sectors hold FLO-MON's body and where in memory the bootstrap puts them.
  The on-diskette placement of the monitor is not established anywhere in this
  archive.
- The chronological order of the 48 builds.
- Why the fill run after the block is exactly 36 bytes, and why the fill byte
  differs between builds.
