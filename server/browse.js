/* Desktop Browser: fetches a page on the server and returns it so it can be shown in a sandboxed frame.
 * Why: most sites forbid being framed and this app only frames itself. The page is served with a sandbox policy (no access to this app's
 * cookies or storage), no cookies are ever sent to or kept for the site, and addresses on private networks are refused unless BROWSE_ALLOW_PRIVATE=1. */
import dns from 'node:dns/promises';
import net from 'node:net';
import { env } from 'node:process';
import { httpError } from './util.js';
import { sessionOf } from './session.js';

const MAX = 12 * 1024 * 1024, UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 AnandsDesktop';
/* Cookies for sites opened in the Browser are kept here, in memory, per signed-in session. They never reach the page itself or this app's own session. */
const JARS = new Map(); const JAR_MAX = 200;
const jarOf = (k) => { let j = JARS.get(k); if (!j) { if (JARS.size >= JAR_MAX) JARS.delete(JARS.keys().next().value); j = new Map(); JARS.set(k, j); } return j; };
function cookieHeader(jar, u) { const now = Date.now(), out = []; for (const [key, c] of jar) { if (c.exp && c.exp < now) { jar.delete(key); continue; } const h = u.hostname; if (!(c.host === h || (c.dom && h.endsWith('.' + c.host)))) continue; if (c.secure && u.protocol !== 'https:') continue; if (!u.pathname.startsWith(c.path)) continue; out.push(c.name + '=' + c.value); } return out.join('; '); }
function storeCookies(jar, u, headers) {
  for (const sc of headers.getSetCookie?.() || []) {
    const [nv, ...attrs] = sc.split(';'); const i = nv.indexOf('='); if (i < 1) continue; const c = { name: nv.slice(0, i).trim(), value: nv.slice(i + 1).trim(), host: u.hostname, dom: false, path: '/', secure: false, exp: 0 };
    for (const a of attrs) { const [k, v = ''] = a.trim().split('='); const lk = k.toLowerCase(); if (lk === 'domain' && v) { const d = v.replace(/^\./, '').toLowerCase(); if (u.hostname === d || u.hostname.endsWith('.' + d)) { c.host = d; c.dom = true; } } else if (lk === 'path' && v.startsWith('/')) c.path = v; else if (lk === 'secure') c.secure = true; else if (lk === 'max-age') c.exp = Date.now() + Number(v) * 1000; else if (lk === 'expires' && !c.exp) { const t = Date.parse(v); if (t) c.exp = t; } }
    const key = c.host + '|' + c.path + '|' + c.name; if (c.exp && c.exp < Date.now()) jar.delete(key); else if (jar.size < 400) jar.set(key, c);
  }
}
const allowPrivate = () => env.BROWSE_ALLOW_PRIVATE === '1';
function privateIp(ip) {
  if (net.isIPv4(ip)) { const [a, b] = ip.split('.').map(Number); return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224; }
  const x = ip.toLowerCase(); if (x === '::1' || x === '::') return true; if (x.startsWith('::ffff:')) { const r = x.slice(7); if (r.includes('.')) return privateIp(r); const h = r.split(':').map((v) => parseInt(v, 16)); if (h.length === 2 && h.every((v) => v >= 0)) return privateIp(`${h[0] >> 8}.${h[0] & 255}.${h[1] >> 8}.${h[1] & 255}`); return true; } if (x.startsWith('64:ff9b:')) return true; return /^f[cd]/.test(x) || /^fe[89ab]/.test(x);
}
export async function checkAddress(u) { return check(u); }
async function check(u) {
  if (!/^https?:$/.test(u.protocol)) throw httpError(400, 'Only http and https addresses can be opened', 'bad_url');
  if (allowPrivate()) return;
  const h = u.hostname.replace(/^\[|\]$/g, ''); if (/^localhost$/i.test(h) || /\.(local|internal)$/i.test(h)) throw httpError(403, 'Addresses on your own network are blocked in the Browser', 'private');
  const ips = net.isIP(h) ? [h] : (await dns.lookup(h, { all: true }).catch(() => { throw httpError(502, 'Could not find ' + h, 'dns'); })).map((a) => a.address);
  if (!ips.length || ips.some(privateIp)) throw httpError(403, 'Addresses on your own network are blocked in the Browser', 'private');
}
async function readCapped(r) {
  const chunks = []; let n = 0; for await (const c of r.body) { n += c.length; if (n > MAX) throw httpError(413, 'That page is too large for the Browser', 'too_large'); chunks.push(c); }
  return Buffer.concat(chunks);
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SCRIPT = (base) => `<base href="${esc(base)}"><script>(function(){var P=window.parent,B=${JSON.stringify(base)};function go(u,t){P.postMessage({aosBrowse:u,tab:!!t},'*')}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a||e.defaultPrevented)return;var h=a.href;if(!/^https?:/i.test(h))return;e.preventDefault();go(h,a.target==='_blank'||e.ctrlKey||e.metaKey)},true);
document.addEventListener('submit',function(e){var f=e.target;if(!f)return;if(String(f.method||'get').toLowerCase()==='post'){e.preventDefault();try{var pu=new URL(f.getAttribute('action')||B,B),fl=[];new FormData(f).forEach(function(v,k){if(typeof v==='string')fl.push([k,v])});P.postMessage({aosPost:{url:pu.href,fields:fl}},'*')}catch(x){}return}e.preventDefault();try{var u=new URL(f.getAttribute('action')||B,B);u.search='';new FormData(f).forEach(function(v,k){if(typeof v==='string')u.searchParams.append(k,v)});go(u.href)}catch(x){}},true);
window.addEventListener('load',function(){P.postMessage({aosTitle:document.title||'',aosUrl:B},'*')});})();</script>`;
const page = (title, msg, code = 200) => ({ code, type: 'text/html; charset=utf-8', body: Buffer.from(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>body{font:15px system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#111;color:#e8e6e1}main{max-width:460px;padding:28px}h1{font-size:20px;margin:0 0 8px}p{color:#9a968d;line-height:1.5}@media(prefers-color-scheme:light){body{background:#f5f3ee;color:#1d1b18}p{color:#6b675f}}</style><main><h1>${esc(title)}</h1><p>${esc(msg)}</p></main>`) });

export async function fetchPage(raw, opt = {}) {
  const jar = opt.jar || null; let method = opt.body ? 'POST' : 'GET', body = opt.body || undefined;
  let u; try { u = new URL(String(raw || '')); } catch { return page('That is not an address', 'Type a web address or search words.', 400); }
  try {
    let r;
    for (let i = 0; i < 6; i++) {
      await check(u);
      const ck = jar ? cookieHeader(jar, u) : ''; r = await fetch(u, { method, body, redirect: 'manual', signal: AbortSignal.timeout(20000), headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'accept-language': 'en', ...(ck ? { cookie: ck } : {}), ...(body ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) } }).catch((e) => { throw httpError(502, 'Could not reach ' + u.hostname + ' (' + (e.cause?.code || e.name || e.message) + ')', 'unreachable'); });
      if (jar) storeCookies(jar, u, r.headers);
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { if ([301, 302, 303].includes(r.status)) { method = 'GET'; body = undefined; } u = new URL(r.headers.get('location'), u); if (i === 5) throw httpError(502, 'Too many redirects', 'redirects'); continue; }
      break;
    }
    const buf = await readCapped(r), ct = r.headers.get('content-type') || 'application/octet-stream';
    if (!/^text\/html|application\/xhtml/i.test(ct)) return { code: r.status, type: ct, body: buf, disposition: r.headers.get('content-disposition') };
    const cs = (/charset=["']?([\w-]+)/i.exec(ct) || /<meta[^>]+charset=["']?([\w-]+)/i.exec(buf.subarray(0, 3000).toString('latin1')) || [])[1] || 'utf-8';
    let html; try { html = new TextDecoder(cs).decode(buf); } catch { html = buf.toString('utf8'); }
    let base = u.href; const bm = /<base\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i.exec(html); if (bm) { try { base = new URL(bm[1], u).href; } catch {} }
    html = html.replace(/<base\b[^>]*>/gi, '').replace(/<meta[^>]+http-equiv\s*=\s*["']?(content-security-policy|refresh|x-frame-options)[^>]*>/gi, '');
    const inj = SCRIPT(base); html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + inj) : inj + html;
    return { code: r.status >= 400 ? r.status : 200, type: 'text/html; charset=utf-8', body: Buffer.from(html), url: u.href };
  } catch (e) { return page(e.status === 403 ? 'Blocked' : 'Could not open this page', e.message || 'Something went wrong', e.status || 502); }
}
export async function handleBrowse(req, res, url) {
  const sess = sessionOf(req), jar = sess ? jarOf(String(sess.u)) : null; let body;
  if (req.method === 'POST') {
    const o = req.headers.origin; if (o && o !== 'http://' + req.headers.host && o !== 'https://' + req.headers.host && !(req.headers['x-forwarded-host'] && o.endsWith('//' + req.headers['x-forwarded-host']))) throw httpError(403, 'Not allowed', 'origin');
    const chunks = []; let n = 0; for await (const c of req) { n += c.length; if (n > 1024 * 1024) throw httpError(413, 'Form too large'); chunks.push(c); } body = Buffer.concat(chunks).toString('utf8');
  }
  const out = await fetchPage(url.searchParams.get('url'), { jar, body });
  const h = { 'content-type': out.type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
    'content-security-policy': "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads; default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self'" };
  if (out.disposition) h['content-disposition'] = out.disposition;
  res.writeHead(out.code, h); res.end(out.body);
}
