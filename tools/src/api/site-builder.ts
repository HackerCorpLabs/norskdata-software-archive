/**
 * Static site generator for the Norsk Data Software Archive.
 * Reads the catalog and produces HTML files in the site/ directory.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { CatalogEntry } from '../types.js';
import { generateCatalogJson } from './catalog.js';

interface Product {
  Id: string;
  Name: string;
}

/** Build the complete static site into site/ */
export async function buildSite(rootDir: string): Promise<void> {
  const catalogPath = join(rootDir, 'catalog/floppies.json');
  const productsPath = join(rootDir, 'catalog/products.json');
  const siteDir = join(rootDir, 'site');

  console.log('Regenerating catalog from YAML...');
  await generateCatalogJson(rootDir);

  console.log('Loading catalog...');
  const entries: CatalogEntry[] = JSON.parse(await readFile(catalogPath, 'utf-8'));
  const products: Product[] = JSON.parse(await readFile(productsPath, 'utf-8'));

  const productMap = new Map<string, string>();
  for (const p of products) {
    productMap.set(p.Id, p.Name);
  }

  console.log(`Loaded ${entries.length} entries and ${products.length} products.`);

  // Create directories
  await mkdir(join(siteDir, 'products'), { recursive: true });

  // Compute statistics
  const stats = computeStats(entries, productMap);

  // Group entries by product
  const byProduct = new Map<string, CatalogEntry[]>();
  for (const entry of entries) {
    const pid = entry.productId ?? '(unmatched)';
    if (!byProduct.has(pid)) byProduct.set(pid, []);
    byProduct.get(pid)!.push(entry);
  }

  // Build search index
  const searchIndex = buildSearchIndex(entries, productMap);
  await writeFile(join(siteDir, 'search-index.json'), JSON.stringify(searchIndex), 'utf-8');
  console.log(`  search-index.json (${searchIndex.length} entries)`);

  // Build index page
  await writeFile(join(siteDir, 'index.html'), renderIndexPage(entries, stats, byProduct, productMap), 'utf-8');
  console.log('  index.html');

  // Build all.html
  await writeFile(join(siteDir, 'all.html'), renderAllPage(entries, productMap), 'utf-8');
  console.log('  all.html');

  // Build per-product pages
  let productCount = 0;
  for (const [pid, pentries] of byProduct) {
    const slug = pid === '(unmatched)' ? 'unmatched' : pid;
    const name = pid === '(unmatched)' ? 'Unmatched Images' : (productMap.get(pid) ?? pid);
    await writeFile(
      join(siteDir, 'products', `${slug}.html`),
      renderProductPage(pid, name, pentries, productMap),
      'utf-8'
    );
    productCount++;
  }
  console.log(`  products/ (${productCount} pages)`);
  console.log('Site build complete.');
}

// --- Statistics ---

interface SiteStats {
  totalImages: number;
  byType: Map<string, number>;
  byStorageClass: Map<string, number>;
  byBootFormat: Map<string, number>;
  productsWithImages: number;
  totalNdfsFiles: number;
}

function computeStats(entries: CatalogEntry[], _productMap: Map<string, string>): SiteStats {
  const byType = new Map<string, number>();
  const byStorageClass = new Map<string, number>();
  const byBootFormat = new Map<string, number>();
  const productIds = new Set<string>();
  let totalNdfsFiles = 0;

  for (const e of entries) {
    byType.set(e.type, (byType.get(e.type) ?? 0) + 1);
    const sc = e.storageClass ?? 'unknown';
    byStorageClass.set(sc, (byStorageClass.get(sc) ?? 0) + 1);
    const bf = e.bootFormat ?? 'unknown';
    byBootFormat.set(bf, (byBootFormat.get(bf) ?? 0) + 1);
    if (e.productId) productIds.add(e.productId);
    if (e.ndfs?.files) totalNdfsFiles += e.ndfs.files.length;
  }

  return {
    totalImages: entries.length,
    byType,
    byStorageClass,
    byBootFormat,
    productsWithImages: productIds.size,
    totalNdfsFiles,
  };
}

