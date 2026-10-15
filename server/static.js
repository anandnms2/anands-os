import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { rebrand, rebrandable } from './rebrand.js';
const RB = new Map();
const ICONS = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'web', 'icons');
const ICONFILE = /^apps\/([a-z0-9-]+)\/(?:app-icon|icon-\d+|icon-maskable-\d+|apple-touch-icon|favicon(?:-\d+x\d+)?)\.(?:png|ico)$/;

const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8', webmanifest: 'application/manifest+json', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', txt: 'text/plain; charset=utf-8', wasm: 'application/wasm', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', mp4: 'video/mp4', webm: 'video/webm', map: 'application/json', xml: 'application/xml', pdf: 'application/pdf', glb: 'model/gltf-binary', gltf: 'model/gltf+json', bin: 'application/octet-stream' };

/* small scripts added to some apps when they are served */
const addOns = (file, txt) => (/[\\/]apps[\\/]email[\\/]index\.html$/.test(file) ? txt.replace('</head>', '<script src="/email-add.js" defer></script></head>') : txt);

export async function serveStatic(req, res, root, rel, extraHeaders = {}, opts = {}) {
  let p = decodeURIComponent(rel);
  if (p.includes('\0')) { res.writeHead(400); return res.end(); }
  if (opts.rebrand) { // the apps' own logos are replaced with the Anands icons
    const m = ICONFILE.exec(p), slug = m && m[1];
    const own = slug && path.join(ICONS, slug + '.png');
    if (own && fs.existsSync(own)) { const b = await fsp.readFile(own); res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-cache', ...extraHeaders }); return req.method === 'HEAD' ? res.end() : res.end(b); }
  }
  const abs = path.join(root, path.normalize('/' + p));
  if (abs !== root && !abs.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  let file = abs, st;
  try { st = await fsp.stat(file); if (st.isDirectory()) { file = path.join(file, 'index.html'); st = await fsp.stat(file); } }
  catch { res.writeHead(404, { 'content-type': 'text/plain', ...extraHeaders }); return res.end('Not found'); }
  const ext = path.extname(file).slice(1).toLowerCase();
  const hashed = /[.-][A-Za-z0-9_-]{8,}\.(js|css|woff2?|png|jpg|svg|wasm)$/.test(file);
  const etag = 'W/"' + (opts.rebrand ? 'rb2-' : '') + st.size.toString(36) + '-' + Math.floor(st.mtimeMs).toString(36) + '"';
  const h = { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': hashed && !opts.rebrand ? 'public, max-age=31536000, immutable' : 'no-cache', etag, 'last-modified': st.mtime.toUTCString(), ...extraHeaders };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
  if (opts.rebrand && rebrandable(file, st.size) && !req.headers.range) {
    let c = RB.get(file); if (!c || c.m !== st.mtimeMs) { c = { m: st.mtimeMs, buf: Buffer.from(addOns(file, rebrand(await fsp.readFile(file, 'utf8')))) }; if (RB.size > 400) RB.clear(); RB.set(file, c); }
    res.writeHead(200, { ...h, 'content-length': c.buf.length }); return req.method === 'HEAD' ? res.end() : res.end(c.buf);
  }
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range && (range[1] || range[2])) {
    let a = range[1] ? Number(range[1]) : st.size - Number(range[2]), z = range[1] && range[2] ? Number(range[2]) : st.size - 1;
    if (a > z || a >= st.size) { res.writeHead(416, { 'content-range': `bytes */${st.size}` }); return res.end(); }
    z = Math.min(z, st.size - 1);
    res.writeHead(206, { ...h, 'content-range': `bytes ${a}-${z}/${st.size}`, 'content-length': z - a + 1, 'accept-ranges': 'bytes' });
    return fs.createReadStream(file, { start: a, end: z }).pipe(res);
  }
  res.writeHead(200, { ...h, 'content-length': st.size, 'accept-ranges': 'bytes' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
}
