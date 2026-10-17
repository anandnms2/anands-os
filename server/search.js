/* File name search for the Ctrl+K bar. Cloudreve's WebDAV has no search, so a bounded folder walk keeps a name index for a few minutes. */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { DATA } from './config.js';
import { json } from './util.js';
import * as dav from './webdav.js';

const LOCAL = path.join(DATA, 'fs'), TTL = 5 * 60e3, MAX_DIRS = 300, MAX_FILES = 20000;
let idx = null, building = null;
async function walkLocal(out) {
  const q = [['', 0]];
  while (q.length && out.length < MAX_FILES) {
    const [rel, d] = q.shift(); let ents; try { ents = await fsp.readdir(path.join(LOCAL, rel), { withFileTypes: true }); } catch { continue; }
    for (const e of ents) { if (e.name.startsWith('.')) continue; const p = rel + '/' + e.name; out.push({ p, n: e.name, dir: e.isDirectory(), src: 'Files' }); if (e.isDirectory() && d < 4) q.push([p, d + 1]); }
  }
}
async function walkDav(out) {
  if (!dav.configured()) return; const q = [['/', 0]]; let dirs = 0;
  while (q.length && dirs < MAX_DIRS && out.length < MAX_FILES) {
    const batch = q.splice(0, 4);
    await Promise.all(batch.map(async ([rel, d]) => {
      dirs++; let ents; try { ents = await dav.list(rel); } catch { return; }
      for (const e of ents) { const p = '/Drive' + e.path; out.push({ p, n: e.name, dir: e.dir, src: 'Drive', size: e.size, t: e.modified }); if (e.dir && d < 3) q.push([e.path, d + 1]); }
    }));
  }
}
async function build() {
  const out = []; await Promise.all([walkLocal(out).catch(() => {}), walkDav(out).catch(() => {})]);
  idx = { t: Date.now(), list: out }; return idx;
}
async function index() {
  if (idx && Date.now() - idx.t < TTL) return idx;
  if (!building) building = build().finally(() => { building = null; });
  if (idx) return idx;
  return Promise.race([building, new Promise((r) => setTimeout(() => r(idx || { t: 0, list: [], partial: true }), 7000))]);
}
export async function findFiles(q) {
  const words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean); if (!words.length) return [];
  const ix = await index(); return ix.list.filter((x) => { const n = x.n.toLowerCase(); return words.every((w) => n.includes(w)); }).sort((a, b) => (a.dir ? 1 : 0) - (b.dir ? 1 : 0) || a.n.length - b.n.length).slice(0, 12);
}
export const clearFileIndex = () => { idx = null; };
export async function handleSearch(req, res, url) {
  const q = String(url.searchParams.get('q') || '').toLowerCase().trim().slice(0, 80);
  if (!q) return json(res, 200, { items: [] });
  const ix = await index(); const words = q.split(/\s+/);
  const hits = ix.list.filter((x) => { const n = x.n.toLowerCase(); return words.every((w) => n.includes(w)); })
    .sort((a, b) => (b.n.toLowerCase().startsWith(q) ? 1 : 0) - (a.n.toLowerCase().startsWith(q) ? 1 : 0) || (a.dir ? 0 : 1) - (b.dir ? 0 : 1) || a.n.length - b.n.length).slice(0, 12);
  return json(res, 200, { items: hits, partial: !!ix.partial });
}
