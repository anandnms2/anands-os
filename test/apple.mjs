// Apple Notes (IMAP) and Reminders (CalDAV) into Suite Notes, against mock Apple servers; plus the push endpoint the iPhone Shortcut uses.
import fs from 'node:fs'; import os from 'node:os'; import net from 'node:net'; import http from 'node:http'; import path from 'node:path';
import assert from 'node:assert/strict'; import { spawn } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-apple-')); const port = 20000 + Math.floor(Math.random() * 20000);
const NOTE = (id, subj, html) => `From: me@icloud.com\r\nSubject: ${subj}\r\nDate: Mon, 01 Jun 2026 10:00:00 +0000\r\nX-Universally-Unique-Identifier: ${id}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n${html.replace(/=/g, '=3D')}\r\n`;
const boxes = { Notes: [NOTE('n-1', 'Fuel budget', '<html><head></head><body><div><h1>Fuel budget</h1></div><div>Diesel =E2=80=94 plan</div><div><b>Check</b> <a href="https://x.test">link</a></div></body></html>'.replace(/=E2=80=94/, '—')), NOTE('n-2', '=?utf-8?B?U2FmYXJpIOKAkyBwbGFu?=', '<div>Day one</div>')], 'Notes/Work': [NOTE('n-3', 'Weekly', '<div>Monday</div>')] };
let imapLogins = 0;
const imap = net.createServer((s) => { let sel = ''; s.write('* OK ready\r\n'); let buf = ''; s.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\r\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 2); const [tag, ...r] = line.split(' '), cmd = r.join(' ');
  if (/^LOGIN/i.test(cmd)) { imapLogins++; s.write(cmd.includes('"app-pass"') ? `${tag} OK in\r\n` : `${tag} NO [AUTHENTICATIONFAILED] bad\r\n`); }
  else if (/^LIST/i.test(cmd)) s.write(`* LIST (\\HasNoChildren) "/" "INBOX"\r\n* LIST (\\HasNoChildren) "/" "Notes"\r\n* LIST (\\HasNoChildren) "/" "Notes/Work"\r\n${tag} OK l\r\n`);
  else if (/^SELECT/i.test(cmd)) { sel = /"([^"]+)"/.exec(cmd)[1]; s.write(`* ${boxes[sel].length} EXISTS\r\n${tag} OK sel\r\n`); }
  else if (/^UID SEARCH/i.test(cmd)) s.write(`* SEARCH ${boxes[sel].map((_, k) => k + 1).join(' ')}\r\n${tag} OK s\r\n`);
  else if (/^UID FETCH (\d+)/i.test(cmd)) { const b = boxes[sel][Number(/FETCH (\d+)/i.exec(cmd)[1]) - 1]; s.write(`* 1 FETCH (UID 1 INTERNALDATE "01-Jun-2026 10:00:00 +0000" BODY[] {${Buffer.byteLength(b)}}\r\n${b})\r\n${tag} OK f\r\n`); }
  else if (/^LOGOUT|^Z /i.test(cmd)) s.end(); else s.write(`${tag} OK\r\n`); } }); s.on('error', () => {}); });
