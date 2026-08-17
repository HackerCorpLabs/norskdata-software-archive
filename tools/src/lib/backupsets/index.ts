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
  /** BACKUP-SYSTEM: the files the labels name, used to compare two images */
  backupFiles?: { name: string; stale?: boolean }[] | null;
  backupSet?: {
    kind: string; name: string; label: string;
    // WINCH-TO-FLOPP: the header numbers the volumes and lists the pages
    volumeNumber?: number; totalVolumes?: number;
    pageCount?: number; listedPages?: number;
    pageFirst?: number | null; pageLast?: number | null;
    // BACKUP-SYSTEM: no volume number at all, so a run is ordered by following
    // the file that runs off the end of one volume onto the next
    runDate?: string | null; system?: string | null;
    fileCount?: number; staleCount?: number;
    firstFile?: string | null; lastFile?: string | null;
    endsMidFile?: boolean; fileListHash?: string;
    imageBytes?: number;
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
  // BACKUP-SYSTEM only
  fileCount?: number;
  staleCount?: number;
  firstFile?: string | null;
  lastFile?: string | null;
  endsMidFile?: boolean;
  /** the volume this one runs on to, when a floppy holding the rest is here */
  continuesTo?: string | null;
  /** the file that runs off the end with nowhere to continue */
  brokenAt?: string | null;
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
  /** 'winch' sets are numbered by their header; 'backup' runs are chained by file continuation */
  ordering: 'numbered' | 'chained';
  /** BACKUP-SYSTEM: the run that wrote the volumes */
  runDate?: string | null;
  system?: string | null;
  /** BACKUP-SYSTEM: files named across the whole run, repeat reads counted once */
  fileCount?: number;
  /** BACKUP-SYSTEM: a file runs off the end of a volume and no floppy here continues it */
  breaks?: { after: string; file: string }[];
}

