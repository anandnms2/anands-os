// Calendar on your own server: booking page, RSVP page and invitation emails over SMTP. Mock SMTP, no network.
// WORKER_SRC=<file> runs the real Calendar worker script; E2E_SUITE=<dir> serves the real guest pages.
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { smtpMock, parseMail, flat } from './smtp-mock.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const smtp = await smtpMock({ rejectRcpt: /^bad@/ });
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-cal-'));
const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: process.env.E2E_SUITE || path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'correct horse', SESSION_SECRET: 'x'.repeat(40) } });
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`;
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let cookie = '';
const call = async (p, o = {}) => {
  const h = { ...(o.headers || {}) }; if (cookie && !o.anon) h.cookie = cookie; if (o.method && o.method !== 'GET' && !o.noCsrf && !o.anon) h['x-aos'] = '1';
  if (o.json !== undefined) { h['content-type'] = 'application/json'; o.body = JSON.stringify(o.json); }
  const r = await fetch(B + p, { ...o, headers: h, redirect: 'manual' });
  const sc = r.headers.get('set-cookie'); if (sc && /aos_session=[^;]/.test(sc)) cookie = sc.split(';')[0];
  const buf = Buffer.from(await r.arrayBuffer()); let j = null; try { j = JSON.parse(buf.toString()); } catch {}
  return { r, s: r.status, j, t: buf.toString() };
};
const app = (extra = {}) => ({ 'x-app': 'calendar', ...extra });
let pass = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); process.exitCode = 1; } };
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const SECRET = 'admin-secret-' + 'a'.repeat(30);
const EV = { id: 'ev1', title: 'Planning', when: 'Sun 1 Nov, 10:00 UTC', organizerName: 'Anand', organizerEmail: 'anand@example.com', location: 'Office' };
const tok = () => crypto.randomBytes(20).toString('hex');
const ics = (uid, seq = 0, extra = '') => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//t//EN\r\nMETHOD:REQUEST\r\nBEGIN:VEVENT\r\nUID:${uid}\r\nSEQUENCE:${seq}\r\nDTSTAMP:20261020T100000Z\r\nDTSTART:20261101T100000Z\r\nDTEND:20261101T110000Z\r\nSUMMARY:Planning\r\nORGANIZER;CN=Anand:mailto:anand@example.com\r\nATTENDEE;CN=Guest:mailto:guest@example.com\r\n${extra}END:VEVENT\r\nEND:VCALENDAR\r\n`;

