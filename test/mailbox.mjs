import crypto from 'node:crypto';
// Anands Email accounts: add a mailbox over IMAP (mock server), sync into the Email app's folders, send through the account's SMTP.
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-mbx-')); const port = 20000 + Math.floor(Math.random() * 20000);
const MSG = (n) => `From: Bob <bob@x.test>\r\nTo: me@x.test\r\nSubject: Hello ${n}\r\nDate: Mon, 01 Jun 2026 10:00:00 +0000\r\n\r\nBody ${n}\r\n`;
const boxes = { INBOX: [MSG(1), MSG(2)], 'Sent Items': [MSG(3)] };
const imap = net.createServer((s) => {
  let sel = 'INBOX', buf = ''; s.write('* OK mock IMAP\r\n');
  s.on('data', (c) => { buf += c; let i; while ((i = buf.indexOf('\r\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 2); const [tag, ...r] = line.split(' '); const cmd = r.join(' ');
    if (/^LOGIN/i.test(cmd)) s.write(cmd.includes('"secret"') ? `${tag} OK in\r\n` : `${tag} NO [AUTHENTICATIONFAILED] bad\r\n`);
    else if (/^SELECT/i.test(cmd)) { sel = /"([^"]+)"/.exec(cmd)[1]; s.write(`* ${boxes[sel].length} EXISTS\r\n${tag} OK sel\r\n`); }
    else if (/^UID SEARCH/i.test(cmd)) s.write(`* SEARCH ${boxes[sel].map((_, k) => k + 1).join(' ')}\r\n${tag} OK s\r\n`);
    else if (/^UID FETCH (\d+)/i.test(cmd)) { const b = boxes[sel][Number(/FETCH (\d+)/i.exec(cmd)[1]) - 1]; s.write(`* 1 FETCH (UID 1 INTERNALDATE "01-Jun-2026 10:00:00 +0000" BODY[] {${Buffer.byteLength(b)}}\r\n${b})\r\n${tag} OK f\r\n`); }
    else if (/^LIST/i.test(cmd)) s.write(`* LIST (\\HasNoChildren) "/" "INBOX"\r\n* LIST (\\HasNoChildren \\Sent) "/" "Sent Items"\r\n${tag} OK l\r\n`);
    else s.write(`${tag} OK\r\n`); } });
});
await new Promise((r) => imap.listen(0, '127.0.0.1', r)); const ip = imap.address().port;

/* A Gmail-like server: one All Mail folder, labels per message, X-GM-EXT-1. */
const gmsgs = [{ uid: 1, labels: ['\\Inbox', 'Work'] }, { uid: 2, labels: ['Receipts'] }, { uid: 3, labels: ['\\Sent'] }, { uid: 4, labels: ['\\Spam'] }, { uid: 5, labels: ['\\Inbox'], cat: 'promotions' }]; const glog = [];
const gbody = (m) => `From: Bob <bob@x.test>\r\nTo: me@x.test\r\nSubject: Gmail ${m.uid}\r\nDate: Mon, 01 Jun 2026 10:00:00 +0000\r\n\r\nBody ${m.uid}\r\n`;
const lbl = (m) => 'X-GM-LABELS (' + m.labels.map((l) => (/^\\/.test(l) ? l : '"' + l + '"')).join(' ') + ')';
const gm = net.createServer((s) => {
  let buf = ''; s.write('* OK gmail-ish\r\n');
  s.on('data', (c) => { buf += c; let i; while ((i = buf.indexOf('\r\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 2); const [tag, ...r] = line.split(' '); const cmd = r.join(' '); let x;
    if (/^LOGIN/i.test(cmd)) s.write(`${tag} OK in\r\n`);
    else if (/^CAPABILITY/i.test(cmd)) s.write(`* CAPABILITY IMAP4rev1 X-GM-EXT-1\r\n${tag} OK c\r\n`);
    else if (/^LIST/i.test(cmd)) s.write(`* LIST (\\HasNoChildren) "/" "INBOX"\r\n* LIST (\\HasNoChildren \\All) "/" "[Gmail]/All Mail"\r\n* LIST (\\HasNoChildren \\Sent) "/" "[Gmail]/Sent Mail"\r\n${tag} OK l\r\n`);
    else if (/^SELECT/i.test(cmd)) s.write(`* ${gmsgs.length} EXISTS\r\n${tag} OK sel\r\n`);
    else if ((x = /^UID SEARCH UID \d+:\* X-GM-RAW "category:(\w+)"/i.exec(cmd))) s.write(`* SEARCH ${gmsgs.filter((m) => m.cat === x[1]).map((m) => m.uid).join(' ')}\r\n${tag} OK s\r\n`);
    else if (/^UID SEARCH/i.test(cmd)) s.write(`* SEARCH ${gmsgs.map((m) => m.uid).join(' ')}\r\n${tag} OK s\r\n`);
    else if ((x = /^UID FETCH (\d+):\* /i.exec(cmd))) s.write(gmsgs.filter((m) => m.uid >= Number(x[1])).map((m, n) => `* ${n + 1} FETCH (UID ${m.uid} FLAGS (\\Seen) ${lbl(m)})\r\n`).join('') + `${tag} OK f\r\n`);
    else if ((x = /^UID FETCH (\d+) /i.exec(cmd))) { const m = gmsgs.find((v) => v.uid === Number(x[1])), b = gbody(m); s.write(`* 1 FETCH (UID ${m.uid} INTERNALDATE "01-Jun-2026 10:00:00 +0000" FLAGS (\\Seen) ${lbl(m)} BODY[] {${Buffer.byteLength(b)}}\r\n${b})\r\n${tag} OK f\r\n`); }
    else if ((x = /^UID STORE (\d+) ([+-])X-GM-LABELS \((.*)\)/i.exec(cmd))) { glog.push(cmd); const m = gmsgs.find((v) => v.uid === Number(x[1])); if (x[2] === '-') m.labels = m.labels.filter((l) => l !== x[3]); else m.labels.push(x[3]); s.write(`${tag} OK st\r\n`); }
    else s.write(`${tag} OK\r\n`); } });
});
await new Promise((r) => gm.listen(0, '127.0.0.1', r)); const gp = gm.address().port;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), PUBLIC_URL: `http://127.0.0.1:${port}` } });
const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); process.exitCode = 1; } };
let cookie = ''; { const r = await fetch(B + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: 'pw' })}); cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; '); }
const api = async (p, o = {}) => { const r = await fetch(B + p, { ...o, headers: { 'content-type': 'application/json', 'x-aos': '1', cookie, ...(o.headers || {}) }, body: o.json ? JSON.stringify(o.json) : undefined }); let j = null; try { j = await r.json(); } catch {} return { s: r.status, j }; };
try {
  const acct = (pass) => ({ address: 'me@x.test', pass, imapHost: '127.0.0.1', imapPort: ip, imapSecurity: 'none' });
  await t('wrong password is refused with a clear message', async () => { const r = await api('/api/mailboxes', { method: 'POST', json: acct('nope') }); assert.equal(r.s, 401); assert.match(r.j.error || r.j.message || '', /app password|accept/); });
  await t('add an account: syncs inbox and sent into the Email app folders', async () => {
    const r = await api('/api/mailboxes', { method: 'POST', json: acct('secret') }); assert.equal(r.s, 201, JSON.stringify(r.j)); assert.equal(r.j.account.count, 2);
    const dir = path.join(data, 'fs', '.mail'); const walk = (b) => fs.readdirSync(path.join(dir, b)).flatMap((d) => fs.readdirSync(path.join(dir, b, d)).map((f) => ({ d, f, p: path.join(dir, b, d, f) })));
    const o = walk('objects'), sn = walk('sent'); assert.equal(o.length, 2); assert.equal(sn.length, 1);
    for (const x of [...o, ...sn]) { assert.match(x.d, /^2026-06-01$/); assert.match(x.f, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}--[A-Za-z0-9_-]+$/, x.f); }
    const subj = Buffer.from(o[0].f.split('--')[1], 'base64url').toString(); assert.match(subj, /^Hello \d$/); assert.match(fs.readFileSync(o[0].p, 'utf8'), /Subject: Hello/);
    const id = (await api('/api/mailboxes')).j.accounts[0].id; assert.equal(o[0].f.slice(24, 32), id);
    await api('/api/mailboxes/' + id + '/sync', { method: 'POST' }); assert.equal(walk('objects').length, 2, 'a re-sync does not duplicate');
  });
  await t('list never exposes the password; default account is set', async () => { const r = await api('/api/mailboxes'); assert.equal(r.j.accounts.length, 1); assert.ok(r.j.accounts[0].default); assert.ok(!JSON.stringify(r.j).includes('secret')); });
  await t('duplicate is refused', async () => { assert.equal((await api('/api/mailboxes', { method: 'POST', json: acct('secret') })).s, 409); });
  await t('delete removes the account and its mail', async () => { const id = (await api('/api/mailboxes')).j.accounts[0].id; const r = await api('/api/mailboxes/' + id, { method: 'DELETE' }); assert.equal(r.j.accounts.length, 0); assert.equal(fs.readdirSync(path.join(data, 'fs', '.mail', 'objects')).length, 0); });
  await t('Gmail: labels become folders (Inbox, Archive, Sent), spam is skipped, other labels are kept in a header', async () => {
    const r = await api('/api/mailboxes', { method: 'POST', json: { address: 'g@x.test', pass: 'secret', imapHost: '127.0.0.1', imapPort: gp, imapSecurity: 'none' } }); assert.equal(r.s, 201, JSON.stringify(r.j));
    const dir = path.join(data, 'fs', '.mail'); const walk = (b) => { try { return fs.readdirSync(path.join(dir, b)).flatMap((d) => fs.readdirSync(path.join(dir, b, d)).map((f) => ({ d, f, p: path.join(dir, b, d, f) }))); } catch { return []; } };
    assert.equal(walk('objects').length, 1); assert.equal(walk('archive').length, 1); assert.equal(walk('sent').length, 1); assert.equal(walk('trash').length, 0); assert.equal(walk('promotions').length, 1); assert.equal(walk('allmail').length, 4); assert.equal(walk('lbl-work-' + crypto.createHash('sha1').update('Work').digest('hex').slice(0, 4)).length, 1);
    const bx = (await api('/api/mailboxes/boxes')).j; assert.ok(bx.main.some((m) => m.id === 'promotions')); assert.ok(bx.labels.some((l) => l.label === 'Work')); assert.ok(bx.labels.some((l) => l.id === 'allmail'));
    assert.match(fs.readFileSync(walk('objects')[0].p, 'utf8'), /^X-Gmail-Labels: Work\r?\n/); assert.match(fs.readFileSync(walk('archive')[0].p, 'utf8'), /^X-Gmail-Labels: Receipts/);
  });
  await t('Gmail: Done in the Email app archives in Gmail; changes made in Gmail move the message here', async () => {
    const id = (await api('/api/mailboxes')).j.accounts.find((x) => x.address === 'g@x.test').id; const dir = path.join(data, 'fs', '.mail');
    const f = fs.readdirSync(path.join(dir, 'objects')).map((d) => ({ d, f: fs.readdirSync(path.join(dir, 'objects', d))[0] }))[0]; fs.mkdirSync(path.join(dir, 'archive', f.d), { recursive: true }); fs.renameSync(path.join(dir, 'objects', f.d, f.f), path.join(dir, 'archive', f.d, f.f));
    await api('/api/mailboxes/' + id + '/sync', { method: 'POST' }); assert.ok(glog.some((c) => /UID STORE 1 -X-GM-LABELS \(\\Inbox\)/.test(c)), glog.join('|'));
    gmsgs[1].labels.push('\\Inbox'); await api('/api/mailboxes/' + id + '/sync', { method: 'POST' });
    const inbox = fs.readdirSync(path.join(dir, 'objects')).flatMap((d) => fs.readdirSync(path.join(dir, 'objects', d))); assert.equal(inbox.length, 1); assert.equal(Buffer.from(inbox[0].split('--')[1], 'base64url').toString(), 'Gmail 2');
    await api('/api/mailboxes/' + id, { method: 'DELETE' });
  });
  await t('requires sign-in', async () => { const r = await fetch(B + '/api/mailboxes'); assert.equal(r.status, 401); });
} finally { srv.kill(); imap.close(); gm.close(); console.log(`${pass} passed`); setTimeout(() => process.exit(process.exitCode || 0), 100); }
