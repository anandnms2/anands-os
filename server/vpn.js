/* Anands VPN (wg-easy v15). Its REST API uses HTTP Basic auth, so the login stays on this server.
 * Note: a wg-easy user with two-factor turned on cannot use Basic auth; use a separate user without it. */
import { effective } from './config.js';
import { json, rawFetch, httpError, readJson } from './util.js';

const conn = () => {
  const s = effective().vpn;
  if (!s.url || !s.user || !s.pass) throw httpError(409, 'VPN (wg-easy) is not connected. Add its address and a user in Settings.', 'not_configured');
  return { base: s.url.replace(/\/+$/, ''), auth: 'Basic ' + Buffer.from(s.user + ':' + s.pass).toString('base64') };
};
async function wg(path, init = {}) {
  const c = conn();
  const r = await rawFetch(c.base + path, { ...init, headers: { authorization: c.auth, ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}) } });
  if (r.status === 401 || r.status === 403) throw httpError(502, 'VPN rejected the user or password (accounts with two-factor cannot be used here)', 'upstream_auth');
  if (!r.ok) throw httpError(r.status === 404 ? 404 : 502, (r.data && (r.data.statusMessage || r.data.message)) || 'VPN answered ' + r.status, 'upstream_' + r.status);
  return r;
}
const cid = (v) => { if (!/^\d{1,9}$/.test(String(v || ''))) throw httpError(400, 'Bad client id'); return String(v); };
const iso = (v) => (v ? new Date(v).toISOString() : null);
const shape = (c) => ({
  id: c.id, name: c.name, enabled: !!c.enabled, address: c.ipv4Address || '', address6: c.ipv6Address || '', expiresAt: iso(c.expiresAt), createdAt: iso(c.createdAt),
  handshake: iso(c.latestHandshakeAt), endpoint: c.endpoint || '', rx: Number(c.transferRx) || 0, tx: Number(c.transferTx) || 0,
  online: !!c.latestHandshakeAt && Date.now() - new Date(c.latestHandshakeAt).getTime() < 180000
});
export async function list() {
  const r = await wg('/api/client');
  const clients = (Array.isArray(r.data) ? r.data : []).map(shape);
  return { takenAt: new Date().toISOString(), clients, total: clients.length, online: clients.filter((c) => c.online).length, enabled: clients.filter((c) => c.enabled).length };
}
export async function handleVpn(req, res, url) {
  const p = url.pathname, m = req.method;
  if (p === '/api/vpn' && m === 'GET') return json(res, 200, await list());
  if (p === '/api/vpn' && m === 'POST') {
    const b = await readJson(req, 4096); const name = String(b.name || '').trim();
    if (!name) throw httpError(400, 'Give the device a name');
    const exp = String(b.expiresAt || '').trim();
    if (exp && isNaN(Date.parse(exp))) throw httpError(400, 'Expiry is not a valid date');
    const r = await wg('/api/client', { method: 'POST', body: JSON.stringify({ name, expiresAt: exp ? new Date(exp).toISOString() : null }) });
    return json(res, 200, { ok: true, id: r.data?.clientId ?? null });
  }
  const mm = p.match(/^\/api\/vpn\/(\d+)(?:\/(enable|disable|config|qr))?$/);
  if (!mm) throw httpError(404, 'Unknown VPN route');
  const id = cid(mm[1]), act = mm[2];
  if (act === 'enable' && m === 'POST') { await wg(`/api/client/${id}/enable`, { method: 'POST' }); return json(res, 200, { ok: true }); }
  if (act === 'disable' && m === 'POST') { await wg(`/api/client/${id}/disable`, { method: 'POST' }); return json(res, 200, { ok: true }); }
  if (act === 'config' && m === 'GET') {
    const r = await wg(`/api/client/${id}/configuration`);
    const name = String(url.searchParams.get('name') || 'device').replace(/[^\w.-]+/g, '_').slice(0, 40) || 'device';
    res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-disposition': `attachment; filename="${name}.conf"`, 'cache-control': 'no-store' });
    return res.end(r.text);
  }
  if (act === 'qr' && m === 'GET') {
    const r = await wg(`/api/client/${id}/qrcode.svg`);
    res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'" });
    return res.end(r.text);
  }
  if (!act && m === 'PUT') {
    const b = await readJson(req, 4096); const name = String(b.name || '').trim(); if (!name) throw httpError(400, 'Give the device a name');
    const cur = (await wg(`/api/client/${id}`)).data || {};
    const { id: _i, userId, publicKey, privateKey, preSharedKey, createdAt, updatedAt, endpoint, ...rest } = cur;
    const body = { ...rest, name }; if (b.expiresAt !== undefined) body.expiresAt = b.expiresAt ? new Date(b.expiresAt).toISOString() : null;
    await wg(`/api/client/${id}`, { method: 'POST', body: JSON.stringify(body) });
    return json(res, 200, { ok: true });
  }
  if (!act && m === 'DELETE') { await wg(`/api/client/${id}`, { method: 'DELETE' }); return json(res, 200, { ok: true }); }
  throw httpError(405, 'Method not allowed');
}
export async function test() { try { const d = await list(); return { configured: true, connected: true, resources: d.total, unit: 'devices' }; } catch (e) { return { configured: e.code !== 'not_configured', connected: false, reason: e.message }; } }
export async function vpnContext() { try { const d = await list(); return { devices: d.total, online: d.online, names: d.clients.slice(0, 30).map((c) => ({ name: c.name, enabled: c.enabled, online: c.online })) }; } catch { return null; } }
