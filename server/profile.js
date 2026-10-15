/* Own profile: display name, contact details, bio and a picture. Single-user store in the data folder. */
import fs from 'node:fs';
import path from 'node:path';
import { DATA } from './config.js';
import { json, readJson, readBody, httpError } from './util.js';

const PF = path.join(DATA, 'profile.json'), AV = path.join(DATA, 'avatar.bin');
const FIELDS = { name: 80, email: 120, phone: 40, title: 80, company: 80, location: 80, bio: 400 };
let cache = null;
function load() { if (cache) return cache; try { cache = JSON.parse(fs.readFileSync(PF, 'utf8')) || {}; } catch { cache = {}; } return cache; }
function save(o) { cache = o; const t = PF + '.tmp'; fs.writeFileSync(t, JSON.stringify(o, null, 2), { mode: 0o600 }); fs.renameSync(t, PF); }
function kind(b) {
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
  if (b.length > 8 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.length > 12 && b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}
export function profileOf() {
  const p = load(), out = {};
  for (const k of Object.keys(FIELDS)) out[k] = p[k] || '';
  out.avatar = p.av ? '/api/profile/avatar?v=' + p.av : '';
  return out;
}
export async function handleProfile(req, res, url, session) {
  const p = url.pathname;
  if (p === '/api/profile' && req.method === 'GET') return json(res, 200, { ...profileOf(), username: session.u || session.n || '', signin: session.e || '' });
  if (p === '/api/profile' && req.method === 'PUT') {
    const b = await readJson(req, 16 * 1024), o = { ...load() };
    for (const [k, max] of Object.entries(FIELDS)) if (k in b) {
      const v = String(b[k] ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
      if (v.length > max) throw httpError(400, 'That is too long (' + k + ', up to ' + max + ' characters)');
      o[k] = v;
    }
    if (o.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email)) throw httpError(400, 'Enter a valid email address');
    save(o); return json(res, 200, { ...profileOf(), username: session.u || session.n || '', signin: session.e || '' });
  }
  if (p === '/api/profile/avatar' && (req.method === 'GET' || req.method === 'HEAD')) {
    let b; try { b = fs.readFileSync(AV); } catch { throw httpError(404, 'No picture'); }
    res.writeHead(200, { 'content-type': kind(b) || 'application/octet-stream', 'content-length': b.length, 'cache-control': 'private, max-age=3600', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox" });
    return res.end(req.method === 'HEAD' ? undefined : b);
  }
  if (p === '/api/profile/avatar' && req.method === 'POST') {
    const b = await readBody(req, 1.5 * 1024 * 1024); if (!kind(b)) throw httpError(400, 'Use a JPEG, PNG or WebP picture');
    fs.writeFileSync(AV, b, { mode: 0o600 }); save({ ...load(), av: Date.now() }); return json(res, 200, profileOf());
  }
  if (p === '/api/profile/avatar' && req.method === 'DELETE') {
    try { fs.unlinkSync(AV); } catch {} const o = { ...load() }; delete o.av; save(o); return json(res, 200, profileOf());
  }
  throw httpError(405, 'Method not allowed');
}
