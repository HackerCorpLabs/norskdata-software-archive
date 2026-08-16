/**
 * ndbackup - readers for the two Norsk Data floppy backup formats.
 *
 * They are unrelated to each other and to NDFS:
 *
 *   BACKUP-SYSTEM ("VOL1")   an ANSI/ISO labelled tape-style volume written to
 *                            a floppy. Labels name every file, so the contents
 *                            can be listed and extracted from one disk.
 *
 *   WINCH-TO-FLOPP           a page-level dump of a whole ND directory spread
 *                            over a set of floppies. There are no file names on
 *                            the media at all - only a map saying which page of
 *                            the original filesystem each stored page was. File
 *                            names appear only after every volume of the set is
 *                            reassembled into a directory image and parsed as
 *                            NDFS.
 *
 * Layouts verified against real images in this archive; see the field comments.
 * No Node-only APIs, so this runs in the browser as well.
 */

// ── shared helpers ───────────────────────────────────────────

/** ND text is often written with the parity bit set; compare on 7 bits. */
function ascii7(b: Uint8Array, off: number, len: number): string {
  let s = '';
  for (let i = 0; i < len && off + i < b.length; i++) {
    const c = b[off + i] & 0x7f;
    s += (c >= 0x20 && c <= 0x7e) ? String.fromCharCode(c) : ' ';
  }
  return s;
}

function matches(b: Uint8Array, off: number, text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (off + i >= b.length) return false;
    if ((b[off + i] & 0x7f) !== text.charCodeAt(i)) return false;
  }
  return true;
}

/** ND strings are terminated by an apostrophe and padded with spaces. */
function ndString(raw: string): string {
  const q = raw.indexOf("'");
  return (q === -1 ? raw : raw.slice(0, q)).trim();
}

/** ANSI ` YYDDD` day-of-year date -> "YYYY-MM-DD", or null. */
function ansiDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{2})(\d{3})$/);
  if (!m) return null;
  const year = 1900 + parseInt(m[1], 10);
  const day = parseInt(m[2], 10);
  if (day < 1 || day > 366) return null;
  const d = new Date(Date.UTC(year, 0, day));
  return d.toISOString().slice(0, 10);
}

// ── BACKUP-SYSTEM: ANSI labelled volume ──────────────────────

export interface BackupFile {
  /** SINTRAN file name, e.g. TIDPLAN-INV */
  name: string;
  /** SINTRAN file type, e.g. TEXT, SYMB, DATA */
  type: string;
  /** "NAME:TYPE" as SINTRAN would write it */
  fullName: string;
  /** file sequence number on the volume, 1-based */
  sequence: number;
  /** creation date from the label, "YYYY-MM-DD" */
  created: string | null;
  /** system code, e.g. "SINTRAN III L" */
  system: string;
  /** blocks recorded in EOF1, null when the file is continued on the next volume */
  blocks: number | null;
  /** byte offset of the file's data in this image */
  dataOffset: number;
  /** bytes of data present in this image */
  dataLength: number;
  /** true when no EOF1 follows: the file continues on the next volume of the set */
  continued: boolean;
  /**
   * true when this label belongs to an OLDER backup still present on the disk.
   * BACKUP-SYSTEM does not erase the media first, so labels from a previous run
   * survive in areas the new run did not overwrite - they are recognisable by a
   * different system code or creation date from the run that starts the volume.
   */
  stale: boolean;
}

export interface BackupVolume {
  kind: 'backup';
  /** volume identifier from VOL1, e.g. BACK */
  volumeId: string;
  /** owner identifier from VOL1, e.g. AGNETA */
  owner: string;
  /** sector size the labels are aligned to (512 or 1024) */
  sectorSize: number;
  /** data block length from HDR2, normally 2048 */
  blockLength: number;
  files: BackupFile[];
}

/** True when the image is an ANSI-labelled BACKUP-SYSTEM volume. */
export function isBackupVolume(b: Uint8Array): boolean {
  if (b.length < 2048 || !matches(b, 0, 'VOL1')) return false;
  return [512, 1024].some(s => matches(b, s, 'HDR1') && matches(b, s + 80, 'HDR2'));
}

