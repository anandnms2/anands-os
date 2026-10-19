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
async function folderMessages(cmd, folder, keep, onMsg, after = 0) {
  await cmd('SELECT ' + q(folder)); const sr = (await cmd('UID SEARCH ALL')).toString('latin1'); const all = ((/\* SEARCH([\d ]*)/.exec(sr) || [])[1] || '').trim().split(/\s+/).filter(Boolean).map(Number);
  const uids = all.filter((u) => u > after).slice(-keep);
  for (const uid of uids) {
    const raw = await cmd(`UID FETCH ${uid} (BODY.PEEK[] INTERNALDATE)`); const head = raw.subarray(0, 400).toString('latin1'); const m = /\{(\d+)\}\r\n/.exec(head); if (!m) continue;
    const start = m.index + m[0].length; const body = raw.subarray(start, start + Number(m[1])); const d = /INTERNALDATE "([^"]+)"/.exec(head) || /INTERNALDATE "([^"]+)"/.exec(raw.subarray(start + Number(m[1])).toString('latin1')); let when = d ? new Date(d[1]) : null; if (!when || isNaN(when)) { const dh = /^date:[ \t]*(.+)$/im.exec(body.subarray(0, 8192).toString('latin1')); when = dh ? new Date(dh[1]) : null; } await onMsg(uid, body, when && !isNaN(when) ? when : new Date());
  }
  return all.length ? Math.max(...all) : after;
}
async function sentFolder(cmd) {
  const l = (await cmd('LIST "" "*"')).toString('latin1').split('\r\n'); let best = null;
  for (const line of l) { const m = /^\* LIST \(([^)]*)\) (?:"[^"]*"|NIL) (.+)$/.exec(line); if (!m) continue; const name = m[2].replace(/^"|"$/g, ''); if (/\\Sent/i.test(m[1])) return name; if (/^(\[Gmail\]\/Sent Mail|Sent|Sent Items|Sent Messages|INBOX\.Sent)$/i.test(name)) best = best || name; }
  return best;
}

/* ---------- storage ----------
 * The Email app reads <.mail>/<box>/<YYYY-MM-DD>/<uuid7>--<base64url(subject)> (no extension), newest name first.
 * The name is built from the message date, so it sorts by time; the last part of the uuid carries the account id and a hash of the
 * folder and UID, which makes a re-sync overwrite the same file and lets deleting an account find its mail. */
