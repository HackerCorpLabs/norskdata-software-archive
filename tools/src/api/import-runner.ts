/**
 * Shared import orchestration for all console entry points.
 *
 * The actual import work lives in import.ts (importImage) and import-folder.ts
 * (importFolder). This module wraps them with the common "envelope" every
 * caller needs -- load the catalog, run the import, then persist the catalog
 * JSON -- so that the CLI commands (cli.ts) and the interactive wizard
 * (interactive-import.ts) cannot drift apart.
 *
 * IMPORTANT: persisting regenerates catalog/floppies.json + products.json from
 * the YAML source of truth (generateCatalogJson) -- never from an in-memory
 * snapshot. Do not persist the catalog any other way from an import path.
 */

import { loadCatalog, generateCatalogJson, consolidateGroupPhotos } from './catalog.js';
import { writeIndex } from './index-builder.js';
import { buildStaticSite } from './static-site-builder.js';
import { importImage } from './import.js';
import { importFolder, findImageFolders } from './import-folder.js';
import type { Catalog, CatalogEntry } from '../types.js';

export interface ImportRunOptions {
  contributor: string;
  source?: string;
}

export interface ImportRunResult {
  /** The catalog after the import (includes newly imported entries). */
  catalog: Catalog;
  /** Newly imported entries (excludes duplicates). */
  imported: CatalogEntry[];
  duplicates: number;
  variants: number;
  errors: number;
}

/**
 * Consolidate set photos, then regenerate the catalog JSON + index + static
 * site from the YAML source of truth. Called once, only when something was
 * actually imported.
 */
async function persistCatalog(rootDir: string): Promise<void> {
  // Move any newly-imported set photos into their product+version group folder
  // (collections/{slug}/) so they aren't duplicated per disk. The catalog JSON
  // is then regenerated from the YAML source of truth -- never written from an
  // in-memory snapshot.
  await consolidateGroupPhotos(rootDir);
  await generateCatalogJson(rootDir);
  // Rebuild the presentation artifacts too, so a CLI import leaves the catalog
  // in exactly the same state as a web UI import: search index + static site.
  const fresh = await loadCatalog(rootDir);
  await writeIndex(rootDir, fresh);
  await buildStaticSite(rootDir);
}

/**
 * Import a single image file and persist the catalog.
 * Errors and duplicates are recorded in the result rather than thrown, so every
 * caller reports them the same way.
 */
export async function runImportFile(
  rootDir: string,
  filePath: string,
  options: ImportRunOptions
): Promise<ImportRunResult> {
  const catalog = await loadCatalog(rootDir);
  const result: ImportRunResult = { catalog, imported: [], duplicates: 0, variants: 0, errors: 0 };

  try {
    const r = await importImage(catalog, filePath, rootDir, {
      contributor: options.contributor,
      source: options.source,
    });

    if (r.isDuplicate) {
      result.duplicates = 1;
      return result;
    }
    if (r.isVariant) result.variants = 1;

    catalog.entries.push(r.entry);
    result.imported.push(r.entry);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  [ERROR] ${filePath}: ${msg}`);
    result.errors = 1;
    return result;
  }

  await persistCatalog(rootDir);
  return result;
}

/**
 * Import every image in a folder (optionally recursing into subfolders) and
 * persist the catalog. importFolder already pushes successful imports into the
 * catalog, so this only aggregates counts and persists once at the end.
 */
export async function runImportFolder(
  rootDir: string,
  folderPath: string,
  options: ImportRunOptions & { recursive?: boolean }
): Promise<ImportRunResult> {
  const catalog = await loadCatalog(rootDir);
  const result: ImportRunResult = { catalog, imported: [], duplicates: 0, variants: 0, errors: 0 };

  const folders = options.recursive ? await findImageFolders(folderPath) : [folderPath];
  if (options.recursive) console.log(`Found ${folders.length} folder(s) with image files\n`);

  for (const folder of folders) {
    if (options.recursive) console.log(`\nProcessing: ${folder}`);
    const r = await importFolder(catalog, folder, {
      contributor: options.contributor,
      source: options.source ?? 'unknown',
      rootDir,
    });
    result.imported.push(...r.imported);
    result.duplicates += r.duplicates.length;
    result.variants += r.variants.length;
    result.errors += r.errors.length;
  }

  if (result.imported.length > 0) await persistCatalog(rootDir);
  return result;
}