/**
 * Read a BACKUP-SYSTEM volume.
 *
 * Label group layout, confirmed on ND-disk-00131c:
 *   VOL1 at 0            volume id at 4 (6), owner at 37 (13)
 *   HDR1 at 512 or 1024  name 4..20, type 21..26, sequence 31..34,
 *                        date 41..46, block count 54..59, system 60..72
 *   HDR2 at HDR1+80      record format at 4, block length at 5..9 ("02048")
 *   UHL1 at HDR1+160     ND-private binary, not needed for a listing
 * File data starts one sector after HDR1 and runs to the next EOF1 label.
 */
export function readBackupVolume(b: Uint8Array): BackupVolume {
  if (!isBackupVolume(b)) throw new Error('Not a BACKUP-SYSTEM volume');
  const sectorSize = matches(b, 1024, 'HDR1') ? 1024 : 512;
  const blockLength = parseInt(ascii7(b, sectorSize + 85, 5), 10) || 2048;

  const files: BackupFile[] = [];
  let pending: BackupFile | null = null;

  for (let off = sectorSize; off + 80 <= b.length; off += sectorSize) {
    if (matches(b, off, 'HDR1')) {
      // Close an unterminated previous file: it ran to here.
      if (pending) {
        pending.dataLength = Math.max(0, off - pending.dataOffset);
        pending.continued = true;
        files.push(pending);
      }
      const name = ndString(ascii7(b, off + 4, 17));
      const type = ndString(ascii7(b, off + 21, 6));
      pending = {
        name, type,
        fullName: type ? `${name}:${type}` : name,
        sequence: parseInt(ascii7(b, off + 31, 4), 10) || 0,
        created: ansiDate(ascii7(b, off + 41, 6)),
        system: ascii7(b, off + 60, 13).trim(),
        blocks: null,
        dataOffset: off + sectorSize,
        dataLength: 0,
        continued: false,
        stale: false,
      };
      continue;
    }
    if (matches(b, off, 'EOF1') && pending) {
      pending.blocks = parseInt(ascii7(b, off + 54, 6), 10);
      pending.dataLength = Math.max(0, off - pending.dataOffset);
      files.push(pending);
      pending = null;
    }
  }
  if (pending) {
    pending.dataLength = Math.max(0, b.length - pending.dataOffset);
    pending.continued = true;
    files.push(pending);
  }

  // The run is defined by the first label on the volume; anything written by a
  // different SINTRAN version or on a different date is left over from an older
  // backup that this one did not overwrite.
  if (files.length) {
    const runSystem = files[0].system;
    const runDate = files[0].created;
    for (const f of files) {
      f.stale = f.system !== runSystem || f.created !== runDate;
    }
  }

  return {
    kind: 'backup',
    volumeId: ndString(ascii7(b, 4, 6)),
    owner: ndString(ascii7(b, 37, 13)),
    sectorSize, blockLength, files,
  };
}

/** The bytes of one file on a BACKUP-SYSTEM volume. */
export function readBackupFile(b: Uint8Array, file: BackupFile): Uint8Array {
  const end = Math.min(file.dataOffset + file.dataLength, b.length);
  return b.subarray(file.dataOffset, end);
}

// ── WINCH-TO-FLOPP: page dump of a directory ─────────────────

export interface WinchPage {
  /** page number in the ORIGINAL directory */
  pageNumber: number;
  /** byte offset of that page within this image */
  offset: number;
}

export interface WinchVolume {
  kind: 'winch';
  /** this volume's number in the set, 1-based */
  volumeNumber: number;
  /** total volumes in the set */
  totalVolumes: number;
  /** name of the directory that was backed up */
  directoryName: string;
  /** free-text label written when the backup was made */
  label: string;
  pageSize: number;
  /** where the page data starts (after the 16 KB header) */
  dataOffset: number;
  pages: WinchPage[];
  /**
   * How many pages the header says this volume holds, counted over the whole
   * page list rather than over what fits in the image. An image that stores
   * fewer pages than this is an incomplete read of the floppy - in this archive
   * that is usually a one-sided read of a double-sided 8 inch disk.
   */
  listedPages: number;
}

