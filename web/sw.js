/* App-shell cache only. API, app and photo traffic always goes to the network. */
const V = 'aos-shell-26';
const SHELL = ['/', '/os.css', '/os.js', '/drive.js', '/integrations.js', '/cards.js', '/qrcode.js', '/mycards.js', '/servers.js', '/pulse.js', '/pulse2.js', '/home.js', '/desktop.js', '/vault-crypto.js', '/logo-white.png', '/logo-orange.png', '/manifest.webmanifest', '/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || !SHELL.includes(u.pathname)) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); } return res; }).catch(() => caches.match(r)));
});
