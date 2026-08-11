/**
 * Product matcher: extracts product ID, version, disk number, and language
 * from NDFS volume names using known Norsk Data naming patterns.
 */

import type { ProductMatch } from '../types.js';

/**
 * Pattern 1: ND-{5-6 digits}{version}
 * Examples: ND-10325C, ND-10022T, ND-210628F00
 */
const ND_PREFIX_PATTERN = /^ND-(\d{5,6})([A-Z]\d*)$/;

/**
 * Pattern 2: Full article number with language and disk number
 * Examples: 210523H00-XX-01D, 10079M07-NO-03S, 210691D03-NO-1
 * The trailing S/D indicates single/double density (not a revision).
 */
const FULL_ARTICLE_PATTERN = /^(\d{5,6})([A-Z])(\d{2})-([A-Z]{2})-(\d+)([SD]?)$/;

/**
 * Pattern 3: Article number with language but no disk number
 * Examples: 10079M05-EN-1D (shorter disk field), 10079L00-NO-1
 */
const ARTICLE_LANG_PATTERN = /^(\d{5,6})([A-Z])(\d{2})-([A-Z]{2})-(\d+)$/;

/**
 * Pattern 4a: Article number with disk but no language
 * Examples: 10079L00-2, 10079L00-1
 */
const ARTICLE_DISK_ONLY_PATTERN = /^(\d{5,6})([A-Z])(\d{2})-(\d+)([SD]?)$/;

/**
 * Pattern 4b: Bare article number (no language/disk suffix)
 * Examples: 210523H00, 10079M05
 */
const BARE_ARTICLE_PATTERN = /^(\d{5,6})([A-Z])(\d{2})$/;

/**
 * Pattern 4c: Article number followed only by the density letter - no language
 * field and no disk number at all.
 * Example: 10516C01-D (ND-10516 FILE-HANDLER, version C01, single disk).
 * Without this the whole label falls through to "unmatched" even when the
 * product is already in the catalog.
 */
const ARTICLE_DENSITY_ONLY_PATTERN = /^(\d{5,6})([A-Z])(\d{2})-([SD])$/;

/**
 * Pattern 5: Bare article number with single-letter version
 * Examples: ND-10142B-PART1 (volume name might be ND-10142B)
 */
const ND_SINGLE_VERSION = /^ND-(\d{5,6})([A-Z])$/;

/**
 * Pattern 6: ND-{digits}{version}-PART{n} (multi-disk set; PART number = disk).
 * Examples: ND-10142B-PART1, ND-10315D-PART3
 */
const ND_PART_PATTERN = /^ND-(\d{5,6})([A-Z]\d*)-PART(\d+)$/i;

/**
 * Normalize a product number to ND- prefixed form.
 * 5-digit numbers: ND-1xxxx (products) or ND-2xxxxx (6-digit extended)
 */
function normalizeProductId(digits: string): string {
  return `ND-${digits}`;
}

/**
 * Try to match a volume name to a known Norsk Data product naming pattern.
 * Returns null if no pattern matches.
 */
export function matchProduct(volumeName: string | null): ProductMatch | null {
  if (!volumeName) return null;

  const trimmed = volumeName.trim();
  if (!trimmed) return null;

  let m: RegExpMatchArray | null;

  // Pattern 1: ND-NNNNN(N){version} (with ND- prefix)
  m = trimmed.match(ND_PREFIX_PATTERN);
  if (m) {
    return {
      productId: normalizeProductId(m[1]),
      version: m[2],
      diskNumber: null,
      language: null,
    };
  }

  // Pattern 6: ND-NNNNN(N){version}-PART{n} (e.g., ND-10315D-PART1)
  m = trimmed.match(ND_PART_PATTERN);
  if (m) {
    return {
      productId: normalizeProductId(m[1]),
      version: m[2].toUpperCase(),
      diskNumber: parseInt(m[3], 10),
      language: null,
    };
  }

  // Pattern 5: ND-NNNNN(N){single letter} (e.g., ND-10142B)
  m = trimmed.match(ND_SINGLE_VERSION);
  if (m) {
    return {
      productId: normalizeProductId(m[1]),
      version: m[2],
      diskNumber: null,
      language: null,
    };
  }

  // Pattern 2: Full article with language + disk + density
  m = trimmed.match(FULL_ARTICLE_PATTERN);
  if (m) {
    return {
      productId: normalizeProductId(m[1]),
      version: `${m[2]}${m[3]}`,
      diskNumber: parseInt(m[5], 10),
      language: m[4],
    };
  }

  // Pattern 3: Article with language + disk (no density suffix)
  m = trimmed.match(ARTICLE_LANG_PATTERN);
  if (m) {
    return {
      productId: normalizeProductId(m[1]),
      version: `${m[2]}${m[3]}`,
      diskNumber: parseInt(m[5], 10),
      language: m[4],
    };
  }

  // Pattern 4c: Article with a density letter only - no language, no disk
  m = trimmed.match(ARTICLE_DENSITY_ONLY_PATTERN);
  if (m) {
    return {
      productId: normalizeProductId(m[1]),
      version: `${m[2]}${m[3]}`,
      diskNumber: null,
      language: null,
    };
  }

  // Pattern 4a: Article with disk but no language
  m = trimmed.match(ARTICLE_DISK_ONLY_PATTERN);
  if (m) {
    return {
      productId: normalizeProductId(m[1]),
      version: `${m[2]}${m[3]}`,
      diskNumber: parseInt(m[4], 10),
      language: null,
    };
  }

  // Pattern 4b: Bare article number
  m = trimmed.match(BARE_ARTICLE_PATTERN);
  if (m) {
    return {
      productId: normalizeProductId(m[1]),
      version: `${m[2]}${m[3]}`,
      diskNumber: null,
      language: null,
    };
  }

  return null;
}
