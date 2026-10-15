import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { PORT, WEB, SUITE, SHIM, OIDC, PASSWORD, PASSWORD_GENERATED, DATA, effective, publicSettings, updateSettings, env } from './config.js';
import { sessionOf } from './session.js';
import { handleAuth, sessionInfo } from './auth.js';
import { json, readJson, httpError } from './util.js';
import { handlePhotos, status as immichStatus } from './immich.js';
import { handleInsights, insights, clearInsightsCache } from './coolify.js';
import { handleStatus, test as statusTest, clearStatusCache } from './status.js';
import { handleVpn, test as vpnTest } from './vpn.js';
import { handleCards, test as cardsTest, clearCardsCache } from './cardscan.js';
import { handlePulse, test as pulseTest, clearPulseCache } from './pulse.js';
import { handleChat } from './chat.js';
import { handleBrowse } from './browse.js';
import { handleRb } from './rbrowser.js';
import { handleMailboxes, syncAll } from './mailbox.js';
import { handleGdrive, googleCallback, gConnected, gConfigured } from './gdrive.js';
import { ping as davPing } from './webdav.js';
import { handleVault, status as vaultStatus } from './vault.js';
import { handleLocal } from './local.js';
import { isWorkerPath, handleWorkerRequest, isGuestPage, serveGuestPage } from './workers.js';
import { noteOrigin, publicOrigin } from './origin.js';
import { handlePeer, handleRooms, isPeerPath, isRoomPath } from './meet.js';
import * as mail from './mail.js';
import { serveStatic } from './static.js';

const CONNECT_EXTRA = (env.CONNECT_SRC_EXTRA || '').trim();
const BASE_HEADERS = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'permissions-policy': 'camera=(self), microphone=(self), display-capture=(self), geolocation=()' };
const UI_CSP_PARTS = ["default-src 'self'", "script-src 'self' 'wasm-unsafe-eval'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src https://fonts.gstatic.com", "img-src 'self' data: blob:", "media-src 'self' blob:", "connect-src 'self'"];
const rbOrigin = () => { try { const u = effective().rbrowser.url; return u ? new URL(u).origin : ''; } catch { return ''; } };
const pulseOrigin = () => { try { const u = effective().pulse.url; return u ? new URL(u).origin : ''; } catch { return ''; } };
const uiCsp = () => [...UI_CSP_PARTS, "frame-src 'self' " + rbOrigin() + ' ' + pulseOrigin(), "manifest-src 'self'", "worker-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'self'"].join('; ');
/* Apps can only talk to this server. puter.com is not reachable from them: nothing else is in connect-src. */
const APP_CSP = `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self' data: blob: ${CONNECT_EXTRA}; worker-src 'self' blob:; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'`;

