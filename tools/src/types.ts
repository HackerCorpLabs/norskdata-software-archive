/**
 * Type definitions for the Norsk Data Software Archive catalog.
 */

/** Legacy floppy entry from ndfloppy floppies.json */
export interface LegacyFloppyEntry {
  Id: number;
  Name: string;
  Description: string;
  Reference: string;
  FilePath: string;
  Md5: string;
  Url: string | null;
  DirectoryContent: string | null;
  ProductId: number | null;
  CategoryId: number | null;
  PisheetUrl: string | null;
  ManualId: number | null;
  ArticleUrl: string | null;
  ProgramDescriptionId: number | null;
  Status: number;
  FloppyFiles: unknown[];
  Manual: unknown | null;
  Product: unknown | null;
  ProductNavigation: unknown | null;
  ProgramDescription: unknown | null;
}

/** Product match result from volume name parsing */
export interface ProductMatch {
  productId: string;
  version: string | null;
  diskNumber: number | null;
  language: string | null;
}

/** Duplicate check result */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingEntry?: CatalogEntry;
  isVariant?: boolean;
}

/** NDFS user entry */
export interface NdfsUser {
  name: string;
  pagesUsed: number;
}

/** NDFS file entry */
export interface NdfsFile {
  name: string;      // fullName like "DMAC-1915E:BPUN"
  type: string;      // "BPUN", "DATA", etc.
  pages: number;
  bytes: number;
  userName: string;
  dateCreated: number | null;     // Raw ND-100 packed 32-bit date (0 = unknown)
  lastDateRead: number | null;
  lastDateWritten: number | null;
  dateCreatedStr?: string | null;   // Human-readable "YYYY-MM-DD HH:MM:SS"
  lastDateReadStr?: string | null;
  lastDateWrittenStr?: string | null;
  bpunValid?: boolean | null;       // BPUN checksum validation (null = not a BPUN file)
}

/** Provenance information */
export interface Provenance {
  contributor: string;
  method?: string;
  dateImaged?: string | null;
  originalPath?: string | null;
  notes?: string | null;
}

/** Git storage info for in-repo images */
export interface GitStorageInfo {
  imagePath: string;
  /** Relative path to the .yaml metadata file */
  yamlPath: string;
  /** Photos specific to this individual disk (filename matches volume name or .img filename) */
  diskPhotos: string[];
  /** Photos of the set/group shared across all disks from the same import folder */
  setPhotos: string[];
  labelTranscription?: string | null;
  /** Text files from imaging process (Greaseweazle read logs, SCP conversion output, etc.) */
  imagingLogs: string[];
}

/** IA sync status */
export type IaSyncStatus = 'pending' | 'uploaded' | 'modified' | 'not-applicable';

/** Storage locations */
export interface StorageInfo {
  git?: GitStorageInfo | null;
  internetArchive: {
    itemId: string;
    files?: Record<string, string>;
    uploaded?: string | null;
    verified?: string | null;
    syncStatus?: IaSyncStatus;
  } | null;
  legacyAzure: string | null;
}

/** Storage class for an entry */
export type StorageClass = 'floppy-in-git' | 'ia-only' | 'both';

/** Legacy references preserved from the old system */
export interface LegacyRefs {
  pisheetUrl?: string | null;
  articleUrl?: string | null;
  manualId?: number | null;
  programDescriptionId?: number | null;
}

/** A single catalog entry matching floppy.schema.json */
export interface CatalogEntry {
  schemaVersion: string;
  id: string;
  type: string;
  md5: string;
  volumeName: string | null;
  volumeNameRaw?: string | null;
  productId: string | null;
  version: string | null;
  /**
   * ND "system number" from the OS distribution floppy naming N-<system no>-I..IV
   * (documented in ND-10174-10-EN). Only the early SINTRAN III OS sets carry one;
   * null for every other floppy.
   */
  systemNumber: string | null;
  diskNumber: number | null;
  diskTotal: number | null;
  mediaRole: string | null;
  storageClass: StorageClass | null;
  imageSizeBytes: number | null;
  imageFormat: string;
  controller: string | null;
  totalPages: number | null;
  pageSize: number | null;
  bootFormat: string | null;
  cpuTarget: string[] | null;
  osRequirement: string | null;
  ndfs: { users: NdfsUser[]; files: NdfsFile[] } | null;
  /**
   * Which filesystem the image holds: 'ndfs', 'dos', 'tar', or 'none' for an
   * empty disk or a failed read. Detected from the bytes at import and
   * re-runnable afterwards; null means it has never been looked at.
   */
  filesystem?: 'ndfs' | 'dos' | 'tar' | 'backup' | 'winch' | 'none' | null;
  /**
   * Volume label of a non-NDFS filesystem - the FAT label on an MS-DOS disk.
   * These carry ND part numbers (30002EN1A00, 30022XX2N06), so the Matcher can
   * match on it exactly as it matches an NDFS volume name.
   */
  volumeLabel?: string | null;
  directoryContentRaw?: string | null;
  /** References to related documentation */
  docs: {
    /** PI (Product Information) sheet - ND doc number */
    piDocId: string | null;
    /** PD (Program Description) sheet - ND doc number */
    pdDocId: string | null;
    /** Related manual/documentation ND doc numbers */
    relatedDocIds: string[];
    /** URLs to external documentation (ndwiki, etc.) */
    externalUrls: Array<{ url: string; title: string }>;
  } | null;
  provenance: Provenance | null;
  storage: StorageInfo | null;
  variants: null;
  fluxPreservation: null;
  legacyId: number | null;
  legacyRefs?: LegacyRefs | null;
  importedAt: string | null;
  tags: string[] | null;
}

/** The full catalog structure */
export interface Catalog {
  entries: CatalogEntry[];
}

/** Product definition */
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  siblingId?: string | null;
  categories?: string[];
  platform?: string[];  // '100' | '500' | 'PC'
  /**
   * ND documents describing this product, by document id (the file name in
   * docs/nd/<collection>/<id>.md, which is the ND document number).
   * One document can cover several products - e.g. ND-10174-10-EN covers
   * ND-10174, ND-10575 and ND-10576 - so it is stored once and referenced.
   */
  docs?: ProductDocs;
}

/** ND documentation attached to a product */
export interface ProductDocs {
  /** Product Information sheets -> docs/nd/product-info/<id>.md */
  productInfo?: string[];
  /** Program / Installation Descriptions -> docs/nd/installation-description/<id>.md */
  installationDescription?: string[];
}

/** Collection definition */
export interface Collection {
  name: string;
  description: string;
  items: Array<{
    productId?: string;
    version?: string;
    path?: string;
    role: string;
  }>;
}

/** Search index entry */
export interface IndexEntry {
  id: string;
  volumeName: string | null;
  productId: string | null;
  tags: string[] | null;
  directoryContentRaw: string | null;
}

/** Dependency check result */
export interface DepCheckResult {
  name: string;
  found: boolean;
  version: string | null;
}
