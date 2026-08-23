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
  /** how many of them appear in a listing recovered from another read of the same disk */
  corroborated: number;
  /** corroborated / files.length, 0..1 */
  corroborateRatio: number;
  /** which evidence carried it, when it was accepted */
  acceptedBy: 'own-bytes' | 'sibling-listing' | null;
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
  /** the number of confirmed names a candidate had to reach to be accepted */
  minConfirmedNames: number;
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
  // The parser also refuses a master block whose directory name is not
  // printable, and on a badly damaged floppy those 16 bytes are as likely to be
  // rubbish as the pointers - so a name that cannot be read is replaced as
  // well. A readable name, however odd, is the disk's own and is left alone.
  if (!directoryNameIsReadable(copy)) {
    const name = directoryName + "'";
    for (let i = 0; i < 16; i++) copy[MASTER_BLOCK_OFFSET + i] = i < name.length ? name.charCodeAt(i) : 0;
  }
  return copy;
}

/** True when the 16 name bytes read as text the parser will accept. */
export function directoryNameIsReadable(image: Uint8Array): boolean {
  let length = 0;
  for (let i = 0; i < 16; i++) {
    const c = image[MASTER_BLOCK_OFFSET + i];
    if (c === 0x27 || c === 0) break;            // apostrophe or padding ends it
    if (c < 0x20 || c > 0x7e) return false;      // note: not parity stripped - the parser does not strip either
    length++;
  }
  return length > 0;
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

/**
 * How much of a candidate's file list is backed by the image's own bytes.
 *
 * Only an entry that carries a FILE TYPE counts. A layout that points the
 * object pointer at a USER page parses as one entry named SYSTEM or
 * FLOPPY-USER with an empty type, 0 pages and 0 bytes; that name is in the
 * image's bytes because the user file is in the image, so it would otherwise
 * confirm itself. Measured over this archive, every entry of every genuine
 * recovery carries a type, and every one of the five one-name fakes a wide
 * sweep produced carried none.
 *
 * The denominator stays the whole file list, so a candidate padded with
 * untyped entries fails the ratio as well as the count.
 */
export function confirmAgainstBytes(files: ProbeResult['files'], names: Set<string>): { confirmed: number; ratio: number } {
  if (!files.length) return { confirmed: 0, ratio: 0 };
  let confirmed = 0;
  for (const f of files) if (f.type && names.has(f.name)) confirmed++;
  return { confirmed, ratio: confirmed / files.length };
}

// ── finding the structures by their shape ────────────────────

const ENTRY_SIZE = 64;
const OBJECT_ENTRY_IN_USE = 0x80;
const USER_ENTRY_FLAG = 0x81;
const NAME_OFFSET = 2;
const NAME_MAX = 16;

/** An ND name is printable, apostrophe-terminated, and not empty. */
function looksLikeNdName(image: Uint8Array, at: number, max: number): boolean {
  let length = 0;
  let solid = 0;
  for (let i = 0; i < max; i++) {
    const c = image[at + i] & 0x7f;
    if (c === 0x27) break;                       // apostrophe ends the name
    if (c === 0) break;                          // zero padded
    if (c < 0x20 || c > 0x7e) return false;
    // A run of spaces passes every printable test and is not a name: pages of
    // text padded with 0xA0 were being read as file lists because of it.
    if (c !== 0x20) solid++;
    length++;
  }
  return length > 0 && solid >= 2;
}

/**
 * Pages that look like a file list, best first.
 *
 * The object file is an array of 64-byte entries: the top bit of byte 0 marks
 * an entry in use, the name sits at byte 2 and the type at byte 18. A page full
 * of those is the object file, wherever the master block claims it is - which
 * is what makes a floppy readable again when the pointer itself is the damaged
 * part.
 */
export function scanForObjectFile(image: Uint8Array): { page: number; entries: number }[] {
  const found: { page: number; entries: number }[] = [];
  const pages = Math.floor(image.length / NDFS_PAGE_SIZE);
  for (let page = 1; page < pages; page++) {
    const base = page * NDFS_PAGE_SIZE;
    let entries = 0;
    const names = new Set<string>();
    for (let off = base; off + ENTRY_SIZE <= base + NDFS_PAGE_SIZE; off += ENTRY_SIZE) {
      if ((image[off] & OBJECT_ENTRY_IN_USE) === 0) continue;
      if (!looksLikeNdName(image, off + NAME_OFFSET, NAME_MAX)) continue;
      // an object entry also carries a type at byte 18
      if (!looksLikeNdName(image, off + 18, 4)) continue;
      let name = '';
      for (let i = 0; i < NAME_MAX; i++) {
        const c = image[off + NAME_OFFSET + i] & 0x7f;
        if (c === 0x27 || c === 0) break;
        name += String.fromCharCode(c);
      }
      names.add(name);
      entries++;
    }
    // distinct names: a real file list does not repeat the same string down the page
    if (entries >= 2 && names.size >= 2) found.push({ page, entries: names.size });
  }
  return found.sort((a, b) => b.entries - a.entries);
}

/** Pages that look like a user list, best first. Same idea, flag 0x81. */
export function scanForUserFile(image: Uint8Array): { page: number; entries: number }[] {
  const found: { page: number; entries: number }[] = [];
  const pages = Math.floor(image.length / NDFS_PAGE_SIZE);
  for (let page = 1; page < pages; page++) {
    const base = page * NDFS_PAGE_SIZE;
    let entries = 0;
    for (let off = base; off + ENTRY_SIZE <= base + NDFS_PAGE_SIZE; off += ENTRY_SIZE) {
      if ((image[off] & USER_ENTRY_FLAG) !== USER_ENTRY_FLAG) continue;
      if (!looksLikeNdName(image, off + NAME_OFFSET, NAME_MAX)) continue;
      entries++;
    }
    if (entries >= 1) found.push({ page, entries });
  }
  return found.sort((a, b) => b.entries - a.entries);
}

/**
 * Layouts worked out from the image itself rather than from other floppies.
 *
 * Used when no standard layout fits - a geometry nobody else in the collection
 * has, or a floppy whose structures were moved. The bit file cannot be found
 * this way (it has no distinctive shape), so the bit pointers of the known
 * layouts are reused, and failing that the page after the user file.
 */
export function layoutsFromScan(image: Uint8Array, fallbackBits: number[] = []): Layout[] {
  const objects = scanForObjectFile(image).slice(0, 4);
  const users = scanForUserFile(image).slice(0, 4);
  const pages = Math.floor(image.length / NDFS_PAGE_SIZE);
  const out: Layout[] = [];
  for (const o of objects) {
    for (const u of users) {
      if (u.page === o.page) continue;
      const bits = fallbackBits.length ? fallbackBits : [Math.max(1, u.page + 1)];
      for (const bit of bits) {
        if (bit < 1 || bit >= pages) continue;
        out.push({ object: { blockId: o.page, type: 1 }, user: { blockId: u.page, type: 1 }, bit: { blockId: bit, type: 0 } });
      }
    }
  }
  return out;
}

// ── recovery ─────────────────────────────────────────────────

export interface RecoverOptions {
  /** parses an image, or returns null - see NdfsProbe */
  probe: NdfsProbe;
  /** layouts to try, keyed by image size in pages; defaults to DEFAULT_LAYOUTS */
  layouts?: LayoutTable;
  /** how much of the file list must be confirmed by the bytes, 0..1 (default 0.8) */
  minConfirm?: number;
  /**
   * How many names must be confirmed before a candidate can be accepted at all
   * (default 2).
   *
   * A share on its own is not evidence: one name that happens to be in the
   * bytes scores 100%. Two is the lowest count this archive can use, because
   * the smallest genuine recovery in it - N-10-102-I, MACM-1718K:BPUN and
   * SINTRAN-I:DATA - has exactly two. See confirmAgainstBytes for the type
   * rule that does the rest of the work.
   */
  minConfirmedNames?: number;
  /** how many layouts to try at most (default 8) */
  maxCandidates?: number;
  /**
   * Also look for the object and user files in the image itself, instead of
   * only trying the layouts other floppies use. Slower - it walks every page -
   * and only worth it when the standard layouts have already failed.
   */
  deep?: boolean;
  /**
   * Last resort: try every page in the image as the object file, against a
   * handful of user and bit candidates. Hundreds of parses, so seconds per
   * floppy - but if the file list survived anywhere on the disk this finds it.
   * The confirmation test is what keeps a sweep this wide honest: a page that
   * is not a file list produces names the image does not contain.
   */
  sweep?: boolean;
  /**
   * File names from another read of the same physical floppy.
   *
   * A read that lost part of its own text cannot confirm much from its own
   * bytes, but a second read of the same disk listing the same files is
   * independent evidence for the same conclusion - the two reads failed
   * differently and agree anyway. Used only as a second route to acceptance;
   * it never lowers what the bytes have to say.
   */
  corroborate?: string[];
  /** share of names that must match the sibling listing, 0..1 (default 0.8) */
  minCorroborate?: number;
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
  const minConfirmedNames = opts.minConfirmedNames ?? 2;
  const maxCandidates = opts.maxCandidates ?? (opts.sweep ? 20000 : opts.deep ? 64 : 8);
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

  if (opts.deep) {
    // the bit pointers the known layouts use are still the best guesses
    const bits: number[] = [];
    for (const list of table.values()) for (const l of list) if (!bits.includes(l.bit.blockId)) bits.push(l.bit.blockId);
    for (const scanned of layoutsFromScan(image, bits)) {
      const already = toTry.some(l =>
        l.object.blockId === scanned.object.blockId &&
        l.user.blockId === scanned.user.blockId &&
        l.bit.blockId === scanned.bit.blockId);
      if (!already) toTry.push(scanned);
    }
  }

  if (opts.sweep) {
    const userCandidates: number[] = [];
    for (const list of table.values()) for (const l of list) if (!userCandidates.includes(l.user.blockId)) userCandidates.push(l.user.blockId);
    for (const u of scanForUserFile(image).slice(0, 2)) if (!userCandidates.includes(u.page)) userCandidates.push(u.page);
    const bitCandidates: number[] = [];
    for (const list of table.values()) for (const l of list) if (!bitCandidates.includes(l.bit.blockId)) bitCandidates.push(l.bit.blockId);
    for (let page = 1; page < pages; page++) {
      for (const user of userCandidates) {
        if (user >= pages || user === page) continue;
        for (const bit of bitCandidates) {
          if (bit >= pages) continue;
          toTry.push({ object: { blockId: page, type: 1 }, user: { blockId: user, type: 1 }, bit: { blockId: bit, type: 0 } });
        }
      }
    }
  }

  const names = rawNameSet(image);
  const sibling = new Set(opts.corroborate ?? []);
  const minCorroborate = opts.minCorroborate ?? 0.8;
  const candidates: RecoveryCandidate[] = [];
  let tried = 0;
  for (const layout of toTry.slice(0, maxCandidates)) {
    tried++;
    let parsed: ProbeResult | null = null;
    try { parsed = opts.probe(applyLayout(image, layout)); } catch { parsed = null; }
    if (!parsed || !parsed.files.length) continue;
    const { confirmed, ratio } = confirmAgainstBytes(parsed.files, names);
    let corroborated = 0;
    for (const f of parsed.files) if (f.type && sibling.has(f.name)) corroborated++;
    const corroborateRatio = parsed.files.length ? corroborated / parsed.files.length : 0;
    candidates.push({
      layout, files: parsed.files, users: parsed.users,
      directoryName: parsed.directoryName, confirmed, ratio,
      corroborated, corroborateRatio, acceptedBy: null,
    });
  }
  // Rank by how many names the image itself backs, not by the share of them.
  // A candidate naming one file that happens to exist scores 100% and tells us
  // nothing; one naming 25 files of which 24 are in the bytes is the real
  // listing. Ratio decides between candidates with equal evidence.
  candidates.sort((a, b) => b.confirmed - a.confirmed || b.ratio - a.ratio || b.files.length - a.files.length);

  for (const c of candidates) {
    // Both tests are share AND count: see minConfirmedNames for what a
    // share-only test accepts.
    if (c.ratio >= minConfirm && c.confirmed >= minConfirmedNames) c.acceptedBy = 'own-bytes';
    else if (sibling.size && c.corroborateRatio >= minCorroborate && c.corroborated >= minConfirmedNames) {
      c.acceptedBy = 'sibling-listing';
    }
  }
  const best = candidates.find(c => c.acceptedBy) ?? null;
  const status: RecoveryResult['status'] =
    best ? 'recovered' : candidates.length ? 'unconfirmed' : 'failed';
  return { status, best, candidates, tried, minConfirm, minConfirmedNames };
}

/** One line saying what happened, for a log or a UI. */
export function describeRecovery(result: RecoveryResult): string {
  if (result.status === 'failed') {
    return 'No reconstructed layout produced a file list (' + result.tried + ' tried).';
  }
  const c = result.candidates[0];
  const where = 'object ' + c.layout.object.blockId + ', user ' + c.layout.user.blockId + ', bit ' + c.layout.bit.blockId;
  const backing = c.confirmed + ' of ' + c.files.length + ' names (' + Math.round(c.ratio * 100) + '%) occur in the image itself';
  const via = c.acceptedBy === 'sibling-listing'
    ? ' - accepted on another read of the same disk listing ' + Math.round(c.corroborateRatio * 100) + '% of the same files'
    : '';
  return result.status === 'recovered'
    ? 'Recovered with ' + where + ': ' + c.files.length + ' file(s), ' + backing + via + '.'
    : 'A layout parsed (' + where + ') but only ' + backing + ', below the ' +
      Math.round(result.minConfirm * 100) + '% and ' + result.minConfirmedNames +
      ' names needed to accept it - treat it as a lead, not a listing.';
}