const rfc2047 = (v) => String(v).replace(/=\?([\w-]+)\?([bq])\?([^?]*)\?=/gi, (_, cs, enc, t) => { try { const bytes = enc.toLowerCase() === 'b' ? Buffer.from(t, 'base64') : Buffer.from(t.replace(/_/g, ' ').replace(/=([0-9a-f]{2})/gi, (x, h) => String.fromCharCode(parseInt(h, 16))), 'latin1'); return new TextDecoder(/utf-?8|us-ascii/i.test(cs) ? 'utf-8' : cs, { fatal: false }).decode(bytes); } catch { return t; } }).replace(/\?=\s+=\?/g, '');
function subjectOf(raw) { const head = raw.subarray(0, 65536).toString('latin1').split(/\r?\n\r?\n/)[0].replace(/\r?\n[ \t]+/g, ' '); const m = /^subject:[ \t]*(.*)$/im.exec(head); return m ? rfc2047(m[1]).trim().slice(0, 200) : ''; }
export function mailName(a, tag, uid, raw, date) {
  const h = crypto.createHash('sha1').update(a.id + ':' + tag + ':' + uid).digest(), n = Buffer.alloc(10); h.copy(n, 0, 0, 10); n[0] = (n[0] & 15) | 112; n[2] = (n[2] & 63) | 128; Buffer.from(a.id, 'hex').copy(n, 4);
  const ts = Math.max(0, date.getTime()).toString(16).padStart(12, '0'), x = n.toString('hex');
  const id = `${ts.slice(0, 8)}-${ts.slice(8, 12)}-${x.slice(0, 4)}-${x.slice(4, 8)}-${x.slice(8)}`;
  return { day: date.toISOString().slice(0, 10), name: id + '--' + Buffer.from(subjectOf(raw), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') };
}
async function put(box, a, tag, uid, body, date) { const { day, name } = mailName(a, tag, uid, body, date), dir = path.join(MAIL, box, day); await fsp.mkdir(dir, { recursive: true }); const f = path.join(dir, name); await fsp.writeFile(f, body); try { await fsp.utimes(f, date, date); } catch {} return { day, name }; }
/* Older versions saved flat acc-<id>-<uid>.eml files, which the Email app cannot see. */
async function dropLegacy(a) { for (const d of ['objects', 'sent']) { try { for (const f of await fsp.readdir(path.join(MAIL, d))) if (f.startsWith('acc-' + a.id + '-')) await fsp.rm(path.join(MAIL, d, f), { force: true }); } catch {} } }
async function dropAccountMail(a) { let dirs = ['objects', 'sent', 'archive', 'trash']; try { dirs = (await fsp.readdir(MAIL)).filter((x) => x !== 'drafts'); } catch {} for (const d of dirs) { let days = []; try { days = await fsp.readdir(path.join(MAIL, d)); } catch { continue; } for (const day of days) { const dd = path.join(MAIL, d, day); let fl = []; try { fl = await fsp.readdir(dd); } catch { continue; } for (const f of fl) if (/^[0-9a-f-]{36}--/.test(f) && f.slice(24, 32) === a.id) await fsp.rm(path.join(dd, f), { force: true }); try { await fsp.rmdir(dd); } catch {} } } await dropLegacy(a); }

/* ---------- Gmail: the same folders and labels you see in Gmail ----------
 * Gmail keeps one copy of each message in All Mail and tags it with labels. Here that becomes:
 *   Inbox (Primary tab), Promotions, Social, Updates, Forums  -> mail with the Inbox label, by its Gmail tab
 *   Sent, Archive (= Done: no Inbox label), Trash             -> as in Gmail
 *   one folder per label you made, and All Mail               -> extra links to the same message
 * Spam and drafts are skipped. Done (Archive) and Delete in the Email app are written back to Gmail on the next check, and label or
 * tab changes made in Gmail move the message here. */
const SYS = new Set(['inbox', 'sent', 'trash', 'spam', 'draft', 'drafts', 'starred', 'important', 'unread', 'muted', 'opened', 'seen', 'chat']);
const CATS = [['promotions', 'Promotions', 'bell'], ['social', 'Social', 'user'], ['updates', 'Updates', 'info'], ['forums', 'Forums', 'mail']];
const INBOXISH = ['objects', ...CATS.map((c) => c[0])], ALLBOX = [...INBOXISH, 'archive', 'trash', 'sent'];
const lab = (t) => String(t).replace(/^\\+/, '');
const slug = (l) => 'lbl-' + (String(l).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'x') + '-' + crypto.createHash('sha1').update(String(l)).digest('hex').slice(0, 4);
function parseMeta(txt) {
  const m = /X-GM-LABELS \(((?:[^()"]|"(?:[^"\\]|\\.)*")*)\)/.exec(txt), labels = m ? [...m[1].matchAll(/"((?:[^"\\]|\\.)*)"|(\S+)/g)].map((x) => (x[1] !== undefined ? x[1].replace(/\\(.)/g, '$1') : x[2])) : [];
  const f = /FLAGS \(([^)]*)\)/.exec(txt); return { labels, flags: f ? f[1] : '' };
}
function boxFor(labels, cat) { const k = new Set(labels.map((l) => lab(l).toLowerCase())); if (k.has('spam') || ((k.has('draft') || k.has('drafts')) && !k.has('inbox'))) return null; if (k.has('trash')) return 'trash'; if (k.has('inbox')) return cat && CATS.some((c) => c[0] === cat) ? cat : 'objects'; if (k.has('sent')) return 'sent'; return 'archive'; }
const userLabels = (labels) => labels.map(lab).filter((l) => !SYS.has(l.toLowerCase()) && !/^category_/i.test(l));
const withLabels = (raw, labels, starred) => { const ls = [...labels.map(lab), ...(starred ? ['Starred'] : [])]; return ls.length ? Buffer.concat([Buffer.from('X-Gmail-Labels: ' + ls.join(',').replace(/[\r\n]/g, ' ') + '\r\n'), raw]) : raw; };
async function allMailFolder(cmd) { for (const line of (await cmd('LIST "" "*"')).toString('latin1').split('\r\n')) { const m = /^\* LIST \(([^)]*)\) (?:"[^"]*"|NIL) (.+)$/.exec(line); if (m && /\\All/i.test(m[1])) return m[2].replace(/^"|"$/g, ''); } return null; }
const imapDate = (d) => `${String(d.getUTCDate()).padStart(2, '0')}-${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]}-${d.getUTCFullYear()}`;
const exists = async (f) => { try { await fsp.access(f); return true; } catch { return false; } };
const where = (box, e) => path.join(MAIL, box, e.d, e.n);
async function relocate(e, to) { const from = where(e.b, e), dir = path.join(MAIL, to, e.d); try { await fsp.mkdir(dir, { recursive: true }); await fsp.rename(from, path.join(dir, e.n)); e.b = to; return true; } catch { return false; } }
/* Extra folders (one per label, plus All Mail) hold hard links to the same message file. */
async function setLinks(e, wanted) {
  const have = new Set(e.k || []), want = new Set(wanted), src = where(e.b, e);
  for (const k of have) if (!want.has(k)) await fsp.rm(path.join(MAIL, k, e.d, e.n), { force: true });
  for (const k of want) { const dst = path.join(MAIL, k, e.d, e.n); if (have.has(k) && await exists(dst)) continue; try { await fsp.mkdir(path.dirname(dst), { recursive: true }); await fsp.rm(dst, { force: true }); try { await fsp.link(src, dst); } catch { await fsp.copyFile(src, dst); } } catch {} }
  e.k = [...want];
}
const ancestors = (l) => { const parts = String(l).split('/'), out = []; for (let i = 1; i <= parts.length; i++) out.push(parts.slice(0, i).join('/')); return out; };   // "Finance/Banking" is also in "Finance"
const wantedLinks = (e) => (e.b === 'trash' ? [] : ['allmail', ...new Set((e.L || []).flatMap(ancestors).map(slug))]);
async function gmailSync(cmd, a, full) {
  const all = await allMailFolder(cmd); if (!all) return null;
  await cmd('SELECT ' + q(all)); const idx = (a.idx ||= {}); let count = 0;
  /* 1. what you did in the Email app goes back to Gmail */
  for (const [uid, e] of Object.entries(idx)) {
    let to = null; for (const box of ALLBOX) if (box !== e.b && await exists(where(box, e))) { to = box; break; }
    if (!to) continue;   // untouched (or deleted outright: left alone)
    if (await exists(where(e.b, e))) { await fsp.rm(where(e.b, e), { force: true }); for (const k of e.k || []) await fsp.rm(path.join(MAIL, k, e.d, e.n), { force: true }); }   // moved from a label folder: drop the main copy
    try {
      if (INBOXISH.includes(e.b) && to === 'archive') await cmd(`UID STORE ${uid} -X-GM-LABELS (\\Inbox)`);
      else if (to === 'trash' && e.b !== 'trash') await cmd(`UID STORE ${uid} +X-GM-LABELS (\\Trash)`);
      else if (!INBOXISH.includes(e.b) && INBOXISH.includes(to)) { if (e.b === 'trash') await cmd(`UID STORE ${uid} -X-GM-LABELS (\\Trash)`); await cmd(`UID STORE ${uid} +X-GM-LABELS (\\Inbox)`); }
      else if (e.b === 'trash' && to === 'archive') await cmd(`UID STORE ${uid} -X-GM-LABELS (\\Trash)`);
      else if (INBOXISH.includes(e.b) && INBOXISH.includes(to)) { /* moved between tabs: nothing to tell Gmail */ }
      e.b = to; e.k = [];
    } catch {}
  }
  /* 2. which Gmail tab each message is on */
  const keys0 = Object.keys(idx).map(Number), after = full ? 0 : Number(a.gseen || 0), floor = Math.min(...(keys0.length ? keys0 : [0]), after ? after + 1 : 0) || 1, catOf = new Map();
  for (const [c] of CATS) { const r = (await cmd(`UID SEARCH UID ${floor}:* X-GM-RAW "category:${c}"`).catch(() => Buffer.alloc(0))).toString('latin1'); for (const u of ((/\* SEARCH([\d ]*)/.exec(r) || [])[1] || '').trim().split(/\s+/).filter(Boolean)) catOf.set(Number(u), c); }
  /* 3. new mail, with its labels */
  const sr = (await cmd(after ? `UID SEARCH UID ${after + 1}:*` : `UID SEARCH SINCE ${imapDate(new Date(Date.now() - 30 * 864e5))}`)).toString('latin1');
  const uids = ((/\* SEARCH([\d ]*)/.exec(sr) || [])[1] || '').trim().split(/\s+/).filter(Boolean).map(Number).filter((u) => u > after).slice(-(after ? 500 : 200));
  for (const uid of uids) {
    const raw = await cmd(`UID FETCH ${uid} (BODY.PEEK[] INTERNALDATE FLAGS X-GM-LABELS)`); const head = raw.subarray(0, 2000).toString('latin1'); const m = /\{(\d+)\}\r\n/.exec(head); if (!m) continue;
    const start = m.index + m[0].length, body = raw.subarray(start, start + Number(m[1])), tail = raw.subarray(start + Number(m[1])).toString('latin1'), meta = parseMeta(head.slice(0, m.index) + ' ' + tail);
    const box = boxFor(meta.labels, catOf.get(uid)); a.gseen = Math.max(a.gseen || 0, uid); if (!box) continue;
    const d = /INTERNALDATE "([^"]+)"/.exec(head) || /INTERNALDATE "([^"]+)"/.exec(tail); let when = d ? new Date(d[1]) : null; if (!when || isNaN(when)) { const dh = /^date:[ \t]*(.+)$/im.exec(body.subarray(0, 8192).toString('latin1')); when = dh ? new Date(dh[1]) : null; } if (!when || isNaN(when)) when = new Date();
    const prev = idx[uid]; if (prev) { await fsp.rm(where(prev.b, prev), { force: true }); for (const k of prev.k || []) await fsp.rm(path.join(MAIL, k, prev.d, prev.n), { force: true }); }
    const at = await put(box, a, 'g', uid, withLabels(body, userLabels(meta.labels), /\\Flagged/.test(meta.flags)), when);
    const e = (idx[uid] = { b: box, d: at.day, n: at.name, L: userLabels(meta.labels), k: [] }); await setLinks(e, wantedLinks(e)); if (INBOXISH.includes(box)) count++;
  }
  /* 4. label, tab and Inbox changes made in Gmail on mail we already hold */
  const keys = Object.keys(idx).map(Number).sort((x, y) => x - y);
  if (keys.length) {
    const txt = (await cmd(`UID FETCH ${keys[0]}:* (FLAGS X-GM-LABELS)`)).toString('latin1');
    for (const chunk of txt.split(/\r\n(?=\* \d+ FETCH)/)) {
      const u = /UID (\d+)/.exec(chunk); const e = u && idx[u[1]]; if (!e || !(await exists(where(e.b, e)))) continue;
      const meta = parseMeta(chunk), box = boxFor(meta.labels, catOf.get(Number(u[1]))), L = userLabels(meta.labels);
      if (!box) continue; if (box !== e.b) await relocate(e, box);
      if (box !== e.b || JSON.stringify(L) !== JSON.stringify(e.L || []) || !(e.k || []).length || a.lv !== 2) { e.L = L; await setLinks(e, wantedLinks(e)); }
    }
    a.lv = 2;
    if (keys.length > 1500) for (const k of keys.slice(0, keys.length - 1500)) delete idx[k];
  }
  return count;
}
/* What the Email app should show in its sidebar, read by the Email app overlay before it starts. */
export function boxesFor() {
  const gm = accounts.filter((a) => a.gm && a.idx); if (!gm.length) return { main: [], labels: [], dirs: {}, acts: {} };
  const used = new Set(), names = new Map(); for (const a of gm) for (const e of Object.values(a.idx)) { if (INBOXISH.includes(e.b)) used.add(e.b); for (const l of e.L || []) for (const x of ancestors(l)) names.set(slug(x), x); }
  const main = CATS.filter((c) => used.has(c[0]) || true).map(([id, label, icon]) => ({ id, label, icon, box: id })), dirs = {}, acts = {};
  for (const m of main) { dirs[m.id] = m.id; acts[m.id] = ['archive', 'trash']; }
  const labels = [...names].sort((x, y) => x[1].toLowerCase().localeCompare(y[1].toLowerCase())).map(([id, path]) => { const parts = path.split('/'); return { id, label: '\u2003'.repeat(parts.length - 1) + parts[parts.length - 1], icon: 'folder', box: id }; }); labels.unshift({ id: 'allmail', label: 'All Mail', icon: 'folder', box: 'allmail' });
  for (const l of labels) { dirs[l.id] = l.id; acts[l.id] = []; }
  return { main, labels, dirs, acts };
}
const syncing = new Set();
export async function syncOne(a, full = false) {
  if (syncing.has(a.id)) return pub(a); syncing.add(a.id);
  const cfg = { host: a.imapHost, port: a.imapPort, security: a.imapSecurity, user: a.user, pass: a.pass };
  try {
    let count = 0; await dropLegacy(a); a.seen = full ? {} : (a.seen || {});
    await imap(cfg, async (cmd) => {
      const gm = /X-GM-EXT-1/i.test((await cmd('CAPABILITY')).toString('latin1'));
      if (gm) {
        if (!a.gm) { await dropAccountMail(a); a.idx = {}; a.gseen = 0; a.gm = true; }   // switch from the plain Inbox copy to the label-aware copy
        const n = await gmailSync(cmd, a, full); if (n !== null) { count = n; return; }
      }
      a.seen.INBOX = await folderMessages(cmd, 'INBOX', a.seen.INBOX ? 500 : KEEP_INBOX, async (uid, body, date) => { await put('objects', a, 'i', uid, body, date); count++; }, a.seen.INBOX || 0);
      const sf = await sentFolder(cmd); if (sf) a.seen.SENT = await folderMessages(cmd, sf, a.seen.SENT ? 200 : KEEP_SENT, async (uid, body, date) => { await put('sent', a, 's', uid, body, date); }, a.seen.SENT || 0);
    });
    a.lastSync = new Date().toISOString(); a.count = (full || !a.count ? 0 : a.count) + count; a.error = null;
  } catch (e) { a.error = e.message; } finally { syncing.delete(a.id); }
  save(); return pub(a);
}
const timers = new Map();
export async function syncAll() { for (const a of accounts) await syncOne(a); }
if (process.env.NODE_ENV !== 'test') { setTimeout(() => { syncAll().catch(() => {}); }, 20000).unref(); setInterval(() => { syncAll().catch(() => {}); }, 2 * 60000).unref(); }

/* ---------- routes ---------- */
const HOST = /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/i;
const sec = (v, d) => (['ssl', 'starttls', 'none'].includes(v) ? v : d);
export async function handleMailboxes(req, res, url) {
  const p = url.pathname, m = req.method; let x;
  if (p === '/api/mailboxes' && m === 'GET') return json(res, 200, { accounts: list() });
  if (p === '/api/mailboxes/boxes' && m === 'GET') return json(res, 200, boxesFor());
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
    if (x[2] === 'sync' && m === 'POST') return json(res, 200, { account: await syncOne(a, true) });
    if (x[2] === 'default' && m === 'POST') { accounts.forEach((v) => (v.default = v === a)); save(); return json(res, 200, { accounts: list() }); }
    if (!x[2] && m === 'DELETE') { accounts = accounts.filter((v) => v !== a); if (accounts.length && !accounts.some((v) => v.default)) accounts[0].default = true; save(); await dropAccountMail(a); return json(res, 200, { accounts: list() }); }
  }
  throw httpError(404, 'Unknown mailbox route');
}
