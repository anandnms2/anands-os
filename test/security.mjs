// Security center: devices you can sign out, sign-in history, Authentik events, password health.
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

const EM = 'me@example.com', PW = 'correct master', V = makeVault(EM, PW, 5000, [
  { name: 'Hetzner', user: 'anand@example.com', pw: 'Tn7#qLm2vXr9!eKd', url: 'https://console.hetzner.cloud' },
  { name: 'Cloudflare', user: 'anand@example.com', pw: 'summer2024', url: 'https://dash.cloudflare.com', age: 500 },
  { name: 'GoDaddy', user: 'anandnms2', pw: 'summer2024', url: 'https://sso.godaddy.com' }]);
const vault = http.createServer((req, res) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
  const j = (c, o) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); }; const u = new URL(req.url, 'http://x');
  if (u.pathname === '/identity/accounts/prelogin') return j(200, { kdf: 0, kdfIterations: 5000 });
  if (u.pathname === '/identity/connect/token') { const f = new URLSearchParams(b); if (f.get('password') !== V.hash) return j(400, { error: 'invalid_grant', error_description: 'invalid_username_or_password' }); return j(200, { access_token: 'tok', Key: V.Key, Kdf: 0, KdfIterations: 5000 }); }
  if (u.pathname === '/api/sync') return j(200, V.sync); j(404, {}); }); });
await new Promise((r) => vault.listen(0, '127.0.0.1', r));
const ak = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); res.writeHead(req.headers.authorization === 'Bearer aktok' ? 200 : 403, { 'content-type': 'application/json' });
  const act = u.searchParams.get('action'); res.end(JSON.stringify({ results: act === 'login' ? [{ created: new Date().toISOString(), action: 'login', user: { username: 'anand' }, client_ip: '41.59.1.2', context: { authorized_application: { name: 'Anands Photos' }, auth_method: 'password' } }] : [{ created: new Date().toISOString(), action: 'login_failed', context: { username: 'intruder' }, client_ip: '9.9.9.9' }] })); });
await new Promise((r) => ak.listen(0, '127.0.0.1', r));
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-sc-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), PUBLIC_URL: `http://127.0.0.1:${port}`, VAULT_URL: 'http://127.0.0.1:' + vault.address().port, AUTHENTIK_URL: 'http://127.0.0.1:' + ak.address().port, AUTHENTIK_TOKEN: 'aktok' } });
const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
try {
  const login = async (pw) => { const c = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const r = await c.request.post(B + '/auth/password', { data: { password: pw }, headers: { 'x-aos': '1' } }); return [c, r]; };
  const [bad] = await login('nope'); const [ctx] = await login('pw'); const [other] = await login('pw');
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(B + '/#security'); await p.waitForSelector('.sectiles.top');
  await t('lists both signed-in devices and marks this one', async () => {
    await p.waitForFunction(() => [...document.querySelectorAll('.secc')].find((c) => /Signed-in devices/.test(c.textContent)).querySelectorAll('.secrow').length >= 2); assert.equal(await p.locator('.pill', { hasText: 'This device' }).count(), 1);
  });
  await t('history shows the failed attempt and the sign-ins', async () => {
    const h = await p.locator('.secc', { hasText: 'Sign-in history' }).innerText(); assert.match(h, /Wrong password/); assert.match(h, /Signed in/);
  });
  await t('Authentik events appear when a token is set', async () => {
    const txt = await p.locator('.secc', { hasText: 'Authentik logins' }).innerText(); assert.match(txt, /anand/); assert.match(txt, /Anands Photos/); assert.match(txt, /intruder/);
  });
  await t('password health scans the unlocked vault', async () => {
    assert.match(await p.locator('.secc', { hasText: 'Password health' }).innerText(), /Unlock Vault/);
    await p.goto(B + '/#vault'); await p.waitForSelector('#vem'); await p.fill('#vem', EM); await p.fill('#vpw', PW); await p.click('#vf button[type="submit"]'); await p.waitForSelector('.vapp');
    await p.evaluate(() => AOS.go('security')); await p.waitForSelector('.sectile.score');
    const txt = await p.locator('.secc', { hasText: 'Password health' }).innerText(); assert.match(txt, /3 logins scanned/); assert.match(txt, /Cloudflare/); assert.match(txt, /GoDaddy/); assert.doesNotMatch(txt, /Hetzner/); assert.match(txt, /Reused/);
  });
  await t('signing out another device ends its session', async () => {
    assert.equal((await (await other.request.get(B + '/api/session')).json()).user !== null, true);
    await p.click('[data-sec="revoke"]'); await p.waitForFunction(() => [...document.querySelectorAll('.secc')].find((c) => /Signed-in devices/.test(c.textContent)).querySelectorAll('.secrow').length === 1);
    assert.equal((await (await other.request.get(B + '/api/session')).json()).user, null);
    assert.equal((await ctx.request.get(B + '/api/session')).ok(), true); assert.notEqual((await (await ctx.request.get(B + '/api/session')).json()).user, null);
  });
  await t('only the owner reaches the security API', async () => { assert.equal((await fetch(B + '/api/security')).status, 401); });
  await t('no page errors', async () => assert.deepEqual(errs, []));
} finally { await browser.close(); srv.kill(); vault.close(); ak.close(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
