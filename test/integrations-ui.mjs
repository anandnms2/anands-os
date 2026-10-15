// Servers (Insights), VPN and Cards screens in a real Chromium against the mock services. SHOTS=<dir> saves screenshots.
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import assert from 'node:assert/strict'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
import { startBeszel, startWg, wgState, startCards, csState } from './integrations-mock.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }
const SHOTS = process.env.SHOTS || '';
const [bz, wg, cs] = [await startBeszel(), await startWg(), await startCards()];
const addr = (s) => `http://127.0.0.1:${s.address().port}`;
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-iu-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: process.env.E2E_SUITE || path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), STATUS_URL: addr(bz), STATUS_USER: 'ro@x.io', STATUS_PASSWORD: 'pw', VPN_URL: addr(wg), VPN_USER: 'admin', VPN_PASSWORD: 'wgpw', CARDS_URL: addr(cs), CARDS_USER: 'anand@x.io', CARDS_PASSWORD: 'cspw' } });
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`;
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: 'dark' });
  await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
  const p = await ctx.newPage(); p.setDefaultTimeout(5000); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(B + '/'); await p.waitForSelector('#rail .nav');
  const nav = (v) => p.click(`#rail [data-v="${v}"]`);

  await t('rail has VPN and Cards', async () => { assert.equal(await p.locator('#rail [data-v="vpn"]').count(), 1); assert.equal(await p.locator('#rail [data-v="cards"]').count(), 1); });
  await t('Insights shows servers with usage and a down server', async () => {
    await nav('insights'); await p.waitForSelector('.isrv'); assert.equal(await p.locator('.isrv').count(), 2);
    const txt = await p.locator('#view').innerText(); assert.match(txt, /oracle-1/); assert.match(txt, /home-nas/); assert.match(txt, /1 up, 1 down/); assert.match(txt, /46%/); assert.match(txt, /Down/);
    await shot(p, 'insights-servers');
  });
  await t('server detail shows history and containers', async () => {
    await p.click('.isrv[data-id="sysaaa111"]'); await p.waitForSelector('#modal .ispark'); const m = await p.locator('#modal').innerText(); assert.match(m, /Ubuntu 24.04/); assert.match(m, /immich/); assert.equal(await p.locator('#modal svg.ispark').count(), 2);
    await shot(p, 'server-detail'); await p.keyboard.press('Escape'); assert.ok(await p.locator('#modal').isHidden());
  });
  await t('VPN page lists devices and states', async () => {
    await nav('vpn'); await p.waitForSelector('#view table'); const txt = await p.locator('#view').innerText(); assert.match(txt, /Anand phone/); assert.match(txt, /Online/); assert.match(txt, /Off/); assert.match(txt, /10\.8\.0\.2/);
    await shot(p, 'vpn');
  });
  await t('VPN add device shows its QR code', async () => {
    await p.click('[data-ia="vpnew"]'); await p.fill('#vn', 'Tablet'); await p.click('[data-ia="vcreate"]');
    await p.waitForSelector('#modal .iqr img'); assert.ok(wgState.clients.some((c) => c.name === 'Tablet')); await shot(p, 'vpn-qr');
    await p.waitForFunction(() => { const i = document.querySelector('#modal .iqr img'); return i && i.complete && i.naturalWidth > 0; }); await p.click('#modal [data-act="mx2"]');
  });
  await t('VPN turn off, rename, delete (with confirm)', async () => {
    const row = (n) => p.locator('tr', { hasText: n });
    await row('Tablet').locator('[data-ia="vtog"]').click(); await p.waitForSelector('tr:has-text("Tablet") .pill:text-is("Off")'); assert.equal(wgState.clients.find((c) => c.name === 'Tablet').enabled, false);
    await row('Tablet').locator('[data-ia="vren"]').click(); await p.fill('#vn', 'Tablet Pro'); await p.click('[data-ia="vrensave"]'); await p.waitForSelector('tr:has-text("Tablet Pro")');
    await row('Tablet Pro').locator('[data-ia="vdel"]').click(); await p.waitForSelector('#modal [data-ia="vdelyes"]'); assert.ok(wgState.clients.some((c) => c.name === 'Tablet Pro')); await p.click('[data-ia="vdelyes"]');
    await p.waitForFunction(() => !/Tablet Pro/.test(document.querySelector('#view').innerText)); assert.ok(!wgState.clients.some((c) => c.name === 'Tablet Pro'));
  });
  await t('Cards page lists cards and filters by group and search', async () => {
    await nav('cards'); await p.waitForSelector('.icard'); assert.equal(await p.locator('.icard').count(), 2); await shot(p, 'cards');
    await p.click('[data-ia="cgrp"][data-g="22222222-2222-2222-2222-222222222222"]'); await p.waitForFunction(() => document.querySelectorAll('.icard').length === 1); assert.match(await p.locator('.icard').innerText(), /Brian/);
    await p.click('[data-ia="cgrp"][data-g=""]'); await p.waitForFunction(() => document.querySelectorAll('.icard').length === 2);
    await p.fill('#cq', 'kilimo'); await p.waitForFunction(() => document.querySelectorAll('.icard').length === 1); assert.match(await p.locator('.icard').innerText(), /Amina/);
  });
  await t('Cards open, edit and save', async () => {
    await p.click('.icard'); await p.waitForSelector('#modal .ikv'); assert.match(await p.locator('#modal').innerText(), /Met at expo/); await shot(p, 'card-open');
    await p.click('[data-ia="cedit"]'); await p.fill('#cf_name', 'Amina Wanjiru-Kimani'); await p.fill('#cf_tags', 'fleet, vip'); await p.click('[data-ia="csave"]');
    await p.waitForSelector('#modal h2:has-text("Kimani")'); assert.equal(csState.cards[0].name, 'Amina Wanjiru-Kimani'); assert.deepEqual(csState.cards[0].tags, ['fleet', 'vip']); await shot(p, 'card-edit');
  });
  await t('Cards mark contacted then delete needs confirmation', async () => {
    await p.click('[data-ia="ccont"]'); await p.waitForFunction(() => /ago|just now/.test(document.querySelector('#modal .ikv').innerText)); assert.ok(csState.cards[0].last_contacted_at);
    await p.click('[data-ia="cdelask"]'); await p.waitForSelector('[data-ia="cdelyes"]'); assert.equal(csState.cards.length, 2); await shot(p, 'card-delete');
    await p.click('[data-ia="cdelyes"]'); await p.waitForFunction(() => document.querySelector('#modal').hidden); assert.equal(csState.cards.length, 1);
  });
  await t('Settings has the three cards and saves', async () => {
    await p.click('#rail [data-v="settings"]'); for (const k of ['status', 'vpn', 'cards']) assert.equal(await p.locator('#s_' + k + 'u').count(), 1);
    await p.click('[data-act="save"][data-k="vpn"]'); await p.waitForFunction(() => /Connected/.test(document.querySelector('#r_vpn')?.textContent || '')); assert.match(await p.locator('#r_vpn').innerText(), /devices/);
    await p.click('[data-act="save"][data-k="status"]'); await p.waitForFunction(() => /Connected/.test(document.querySelector('#r_status')?.textContent || '')); assert.match(await p.locator('#r_status').innerText(), /systems/);
  });
  await t('mobile: bottom tabs scroll and VPN page fits', async () => {
    const m = await browser.newContext({ viewport: { width: 390, height: 800 }, colorScheme: 'dark' }); await m.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
    const q = await m.newPage(); await q.goto(B + '/'); await q.waitForSelector('#tabs button'); await q.click('#tabs [data-v="cards"]'); await q.waitForSelector('.icard');
    assert.ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal page scroll'); await shot(q, 'cards-mobile');
    await q.click('#tabs [data-v="insights"]'); await q.waitForSelector('.isrv'); assert.ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await shot(q, 'insights-mobile'); await m.close();
  });
  await t('no page errors', async () => assert.deepEqual(errs, []));
} finally { await browser.close(); srv.kill(); bz.close(); wg.close(); cs.close(); }
console.log(`\n${pass} passed, ${failed} failed`); if (failed) { console.log(log.slice(-1500)); process.exit(1); } process.exit(0);
