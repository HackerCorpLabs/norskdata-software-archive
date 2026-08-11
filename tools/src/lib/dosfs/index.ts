/**
 * dosfs - a small FAT12/FAT16 reader for the MS-DOS floppies in this archive.
 *
 * Shaped like the NDFS library: hand it the raw image bytes and it gives you a
 * volume you can list and read from. No Node-only calls (no fs, no Buffer
 * methods beyond what Uint8Array provides), so the same code runs in the
 * browser for the static site.
 *
 * Deliberately lenient. These are 1980s ND-OWS / NORTEXT PC disks written by a
 * variety of formatters: some omit the 0x55AA boot signature, some carry odd
 * OEM ids ("TS  3.10", "TSAO 2.0"), and a few images are a short read. A strict
 * parser refuses them, which is no use to an archive - so the geometry is taken
 * from the BIOS parameter block, sanity-checked, and reads are clamped to the
 * bytes actually present.
 */

export interface DosVolumeInfo {
  oemName: string;
  bytesPerSector: number;
  sectorsPerCluster: number;
  reservedSectors: number;
  numFats: number;
  rootEntries: number;
  totalSectors: number;
  sectorsPerFat: number;
  mediaDescriptor: number;
  /** 12 or 16 */
  fatBits: 12 | 16;
  volumeLabel: string | null;
  totalBytes: number;
  freeBytes: number;
}

export interface DosDirEntry {
  /** 8.3 name, e.g. "COMMAND.COM"; directories have no extension dot added */
  name: string;
  /** Full path from the root, e.g. "ND-OWS/SETUP.EXE" */
  path: string;
  isDirectory: boolean;
  isVolumeLabel: boolean;
  size: number;
  /** "YYYY-MM-DD HH:MM" from the directory entry, or null when unset */
  modified: string | null;
  attributes: {
    readOnly: boolean; hidden: boolean; system: boolean;
    volumeLabel: boolean; directory: boolean; archive: boolean;
  };
  firstCluster: number;
}

/** Thrown when the image has no usable FAT boot sector. */
export class NotFatError extends Error {}

const ATTR_READ_ONLY = 0x01, ATTR_HIDDEN = 0x02, ATTR_SYSTEM = 0x04;
const ATTR_VOLUME = 0x08, ATTR_DIRECTORY = 0x10, ATTR_ARCHIVE = 0x20;
const ATTR_LFN = 0x0f;   // long-file-name fragment: skipped, these disks predate it

export class DosVolume {
  private readonly d: Uint8Array;
  private readonly view: DataView;
  readonly info: DosVolumeInfo;
  private readonly fatStart: number;
  private readonly rootStart: number;
  private readonly dataStart: number;
  private readonly clusterBytes: number;

  private constructor(data: Uint8Array) {
    this.d = data;
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    const bytesPerSector = this.u16(11);
    const sectorsPerCluster = data[13];
    const reservedSectors = this.u16(14);
    const numFats = data[16];
    const rootEntries = this.u16(17);
    const totalSectors16 = this.u16(19);
    const mediaDescriptor = data[21];
    const sectorsPerFat = this.u16(22);
    const totalSectors32 = this.u32(32);
    const totalSectors = totalSectors16 || totalSectors32;

    if (![512, 1024, 2048, 4096].includes(bytesPerSector)) throw new NotFatError('bytes per sector is ' + bytesPerSector);
    if (!(sectorsPerCluster && (sectorsPerCluster & (sectorsPerCluster - 1)) === 0)) throw new NotFatError('bad sectors per cluster');
    if (reservedSectors === 0) throw new NotFatError('no reserved sectors');
    if (numFats < 1 || numFats > 2) throw new NotFatError('FAT count is ' + numFats);
    if (sectorsPerFat === 0) throw new NotFatError('no FAT');

    this.fatStart = reservedSectors * bytesPerSector;
    this.rootStart = this.fatStart + numFats * sectorsPerFat * bytesPerSector;
    this.dataStart = this.rootStart + rootEntries * 32;
    this.clusterBytes = sectorsPerCluster * bytesPerSector;

    const dataSectors = totalSectors - (reservedSectors + numFats * sectorsPerFat + Math.ceil(rootEntries * 32 / bytesPerSector));
    const clusterCount = Math.floor(dataSectors / sectorsPerCluster);
    const fatBits: 12 | 16 = clusterCount < 4085 ? 12 : 16;

    const oemName = this.ascii(3, 8).trim();

    this.info = {
      oemName, bytesPerSector, sectorsPerCluster, reservedSectors, numFats,
      rootEntries, totalSectors, sectorsPerFat, mediaDescriptor, fatBits,
      volumeLabel: null,
      totalBytes: totalSectors * bytesPerSector,
      freeBytes: 0,
    };

    // Volume label lives in the root directory as an entry with the volume bit.
    for (const e of this.readDir('')) {
      if (e.isVolumeLabel) { this.info.volumeLabel = e.name; break; }
    }
    this.info.freeBytes = this.countFreeClusters() * this.clusterBytes;
  }

