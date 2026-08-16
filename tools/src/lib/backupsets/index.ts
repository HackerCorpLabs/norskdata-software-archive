/**
 * backupsets - grouping the volumes of a WINCH-TO-FLOPP backup.
 *
 * A WINCH-TO-FLOPP backup spreads one ND directory over a set of floppies. Each
 * volume's header names the directory, gives its own number and says how many
 * volumes the set has, so a set can be rebuilt from the catalog alone - no
 * image has to be opened. The archive also holds several reads of the same
 * physical floppy, which show up as different images carrying the same volume
 * number.
 *
 * Takes the small shape recorded per floppy (backupSet, written at detect
 * time), so the same code runs on the server and in the browser for both the
 * local web UI and the published site. No Node-only calls.
 */

export interface SetMemberInput {
  id: string;
  /** shown in the list; the image id is used when there is no name */
  volumeName?: string | null;
  imageSizeBytes?: number | null;
  backupSet?: {
    kind: string; name: string; label: string;
    volumeNumber: number; totalVolumes: number;
    pageCount: number; listedPages?: number; imageBytes?: number;
    pageFirst: number | null; pageLast: number | null;
  } | null;
}

/**
 * How complete one image of a volume is.
 *   complete - it holds every page its header names
 *   partial  - it holds fewer; `sideOne` marks the common case in this archive,
 *              an 8 inch double-sided floppy read from side 0 only, which
 *              yields almost exactly half the pages
 *   unknown  - the header did not say how many pages it should hold
 */
export type ReadStatus = 'complete' | 'partial' | 'unknown';

export interface SetMember {
  id: string;
  name: string;
  pageCount: number;
  listedPages: number | null;
  imageBytes: number | null;
  pageFirst: number | null;
  pageLast: number | null;
  status: ReadStatus;
  /** true when roughly half the pages are there - a one-sided read */
  sideOne: boolean;
  /** share of the named pages actually stored, 0..1, null when not known */
  coverage: number | null;
  /** the read chosen for this volume; the others are alternates */
  best: boolean;
  /** how many pages this read holds beyond the worst read of the same volume */
  pagesOverWorst: number;
}

export interface SetSlot {
  volumeNumber: number;
  /** the read to prefer: the one holding most pages */
  best: SetMember | null;
  /** other reads of the same volume, most pages first */
  others: SetMember[];
  present: boolean;
  /** every read of this volume, best first */
  reads: SetMember[];
  /** status of the best read, or 'missing' when no image is held */
  status: ReadStatus | 'missing';
}

export interface BackupSet {
  /** stable identifier, e.g. "winch:PACK-ONE:90-03-04" */
  key: string;
  kind: string;
  name: string;
  label: string;
  totalVolumes: number;
  /** one entry per volume number 1..totalVolumes, missing ones included */
  slots: SetSlot[];
  /** volume numbers held */
  present: number[];
  /** volume numbers not held */
  missing: number[];
  /** how many images belong to the set, repeat reads included */
  imageCount: number;
  /** every volume of the set is held */
  complete: boolean;
  /** pages actually held, counting the best read of each volume */
  pagesHeld: number;
  /** pages those volumes should hold - only volumes that are present */
  pagesExpected: number;
  /** volumes whose best read is incomplete */
  partialVolumes: number[];
  /** true when every present volume looks like a one-sided read */
  allOneSided: boolean;
  /**
   * Whether the pages held could be reassembled into a directory image with
   * any hope of reading file names: every volume present and every read
   * complete. Anything less and the NDFS structures have holes.
   */
  reassemblable: boolean;
}

/** The set key an entry belongs to, or null when it is not part of a set. */
export function setKeyOf(entry: SetMemberInput): string | null {
  const s = entry.backupSet;
  if (!s || !s.name) return null;
  return s.kind + ':' + s.name + ':' + (s.label || '');
}

