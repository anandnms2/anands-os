// Drive UI (Google-Drive-style file manager) against an in-memory WebDAV server and a real Chromium. Needs Playwright.
// E2E_SUITE=<built suite dir> is optional; SHOTS=<dir> saves screenshots.
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { start, tree } from './dav-mock.mjs';
import { PNG } from './png.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null;
for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }
const SHOTS = process.env.SHOTS || '';
const day = (n) => Date.UTC(2026, 9, 14, 10) - n * 864e5;
const F = (p, size, m, data) => tree.set(p, { data: data || Buffer.alloc(size, 65), m: day(m) });
const D = (p, m) => tree.set(p, { dir: true, m: day(m) });
['/Work', '/Photos', '/Invoices', '/Projects', '/Music', '/Work/Fleet', '/Projects/OS'].forEach((p, i) => D(p, i + 1));
F('/Notes.md', 0, 0, Buffer.from('# Notes\nHello from Drive')); F('/Fleet KPIs.csv', 0, 2, Buffer.from('truck,tat\nT412,4.2\n'));
F('/Q3 Budget.xlsx', 48211, 3); F('/Proposal.docx', 126400, 5); F('/Pitch deck.pptx', 3400100, 7); F('/Handbook.pdf', 892000, 9); F('/Site map.pdf', 210000, 11);
F('/Photos/Safari 1.png', 0, 4, PNG); F('/Photos/Safari 2.png', 0, 4, PNG); F('/Photos/Sunset.png', 0, 6, PNG); F('/Archive 2025.zip', 18200400, 40);
F('/Work/report.txt', 0, 1, Buffer.from('report')); F('/Work/budget.csv', 0, 1, Buffer.from('a,b\n1,2')); F('/Music/track.mp3', 4200000, 20); F('/Intro.mp4', 24600000, 15); F('/config.json', 0, 30, Buffer.from('{"a":1}'));
F('/Invoices/INV-001.pdf', 90000, 12); F('/Projects/OS/readme.md', 0, 2, Buffer.from('# OS'));

