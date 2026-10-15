// Meetings and peer-to-peer on your own server: room directory, signalling relay, the puter.peer API, and a real two-browser meeting.
// Needs Playwright with Chromium. E2E_SUITE=<built suite dir> also runs the real Meetings app (host + guest through /meet).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null;
for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-meet-'));
const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: process.env.E2E_SUITE || path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'correct horse', SESSION_SECRET: 'x'.repeat(40), PUBLIC_URL: `http://127.0.0.1:${port}` } });
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`;
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); process.exitCode = 1; } };
const api = async (p, o = {}) => { const r = await fetch(B + p, { ...o, headers: { 'content-type': 'application/json', 'x-aos': '1', ...(o.headers || {}) }, body: o.json ? JSON.stringify(o.json) : undefined }); let j = null; try { j = await r.json(); } catch {} return { s: r.status, j, r }; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let browser = null;

try {
  /* ---- the room directory ---- */
  await t('rooms: an unused meeting link is idle, a claimed one shows the host\'s invite', async () => {
    const code = 'abc-defg-hij';
    assert.equal((await api('/v1/rooms/' + code)).j.room, null);
    const c = await api('/v1/rooms/' + code, { method: 'POST', json: { secret: 'secret-one-1', invite: 'pi123', host: 'Anand', participants: 1, term: 0 } }); assert.equal(c.s, 200);
    const g = (await api('/v1/rooms/' + code)).j.room; assert.equal(g.invite, 'pi123'); assert.equal(g.host, 'Anand'); assert.ok(g.age >= 0);
    const held = await api('/v1/rooms/' + code, { method: 'POST', json: { secret: 'someone-else-2', invite: 'pi999' } }); assert.equal(held.s, 409); assert.equal(held.j.reason, 'held');
    assert.equal((await api('/v1/rooms/' + code, { method: 'POST', json: { secret: 'secret-one-1', invite: 'pi124', term: 2 } })).s, 200);
    const stale = await api('/v1/rooms/' + code, { method: 'POST', json: { secret: 'secret-one-1', invite: 'pi125', term: 1 } }); assert.equal(stale.s, 409); assert.equal(stale.j.reason, 'stale_term');
    assert.equal((await api('/v1/rooms/' + code + '/end', { method: 'POST', json: { secret: 'someone-else-2', term: 5 } })).j.ended, false);
    assert.equal((await api('/v1/rooms/' + code + '/end', { method: 'POST', json: { secret: 'secret-one-1', term: 2 } })).j.ended, true);
    assert.equal((await api('/v1/rooms/' + code)).j.room, null);
  });
  await t('rooms: bad codes are refused and the secret is never returned', async () => {
    assert.equal((await api('/v1/rooms/not-a-code')).s, 400);
    await api('/v1/rooms/qqq-wwww-eee', { method: 'POST', json: { secret: 'topsecret-123', invite: 'p1' } });
    assert.ok(!JSON.stringify((await api('/v1/rooms/qqq-wwww-eee')).j).includes('topsecret'));
  });
  await t('signalling: needs a sign-in or a guest id, unknown invites are refused, relays need a grant', async () => {
    assert.equal((await api('/_peer/serve', { method: 'POST', json: {} })).s, 401);
    assert.equal((await api('/_peer/serve', { method: 'POST', json: {}, headers: { 'x-aos': '' } })).s, 403);
    const bad = await api('/_peer/connect', { method: 'POST', json: { invite: 'nope', anonToken: '11111111-2222-3333-4444-555555555555' } }); assert.equal(bad.s, 404); assert.equal(bad.j.code, 'invalid_invite');
    assert.equal((await api('/_peer/grant', { method: 'POST', json: {} })).s, 401);
    const ice = await api('/_peer/ice', { method: 'POST', json: {} }); assert.equal(ice.s, 200); assert.ok(ice.j.iceServers[0].urls.length);
    assert.equal((await api('/_peer/signal', { method: 'POST', json: { id: 'x', key: 'y', data: {} } })).s, 404);
  });
  await t('relay: TURN settings validate, the secret is never returned, and only grant holders or signed-in users get relay credentials', async () => {
    const lr = await fetch(B + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: 'correct horse' }) });
    const ck = lr.headers.get('set-cookie').split(';')[0];
    const put = (turn) => api('/api/settings', { method: 'PUT', json: { turn }, headers: { cookie: ck } });
    assert.equal((await put({ urls: 'http://nope' })).s, 400);
    const ok = await put({ urls: 'turn:turn.example.com:3478', secret: 'coturn-shared-secret', stun: 'stun:stun.example.com:3478' }); assert.equal(ok.s, 200);
    assert.equal(ok.j.turn.secretSet, true); assert.ok(!JSON.stringify(ok.j).includes('coturn-shared-secret'));
    const anon = await api('/_peer/ice', { method: 'POST', json: {} }); assert.equal(anon.j.iceServers.length, 1); assert.deepEqual(anon.j.iceServers[0].urls, ['stun:stun.example.com:3478']);
    const grant = (await api('/_peer/grant', { method: 'POST', json: {}, headers: { cookie: ck } })).j.grant;
    const g = await api('/_peer/ice', { method: 'POST', json: { turnGrant: grant } }); const tn = g.j.iceServers.find((x) => x.username);
    assert.ok(tn && tn.credential && tn.urls[0] === 'turn:turn.example.com:3478');
    const [exp] = tn.username.split(':'); assert.ok(Number(exp) > Date.now() / 1000);
    assert.equal((await api('/_peer/ice', { method: 'POST', json: { turnGrant: 'forged.token' } })).j.iceServers.length, 1);
    const me = await api('/_peer/ice', { method: 'POST', json: {}, headers: { cookie: ck } }); assert.ok(me.j.iceServers.some((x) => x.username));
    await put({ urls: '', stun: '' });
  });
  await t('guest page serves the Meetings app without sign-in, and nothing else', async () => {
    const r = await fetch(B + '/meet/'); if (!process.env.E2E_SUITE) return assert.ok([200, 404].includes(r.status));
    assert.equal(r.status, 200); assert.match(await r.text(), /Meetings/);
    assert.equal((await fetch(B + '/meet/../calendar/index.html')).status === 200, false);
    assert.equal((await fetch(B + '/apps/meetings/')).status, 401);
  });

  if (!chromium) console.log('skip browser tests (Playwright not found)');
  else {
    browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--no-sandbox'] });
    const mkPage = async () => { const c = await browser.newContext({ permissions: ['camera', 'microphone'] }); const p = await c.newPage(); await p.goto(B + '/healthz'); await p.addScriptTag({ url: B + '/_suite/peer.js' }); return { c, p }; };
    const A = await mkPage(), G = await mkPage();
    const ID = '11111111-2222-3333-4444-555555555555';
    await A.c.request.post(B + '/auth/password', { data: { password: 'correct horse' } });

    await t('peer: connect, text and binary messages both ways, the host sees the guest id', async () => {
      const inv = await A.p.evaluate(async () => {
        window.msgs = []; const s = await __aosPeer.serve(); window.srv = s;
        s.addEventListener('connection', (e) => { window.user = e.user; window.hc = e.conn; e.conn.addEventListener('message', (m) => window.msgs.push(typeof m.data === 'string' ? m.data : 'bin:' + new Uint8Array(m.data).join(','))); e.conn.addEventListener('open', () => e.conn.send('hello guest')); });
        return s.inviteCode;
      });
      const got = await G.p.evaluate(async ([inv, id]) => {
        window.gm = []; const c = await __aosPeer.connect(inv, { anonToken: id }); window.gc = c;
        c.addEventListener('message', (m) => window.gm.push(m.data));
        await new Promise((r, j) => { c.addEventListener('open', r); setTimeout(() => j(new Error('did not open')), 15000); });
        c.send('hello host'); c.send(new Uint8Array([1, 2, 3]).buffer); return c.connected;
      }, [inv, ID]);
      assert.equal(got, true);
      await sleep(600);
      assert.deepEqual(await A.p.evaluate(() => window.msgs), ['hello host', 'bin:1,2,3']);
      assert.deepEqual(await G.p.evaluate(() => window.gm), ['hello guest']);
      assert.equal(await A.p.evaluate(() => window.user.uuid), ID);
    });
    await t('peer: media published by name arrives under that name, and ends when unpublished', async () => {
      await G.p.evaluate(() => { window.media = []; window.ended = []; window.gc.addEventListener('media', (e) => window.media.push({ name: e.name, kind: e.track.kind, same: window.gc.media.get(e.name) === e.stream })); window.gc.addEventListener('mediaended', (e) => window.ended.push(e.name)); });
      await A.p.evaluate(() => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 48; const x = cv.getContext('2d'); setInterval(() => { x.fillStyle = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'); x.fillRect(0, 0, 64, 48); }, 50); window.hc.publish('camera', cv.captureStream(15)); });
      await sleep(2500);
      const m = await G.p.evaluate(() => window.media); assert.ok(m.some((x) => x.name === 'camera' && x.kind === 'video' && x.same), JSON.stringify(m));
      await A.p.evaluate(() => window.hc.unpublish('camera')); await sleep(800);
      assert.deepEqual(await G.p.evaluate(() => window.ended), ['camera']);
    });
    await t('peer: an unknown invite is refused with invalid_invite', async () => {
      const e = await G.p.evaluate(async () => { try { await __aosPeer.connect('piDOESNOTEXIST', { anonToken: '22222222-2222-3333-4444-555555555555' }); return null; } catch (x) { return { code: x.code, message: x.message }; } });
      assert.equal(e.code, 'invalid_invite'); assert.match(e.message, /invalid invite/i);
    });
    await t('peer: the host closing ends the guest\'s connection with the reason, and the invite stops working', async () => {
      await G.p.evaluate(() => { window.gClosed = null; window.gc.addEventListener('close', (e) => { window.gClosed = e.reason; }); });
      const inv = await A.p.evaluate(() => { const i = window.srv.inviteCode; window.hc.close('see you'); return i; });
      await sleep(1000); assert.equal(await G.p.evaluate(() => window.gClosed), 'see you');
      await A.p.evaluate(() => window.srv.close()); await sleep(300);
      assert.equal((await api('/_peer/connect', { method: 'POST', json: { invite: inv, anonToken: ID } })).j.code, 'invalid_invite');
    });
    await t('peer: a signed-in host can hand out a guest grant', async () => {
      const g = await A.p.evaluate(() => __aosPeer.createGuestGrant()); assert.ok(g.grant && g.expiresAt > Date.now() / 1000);
      const ice = await api('/_peer/ice', { method: 'POST', json: { turnGrant: g.grant } }); assert.equal(ice.s, 200);
    });

    if (!process.env.E2E_SUITE) console.log('skip Meetings app test (set E2E_SUITE)');
    else await t('meetings: the host starts a meeting, a guest joins through /meet with no account, both see video, chat works', async () => {
      const host = await A.c.newPage(); const errs = []; host.on('pageerror', (e) => errs.push(e.message));
      await host.goto(B + '/apps/meetings/'); await host.getByRole('button', { name: /new meeting/i }).first().click(); await host.getByText('Start an instant meeting').click();
      await host.getByRole('button', { name: 'Start meeting' }).click(); await host.waitForFunction(() => /#\/m\//.test(location.hash), null, { timeout: 15000 });
      const code = decodeURIComponent((await host.evaluate(() => location.hash)).replace('#/m/', ''));
      assert.match(code, /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
      const room = (await api('/v1/rooms/' + code)).j.room; assert.ok(room && room.invite, 'room is live');
      if (!(await host.evaluate(() => document.body.innerText)).includes('/meet/#/m/')) { await host.getByRole('button', { name: /^meeting details/i }).first().click(); await sleep(300); }
      assert.ok((await host.evaluate(() => document.body.innerText)).includes(B + '/meet/#/m/' + code), 'the share link points at this server');
      const gc = await browser.newContext({ permissions: ['camera', 'microphone'] }); const guest = await gc.newPage(); guest.on('pageerror', (e) => errs.push(e.message));
      await guest.goto(B + '/meet/#/m/' + code); await guest.locator('input').first().fill('Guesty'); await guest.getByRole('button', { name: /join now|ask to join/i }).first().click();
      await guest.waitForFunction(() => [...document.querySelectorAll('video')].filter((v) => v.videoWidth > 0).length >= 2, null, { timeout: 25000 });
      await host.waitForFunction(() => [...document.querySelectorAll('video')].filter((v) => v.videoWidth > 0).length >= 2, null, { timeout: 25000 });
      await guest.getByRole('button', { name: /in-call messages/i }).first().click(); await guest.getByRole('textbox').last().fill('hi from the guest'); await guest.keyboard.press('Enter');
      await host.getByRole('button', { name: /in-call messages/i }).first().click().catch(() => {}); await host.waitForFunction(() => document.body.innerText.includes('hi from the guest'), null, { timeout: 10000 });
      const live = (await api('/v1/rooms/' + code)).j.room; assert.ok(live.participants >= 2 || live.invite, 'room stays live');
      const g2c = await browser.newContext({ permissions: ['camera', 'microphone'] }); const g2 = await g2c.newPage(); g2.on('pageerror', (e) => errs.push(e.message));
      await g2.goto(B + '/meet/#/m/' + code); await g2.locator('input').first().fill('Third'); await g2.getByRole('button', { name: /join now|ask to join/i }).first().click();
      const three = () => [...document.querySelectorAll('video')].filter((v) => v.videoWidth > 0).length >= 3;
      await g2.waitForFunction(three, null, { timeout: 30000 }); await guest.waitForFunction(three, null, { timeout: 30000 }); await host.waitForFunction(three, null, { timeout: 30000 });
      assert.deepEqual(errs.filter((e) => !/ResizeObserver/.test(e)), []);
      await guest.getByRole('button', { name: /leave call/i }).first().click().catch(() => {});
    });
  }
} finally { if (browser) await browser.close(); srv.kill(); console.log(`\n${pass} passed`); if (process.env.SHOWLOG) console.log(log); }
