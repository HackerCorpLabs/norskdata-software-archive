/**
 * ndfsrecover - reading an ND floppy whose master block is damaged.
 *
 * The NDFS master block sits at offset 2016 of page 0 and holds the directory
 * name plus three pointers: to the object file (the file list), the user file
 * and the bit file. If those 32 bytes are damaged the parser refuses the whole
 * image, even when the object file itself is intact a few pages away. In this
 * archive that accounts for dozens of floppies that plainly hold ND material -
 * SINTRAN file names are visible in the raw bytes - but list nothing.
 *
 * The pointers are recoverable because they are not arbitrary. SINTRAN lays a
 * floppy out the same way for a given geometry, so the values used by healthy
 * floppies of the same size are the values the damaged one had. Measured over
 * the 690 readable floppies in this archive:
 *
 *   154 and 156 page floppies   object 150, user 152, bit 77
 *   616 and 640 page floppies   object 508, user 510, bit 306
 *
 * A reconstructed pointer is a guess, so nothing is trusted on the strength of
 * the parse alone: every file name the reconstruction produces is checked
 * against the strings actually present in that image. A pointer that lands on
 * the wrong page yields names that occur nowhere in the bytes, and is rejected.
 * That check is what separates recovery from invention, which an archive cannot
 * afford to blur.
 *
 * The image is never modified. Reconstruction works on a copy, and this module
 * only reports - it writes nothing, reads no files, and calls nothing
 * Node-only, so it runs in the browser as well.
 */

/** Where the master block sits inside page 0, and what a page is. */
export const NDFS_PAGE_SIZE = 2048;
export const MASTER_BLOCK_OFFSET = 2016;
const OBJECT_PTR_OFFSET = MASTER_BLOCK_OFFSET + 0x10;
const USER_PTR_OFFSET = MASTER_BLOCK_OFFSET + 0x14;
const BIT_PTR_OFFSET = MASTER_BLOCK_OFFSET + 0x18;

/** One of the three block pointers: a 30-bit page number and a 2-bit type. */
export interface Pointer {
  blockId: number;
  type: number;
}

/** The three pointers that decide whether a floppy can be read at all. */
export interface Layout {
  object: Pointer;
  user: Pointer;
  bit: Pointer;
}

/** What a caller's NDFS parser has to give back for a candidate to be judged. */
export interface ProbeResult {
  directoryName: string | null;
  files: { name: string; type: string; pages?: number; bytes?: number }[];
  users: { name: string; pagesUsed?: number }[];
}

/**
 * Parses an image, or returns null when it will not parse. Injected rather than
 * imported so this module stays free of the NDFS library: the server passes the
 * bundled parser, the browser passes the one already loaded in the page.
 */
export type NdfsProbe = (image: Uint8Array) => ProbeResult | null;

export interface RecoveryCandidate {
  layout: Layout;
  /** files the reconstruction produced */
  files: ProbeResult['files'];
  users: ProbeResult['users'];
  directoryName: string | null;
  /** how many of those file names occur in the image's own bytes */
  confirmed: number;
  /** confirmed / files.length, 0..1 */
  ratio: number;
}

export interface RecoveryResult {
  status: 'recovered' | 'unconfirmed' | 'failed';
  /** the accepted candidate, when status is 'recovered' */
  best: RecoveryCandidate | null;
  /** every candidate that parsed, best first - so a caller can show the runners-up */
  candidates: RecoveryCandidate[];
  /** how many layouts were tried */
  tried: number;
  /** the ratio a candidate had to reach to be accepted */
  minConfirm: number;
}

// ── reading and writing pointers ─────────────────────────────

function readU32(b: Uint8Array, off: number): number {
  return ((b[off] << 24) | (b[off + 1] << 16) | (b[off + 2] << 8) | b[off + 3]) >>> 0;
}

function writeU32(b: Uint8Array, off: number, value: number): void {
  b[off] = (value >>> 24) & 0xff;
  b[off + 1] = (value >>> 16) & 0xff;
  b[off + 2] = (value >>> 8) & 0xff;
  b[off + 3] = value & 0xff;
}

function pointerFrom(value: number): Pointer {
  return { blockId: value & 0x3fffffff, type: (value >>> 30) & 3 };
}

function pointerTo(p: Pointer): number {
  return (((p.type & 3) << 30) | (p.blockId & 0x3fffffff)) >>> 0;
}