// --- Search Index ---

interface SearchEntry {
  i: string;       // id
  v: string | null; // volumeName
  p: string | null; // productId
  n: string | null; // product name
  ver: string | null;
  bf: string | null; // bootFormat
  t: string[] | null; // tags
  f: string[];     // first few NDFS file names
}

function buildSearchIndex(entries: CatalogEntry[], productMap: Map<string, string>): SearchEntry[] {
  return entries.map(e => ({
    i: e.id,
    v: e.volumeName,
    p: e.productId,
    n: e.productId ? (productMap.get(e.productId) ?? null) : null,
    ver: e.version,
    bf: e.bootFormat,
    t: e.tags,
    f: e.ndfs?.files?.slice(0, 5).map(f => f.name) ?? [],
  }));
}

// --- CSS ---

function getCSS(): string {
  return `
:root {
  --bg: #ffffff;
  --bg-alt: #f8f9fa;
  --fg: #1a1a2e;
  --fg-muted: #555;
  --border: #dee2e6;
  --blue-fill: #E3F2FD;
  --blue-stroke: #0D47A1;
  --teal-fill: #E0F7FA;
  --teal-stroke: #00838F;
  --green-fill: #E8F5E9;
  --green-stroke: #2E7D32;
  --purple-fill: #F3E5F5;
  --purple-stroke: #7B1FA2;
  --orange-fill: #FFF3E0;
  --orange-stroke: #E65100;
  --link: #0D47A1;
  --link-hover: #1565C0;
  --card-shadow: 0 1px 3px rgba(0,0,0,0.12);
}

[data-theme="dark"] {
  --bg: #1a1a2e;
  --bg-alt: #16213e;
  --fg: #e0e0e0;
  --fg-muted: #aaa;
  --border: #333;
  --blue-fill: #0D47A1;
  --blue-stroke: #90CAF9;
  --teal-fill: #004D40;
  --teal-stroke: #80CBC4;
  --green-fill: #1B5E20;
  --green-stroke: #A5D6A7;
  --purple-fill: #4A148C;
  --purple-stroke: #CE93D8;
  --orange-fill: #BF360C;
  --orange-stroke: #FFCC80;
  --link: #90CAF9;
  --link-hover: #BBDEFB;
  --card-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.6;
}

.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }

header {
  background: var(--blue-fill);
  border-bottom: 3px solid var(--blue-stroke);
  padding: 1rem 0;
}

header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--blue-stroke);
}

header nav { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
header nav a { color: var(--link); text-decoration: none; font-weight: 500; }
header nav a:hover { text-decoration: underline; color: var(--link-hover); }

.theme-toggle {
  background: none;
  border: 1px solid var(--border);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  color: var(--fg);
  font-size: 0.85rem;
  margin-left: auto;
}

main { padding: 2rem 0; }

h2 { color: var(--teal-stroke); border-bottom: 2px solid var(--teal-fill); padding-bottom: 0.3rem; }
h3 { color: var(--purple-stroke); }

a { color: var(--link); }
a:hover { color: var(--link-hover); }

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}
.stat-card {
  background: var(--bg-alt);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  box-shadow: var(--card-shadow);
}
.stat-card .stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--green-stroke);
}
.stat-card .stat-label {
  font-size: 0.85rem;
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Search */
.search-box {
  margin: 1.5rem 0;
  position: relative;
}
.search-box input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--blue-stroke);
  border-radius: 8px;
  background: var(--bg);
  color: var(--fg);
  outline: none;
}
.search-box input:focus {
  border-color: var(--teal-stroke);
  box-shadow: 0 0 0 3px var(--teal-fill);
}
#search-results {
  margin-top: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
  display: none;
  background: var(--bg);
}
#search-results.active { display: block; }
.search-result-item {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}
.search-result-item:hover { background: var(--blue-fill); }
.search-result-item:last-child { border-bottom: none; }
.sr-id { font-weight: 600; color: var(--blue-stroke); }
.sr-product { color: var(--fg-muted); font-size: 0.85rem; }

/* Product list */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 0.75rem;
  margin: 1rem 0;
}
.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--bg-alt);
  border: 1px solid var(--border);
  border-radius: 6px;
}
.product-item a { text-decoration: none; font-weight: 500; }
.product-count {
  background: var(--green-fill);
  color: var(--green-stroke);
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid var(--green-stroke);
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.9rem;
}
th {
  background: var(--teal-fill);
  color: var(--teal-stroke);
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 2px solid var(--teal-stroke);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
th:hover { background: var(--blue-fill); }
th .sort-arrow { font-size: 0.7rem; margin-left: 0.3rem; }
td {
  padding: 0.4rem 0.75rem;
  border-bottom: 1px solid var(--border);
  word-break: break-word;
}
tr:hover { background: var(--bg-alt); }

/* Badge */
.badge {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-blue { background: var(--blue-fill); color: var(--blue-stroke); border: 1px solid var(--blue-stroke); }
.badge-teal { background: var(--teal-fill); color: var(--teal-stroke); border: 1px solid var(--teal-stroke); }
.badge-green { background: var(--green-fill); color: var(--green-stroke); border: 1px solid var(--green-stroke); }
.badge-purple { background: var(--purple-fill); color: var(--purple-stroke); border: 1px solid var(--purple-stroke); }
.badge-orange { background: var(--orange-fill); color: var(--orange-stroke); border: 1px solid var(--orange-stroke); }

/* NDFS file list */
.ndfs-files {
  background: var(--bg-alt);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem;
  margin: 0.5rem 0;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.8rem;
  max-height: 300px;
  overflow-y: auto;
}
.ndfs-files table { margin: 0; font-size: 0.8rem; }
.ndfs-files th { background: var(--purple-fill); color: var(--purple-stroke); border-bottom: 1px solid var(--purple-stroke); padding: 0.25rem 0.5rem; cursor: default; }
.ndfs-files td { padding: 0.2rem 0.5rem; }

/* Version group */
.version-group {
  margin: 1rem 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.version-header {
  background: var(--teal-fill);
  color: var(--teal-stroke);
  padding: 0.5rem 1rem;
  font-weight: 600;
  border-bottom: 1px solid var(--teal-stroke);
}
.version-body { padding: 0.75rem 1rem; }

.image-card {
  background: var(--bg-alt);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.75rem;
  margin: 0.5rem 0;
}
.image-card h4 { margin: 0 0 0.5rem 0; color: var(--blue-stroke); }

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.25rem 1rem;
  font-size: 0.85rem;
}
.meta-grid dt { color: var(--fg-muted); font-weight: 600; }
.meta-grid dd { margin: 0 0 0.25rem 0; }

/* Provenance */
.provenance {
  background: var(--orange-fill);
  border: 1px solid var(--orange-stroke);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--orange-stroke);
}

/* Letter heading */
.letter-heading {
  color: var(--purple-stroke);
  border-bottom: 2px solid var(--purple-fill);
  margin-top: 2rem;
  padding-bottom: 0.25rem;
}

footer {
  border-top: 2px solid var(--border);
  padding: 1rem 0;
  margin-top: 3rem;
  text-align: center;
  font-size: 0.85rem;
  color: var(--fg-muted);
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .product-grid { grid-template-columns: 1fr; }
  table { font-size: 0.8rem; }
  th, td { padding: 0.3rem 0.4rem; }
}

/* Skip link for accessibility */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--blue-stroke);
  color: #fff;
  padding: 8px;
  z-index: 100;
  transition: top 0.2s;
}
.skip-link:focus { top: 0; }
`;
}

