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
  /**
   * bytes of the file present in this image. This is the file's own length,
   * not the space it took on the media: the blocks are written whole and a
   * SINTRAN file occupies whole pages, so the tail of the last block - and on
   * a preallocated file whole blocks after it - is not part of the file.
   */
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
 * How many of the bytes written for a file actually belong to it.
 *
 * BACKUP-SYSTEM writes whole blocks, and SINTRAN allocates files in whole
 * pages, so the blocks after the last byte of the file carry whatever was on
 * the media before - for a preallocated file that is tens of kilobytes. HDR2
 * records SINTRAN's own byte count for the file at 31..40, and it is the only
 * thing on the volume that says where the file really stops. Over the 36
 * backup volumes in this archive, 152 of 458 files hold fewer bytes than their
 * block count implies.
 *
 * The count is one short on some files. Of 248 files where the boundary lands
 * on a line end, 189 have CR at index count-1 and LF at index count, with the
 * block fill starting only at count+1, so that LF is part of the file; the
 * other 59 have LF at count-1 and the fill already at count. Keeping a
 * trailing LF when one is there covers both.
 *
 * The count is not usable everywhere: it is 0 on binary files whose byte
 * pointer SINTRAN never maintained (a :DUMP of two blocks reads 0), and it can
 * exceed what this volume holds when the file is continued on the next one.
 * Both fall back to the whole block region.
 */
/**
 * True when a stretch of the image is unwritten media rather than file content.
 *
 * A file closed by no EOF1 label ran to the end of the volume, and BACKUP-SYSTEM
 * writes the HDR1 label before it writes the data, so a header can be followed
 * by nothing at all: on img-49fe9da76a2b the last label names
 * BMUS-GRAFIK-01:SYMB and the 196,096 bytes after it are 0x00 and 0xE5 only,
 * while the whole file, 79,449 bytes of PLANC source, sits on the next volume
 * of the run under its own header and EOF1. Formatters leave 0x40, 0xE5, 0x76
 * or 0x5E behind, and an erased area reads as 0x00; two distinct values allow
 * for the boundary between an erase pattern and a format pattern. Five files
 * across the 36 backup volumes in this archive are fill from end to end.
 */
function isAllFill(b: Uint8Array, from: number, len: number): boolean {
  if (len <= 0) return false;
  const FILL = [0x00, 0x40, 0x5e, 0x76, 0xe5];
  const seen = new Set<number>();
  const end = Math.min(from + len, b.length);
  for (let i = from; i < end; i++) {
    const v = b[i];
    if (!FILL.includes(v)) return false;
    seen.add(v);
    if (seen.size > 2) return false;
  }
  return true;
}

function fileBytes(b: Uint8Array, dataOffset: number, region: number, byteCount: number | null): number {
  if (byteCount === null || byteCount <= 0 || byteCount > region) return region;
  let len = byteCount;
  if (len < region && (b[dataOffset + len] & 0x7f) === 0x0a) len++;
  return len;
}

/**
 * Read a BACKUP-SYSTEM volume.
 *
 * Label group layout, confirmed on ND-disk-00131c:
 *   VOL1 at 0            volume id at 4 (6), owner at 37 (13)
 *   HDR1 at 512 or 1024  name 4..20, type 21..26, sequence 31..34,
 *                        date 41..46, block count 54..59, system 60..72
 *   HDR2 at HDR1+80      record format at 4, block length at 5..9 ("02048"),
 *                        SINTRAN byte count at 31..40
 *   UHL1 at HDR1+160     ND-private binary, not needed for a listing
 *
 * The label group occupies TWO sectors: the labels, then a sector of fill
 * (0x40 on most volumes, 0xe5, 0x76 or 0x5e on others). File data therefore
 * starts at HDR1 + 2 * sectorSize, on the 512 byte sector volumes as well as
 * the 1024 byte ones.
 *
 * The data is blockCount * blockLength bytes. A one sector "EOF*" tape mark
 * follows it and the EOF1 label group sits one sector after that: on every
 * one of the 192 files on 512 byte sector volumes and 271 of 288 on 1024 byte
 * ones, "EOF*" is exactly at dataOffset + blocks * blockLength and EOF1
 * exactly one sector later (the rest are labels left over from an older backup
 * that pair up wrongly). Measuring the data as "HDR1 to the next EOF1"
 * instead, which is what this did before, hands out the leading fill sector
 * and the trailing EOF* sector as if they were file content.
 */
