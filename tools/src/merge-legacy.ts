/**
 * Merge legacy ndfloppy entries into the existing catalog.
 * Unlike migrate.ts which replaces, this merges (skips duplicates by MD5).
 */

import { readFile } from 'fs/promises';
import type { LegacyFloppyEntry, CatalogEntry, Catalog } from './types.js';
import { loadCatalog, generateId, saveCatalog } from './api/catalog.js';
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

function inferContributor(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  if (parts.length > 3) {
    const folderName = parts[3].toLowerCase();
    if (CONTRIBUTOR_MAP[folderName]) {
      return CONTRIBUTOR_MAP[folderName];
    }
  }
  return 'unknown';
}

function isPrintableAscii(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 0x20 || code > 0x7e) return false;
  }
  return true;
}

function toHexString(s: string): string {
  const bytes: string[] = [];
  for (let i = 0; i < s.length; i++) {
    bytes.push(s.charCodeAt(i).toString(16).padStart(2, '0'));
  }
  return bytes.join(' ');
}

/**
 * Transform a legacy entry into a catalog entry.
 * Key difference from migrate.ts: storageClass is always 'ia-only' for legacy.
 */
function transformLegacyEntry(legacy: LegacyFloppyEntry): CatalogEntry {
  const md5 = legacy.Md5.toLowerCase();
  const rawName = legacy.Name?.trim() ?? '';

  let volumeName: string | null = null;
  let volumeNameRaw: string | null = null;

  if (rawName.length === 0) {
    volumeName = null;
  } else if (isPrintableAscii(rawName)) {
    volumeName = rawName;
  } else {
    volumeName = null;
    volumeNameRaw = toHexString(rawName);
  }

  const productMatch = matchProduct(volumeName);
  const id = generateId(md5, volumeName);
  const contributor = inferContributor(legacy.FilePath);

  const tags: string[] = [];
  if (legacy.Status === 1) {
    tags.push('hidden-in-legacy');
  }

  const legacyRefs: Record<string, unknown> = {};
  if (legacy.PisheetUrl) legacyRefs.pisheetUrl = legacy.PisheetUrl;
  if (legacy.ArticleUrl) legacyRefs.articleUrl = legacy.ArticleUrl;
  if (legacy.ManualId != null) legacyRefs.manualId = legacy.ManualId;
  if (legacy.ProgramDescriptionId != null) legacyRefs.programDescriptionId = legacy.ProgramDescriptionId;

  let imageSizeBytes: number | null = null;
  if (legacy.DirectoryContent) {
    const pageMatch = legacy.DirectoryContent.match(/Total:\s*(\d+)\s*pages/i);
    if (pageMatch) {
      imageSizeBytes = parseInt(pageMatch[1], 10) * 1024;
    }
  }

  const entry: CatalogEntry = {
    schemaVersion: '1.0',
    id,
    type: 'floppy',
    md5,
    volumeName,
    volumeNameRaw,
    productId: productMatch?.productId ?? null,
    version: productMatch?.version ?? null,
    systemNumber: null,
    diskNumber: productMatch?.diskNumber ?? null,
    diskTotal: null,
    mediaRole: null,
    storageClass: 'ia-only',
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
 * Run the merge: reads legacy JSON, merges with existing catalog.
 */
export async function runMergeLegacy(
  sourcePath: string,
  rootDir: string
): Promise<void> {
  console.log(`Reading legacy data from ${sourcePath}...`);
  const raw = await readFile(sourcePath, 'utf-8');
  const legacyEntries: LegacyFloppyEntry[] = JSON.parse(raw);
  console.log(`Found ${legacyEntries.length} legacy entries`);

  console.log(`Loading existing catalog...`);
  const catalog = await loadCatalog(rootDir);
  const existingCount = catalog.entries.length;
  console.log(`Existing catalog has ${existingCount} entries`);

  // Build set of existing MD5s for dedup
  const existingMd5s = new Set(catalog.entries.map(e => e.md5));

  let added = 0;
  let skipped = 0;
  let matchedProducts = 0;
  let hiddenCount = 0;

  for (const legacy of legacyEntries) {
    const md5 = legacy.Md5.toLowerCase();
    if (existingMd5s.has(md5)) {
      skipped++;
      continue;
    }

    const entry = transformLegacyEntry(legacy);
    catalog.entries.push(entry);
    existingMd5s.add(md5);
    added++;

    if (entry.productId) matchedProducts++;
    if (entry.tags?.includes('hidden-in-legacy')) hiddenCount++;
  }

  // Check for ID uniqueness across all entries
  const idSet = new Set<string>();
  let idCollisions = 0;
  for (const entry of catalog.entries) {
    if (idSet.has(entry.id)) {
      idCollisions++;
      entry.id = `${entry.id}-${entry.md5.slice(8, 16)}`;
    }
    idSet.add(entry.id);
  }

  // Save catalog
  await saveCatalog(rootDir, catalog);
  console.log(`Wrote ${catalog.entries.length} entries to catalog/floppies.json`);

  // Write search index
  await writeIndex(rootDir, catalog);

  // Summary
  console.log('\nMerge summary:');
  console.log(`  Existing entries:   ${existingCount}`);
  console.log(`  Legacy entries:     ${legacyEntries.length}`);
  console.log(`  Added (new):        ${added}`);
  console.log(`  Skipped (dups):     ${skipped}`);
  console.log(`  Total now:          ${catalog.entries.length}`);
  console.log(`  Product matched:    ${matchedProducts}`);
  console.log(`  Hidden in legacy:   ${hiddenCount}`);
  console.log(`  ID collisions:      ${idCollisions}`);

  // Verify MD5 uniqueness
  const md5Set = new Set(catalog.entries.map(e => e.md5));
  if (md5Set.size !== catalog.entries.length) {
    console.warn(`  WARNING: ${catalog.entries.length - md5Set.size} duplicate MD5 values!`);
  } else {
    console.log('  MD5 uniqueness:     OK');
  }
}