// --- JS ---

function getSearchJS(): string {
  return `
(function() {
  let index = null;

  // Theme
  const themeBtn = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('nd-theme');
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next === 'dark' ? 'dark' : '');
      if (next === 'light') document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('nd-theme', next);
    });
  }

  // Search
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  if (!searchInput || !searchResults) return;

  async function loadIndex() {
    if (index) return;
    const base = document.querySelector('meta[name="base-url"]');
    const baseUrl = base ? base.getAttribute('content') : '.';
    const resp = await fetch(baseUrl + '/search-index.json');
    index = await resp.json();
  }

  function doSearch(query) {
    if (!index || !query || query.length < 2) {
      searchResults.classList.remove('active');
      return;
    }
    const q = query.toLowerCase();
    const results = [];
    for (const item of index) {
      let score = 0;
      if (item.i && item.i.toLowerCase().includes(q)) score += 3;
      if (item.v && item.v.toLowerCase().includes(q)) score += 3;
      if (item.p && item.p.toLowerCase().includes(q)) score += 2;
      if (item.n && item.n.toLowerCase().includes(q)) score += 2;
      if (item.ver && item.ver.toLowerCase().includes(q)) score += 1;
      if (item.bf && item.bf.toLowerCase().includes(q)) score += 1;
      if (item.t) for (const t of item.t) { if (t.toLowerCase().includes(q)) score += 1; }
      if (item.f) for (const f of item.f) { if (f.toLowerCase().includes(q)) score += 1; }
      if (score > 0) results.push({ item, score });
    }
    results.sort((a, b) => b.score - a.score);
    const top = results.slice(0, 30);

    if (top.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
      searchResults.classList.add('active');
      return;
    }

    const base = document.querySelector('meta[name="base-url"]');
    const baseUrl = base ? base.getAttribute('content') : '.';

    searchResults.innerHTML = top.map(function(r) {
      const pid = r.item.p || 'unmatched';
      const name = r.item.n || r.item.p || 'Unknown';
      return '<a class="search-result-item" href="' + baseUrl + '/products/' + escHtml(pid) + '.html#' + escHtml(r.item.i) + '">' +
        '<div class="sr-id">' + escHtml(r.item.v || r.item.i) + '</div>' +
        '<div class="sr-product">' + escHtml(name) + (r.item.ver ? ' v' + escHtml(r.item.ver) : '') + '</div>' +
        '</a>';
    }).join('');
    searchResults.classList.add('active');
  }

  function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  searchInput.addEventListener('focus', loadIndex);
  let debounce;
  searchInput.addEventListener('input', function() {
    clearTimeout(debounce);
    debounce = setTimeout(function() { doSearch(searchInput.value); }, 150);
  });

  document.addEventListener('click', function(e) {
    if (!searchResults.contains(e.target) && e.target !== searchInput) {
      searchResults.classList.remove('active');
    }
  });
})();
`;
}

