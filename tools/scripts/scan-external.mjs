#!/usr/bin/env node
/**
 * Find floppy images on a disk that the archive does not have.
 *
 * Walks one or more folders, hashes every image small enough to be a floppy,
 * and compares those hashes against the catalog. The archive is
 * content-addressed on the MD5 of the raw .img, so a file already held is
 * recognised whatever it is called and wherever it sits - and a file the
 * archive lacks is reported with the folder it came from, which is usually how
 * a collection was organised in the first place.
 *
 * Usage, from the repository root:
 *
 *   node tools/scripts/scan-external.mjs <folder> [folder...] [options]
 *
 *   --max-mb <n>    largest image to consider, in MB (default 2)
 *   --ext <list>    extensions to look at (default img,image)
 *   --out <file>    write the full report here as well as to the screen
 *   --json <file>   write the findings as JSON, for scripting an import
 *
 * The folders are arguments on purpose: this script lives in the repository, so
 * it must not carry paths that only exist on one machine.
 *
 * Nothing is imported, moved or changed - it only reads and reports.
 */

import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { readdir, stat, readFile, writeFile } from 'fs/promises';
import { join, dirname, extname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', '..');

// ── arguments ────────────────────────────────────────────────
const argv = process.argv.slice(2);
const roots = [];
let maxBytes = 2 * 1024 * 1024;
let exts = ['.img', '.image'];
let outFile = null;
let jsonFile = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--max-mb') maxBytes = Math.round(parseFloat(argv[++i]) * 1024 * 1024);
  else if (a === '--ext') exts = argv[++i].split(',').map(e => '.' + e.replace(/^\./, '').toLowerCase());
  else if (a === '--out') outFile = argv[++i];
  else if (a === '--json') jsonFile = argv[++i];
  else if (a.startsWith('-')) { console.error('Unknown option: ' + a); process.exit(2); }
  else roots.push(a);
}
if (!roots.length) {
  console.error('Usage: node tools/scripts/scan-external.mjs <folder> [folder...] [--max-mb 2] [--ext img,image] [--out report.txt] [--json found.json]');
  process.exit(2);
}

// ── what the archive already holds ───────────────────────────
const catalog = JSON.parse(await readFile(join(ROOT, 'catalog/floppies.json'), 'utf-8'));
const known = new Map();               // md5 -> how the archive names it
for (const e of catalog) {
  const name = (e.storage?.git?.imagePath?.split('/').pop() ?? e.id).replace(/\.img\.gz$/i, '');
  if (e.md5) known.set(e.md5.toLowerCase(), { id: e.id, name, volumeName: e.volumeName ?? null });
  // alternative imagings of the same media are recorded as variants
  for (const v of e.variants ?? []) if (v.md5) known.set(v.md5.toLowerCase(), { id: e.id, name, volumeName: e.volumeName ?? null, variant: true });
}
console.log('archive holds ' + known.size + ' image hash(es) across ' + catalog.length + ' entries');
console.log('scanning for ' + exts.join(', ') + ' up to ' + (maxBytes / 1048576).toFixed(1) + ' MB\n');

// ── walk and hash ────────────────────────────────────────────
const md5 = (path) => new Promise((res, rej) => {
  const h = createHash('md5');
  createReadStream(path).on('data', d => h.update(d)).on('end', () => res(h.digest('hex'))).on('error', rej);
});

const found = [];          // { path, folder, name, bytes, md5, inArchive, archiveName }
let scanned = 0, skippedBig = 0, unreadable = 0;

async function walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { unreadable++; return; }
  for (const ent of entries) {
    const path = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === '$RECYCLE.BIN' || ent.name === 'System Volume Information' || ent.name.startsWith('@')) continue;
      await walk(path);
      continue;
    }
    if (!ent.isFile()) continue;
    if (!exts.includes(extname(ent.name).toLowerCase())) continue;
    let s;
    try { s = await stat(path); } catch { unreadable++; continue; }
    if (s.size > maxBytes) { skippedBig++; continue; }
    if (s.size === 0) continue;
    let hash;
    try { hash = await md5(path); } catch { unreadable++; continue; }
    scanned++;
    const hit = known.get(hash);
    found.push({
      path, folder: dirname(path), name: ent.name, bytes: s.size, md5: hash,
      inArchive: !!hit, archiveName: hit ? (hit.volumeName || hit.name) : null, archiveId: hit ? hit.id : null,
    });
    if (scanned % 200 === 0) process.stderr.write('  hashed ' + scanned + ' image(s)...\r');
  }
}

for (const r of roots) {
  const abs = resolve(r);
  console.log('walking ' + abs);
  await walk(abs);
}
process.stderr.write('\r');

// ── report ───────────────────────────────────────────────────
const lines = [];
const say = (s = '') => { lines.push(s); console.log(s); };

const missing = found.filter(f => !f.inArchive);
const held = found.filter(f => f.inArchive);

// the same image can sit in several places on the disk
const byHash = new Map();
for (const f of missing) {
  if (!byHash.has(f.md5)) byHash.set(f.md5, []);
  byHash.get(f.md5).push(f);
}

say('');
say('=== summary ===');
say('images scanned            : ' + scanned);
say('already in the archive    : ' + held.length);
say('NOT in the archive        : ' + missing.length + ' file(s), ' + byHash.size + ' distinct image(s)');
say('skipped, larger than limit: ' + skippedBig);
if (unreadable) say('unreadable paths          : ' + unreadable);

say('');
say('=== folders holding images the archive lacks ===');
const byFolder = new Map();
for (const f of missing) {
  if (!byFolder.has(f.folder)) byFolder.set(f.folder, []);
  byFolder.get(f.folder).push(f);
}
const folders = [...byFolder.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
for (const [folder, files] of folders) {
  const bytes = files.reduce((n, f) => n + f.bytes, 0);
  const alsoHeld = found.filter(f => f.folder === folder && f.inArchive).length;
  say('  ' + String(files.length).padStart(4) + ' new  ' + (bytes / 1048576).toFixed(1).padStart(7) + ' MB  ' +
    folder + (alsoHeld ? '   (' + alsoHeld + ' of its images are already held)' : ''));
}

say('');
say('=== every image the archive lacks ===');
for (const [folder, files] of folders) {
  say('  ' + folder);
  for (const f of files.sort((a, b) => a.name.localeCompare(b.name))) {
    const dupes = byHash.get(f.md5).filter(o => o.path !== f.path);
    say('     ' + f.md5 + '  ' + String(f.bytes).padStart(8) + '  ' + f.name +
      (dupes.length ? '   (same bytes as ' + dupes.length + ' other copy/copies)' : ''));
  }
}

if (outFile) {
  await writeFile(outFile, lines.join('\n') + '\n', 'utf-8');
  console.log('\nreport written to ' + resolve(outFile));
}
if (jsonFile) {
  await writeFile(jsonFile, JSON.stringify({
    roots: roots.map(r => resolve(r)), maxBytes, exts, scanned,
    missing: [...byHash.values()].map(copies => ({
      md5: copies[0].md5, bytes: copies[0].bytes, paths: copies.map(c => c.path),
    })),
  }, null, 2) + '\n', 'utf-8');
  console.log('findings written to ' + resolve(jsonFile));
}
