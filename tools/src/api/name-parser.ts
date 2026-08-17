/**
 * Volume name parser for Norsk Data floppy naming conventions.
 *
 * Standard naming convention: PPPPPP[VVV]-LL-NN[D]
 *   PPPPPP = product number (5-6 digits)
 *   VVV    = version (letter + 2 digits, e.g., H00)
 *   LL     = language (XX, EN, SW, NO)
 *   NN     = disk number
 *   D      = density (S=single, D=double)
 */

export interface ParsedVolumeName {
  productNumber: string;
  productId: string;
  version: string;
  language: string | null;
  diskNumber: number | null;
  density: string | null;
  confidence: number;
  raw: string;
}

/**
 * Full pattern: 210523H00-XX-01D
 * Groups: (digits)(letter)(2digits)-(lang)-(disk)(density?)
 */
const FULL_PATTERN = /^(\d{5,6})([A-Z])(\d{2})-([A-Z]{2})-(\d+)([SD]?)$/;

/**
 * ND-prefixed with version digits: ND-210628F00
 */
const ND_PREFIX_VERSION = /^ND-(\d{5,6})([A-Z])(\d{2})$/;

/**
 * ND-prefixed single letter version: ND-10325C
 */
const ND_PREFIX_SINGLE = /^ND-(\d{5,6})([A-Z])$/;

/**
 * Article with disk number but no language: 10079L00-2
 */
const ARTICLE_DISK_ONLY = /^(\d{5,6})([A-Z])(\d{2})-(\d+)([SD]?)$/;

/**
 * Bare article number with version: 210523H00
 */
const BARE_ARTICLE = /^(\d{5,6})([A-Z])(\d{2})$/;

/**
 * Multi-part: ND-10142B-PART1, ND-10142B-PART2
 */
const MULTI_PART = /^ND-(\d{5,6})([A-Z])-PART(\d+)$/i;

/**
 * Multi-part without ND prefix: 10142B-PART1
 */
const MULTI_PART_BARE = /^(\d{5,6})([A-Z])-PART(\d+)$/i;

/**
 * The FAT label of an ND-OWS / NORTEXT PC diskette: 30210NO1A00.
 *
 * FAT allows 11 characters and no punctuation, so ND packed the part number
 * into them: five digits of article number, two letters of language (NO, SW,
 * EN, DA, XX), the disk number in the set, then the version. The label of the
 * first WinLink diskette is 30210NO1A00 - article 30210, Norwegian, disk 1,
 * version A00 - which is the same information a floppy volume name carries as
 * 210523H00-XX-01D, only without room for the separators.
 */
const DOS_LABEL_PATTERN = /^(\d{5})([A-Z]{2})(\d)([A-Z]\d{2})$/;

/**
 * Parse a volume name into structured components.
 * Returns null if the name cannot be parsed at all.
 */
