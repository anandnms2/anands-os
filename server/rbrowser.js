/* Full Chromium inside the Anands OS container. A real Chrome runs headless on this server (its own profile, so logins and cookies stay between visits)
 * and its screen is streamed to the Desktop Browser window as JPEG frames over server-sent events. Mouse, keyboard, scroll and paste go back as small POSTs.
 * Works over the normal HTTPS port, so there is nothing extra to deploy or open. No sound and no camera or microphone. */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { env } from 'node:process';
import { DATA } from './config.js';
import { json, readJson, httpError } from './util.js';
import { checkAddress } from './browse.js';

const BINS = [env.CHROMIUM_PATH, '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'];
const findBin = () => BINS.filter(Boolean).find((b) => { try { return fs.statSync(b).isFile(); } catch { return false; } }) || null;
const IDLE_MS = 10 * 60 * 1000;
const QUAL = { sharp: { live: 88, still: 96, dmin: 1.5 }, balanced: { live: 72, still: 90, dmin: 1 }, fast: { live: 50, still: 78, dmin: 1 } };
const B = { qual: 'sharp', proc: null, port: 0, ready: null, bcdp: null, tabs: new Map(), active: null, clients: new Set(), idle: null, poll: null, view: { w: 1280, h: 760 }, ua: '', last: '' };

class Cdp {
  constructor(url) { this.id = 0; this.p = new Map(); this.h = new Map(); this.ws = new WebSocket(url); this.open = new Promise((ok, no) => { this.ws.onopen = ok; this.ws.onerror = () => no(new Error('cdp connect failed')); }); this.ws.onmessage = (e) => this.msg(e.data); this.ws.onclose = () => { for (const [, r] of this.p) r[1](new Error('closed')); this.p.clear(); this.closed = true; this.h.get('close')?.forEach((f) => f()); }; }
  msg(d) { let m; try { m = JSON.parse(d); } catch { return; } if (m.id && this.p.has(m.id)) { const [ok, no] = this.p.get(m.id); this.p.delete(m.id); m.error ? no(new Error(m.error.message)) : ok(m.result || {}); } else if (m.method) this.h.get(m.method)?.forEach((f) => f(m.params || {})); }
  send(method, params = {}) {
    return new Promise((ok, no) => {
      if (this.closed) return no(new Error('closed')); const id = ++this.id;
      const t = setTimeout(() => { this.p.delete(id); no(new Error('timeout ' + method)); }, 15000);
      this.p.set(id, [(r) => { clearTimeout(t); ok(r); }, (e) => { clearTimeout(t); no(e); }]);
      try { this.ws.send(JSON.stringify({ id, method, params })); } catch (e) { clearTimeout(t); this.p.delete(id); no(e); }
    });
  }
  on(ev, fn) { if (!this.h.has(ev)) this.h.set(ev, []); this.h.get(ev).push(fn); }
  close() { try { this.ws.close(); } catch {} }
}
const freePort = () => new Promise((ok, no) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); s.on('error', no); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function jget(p) { const r = await fetch(`http://127.0.0.1:${B.port}${p}`, { signal: AbortSignal.timeout(4000) }); return r.json(); }

export const available = () => !!findBin();

async function start() {
  if (B.ready) return B.ready;
  B.ready = (async () => {
    const bin = findBin(); if (!bin) throw httpError(501, 'Chromium is not installed on this server', 'no_chromium');
    B.port = await freePort(); const dir = path.join(DATA, 'rbrowser'); fs.mkdirSync(dir, { recursive: true });
    try { for (const f of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) fs.rmSync(path.join(dir, f), { force: true }); } catch {}
    const proc = spawn(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-features=Translate,MediaRouter', '--hide-scrollbars', '--mute-audio', '--lang=en-US',
      '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=' + B.port, '--user-data-dir=' + dir, `--window-size=${B.view.w},${B.view.h}`, 'about:blank'], { stdio: 'ignore' });
    B.proc = proc; proc.on('exit', () => { if (B.proc === proc) reset(); });
    let v = null; for (let i = 0; i < 60 && !v; i++) { try { v = await jget('/json/version'); } catch { await sleep(250); } }
    if (!v) { try { proc.kill('SIGKILL'); } catch {} throw httpError(502, 'Chromium did not start', 'start_failed'); }
    B.ua = String(v['User-Agent'] || '').replace('HeadlessChrome', 'Chrome');
    B.bcdp = new Cdp(v.webSocketDebuggerUrl); await B.bcdp.open; B.bcdp.on('close', () => { if (B.proc === proc) reset(); });
    await B.bcdp.send('Browser.setDownloadBehavior', { behavior: 'deny' }).catch(() => {});
    await refreshTabs(); if (!B.tabs.size) await B.bcdp.send('Target.createTarget', { url: 'about:blank' }).then(refreshTabs);
    return true;
  })().catch((e) => { B.ready = null; throw e; });
  return B.ready;
}
function reset() { try { B.bcdp?.close(); } catch {} for (const t of B.tabs.values()) try { t.cdp?.close(); } catch {} try { B.proc?.kill('SIGKILL'); } catch {} B.proc = null; B.bcdp = null; B.ready = null; B.tabs = new Map(); B.active = null; B.last = ''; if (B.poll) { clearInterval(B.poll); B.poll = null; } for (const c of B.clients) sse(c, 'down', {}); }
export function shutdown() { reset(); }

