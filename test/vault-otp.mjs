// Vault: remembered login on this device, so only the two-step code is typed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { makeVault } from './bw.mjs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }

const EM = 'two@example.com', PW = 'correct master', V = makeVault(EM, PW, 5000, [{ name: 'Hetzner', user: 'anand@example.com', pw: 'Tn7#qLm2vXr9!eKd', url: 'https://console.hetzner.cloud' }]);
const vault = http.createServer((req, res) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
  const j = (c, o) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); }; const u = new URL(req.url, 'http://x');
  if (u.pathname === '/identity/accounts/prelogin') return j(200, { kdf: 0, kdfIterations: 5000 });
  if (u.pathname === '/identity/connect/token') { const f = new URLSearchParams(b); if (f.get('password') !== V.hash) return j(400, { error: 'invalid_grant', error_description: 'invalid_username_or_password' }); if (f.get('twoFactorToken') !== '123456') return j(400, { error: 'invalid_grant', error_description: 'Two factor required.', TwoFactorProviders: [0], TwoFactorProviders2: { 0: null } }); return j(200, { access_token: 'tok', Key: V.Key, Kdf: 0, KdfIterations: 5000 }); }
  if (u.pathname === '/api/sync') return j(200, V.sync); j(404, {}); }); });
await new Promise((r) => vault.listen(0, '127.0.0.1', r));
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-vo-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), PUBLIC_URL: `http://127.0.0.1:${port}`, VAULT_URL: 'http://127.0.0.1:' + vault.address().port } });
const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(B + '/#vault'); await p.waitForSelector('#vem');
  await t('first time: email and master password, tick remember, then the code', async () => {
    await p.fill('#vem', EM); await p.fill('#vpw', PW); await p.check('#vrem'); await p.click('#vf button[type="submit"]'); await p.waitForSelector('#v2'); await p.fill('#v2', '123456'); await p.press('#v2', 'Enter');
    await p.waitForSelector('.vapp'); assert.ok(await p.locator('.vrow, .drow, #vlist button').count() >= 1);
    const raw = await p.evaluate(() => localStorage.getItem('aos.vault.cred')); assert.ok(raw && !raw.includes(PW) && !raw.includes(EM), 'saved login is sealed');
  });
  await t('next visit: straight to the code, no email or password', async () => {
    await p.goto(B + '/#home'); await p.reload(); await p.waitForSelector('#avatar'); await p.evaluate(() => (location.hash = '#vault'));
    await p.waitForSelector('#v2'); assert.equal(await p.locator('#vem, #vpw').count(), 0); await p.fill('#v2', '000000'); await p.press('#v2', 'Enter'); await p.waitForFunction(() => /not accepted/.test(document.querySelector('#view').innerText));
    await p.fill('#v2', '123456'); await p.press('#v2', 'Enter'); await p.waitForSelector('.vapp');
  });
  await t('Lock now keeps it locked until you ask; forget removes the saved login', async () => {
    await p.click('[data-act="vlock"]'); await p.waitForSelector('[data-act="vsaved"]'); assert.equal(await p.locator('.vapp').count(), 0);
    await p.click('[data-act="vsaved"]'); await p.waitForSelector('#v2'); await p.fill('#v2', '123456'); await p.press('#v2', 'Enter'); await p.waitForSelector('.vapp');
    await p.click('[data-act="vlock"]'); await p.click('[data-act="vforget"]'); await p.waitForSelector('#vem'); assert.equal(await p.evaluate(() => localStorage.getItem('aos.vault.cred')), null);
  });
  await t('no page errors', async () => assert.deepEqual(errs, []));
} finally { await browser.close(); srv.kill(); vault.close(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