/** Group every entry that records a backupSet, keyed by set. */
export function groupBackupSets(entries: SetMemberInput[]): Map<string, BackupSet> {
  const byKey = new Map<string, SetMemberInput[]>();
  for (const e of entries) {
    const key = setKeyOf(e);
    if (!key) continue;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(e);
  }

  const out = new Map<string, BackupSet>();
  for (const [key, members] of byKey) {
    const first = members[0].backupSet!;
    // A damaged header could disagree about the size of the set; the largest
    // count wins, so no volume is dropped off the end of the list.
    const totalVolumes = members.reduce((n, m) => Math.max(n, m.backupSet!.totalVolumes), 0);

    const byVolume = new Map<number, SetMember[]>();
    for (const m of members) {
      const s = m.backupSet!;
      const listed = typeof s.listedPages === 'number' && s.listedPages > 0 ? s.listedPages : null;
      const coverage = listed ? s.pageCount / listed : null;
      // An 8 inch WINCH-TO-FLOPP volume is double sided. Reading side 0 only
      // yields close to half the pages, which is what most of this archive's
      // images turned out to be - so it gets named rather than lumped in with
      // any other short read.
      const sideOne = coverage !== null && coverage > 0.4 && coverage < 0.6;
      const status: ReadStatus = listed === null ? 'unknown' : (s.pageCount >= listed ? 'complete' : 'partial');
      if (!byVolume.has(s.volumeNumber)) byVolume.set(s.volumeNumber, []);
      byVolume.get(s.volumeNumber)!.push({
        id: m.id,
        name: m.volumeName || m.id,
        pageCount: s.pageCount,
        listedPages: listed,
        imageBytes: typeof s.imageBytes === 'number' ? s.imageBytes : (m.imageSizeBytes ?? null),
        pageFirst: s.pageFirst, pageLast: s.pageLast,
        status, sideOne, coverage,
        best: false, pagesOverWorst: 0,
      });
    }

    const slots: SetSlot[] = [];
    const present: number[] = [];
    const missing: number[] = [];
    const partialVolumes: number[] = [];
    let pagesHeld = 0, pagesExpected = 0;
    for (let v = 1; v <= totalVolumes; v++) {
      const reads = (byVolume.get(v) ?? []).slice()
        // most pages first: a short read is a worse copy of the same volume
        .sort((a, b) => b.pageCount - a.pageCount || a.id.localeCompare(b.id));
      if (reads.length) {
        present.push(v);
        reads[0].best = true;
        const worst = reads[reads.length - 1].pageCount;
        for (const r of reads) r.pagesOverWorst = r.pageCount - worst;
        pagesHeld += reads[0].pageCount;
        pagesExpected += reads[0].listedPages ?? reads[0].pageCount;
        if (reads[0].status === 'partial') partialVolumes.push(v);
      } else {
        missing.push(v);
      }
      slots.push({
        volumeNumber: v,
        best: reads[0] ?? null,
        others: reads.slice(1),
        reads,
        present: reads.length > 0,
        status: reads.length ? reads[0].status : 'missing',
      });
    }

    const presentBest = slots.filter(sl => sl.best).map(sl => sl.best!);
    out.set(key, {
      key, kind: first.kind, name: first.name, label: first.label,
      totalVolumes, slots, present, missing,
      imageCount: members.length,
      complete: missing.length === 0,
      pagesHeld, pagesExpected, partialVolumes,
      allOneSided: presentBest.length > 0 && presentBest.every(b => b.sideOne),
      reassemblable: missing.length === 0 && partialVolumes.length === 0,
    });
  }
  return out;
}

/** The set one image belongs to, or null. */
export function backupSetFor(entryId: string, entries: SetMemberInput[]): BackupSet | null {
  const entry = entries.find(e => e.id === entryId);
  if (!entry) return null;
  const key = setKeyOf(entry);
  if (!key) return null;
  return groupBackupSets(entries).get(key) ?? null;
}

/** "9 of 13 volumes, missing 6, 8, 9, 12" - the one-line volume summary. */
export function describeSet(set: BackupSet): string {
  const head = set.present.length + ' of ' + set.totalVolumes + ' volumes';
  return set.complete ? head + ', complete' : head + ', missing ' + set.missing.join(', ');
}

/**
 * What can and cannot be done with the set as it stands, in plain words. File
 * names live in the NDFS structures spread across the whole directory, so they
 * only appear once every volume is held AND every read is complete.
 */
export function setVerdict(set: BackupSet): string {
  if (set.reassemblable) {
    return 'Every volume is held and every read is complete: the pages can be reassembled into a directory image and read as NDFS.';
  }
  const parts: string[] = [];
  if (set.missing.length) {
    parts.push(set.missing.length + ' volume(s) missing (' + set.missing.join(', ') + ')');
  }
  if (set.partialVolumes.length) {
    parts.push(set.allOneSided
      ? 'every volume held is an incomplete read of about half the pages, which is a one-sided read of a double-sided disk'
      : set.partialVolumes.length + ' volume(s) held only as an incomplete read (' + set.partialVolumes.join(', ') + ')');
  }
  return 'No file names can be recovered yet: ' + parts.join('; ') +
    '. This format stores no file names on the media - they appear only after the whole directory is reassembled.';
}
