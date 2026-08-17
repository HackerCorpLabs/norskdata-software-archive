#!/usr/bin/env node
/**
 * Proof for lib/ndfsrecover: what the recovery finds on the damaged floppies of
 * this archive, and - just as important - that it refuses to accept a
 * reconstruction the image's own bytes do not back up.
 *
 * Run from the repository root after `npm run build` in tools/:
 *
 *   node tools/scripts/ndfs-recovery-proof.mjs
 *
 * It reads the catalog, builds a layout table from the floppies that read
 * cleanly, and runs the recovery over every floppy recorded as damaged. Nothing
 * is written: the script only reports.
 */

import { readFileSync } from 'fs';
import { gunzipSync } from 'zlib';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..', '..');
const DIST = join(ROOT, 'tools', 'dist');

const { pageAlign } = await import(join(DIST, 'lib/ndfsalign/index.js'));
const recover = await import(join(DIST, 'lib/ndfsrecover/index.js'));
const { NdfsFileSystem } = await import(join(ROOT, 'externals/norskdata-ndfs/ndfs-ts/dist/index.js'));

/** the parser, in the shape the module asks for */
const probe = (image) => {
  try {
    const fs = new NdfsFileSystem(image, true);
    const files = (fs.getObjectEntries?.() ?? [])
      .filter(o => o && o.objectName)
      .map(o => ({ name: o.objectName, type: o.type ?? '', pages: o.pagesAllocated ?? 0 }));
    const users = (fs.getUsers?.() ?? [])
      .filter(u => u && u.userName)
      .map(u => ({ name: u.userName, pagesUsed: u.pagesUsed ?? 0 }));
    return { directoryName: fs.getDirectoryName?.() ?? null, files, users };
  } catch {
    return null;
  }
};

const catalog = JSON.parse(readFileSync(join(ROOT, 'catalog/floppies.json'), 'utf-8'));
const load = (e) => pageAlign(new Uint8Array(gunzipSync(readFileSync(join(ROOT, e.storage.git.imagePath)))));

// 1. learn the layouts from the floppies that read cleanly
const samples = [];
for (const e of catalog) {
  if (e.filesystem !== 'ndfs' || e.condition || !e.storage?.git?.imagePath) continue;
  let image;
  try { image = load(e); } catch { continue; }
  const layout = recover.readLayout(image);
  const pages = Math.floor(image.length / recover.NDFS_PAGE_SIZE);
  if (layout && recover.layoutIsPlausible(layout, pages)) samples.push({ pages, layout });
}
const layouts = recover.buildLayoutTable(samples);
console.log('layout table built from ' + samples.length + ' readable floppies:');
for (const [pages, list] of [...layouts].sort((a, b) => a[0] - b[0])) {
  const l = list[0];
  console.log('   ' + String(pages).padStart(4) + ' pages: ' + list.length + ' known layout(s), first is object ' +
    l.object.blockId + ', user ' + l.user.blockId + ', bit ' + l.bit.blockId);
}

// 2. run it over the damaged floppies
let recovered = 0, unconfirmed = 0, failed = 0, files = 0;
console.log('\ndamaged floppies:');
for (const e of catalog) {
  if (e.condition?.status !== 'damaged' || !e.storage?.git?.imagePath) continue;
  const image = load(e);
  const result = recover.recoverNdfs(image, { probe, layouts });
  const name = e.storage.git.imagePath.split('/').pop();
  if (result.status === 'recovered') {
    recovered++; files += result.best.files.length;
    console.log('  [OK]   ' + name.padEnd(26) + recover.describeRecovery(result));
  } else if (result.status === 'unconfirmed') {
    unconfirmed++;
    console.log('  [??]   ' + name.padEnd(26) + recover.describeRecovery(result));
  } else {
    failed++;
  }
}
console.log('\nrecovered ' + recovered + ' floppies (' + files + ' files), ' +
  unconfirmed + ' unconfirmed lead(s), ' + failed + ' with nothing to show.');

// 3. the check that matters: a deliberately wrong layout must not be accepted
console.log('\nrefusing a wrong reconstruction:');
const victim = catalog.find(e => e.filesystem === 'ndfs' && !e.condition && e.ndfs?.files?.length > 3 && e.storage?.git?.imagePath);
if (victim) {
  const image = load(victim);
  const pages = Math.floor(image.length / recover.NDFS_PAGE_SIZE);
  const wrong = new Map([[pages, [{ object: { blockId: 3, type: 1 }, user: { blockId: 4, type: 1 }, bit: { blockId: 5, type: 0 } }]]]);
  const result = recover.recoverNdfs(image, { probe, layouts: wrong });
  const passed = result.status !== 'recovered';
  console.log('  ' + (passed ? 'PASS' : 'FAIL') + ': pointers at pages 3/4/5 on ' +
    victim.storage.git.imagePath.split('/').pop() + ' -> ' + result.status);
  if (!passed) process.exitCode = 1;
} else {
  console.log('  (no suitable floppy to test with)');
}
