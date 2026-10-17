/* Anands OS service worker: app shell offline, a small saved copy of your last views, and the phone share target.
 * Photos, files and everything else always go to the network. */
const V = 'aos-shell-78';
const API = 'aos-api-1', SHARE = 'aos-share', FLAGS = 'aos-flags';
const SHELL = ['/', '/os.css', '/os.js', '/drive.js', '/integrations.js', '/cards.js', '/qrcode.js', '/mycards.js', '/servers.js', '/ai.js', '/cloud.js', '/profile.js', '/home.js', '/omni.js', '/capture.js', '/security.js', '/appearance.js', '/share.js', '/team.js', '/money-os.js', '/desktop.js', '/deskapps.js', '/browser-settings.js', '/vault-crypto.js', '/logo-white.png', '/logo-orange.png', '/manifest.webmanifest', '/icon-192.png'];
/* Read-only views worth showing when there is no signal. Cleared when you sign out or turn the option off. */
const OFFLINE_API = ['/api/session', '/api/settings', '/api/prefs', '/api/profile', '/apps.json'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => ![V, API, SHARE, FLAGS].includes(x)).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });

async function offlineOn() { try { const r = await (await caches.open(FLAGS)).match('/flag/offline'); return !r || (await r.text()) !== '0'; } catch { return true; } }
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.t === 'offline') e.waitUntil((async () => { await (await caches.open(FLAGS)).put('/flag/offline', new Response(d.on ? '1' : '0')); if (!d.on) await caches.delete(API); })());
  if (d.t === 'clear') e.waitUntil(caches.delete(API));
});

/* Phone share sheet: store what was shared, then open the app, which asks where to put it. */
async function takeShare(request) {
  const fd = await request.formData(); const c = await caches.open(SHARE);
  for (const k of await c.keys()) await c.delete(k);
  const meta = { t: Date.now(), title: String(fd.get('title') || ''), text: String(fd.get('text') || ''), url: String(fd.get('url') || ''), files: [] };
  let i = 0;
  for (const f of fd.getAll('files')) { if (!(f instanceof File)) continue; await c.put('/__share/f' + i, new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream' } })); meta.files.push({ i, name: f.name || 'shared-' + i, type: f.type || 'application/octet-stream', size: f.size }); i++; }
  await c.put('/__share/meta', new Response(JSON.stringify(meta), { headers: { 'content-type': 'application/json' } }));
  return Response.redirect('/#share', 303);
}

self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (r.method === 'POST' && u.pathname === '/share-target') { e.respondWith(takeShare(r).catch(() => Response.redirect('/', 303))); return; }
  if (r.method !== 'GET') return;
  if (u.pathname === '/auth/logout') { e.waitUntil(caches.delete(API)); return; }
  if (OFFLINE_API.includes(u.pathname) && !u.search.includes('refresh')) {
    e.respondWith((async () => {
      try { const res = await fetch(r); if (res.ok && await offlineOn()) { const c = await caches.open(API); c.put(u.pathname, res.clone()); } return res; }
      catch (err) { const hit = await (await caches.open(API)).match(u.pathname); if (hit) { const h = new Headers(hit.headers); h.set('x-aos-offline', '1'); return new Response(hit.body, { status: 200, headers: h }); } throw err; }
    })()); return;
  }
  if (r.mode === 'navigate' && u.pathname === '/') {
    e.respondWith(fetch(r).then((res) => { if (res.ok) { const c = res.clone(); caches.open(V).then((x) => x.put('/', c)); } return res; }).catch(() => caches.match('/')));
    return;
  }
  if (SHELL.includes(u.pathname)) {
    e.respondWith(fetch(r).then((res) => { if (res.ok) { const c = res.clone(); caches.open(V).then((x) => x.put(r, c)); } return res; }).catch(() => caches.match(r)));
  }
});
