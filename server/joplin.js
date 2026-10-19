/* Notes: the OS talks to your Joplin Server (notes.example.com) as a signed-in user and shows notes in its own app.
   Joplin Server stores each note as a text file "<id>.md" (title, body, then "key: value" lines). We read and write that format,
   so the Joplin desktop and phone apps keep syncing the same notes. The password stays on the server. Owner only.
   Notes locked by Joplin's end-to-end encryption cannot be read here and are shown as locked. */
import { effective } from './config.js';
import { json, readJson, readBody, httpError } from './util.js';
import crypto from 'node:crypto';

const base = () => String(effective().joplin?.url || '').replace(/\/+$/, '');
const email = () => effective().joplin?.email || '';
const pass = () => effective().joplin?.pass || '';
const TYPE = { note: 1, folder: 2, resource: 4, tag: 5, noteTag: 6 };
const IMG = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
const NAME = /^[0-9a-f]{32}\.md$/;
const ID = /^[0-9a-f]{32}$/;
const PAGE = 40;
const hex = () => crypto.randomBytes(16).toString('hex');
const iso = (ms) => new Date(ms).toISOString();
const ms = (s) => { const n = Date.parse(s); return Number.isFinite(n) ? n : 0; };

let sid = '', sidFor = '', cache = { at: 0, key: '', items: new Map() }, loading = null;

function conf() {
  if (!base()) throw httpError(409, 'Add your Notes address in Settings', 'not_configured');
  if (!email() || !pass()) throw httpError(409, 'Add your Notes email and password in Settings', 'no_login');
}
async function raw(path, init = {}, timeout = 20000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
  try { return await fetch(base() + path, { ...init, signal: ctl.signal }); }
  catch (e) { throw httpError(502, e.name === 'AbortError' ? 'Notes did not answer in time' : 'Could not reach Notes: ' + (e.cause?.code || e.message), 'unreachable'); }
  finally { clearTimeout(t); }
}
async function login() {
  conf();
  const r = await raw('/api/sessions', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ email: email(), password: pass() }) });
  if (r.status === 403 || r.status === 401 || r.status === 400) throw httpError(409, 'Notes refused the email or password. Two-step login cannot be used here: use an account without it', 'bad_login');
  if (!r.ok) throw httpError(502, 'Notes returned ' + r.status, 'upstream');
  const d = await r.json().catch(() => null); if (!d || !d.id) throw httpError(502, 'Notes gave no session', 'upstream');
  sid = d.id; sidFor = base() + '|' + email() + '|' + pass(); return sid;
}
async function jp(path, init = {}, timeout) {
  conf(); if (!sid || sidFor !== base() + '|' + email() + '|' + pass()) await login();
  let r = await raw(path, { ...init, headers: { 'x-api-auth': sid, accept: 'application/json', ...(init.headers || {}) } }, timeout);
  if (r.status === 403 || r.status === 401) { await login(); r = await raw(path, { ...init, headers: { 'x-api-auth': sid, accept: 'application/json', ...(init.headers || {}) } }, timeout); if (r.status === 403 || r.status === 401) throw httpError(409, 'Notes refused the login', 'bad_login'); }
  return r;
}
const enc = (name) => '/api/items/root:/' + String(name).split('/').map(encodeURIComponent).join('/') + ':';
async function getText(name) { const r = await jp(enc(name) + '/content'); if (r.status === 404) return null; if (!r.ok) throw httpError(502, 'Notes returned ' + r.status, 'upstream'); return r.text(); }
async function putText(name, text) {
  const fd = new FormData(); fd.append('file', new Blob([text], { type: 'text/plain' }), name);
  const r = await jp(enc(name) + '/content', { method: 'PUT', body: fd });
  if (!r.ok) throw httpError(502, 'Notes did not accept the change (' + r.status + ')', 'upstream');
  const d = await r.json().catch(() => ({})); return d && d.updated_time ? Number(d.updated_time) : Date.now();
}
async function putBuf(name, buf, type) {
  const fd = new FormData(); fd.append('file', new Blob([buf], { type: type || 'application/octet-stream' }), name.split('/').pop());
  const r = await jp(enc(name) + '/content', { method: 'PUT', body: fd }, 60000);
  if (!r.ok) throw httpError(502, 'Notes did not accept the file (' + r.status + ')', 'upstream');
}
async function delItem(name) { const r = await jp(enc(name), { method: 'DELETE' }); if (!r.ok && r.status !== 404) throw httpError(502, 'Notes returned ' + r.status, 'upstream'); }

