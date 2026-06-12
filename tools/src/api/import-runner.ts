/**
 * Shared import orchestration for all console entry points.
 *
 * The actual import work lives in import.ts (importImage) and import-folder.ts
 * (importFolder). This module wraps them with the common "envelope" every
 * caller needs -- load the catalog, run the import, then persist the catalog
 * JSON -- so that the CLI commands (cli.ts) and the interactive wizard
 * (interactive-import.ts) cannot drift apart.
 *
 * IMPORTANT: persisting always runs both saveCatalog AND generateCatalogJson,
 * so catalog/floppies.json and catalog/products.json are regenerated from the
 * YAML source of truth in exactly one place. Do not persist the catalog any
 * other way from an import path.
 */

import { loadCatalog, saveCatalog, generateCatalogJson, consolidateGroupPhotos } from './catalog.js';
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
 * Write floppies.json from the in-memory catalog, then regenerate
 * catalog/floppies.json + catalog/products.json from the YAML source of truth.
 * Called once, only when something was actually imported.
 */
async function persistCatalog(rootDir: string, catalog: Catalog): Promise<void> {
  // Move any newly-imported set photos into their product+version group folder
  // (collections/{slug}/) so they aren't duplicated per disk.
  await consolidateGroupPhotos(rootDir);
  await saveCatalog(rootDir, catalog);
  await generateCatalogJson(rootDir);
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

  await persistCatalog(rootDir, catalog);
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

  if (result.imported.length > 0) await persistCatalog(rootDir, catalog);
  return result;
}
