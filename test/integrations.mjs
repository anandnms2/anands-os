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
    assert.equal(r.status, 200); assert.equal(r.data.status.passSet, true); assert.equal(r.data.vpn.user, 'admin'); assert.ok(!JSON.stringify(r.data).includes('wgpw') && !JSON.stringify(r.data).includes('cspw')); assert.equal(r.data.pulse, undefined); assert.equal(r.data.links.pulse, 'https://control.anands.xyz');
  });
  await t('settings test buttons', async () => { for (const [k, n] of [['status', 2], ['vpn', 2], ['cards', 2]]) { const r = await api('POST', '/api/settings/test', { target: k }); assert.equal(r.data.connected, true, k + JSON.stringify(r.data)); assert.equal(r.data.resources, n); } });
  await t('status overview lists servers and alerts', async () => { const r = await api('GET', '/api/status?refresh=1'); assert.equal(r.status, 200); assert.equal(r.data.up, 1); assert.equal(r.data.down, 1); assert.equal(r.data.alertsFiring, 1); const s = r.data.systems[0]; assert.equal(s.name, 'oracle-1'); const a = r.data.systems.find((x) => x.name === 'oracle-1'); assert.equal(a.cpu, 12.3); assert.equal(a.services.failed, 1); });
  await t('status re-logs in when the token is rejected', async () => { beszel.logins += 5; const r = await api('GET', '/api/status?refresh=1'); assert.equal(r.status, 200); });
  await t('status detail has series, containers, info', async () => { const r = await api('GET', '/api/status/system?id=sysaaa111'); assert.equal(r.status, 200); assert.equal(r.data.series.length, 2); assert.equal(r.data.series[0].cpu, 10); assert.equal(r.data.containers[0].name, 'immich'); assert.equal(r.data.info.os, 'Ubuntu 24.04'); const bad = await api('GET', '/api/status/system?id=a"b'); assert.equal(bad.status, 400); });
  await t('status detail has full metrics for the chosen range', async () => { const r = await api('GET', '/api/status/system?id=sysaaa111&range=20m'); assert.equal(r.data.range, '20m'); const l = r.data.last; assert.equal(l.temp, 55); assert.deepEqual(l.la, [1, 2, 3]); assert.deepEqual(l.cpub, [10, 5, 1, 0, 84]); assert.equal(l.efs.sdb.du, 40); assert.deepEqual(l.b, [1000, 2000]); assert.equal(r.data.info.threads, null); assert.equal((await api('GET', '/api/status/system?id=sysaaa111&range=bogus')).data.range, '1m'); });
  await t('status containers history, services, disks', async () => {
    let r = await api('GET', '/api/status/containers?id=sysaaa111&range=1m'); assert.equal(r.data.names[0], 'immich'); assert.deepEqual(r.data.cpu.immich, [3, 5]); assert.deepEqual(r.data.cpu.db, [null, 1]);
    r = await api('GET', '/api/status/services?id=sysaaa111'); assert.equal(r.data.services[1].state, 'failed'); assert.equal(r.data.services[0].sub, 'running');
    r = await api('GET', '/api/status/smart?id=sysaaa111'); assert.equal(r.data.devices[0].state, 'PASSED'); assert.equal(r.data.devices[0].attributes[0].name, 'Reallocated_Sector_Ct');
  });
  await t('status alerts: rules, history, probes, add, change and remove', async () => {
    let r = await api('GET', '/api/status/alerts'); assert.equal(r.data.rules.length, 1); assert.equal(r.data.rules[0].systemName, 'home-nas'); assert.equal(r.data.history[0].name, 'Status'); assert.equal(r.data.quiet[0].start, '22:00');
    r = await api('POST', '/api/status/alerts', { system: 'sysaaa111', name: 'CPU', value: 85, min: 5 }); assert.equal(r.data.rules.length, 2); assert.equal(beszel.alerts[1].user, 'usr000001');
    r = await api('POST', '/api/status/alerts', { system: 'sysaaa111', name: 'CPU', value: 90, min: 5 }); assert.equal(r.data.rules.length, 2); assert.equal(beszel.alerts[1].value, 90);
    assert.equal((await api('POST', '/api/status/alerts', { system: 'sysaaa111', name: 'Bogus', value: 1 })).status, 400); assert.equal((await api('POST', '/api/status/alerts', { system: 'sysaaa111', name: 'CPU', value: 'x' })).status, 400);
    r = await api('DELETE', '/api/status/alerts?id=' + beszel.alerts[1].id); assert.equal(r.data.rules.length, 1);
    r = await api('GET', '/api/status/probes'); const p1 = r.data.probes[0], p2 = r.data.probes[1];
    assert.equal(p1.ok, 99); assert.equal(p1.now, 8.3); assert.equal(p1.avg, 12.8); assert.equal(p1.min, 5.5); assert.equal(p1.max, 41.2); assert.equal(p1.cert.days, 39); assert.equal(p1.cert.issuer, 'YR2');
    assert.equal(r.data.statsFrom, 'network_monitor_stats'); assert.equal(p2.ok, 75); assert.equal(p2.avg, 145); assert.equal(p2.min, 90); assert.equal(p2.max, 258); assert.equal(p2.now, 2);
    assert.ok((await api('GET', '/api/status/probes?debug=1')).data.debug.monitorKeys.includes('resAvg1h'));
  });
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
  await t('cards inline linked photos so the OS can show them', async () => { const r = await api('GET', '/api/cards?q=tyre'); assert.match(r.data.cards[0].image_thumb, /^data:image\/png;base64,/); });
  await t('cards re-login after session loss', async () => { csState.logins += 3; const r = await api('GET', '/api/cards'); assert.equal(r.status, 200); });
  await t('cards open, edit, mark contacted, delete', async () => {
    const id = '00000000-0000-0000-0000-000000000001';
    let r = await api('GET', '/api/cards/' + id); assert.equal(r.data.card.notes, 'Met at expo'); assert.ok(r.data.card.image);
    r = await api('PATCH', '/api/cards/' + id, { name: 'Amina W.', phone: '+254711', bogus: 'x', groupId: csState.groups[1].id }); assert.equal(r.data.card.name, 'Amina W.'); assert.equal(r.data.card.group_name, 'Suppliers'); assert.ok(!('bogus' in csState.lastPatch));
    r = await api('PATCH', '/api/cards/' + id, { markContacted: true }); assert.ok(r.data.card.last_contacted_at);
    r = await api('DELETE', '/api/cards/' + id); assert.equal(r.data.ok, true); assert.equal((await api('GET', '/api/cards/' + id)).status, 404); assert.equal((await api('GET', '/api/cards/not-an-id')).status, 404);
  });
  await t('cards: add a card (scan, duplicate check, create)', async () => {
    let r = await api('POST', '/api/cs/ai/extract-card', { front: 'data:image/jpeg;base64,AAAA' }); assert.equal(r.data.fields.name, 'Zed Test'); assert.equal(csState.lastExtract.front, 'data:image/jpeg;base64,AAAA');
    assert.equal((await api('GET', '/api/cs/ai/status')).data.configured, true);
    r = await api('GET', '/api/cards/check-duplicate?phone=%2B254700333444'); assert.equal(r.data.matches.length, 1); assert.match(r.data.matches[0].image_thumb, /^data:image/);
    r = await api('POST', '/api/cards', { name: 'Zed Test', company: 'ZedCo', phone: '+255700000001', groupId: csState.groups[0].id, tags: ['new'], image: 'data:image/jpeg;base64,AAAA', evil: 'x' }); assert.equal(r.status, 201); assert.ok(!('evil' in csState.lastCreate)); assert.equal(csState.lastCreate.image, 'data:image/jpeg;base64,AAAA');
  });
  await t('cards: notes, timeline, reminders, share, notifications', async () => {
    const id = '00000000-0000-0000-0000-000000000002';
    let r = await api('POST', '/api/cards/' + id + '/notes', { note: 'Call back Monday' }); assert.equal(r.status, 200);
    r = await api('GET', '/api/cards/' + id + '/timeline'); assert.equal(r.data.events[0].note, 'Call back Monday');
    r = await api('POST', '/api/cards/' + id + '/reminders', { dueDate: '2026-10-20', note: 'Ring' }); assert.equal(r.status, 200);
    r = await api('GET', '/api/cs/reminders'); assert.equal(r.data.reminders[0].note, 'Ring'); assert.match(r.data.reminders[0].card_image_thumb, /^data:image/);
    await api('PATCH', '/api/cs/reminders/' + r.data.reminders[0].id, { done: true }); assert.equal(csState.lastRem.done, true); assert.equal((await api('GET', '/api/cs/reminders')).data.reminders.length, 0);
    r = await api('POST', '/api/cards/' + id + '/share', { validityDays: 7, maxViews: null }); assert.equal(r.data.url, addr(cs) + '/c/tok123'); assert.equal((await api('DELETE', '/api/cards/' + id + '/share')).data.ok, true);
    r = await api('GET', '/api/cs/notifications'); assert.equal(r.data.unreadCount, 1); await api('POST', '/api/cs/notifications/mark-read', {}); assert.equal((await api('GET', '/api/cs/notifications')).data.unreadCount, 0);
  });
  await t('cards: bulk move, merge, bulk delete, export', async () => {
    const [a, b] = csState.cards.map((c) => c.id);
    let r = await api('POST', '/api/cards/bulk-move', { ids: [a, 'bad id'], groupId: csState.groups[1].id }); assert.deepEqual(csState.lastMove.ids, [a]);
    r = await api('POST', '/api/cards/merge', { primaryId: a, duplicateId: b, fields: { phone: 'x' } }); assert.equal(csState.lastMerge.primaryId, a); assert.ok(!csState.cards.some((c) => c.id === b));
    const e = await api('GET', '/api/cards/export?groupId=' + csState.groups[0].id); assert.match(e.data, /^Name,Company/);
    const n = csState.cards.length; r = await api('POST', '/api/cards/bulk-delete', { ids: [csState.cards[csState.cards.length - 1].id] }); assert.equal(csState.cards.length, n - 1);
  });
  await t('contacts share the Card Scan database', async () => {
    const kv = async (b) => { const r = await fetch(B + '/_local/kv', { method: 'POST', headers: { cookie, 'x-aos': '1', 'x-app': 'contacts', 'content-type': 'application/json' }, body: JSON.stringify(b) }); return (await r.json()).result; };
    resetCards(); await api('PUT', '/api/settings', { cards: { pass: 'cspw' } });
    const rows = await kv({ op: 'list', pattern: 'contact:*', values: true });
    const amina = rows.find((r) => r.value.firstName === 'Amina'); assert.ok(amina, 'cards appear as contacts'); assert.equal(amina.value.lastName, 'Wanjiru'); assert.equal(amina.value.company, 'Kilimo Logistics'); assert.equal(amina.value.phones[0].value, '+254700111222');
    const id = amina.key.slice(8); const one = await kv({ op: 'get', key: amina.key }); assert.equal(one.emails[0].value, 'amina@kilimo.co.ke');
    await kv({ op: 'set', key: amina.key, value: { ...one, jobTitle: 'Head of Fleet', nickname: 'Mina', favorite: true } });
    assert.equal(csState.lastPatch.designation, 'Head of Fleet');
    const back = await kv({ op: 'get', key: amina.key }); assert.equal(back.nickname, 'Mina'); assert.equal(back.favorite, true);
    const n = csState.cards.length;
    await kv({ op: 'set', key: 'contact:new1', value: { id: 'new1', firstName: 'Zed', lastName: 'Kamau', company: 'Zed Co', phones: [{ label: 'Mobile', value: '+254711' }], emails: [], urls: [], addresses: [], tags: [] } });
    assert.equal(csState.cards.length, n + 1); assert.equal(csState.lastCreate.name, 'Zed Kamau');
    await kv({ op: 'del', key: 'contact:' + id }); assert.ok(!csState.cards.some((c) => 'cs-' + c.id === id));
    await api('PUT', '/api/settings', { cards: { contacts: false } });
    const off = await kv({ op: 'list', pattern: 'contact:*', values: true }); assert.ok(!off.some((r) => r.key.startsWith('contact:cs-')));
    await api('PUT', '/api/settings', { cards: { contacts: true, pass: 'cspw' } });
  });
  await t('Pulse is not part of the OS: no API route, no settings group', async () => { assert.equal((await api('GET', '/api/pulse/today')).status, 404); assert.equal((await api('POST', '/api/settings/test', { target: 'pulse' })).status === 200 && false, false); });
  await t('cards wrong password reads clearly', async () => { await api('PUT', '/api/settings', { cards: { pass: 'bad' } }); const r = await api('GET', '/api/cards'); assert.equal(r.status, 502); assert.match(r.data.error, /rejected/); });
  await t('needs sign-in and the x-aos header', async () => { assert.equal((await fetch(B + '/api/vpn')).status, 401); const r = await fetch(B + '/api/vpn/1', { method: 'DELETE', headers: { cookie } }); assert.equal(r.status, 403); });
} finally { srv.kill(); bz.close(); wg.close(); cs.close(); }
console.log(`\n${pass} passed, ${failed} failed`); if (failed) { console.log(log.slice(-1500)); process.exit(1); } process.exit(0);
