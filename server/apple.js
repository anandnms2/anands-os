/* Apple Notes and Apple Reminders into Suite Notes, pushed from an iPhone Shortcut to POST /api/apple/import (an access token limited to this endpoint).
 * One note or reminder per request works, and so does a list of them. Items land in a notebook called "Apple": one section per Apple folder or Reminders list, one page per note or reminder list.
 * An id map keeps re-runs from creating duplicates: a changed note updates its page, a new note adds one. Nothing is sent back to Apple. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA } from './config.js';
import { json, readJson, httpError } from './util.js';

const MAP = path.join(DATA, 'apple-map.json'), NOTES = path.join(DATA, 'fs', 'notes');
let map = { nb: '', sections: {}, items: {}, rem: {}, last: null, result: null }; try { map = { ...map, ...JSON.parse(fs.readFileSync(MAP, 'utf8')) }; } catch {}
const saveMap = () => { try { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(MAP + '.tmp', JSON.stringify(map), { mode: 0o600 }); fs.renameSync(MAP + '.tmp', MAP); } catch {} };
const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const uid = (p) => { let s = ''; for (const b of crypto.randomBytes(10)) s += (b % 36).toString(36); return p + s; };

/* ---------- writing into Suite Notes' own files ---------- */
const rj = (f) => { try { return JSON.parse(fs.readFileSync(path.join(NOTES, f), 'utf8')); } catch { return null; } };
const wj = (f, v) => { const t = path.join(NOTES, f); fs.mkdirSync(path.dirname(t), { recursive: true }); fs.writeFileSync(t + '.tmp', JSON.stringify(v)); fs.renameSync(t + '.tmp', t); };
const COLORS = ['orange', 'blue', 'green', 'purple', 'yellow', 'red', 'teal'];
function store(items) {
  const now = new Date().toISOString(); let added = 0, updated = 0, nb = map.nb && rj(`notebooks/${map.nb}.json`);
  if (!nb) { nb = { id: uid('n'), v: 1, name: 'Apple', color: 'orange', created: now, modified: now, sections: [] }; map.nb = nb.id; map.sections = {}; }
  const lib = rj('library.json') || { v: 1, notebooks: [] }; if (!lib.notebooks.includes(nb.id)) lib.notebooks.push(nb.id);
  const secOf = (name) => {
    let s = nb.sections.find((x) => x.id === map.sections[name]);
    if (!s) { s = { type: 'section', id: uid('s'), name, color: COLORS[nb.sections.length % COLORS.length], created: now, modified: now, pages: [] }; nb.sections.push(s); map.sections[name] = s.id; }
    return s;
  };
  for (const it of items) {
    const key = it.key, sec = secOf(String(it.folder || 'Notes').slice(0, 60)), prev = map.items[key], mod = it.modified || now;
    const title = String(it.title || 'Untitled').slice(0, 200), html = it.html;
    const page = { id: prev ? prev.page : uid('p'), v: 1, title, created: it.created || mod, modified: mod, color: null, rules: null, ruleColor: null, outlines: [{ id: uid('o'), x: 40, y: 120, w: null, html }], ink: [] };
    if (prev && prev.hash === it.hash) continue;
    const old = prev && rj(`pages/${prev.page}.json`); if (old) page.created = old.created || page.created;
    wj(`pages/${page.id}.json`, page);
    let holder = sec.pages.find((m) => m.id === page.id);
    if (!holder) { for (const s of nb.sections) { const i = s.pages.findIndex((m) => m.id === page.id); if (i >= 0) { s.pages.splice(i, 1); } } holder = { id: page.id, title, level: 0, created: page.created, modified: mod }; sec.pages.push(holder); }
    holder.title = title; holder.modified = mod; sec.modified = now;
    map.items[key] = { page: page.id, hash: it.hash }; prev ? updated++ : added++;
  }
  nb.modified = now; wj(`notebooks/${nb.id}.json`, nb); wj('library.json', lib); saveMap();
  return { added, updated };
}
const hashOf = (...a) => crypto.createHash('sha1').update(a.join('\u0001')).digest('hex');

