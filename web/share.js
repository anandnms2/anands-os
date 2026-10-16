/* Phone app: share-to-OS (the system share sheet), offline bar, install button, and home-screen shortcuts. */
(function () {
'use strict';
var A = window.AOS; if (!A) return;
var S = A.S, $ = A.$, esc = A.esc, api = A.api, ic = A.ic, toast = A.toast, LS = A.LS;
var SH = { meta: null, install: null };

/* ---------- offline ---------- */
var bar = document.createElement('div'); bar.id = 'offbar'; bar.hidden = true; bar.setAttribute('role', 'status'); bar.textContent = 'You are offline. Showing what was saved on this device. Notes and tasks you add will be filed when you are back online.'; document.body.appendChild(bar);
function net() { bar.hidden = navigator.onLine; document.documentElement.classList.toggle('offline', !navigator.onLine); }
window.addEventListener('online', net); window.addEventListener('offline', net); net();
function tellSw(msg) { if (!('serviceWorker' in navigator)) return; navigator.serviceWorker.ready.then(function (r) { if (r.active) r.active.postMessage(msg); }).catch(function () {}); }
function offlineOn() { return LS.get('offline', true) !== false; }
tellSw({ t: 'offline', on: offlineOn() });
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); SH.install = e; if (S.view === 'appearance') A.redraw(); });
window.addEventListener('appinstalled', function () { SH.install = null; toast('Installed'); if (S.view === 'appearance') A.redraw(); });

