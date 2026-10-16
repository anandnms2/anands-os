/* Full browser: a separate Kasm Chrome (or any KasmVNC / noVNC) container, shown inside Anands OS at /rb/.
 * The container is never public. This server checks your Anands OS sign-in, adds the container's own login for you, and passes web pages and the
 * screen WebSocket through. Its self-signed certificate is accepted because the address is one you entered in Settings. */
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import { effective } from './config.js';
import { json, httpError } from './util.js';

const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true, maxSockets: 32 });
const RB_CSP = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' ws: wss: data: blob:; frame-ancestors 'self'; object-src 'none'; base-uri 'self'";
const DROP_REQ = /^(host|cookie|authorization|origin|referer|connection|upgrade|content-length|x-forwarded-.*|forwarded|x-real-ip|cf-.*)$/i;
const DROP_RES = /^(x-frame-options|set-cookie|content-security-policy|content-security-policy-report-only|www-authenticate|strict-transport-security|connection|keep-alive|transfer-encoding)$/i;

export function target() {
  const c = effective().rbrowser || {}; if (!c.url) return null;
  let u; try { u = new URL(c.url); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const port = Number(u.port) || (u.protocol === 'https:' ? 443 : 80);
  const auth = c.pass ? 'Basic ' + Buffer.from((c.user || 'kasm_user') + ':' + c.pass).toString('base64') : '';
  return { https: u.protocol === 'https:', host: u.hostname, port, hostHeader: u.host, origin: u.origin, base: u.pathname.replace(/\/+$/, ''), auth };
}
const upPath = (t, url) => t.base + (url.pathname.replace(/^\/rb/, '') || '/') + url.search;

export function handleRbProxy(req, res, url) {
  const t = target(); if (!t) throw httpError(404, 'The Full browser is not set up. Add its address in Settings.', 'rb_off');
  if (url.pathname === '/rb') { res.writeHead(302, { location: '/rb/' + url.search }); return res.end(); }
  if (!['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'].includes(req.method)) throw httpError(405, 'Method not allowed');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) { const o = req.headers.origin; if (o) { let ok = false; try { ok = new URL(o).host === req.headers.host; } catch {} if (!ok) throw httpError(403, 'Cross-site request refused', 'csrf'); } }
  const headers = {}; for (const [k, v] of Object.entries(req.headers)) if (!DROP_REQ.test(k)) headers[k] = v;
  headers.host = t.hostHeader; if (t.auth) headers.authorization = t.auth;
  if (req.headers['content-length']) headers['content-length'] = req.headers['content-length'];
  const up = (t.https ? https : http).request({ hostname: t.host, port: t.port, path: upPath(t, url), method: req.method, headers, agent: t.https ? agent : undefined, timeout: 0 }, (ur) => {
    if (ur.statusCode === 401) { ur.resume(); return json(res, 502, { error: 'The browser container refused the saved password. Check it in Settings.', code: 'rb_auth' }); }
    const h = {}; for (const [k, v] of Object.entries(ur.headers)) if (!DROP_RES.test(k)) h[k] = v;
    if (h.location) { let l = String(h.location); if (l.startsWith(t.origin)) l = l.slice(t.origin.length) || '/'; if (l.startsWith('/')) h.location = '/rb' + l; }
    h['cache-control'] = h['cache-control'] || 'no-store'; h['x-content-type-options'] = 'nosniff'; h['content-security-policy'] = RB_CSP;
    res.writeHead(ur.statusCode, h); ur.pipe(res);
  });
  up.on('error', () => { if (!res.headersSent) json(res, 502, { error: 'The browser container is not reachable. Check that it is running and on the same network as Anands OS.', code: 'rb_down' }); else res.destroy(); });
  res.on('close', () => up.destroy());
  req.pipe(up);
}

/* WebSocket: relay the handshake and then the raw bytes, so the screen stream, clipboard and audio work unchanged. */
export function handleRbUpgrade(req, socket, head, url) {
  const t = target(); const bad = (code, msg) => { try { socket.write('HTTP/1.1 ' + code + ' ' + msg + '\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'); } catch {} socket.destroy(); };
  if (!t) return bad(404, 'Not Found');
  const lines = ['GET ' + upPath(t, url) + ' HTTP/1.1', 'Host: ' + t.hostHeader, 'Upgrade: websocket', 'Connection: Upgrade', 'Origin: ' + t.origin];
  for (const k of ['sec-websocket-key', 'sec-websocket-version', 'sec-websocket-protocol', 'sec-websocket-extensions']) if (req.headers[k]) lines.push(k + ': ' + req.headers[k]);
  if (t.auth) lines.push('Authorization: ' + t.auth);
  const up = t.https ? tls.connect({ host: t.host, port: t.port, servername: net.isIP(t.host) ? undefined : t.host, rejectUnauthorized: false }) : net.connect(t.port, t.host);
  const ready = t.https ? 'secureConnect' : 'connect';
  up.once(ready, () => { up.write(lines.join('\r\n') + '\r\n\r\n'); if (head && head.length) up.write(head); up.pipe(socket); socket.pipe(up); });
  const end = () => { up.destroy(); socket.destroy(); };
  up.on('error', () => { if (!up.pipedOnce) bad(502, 'Bad Gateway'); end(); }); socket.on('error', end); up.on('close', end); socket.on('close', end);
  socket.setNoDelay(true); socket.setTimeout(0); up.setNoDelay && up.setNoDelay(true);
}

/* Is the container reachable? Used by the Browser window to say what is wrong instead of showing a blank frame. */
export function status() {
  const t = target(); if (!t) return Promise.resolve({ available: false });
  return new Promise((ok) => {
    const done = (r) => ok({ available: true, up: r === true, auth: !!t.auth, reason: r === true ? '' : r });
    const req = (t.https ? https : http).request({ hostname: t.host, port: t.port, path: t.base + '/', method: 'GET', headers: { host: t.hostHeader, ...(t.auth ? { authorization: t.auth } : {}) }, agent: t.https ? agent : undefined, timeout: 3000 }, (r) => { r.resume(); done(r.statusCode === 401 ? 'The container refused the saved password' : r.statusCode < 500 ? true : 'The container answered with an error'); });
    req.on('timeout', () => { req.destroy(); done('The container did not answer'); }); req.on('error', () => done('Anands OS cannot reach the container. Put them on the same Docker network.')); req.end();
  });
}