function getSortJS(): string {
  return `
(function() {
  document.querySelectorAll('table.sortable').forEach(function(table) {
    const headers = table.querySelectorAll('th[data-sort]');
    headers.forEach(function(th, colIndex) {
      th.addEventListener('click', function() {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const sortKey = th.getAttribute('data-sort');
        const isNum = sortKey === 'num';
        const currentDir = th.getAttribute('data-dir') || 'asc';
        const newDir = currentDir === 'asc' ? 'desc' : 'asc';

        // Reset all headers
        headers.forEach(function(h) {
          h.setAttribute('data-dir', '');
          const arrow = h.querySelector('.sort-arrow');
          if (arrow) arrow.textContent = '';
        });
        th.setAttribute('data-dir', newDir);
        const arrow = th.querySelector('.sort-arrow');
        if (arrow) arrow.textContent = newDir === 'asc' ? ' \\u25B2' : ' \\u25BC';

        const idx = Array.from(th.parentElement.children).indexOf(th);
        rows.sort(function(a, b) {
          const aVal = a.children[idx] ? a.children[idx].textContent.trim() : '';
          const bVal = b.children[idx] ? b.children[idx].textContent.trim() : '';
          if (isNum) {
            const aNum = parseInt(aVal, 10) || 0;
            const bNum = parseInt(bVal, 10) || 0;
            return newDir === 'asc' ? aNum - bNum : bNum - aNum;
          }
          return newDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
        rows.forEach(function(r) { tbody.appendChild(r); });
      });
    });
  });
})();
`;
}