export function parseVolumeName(name: string): ParsedVolumeName | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;

  let m: RegExpMatchArray | null;

  // MS-DOS FAT label: 30210NO1A00 -> ND-30210, Norwegian, disk 1, version A00
  m = trimmed.match(DOS_LABEL_PATTERN);
  if (m) {
    return {
      productNumber: m[1],
      productId: `ND-${m[1]}`,
      version: m[4],
      language: m[2],
      diskNumber: parseInt(m[3], 10),
      density: null,
      confidence: 1,
      raw: trimmed,
    };
  }

  // Full pattern: 210523H00-XX-01D -> confidence 1.0
  m = trimmed.match(FULL_PATTERN);
  if (m) {
    return {
      productNumber: m[1],
      productId: `ND-${m[1]}`,
      version: `${m[2]}${m[3]}`,
      language: m[4],
      diskNumber: parseInt(m[5], 10),
      density: m[6] || null,
      confidence: 1.0,
      raw: trimmed,
    };
  }

  // ND-prefixed with version digits: ND-210628F00 -> confidence 0.9
  m = trimmed.match(ND_PREFIX_VERSION);
  if (m) {
    return {
      productNumber: m[1],
      productId: `ND-${m[1]}`,
      version: `${m[2]}${m[3]}`,
      language: null,
      diskNumber: null,
      density: null,
      confidence: 0.9,
      raw: trimmed,
    };
  }

  // ND-prefixed single letter: ND-10325C -> confidence 0.9
  m = trimmed.match(ND_PREFIX_SINGLE);
  if (m) {
    return {
      productNumber: m[1],
      productId: `ND-${m[1]}`,
      version: m[2],
      language: null,
      diskNumber: null,
      density: null,
      confidence: 0.9,
      raw: trimmed,
    };
  }

  // Multi-part with ND prefix: ND-10142B-PART1 -> confidence 0.7
  m = trimmed.match(MULTI_PART);
  if (m) {
    return {
      productNumber: m[1],
      productId: `ND-${m[1]}`,
      version: m[2],
      language: null,
      diskNumber: parseInt(m[3], 10),
      density: null,
      confidence: 0.7,
      raw: trimmed,
    };
  }

  // Multi-part bare: 10142B-PART1 -> confidence 0.7
  m = trimmed.match(MULTI_PART_BARE);
  if (m) {
    return {
      productNumber: m[1],
      productId: `ND-${m[1]}`,
      version: m[2],
      language: null,
      diskNumber: parseInt(m[3], 10),
      density: null,
      confidence: 0.7,
      raw: trimmed,
    };
  }

  // Bare article: 210523H00 -> confidence 0.8
  // Article with disk but no language: 10079L00-2
  m = trimmed.match(ARTICLE_DISK_ONLY);
  if (m) {
    return {
      productNumber: m[1],
      productId: `ND-${m[1]}`,
      version: `${m[2]}${m[3]}`,
      language: null,
      diskNumber: parseInt(m[4], 10),
      density: m[5] || null,
      confidence: 0.9,
      raw: trimmed,
    };
  }

  m = trimmed.match(BARE_ARTICLE);
  if (m) {
    return {
      productNumber: m[1],
      productId: `ND-${m[1]}`,
      version: `${m[2]}${m[3]}`,
      language: null,
      diskNumber: null,
      density: null,
      confidence: 0.8,
      raw: trimmed,
    };
  }

  // Not parseable as standard ND article number
  return null;
}

/**
 * Known OS distribution prefix -> product mapping.
 * Distribution floppies use N-{series}-{number}-{disk} naming,
 * not ND-NNNNN article numbers. This table maps them to products.
 */
export const DISTRIBUTION_PRODUCT_MAP: Record<string, { productId: string; notes: string }> = {
  'N-10-203':  { productId: 'ND-10048', notes: 'SINTRAN III/VS distribution' },
  'N-900-188': { productId: 'ND-10048', notes: 'SINTRAN III/VS distribution' },
  'N-900-000': { productId: 'ND-10407', notes: 'SINTRAN-III Satellite/9 + COSMOS' },
  'N-10-102':  { productId: 'ND-10048', notes: 'SINTRAN III/VS distribution' },
};

/**
 * Try to match a distribution volume name (N-xxx-xxx-disk) to a product.
 */
export function matchDistribution(volumeName: string): { productId: string; diskNumber: number | null; notes: string } | null {
  if (!volumeName) return null;
  const m = volumeName.match(/^(N-\d+-\d+)-([IVXLCDM]+|\d+)$/i);
  if (!m) return null;
  const prefix = m[1];
  const diskPart = m[2];

  const mapping = DISTRIBUTION_PRODUCT_MAP[prefix];
  if (!mapping) return null;

  // Parse disk number from Roman or Arabic
  let diskNumber: number | null = null;
  const roman: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8 };
  if (roman[diskPart.toUpperCase()]) {
    diskNumber = roman[diskPart.toUpperCase()];
  } else {
    const n = parseInt(diskPart, 10);
    if (!isNaN(n)) diskNumber = n;
  }

  return { productId: mapping.productId, diskNumber, notes: mapping.notes };
}
