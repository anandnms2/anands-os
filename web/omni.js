/* Ctrl+K: one box for apps, commands and everything you have stored (mail, WhatsApp, tasks, contacts, vault names, files, photos). */
(function () {
'use strict';
var A = window.AOS; if (!A) return;
var S = A.S, $ = A.$, esc = A.esc, api = A.api, ic = A.ic, toast = A.toast;
var O = { q: '', res: [], sel: 0, tok: 0, timer: null, groups: {}, off: {} };

function pulseOn() { var c = (S.settings || {}).pulse; return !!(c && c.url && c.user && c.passSet); }
function px() { return window.AOSPulse2 && window.AOSPulse2.state; }
function nav(v) { return function () { S.openApp = null; A.go(v); }; }
function pulseView(v) { return function () { var P = px(); if (P) { P.view = v; A.LS.set('pxview', v); } A.go('pulse'); }; }

/* ---------- commands ---------- */
function commands() {
  var c = [];
  var add = function (n, s, i, run, kw) { c.push({ g: 'Go to', n: n, s: s, ic: i, run: run, kw: kw || '' }); };
  add('Home', 'Overview', 'home', nav('home')); add('Photos', 'Immich library', 'photos', nav('photos')); add('Drive', 'Files', 'cloud', nav('drive'), 'files storage');
  add('Vault', 'Passwords', 'lock', nav('vault'), 'passwords'); add('Cloud Insights', 'Servers and deployments', 'insights', nav('insights'), 'coolify'); add('Servers', 'Server health', 'monitor', nav('servers'));
  add('Pulse', 'Mail, WhatsApp, tasks', 'pulse', nav('pulse'), 'inbox'); add('VPN', 'WireGuard', 'vpn', nav('vpn'), 'wireguard'); add('Cards', 'Business cards and contacts', 'cards', nav('cards'), 'contacts');
  add('Suite', 'All apps', 'apps', nav('apps')); add('Settings', 'Connections and preferences', 'settings', nav('settings'), 'connections');
  if (window.AOSSec) add('Security center', 'Sessions, sign-in history, password health', 'shield', nav('security'), 'sessions logins passwords');
  if (window.AOSAppearance) add('Appearance', 'Theme, wallpaper, widgets', 'image', nav('appearance'), 'theme wallpaper colour widgets');
  if (window.AOSTeam) add('Team and guests', 'Invite people and set what they can open', 'cards', nav('team'), 'guest invite members share access');
  [['Inbox', 'inbox'], ['WhatsApp', 'chats'], ['Tasks', 'tasks'], ['Calendar', 'calendar']].forEach(function (x) { if (pulseOn()) add('Pulse: ' + x[0], 'Pulse', 'pulse', pulseView(x[1])); });
  S.apps.forEach(function (a) { if (a.hasSource) c.push({ g: 'Apps', n: a.name, s: 'Suite app', img: '/_icons/' + a.slug + '.png', run: function () { A.launch(a.slug); }, kw: a.slug + ' ' + (a.alternativeTo || '') }); });
  var act = function (n, s, i, run, kw) { c.push({ g: 'Actions', n: n, s: s, ic: i, run: run, kw: kw || '' }); };
  if (window.AOSCapture) {
    act('Quick capture', 'Note, task, voice memo or photo', 'plus', function () { AOSCapture.open(); }, 'new add note task voice photo');
    act('New task', 'Type: task buy tyres', 'check', function () { AOSCapture.open('task'); }, 'todo');
    act('New note', 'Type: note idea for Monday', 'doc', function () { AOSCapture.open('note'); }, 'memo');
    act('Record voice memo', 'Saved to your files', 'camera', function () { AOSCapture.open('voice'); }, 'audio record');
    act('Add a photo', 'Camera or picture', 'camera', function () { AOSCapture.open('photo'); }, 'camera upload');
  }
  act('Lock vault', 'Locks the Vault now', 'lock', function () { if (A.vaultLock) A.vaultLock(); toast('Vault locked'); }, 'lock password');
  act('Open Desktop', 'Windows and apps side by side', 'desk', function () { if (window.AOSDesk) AOSDesk.show(); }, 'windows');
  act('Switch light or dark', 'Appearance', 'image', function () { if (window.AOSAppearance) AOSAppearance.toggleMode(); }, 'theme dark light mode');
  act('Keyboard shortcuts', 'Show all shortcuts', 'info', function () { if (window.AOSAppearance) AOSAppearance.help(); }, 'keys help ?');
  if (pulseOn()) act('Refresh Pulse', 'Fetch mail and WhatsApp now', 'pulse', function () { if (window.AOSPulse2) AOSPulse2.load(true).then(function () { toast('Pulse refreshed'); }); });
  act('Sign out', 'Leave Anands OS', 'out', function () { location.href = '/auth/logout'; }, 'logout');
  return c;
}
function words(q) { return q.toLowerCase().split(/\s+/).filter(Boolean); }
function hit(x, ws) { var h = (x.n + ' ' + (x.s || '') + ' ' + (x.kw || '')).toLowerCase(); return ws.every(function (w) { return h.indexOf(w) > -1; }); }
function rank(x, ws) { var n = x.n.toLowerCase(); return (n === ws.join(' ') ? 0 : n.indexOf(ws[0]) === 0 ? 1 : n.indexOf(ws[0]) > -1 ? 2 : 3); }

/* ---------- sources ---------- */
function localSources(q, ws) {
  var out = [], P = px(), b = P && P.boot;
  if (b) {
    (b.items || []).filter(function (i) { return hit({ n: (i.subj || '') + ' ' + (i.from || ''), s: (i.snip || '') + ' ' + (i.sum || '') }, ws); }).slice(0, 5).forEach(function (i) {
      var mail = String(i.id)[0] === 'e';
      out.push({ g: mail ? 'Mail' : 'WhatsApp', n: mail ? (i.subj || '(no subject)') : (i.from || 'WhatsApp'), s: mail ? (i.from || '') : String(i.snip || i.sum || '').slice(0, 80), ic: mail ? 'doc' : 'chat', run: function () { AOSPulse2.openRef(i); } });
    });
    (b.tasks || []).filter(function (t) { return hit({ n: t.title || '' }, ws); }).slice(0, 5).forEach(function (t) {
      out.push({ g: 'Tasks', n: t.title, s: (t.status === 'done' ? 'Done' : 'Open') + (t.due ? ' · due ' + t.due : ''), ic: 'check', run: function () { AOSPulse2.openTask(t.id); } });
    });
  }
  var V = S.vault; if (V && V.items) V.items.filter(function (i) { return hit({ n: i.name || '', s: (i.user || '') + ' ' + (i.url || '') }, ws); }).slice(0, 5).forEach(function (i) {
    out.push({ g: 'Vault', n: i.name, s: i.user || i.url || 'Vault entry', ic: 'lock', run: function () { V.sel = i.id; V.q = ''; A.go('vault'); } });
  });
  (S.albums || []).filter(function (a) { return hit({ n: a.name || '', s: 'album' }, ws); }).slice(0, 3).forEach(function (a) { out.push({ g: 'Photos', n: a.name, s: 'Photo album', ic: 'photos', run: function () { A.openAlbum(a.id, a.name); } }); });
  if (S.ins && S.ins.data) S.ins.data.resources.filter(function (r) { return hit({ n: r.n, s: r.t }, ws); }).slice(0, 4).forEach(function (r) { out.push({ g: 'Servers', n: r.n, s: r.t + ' · ' + r.p, ic: 'cloud', run: function () { S.rf = 'all'; S.rq = r.n; A.go('insights'); } }); });
  return out;
}
function remote(q, tok) {
  var set = function (g, list) { if (tok !== O.tok) return; O.groups[g] = list; draw(); };
  var ok = function (g, fn) { return function (e) { if (e && (e.code === 'not_configured' || /^(409|501)$/.test(String(e.status)))) O.off[g] = 1; set(g, []); }; };
  if (q.length < 2) return;
  if (pulseOn() && !O.off.pulse) api('/api/pulse/s/items?q=' + encodeURIComponent(q) + '&limit=6').then(function (d) {
    var P = px(), have = {}; ((P && P.boot && P.boot.items) || []).forEach(function (i) { have[i.id] = 1; });
    set('Mail', ((d.items || d || []).filter ? (d.items || d) : []).filter(function (i) { return !have[i.id]; }).slice(0, 5).map(function (i) { var mail = String(i.id)[0] === 'e'; return { g: mail ? 'Mail' : 'WhatsApp', n: mail ? (i.subj || '(no subject)') : (i.from || 'WhatsApp'), s: mail ? (i.from || '') : String(i.snip || i.sum || '').slice(0, 80), ic: mail ? 'doc' : 'chat', run: function () { AOSPulse2.openRef(i); } }; }));
  }).catch(ok('pulse'));
  if (((S.settings || {}).cards || {}).url && !O.off.cards) api('/api/cards?q=' + encodeURIComponent(q) + '&limit=5').then(function (d) {
    set('Contacts', (d.cards || []).slice(0, 5).map(function (c) { return { g: 'Contacts', n: c.name || c.company || 'Card', s: [c.title, c.company, c.phone || c.email].filter(Boolean).join(' · '), ic: 'cards', run: function () { A.go('cards'); setTimeout(function () { if (window.AOSInt) AOSInt.reopen(c.id); }, 120); } }; }));
  }).catch(ok('cards'));
  api('/api/search/files?q=' + encodeURIComponent(q)).then(function (d) {
    set('Files', (d.items || []).slice(0, 6).map(function (f) { return { g: 'Files', n: f.n, s: (f.dir ? 'Folder' : 'File') + ' · ' + f.p.replace(/\/[^/]*$/, '') || '/', ic: f.dir ? 'folder' : 'doc', run: function () { openFile(f); } }; }));
  }).catch(ok('files'));
  if (!O.off.photos && ((S.settings || {}).immich || {}).url !== '') api('/api/photos/search?q=' + encodeURIComponent(q)).then(function (d) {
    var items = (d.items || []).slice(0, 5);
    var l = items.map(function (p) { return { g: 'Photos', n: p.name || 'Photo', s: p.where || String(p.takenAt || '').slice(0, 10), img: '/api/photos/asset/' + p.id + '/thumb', run: function () { S.tab = 'timeline'; S.album = null; S.pq = q; A.go('photos'); setTimeout(function () { var i = $('#pq'); if (i) { i.value = q; i.dispatchEvent(new Event('input', { bubbles: true })); } }, 60); } }; });
    if (l.length) l.push({ g: 'Photos', n: 'See all photo results for "' + q + '"', s: '', ic: 'search', run: l[0].run });
    set('Photos', l);
  }).catch(ok('photos'));
}
function openFile(f) {
  var dir = f.p.replace(/\/[^/]*$/, '') || '/';
  if (f.dir) { A.go('drive'); setTimeout(function () { if (window.AOSDrive && AOSDrive.load) AOSDrive.load(f.p); }, 60); return; }
  var ext = (f.n.split('.').pop() || '').toLowerCase();
  if (A.TEXTEXT && A.TEXTEXT.indexOf(ext) > -1 && A.dedOpen) { A.dedOpen(f.p); return; }
  A.go('drive'); setTimeout(function () { if (window.AOSDrive && AOSDrive.load) AOSDrive.load(dir); }, 60);
}

/* ---------- ask ---------- */
function dynamic(q) {
  var out = [], m, v;
  if (window.AOSCapture) {
    if ((m = /^(?:new\s+)?task[:\s]+(.{2,})$/i.exec(q))) { v = m[1]; out.push({ g: 'Create', n: 'Create task: ' + v, s: pulseOn() ? 'Adds it to Pulse' : 'Pulse is not connected, it will be saved as a note', ic: 'check', run: function () { AOSCapture.addTask(v); } }); }
    if ((m = /^(?:new\s+)?note[:\s]+(.{2,})$/i.exec(q))) { v = m[1]; out.push({ g: 'Create', n: 'Save note: ' + v.slice(0, 60), s: 'Saved to your Captures folder', ic: 'doc', run: function () { AOSCapture.addNote(v); } }); }
  }
  if ((m = /^(?:ask|\?)\s*(.{3,})$/i.exec(q))) { v = m[1]; out.push({ g: 'Create', n: 'Ask the assistant: ' + v.slice(0, 60), s: 'Opens the assistant', ic: 'chat', run: function () { document.getElementById('fab').click(); setTimeout(function () { var i = $('#ci'); if (i) { i.value = v; i.focus(); } }, 150); } }); }
  return out;
}

/* ---------- view ---------- */
var ORDER = ['Create', 'Go to', 'Actions', 'Apps', 'Mail', 'WhatsApp', 'Tasks', 'Contacts', 'Vault', 'Files', 'Photos', 'Servers'];
function compute() {
  var q = O.q.trim(), ws = words(q), list = [];
  if (!q) { var all = commands(); list = all.filter(function (x) { return x.g === 'Go to'; }).slice(0, 8).concat(all.filter(function (x) { return x.g === 'Actions'; }).slice(0, 6)); }
  else {
    list = dynamic(q).concat(commands().filter(function (x) { return hit(x, ws); }).sort(function (a, b) { return rank(a, ws) - rank(b, ws); }).slice(0, 7), localSources(q, ws));
    ['Mail', 'Contacts', 'Files', 'Photos'].forEach(function (g) { (O.groups[g] || []).forEach(function (x) { if (!list.some(function (y) { return y.g === x.g && y.n === x.n; })) list.push(x); }); });
  }
  var by = {}; list.forEach(function (x) { (by[x.g] = by[x.g] || []).push(x); });
  var out = []; ORDER.forEach(function (g) { (by[g] || []).forEach(function (x) { out.push(x); }); });
  if (O.sel >= out.length) O.sel = Math.max(0, out.length - 1);
  O.res = out; return out;
}
function draw() {
  var r = $('#omres'); if (!r) return; var l = compute(), g = '', h = '';
  l.forEach(function (x, i) {
    if (x.g !== g) { g = x.g; h += '<div class="omh">' + esc(g) + '</div>'; }
    h += '<button type="button" class="it' + (i === O.sel ? ' sel' : '') + '" role="option" data-act="omrun" data-i="' + i + '">' + (x.img ? '<img src="' + esc(x.img) + '" alt="">' : '<span class="omic">' + ic(x.ic || 'search') + '</span>') + '<span class="omn">' + esc(x.n) + '</span><small>' + esc(x.s || '') + '</small></button>';
  });
  if (!l.length) h = '<p class="omnone">' + (O.q.length < 2 ? 'Keep typing...' : 'Nothing found for "' + esc(O.q) + '".') + '</p>';
  r.innerHTML = h; var s = r.querySelector('.sel'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' });
}
function run(i) { var x = O.res[i]; if (!x) return; A.modal(); try { x.run(); } catch (e) { toast(e.message || 'Could not do that'); } }
function open() {
  if (!S.user) return; O = { q: '', res: [], sel: 0, tok: 0, timer: null, groups: {}, off: O.off || {} };
  var m = $('#modal'); m.hidden = false;
  m.innerHTML = '<div class="modal" data-act="mx"><div class="card pal omni" role="dialog" aria-modal="true" aria-label="Search and commands"><div class="omin">' + ic('search') + '<input id="oi" role="combobox" aria-expanded="true" aria-controls="omres" autocomplete="off" spellcheck="false" placeholder="Search everything, or type a command" aria-label="Search and commands"><kbd>Esc</kbd></div><div class="res" id="omres" role="listbox"></div><div class="omfoot"><span><kbd>&uarr;</kbd><kbd>&darr;</kbd> move</span><span><kbd>Enter</kbd> open</span><span>task <i>text</i> · note <i>text</i> · ask <i>question</i></span></div></div></div>';
  draw(); var i = $('#oi'); if (i) i.focus();
  var P = px(); if (pulseOn() && window.AOSPulse2 && P && !P.boot && !P.loading) AOSPulse2.load(true).then(function () { if ($('#oi')) draw(); });
  if (A.loadAlbums) A.loadAlbums().then(function () { if ($('#oi')) draw(); });
}
document.addEventListener('input', function (ev) {
  if (!ev.target || ev.target.id !== 'oi') return; O.q = ev.target.value; O.sel = 0; O.groups = {}; var tok = ++O.tok; draw();
  clearTimeout(O.timer); var q = O.q.trim(); if (q.length >= 2) O.timer = setTimeout(function () { remote(q, tok); }, 220);
});
document.addEventListener('keydown', function (ev) {
  if (!ev.target || ev.target.id !== 'oi') return;
  if (ev.key === 'ArrowDown') { ev.preventDefault(); O.sel = Math.min(O.res.length - 1, O.sel + 1); draw(); }
  else if (ev.key === 'ArrowUp') { ev.preventDefault(); O.sel = Math.max(0, O.sel - 1); draw(); }
  else if (ev.key === 'Enter') { ev.preventDefault(); run(O.sel); }
}, true);
document.addEventListener('click', function (ev) { var b = ev.target.closest && ev.target.closest('[data-act="omrun"]'); if (b) { ev.stopPropagation(); run(Number(b.getAttribute('data-i'))); } }, true);
document.addEventListener('mousemove', function (ev) { var b = ev.target.closest && ev.target.closest('[data-act="omrun"]'); if (b && Number(b.getAttribute('data-i')) !== O.sel) { O.sel = Number(b.getAttribute('data-i')); var r = $('#omres'); if (r) { var c = r.querySelector('.sel'); if (c) c.classList.remove('sel'); b.classList.add('sel'); } } });
window.AOSOmni = { open: open, commands: commands };
})();