await new Promise((r) => imap.listen(0, '127.0.0.1', r)); const ip = imap.address().port;
let todos = [['u1', 'Call Brian', 'NEEDS-ACTION', '20261020T090000Z'], ['u2', 'Renew licence', 'COMPLETED', '']];
const dav = http.createServer((req, res) => { let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => {
  if (req.headers.authorization !== 'Basic ' + Buffer.from('me@icloud.com:app-pass').toString('base64')) { res.writeHead(401); return res.end(); }
  const U = 'http://127.0.0.1:' + dp, send = (x) => { res.writeHead(207, { 'content-type': 'application/xml' }); res.end('<?xml version="1.0"?><d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">' + x + '</d:multistatus>'); };
  if (req.method === 'PROPFIND' && req.url === '/') return send('<d:response><d:href>/</d:href><d:propstat><d:prop><d:current-user-principal><d:href>/123/principal/</d:href></d:current-user-principal></d:prop></d:propstat></d:response>');
  if (req.method === 'PROPFIND' && req.url === '/123/principal/') return send('<d:response><d:href>/123/principal/</d:href><d:propstat><d:prop><c:calendar-home-set><d:href>' + U + '/123/calendars/</d:href></c:calendar-home-set></d:prop></d:propstat></d:response>');
  if (req.method === 'PROPFIND') return send('<d:response><d:href>/123/calendars/</d:href><d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop></d:propstat></d:response><d:response><d:href>/123/calendars/work/</d:href><d:propstat><d:prop><d:displayname>Work</d:displayname><d:resourcetype><d:collection/><c:calendar/></d:resourcetype><c:supported-calendar-component-set><c:comp name="VEVENT"/></c:supported-calendar-component-set></d:prop></d:propstat></d:response><d:response><d:href>/123/calendars/rem/</d:href><d:propstat><d:prop><d:displayname>Errands</d:displayname><d:resourcetype><d:collection/><c:calendar/></d:resourcetype><c:supported-calendar-component-set><c:comp name="VTODO"/></c:supported-calendar-component-set></d:prop></d:propstat></d:response>');
  if (req.method === 'REPORT') return send(todos.map((t) => '<d:response><d:href>/123/calendars/rem/' + t[0] + '.ics</d:href><d:propstat><d:prop><c:calendar-data>BEGIN:VCALENDAR\nBEGIN:VTODO\nUID:' + t[0] + '\nSUMMARY:' + t[1] + '\nSTATUS:' + t[2] + '\n' + (t[3] ? 'DUE:' + t[3] + '\n' : '') + 'END:VTODO\nEND:VCALENDAR</c:calendar-data></d:prop></d:propstat></d:response>').join(''));
  res.writeHead(404); res.end(); }); });
