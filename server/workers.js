/* A small runtime for Puter "workers": the server-side scripts some Suite apps deploy (the Calendar's RSVP and booking endpoint).
 * The script is the app's own, run unchanged in a locked-down sandbox: no network, no files, no process. It gets its own key-value store
 * and a mailer that sends through your SMTP server. Public routes are served on this server's own address. */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { DATA, SUITE } from './config.js';
import { httpError, readBody, clientIp } from './util.js';
import { publicOrigin } from './origin.js';
import * as mail from './mail.js';

const DIR = path.join(DATA, 'workers'); fs.mkdirSync(DIR, { recursive: true });
const REG = path.join(DIR, 'registry.json');
let registry = {}; try { registry = JSON.parse(fs.readFileSync(REG, 'utf8')); } catch {}
const saveReg = () => { fs.writeFileSync(REG + '.tmp', JSON.stringify(registry, null, 1), { mode: 0o600 }); fs.renameSync(REG + '.tmp', REG); };
const NAME = /^[a-z0-9][a-z0-9-]{1,40}$/;
const globRe = (p) => new RegExp('^' + String(p).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');

/* ---------- the worker's key-value store (its own namespace) ---------- */
class KV {
  constructor(file, parse) { this.file = file; this.parse = parse; this.d = {}; this.exp = {}; this.t = null; try { const o = JSON.parse(fs.readFileSync(file, 'utf8')); this.d = o.d || {}; this.exp = o.exp || {}; } catch {} }
  save() { clearTimeout(this.t); this.t = setTimeout(() => { const now = Date.now(); for (const k of Object.keys(this.exp)) if (this.exp[k] <= now) { delete this.exp[k]; delete this.d[k]; } fs.writeFile(this.file + '.tmp', JSON.stringify({ d: this.d, exp: this.exp }), { mode: 0o600 }, (e) => { if (!e) fs.rename(this.file + '.tmp', this.file, () => {}); }); }, 200); }
  live(k) { if (this.exp[k] && this.exp[k] <= Date.now()) { delete this.d[k]; delete this.exp[k]; return false; } return Object.hasOwn(this.d, k); }
  val(k) { return this.parse(this.d[k]); }
  ck(k) { if (typeof k !== 'string' || !k || k.length > 1024) throw new Error('Bad key'); return k; }
  api() {
    const kv = this;
    return Object.freeze({
      get: async (k) => (kv.live(kv.ck(k)) ? kv.val(k) : null),
      set: async (k, v) => {
        const put = (key, val) => { const s = JSON.stringify(val ?? null); if (s.length > 4 * 1024 * 1024) throw new Error('Value too large'); kv.d[kv.ck(key)] = s; delete kv.exp[key]; };
        if (Array.isArray(k)) { if (k.length > 5000) throw new Error('Too many keys'); for (const e of k) put(e.key, e.value); } else put(k, v);
        kv.save(); return true;
      },
      del: async (k) => { for (const key of [].concat(k)) { delete kv.d[kv.ck(key)]; delete kv.exp[key]; } kv.save(); return true; },
      list: async (pattern, withValues) => {
        if (typeof pattern === 'boolean') { withValues = pattern; pattern = '*'; }
        const re = globRe(pattern || '*'), keys = Object.keys(kv.d).filter((k) => kv.live(k) && re.test(k)).sort();
        return withValues ? keys.map((key) => ({ key, value: kv.val(key) })) : keys;
      },
      incr: async (k, by = 1) => { const n = (kv.live(kv.ck(k)) ? Number(kv.val(k)) || 0 : 0) + (Number(by) || 0); kv.d[k] = JSON.stringify(n); kv.save(); return n; },
      expire: async (k, secs) => { if (kv.live(kv.ck(k))) { kv.exp[k] = Date.now() + Math.max(1, Number(secs) || 1) * 1000; kv.save(); } return true; }
    });
  }
}

/* ---------- compile a worker into a sandbox ---------- */
const loaded = new Map(); // name -> { mtime, routes, ctx, kv }
function sourcePath(rec) { return path.join(path.dirname(DIR), 'fs', ...rec.path.split('/').filter(Boolean)); }
function compile(name, rec) {
  const abs = sourcePath(rec); const st = fs.statSync(abs); const src = fs.readFileSync(abs, 'utf8');
  if (src.length > 1.5 * 1024 * 1024) throw httpError(413, 'Worker script is too large');
  const routes = [];
  const add = (method) => (p, h) => { if (typeof p !== 'string' || typeof h !== 'function') throw new Error('router: bad route'); const names = []; const re = new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/:([A-Za-z_]\w*)/g, (_m, n) => { names.push(n); return '([^/]+)'; }) + '/?$'); routes.push({ method, re, names, h }); return router; };
  const router = { get: add('GET'), post: add('POST'), put: add('PUT'), delete: add('DELETE'), patch: add('PATCH'), options: add('OPTIONS'), head: add('HEAD') };
  const sandbox = {
    router, Response, Request, Headers, URL, URLSearchParams, TextEncoder, TextDecoder, crypto: globalThis.crypto, AbortController, atob, btoa, setTimeout, clearTimeout, structuredClone,
    console: { log() {}, info() {}, debug() {}, warn: (...a) => console.warn('[worker ' + name + ']', ...a), error: (...a) => console.error('[worker ' + name + ']', ...a) }
  };
  const ctx = vm.createContext(sandbox, { name: 'worker-' + name, codeGeneration: { strings: false, wasm: false } });
  const parse = vm.runInContext('(function (s) { return JSON.parse(s); })', ctx);
  const kv = loaded.get(name)?.kv || new KV(path.join(DIR, name + '.kv.json'), parse);
  kv.parse = parse;
  const sender = async (m) => { // me.puter.email.send: your SMTP server
    const r = await mail.sendMail({ to: m.to, subject: m.subject, text: m.text, html: m.html, replyTo: m.replyTo, attachments: m.attachments });
    return { delivered: [].concat(m.to), messageId: r.messageId };
  };
  sandbox.me = { puter: { kv: kv.api(), email: Object.freeze({ send: sender }) } };
  vm.runInContext(src, ctx, { filename: name + '.js', timeout: 3000 });
  const w = { mtime: st.mtimeMs, routes, ctx, kv }; loaded.set(name, w); return w;
}
function workerFor(name) {
  const rec = registry[name]; if (!rec) return null;
  let w = loaded.get(name);
  try { if (!w || fs.statSync(sourcePath(rec)).mtimeMs !== w.mtime) w = compile(name, rec); }
  catch (e) { console.error('[workers] could not load', name, e.message); return null; }
  return w;
}
const activeName = () => Object.keys(registry).sort((a, b) => registry[b].created - registry[a].created)[0] || null;