const WINCH_HEADER = 16384;
const WINCH_PAGE = 2048;

/** True when the image is a WINCH-TO-FLOPP volume. */
export function isWinchVolume(b: Uint8Array): boolean {
  if (b.length < WINCH_HEADER + WINCH_PAGE) return false;
  const be16 = (o: number) => (b[o] << 8) | b[o + 1];
  const be32 = (o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
  const volume = be16(0), total = be16(68);
  if (volume < 1 || total < 1 || volume > total || total > 256) return false;
  for (let i = 70; i < 76; i++) if (b[i] !== 0) return false;
  let sawQuote = false;
  for (let i = 2; i < 18; i++) {
    const c = b[i] & 0x7f;
    if (c === 0x27) { sawQuote = true; break; }
    if (c !== 0 && (c < 0x20 || c > 0x7e)) return false;
  }
  return sawQuote && be32(76 + 32) === 8;
}

/**
 * Read a WINCH-TO-FLOPP volume header and its page map.
 *
 * Header (big-endian), per ND-60.250.1 and flopp-to-winch.c:
 *   0    2      volume counter, first volume is 1
 *   2    16     directory name, apostrophe-terminated
 *   18   50     free text
 *   68   2      total volumes in the set
 *   76   ...    records of eight 32-bit page numbers then a running count;
 *               0xFFFFFFFF marks an unused slot, a count of 0 ends the list
 *   16384       the stored pages, 2048 bytes each
 */
export function readWinchVolume(b: Uint8Array): WinchVolume {
  if (!isWinchVolume(b)) throw new Error('Not a WINCH-TO-FLOPP volume');
  const be16 = (o: number) => (b[o] << 8) | b[o + 1];
  const be32 = (o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

  // Slot handling follows flopp-to-winch.c exactly:
  //   - the list is walked for (image size - header) / page size SLOTS, not for
  //     the whole 16 KB list, which names more pages than fit on the media;
  //   - a record whose running count is 0 ends a short volume;
  //   - an unused slot (0xFFFFFFFF) is skipped WITHOUT consuming a stored page,
  //     so it must not advance the read position.
  const slotLimit = Math.max(0, Math.floor((b.length - WINCH_HEADER) / WINCH_PAGE));
  const pages: WinchPage[] = [];
  let stored = 0;
  let slot = 0;
  for (let rec = 76; rec + 36 <= WINCH_HEADER && slot < slotLimit; rec += 36) {
    const count = be32(rec + 32);
    if (count === 0) break;                       // short volume: end of the list
    for (let i = 0; i < 8; i++, slot++) {
      const pageNumber = be32(rec + i * 4);
      if (pageNumber === 0xffffffff) continue;    // unused slot: no page stored
      const offset = WINCH_HEADER + stored * WINCH_PAGE;
      if (offset + WINCH_PAGE > b.length) break;
      pages.push({ pageNumber, offset });
      stored++;
    }
  }

  // The full page list, independent of how much of the floppy was imaged.
  let listedPages = 0;
  for (let rec = 76; rec + 36 <= WINCH_HEADER; rec += 36) {
    if (be32(rec + 32) === 0) break;
    for (let i = 0; i < 8; i++) if (be32(rec + i * 4) !== 0xffffffff) listedPages++;
  }

  return {
    kind: 'winch',
    volumeNumber: be16(0),
    totalVolumes: be16(68),
    listedPages,
    directoryName: ndString(ascii7(b, 2, 16)),
    label: ascii7(b, 18, 50).trim(),
    pageSize: WINCH_PAGE,
    dataOffset: WINCH_HEADER,
    pages,
  };
}

/** One stored page of a WINCH-TO-FLOPP volume. */
export function readWinchPage(b: Uint8Array, page: WinchPage): Uint8Array {
  return b.subarray(page.offset, Math.min(page.offset + WINCH_PAGE, b.length));
}