function sse(res, ev, data) { try { res.write(`event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`); } catch {} }
const bcast = (ev, data) => { for (const c of B.clients) sse(c, ev, data); };
function tabList() { return [...B.tabs.values()].map((t) => ({ id: t.id, title: t.title || '', url: t.url || '', loading: !!t.loading })); }
async function refreshTabs() {
  let l; try { l = await jget('/json/list'); } catch { return; }
  const seen = new Set();
  for (const x of l) { if (x.type !== 'page' || /^devtools:/.test(x.url)) continue; seen.add(x.id); const t = B.tabs.get(x.id) || { id: x.id, ws: x.webSocketDebuggerUrl, cdp: null, loading: false }; t.title = x.title; t.url = x.url === 'about:blank' ? '' : x.url; t.ws = x.webSocketDebuggerUrl; if (!B.tabs.has(x.id)) { B.tabs.set(x.id, t); if (B.clients.size && B.tabs.size > 1) setTimeout(() => activate(x.id).catch(() => {}), 50); } }
  for (const id of [...B.tabs.keys()]) if (!seen.has(id)) { const t = B.tabs.get(id); try { t.cdp?.close(); } catch {} B.tabs.delete(id); if (B.active === id) { B.active = null; const n = B.tabs.keys().next().value; if (n) activate(n).catch(() => {}); } }
  const sig = JSON.stringify([tabList(), B.active]); if (sig !== B.last) { B.last = sig; bcast('tabs', { tabs: tabList(), active: B.active }); }
}
async function attach(t) {
  if (t.cdp && !t.cdp.closed) return t.cdp;
  const c = new Cdp(t.ws); await c.open; t.cdp = c;
  c.on('Page.screencastFrame', (p) => { c.send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {}); if (B.active !== t.id) return; const m = p.metadata || {};
    /* once the page stops changing, send one near-lossless frame so text and images are crisp */
    const n = (t.fn = (t.fn || 0) + 1); clearTimeout(t.still);
    t.still = setTimeout(async () => { try { if (t.fn !== n || B.active !== t.id || !B.clients.size) return; const r = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: QUAL[B.qual].still, fromSurface: true }); if (t.fn !== n || B.active !== t.id) return; for (const cl of B.clients) { if (cl.writableNeedDrain) continue; sse(cl, 'frame', { tab: t.id, w: Math.round(m.deviceWidth || B.view.w), h: Math.round(m.deviceHeight || B.view.h), d: r.data }); } } catch {} }, 280); for (const cl of B.clients) { if (cl.writableNeedDrain) continue; sse(cl, 'frame', { tab: t.id, w: Math.round(m.deviceWidth || B.view.w), h: Math.round(m.deviceHeight || B.view.h), d: p.data }); } });
  c.on('Page.frameStartedLoading', () => { t.loading = true; B.last = ''; });
  c.on('Page.frameStoppedLoading', () => { t.loading = false; B.last = ''; });
  c.on('Page.javascriptDialogOpening', (p) => { c.send('Page.handleJavaScriptDialog', { accept: p.type !== 'confirm' && p.type !== 'prompt' }).catch(() => {}); });
  await c.send('Page.enable'); await c.send('Runtime.enable').catch(() => {});
  if (B.ua) await c.send('Emulation.setUserAgentOverride', { userAgent: B.ua, acceptLanguage: 'en-US,en' }).catch(() => {});
  return c;
}
async function sizeTab(t) { const c = await attach(t); await c.send('Emulation.setDeviceMetricsOverride', { width: B.view.w, height: B.view.h, deviceScaleFactor: B.view.d || 1, mobile: false }); }
async function cast(t, on) { const c = await attach(t); if (!on) return c.send('Page.stopScreencast').catch(() => {}); await sizeTab(t); await c.send('Page.stopScreencast').catch(() => {}); await c.send('Page.startScreencast', { format: 'jpeg', quality: QUAL[B.qual].live, maxWidth: Math.round(B.view.w * (B.view.d || 1)), maxHeight: Math.round(B.view.h * (B.view.d || 1)), everyNthFrame: 1 }); }
async function activate(id) {
  const t = B.tabs.get(id); if (!t) throw httpError(404, 'No such tab', 'no_tab');
  if (B.active && B.active !== id) { const o = B.tabs.get(B.active); if (o?.cdp && !o.cdp.closed) cast(o, false).catch(() => {}); }
  B.active = id; B.last = ''; const c = await attach(t); await c.send('Page.bringToFront').catch(() => {}); await cast(t, true); await refreshTabs();
}
function ensurePoll() { if (!B.poll) B.poll = setInterval(() => { if (B.clients.size && B.ready) refreshTabs().catch(() => {}); }, 900); B.poll.unref?.(); }
function touchIdle() { clearTimeout(B.idle); if (!B.clients.size) B.idle = setTimeout(() => { if (!B.clients.size) reset(); }, IDLE_MS); }

