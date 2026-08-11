/**
 * ND documentation attached to products.
 *
 * The markdown lives in docs/nd/<collection>/<document-id>.md, where the
 * document id is the ND document number (e.g. ND-10174-10-EN). Products
 * reference documents by id from their docs: block in products/<id>.yaml.
 *
 * One document can describe several products - ND-10174-10-EN covers
 * ND-10174, ND-10575 and ND-10576 - so documents are stored once and
 * referenced, never copied per product.
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { parse as yamlParse } from 'yaml';

export type DocKind = 'productInfo' | 'installationDescription';

/** Sub-directory of docs/nd/ for each collection. */
export const DOC_DIRS: Record<DocKind, string> = {
  productInfo: 'product-info',
  installationDescription: 'installation-description',
};

/** Human-readable name of each collection. */
export const DOC_KIND_LABELS: Record<DocKind, string> = {
  productInfo: 'Product Information sheet',
  installationDescription: 'Program / Installation Description',
};

export interface NdDoc {
  id: string;
  kind: DocKind;
  /** Repo-relative path of the markdown file */
  path: string;
  title: string;
  /** Product ids that reference this document */
  products: string[];
}

export interface DocIndex {
  /** document id -> document */
  docs: Map<string, NdDoc>;
  /** product id -> document ids */
  byProduct: Map<string, string[]>;
}

/**
 * Display title for an ND document. These are OCR'd forms whose headings are
 * mostly boilerplate ("Norsk Data A/S Program Description", "Page 1"), so the
 * real name is taken from the table under the Product / Delivery-list heading,
 * then from the first non-boilerplate heading, then the document id.
 */
export function docTitle(md: string, fallback: string): string {
  const lines = md.split('\n');
  const BOILER = /^(page\s+\d+|norsk data|product information|program description|delivery list|for internal use|introduction|contents?)\b/i;

  for (let i = 0; i < lines.length; i++) {
    if (!/^#{1,3}\s*(Product|Delivery list for)\b/i.test(lines[i])) continue;
    let started = false;
    for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
      const l = lines[j];
      if (!l.trim().startsWith('|')) { if (started) break; else continue; }
      started = true;
      if (/^\s*\|[\s|:-]+\|\s*$/.test(l)) continue;
      const cells = l.split('|').slice(1, -1).map(c => c.trim().replace(/\*\*/g, ''));
      // key/value form "| Product name | SINTRAN NFS Support |" - but not the header
      // row "| Product name | Product number |", whose second cell is a label too.
      if (/^product name$/i.test(cells[0]) && cells[1] &&
          !/^(product\s*)?(number|no\.?|category|ver|rev|price)\b/i.test(cells[1])) {
        return cells[1].slice(0, 90);
      }
      // header row: "| Name | Reg. no | Category |", "| ND-no | Ver | Product name |", ...
      if (cells.length > 1 && /^(name|product|nd[- ]?no|reg\.?\s*no|item)\b/i.test(cells[0])) continue;
      // a real product name: not a number, not a version/category code, not a date
      const name = cells.find(c =>
        c.length >= 6 && /[A-Za-z]/.test(c) &&
        !/^(?:ND[- ]?)?\d{5,6}[A-Z]?\d{0,2}$/.test(c) &&
        !/^[A-Z]{1,5}\d{0,2}$/.test(c) &&
        !/^(date|page|ver|rev|category|price|issued)\b/i.test(c));
      if (name) return name.slice(0, 90);
    }
  }

  for (const line of lines) {
    const m = line.match(/^#{1,3}\s+(.+?)\s*$/);
    if (!m) continue;
    const t = m[1].replace(/\*\*/g, '').trim();
    if (BOILER.test(t)) continue;
    return t.slice(0, 90);
  }
  return fallback;
}

/**
 * Read every products/*.yaml docs: block and resolve it against docs/nd/.
 * Documents referenced but missing on disk are skipped.
 */
export async function loadDocIndex(rootDir: string): Promise<DocIndex> {
  const docs = new Map<string, NdDoc>();
  const byProduct = new Map<string, string[]>();

  let files: string[] = [];
  try {
    files = await readdir(join(rootDir, 'products'));
  } catch {
    return { docs, byProduct };
  }

  for (const f of files) {
    if (!f.endsWith('.yaml')) continue;
    let doc: any;
    try {
      doc = yamlParse(await readFile(join(rootDir, 'products', f), 'utf-8'));
    } catch { continue; }
    if (!doc?.id || !doc.docs) continue;

    for (const kind of ['productInfo', 'installationDescription'] as DocKind[]) {
      const ids = doc.docs[kind];
      if (!Array.isArray(ids)) continue;
      for (const id of ids) {
        if (typeof id !== 'string' || !id) continue;
        const path = `docs/nd/${DOC_DIRS[kind]}/${id}.md`;
        let existing = docs.get(id);
        if (!existing) {
          let md: string;
          try {
            md = await readFile(join(rootDir, path), 'utf-8');
          } catch { continue; }   // referenced but not on disk
          existing = { id, kind, path, title: docTitle(md, id), products: [] };
          docs.set(id, existing);
        }
        if (!existing.products.includes(doc.id)) existing.products.push(doc.id);
        const list = byProduct.get(doc.id) ?? [];
        if (!list.includes(id)) list.push(id);
        byProduct.set(doc.id, list);
      }
    }
  }

  for (const d of docs.values()) d.products.sort();
  return { docs, byProduct };
}

/** Read one document's markdown by id. Returns null if it is not in the index. */
export async function readDocMarkdown(rootDir: string, doc: NdDoc): Promise<string | null> {
  try {
    return await readFile(join(rootDir, doc.path), 'utf-8');
  } catch {
    return null;
  }
}
