// Exhaustive YAML round-trip proof.
//
// For a real floppy entry, set a distinct sentinel on EVERY field that is
// supposed to survive, write it to YAML (entryToYamlDoc via saveFloppyYaml),
// reload it from YAML (yamlDocToEntry via loadCatalog), and assert each sentinel
// came back. Any field that does NOT come back is a read-without-write gap
// (the exact class that made mediaRole revert).
//
// Run from repo root:  node tools/scripts/roundtrip-proof.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const { loadCatalog, saveFloppyYaml } = await import(join(ROOT, 'tools/dist/api/catalog.js'));

const cat = await loadCatalog(ROOT);
const entry = cat.entries.find(e => e.storage?.git?.yamlPath);
if (!entry) { console.error('No floppy with a YAML path; import some first.'); process.exit(2); }
const yamlAbs = join(ROOT, entry.storage.git.yamlPath);
const snapshot = readFileSync(yamlAbs, 'utf-8');

// field -> [setter, getter, expected]. Covers scalars, arrays and nested objects
// that are meant to persist. (id/md5/ndfs/storage paths are structural keys, not
// user-editable metadata, so they are excluded.)
const TS = '2099-12-31T23:59:59.000Z';
const cases = [
  ['volumeName',            e => e.volumeName = 'RT-VOL',          e => e.volumeName,            'RT-VOL'],
  ['productId',             e => e.productId = 'ND-99999',         e => e.productId,             'ND-99999'],
  ['version',               e => e.version = 'RTv',                e => e.version,               'RTv'],
  ['diskNumber',            e => e.diskNumber = 7,                 e => e.diskNumber,            7],
  ['diskTotal',             e => e.diskTotal = 9,                  e => e.diskTotal,             9],
  ['mediaRole',             e => e.mediaRole = 'RT-media',         e => e.mediaRole,             'RT-media'],
  ['storageClass',          e => e.storageClass = 'floppy-in-git', e => e.storageClass,          'floppy-in-git'],
  ['imageSizeBytes',        e => e.imageSizeBytes = 424242,        e => e.imageSizeBytes,        424242],
  ['imageFormat',           e => e.imageFormat = 'raw',            e => e.imageFormat,           'raw'],
  ['controller',            e => e.controller = 'RT-ctrl',         e => e.controller,            'RT-ctrl'],
  ['totalPages',            e => e.totalPages = 1234,              e => e.totalPages,            1234],
  ['pageSize',              e => e.pageSize = 4096,                e => e.pageSize,              4096],
  ['bootFormat',            e => e.bootFormat = 'RT-boot',         e => e.bootFormat,            'RT-boot'],
  ['cpuTarget',             e => e.cpuTarget = ['RT-cpu'],         e => (e.cpuTarget||[])[0],    'RT-cpu'],
  ['osRequirement',         e => e.osRequirement = 'RT-os',        e => e.osRequirement,         'RT-os'],
  ['importedAt',            e => e.importedAt = TS,                e => e.importedAt,            TS],
  ['tags',                  e => e.tags = ['RT-tag'],              e => (e.tags||[]).join(','),  'RT-tag'],
  ['provenance.contributor',e => (e.provenance ??= {}).contributor = 'RT-by', e => e.provenance?.contributor, 'RT-by'],
  ['provenance.notes',      e => (e.provenance ??= {}).notes = 'RT-note',      e => e.provenance?.notes,       'RT-note'],
  ['docs.piDocId',          e => (e.docs ??= {}).piDocId = 'RT-pi', e => e.docs?.piDocId,        'RT-pi'],
];

for (const [, set] of cases) set(entry);
await saveFloppyYaml(ROOT, entry);

const reloaded = (await loadCatalog(ROOT)).entries.find(e => e.id === entry.id);

let pass = 0, fail = 0;
for (const [name, , get, expected] of cases) {
  const got = get(reloaded);
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  console.log(`  ${ok ? 'PASS' : 'FAIL'} - ${name} round-trips` + (ok ? '' : ` (got ${JSON.stringify(got)} expected ${JSON.stringify(expected)})`));
  ok ? pass++ : fail++;
}

writeFileSync(yamlAbs, snapshot, 'utf-8'); // restore
console.log(`\n  ${cases.length} fields tested -> ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
