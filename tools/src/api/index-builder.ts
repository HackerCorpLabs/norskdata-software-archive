/**
 * Index builder: creates catalog/index.json for fast search lookups.
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import type { Catalog, IndexEntry } from '../types.js';

const MAX_DIRECTORY_CONTENT_LENGTH = 500;

/**
 * Build a search index from the catalog.
 */
export function buildIndex(catalog: Catalog): IndexEntry[] {
  return catalog.entries.map(entry => ({
    id: entry.id,
    volumeName: entry.volumeName,
    // What the imaging called it - ND-disk-00283. For a floppy with no volume
    // name that is the only name anyone has for it, and it is what is written
    // on the disk label, so it has to be searchable.
    imageName: (entry.storage?.git?.imagePath?.split('/').pop() ?? '').replace(/\.img\.gz$/i, '').replace(/\.img$/i, '') || null,
    volumeLabel: entry.volumeLabel ?? null,
    productId: entry.productId,
    tags: entry.tags,
    directoryContentRaw: entry.directoryContentRaw
      ? entry.directoryContentRaw.slice(0, MAX_DIRECTORY_CONTENT_LENGTH)
      : null,
  }));
}

/**
 * Build and write the index file to catalog/index.json.
 */
export async function writeIndex(rootDir: string, catalog: Catalog): Promise<void> {
  const index = buildIndex(catalog);
  const filePath = join(rootDir, 'catalog/index.json');
  const json = JSON.stringify(index, null, 2) + '\n';
  await writeFile(filePath, json, 'utf-8');
  console.log(`Wrote ${index.length} entries to ${filePath}`);
}
