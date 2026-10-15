/* Outgoing email over your own SMTP server. No dependencies: a small SMTP client (implicit TLS or STARTTLS) and a MIME builder.
 * Nothing is stored except a per-day counter and a short log of recipient + subject + result. */
import net from 'node:net';
import tls from 'node:tls';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA, effective } from './config.js';
import { httpError } from './util.js';

const COUNT_FILE = path.join(DATA, 'mail-count.json'), LOG_FILE = path.join(DATA, 'mail-log.json');
const TIMEOUT = 20000;
let counts = {}, log = [];
try { counts = JSON.parse(fs.readFileSync(COUNT_FILE, 'utf8')); } catch {}
try { log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch {}
const day = () => new Date().toISOString().slice(0, 10);
function saveSoon() { try { fs.writeFileSync(COUNT_FILE, JSON.stringify(counts)); fs.writeFileSync(LOG_FILE, JSON.stringify(log.slice(-60))); } catch {} }

export const configured = () => { const m = effective().mail; return !!(m.host && m.from); };
export function usage() { const m = effective().mail; const used = counts[day()] || 0; return { used, cap: m.dailyCap, remaining: Math.max(0, m.dailyCap - used) }; }
export const recentLog = () => log.slice(-20).reverse();

/* ---------- header and body encoding ---------- */
const clean = (s) => String(s ?? '').replace(/[\r\n\0]+/g, ' ').trim();
const isAscii = (s) => /^[\x20-\x7e]*$/.test(s);
export const encWord = (s) => (isAscii(s) ? s : '=?UTF-8?B?' + Buffer.from(s, 'utf8').toString('base64') + '?=');
export function addr(email, name) { email = clean(email); name = clean(name).replace(/["\\]/g, ''); return name ? `${isAscii(name) ? '"' + name + '"' : encWord(name)} <${email}>` : email; }
const wrap64 = (buf) => buf.toString('base64').replace(/(.{76})/g, '$1\r\n');
const rfcDate = (d = new Date()) => d.toUTCString().replace('GMT', '+0000');
const EMAIL = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;
export const validEmail = (e) => typeof e === 'string' && e.length <= 254 && EMAIL.test(e);

export function buildMessage(m, from) {
  const boundary = (n) => '=_aos_' + n + '_' + crypto.randomBytes(8).toString('hex');
  const domain = (from.email.split('@')[1] || 'localhost').toLowerCase();
  const id = `<${crypto.randomBytes(12).toString('hex')}@${domain}>`;
  const h = [
    `From: ${addr(from.email, m.fromName || from.name)}`, `To: ${(Array.isArray(m.to) ? m.to : [m.to]).map((x) => addr(x)).join(', ')}`,
    ...(m.replyTo ? [`Reply-To: ${addr(m.replyTo)}`] : []),
    `Subject: ${encWord(clean(m.subject).slice(0, 300))}`, `Date: ${rfcDate()}`, `Message-ID: ${id}`, 'MIME-Version: 1.0', 'X-Mailer: Anands OS'
  ];
  for (const [k, v] of Object.entries(m.headers || {})) if (/^[A-Za-z][A-Za-z0-9-]{0,40}$/.test(k)) h.push(`${k}: ${clean(v)}`);
  const text = Buffer.from(String(m.text ?? ''), 'utf8'), html = m.html ? Buffer.from(String(m.html), 'utf8') : null;
  const part = (type, buf) => `Content-Type: ${type}; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap64(buf)}`;
  const alts = [part('text/plain', text)]; if (html) alts.push(part('text/html', html));
  if (m.calendar) alts.push(part(`text/calendar; method=${/^[A-Z]{3,10}$/.test(m.calendar.method) ? m.calendar.method : 'REQUEST'}`, Buffer.from(m.calendar.text, 'utf8')));
  const ab = boundary('alt');
  const altBody = alts.length === 1 ? alts[0] : `Content-Type: multipart/alternative; boundary="${ab}"\r\n\r\n` + alts.map((p) => `--${ab}\r\n${p}\r\n`).join('') + `--${ab}--`;
  const atts = (m.attachments || []).slice(0, 5);
  let body;
  if (!atts.length) body = altBody;
  else {
    const mb = boundary('mix');
    const files = atts.map((a) => { const name = clean(a.filename || 'file').replace(/["\\]/g, ''); const ct = clean(a.contentType || 'application/octet-stream'); const buf = Buffer.isBuffer(a.content) ? a.content : Buffer.from(String(a.content || ''), 'base64'); return `--${mb}\r\nContent-Type: ${ct}; name="${encWord(name)}"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename="${encWord(name)}"\r\n\r\n${wrap64(buf)}\r\n`; }).join('');
    body = `Content-Type: multipart/mixed; boundary="${mb}"\r\n\r\n--${mb}\r\n${altBody}\r\n${files}--${mb}--`;
  }
  return { id, raw: h.join('\r\n') + '\r\n' + body + '\r\n' };
}

/* ---------- SMTP client ---------- */
function connect(cfg) {
  return new Promise((resolve, reject) => {
    const port = cfg.port || (cfg.security === 'ssl' ? 465 : cfg.security === 'none' ? 25 : 587);
    const onErr = (e) => reject(httpError(502, 'Could not reach the mail server: ' + (e.code || e.message), 'smtp_unreachable'));
    const opts = { host: cfg.host, port, servername: cfg.host };
    const sock = cfg.security === 'ssl' ? tls.connect(opts) : net.connect(opts);
    sock.setTimeout(TIMEOUT, () => { sock.destroy(); reject(httpError(504, 'The mail server did not answer in time', 'smtp_timeout')); });
    sock.once('error', onErr); sock.once(cfg.security === 'ssl' ? 'secureConnect' : 'connect', () => { sock.removeListener('error', onErr); resolve(sock); });
  });
}
function reader(getSock) {
  let buf = '', waiting = null, closed = null;
  const feed = (c) => { buf += c.toString('utf8'); pump(); };
  function pump() {
    if (!waiting) return;
    const lines = buf.split('\r\n'); if (lines.length < 2) return;
    let i = 0, code = null; const out = [];
    for (; i < lines.length - 1; i++) { const m = /^(\d{3})([ -])(.*)$/.exec(lines[i]); if (!m) continue; out.push(m[3]); code = Number(m[1]); if (m[2] === ' ') { buf = lines.slice(i + 1).join('\r\n'); const w = waiting; waiting = null; return w.resolve({ code, lines: out }); } }
  }
  const attach = (s) => { s.on('data', feed); s.once('close', () => { closed = true; if (waiting) { const w = waiting; waiting = null; w.reject(httpError(502, 'The mail server closed the connection', 'smtp_closed')); } }); };
  return { attach, next: () => new Promise((resolve, reject) => { if (closed) return reject(httpError(502, 'The mail server closed the connection', 'smtp_closed')); waiting = { resolve, reject }; pump(); }), detach: (s) => s.removeListener('data', feed), reset: () => { buf = ''; } };
}
async function session(cfg, fn) {
  let sock = await connect(cfg); const rd = reader(); rd.attach(sock);
  const send = (line) => sock.write(line + '\r\n');
  const expect = async (ok, what) => { const r = await rd.next(); if (!ok.includes(Math.floor(r.code / 100))) { const e = httpError(r.code >= 500 ? 502 : 503, `${what}: ${r.code} ${r.lines.join(' ').slice(0, 200)}`, r.code >= 500 ? 'smtp_rejected' : 'smtp_temporary'); e.smtp = r.code; throw e; } return r; };
  const cmd = async (line, ok, what) => { send(line); return expect(ok, what); };
  try {
    await expect([2], 'Greeting');
    let ehlo = await cmd('EHLO ' + (process.env.HOSTNAME || 'anands-os.local').replace(/[^A-Za-z0-9.-]/g, ''), [2], 'EHLO');
    if (cfg.security === 'starttls') {
      if (!ehlo.lines.some((l) => /^STARTTLS/i.test(l))) throw httpError(502, 'This server does not offer STARTTLS. Pick another security option, or the one your provider documents.', 'smtp_no_starttls');
      await cmd('STARTTLS', [2], 'STARTTLS'); rd.detach(sock); rd.reset();
      sock = tls.connect({ socket: sock, servername: cfg.host }); await new Promise((res, rej) => { sock.once('secureConnect', res); sock.once('error', (e) => rej(httpError(502, 'TLS failed: ' + e.message, 'smtp_tls'))); });
      sock.setTimeout(TIMEOUT, () => sock.destroy()); rd.attach(sock);
      ehlo = await cmd('EHLO ' + (process.env.HOSTNAME || 'anands-os.local').replace(/[^A-Za-z0-9.-]/g, ''), [2], 'EHLO');
    }
    if (cfg.user) {
      const mech = (ehlo.lines.find((l) => /^AUTH\s/i.test(l)) || '').toUpperCase();
      if (/\bPLAIN\b/.test(mech) || !mech) { try { await cmd('AUTH PLAIN ' + Buffer.from(`\0${cfg.user}\0${cfg.pass}`).toString('base64'), [2], 'Sign-in'); } catch (e) { if (e.smtp === 535 || e.smtp === 534) throw httpError(502, 'The mail server refused the username or password', 'smtp_auth'); throw e; } }
      else if (/\bLOGIN\b/.test(mech)) { try { await cmd('AUTH LOGIN', [3], 'Sign-in'); await cmd(Buffer.from(cfg.user).toString('base64'), [3], 'Sign-in'); await cmd(Buffer.from(cfg.pass).toString('base64'), [2], 'Sign-in'); } catch (e) { if (e.smtp === 535) throw httpError(502, 'The mail server refused the username or password', 'smtp_auth'); throw e; } }
      else throw httpError(502, 'The mail server offers no sign-in method this app supports (PLAIN or LOGIN)', 'smtp_auth');
    }
    const r = await fn({ cmd, send, expect, sock });
    try { send('QUIT'); } catch {}
    return r;
  } finally { try { sock.destroy(); } catch {} }
}
const settingsOrThrow = () => { const m = effective().mail; if (!m.host || !m.from) throw httpError(404, 'Email is not set up. Add your SMTP server in Settings.', 'smtp_not_configured'); return m; };

/* Checks the connection and the login. Sends nothing. */
export async function verify() {
  const m = effective().mail; if (!m.host || !m.from) return { configured: false, connected: false };
  try { await session(m, async () => true); return { configured: true, connected: true, from: m.from, ...usage() }; }
  catch (e) { return { configured: true, connected: false, reason: e.message, code: e.code }; }
}
let queue = Promise.resolve();
/* msg: { to, subject, text, html?, replyTo?, fromName?, calendar?:{method,text}, attachments?, headers? }. Resolves { messageId } or throws. */
export function sendMail(msg) {
  const run = queue.then(() => doSend(msg)); queue = run.catch(() => {}); return run;
}
async function doSend(msg) {
  const m = settingsOrThrow();
  const to = (Array.isArray(msg.to) ? msg.to : [msg.to]).map(clean).filter(Boolean);
  if (!to.length || !to.every(validEmail) || to.length > 20) throw httpError(400, 'Bad recipient address', 'bad_recipient');
  if (msg.replyTo && !validEmail(clean(msg.replyTo))) msg = { ...msg, replyTo: '' };
  const u = usage(); if (u.remaining < to.length) throw httpError(429, `Today's email limit (${u.cap}) is used up. Raise it in Settings or try tomorrow.`, 'daily_limit');
  const { id, raw } = buildMessage({ ...msg, to }, { email: m.from, name: m.fromName });
  if (raw.length > 8 * 1024 * 1024) throw httpError(413, 'The message is too large', 'too_large');
  const entry = { t: new Date().toISOString(), to: to.join(', ').slice(0, 200), subject: clean(msg.subject).slice(0, 120) };
  try {
    await session(m, async ({ cmd, send, expect }) => {
      await cmd(`MAIL FROM:<${m.from}>`, [2], 'Sender');
      for (const r of to) await cmd(`RCPT TO:<${r}>`, [2], 'Recipient ' + r);
      await cmd('DATA', [3], 'DATA');
      send(raw.replace(/\r\n\./g, '\r\n..').replace(/^\./, '..') + '\r\n.');
      await expect([2], 'Message');
    });
  } catch (e) { entry.ok = false; entry.err = String(e.message).slice(0, 160); log.push(entry); saveSoon(); throw e; }
  counts[day()] = (counts[day()] || 0) + to.length; for (const k of Object.keys(counts)) if (k < day() && Object.keys(counts).length > 8) delete counts[k];
  entry.ok = true; log.push(entry); saveSoon();
  return { messageId: id };
}