await new Promise((r) => dav.listen(0, '127.0.0.1', r)); const dp = dav.address().port;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), APPLE_IMAP_HOST: '127.0.0.1', APPLE_IMAP_PORT: String(ip), APPLE_IMAP_SECURITY: 'none', APPLE_CALDAV_URL: 'http://127.0.0.1:' + dp } });
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
let cookie = ''; { const r = await fetch(B + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: 'pw' }) }); cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; '); }
const api = async (m, p, b) => { const r = await fetch(B + p, { method: m, headers: { cookie, 'x-aos': '1', ...(b ? { 'content-type': 'application/json' } : {}) }, body: b ? JSON.stringify(b) : undefined }); let j = null; try { j = await r.json(); } catch {} return { s: r.status, j }; };
const NB = path.join(data, 'fs', 'notes'), rj = (f) => JSON.parse(fs.readFileSync(path.join(NB, f), 'utf8'));
const nbOf = () => rj('notebooks/' + rj('library.json').notebooks[0] + '.json');
const pages = () => nbOf().sections.flatMap((s) => s.pages.map((p) => ({ ...p, section: s.name })));
try {
  await t('not configured gives a clear 409', async () => { const r = await api('POST', '/api/apple/sync'); assert.equal(r.s, 409); });
  await t('settings keep the password hidden', async () => { const r = await api('PUT', '/api/settings', { apple: { user: 'me@icloud.com', pass: 'bad' } }); assert.equal(r.s, 200); assert.equal(r.j.apple.passSet, true); assert.ok(!JSON.stringify(r.j).includes('bad')); });
  await t('a wrong app-specific password is reported, nothing is written', async () => { const r = await api('POST', '/api/apple/sync'); assert.equal(r.s, 200); assert.match(r.j.errors.notes, /app password|accept/i); assert.match(r.j.errors.reminders, /app-specific/); assert.ok(!fs.existsSync(path.join(NB, 'library.json'))); });
  await t('sync brings notes and reminders into a notebook called Apple', async () => {
    await api('PUT', '/api/settings', { apple: { pass: 'app-pass' } }); const r = await api('POST', '/api/apple/sync'); assert.equal(r.s, 200, JSON.stringify(r.j)); assert.equal(r.j.notes, 3); assert.equal(r.j.reminders, 1); assert.equal(r.j.added, 4);
    const nb = nbOf(); assert.equal(nb.name, 'Apple'); const ps = pages(); assert.deepEqual(ps.map((p) => p.section + '/' + p.title).sort(), ['Notes/Fuel budget', 'Notes/Safari – plan', 'Reminders/Errands', 'Work/Weekly']);
    const fb = rj('pages/' + ps.find((p) => p.title === 'Fuel budget').id + '.json'); assert.match(fb.outlines[0].html, /Diesel — plan/); assert.match(fb.outlines[0].html, /<b>Check<\/b>/); assert.ok(!/<div|<head|<html/i.test(fb.outlines[0].html));
    const rem = rj('pages/' + ps.find((p) => p.title === 'Errands').id + '.json'); assert.match(rem.outlines[0].html, /☐ Call Brian/); assert.match(rem.outlines[0].html, /2026-10-20 09:00/); assert.match(rem.outlines[0].html, /<h3>Done<\/h3><p>☑ Renew licence/);
  });
  await t('running again changes nothing; an edited note updates its page instead of duplicating', async () => {
    let r = await api('POST', '/api/apple/sync'); assert.equal(r.j.added, 0); assert.equal(r.j.updated, 0); assert.equal(pages().length, 4);
    boxes.Notes[0] = NOTE('n-1', 'Fuel budget', '<div>Diesel plan v2</div>'); todos.push(['u3', 'Book trip', 'NEEDS-ACTION', '']);
    r = await api('POST', '/api/apple/sync'); assert.equal(r.j.updated, 2); assert.equal(r.j.added, 0); assert.equal(pages().length, 4);
    const fb = rj('pages/' + pages().find((p) => p.title === 'Fuel budget').id + '.json'); assert.match(fb.outlines[0].html, /v2/); assert.match(rj('pages/' + pages().find((p) => p.title === 'Errands').id + '.json').outlines[0].html, /Book trip/);
  });
  await t('the iPhone Shortcut can push notes and reminders to the same notebook', async () => {
    const r = await api('POST', '/api/apple/import', { notes: [{ id: 'sc-1', title: 'From phone', body: 'line one\nline two', folder: 'Shortcut', modified: '2026-10-01T10:00:00Z' }], reminders: [{ id: 'r1', title: 'Pay rent', list: 'Home', due: '2026-11-01' }, { id: 'r2', title: 'Done thing', list: 'Home', done: true }] });
    assert.equal(r.s, 200); assert.equal(r.j.added, 2); const p = pages().find((x) => x.title === 'From phone'); assert.equal(p.section, 'Shortcut'); assert.match(rj('pages/' + p.id + '.json').outlines[0].html, /<p>line one<\/p><p>line two<\/p>/);
    const h = rj('pages/' + pages().find((x) => x.title === 'Home').id + '.json'); assert.match(h.outlines[0].html, /☐ Pay rent/); assert.match(h.outlines[0].html, /☑ Done thing/);
  });
  await t('the connection test reads the reminder lists; status shows the last run', async () => { const r = await api('POST', '/api/settings/test', { target: 'apple' }); assert.equal(r.j.connected, true); assert.equal(r.j.resources, 1); const s = await api('GET', '/api/apple'); assert.ok(s.j.last); });
  await t('needs sign-in', async () => { assert.equal((await fetch(B + '/api/apple')).status, 401); });
} finally { srv.kill(); imap.close(); dav.close(); }
console.log(`\n${pass} passed, ${failed} failed`); if (failed) { console.log(log.slice(-1500)); process.exit(1); } process.exit(0);