/* ---------- share target ---------- */
function readShare() {
  if (!window.caches) return Promise.resolve(null);
  return caches.open('aos-share').then(function (c) { return c.match('/__share/meta').then(function (r) { return r ? r.json() : null; }); }).catch(function () { return null; });
}
function fileOf(i, m) { return caches.open('aos-share').then(function (c) { return c.match('/__share/f' + i); }).then(function (r) { return r ? r.blob() : null; }).then(function (b) { return b && new File([b], m.name, { type: m.type }); }); }
function clearShare() { SH.meta = null; if (window.caches) caches.delete('aos-share').catch(function () {}); }
function check() {
  if (!S.user) return; readShare().then(function (m) {
    if (!m || Date.now() - m.t > 6 * 3600e3) { if (m) clearShare(); return; }
    SH.meta = m; draw(); try { if (location.hash === '#share') history.replaceState(null, '', '/'); } catch (e) {}
  });
}
function summary() { var m = SH.meta, first = (m.title || m.text || m.url || '').split('\n')[0].trim(); if (m.url && first === m.url) first = ''; return { first: first, full: [m.title, m.text, m.url].filter(function (x, i, a) { return x && a.indexOf(x) === i; }).join('\n') }; }
function draw() {
  var m = SH.meta; if (!m) return; var hasText = !!(m.title || m.text || m.url), imgs = m.files.filter(function (f) { return /^image\//.test(f.type); }), imm = S.imm && S.imm.connected;
  var h = '<div class="modal" data-act="mx"><div class="card shr" role="dialog" aria-modal="true" aria-label="Shared with Anands OS"><div class="caph"><h2>Shared with Anands OS</h2><button class="btn sm" data-sh="dismiss" aria-label="Dismiss">' + ic('x') + '</button></div><div class="shrb">';
  if (hasText) h += '<blockquote class="shq">' + (m.title ? '<b>' + esc(m.title) + '</b>' : '') + (m.text ? '<div>' + esc(m.text.slice(0, 400)) + '</div>' : '') + (m.url ? '<a href="' + esc(m.url) + '" target="_blank" rel="noopener">' + esc(m.url.slice(0, 100)) + '</a>' : '') + '</blockquote>';
  if (m.files.length) h += '<div class="shf">' + m.files.slice(0, 8).map(function (f) { return '<span class="pill">' + ic(/^image\//.test(f.type) ? 'image' : 'doc') + esc(f.name.slice(0, 28)) + '</span>'; }).join('') + (m.files.length > 8 ? '<span class="note">+' + (m.files.length - 8) + ' more</span>' : '') + '</div>';
  h += '<p class="note" style="margin:0">Where should it go?</p><div class="shact">';
  if (hasText) h += '<button class="btn primary" data-sh="task">' + ic('check') + 'Make a task</button><button class="btn" data-sh="note">' + ic('doc') + 'Save as a note</button>';
  if (m.files.length) h += '<button class="btn' + (hasText ? '' : ' primary') + '" data-sh="files">' + ic('folder') + 'Save ' + (m.files.length > 1 ? m.files.length + ' files' : 'file') + ' to Files</button>';
  if (imgs.length && imm) h += '<button class="btn" data-sh="photos">' + ic('photos') + 'Add ' + (imgs.length > 1 ? imgs.length + ' pictures' : 'picture') + ' to Photos</button>';
  if (m.url) h += '<button class="btn" data-sh="open">' + ic('open') + 'Open the link</button>';
  h += '</div></div></div></div>'; var el = $('#modal'); el.hidden = false; el.innerHTML = h;
}
function done(msg) { clearShare(); A.modal(); if (msg) toast(msg); }
function fail(e) { toast((e && e.message) || 'Could not save that'); }
document.addEventListener('click', function (ev) {
  var b = ev.target.closest && ev.target.closest('[data-sh]'); if (!b) return; var a = b.getAttribute('data-sh'), m = SH.meta;
  if (a === 'install') { if (SH.install) { SH.install.prompt(); SH.install.userChoice.then(function () { SH.install = null; A.redraw(); }); } return; }
  if (a === 'offline') return;
  if (a === 'clearoffline') { tellSw({ t: 'clear' }); return void toast('Saved copies removed from this device'); }
  if (a === 'testshare') return void toast('On your phone: open any page or photo, tap Share, and choose Anands OS.');
  if (!m) return;
  if (a === 'dismiss') return void done();
  if (a === 'task') { var s = summary(), title = (s.first || m.url || 'Shared item').slice(0, 140) + (m.url && s.first ? ' ' + m.url : ''); return void AOSCapture.addTask(title.slice(0, 200)).then(function () { done(); }); }
  if (a === 'note') return void AOSCapture.addNote(summary().full || 'Shared item').then(function () { done(); });
  if (a === 'open') { window.open(m.url, '_blank', 'noopener'); return; }
  if (a === 'files' || a === 'photos') {
    var list = a === 'photos' ? m.files.filter(function (f) { return /^image\//.test(f.type); }) : m.files; b.disabled = true; b.textContent = 'Saving...';
    list.reduce(function (p, f) { return p.then(function () { return fileOf(f.i, f).then(function (file) { if (!file) return; return a === 'photos' ? api('/api/photos/upload', { method: 'POST', body: file, headers: { 'x-filename': encodeURIComponent(file.name), 'x-created': String(Date.now()), 'content-type': file.type || 'image/jpeg' } }) : AOSCapture.putFile(AOSCapture.stamp() + ' ' + file.name, file, file.type); }); }); }, Promise.resolve())
      .then(function () { if (a === 'photos') { S.tl = { items: [], next: 1, loading: false, error: null, loaded: false }; S.albums = null; } done(list.length + (list.length === 1 ? ' item' : ' items') + ' saved' + (a === 'photos' ? ' to Photos' : ' to Files / Captures')); }).catch(fail);
  }
});
document.addEventListener('change', function (ev) { if (ev.target.getAttribute && ev.target.getAttribute('data-sh') === 'offline') { LS.set('offline', ev.target.checked); tellSw({ t: 'offline', on: ev.target.checked }); toast(ev.target.checked ? 'Offline copy is on' : 'Offline copy is off and removed'); } });

/* ---------- appearance page card ---------- */
function card() {
  var standalone = window.matchMedia && matchMedia('(display-mode: standalone)').matches, ios = /iPhone|iPad/.test(navigator.userAgent);
  return '<div class="card apc"><h2>Phone app</h2><p class="note" style="margin:0">' + (standalone ? 'You are using the installed app.' : 'Install Anands OS to get its own icon, full screen, offline mode, and a place in your phone\'s Share menu.') + '</p><div class="aprow">' +
    (!standalone && SH.install ? '<button class="btn primary" data-sh="install">Install the app</button>' : '') + (!standalone && !SH.install ? '<span class="note">' + (ios ? 'On iPhone: tap Share, then Add to Home Screen.' : 'In Chrome: menu, then Install app or Add to Home screen.') + '</span>' : '') + '<button class="btn sm" data-sh="testshare">How sharing works</button></div>' +
    '<label class="apchk"><input type="checkbox" data-sh="offline"' + (offlineOn() ? ' checked' : '') + '> Keep a copy of my last views on this device so the app opens without signal (your Pulse inbox summary is included). Cleared when you sign out.</label><div class="aprow"><button class="btn sm" data-sh="clearoffline">Remove saved copies now</button></div></div>';
}

/* ---------- shortcuts from the home screen icon ---------- */
function hashActions() {
  var h = location.hash; if (h === '#capture' && window.AOSCapture) { AOSCapture.open(); history.replaceState(null, '', '/'); } else if (h === '#search' && window.AOSOmni) { AOSOmni.open(); history.replaceState(null, '', '/'); }
}
(function wait(n) { if (S.user) { check(); hashActions(); return; } if (n < 100) setTimeout(function () { wait(n + 1); }, 200); })(0);
document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
window.AOSShare = { check: check, card: card, state: SH };
})();
