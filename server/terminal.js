/* Terminal: a real shell in the browser. It opens over SSH to your server (or a shell in this container), owner only.
 * Opening asks for the password again, and every session is written to the security log. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { effective, DATA, PASSWORD } from './config.js';
import { json, readJson, httpError } from './util.js';
import { logEvent } from './sessions.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const HELPER = path.join(here, 'ptyhelper.py');
const DIR = path.join(DATA, 'term'); const MAX = 3, IDLE = 30 * 60 * 1000, BUF = 120 * 1024;
const terms = new Map(); const fails = new Map();
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const clamp = (n, lo, hi, d) => { n = Math.round(Number(n)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };

function status() {
  const t = effective().terminal;
  return { host: t.host, port: t.port, user: t.user, keySet: !!t.key, auth: t.auth, passSet: !!t.pass, hostReady: !!(t.host && (t.auth === 'password' || t.key)), pythonOk: fs.existsSync(HELPER), sessions: [...terms.values()].map((x) => ({ id: x.id, target: x.target, started: x.t0 })), needsPassword: !!PASSWORD };
}
function command(target, pw) {
  if (target === 'host') {
    const t = effective().terminal; if (t.auth === 'password') {
      if (!t.host) throw httpError(400, 'Add the server address first.', 'not_configured'); const pass = pw || t.pass; if (!pass) throw httpError(400, 'Enter the server password.', 'need_pass');
      fs.mkdirSync(DIR, { recursive: true, mode: 0o700 });
      return { cmd: 'ssh', args: ['-tt', '-p', String(t.port), '-o', 'PubkeyAuthentication=no', '-o', 'PreferredAuthentications=password,keyboard-interactive', '-o', 'NumberOfPasswordPrompts=1', '-o', 'StrictHostKeyChecking=accept-new', '-o', 'UserKnownHostsFile=' + path.join(DIR, 'known_hosts'), '-o', 'ServerAliveInterval=30', '-o', 'LogLevel=ERROR', `${t.user}@${t.host}`], label: `${t.user}@${t.host}`, pass };
    }
    if (!t.host || !t.key) throw httpError(400, 'Add the server address and private key in Settings first.', 'not_configured');
    fs.mkdirSync(DIR, { recursive: true, mode: 0o700 }); const kf = path.join(DIR, 'id_key'); fs.writeFileSync(kf, t.key.endsWith('\n') ? t.key : t.key + '\n', { mode: 0o600 });
    return { cmd: 'ssh', args: ['-tt', '-i', kf, '-p', String(t.port), '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=accept-new', '-o', 'UserKnownHostsFile=' + path.join(DIR, 'known_hosts'), '-o', 'ServerAliveInterval=30', '-o', 'LogLevel=ERROR', `${t.user}@${t.host}`], label: `${t.user}@${t.host}` };
  }
  fs.mkdirSync(path.join(DIR, 'home'), { recursive: true });
  const sh = ['/bin/bash', '/bin/sh'].find((x) => fs.existsSync(x)) || 'sh'; return { cmd: sh, args: ['-l'], label: 'this container' };
}
function push(t, buf) { t.hist = Buffer.concat([t.hist, buf]); if (t.hist.length > BUF) t.hist = t.hist.subarray(t.hist.length - BUF); const d = buf.toString('base64'); for (const r of t.clients) r.write(`data: ${d}\n\n`); }
function end(t, why) {
  if (t.dead) return; t.dead = true; clearTimeout(t.idle); terms.delete(t.id); try { t.p.kill('SIGKILL'); } catch {}
  for (const r of t.clients) { try { r.write(`event: exit\ndata: ${JSON.stringify({ why })}\n\n`); r.end(); } catch {} } t.clients.clear();
  logEvent(t.req, 'term_close', { user: t.who, note: t.label + ' (' + Math.round((Date.now() - t.t0) / 1000) + ' s)' });
}
const touch = (t) => { clearTimeout(t.idle); t.idle = setTimeout(() => end(t, 'Closed after 30 minutes without activity.'), IDLE); };

export async function handleTerminal(req, res, url, sess) {
  if (sess.role && sess.role !== 'owner') throw httpError(403, 'Only the owner can use the terminal', 'forbidden');
  const p = url.pathname.replace(/^\/api\/term/, '') || '/', m = req.method; let x;
  if (p === '/status' && m === 'GET') return json(res, 200, status());
  if (p === '/open' && m === 'POST') {
    const b = await readJson(req, 2048), key = sess.sid || sess.n || 'owner', f = fails.get(key) || { n: 0, until: 0 };
    if (f.until > Date.now()) throw httpError(429, 'Too many wrong passwords. Try again in a few minutes.', 'rate_limited');
    if (String(b.confirm || '').trim().toUpperCase() !== 'OPEN') throw httpError(400, 'Type OPEN to confirm.', 'confirm_needed');
    if (PASSWORD && !(typeof b.password === 'string' && eq(b.password, PASSWORD))) { f.n++; if (f.n >= 5) { f.until = Date.now() + 10 * 60 * 1000; f.n = 0; } fails.set(key, f); logEvent(req, 'term_denied', { user: sess.n }); throw httpError(401, 'Wrong password', 'bad_password'); }
    fails.delete(key); if (terms.size >= MAX) throw httpError(429, 'Three terminals are already open. Close one first.', 'too_many');
    if (!fs.existsSync(HELPER)) throw httpError(500, 'The terminal helper is missing.');
    fs.mkdirSync(path.join(DIR, 'home'), { recursive: true, mode: 0o700 }); const target = b.target === 'local' ? 'local' : 'host', c = command(target, typeof b.sshpass === 'string' ? b.sshpass.slice(0, 200) : ''), cols = clamp(b.cols, 20, 400, 100), rows = clamp(b.rows, 5, 200, 30);
    const id = crypto.randomBytes(8).toString('hex');
    const proc = spawn('python3', [HELPER, String(cols), String(rows), c.cmd, ...c.args], { stdio: ['pipe', 'pipe', 'pipe', 'pipe'], cwd: path.join(DIR, 'home'), env: { PATH: process.env.PATH, HOME: path.join(DIR, 'home'), TERM: 'xterm-256color', LANG: 'C.UTF-8', SHELL: c.cmd } });
    const t = { id, p: proc, target, label: c.label, hist: Buffer.alloc(0), clients: new Set(), t0: Date.now(), req, who: sess.n, dead: false };
    let sent = false; proc.stdout.on('data', (d) => { push(t, d); if (c.pass && !sent && /pass(word|phrase)[^:\n]*:\s*$/i.test(d.toString().slice(-120))) { sent = true; try { proc.stdin.write(c.pass + '\r'); } catch {} } }); proc.stderr.on('data', (d) => push(t, d)); proc.stdin.on('error', () => {}); proc.stdio[3].on('error', () => {});
    proc.on('error', (e) => { push(t, Buffer.from('\r\nCould not start: ' + e.message + '\r\n')); end(t, 'The terminal could not start.'); });
    proc.on('exit', () => end(t, 'The session ended.')); terms.set(id, t); touch(t);
    logEvent(req, 'term_open', { user: sess.n, note: c.label }); return json(res, 200, { id, label: c.label });
  }
  if ((x = p.match(/^\/([0-9a-f]{16})(\/out|\/in|\/resize)?$/))) {
    const t = terms.get(x[1]); if (!t) throw httpError(404, 'That terminal has closed.', 'gone');
    if (x[2] === '/out' && m === 'GET') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' }); res.write(': ok\n\n');
      if (t.hist.length) res.write(`data: ${t.hist.toString('base64')}\n\n`); t.clients.add(res); const ka = setInterval(() => { try { res.write(': k\n\n'); } catch {} }, 20000);
      req.on('close', () => { clearInterval(ka); t.clients.delete(res); }); return;
    }
    if (x[2] === '/in' && m === 'POST') { const b = await readJson(req, 64 * 1024); touch(t); if (typeof b.d === 'string' && !t.dead) t.p.stdin.write(b.d); return json(res, 200, { ok: true }); }
    if (x[2] === '/resize' && m === 'POST') { const b = await readJson(req, 512); if (!t.dead) t.p.stdio[3].write(`${clamp(b.cols, 20, 400, 100)} ${clamp(b.rows, 5, 200, 30)}\n`); return json(res, 200, { ok: true }); }
    if (!x[2] && m === 'DELETE') { end(t, 'Closed.'); return json(res, 200, { ok: true }); }
  }
  throw httpError(404, 'Unknown terminal route');
}
export function closeAllTerminals() { for (const t of [...terms.values()]) end(t, 'The server is restarting.'); }
