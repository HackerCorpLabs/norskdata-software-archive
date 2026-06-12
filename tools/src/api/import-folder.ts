/**
 * Folder importer for the Norsk Data Software Archive.
 *
 * Each image gets its own MD5-based folder: images/{md5}/
 * Set photos and labels are copied into each image's folder.
 * Per-disk photos go next to their .img.gz.
 *
 * Re-importing the same folder does nothing -- MD5 dedup catches it.
 */

import { readdir, stat, readFile, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import { createHash } from 'crypto';
import type { Catalog, CatalogEntry } from '../types.js';
import {
  importImage,
  scanFolderArtifacts,
  copySetArtifacts,
  type ImportOptions,
} from './import.js';
import { checkDuplicate } from './dedup.js';
import { matchProduct } from './product-matcher.js';

export interface FolderImportOptions {
  contributor: string;
  source: string;
  rootDir: string;
  skipDuplicates?: boolean;
}

export interface FolderImportResult {
  imported: CatalogEntry[];
  duplicates: string[];
  variants: string[];
  errors: Array<{ file: string; error: string }>;
}

/**
 * Import all .img files from a folder into the appropriate target directory.
 */
export async function importFolder(
  catalog: Catalog,
  folderPath: string,
  options: FolderImportOptions
): Promise<FolderImportResult> {
  const result: FolderImportResult = {
    imported: [],
    duplicates: [],
    variants: [],
    errors: [],
  };

  let allFiles: string[];
  try {
    allFiles = await readdir(folderPath);
  } catch (err) {
    throw new Error(`Cannot read folder: ${folderPath}: ${err}`);
  }

  const imgFiles = allFiles.filter(f => extname(f).toLowerCase() === '.img').sort();
  if (imgFiles.length === 0) {
    console.log(`No .img files found in ${folderPath}`);
    return result;
  }

  console.log(`Found ${imgFiles.length} image file(s) in ${folderPath}`);

  // ── Pre-scan: compute MD5 for all images, check for duplicates ──
  const shouldSkip = options.skipDuplicates !== false;
  const newImages: Array<{ file: string; md5: string; buffer: Buffer }> = [];

  for (const imgFile of imgFiles) {
    const filePath = join(folderPath, imgFile);
    try {
      const buffer = await readFile(filePath);
      const md5 = createHash('md5').update(buffer).digest('hex');
      const dup = checkDuplicate(catalog, md5);

      if (dup.isDuplicate) {
        if (shouldSkip) {
          console.log(`  [SKIP] ${imgFile} - duplicate of ${dup.existingEntry?.id}`);
          result.duplicates.push(imgFile);
          continue;
        }
      }
      newImages.push({ file: imgFile, md5, buffer });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] ${imgFile}: ${msg}`);
      result.errors.push({ file: imgFile, error: msg });
    }
  }

  if (newImages.length === 0) {
    console.log('  All images already in catalog, nothing to import.');
    return result;
  }

  // ── Parse volume names for artifact matching ──
  const volumeNames: (string | null)[] = [];

  for (const img of newImages) {
    let volName: string | null = null;
    try {
      const ndfs = await import('norskdata-ndfs');
      const fs = new ndfs.NdfsFileSystem(new Uint8Array(img.buffer), true);
      volName = fs.getDirectoryName?.() ?? null;
    } catch { /* ignore */ }
    volumeNames.push(volName);
  }

  // ── Scan set-level artifacts from source folder ──
  const imgFilenames = newImages.map(i => i.file);
  const artifacts = await scanFolderArtifacts(folderPath, imgFilenames, volumeNames);

  // ── Import each image into its own MD5-based directory ──
  for (let i = 0; i < newImages.length; i++) {
    const img = newImages[i];
    const filePath = join(folderPath, img.file);
    const targetDir = `images/${img.md5}`;
    await mkdir(join(options.rootDir, targetDir), { recursive: true });
    const myDiskPhotos = artifacts.diskPhotos.get(img.file) ?? [];

    // Copy set artifacts into this image's folder
    const setResult = await copySetArtifacts(options.rootDir, folderPath, targetDir, artifacts);

    try {
      const importOpts: ImportOptions = {
        contributor: options.contributor,
        source: options.source,
        sourceDir: folderPath,
        targetDir,
        setArtifacts: setResult,
        diskPhotoFiles: myDiskPhotos,
      };

      const importResult = await importImage(catalog, filePath, options.rootDir, importOpts);

      if (importResult.isDuplicate) {
        console.log(`  [SKIP] ${img.file} - duplicate of ${importResult.entry.id}`);
        result.duplicates.push(img.file);
        continue;
      }

      if (importResult.isVariant) {
        console.log(`  [VARIANT] ${img.file} - variant of existing entry`);
        result.variants.push(img.file);
      }

      catalog.entries.push(importResult.entry);
      result.imported.push(importResult.entry);
      console.log(`  [OK] ${img.file} -> ${importResult.entry.id} (${importResult.entry.storageClass})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] ${img.file}: ${msg}`);
      result.errors.push({ file: img.file, error: msg });
    }
  }

  return result;
}

/**
 * Recursively scan a directory for subfolders containing image files.
 * @param imageExts - extensions to look for (default: ['.img', '.image'])
 */
export async function findImageFolders(basePath: string, imageExts?: string[]): Promise<string[]> {
  const exts = new Set((imageExts ?? ['.img', '.image']).map(e => e.toLowerCase()));
  const folders: string[] = [];

  async function scan(dir: string): Promise<void> {
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return;
    }

    let hasImages = false;
    const subdirs: string[] = [];

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        const s = await stat(fullPath);
        if (s.isDirectory()) {
          subdirs.push(fullPath);
        } else if (s.isFile() && exts.has(extname(entry).toLowerCase())) {
          hasImages = true;
        }
      } catch { /* skip */ }
    }

    if (hasImages) folders.push(dir);
    for (const subdir of subdirs) await scan(subdir);
  }

  await scan(basePath);
  return folders;
}
