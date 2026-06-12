/**
 * Deduplication checker for the Norsk Data Software Archive catalog.
 */

import type { Catalog, DuplicateCheckResult } from '../types.js';
import { findByMd5, findByVolumeName } from './catalog.js';

/**
 * Check whether an image is a duplicate or variant of an existing entry.
 *
 * - Exact MD5 match = definite duplicate
 * - Same volume name + different MD5 = potential variant (re-imaged copy, different revision, etc.)
 */
export function checkDuplicate(
  catalog: Catalog,
  md5: string,
  volumeName?: string
): DuplicateCheckResult {
  // Check exact MD5 match
  const byMd5 = findByMd5(catalog, md5);
  if (byMd5) {
    return { isDuplicate: true, existingEntry: byMd5, isVariant: false };
  }

  // Check volume name match (potential variant)
  if (volumeName) {
    const byName = findByVolumeName(catalog, volumeName);
    // Only flag exact matches (not substring) as variants
    const exactMatch = byName.find(
      e => e.volumeName?.toLowerCase() === volumeName.toLowerCase()
    );
    if (exactMatch) {
      return { isDuplicate: false, existingEntry: exactMatch, isVariant: true };
    }
  }

  return { isDuplicate: false };
}