/* Joplin item text: "Title\n\nBody\n\nkey: value\n...type_: 1" */
export function parseItem(text) {
  const lines = String(text).split('\n'), props = []; let bodyLines = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i].trim(); if (l === '') { bodyLines = lines.slice(0, i); break; }
    const p = l.indexOf(':'); if (p < 0) return null; props.push([l.slice(0, p).trim(), l.slice(p + 1).trim()]);
  }
  props.reverse(); const o = {}; props.forEach(([k, v]) => { o[k] = v; });
  const type = Number(o.type_); if (!type) return null;
  let title = ''; if (bodyLines.length) { title = bodyLines[0]; bodyLines = bodyLines.slice(2); }
  return { type, props, p: o, title, body: type === TYPE.note ? bodyLines.join('\n') : '' };
}
const setProp = (rec, k, v) => { const e = rec.props.find((x) => x[0] === k); if (e) e[1] = String(v); else rec.props.splice(Math.max(0, rec.props.length - 1), 0, [k, String(v)]); rec.p[k] = String(v); };
function serialize(rec) {
  const parts = [rec.title]; if (rec.type === TYPE.note && rec.body) parts.push(rec.body);
  parts.push(rec.props.map(([k, v]) => k + ': ' + v).join('\n')); return parts.join('\n\n');
}
function blank(type, title, extra, now) {
  const t = iso(now), p = [['id', extra.id], ['parent_id', extra.parent_id || '']];
  const rest = type === TYPE.note
    ? [['created_time', t], ['updated_time', t], ['is_conflict', '0'], ['latitude', '0.00000000'], ['longitude', '0.00000000'], ['altitude', '0.0000'], ['author', ''], ['source_url', ''], ['is_todo', extra.is_todo ? '1' : '0'], ['todo_due', '0'], ['todo_completed', '0'], ['source', 'anands-os'], ['source_application', 'com.anands.os'], ['application_data', ''], ['order', '0'], ['user_created_time', t], ['user_updated_time', t], ['encryption_cipher_text', ''], ['encryption_applied', '0'], ['markup_language', '1'], ['is_shared', '0'], ['share_id', ''], ['conflict_original_id', ''], ['master_key_id', ''], ['user_data', ''], ['deleted_time', '0'], ['type_', '1']]
    : type === TYPE.folder
      ? [['created_time', t], ['updated_time', t], ['user_created_time', t], ['user_updated_time', t], ['encryption_cipher_text', ''], ['encryption_applied', '0'], ['is_shared', '0'], ['share_id', ''], ['master_key_id', ''], ['icon', ''], ['user_data', ''], ['deleted_time', '0'], ['type_', '2']]
      : type === TYPE.tag
        ? [['created_time', t], ['updated_time', t], ['user_created_time', t], ['user_updated_time', t], ['encryption_cipher_text', ''], ['encryption_applied', '0'], ['is_shared', '0'], ['parent_id', ''], ['user_data', ''], ['type_', '5']]
        : type === TYPE.resource
          ? [['mime', extra.mime], ['filename', ''], ['created_time', t], ['updated_time', t], ['user_created_time', t], ['user_updated_time', t], ['file_extension', extra.ext], ['encryption_cipher_text', ''], ['encryption_applied', '0'], ['encryption_blob_encrypted', '0'], ['size', String(extra.size)], ['is_shared', '0'], ['share_id', ''], ['master_key_id', ''], ['user_data', ''], ['blob_updated_time', String(now)], ['type_', '4']]
          : [['note_id', extra.note_id], ['tag_id', extra.tag_id], ['created_time', t], ['updated_time', t], ['user_created_time', t], ['user_updated_time', t], ['encryption_cipher_text', ''], ['encryption_applied', '0'], ['is_shared', '0'], ['type_', '6']];
  const props = type === TYPE.noteTag || type === TYPE.resource ? [['id', extra.id], ...rest] : type === TYPE.tag ? [['id', extra.id], ...rest] : type === TYPE.folder ? [['id', extra.id], ['parent_id', extra.parent_id || ''], ...rest] : [...p, ...rest];
  const o = {}; props.forEach(([k, v]) => { o[k] = v; });
  return { type, props, p: o, title: title || '', body: '' };
}

