/**
 * Puppeteer validation for Catalog, Product detail, and Floppy detail screens.
 * Starts the server, runs checks, then exits.
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const PORT = 3377;
const BASE = `http://localhost:${PORT}`;
let server;
let browser;
let passed = 0;
let failed = 0;

function check(name, ok, detail) {
  if (ok) {
    console.log(`  PASS: ${name}`);
    passed++;
  } else {
    console.log(`  FAIL: ${name} -- ${detail || ''}`);
    failed++;
  }
}

async function waitForServer(url, maxWait = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('Server did not start within ' + maxWait + 'ms');
}

async function run() {
  // Start server
  console.log('Starting server on port ' + PORT + '...');
  server = spawn('node', ['dist/server.js'], {
    cwd: '/home/ronny/repos/norskdata-software-archive/tools',
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', d => {});
  server.stderr.on('data', d => {});

  await waitForServer(BASE + '/api/stats');
  console.log('Server is up.\n');

  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(10000);

  // ---- Test 1: Catalog screen ----
  console.log('Test 1: Catalog screen');
  await page.goto(BASE + '#/catalog', { waitUntil: 'networkidle0' });
  await page.waitForSelector('#cat-search', { timeout: 5000 });

  const searchBox = await page.$('#cat-search');
  check('Search box exists', !!searchBox);

  const tableRows = await page.$$('.nd-table tbody tr');
  check('Table has rows', tableRows.length > 0, 'rows=' + tableRows.length);

  const pagerEl = await page.$('#cat-pager');
  check('Pagination exists', !!pagerEl);

  const totalText = await page.$eval('#cat-total', el => el.textContent);
  check('Total count shown', totalText.includes('floppies'), totalText);

  // ---- Test 2: Catalog search ----
  console.log('\nTest 2: Catalog search');
  await page.goto(BASE + '#/catalog?q=NOTIS', { waitUntil: 'networkidle0' });
  // Wait for results to load
  await new Promise(r => setTimeout(r, 1000));
  const searchVal = await page.$eval('#cat-search', el => el.value);
  check('Search input has value NOTIS', searchVal === 'NOTIS', 'val=' + searchVal);

  const filteredRows = await page.$$('.nd-table tbody tr');
  check('Filtered results exist', filteredRows.length > 0, 'rows=' + filteredRows.length);

  // Check that at least one row mentions 10079 (NOTIS-WP product)
  const pageText = await page.$eval('#cat-results', el => el.textContent);
  check('Results contain NOTIS-related content', pageText.includes('10079'), 'text includes 10079');

  // ---- Test 3: Product detail ----
  console.log('\nTest 3: Product detail for ND-10079');
  await page.goto(BASE + '#/products/ND-10079', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const headerText = await page.evaluate(() => document.querySelector('.nd-product-header')?.textContent || '');
  check('Product header shows ND-10079', headerText.includes('ND-10079'), headerText.substring(0, 80));
  check('Product header shows name', headerText.includes('NOTIS-WP') || headerText.includes('images'), headerText.substring(0, 80));

  const versionSections = await page.$$('.nd-version-section');
  check('Version sections exist', versionSections.length > 0, 'sections=' + versionSections.length);

  const diskCards = await page.$$('.nd-disk-card');
  check('Disk cards exist', diskCards.length > 0, 'cards=' + diskCards.length);

  // ---- Test 4: Floppy detail ----
  console.log('\nTest 4: Floppy detail for nd-10079-m07-d1-62caae43');
  await page.goto(BASE + '#/disks/nd-10079-m07-d1-62caae43', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const floppyHeader = await page.evaluate(() => {
    const h = document.querySelector('.nd-floppy-header h2');
    return h ? h.textContent : '';
  });
  check('Volume name shown', floppyHeader.includes('10079M07'), 'header=' + floppyHeader);

  const ndfsRows = await page.$$('.nd-ndfs-table tbody tr');
  check('NDFS file table has rows', ndfsRows.length >= 5, 'rows=' + ndfsRows.length);

  // Check dates are present
  const tableText = await page.evaluate(() => {
    const t = document.querySelector('.nd-ndfs-table');
    return t ? t.textContent : '';
  });
  check('File table has date content', tableText.includes('1984') || tableText.includes('198'), 'has dates');

  // Check badges
  const badges = await page.$$('.nd-floppy-badges .nd-badge');
  check('Parsed badges shown', badges.length >= 2, 'badges=' + badges.length);

  // Check label photo section exists (this disk has a photo in its version set)
  // The specific disk may or may not have a photo, so just check details section
  const detailsToggle = await page.$('.nd-details-toggle');
  check('Details toggle exists', !!detailsToggle);

  // ---- Test 5: Navigation from floppy to product ----
  console.log('\nTest 5: Navigation');
  const productLink = await page.$('.nd-floppy-nav a[href*="products/ND-10079"]');
  check('Product link exists on floppy page', !!productLink);

  if (productLink) {
    await productLink.click();
    await new Promise(r => setTimeout(r, 1500));
    const newUrl = page.url();
    check('Navigated to product page', newUrl.includes('products/ND-10079'), 'url=' + newUrl);
  }

  // Summary
  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} checks`);
  console.log('========================================\n');
}

async function cleanup() {
  if (browser) await browser.close().catch(() => {});
  if (server) server.kill('SIGTERM');
}

run()
  .then(() => {
    cleanup();
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('Test runner error:', err);
    cleanup();
    process.exit(1);
  });