  /** Open an image. Throws NotFatError when it is not a FAT volume. */
  static open(data: Uint8Array): DosVolume {
    if (data.length < 512) throw new NotFatError('image shorter than one sector');
    return new DosVolume(data);
  }

  /** True when the image looks like FAT, without throwing. */
  static isFat(data: Uint8Array): boolean {
    try { DosVolume.open(data); return true; } catch { return false; }
  }

  private u16(off: number): number { return off + 1 < this.d.length ? this.view.getUint16(off, true) : 0; }
  private u32(off: number): number { return off + 3 < this.d.length ? this.view.getUint32(off, true) : 0; }
  private ascii(off: number, len: number): string {
    let s = '';
    for (let i = 0; i < len && off + i < this.d.length; i++) {
      const c = this.d[off + i];
      s += (c >= 0x20 && c <= 0x7e) ? String.fromCharCode(c) : ' ';
    }
    return s;
  }

  /** FAT entry for a cluster. */
  private fatEntry(cluster: number): number {
    if (this.info.fatBits === 12) {
      const off = this.fatStart + Math.floor(cluster * 3 / 2);
      if (off + 1 >= this.d.length) return 0xfff;
      const v = this.d[off] | (this.d[off + 1] << 8);
      return (cluster & 1) ? (v >> 4) : (v & 0x0fff);
    }
    const off = this.fatStart + cluster * 2;
    return off + 1 < this.d.length ? this.view.getUint16(off, true) : 0xffff;
  }

  private isEndOfChain(v: number): boolean {
    return this.info.fatBits === 12 ? v >= 0xff8 : v >= 0xfff8;
  }

  private countFreeClusters(): number {
    const dataBytes = Math.max(0, this.d.length - this.dataStart);
    const clusters = Math.floor(dataBytes / this.clusterBytes);
    let free = 0;
    for (let c = 2; c < clusters + 2; c++) if (this.fatEntry(c) === 0) free++;
    return free;
  }

  private clusterOffset(cluster: number): number {
    return this.dataStart + (cluster - 2) * this.clusterBytes;
  }

  /** Cluster chain for a file or directory, guarded against loops. */
  private chain(firstCluster: number): number[] {
    const out: number[] = [];
    const seen = new Set<number>();
    let c = firstCluster;
    while (c >= 2 && !this.isEndOfChain(c) && !seen.has(c)) {
      seen.add(c);
      out.push(c);
      if (this.clusterOffset(c) >= this.d.length) break;   // short read: stop at the end of the image
      c = this.fatEntry(c);
    }
    return out;
  }

