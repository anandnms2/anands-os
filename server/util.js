import { Buffer } from 'node:buffer';
export function json(res, code, obj, headers) {
  const b = JSON.stringify(obj);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...(headers || {}) });
  res.end(b);
}
export function readBody(req, limit = 1 << 20) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', (c) => { n += c.length; if (n > limit) { reject(Object.assign(new Error('Body too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
export async function readJson(req, limit) {
  const b = await readBody(req, limit);
  if (!b.length) return {};
  try { return JSON.parse(b.toString('utf8')); } catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}
export function cookies(req) {
  const o = {};
  for (const p of (req.headers.cookie || '').split(';')) { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }
  return o;
}
export function clientIp(req) { return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || ''; }
export function isHttps(req, publicUrl) { return /^https/.test(publicUrl || '') || req.headers['x-forwarded-proto'] === 'https'; }
export function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.secure) parts.push('Secure');
  const prev = res.getHeader('set-cookie');
  res.setHeader('set-cookie', [].concat(prev || [], parts.join('; ')));
}
export function httpError(status, message, code) { return Object.assign(new Error(message), { status, code }); }
export async function fetchJson(url, init = {}, timeoutMs = 15000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...init, signal: ctl.signal });
    const text = await r.text();
    let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!r.ok) throw httpError(502, `Upstream ${r.status}`, 'upstream_' + r.status);
    return data;
  } catch (e) {
    if (e.name === 'AbortError') throw httpError(504, 'Upstream timed out', 'upstream_timeout');
    if (e.status) throw e;
    throw httpError(502, 'Could not reach upstream: ' + (e.cause?.code || e.message), 'upstream_unreachable');
  } finally { clearTimeout(t); }
}
export const UUID = /^[0-9a-fA-F-]{8,64}$/;