export function cleanHtml(h) {
  let s = String(h || '').replace(/<(script|style|head|title)[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<\/?(html|body|meta|link|span|font)[^>]*>/gi, '').replace(/<(\/?)(div|section)([^>]*)>/gi, '<$1p>').replace(/<(\/?)(strong)>/gi, '<$1b>').replace(/<(\/?)(em)>/gi, '<$1i>');
  s = s.replace(/<(?!\/?(p|br|b|i|u|ul|ol|li|h[1-4]|a|table|tr|td|th)\b)[^>]*>/gi, '').replace(/<(p|b|i|u|ul|ol|li|h[1-4]|table|tr|td|th)\s[^>]*>/gi, '<$1>').replace(/<a(\s[^>]*)?>/gi, (_, at) => { const m = /href\s*=\s*"(https?:[^"]*)"/i.exec(at || ''); return m ? '<a href="' + m[1] + '" target="_blank" rel="noopener">' : '<a>'; });
  s = s.replace(/(<p>\s*(<br\s*\/?>)?\s*<\/p>\s*){2,}/gi, '<p><br></p>').trim(); return s || '<p></p>';
}
export function listItem(name, todos) {
  const open = todos.filter((t) => !t.done), done = todos.filter((t) => t.done), line = (t) => '<p>' + (t.done ? '☑ ' : '☐ ') + esc(t.title) + (t.due ? ' <i>(' + esc(t.due) + ')</i>' : '') + '</p>' + (t.note ? '<p><i>' + esc(t.note).replace(/\n/g, '<br>') + '</i></p>' : '');
  const html = (open.map(line).join('') || '<p>Nothing open.</p>') + (done.length ? '<h3>Done</h3>' + done.map(line).join('') : '');
  return { key: 'rem:' + name, folder: 'Reminders', title: name, html, hash: hashOf(html) };
}


/* ---------- the endpoint ---------- */
const when = (v) => (v && !isNaN(new Date(v)) ? new Date(v).toISOString() : undefined);
const dueText = (v) => { const s = String(v || '').trim(); if (!s) return ''; const d = new Date(s); return isNaN(d) ? s.slice(0, 25) : d.toISOString().slice(0, /T00:00:00|^\d{4}-\d\d-\d\d$/.test(s) || (d.getUTCHours() === 0 && d.getUTCMinutes() === 0) ? 10 : 16).replace('T', ' '); };
const truthy = (v) => v === true || /^(true|yes|1|done|completed)$/i.test(String(v));
/* notes: [{id?, title, body | html, folder?, created?, modified?}]   reminders: [{id?, title, list?, due?, done?, notes?, created?}]   or one item with type "note" | "reminder" */
export function importPayload(b) {
  const notes = Array.isArray(b.notes) ? b.notes.slice(0, 2000) : [], rems = Array.isArray(b.reminders) ? b.reminders.slice(0, 5000) : [];
  if (b.title !== undefined || b.body !== undefined || b.html !== undefined) (/^reminder/i.test(b.type || '') ? rems : notes).push(b);
  const items = [];
  for (const n of notes) {
    const html = n.html ? cleanHtml(n.html) : '<p>' + esc(n.body || '').replace(/\r?\n/g, '</p><p>') + '</p>', folder = String(n.folder || 'Notes').slice(0, 60);
    const idv = n.id || (n.created ? hashOf(folder, n.created) : hashOf(folder, n.title));
    items.push({ key: 'note:' + String(idv).slice(0, 200), folder, title: String(n.title || 'Untitled'), html, created: when(n.created), modified: when(n.modified), hash: hashOf(n.title, html) });
  }
  const touched = new Set();
  for (const r of rems) {
    const list = String(r.list || 'Reminders').slice(0, 60), k = String(r.id || hashOf(r.title, r.created || '')).slice(0, 200); touched.add(list); map.rem[list] = map.rem[list] || {};
    map.rem[list][k] = { title: String(r.title || '').slice(0, 300), done: truthy(r.done), due: dueText(r.due), note: String(r.notes || '').slice(0, 2000) };
    if (Object.keys(map.rem[list]).length > 3000) delete map.rem[list][Object.keys(map.rem[list])[0]];
  }
  for (const list of touched) items.push(listItem(list, Object.values(map.rem[list])));
  const w = items.length ? store(items) : { added: 0, updated: 0 };
  map.last = new Date().toISOString(); map.result = { notes: notes.length, reminders: rems.length, ...w }; saveMap(); return map.result;
}
export const status = () => ({ last: map.last, result: map.result, notebook: map.nb || null });
export async function handleApple(req, res, url) {
  const p = url.pathname, m = req.method;
  if (p === '/api/apple' && m === 'GET') return json(res, 200, status());
  if (p === '/api/apple/import' && m === 'POST') { const b = await readJson(req, 20 * 1024 * 1024); return json(res, 200, importPayload(b)); }
  throw httpError(404, 'Unknown Apple route');
}