  private parseEntries(bytes: Uint8Array, parentPath: string): DosDirEntry[] {
    const out: DosDirEntry[] = [];
    for (let off = 0; off + 32 <= bytes.length; off += 32) {
      const first = bytes[off];
      if (first === 0x00) break;         // no further entries
      if (first === 0xe5) continue;      // deleted
      const attr = bytes[off + 11];
      if (attr === ATTR_LFN) continue;

      let base = '', ext = '';
      for (let i = 0; i < 8; i++) { const c = bytes[off + i]; if (c > 0x20 && c < 0x7f) base += String.fromCharCode(c); }
      for (let i = 8; i < 11; i++) { const c = bytes[off + i]; if (c > 0x20 && c < 0x7f) ext += String.fromCharCode(c); }
      if (!base && !ext) continue;
      if (base === '.' || base === '..') continue;

      const isDirectory = (attr & ATTR_DIRECTORY) !== 0;
      const isVolumeLabel = (attr & ATTR_VOLUME) !== 0 && !isDirectory;
      const name = isVolumeLabel ? (base + ext) : (ext ? base + '.' + ext : base);

      const time = bytes[off + 22] | (bytes[off + 23] << 8);
      const date = bytes[off + 24] | (bytes[off + 25] << 8);
      const modified = date
        ? [
            String(1980 + (date >> 9)).padStart(4, '0'), '-',
            String((date >> 5) & 0x0f).padStart(2, '0'), '-',
            String(date & 0x1f).padStart(2, '0'), ' ',
            String(time >> 11).padStart(2, '0'), ':',
            String((time >> 5) & 0x3f).padStart(2, '0'),
          ].join('')
        : null;

      const firstCluster = bytes[off + 26] | (bytes[off + 27] << 8);
      const size = bytes[off + 28] | (bytes[off + 29] << 8) | (bytes[off + 30] << 16) | (bytes[off + 31] << 24);

      out.push({
        name,
        path: parentPath ? parentPath + '/' + name : name,
        isDirectory, isVolumeLabel, size, modified, firstCluster,
        attributes: {
          readOnly: !!(attr & ATTR_READ_ONLY), hidden: !!(attr & ATTR_HIDDEN),
          system: !!(attr & ATTR_SYSTEM), volumeLabel: !!(attr & ATTR_VOLUME),
          directory: isDirectory, archive: !!(attr & ATTR_ARCHIVE),
        },
      });
    }
    return out;
  }

  /** Entries of one directory. Empty path means the root. */
  readDir(path: string): DosDirEntry[] {
    if (!path) {
      const end = Math.min(this.rootStart + this.info.rootEntries * 32, this.d.length);
      return this.parseEntries(this.d.subarray(this.rootStart, end), '');
    }
    const entry = this.find(path);
    if (!entry || !entry.isDirectory) return [];
    const parts: Uint8Array[] = [];
    for (const c of this.chain(entry.firstCluster)) {
      const start = this.clusterOffset(c);
      if (start >= this.d.length) break;
      parts.push(this.d.subarray(start, Math.min(start + this.clusterBytes, this.d.length)));
    }
    const joined = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let at = 0;
    for (const p of parts) { joined.set(p, at); at += p.length; }
    return this.parseEntries(joined, path);
  }

  /** Every entry on the volume, depth-first. Guarded against cyclic directories. */
  listAll(maxEntries = 5000): DosDirEntry[] {
    const out: DosDirEntry[] = [];
    const walk = (path: string, depth: number) => {
      if (depth > 16 || out.length >= maxEntries) return;
      for (const e of this.readDir(path)) {
        out.push(e);
        if (e.isDirectory) walk(e.path, depth + 1);
      }
    };
    walk('', 0);
    return out;
  }

  /** Find one entry by path, case-insensitively. */
  find(path: string): DosDirEntry | null {
    const parts = path.split('/').filter(Boolean);
    let dir = '';
    let found: DosDirEntry | null = null;
    for (const part of parts) {
      found = this.readDir(dir).find(e => e.name.toUpperCase() === part.toUpperCase()) ?? null;
      if (!found) return null;
      dir = found.path;
    }
    return found;
  }

  /** File contents. Returns null when the path is missing or is a directory. */
  readFile(path: string): Uint8Array | null {
    const e = this.find(path);
    if (!e || e.isDirectory) return null;
    const out = new Uint8Array(e.size);
    let written = 0;
    for (const c of this.chain(e.firstCluster)) {
      if (written >= e.size) break;
      const start = this.clusterOffset(c);
      if (start >= this.d.length) break;
      const take = Math.min(this.clusterBytes, e.size - written, this.d.length - start);
      out.set(this.d.subarray(start, start + take), written);
      written += take;
    }
    return written === e.size ? out : out.subarray(0, written);
  }
}

export default DosVolume;