// --- HTML Helpers ---

function esc(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function pageLayout(title: string, content: string, baseUrl: string = '.'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="base-url" content="${esc(baseUrl)}">
<title>${esc(title)} - Norsk Data Software Archive</title>
<style>${getCSS()}</style>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to main content</a>
<header>
<div class="container">
<nav>
<h1><a href="${baseUrl}/index.html" style="color:inherit;text-decoration:none">Norsk Data Software Archive</a></h1>
<a href="${baseUrl}/index.html">Home</a>
<a href="${baseUrl}/all.html">Full Catalog</a>
<button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">Dark / Light</button>
</nav>
</div>
</header>
<main id="main-content">
<div class="container">
${content}
</div>
</main>
<footer>
<div class="container">
<p>Norsk Data Software Archive &mdash;
<a href="https://github.com/HackerCorpLabs/norskdata-software-archive">GitHub Repository</a></p>
</div>
</footer>
<script>${getSearchJS()}</script>
<script>${getSortJS()}</script>
</body>
</html>`;
}

// --- Index Page ---

function renderIndexPage(
  entries: CatalogEntry[],
  stats: SiteStats,
  byProduct: Map<string, CatalogEntry[]>,
  productMap: Map<string, string>,
): string {
  // Stats cards
  const statsHtml = `
<div class="stats-grid">
  <div class="stat-card"><div class="stat-value">${stats.totalImages}</div><div class="stat-label">Floppy Images</div></div>
  <div class="stat-card"><div class="stat-value">${stats.productsWithImages}</div><div class="stat-label">Products</div></div>
  <div class="stat-card"><div class="stat-value">${stats.totalNdfsFiles}</div><div class="stat-label">NDFS Files Cataloged</div></div>
  <div class="stat-card"><div class="stat-value">${stats.byStorageClass.get('floppy-in-git') ?? 0}</div><div class="stat-label">In Git</div></div>
  <div class="stat-card"><div class="stat-value">${stats.byStorageClass.get('ia-only') ?? 0}</div><div class="stat-label">IA Only</div></div>
  <div class="stat-card"><div class="stat-value">${stats.byStorageClass.get('both') ?? 0}</div><div class="stat-label">Git + IA</div></div>
</div>`;

  // Boot format breakdown
  const bootFormats = Array.from(stats.byBootFormat.entries()).sort((a, b) => b[1] - a[1]);
  const bootHtml = `<h3>Boot Formats</h3>
<div class="stats-grid">
${bootFormats.map(([bf, count]) =>
    `<div class="stat-card"><div class="stat-value">${count}</div><div class="stat-label">${esc(bf)}</div></div>`
  ).join('\n')}
</div>`;

  // Search
  const searchHtml = `
<div class="search-box">
  <label for="search-input" class="sr-only" style="position:absolute;left:-9999px">Search the archive</label>
  <input type="text" id="search-input" placeholder="Search by volume name, product ID, file name..." aria-label="Search the archive">
  <div id="search-results" role="listbox" aria-label="Search results"></div>
</div>`;

  // Products grouped alphabetically
  const sortedProducts = Array.from(byProduct.entries())
    .filter(([pid]) => pid !== '(unmatched)')
    .sort((a, b) => a[0].localeCompare(b[0]));

  // Group by first letter
  const letterGroups = new Map<string, Array<[string, CatalogEntry[]]>>();
  for (const [pid, pentries] of sortedProducts) {
    const letter = pid.charAt(0).toUpperCase();
    if (!letterGroups.has(letter)) letterGroups.set(letter, []);
    letterGroups.get(letter)!.push([pid, pentries]);
  }

  let productsHtml = '<h2>Products</h2>';

  // Letter nav
  const letters = Array.from(letterGroups.keys()).sort();
  productsHtml += `<div style="margin-bottom:1rem">${letters.map(l =>
    `<a href="#letter-${l}" style="margin-right:0.5rem;font-weight:600">${l}</a>`
  ).join('')}</div>`;

  for (const letter of letters) {
    const items = letterGroups.get(letter)!;
    productsHtml += `<h3 id="letter-${letter}" class="letter-heading">${letter}</h3>`;
    productsHtml += '<div class="product-grid">';
    for (const [pid, pentries] of items) {
      const name = productMap.get(pid) ?? pid;
      productsHtml += `<div class="product-item">
<a href="products/${esc(pid)}.html">${esc(pid)} - ${esc(name)}</a>
<span class="product-count">${pentries.length}</span>
</div>`;
    }
    productsHtml += '</div>';
  }

  // Unmatched
  const unmatched = byProduct.get('(unmatched)');
  if (unmatched) {
    productsHtml += `<h3 class="letter-heading">Unmatched</h3>
<div class="product-grid">
<div class="product-item">
<a href="products/unmatched.html">Unmatched Images</a>
<span class="product-count">${unmatched.length}</span>
</div>
</div>`;
  }

  const content = `<h2>Archive Overview</h2>
${statsHtml}
${bootHtml}
${searchHtml}
${productsHtml}`;

  return pageLayout('Home', content, '.');
}

// --- All Page ---

function renderAllPage(entries: CatalogEntry[], productMap: Map<string, string>): string {
  let rows = '';
  for (const e of entries) {
    const productName = e.productId ? (productMap.get(e.productId) ?? e.productId) : '';
    const productLink = e.productId
      ? `<a href="products/${esc(e.productId)}.html">${esc(productName)}</a>`
      : '<em>unmatched</em>';
    rows += `<tr>
<td><a href="products/${esc(e.productId ?? 'unmatched')}.html#${esc(e.id)}">${esc(e.id)}</a></td>
<td>${esc(e.volumeName)}</td>
<td>${productLink}</td>
<td>${esc(e.version)}</td>
<td>${e.imageSizeBytes != null ? formatBytes(e.imageSizeBytes) : '-'}</td>
<td><span class="badge badge-teal">${esc(e.bootFormat ?? '-')}</span></td>
<td>${e.ndfs?.files?.length ?? '-'}</td>
</tr>`;
  }

  const content = `<h2>Full Catalog (${entries.length} images)</h2>
<table class="sortable">
<thead>
<tr>
<th data-sort="text">ID <span class="sort-arrow"></span></th>
<th data-sort="text">Volume Name <span class="sort-arrow"></span></th>
<th data-sort="text">Product <span class="sort-arrow"></span></th>
<th data-sort="text">Version <span class="sort-arrow"></span></th>
<th data-sort="num">Size <span class="sort-arrow"></span></th>
<th data-sort="text">Boot Format <span class="sort-arrow"></span></th>
<th data-sort="num">Files <span class="sort-arrow"></span></th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>`;

  return pageLayout('Full Catalog', content, '.');
}

// --- Product Page ---

function renderProductPage(
  productId: string,
  productName: string,
  entries: CatalogEntry[],
  _productMap: Map<string, string>,
): string {
  // Group by version
  const byVersion = new Map<string, CatalogEntry[]>();
  for (const e of entries) {
    const ver = e.version ?? '(unknown)';
    if (!byVersion.has(ver)) byVersion.set(ver, []);
    byVersion.get(ver)!.push(e);
  }

  const versions = Array.from(byVersion.keys()).sort();

  let versionsHtml = '';
  for (const ver of versions) {
    const ventries = byVersion.get(ver)!;
    versionsHtml += `<div class="version-group">
<div class="version-header">Version ${esc(ver)} (${ventries.length} image${ventries.length > 1 ? 's' : ''})</div>
<div class="version-body">`;

    for (const e of ventries) {
      versionsHtml += renderImageCard(e);
    }

    versionsHtml += '</div></div>';
  }

  const content = `
<h2>${esc(productId)} - ${esc(productName)}</h2>
<p><span class="badge badge-blue">${entries.length} image${entries.length > 1 ? 's' : ''}</span>
<span class="badge badge-teal">${versions.length} version${versions.length > 1 ? 's' : ''}</span></p>
${versionsHtml}`;

  return pageLayout(productName, content, '..');
}

function renderImageCard(e: CatalogEntry): string {
  let card = `<div class="image-card" id="${esc(e.id)}">
<h4>${esc(e.volumeName ?? e.id)}</h4>
<dl class="meta-grid">
<dt>ID</dt><dd>${esc(e.id)}</dd>
<dt>MD5</dt><dd><code>${esc(e.md5)}</code></dd>`;

  if (e.bootFormat) card += `<dt>Boot Format</dt><dd><span class="badge badge-teal">${esc(e.bootFormat)}</span></dd>`;
  if (e.totalPages != null) card += `<dt>Total Pages</dt><dd>${e.totalPages}</dd>`;
  if (e.imageSizeBytes != null) card += `<dt>Size</dt><dd>${formatBytes(e.imageSizeBytes)}</dd>`;
  if (e.storageClass) card += `<dt>Storage</dt><dd><span class="badge badge-green">${esc(e.storageClass)}</span></dd>`;
  if (e.diskNumber != null) card += `<dt>Disk #</dt><dd>${e.diskNumber}${e.diskTotal ? ' of ' + e.diskTotal : ''}</dd>`;
  if (e.controller) card += `<dt>Controller</dt><dd>${esc(e.controller)}</dd>`;

  card += '</dl>';

  // Storage info
  if (e.storage) {
    if (e.storage.git?.imagePath) {
      card += `<p style="font-size:0.85rem"><strong>Git:</strong> <code>${esc(e.storage.git.imagePath)}</code></p>`;
    }
    if (e.storage.internetArchive?.itemId) {
      card += `<p style="font-size:0.85rem"><strong>Internet Archive:</strong>
<a href="https://archive.org/details/${esc(e.storage.internetArchive.itemId)}" target="_blank" rel="noopener">${esc(e.storage.internetArchive.itemId)}</a></p>`;
    }
  }

  // NDFS files
  if (e.ndfs?.files && e.ndfs.files.length > 0) {
    card += `<details>
<summary style="cursor:pointer;font-weight:600;color:var(--purple-stroke)">NDFS Files (${e.ndfs.files.length})</summary>
<div class="ndfs-files">
<table>
<thead><tr><th>Name</th><th>Type</th><th>Pages</th><th>Size</th></tr></thead>
<tbody>`;
    for (const f of e.ndfs.files) {
      card += `<tr><td>${esc(f.name)}</td><td>${esc(f.type)}</td><td>${f.pages}</td><td>${formatBytes(f.bytes ?? null)}</td></tr>`;
    }
    card += '</tbody></table></div></details>';
  }

  // NDFS users
  if (e.ndfs?.users && e.ndfs.users.length > 0) {
    card += `<p style="font-size:0.85rem"><strong>Users:</strong> ${e.ndfs.users.map(u => `${esc(u.name)} (${u.pagesUsed} pages)`).join(', ')}</p>`;
  }

  // Provenance
  if (e.provenance) {
    let prov = '';
    if (e.provenance.contributor && e.provenance.contributor !== 'unknown') {
      prov += `<strong>Contributor:</strong> ${esc(e.provenance.contributor)}`;
    }
    if (e.provenance.originalPath) {
      if (prov) prov += ' | ';
      prov += `<strong>Original:</strong> <code>${esc(e.provenance.originalPath)}</code>`;
    }
    if (prov) {
      card += `<div class="provenance">${prov}</div>`;
    }
  }

  card += '</div>';
  return card;
}

// --- Exports ---
export { renderIndexPage, renderAllPage, renderProductPage, buildSearchIndex };
