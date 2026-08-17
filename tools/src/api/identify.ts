/**
 * Identify what a disk image holds, without touching the catalog.
 *
 * Wraps the same detectors the importer and the server use, and adds a short
 * human-readable summary per format, so it can be run against any file or
 * folder of images - including ones that have never been imported.
 */

import { readFile } from 'fs/promises';
import { gunzipSync } from 'zlib';
import { extname } from 'path';
import { detectFilesystem, type FilesystemKind } from './filesystem-detect.js';
import { pageAlign } from '../lib/ndfsalign/index.js';
import { DosVolume } from '../lib/dosfs/index.js';
import { readBackupVolume, readWinchVolume } from '../lib/ndbackup/index.js';

export interface Identification {
  /** path as given */
  path: string;
  /** uncompressed size in bytes */
  bytes: number;
  kind: FilesystemKind;
  /** volume name / label / directory, whichever the format provides */
  name: string | null;
  /** one-line summary of what is inside */
  detail: string;
  /** number of files or pages, when the format lets us count them */
  items: number | null;
  error?: string;
}

/** File extensions treated as disk images. */
export const IMAGE_EXTENSIONS = ['.img', '.image', '.ima', '.dsk', '.gz'];

export function looksLikeImageFile(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower.endsWith('.img.gz') || lower.endsWith('.image.gz')) return true;
  const ext = extname(lower);
  return IMAGE_EXTENSIONS.includes(ext) && ext !== '.gz';
}

/** Read an image, transparently gunzipping a .gz. */
export async function readImage(path: string): Promise<Buffer> {
  const raw = await readFile(path);
  // gzip magic
  if (raw.length > 2 && raw[0] === 0x1f && raw[1] === 0x8b) return gunzipSync(raw);
  return raw;
}

async function ndfsSummary(buf: Buffer): Promise<{ name: string | null; files: number; detail: string } | null> {
  try {
    const { NdfsFileSystem } = await import('norskdata-ndfs');
    if (!NdfsFileSystem) return null;
    const fs = new (NdfsFileSystem as any)(pageAlign(new Uint8Array(buf)), true);
    const name = fs.getDirectoryName?.() ?? null;
    const users: any[] = fs.getUsers?.() ?? [];
    const objects: any[] = fs.getObjectEntries?.() ?? [];
    if (!name && objects.length === 0 && users.length === 0) return null;
    const boot = (() => { try { return String(fs.detectBootFormat?.() ?? '').toLowerCase(); } catch { return ''; } })();
    return {
      name,
      files: objects.length,
      detail: `${objects.length} file(s), ${users.length} user(s)` + (boot && boot !== 'none' ? `, boot ${boot}` : ''),
    };
  } catch {
    return null;
  }
}

/** Identify one image. Never throws: failures come back in `error`. */
export async function identifyImage(path: string): Promise<Identification> {
  let buf: Buffer;
  try {
    buf = await readImage(path);
  } catch (err) {
    return { path, bytes: 0, kind: 'none', name: null, detail: '', items: null, error: String(err) };
  }

  const bytes = buf.length;
  const ndfs = await ndfsSummary(buf);
  const kind = detectFilesystem(buf, !!ndfs);
  const base: Identification = { path, bytes, kind, name: null, detail: '', items: null };

  try {
    switch (kind) {
      case 'ndfs':
        return { ...base, name: ndfs!.name, detail: ndfs!.detail, items: ndfs!.files };
      case 'dos': {
        const vol = DosVolume.open(new Uint8Array(buf));
        const entries = vol.listAll().filter(e => !e.isVolumeLabel);
        const dirs = entries.filter(e => e.isDirectory).length;
        return {
          ...base,
          name: vol.info.volumeLabel,
          items: entries.length,
          detail: `FAT${vol.info.fatBits}, OEM ${vol.info.oemName.trim()}, ${entries.length - dirs} file(s), ` +
                  `${dirs} dir(s), ${vol.info.freeBytes.toLocaleString()} B free`,
        };
      }
      case 'backup': {
        const vol = readBackupVolume(new Uint8Array(buf));
        const live = vol.files.filter(f => !f.stale);
        const stale = vol.files.length - live.length;
        return {
          ...base,
          name: vol.volumeId,
          items: live.length,
          detail: `SINTRAN BACKUP-SYSTEM, owner ${vol.owner}, ${live.length} file(s)` +
                  (stale ? `, ${stale} stale label(s)` : '') +
                  (live[0]?.created ? `, ${live[0].created}` : '') +
                  (live[0]?.system ? `, ${live[0].system}` : ''),
        };
      }
      case 'winch': {
        const vol = readWinchVolume(new Uint8Array(buf));
        return {
          ...base,
          name: vol.directoryName,
          items: vol.pages.length,
          detail: `WINCH-TO-FLOPP, volume ${vol.volumeNumber} of ${vol.totalVolumes}, ` +
                  `${vol.pages.length} page(s)` + (vol.label ? `, "${vol.label}"` : ''),
        };
      }
      case 'tar':
        return { ...base, detail: 'tar archive written to the media' };
      default: {
        // Say something useful about an image with no filesystem: mostly-fill
        // images are blank disks, the rest are probably bad reads.
        const counts = new Map<number, number>();
        for (let i = 0; i < buf.length; i += 64) counts.set(buf[i], (counts.get(buf[i]) ?? 0) + 1);
        let top = 0, topCount = 0;
        for (const [b, n] of counts) if (n > topCount) { top = b; topCount = n; }
        const pct = Math.round(topCount * 100 / Math.max(1, Math.ceil(buf.length / 64)));
        return {
          ...base,
          detail: pct >= 90
            ? `no filesystem, ${pct}% 0x${top.toString(16).padStart(2, '0')} fill - blank or erased`
            : `no filesystem recognised`,
        };
      }
    }
  } catch (err) {
    return { ...base, error: String(err) };
  }
}
