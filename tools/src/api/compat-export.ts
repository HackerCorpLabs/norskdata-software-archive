/**
 * Legacy compatibility export: generates floppies.json in the repo root
 * in the same format as ~/repos/ndfloppy/floppies.json for the old app.
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import type { Catalog, CatalogEntry, LegacyFloppyEntry, NdfsFile } from '../types.js';

/**
 * Format NDFS directory content in the legacy text format used by the old app.
 * Includes date information if available.
 */
function formatDirectoryContent(entry: CatalogEntry): string | null {
  if (!entry.ndfs) return entry.directoryContentRaw ?? null;

  const lines: string[] = [];
  lines.push(`Directory name: ${entry.volumeName ?? '(unknown)'}`);
  lines.push('');

  if (entry.ndfs.users.length > 0) {
    lines.push('Users:');
    for (const u of entry.ndfs.users) {
      lines.push(`  ${u.name} (${u.pagesUsed} pages)`);
    }
    lines.push('');
  }

  if (entry.ndfs.files.length > 0) {
    lines.push('Files:');
    for (const f of entry.ndfs.files) {
      let line = `  ${f.name}  ${f.pages} pages  ${f.bytes} bytes`;
      if (f.userName) {
        line += `  [${f.userName}]`;
      }
      if (f.dateCreated) {
        line += `  created=${f.dateCreated}`;
      }
      if (f.lastDateWritten) {
        line += `  written=${f.lastDateWritten}`;
      }
      lines.push(line);
    }
    lines.push('');
  }

  const totalPages = entry.totalPages ?? entry.ndfs.files.reduce((sum, f) => sum + f.pages, 0);
  lines.push(`Total: ${totalPages} pages`);

  return lines.join('\n');
}

/**
 * Generate a legacy-format floppies.json in the repo root for ndfloppy app compatibility.
 */
export async function generateLegacyFloppiesJson(rootDir: string, catalog: Catalog): Promise<void> {
  // Find the max legacyId to start sequential IDs from
  let nextId = 10000;
  for (const e of catalog.entries) {
    if (e.legacyId && e.legacyId >= nextId) {
      nextId = e.legacyId + 1;
    }
  }

  const legacyEntries: LegacyFloppyEntry[] = catalog.entries.map(entry => {
    const id = entry.legacyId ?? nextId++;

    // Determine status: 0 = active, 1 = hidden
    const isHidden = entry.tags?.includes('hidden-in-legacy') ?? false;

    // Try to get doc refs for legacy fields
    const piDocId = entry.docs?.piDocId ?? null;
    const pdDocId = entry.docs?.pdDocId ?? null;

    return {
      Id: id,
      Name: entry.volumeName ?? '',
      Description: entry.provenance?.originalPath ?? '',
      Reference: '',
      FilePath: entry.provenance?.originalPath ?? '',
      Md5: entry.md5,
      Url: null,
      DirectoryContent: formatDirectoryContent(entry),
      ProductId: null,
      CategoryId: null,
      PisheetUrl: entry.legacyRefs?.pisheetUrl ?? (piDocId ? `https://ndwiki.org/wiki/${piDocId}` : null) ?? null,
      ManualId: entry.legacyRefs?.manualId ?? null,
      ArticleUrl: entry.legacyRefs?.articleUrl ?? null,
      ProgramDescriptionId: entry.legacyRefs?.programDescriptionId ?? (pdDocId ? parseInt(pdDocId, 10) || null : null) ?? null,
      Status: isHidden ? 1 : 0,
      FloppyFiles: [],
      Manual: null,
      Product: null,
      ProductNavigation: null,
      ProgramDescription: null,
    };
  });

  const outputPath = join(rootDir, 'floppies.json');
  const json = JSON.stringify(legacyEntries, null, 2) + '\n';
  await writeFile(outputPath, json, 'utf-8');

  console.log(`Wrote ${legacyEntries.length} entries to ${outputPath}`);
}
