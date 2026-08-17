# Media condition

Most images in this archive can be read: a floppy holds an ND filesystem, an
MS-DOS filesystem, a SINTRAN III BACKUP-SYSTEM volume, a WINCH-TO-FLOPP volume
or a tar archive, and the catalog can list what is on it.

Some cannot, and they are not all the same kind of "cannot". The `condition`
block in a floppy's YAML records the difference.

## damaged

```yaml
filesystem: ndfs
condition:
  status: damaged
  parser: ndfs
  parserError: Invalid NDFS master block
  ndNamesFound: 26
  ndNameSamples:
    - VTM-EMBD:BRF
    - DDBTABLES:VTM
    - ISAM-DUMP:DUMP
```

**What it means.** The image holds ND material, but the filesystem structures
cannot be read, so no file list can be produced.

**How it is decided.** Two things must both hold:

1. The NDFS parser refuses the image, even after the bytes are padded up to a
   whole number of 2048-byte pages. The message it gave is kept in
   `parserError` - usually `Invalid NDFS master block` or `Block N out of range`,
   which is a directory pointing at pages that are not there.
2. At least three distinct ND-style file names are present in the raw bytes.
   SINTRAN writes names as `NAME:TYPE`, and they survive with the parity bit set
   long after the directory that indexed them is gone. The count is in
   `ndNamesFound` and a few of them in `ndNameSamples`.

The second test is what separates a damaged ND floppy from a blank disk or a
failed read of nothing at all: a blank disk contains no names.

**Why `filesystem` still says `ndfs`.** Because it is an ND floppy. The disk is
not a mystery and not empty - it is ND material that this archive cannot yet
read. Recording it as "no filesystem" would file it with the blank media and
hide it from anyone looking for ND disks.

**What to expect from one.** No volume name, no file list, no extraction. The
bytes are all there is, so the hex viewer is the way in - the file names in
`ndNameSamples` are visible in it, and are often enough to recognise what the
disk was. A damaged floppy stays in the matcher's unreadable queue, because
there is no name to match a product on.

**Recovered listings.** When the file list could be rebuilt, the `condition`
block carries a `recovery` block as well and the `ndfs` file list exists:

```yaml
condition:
  status: damaged
  parserError: Invalid NDFS master block
  recovery:
    status: recovered
    layout: {object: 150, user: 152, bit: 77}
    filesRecovered: 16
    namesConfirmedInBytes: 16      # 100%
    confirmRatio: 1
```

The master block at offset 2016 of page 0 holds the pointers to the object,
user and bit files, and SINTRAN lays out a given geometry the same way - 154 and
156 page floppies use object 150, user 152, bit 77; 616 and 640 page floppies
use 508, 510, 306 - so the pointers can be taken from floppies that read
cleanly. A reconstruction is accepted only when the names it produces are
confirmed by the strings actually present in that image (80% by default, and
the nine accepted so far came back at 96-100%); a pointer landing on the wrong
page produces names found nowhere, and is refused. The rule and the proof are in
`tools/src/lib/ndfsrecover/` and `tools/scripts/ndfs-recovery-proof.mjs`.

Such a listing is marked **recovered** in the catalog and on the disk page, and
the file sizes and dates that come with it are not to be trusted the way a clean
read is - only the names are backed by evidence.

**The stored image is never modified.** Recovery happens on a copy in memory.
The disk page offers a second download, *Download repaired .img*, which is built
on request from the original by writing back the reconstructed pointers - 15
bytes inside the master block, nothing else - so an emulator or the NDFS viewer
can read it. That file is not kept anywhere: the archive holds only what came
off the physical floppy.

**What would change it.** A better read of the same physical disk. Several of
these are one of a set of repeat reads where every attempt failed differently,
so a fresh read - or reading the other side, for the 8 inch double-sided disks -
may well produce a floppy that parses.

## no filesystem

`filesystem: none` with no `condition` block: nothing recognisable was found and
there is no ND material in the bytes either. These are blank or freshly
formatted media (a near-uniform fill of `0xE5`, `0x40` or `0xF6`), or reads that
produced nothing usable.

## Where it shows

- The catalog listing marks a damaged image in the Media column and can filter
  on it: **Condition - Any / Readable / Damaged only**.
- `make check` accepts both; the condition block is metadata, not an error.
- Detection is re-runnable, so an image re-imaged later is re-assessed:
  `make identify PATH_=<file>` for a loose file, or the detect button in the
  local web UI for one already in the archive.
