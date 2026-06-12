/**
 * Migration script: transforms legacy ndfloppy floppies.json into the new
 * catalog format for the Norsk Data Software Archive.
 */

import { readFile } from 'fs/promises';
import type { LegacyFloppyEntry, CatalogEntry, Catalog, StorageClass } from './types.js';
import { generateId, saveCatalog } from './api/catalog.js';
import { matchProduct } from './api/product-matcher.js';
import { writeIndex } from './api/index-builder.js';

/** Known contributor folder names in the legacy file paths */
const CONTRIBUTOR_MAP: Record<string, string> = {
  'gandalf': 'Gandalf',
  'datormusuem': 'Datormuseum',
  'carl-victor': 'Carl-Victor',
  'frodevdm': 'FrodeVDM',
  'ndwiki': 'NDWIKI',
  'paal': 'Paal',
  'ronny': 'Ronny',
  'tingo': 'Tingo',
  'tor': 'Tor',
  'unpacked': 'Unpacked',
};

/**
 * Infer contributor from the legacy file path.
 * Paths are typically: Z:\NorskData\FloppyImages\<contributor>\...
 */
function inferContributor(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');

  // Expected: Z:/NorskData/FloppyImages/<contributor>/...
  if (parts.length > 3) {
    const folderName = parts[3].toLowerCase();
    if (CONTRIBUTOR_MAP[folderName]) {
      return CONTRIBUTOR_MAP[folderName];
    }
  }

  return 'unknown';
}

/**
 * Check if a string contains only printable ASCII characters.
 */
function isPrintableAscii(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 0x20 || code > 0x7e) return false;
  }
  return true;
}

/**
 * Convert a string to its hex representation for non-printable volume names.
 */
function toHexString(s: string): string {
  const bytes: string[] = [];
  for (let i = 0; i < s.length; i++) {
    bytes.push(s.charCodeAt(i).toString(16).padStart(2, '0'));
  }
  return bytes.join(' ');
}

/**
 * Transform a single legacy entry into a catalog entry.
 */
function transformEntry(legacy: LegacyFloppyEntry): CatalogEntry {
  const md5 = legacy.Md5.toLowerCase();
  const rawName = legacy.Name?.trim() ?? '';

  // Parse volume name
  let volumeName: string | null = null;
  let volumeNameRaw: string | null = null;

  if (rawName.length === 0) {
    volumeName = null;
  } else if (isPrintableAscii(rawName)) {
    volumeName = rawName;
  } else {
    // Garbage / non-printable name
    volumeName = null;
    volumeNameRaw = toHexString(rawName);
  }

  // Match product from volume name
  const productMatch = matchProduct(volumeName);

  // Generate ID
  const id = generateId(md5, volumeName);

  // Infer contributor
  const contributor = inferContributor(legacy.FilePath);

  // Build tags
  const tags: string[] = [];
  if (legacy.Status === 1) {
    tags.push('hidden-in-legacy');
  }

  // Build legacy refs
  const legacyRefs: Record<string, unknown> = {};
  if (legacy.PisheetUrl) legacyRefs.pisheetUrl = legacy.PisheetUrl;
  if (legacy.ArticleUrl) legacyRefs.articleUrl = legacy.ArticleUrl;
  if (legacy.ManualId != null) legacyRefs.manualId = legacy.ManualId;
  if (legacy.ProgramDescriptionId != null) legacyRefs.programDescriptionId = legacy.ProgramDescriptionId;

  // Parse image size from DirectoryContent to determine storage class
  // DirectoryContent often has lines like "Total:  700 pages" or "nnn pages"
  let imageSizeBytes: number | null = null;
  let storageClass: StorageClass | null = null;
  if (legacy.DirectoryContent) {
    const pageMatch = legacy.DirectoryContent.match(/Total:\s*(\d+)\s*pages/i);
    if (pageMatch) {
      const totalPages = parseInt(pageMatch[1], 10);
      // NDFS pages are 1024 bytes
      imageSizeBytes = totalPages * 1024;
    }
  }
  // Default assumption: legacy entries are all floppies (from ndfloppy)
  if (imageSizeBytes !== null && imageSizeBytes > 1_400_000) {
    storageClass = 'ia-only';
  } else {
    storageClass = 'floppy-in-git';
  }

  const entry: CatalogEntry = {
    schemaVersion: '1.0',
    id,
    type: 'floppy',
    md5,
    volumeName,
    volumeNameRaw: volumeNameRaw,
    productId: productMatch?.productId ?? null,
    version: productMatch?.version ?? null,
    diskNumber: productMatch?.diskNumber ?? null,
    diskTotal: null,
    mediaRole: null,
    storageClass,
    imageSizeBytes,
    imageFormat: 'raw',
    controller: 'floppy',
    totalPages: null,
    pageSize: null,
    bootFormat: null,
    cpuTarget: null,
    osRequirement: null,
    ndfs: null,
    directoryContentRaw: legacy.DirectoryContent ?? null,
    docs: null,
    provenance: {
      contributor,
      originalPath: legacy.FilePath,
    },
    storage: {
      git: null,
      internetArchive: {
        itemId: `norskdata-floppy-${id}`,
        syncStatus: 'pending',
      },
      legacyAzure: `https://ndlib.hackercorp.no/images/${md5}.img`,
    },
    variants: null,
    fluxPreservation: null,
    legacyId: legacy.Id,
    legacyRefs: Object.keys(legacyRefs).length > 0 ? legacyRefs as CatalogEntry['legacyRefs'] : null,
    importedAt: new Date().toISOString(),
    tags: tags.length > 0 ? tags : null,
  };

  return entry;
}

