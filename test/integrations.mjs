// Status (Beszel), VPN (wg-easy) and Card Scan against in-memory mocks, through the real server API.
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import assert from 'node:assert/strict'; import { fileURLToPath } from 'node:url';
import { startBeszel, beszel, startWg, wgState, startCards, csState, resetCards } from './integrations-mock.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [bz, wg, cs] = [await startBeszel(), await startWg(), await startCards()];
const addr = (s) => `http://127.0.0.1:${s.address().port}`;
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-int-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40) } });
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`;
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
let cookie = '';
try {
  const r = await fetch(B + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: 'pw' }) });
  cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ');
  const api = async (m, p, b) => { const r = await fetch(B + p, { method: m, headers: { cookie, 'x-aos': '1', ...(b ? { 'content-type': 'application/json' } : {}) }, body: b ? JSON.stringify(b) : undefined }); const text = await r.text(); let d; try { d = JSON.parse(text); } catch { d = text; } return { status: r.status, data: d, headers: r.headers }; };

  await t('not connected gives a clear 409', async () => { for (const p of ['/api/status', '/api/vpn', '/api/cards']) { const r = await api('GET', p); assert.equal(r.status, 409); assert.equal(r.data.code, 'not_configured'); } });
  await t('settings accept and hide passwords', async () => {
    const r = await api('PUT', '/api/settings', { status: { url: addr(bz), user: 'ro@x.io', pass: 'pw' }, vpn: { url: addr(wg), user: 'admin', pass: 'wgpw' }, cards: { url: addr(cs), user: 'anand@x.io', pass: 'cspw' } });
    assert.equal(r.status, 200); assert.equal(r.data.status.passSet, true); assert.equal(r.data.vpn.user, 'admin'); assert.ok(!JSON.stringify(r.data).includes('wgpw') && !JSON.stringify(r.data).includes('cspw'));
  });
  await t('settings test buttons', async () => { for (const [k, n] of [['status', 2], ['vpn', 2], ['cards', 2]]) { const r = await api('POST', '/api/settings/test', { target: k }); assert.equal(r.data.connected, true, k + JSON.stringify(r.data)); assert.equal(r.data.resources, n); } });
  await t('status overview lists servers and alerts', async () => { const r = await api('GET', '/api/status?refresh=1'); assert.equal(r.status, 200); assert.equal(r.data.up, 1); assert.equal(r.data.down, 1); assert.equal(r.data.alertsFiring, 1); const s = r.data.systems[0]; assert.equal(s.name, 'oracle-1'); const a = r.data.systems.find((x) => x.name === 'oracle-1'); assert.equal(a.cpu, 12.3); assert.equal(a.services.failed, 1); });
  await t('status re-logs in when the token is rejected', async () => { beszel.logins += 5; const r = await api('GET', '/api/status?refresh=1'); assert.equal(r.status, 200); });
  await t('status detail has series, containers, info', async () => { const r = await api('GET', '/api/status/system?id=sysaaa111'); assert.equal(r.status, 200); assert.equal(r.data.series.length, 2); assert.equal(r.data.series[0].cpu, 10); assert.equal(r.data.containers[0].name, 'immich'); assert.equal(r.data.info.os, 'Ubuntu 24.04'); const bad = await api('GET', '/api/status/system?id=a"b'); assert.equal(bad.status, 400); });
  await t('vpn lists devices with online state', async () => { const r = await api('GET', '/api/vpn'); assert.equal(r.data.total, 2); assert.equal(r.data.online, 1); assert.equal(r.data.clients[0].online, true); assert.equal(r.data.clients[0].rx, 1000); assert.ok(!JSON.stringify(r.data).includes('SK')); });
  await t('vpn create, disable, enable, rename, delete', async () => {
    let r = await api('POST', '/api/vpn', { name: 'Tablet' }); assert.equal(r.data.ok, true);
    assert.equal((await api('GET', '/api/vpn')).data.total, 3);
    await api('POST', '/api/vpn/1/disable'); assert.equal(wgState.clients[0].enabled, false); await api('POST', '/api/vpn/1/enable'); assert.equal(wgState.clients[0].enabled, true);
    r = await api('PUT', '/api/vpn/2', { name: 'Work laptop' }); assert.equal(r.data.ok, true); assert.equal(wgState.clients[1].name, 'Work laptop'); assert.ok(!('privateKey' in wgState.lastUpdate) && !('publicKey' in wgState.lastUpdate));
    r = await api('DELETE', '/api/vpn/3'); assert.equal(r.data.ok, true); assert.equal((await api('GET', '/api/vpn')).data.total, 2);
    assert.equal((await api('POST', '/api/vpn', { name: ' ' })).status, 400); assert.equal((await api('DELETE', '/api/vpn/99')).status, 404);
  });
  await t('vpn config download and QR', async () => { const c = await api('GET', '/api/vpn/1/config?name=Anand%20phone'); assert.match(c.headers.get('content-disposition'), /Anand_phone\.conf/); assert.match(c.data, /\[Interface\]/); const q = await api('GET', '/api/vpn/1/qr'); assert.match(q.headers.get('content-type'), /svg/); assert.match(q.data, /<svg/); });
  await t('vpn wrong password reads clearly', async () => { await api('PUT', '/api/settings', { vpn: { pass: 'nope' } }); const r = await api('GET', '/api/vpn'); assert.equal(r.status, 502); assert.match(r.data.error, /rejected/); await api('PUT', '/api/settings', { vpn: { pass: 'wgpw' } }); });
  await t('cards list, search, group filter, stats', async () => {
    let r = await api('GET', '/api/cards'); assert.equal(r.data.total, 2); assert.equal(r.data.groups.length, 2); assert.equal(r.data.stats.total, 2);
    r = await api('GET', '/api/cards?q=tyre'); assert.equal(r.data.cards.length, 1); assert.equal(r.data.cards[0].company, 'Tyre Hub');
    r = await api('GET', '/api/cards?group=' + csState.groups[0].id); assert.equal(r.data.cards.length, 1);
  });
  await t('cards re-login after session loss', async () => { csState.logins += 3; const r = await api('GET', '/api/cards'); assert.equal(r.status, 200); });
  await t('cards open, edit, mark contacted, delete', async () => {
    const id = '00000000-0000-0000-0000-000000000001';
    let r = await api('GET', '/api/cards/' + id); assert.equal(r.data.card.notes, 'Met at expo'); assert.ok(r.data.card.image);
    r = await api('PATCH', '/api/cards/' + id, { name: 'Amina W.', phone: '+254711', bogus: 'x', groupId: csState.groups[1].id }); assert.equal(r.data.card.name, 'Amina W.'); assert.equal(r.data.card.group_name, 'Suppliers'); assert.ok(!('bogus' in csState.lastPatch));
    r = await api('PATCH', '/api/cards/' + id, { markContacted: true }); assert.ok(r.data.card.last_contacted_at);
    r = await api('DELETE', '/api/cards/' + id); assert.equal(r.data.ok, true); assert.equal((await api('GET', '/api/cards/' + id)).status, 404); assert.equal((await api('GET', '/api/cards/not-an-id')).status, 404);
  });
  await t('cards wrong password reads clearly', async () => { await api('PUT', '/api/settings', { cards: { pass: 'bad' } }); const r = await api('GET', '/api/cards'); assert.equal(r.status, 502); assert.match(r.data.error, /rejected/); });
  await t('needs sign-in and the x-aos header', async () => { assert.equal((await fetch(B + '/api/vpn')).status, 401); const r = await fetch(B + '/api/vpn/1', { method: 'DELETE', headers: { cookie } }); assert.equal(r.status, 403); });
} finally { srv.kill(); bz.close(); wg.close(); cs.close(); }
console.log(`\n${pass} passed, ${failed} failed`); if (failed) { console.log(log.slice(-1500)); process.exit(1); } process.exit(0);
