/**
 * Static site generator for the Norsk Data Software Archive.
 * Produces a single self-contained site/index.html with all data
 * embedded as inline JSON. No fetch() calls, works with file:// protocol.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { parse as yamlParse } from 'yaml';
import { readdir } from 'fs/promises';
import { createHash } from 'crypto';
import type { CatalogEntry } from '../types.js';
import { generateCatalogJson } from './catalog.js';

interface ProductData {
  id: string;
  name: string;
  description?: string | null;
  categories?: string[];
  platform?: string[];
}

interface CategoryData {
  id: string;
  name: string;
  description: string;
}

/** Build the complete static site into site/index.html */
export async function buildStaticSite(rootDir: string): Promise<void> {
  const catalogPath = join(rootDir, 'catalog/floppies.json');
  const categoriesPath = join(rootDir, 'categories/product-categories.yaml');
  const productsDir = join(rootDir, 'products');
  const siteDir = join(rootDir, 'site');

  console.log('Regenerating catalog from YAML...');
  await generateCatalogJson(rootDir);

  console.log('Loading catalog...');
  const entries: CatalogEntry[] = JSON.parse(await readFile(catalogPath, 'utf-8'));

  console.log('Loading categories...');
  const categoriesRaw = yamlParse(await readFile(categoriesPath, 'utf-8')) as CategoryData[];

  console.log('Loading products...');
  const products: ProductData[] = [];
  const files = await readdir(productsDir);
  for (const f of files) {
    if (!f.endsWith('.yaml')) continue;
    try {
      const raw = await readFile(join(productsDir, f), 'utf-8');
      const doc = yamlParse(raw);
      if (doc && doc.id && doc.name) {
        products.push({
          id: doc.id,
          name: doc.name,
          description: doc.description ?? null,
          categories: Array.isArray(doc.categories) ? doc.categories : undefined,
          platform: Array.isArray(doc.platform) ? doc.platform : undefined,
        });
      }
    } catch { /* skip malformed */ }
  }
  products.sort((a, b) => a.id.localeCompare(b.id));

  // Load NDFS browser library bundle
  console.log('Loading NDFS browser library...');
  let ndfsBundleJS = '';
  const bundlePaths = [
    join(rootDir, 'tools', 'ndfs-browser-bundle.js'),
    '/tmp/ndfs-browser.js',
  ];
  for (const bp of bundlePaths) {
    try {
      ndfsBundleJS = await readFile(bp, 'utf-8');
      console.log(`NDFS library loaded from ${bp} (${(ndfsBundleJS.length / 1024).toFixed(1)} KB)`);
      break;
    } catch { /* try next */ }
  }
  if (!ndfsBundleJS) {
    console.warn('WARNING: NDFS browser bundle not found -- NDFS viewer will be disabled');
  }

  console.log(`Loaded ${entries.length} catalog entries, ${products.length} products, ${categoriesRaw.length} categories.`);

  // Content-hash versions for cache-busting photo URLs. Uses the file content
  // (not mtime, which git checkout resets), so it's stable across CI builds and
  // changes only when a photo's bytes change.
  const photoPaths = new Set<string>();
  for (const e of entries) {
    const git = (e as any).storage?.git;
    if (!git) continue;
    for (const p of [...(git.diskPhotos ?? []), ...(git.setPhotos ?? [])]) if (p) photoPaths.add(p);
  }
  const photoVersions: Record<string, string> = {};
  for (const p of photoPaths) {
    try { photoVersions[p] = createHash('md5').update(await readFile(join(rootDir, p))).digest('hex').slice(0, 8); } catch { /* missing file */ }
  }

  await mkdir(siteDir, { recursive: true });

  const html = generateHtml(entries, products, categoriesRaw, ndfsBundleJS, photoVersions);
  const outPath = join(siteDir, 'index.html');
  await writeFile(outPath, html, 'utf-8');

  const sizeKB = (Buffer.byteLength(html, 'utf-8') / 1024).toFixed(1);
  console.log(`Static site built: ${outPath} (${sizeKB} KB)`);
}

function escJson(data: unknown): string {
  // Escape </script> inside JSON to prevent breaking the HTML
  return JSON.stringify(data).replace(/<\/script/gi, '<\\/script');
}

function generateHtml(
  catalog: CatalogEntry[],
  products: ProductData[],
  categories: CategoryData[],
  ndfsBundleJS: string,
  photoVersions: Record<string, string>,
): string {
  // Escape </script> in the bundle to prevent breaking HTML
  const safeBundleJS = ndfsBundleJS.replace(/<\/script/gi, '<\\/script');

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark" data-mode="public">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Norsk Data Software Archive</title>
<link rel="icon" href="favicon.ico">
<style>
${getThemeCSS()}
</style>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to main content</a>

<header class="nd-header">
  <span class="nd-logo">Norsk Data Software Archive</span>
  <nav class="nd-nav" id="main-nav">
    <a class="nd-nav-link nd-active" href="#/" data-route="dashboard">
      <span class="nd-nav-label">Dashboard</span>
    </a>
    <a class="nd-nav-link" href="#/catalog" data-route="catalog">
      <span class="nd-nav-label">Catalog</span>
    </a>
    <a class="nd-nav-link" href="#/products" data-route="products">
      <span class="nd-nav-label">Products</span>
    </a>
    <a class="nd-nav-link" href="#/about" data-route="about">
      <span class="nd-nav-label">About</span>
    </a>
  </nav>
  <button class="nd-theme-toggle" id="theme-toggle" aria-label="Toggle dark mode" title="Toggle theme"></button>
</header>

<main class="nd-main" id="main-content">
  <div class="nd-view" id="view"></div>
</main>

<footer class="nd-footer">
  Norsk Data Software Archive &mdash; read-only catalog &mdash;
  <a href="https://github.com/HackerCorpLabs/norskdata-software-archive">GitHub</a>
</footer>

<div id="nd-modal" class="nd-modal-overlay" style="display:none">
  <div class="nd-modal" id="nd-modal-content"></div>
</div>

${safeBundleJS ? `<script>\n${safeBundleJS}\n</script>` : '<!-- NDFS library not available -->'}
<script>
var CATALOG = ${escJson(catalog)};
var PRODUCTS = ${escJson(products)};
var PHOTO_VERSIONS = ${escJson(photoVersions)};
var CATEGORIES = ${escJson(categories)};
</script>
<script>
${getAppJS()}
</script>
</body>
</html>`;
}

function getThemeCSS(): string {
  return `/* ================================================================
   Theme system -- semantic tokens (WCAG AA ≥ 4.5:1 contrast)
   ================================================================ */
:root,
html[data-theme="dark"] {
  --bg: #14181f;
  --bg-elev: #1c222c;
  --bg-sunken: #0d1116;
  --border: #2b323d;
  --border-strong: #3a4250;
  --text: #e7eaf0;
  --text-muted: #99a2b2;
  --accent: #5b9dff;
  --accent-hover: #80b4ff;
  --accent-bg: #14233d;
  --on-accent: #0b1424;

  --info: #6fb0ff;        --info-bg: #14233d;
  --tag-os: #3fd0de;      --tag-os-bg: #0e3338;
  --ok: #5fd07a;          --ok-bg: #143420;
  --tag-patch: #c98cf0;   --tag-patch-bg: #2a1640;
  --warn: #ff9d54;        --warn-bg: #3a2310;
  --danger: #ff7b7b;      --danger-bg: #3a1717;
  --tag-product: #6fb0ff; --tag-product-bg: #14233d;
}

html[data-theme="light"] {
  --bg: #f7f8f9;
  --bg-elev: #ffffff;
  --bg-sunken: #eceef1;
  --border: #dcdfe5;
  --border-strong: #c5c9d1;
  --text: #181c22;
  --text-muted: #586273;
  --accent: #1763d6;
  --accent-hover: #1250b0;
  --accent-bg: #e6f0ff;
  --on-accent: #ffffff;

  --info: #0a5fd0;        --info-bg: #e6f0ff;
  --tag-os: #0a6f79;      --tag-os-bg: #d9f5f7;
  --ok: #14773a;          --ok-bg: #e3f7e8;
  --tag-patch: #7e22ce;   --tag-patch-bg: #f5e8ff;
  --warn: #b23c0a;        --warn-bg: #ffece0;
  --danger: #c1271f;      --danger-bg: #ffe5e3;
  --tag-product: #0a5fd0; --tag-product-bg: #e6f0ff;
}

/* ================================================================
   Reset + base
   ================================================================ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
code, pre { font-family: 'Consolas', 'Courier New', monospace; }

/* ================================================================
   Layout: header, main, footer
   ================================================================ */
.nd-header {
  background: var(--bg-elev);
  border-bottom: 1px solid var(--border);
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  height: 3.25rem;
  flex-shrink: 0;
}

.nd-logo {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent);
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.nd-nav {
  display: flex;
  gap: 0;
  flex: 1;
  overflow-x: auto;
}

.nd-nav-link {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 1rem;
  height: 3.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s;
  text-decoration: none;
  line-height: 1.2;
}

.nd-nav-link small {
  font-size: 0.65rem;
  font-weight: 400;
  opacity: 0.7;
}

.nd-nav-label {
  font-size: 0.85rem;
}

.nd-nav-link:hover {
  color: var(--text);
  text-decoration: none;
}

.nd-nav-link.nd-active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.nd-theme-toggle {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.35rem 0.5rem;
  font-size: 1rem;
  line-height: 1;
  transition: background-color 0.15s;
  flex-shrink: 0;
}

.nd-theme-toggle:hover {
  color: var(--text);
  border-color: var(--text-muted);
}

.nd-main {
  flex: 1;
  padding: 1.5rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.nd-view {
  min-height: 300px;
}

.nd-footer {
  background: var(--bg-sunken);
  border-top: 1px solid var(--border);
  padding: 0.4rem 1.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

/* ================================================================
   Local/public mode split
   ================================================================ */
[data-mode="public"] .nd-write-only { display: none; }
[data-mode="local"] .nd-public-only { display: none; }

/* ================================================================
   Component: nd-card
   ================================================================ */
.nd-card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.nd-card h3 {
  color: var(--accent);
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

/* ================================================================
   Component: nd-badge
   ================================================================ */
.nd-badge {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  background: var(--accent-bg);
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
}

.nd-badge-ok      { color: var(--ok);       background: var(--ok-bg);       border-color: color-mix(in srgb, var(--ok) 30%, transparent); }
.nd-badge-info    { color: var(--info);     background: var(--info-bg);     border-color: color-mix(in srgb, var(--info) 30%, transparent); }
.nd-badge-warn    { color: var(--warn);     background: var(--warn-bg);     border-color: color-mix(in srgb, var(--warn) 30%, transparent); }
.nd-badge-danger  { color: var(--danger);   background: var(--danger-bg);   border-color: color-mix(in srgb, var(--danger) 30%, transparent); }
.nd-badge-product { color: var(--tag-product); background: var(--tag-product-bg); border-color: color-mix(in srgb, var(--tag-product) 30%, transparent); }
.nd-badge-os      { color: var(--tag-os);   background: var(--tag-os-bg);   border-color: color-mix(in srgb, var(--tag-os) 30%, transparent); }
.nd-badge-patch   { color: var(--tag-patch); background: var(--tag-patch-bg); border-color: color-mix(in srgb, var(--tag-patch) 30%, transparent); }

/* Button color variants -- higher specificity to override .nd-btn base */
.nd-btn.nd-badge-ok    { color: var(--ok);       background: var(--ok-bg);       border-color: color-mix(in srgb, var(--ok) 30%, transparent); }
.nd-btn.nd-badge-info  { color: var(--info);     background: var(--info-bg);     border-color: color-mix(in srgb, var(--info) 30%, transparent); }
.nd-btn.nd-badge-os    { color: var(--tag-os);   background: var(--tag-os-bg);   border-color: color-mix(in srgb, var(--tag-os) 30%, transparent); }
.nd-btn.nd-badge-patch { color: var(--tag-patch); background: var(--tag-patch-bg); border-color: color-mix(in srgb, var(--tag-patch) 30%, transparent); }

/* ================================================================
   Component: nd-quick-stats (label + value blocks)
   ================================================================ */
.nd-quick-stats {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.nd-quick-stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  cursor: default;
}
.nd-quick-stat-lbl {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  font-weight: 600;
}
.nd-quick-stat-val {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
}

/* ================================================================
   Component: nd-btn
   ================================================================ */
.nd-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 1px solid color-mix(in srgb, var(--accent) 34%, transparent);
  background: color-mix(in srgb, var(--accent) 9%, var(--bg-elev));
  color: var(--accent);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.15s;
}

.nd-btn:hover {
  background: color-mix(in srgb, var(--accent) 16%, var(--bg-elev));
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
}
.nd-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.nd-btn-primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}

.nd-btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }

.nd-btn-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--text-muted);
}