/**
 * Run the migration: read legacy JSON, transform all entries, write catalog.
 */
export async function runMigration(
  sourcePath: string,
  rootDir: string
): Promise<void> {
  console.log(`Reading legacy data from ${sourcePath}...`);
  const raw = await readFile(sourcePath, 'utf-8');
  const legacyEntries: LegacyFloppyEntry[] = JSON.parse(raw);

  console.log(`Found ${legacyEntries.length} legacy entries`);

  // Transform all entries
  const entries: CatalogEntry[] = [];
  let matchedProducts = 0;
  let hiddenCount = 0;
  let blankNames = 0;
  let garbageNames = 0;

  for (const legacy of legacyEntries) {
    const entry = transformEntry(legacy);
    entries.push(entry);

    if (entry.productId) matchedProducts++;
    if (entry.tags?.includes('hidden-in-legacy')) hiddenCount++;
    if (!entry.volumeName && !entry.volumeNameRaw) blankNames++;
    if (entry.volumeNameRaw) garbageNames++;
  }

  // Check for ID uniqueness
  const idSet = new Set<string>();
  let idCollisions = 0;
  for (const entry of entries) {
    if (idSet.has(entry.id)) {
      idCollisions++;
      // Resolve collision by appending more of the MD5
      entry.id = `${entry.id}-${entry.md5.slice(8, 16)}`;
    }
    idSet.add(entry.id);
  }

  const catalog: Catalog = { entries };

  // Write catalog
  await saveCatalog(rootDir, catalog);
  console.log(`Wrote ${entries.length} entries to catalog/floppies.json`);

  // Write search index
  await writeIndex(rootDir, catalog);

  // Summary
  console.log('\nMigration summary:');
  console.log(`  Total entries:      ${entries.length}`);
  console.log(`  Product matched:    ${matchedProducts}`);
  console.log(`  Hidden in legacy:   ${hiddenCount}`);
  console.log(`  Blank volume names: ${blankNames}`);
  console.log(`  Garbage names:      ${garbageNames}`);
  console.log(`  ID collisions:      ${idCollisions}`);

  // Verify MD5 uniqueness
  const md5Set = new Set(entries.map(e => e.md5));
  if (md5Set.size !== entries.length) {
    console.warn(`  WARNING: ${entries.length - md5Set.size} duplicate MD5 values found!`);
  } else {
    console.log('  MD5 uniqueness:     OK');
  }
}