/** The layout an image currently claims, whether or not it is usable. */
export function readLayout(image: Uint8Array): Layout | null {
  if (image.length < NDFS_PAGE_SIZE) return null;
  return {
    object: pointerFrom(readU32(image, OBJECT_PTR_OFFSET)),
    user: pointerFrom(readU32(image, USER_PTR_OFFSET)),
    bit: pointerFrom(readU32(image, BIT_PTR_OFFSET)),
  };
}

/** True when a layout could belong to an image of this many pages. */
export function layoutIsPlausible(layout: Layout, pages: number): boolean {
  for (const p of [layout.object, layout.user, layout.bit]) {
    if (!Number.isFinite(p.blockId) || p.blockId < 1 || p.blockId >= pages) return false;
  }
  return true;
}

/**
 * A copy of the image carrying the given layout. The original is untouched, and
 * a directory name is supplied only when the damaged one is missing entirely -
 * a name that is there, however odd, is the disk's own and is left alone.
 */
export function applyLayout(image: Uint8Array, layout: Layout, directoryName = 'RECOVERED'): Uint8Array {
  const copy = image.slice();
  writeU32(copy, OBJECT_PTR_OFFSET, pointerTo(layout.object));
  writeU32(copy, USER_PTR_OFFSET, pointerTo(layout.user));
  writeU32(copy, BIT_PTR_OFFSET, pointerTo(layout.bit));
  if (copy[MASTER_BLOCK_OFFSET] === 0) {
    const name = directoryName + "'";
    for (let i = 0; i < name.length && i < 16; i++) copy[MASTER_BLOCK_OFFSET + i] = name.charCodeAt(i);
  }
  return copy;
}

// ── layout tables ────────────────────────────────────────────

/** Layouts known for a given image size, most common first. */
export type LayoutTable = Map<number, Layout[]>;

const P = (blockId: number, type: number): Pointer => ({ blockId, type });

/**
 * Layouts measured over the readable floppies of this archive, as a fallback
 * for callers that cannot supply their own table. A table built from the
 * catalog in hand is always better: it covers the geometries that collection
 * actually has.
 */
export const DEFAULT_LAYOUTS: LayoutTable = new Map([
  [154, [{ object: P(150, 1), user: P(152, 1), bit: P(77, 0) }, { object: P(149, 1), user: P(151, 1), bit: P(153, 0) }]],
  [156, [{ object: P(150, 1), user: P(152, 1), bit: P(77, 0) }, { object: P(149, 1), user: P(151, 1), bit: P(153, 0) }]],
  [616, [{ object: P(508, 1), user: P(510, 1), bit: P(306, 0) }, { object: P(611, 1), user: P(613, 1), bit: P(614, 0) }]],
  [640, [{ object: P(508, 1), user: P(510, 1), bit: P(306, 0) }, { object: P(611, 1), user: P(613, 1), bit: P(614, 0) }]],
]);

/**
 * Build a table from floppies that read cleanly: pass each one's page count and
 * the layout its master block holds, and the layouts come back ordered by how
 * often they occur, which is the order worth trying them in.
 */
export function buildLayoutTable(samples: { pages: number; layout: Layout }[]): LayoutTable {
  const counts = new Map<number, Map<string, { layout: Layout; count: number }>>();
  for (const s of samples) {
    const key = [s.layout.object.blockId, s.layout.object.type,
                 s.layout.user.blockId, s.layout.user.type,
                 s.layout.bit.blockId, s.layout.bit.type].join('|');
    if (!counts.has(s.pages)) counts.set(s.pages, new Map());
    const forSize = counts.get(s.pages)!;
    const seen = forSize.get(key);
    if (seen) seen.count++;
    else forSize.set(key, { layout: s.layout, count: 1 });
  }
  const table: LayoutTable = new Map();
  for (const [pages, forSize] of counts) {
    table.set(pages, [...forSize.values()].sort((a, b) => b.count - a.count).map(v => v.layout));
  }
  return table;
}

// ── validation ───────────────────────────────────────────────

/**
 * Every name-shaped string in the image, parity stripped. SINTRAN writes text
 * with the top bit set, and file names survive in the bytes long after the
 * structures that indexed them are gone - which is what makes them usable as
 * independent evidence for or against a reconstruction.
 */