try {
  await call('/auth/password', { method: 'POST', json: { password: 'correct horse' } });

  await t('guest routes need no sign-in, internal routes still do', async () => {
    assert.notEqual((await call('/api/rsvp/' + tok(), { anon: true })).s, 401);
    assert.equal((await call('/_local/mail/send', { anon: true, method: 'POST', json: {} })).s, 401);
    assert.equal((await call('/_local/workers/list', { anon: true })).s, 401);
  });

  await t('settings: mail is saved, the password is never returned, bad values are refused', async () => {
    assert.equal((await call('/api/settings', { method: 'PUT', json: { mail: { host: 'x', port: 99999 } } })).s, 400);
    const r = await call('/api/settings', { method: 'PUT', json: { mail: { host: '127.0.0.1', port: smtp.port, security: 'none', user: 'mailer', pass: 'mail-secret', from: 'anand@example.com', fromName: 'Anand', dailyCap: 5 }, public: { url: B } } });
    assert.equal(r.s, 200); assert.equal(r.j.mail.host, '127.0.0.1'); assert.equal(r.j.mail.passSet, true); assert.ok(!JSON.stringify(r.j).includes('mail-secret'));
    assert.equal((await call('/api/settings')).j.public.url, B);
  });

  await t('mail test: verify and send a test message', async () => {
    const v = await call('/api/settings/test', { method: 'POST', json: { target: 'mail' } }); assert.equal(v.s, 200); assert.equal(v.j.connected ?? v.j.ok, true, v.t);
    const r = await call('/api/mail/test', { method: 'POST', json: { to: 'me@example.com' } }); assert.equal(r.s, 200, r.t);
    const m = smtp.msgs.at(-1); assert.deepEqual(m.rcpts, ['me@example.com']); assert.equal(m.from, 'anand@example.com');
    assert.match(parseMail(m.raw).headers.subject, /test/i);
  });

  await t('mail test with wrong password reports an error', async () => {
    const r = await call('/api/settings', { method: 'PUT', json: { mail: { pass: 'wrong' } } }); assert.equal(r.s, 200);
    const v = await call('/api/settings/test', { method: 'POST', json: { target: 'mail' } }); assert.equal(v.j.connected, false);
    await call('/api/settings', { method: 'PUT', json: { mail: { pass: 'mail-secret' } } });
  });

  const W = process.env.WORKER_SRC; let rsvp = tok(); const adm = (p, body, secret = SECRET) => call('/admin' + p, { anon: true, method: body === undefined ? 'GET' : 'POST', headers: { authorization: 'Bearer ' + secret, 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (W) {
    const src = fs.readFileSync(W, 'utf8').replace('__RSVP_ADMIN_SECRET_HASH__', sha(SECRET)).replace('__RSVP_WORKER_VERSION__', '30').replace('__RSVP_PAGE_URL__', B + '/rsvp.html');
    await t('worker: registers, starts and answers /admin/ping with the right secret only', async () => {
      const w = await call('/_local/fs/write?path=' + encodeURIComponent('/anand/rsvp-worker.js') + '&mkdirs=1&overwrite=1', { method: 'POST', headers: { ...app(), 'content-type': 'text/plain' }, body: src }); assert.equal(w.s, 200, w.t);
      const c = await call('/_local/workers/create', { method: 'POST', headers: app(), json: { name: 'cal-rsvp', path: '/anand/rsvp-worker.js' } }); assert.equal(c.s, 200, c.t);
      const ok = await adm('/ping'); assert.equal(ok.s, 200, ok.t);
      assert.equal((await adm('/ping', undefined, 'nope')).s, 401);
      assert.equal((await call('/admin/ping', { anon: true })).s, 401);
    });
    await t('worker: sync issues a personal link per guest', async () => {
      const s1 = await adm('/sync', { event: { id: 'ev1', title: 'Planning', start: Date.now() + 864e5 * 5, end: Date.now() + 864e5 * 5 + 36e5, organizerName: 'Anand', organizerEmail: 'anand@example.com' }, guests: [{ email: 'guest@example.com', name: 'Guest' }] });
      assert.equal(s1.s, 200, s1.t); rsvp = s1.j.links['guest@example.com']; assert.match(rsvp, /^[0-9a-f]{40}$/);
    });
  }
  await t('invitation email: Yes/No/Maybe links, ics, per-recipient result, no duplicates', async () => {
    const t1 = rsvp; const n0 = smtp.msgs.length;
    const body = { event: EV, ics: ics('ev1@x'), recipients: [{ email: 'guest@example.com', name: 'Guest', rsvpUrl: `${B}/rsvp/${t1}` }, { email: 'bad@example.com', rsvpUrl: `${B}/rsvp/${tok()}` }], organizer: { name: 'Anand', email: 'anand@example.com' } };
    const r = await call('/_local/mail-service/invites', { method: 'POST', headers: app(), json: body }); assert.equal(r.s, 200, r.t);
    assert.equal(smtp.msgs.length, n0 + 1, JSON.stringify(r.j));
    const m = parseMail(smtp.msgs.at(-1).raw); const parts = flat(m);
    assert.ok(parts.some((p) => /text\/calendar/.test(p.headers['content-type'])));
    const html = parts.find((p) => /text\/html/.test(p.headers['content-type'])).body;
    for (const a of ['accept', 'decline', 'maybe']) assert.ok(html.includes(`${B}/rsvp/${t1}/${a}`), a);
    const res = JSON.stringify(r.j); assert.match(res, /bad@example.com/);
    const again = await call('/_local/mail-service/invites', { method: 'POST', headers: app(), json: body });
    assert.equal(smtp.msgs.length, n0 + 1, 'same version is not sent twice: ' + again.t);
  });

  await t('mail-service and workers are for the Calendar only', async () => {
    assert.equal((await call('/_local/mail-service/invites', { method: 'POST', headers: { 'x-app': 'notes' }, json: {} })).s, 403);
    assert.equal((await call('/_local/workers/create', { method: 'POST', headers: { 'x-app': 'notes' }, json: { name: 'abc', path: '/x.js' } })).s, 403);
  });

  await t('rsvp link must point at this server', async () => {
    const r = await call('/_local/mail-service/invites', { method: 'POST', headers: app(), json: { event: { ...EV, id: 'ev2' }, ics: ics('ev2@x'), recipients: [{ email: 'guest@example.com', rsvpUrl: 'https://evil.example/rsvp/' + tok() }] } });
    const s = JSON.stringify(r.j); assert.ok(r.s >= 400 || /skipped|failed|error/i.test(s), s);
  });

  await t('cancellation email', async () => {
    const n0 = smtp.msgs.length;
    const r = await call('/_local/mail-service/cancellations', { method: 'POST', headers: app(), json: { event: EV, ics: ics('ev1@x', 1).replace('REQUEST', 'CANCEL'), recipients: [{ email: 'guest@example.com', name: 'Guest' }] } });
    assert.equal(r.s, 200, r.t); assert.ok(smtp.msgs.length > n0, JSON.stringify(r.j));
  });

  await t('reply email goes to the organizer', async () => {
    const n0 = smtp.msgs.length;
    const r = await call('/_local/mail-service/replies', { method: 'POST', headers: app(), json: { event: EV, partstat: 'accepted', attendee: { name: 'Guest', email: 'guest@example.com' }, ics: ics('ev1@x').replace('REQUEST', 'REPLY') } });
    assert.equal(r.s, 200, r.t); assert.deepEqual(smtp.msgs.at(-1).rcpts, ['anand@example.com']); assert.ok(smtp.msgs.length > n0);
    assert.match(parseMail(smtp.msgs.at(-1).raw).headers.subject, /Accepted: Planning/);
  });

  await t('daily cap is enforced', async () => {
    let last; for (let i = 0; i < 8; i++) last = await call('/api/mail/test', { method: 'POST', json: { to: 'me@example.com' } });
    assert.equal(last.s, 429); assert.equal(last.j.code, 'daily_limit');
    await call('/api/settings', { method: 'PUT', json: { mail: { dailyCap: 500 } } });
  });

  if (W) {
    await t('rsvp: guest opens the link, answers Yes, and the organizer gets a reply email', async () => {
      const g = await call('/api/rsvp/' + rsvp, { anon: true }); assert.equal(g.s, 200, g.t);
      const n0 = smtp.msgs.length;
      const a = await call('/api/rsvp/' + rsvp, { anon: true, method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'accepted' }) }); assert.equal(a.s, 200, a.t);
      const rr = await adm('/responses'); assert.equal(rr.s, 200, rr.t); assert.match(JSON.stringify(rr.j), /accepted/);
      assert.equal((await call('/api/rsvp/' + tok(), { anon: true })).s, 404);
      const e = await call('/rsvp/' + rsvp + '/accept', { anon: true }); assert.ok([200, 302, 303].includes(e.s), String(e.s));
    });
    await t('booking with a meeting link: the link points at this server\'s /meet page', async () => {
      const hrs = [{ start: 540, end: 1020 }];
      const sy = await adm('/booking/sync', { pages: [{ id: 'video', title: 'Video call', durationMin: 30, tz: 'UTC', hours: { 0: [], 1: hrs, 2: hrs, 3: hrs, 4: hrs, 5: hrs, 6: [] }, minNoticeMin: 0, maxAdvanceDays: 60, meet: true, enabled: true }], busy: [], organizerName: 'Anand', organizerEmail: 'anand@example.com', hour12: false });
      assert.equal(sy.s, 200, sy.t);
      const day = new Date(Date.now() + 3 * 864e5); while ([0, 6].includes(day.getUTCDay())) day.setUTCDate(day.getUTCDate() + 1);
      const sl = await call('/api/book/video/slots?from=' + day.toISOString().slice(0, 10), { anon: true }); assert.equal(sl.s, 200, sl.t);
      const n0 = smtp.msgs.length;
      const bk = await call('/api/book/video', { anon: true, method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ start: sl.j.slots[3], name: 'Lee', email: 'lee@example.com', tz: 'UTC' }) });
      assert.equal(bk.s, 200, bk.t);
      const url = JSON.stringify(bk.j).match(/https?:[^"\\]*\/meet\/#\/m\/[a-z-]+/)?.[0]; assert.ok(url && url.startsWith(B + '/meet/#/m/'), 'meeting link in the booking: ' + bk.t.slice(0, 300));
      assert.ok(!bk.t.includes('meetings.puter.com'));
      await new Promise((r) => setTimeout(r, 400)); assert.ok(smtp.msgs.slice(n0).some((m) => m.rcpts.includes('lee@example.com') && flat(parseMail(m.raw)).some((x) => (x.body || '').includes('/meet/#/m/'))), 'the confirmation email carries it');
    });
    await t('booking: slots, a booking, a confirmation email, and no double booking', async () => {
      const hrs = [{ start: 540, end: 1020 }];
      const sy = await adm('/booking/sync', { pages: [{ id: 'intro', title: 'Intro call', durationMin: 30, tz: 'UTC', hours: { 0: [], 1: hrs, 2: hrs, 3: hrs, 4: hrs, 5: hrs, 6: [] }, minNoticeMin: 0, maxAdvanceDays: 60, meet: false, enabled: true }], busy: [], organizerName: 'Anand', organizerEmail: 'anand@example.com', hour12: false });
      assert.equal(sy.s, 200, sy.t);
      const day = new Date(Date.now() + 3 * 864e5); while ([0, 6].includes(day.getUTCDay())) day.setUTCDate(day.getUTCDate() + 1);
      const sl = await call('/api/book/intro/slots?from=' + day.toISOString().slice(0, 10), { anon: true }); assert.equal(sl.s, 200, sl.t); assert.ok(sl.j.slots.length > 4);
      const n0 = smtp.msgs.length; const start = sl.j.slots[2];
      const bk = await call('/api/book/intro', { anon: true, method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ start, name: 'Pat', email: 'pat@example.com', notes: 'hi', tz: 'UTC' }) });
      assert.equal(bk.s, 200, bk.t); assert.ok(bk.j.token);
      await new Promise((r) => setTimeout(r, 400));
      assert.ok(smtp.msgs.length > n0, 'confirmation email sent');
      assert.ok(smtp.msgs.slice(n0).some((m) => m.rcpts.includes('pat@example.com')));
      const again = await call('/api/book/intro', { anon: true, method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ start, name: 'Sam', email: 'sam@example.com', tz: 'UTC' }) });
      assert.ok(again.s >= 400, 'slot already taken: ' + again.s);
      const lst = await adm('/booking/list'); assert.equal(lst.s, 200, lst.t); assert.match(lst.t, /pat@example.com/);
    });
  }
  await t('guest pages are served without sign-in', async () => {
    const p = await call('/book.html', { anon: true }); const q = await call('/rsvp.html', { anon: true });
    if (process.env.E2E_SUITE) { assert.equal(p.s, 200); assert.ok(p.t.includes('location.origin')); assert.ok(!/puter\\\.work\$\/\.test\(worker\)/.test(p.t)); assert.equal(q.s, 200); assert.ok(q.r.headers.get('content-security-policy')); }
  });
} finally { srv.kill(); smtp.close(); console.log(`\n${pass} passed`); if (process.env.SHOWLOG) console.log(log); }
