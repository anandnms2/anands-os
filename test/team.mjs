// Guests and team members: invite link, area gate, owner-only team API, switch-off ends the session.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-tm-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
const ck = (r) => r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
const gone = async (c) => { const r = await call(c, '/api/session'); if (r.status === 401) return true; const j = await r.json().catch(() => ({})); return !j.user; };
const call = (cookie, p, o = {}) => fetch(B + p, { redirect: 'manual', ...o, headers: { cookie, 'x-aos': '1', 'content-type': 'application/json', ...(o.headers || {}) }, body: o.json ? JSON.stringify(o.json) : o.body });
try {
  const lr = await fetch(B + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: 'pw' }) }); const owner = ck(lr);
  let inv, guest, id;
  await t('owner creates a guest invite and gets a link once', async () => {
    const r = await call(owner, '/api/team', { method: 'POST', json: { name: 'Asha', role: 'guest', apps: ['chat'], days: 7, maxUses: 1 } }); assert.equal(r.status, 201);
    const j = await r.json(); inv = j.link; id = j.member.id; assert.match(inv, /\/auth\/invite\//); assert.equal(j.member.hasLink, true);
    const l = await (await call(owner, '/api/team')).json(); assert.equal(l.members.length, 1); assert.ok(!JSON.stringify(l).includes(inv.split('/').pop()));
  });
  await t('the link signs the guest in and works only the allowed number of times', async () => {
    const r = await fetch(inv, { redirect: 'manual' }); assert.ok(r.status >= 300 && r.status < 400); guest = ck(r); assert.ok(guest);
    const s = await (await call(guest, '/api/session')).json(); assert.equal(s.user.role, 'guest');
    const again = await fetch(inv, { redirect: 'manual' }); assert.ok(!ck(again));
  });
  await t('guest cannot open owner-only or unlisted areas', async () => {
    assert.equal((await call(guest, '/api/team')).status, 403);
    assert.equal((await call(guest, '/api/security')).status, 403);
    assert.equal((await call(guest, '/api/pulse/s/bootstrap')).status, 403);
    assert.equal((await call(guest, '/api/settings', { method: 'PUT', json: { links: {} } })).status, 403);
  });
  await t('guest sees no owner secrets in settings', async () => {
    const r = await call(guest, '/api/settings'); if (r.status === 200) { const j = JSON.stringify(await r.json()); assert.ok(!/"token"\s*:\s*"[^"]/.test(j)); }
  });
  await t('editing access takes effect', async () => {
    assert.equal((await call(owner, '/api/team/' + id, { method: 'PUT', json: { apps: ['chat', 'cards'] } })).status, 200);
    const s = await (await call(guest, '/api/session')).json(); assert.ok(s.user.perm.apps.includes('cards'));
  });
  await t('turning access off ends the guest session', async () => {
    assert.equal((await call(owner, '/api/team/' + id, { method: 'PUT', json: { disabled: true } })).status, 200);
    assert.ok(await gone(guest));
  });
  await t('a new link revives a person and removing them deletes access', async () => {
    const j = await (await call(owner, '/api/team/' + id + '/link', { method: 'POST', json: { days: 1 } })).json(); const r = await fetch(j.link, { redirect: 'manual' }); assert.ok(ck(r));
    assert.equal((await call(owner, '/api/team/' + id, { method: 'DELETE' })).status, 200); assert.ok(await gone(ck(r)));
  });
  await t('validation: needs a name and a real role', async () => {
    assert.equal((await call(owner, '/api/team', { method: 'POST', json: { name: '', role: 'guest' } })).status, 400);
    assert.equal((await call(owner, '/api/team', { method: 'POST', json: { name: 'X', role: 'admin' } })).status, 400);
  });
} finally { srv.kill(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