/* ---------- registration (from a signed-in app) ---------- */
export function createWorker(nameIn, pathIn, user) {
  const name = String(nameIn || '').toLowerCase(); if (!NAME.test(name)) throw httpError(400, 'Worker names use letters, digits and hyphens', 'bad_name');
  const p = String(pathIn || '').replace(/\\/g, '/').replace(/^~/, ''); if (!p || p.includes('..')) throw httpError(400, 'Bad path', 'bad_path');
  const parts = p.split('/').filter(Boolean); if (parts[0] && String(user.username).toLowerCase() === parts[0].toLowerCase()) parts.shift();
  const rec = { path: '/' + parts.join('/'), created: registry[name]?.created || Date.now(), owner: user.username };
  if (!fs.existsSync(sourcePath(rec))) throw httpError(404, 'Worker script not found', 'subject_does_not_exist');
  const prev = registry[name]; registry[name] = rec;
  try { compile(name, rec); } catch (e) { if (prev) registry[name] = prev; else delete registry[name]; throw httpError(400, 'The worker script could not start: ' + String(e.message).slice(0, 200), 'worker_error'); }
  saveReg(); return { name, file_path: rec.path };
}
export function getWorker(name) { const r = registry[String(name)]; return r ? { name, file_path: r.path } : null; }
export function deleteWorker(name) { if (registry[name]) { delete registry[name]; loaded.delete(name); saveReg(); fsp.rm(path.join(DIR, name + '.kv.json'), { force: true }).catch(() => {}); } return true; }
export const listWorkers = () => Object.entries(registry).map(([name, r]) => ({ name, file_path: r.path }));