async function api(req, res, url) {
  const p = url.pathname;
  if (p === '/api/settings' && req.method === 'GET') return json(res, 200, publicSettings());
  if (p === '/api/settings' && req.method === 'PUT') { updateSettings(await readJson(req, 16 * 1024)); clearInsightsCache(); clearStatusCache(); clearCardsCache(); clearPulseCache(); return json(res, 200, publicSettings()); }
  if (p === '/api/settings/test' && req.method === 'POST') {
    const { target } = await readJson(req, 1024);
    if (target === 'immich') return json(res, 200, await immichStatus());
    if (target === 'dav') return json(res, 200, await davPing());
    if (target === 'vault') return json(res, 200, await vaultStatus());
    if (target === 'mail') return json(res, 200, await mail.verify());
    if (target === 'google') return json(res, 200, { configured: gConfigured(), connected: gConnected(), reason: gConfigured() ? (gConnected() ? '' : 'Not connected yet. Use Connect Google Drive.') : 'Add the client ID and secret.' });
    if (target === 'pulse') return json(res, 200, await pulseTest());
    if (target === 'status') return json(res, 200, await statusTest());
    if (target === 'vpn') return json(res, 200, await vpnTest());
    if (target === 'cards') return json(res, 200, await cardsTest());
    if (target === 'coolify') { try { const d = await insights(true); return json(res, 200, { configured: true, connected: true, resources: d.resources.length }); } catch (e) { return json(res, 200, { configured: e.code !== 'not_configured', connected: false, reason: e.message }); } }
    throw httpError(400, 'Unknown target');
  }
  if (p === '/api/mail/status') return json(res, 200, { configured: mail.configured(), ...mail.usage(), recent: mail.recentLog(), publicAddress: publicOrigin() });
  if (p === '/api/mail/test' && req.method === 'POST') {
    const { to } = await readJson(req, 1024); const m = publicSettings().mail; const dest = String(to || m.from || '').trim();
    if (!mail.validEmail(dest)) throw httpError(400, 'Enter an address to send the test to');
    await mail.sendMail({ to: dest, subject: 'Anands OS test email', text: 'This is a test from Anands OS. If you can read it, your email settings work.\n\nInvitations, RSVP replies and booking confirmations will be sent the same way.' });
    return json(res, 200, { ok: true, sentTo: dest });
  }
  if (p === '/api/drive/status') return json(res, 200, await davPing());
  if (p.startsWith('/api/vault/')) return handleVault(req, res, url);
  if (p.startsWith('/api/photos')) return handlePhotos(req, res, url);
  if (p === '/api/mailboxes' || p.startsWith('/api/mailboxes/')) return handleMailboxes(req, res, url);
  if (p === '/api/rb' || p.startsWith('/api/rb/')) return handleRb(req, res, url);
  if (p === '/api/browse' && (req.method === 'GET' || req.method === 'POST')) return handleBrowse(req, res, url);
  if (p === '/api/gdrive' || p.startsWith('/api/gdrive/')) return handleGdrive(req, res, url);
  if (p === '/api/pulse' || p.startsWith('/api/pulse/')) return handlePulse(req, res, url);
  if (p === '/api/status' || p.startsWith('/api/status/')) return handleStatus(req, res, url);
  if (p === '/api/vpn' || p.startsWith('/api/vpn/')) return handleVpn(req, res, url);
  if (p === '/api/cards' || p === '/api/my-cards' || p.startsWith('/api/my-cards/') || p.startsWith('/api/cards/') || p.startsWith('/api/cs/')) return handleCards(req, res, url);
  if (p === '/api/insights') return handleInsights(req, res, url);
  if (p === '/api/chat' || p === '/api/chat/test') return handleChat(req, res, url);
  throw httpError(404, 'Unknown API route');
}

