/**
 * ndfsalign - make an image readable by the NDFS parser.
 *
 * The parser refuses an image whose length is not a whole number of 2048-byte
 * pages ("Image size must be a multiple of NDFS page size"). Real reads in this
 * archive are routinely a fraction of a page short - 318,976 bytes is 155.75
 * pages, 1,260,544 is 615.5 - because the last track was not read, or the
 * media is an 8 inch format whose track count does not divide into pages.
 * Refusing those images means an ND floppy with a perfectly good directory is
 * recorded as holding no filesystem at all: five images in this archive were
 * filed that way, among them the product disk 210260K01-EN-02D.
 *
 * Padding with zeroes only adds pages past the end of the read; it cannot
 * invent a filesystem, because the master block and the directory structures
 * sit at the start. The image on disk is never changed - the padding exists
 * only for the parse.
 *
 * No Node-only calls, so the static site can use it as well.
 */

export const NDFS_PAGE_SIZE = 2048;

/** True when the parser will accept the length as it stands. */
export function isPageAligned(length: number): boolean {
  return length > 0 && length % NDFS_PAGE_SIZE === 0;
}

/**
 * The same bytes, padded with zeroes up to a whole number of pages. Returns the
 * input untouched when it is already aligned, so the common case copies nothing.
 */
export function pageAlign(data: Uint8Array): Uint8Array {
  if (isPageAligned(data.length)) return data;
  const padded = new Uint8Array(Math.ceil(data.length / NDFS_PAGE_SIZE) * NDFS_PAGE_SIZE);
  padded.set(data);
  return padded;
}
