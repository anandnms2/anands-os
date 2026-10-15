/* Minimal WebDAV client for Cloudreve (or any WebDAV server). Credentials never leave the server. */
import { effective } from './config.js';
import { httpError } from './util.js';

export function configured() { const d = effective().dav; return !!(d.url && d.user && d.pass); }
function conn() {
  const d = effective().dav;
  if (!d.url || !d.user || !d.pass) throw httpError(409, 'Drive is not connected. Add the WebDAV address, account and password in Settings.', 'not_configured');
  const base = new URL(d.url.replace(/\/+$/, ''));
  return { base, auth: 'Basic ' + Buffer.from(d.user + ':' + d.pass).toString('base64') };
}
const seg = (rel) => String(rel).split('/').filter(Boolean).map(encodeURIComponent).join('/');
function urlOf(c, rel, dir) { const u = new URL(c.base); u.pathname = u.pathname.replace(/\/+$/, '') + '/' + seg(rel) + (dir && seg(rel) ? '/' : ''); return u; }

async function dav(method, rel, { headers = {}, body, timeout = 25000, dir } = {}) {
  const c = conn(); let r;
  try {
    r = await fetch(urlOf(c, rel, dir), { method, headers: { authorization: c.auth, ...headers }, body, redirect: 'manual', signal: AbortSignal.timeout(timeout) });
  } catch (e) { throw httpError(502, 'Could not reach Drive', 'upstream_unreachable'); }
  if (r.status === 401 || r.status === 403) { r.body?.cancel?.().catch(() => {}); throw httpError(502, 'Drive rejected the account or password', 'upstream_auth'); }
  return r;
}
const dec = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const tag = (x, name) => { const m = new RegExp('<(?:[\\w-]+:)?' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?' + name + '>', 'i').exec(x); return m ? dec(m[1].trim()) : ''; };

/* PROPFIND -> [{path, name, dir, size, modified}] ; first entry is the folder itself */
export async function propfind(rel, depth) {
  const c = conn();
  const r = await dav('PROPFIND', rel, { headers: { depth: String(depth), 'content-type': 'application/xml' }, body: '<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/><d:getcontentlength/><d:getlastmodified/></d:prop></d:propfind>', dir: true });
  if (r.status === 404) throw httpError(404, 'Not found', 'subject_does_not_exist');
  if (r.status !== 207 && r.status !== 200) throw httpError(502, 'Drive answered ' + r.status, 'upstream_error');
  const xml = await r.text(); const basePath = c.base.pathname.replace(/\/+$/, '');
  const out = [];
  for (const m of xml.matchAll(/<(?:[\w-]+:)?response(?:\s[^>]*)?>([\s\S]*?)<\/(?:[\w-]+:)?response>/gi)) {
    const blk = m[1]; let href = tag(blk, 'href'); if (!href) continue;
    try { href = new URL(href, c.base).pathname; } catch {}
    let p; try { p = decodeURIComponent(href); } catch { p = href; }
    if (p.startsWith(basePath)) p = p.slice(basePath.length);
    p = '/' + p.split('/').filter(Boolean).join('/');
    const dir = /<(?:[\w-]+:)?collection\b/i.test(blk);
    const ts = Date.parse(tag(blk, 'getlastmodified'));
    out.push({ path: p, name: p === '/' ? '/' : p.split('/').pop(), dir, size: dir ? 0 : Number(tag(blk, 'getcontentlength')) || 0, modified: ts ? Math.floor(ts / 1000) : 0 });
  }
  return out;
}
const norm = (rel) => '/' + String(rel).split('/').filter(Boolean).join('/');
export async function stat(rel) { const e = await propfind(rel, 0); const me = e.find((x) => x.path === norm(rel)) || e[0]; if (!me) throw httpError(404, 'Not found', 'subject_does_not_exist'); return me; }
export async function list(rel) { const want = norm(rel); const e = await propfind(rel, 1); return e.filter((x) => x.path !== want); }

/* Returns the upstream Response (stream) for GET, honouring Range. */
export async function read(rel, range) {
  const r = await dav('GET', rel, { headers: range ? { range } : {}, timeout: 600000 });
  if (r.status === 404) throw httpError(404, 'Not found', 'subject_does_not_exist');
  if (!r.ok) throw httpError(502, 'Drive answered ' + r.status, 'upstream_error');
  return r;
}
export async function write(rel, buf, type) {
  const r = await dav('PUT', rel, { method: 'PUT', headers: { 'content-type': type || 'application/octet-stream', 'content-length': String(buf.length) }, body: buf, timeout: 600000 });
  if (r.status === 409 || r.status === 404) throw httpError(404, 'Parent folder does not exist', 'subject_does_not_exist');
  if (!r.ok) throw httpError(502, 'Drive refused the upload (' + r.status + ')', 'upstream_error');
}
export async function mkdir(rel, parents) {
  const parts = norm(rel).split('/').filter(Boolean); let cur = '';
  for (let i = 0; i < parts.length; i++) {
    cur += '/' + parts[i]; const last = i === parts.length - 1;
    if (!last && !parents) continue;
    const r = await dav('MKCOL', cur, { dir: true });
    if (r.status === 405) { if (last && !parents) throw httpError(409, 'Already exists', 'item_with_same_name_exists'); continue; }
    if (!r.ok) throw httpError(r.status === 409 ? 404 : 502, 'Could not create the folder', 'upstream_error');
  }
}
export async function remove(rel) { const r = await dav('DELETE', rel); if (r.status === 404) throw httpError(404, 'Not found', 'subject_does_not_exist'); if (!r.ok) throw httpError(502, 'Could not delete (' + r.status + ')', 'upstream_error'); }
export async function moveCopy(method, from, to) {
  const c = conn();
  const r = await dav(method, from, { headers: { destination: urlOf(c, to).toString(), overwrite: 'T' } });
  if (r.status === 404) throw httpError(404, 'Not found', 'subject_does_not_exist');
  if (!r.ok) throw httpError(502, method + ' failed (' + r.status + ')', 'upstream_error');
}
export async function ping() {
  if (!configured()) return { configured: false, connected: false };
  try { await propfind('/', 0); return { configured: true, connected: true }; }
  catch (e) { return { configured: true, connected: false, reason: e.code || e.message }; }
}
