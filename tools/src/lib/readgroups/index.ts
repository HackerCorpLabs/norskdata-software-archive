/**
 * readgroups - the reads of one physical floppy, and how good each one is.
 *
 * A bad floppy is read again and again in the hope that one attempt gets
 * through, so the archive holds several images of the same disk:
 * ND-disk-00426, -00426b, -00426c, -00426d are four tries at disk 426. As
 * separate catalog entries they look like four floppies, which makes it easy to
 * misjudge the collection - and dangerous to delete anything, because the one
 * readable copy is not distinguishable from the three failures.
 *
 * This groups them by the disk they came off and grades each read, so a whole
 * disk can be judged at once: four attempts and nothing readable is a bad
 * floppy, three failures beside one clean read is a disk that was rescued and
 * whose failures are only clutter.
 *
 * Grading uses what the catalog already records - no image is opened here. No
 * Node-only calls, so the same code can run in the browser.
 */

export type ReadGrade =
  | 'clean'         // the filesystem was read as it stands
  | 'recovered'     // readable only after rebuilding the master block pointers
  | 'damaged'       // ND material, nothing readable
  | 'other'         // a filesystem that is not NDFS: DOS, tar, a backup volume
  | 'empty';        // no filesystem and no ND material: blank, erased or a failed read

export interface ReadInput {
  id: string;
  volumeName?: string | null;
  volumeLabel?: string | null;
  filesystem?: string | null;
  imageSizeBytes?: number | null;
  totalPages?: number | null;
  productId?: string | null;
  md5?: string;
  ndfs?: { files?: unknown[]; users?: unknown[] } | null;
  condition?: { status: string; recovery?: unknown | null } | null;
  storage?: { git?: { imagePath?: string } | null } | null;
}

export interface GradedRead {
  id: string;
  /** the image file name, which is what the operator numbered */
  name: string;
  grade: ReadGrade;
  files: number;
  imageSizeBytes: number | null;
  productId: string | null;
  /** true when this is the best read of the disk */
  best: boolean;
}

export interface ReadGroup {
  /** the physical disk, e.g. "ND-disk-00426" */
  disk: string;
  reads: GradedRead[];
  /** the best grade any read of this disk achieved */
  bestGrade: ReadGrade;
  /** nothing readable came off this disk at all */
  bad: boolean;
  /** something readable came off it, but some attempts failed */
  semiBad: boolean;
  /** reads that are worse than the best one, and hold nothing of their own */
  redundant: GradedRead[];
}

const GRADE_ORDER: ReadGrade[] = ['clean', 'recovered', 'other', 'damaged', 'empty'];

/** Grade one read from what the catalog says about it. */
export function gradeRead(e: ReadInput): ReadGrade {
  const files = e.ndfs?.files?.length ?? 0;
  if (e.condition?.status === 'damaged') return e.condition.recovery ? 'recovered' : 'damaged';
  if (e.filesystem && e.filesystem !== 'ndfs' && e.filesystem !== 'none') return 'other';
  if (files > 0 || e.volumeName) return 'clean';
  return 'empty';
}

/**
 * The physical disk a read came from.
 *
 * The imaging operator numbered the attempts by appending a letter, so
 * ND-disk-00426d is the fourth try at 426. Track-limited retries such as
 * ND-disk-288-track2-77 belong to the same disk as well.
 */
export function diskOf(e: ReadInput): string {
  const file = (e.storage?.git?.imagePath ?? '').split('/').pop() ?? '';
  const base = file.replace(/\.img\.gz$/i, '').replace(/\.img$/i, '');
  if (!base) return e.id;
  return base
    .replace(/-track\d+(-\d+)?$/i, '')
    .replace(/([0-9]{3,6})[a-z]$/, '$1');
}

/** Group every read by the disk it came off, worst disks first. */
export function groupReads(entries: ReadInput[]): ReadGroup[] {
  const byDisk = new Map<string, ReadInput[]>();
  for (const e of entries) {
    const disk = diskOf(e);
    if (!byDisk.has(disk)) byDisk.set(disk, []);
    byDisk.get(disk)!.push(e);
  }

  const groups: ReadGroup[] = [];
  for (const [disk, members] of byDisk) {
    const reads: GradedRead[] = members.map(m => ({
      id: m.id,
      name: ((m.storage?.git?.imagePath ?? '').split('/').pop() ?? m.id).replace(/\.img\.gz$/i, ''),
      grade: gradeRead(m),
      files: m.ndfs?.files?.length ?? 0,
      imageSizeBytes: m.imageSizeBytes ?? null,
      productId: m.productId ?? null,
      best: false,
    }));
    reads.sort((a, b) =>
      GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade) ||
      b.files - a.files ||
      a.name.localeCompare(b.name));
    reads[0].best = true;
    const bestGrade = reads[0].grade;
    const bad = reads.every(r => r.grade === 'damaged' || r.grade === 'empty');
    groups.push({
      disk,
      reads,
      bestGrade,
      bad,
      semiBad: !bad && reads.some(r => r.grade === 'damaged' || r.grade === 'empty'),
      // A read is redundant when a better one exists and it lists nothing itself:
      // deleting it loses no information, only a failed attempt.
      redundant: bad ? [] : reads.filter(r => !r.best && r.files === 0 && (r.grade === 'damaged' || r.grade === 'empty')),
    });
  }

  groups.sort((a, b) =>
    Number(b.bad) - Number(a.bad) ||
    b.reads.length - a.reads.length ||
    a.disk.localeCompare(b.disk));
  return groups;
}

/** One line about a group, for a listing. */
export function describeGroup(g: ReadGroup): string {
  const tries = g.reads.length + (g.reads.length === 1 ? ' read' : ' reads');
  if (g.bad) return tries + ', nothing readable';
  const readable = g.reads.filter(r => r.grade === 'clean' || r.grade === 'recovered' || r.grade === 'other').length;
  return tries + ', ' + readable + ' readable' + (g.redundant.length ? ', ' + g.redundant.length + ' failed attempt(s)' : '');
}