const MODS = (m) => (Number(m) || 0) & 15;
const BTN = ['left', 'middle', 'right'];
async function input(t, ev) {
  const c = await attach(t);
  if (ev.t === 'm') {
    const x = +ev.x || 0, y = +ev.y || 0, mod = MODS(ev.mod), btn = BTN[ev.b] || 'none';
    if (ev.k === 'move') return c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, modifiers: mod, button: ev.held ? BTN[ev.b] || 'left' : 'none', buttons: ev.held ? 1 << (ev.b || 0) : 0 });
    return c.send('Input.dispatchMouseEvent', { type: ev.k === 'down' ? 'mousePressed' : 'mouseReleased', x, y, button: btn, buttons: ev.k === 'down' ? 1 << (ev.b || 0) : 0, clickCount: Math.min(3, Math.max(1, +ev.cc || 1)), modifiers: mod });
  }
  if (ev.t === 'w') return c.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: +ev.x || 0, y: +ev.y || 0, deltaX: Math.max(-4000, Math.min(4000, +ev.dx || 0)), deltaY: Math.max(-4000, Math.min(4000, +ev.dy || 0)), modifiers: MODS(ev.mod) });
  if (ev.t === 'k') {
    const key = String(ev.key || '').slice(0, 20), printable = key.length === 1 && !(MODS(ev.mod) & 6);
    return c.send('Input.dispatchKeyEvent', { type: ev.k === 'down' ? (printable ? 'keyDown' : 'rawKeyDown') : 'keyUp', key, code: String(ev.code || '').slice(0, 20), windowsVirtualKeyCode: +ev.kc || 0, nativeVirtualKeyCode: +ev.kc || 0, modifiers: MODS(ev.mod), text: ev.k === 'down' && printable ? key : undefined, unmodifiedText: ev.k === 'down' && printable ? key : undefined, autoRepeat: !!ev.rep });
  }
  if (ev.t === 'text') return c.send('Input.insertText', { text: String(ev.s || '').slice(0, 20000) });
}
const normUrl = (u) => { u = String(u || '').trim(); if (!u) return null; if (u === 'about:blank') return u; if (!/^https?:\/\//i.test(u)) return null; return u; };

export async function handleRb(req, res, url) {
  const p = url.pathname.replace(/^\/api\/rb/, '') || '/';
  if (p === '/status') return json(res, 200, { available: available(), running: !!B.ready });
  if (!available()) throw httpError(501, 'Chromium is not installed on this server', 'no_chromium');
  if (p === '/events' && req.method === 'GET') {
    await start(); ensurePoll();
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' }); res.write(': ok\n\n');
    B.clients.add(res); clearTimeout(B.idle);
    const hb = setInterval(() => { try { res.write(': hb\n\n'); } catch {} }, 20000);
    res.on('close', () => { clearInterval(hb); B.clients.delete(res); touchIdle(); });
    await refreshTabs(); sse(res, 'tabs', { tabs: tabList(), active: B.active });
    try { const id = B.active || B.tabs.keys().next().value; if (id) await activate(id); } catch {}
    return;
  }
  if (req.method !== 'POST') throw httpError(405, 'Use POST');
  await start(); const b = await readJson(req, 256 * 1024), tab = () => { const t = B.tabs.get(String(b.tab || '')); if (!t) throw httpError(404, 'That tab is closed', 'no_tab'); return t; };
  if (p === '/open') { let u = b.url ? normUrl(b.url) : 'about:blank'; if (!u) throw httpError(400, 'Only http and https addresses can be opened', 'bad_url'); if (u !== 'about:blank') await checkAddress(new URL(u)); const cur = (B.active && B.tabs.get(B.active) && !B.tabs.get(B.active).url ? B.tabs.get(B.active) : null) || [...B.tabs.values()].find((x) => !x.url); if (u !== 'about:blank' && cur) { const c = await attach(cur); await c.send('Page.navigate', { url: u }); await activate(cur.id); return json(res, 200, { ok: true, tab: cur.id }); } const r = await B.bcdp.send('Target.createTarget', { url: u }); await sleep(120); await refreshTabs(); await activate(r.targetId); return json(res, 200, { ok: true, tab: r.targetId }); }
  if (p === '/close') { const t = tab(); await B.bcdp.send('Target.closeTarget', { targetId: t.id }).catch(() => {}); await sleep(100); await refreshTabs(); if (!B.tabs.size) { const r = await B.bcdp.send('Target.createTarget', { url: 'about:blank' }); await sleep(100); await refreshTabs(); await activate(r.targetId); } return json(res, 200, { ok: true }); }
  if (p === '/activate') { await activate(tab().id); return json(res, 200, { ok: true }); }
  if (p === '/nav') { const t = tab(), u = normUrl(b.url); if (!u) throw httpError(400, 'Only http and https addresses can be opened', 'bad_url'); if (u !== 'about:blank') await checkAddress(new URL(u)); const c = await attach(t); const r = await c.send('Page.navigate', { url: u }); if (r.errorText) throw httpError(502, 'Could not open that page: ' + r.errorText.replace(/^net::/, ''), 'nav_failed'); return json(res, 200, { ok: true }); }
  if (p === '/go') {
    const t = tab(), c = await attach(t);
    if (b.dir === 'reload') await c.send('Page.reload'); else if (b.dir === 'stop') await c.send('Page.stopLoading'); else if (b.dir === 'back' || b.dir === 'forward') { const h = await c.send('Page.getNavigationHistory'), i = h.currentIndex + (b.dir === 'back' ? -1 : 1); if (h.entries[i]) await c.send('Page.navigateToHistoryEntry', { entryId: h.entries[i].id }); }
    return json(res, 200, { ok: true });
  }
  if (p === '/input') { const t = tab(), l = Array.isArray(b.ev) ? b.ev.slice(0, 50) : []; for (const ev of l) await input(t, ev).catch(() => {}); return json(res, 200, { ok: true }); }
  if (p === '/size') { const w = Math.min(2560, Math.max(320, Math.round(+b.w || 0))), h = Math.min(1600, Math.max(240, Math.round(+b.h || 0))); const d = Math.min(B.qual === 'fast' ? 1 : 2, Math.max(QUAL[B.qual].dmin, Math.round((+b.dpr || 1) * 4) / 4)); if (w === B.view.w && h === B.view.h && d === (B.view.d || 1)) return json(res, 200, { ok: true }); B.view = { w, h, d }; if (B.active && B.tabs.get(B.active)) await cast(B.tabs.get(B.active), true).catch(() => {}); return json(res, 200, { ok: true }); }
  if (p === '/quality') { const q = String(b.q || ''); if (!QUAL[q]) throw httpError(400, 'Unknown quality', 'bad_quality'); B.qual = q; const d = Math.min(q === 'fast' ? 1 : 2, Math.max(QUAL[q].dmin, B.view.d || 1)); B.view = { ...B.view, d }; if (B.active && B.tabs.get(B.active)) await cast(B.tabs.get(B.active), true).catch(() => {}); return json(res, 200, { ok: true, quality: q }); }
  if (p === '/clear') { const c = await attach(tab()); await c.send('Network.enable').catch(() => {}); await c.send('Network.clearBrowserCache').catch(() => {}); await c.send('Network.clearBrowserCookies').catch(() => {}); return json(res, 200, { ok: true }); }
  if (p === '/copy') { const t = tab(), c = await attach(t); const r = await c.send('Runtime.evaluate', { expression: 'String(getSelection())', returnByValue: true }); return json(res, 200, { text: String(r.result?.value || '').slice(0, 100000) }); }
  throw httpError(404, 'Unknown route');
}
process.on('exit', () => { try { B.proc?.kill('SIGKILL'); } catch {} });
for (const sg of ['SIGTERM', 'SIGINT']) process.on(sg, () => { try { B.proc?.kill('SIGKILL'); } catch {} process.exit(0); });
