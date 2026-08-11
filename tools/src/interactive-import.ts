#!/usr/bin/env node

/**
 * Interactive floppy image import tool.
 * Prompts the user for all required information, then runs the import pipeline.
 */

import { createInterface } from 'readline';
import { resolve } from 'path';
import { stat, readdir } from 'fs/promises';
import { loadCatalog } from './api/catalog.js';
import { findImageFolders } from './api/import-folder.js';
import { runImportFile, runImportFolder } from './api/import-runner.js';
import { writeIndex } from './api/index-builder.js';
import { buildStaticSite } from './api/static-site-builder.js';

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY ?? false });

let rlClosed = false;
rl.on('close', () => { rlClosed = true; });

function ask(question: string, defaultValue?: string): Promise<string> {
  if (rlClosed) return Promise.resolve(defaultValue || '');
  const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

function askYesNo(question: string, defaultYes = true): Promise<boolean> {
  if (rlClosed) return Promise.resolve(defaultYes);
  const hint = defaultYes ? '[Y/n]' : '[y/N]';
  return new Promise((resolve) => {
    rl.question(`${question} ${hint}: `, (answer) => {
      const a = answer.trim().toLowerCase();
      if (a === '') resolve(defaultYes);
      else resolve(a === 'y' || a === 'yes');
    });
  });
}

function askChoice(question: string, choices: string[]): Promise<number> {
  if (rlClosed) return Promise.resolve(0);
  const lines = [`\n${question}`, ...choices.map((c, i) => `  ${i + 1}. ${c}`), ''];
  return new Promise((resolve) => {
    rl.question(lines.join('\n') + `Choice [1-${choices.length}]: `, (answer) => {
      const n = parseInt(answer.trim(), 10);
      if (n >= 1 && n <= choices.length) resolve(n - 1);
      else resolve(0);
    });
  });
}

function getRepoRoot(): string {
  return resolve(import.meta.dirname ?? '.', '..', '..');
}

async function isDirectory(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function isFile(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

async function countImgFiles(dir: string): Promise<number> {
  try {
    const files = await readdir(dir);
    return files.filter(f => f.toLowerCase().endsWith('.img') || f.toLowerCase().endsWith('.image')).length;
  } catch {
    return 0;
  }
}

async function main() {
  const rootDir = getRepoRoot();

  console.log('');
  console.log('========================================');
  console.log('  Norsk Data Software Archive - Import');
  console.log('========================================');
  console.log('');

  // Load catalog to show current state
  const catalog = await loadCatalog(rootDir);
  console.log(`Current catalog: ${catalog.entries.length} entries\n`);

  // Step 1: What to import
  const mode = await askChoice('What do you want to do?', [
    'Import a single floppy image (.img)',
    'Import a folder of floppy images',
    'Import a folder tree recursively (scans all subfolders)',
    'Search the catalog',
    'Rebuild site and index',
  ]);

  if (mode === 3) {
    // Search
    const query = await ask('Search query');
    if (!query) {
      console.log('No query provided.');
      rl.close();
      return;
    }
    const lowerQuery = query.toLowerCase();
    const results = catalog.entries.filter(e =>
      e.volumeName?.toLowerCase().includes(lowerQuery) ||
      e.productId?.toLowerCase().includes(lowerQuery) ||
      e.id.toLowerCase().includes(lowerQuery) ||
      e.ndfs?.files?.some((f: { name: string }) => f.name.toLowerCase().includes(lowerQuery))
    );
    console.log(`\nFound ${results.length} result(s):\n`);
    for (const e of results.slice(0, 20)) {
      const product = e.productId ? ` (${e.productId} ${e.version ?? ''})` : '';
      const boot = e.bootFormat ? ` [${e.bootFormat}]` : '';
      const storage = e.storageClass === 'floppy-in-git' ? ' [in-git]' : ' [ia-only]';
      console.log(`  ${e.id}  vol=${e.volumeName ?? '?'}${product}${boot}${storage}`);
    }
    if (results.length > 20) console.log(`  ... and ${results.length - 20} more`);
    rl.close();
    return;
  }

  if (mode === 4) {
    // Rebuild
    console.log('\nRebuilding index and site...');
    await writeIndex(rootDir, catalog);
    await buildStaticSite(rootDir);
    console.log('Done. Site is in site/ directory.');
    rl.close();
    return;
  }

  // Step 2: Get the source path
  let sourcePath = '';
  while (true) {
    sourcePath = await ask('Path to image file or folder');
    if (!sourcePath) {
      console.log('No path provided. Exiting.');
      rl.close();
      return;
    }
    sourcePath = resolve(sourcePath);

    if (mode === 0) {
      // Single file
      if (await isFile(sourcePath)) break;
      console.log(`  Not a file: ${sourcePath}`);
    } else {
      // Folder
      if (await isDirectory(sourcePath)) break;
      console.log(`  Not a directory: ${sourcePath}`);
    }
  }

  // Step 3: Show what we found
  if (mode === 0) {
    console.log(`\nFile: ${sourcePath}`);
  } else if (mode === 1) {
    const count = await countImgFiles(sourcePath);
    console.log(`\nFolder: ${sourcePath}`);
    console.log(`Found ${count} .img file(s) in this folder.`);
  } else {
    const folders = await findImageFolders(sourcePath);
    let totalImages = 0;
    for (const f of folders) {
      totalImages += await countImgFiles(f);
    }
    console.log(`\nFolder tree: ${sourcePath}`);
    console.log(`Found ${folders.length} folder(s) containing ${totalImages} .img file(s) total.`);
  }

  // Step 4: Contributor info
  console.log('');
  const contributor = await ask('Contributor name (who imaged/provided these floppies?)', 'unknown');
  const source = await ask('Source description (e.g., "Frode personal collection, 5.25-inch floppies")', 'unknown');

  // Step 5: Confirm
  console.log('');
  console.log('--- Import summary ---');
  console.log(`  Source:      ${sourcePath}`);
  console.log(`  Mode:        ${['single file', 'folder', 'recursive'][mode]}`);
  console.log(`  Contributor: ${contributor}`);
  console.log(`  Source desc: ${source}`);
  console.log('');

  const proceed = await askYesNo('Proceed with import?');
  if (!proceed) {
    console.log('Import cancelled.');
    rl.close();
    return;
  }

  // Step 6: Run the import. The shared runner (api/import-runner.ts) owns the
  // catalog save + JSON regeneration so this wizard and the CLI stay in sync.
  console.log('');
  const runResult = mode === 0
    ? await runImportFile(rootDir, sourcePath, { contributor, source })
    : await runImportFolder(rootDir, sourcePath, { contributor, source, recursive: mode === 2 });

  const totalImported = runResult.imported.length;
  const totalDuplicates = runResult.duplicates;
  const totalErrors = runResult.errors;

  // Step 7: Report
  if (totalImported > 0) {
    console.log(`\n--- Results ---`);
    console.log(`  Imported:   ${totalImported}`);
    console.log(`  Duplicates: ${totalDuplicates}`);
    console.log(`  Errors:     ${totalErrors}`);
    console.log(`  Total in catalog: ${runResult.catalog.entries.length}`);

    // Step 8: Rebuild index + site?
    console.log('');
    const rebuild = await askYesNo('Rebuild search index and site?');
    if (rebuild) {
      console.log('Building index...');
      await writeIndex(rootDir, runResult.catalog);
      console.log('Building site...');
      await buildStaticSite(rootDir);
      console.log('Done.');
    }

    // Step 9: Git commit?
    console.log('');
    const doCommit = await askYesNo('Create a git commit with the imported data?');
    if (doCommit) {
      const { execSync } = await import('child_process');
      const commitMsg = `Import ${totalImported} floppy image(s) from ${contributor}\n\nSource: ${source}\nDuplicates skipped: ${totalDuplicates}`;
      try {
        execSync('git add -A', { cwd: rootDir, stdio: 'pipe' });
        execSync(`git commit -m ${JSON.stringify(commitMsg)}`, { cwd: rootDir, stdio: 'inherit' });
        console.log('\nCommitted.');

        const doPush = await askYesNo('Push to origin?', false);
        if (doPush) {
          execSync('git push origin main', { cwd: rootDir, stdio: 'inherit' });
        }
      } catch (err) {
        console.error('Git commit failed:', err);
      }
    }
  } else {
    console.log('\nNo new images imported.');
    if (totalDuplicates > 0) {
      console.log(`${totalDuplicates} duplicate(s) skipped.`);
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