const dav = await start();
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-dr-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: process.env.E2E_SUITE || path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), DAV_URL: `http://127.0.0.1:${dav.address().port}/dav`, DAV_USER: 'anand@example.com', DAV_PASSWORD: 'dav-secret' } });
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`;
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (f, ms = 5000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (f()) return true; } catch {} await sleep(100); } return false; };
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const errs = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 }, colorScheme: 'dark', acceptDownloads: true });
  await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
  const p = await ctx.newPage(); p.setDefaultTimeout(5000); p.on('pageerror', (e) => errs.push(e.message));
  const shot = async (n) => { if (SHOTS) await sleep(220), await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
  const names = () => p.$$eval('#gd-body .gd-it', (e) => e.map((x) => x.getAttribute('data-p').split('/').pop()));
  const row = (n) => p.locator('#gd-body .gd-it', { has: p.locator('b', { hasText: new RegExp('^' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }) });
  const menu = () => p.locator('.gd-menu').first();
  const pick = (label) => p.locator('.gd-menu:visible .gd-mit', { hasText: label }).first();
  const settle = async () => { await p.waitForFunction(() => !document.querySelector('#toast:not([hidden])') || true); await sleep(350); };
  await p.goto(B + '/'); await p.waitForSelector('[data-act="nav"][data-v="drive"]'); await p.click('[data-act="nav"][data-v="drive"]'); await p.waitForSelector('.gd-row');

  await t('lists folders first, then files, with type, date and size', async () => {
    const n = await names(); assert.deepEqual(n.slice(0, 5), ['Invoices', 'Music', 'Photos', 'Projects', 'Work']); assert.ok(n.includes('Notes.md'));
    assert.match(await row('Handbook.pdf').innerText(), /PDF[\s\S]*871\.1 KB/);
    assert.ok(await p.locator('.gd-head').isVisible());
  });
  await t('single click selects, details panel shows the file', async () => {
    await row('Notes.md').click(); assert.ok(await row('Notes.md').evaluate((e) => e.classList.contains('sel')));
    await p.click('.gd-selbar [data-d="det"]'); assert.match(await p.locator('#gd-det').innerText(), /Notes\.md[\s\S]*Edit as text/); await shot('02-details');
    await p.click('#gd-det [data-d="det"]'); assert.ok(!(await p.locator('#gd-det').isVisible()));
  });
  await t('right-click on a file opens the menu with Open, Download, Rename, Move, Delete', async () => {
    await row('Handbook.pdf').click({ button: 'right' }); await menu().waitFor();
    const txt = await menu().innerText(); for (const w of ['Open', 'Download', 'Add to starred', 'Rename', 'Make a copy', 'Move to', 'Cut', 'Copy', 'Delete']) assert.ok(txt.includes(w), 'menu missing ' + w + ' in: ' + txt.replace(/\n/g, '|'));
    await shot('03-context-file'); await p.keyboard.press('Escape'); assert.equal(await p.locator('.gd-menu').count(), 0);
  });
  await t('right-click on a spreadsheet offers Open with', async () => {
    await row('Q3 Budget.xlsx').click({ button: 'right' }); await menu().waitFor(); assert.ok((await menu().innerText()).includes('Open with'));
    await p.keyboard.press('Escape');
  });
  await t('right-click on empty space opens the background menu', async () => {
    await p.locator('.gd-bar').click({ button: 'right', position: { x: 700, y: 20 } }); await menu().waitFor();
    const txt = await menu().innerText(); for (const w of ['New folder', 'New text file', 'File upload', 'Folder upload', 'Select all', 'Refresh']) assert.ok(txt.includes(w), 'bg menu missing ' + w);
    await shot('04-context-bg'); await p.keyboard.press('Escape');
  });
  await t('New folder from the menu creates it on the server and selects it', async () => {
    await p.locator('.gd-bar').click({ button: 'right', position: { x: 700, y: 20 } }); await pick('New folder').click();
    await p.fill('#gd-in', 'Receipts'); await p.click('[data-d="ok-newf"]'); await settle();
    assert.ok((await names()).includes('Receipts')); assert.ok(tree.get('/Receipts')?.dir); assert.ok(await row('Receipts').evaluate((e) => e.classList.contains('sel')));
  });
  await t('rename with F2 moves the file on the server', async () => {
    await row('config.json').click(); await p.keyboard.press('F2'); await p.fill('#gd-in', 'settings.json'); await p.keyboard.press('Enter'); await settle();
    assert.ok(tree.has('/settings.json') && !tree.has('/config.json')); assert.ok((await names()).includes('settings.json'));
  });
  await t('a taken name is refused when renaming', async () => {
    await row('settings.json').click(); await p.keyboard.press('F2'); await p.fill('#gd-in', 'Notes.md'); await p.keyboard.press('Enter'); await sleep(200);
    assert.ok(tree.has('/settings.json')); assert.ok(await p.locator('#gd-in').isVisible()); await p.click('.gd-dlg [data-d="mx"]');
  });
  await t('star a file: it shows a star and appears under Starred', async () => {
    await row('Handbook.pdf').click({ button: 'right' }); await pick('Add to starred').click(); await sleep(200);
    assert.ok(await row('Handbook.pdf').locator('.gd-star').count());
    await p.click('.gd-nav[data-s="starred"]'); await settle(); assert.deepEqual(await names(), ['Handbook.pdf']); await shot('05-starred');
    await p.click('.gd-nav[data-s="my"]'); await settle();
  });
  await t('Move to... uses the folder chooser and moves on the server', async () => {
    await row('Site map.pdf').click({ button: 'right' }); await pick('Move to').click(); await p.waitForSelector('.gd-pk');
    await p.locator('.gd-pkr', { hasText: 'Invoices' }).click(); await sleep(250); await shot('06-move-dialog'); await p.click('[data-d="pk-ok"]'); await settle();
    assert.ok(tree.has('/Invoices/Site map.pdf') && !tree.has('/Site map.pdf')); assert.ok(!(await names()).includes('Site map.pdf'));
  });
  await t('Make a copy keeps the original and avoids name clashes', async () => {
     await row('Notes.md').click({ button: 'right' }); await pick('Make a copy').click(); await p.waitForSelector('.gd-pk'); await p.click('[data-d="pk-ok"]'); await settle();
     assert.ok(tree.has('/Notes.md') && tree.has('/Notes (1).md'));
  });
  await t('copy, open a folder, paste (Ctrl+C / Ctrl+V)', async () => {
    await row('Proposal.docx').click(); await p.keyboard.press('Control+c'); await row('Work').dblclick(); await p.waitForFunction(() => document.querySelector('.gd-cur')?.textContent === 'Work'); await settle();
    await p.keyboard.press('Control+v'); await settle(); assert.ok(tree.has('/Work/Proposal.docx') && tree.has('/Proposal.docx'));
    await p.locator('.gd-cr', { hasText: 'My Drive' }).click(); await settle();
  });
  await t('cut and paste into a folder moves the file', async () => {
    await row('Q3 Budget.xlsx').click(); await p.keyboard.press('Control+x'); await row('Projects').click({ button: 'right' }); await pick('Paste into folder').click(); await settle();
    assert.ok(tree.has('/Projects/Q3 Budget.xlsx') && !tree.has('/Q3 Budget.xlsx'));
  });
  await t('drag a file onto a folder moves it', async () => {
    await p.setViewportSize({ width: 1440, height: 1200 }); await p.evaluate(() => { document.querySelector('#gd-body').scrollTop = 0; }); await sleep(150);
    await row('Pitch deck.pptx').dragTo(row('Music')); await until(() => tree.has('/Music/Pitch deck.pptx')); await settle(); await p.setViewportSize({ width: 1440, height: 860 });
    assert.ok(tree.has('/Music/Pitch deck.pptx') && !tree.has('/Pitch deck.pptx'));
  });
  await t('multi-select with Ctrl and Shift, then delete forever', async () => {
    await row('Intro.mp4').click(); await row('Handbook.pdf').click({ modifiers: ['Control'] }); assert.equal(await p.locator('#gd-body .gd-it.sel').count(), 2);
    assert.match(await p.locator('.gd-selbar').innerText(), /2 selected/); await shot('07-multiselect');
    await p.keyboard.press('Delete'); await p.waitForSelector('.gd-dlg'); assert.match(await p.locator('.gd-dlg').innerText(), /permanent/); await shot('08-delete');
    await p.click('[data-d="ok-del"]'); await settle(); assert.ok(!tree.has('/Intro.mp4') && !tree.has('/Handbook.pdf')); assert.ok(!(await names()).includes('Intro.mp4'));
  });
  await t('upload files from the New menu (and a name clash becomes "(1)")', async () => {
    await p.click('[data-d="newmenu"]'); const [fc] = await Promise.all([p.waitForEvent('filechooser'), pick('File upload').click()]);
    await fc.setFiles([{ name: 'hello.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') }, { name: 'Notes.md', mimeType: 'text/markdown', buffer: Buffer.from('dup') }]); await until(() => tree.has('/Notes (2).md') && tree.has('/hello.txt')); await settle();
    assert.equal(tree.get('/hello.txt')?.data.toString(), 'hi'); assert.equal(tree.get('/Notes (2).md')?.data.toString(), 'dup', [...tree.keys()].filter((k) => /Notes/.test(k)).join(',')); assert.equal(tree.get('/Notes.md').data.toString().startsWith('# Notes'), true);
  });
  await t('drop files from the computer uploads them into the open folder', async () => {
    const dt = await p.evaluateHandle(() => { const d = new DataTransfer(); d.items.add(new File(['dropped'], 'dropped.txt', { type: 'text/plain' })); return d; });
    await p.dispatchEvent('#gd-body', 'dragenter', { dataTransfer: dt }); assert.ok(await p.locator('#gd-drop').isVisible()); await shot('09-drop');
    await p.dispatchEvent('#gd-body', 'drop', { dataTransfer: dt }); await until(() => tree.has('/dropped.txt')); assert.equal(tree.get('/dropped.txt')?.data.toString(), 'dropped');
  });
  await t('search filters the folder', async () => {
    await p.fill('#gd-q', 'notes'); assert.deepEqual((await names()).sort(), ['Notes (1).md', 'Notes (2).md', 'Notes.md']); await p.fill('#gd-q', 'zzz'); assert.ok(await p.locator('.gd-empty').isVisible()); await p.fill('#gd-q', '');
  });
  await t('grid layout shows folders, files and image thumbnails', async () => {
    await p.click('[data-d="view"][data-v="grid"]'); await p.waitForSelector('.gd-card'); await row('Photos').dblclick(); await p.waitForFunction(() => document.querySelector('.gd-cur')?.textContent === 'Photos'); await settle();
    assert.ok(await p.locator('.gd-thumb img').count() >= 3); await shot('10-grid');
    await p.click('[data-d="view"][data-v="list"]'); await p.waitForSelector('.gd-row');
  });
  await t('double-click an image opens the preview; arrows move; Escape closes', async () => {
    await row('Safari 1.png').dblclick(); await p.waitForSelector('.gd-pv img'); assert.match(await p.locator('.gd-pvh').innerText(), /Safari 1\.png/); await shot('11-preview');
    await p.keyboard.press('ArrowRight'); assert.match(await p.locator('.gd-pvh').innerText(), /Safari 2\.png/); await p.keyboard.press('Escape'); assert.equal(await p.locator('.gd-pv').count(), 0);
  });
  await t('breadcrumbs and Backspace go back up', async () => {
    await p.locator('#gd-body').focus(); await p.keyboard.press('Backspace'); await settle(); assert.ok((await names()).includes('Invoices'));
  });
  await t('recent lists what was opened or uploaded', async () => {
    await p.click('.gd-nav[data-s="recent"]'); await settle(); const n = await names(); assert.ok(n.includes('Safari 1.png') && n.includes('hello.txt')); await shot('12-recent'); await p.click('.gd-nav[data-s="my"]'); await settle();
  });
  await t('Delete on a folder removes it and its contents', async () => {
    await row('Receipts').click({ button: 'right' }); await pick('Delete').click(); await p.click('[data-d="ok-del"]'); await settle(); assert.ok(!tree.has('/Receipts'));
  });
  await t('light theme and phone width render', async () => {
    await p.emulateMedia({ colorScheme: 'light' }); await shot('13-light');
    await p.setViewportSize({ width: 400, height: 800 }); await sleep(200); await shot('14-phone');
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await p.setViewportSize({ width: 1440, height: 860 });
  });
  await t('no script errors', async () => { assert.deepEqual(errs, []); });
} catch (e) { failed++; console.log('ERR', e.stack); }
await browser.close(); srv.kill(); dav.close();
console.log(`\n${pass} passed, ${failed} failed`); if (failed) console.log(log.slice(-800)); process.exit(failed ? 1 : 0);
