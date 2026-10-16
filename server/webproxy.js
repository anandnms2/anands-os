/* The built-in full browser.
   Pages are rewritten inside the visitor's own browser by Scramjet (the engine behind Puter's browser.js). A service worker at /sj/ does the
   rewriting, and the network leg is a Wisp tunnel that ends here, so no other container or service is needed.
   The tunnel is the sensitive part (it is a door to the internet), so it only opens for a short-lived token that the signed-in owner is given. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { sign, verify } from './session.js';
import { effective } from './config.js';
import { serveStatic } from './static.js';

const require = createRequire(import.meta.url);
const WEB = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'web', 'sj');
const env = process.env;
export const SJ_HOST = String(env.SJ_HOST || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const TOKEN_TTL = 12 * 3600;

let roots = null, wisp = null, loadError = '';
function dirs() {
  if (roots) return roots;
  try {
    roots = {
      scram: require('@mercuryworkshop/scramjet/path').scramjetPath,
      libcurl: require('@mercuryworkshop/libcurl-transport').libcurlPath,
      baremux: require('@mercuryworkshop/bare-mux/node').baremuxPath
    };
  } catch (e) { loadError = e.message; roots = {}; }
  return roots;
}
async function wispServer() {
  if (wisp) return wisp;
  try {
    const m = await import('@mercuryworkshop/wisp-js/server');
    Object.assign(m.server.options, {
      allow_udp_streams: false, allow_private_ips: env.SJ_ALLOW_PRIVATE === '1', allow_loopback_ips: env.SJ_ALLOW_PRIVATE === '1',
      dns_servers: String(env.SJ_DNS || '1.1.1.1,8.8.8.8').split(',').map((s) => s.trim()).filter(Boolean)
    });
    try { m.logging.set_level(env.SJ_LOG === '1' ? m.logging.DEBUG : m.logging.WARN); } catch {}
    wisp = m.server;
  } catch (e) { loadError = e.message; }
  return wisp;
}

export const available = () => { if (env.SJ_OFF === '1') return false; const d = dirs(); return !!(d.scram && d.libcurl && d.baremux); };
export const newToken = () => sign({ k: 'sj' }, TOKEN_TTL);
const goodToken = (t) => { const o = verify(t); return !!(o && o.k === 'sj'); };

/* where the browser page lives: its own host when one is set (best, since sites then cannot reach the OS), otherwise under /sj/ here */
export function openInfo() {
  if (!available()) return { ok: false, reason: 'The browser engine is not installed in this build (' + (loadError || 'missing packages') + ').' };
  const base = SJ_HOST ? 'https://' + SJ_HOST : '';
  return { ok: true, src: base + '/sj/?t=' + encodeURIComponent(newToken()), isolated: !!SJ_HOST };
}

const frameAncestors = () => {
  const o = [];
  if (env.PUBLIC_URL) { try { o.push(new URL(env.PUBLIC_URL).origin); } catch {} }
  return "frame-ancestors 'self' " + o.join(' ');
};

/* GET /sj/... */
export async function handleSj(req, res, url) {
  const p = url.pathname;
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  if (!available()) { res.writeHead(503, { 'content-type': 'text/plain' }); return res.end('The browser engine is not installed.'); }
  const d = dirs();
  const common = { 'content-security-policy': frameAncestors(), 'cache-control': 'no-cache' };
  if (p === '/sj' || p === '/sj/') {
    if (!goodToken(url.searchParams.get('t'))) { res.writeHead(403, { 'content-type': 'text/plain' }); return res.end('Open the browser from Anands OS.'); }
    return serveStatic(req, res, WEB, 'index.html', common);
  }
  if (p.startsWith('/sj/scram/')) return serveStatic(req, res, d.scram, p.slice(10), { 'cache-control': 'no-cache' });
  if (p.startsWith('/sj/libcurl/')) return serveStatic(req, res, d.libcurl, p.slice(12), { 'cache-control': 'no-cache' });
  if (p.startsWith('/sj/baremux/')) return serveStatic(req, res, d.baremux, p.slice(12), { 'cache-control': 'no-cache' });
  if (p === '/sj/sw.js') return serveStatic(req, res, WEB, 'sw.js', { 'service-worker-allowed': '/sj/', 'cache-control': 'no-cache' });
  if (/^\/sj\/[a-z0-9._-]+\.(js|css|svg|png)$/.test(p)) return serveStatic(req, res, WEB, p.slice(4), common);
  res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('Not found');
}

/* the Wisp tunnel: /sj/wisp/<token>/ (the client library insists on an address that ends with a slash, so the token is in the path) */
export async function handleSjUpgrade(req, socket, head, url) {
  const deny = () => { try { socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'); } catch {} socket.destroy(); };
  const m = /^\/sj\/wisp\/([^/]+)\/?$/.exec(url.pathname);
  if (!m || !goodToken(decodeURIComponent(m[1]))) return deny();
  const w = await wispServer(); if (!w) return deny();
  req.url = '/sj/wisp/'; // the tunnel itself does not look at the token
  w.routeRequest(req, socket, head);
}

/* one look at startup: can this server resolve names and open a connection to the internet? Shown in the logs so a blocked network is obvious. */
export async function selfCheck() {
  if (!available()) return;
  const dns = await import('node:dns'), net = await import('node:net');
  const servers = String(env.SJ_DNS || '1.1.1.1,8.8.8.8').split(',').map((s) => s.trim()).filter(Boolean);
  const r = new dns.promises.Resolver(); r.setServers(servers);
  let ip = '', why = '';
  try { ip = (await r.resolve4('example.com'))[0]; } catch (e) { why = 'wisp DNS (' + servers.join(',') + ') failed: ' + (e.code || e.message); }
  if (!ip) { try { ip = (await dns.promises.lookup('example.com', { family: 4 })).address; why += '; system DNS works'; } catch (e) { why += '; system DNS failed: ' + (e.code || e.message); } }
  if (!ip) return console.log('[sj] outbound check FAILED: ' + why);
  await new Promise((res) => { const s = net.connect({ host: ip, port: 443, timeout: 6000 }, () => { console.log('[sj] outbound check ok (' + ip + ':443' + (why ? '; ' + why : '') + ')'); s.destroy(); res(); }); s.on('timeout', () => { console.log('[sj] outbound check FAILED: connect to ' + ip + ':443 timed out'); s.destroy(); res(); }); s.on('error', (e) => { console.log('[sj] outbound check FAILED: ' + (e.code || e.message)); res(); }); });
}

/* the optional real Chrome (Neko, streamed over WebRTC) that the Browser window can switch to. Only the owner is given its address and sign-in. */
export function chromeInfo() {
  const c = effective().chrome || {};
  if (!c.url) return { ok: false, reason: 'No address saved yet. Add it in Settings, under Real Chrome.' };
  if (!c.pass) return { ok: false, reason: 'No password saved yet. Add it in Settings, under Real Chrome.' };
  let origin; try { origin = new URL(c.url).origin; } catch { return { ok: false, reason: 'The saved address is not valid.' }; }
  return { ok: true, src: origin + '/?embed=1&usr=' + encodeURIComponent(c.user || 'anand') + '&pwd=' + encodeURIComponent(c.pass) };
}
export const chromeOrigin = () => { try { const u = (effective().chrome || {}).url; return u ? new URL(u).origin : ''; } catch { return ''; } };
