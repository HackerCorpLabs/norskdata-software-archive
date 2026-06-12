/**
 * Migration script: Restructure images/ from category-based folders to flat MD5 folders.
 *
 * Before: images/by-product/ND-10079/M07/10079M07-NO-01S.yaml
 * After:  images/62caae43d67b7bfedb18bf17dc079e0d/10079M07-NO-01S.yaml
 *
 * Each floppy gets its own folder named by its full MD5 hash.
 * Photos (disk + set) are copied into the MD5 folder.
 * YAML photo paths are updated to be relative to the new location.
 * The old folder structure is removed after migration.
 */

import { readFile, writeFile, mkdir, copyFile, readdir, stat, rm } from 'fs/promises';
import { join, dirname, basename, relative } from 'path';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { glob } from 'glob';
import { existsSync } from 'fs';

const ROOT_DIR = join(import.meta.dirname, '../..');
const IMAGES_DIR = join(ROOT_DIR, 'images');

interface MigrationEntry {
  yamlPath: string;       // old repo-relative path
  md5: string;
  oldDir: string;         // old absolute directory
  newDir: string;         // new absolute directory
  newDirRel: string;      // new repo-relative directory
  baseName: string;       // filename without .yaml
  diskPhotos: string[];   // old relative photo paths (from YAML)
  setPhotos: string[];    // old relative photo paths (from YAML)
  labelTranscription: string | null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) console.log('=== DRY RUN (no changes will be made) ===\n');

  // 1. Find all YAML files
  const yamlFiles = await glob('**/*.yaml', { cwd: IMAGES_DIR });
  console.log(`Found ${yamlFiles.length} YAML files to migrate.\n`);

  const entries: MigrationEntry[] = [];
  const errors: string[] = [];

  // 2. Parse each YAML and build migration plan
  for (const yf of yamlFiles) {
    const absPath = join(IMAGES_DIR, yf);
    try {
      const raw = await readFile(absPath, 'utf-8');
      const doc = yamlParse(raw);
      if (!doc || !doc.md5) {
        errors.push(`${yf}: no md5 field`);
        continue;
      }

      const md5 = String(doc.md5);
      const oldDir = dirname(absPath);
      const baseName = basename(yf, '.yaml');
      const newDirRel = `images/${md5}`;
      const newDir = join(ROOT_DIR, newDirRel);

      const photos = doc.photos as Record<string, unknown> | undefined;
      const diskPhotos = (photos?.disk as string[] | undefined) ?? [];
      const setPhotos = (photos?.set as string[] | undefined) ?? [];
      const labelTranscription = (photos?.labelTranscription as string | undefined) ?? null;

      entries.push({
        yamlPath: join('images', yf),
        md5,
        oldDir,
        newDir,
        newDirRel,
        baseName,
        diskPhotos,
        setPhotos,
        labelTranscription,
      });
    } catch (e: any) {
      errors.push(`${yf}: ${e.message}`);
    }
  }

  if (errors.length > 0) {
    console.log('ERRORS parsing YAML:');
    errors.forEach(e => console.log(`  - ${e}`));
    console.log('');
  }

  // Check for MD5 collisions (same MD5 = same image, should not happen with dedup)
  const md5Groups = new Map<string, MigrationEntry[]>();
  for (const e of entries) {
    const group = md5Groups.get(e.md5) ?? [];
    group.push(e);
    md5Groups.set(e.md5, group);
  }
  const collisions = [...md5Groups.entries()].filter(([_, v]) => v.length > 1);
  if (collisions.length > 0) {
    console.log('WARNING: MD5 collisions (multiple YAMLs for same MD5):');
    for (const [md5, group] of collisions) {
      console.log(`  ${md5}:`);
      group.forEach(e => console.log(`    - ${e.yamlPath}`));
    }
    console.log('These are likely duplicates/variants. Only the first will be migrated.\n');
  }

  // 3. Execute migration
  let migrated = 0;
  let photosCopied = 0;
  const oldDirs = new Set<string>();

  for (const e of entries) {
    // Skip duplicates (keep first)
    if (collisions.some(([md5]) => md5 === e.md5)) {
      const group = md5Groups.get(e.md5)!;
      if (group[0] !== e) {
        console.log(`  SKIP (duplicate): ${e.yamlPath}`);
        continue;
      }
    }

    const newYamlPath = join(e.newDir, e.baseName + '.yaml');
    const newImgPath = join(e.newDir, e.baseName + '.img.gz');
    const oldImgPath = join(e.oldDir, e.baseName + '.img.gz');

    // Track old dirs for cleanup
    oldDirs.add(e.oldDir);

    if (dryRun) {
      console.log(`  ${e.yamlPath}`);
      console.log(`    -> ${e.newDirRel}/${e.baseName}.yaml`);
      if (e.diskPhotos.length) console.log(`    photos (disk): ${e.diskPhotos.join(', ')}`);
      if (e.setPhotos.length) console.log(`    photos (set): ${e.setPhotos.join(', ')}`);
      if (e.labelTranscription) console.log(`    labels: ${e.labelTranscription}`);
      migrated++;
      continue;
    }

    // Create new directory
    await mkdir(e.newDir, { recursive: true });

    // Copy image file
    if (existsSync(oldImgPath)) {
      await copyFile(oldImgPath, newImgPath);
    } else {
      console.log(`  WARN: no .img.gz for ${e.yamlPath}`);
    }

    // Copy and remap photos
    const newDiskPhotos: string[] = [];
    const newSetPhotos: string[] = [];
    let newLabelTrans: string | null = null;

    // Disk photos (relative to old YAML dir)
    for (const p of e.diskPhotos) {
      const srcAbs = join(e.oldDir, p);
      if (existsSync(srcAbs)) {
        const photoName = basename(p);
        await copyFile(srcAbs, join(e.newDir, photoName));
        newDiskPhotos.push(photoName);
        photosCopied++;
      } else {
        console.log(`  WARN: disk photo not found: ${srcAbs}`);
      }
    }

    // Set photos (relative to old YAML dir, usually _set/xxx.JPG)
    for (const p of e.setPhotos) {
      const srcAbs = join(e.oldDir, p);
      if (existsSync(srcAbs)) {
        const photoName = basename(p);
        await copyFile(srcAbs, join(e.newDir, photoName));
        newSetPhotos.push(photoName);
        photosCopied++;
      } else {
        console.log(`  WARN: set photo not found: ${srcAbs}`);
      }
    }

    // Label transcription
    if (e.labelTranscription) {
      const srcAbs = join(e.oldDir, e.labelTranscription);
      if (existsSync(srcAbs)) {
        await copyFile(srcAbs, join(e.newDir, 'labels.txt'));
        newLabelTrans = 'labels.txt';
        photosCopied++;
      }
    }

    // Read and update YAML
    const raw = await readFile(join(IMAGES_DIR, relative(IMAGES_DIR, join(e.oldDir, e.baseName + '.yaml'))), 'utf-8');
    const doc = yamlParse(raw);

    // Update photo paths in YAML (now flat, no _set/ prefix)
    if (doc.photos) {
      doc.photos.disk = newDiskPhotos;
      doc.photos.set = newSetPhotos;
      if (newLabelTrans) {
        doc.photos.labelTranscription = newLabelTrans;
      } else {
        delete doc.photos.labelTranscription;
      }
    }

    // Write updated YAML to new location
    await writeFile(newYamlPath, yamlStringify(doc, { lineWidth: 0 }));
    migrated++;
  }

  console.log(`\nMigrated: ${migrated} floppies, ${photosCopied} photos/assets copied.`);

  if (!dryRun) {
    // 4. Clean up old directory structure
    console.log('\nCleaning up old directories...');
    const oldTopDirs = ['by-product', 'os-distributions', 'patches', 'uncategorized', 'labels'];
    for (const d of oldTopDirs) {
      const absDir = join(IMAGES_DIR, d);
      if (existsSync(absDir)) {
        await rm(absDir, { recursive: true });
        console.log(`  Removed: images/${d}/`);
      }
    }

    // 5. Regenerate catalog
    console.log('\nRegenerating catalog/floppies.json...');
    const { generateCatalogJson } = await import('./api/catalog.js');
    await generateCatalogJson(ROOT_DIR);
    console.log('Done.');
  }
}

main().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
