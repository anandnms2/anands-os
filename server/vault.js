/* Vaultwarden relay. The vault is decrypted in the browser only: this server forwards three Bitwarden API calls
   (prelogin, token, sync) and never sees the master password, the user key or any decrypted item. Nothing is logged or stored. */
import { effective } from './config.js';
import { httpError, readBody, json } from './util.js';

const ROUTES = { 'POST identity/accounts/prelogin': 4096, 'POST identity/connect/token': 16384, 'GET api/sync': 0, 'POST api/ciphers': 1 << 20, 'PUT api/ciphers/:id': 1 << 20, 'PUT api/ciphers/:id/delete': 4096 };
const routeKey = (m, rest) => m + ' ' + rest.replace(/^(api\/ciphers\/)[0-9a-fA-F-]{8,64}/, '$1:id');
const PASS_HEADERS = ['authorization', 'content-type', 'accept', 'auth-email', 'device-type'];
const MAX_RESPONSE = 64 * 1024 * 1024;

function base() {
  const u = effective().vault.url;
  if (!u) throw httpError(409, 'Vault is not connected. Add the Vaultwarden address in Settings.', 'not_configured');
  return u.replace(/\/+$/, '');
}
export async function status() {
  const url = effective().vault.url; if (!url) return { configured: false, connected: false };
  for (const p of ['/alive', '/api/config']) {
    try { const r = await fetch(url.replace(/\/+$/, '') + p, { signal: AbortSignal.timeout(8000) }); await r.arrayBuffer().catch(() => {}); if (r.ok) return { configured: true, connected: true, url }; } catch {}
  }
  return { configured: true, connected: false, reason: 'no answer from ' + new URL(url).host };
}
export async function handleVault(req, res, url) {
  const rest = url.pathname.replace(/^\/api\/vault\//, '');
  if (rest === 'status') return json(res, 200, await status());
  const key = routeKey(req.method, rest);
  if (!(key in ROUTES)) throw httpError(404, 'Not allowed', 'vault_route');
  const target = new URL(base() + '/' + rest);
  if (rest === 'api/sync') target.search = '?excludeDomains=true';
  const headers = {};
  for (const h of PASS_HEADERS) if (req.headers[h]) headers[h] = req.headers[h];
  const body = ROUTES[key] ? await readBody(req, ROUTES[key]) : undefined;
  let r;
  try { r = await fetch(target, { method: req.method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(40000) }); }
  catch (e) { throw httpError(e.name === 'TimeoutError' ? 504 : 502, 'Could not reach Vault', 'upstream_unreachable'); }
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > MAX_RESPONSE) throw httpError(502, 'Vault response too large', 'upstream_error');
  res.writeHead(r.status >= 300 && r.status < 400 ? 502 : r.status, { 'content-type': r.headers.get('content-type') || 'application/json', 'cache-control': 'no-store' });
  res.end(buf);
}