const server = http.createServer(async (req, res) => {
  for (const [k, v] of Object.entries(BASE_HEADERS)) res.setHeader(k, v);
  try {
    const url = new URL(req.url, 'http://x'); const p = url.pathname;
    if (p === '/healthz') return json(res, 200, { ok: true });
    if (p === '/auth/google/callback') { if (!sessionOf(req)) throw httpError(401, 'Sign in to Anands OS first, then connect Google Drive from Settings.'); return await googleCallback(req, res, url); }
    if (p.startsWith('/auth/')) { if (await handleAuth(req, res, url) !== false) return; throw httpError(404, 'Not found'); }
    if (p === '/api/session') return json(res, 200, sessionInfo(req));
    if (p === '/_suite/puter.js') { return serveStatic(req, res, path.dirname(SHIM), path.basename(SHIM), {}); }
    if (p === '/_suite/peer.js') { return serveStatic(req, res, path.dirname(SHIM), 'peer.js', {}); }
    if ((req.method === 'GET' || req.method === 'HEAD') && isGuestPage(p)) return serveGuestPage(req, res, p);
    /* Meetings for guests: the link /meet/#/m/<code> opens the Meetings app without signing in. Only that app's files are served here. */
    if (p === '/meet') { res.writeHead(302, { location: '/meet/' + url.search }); return res.end(); }
    if (p.startsWith('/meet/') && (req.method === 'GET' || req.method === 'HEAD')) { res.setHeader('referrer-policy', 'same-origin'); return serveStatic(req, res, SUITE, 'apps/meetings/' + p.slice(6), { 'content-security-policy': APP_CSP }, { rebrand: true }); }
    if (isPeerPath(p)) return await handlePeer(req, res, url);
    if (isRoomPath(p)) return await handleRooms(req, res, url);
    if (isWorkerPath(p) && ['GET', 'HEAD', 'POST', 'PUT'].includes(req.method)) return await handleWorkerRequest(req, res, url);
    if (sessionOf(req)) noteOrigin(req);
    const protectedPath = p.startsWith('/api/') || p.startsWith('/_local/') || p.startsWith('/apps/');
    if (protectedPath && !sessionOf(req)) {
      if (p.startsWith('/apps/')) { res.writeHead(401, { 'content-type': 'text/html; charset=utf-8' }); return res.end('<!doctype html><meta charset=utf-8><body style="font:16px system-ui;padding:2rem">Sign in at <a href="/">Anands OS</a> first.'); }
      throw httpError(401, 'Sign in first', 'auth_required');
    }
    if (req.method !== 'GET' && req.method !== 'HEAD' && (p.startsWith('/api/') || p.startsWith('/_local/')) && p !== '/api/browse' && req.headers['x-aos'] !== '1') throw httpError(403, 'Missing x-aos header', 'csrf');
    if (p.startsWith('/api/')) return await api(req, res, url);
    if (p.startsWith('/_local/')) return await handleLocal(req, res, url);
    if (p.startsWith('/apps/')) {
      if (/^\/apps\/[^/]+$/.test(p)) { res.writeHead(302, { location: p + '/' }); return res.end(); }
      res.setHeader('referrer-policy', 'same-origin');
      return serveStatic(req, res, SUITE, p.slice(1), { 'content-security-policy': APP_CSP }, { rebrand: true });
    }
    /* Apps are built for the site root: they ask for /icons/x.png, /app.wasm and so on. Resolve those inside the app that asked. */
    if ((req.method === 'GET' || req.method === 'HEAD') && p !== '/' && req.headers.referer) {
      let slug = null; try { const m = new URL(req.headers.referer).pathname.match(/^\/apps\/([^/]+)\//); if (m && /^[a-z0-9-]+$/.test(m[1])) slug = m[1]; } catch {}
      if (slug && sessionOf(req)) {
        const root = path.join(SUITE, 'apps', slug); let hit = false;
        try { const abs = path.join(root, path.normalize('/' + decodeURIComponent(p))); hit = abs.startsWith(root + path.sep) && fs.statSync(abs).isFile(); } catch {}
        if (hit) return serveStatic(req, res, root, p.slice(1), { 'content-security-policy': APP_CSP }, { rebrand: true });
      }
    }
    if (p === '/apps.json') {
      try { const L = JSON.parse(fs.readFileSync(path.join(SUITE, 'apps.json'), 'utf8')); const N = { email: 'Anands Email', meetings: 'Anands Meeting' }; for (const a of L) if (N[a.slug]) a.name = N[a.slug];
        const body = JSON.stringify(L); res.writeHead(200, { 'content-type': 'application/json', 'content-security-policy': uiCsp(), 'cache-control': 'no-cache' }); return res.end(body); } catch {}
    }
    if (/^\/_icons\/[a-z0-9-]+\.png$/.test(p) && fs.existsSync(path.join(WEB, 'icons', p.slice(8)))) return serveStatic(req, res, path.join(WEB, 'icons'), p.slice(8), { 'content-security-policy': uiCsp() });
    if (p === '/apps.json' || p.startsWith('/_icons/')) return serveStatic(req, res, SUITE, p.slice(1), { 'content-security-policy': uiCsp() });
    return serveStatic(req, res, WEB, p === '/' ? 'index.html' : p.slice(1), { 'content-security-policy': uiCsp() });
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500 && status !== 502 && status !== 504) console.error(e);
    if (!res.headersSent) json(res, status, { error: e.message || 'Server error', code: e.code });
    else res.destroy();
  }
});
server.requestTimeout = 0; server.headersTimeout = 30000;
server.listen(PORT, () => {
  console.log(`Anands OS listening on :${PORT}  data=${DATA}  suite=${fs.existsSync(SUITE) ? 'ok' : 'MISSING ' + SUITE}`);
  setTimeout(() => syncAll().catch(() => {}), 5000);
  if (OIDC) console.log(`Sign-in: SSO (${OIDC.issuer})${PASSWORD ? ' and password' : ''}`);
  else console.log('Sign-in: password' + (PASSWORD_GENERATED ? ` (generated; also in ${DATA}/initial-password): ${PASSWORD}` : ' (APP_PASSWORD)'));
});
