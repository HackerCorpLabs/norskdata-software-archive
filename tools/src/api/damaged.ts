/**
 * Assessing an image the NDFS parser refuses.
 *
 * Shared by the detect endpoint and the import, so a floppy is judged the same
 * way whichever route it arrives by:
 *
 *   1. Is there ND material in it at all? SINTRAN file names survive in the raw
 *      bytes with the parity bit set, so a handful of them means ND media even
 *      when nothing can be parsed. Without them the image is simply blank or
 *      unreadable and is left as `filesystem: none`.
 *   2. Can the filesystem be read after reconstructing the master block
 *      pointers? See lib/ndfsrecover - a reconstruction is accepted only when
 *      the file names it produces are confirmed by the image's own bytes.
 *
 * **The stored image is never modified.** Reconstruction happens on a copy in
 * memory; what comes out of here is metadata and nothing else. The `.img.gz` in
 * the archive stays exactly as it came off the physical floppy - that is the
 * whole point of the archive, and no recovery is worth breaking it for.
 */

import type { CatalogEntry } from '../types.js';
import { ndNameEvidence, ND_NAME_EVIDENCE_MIN } from './filesystem-detect.js';
import { pageAlign } from '../lib/ndfsalign/index.js';
import { recoverNdfs, type ProbeResult, type RecoveryResult } from '../lib/ndfsrecover/index.js';

export interface DamagedAssessment {
  condition: NonNullable<CatalogEntry['condition']>;
  /** the recovered listing, when one was confirmed; null otherwise */
  ndfs: CatalogEntry['ndfs'] | null;
  result: RecoveryResult | null;
}

/** The NDFS parser in the shape lib/ndfsrecover asks for. */
async function makeProbe(owners: Map<string, string>): Promise<(image: Uint8Array) => ProbeResult | null> {
  const { NdfsFileSystem } = await import('norskdata-ndfs');
  return (image: Uint8Array) => {
    try {
      const fs = new (NdfsFileSystem as any)(image, true);
      const files = (fs.getObjectEntries?.() ?? [])
        .filter((o: any) => o && o.objectName)
        .map((o: any) => {
          owners.set(o.objectName + ':' + (o.type ?? ''), o.userName ?? '');
          return { name: o.objectName, type: o.type ?? '', pages: o.pagesAllocated ?? 0, bytes: o.bytes ?? 0 };
        });
      const users = (fs.getUsers?.() ?? [])
        .filter((u: any) => u && u.userName)
        .map((u: any) => ({ name: u.userName, pagesUsed: u.pagesUsed ?? 0 }));
      return { directoryName: fs.getDirectoryName?.() ?? null, files, users };
    } catch {
      return null;
    }
  };
}

/**
 * Judge an image that holds no readable filesystem. Returns null when there is
 * no ND material in it - that is a blank disk or a failed read, not a damaged
 * ND floppy.
 */
export async function tryRecoverDamaged(
  buf: Buffer | Uint8Array,
  /** file names from other reads of the same physical floppy, when there are any */
  corroborate: string[] = [],
): Promise<DamagedAssessment | null> {
  const raw = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const evidence = ndNameEvidence(raw);
  if (evidence.count < ND_NAME_EVIDENCE_MIN) return null;

  const image = pageAlign(raw);          // a copy when padding is needed; the file on disk is untouched
  const owners = new Map<string, string>();
  const probe = await makeProbe(owners);

  let parserError = 'the parser found no usable filesystem';
  try {
    const { NdfsFileSystem } = await import('norskdata-ndfs');
    new (NdfsFileSystem as any)(image, true);
  } catch (err) {
    parserError = String((err as Error)?.message ?? err);
  }

  const condition: NonNullable<CatalogEntry['condition']> = {
    status: 'damaged',
    parser: 'ndfs',
    parserError,
    ndNamesFound: evidence.count,
    ndNameSamples: evidence.samples,
    recovery: null,
  };

  const result = recoverNdfs(image, { probe, corroborate });
  if (result.status !== 'recovered' || !result.best) {
    return { condition, ndfs: null, result };
  }

  const best = result.best;
  condition.recovery = {
    status: 'recovered',
    layout: { object: best.layout.object.blockId, user: best.layout.user.blockId, bit: best.layout.bit.blockId },
    filesRecovered: best.files.length,
    namesConfirmedInBytes: best.confirmed,
    confirmRatio: Math.round(best.ratio * 1000) / 1000,
    acceptedBy: best.acceptedBy ?? 'own-bytes',
    corroboratedBySibling: best.corroborated || undefined,
  };
  return {
    condition,
    ndfs: {
      users: best.users.map(u => ({ name: u.name, pagesUsed: u.pagesUsed ?? 0 })),
      files: best.files.map(f => ({
        name: f.name,
        type: f.type,
        pages: f.pages ?? 0,
        bytes: f.bytes ?? 0,
        userName: owners.get(f.name + ':' + f.type) ?? '',
        dateCreated: null,
        lastDateRead: null,
        lastDateWritten: null,
      })),
    },
    result,
  };
}