.nd-btn-ghost:hover {
  color: var(--text);
  background: var(--accent-bg);
}

/* ================================================================
   Component: nd-table
   ================================================================ */
.nd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  table-layout: fixed;
}

.nd-table th {
  background: var(--bg-sunken);
  color: var(--text-muted);
  padding: 0.5rem 0.6rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  user-select: none;
}

.nd-table th:hover { color: var(--text); }

.nd-table td {
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--border);
  word-break: break-word;
}

.nd-table tr:hover td {
  background: var(--accent-bg);
}

/* ================================================================
   Component: nd-input, nd-select
   ================================================================ */
.nd-input, .nd-select {
  background: var(--bg-sunken);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.nd-input:focus, .nd-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-bg);
}

/* ================================================================
   Component: nd-tag
   ================================================================ */
.nd-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  gap: 0.25rem;
}

.nd-tag-product { background: var(--tag-product-bg); color: var(--tag-product); }
.nd-tag-os      { background: var(--tag-os-bg);      color: var(--tag-os); }
.nd-tag-patch   { background: var(--tag-patch-bg);    color: var(--tag-patch); }

/* ================================================================
   Component: nd-stat
   ================================================================ */
.nd-hero-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.nd-stat {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  text-align: center;
  min-width: 120px;
  flex: 1;
}

.nd-stat-value {
  font-size: 2rem;
  font-weight: 700;
  font-family: 'Consolas', 'Courier New', monospace;
  line-height: 1.2;
  color: var(--text);
}

.nd-stat-ok .nd-stat-value { color: var(--ok); }
.nd-stat-warn .nd-stat-value { color: var(--warn); }

.nd-stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ================================================================
   Component: nd-placeholder
   ================================================================ */
.nd-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--text-muted);
  text-align: center;
}

.nd-placeholder h2 {
  font-size: 1.4rem;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.nd-placeholder p {
  font-size: 0.95rem;
}

/* ================================================================
   Dashboard grid
   ================================================================ */
.nd-dash-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* ================================================================
   Filter chips
   ================================================================ */
.nd-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.nd-chip {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  background: var(--bg-elev);
  color: var(--text-muted);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.15s;
}

.nd-chip:hover {
  border-color: var(--accent);
  color: var(--text);
}

.nd-chip.nd-chip-active {
  background: var(--accent-bg);
  color: var(--accent);
  border-color: var(--accent);
}

/* ================================================================
   Pagination
   ================================================================ */
.nd-pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* ================================================================
   Search bar
   ================================================================ */
.nd-search-bar {
  margin-bottom: 1rem;
}

.nd-search-bar input {
  width: 100%;
  max-width: 500px;
}

/* ================================================================
   Detail meta grid
   ================================================================ */
.nd-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.25rem 1rem;
  font-size: 0.85rem;
}

.nd-meta-grid dt { color: var(--text-muted); font-weight: 600; }
.nd-meta-grid dd { margin: 0 0 0.25rem 0; }

/* Details toggle (collapsible section with rounded border) */
.nd-details-toggle {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
}
.nd-details-toggle summary {
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-muted);
}
.nd-details-toggle summary:hover { color: var(--text); }
.nd-details-toggle .nd-details-body {
  padding: 0 1rem 1rem 1rem;
}

/* Definition list (label: value pairs) */
.nd-dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 0.75rem;
  font-size: 0.85rem;
}
.nd-dl dt { color: var(--text-muted); white-space: nowrap; }
.nd-dl dd { word-break: break-all; }

/* Copyable code block */
.nd-copyable {
  display: inline-block;
  background: var(--bg-sunken);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  font-family: Consolas, monospace;
  font-size: 0.8rem;
  word-break: break-all;
}

/* ================================================================
   NDFS file details
   ================================================================ */
.nd-ndfs-box {
  background: var(--bg-sunken);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem;
  margin: 0.5rem 0;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.8rem;
  max-height: 400px;
  overflow-y: auto;
}

.nd-ndfs-box .nd-table { font-size: 0.8rem; }
.nd-ndfs-box .nd-table th {
  background: var(--tag-patch-bg);
  color: var(--tag-patch);
  border-bottom: 1px solid var(--tag-patch);
  padding: 0.25rem 0.5rem;
}
.nd-ndfs-box .nd-table td { padding: 0.2rem 0.5rem; }

/* ================================================================
   Version group
   ================================================================ */
.nd-version-group {
  margin: 1rem 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.nd-version-header {
  background: var(--tag-os-bg);
  color: var(--tag-os);
  padding: 0.5rem 1rem;
  font-weight: 600;
  border-bottom: 1px solid var(--tag-os);
}

.nd-version-body { padding: 0.75rem 1rem; }

/* ================================================================
   Provenance
   ================================================================ */
.nd-provenance {
  background: var(--warn-bg);
  border: 1px solid var(--warn);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--warn);
}

/* ================================================================
   BPUN indicator
   ================================================================ */
.nd-bpun-ok { color: var(--ok); }
.nd-bpun-fail { color: var(--warn); }

/* ================================================================
   Skip link
   ================================================================ */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--accent);
  color: #fff;
  padding: 8px;
  z-index: 100;
  transition: top 0.2s;
}
.skip-link:focus { top: 0; }

/* ================================================================
   Component: Modal
   ================================================================ */
.nd-modal-overlay {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 1000;
  align-items: center;
  justify-content: center;
}

.nd-modal {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.nd-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.nd-modal-header h3 {
  margin: 0;
  color: var(--accent);
}

.nd-modal-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 0.25rem;
  line-height: 1;
}

.nd-modal-close:hover { color: var(--text); }

.nd-modal-body {
  padding: 1rem 1.25rem;
  overflow-y: auto;
  flex: 1;
}

.nd-modal-wide {
  max-width: 1000px;
  width: 90%;
  max-height: 90vh;
}

.nd-modal-photo {
  background: rgba(0,0,0,0.95);
  border: none;
  box-shadow: none;
  max-width: none;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}

.nd-photo-viewer-close {
  position: absolute;
  top: 12px;
  right: 16px;
  z-index: 10;
  background: rgba(0,0,0,0.5);
  color: #fff;
  border: none;
  font-size: 2rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background-color 0.2s;
}
.nd-photo-viewer-close:hover { background: var(--accent, #3498db); }

.nd-photo-viewer-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
}
.nd-photo-viewer-container.dragging { cursor: grabbing; }

.nd-photo-viewer-container img {
  max-width: 95%;
  max-height: 90vh;
  transform-origin: center center;
  transition: transform 0.1s ease-out;
  user-select: none;
  border-radius: 4px;
  box-shadow: 0 10px 50px rgba(0,0,0,0.5);
  pointer-events: auto;
}

.nd-photo-zoom-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  align-items: center;
  background-color: rgba(0,0,0,0.7);
  padding: 10px 16px;
  border-radius: 8px;
  z-index: 10;
}