export function readBackupVolume(b: Uint8Array): BackupVolume {
  if (!isBackupVolume(b)) throw new Error('Not a BACKUP-SYSTEM volume');
  const sectorSize = matches(b, 1024, 'HDR1') ? 1024 : 512;
  const blockLength = parseInt(ascii7(b, sectorSize + 85, 5), 10) || 2048;

  const files: BackupFile[] = [];
  let pending: BackupFile | null = null;
  // The block length and byte count read from the HDR2 of the pending file.
  let pendingBlock = blockLength;
  let pendingBytes: number | null = null;

  const digits = (off: number, len: number): number | null => {
    const s = ascii7(b, off, len).trim();
    return /^\d+$/.test(s) ? parseInt(s, 10) : null;
  };

  for (let off = sectorSize; off + 80 <= b.length; off += sectorSize) {
    if (matches(b, off, 'HDR1')) {
      // Close an unterminated previous file: it ran to here.
      if (pending) {
        const region = Math.max(0, off - pending.dataOffset);
        pending.dataLength = isAllFill(b, pending.dataOffset, region)
          ? 0
          : fileBytes(b, pending.dataOffset, region, pendingBytes);
        pending.continued = true;
        files.push(pending);
      }
      const name = ndString(ascii7(b, off + 4, 17));
      const type = ndString(ascii7(b, off + 21, 6));
      pendingBlock = (matches(b, off + 80, 'HDR2') ? digits(off + 85, 5) : null) ?? blockLength;
      pendingBytes = matches(b, off + 80, 'HDR2') ? digits(off + 111, 10) : null;
      pending = {
        name, type,
        fullName: type ? `${name}:${type}` : name,
        sequence: parseInt(ascii7(b, off + 31, 4), 10) || 0,
        created: ansiDate(ascii7(b, off + 41, 6)),
        system: ascii7(b, off + 60, 13).trim(),
        blocks: null,
        dataOffset: off + 2 * sectorSize,
        dataLength: 0,
        continued: false,
        stale: false,
      };
      continue;
    }
    if (matches(b, off, 'EOF1') && pending) {
      // An EOF1 closes a file only when it names that file. BACKUP-SYSTEM does
      // not erase the media first, so a label from an older run survives where
      // the new run did not overwrite it, and pairing a HDR1 with whatever EOF1
      // comes next then measures the file against a stranger: on
      // ND-disk-00331b the label for XTEST:PRNT was closed by an EOF1 naming
      // MOTE-SUPPORT:H, and UNIX:H written on day 90067 by one written on
      // 90070. A label that names a different file is left where it is and the
      // scan carries on; the file it belongs to is then measured by the span to
      // the next label, the same as any file whose own EOF1 was lost.
      const eofName = ndString(ascii7(b, off + 4, 17));
      const eofType = ndString(ascii7(b, off + 21, 6));
      const eofFull = eofType ? `${eofName}:${eofType}` : eofName;
      if (eofFull !== pending.fullName) continue;
      const blocks = digits(off + 54, 6);
      pending.blocks = blocks;
      // Believe the block count only when the "EOF*" tape mark is where it says
      // the data ends. Labels left over from an older backup pair a HDR1 with
      // an EOF1 that belongs to a different file, and its block count then
      // names either far more or far less than lies between the two labels.
      // Where it cannot be believed, fall back to the span between the labels
      // less the one sector the tape mark occupies.
      const blockEnd = blocks === null ? -1 : pending.dataOffset + blocks * pendingBlock;
      const region = (blockEnd >= 0 && blockEnd <= off && matches(b, blockEnd, 'EOF*'))
        ? blocks! * pendingBlock
        : Math.max(0, off - pending.dataOffset - sectorSize);
      pending.dataLength = fileBytes(b, pending.dataOffset, region, pendingBytes);
      files.push(pending);
      pending = null;
    }
  }
  if (pending) {
    const region = Math.max(0, b.length - pending.dataOffset);
    pending.dataLength = isAllFill(b, pending.dataOffset, region)
      ? 0
      : fileBytes(b, pending.dataOffset, region, pendingBytes);
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
