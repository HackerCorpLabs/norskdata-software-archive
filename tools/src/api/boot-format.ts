/**
 * What the boot area of an NDFS page 0 holds.
 *
 * BPUN ("bootable punched tape") is Norsk Data's absolute-binary container: a
 * memory image with a load address, a word count and a checksum, produced by
 * the MACM assembler's )BPUN command and by the RT loader's BINARY-DUMP. It
 * began as a paper tape format and was carried onto floppies and disk files
 * unchanged (file type :BPUN). Its layout, big-endian throughout:
 *
 *   [preamble]  optional ASCII - an octal bootstrap plus the start address and
 *               boot flags; may be absent
 *   !           0x21, start of data - a reader scans forward to it
 *   E  (2)      load address
 *   F  (2)      word count. F = 0 means 65536 words, not none.
 *   G  (F*2)    the data words
 *   H  (2)      checksum: the sum of the data words, modulo 2^16
 *   I  (2)      action code / start word, 0 for no autostart
 *
 * FLO-MON (FLOPPY-MON, product LDR-2010F) is not a second format - it is a
 * program, the small stand-alone floppy monitor the ND-100 boots from a
 * diskette. It prints `*` and takes LIST-FILE and LOAD-FILE to list and start
 * the :BPUN files on the disk, and it is itself shipped as a BPUN and written
 * into the boot area. So `bootFormat` says the boot area is BPUN, and
 * `bootProgram` says the program in it is FLO-MON. See docs/boot-formats.md.
 *
 * On these floppies the BPUN byte stream is written one byte per 16-bit word -
 * the high byte of every word is zero. Reading the low bytes, 200 of the 202
 * boot areas in this archive have a checksum that adds up.
 *
 * The bundled parser's detectBootFormat() reads the words after the `!` packed
 * instead, so it validates nothing: all 233 boot areas it called "bpun" hold no
 * valid block at any offset, while 16 that do hold one were not recognised.
 * Recognising a boot area by its checksum is the point of this module.
 */

export type BootFormatName = 'bpun' | 'binary' | 'none';

export interface BootBlock {
  /** where the `!` sits in the low-byte stream */
  markerIndex: number;
  /** E - load address */
  loadAddress: number;
  /** F - words of data, with F = 0 reported as 65536 */
  wordCount: number;
  /** H - the sum of the data words, which matched the stored checksum */
  checksum: number;
  /** I - action code / start word, 0 for no autostart; null when it is off the page */
  action: number | null;
  /** the preamble text in front of the `!`, which states the load address in octal */
  leader: string;
}

const PAGE = 2048;

/** The low byte of every 16-bit big-endian word of page 0. */
function lowBytes(page0: Uint8Array): Uint8Array {
  const out = new Uint8Array(PAGE / 2);
  for (let i = 0; i < out.length; i++) out[i] = page0[i * 2 + 1];
  return out;
}

/**
 * The BPUN block on this page, or null when no block anywhere on it has a
 * checksum that adds up. Every `!` is tried, not just the first: the preamble
 * is variable-length, and a lost sector at the start of a read moves the
 * marker.
 */
export function readBootBlock(page0: Uint8Array): BootBlock | null {
  if (page0.length < PAGE) return null;
  const b = lowBytes(page0);
  const word = (i: number) => (b[i] << 8) | b[i + 1];

  for (let m = 0; m < b.length; m++) {
    if (b[m] !== 0x21) continue;
    if (m + 5 > b.length) break;
    const loadAddress = word(m + 1);
    // F = 0 means a full 65536 words. No page 0 can hold that, but the count
    // is read the same way everywhere so the rule is stated once, here.
    const wordCount = word(m + 3) === 0 ? 65536 : word(m + 3);
    const end = m + 5 + wordCount * 2;
    if (end + 2 > b.length) continue;
    let sum = 0;
    for (let i = 0; i < wordCount; i++) sum = (sum + word(m + 5 + i * 2)) & 0xffff;
    if (sum !== word(end)) continue;
    let start = m;
    while (start > 0 && b[start - 1] >= 0x20 && b[start - 1] <= 0x7e) start--;
    let leader = '';
    for (let i = start; i < m; i++) leader += String.fromCharCode(b[i]);
    return {
      markerIndex: m,
      loadAddress,
      wordCount,
      checksum: sum,
      action: end + 4 <= b.length ? word(end + 2) : null,
      leader,
    };
  }
  return null;
}

/**
 * Is the program in this boot area the FLO-MON monitor?
 *
 * Told by the monitor's own command names, which sit in page 0 packed 16 bits
 * to the word alongside its message strings. 195 images in this archive carry
 * them; 191 of those also hold a valid BPUN block, and the other four are
 * short reads whose block is cut. 25 images hold a block with no monitor text
 * on page 0 at all - the bootstrap is there and the monitor body is not.
 */
export function hasFloMon(page0: Uint8Array): boolean {
  let text = '';
  for (let i = 0; i < Math.min(page0.length, PAGE); i++) text += String.fromCharCode(page0[i]);
  return /LIST-FILE|LOAD-FILE|PLACE-FILE/.test(text);
}

/**
 * What the boot area IS. `bpun` when a checksum-valid block is there, `binary`
 * when the area holds something that is not one, `none` when it is empty or a
 * single repeated fill value.
 *
 * Only meaningful on an NDFS floppy: run over a DOS, tar, BACKUP-SYSTEM or
 * WINCH-TO-FLOPP volume it reports on bytes that are not a boot area.
 */
export function detectBootFormat(page0: Uint8Array): BootFormatName {
  if (page0.length < PAGE) return 'none';
  if (readBootBlock(page0)) return 'bpun';

  const limit = Math.min(1024, PAGE);
  let hasNonZero = false, allSame = true;
  const first = page0[0];
  for (let i = 0; i < limit; i++) {
    if (page0[i] !== 0) hasNonZero = true;
    if (page0[i] !== first) allSame = false;
    if (hasNonZero && !allSame) return 'binary';
  }
  return hasNonZero && !allSame ? 'binary' : 'none';
}

/** The program in the boot area, when the image says which it is. */
export function detectBootProgram(page0: Uint8Array): 'flomon' | null {
  return hasFloMon(page0) ? 'flomon' : null;
}