.nd-photo-zoom-controls button {
  background-color: var(--accent, #3498db);
  color: #fff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}
.nd-photo-zoom-controls button:hover { background-color: #2980b9; }

.nd-photo-zoom-level {
  color: #fff;
  font-size: 14px;
  min-width: 55px;
  text-align: center;
  font-weight: 600;
}

/* ================================================================
   NDFS Viewer styles
   ================================================================ */
.ndfs-viewer-header {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.82rem;
  color: var(--text-muted);
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.ndfs-viewer-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.ndfs-user-panel {
  width: 180px;
  min-width: 140px;
  border-right: 1px solid var(--border);
  overflow-y: auto;
  padding: 0.5rem 0;
  flex-shrink: 0;
}

.ndfs-user-panel h4 {
  margin: 0 0 0.25rem 0;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.ndfs-user-item {
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  font-size: 0.82rem;
  border-left: 3px solid transparent;
  transition: background 0.15s;
}

.ndfs-user-item:hover { background: var(--accent-bg); }

.ndfs-user-item.ndfs-user-active {
  background: var(--accent-bg);
  border-left-color: var(--accent);
  color: var(--accent);
}

.ndfs-user-item .ndfs-user-count {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.ndfs-file-panel {
  flex: 1;
  overflow: auto;
  min-width: 0;
}

.ndfs-file-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.ndfs-file-table th {
  position: sticky;
  top: 0;
  background: var(--bg-elev);
  text-align: left;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.ndfs-file-table td {
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.ndfs-file-table tr:hover { background: var(--accent-bg); }

.ndfs-file-table tr.ndfs-file-selected { background: var(--accent-bg); }

.ndfs-file-actions {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  align-items: center;
}

.ndfs-file-actions .nd-btn {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
}

.ndfs-file-actions .ndfs-selected-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-right: auto;
}

.ndfs-hex-view {
  font-family: 'Courier New', monospace;
  font-size: 0.72rem;
  white-space: pre;
  overflow: auto;
  max-height: 400px;
  padding: 0.75rem;
  background: var(--bg-sunken);
  border-radius: 4px;
  line-height: 1.4;
}

.ndfs-text-view {
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: auto;
  max-height: 400px;
  padding: 0.75rem;
  background: var(--bg-sunken);
  border-radius: 4px;
  line-height: 1.4;
}

.ndfs-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-muted);
  gap: 0.75rem;
}

.ndfs-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: ndfs-spin 0.7s linear infinite;
}

@keyframes ndfs-spin {
  to { transform: rotate(360deg); }
}

/* ================================================================
   Photos
   ================================================================ */
.nd-photo-thumb {
  display: inline-block;
  max-width: 200px;
  max-height: 160px;
  border-radius: 6px;
  border: 1px solid var(--border);
  cursor: pointer;
  margin: 0.25rem;
  transition: border-color 0.15s;
  object-fit: contain;
}

.nd-photo-thumb:hover { border-color: var(--accent); }

.nd-photo-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* ================================================================
   Responsive
   ================================================================ */
@media (max-width: 768px) {
  .nd-hero-stats { flex-direction: column; }
  .nd-dash-grid { grid-template-columns: 1fr; }
  .nd-table { font-size: 0.8rem; }
  .nd-table th, .nd-table td { padding: 0.3rem 0.4rem; }
  .nd-header { gap: 0.75rem; padding: 0 0.75rem; }
  .ndfs-viewer-layout { flex-direction: column; }
  .ndfs-user-panel { width: 100%; border-right: none; border-bottom: 1px solid var(--border); }
}

/* About page typography. The global reset (* { margin:0; padding:0 }) strips
   list indentation, which left bullets flush against the card edge. Restore a
   comfortable, well-indented layout -- scoped to .nd-about. */
.nd-about h2 { margin-bottom: 0.5rem; }
.nd-about .nd-card { padding: 1.25rem 1.5rem; margin-bottom: 1.1rem; }
.nd-about .nd-card h3 { margin-bottom: 0.7rem; }
.nd-about p { line-height: 1.7; margin-bottom: 0.6rem; }
.nd-about p:last-child { margin-bottom: 0; }
.nd-about ul, .nd-about ol { padding-left: 2.25rem; margin: 0.5rem 0 0.25rem; }
.nd-about ul { list-style: disc; }
.nd-about ol { list-style: decimal; }
.nd-about li { margin-bottom: 0.55rem; line-height: 1.65; padding-left: 0.35rem; }
.nd-about li:last-child { margin-bottom: 0; }
.nd-about li::marker { color: var(--text-muted); }
`;
}

function getAppJS(): string {
  return `(function() {
  'use strict';

  var REPO_RAW_BASE = 'https://raw.githubusercontent.com/HackerCorpLabs/norskdata-software-archive/main/';

  // ── Helpers ──────────────────────────────────────────────────
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatBytes(b) {
    if (b == null) return '-';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  function ndQuickStat(val, label, tooltip) {
    return '<div class="nd-quick-stat"' + (tooltip ? ' title="' + tooltip + '"' : '') + '><div class="nd-quick-stat-lbl">' + label + '</div><div class="nd-quick-stat-val">' + val + '</div></div>';
  }

  function rawUrl(path) {
    if (!path) return '';
    return REPO_RAW_BASE + path;
  }

  function photoUrl(path) {
    if (!path) return '';
    var v = PHOTO_VERSIONS[path];
    return rawUrl(path) + (v ? '?v=' + v : '');
  }

  function photoImg(path) {
    var url = photoUrl(path);
    return '<img class="nd-photo-thumb" src="' + esc(url) + '" alt="Photo" loading="lazy" onclick="ndShowPhoto(this.src)">';
  }

  function bpunMark(file) {
    if (file.bpunValid === true) return ' <span title="BPUN checksum valid" style="color:var(--ok);cursor:help;padding:0 0.2rem">\\u2713</span>';
    if (file.bpunValid === false) return ' <span title="BPUN checksum INVALID" style="color:var(--danger);cursor:help;padding:0 0.2rem;font-weight:bold">\\u2717</span>';
    if (file.type === 'BPUN') return ' <span title="BPUN checksum not validated" style="color:var(--text-muted);cursor:help;padding:0 0.2rem">?</span>';
    return '';
  }

  function fileDisplayName(file) {
    var user = file.userName || '';
    var name = file.name || file.fullName || '';
    // Only append :TYPE if name doesn't already include it
    if (name.indexOf(':') === -1 && file.type) {
      name = name + ':' + file.type;
    }
    return '<span style="color:var(--accent);font-weight:700">(' + esc(user) + ')</span>' + esc(name);
  }

  // Build lookup maps
  var productMap = {};
  for (var i = 0; i < PRODUCTS.length; i++) {
    productMap[PRODUCTS[i].id] = PRODUCTS[i];
  }
  var categoryMap = {};
  for (var i = 0; i < CATEGORIES.length; i++) {
    categoryMap[CATEGORIES[i].id] = CATEGORIES[i];
  }

  // Build catalog lookup
  var catalogMap = {};
  for (var i = 0; i < CATALOG.length; i++) {
    catalogMap[CATALOG[i].id] = CATALOG[i];
  }

  var view = document.getElementById('view');
  var PAGE_SIZE = 50;

  // ── Modal ────────────────────────────────────────────────────
  var ndModal = {
    _onClose: null,
    open: function(html, options) {
      options = options || {};
      var overlay = document.getElementById('nd-modal');
      var content = document.getElementById('nd-modal-content');
      content.innerHTML = html;
      content.className = 'nd-modal' + (options.wide ? ' nd-modal-wide' : '') + (options.photo ? ' nd-modal-photo' : '');
      ndModal._onClose = options.onClose || null;
      overlay.style.display = 'flex';
    },
    close: function() {
      var overlay = document.getElementById('nd-modal');
      overlay.style.display = 'none';
      document.getElementById('nd-modal-content').innerHTML = '';
      if (ndModal._onClose) {
        ndModal._onClose();
        ndModal._onClose = null;
      }
    }
  };
  window.ndModal = ndModal;

  // Wire overlay click/escape to close
  document.addEventListener('DOMContentLoaded', function() {
    var modalEl = document.getElementById('nd-modal');
    if (modalEl) {
      modalEl.addEventListener('click', function(ev) {
        if (ev.target === this) ndModal.close();
      });
    }
  });
  document.addEventListener('keydown', function(ev) {
    var modalEl = document.getElementById('nd-modal');
    if (ev.key === 'Escape' && modalEl && modalEl.style.display === 'flex') {
      ndModal.close();
    }
  });

  // ── Photo Viewer (zoom, rotate, pan) ──────────────────────────
  var pvZoom = 1, pvRotation = 0, pvPanX = 0, pvPanY = 0;
  var pvDragging = false, pvDragStartX = 0, pvDragStartY = 0, pvPanStartX = 0, pvPanStartY = 0;
  var PV_MIN = 0.5, PV_MAX = 10, PV_STEP = 0.25;

  function pvUpdate() {
    var img = document.getElementById('nd-pv-img');
    if (img) img.style.transform = 'translate(' + pvPanX + 'px,' + pvPanY + 'px) scale(' + pvZoom + ') rotate(' + pvRotation + 'deg)';
    var lvl = document.getElementById('nd-pv-level');
    if (lvl) lvl.textContent = Math.round(pvZoom * 100) + '%';
  }

  function pvReset() { pvZoom = 1; pvRotation = 0; pvPanX = 0; pvPanY = 0; pvUpdate(); }

  window.ndShowPhoto = function(src) {
    pvReset();
    var html =
      '<button class="nd-photo-viewer-close" onclick="ndModal.close()">&times;</button>' +
      '<div class="nd-photo-viewer-container" id="nd-pv-container">' +
        '<img id="nd-pv-img" src="' + src + '" alt="Photo" draggable="false">' +
      '</div>' +
      '<div class="nd-photo-zoom-controls">' +
        '<button onclick="ndPvRotateL()" title="Rotate left">&#8630;</button>' +
        '<button onclick="ndPvZoomOut()" title="Zoom out">&minus;</button>' +
        '<span class="nd-photo-zoom-level" id="nd-pv-level">100%</span>' +
        '<button onclick="ndPvZoomIn()" title="Zoom in">&plus;</button>' +
        '<button onclick="ndPvRotateR()" title="Rotate right">&#8631;</button>' +
        '<button onclick="ndPvReset()" title="Reset">R</button>' +
      '</div>';
    ndModal.open(html, { photo: true, onClose: function() { pvReset(); } });

    // Wire mouse/wheel events after DOM is ready
    setTimeout(function() {
      var container = document.getElementById('nd-pv-container');
      if (!container) return;

      container.addEventListener('wheel', function(e) {
        e.preventDefault();
        var delta = e.deltaY > 0 ? -PV_STEP : PV_STEP;
        var nz = Math.max(PV_MIN, Math.min(PV_MAX, pvZoom + delta));
        if (nz !== pvZoom) {
          pvZoom = nz;
          if (pvZoom <= 1) { pvPanX = 0; pvPanY = 0; }
          pvUpdate();
        }
      }, { passive: false });

      container.addEventListener('mousedown', function(e) {
        if (e.target.tagName === 'IMG' && pvZoom > 1) {
          pvDragging = true;
          pvDragStartX = e.clientX; pvDragStartY = e.clientY;
          pvPanStartX = pvPanX; pvPanStartY = pvPanY;
          container.classList.add('dragging');
          e.preventDefault();
        }
      });

      document.addEventListener('mousemove', function pvMove(e) {
        if (pvDragging) {
          pvPanX = pvPanStartX + (e.clientX - pvDragStartX);
          pvPanY = pvPanStartY + (e.clientY - pvDragStartY);
          pvUpdate();
        }
      });

      document.addEventListener('mouseup', function pvUp() {
        if (pvDragging) {
          pvDragging = false;
          var c = document.getElementById('nd-pv-container');
          if (c) c.classList.remove('dragging');
        }
      });
    }, 0);
  };

  window.ndPvZoomIn = function() { pvZoom = Math.min(PV_MAX, pvZoom + PV_STEP); pvUpdate(); };
  window.ndPvZoomOut = function() { pvZoom = Math.max(PV_MIN, pvZoom - PV_STEP); if (pvZoom <= 1) { pvPanX = 0; pvPanY = 0; } pvUpdate(); };
  window.ndPvRotateL = function() { pvRotation = (pvRotation - 90 + 360) % 360; pvUpdate(); };
  window.ndPvRotateR = function() { pvRotation = (pvRotation + 90) % 360; pvUpdate(); };
  window.ndPvReset = function() { pvReset(); };

  // Keyboard shortcuts for image viewer (same as ndfloppy PCB viewer)
  document.addEventListener('keydown', function(e) {
    var modal = document.getElementById('nd-modal');
    if (!modal || modal.style.display !== 'flex') return;
    var hasViewer = document.getElementById('nd-pv-img');
    if (!hasViewer) return;
    if (e.key === '+' || e.key === '=') { ndPvZoomIn(); e.preventDefault(); }
    else if (e.key === '-') { ndPvZoomOut(); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { ndPvRotateR(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { ndPvRotateL(); e.preventDefault(); }
    else if (e.key === 'r' || e.key === 'R') { ndPvReset(); e.preventDefault(); }
  });

  // ── Theme toggle ─────────────────────────────────────────────
  var themeBtn = document.getElementById('theme-toggle');
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeBtn.textContent = theme === 'dark' ? '\u263E' : '\u2600';
    themeBtn.title = 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' theme';
  }
  var savedTheme = localStorage.getItem('nd-theme');
  applyTheme(savedTheme === 'light' ? 'light' : 'dark');

  themeBtn.addEventListener('click', function() {
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : 'dark';
    localStorage.setItem('nd-theme', next);
    applyTheme(next);
  });

  // ── Router ───────────────────────────────────────────────────
  function getRoute() {
    var h = location.hash || '#/';
    if (h === '#' || h === '') h = '#/';
    return h.substring(1); // strip '#'
  }

  function navigate() {
    ndModal.close();
    var route = getRoute();
    // Update nav active states
    var links = document.querySelectorAll('.nd-nav-link');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      var r = href ? href.substring(1) : '';
      if (route === r || (r !== '/' && route.indexOf(r) === 0)) {
        links[i].classList.add('nd-active');
      } else {
        links[i].classList.remove('nd-active');
      }
    }
    // Fix: dashboard should only be active on exact match
    var dashLink = document.querySelector('[data-route="dashboard"]');
    if (dashLink) {
      if (route === '/') {
        dashLink.classList.add('nd-active');
      } else {
        dashLink.classList.remove('nd-active');
      }
    }

    if (route === '/') return renderDashboard();
    if (route === '/catalog') return renderCatalog();
    if (route === '/products') return renderProducts();
    if (route === '/about') return renderAbout();
    if (route.indexOf('/products/') === 0) {
      var pid = decodeURIComponent(route.substring('/products/'.length));
      return renderProductDetail(pid);
    }
    if (route.indexOf('/disks/') === 0) {
      var did = decodeURIComponent(route.substring('/disks/'.length));
      return renderDiskDetail(did);
    }
    renderDashboard();
  }

  window.addEventListener('hashchange', navigate);

  // ── Dashboard ────────────────────────────────────────────────
  function renderDashboard() {
    var totalImages = CATALOG.length;
    var productIds = {};
    var fileTypes = {};
    var bootFormats = {};
    var storageClasses = {};
    var totalFiles = 0;
    var contributors = {};

    for (var i = 0; i < CATALOG.length; i++) {
      var e = CATALOG[i];
      if (e.productId) productIds[e.productId] = (productIds[e.productId] || 0) + 1;
      var sc = e.storageClass || 'unknown';
      storageClasses[sc] = (storageClasses[sc] || 0) + 1;
      var bf = e.bootFormat || 'unknown';
      bootFormats[bf] = (bootFormats[bf] || 0) + 1;
      if (e.ndfs && e.ndfs.files) {
        totalFiles += e.ndfs.files.length;
        for (var j = 0; j < e.ndfs.files.length; j++) {
          var ft = e.ndfs.files[j].type || 'unknown';
          fileTypes[ft] = (fileTypes[ft] || 0) + 1;
        }
      }
      if (e.provenance && e.provenance.contributor && e.provenance.contributor !== 'unknown') {
        contributors[e.provenance.contributor] = (contributors[e.provenance.contributor] || 0) + 1;
      }
    }

    var matchedProducts = Object.keys(productIds).length;
    var unmatchedCount = 0;
    for (var i = 0; i < CATALOG.length; i++) {
      if (!CATALOG[i].productId) unmatchedCount++;
    }

    // Top products
    var topProducts = Object.keys(productIds).map(function(k) { return { id: k, count: productIds[k] }; });
    topProducts.sort(function(a, b) { return b.count - a.count; });
    topProducts = topProducts.slice(0, 10);

    // Top file types
    var topFileTypes = Object.keys(fileTypes).map(function(k) { return { type: k, count: fileTypes[k] }; });
    topFileTypes.sort(function(a, b) { return b.count - a.count; });
    topFileTypes = topFileTypes.slice(0, 12);

    // Boot formats
    var bootList = Object.keys(bootFormats).map(function(k) { return { format: k, count: bootFormats[k] }; });
    bootList.sort(function(a, b) { return b.count - a.count; });

    // Contributors
    var contribList = Object.keys(contributors).map(function(k) { return { name: k, count: contributors[k] }; });
    contribList.sort(function(a, b) { return b.count - a.count; });

    var html = '<h2>Archive Overview</h2>';

    // Stats row
    html += '<div class="nd-hero-stats">';
    html += statCard(totalImages, 'Floppy Images');
    html += statCard(matchedProducts, 'Products Matched');
    html += statCard(PRODUCTS.length, 'Products Known');
    html += statCard(totalFiles, 'NDFS Files');
    html += statCard(storageClasses['floppy-in-git'] || 0, 'In Git');
    html += statCard(unmatchedCount, 'Unmatched', unmatchedCount > 0 ? 'nd-stat-warn' : '');
    html += '</div>';

    // Grid
    html += '<div class="nd-dash-grid">';

    // Top products card
    html += '<div class="nd-card"><h3>Top Products</h3>';
    html += '<table class="nd-table"><thead><tr><th>Product</th><th>Images</th></tr></thead><tbody>';
    for (var i = 0; i < topProducts.length; i++) {
      var p = topProducts[i];
      var pn = productMap[p.id] ? productMap[p.id].name : p.id;
      html += '<tr><td><a href="#/products/' + encodeURIComponent(p.id) + '">' + esc(p.id) + ' - ' + esc(pn) + '</a></td>';
      html += '<td>' + p.count + '</td></tr>';
    }
    html += '</tbody></table></div>';

    // File types card
    html += '<div class="nd-card"><h3>NDFS File Types</h3>';
    html += '<table class="nd-table"><thead><tr><th>Type</th><th>Count</th></tr></thead><tbody>';
    for (var i = 0; i < topFileTypes.length; i++) {
      html += '<tr><td><span class="nd-badge nd-badge-info">' + esc(topFileTypes[i].type) + '</span></td>';
      html += '<td>' + topFileTypes[i].count + '</td></tr>';
    }
    html += '</tbody></table></div>';

    // Boot formats card
    html += '<div class="nd-card"><h3>Boot Formats</h3>';
    html += '<table class="nd-table"><thead><tr><th>Format</th><th>Count</th></tr></thead><tbody>';
    for (var i = 0; i < bootList.length; i++) {
      html += '<tr><td><span class="nd-badge nd-badge-os">' + esc(bootList[i].format) + '</span></td>';
      html += '<td>' + bootList[i].count + '</td></tr>';
    }
    html += '</tbody></table></div>';

    // Contributors card
    if (contribList.length > 0) {
      html += '<div class="nd-card"><h3>Contributors</h3>';
      html += '<table class="nd-table"><thead><tr><th>Name</th><th>Images</th></tr></thead><tbody>';
      for (var i = 0; i < contribList.length; i++) {
        html += '<tr><td>' + esc(contribList[i].name) + '</td>';
        html += '<td>' + contribList[i].count + '</td></tr>';
      }
      html += '</tbody></table></div>';
    }

    html += '</div>'; // end grid

    view.innerHTML = html;
  }

  function statCard(value, label, extraClass) {
    return '<div class="nd-stat ' + (extraClass || '') + '">' +
      '<div class="nd-stat-value">' + value + '</div>' +
      '<div class="nd-stat-label">' + esc(label) + '</div></div>';
  }

  // ── Catalog ──────────────────────────────────────────────────
  var catalogState = { query: '', page: 0, sortCol: null, sortDir: 'asc' };

  var catalogDebounce;

  function renderCatalog() {
    // Only build the shell once; updateCatalogResults rebuilds just the table
    var shell = '<h2>Full Catalog (' + CATALOG.length + ' images)</h2>';
    shell += '<div class="nd-search-bar"><input class="nd-input" type="text" id="cat-search" placeholder="Search by volume, product, MD5, tags..." value="' + esc(catalogState.query) + '"></div>';
    shell += '<p id="cat-count" style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem"></p>';
    shell += '<div id="cat-results" style="overflow-x:auto"></div>';
    shell += '<div class="nd-pagination" id="cat-pager"></div>';

    view.innerHTML = shell;

    var searchInput = document.getElementById('cat-search');
    searchInput.addEventListener('input', function() {
      clearTimeout(catalogDebounce);
      catalogDebounce = setTimeout(function() {
        catalogState.query = searchInput.value;
        catalogState.page = 0;
        updateCatalogResults();
      }, 200);
    });
    searchInput.focus();

    updateCatalogResults();
  }

  function updateCatalogResults() {
    var filtered = filterCatalog(catalogState.query);

    if (catalogState.sortCol !== null) {
      filtered = sortEntries(filtered, catalogState.sortCol, catalogState.sortDir);
    }

    var totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
    if (catalogState.page >= totalPages) catalogState.page = totalPages - 1;
    var start = catalogState.page * PAGE_SIZE;
    var pageEntries = filtered.slice(start, start + PAGE_SIZE);

    document.getElementById('cat-count').textContent = filtered.length + ' results';

    var html = '<table class="nd-table" id="cat-table">';
    html += '<colgroup><col style="width:22%"><col style="width:32%"><col style="width:8%"><col style="width:10%"><col style="width:14%"><col style="width:14%"></colgroup>';
    html += '<thead><tr>';
    var cols = ['Volume Name', 'Product', 'Version', 'Size', 'Boot Format', 'Files'];
    for (var c = 0; c < cols.length; c++) {
      var arrow = '';
      if (catalogState.sortCol === c) arrow = catalogState.sortDir === 'asc' ? ' \\u25B2' : ' \\u25BC';
      html += '<th data-col="' + c + '">' + cols[c] + arrow + '</th>';
    }
    html += '</tr></thead><tbody>';

    for (var i = 0; i < pageEntries.length; i++) {
      var e = pageEntries[i];
      var pName = '';
      if (e.productId && productMap[e.productId]) pName = productMap[e.productId].name;
      else if (e.productId) pName = e.productId;
      html += '<tr>';
      html += '<td><a href="#/disks/' + encodeURIComponent(e.id) + '">' + esc(e.volumeName || e.id) + '</a></td>';
      html += '<td>' + (e.productId ? '<a href="#/products/' + encodeURIComponent(e.productId) + '">' + esc(pName) + '</a>' : '<em style="color:var(--text-muted)">unmatched</em>') + '</td>';
      html += '<td>' + esc(e.version) + '</td>';
      html += '<td>' + formatBytes(e.imageSizeBytes) + '</td>';
      html += '<td><span class="nd-badge nd-badge-os">' + esc(e.bootFormat || '-') + '</span></td>';
      html += '<td>' + (e.ndfs && e.ndfs.files ? e.ndfs.files.length : '-') + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    document.getElementById('cat-results').innerHTML = html;

    // Pagination
    var pagerHtml = '<button class="nd-btn" id="cat-prev" ' + (catalogState.page <= 0 ? 'disabled' : '') + '>Prev</button>';
    pagerHtml += '<span>Page ' + (catalogState.page + 1) + ' of ' + totalPages + '</span>';
    pagerHtml += '<button class="nd-btn" id="cat-next" ' + (catalogState.page >= totalPages - 1 ? 'disabled' : '') + '>Next</button>';
    document.getElementById('cat-pager').innerHTML = pagerHtml;

    document.getElementById('cat-prev').addEventListener('click', function() {
      if (catalogState.page > 0) { catalogState.page--; updateCatalogResults(); }
    });
    document.getElementById('cat-next').addEventListener('click', function() {
      if (catalogState.page < totalPages - 1) { catalogState.page++; updateCatalogResults(); }
    });

    // Sort headers
    var ths = document.querySelectorAll('#cat-table th');
    for (var t = 0; t < ths.length; t++) {
      ths[t].addEventListener('click', function() {
        var col = parseInt(this.getAttribute('data-col'));
        if (catalogState.sortCol === col) {
          catalogState.sortDir = catalogState.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          catalogState.sortCol = col;
          catalogState.sortDir = 'asc';
        }
        updateCatalogResults();
      });
    }
  }

  function filterCatalog(query) {
    if (!query) return CATALOG.slice();
    var q = query.toLowerCase();
    return CATALOG.filter(function(e) {
      if (e.id && e.id.toLowerCase().indexOf(q) >= 0) return true;
      if (e.volumeName && e.volumeName.toLowerCase().indexOf(q) >= 0) return true;
      if (e.productId && e.productId.toLowerCase().indexOf(q) >= 0) return true;
      if (e.productId && productMap[e.productId] && productMap[e.productId].name.toLowerCase().indexOf(q) >= 0) return true;
      if (e.version && e.version.toLowerCase().indexOf(q) >= 0) return true;
      if (e.bootFormat && e.bootFormat.toLowerCase().indexOf(q) >= 0) return true;
      if (e.md5 && e.md5.toLowerCase().indexOf(q) >= 0) return true;
      if (e.mediaRole && e.mediaRole.toLowerCase().indexOf(q) >= 0) return true;
      if (e.tags) {
        for (var t = 0; t < e.tags.length; t++) {
          if (e.tags[t].toLowerCase().indexOf(q) >= 0) return true;
        }
      }
      if (e.ndfs && e.ndfs.files) {
        for (var nf = 0; nf < e.ndfs.files.length; nf++) {
          if (e.ndfs.files[nf].name.toLowerCase().indexOf(q) >= 0) return true;
        }
      }
      return false;
    });
  }

  function sortEntries(arr, col, dir) {
    var sorted = arr.slice();
    sorted.sort(function(a, b) {
      var av, bv;
      switch (col) {
        case 0: av = (a.volumeName || a.id || '').toLowerCase(); bv = (b.volumeName || b.id || '').toLowerCase(); break;
        case 1: av = (a.productId || '').toLowerCase(); bv = (b.productId || '').toLowerCase(); break;
        case 2: av = (a.version || '').toLowerCase(); bv = (b.version || '').toLowerCase(); break;
        case 3: av = a.imageSizeBytes || 0; bv = b.imageSizeBytes || 0; return dir === 'asc' ? av - bv : bv - av;
        case 4: av = (a.bootFormat || '').toLowerCase(); bv = (b.bootFormat || '').toLowerCase(); break;
        case 5:
          av = (a.ndfs && a.ndfs.files) ? a.ndfs.files.length : 0;
          bv = (b.ndfs && b.ndfs.files) ? b.ndfs.files.length : 0;
          return dir === 'asc' ? av - bv : bv - av;
        default: av = ''; bv = '';
      }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  // ── Products ─────────────────────────────────────────────────
  var productsState = { query: '', category: null, sortCol: null, sortDir: 'asc' };
  var productsDebounce;

  // Pre-compute image counts (static data, won't change)
  var imgCount = {};
  for (var ic = 0; ic < CATALOG.length; ic++) {
    if (CATALOG[ic].productId) {
      imgCount[CATALOG[ic].productId] = (imgCount[CATALOG[ic].productId] || 0) + 1;
    }
  }

  function renderProducts() {
    var html = '<h2>Products (' + PRODUCTS.length + ')</h2>';
    html += '<div class="nd-search-bar"><input class="nd-input" type="text" id="prod-search" placeholder="Search products..." value="' + esc(productsState.query) + '"></div>';
    html += '<div class="nd-chips" id="prod-chips"></div>';
    html += '<p id="prod-count" style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem"></p>';
    html += '<div id="prod-results"></div>';

    view.innerHTML = html;

    var searchInput = document.getElementById('prod-search');
    searchInput.addEventListener('input', function() {
      clearTimeout(productsDebounce);
      productsDebounce = setTimeout(function() {
        productsState.query = searchInput.value;
        updateProductsResults();
      }, 200);
    });

    updateProductChips();
    updateProductsResults();
  }

  function updateProductChips() {
    var chipsHtml = '<span class="nd-chip' + (productsState.category === null ? ' nd-chip-active' : '') + '" data-cat="">All</span>';
    for (var i = 0; i < CATEGORIES.length; i++) {
      var cat = CATEGORIES[i];
      var active = productsState.category === cat.id ? ' nd-chip-active' : '';
      chipsHtml += '<span class="nd-chip' + active + '" data-cat="' + esc(cat.id) + '">' + esc(cat.name) + '</span>';
    }
    document.getElementById('prod-chips').innerHTML = chipsHtml;

    var chips = document.querySelectorAll('.nd-chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener('click', function() {
        var cat = this.getAttribute('data-cat');
        productsState.category = cat || null;
        updateProductChips();
        updateProductsResults();
      });
    }
  }

  function updateProductsResults() {
    var filtered = PRODUCTS.filter(function(p) {
      if (productsState.category) {
        if (!p.categories || p.categories.indexOf(productsState.category) < 0) return false;
      }
      if (productsState.query) {
        var q = productsState.query.toLowerCase();
        if (p.id.toLowerCase().indexOf(q) < 0 && p.name.toLowerCase().indexOf(q) < 0 &&
            (!p.description || p.description.toLowerCase().indexOf(q) < 0)) return false;
      }
      return true;
    });

    if (productsState.sortCol !== null) {
      filtered = sortProducts(filtered, productsState.sortCol, productsState.sortDir, imgCount);
    }

    document.getElementById('prod-count').textContent = filtered.length + ' products';

    var html = '<table class="nd-table" id="prod-table">';
    html += '<colgroup><col style="width:13%"><col style="width:37%"><col style="width:22%"><col style="width:16%"><col style="width:12%"></colgroup>';
    html += '<thead><tr>';
    var prodCols = ['ID', 'Name', 'Categories', 'Platform', 'Images'];
    for (var pc = 0; pc < prodCols.length; pc++) {
      var parrow = '';
      if (productsState.sortCol === pc) parrow = productsState.sortDir === 'asc' ? ' \\u25B2' : ' \\u25BC';
      html += '<th data-col="' + pc + '">' + prodCols[pc] + parrow + '</th>';
    }
    html += '</tr></thead><tbody>';
    for (var i = 0; i < filtered.length; i++) {
      var p = filtered[i];
      var cats = '';
      if (p.categories) {
        for (var c = 0; c < p.categories.length; c++) {
          var cn = categoryMap[p.categories[c]] ? categoryMap[p.categories[c]].name : p.categories[c];
          cats += '<span class="nd-badge nd-badge-info" style="margin-right:0.25rem">' + esc(cn) + '</span>';
        }
      }
      var plat = '';
      if (p.platform) {
        for (var pl = 0; pl < p.platform.length; pl++) {
          plat += '<span class="nd-badge nd-badge-os" style="margin-right:0.25rem">' + esc(p.platform[pl]) + '</span>';
        }
      }
      var count = imgCount[p.id] || 0;
      html += '<tr>';
      html += '<td><a href="#/products/' + encodeURIComponent(p.id) + '">' + esc(p.id) + '</a></td>';
      html += '<td>' + esc(p.name) + '</td>';
      html += '<td>' + cats + '</td>';
      html += '<td>' + plat + '</td>';
      html += '<td>' + (count > 0 ? '<span class="nd-badge nd-badge-ok">' + count + '</span>' : '<span style="color:var(--text-muted)">0</span>') + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    document.getElementById('prod-results').innerHTML = html;

    // Sort headers
    var pths = document.querySelectorAll('#prod-table th');
    for (var pt = 0; pt < pths.length; pt++) {
      pths[pt].addEventListener('click', function() {
        var col = parseInt(this.getAttribute('data-col'));
        if (productsState.sortCol === col) {
          productsState.sortDir = productsState.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          productsState.sortCol = col;
          productsState.sortDir = 'asc';
        }
        updateProductsResults();
      });
    }
  }

  function sortProducts(arr, col, dir, imgCount) {
    var sorted = arr.slice();
    sorted.sort(function(a, b) {
      var av, bv;
      switch (col) {
        case 0: av = a.id.toLowerCase(); bv = b.id.toLowerCase(); break;
        case 1: av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break;
        case 2: av = (a.categories || []).join(',').toLowerCase(); bv = (b.categories || []).join(',').toLowerCase(); break;
        case 3: av = (a.platform || []).join(',').toLowerCase(); bv = (b.platform || []).join(',').toLowerCase(); break;
        case 4: av = imgCount[a.id] || 0; bv = imgCount[b.id] || 0; return dir === 'asc' ? av - bv : bv - av;
        default: av = ''; bv = '';
      }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  // ── About ────────────────────────────────────────────────────
  function renderAbout() {
    var totalFiles = 0;
    for (var i = 0; i < CATALOG.length; i++) {
      if (CATALOG[i].ndfs && CATALOG[i].ndfs.files) totalFiles += CATALOG[i].ndfs.files.length;
    }

    view.innerHTML =
      '<div class="nd-about" style="max-width:820px">' +

      '<h2>About this project</h2>' +
      '<p style="font-size:1.05rem;line-height:1.7;margin-bottom:1.5rem">' +
        'The Norsk Data Software Archive is a preservation project dedicated to saving the software heritage of ' +
        '<strong>Norsk Data</strong>, a Norwegian minicomputer manufacturer that operated from 1967 to 1998. ' +
        'Norsk Data produced the NORD and ND series of minicomputers, running the SINTRAN operating system.' +
      '</p>' +

      '<div class="nd-card" style="margin-bottom:1rem">' +
        '<h3>What we preserve</h3>' +
        '<p>This archive contains floppy disk images from Norsk Data systems &mdash; operating systems, ' +
        'programming languages, office applications, test programs, database tools, and more. ' +
        'Each image is stored with its complete metadata: filesystem contents, checksums, provenance, ' +
        'and label photographs.</p>' +
        '<div class="nd-quick-stats" style="margin-top:1rem">' +
          ndQuickStat(CATALOG.length, 'Disk Images', 'Total preserved floppy disk images') +
          ndQuickStat(PRODUCTS.length, 'Products', 'Known Norsk Data software products') +
          ndQuickStat(totalFiles, 'Files', 'Individual files across all disk images') +
          ndQuickStat(CATEGORIES.length, 'Categories', 'Software categories') +
        '</div>' +
      '</div>' +

      '<div class="nd-card" style="margin-bottom:1rem">' +
        '<h3>Why this matters</h3>' +
        '<p>Norsk Data minicomputers were widely used in Scandinavian universities, research institutions, ' +
        'and industry throughout the 1970s and 1980s. As the original hardware deteriorates and floppy disks degrade, ' +
        'the software that ran on these machines risks being lost forever.</p>' +
        '<p style="margin-top:0.5rem">This project captures the raw disk images before the physical media fails, ' +
        'extracts and catalogs the NDFS filesystem contents, and makes everything searchable and accessible ' +
        'for researchers, historians, and anyone interested in computing history.</p>' +
      '</div>' +

      '<div class="nd-card" style="margin-bottom:1rem">' +
        '<h3>How it works</h3>' +
        '<ul style="line-height:1.8">' +
          '<li>Physical floppy disks are imaged using preservation-grade hardware like the ' +
            '<a href="https://kryoflux.com/" target="_blank" rel="noopener">Kryoflux</a> and ' +
            '<a href="https://github.com/keirf/greaseweazle" target="_blank" rel="noopener">Greaseweazle</a></li>' +
          '<li>Raw images are compressed and stored in git, each in a folder named by its MD5 hash</li>' +
          '<li>The NDFS filesystem on each disk is parsed to extract file listings, dates, and checksums</li>' +
          '<li>BPUN (Binary Package) files are validated against their embedded checksums</li>' +
          '<li>Products are matched by parsing volume names and cross-referencing the ND product catalog</li>' +
          '<li>Label photographs are preserved alongside the disk images</li>' +
        '</ul>' +
      '</div>' +

      '<div class="nd-card" style="margin-bottom:1rem">' +
        '<h3>The NDFS filesystem</h3>' +
        '<p>Norsk Data File System (NDFS) is the native filesystem used on ND minicomputers. ' +
        'This site includes a client-side NDFS parser that can read any disk image directly in your browser &mdash; ' +
        'browse files, view hex dumps, extract individual files, and validate BPUN checksums, ' +
        'all without any server-side processing.</p>' +
      '</div>' +

      '<div class="nd-card" style="margin-bottom:1rem">' +
        '<h3>Contributing</h3>' +
        '<p>If you have Norsk Data floppy disks, hard disk images, documentation, or other artifacts, ' +
        'we would love to hear from you. Every preserved disk adds to our understanding of this ' +
        'important chapter in Scandinavian computing history.</p>' +
      '</div>' +

      '<div class="nd-card" style="margin-bottom:1rem">' +
        '<h3>Links</h3>' +
        '<ul style="line-height:2">' +
          '<li><a href="https://github.com/HackerCorpLabs/norskdata-software-archive" target="_blank" rel="noopener">Source code on GitHub</a></li>' +
          '<li><a href="https://github.com/HackerCorpLabs/norskdata-software-archive/issues" target="_blank" rel="noopener">Report issues or contribute</a></li>' +
          '<li><a href="https://github.com/HackerCorpLabs" target="_blank" rel="noopener">HackerCorpLabs on GitHub</a></li>' +
        '</ul>' +
      '</div>' +

      '</div>';
  }

  // ── Product Detail ───────────────────────────────────────────
  function renderProductDetail(pid) {
    var product = productMap[pid];
    var pName = product ? product.name : pid;

    // Filter catalog entries for this product
    var entries = CATALOG.filter(function(e) { return e.productId === pid; });

    var html = '<p style="margin-bottom:0.5rem"><a href="#/products">&larr; Products</a></p>';
    html += '<h2>' + esc(pid) + ' - ' + esc(pName) + '</h2>';

    if (product) {
      if (product.description) html += '<p style="color:var(--text-muted);margin-bottom:0.5rem">' + esc(product.description) + '</p>';
      var meta = '';
      if (product.categories && product.categories.length) {
        for (var c = 0; c < product.categories.length; c++) {
          var cn = categoryMap[product.categories[c]] ? categoryMap[product.categories[c]].name : product.categories[c];
          meta += '<span class="nd-badge nd-badge-info" style="margin-right:0.25rem">' + esc(cn) + '</span>';
        }
      }
      if (product.platform && product.platform.length) {
        for (var pl = 0; pl < product.platform.length; pl++) {
          meta += '<span class="nd-badge nd-badge-os" style="margin-right:0.25rem">' + esc(product.platform[pl]) + '</span>';
        }
      }
      if (meta) html += '<p style="margin-bottom:1rem">' + meta + '</p>';
    }

    html += '<p><span class="nd-badge">' + entries.length + ' image' + (entries.length !== 1 ? 's' : '') + '</span></p>';

    if (entries.length === 0) {
      html += '<div class="nd-placeholder"><p>No floppy images matched to this product yet.</p></div>';
      view.innerHTML = html;
      return;
    }

    // Group by version
    var byVersion = {};
    var versionOrder = [];
    for (var i = 0; i < entries.length; i++) {
      var ver = entries[i].version || '(unknown)';
      if (!byVersion[ver]) { byVersion[ver] = []; versionOrder.push(ver); }
      byVersion[ver].push(entries[i]);
    }
    versionOrder.sort();

    for (var v = 0; v < versionOrder.length; v++) {
      var ver = versionOrder[v];
      var ventries = byVersion[ver];
      html += '<div class="nd-version-group">';
      html += '<div class="nd-version-header">Version ' + esc(ver) + ' (' + ventries.length + ' image' + (ventries.length !== 1 ? 's' : '') + ')</div>';
      html += '<div class="nd-version-body">';

      // Collect set photos from entries in this version
      var versionSetPhotos = [];
      for (var ei = 0; ei < ventries.length; ei++) {
        var vGit = ventries[ei].storage && ventries[ei].storage.git;
        if (vGit && vGit.setPhotos && vGit.setPhotos.length > 0) {
          for (var sp = 0; sp < vGit.setPhotos.length; sp++) {
            if (versionSetPhotos.indexOf(vGit.setPhotos[sp]) < 0) {
              versionSetPhotos.push(vGit.setPhotos[sp]);
            }
          }
        }
      }
      if (versionSetPhotos.length > 0) {
        html += '<div class="nd-photo-gallery" style="margin-bottom:0.75rem">';
        for (var sp = 0; sp < versionSetPhotos.length; sp++) {
          html += photoImg(versionSetPhotos[sp]);
        }
        html += '</div>';
      }

      for (var ei = 0; ei < ventries.length; ei++) {
        html += renderImageCard(ventries[ei]);
      }

      html += '</div></div>';
    }

    view.innerHTML = html;
  }

  // ── Disk Detail ──────────────────────────────────────────────
  function renderDiskDetail(diskId) {
    var entry = null;
    for (var i = 0; i < CATALOG.length; i++) {
      if (CATALOG[i].id === diskId) { entry = CATALOG[i]; break; }
    }

    if (!entry) {
      view.innerHTML = '<div class="nd-placeholder"><h2>Not Found</h2><p>Disk "' + esc(diskId) + '" not found in catalog.</p></div>';
      return;
    }

    var html = '<p style="margin-bottom:0.5rem"><a href="#/catalog">&larr; Catalog</a>';
    if (entry.productId) {
      html += ' | <a href="#/products/' + encodeURIComponent(entry.productId) + '">' + esc(entry.productId) + '</a>';
    }
    html += '</p>';

    html += '<h2>' + esc(entry.volumeName || entry.id) + '</h2>';
    html += renderImageCard(entry, true);

    view.innerHTML = html;
  }

  // ── Image Card (shared) ──────────────────────────────────────
  function renderImageCard(e, full) {
    var html = '<div class="nd-card">';

    // ── Header: volume name + product link ──
    html += '<h3 style="font-family:Consolas,monospace;font-size:1.3rem;margin-bottom:0.25rem">' +
      '<a href="#/disks/' + encodeURIComponent(e.id) + '" style="color:var(--text)">' + esc(e.volumeName || e.id) + '</a></h3>';

    if (e.productId) {
      var prodName = '';
      for (var pi = 0; pi < PRODUCTS.length; pi++) {
        if (PRODUCTS[pi].id === e.productId) { prodName = PRODUCTS[pi].name; break; }
      }
      html += '<div style="margin-bottom:0.75rem"><a href="#/products/' + encodeURIComponent(e.productId) + '"><code>' + esc(e.productId) + '</code>' +
        (prodName ? ' &mdash; ' + esc(prodName) : '') + '</a></div>';
    }

    // ── Badges row ──
    html += '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.75rem">';
    if (e.version) html += '<span class="nd-badge nd-badge-os" title="Software version/revision letter">' + esc('Version ' + e.version) + '</span>';
    if (e.diskNumber != null) html += '<span class="nd-badge" title="Disk number in a multi-disk set">Disk ' + e.diskNumber + '</span>';
    if (e.tags && e.tags.length) {
      for (var t = 0; t < e.tags.length; t++) {
        html += '<span class="nd-badge nd-badge-product">' + esc(e.tags[t]) + '</span>';
      }
    }
    html += '</div>';

    // ── Quick stats row ──
    html += '<div class="nd-quick-stats">';
    if (e.bootFormat) html += ndQuickStat(esc(e.bootFormat), 'Boot Format', 'How the floppy boots: none = not bootable, flomon = ND floppy monitor, binary = raw bootstrap, bpun = packaged binary');
    if (e.totalPages != null) html += ndQuickStat(e.totalPages, 'NDFS Pages', 'NDFS filesystem pages (1 page = ' + (e.pageSize || 1024) + ' bytes)');
    if (e.imageSizeBytes != null) html += ndQuickStat(formatBytes(e.imageSizeBytes), 'Image Size', 'Total size of the disk image file');
    if (e.ndfs && e.ndfs.files) html += ndQuickStat(e.ndfs.files.length, 'Files on Disk', 'Number of files stored on the floppy');
    html += '</div>';

    // ── Action buttons ──
    if (full && e.storage && e.storage.git && e.storage.git.imagePath) {
      html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">';
      html += '<a href="' + esc(rawUrl(e.storage.git.imagePath)) + '" class="nd-btn nd-btn-sm" download>Download .img.gz</a>';
      if (e.storageClass === 'floppy-in-git') {
        html += '<button class="nd-btn nd-btn-primary nd-btn-sm" onclick="openNdfsViewer(\\'' + esc(e.id).replace(/'/g, "\\\\'") + '\\')">Open in NDFS Viewer</button>';
      }
      html += '</div>';
    }

    // ── NDFS file table (THE MAIN CONTENT) ──
    if (e.ndfs && e.ndfs.files && e.ndfs.files.length > 0) {
      var hasAnyDate = false;
      for (var fd = 0; fd < e.ndfs.files.length; fd++) {
        if (e.ndfs.files[fd].dateCreatedStr || e.ndfs.files[fd].lastDateWrittenStr) { hasAnyDate = true; break; }
      }
      html += '<table class="nd-table" style="font-size:0.84rem;margin-bottom:1rem"><thead><tr>' +
        '<th>Name</th><th style="text-align:right">Pages</th><th style="text-align:right">Size</th>' +
        (hasAnyDate ? '<th>Created</th><th>Written</th>' : '') +
        '</tr></thead><tbody>';
      for (var f = 0; f < e.ndfs.files.length; f++) {
        var file = e.ndfs.files[f];
        html += '<tr>';
        html += '<td style="white-space:nowrap"><code style="font-size:0.8rem">' + fileDisplayName(file) + bpunMark(file) + '</code></td>';
        html += '<td style="text-align:right">' + (file.pages != null ? file.pages : '-') + '</td>';
        html += '<td style="text-align:right">' + formatBytes(file.bytes) + '</td>';
        if (hasAnyDate) {
          html += '<td style="color:var(--text-muted);font-size:0.8rem">' + esc(file.dateCreatedStr || '-') + '</td>';
          html += '<td style="color:var(--text-muted);font-size:0.8rem">' + esc(file.lastDateWrittenStr || '-') + '</td>';
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
    }

    // ── Photos (below file table) ──
    if (full && e.storage && e.storage.git) {
      var git = e.storage.git;
      var hasPhotos = (git.diskPhotos && git.diskPhotos.length > 0) || (git.setPhotos && git.setPhotos.length > 0);
      if (hasPhotos) {
        html += '<div style="margin-bottom:1rem">';
        if (git.diskPhotos && git.diskPhotos.length > 0) {
          html += '<div class="nd-photo-gallery">';
          for (var dp = 0; dp < git.diskPhotos.length; dp++) html += photoImg(git.diskPhotos[dp]);
          html += '</div>';
        }
        if (git.setPhotos && git.setPhotos.length > 0) {
          html += '<div class="nd-photo-gallery">';
          for (var sp = 0; sp < git.setPhotos.length; sp++) html += photoImg(git.setPhotos[sp]);
          html += '</div>';
        }
        html += '</div>';
      }
    }

    // ── More details (collapsible, at the bottom -- same style as local UI) ──
    if (full) {
      html += '<details class="nd-details-toggle">';
      html += '<summary>More details</summary>';
      html += '<div class="nd-details-body">';

      // Verification
      html += '<h4 style="margin-bottom:0.5rem;color:var(--accent)">Verification checksums</h4>';
      html += '<dl class="nd-dl">';
      html += '<dt>ID</dt><dd><code class="nd-copyable">' + esc(e.id) + '</code></dd>';
      html += '<dt>MD5</dt><dd><code class="nd-copyable">' + esc(e.md5) + '</code></dd>';
      html += '</dl>';

      // Origin
      if (e.provenance) {
        html += '<h4 style="margin-top:1rem;margin-bottom:0.5rem;color:var(--accent)">Origin</h4>';
        html += '<dl class="nd-dl">';
        if (e.provenance.contributor && e.provenance.contributor !== 'unknown') html += '<dt>Contributed by</dt><dd><code class="nd-copyable">' + esc(e.provenance.contributor) + '</code></dd>';
        if (e.provenance.method) html += '<dt>Imaging method</dt><dd><code class="nd-copyable">' + esc(e.provenance.method) + '</code></dd>';
        if (e.provenance.dateImaged) html += '<dt>Date imaged</dt><dd><code class="nd-copyable">' + esc(e.provenance.dateImaged) + '</code></dd>';
        if (e.provenance.originalPath) html += '<dt>Source file</dt><dd><code class="nd-copyable">' + esc(e.provenance.originalPath) + '</code></dd>';
        if (e.provenance.notes) html += '<dt>Notes</dt><dd><code class="nd-copyable">' + esc(e.provenance.notes) + '</code></dd>';
        html += '</dl>';
      }

      // File location
      if (e.storage) {
        html += '<h4 style="margin-top:1rem;margin-bottom:0.5rem;color:var(--accent)">File location</h4>';
        html += '<dl class="nd-dl">';
        if (e.storage.git && e.storage.git.imagePath) html += '<dt>Local file</dt><dd><code class="nd-copyable">' + esc(e.storage.git.imagePath) + '</code></dd>';
        if (e.storageClass === 'floppy-in-git') {
          html += '<dt>Stored in</dt><dd><code class="nd-copyable">Repository (compressed)</code></dd>';
        }
        if (e.storage.internetArchive && e.storage.internetArchive.itemId) {
          html += '<dt>Internet Archive</dt><dd><a href="https://archive.org/details/' + esc(e.storage.internetArchive.itemId) + '" target="_blank" rel="noopener"><code class="nd-copyable">' + esc(e.storage.internetArchive.itemId) + '</code></a></dd>';
        }
        html += '</dl>';
      }

      // NDFS users removed -- not useful for end users
      if (false && e.ndfs && e.ndfs.users && e.ndfs.users.length > 0) {
        var userStrs = [];
        for (var u = 0; u < e.ndfs.users.length; u++) {
          userStrs.push(esc(e.ndfs.users[u].name) + ' (' + e.ndfs.users[u].pagesUsed + ' pages)');
        }
        html += userStrs.join(', ') + '</p>';
      }

      html += '</div></details>';
    }

    html += '</div>';
    return html;
  }

  // ── Gzip Decompression ──────────────────────────────────────
  function decompressGzip(compressedData) {
    var ds = new DecompressionStream('gzip');
    var writer = ds.writable.getWriter();
    writer.write(compressedData);
    writer.close();
    var reader = ds.readable.getReader();
    var chunks = [];
    return (function readChunk() {
      return reader.read().then(function(result) {
        if (result.done) {
          var total = chunks.reduce(function(s, c) { return s + c.length; }, 0);
          var out = new Uint8Array(total);
          var offset = 0;
          chunks.forEach(function(c) { out.set(c, offset); offset += c.length; });
          return out;
        }
        chunks.push(result.value);
        return readChunk();
      });
    })();
  }

  // ── NDFS Viewer ─────────────────────────────────────────────
  var ndfsViewerState = {
    entryId: null,
    fs: null,
    files: null,
    users: null,
    selectedUser: null,
    selectedFileIdx: null,
    volumeName: null
  };

  window.openNdfsViewer = function(entryId) {
    if (typeof NdfsLib === 'undefined') {
      alert('NDFS library not available');
      return;
    }

    var entry = catalogMap[entryId];
    if (!entry || !entry.storage || !entry.storage.git || !entry.storage.git.imagePath) {
      alert('No image file available for this entry');
      return;
    }

    ndfsViewerState.entryId = entryId;
    ndfsViewerState.fs = null;
    ndfsViewerState.files = null;
    ndfsViewerState.users = null;
    ndfsViewerState.selectedUser = null;
    ndfsViewerState.selectedFileIdx = null;
    ndfsViewerState.volumeName = entry.volumeName || entry.id;

    ndModal.open(
      '<div class="nd-modal-header">' +
        '<h3>NDFS Viewer</h3>' +
        '<button class="nd-modal-close" onclick="ndModal.close()">&times;</button>' +
      '</div>' +
      '<div class="ndfs-loading"><div class="ndfs-spinner"></div><div>Fetching image...</div></div>',
      { wide: true }
    );

    var imgUrl = rawUrl(entry.storage.git.imagePath);

    fetch(imgUrl)
      .then(function(r) {
        if (!r.ok) throw new Error('Failed to fetch: ' + r.status);
        document.querySelector('#nd-modal-content .ndfs-loading div:last-child').textContent = 'Decompressing...';
        return r.arrayBuffer();
      })
      .then(function(buf) {
        return decompressGzip(new Uint8Array(buf));
      })
      .then(function(rawData) {
        document.querySelector('#nd-modal-content .ndfs-loading div:last-child').textContent = 'Parsing NDFS...';
        var fs = new NdfsLib.NdfsFileSystem(rawData, true);
        ndfsViewerState.fs = fs;

        // Extract file list using getObjectEntries (same API as server)
        var users = fs.getUsers();
        ndfsViewerState.users = users.map(function(u) { return { index: u.userIndex, name: u.userName, pagesUsed: u.pagesUsed, pagesReserved: u.pagesReserved }; });
        var objects = fs.getObjectEntries();
        var allFiles = [];
        objects.forEach(function(oe) {
          if (!oe || !oe.objectName) return;
          var dateCreated = oe.dateCreated ? NdfsLib.ndTimeToDate(oe.dateCreated) : null;
          var lastDateWritten = oe.lastDateWritten ? NdfsLib.ndTimeToDate(oe.lastDateWritten) : null;

          // BPUN checksum validation
          var bpunValid = null;
          if (oe.type === 'BPUN') {
            try {
              var fileData = fs.readFile(oe.userName + '/' + oe.objectName + ':' + oe.type);
              if (fileData && fileData.length >= 10) {
                var bangOff = -1;
                for (var bi = 0; bi < fileData.length; bi++) {
                  if (fileData[bi] === 0x21 || (fileData[bi] & 0x7F) === 0x21) { bangOff = bi; break; }
                }
                var dataOff = bangOff >= 0 ? bangOff + 1 : 0;
                if (dataOff + 4 <= fileData.length) {
                  var count = (fileData[dataOff + 2] << 8) | fileData[dataOff + 3];
                  if (count > 0) {
                    var wordsStart = dataOff + 4;
                    var wordsEnd = wordsStart + count * 2;
                    if (wordsEnd + 2 <= fileData.length) {
                      var calcSum = 0;
                      for (var ci = wordsStart; ci < wordsEnd; ci += 2) {
                        calcSum = (calcSum + ((fileData[ci] << 8) | fileData[ci + 1])) & 0xFFFF;
                      }
                      var stored = (fileData[wordsEnd] << 8) | fileData[wordsEnd + 1];
                      bpunValid = (calcSum === stored);
                    }
                  }
                }
              }
            } catch(e) { /* ignore */ }
          }

          allFiles.push({
            userName: oe.userName,
            fullName: oe.objectName + ':' + (oe.type || ''),
            name: oe.objectName,
            type: oe.type || '',
            pages: oe.pagesInFile,
            bytes: oe.bytesInFile,
            dateCreated: dateCreated ? dateCreated.toISOString() : null,
            lastDateWritten: lastDateWritten ? lastDateWritten.toISOString() : null,
            bpunValid: bpunValid,
            path: oe.userName + '/' + oe.objectName + ':' + (oe.type || '')
          });
        });
        allFiles.sort(function(a, b) { return a.fullName.localeCompare(b.fullName); });
        ndfsViewerState.files = allFiles;

        ndfsRenderViewer();
      })
      .catch(function(err) {
        var loading = document.querySelector('#nd-modal-content .ndfs-loading');
        if (loading) {
          loading.innerHTML = '<div style="color:var(--warn)">Error: ' + esc(String(err.message || err)) + '</div>';
        }
      });
  };

  function ndfsRenderViewer() {
    var files = ndfsViewerState.files;
    var users = ndfsViewerState.users;
    if (!files || !users) return;

    var headerHtml =
      '<div class="nd-modal-header">' +
        '<h3>NDFS Viewer: ' + esc(ndfsViewerState.volumeName) + '</h3>' +
        '<button class="nd-modal-close" onclick="ndModal.close()">&times;</button>' +
      '</div>' +
      '<div class="ndfs-viewer-header">' +
        '<span>Volume: <strong>' + esc(ndfsViewerState.volumeName) + '</strong></span>' +
        '<span>' + files.length + ' files</span>' +
        '<span>' + users.length + ' user' + (users.length !== 1 ? 's' : '') + '</span>' +
      '</div>';

    // User panel
    var userHtml = '<div class="ndfs-user-panel"><h4>Users</h4>';
    userHtml += '<div class="ndfs-user-item' + (ndfsViewerState.selectedUser === null ? ' ndfs-user-active' : '') + '" onclick="ndfsSelectUser(null)">';
    userHtml += 'All <span class="ndfs-user-count">(' + files.length + ')</span></div>';
    users.forEach(function(u) {
      var count = 0;
      files.forEach(function(f) { if (f.userName === u.name) count++; });
      var active = ndfsViewerState.selectedUser === u.name ? ' ndfs-user-active' : '';
      userHtml += '<div class="ndfs-user-item' + active + '" onclick="ndfsSelectUser(\\'' + esc(u.name).replace(/'/g, "\\\\'") + '\\')">';
      userHtml += esc(u.name) + ' <span class="ndfs-user-count">(' + count + ')</span>';
      userHtml += '<div style="font-size:0.68rem;color:var(--text-muted)">' + u.pagesUsed + '/' + u.pagesReserved + ' pg</div>';
      userHtml += '</div>';
    });
    userHtml += '</div>';

    // File table
    var fileHtml = '<div class="ndfs-file-panel">' + ndfsRenderFileTable() + '</div>';

    // Actions
    var actionsHtml = '<div class="ndfs-file-actions">' +
      '<span class="ndfs-selected-label" id="ndfs-sel-label">Select a file</span>' +
      '<button class="nd-btn nd-btn-sm nd-badge-ok" id="ndfs-btn-extract" disabled onclick="ndfsExtractFile(false)">Extract</button>' +
      '<button class="nd-btn nd-btn-sm nd-badge-os" id="ndfs-btn-extract-strip" disabled onclick="ndfsExtractFile(true)">Extract (strip parity)</button>' +
      '<button class="nd-btn nd-btn-sm nd-badge-info" id="ndfs-btn-hex" disabled onclick="ndfsShowHex()">View as hex</button>' +
      '<button class="nd-btn nd-btn-sm nd-badge-patch" id="ndfs-btn-text" disabled onclick="ndfsShowText()">View as text</button>' +
      '</div>';

    // File content area
    var contentArea = '<div id="ndfs-file-content" style="padding:0 0.75rem 0.75rem"></div>';

    var content = headerHtml +
      '<div class="ndfs-viewer-layout">' + userHtml + fileHtml + '</div>' +
      actionsHtml + contentArea;

    document.getElementById('nd-modal-content').innerHTML = content;
  }

  function ndfsGetFilteredFiles() {
    var files = ndfsViewerState.files || [];
    if (ndfsViewerState.selectedUser) {
      return files.filter(function(f) { return f.userName === ndfsViewerState.selectedUser; });
    }
    return files;
  }

  function ndfsRenderFileTable() {
    var filtered = ndfsGetFilteredFiles();

    if (filtered.length === 0) {
      return '<div class="ndfs-loading" style="padding:2rem"><div>No files found</div></div>';
    }

    var html = '<table class="ndfs-file-table"><thead><tr>' +
      '<th>Name</th><th style="text-align:right">Pages</th>' +
      '<th style="text-align:right">Size</th><th>Created</th>' +
      '</tr></thead><tbody>';

    filtered.forEach(function(f, i) {
      var selected = ndfsViewerState.selectedFileIdx === i ? ' ndfs-file-selected' : '';
      var sizeStr = f.bytes != null ? formatBytes(f.bytes) : '-';
      var created = f.dateCreated ? String(f.dateCreated).substring(0, 10) : '-';

      var crcIcon = '';
      if (f.bpunValid === true) {
        crcIcon = ' <span title="BPUN checksum valid" style="color:var(--ok);cursor:help;padding:0 0.2rem">\\u2713</span>';
      } else if (f.bpunValid === false) {
        crcIcon = ' <span title="BPUN checksum INVALID" style="color:var(--danger);cursor:help;padding:0 0.2rem;font-weight:bold">\\u2717</span>';
      }

      var displayName = '<span style="color:var(--accent);font-weight:700">(' + esc(f.userName) + ')</span>' + esc(f.fullName);

      html += '<tr class="' + selected + '" onclick="ndfsSelectFile(' + i + ')">' +
        '<td><code style="font-size:0.78rem">' + displayName + '</code>' + crcIcon + '</td>' +
        '<td style="text-align:right">' + (f.pages || '-') + '</td>' +
        '<td style="text-align:right">' + sizeStr + '</td>' +
        '<td style="color:var(--text-muted)">' + created + '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  window.ndfsSelectUser = function(userName) {
    ndfsViewerState.selectedUser = userName;
    ndfsViewerState.selectedFileIdx = null;
    ndfsRenderViewer();
  };

  window.ndfsSelectFile = function(index) {
    ndfsViewerState.selectedFileIdx = index;
    var filtered = ndfsGetFilteredFiles();
    var file = filtered[index];
    if (!file) return;

    // Update selection highlighting
    var rows = document.querySelectorAll('.ndfs-file-table tr');
    for (var ri = 0; ri < rows.length; ri++) {
      if (ri === 0) continue;
      rows[ri].className = ri === index + 1 ? 'ndfs-file-selected' : '';
    }

    // Update label
    var label = document.getElementById('ndfs-sel-label');
    if (label) label.textContent = file.fullName + ' (' + formatBytes(file.bytes) + ')';

    // Enable buttons
    ['ndfs-btn-extract', 'ndfs-btn-extract-strip', 'ndfs-btn-hex', 'ndfs-btn-text'].forEach(function(id) {
      var btn = document.getElementById(id);
      if (btn) btn.disabled = false;
    });

    // Clear content area
    var contentEl = document.getElementById('ndfs-file-content');
    if (contentEl) contentEl.innerHTML = '';
  };

  function ndfsGetSelectedFile() {
    var filtered = ndfsGetFilteredFiles();
    if (ndfsViewerState.selectedFileIdx == null) return null;
    return filtered[ndfsViewerState.selectedFileIdx] || null;
  }

  window.ndfsExtractFile = function(stripParity) {
    var file = ndfsGetSelectedFile();
    if (!file || !ndfsViewerState.fs) return;

    try {
      var data = ndfsViewerState.fs.readFile(file.path);
      if (!data) {
        alert('Could not read file from NDFS image');
        return;
      }

      var bytes = new Uint8Array(data);
      if (stripParity) {
        var stripped = new Uint8Array(bytes.length);
        for (var i = 0; i < bytes.length; i++) {
          stripped[i] = bytes[i] & 0x7F;
        }
        bytes = stripped;
      }

      var blob = new Blob([bytes], { type: 'application/octet-stream' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = file.fullName.replace(/:/g, '.');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Extract error: ' + (err.message || err));
    }
  };

  window.ndfsShowHex = function() {
    var file = ndfsGetSelectedFile();
    if (!file || !ndfsViewerState.fs) return;

    var contentEl = document.getElementById('ndfs-file-content');
    if (!contentEl) return;

    try {
      var data = ndfsViewerState.fs.readFile(file.path);
      if (!data) {
        contentEl.innerHTML = '<div style="color:var(--warn)">Could not read file</div>';
        return;
      }

      var bytes = new Uint8Array(data);
      var maxBytes = Math.min(bytes.length, 4096);
      var lines = [];
      for (var off = 0; off < maxBytes; off += 16) {
        var hex = '';
        var ascii = '';
        for (var j = 0; j < 16; j++) {
          if (off + j < maxBytes) {
            var b = bytes[off + j];
            hex += (b < 16 ? '0' : '') + b.toString(16).toUpperCase() + ' ';
            ascii += (b >= 32 && b < 127) ? String.fromCharCode(b) : '.';
          } else {
            hex += '   ';
            ascii += ' ';
          }
        }
        var addr = off.toString(16).toUpperCase();
        while (addr.length < 6) addr = '0' + addr;
        lines.push(addr + '  ' + hex + ' ' + ascii);
      }

      var truncNote = maxBytes < bytes.length ? '<div style="color:var(--text-muted);font-size:0.78rem;margin-top:0.5rem">Showing first ' + maxBytes + ' of ' + bytes.length + ' bytes</div>' : '';

      contentEl.innerHTML =
        '<div style="margin-top:0.5rem">' +
          '<strong style="font-size:0.82rem">Hex: ' + esc(file.fullName) + ' (' + formatBytes(bytes.length) + ')</strong>' +
          '<div class="ndfs-hex-view">' + esc(lines.join('\\n')) + '</div>' +
          truncNote +
        '</div>';
    } catch (err) {
      contentEl.innerHTML = '<div style="color:var(--warn)">Hex view error: ' + esc(String(err.message || err)) + '</div>';
    }
  };

  window.ndfsShowText = function() {
    var file = ndfsGetSelectedFile();
    if (!file || !ndfsViewerState.fs) return;

    var contentEl = document.getElementById('ndfs-file-content');
    if (!contentEl) return;

    try {
      var data = ndfsViewerState.fs.readFile(file.path);
      if (!data) {
        contentEl.innerHTML = '<div style="color:var(--warn)">Could not read file</div>';
        return;
      }

      var bytes = new Uint8Array(data);
      // Strip parity for text display
      var stripped = new Uint8Array(bytes.length);
      for (var i = 0; i < bytes.length; i++) {
        stripped[i] = bytes[i] & 0x7F;
      }
      var text = new TextDecoder('ascii').decode(stripped);

      // Limit display
      var maxLen = 32768;
      var truncNote = '';
      if (text.length > maxLen) {
        text = text.substring(0, maxLen);
        truncNote = '<div style="color:var(--text-muted);font-size:0.78rem;margin-top:0.5rem">Showing first ' + maxLen + ' characters of ' + bytes.length + ' bytes</div>';
      }

      contentEl.innerHTML =
        '<div style="margin-top:0.5rem">' +
          '<strong style="font-size:0.82rem">Text: ' + esc(file.fullName) + ' (' + formatBytes(bytes.length) + ')</strong>' +
          '<div class="ndfs-text-view">' + esc(text) + '</div>' +
          truncNote +
        '</div>';
    } catch (err) {
      contentEl.innerHTML = '<div style="color:var(--warn)">Text view error: ' + esc(String(err.message || err)) + '</div>';
    }
  };

  // ── Boot ─────────────────────────────────────────────────────
  navigate();
})();`;
}

// Allow running directly: npx tsx tools/src/api/static-site-builder.ts
const isMain = process.argv[1]?.endsWith('static-site-builder.ts') || process.argv[1]?.endsWith('static-site-builder.js');
if (isMain) {
  const rootDir = process.env.ND_ROOT || join(import.meta.dirname || '.', '..', '..', '..');
  buildStaticSite(rootDir).then(() => {
    console.log('Static site generated.');
  }).catch(err => {
    console.error('Failed:', err);
    process.exit(1);
  });
}
