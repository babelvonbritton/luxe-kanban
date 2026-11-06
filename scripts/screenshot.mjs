/**
 * Ambil screenshot aplikasi untuk dokumentasi/review:
 *   node scripts/screenshot.mjs
 * Butuh: build statis di out/ (npm run build) + chromium playwright.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';

const OUT = new URL('../out', import.meta.url).pathname;
const PORT = 4319;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = join(OUT, p);
  import('node:fs').then((fs) => {
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end('nf'); return; }
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(data);
    });
  });
});

await new Promise((r) => server.listen(PORT, r));
mkdirSync('screenshots', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`http://127.0.0.1:${PORT}/`);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('.task-card');
await page.waitForTimeout(400);
await page.screenshot({ path: 'screenshots/01-board-desktop.png' });

// Modal backup selesai (4 tahap done + unduhan)
const dl = page.waitForEvent('download', { timeout: 15000 });
await page.locator('.topbar button', { hasText: 'Backup ZIP' }).click();
await page.waitForSelector('.modal');
await (await dl).cancel().catch(() => {});
await page.waitForSelector('.step.done:last-child', { timeout: 15000 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'screenshots/02-backup-steps.png' });
await page.keyboard.press('Escape');

// Mobile
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto(`http://127.0.0.1:${PORT}/`);
await mob.waitForSelector('.task-card');
await mob.waitForTimeout(300);
await mob.screenshot({ path: 'screenshots/03-board-mobile.png' });

await browser.close();
server.close();
console.log('OK → screenshots/01-board-desktop.png, 02-backup-steps.png, 03-board-mobile.png');
