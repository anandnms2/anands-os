// Appearance: theme, accent, text size, wallpaper, desktop widgets, keyboard shortcuts, synced preferences.
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
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-ap-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), PUBLIC_URL: `http://127.0.0.1:${port}` } });
const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
try {
  const mk = async (w = 1280, h = 800) => { const c = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'dark' }); await c.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } }); return c; };
  const ctx = await mk(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(B + '/#appearance'); await p.waitForSelector('.apc');
  const acc = () => p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
  await t('dark and light override the device setting', async () => {
    await p.click('[data-ap="mode"][data-v="dark"]'); assert.equal(await p.evaluate(() => document.documentElement.getAttribute('data-theme')), 'dark');
    await p.click('[data-ap="mode"][data-v="light"]'); assert.equal(await p.evaluate(() => document.documentElement.getAttribute('data-theme')), 'light'); assert.equal(await p.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(246, 245, 242)');
    await p.click('[data-ap="mode"][data-v="system"]'); assert.equal(await p.evaluate(() => document.documentElement.getAttribute('data-theme')), null);
  });
  await t('accent colour recolours the whole OS and can be reset', async () => {
    const before = await acc(); await p.click('[data-ap="accent"][data-v="#3b82f6"]'); await p.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() !== '');
    const blue = await acc(); assert.notEqual(blue, before); assert.match(blue, /#?3b82f6|#[0-9a-f]{6}/i);
    await p.fill('#apcol', '#ff00aa'); await p.dispatchEvent('#apcol', 'change'); assert.equal((await acc()).toLowerCase(), '#ff00aa'.toLowerCase());
    await p.click('[data-ap="accent"][data-v="default"]'); assert.equal(await acc(), before);
  });
  await t('text size changes the page font', async () => {
    await p.click('[data-ap="fs"][data-v="18"]'); assert.equal(await p.evaluate(() => getComputedStyle(document.body).fontSize), '18px'); await p.click('[data-ap="fs"][data-v="15"]');
  });
  await t('wallpaper behind the OS pages is optional', async () => {
    await p.check('[data-ap="oswall"]'); assert.ok(await p.evaluate(() => document.documentElement.classList.contains('oswall'))); assert.ok((await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--wall'))).length > 10);
    await p.click('[data-ap="wall"][data-v="night"]'); assert.match(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--wall')), /#07080b/); await p.uncheck('[data-ap="oswall"]');
    assert.equal(await p.evaluate(() => document.documentElement.classList.contains('oswall')), false);
  });
  await t('desktop shows the clock widget; drag moves it and the position is kept', async () => {
    await p.click('[data-ap="opendesk"]'); await p.waitForSelector('.wd[data-w="clock"]'); const box = await p.locator('.wd[data-w="clock"]').boundingBox(); const h = await p.locator('.wd[data-w="clock"] .wd-h').boundingBox();
    await p.mouse.move(h.x + 30, h.y + 10); await p.mouse.down(); await p.mouse.move(h.x - 250, h.y + 150, { steps: 6 }); await p.mouse.up(); const after = await p.locator('.wd[data-w="clock"]').boundingBox(); assert.ok(Math.abs(after.x - (box.x - 280)) < 6, 'moved left'); assert.ok(after.y > box.y + 100, 'moved down');
    await p.reload(); await p.waitForSelector('#avatar'); await p.evaluate(() => AOSDesk.show()); await p.waitForSelector('.wd[data-w="clock"]'); const kept = await p.locator('.wd[data-w="clock"]').boundingBox(); assert.ok(Math.abs(kept.x - after.x) < 3 && Math.abs(kept.y - after.y) < 3, 'position kept');
    assert.match(await p.locator('.wd[data-w="clock"]').innerText(), /Kochi/);
  });
  await t('widgets can be added and hidden', async () => {
    await p.evaluate(() => AOSDesk.hide(false)); await p.evaluate(() => AOS.go('appearance')); await p.waitForSelector('.apc'); await p.check('[data-ap="widget"][data-v="servers"]'); await p.evaluate(() => AOSDesk.show()); await p.waitForSelector('.wd[data-w="servers"]');
    await p.dispatchEvent('.wd[data-w="clock"] [data-wd="off"]', 'click'); assert.equal(await p.locator('.wd[data-w="clock"]').count(), 0);
  });
  await t('clock widget: time zones can be added and removed, and the health widget opens Insights', async () => {
    await p.evaluate(() => AOSDesk.hide(false)); await p.evaluate(() => AOS.go('appearance')); await p.waitForSelector('.apc'); await p.check('[data-ap="widget"][data-v="clock"]'); await p.check('[data-ap="widget"][data-v="servers"]'); await p.evaluate(() => AOSDesk.show()); await p.waitForSelector('.wd[data-w="clock"]');
    await p.dispatchEvent('.wd[data-w="clock"] [data-wd="edit"]', 'click'); await p.fill('.wd-zi', 'London'); await p.dispatchEvent('.wd[data-w="clock"] [data-wd="zadd"]', 'click');
    assert.match(await p.locator('.wd[data-w="clock"]').innerText(), /London/); await p.dispatchEvent('.wd[data-w="clock"] [data-wd="zdone"]', 'click');
    assert.match(await p.locator('.wd[data-w="clock"]').innerText(), /London/); assert.match(await p.locator('.wd[data-w="clock"]').innerText(), /Kochi/);
    await p.dispatchEvent('.wd[data-w="clock"] [data-wd="edit"]', 'click'); await p.dispatchEvent('.wd[data-w="clock"] [data-wd="zdel"][data-i="1"]', 'click'); assert.doesNotMatch(await p.locator('.wd[data-w="clock"]').innerText(), /Kochi/);
    await p.dispatchEvent('.wd[data-w="clock"] [data-wd="zdone"]', 'click');
    await p.dispatchEvent('.wd[data-w="servers"] .wd-b', 'click'); await p.waitForSelector('.dkw[aria-label*="Insights" i]');
  });
  await t('single-key shortcuts: g then a letter goes places, ? shows the list', async () => {
    await p.evaluate(() => AOSDesk.hide(false)); await p.evaluate(() => AOS.go('home')); await p.waitForSelector('#view'); await p.keyboard.press('g'); await p.keyboard.press('p'); await p.waitForFunction(() => location.hash === '#photos');
    await p.keyboard.press('?'); await p.waitForSelector('.kbh'); assert.match(await p.locator('.kbh').innerText(), /Go to Vault/); await p.keyboard.press('Escape');
    await p.keyboard.press('g'); await p.keyboard.press('e'); await p.waitForFunction(() => location.hash === '#security');
  });
  await t('shortcuts stay quiet while typing and can be turned off', async () => {
    await p.keyboard.press('Control+k'); await p.waitForSelector('#oi'); await p.keyboard.type('gp?'); assert.equal(await p.locator('.kbh').count(), 0); assert.equal(await p.inputValue('#oi'), 'gp?'); await p.keyboard.press('Escape');
    await p.evaluate(() => AOS.go('appearance')); await p.uncheck('[data-ap="keys"]'); await p.evaluate(() => AOS.go('home')); await p.keyboard.press('g'); await p.keyboard.press('v'); await p.waitForTimeout(250); assert.equal(await p.evaluate(() => location.hash), '#home');
  });
  await t('preferences follow you to another device', async () => {
    for (let i = 0; i < 20; i++) { const j = await (await ctx.request.get(B + '/api/prefs')).json(); if (j.keys === false && j.widgets && j.widgets.servers) break; await p.waitForTimeout(150); }
    const c2 = await mk(); const q = await c2.newPage(); await q.goto(B + '/'); await q.waitForSelector('#avatar'); await q.waitForFunction(() => window.AOSAppearance && AOSAppearance.state().keys === false); const st = await q.evaluate(() => AOSAppearance.state());
    assert.equal(st.keys, false); assert.equal(st.mode, 'system'); assert.equal(st.widgets.servers.on, true);
  });
  await t('no page errors', async () => assert.deepEqual(errs, []));
} finally { await browser.close(); srv.kill(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
