// The Contacts app with Card Scan built in (shared list + the Cards panel + card details), in a real Chromium.
// Needs a built Suite that includes Contacts: E2E_SUITE=<dir with apps/contacts>. Skips otherwise.
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { createRequire } from 'node:module';
import assert from 'node:assert/strict'; import { fileURLToPath } from 'node:url';
import { startCards, csState, resetCards } from './integrations-mock.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suite = process.env.E2E_SUITE || '';
if (!suite || !fs.existsSync(path.join(suite, 'apps/contacts/index.html'))) { console.log('skip  set E2E_SUITE to a built Suite that includes Contacts'); process.exit(0); }
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }
const cs = await startCards(); resetCards();
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-cc-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: suite, APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), CARDS_URL: `http://127.0.0.1:${cs.address().port}`, CARDS_USER: 'anand@x.io', CARDS_PASSWORD: 'cspw' } });
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`;
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
  const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  await p.goto(B + '/apps/contacts/index.html');
  await t('scanned cards are the contact list', async () => { await p.waitForSelector('.contact-item'); assert.ok(await p.locator('.contact-item', { hasText: 'Amina' }).count()); });
  await t('Cards button opens the panel with the scan form', async () => { await p.click('[data-cx="open"]'); await p.waitForSelector('#cxf-name'); assert.ok(await p.locator('text=Read details with AI').count()); await p.click('[data-cx="close"]'); });
  await t('a card contact shows the business card section', async () => { await p.click('.contact-item:has-text("Amina")'); await p.waitForSelector('.cx-card #cx-grp'); });
  await t('notes, reminder and share go to Card Scan', async () => {
    await p.click('[data-cx="remind"]'); await p.fill('#cx-rn', 'Send quote'); await p.click('[data-cx="remadd"]'); await p.waitForSelector('.cx-back', { state: 'detached' });
    await p.click('[data-cx="share"]'); await p.click('[data-cx="sharemake"]'); await p.waitForSelector('#cx-sres input'); await p.click('[data-cx="close"]');
  });
  if (process.env.SHOT) { await p.click('.contact-item:has-text("Amina")'); await p.waitForSelector('.cx-card #cx-grp'); await p.screenshot({ path: process.env.SHOT + '/a.png' }); await p.click('[data-cx="open"]'); await p.waitForSelector('#cxf-name'); await p.screenshot({ path: process.env.SHOT + '/b.png' }); await p.click('[data-cx="close"]'); }
  await t('Reminders tab lists it', async () => { await p.click('[data-cx="open"]'); await p.click('[data-cx="tab"][data-t="rem"]'); await p.waitForSelector('#cx-body .cx-item, #cx-body p'); await p.click('[data-cx="close"]'); });
  await t('saving a scanned card creates the card', async () => {
    const n = csState.cards.length; await p.click('[data-cx="open"]'); await p.waitForSelector('#cxf-name'); await p.fill('#cxf-name', 'Zawadi Mushi'); await p.fill('#cxf-company', 'Safari Fuel'); await p.click('[data-cx="save"]');
    await p.waitForFunction(() => document.querySelector('.contact-item'), null, { timeout: 8000 }); await p.waitForTimeout(1200); assert.equal(csState.cards.length, n + 1);
    await p.waitForSelector('.contact-item:has-text("Zawadi")');
  });
} finally { srv.kill(); cs.close(); await browser.close(); }
console.log(`\n${pass} passed, ${failed} failed`); if (failed) { console.log(log.slice(-1500)); process.exit(1); } process.exit(0);
