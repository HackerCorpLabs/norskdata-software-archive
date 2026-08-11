/**
 * What filesystem, if any, is on a floppy image.
 *
 * Most images in this archive hold an ND filesystem, but a real collection also
 * contains MS-DOS floppies (the ND-OWS / NORTEXT PC material), tar archives
 * written straight to the media (the SIBAS/R Unix libraries), disks that were
 * simply never written, and failed reads. Without recording which is which,
 * they all look identical in the catalog: a floppy with no contents.
 *
 * Detection reads only the first sectors, so it is cheap enough to run on
 * every import.
 */

import { DosVolume } from '../lib/dosfs/index.js';

export type FilesystemKind = 'ndfs' | 'dos' | 'tar' | 'backup' | 'winch' | 'none';

/**
 * A v7 (pre-POSIX) tar has no "ustar" magic - `file` identifies it by the
 * header checksum, and so do we. Checking that first avoids mistaking a tar
 * for a FAT disk.
 */
export function looksLikeTar(buf: Buffer): boolean {
  if (buf.length < 512) return false;
  const name = buf.subarray(0, 100);
  const end = name.indexOf(0);
  const nameBytes = end === -1 ? name : name.subarray(0, end);
  if (nameBytes.length === 0) return false;
  for (const c of nameBytes) if (c < 0x20 || c > 0x7e) return false;

  const field = buf.subarray(148, 156).toString('ascii').split('\0')[0].trim();
  if (!/^[0-7]+$/.test(field)) return false;
  const stored = parseInt(field, 8);

  let sum = 0;
  for (let i = 0; i < 512; i++) sum += (i >= 148 && i < 156) ? 0x20 : buf[i];
  return sum === stored;
}

/**
 * FAT12/16 boot sector. Checked by the BIOS parameter block rather than the
 * 0x55AA signature alone, because some ND-era disks were formatted by tools
 * that left the signature out.
 */
export function looksLikeDos(buf: Buffer): boolean {
  if (buf.length < 1024) return false;
  const bytesPerSector = buf.readUInt16LE(11);
  const sectorsPerCluster = buf[13];
  const reserved = buf.readUInt16LE(14);
  const numFats = buf[16];
  const mediaDescriptor = buf[21];

  if (![512, 1024, 2048, 4096].includes(bytesPerSector)) return false;
  if (![1, 2, 4, 8, 16, 32, 64, 128].includes(sectorsPerCluster)) return false;
  if (reserved === 0) return false;
  if (numFats < 1 || numFats > 2) return false;
  if (mediaDescriptor < 0xf0) return false;

  // The first FAT byte repeats the media descriptor on a real FAT volume.
  const fatStart = reserved * bytesPerSector;
  if (fatStart + 1 >= buf.length) return false;
  return buf[fatStart] === mediaDescriptor;
}

/**
 * A SINTRAN III BACKUP-SYSTEM volume: an ANSI/ISO labelled tape-style volume
 * written to a floppy, not a filesystem. VOL1 at the start, then a label group
 * (HDR1 + HDR2 + ND's own UHL1) at the first or second sector boundary, with
 * file data in between and EOF1 closing each file.
 *
 * Verified against ND-disk-00131c: VOL1 at 0 (volume "BACK'", owner "AGNETA'"),
 * HDR1 at 0x400 (file TIDPLAN-INV, type TEXT, " 89181", "SINTRAN III L"),
 * HDR2 "U02048" at 0x450, EOF1 at 0x1800.
 *
 * Not to be confused with the WINCH-TO-FLOPP format, which has no ANSI labels
 * at all - a 16 KB binary header followed by 2048-byte pages.
 */
export function looksLikeNdBackup(buf: Buffer | Uint8Array): boolean {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (b.length < 2048) return false;
  // ND text is often written with the parity bit set, so compare on 7 bits.
  const at = (off: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      if (off + i >= b.length) return false;
      if ((b[off + i] & 0x7f) !== text.charCodeAt(i)) return false;
    }
    return true;
  };
  if (!at(0, 'VOL1')) return false;
  for (const hdr1 of [512, 1024]) {
    if (!at(hdr1, 'HDR1')) continue;
    // HDR2 follows 80 bytes later and states the block length.
    if (at(hdr1 + 80, 'HDR2') && at(hdr1 + 85, '02048')) return true;
  }
  return false;
}

/**
 * A WINCH-TO-FLOPP volume: a backup of an ND directory (winchester) spread over
 * a set of floppies. No labels and no filesystem - a 16 KB binary header
 * followed by raw 2048-byte pages, where the header says which page of the
 * original directory each one came from.
 *
 * Header layout (ND-60.250.1 BACKUP USER GUIDE, all big-endian):
 *   0    2      volume counter, first volume is 1
 *   2    16     directory name, apostrophe-terminated, zero padded
 *   18   50     free text, space padded (computer name, date)
 *   68   2      total volumes in the set
 *   70   6      reserved, zero
 *   76   16308  page list: records of 8 page offsets + a page count
 *                (8, 16, 24 ...), unused offsets 0xFFFFFFFF, terminated by a
 *                record whose count is 0
 *   16384       the pages themselves, 2048 bytes each
 */
export function looksLikeWinchBackup(buf: Buffer | Uint8Array): boolean {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (b.length < 16384 + 2048) return false;
  const be16 = (o: number) => (b[o] << 8) | b[o + 1];
  const be32 = (o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

  const volume = be16(0);
  const total = be16(68);
  if (volume < 1 || total < 1 || volume > total || total > 256) return false;

  // reserved words must be zero
  for (let i = 70; i < 76; i++) if (b[i] !== 0) return false;

  // directory name: printable (parity bit ignored) up to the apostrophe
  let sawApostrophe = false;
  for (let i = 2; i < 18; i++) {
    const c = b[i] & 0x7f;
    if (c === 0x27) { sawApostrophe = true; break; }
    if (c !== 0 && (c < 0x20 || c > 0x7e)) return false;
  }
  if (!sawApostrophe) return false;

  // first page-list record: eight offsets then a count of 8
  if (be32(76 + 8 * 4) !== 8) return false;
  for (let i = 0; i < 8; i++) {
    const page = be32(76 + i * 4);
    if (page !== 0xffffffff && page > 0x000fffff) return false;   // implausible page number
  }
  return true;
}

/**
 * Classify an image. `ndfsParsed` is whether the NDFS parser found a
 * filesystem - that is the authority for ND media, and only images it rejects
 * are probed further.
 */
export function detectFilesystem(buf: Buffer, ndfsParsed: boolean): FilesystemKind {
  if (ndfsParsed) return 'ndfs';
  if (looksLikeNdBackup(buf)) return 'backup';
  if (looksLikeWinchBackup(buf)) return 'winch';
  if (looksLikeTar(buf)) return 'tar';
  if (looksLikeDos(buf)) return 'dos';
  return 'none';
}

/**
 * FAT volume label, or null when the image is not FAT or carries no label.
 * Kept here so import and the detect endpoint read it the same way. These
 * labels matter: on the ND-OWS / NORTEXT PC disks they are ND part numbers
 * (30002EN1A00, 30022XX2N06), which is what lets the Matcher match them.
 */
export function readDosLabel(buf: Buffer | Uint8Array): string | null {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  try {
    const vol = DosVolume.open(bytes);
    return vol.info.volumeLabel ?? null;
  } catch {
    return null;   // not FAT, or no label on it
  }
}
