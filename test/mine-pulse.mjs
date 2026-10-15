// My Cards, card table view, full Pulse (session API), Home, and Immich deletions, in a real Chromium against mocks. SHOTS=<dir> saves screenshots.
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import http from 'node:http'; import path from 'node:path';
import assert from 'node:assert/strict'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
import { startCards, csState, startPulseSession, psState, startBeszel, startWg } from './integrations-mock.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }
const SHOTS = process.env.SHOTS || '';
const imm = http.createServer((req, res) => { let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => { res.writeHead(200, { 'content-type': 'application/json' });
  if (req.url.includes('/search/metadata')) return res.end(JSON.stringify({ assets: { items: [{ id: 'a1', type: 'IMAGE', fileCreatedAt: '2026-10-14T10:00:00Z' }, { id: 'a2', type: 'IMAGE', isTrashed: true, fileCreatedAt: '2026-10-13T10:00:00Z' }, { id: 'a3', type: 'IMAGE', isOffline: true, fileCreatedAt: '2026-10-12T10:00:00Z' }, { id: 'a4', type: 'IMAGE', deletedAt: '2026-10-12T10:00:00Z', fileCreatedAt: '2026-10-11T10:00:00Z' }], nextPage: null } }));
  res.end(JSON.stringify({ ok: true })); }); });
