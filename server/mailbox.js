/* Your own email accounts for Anands Email. Each account is read over IMAP and its recent mail is stored as .eml files in the same
 * .mail folders the Email app already reads. Mail goes out through the account's own SMTP server. Passwords stay on this server. */
import net from 'node:net';
import tls from 'node:tls';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA } from './config.js';
import { json, readJson, httpError } from './util.js';
import { verifyAccount, validEmail } from './mail.js';

const FILE = path.join(DATA, 'mailboxes.json');
const MAIL = path.join(DATA, 'fs', '.mail');
const KEEP_INBOX = 60, KEEP_SENT = 30, TIMEOUT = 25000;
let accounts = []; try { accounts = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
const save = () => { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(FILE + '.tmp', JSON.stringify(accounts), { mode: 0o600 }); fs.renameSync(FILE + '.tmp', FILE); };
const pub = (a) => ({ id: a.id, label: a.label, address: a.address, user: a.user, imapHost: a.imapHost, imapPort: a.imapPort, imapSecurity: a.imapSecurity, smtpHost: a.smtpHost, smtpPort: a.smtpPort, smtpSecurity: a.smtpSecurity, lastSync: a.lastSync || null, count: a.count || 0, error: a.error || null, default: !!a.default });
export const list = () => accounts.map(pub);
export const defaultAddress = () => (accounts.find((a) => a.default) || accounts[0] || {}).address || null;
export function smtpFor(from) {
  const a = accounts.find((x) => from && x.address.toLowerCase() === String(from).toLowerCase()) || accounts.find((x) => x.default) || accounts[0]; if (!a || !a.smtpHost) return null;
  return { host: a.smtpHost, port: a.smtpPort, security: a.smtpSecurity, user: a.user, pass: a.pass, from: a.address, fromName: a.label };
}

/* ---------- a small IMAP client ---------- */
const q = (s) => '"' + String(s).replace(/[\\"]/g, '\\$&') + '"';
function open(cfg) {
  return new Promise((resolve, reject) => {
    const opts = { host: cfg.host, port: cfg.port }; let sock, done = false;
    const fail = (e) => { if (!done) { done = true; try { sock?.destroy(); } catch {} reject(httpError(502, 'Could not connect to ' + cfg.host + ': ' + (e.code || e.message), 'imap_connect')); } };
    sock = cfg.security === 'ssl' ? tls.connect({ ...opts, servername: cfg.host }, () => { done = true; resolve(sock); }) : net.connect(opts, () => { done = true; resolve(sock); });
    sock.setTimeout(TIMEOUT, () => { fail(new Error('timed out')); }); sock.once('error', fail);
  });
}
async function imap(cfg, fn) {
  let sock = await open(cfg), buf = Buffer.alloc(0), waiter = null, n = 0;
  const onData = (d) => { buf = Buffer.concat([buf, d]); waiter?.(); };
  sock.on('data', onData); sock.on('error', () => waiter?.()); sock.on('close', () => waiter?.());
  const wait = () => new Promise((res, rej) => { const t = setTimeout(() => rej(httpError(504, 'The mail server did not answer', 'imap_timeout')), TIMEOUT); waiter = () => { clearTimeout(t); waiter = null; res(); }; });
  /* Reads until the tagged completion line, skipping over {n} literals. Returns the raw bytes before it. */
  async function readUntil(tag) {
    for (;;) {
      let pos = 0;
      for (;;) {
        const i = buf.indexOf('\r\n', pos); if (i < 0) break;
        const line = buf.subarray(pos, i).toString('latin1'); const lit = /\{(\d+)\}$/.exec(line);
        if (lit) { const end = i + 2 + Number(lit[1]); if (buf.length < end) break; pos = end; continue; }
        if (tag === null || line.startsWith(tag + ' ')) { const out = buf.subarray(0, pos); const rest = buf.subarray(i + 2); buf = Buffer.from(rest); return { raw: out, status: line }; }
        pos = i + 2;
      }
      if (sock.destroyed) throw httpError(502, 'The mail server closed the connection', 'imap_closed');
      await wait();
    }
  }
  const cmd = async (c) => { const tag = 'A' + (++n); sock.write(tag + ' ' + c + '\r\n'); const r = await readUntil(tag); if (!/^\S+ OK/i.test(r.status)) throw httpError(502, r.status.replace(/^\S+ /, '').slice(0, 200), 'imap_' + (r.status.split(' ')[1] || 'error').toLowerCase()); return r.raw; };
  try {
    await readUntil(null); // greeting
    if (cfg.security === 'starttls') { await cmd('STARTTLS'); sock.off('data', onData); sock = tls.connect({ socket: sock, servername: cfg.host }); await new Promise((res, rej) => { sock.once('secureConnect', res); sock.once('error', rej); }); sock.on('data', onData); sock.on('error', () => waiter?.()); }
    try { await cmd(`LOGIN ${q(cfg.user)} ${q(cfg.pass)}`); } catch (e) { if (e.code === 'imap_no' || e.code === 'imap_bad') throw httpError(401, 'The mail server did not accept that email or password. Gmail and iCloud need an app password.', 'imap_auth'); throw e; }
    return await fn(cmd);
  } finally { try { sock.write('Z LOGOUT\r\n'); } catch {} setTimeout(() => { try { sock.destroy(); } catch {} }, 300); }
}
async function folderMessages(cmd, folder, keep, onMsg) {
  await cmd('SELECT ' + q(folder)); const sr = (await cmd('UID SEARCH ALL')).toString('latin1'); const uids = ((/\* SEARCH([\d ]*)/.exec(sr) || [])[1] || '').trim().split(/\s+/).filter(Boolean).map(Number).slice(-keep);
  for (const uid of uids) {
    const raw = await cmd(`UID FETCH ${uid} (BODY.PEEK[] INTERNALDATE)`); const head = raw.subarray(0, 400).toString('latin1'); const m = /\{(\d+)\}\r\n/.exec(head); if (!m) continue;
    const start = m.index + m[0].length; const body = raw.subarray(start, start + Number(m[1])); const d = /INTERNALDATE "([^"]+)"/.exec(raw.subarray(start + Number(m[1])).toString('latin1')); await onMsg(uid, body, d ? new Date(d[1]) : new Date());
  }
}
async function sentFolder(cmd) {
  const l = (await cmd('LIST "" "*"')).toString('latin1').split('\r\n'); let best = null;
  for (const line of l) { const m = /^\* LIST \(([^)]*)\) (?:"[^"]*"|NIL) (.+)$/.exec(line); if (!m) continue; const name = m[2].replace(/^"|"$/g, ''); if (/\\Sent/i.test(m[1])) return name; if (/^(\[Gmail\]\/Sent Mail|Sent|Sent Items|Sent Messages|INBOX\.Sent)$/i.test(name)) best = best || name; }
  return best;
}

/* ---------- storage ---------- */
async function put(dir, name, body, date) { await fsp.mkdir(dir, { recursive: true }); const f = path.join(dir, name); await fsp.writeFile(f, body); try { await fsp.utimes(f, date, date); } catch {} }
export async function syncOne(a) {
  const cfg = { host: a.imapHost, port: a.imapPort, security: a.imapSecurity, user: a.user, pass: a.pass };
  try {
    let count = 0;
    await imap(cfg, async (cmd) => {
      await folderMessages(cmd, 'INBOX', KEEP_INBOX, async (uid, body, date) => { await put(path.join(MAIL, 'objects'), `acc-${a.id}-${uid}.eml`, body, date); count++; });
      const sf = await sentFolder(cmd); if (sf) await folderMessages(cmd, sf, KEEP_SENT, async (uid, body, date) => { await put(path.join(MAIL, 'sent'), `acc-${a.id}-s${uid}.eml`, body, date); });
    });
    a.lastSync = new Date().toISOString(); a.count = count; a.error = null;
  } catch (e) { a.error = e.message; }
  save(); return pub(a);
}
const timers = new Map();
export async function syncAll() { for (const a of accounts) await syncOne(a); }
if (process.env.NODE_ENV !== 'test') setInterval(() => { syncAll().catch(() => {}); }, 5 * 60000).unref();

/* ---------- routes ---------- */
const HOST = /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/i;
const sec = (v, d) => (['ssl', 'starttls', 'none'].includes(v) ? v : d);
export async function handleMailboxes(req, res, url) {
  const p = url.pathname, m = req.method; let x;
  if (p === '/api/mailboxes' && m === 'GET') return json(res, 200, { accounts: list() });
  if (p === '/api/mailboxes' && m === 'POST') {
    const b = await readJson(req, 8192); const address = String(b.address || '').trim(), user = String(b.user || address).trim(), pass = String(b.pass || '');
    if (!validEmail(address)) throw httpError(400, 'Enter a valid email address', 'bad_address'); if (!pass) throw httpError(400, 'Enter the password', 'bad_password');
    const imapHost = String(b.imapHost || '').trim(), smtpHost = String(b.smtpHost || '').trim();
    if (!HOST.test(imapHost)) throw httpError(400, 'Enter the incoming (IMAP) server', 'bad_host'); if (smtpHost && !HOST.test(smtpHost)) throw httpError(400, 'The outgoing (SMTP) server looks wrong', 'bad_host');
    if (accounts.length >= 8) throw httpError(400, 'You can add up to 8 email accounts', 'too_many'); if (accounts.some((a) => a.address.toLowerCase() === address.toLowerCase())) throw httpError(409, 'That account is already added', 'exists');
    const a = { id: crypto.randomBytes(4).toString('hex'), label: String(b.label || address.split('@')[0]).slice(0, 60), address, user, pass, imapHost, imapPort: Number(b.imapPort) || 993, imapSecurity: sec(b.imapSecurity, 'ssl'), smtpHost, smtpPort: Number(b.smtpPort) || 587, smtpSecurity: sec(b.smtpSecurity, 'starttls'), default: !accounts.length };
    await imap({ host: a.imapHost, port: a.imapPort, security: a.imapSecurity, user: a.user, pass: a.pass }, async () => true);
    if (a.smtpHost) { const v = await verifyAccount({ host: a.smtpHost, port: a.smtpPort, security: a.smtpSecurity, user: a.user, pass: a.pass }); if (!v.ok) throw httpError(502, 'Outgoing mail: ' + v.reason, 'smtp_failed'); }
    accounts.push(a); save(); const r = await syncOne(a); return json(res, 201, { account: r });
  }
  if ((x = /^\/api\/mailboxes\/([0-9a-f]{8})(?:\/(sync|default))?$/.exec(p))) {
    const a = accounts.find((v) => v.id === x[1]); if (!a) throw httpError(404, 'No such account', 'not_found');
    if (x[2] === 'sync' && m === 'POST') return json(res, 200, { account: await syncOne(a) });
    if (x[2] === 'default' && m === 'POST') { accounts.forEach((v) => (v.default = v === a)); save(); return json(res, 200, { accounts: list() }); }
    if (!x[2] && m === 'DELETE') { accounts = accounts.filter((v) => v !== a); if (accounts.length && !accounts.some((v) => v.default)) accounts[0].default = true; save(); for (const d of ['objects', 'sent']) { try { for (const f of await fsp.readdir(path.join(MAIL, d))) if (f.startsWith('acc-' + a.id + '-')) await fsp.rm(path.join(MAIL, d, f), { force: true }); } catch {} } return json(res, 200, { accounts: list() }); }
  }
  throw httpError(404, 'Unknown mailbox route');
}
