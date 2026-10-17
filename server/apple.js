/* Apple Notes and Apple Reminders into Suite Notes.
 *  - Reminders are read over CalDAV (caldav.icloud.com) with an app-specific password.
 *  - Notes are read over IMAP (imap.mail.me.com), where iCloud keeps notes that were never upgraded to the newer format.
 *  - Anything else (the iPhone Shortcut, or a file) can push the same items to POST /api/apple/import.
 * Items land in a notebook called "Apple": one section per Apple folder or Reminders list, one page per note or reminder list.
 * An id map keeps re-runs from creating duplicates: a changed note updates its page, a new note adds one. Nothing is sent back to Apple. */
import fs from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';
import crypto from 'node:crypto';
import { DATA, effective } from './config.js';
import { json, readJson, httpError } from './util.js';
import { imap } from './mailbox.js';

const MAP = path.join(DATA, 'apple-map.json'), NOTES = path.join(DATA, 'fs', 'notes');
let map = { nb: '', sections: {}, items: {}, last: null, result: null }; try { map = { ...map, ...JSON.parse(fs.readFileSync(MAP, 'utf8')) }; } catch {}
const saveMap = () => { try { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(MAP + '.tmp', JSON.stringify(map), { mode: 0o600 }); fs.renameSync(MAP + '.tmp', MAP); } catch {} };
export const configured = () => { const a = effective().apple; return !!(a.user && a.pass); };
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

