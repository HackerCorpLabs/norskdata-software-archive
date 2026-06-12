/**
 * Migration script: reads catalog/products.json and writes individual YAML files
 * to products/ directory. Run once during the YAML-per-floppy transition.
 */

import { readFile, mkdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { stringify as yamlStringify } from 'yaml';

function getRepoRoot(): string {
  return resolve(import.meta.dirname ?? '.', '..', '..');
}

async function migrateProducts(): Promise<void> {
  const rootDir = getRepoRoot();
  const productsFile = join(rootDir, 'catalog', 'products.json');
  const productsDir = join(rootDir, 'products');

  console.log('Reading catalog/products.json...');
  const raw = await readFile(productsFile, 'utf-8');
  const products: Array<{ Id: string; Name: string }> = JSON.parse(raw);

  console.log(`Found ${products.length} products.`);

  await mkdir(productsDir, { recursive: true });

  // Build sibling map: ND-1xxxx <-> ND-21xxxx
  const productIds = new Set(products.map(p => p.Id));
  function findSibling(id: string): string | null {
    const m = id.match(/^ND-(\d+)$/);
    if (!m) return null;
    const digits = m[1];
    const candidates: string[] = [];
    if (digits.length === 5 && digits.startsWith('1')) candidates.push(`ND-2${digits}`);
    if (digits.length === 6 && digits.startsWith('21')) candidates.push(`ND-${digits.substring(1)}`);
    if (digits.length === 6 && digits.startsWith('2')) candidates.push(`ND-${digits.substring(1)}`);
    for (const c of candidates) {
      if (productIds.has(c)) return c;
    }
    return null;
  }

  let written = 0;
  for (const p of products) {
    const doc: Record<string, unknown> = {
      id: p.Id,
      name: p.Name,
    };
    const sibling = findSibling(p.Id);
    if (sibling) {
      doc.siblingId = sibling;
    }

    const yamlStr = yamlStringify(doc, { lineWidth: 0 });
    const filename = `${p.Id}.yaml`;
    await writeFile(join(productsDir, filename), yamlStr, 'utf-8');
    written++;
  }

  console.log(`Wrote ${written} product YAML files to products/`);
}

migrateProducts().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
