/**
 * Extract legacy (metadata-only) entries from catalog/floppies.json
 * into catalog/legacy.json. These entries have no .img.gz files.
 * Run once during the YAML-per-floppy transition.
 */

import { readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import type { CatalogEntry } from './types.js';

function getRepoRoot(): string {
  return resolve(import.meta.dirname ?? '.', '..', '..');
}

async function extractLegacy(): Promise<void> {
  const rootDir = getRepoRoot();
  const floppiesFile = join(rootDir, 'catalog', 'floppies.json');

  console.log('Reading catalog/floppies.json...');
  const raw = await readFile(floppiesFile, 'utf-8');
  const entries: CatalogEntry[] = JSON.parse(raw);

  const legacy = entries.filter(e => !e.storage?.git?.imagePath);
  const withImage = entries.filter(e => e.storage?.git?.imagePath);

  console.log(`Total entries: ${entries.length}`);
  console.log(`Legacy (no image): ${legacy.length}`);
  console.log(`With image: ${withImage.length}`);

  const legacyFile = join(rootDir, 'catalog', 'legacy.json');
  await writeFile(legacyFile, JSON.stringify(legacy, null, 2) + '\n', 'utf-8');
  console.log(`Wrote catalog/legacy.json with ${legacy.length} entries.`);
}

extractLegacy().catch(err => {
  console.error('Extract legacy failed:', err);
  process.exit(1);
});