await new Promise((r) => imm.listen(0, '127.0.0.1', r));
const [cs, ps, bz, wg] = [await startCards(), await startPulseSession(), await startBeszel(), await startWg()];
const addr = (s) => `http://127.0.0.1:${s.address().port}`;
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-mp-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: process.env.E2E_SUITE || path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40),
  CARDS_URL: addr(cs), CARDS_USER: 'anand@x.io', CARDS_PASSWORD: 'cspw', PULSE_URL: addr(ps), PULSE_USER: 'anand@pulse.io', PULSE_PASSWORD: 'pupw', IMMICH_URL: addr(imm), IMMICH_API_KEY: 'k', STATUS_URL: addr(bz), STATUS_USER: 'ro@x.io', STATUS_PASSWORD: 'pw', VPN_URL: addr(wg), VPN_USER: 'admin', VPN_PASSWORD: 'wgpw' } });
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`;
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: 'dark' });
  await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
  const p = await ctx.newPage(); p.setDefaultTimeout(6000); p.on('pageerror', (e) => errs.push(e.message + ' ' + String(e.stack).split('\n').slice(1, 3).join('|')));
  await p.goto(B + '/'); await p.waitForSelector('#rail .nav');
  const nav = (v) => p.click(`#rail [data-v="${v}"]`);

  await t('Immich: trashed, offline and deleted assets never reach the timeline', async () => {
    const r = await (await ctx.request.get(B + '/api/photos/timeline', { headers: { 'x-aos': '1' } })).json(); assert.deepEqual(r.items.map((i) => i.id), ['a1']);
  });
  await t('Home: live cards, Today from Pulse, services grouped', async () => {
    await p.waitForSelector('.live'); await p.waitForFunction(() => /Fleet review/.test(document.querySelector('#view').innerText)); const txt = await p.locator('#view').innerText();
    for (const w of ['Pulse', 'Tasks today', 'Next event', 'Cards', 'Photos', 'VPN', 'Everyday', 'Servers and network', 'Apps', 'Vault', 'Invoice 5521 overdue']) assert.ok(txt.includes(w), w); assert.match(txt, /needs you/i);
    assert.match(await p.locator('.live', { hasText: 'Next event' }).innerText(), /14:00/); await shot(p, 'home');
  });
  await t('Cards: Cards/Table toggle matches the real app', async () => {
    await nav('cards'); await p.waitForSelector('.icard'); assert.equal(await p.locator('.ctable').count(), 0);
    await p.click('[data-ia="cview2"][data-m="table"]'); await p.waitForSelector('.ctable tr.trow'); const h = (await p.locator('.ctable thead').innerText()).toLowerCase(); for (const c of ['Name', 'Company', 'Designation', 'Phone', 'Email', 'Group', 'Added']) assert.ok(h.includes(c.toLowerCase()), c);
    await shot(p, 'cards-table'); await p.click('.ctable tr.trow >> nth=0 >> td >> nth=1'); await p.waitForSelector('#modal .ikv'); await p.keyboard.press('Escape'); await p.click('[data-ia="cview2"][data-m="cards"]'); await p.waitForSelector('.icard');
  });
  await t('My cards: list, share by WhatsApp, QR and link', async () => {
    await p.click('[data-ca="tab"][data-t="mine"]'); await p.waitForFunction(() => /Anand Shah/.test(document.querySelector('#view').innerText)); await shot(p, 'mycards');
    await p.click('[data-mc="share"]'); await p.waitForSelector('#modal img'); await p.waitForFunction(() => { const i = document.querySelector('#modal img'); return i && i.complete && i.naturalWidth > 0; });
    const wa = await p.locator('#modal a:has-text("WhatsApp")').getAttribute('href'); assert.match(wa, /^https:\/\/wa\.me\/\?text=.*%2Fm%2Fanand/); assert.match(await p.inputValue('#mu'), /\/m\/anand$/);
    assert.equal(await p.locator('#modal a:has-text("Email")').count() >= 1, true); await shot(p, 'mycards-share');
    await p.fill('#ms', 'anand-shah'); await p.click('[data-mc="slugsave"]').catch(() => {}); await p.keyboard.press('Escape');
  });
  await t('My cards: create, edit colours, delete', async () => {
    await p.click('[data-mc="new"]'); await p.fill('#me_name', 'Second Card'); await p.fill('#me_phone', '+255711111111'); await p.click('[data-mc="theme"][data-t="midnight"]'); await p.click('[data-mc="save"]'); await p.waitForFunction(() => /Second Card/.test(document.querySelector('#view').innerText));
    assert.equal(csState.lastMineCreate.name, 'Second Card'); assert.equal(csState.lastMineCreate.theme, 'midnight');
    await p.locator('.icard:has-text("Second Card") [data-mc="del"], [data-mc="del"]').last().click(); await p.click('[data-mc="delyes"]'); await p.waitForFunction(() => !/Second Card/.test(document.querySelector('#view').innerText)); assert.equal(csState.mine.length, 1);
  });
  await t('Scanned card Share: WhatsApp, email, SMS, vCard and QR', async () => {
    await p.click('[data-ca="tab"][data-t="cards"]'); await p.waitForSelector('.icard'); await p.click('.icard >> nth=0'); await p.waitForSelector('[data-ca="cshare"]'); await p.click('[data-ca="cshare"]');
    await p.waitForSelector('#modal img'); const m = await p.locator('#modal').innerText(); for (const w of ['WhatsApp', 'Email', 'SMS', '.vcf', 'Copy']) assert.ok(m.includes(w), w); await shot(p, 'card-share'); await p.keyboard.press('Escape');
  });
  await t('Pulse: personal / work switch', async () => {
    await nav('pulse'); await p.waitForSelector('[data-px="mode"]'); await p.click('[data-px="mode"][data-m="work"]'); await p.waitForFunction(() => document.querySelector('[data-px="mode"][data-m="work"]').getAttribute('aria-pressed') === 'true'); assert.equal(psState.mode, 'work'); await shot(p, 'pulse-today');
  });
  await t('Pulse: Gmail-style inbox opens an email with attachments and actions', async () => {
    await p.click('[data-px="view"][data-v="inbox"]'); await p.waitForSelector('.pxrow'); await p.click('.pxrow[data-id="e12"]'); await p.waitForFunction(() => /Hello, invoice is overdue|Invoice chase/.test(document.querySelector('#view').innerText)); assert.match(await p.locator('#view').innerText(), /inv\.pdf/);
    await shot(p, 'pulse-inbox'); await p.waitForTimeout(300); assert.ok(psState.read.includes('e12')); assert.equal(await p.locator('iframe.pxframe').count(), 1); assert.match(await p.locator('iframe.pxframe').getAttribute('src'), /\/api\/pulse\/s\/mailhtml\//);
  });
  await t('Pulse: WhatsApp thread shows bubbles', async () => {
    await p.click('[data-px="view"][data-v="chats"]'); await p.waitForSelector('[data-px="chat"]'); await p.click('[data-px="chat"][data-g="g7"]'); await p.waitForSelector('.cb'); const txt = await p.locator('#view').innerText(); assert.match(txt, /Truck stuck at border/); assert.match(txt, /On it/); await shot(p, 'pulse-whatsapp');
  });
  await t('Pulse: tasks add, complete, delete', async () => {
    await p.click('[data-px="view"][data-v="tasks"]'); await p.waitForFunction(() => /Approve fuel advance/.test(document.querySelector('#view').innerText)); await p.click('[data-px="newtask"]'); await p.fill('#nt', 'Call Joseph'); await p.press('#nt', 'Enter');
    await p.waitForFunction(() => /Call Joseph/.test(document.querySelector('#view').innerText)); assert.equal(psState.lastTask.title, 'Call Joseph'); await p.locator('[data-px="tdone"]').first().check(); await p.waitForTimeout(250); assert.ok(psState.lastTaskPatch);
  });
  await t('Pulse: calendar and waiting views', async () => {
    await p.click('[data-px="view"][data-v="calendar"]'); await p.waitForFunction(() => /Fleet review/.test(document.querySelector('#view').innerText)); await p.click('[data-px="view"][data-v="waiting"]'); await p.waitForFunction(() => /POD for T482/.test(document.querySelector('#view').innerText));
  });
  await t('Settings carries Pulse email and password; wrong password reads clearly', async () => {
    await nav('settings'); assert.equal(await p.locator('#s_pulseus').count(), 1); assert.equal(await p.locator('#s_pulsepw').count(), 1);
    const r = await (await ctx.request.put(B + '/api/settings', { data: { pulse: { url: addr(ps), user: 'anand@pulse.io', pass: 'nope' } }, headers: { 'x-aos': '1' } })).json(); assert.equal(r.pulse.user, 'anand@pulse.io');
    const tr = await ctx.request.post(B + '/api/settings/test/pulse', { headers: { 'x-aos': '1' } }); const j = await tr.json().catch(() => ({})); assert.ok(!JSON.stringify(j).includes('nope'));
    await ctx.request.put(B + '/api/settings', { data: { pulse: { url: addr(ps), user: 'anand@pulse.io', pass: 'pupw' } }, headers: { 'x-aos': '1' } });
  });
  await t('mobile: Home and Pulse fit the screen', async () => {
    const m = await browser.newContext({ viewport: { width: 390, height: 800 }, colorScheme: 'dark' }); await m.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
    const q = await m.newPage(); await q.goto(B + '/'); await q.waitForSelector('.live'); assert.ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'home'); await shot(q, 'home-mobile');
    await q.goto(B + '/#pulse'); await q.waitForSelector('[data-px="mode"]'); assert.ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'pulse'); await shot(q, 'pulse-mobile');
  });
  await t('no page errors', async () => assert.deepEqual(errs, []));
} finally { await browser.close(); srv.kill(); imm.close(); cs.close(); ps.close(); bz.close(); wg.close(); }
if (errs.length) console.log('PAGEERRORS', errs.slice(0, 5)); console.log(`\n${pass} passed, ${failed} failed`); if (failed) { console.log(log.slice(-1500)); process.exit(1); } process.exit(0);
