/**
 * Local server for the generated static site.
 *
 * `site/` holds only the generated HTML; the disk images and photos live in the
 * repository at `images/` and `collections/`. The published GitHub Pages site
 * fetches those from raw.githubusercontent.com, which is no use when serving
 * the site locally - the viewers get a 404 and cannot read a single image. So
 * this server serves `site/` and additionally maps `/images/` and
 * `/collections/` onto the repository folders.
 *
 * Node only, no dependencies. Root is derived from this file's own location.
 */

import { createServer } from 'http';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const siteRoot = join(repoRoot, 'site');
const port = Number(process.env.PORT || process.argv[2] || 8000);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.gz': 'application/gzip',
  '.txt': 'text/plain; charset=utf-8', '.yaml': 'text/yaml; charset=utf-8',
};

/** Where a request path is served from: site/ normally, the repo for archive data. */
function resolve(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const rel = clean.replace(/^\/+/, '');
  if (rel.startsWith('images/') || rel.startsWith('collections/')) return join(repoRoot, rel);
  return join(siteRoot, rel || 'index.html');
}

createServer(async (req, res) => {
  const url = req.url || '/';

  // A page loaded at a /docs/... address resolves the app's relative links
  // against that folder, so docs/X.html becomes /docs/docs/X.html. Rather than
  // fail, collapse the repetition and send the browser to the real page.
  if (/\/docs\/(docs\/)+/.test(url)) {
    res.writeHead(302, { Location: url.replace(/\/docs\/(docs\/)+/, '/docs/') });
    res.end();
    return;
  }

  let file = resolve(url);
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, 'index.html');
  } catch {
    // A document asked for without its extension - /docs/ND-10007-A2-EN - is a
    // real page, and falling straight back to the app rendered the dashboard
    // instead, which looks exactly like the link being broken.
    let served = false;
    if (!/\.[a-z0-9]+$/i.test(file)) {
      try { await stat(file + '.html'); file += '.html'; served = true; } catch { /* not a page */ }
    }
    // Anything else falls back to the single-page app, which routes on the hash -
    // except under /docs/. The app's own links are relative (docs/X.html), so
    // rendering it at a /docs/... URL turns every one of them into
    // /docs/docs/X.html. A document that is not there is a 404, not the app.
    if (!served) {
      if (/^\/docs\//.test(url)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('No such document. Documents live at /docs/<id>.html');
        return;
      }
      file = join(siteRoot, 'index.html');
    }
  }
  try {
    const s = await stat(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': s.size,
      'Cache-Control': 'no-cache',
    });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  }
}).listen(port, () => {
  console.log(`Static site on http://localhost:${port}  (site/ + images/ + collections/ from the repo)`);
});
