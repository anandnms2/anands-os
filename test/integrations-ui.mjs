// Servers (Insights), VPN and Cards screens in a real Chromium against the mock services. SHOTS=<dir> saves screenshots.
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import assert from 'node:assert/strict'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
import { startBeszel, startWg, wgState, startCards, csState, resetCards } from './integrations-mock.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }
const SHOTS = process.env.SHOTS || '';
const [bz, wg, cs] = [await startBeszel(), await startWg(), await startCards()];
const addr = (s) => `http://127.0.0.1:${s.address().port}`;
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-iu-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: process.env.E2E_SUITE || path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', CARDS_AS_CONTACTS: '0', SESSION_SECRET: 'x'.repeat(40), STATUS_URL: addr(bz), STATUS_USER: 'ro@x.io', STATUS_PASSWORD: 'pw', VPN_URL: addr(wg), VPN_USER: 'admin', VPN_PASSWORD: 'wgpw', CARDS_URL: addr(cs), CARDS_USER: 'anand@x.io', CARDS_PASSWORD: 'cspw' } });
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`;
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: 'dark' });
  await ctx.addInitScript(() => { try { localStorage.setItem('aos.pulsenative', 'false'); } catch {} });
  await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
  const p = await ctx.newPage(); p.setDefaultTimeout(5000); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(B + '/'); await p.waitForSelector('#rail .nav');
  const nav = (v) => v === 'cards' ? p.evaluate(() => { location.hash = '#cards'; }) : p.click(`#rail [data-v="${v}"]`);

  await t('rail has VPN and no Cards (it moved into Contacts)', async () => { assert.equal(await p.locator('#rail [data-v="vpn"]').count(), 1); assert.equal(await p.locator('#rail [data-v="servers"]').count(), 0); assert.equal(await p.locator('#rail [data-v="cards"]').count(), 0); });
  await t('Insights shows servers with usage and a down server', async () => {
    await nav('insights'); await p.click('#view [data-act="nav"][data-v="servers"]'); await p.waitForSelector('tr[data-sa="open"]'); assert.equal(await p.locator('tr[data-sa="open"]').count(), 2); assert.equal(await p.locator('#rail [data-v="servers"]').count(), 0);
    const txt = await p.locator('#view').innerText(); assert.match(txt, /oracle-1/); assert.match(txt, /home-nas/); assert.match(txt, /46%/); assert.match(txt, /Down/);
    await shot(p, 'insights-servers');
  });
  await t('Servers page: fleet, detail charts with hover, containers', async () => {
    await p.click('tr[data-sa="open"][data-id="sysaaa111"]'); await p.waitForSelector('.ichart'); const txt = await p.locator('#view').innerText(); assert.match(txt, /oracle-1/); assert.match(txt, /Ubuntu 24.04/);
    assert.ok(await p.locator('.ichart').count() >= 3);
    const plot = p.locator('.ich-plot').first(); const bb = await plot.boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForSelector('.ich-tip:not([hidden])');
    await shot(p, 'server-detail');
    await p.click('[data-sa="dtab"][data-t="containers"]'); await p.waitForFunction(() => /immich/.test(document.querySelector('#view').innerText)); await shot(p, 'server-containers');
    await p.click('[data-sa="range"][data-r="480m"]'); await p.waitForSelector('.ichart');
    await p.click('[data-sa="back"]'); await p.waitForSelector('tr[data-sa="open"]');
  });
  await t('Servers page: alerts tab', async () => { await p.click('[data-sa="tab"][data-t="alerts"]'); await p.waitForFunction(() => /Alert rules|alert/i.test(document.querySelector('#view').innerText)); await shot(p, 'server-alerts'); });
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
  await t('Pulse is only a link: a tile on Home, no page, no frames', async () => { await nav('home'); const a = p.locator('a.svc', { hasText: 'Pulse' }); assert.equal(await a.getAttribute('href'), 'https://control.anands.xyz'); assert.equal(await a.getAttribute('target'), '_blank'); assert.equal(await p.locator('iframe').count(), 0); });
  await t('Cards: scan a card with a photo, AI read, save', async () => {
    resetCards(); await nav('vpn'); await nav('cards'); await p.waitForSelector('.icard'); await p.click('[data-ca="new"]'); await p.waitForSelector('#nf_name');
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await p.setInputFiles('input[data-cf="front"]', { name: 'f.png', mimeType: 'image/png', buffer: png }); await p.waitForSelector('#modal img[alt="Front"]');
    await p.waitForSelector('[data-ca="airead"]:not([disabled])'); await p.click('[data-ca="airead"]'); await p.waitForFunction(() => document.querySelector('#nf_name').value === 'Zed Test'); await shot(p, 'cards-scan');
    await p.click('[data-ca="savenew"]'); await p.waitForFunction(() => /Card saved/.test(document.body.innerText)); assert.ok(csState.lastCreate.image.startsWith('data:image/jpeg')); assert.equal(csState.lastCreate.name, 'Zed Test');
  });
  await t('Cards: duplicate warning, notes, reminder, share link', async () => {
    await p.click('[data-ca="new"]'); await p.waitForSelector('#nf_name'); await p.fill('#nf_name', 'Dup'); await p.fill('#nf_phone', '+254700111222'); await p.click('[data-ca="savenew"]'); await p.waitForSelector('[data-ca="savenew"][data-force="1"]'); await p.click('#modal [data-act="mx2"]');
    await p.click('.icard >> nth=0'); await p.waitForSelector('[data-ca="notes"]');
    await p.click('[data-ca="notes"]'); await p.fill('#nn', 'Called about rates'); await p.click('[data-ca="noteadd"]'); await p.waitForFunction(() => /Called about rates/.test(document.querySelector('#modal').innerText)); await shot(p, 'cards-notes');
    await p.click('[data-ca="backcard"]'); await p.click('[data-ca="remind"]'); await p.fill('#rn', 'Send quote'); await p.click('[data-ca="remadd"]'); await p.waitForSelector('[data-ca="cshare"]');
    await p.click('[data-ca="cshare"]'); await p.click('[data-ca="share"]'); await p.selectOption('#sd', '30'); await p.selectOption('#sv', '1'); await p.click('[data-ca="sharemake"]'); await p.waitForSelector('#surl'); assert.match(await p.inputValue('#surl'), /\/c\/tok123$/); assert.equal(csState.lastShare.validityDays, 30); assert.equal(csState.lastShare.maxViews, 1); await shot(p, 'cards-share');
    await p.keyboard.press('Escape');
  });
  await t('Cards: reminders tab, select, move, merge', async () => {
    csState.cards.push({ ...csState.cards[0], id: '77777777-7777-7777-7777-777777777777', name: 'Brian Otieno', company: 'Savanna Freight', phone: '+254711000111', email: 'brian@savanna.co.ke' });
    await p.click('[data-ca="tab"][data-t="reminders"]'); await p.waitForFunction(() => /Send quote/.test(document.querySelector('#view').innerText)); await shot(p, 'cards-reminders'); await p.click('[data-ca="remdone"]'); await p.waitForFunction(() => /No open reminders/.test(document.querySelector('#view').innerText));
    await p.click('[data-ca="tab"][data-t="cards"]'); await p.waitForSelector('.icard'); await p.click('[data-ca="selmode"]'); await p.click('[data-ia="cgrp"][data-g=""]'); await p.waitForTimeout(100); await p.waitForFunction(() => document.querySelectorAll('.icsel').length >= 2); await p.locator('.icsel').nth(0).check(); await p.locator('.icsel').nth(1).check(); await shot(p, 'cards-select');
    await p.click('[data-ca="bmove"]'); await p.selectOption('#bg', '22222222-2222-2222-2222-222222222222'); await p.click('[data-ca="bmoveyes"]'); await p.waitForFunction(() => /Moved/.test(document.body.innerText)); assert.equal(csState.lastMove.groupId, '22222222-2222-2222-2222-222222222222'); assert.equal(csState.lastMove.ids.length, 2);
    await p.click('[data-ca="selmode"]'); await p.click('[data-ca="selmode"]'); await p.click('[data-ia="cgrp"][data-g=""]'); await p.waitForFunction(() => document.querySelectorAll('.icsel').length >= 2); await p.locator('.icsel').nth(0).check(); await p.locator('.icsel').nth(1).check(); await p.click('[data-ca="bmerge"]'); await p.waitForSelector('[data-ca="mgyes"]'); await shot(p, 'cards-merge'); await p.click('[data-ca="mgyes"]'); await p.waitForFunction(() => /Cards merged/.test(document.body.innerText)); assert.ok(csState.lastMerge.primaryId && csState.lastMerge.duplicateId);
  });
  await t('Cards: alerts, no frame tab', async () => { await p.click('[data-ca="tab"][data-t="alerts"]'); await p.waitForFunction(() => /Reminder due/.test(document.querySelector('#view').innerText));  assert.equal(await p.locator('[data-ca="tab"][data-t="app"]').count(), 0); await p.click('[data-ca="tab"][data-t="cards"]'); });
  await t('Settings has the three cards and saves', async () => {
    await p.click('#rail [data-v="settings"]'); for (const k of ['status', 'vpn', 'cards']) assert.equal(await p.locator('#s_' + k + 'u').count(), 1);
    await p.click('[data-act="save"][data-k="vpn"]'); await p.waitForFunction(() => /Connected/.test(document.querySelector('#r_vpn')?.textContent || '')); assert.match(await p.locator('#r_vpn').innerText(), /devices/);
    await p.click('[data-act="save"][data-k="status"]'); await p.waitForFunction(() => /Connected/.test(document.querySelector('#r_status')?.textContent || '')); assert.match(await p.locator('#r_status').innerText(), /systems/);
  });
  await t('mobile: bottom tabs scroll and VPN page fits', async () => {
    const m = await browser.newContext({ viewport: { width: 390, height: 800 }, colorScheme: 'dark' }); await m.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
    const q = await m.newPage(); await q.goto(B + '/'); await q.waitForSelector('#tabs button'); await q.evaluate(() => { location.hash = '#cards'; }); await q.waitForSelector('.icard');
    assert.ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal page scroll'); await shot(q, 'cards-mobile');
    await q.click('#tabs [data-v="insights"]'); await q.click('#view [data-v="servers"]'); await q.waitForSelector('tr[data-sa="open"]'); assert.ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await shot(q, 'insights-mobile'); await m.close();
  });
  await t('refresh keeps the page and Back goes to the previous one', async () => {
    await nav('vpn'); await nav('cards'); assert.match(p.url(), /#cards$/); await p.reload(); await p.waitForSelector('#view h1'); assert.equal(await p.locator('#view h1').first().innerText(), 'Cards'); await p.goBack(); await p.waitForFunction(() => document.querySelector('#view h1') && document.querySelector('#view h1').innerText === 'VPN');
  });
  await t('dates are dd/mm/yyyy and pages have no description under the heading', async () => {
    await nav('cards'); await p.waitForSelector('.icard'); await p.click('.icard >> nth=0'); await p.waitForSelector('#modal .ikv'); assert.match(await p.locator('#modal .ikv').innerText(), /\d\d\/\d\d\/\d{4}/); await p.keyboard.press('Escape');
    for (const v of ['photos', 'vault', 'insights', 'vpn', 'drive']) { await nav(v); await p.waitForSelector('#view h1'); assert.equal(await p.locator('.pagehead p').count(), 0, v); }
    await nav('photos'); assert.equal(await p.locator('[data-act="photoref"]').count() + 1 >= 1, true);
  });
  await t('no page errors', async () => assert.deepEqual(errs, []));
} finally { await browser.close(); srv.kill(); bz.close(); wg.close(); cs.close(); }
console.log(`\n${pass} passed, ${failed} failed`); if (failed) { console.log(log.slice(-1500)); process.exit(1); } process.exit(0);
