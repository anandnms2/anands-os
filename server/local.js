/* The "local Puter": auth, kv and fs for the Puter apps, backed by /data on this server. */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { DATA, effective } from './config.js';
import { createWorker, getWorker, deleteWorker, listWorkers } from './workers.js';
import { handleMailService } from './calmail.js';
import * as mail from './mail.js';
import { sessionOf, userFromSession } from './session.js';
import { json, readJson, httpError } from './util.js';
import { llmChat } from './chat.js';
import * as dav from './webdav.js';
import { Readable } from 'node:stream';
import { readBody } from './util.js';

const KV_DIR = path.join(DATA, 'kv'), FS_ROOT = path.join(DATA, 'fs');
fs.mkdirSync(KV_DIR, { recursive: true }); fs.mkdirSync(FS_ROOT, { recursive: true });

/* ---------- kv ---------- */
const stores = new Map(), timers = new Map();
const slug = (s) => (/^[a-z0-9][a-z0-9-]{0,39}$/.test(String(s || '')) ? s : 'os');
function store(app) {
  if (stores.has(app)) return stores.get(app);
  let o = {}; try { o = JSON.parse(fs.readFileSync(path.join(KV_DIR, app + '.json'), 'utf8')); } catch {}
  stores.set(app, o); return o;
}
function persist(app) {
  clearTimeout(timers.get(app));
  timers.set(app, setTimeout(() => { const f = path.join(KV_DIR, app + '.json'); fs.writeFile(f + '.tmp', JSON.stringify(store(app)), (e) => { if (!e) fs.rename(f + '.tmp', f, () => {}); }); }, 250));
}
const glob = (p) => new RegExp('^' + String(p).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
function kvOp(app, b) {
  const s = store(app); const key = typeof b.key === 'string' ? b.key : '';
  if (Array.isArray(b.key)) { /* Puter batch forms: get([k]), del([k]), set([{key,value}]) */
    if (b.key.length > 5000) throw httpError(400, 'Too many keys', 'bad_key');
    if (b.op === 'get') return b.key.map((k) => (typeof k === 'string' && Object.hasOwn(s, k) ? s[k] : null));
    if (b.op === 'del') { for (const k of b.key) if (typeof k === 'string') delete s[k]; persist(app); return true; }
    if (b.op === 'set') {
      for (const e of b.key) if (!e || typeof e.key !== 'string' || !e.key || e.key.length > 1024) throw httpError(400, 'Bad key', 'bad_key');
      if (JSON.stringify(b.key).length > 16 * 1024 * 1024) throw httpError(413, 'Value too large');
      for (const e of b.key) s[e.key] = e.value ?? null; persist(app); return true;
    }
    throw httpError(400, 'Bad key', 'bad_key');
  }
  if (b.op !== 'list' && b.op !== 'flush' && (!key || key.length > 1024)) throw httpError(400, 'Bad key', 'bad_key');
  switch (b.op) {
    case 'get': return Object.hasOwn(s, key) ? s[key] : null;
    case 'set': if (JSON.stringify(b.value ?? null).length > 8 * 1024 * 1024) throw httpError(413, 'Value too large'); s[key] = b.value ?? null; persist(app); return true;
    case 'del': delete s[key]; persist(app); return true;
    case 'add': { const cur = s[key]; const add = [].concat(b.value); s[key] = Array.isArray(cur) ? cur.concat(add) : add; persist(app); return s[key]; }
    case 'incr': { const n = (Number(s[key]) || 0) + (Number(b.by) || 0); s[key] = n; persist(app); return n; }
    case 'flush': stores.set(app, {}); persist(app); return true;
    case 'list': { const re = glob(b.pattern || '*'); const ks = Object.keys(s).filter((k) => re.test(k)).sort(); return b.values ? ks.map((k) => ({ key: k, value: s[k] })) : ks; }
    default: throw httpError(400, 'Unknown kv operation');
  }
}

/* ---------- fs ---------- */
function resolve(p, user) {
  let rel = String(p ?? '/').replace(/\\/g, '/').replace(/^~/, '');
  const parts = rel.split('/').filter((x) => x && x !== '.');
  if (parts[0] && user && parts[0].toLowerCase() === String(user.username).toLowerCase()) parts.shift();
  if (parts.some((x) => x === '..')) throw httpError(400, 'Bad path', 'bad_path');
  const abs = path.join(FS_ROOT, ...parts);
  if (abs !== FS_ROOT && !abs.startsWith(FS_ROOT + path.sep)) throw httpError(400, 'Bad path', 'bad_path');
  return { abs, rel: '/' + parts.join('/') };
}
const notFound = () => httpError(404, 'Not found', 'subject_does_not_exist');

/* ---------- /Drive: the Cloudreve mount (WebDAV) ---------- */
function driveRel(p, user) {
  const parts = String(p ?? '/').replace(/\\/g, '/').replace(/^~/, '').split('/').filter((x) => x && x !== '.');
  if (parts[0] && user && parts[0].toLowerCase() === String(user.username).toLowerCase()) parts.shift();
  if (!parts[0] || parts[0].toLowerCase() !== 'drive') return null;
  if (parts.some((x) => x === '..')) throw httpError(400, 'Bad path', 'bad_path');
  return '/' + parts.slice(1).join('/');
}
const dpath = (rel) => '/Drive' + (rel === '/' ? '' : rel);
function dObj(e) { const pp = dpath(e.path), id = crypto.createHash('sha1').update(pp).digest('hex').slice(0, 16); return { id, uid: id, name: e.path === '/' ? 'Drive' : e.name, path: pp, is_dir: e.dir, size: e.size, modified: e.modified, created: e.modified }; }
function fileHeaders(name, size, extra = {}) {
  const type = mime(name); const safe = /^(image\/(png|jpeg|gif|webp)|audio|video|application\/pdf|text\/plain|text\/csv|application\/json)/.test(type);
  const h = { 'content-type': type, 'cache-control': 'private, no-cache', 'x-content-type-options': 'nosniff', ...(safe ? {} : { 'content-disposition': 'attachment' }), ...extra };
  if (size != null) h['content-length'] = size; return h;
}
async function driveGet(req, res, rel) {
  const r = await dav.read(rel, req.headers.range);
  const extra = {}; for (const k of ['content-range', 'accept-ranges']) if (r.headers.get(k)) extra[k] = r.headers.get(k);
  res.writeHead(r.status, fileHeaders(rel, r.headers.get('content-length'), extra));
  if (req.method === 'HEAD' || !r.body) return res.end();
  return Readable.fromWeb(r.body).on('error', () => res.destroy()).pipe(res);
}
async function readLocalBuf(abs) { try { return await fsp.readFile(abs); } catch { throw notFound(); } }
async function driveFs(op, req, res, url, b, user) {
  if (op === '/fs/get' || op === '/fs/read') { const rel = driveRel(op === '/fs/get' ? url.searchParams.get('path') : b.path, user); const st = await dav.stat(rel); if (st.dir) throw httpError(400, 'Is a directory'); return driveGet(req, res, rel); }
  if (op === '/fs/stat') return json(res, 200, dObj(await dav.stat(driveRel(b.path, user))));
  if (op === '/fs/readdir') return json(res, 200, (await dav.list(driveRel(b.path, user))).map(dObj));
  if (op === '/fs/mkdir') { const rel = driveRel(b.path, user); await dav.mkdir(rel, !!b.parents); return json(res, 200, dObj(await dav.stat(rel))); }
  if (op === '/fs/delete') { const rel = driveRel(b.path, user); if (rel === '/') throw httpError(400, 'Cannot delete the root'); await dav.remove(rel); return json(res, 200, { ok: true }); }
  if (op === '/fs/rename') { const rel = driveRel(b.path, user); if (!b.name || /[\\/]/.test(b.name)) throw httpError(400, 'Bad name'); const to = path.posix.join(path.posix.dirname(rel), b.name); await dav.moveCopy('MOVE', rel, to); return json(res, 200, dObj(await dav.stat(to))); }
  throw httpError(404, 'Unknown route');
}
async function driveWrite(req, res, url, user) {
  const rel = driveRel(url.searchParams.get('path'), user); if (rel === '/') throw httpError(400, 'Bad path');
  if (url.searchParams.get('overwrite') === '0') { let exists = true; try { await dav.stat(rel); } catch (e) { if (e.status === 404) exists = false; else throw e; } if (exists) throw httpError(409, 'Item already exists', 'item_with_same_name_exists'); }
  if (url.searchParams.get('mkdirs') === '1') await dav.mkdir(path.posix.dirname(rel), true);
  const buf = await readBody(req, 200 * 1024 * 1024);
  await dav.write(rel, buf, req.headers['content-type']);
  return json(res, 200, dObj(await dav.stat(rel)));
}
/* move/copy where either side is Drive */
async function driveMoveCopy(op, b, user, res) {
  const fa = driveRel(b.from, user), fz = driveRel(b.to, user);
  if (fa !== null && fz !== null) {
    let dest = fz; try { if ((await dav.stat(fz)).dir) dest = path.posix.join(fz, path.posix.basename(fa)); } catch (e) { if (e.status !== 404) throw e; }
    await dav.moveCopy(op === '/fs/move' ? 'MOVE' : 'COPY', fa, dest); return json(res, 200, dObj(await dav.stat(dest)));
  }
  if (fa !== null) { // Drive -> local
    const st = await dav.stat(fa); if (st.dir) throw httpError(400, 'Folders cannot be copied out of Drive yet');
    const z = resolve(b.to, user); let dest = z; try { if ((await fsp.stat(z.abs)).isDirectory()) dest = resolve(path.posix.join(z.rel, path.posix.basename(fa)), user); } catch {}
    await fsp.mkdir(path.dirname(dest.abs), { recursive: true });
    const r = await dav.read(fa); await fsp.writeFile(dest.abs, Buffer.from(await r.arrayBuffer()));
    if (op === '/fs/move') await dav.remove(fa);
    return json(res, 200, await stat(dest.abs, dest.rel));
  }
  const a = resolve(b.from, user); const st = await fsp.stat(a.abs).catch(() => { throw notFound(); }); // local -> Drive
  if (st.isDirectory()) throw httpError(400, 'Folders cannot be copied into Drive yet');
  let dest = fz; try { if ((await dav.stat(fz)).dir) dest = path.posix.join(fz, path.basename(a.rel)); } catch (e) { if (e.status !== 404) throw e; }
  await dav.write(dest, await readLocalBuf(a.abs));
  if (op === '/fs/move') await fsp.rm(a.abs);
  return json(res, 200, dObj(await dav.stat(dest)));
}
function statObj(abs, rel, st) {
  return { id: crypto.createHash('sha1').update(rel).digest('hex').slice(0, 16), uid: crypto.createHash('sha1').update(rel).digest('hex').slice(0, 16), name: path.basename(rel) || '/', path: rel, is_dir: st.isDirectory(), size: st.isDirectory() ? 0 : st.size, modified: Math.floor(st.mtimeMs / 1000), created: Math.floor((st.birthtimeMs || st.mtimeMs) / 1000) };
}
async function stat(abs, rel) { try { return statObj(abs, rel, await fsp.stat(abs)); } catch { throw notFound(); } }
const MIME = { txt: 'text/plain', md: 'text/markdown', html: 'text/html', css: 'text/css', js: 'text/javascript', json: 'application/json', csv: 'text/csv', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf', mp3: 'audio/mpeg', mp4: 'video/mp4', wav: 'audio/wav' };
const mime = (f) => MIME[path.extname(f).slice(1).toLowerCase()] || 'application/octet-stream';
function sendFile(res, abs, st) {
  const type = mime(abs); const safe = /^(image\/(png|jpeg|gif|webp)|audio|video|application\/pdf|text\/plain|text\/csv|application\/json)/.test(type);
  res.writeHead(200, { 'content-type': type, 'content-length': st.size, 'cache-control': 'private, no-cache', 'x-content-type-options': 'nosniff', ...(safe ? {} : { 'content-disposition': 'attachment' }), 'content-security-policy': "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'" });
  fs.createReadStream(abs).on('error', () => res.destroy()).pipe(res);
}

export async function handleLocal(req, res, url) {
  const s = sessionOf(req); if (!s) throw httpError(401, 'Sign in first', 'auth_required');
  const user = userFromSession(s);
  const p = url.pathname.replace(/^\/_local/, '');
  if (p === '/auth/user' && req.method === 'GET') return json(res, 200, { ...user, email: user.email || effective().mail.from || null });
  if (p === '/fs/get' && req.method === 'GET') { if (driveRel(url.searchParams.get('path'), user) !== null) return driveFs(p, req, res, url, {}, user); const { abs } = resolve(url.searchParams.get('path'), user); let st; try { st = await fsp.stat(abs); } catch { throw notFound(); } if (st.isDirectory()) throw httpError(400, 'Is a directory'); return sendFile(res, abs, st); }
  if (req.method !== 'POST') throw httpError(405, 'Method not allowed');
  const app = slug(req.headers['x-app']);
  if (p === '/kv') { const b = await readJson(req, 9 * 1024 * 1024); return json(res, 200, { result: kvOp(app, b) }); }
  if (p === '/ai/chat') { const b = await readJson(req, 2 * 1024 * 1024); return json(res, 200, await llmChat(b.messages, { model: b.model, temperature: b.temperature })); }
  if (p === '/fs/write') {
    if (driveRel(url.searchParams.get('path'), user) !== null) return driveWrite(req, res, url, user);
    const { abs, rel } = resolve(url.searchParams.get('path'), user);
    if (rel === '/') throw httpError(400, 'Bad path');
    if (url.searchParams.get('overwrite') === '0' && fs.existsSync(abs)) throw httpError(409, 'Item already exists', 'item_with_same_name_exists');
    if (url.searchParams.get('mkdirs') === '1') await fsp.mkdir(path.dirname(abs), { recursive: true });
    else { try { if (!(await fsp.stat(path.dirname(abs))).isDirectory()) throw 0; } catch { throw httpError(404, 'Parent folder does not exist', 'subject_does_not_exist'); } }
    const tmp = abs + '.' + crypto.randomBytes(4).toString('hex') + '.part'; let n = 0; const LIM = 500 * 1024 * 1024;
    try { await pipeline(req, new Transform({ transform(c, _e, cb) { n += c.length; n > LIM ? cb(httpError(413, 'File too large')) : cb(null, c); } }), fs.createWriteStream(tmp)); await fsp.rename(tmp, abs); }
    catch (e) { fsp.rm(tmp, { force: true }).catch(() => {}); throw e; }
    return json(res, 200, await stat(abs, rel));
  }
  if (p.startsWith('/workers/') || p.startsWith('/mail-service/') || p === '/mail/send') {
    const b = await readJson(req, 1024 * 1024);
    if (p === '/workers/list') return json(res, 200, listWorkers());
    if (p === '/workers/get') { const w = getWorker(b.name); if (!w) throw httpError(404, 'No such worker', 'subject_does_not_exist'); return json(res, 200, w); }
    if (app !== 'calendar' && p !== '/mail/send') throw httpError(403, 'Only the Calendar app can do this', 'forbidden');
    if (p === '/workers/create') return json(res, 200, { success: true, errors: [], ...createWorker(b.name, b.path, user) });
    if (p === '/workers/delete') return json(res, 200, { success: deleteWorker(String(b.name || '')) });
    if (p.startsWith('/mail-service/')) return json(res, 200, await handleMailService(p.slice('/mail-service'.length), b));
    if (p === '/mail/send') { // puter.email.send
      if (app !== 'calendar' && app !== 'email') throw httpError(403, 'This app cannot send email', 'forbidden');
      const to = [].concat(b.to || []); try { await mail.sendMail({ to, subject: b.subject, text: b.text || '', html: b.html, replyTo: b.replyTo, attachments: (b.attachments || []).map((a) => ({ filename: a.filename, contentType: a.contentType, content: a.content })) }); } catch (e) { return json(res, 200, { code: e.code || 'send_failed', message: e.message, delivered: [] }); }
      return json(res, 200, { delivered: to });
    }
  }
  const b = await readJson(req, 64 * 1024);
  if (p === '/fs/move' || p === '/fs/copy') { if (driveRel(b.from, user) !== null || driveRel(b.to, user) !== null) return driveMoveCopy(p, b, user, res); }
  else if (p.startsWith('/fs/') && driveRel(b.path, user) !== null) return driveFs(p, req, res, url, b, user);
  if (p === '/fs/read') { const { abs } = resolve(b.path, user); let st; try { st = await fsp.stat(abs); } catch { throw notFound(); } if (st.isDirectory()) throw httpError(400, 'Is a directory'); res.writeHead(200, { 'content-type': mime(abs), 'content-length': st.size, 'cache-control': 'no-store' }); return fs.createReadStream(abs).on('error', () => res.destroy()).pipe(res); }
  if (p === '/fs/stat') { const { abs, rel } = resolve(b.path, user); return json(res, 200, await stat(abs, rel)); }
  if (p === '/fs/readdir') {
    const { abs, rel } = resolve(b.path, user); let names; try { names = await fsp.readdir(abs); } catch { throw notFound(); }
    const out = []; for (const nm of names) { if (nm.endsWith('.part')) continue; try { out.push(statObj(path.join(abs, nm), (rel === '/' ? '' : rel) + '/' + nm, await fsp.stat(path.join(abs, nm)))); } catch {} }
    if (rel === '/' && dav.configured()) out.push({ id: 'drive', uid: 'drive', name: 'Drive', path: '/Drive', is_dir: true, size: 0, modified: 0, created: 0 });
    return json(res, 200, out);
  }
  if (p === '/fs/mkdir') { const { abs, rel } = resolve(b.path, user); await fsp.mkdir(abs, { recursive: !!b.parents }).catch((e) => { if (e.code === 'EEXIST') throw httpError(409, 'Already exists', 'item_with_same_name_exists'); throw notFound(); }); return json(res, 200, await stat(abs, rel)); }
  if (p === '/fs/delete') { const { abs, rel } = resolve(b.path, user); if (rel === '/') throw httpError(400, 'Cannot delete the root'); await stat(abs, rel); await fsp.rm(abs, { recursive: b.recursive !== false, force: true }); return json(res, 200, { ok: true }); }
  if (p === '/fs/rename') { const { abs, rel } = resolve(b.path, user); if (!b.name || /[\\/]/.test(b.name)) throw httpError(400, 'Bad name'); await stat(abs, rel); const to = path.join(path.dirname(abs), b.name); resolve(path.posix.join(path.posix.dirname(rel), b.name), user); await fsp.rename(abs, to); return json(res, 200, await stat(to, path.posix.join(path.posix.dirname(rel), b.name))); }
  if (p === '/fs/move' || p === '/fs/copy') {
    const a = resolve(b.from, user), z = resolve(b.to, user); await stat(a.abs, a.rel);
    let dest = z; try { if ((await fsp.stat(z.abs)).isDirectory()) dest = resolve(path.posix.join(z.rel, path.basename(a.rel)), user); } catch {}
    await fsp.mkdir(path.dirname(dest.abs), { recursive: true });
    if (p === '/fs/move') await fsp.rename(a.abs, dest.abs); else await fsp.cp(a.abs, dest.abs, { recursive: true });
    return json(res, 200, await stat(dest.abs, dest.rel));
  }
  throw httpError(404, 'Unknown route');
}

/* small text files, for the assistant's "files" context */
export async function filesContext() {
  const out = { root: '/', files: [] }; let budget = 40000;
  async function walk(dir, rel, depth) {
    if (depth > 4 || out.files.length >= 200) return;
    let names; try { names = await fsp.readdir(dir); } catch { return; }
    for (const nm of names.sort()) {
      if (nm.endsWith('.part') || out.files.length >= 200) continue;
      const abs = path.join(dir, nm), r = rel + '/' + nm; let st; try { st = await fsp.stat(abs); } catch { continue; }
      if (st.isDirectory()) { await walk(abs, r, depth + 1); continue; }
      const f = { path: r, bytes: st.size, modified: new Date(st.mtimeMs).toISOString().slice(0, 10) };
      if (/\.(txt|md|csv|json|html|log)$/i.test(nm) && st.size <= 20000 && budget > 0) { try { f.preview = (await fsp.readFile(abs, 'utf8')).slice(0, 2000); budget -= f.preview.length; } catch {} }
      out.files.push(f);
    }
  }
  await walk(FS_ROOT, '', 0);
  if (!out.files.length) out.note = 'No files saved by the apps yet.';
  return out;
}

/* Cloudreve files for the assistant: two levels, names plus small text previews */
export async function driveContext() {
  if (!dav.configured()) return { connected: false };
  const files = []; let budget = 30000;
  async function walk(rel, depth) {
    let items; try { items = await dav.list(rel); } catch (e) { if (depth === 0) throw e; return; }
    for (const e of items.sort((a, b) => a.path.localeCompare(b.path))) {
      if (files.length >= 200) return;
      if (e.dir) { if (depth < 2) await walk(e.path, depth + 1); continue; }
      const f = { path: '/Drive' + e.path, bytes: e.size, modified: e.modified ? new Date(e.modified * 1000).toISOString().slice(0, 10) : null };
      if (/\.(txt|md|csv|json)$/i.test(e.name) && e.size <= 20000 && budget > 0) { try { const r = await dav.read(e.path); f.preview = (await r.text()).slice(0, 1500); budget -= f.preview.length; } catch {} }
      files.push(f);
    }
  }
  try { await walk('/', 0); } catch (e) { return { connected: false, reason: e.code || e.message }; }
  return { connected: true, files };
}