/** The set key an entry belongs to, or null when it is not part of a set. */
export function setKeyOf(entry: SetMemberInput): string | null {
  const s = entry.backupSet;
  if (!s || !s.name) return null;
  if (s.kind === 'backup') {
    // One BACKUP-SYSTEM run: same volume id, owner, date and SINTRAN version.
    // The date matters - the same floppies were reused for later backups.
    return ['backup', s.name, s.label || '', s.runDate || '', s.system || ''].join(':');
  }
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

    if (first.kind === 'backup') {
      const { slots, breaks } = chainAnsiRun(members);
      const fileCount = slots.reduce((n, sl) => n + (sl.best?.fileCount ?? 0), 0);
      out.set(key, {
        key, kind: 'backup', name: first.name, label: first.label,
        totalVolumes: slots.length,
        slots,
        present: slots.map(sl => sl.volumeNumber),
        missing: [],
        imageCount: members.length,
        complete: breaks.length === 0,
        pagesHeld: 0, pagesExpected: 0,
        partialVolumes: [],
        allOneSided: false,
        reassemblable: breaks.length === 0,
        ordering: 'chained',
        runDate: first.runDate ?? null,
        system: first.system ?? null,
        fileCount,
        breaks,
      });
      continue;
    }

    // A damaged header could disagree about the size of the set; the largest
    // count wins, so no volume is dropped off the end of the list.
    const totalVolumes = members.reduce((n, m) => Math.max(n, m.backupSet!.totalVolumes ?? 0), 0);

    const byVolume = new Map<number, SetMember[]>();
    for (const m of members) {
      const s = m.backupSet!;
      const pageCount = s.pageCount ?? 0;
      const volumeNumber = s.volumeNumber ?? 0;
      const listed = typeof s.listedPages === 'number' && s.listedPages > 0 ? s.listedPages : null;
      const coverage = listed ? pageCount / listed : null;
      // An 8 inch WINCH-TO-FLOPP volume is double sided. Reading side 0 only
      // yields close to half the pages, which is what most of this archive's
      // images turned out to be - so it gets named rather than lumped in with
      // any other short read.
      const sideOne = coverage !== null && coverage > 0.4 && coverage < 0.6;
      const status: ReadStatus = listed === null ? 'unknown' : (pageCount >= listed ? 'complete' : 'partial');
      if (!byVolume.has(volumeNumber)) byVolume.set(volumeNumber, []);
      byVolume.get(volumeNumber)!.push({
        id: m.id,
        name: m.volumeName || m.id,
        pageCount,
        listedPages: listed,
        imageBytes: typeof s.imageBytes === 'number' ? s.imageBytes : (m.imageSizeBytes ?? null),
        pageFirst: s.pageFirst ?? null, pageLast: s.pageLast ?? null,
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
      ordering: 'numbered',
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
  if (set.ordering === 'chained') {
    const head = set.totalVolumes + (set.totalVolumes === 1 ? ' volume' : ' volumes in the chain');
    const extra = set.imageCount - set.totalVolumes;
    return head + (extra > 0 ? ', ' + extra + ' repeat read(s)' : '') +
      (set.breaks && set.breaks.length ? ', ' + set.breaks.length + ' break(s)' : ', chain unbroken');
  }
  const head = set.present.length + ' of ' + set.totalVolumes + ' volumes';
  return set.complete ? head + ', complete' : head + ', missing ' + set.missing.join(', ');
}

/**
 * What can and cannot be done with the set as it stands, in plain words. File
 * names live in the NDFS structures spread across the whole directory, so they
 * only appear once every volume is held AND every read is complete.
 */
export function setVerdict(set: BackupSet): string {
  if (set.ordering === 'chained') {
    const named = (set.fileCount ?? 0) + ' file(s) named across the run';
    if (!set.breaks || set.breaks.length === 0) {
      return named + ', and every file that runs off the end of a volume is continued by another volume held here: ' +
        'the run is whole as far as its own labels can show.';
    }
    return named + ', but ' + set.breaks.length + ' file(s) run off the end of a volume with no floppy here to continue them (' +
      set.breaks.map(b => b.file + ' after ' + b.after).join('; ') +
      '), so those files are truncated and at least one volume of the run is missing.';
  }
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

// ── BACKUP-SYSTEM: chaining a run ────────────────────────────

/**
 * Order one BACKUP-SYSTEM run.
 *
 * The labels carry no volume number, so the order is recovered from the data
 * itself: BACKUP-SYSTEM fills a floppy, cuts the file it is writing, and starts
 * the next floppy with the rest of that same file. A volume whose last file is
 * marked continued is therefore followed by the volume whose first file has that
 * name. Volumes with the same file fingerprint are reads of the same floppy and
 * are collapsed into one place in the chain.
 *
 * Where no floppy continues a cut file, the chain has a break and the rest of
 * that file is missing from the archive.
 */
function chainAnsiRun(members: SetMemberInput[]): { slots: SetSlot[]; breaks: { after: string; file: string }[] } {
  const toMember = (m: SetMemberInput): SetMember => {
    const s = m.backupSet!;
    return {
      id: m.id,
      name: m.volumeName || m.id,
      pageCount: 0, listedPages: null,
      imageBytes: typeof s.imageBytes === 'number' ? s.imageBytes : (m.imageSizeBytes ?? null),
      pageFirst: null, pageLast: null,
      status: 'unknown', sideOne: false, coverage: null,
      best: false, pagesOverWorst: 0,
      fileCount: s.fileCount ?? 0,
      staleCount: s.staleCount ?? 0,
      firstFile: s.firstFile ?? null,
      lastFile: s.lastFile ?? null,
      endsMidFile: !!s.endsMidFile,
      continuesTo: null, brokenAt: null,
    };
  };

  // Which images are reads of the same floppy. A marginal disk read twice does
  // not give the same file list twice - labels are lost or gained - so the test
  // is how much the two listings share, not whether they are identical.
  // Measured on this archive: reads of one floppy share 74-100% of the shorter
  // listing, different volumes of a run share at most 33%.
  const SAME_FLOPPY = 0.6;
  const namesOf = (m: SetMemberInput): Set<string> =>
    new Set((m.backupFiles ?? []).filter(f => !f.stale).map(f => f.name));

  const groups: SetMemberInput[][] = [];
  for (const m of members) {
    const mine = namesOf(m);
    let placed = false;
    for (const g of groups) {
      const theirs = namesOf(g[0]);
      let shared = 0;
      for (const n of mine) if (theirs.has(n)) shared++;
      const smaller = Math.min(mine.size, theirs.size);
      const sameByNames = smaller > 0 && shared / smaller >= SAME_FLOPPY;
      // no listings recorded: fall back to the fingerprint of the labels
      const sameByPrint = smaller === 0 && !!m.backupSet!.fileListHash &&
        m.backupSet!.fileListHash === g[0].backupSet!.fileListHash;
      if (sameByNames || sameByPrint) { g.push(m); placed = true; break; }
    }
    if (!placed) groups.push([m]);
  }

  // one node per distinct floppy: the read naming most files leads
  const nodes = groups.map(reads => {
    const sorted = reads.slice().sort((a, b) =>
      (b.backupSet!.fileCount ?? 0) - (a.backupSet!.fileCount ?? 0) || a.id.localeCompare(b.id));
    const mapped = sorted.map(toMember);
    mapped[0].best = true;
    return { facts: sorted[0].backupSet!, reads: mapped };
  });

  // A continues to B when A's last file is cut and B starts with that file.
  const byFirstFile = new Map<string, typeof nodes[number]>();
  for (const n of nodes) if (n.facts.firstFile) {
    if (!byFirstFile.has(n.facts.firstFile)) byFirstFile.set(n.facts.firstFile, n);
  }
  const next = new Map<typeof nodes[number], typeof nodes[number]>();
  const hasPredecessor = new Set<typeof nodes[number]>();
  const breaks: { after: string; file: string }[] = [];
  for (const n of nodes) {
    if (!n.facts.endsMidFile || !n.facts.lastFile) continue;
    const target = byFirstFile.get(n.facts.lastFile);
    if (target && target !== n) {
      next.set(n, target);
      hasPredecessor.add(target);
      n.reads[0].continuesTo = target.reads[0].id;
    } else {
      n.reads[0].brokenAt = n.facts.lastFile;
      breaks.push({ after: n.reads[0].name, file: n.facts.lastFile });
    }
  }

  // walk each chain from a volume nothing continues into
  const ordered: typeof nodes = [];
  const seen = new Set<typeof nodes[number]>();
  for (const start of nodes.filter(n => !hasPredecessor.has(n))) {
    let cur: typeof nodes[number] | undefined = start;
    while (cur && !seen.has(cur)) { seen.add(cur); ordered.push(cur); cur = next.get(cur); }
  }
  for (const n of nodes) if (!seen.has(n)) ordered.push(n);   // a cycle, should not happen

  const slots: SetSlot[] = ordered.map((n, i) => ({
    volumeNumber: i + 1,
    best: n.reads[0],
    others: n.reads.slice(1),
    reads: n.reads,
    present: true,
    status: 'unknown',
  }));
  return { slots, breaks };
}