export function rawNameSet(image: Uint8Array): Set<string> {
  let text = '';
  for (let i = 0; i < image.length; i++) {
    const c = image[i] & 0x7f;
    text += (c >= 0x20 && c <= 0x7e) ? String.fromCharCode(c) : ' ';
  }
  return new Set(text.match(/[A-Z][A-Z0-9-]{1,15}/g) ?? []);
}

/** How much of a candidate's file list is backed by the image's own bytes. */
export function confirmAgainstBytes(files: ProbeResult['files'], names: Set<string>): { confirmed: number; ratio: number } {
  if (!files.length) return { confirmed: 0, ratio: 0 };
  let confirmed = 0;
  for (const f of files) if (names.has(f.name)) confirmed++;
  return { confirmed, ratio: confirmed / files.length };
}

// ── recovery ─────────────────────────────────────────────────

export interface RecoverOptions {
  /** parses an image, or returns null - see NdfsProbe */
  probe: NdfsProbe;
  /** layouts to try, keyed by image size in pages; defaults to DEFAULT_LAYOUTS */
  layouts?: LayoutTable;
  /** how much of the file list must be confirmed by the bytes, 0..1 (default 0.8) */
  minConfirm?: number;
  /** how many layouts to try at most (default 8) */
  maxCandidates?: number;
}

/**
 * Try to read a damaged floppy by reconstructing its master block pointers.
 *
 * Returns 'recovered' only when a candidate's file names are confirmed by the
 * image's own bytes at or above minConfirm. A candidate that parses but cannot
 * be confirmed comes back as 'unconfirmed' with its details, so a person can
 * look at it and decide - it is a lead, not a result.
 */
export function recoverNdfs(image: Uint8Array, opts: RecoverOptions): RecoveryResult {
  const minConfirm = opts.minConfirm ?? 0.8;
  const maxCandidates = opts.maxCandidates ?? 8;
  const table = opts.layouts ?? DEFAULT_LAYOUTS;
  const pages = Math.floor(image.length / NDFS_PAGE_SIZE);

  const toTry: Layout[] = [];
  for (const layout of table.get(pages) ?? []) {
    if (layoutIsPlausible(layout, pages)) toTry.push(layout);
  }
  // Nothing known for this exact size: fall back to the layouts of the nearest
  // size, since a short read of a 156 page floppy is still laid out like one.
  if (!toTry.length) {
    const sizes = [...table.keys()].sort((a, b) => Math.abs(a - pages) - Math.abs(b - pages));
    for (const size of sizes.slice(0, 2)) {
      for (const layout of table.get(size) ?? []) {
        if (layoutIsPlausible(layout, pages)) toTry.push(layout);
      }
    }
  }

  const names = rawNameSet(image);
  const candidates: RecoveryCandidate[] = [];
  let tried = 0;
  for (const layout of toTry.slice(0, maxCandidates)) {
    tried++;
    let parsed: ProbeResult | null = null;
    try { parsed = opts.probe(applyLayout(image, layout)); } catch { parsed = null; }
    if (!parsed || !parsed.files.length) continue;
    const { confirmed, ratio } = confirmAgainstBytes(parsed.files, names);
    candidates.push({
      layout, files: parsed.files, users: parsed.users,
      directoryName: parsed.directoryName, confirmed, ratio,
    });
  }
  candidates.sort((a, b) => b.ratio - a.ratio || b.files.length - a.files.length);

  const best = candidates[0] ?? null;
  const status: RecoveryResult['status'] =
    !best ? 'failed' : best.ratio >= minConfirm ? 'recovered' : 'unconfirmed';
  return { status, best: status === 'recovered' ? best : null, candidates, tried, minConfirm };
}

/** One line saying what happened, for a log or a UI. */
export function describeRecovery(result: RecoveryResult): string {
  if (result.status === 'failed') {
    return 'No reconstructed layout produced a file list (' + result.tried + ' tried).';
  }
  const c = result.candidates[0];
  const where = 'object ' + c.layout.object.blockId + ', user ' + c.layout.user.blockId + ', bit ' + c.layout.bit.blockId;
  const backing = c.confirmed + ' of ' + c.files.length + ' names (' + Math.round(c.ratio * 100) + '%) occur in the image itself';
  return result.status === 'recovered'
    ? 'Recovered with ' + where + ': ' + c.files.length + ' file(s), ' + backing + '.'
    : 'A layout parsed (' + where + ') but only ' + backing + ', below the ' +
      Math.round(result.minConfirm * 100) + '% needed to accept it - treat it as a lead, not a listing.';
}