/* cache of every note, notebook, tag and tag link; only changed files are downloaded again */
async function listNames() {
  const out = []; let cursor = '';
  for (let i = 0; i < 200; i++) {
    const r = await jp('/api/items/root:/:/children?limit=100' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : '')); if (!r.ok) throw httpError(502, 'Notes returned ' + r.status, 'upstream');
    const d = await r.json(); (d.items || []).forEach((it) => { if (NAME.test(it.name || '')) out.push({ name: it.name, upd: Number(it.updated_time) || 0 }); });
    if (!d.has_more || !d.cursor) break; cursor = d.cursor;
  }
  return out;
}
async function refresh() {
  const key = base() + '|' + email(); if (cache.key !== key) cache = { at: 0, key, items: new Map() };
  const names = await listNames(), seen = new Set(), todo = [];
  names.forEach((n) => { seen.add(n.name); const c = cache.items.get(n.name); if (!c || c.upd !== n.upd) todo.push(n); });
  for (const k of [...cache.items.keys()]) if (!seen.has(k)) cache.items.delete(k);
  let next = 0; const worker = async () => { while (next < todo.length) { const n = todo[next++]; const t = await getText(n.name); const rec = t == null ? null : (() => { try { return parseItem(t); } catch { return null; } })(); if (rec) cache.items.set(n.name, { upd: n.upd, rec }); else cache.items.delete(n.name); } };
  await Promise.all(Array.from({ length: Math.min(6, todo.length) }, worker)); cache.at = Date.now();
}
async function ready(force) {
  conf(); if (!force && cache.key === base() + '|' + email() && Date.now() - cache.at < 30000) return;
  if (!loading) loading = refresh().finally(() => { loading = null; }); await loading;
}
const all = (type) => [...cache.items.values()].map((c) => c.rec).filter((r) => r.type === type);
const locked = (r) => r.p.encryption_applied === '1';
const inTrash = (r) => Number(r.p.deleted_time || 0) > 0;