/* ---------- public side ---------- */
const PUBLIC = /^\/(?:rsvp|book|booking)\/[^/]+(?:\/[a-z]+)?$|^\/api\/(?:rsvp|book|booking)\/[^/]+(?:\/(?:guests|slots|cancel))?$|^\/admin\/(?:ping|sync|responses|revoke|suggestions\/dismiss|booking\/(?:sync|list|cancel))$/;
export const isWorkerPath = (p) => PUBLIC.test(p);
const hits = new Map();
function limited(ip, key, max, windowMs = 60000) {
  const now = Date.now(), k = ip + '|' + key, a = (hits.get(k) || []).filter((t) => now - t < windowMs); a.push(now); hits.set(k, a);
  if (hits.size > 5000) for (const [kk, v] of hits) if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(kk);
  return a.length > max;
}
const bodyless = new Set(['GET', 'HEAD']);
export async function handleWorkerRequest(req, res, url) {
  const name = activeName(); const origin = publicOrigin();
  const fail = (code, error) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify({ error })); };
  if (!name) return fail(404, 'not_found');
  if (!origin) return fail(503, 'not_ready');
  const ip = clientIp(req), admin = url.pathname.startsWith('/admin/'), write = !bodyless.has(req.method);
  if (limited(ip, admin ? 'a' : 'g', admin ? 60 : 180) || (write && !admin && limited(ip, 'w', 20))) { res.setHeader('retry-after', '60'); return fail(429, 'rate_limited'); }
  const w = workerFor(name); if (!w) return fail(503, 'worker_unavailable');
  for (const r of w.routes) {
    if (r.method !== req.method && !(req.method === 'HEAD' && r.method === 'GET')) continue;
    const m = r.re.exec(url.pathname); if (!m) continue;
    const params = {}; r.names.forEach((n, i) => { try { params[n] = decodeURIComponent(m[i + 1]); } catch { params[n] = m[i + 1]; } });
    let body; if (write) { try { body = await readBody(req, admin ? 6 * 1024 * 1024 : 128 * 1024); } catch (e) { return fail(e.status || 400, 'too_large'); } }
    const headers = new Headers(); for (const [k, v] of Object.entries(req.headers)) if (!/^(host|connection|content-length|transfer-encoding|cookie|upgrade)$/i.test(k) && typeof v === 'string') headers.set(k, v);
    let request; try { request = new Request(origin + url.pathname + url.search, { method: req.method === 'HEAD' ? 'GET' : req.method, headers, body: write && body.length ? body : undefined }); } catch { return fail(400, 'bad_request'); }
    try {
      const out = await Promise.race([Promise.resolve(r.h({ request, params, me: w.ctx.me, user: null })), new Promise((_, rej) => setTimeout(() => rej(new Error('worker timed out')), 20000))]);
      const resp = out instanceof Response ? out : new Response(JSON.stringify(out ?? null), { headers: { 'content-type': 'application/json' } });
      const h = {}; resp.headers.forEach((v, k) => { h[k] = v; });
      const buf = Buffer.from(await resp.arrayBuffer());
      h['x-content-type-options'] = 'nosniff'; if (!h['cache-control']) h['cache-control'] = 'no-store';
      res.writeHead(resp.status, h); return res.end(req.method === 'HEAD' ? undefined : buf);
    } catch (e) { console.error('[workers]', name, req.method, url.pathname, e.message); return fail(500, 'internal'); }
  }
  return fail(404, 'not_found');
}

/* The guest pages (RSVP and booking). They live in the Calendar app; they are served without sign-in and talk only to this address. */
const PAGES = { '/rsvp.html': 'rsvp.html', '/book.html': 'book.html' };
const GUEST_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const WORKER_RE = '/^https:\\/\\/[a-z0-9][a-z0-9-]*\\.puter\\.work$/.test(worker)';
const PATCHES = { 'book.html': [["route ? 'https://cal-' + route[1] + '.puter.work' : (params.get('w') || '')", "route ? location.origin : (params.get('w') || '')"], [WORKER_RE, '(worker === location.origin)']], 'rsvp.html': [[WORKER_RE, '(worker === location.origin)']] };
const cache = new Map();
export function guestPage(p) {
  const file = PAGES[p]; if (!file) return null;
  const abs = path.join(SUITE, 'apps', 'calendar', file); let st; try { st = fs.statSync(abs); } catch { return null; }
  const c = cache.get(file); if (c && c.m === st.mtimeMs) return c.html;
  let html = fs.readFileSync(abs, 'utf8');
  for (const [from, to] of PATCHES[file]) { if (!html.includes(from)) { console.error(`[workers] guest page ${file} did not match the expected code; refusing to serve it`); return null; } html = html.split(from).join(to); }
  cache.set(file, { m: st.mtimeMs, html }); return html;
}
export function serveGuestPage(req, res, p) {
  const html = guestPage(p);
  if (!html) { res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('This page is not available.'); }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', 'content-security-policy': GUEST_CSP, 'referrer-policy': 'no-referrer', 'x-robots-tag': 'noindex, nofollow' });
  res.end(req.method === 'HEAD' ? undefined : html);
}
export const isGuestPage = (p) => Object.hasOwn(PAGES, p);
