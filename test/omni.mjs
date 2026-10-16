// Ctrl+K search and commands, and Quick capture.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-pf-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), PUBLIC_URL: `http://127.0.0.1:${port}` } });
const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
fs.mkdirSync(path.join(data, 'fs', 'Reports'), { recursive: true }); fs.writeFileSync(path.join(data, 'fs', 'Reports', 'Fleet KPIs.csv'), 'a,b\n');
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(B + '/'); await p.waitForSelector('#avatar');
  const open = async () => { await p.keyboard.press('Control+k'); await p.waitForSelector('#oi'); };
  await t('Ctrl+K opens one box with go-to and action commands', async () => {
    await open(); assert.ok(await p.locator('#omres .it').count() >= 8); assert.ok(await p.locator('#omres .omh', { hasText: 'Actions' }).count());
  });
  await t('typing filters commands and Enter goes there', async () => {
    await p.fill('#oi', 'vault'); assert.match(await p.locator('#omres .it.sel').innerText(), /Vault/); await p.keyboard.press('Enter');
    await p.waitForFunction(() => location.hash === '#vault'); assert.equal(await p.locator('#oi').count(), 0);
  });
  await t('arrow keys move the selection', async () => {
    await open(); await p.fill('#oi', 'p'); await p.keyboard.press('ArrowDown'); const i1 = await p.locator('#omres .it').evaluateAll((l) => l.findIndex((x) => x.classList.contains('sel'))); assert.equal(i1, 1);
    await p.keyboard.press('ArrowUp'); const i0 = await p.locator('#omres .it').evaluateAll((l) => l.findIndex((x) => x.classList.contains('sel'))); assert.equal(i0, 0); await p.keyboard.press('Escape');
  });
  await t('finds files by name', async () => {
    await open(); await p.fill('#oi', 'fleet'); await p.waitForSelector('#omres .omh:has-text("Files")'); assert.match(await p.locator('#omres .it', { hasText: 'Fleet KPIs.csv' }).first().innerText(), /Fleet KPIs/); await p.keyboard.press('Escape');
  });
  await t('"note <text>" creates a note file in Captures', async () => {
    await open(); await p.fill('#oi', 'note ring the broker about Monday'); assert.match(await p.locator('#omres .it.sel').innerText(), /Save note/); await p.keyboard.press('Enter');
    await p.waitForFunction(() => /Note saved/.test(document.querySelector('#toast').textContent));
    const dir = path.join(data, 'fs', 'Captures'); const f = fs.readdirSync(dir).find((x) => /ring the broker/.test(x)); assert.ok(f, 'note file exists'); assert.match(fs.readFileSync(path.join(dir, f), 'utf8'), /ring the broker about Monday/);
  });
  await t('Alt+N opens Quick capture; a note saves; tabs switch', async () => {
    await p.keyboard.press('Alt+n'); await p.waitForSelector('.cap'); await p.fill('#cpt', 'Gate pass for T412 expires Friday'); await p.click('[data-cap="savenote"]'); await p.waitForSelector('.cap', { state: 'detached' });
    assert.ok(fs.readdirSync(path.join(data, 'fs', 'Captures')).some((x) => /Gate pass/.test(x)));
    await p.click('[data-cap="open"]'); await p.waitForSelector('.cap'); await p.click('[data-cap="tab"][data-t="task"]'); await p.waitForSelector('#cpk'); await p.click('[data-cap="tab"][data-t="photo"]'); assert.ok(await p.locator('#cpf').count()); await p.keyboard.press('Escape');
  });
  await t('task text understands dates, priority and area', async () => {
    const r = await p.evaluate(() => { const a = AOSCapture.parseTask('buy tyres tomorrow !high @personal'), b = AOSCapture.parseTask('call Zambia agent 2026-11-02'), c = AOSCapture.parseTask('plain thing'); return [a, b, c]; });
    assert.equal(r[0].title, 'buy tyres'); assert.equal(r[0].pri, 'high'); assert.equal(r[0].dom, 'Personal'); assert.match(r[0].due_date, /^\d{4}-\d\d-\d\d$/);
    assert.equal(r[1].due_date, '2026-11-02'); assert.equal(r[1].title, 'call Zambia agent'); assert.equal(r[2].due_date, undefined);
  });
  await t('without Pulse a task becomes a note instead of being lost', async () => {
    await open(); await p.fill('#oi', 'task renew road licence friday'); await p.keyboard.press('Enter'); for (let i = 0; i < 30 && !fs.readdirSync(path.join(data, 'fs', 'Captures')).some((x) => /Task.*renew/.test(x)); i++) await p.waitForTimeout(100);
    assert.ok(fs.readdirSync(path.join(data, 'fs', 'Captures')).some((x) => /Task.*renew road licence/.test(x)), fs.readdirSync(path.join(data, 'fs', 'Captures')).join(' | '));
  });
  await t('no page errors', async () => assert.deepEqual(errs, []));
} finally { await browser.close(); srv.kill(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
