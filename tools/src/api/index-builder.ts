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
