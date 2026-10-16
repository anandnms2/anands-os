/* Paperless: the OS talks to your Paperless-ngx server with an API token and shows documents in its own branded app.
   The token stays on the server. Owner only. */
import { Readable } from 'node:stream';
import { effective } from './config.js';
import { json, readJson, readBody, httpError } from './util.js';

const base = () => String(effective().links?.paperless || '').replace(/\/+$/, '');
const token = () => effective().paperless?.token || '';
const need = (c, m, s = 400) => { if (!c) throw httpError(s, m, 'bad_request'); };
const intOr = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 0 ? n : d; };
const ids = (v) => String(v || '').split(',').map((x) => parseInt(x, 10)).filter((n) => Number.isInteger(n) && n > 0);

function conf() {
  if (!base()) throw httpError(409, 'Add your Paperless address in Settings', 'not_configured');
  if (!token()) throw httpError(409, 'Add a Paperless API token in Settings', 'no_token');
}
async function pl(path, init = {}, timeout = 20000) {
  conf(); const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(base() + path, { ...init, signal: ctl.signal, headers: { authorization: 'Token ' + token(), accept: 'application/json; version=5', ...(init.headers || {}) } });
    return r;
  } catch (e) { throw httpError(502, e.name === 'AbortError' ? 'Paperless did not answer in time' : 'Could not reach Paperless: ' + (e.cause?.code || e.message), 'unreachable'); } finally { clearTimeout(t); }
}
async function plJson(path, init, timeout) {
  const r = await pl(path, init, timeout);
  if (r.status === 401 || r.status === 403) throw httpError(409, 'Paperless refused the token. Create a new one in Paperless (My Profile) and save it in Settings', 'bad_token');
  const text = await r.text(); let d = null; try { d = text ? JSON.parse(text) : null; } catch { d = null; }
  if (!r.ok) throw httpError(r.status === 404 ? 404 : 502, (d && (d.detail || d.error)) || 'Paperless returned ' + r.status, 'upstream');
  return d;
}
const strip = (h) => String(h || '').replace(/<\/?span[^>]*>/g, (m) => (m[1] === '/' ? '</mark>' : '<mark>')).replace(/<(?!\/?mark>)[^>]*>/g, '').slice(0, 400);
const docView = (d, full) => ({
  id: d.id, title: d.title || d.original_file_name || 'Untitled', created: String(d.created || d.created_date || '').slice(0, 10), added: String(d.added || '').slice(0, 10),
  correspondent: d.correspondent || null, type: d.document_type || null, tags: d.tags || [], file: d.original_file_name || '', pages: d.page_count || 0, asn: d.archive_serial_number || null,
  hit: d.__search_hit__ ? { snippet: strip(d.__search_hit__.highlights), score: d.__search_hit__.score } : null,
  ...(full ? { content: String(d.content || '').slice(0, 20000), notes: (d.notes || []).length } : { snippet: String(d.content || '').replace(/\s+/g, ' ').slice(0, 200) })
});
const named = (r) => ({ id: r.id, name: r.name, count: r.document_count || 0, color: r.color || '', inbox: !!r.is_inbox_tag });
async function all(path) { const out = []; let url = path + (path.includes('?') ? '&' : '?') + 'page_size=500'; for (let i = 0; i < 6 && url; i++) { const d = await plJson(url); out.push(...(d.results || [])); url = d.next ? d.next.replace(/^https?:\/\/[^/]+/, '') : null; } return out; }

