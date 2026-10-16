// Cloud tab in Insights: status strip, folding projects, merged latest changes and the insight cards, against a fake Coolify.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-cl-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const now = Date.now(), iso = (m) => new Date(now - m * 60e3).toISOString();
const P1 = { project_uuid: 'p1', project_name: 'Anands Cloud', environment_uuid: 'e1' }, P2 = { project_uuid: 'p2', project_name: 'Anands AI Hub', environment_uuid: 'e2' };
const APPS = [
  { uuid: 'a1', name: 'Anands OS', status: 'running:healthy', fqdn: 'https://localhost', git_repository: 'anandnms2/anands-os', ...P2 },
  { uuid: 'a2', name: 'Anands Paperless', status: 'running:healthy', fqdn: null, git_repository: 'anandnms2/anands-os', ...P1 },
  { uuid: 'a3', name: 'Anands Drive', status: 'running:unknown', fqdn: 'https://drive.test', git_repository: 'anandnms2/anands-drive', ...P1 }
];
const dep = (app, sha, msg, m, sec, status = 'finished') => ({ application_name: app, commit: sha, commit_message: msg, created_at: iso(m), finished_at: iso(m - sec / 60), status });
const DEPS = { a1: [dep('os', 'aaa111', 'Insights: AI tab\n\nCo-Authored-By: Claude', 10, 49), dep('os', 'bbb222', 'Healthchecks', 90, 50), dep('os', 'ccc333', 'Suite retry', 200, 491), dep('os', 'ddd444', 'Accept header', 400, 52), dep('os', 'eee555', 'Old change', 700, 60), dep('os', 'fff666', 'Failed one', 900, 30, 'failed')],
  a2: [dep('pl', 'aaa111', 'Insights: AI tab\n\nCo-Authored-By: Claude', 10, 46), dep('pl', 'bbb222', 'Healthchecks', 90, 53)], a3: [dep('drive', 'zzz999', 'Upload retry', 60 * 24 * 23, 160)] };
const fake = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'), send = (o) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); }, nf = () => { res.writeHead(404); res.end('{}'); };
  const p = u.pathname.replace(/^\/api\/v1/, '');
  if (p === '/servers') return send([{ name: 'Anands Cloud', ip: '1.2.3.4', is_reachable: true }]);
  if (p === '/projects') return send([{ uuid: 'p1', name: 'Anands Cloud', environments: [{ id: 'e1' }] }]);
  if (p.startsWith('/projects/')) return send({ uuid: 'p1', name: 'Anands Cloud', environments: [{ id: 'e1' }] });
  if (p === '/applications') return send(APPS); if (p === '/services') return send([]);
  if (p === '/databases') return send([{ uuid: 'd1', name: 'Anands DB', status: 'running:healthy', type: 'standalone-postgresql', ...P1 }]);
  if (p === '/databases/d1/backups') return send([]);
  const m = p.match(/^\/deployments\/applications\/(\w+)$/); if (m) return send({ count: DEPS[m[1]].length, deployments: DEPS[m[1]] });
  nf();
});
await new Promise((r) => fake.listen(0, '127.0.0.1', r));
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', COOLIFY_URL: 'http://127.0.0.1:' + fake.address().port, COOLIFY_TOKEN: 'ct' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const shots = process.env.SHOTS || '', errs = []; let browser = null;
try {
  const login = await fetch(B + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: 'pw' }) });
  const cookie = login.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  await t('insights carries stats, backups and domains next to the old fields', async () => {
    const d = await (await fetch(B + '/api/insights?refresh=1', { headers: { cookie } })).json();
    assert.equal(d.resources.length, 4); assert.ok(d.deploys.length >= 8); assert.equal(d.stats.count, 9); assert.equal(d.stats.failed, 1); assert.equal(d.stats.rate, 88.9); assert.equal(d.stats.slowest.sec, 491);
    assert.equal(d.stats.perDay.length, 30); assert.equal(d.stats.last[0].app, 'Anands Drive');
    assert.deepEqual(d.backups, [{ name: 'Anands DB', type: 'standalone-postgresql', scheduled: 0, last: null }]);
    assert.equal(d.domains.total, 3); assert.equal(d.domains.withDomain, 2); assert.deepEqual(d.domains.none, ['Anands Paperless']); assert.equal(d.box, null);
  });
  if (!chromium) console.log('skip  UI checks, Playwright not installed');
  else {
    browser = await chromium.launch({ args: ['--no-sandbox'] });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
    const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message));
    await t('Cloud shows one status strip, closed groups and merged latest changes', async () => {
      await page.goto(B + '/#insights'); await page.waitForSelector('.cl-strip');
      const strip = await page.locator('.cl-strip').innerText(); assert.match(strip, /3 of 4 healthy/); assert.match(strip, /no backup scheduled: Anands DB/); assert.match(strip, /without a health check: Anands Drive/);
      assert.equal(await page.locator('.cl-grp').count(), 2); assert.equal(await page.locator('.cl-grp[data-open="true"]').count(), 1, 'only the group with a problem is open');
      const acts = await page.locator('.cl-act').allInnerTexts(); assert.equal(acts.length, 4); assert.match(acts[0], /Anands OS, Anands Paperless/); assert.ok(!/Co-Authored/.test(acts.join(' ')));
      await page.locator('[data-cl="more"]').click(); assert.ok((await page.locator('.cl-act').count()) > 4);
      assert.ok(await page.locator('.cl-card').count() >= 4); assert.match(await page.locator('.cl-card.hot').innerText(), /No backup scheduled/);
      if (shots) { await page.screenshot({ path: shots + '/cloud.png' }); await page.locator('.cl-ins').scrollIntoViewIfNeeded(); await page.screenshot({ path: shots + '/cloud-cards.png' }); }
    });
    await t('groups open, search and filters work', async () => {
      await page.locator('.cl-grp>button', { hasText: 'Anands AI Hub' }).click(); await page.waitForSelector('.cl-grp[data-open="true"] .cl-row');
      await page.locator('#rq').fill('drive'); assert.equal(await page.locator('.cl-row').count(), 1);
      await page.locator('#rq').fill(''); await page.locator('[data-cl="rf"]', { hasText: 'No health check' }).click(); assert.equal(await page.locator('.cl-row').count(), 1);
    });
  }
  assert.deepEqual(errs, []);
} finally { if (browser) await browser.close(); srv.kill(); fake.close(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