function model() {
  const folders = all(TYPE.folder).filter((f) => !locked(f) && !inTrash(f)), tags = all(TYPE.tag).filter((t) => !locked(t));
  const notes = all(TYPE.note), links = all(TYPE.noteTag), tagTitle = new Map(tags.map((t) => [t.p.id, t.title]));
  const noteTags = new Map(); links.forEach((l) => { const t = tagTitle.get(l.p.tag_id); if (!t) return; if (!noteTags.has(l.p.note_id)) noteTags.set(l.p.note_id, []); noteTags.get(l.p.note_id).push({ id: l.p.tag_id, title: t, link: l.p.id }); });
  return { folders, tags, notes, noteTags };
}
function noteView(r, nt, full) {
  const lk = locked(r), todo = r.p.is_todo === '1', done = todo && Number(r.p.todo_completed || 0) > 0;
  const o = { id: r.p.id, title: lk ? 'Encrypted note' : r.title || 'Untitled', folder: r.p.parent_id || '', updated: ms(r.p.user_updated_time || r.p.updated_time), created: ms(r.p.user_created_time || r.p.created_time), todo, done, locked: lk, trashed: inTrash(r), tags: (nt.get(r.p.id) || []).map((t) => ({ id: t.id, title: t.title })) };
  if (full) o.body = lk ? '' : r.body; else o.snippet = lk ? 'Locked by end-to-end encryption in Joplin' : r.body.replace(/[#>*`_\[\]()!-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  return o;
}
const findNote = (id) => { if (!ID.test(id)) throw httpError(404, 'Note not found'); const c = cache.items.get(id + '.md'); if (!c || c.rec.type !== TYPE.note) throw httpError(404, 'Note not found'); return c; };
async function save(name, rec) { const upd = await putText(name, serialize(rec)); cache.items.set(name, { upd, rec }); return upd; }
const stamp = (rec, now) => { setProp(rec, 'updated_time', iso(now)); setProp(rec, 'user_updated_time', iso(now)); };

export async function joplinTest() {
  if (!base()) return { configured: false, connected: false, reason: 'Add the Notes address first.' };
  if (!email() || !pass()) return { configured: true, connected: false, reason: 'Add your Notes email and password.' };
  try { sid = ''; await login(); await ready(true); const m = model(); return { configured: true, connected: true, resources: m.notes.filter((n) => !inTrash(n)).length, unit: 'notes' }; } catch (e) { return { configured: true, connected: false, reason: e.message }; }
}
export async function handleJoplin(req, res, url, sess) {
  if (sess && sess.role && sess.role !== 'owner') throw httpError(403, 'Notes is private to the owner', 'forbidden');
  const p = url.pathname.replace(/^\/api\/joplin/, '') || '/', m = req.method, q = url.searchParams; let x;
  if (p === '/status' && m === 'GET') {
    const out = { configured: !!base(), loginSet: !!(email() && pass()), url: base(), connected: false, reason: '' };
    if (!out.configured) out.reason = 'Add your Notes address in Settings.'; else if (!out.loginSet) out.reason = 'Add your Notes email and password in Settings.';
    else { try { await ready(q.get('fresh') === '1'); out.connected = true; out.notes = model().notes.filter((n) => !inTrash(n)).length; } catch (e) { out.reason = e.message; } }
    return json(res, 200, out);
  }
  await ready(q.get('fresh') === '1');
  if (p === '/meta' && m === 'GET') {
    const d = model(), live = d.notes.filter((n) => !inTrash(n)), cnt = {}; live.forEach((n) => { cnt[n.p.parent_id] = (cnt[n.p.parent_id] || 0) + 1; });
    const tc = {}; live.forEach((n) => (d.noteTags.get(n.p.id) || []).forEach((t) => { tc[t.id] = (tc[t.id] || 0) + 1; }));
    return json(res, 200, {
      folders: d.folders.map((f) => ({ id: f.p.id, title: f.title || 'Untitled', parent: f.p.parent_id || '', count: cnt[f.p.id] || 0 })).sort((a, b) => a.title.localeCompare(b.title)),
      tags: d.tags.map((t) => ({ id: t.p.id, title: t.title, count: tc[t.p.id] || 0 })).filter((t) => t.count).sort((a, b) => a.title.localeCompare(b.title)),
      counts: { all: live.length, todo: live.filter((n) => n.p.is_todo === '1' && !Number(n.p.todo_completed || 0)).length, trash: d.notes.filter(inTrash).length }
    });
  }
  if (p === '/notes' && m === 'GET') {
    const d = model(), view = q.get('view') || 'all', query = String(q.get('q') || '').trim().toLowerCase().slice(0, 200), folder = q.get('folder') || '', tag = q.get('tag') || '';
    const kids = (id) => d.folders.filter((f) => f.p.parent_id === id).flatMap((f) => [f.p.id, ...kids(f.p.id)]);
    const fset = folder ? new Set([folder, ...kids(folder)]) : null;
    let list = d.notes.filter((n) => (view === 'trash' ? inTrash(n) : !inTrash(n)) && (view !== 'todo' || (n.p.is_todo === '1' && !Number(n.p.todo_completed || 0))) && (!fset || fset.has(n.p.parent_id)) && (!tag || (d.noteTags.get(n.p.id) || []).some((t) => t.id === tag)) && (!query || (!locked(n) && (n.title + '\n' + n.body).toLowerCase().includes(query))));
    list.sort((a, b) => ms(b.p.user_updated_time || b.p.updated_time) - ms(a.p.user_updated_time || a.p.updated_time));
    const off = Math.max(0, parseInt(q.get('offset'), 10) || 0);
    return json(res, 200, { total: list.length, results: list.slice(off, off + PAGE).map((n) => noteView(n, d.noteTags)), next: off + PAGE < list.length ? off + PAGE : null });
  }
  if (p === '/notes' && m === 'POST') {
    const b = await readJson(req, 512 * 1024), d = model(), id = hex(), now = Date.now();
    const folder = String(b.folder || ''); const pf = d.folders.find((f) => f.p.id === folder) ? folder : (d.folders[0] ? d.folders[0].p.id : '');
    if (!pf) throw httpError(409, 'Create a notebook first', 'no_folder');
    const rec = blank(TYPE.note, String(b.title || '').slice(0, 300) || 'Untitled', { id, parent_id: pf, is_todo: !!b.todo }, now); rec.body = String(b.body || '').slice(0, 400000);
    const rev = await save(id + '.md', rec); return json(res, 201, { ...noteView(rec, model().noteTags, true), rev });
  }
  if ((x = p.match(/^\/notes\/([0-9a-f]{32})$/))) {
    const c = findNote(x[1]), rec = c.rec;
    if (m === 'GET') return json(res, 200, { ...noteView(rec, model().noteTags, true), rev: c.upd });
    if (m === 'PUT') {
      if (locked(rec)) throw httpError(409, 'This note is locked by end-to-end encryption', 'locked');
      const b = await readJson(req, 512 * 1024), now = Date.now();
      if (b.base) { const r = await jp(enc(x[1] + '.md')); const meta = r.ok ? await r.json().catch(() => null) : null; if (meta && Number(meta.updated_time) > Number(b.base) + 1) throw httpError(409, 'This note changed on another device. Reload it to see the newest version', 'changed'); }
      if (b.title !== undefined) rec.title = String(b.title).slice(0, 300);
      if (b.body !== undefined) rec.body = String(b.body).slice(0, 400000);
      if (b.folder !== undefined) { const f = model().folders.find((y) => y.p.id === b.folder); if (!f) throw httpError(400, 'That notebook does not exist', 'bad_request'); setProp(rec, 'parent_id', f.p.id); }
      if (b.todo !== undefined) { setProp(rec, 'is_todo', b.todo ? '1' : '0'); if (!b.todo) setProp(rec, 'todo_completed', '0'); }
      if (b.done !== undefined && rec.p.is_todo === '1') setProp(rec, 'todo_completed', b.done ? String(now) : '0');
      stamp(rec, now); const upd = await save(x[1] + '.md', rec);
      if (Array.isArray(b.tags)) await setTags(x[1], b.tags.map((t) => String(t).trim().slice(0, 60)).filter(Boolean).slice(0, 30));
      return json(res, 200, { ...noteView(rec, model().noteTags, true), rev: upd });
    }
  }
  if ((x = p.match(/^\/notes\/([0-9a-f]{32})\/(trash|restore)$/)) && m === 'POST') {
    const c = findNote(x[1]), now = Date.now(); if (locked(c.rec)) throw httpError(409, 'This note is locked by end-to-end encryption', 'locked');
    setProp(c.rec, 'deleted_time', x[2] === 'trash' ? String(now) : '0'); stamp(c.rec, now); await save(x[1] + '.md', c.rec); return json(res, 200, { ok: true });
  }
  if ((x = p.match(/^\/res\/([0-9a-f]{32})$/)) && m === 'GET') {
    const c = cache.items.get(x[1] + '.md'); if (!c || c.rec.type !== TYPE.resource) throw httpError(404, 'Attachment not found');
    if (c.rec.p.encryption_applied === '1' || c.rec.p.encryption_blob_encrypted === '1') throw httpError(409, 'This attachment is locked by end-to-end encryption', 'locked');
    const r = await jp(enc('.resource/' + x[1]) + '/content', {}, 60000); if (!r.ok) throw httpError(r.status === 404 ? 404 : 502, 'Could not open that attachment');
    const mime = String(c.rec.p.mime || 'application/octet-stream').toLowerCase(), isImg = !!IMG[mime] || mime === 'image/svg+xml', buf = Buffer.from(await r.arrayBuffer());
    const fn = String(c.rec.title || 'attachment').replace(/[^\w.\- ]+/g, '_').slice(0, 120);
    res.writeHead(200, { 'content-type': isImg ? mime : 'application/octet-stream', 'content-length': buf.length, 'cache-control': 'private, max-age=300', 'x-content-type-options': 'nosniff', 'content-security-policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:", 'content-disposition': (isImg ? 'inline' : 'attachment') + '; filename="' + fn + '"' }); return res.end(buf);
  }
  if (p === '/resources' && m === 'POST') {
    const type = String(req.headers['content-type'] || '').split(';')[0].toLowerCase(), ext = IMG[type]; if (!ext) throw httpError(400, 'Only PNG, JPEG, WebP and GIF images can be added', 'bad_request');
    const buf = await readBody(req, 12 * 1024 * 1024); if (!buf.length) throw httpError(400, 'That image is empty', 'bad_request');
    const id = hex(), now = Date.now(), name = String(q.get('name') || 'sketch').replace(/[^\w\- ]+/g, '').slice(0, 60) || 'sketch', rec = blank(TYPE.resource, name + '.' + ext, { id, mime: type, ext, size: buf.length }, now);
    await putBuf('.resource/' + id, buf, type); await save(id + '.md', rec);
    return json(res, 201, { id, markdown: '![' + name + '](:/' + id + ')' });
  }
  if (p === '/folders' && m === 'POST') {
    const b = await readJson(req, 4096), title = String(b.title || '').trim().slice(0, 200); if (!title) throw httpError(400, 'Give the notebook a name', 'bad_request');
    const d = model(), parent = d.folders.find((f) => f.p.id === b.parent) ? b.parent : '', id = hex(), rec = blank(TYPE.folder, title, { id, parent_id: parent }, Date.now());
    await save(id + '.md', rec); return json(res, 201, { id, title, parent });
  }
  throw httpError(404, 'Unknown Notes route');
}
async function setTags(noteId, titles) {
  const d = model(), want = new Map(titles.map((t) => [t.toLowerCase(), t])), have = d.noteTags.get(noteId) || [], now = Date.now();
  for (const h of have) if (!want.has(h.title.toLowerCase())) { await delItem(h.link + '.md'); cache.items.delete(h.link + '.md'); }
  const haveSet = new Set(have.map((h) => h.title.toLowerCase()));
  for (const [low, title] of want) {
    if (haveSet.has(low)) continue; let tag = d.tags.find((t) => t.title.toLowerCase() === low);
    if (!tag) { const id = hex(); tag = blank(TYPE.tag, title.toLowerCase(), { id }, now); await save(id + '.md', tag); }
    const lid = hex(); await save(lid + '.md', blank(TYPE.noteTag, '', { id: lid, note_id: noteId, tag_id: tag.p.id }, now));
  }
}