export async function paperlessTest() {
  if (!base()) return { configured: false, connected: false, reason: 'Add the Paperless address first.' };
  if (!token()) return { configured: true, connected: false, reason: 'Add a Paperless API token.' };
  try { const s = await plJson('/api/statistics/'); return { configured: true, connected: true, resources: s.documents_total || 0, unit: 'documents' }; } catch (e) { return { configured: true, connected: false, reason: e.message }; }
}
export async function handlePaperless(req, res, url, sess) {
  if (sess && sess.role && sess.role !== 'owner') throw httpError(403, 'Paperless is private to the owner', 'forbidden');
  const p = url.pathname.replace(/^\/api\/paperless/, '') || '/', m = req.method, q = url.searchParams; let x;
  if (p === '/status' && m === 'GET') {
    const out = { configured: !!base(), tokenSet: !!token(), url: base(), connected: false, reason: '' };
    if (!out.configured) out.reason = 'Add your Paperless address in Settings.'; else if (!out.tokenSet) out.reason = 'Add a Paperless API token in Settings.';
    else { try { const s = await plJson('/api/statistics/'); out.connected = true; out.total = s.documents_total || 0; out.inbox = s.documents_inbox || 0; } catch (e) { out.reason = e.message; } }
    return json(res, 200, out);
  }
  if (p === '/meta' && m === 'GET') {
    const [tags, cor, types] = await Promise.all([all('/api/tags/'), all('/api/correspondents/'), all('/api/document_types/')]);
    return json(res, 200, { tags: tags.map(named), correspondents: cor.map(named), types: types.map(named) });
  }
  if (p === '/documents' && m === 'GET') {
    const sp = new URLSearchParams(); const query = String(q.get('q') || '').trim().slice(0, 200);
    if (query) sp.set('query', query);
    const tg = ids(q.get('tags')); if (tg.length) sp.set('tags__id__all', tg.join(','));
    const co = intOr(q.get('correspondent'), 0), ty = intOr(q.get('type'), 0); if (co) sp.set('correspondent__id', co); if (ty) sp.set('document_type__id', ty);
    if (q.get('inbox') === '1') sp.set('is_in_inbox', '1');
    const ord = String(q.get('sort') || '-created'); if (!query && /^-?(created|added|title)$/.test(ord)) sp.set('ordering', ord);
    sp.set('page', String(Math.max(1, intOr(q.get('page'), 1)))); sp.set('page_size', '24');
    const d = await plJson('/api/documents/?' + sp.toString());
    return json(res, 200, { count: d.count || 0, pageCount: Math.ceil((d.count || 0) / 24), results: (d.results || []).map((r) => docView(r)) });
  }
  if ((x = p.match(/^\/documents\/(\d+)$/))) {
    if (m === 'GET') return json(res, 200, docView(await plJson('/api/documents/' + x[1] + '/'), true));
    if (m === 'PATCH') {
      const b = await readJson(req, 16 * 1024), o = {};
      if (b.title !== undefined) { o.title = String(b.title).trim().slice(0, 128); need(o.title, 'Give the document a title'); }
      if (b.tags !== undefined) { need(Array.isArray(b.tags), 'Tags must be a list'); o.tags = b.tags.map((n) => parseInt(n, 10)).filter((n) => Number.isInteger(n) && n > 0); }
      for (const [k, f] of [['correspondent', 'correspondent'], ['type', 'document_type']]) if (b[k] !== undefined) o[f] = b[k] ? intOr(b[k], 0) || null : null;
      const d = await plJson('/api/documents/' + x[1] + '/', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(o) });
      return json(res, 200, docView(d, true));
    }
  }
  if ((x = p.match(/^\/documents\/(\d+)\/(thumb|preview|download)$/)) && m === 'GET') {
    const kind = x[2], path = '/api/documents/' + x[1] + '/' + kind + '/' + (kind === 'download' && q.get('original') === '1' ? '?original=true' : '');
    const h = {}; if (req.headers.range) h.range = req.headers.range;
    const r = await pl(path, { headers: { ...h, accept: '*/*' } }, 60000);
    if (!r.ok && r.status !== 206) throw httpError(r.status === 404 ? 404 : 502, 'Could not open that document');
    const out = { 'cache-control': 'private, max-age=300', 'x-content-type-options': 'nosniff' };
    for (const k of ['content-type', 'content-length', 'content-range', 'accept-ranges']) if (r.headers.get(k)) out[k] = r.headers.get(k);
    if (kind === 'download') out['content-disposition'] = r.headers.get('content-disposition') || 'attachment';
    else if (kind === 'preview') out['content-disposition'] = 'inline';
    if (!/^(application\/pdf|image\/|text\/plain)/.test(out['content-type'] || '') && kind !== 'download') out['content-type'] = 'application/octet-stream';
    res.writeHead(r.status, out); if (!r.body) return res.end(); return void Readable.fromWeb(r.body).pipe(res);
  }
  if (p === '/upload' && m === 'POST') {
    conf(); const name = String(q.get('name') || 'document').replace(/[^\w.\- ]+/g, '_').slice(0, 120) || 'document', type = String(req.headers['content-type'] || 'application/octet-stream').split(';')[0];
    const buf = await readBody(req, 60 * 1024 * 1024); need(buf.length, 'That file is empty');
    const fd = new FormData(); fd.append('document', new Blob([buf], { type }), name); const title = String(q.get('title') || '').trim().slice(0, 128); if (title) fd.append('title', title);
    const r = await pl('/api/documents/post_document/', { method: 'POST', body: fd }, 60000);
    if (!r.ok) throw httpError(502, 'Paperless did not accept that file (' + r.status + ')');
    return json(res, 201, { ok: true });
  }
  throw httpError(404, 'Unknown Paperless route');
}