/* ---------- Notes over IMAP ---------- */
const dq = (s) => '"' + String(s).replace(/[\\"]/g, '\\$&') + '"';
function decodeQP(s) { return Buffer.from(s.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))), 'latin1'); }
function decodeWord(v) { return String(v || '').replace(/=\?([^?]+)\?([bq])\?([^?]*)\?=/gi, (_, cs, enc, t) => { try { const b = enc.toLowerCase() === 'b' ? Buffer.from(t, 'base64') : decodeQP(t.replace(/_/g, ' ')); return new TextDecoder(cs).decode(b); } catch { return t; } }).replace(/\?=\s+=\?/g, ''); }
function parseMail(buf) {
  const raw = buf.toString('latin1'), cut = raw.search(/\r?\n\r?\n/); const head = raw.slice(0, cut < 0 ? raw.length : cut).replace(/\r?\n[ \t]+/g, ' '), body = cut < 0 ? '' : raw.slice(cut).replace(/^\r?\n\r?\n/, '');
  const h = (n) => { const m = new RegExp('^' + n + ':\\s*(.*)$', 'im').exec(head); return m ? m[1].trim() : ''; };
  const enc = h('Content-Transfer-Encoding').toLowerCase(), cs = (/charset="?([\w-]+)/i.exec(h('Content-Type')) || [])[1] || 'utf-8';
  let bytes = enc === 'quoted-printable' ? decodeQP(body) : enc === 'base64' ? Buffer.from(body.replace(/\s+/g, ''), 'base64') : Buffer.from(body, 'latin1');
  let text; try { text = new TextDecoder(cs).decode(bytes); } catch { text = bytes.toString('utf8'); }
  return { subject: decodeWord(h('Subject')), id: h('X-Universally-Unique-Identifier') || h('Message-ID'), date: h('Date'), html: text };
}
export function cleanHtml(h) {
  let s = String(h || '').replace(/<(script|style|head|title)[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<\/?(html|body|meta|link|span|font)[^>]*>/gi, '').replace(/<(\/?)(div|section)([^>]*)>/gi, '<$1p>').replace(/<(\/?)(strong)>/gi, '<$1b>').replace(/<(\/?)(em)>/gi, '<$1i>');
  s = s.replace(/<(?!\/?(p|br|b|i|u|ul|ol|li|h[1-4]|a|table|tr|td|th)\b)[^>]*>/gi, '').replace(/<(p|b|i|u|ul|ol|li|h[1-4]|table|tr|td|th)\s[^>]*>/gi, '<$1>').replace(/<a\s[^>]*?(href="https?:[^"]*")[^>]*>/gi, '<a $1 target="_blank" rel="noopener">').replace(/<a\s(?![^>]*href=)[^>]*>/gi, '<a>');
  s = s.replace(/(<p>\s*(<br\s*\/?>)?\s*<\/p>\s*){2,}/gi, '<p><br></p>').trim(); return s || '<p></p>';
}
async function readNotes(a) {
  const out = []; let hosts = [a.user];
  if (/@(icloud|me|mac)\.com$/i.test(a.user)) hosts.push(a.user.split('@')[0]);
  let lastErr = null;
  for (const user of hosts) {
    try {
      await imap({ host: process.env.APPLE_IMAP_HOST || 'imap.mail.me.com', port: Number(process.env.APPLE_IMAP_PORT) || 993, security: process.env.APPLE_IMAP_SECURITY || 'ssl', user, pass: a.pass }, async (cmd) => {
        const list = (await cmd('LIST "" "*"')).toString('latin1').split('\r\n'), folders = [];
        for (const line of list) { const m = /^\* LIST \(([^)]*)\) (?:"[^"]*"|NIL) (.+)$/.exec(line); if (!m) continue; const name = m[2].replace(/^"|"$/g, ''); if (/^Notes(\/|$)/i.test(name)) folders.push(name); }
        if (!folders.length) throw httpError(404, 'iCloud did not list a Notes folder over IMAP. Notes that were upgraded to the newer iCloud format are not available this way. Use the iPhone Shortcut instead.', 'no_notes_folder');
        for (const f of folders) {
          await cmd('SELECT ' + dq(f)); const sr = (await cmd('UID SEARCH ALL')).toString('latin1'); const uids = ((/\* SEARCH([\d ]*)/.exec(sr) || [])[1] || '').trim().split(/\s+/).filter(Boolean).map(Number);
          for (const u of uids) {
            const raw = await cmd(`UID FETCH ${u} (BODY.PEEK[] INTERNALDATE)`); const hd = raw.subarray(0, 400).toString('latin1'), m = /\{(\d+)\}\r\n/.exec(hd); if (!m) continue;
            const st = m.index + m[0].length, mail = parseMail(raw.subarray(st, st + Number(m[1]))); const d = mail.date ? new Date(mail.date) : null, iso = d && !isNaN(d) ? d.toISOString() : undefined;
            const html = cleanHtml(mail.html); out.push({ key: 'note:' + (mail.id || f + ':' + u), folder: f === 'Notes' ? 'Notes' : f.replace(/^Notes\//i, ''), title: mail.subject || 'Untitled', html, modified: iso, hash: hashOf(mail.subject, html) });
          }
        }
      });
      return out;
    } catch (e) { lastErr = e; if (e.code !== 'imap_auth') break; out.length = 0; }
  }
  throw lastErr;
}

/* ---------- Reminders over CalDAV ---------- */
async function dav(a, url, method, body, depth) {
  const r = await fetch(url, { method, headers: { authorization: 'Basic ' + Buffer.from(a.user + ':' + a.pass).toString('base64'), 'content-type': 'application/xml; charset=utf-8', depth: String(depth ?? 0) }, body, signal: AbortSignal.timeout(25000), redirect: 'follow' });
  const text = await r.text(); if (r.status === 401) throw httpError(401, 'Apple did not accept that Apple ID or app-specific password.', 'apple_auth'); if (r.status >= 400) throw httpError(502, 'Apple answered ' + r.status, 'apple_' + r.status); return text;
}
const tag = (x, n) => { const m = new RegExp('<(?:[\\w-]+:)?' + n + '[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?' + n + '>', 'i').exec(x); return m ? m[1] : ''; };
const href = (x) => (/<(?:[\w-]+:)?href[^>]*>([^<]*)</i.exec(x) || [])[1] || '';
const responses = (x) => x.split(/<(?:[\w-]+:)?response[ >]/i).slice(1);
function unfold(s) { return s.replace(/\r?\n[ \t]/g, ''); }
function icsField(block, n) { const m = new RegExp('^' + n + '(?:;[^:\\n]*)?:(.*)$', 'im').exec(block); return m ? m[1].trim().replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\;/g, ';').replace(/\\\\/g, '\\') : ''; }
function icsDate(v) { const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?/.exec(v || ''); return m ? m[1] + '-' + m[2] + '-' + m[3] + (m[4] ? ' ' + m[4] + ':' + m[5] : '') : ''; }
async function readReminders(a) {
  const base = process.env.APPLE_CALDAV_URL || 'https://caldav.icloud.com';
  const p1 = await dav(a, base + '/', 'PROPFIND', '<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>', 0);
  const principal = href(tag(p1, 'current-user-principal')); if (!principal) throw httpError(502, 'Apple did not return a CalDAV account', 'apple_nodav');
  const pUrl = new URL(principal, base).href;
  const p2 = await dav(a, pUrl, 'PROPFIND', '<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><c:calendar-home-set/></d:prop></d:propfind>', 0);
  const home = href(tag(p2, 'calendar-home-set')); if (!home) throw httpError(502, 'Apple did not return a calendar home', 'apple_nohome');
  const hUrl = new URL(home, pUrl).href;
  const p3 = await dav(a, hUrl, 'PROPFIND', '<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:displayname/><d:resourcetype/><c:supported-calendar-component-set/></d:prop></d:propfind>', 1);
  const lists = [];
  for (const r of responses(p3)) if (/VTODO/i.test(tag(r, 'supported-calendar-component-set')) && /calendar/i.test(tag(r, 'resourcetype'))) lists.push({ url: new URL(href(r), hUrl).href, name: decodeURIComponent(tag(r, 'displayname') || 'Reminders').replace(/&amp;/g, '&') || 'Reminders' });
  const items = [];
  for (const l of lists) {
    const rep = await dav(a, l.url, 'REPORT', '<?xml version="1.0"?><c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><c:calendar-data/></d:prop><c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="VTODO"/></c:comp-filter></c:filter></c:calendar-query>', 1);
    const todos = [];
    for (const r of responses(rep)) { const d = unfold(tag(r, 'calendar-data').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/<!\[CDATA\[|\]\]>/g, '')); for (const m of d.matchAll(/BEGIN:VTODO([\s\S]*?)END:VTODO/g)) todos.push({ uid: icsField(m[1], 'UID'), title: icsField(m[1], 'SUMMARY'), done: /^COMPLETED$/i.test(icsField(m[1], 'STATUS')) || !!icsField(m[1], 'COMPLETED'), due: icsDate(icsField(m[1], 'DUE')), note: icsField(m[1], 'DESCRIPTION'), mod: icsField(m[1], 'LAST-MODIFIED') }); }
    items.push(listItem(l.name, todos));
  }
  return items;
}
export function listItem(name, todos) {
  const open = todos.filter((t) => !t.done), done = todos.filter((t) => t.done), line = (t) => '<p>' + (t.done ? '☑ ' : '☐ ') + esc(t.title) + (t.due ? ' <i>(' + esc(t.due) + ')</i>' : '') + '</p>' + (t.note ? '<p><i>' + esc(t.note).replace(/\n/g, '<br>') + '</i></p>' : '');
  const html = (open.map(line).join('') || '<p>Nothing open.</p>') + (done.length ? '<h3>Done</h3>' + done.map(line).join('') : '');
  return { key: 'rem:' + name, folder: 'Reminders', title: name, html, hash: hashOf(html) };
}

/* ---------- running ---------- */
let running = false;
export async function sync() {
  if (!configured()) throw httpError(409, 'Add your Apple ID and app-specific password in Settings first.', 'not_configured');
  if (running) throw httpError(409, 'A sync is already running.', 'busy'); running = true;
  const a = effective().apple, res = { notes: null, reminders: null, errors: {} };
  try {
    let items = [];
    try { const n = await readNotes(a); items = items.concat(n); res.notes = n.length; } catch (e) { res.errors.notes = e.message; }
    try { const r = await readReminders(a); items = items.concat(r); res.reminders = r.length; } catch (e) { res.errors.reminders = e.message; }
    const w = items.length ? store(items) : { added: 0, updated: 0 };
    map.last = new Date().toISOString(); map.result = { ...res, ...w }; saveMap(); return map.result;
  } finally { running = false; }
}
export const status = () => ({ configured: configured(), last: map.last, result: map.result, notebook: map.nb || null });
export async function test() {
  if (!configured()) return { configured: false, connected: false, reason: 'Add your Apple ID and app-specific password.' };
  const a = effective().apple; try { const l = await readReminders(a); return { configured: true, connected: true, resources: l.length, unit: 'reminder lists' }; } catch (e) { return { configured: true, connected: false, reason: e.message, code: e.code }; }
}
/* Items pushed from outside (the iPhone Shortcut, a file): notes [{id,title,body|html,folder,modified}], reminders [{id,title,list,due,done,notes}] */
export function importPayload(b) {
  const items = [];
  for (const n of Array.isArray(b.notes) ? b.notes.slice(0, 2000) : []) {
    const html = n.html ? cleanHtml(n.html) : '<p>' + esc(n.body || '').replace(/\r?\n/g, '</p><p>') + '</p>';
    items.push({ key: 'note:' + String(n.id || hashOf(n.folder, n.title)).slice(0, 200), folder: String(n.folder || 'Notes'), title: String(n.title || 'Untitled'), html, modified: n.modified && !isNaN(new Date(n.modified)) ? new Date(n.modified).toISOString() : undefined, hash: hashOf(n.title, html) });
  }
  const lists = new Map();
  for (const r of Array.isArray(b.reminders) ? b.reminders.slice(0, 5000) : []) { const k = String(r.list || 'Reminders'); if (!lists.has(k)) lists.set(k, []); lists.get(k).push({ title: String(r.title || ''), done: r.done === true || r.done === 'true', due: String(r.due || '').slice(0, 25), note: String(r.notes || '') }); }
  for (const [name, todos] of lists) items.push(listItem(name, todos));
  const w = items.length ? store(items) : { added: 0, updated: 0 }; map.last = new Date().toISOString(); map.result = { notes: items.filter((i) => i.key.startsWith('note:')).length, reminders: lists.size, errors: {}, ...w }; saveMap(); return map.result;
}
export async function handleApple(req, res, url) {
  const p = url.pathname, m = req.method;
  if (p === '/api/apple' && m === 'GET') return json(res, 200, status());
  if (p === '/api/apple/sync' && m === 'POST') return json(res, 200, await sync());
  if (p === '/api/apple/import' && m === 'POST') { const b = await readJson(req, 20 * 1024 * 1024); return json(res, 200, importPayload(b)); }
  throw httpError(404, 'Unknown Apple route');
}
if (process.env.NODE_ENV !== 'test') setInterval(() => { if (configured()) sync().catch(() => {}); }, 6 * 3600000).unref();
