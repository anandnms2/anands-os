(function () {
'use strict';
/* A booking link shared by this server (https://os.example.com/#/name/page) goes to the public booking page, not the sign-in screen. */
if (/^#\/[a-z0-9][a-z0-9-]{0,58}\/[a-z0-9][a-z0-9-]{2,30}[a-z0-9]$/i.test(location.hash)) { location.replace('/book.html' + location.hash); return; }
var $ = function (s, r) { return (r || document).querySelector(s); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var LS = { get: function (k, d) { try { var v = localStorage.getItem('aos.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem('aos.' + k, JSON.stringify(v)); } catch (e) {} } };
var P = {
  doc: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M14 3v6h6 M8 13h8 M8 17h5',
  home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z', photos: 'M3 3h18v18H3z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M21 15l-5-5L5 21',
  vpn: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4', cards: 'M3 6h18v12H3z M7 10h6 M7 14h4 M16 10h2v4h-2z',
  insights: 'M3 3v18h18 M7 15l4-5 3 3 5-7', money: 'M2 6h20v12H2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 9.5h.01 M18 14.5h.01', apps: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7H3z'.replace('H3z', 'h-7z'), settings: 'M4 6h10 M18 6h2 M4 12h4 M12 12h8 M4 18h12 M20 18h0 M14 4v4 M8 10v4 M16 16v4',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
  x: 'M18 6L6 18M6 6l12 12', key: 'M15 7a4 4 0 1 1-3.5 5.9L4 20.5V22h2v-2h2v-2h2l2.4-2.4A4 4 0 0 1 15 7z M16.5 9.5h.01', plus: 'M12 5v14M5 12h14', copy: 'M9 9h11v11H9z M5 15V5h10', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', open: 'M14 3h7v7 M21 3l-9 9 M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5', mail: 'M3 5h18v14H3z M3 7l9 7 9-7', check: 'M4 4h16v16H4z M8 12l3 3 5-6', cal: 'M4 5h16v16H4z M4 10h16 M9 3v4 M15 3v4', hourglass: 'M6 3h12 M6 21h12 M7 3c0 5 5 6 5 9s-5 4-5 9 M17 3c0 5-5 6-5 9s5 4 5 9', truck: 'M2 6h11v10H2z M13 10h5l3 3v3h-8z M6 19.5a1.5 1.5 0 1 0 .01 0 M17 19.5a1.5 1.5 0 1 0 .01 0', list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01', refresh: 'M20 12a8 8 0 1 1-2.3-5.7 M20 4v5h-5', trash: 'M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6 M10 11v6 M14 11v6', share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7 M16 6l-4-4-4 4 M12 2v13', archive: 'M3 4h18v4H3z M5 8v12h14V8 M10 12h4', send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z', upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M21 21l-4.3-4.3', l: 'M15 18l-6-6 6-6', r: 'M9 18l6-6-6-6', back: 'M19 12H5M11 6l-6 6 6 6',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01', ext: 'M7 17L17 7M8 7h9v9', cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
  folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z', lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4', card: 'M2 5h20v14H2z M2 10h20',
  star: 'M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7z',
  image: 'M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 6 M9 9.5a1 1 0 1 0 0-.01', camera: 'M3 8h4l2-3h6l2 3h4v12H3z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', pulse: 'M22 12h-4l-3 9L9 3l-3 9H2', monitor: 'M2 3h20v14H2z M8 21h8 M12 17v4', play: 'M6 4l14 8-14 8z', out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9'
};
P.apps = 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z'; P.desk = 'M3 4h18v12H3z M8 20h8 M12 16v4'; P.globe = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M2 12h20 M12 2a15 15 0 0 1 0 20 M12 2a15 15 0 0 0 0 20'; P.check = 'M20 6L9 17l-5-5'; P.calendar = 'M3 5h18v16H3z M3 10h18 M8 3v4 M16 3v4';
var ic = function (n, extra) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"' + (extra || '') + '><path d="' + P[n] + '"/></svg>'; };
function toast(t) { var el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 4200); }
/* Inside a Desktop window the OS hides its own frame (rail, header, tabs). */
try { if (window.top !== window.self || /[?&]embed=1/.test(location.search)) document.documentElement.classList.add('embed'); } catch (e) { document.documentElement.classList.add('embed'); }
var TZ = 'Africa/Dar_es_Salaam';
/* Every date in the OS: dd/mm/yyyy and 24-hour time in Dar es Salaam. A month-only heading keeps its name. */
function fmt(d, o) {
  try {
    o = o || {}; var get = function (opt) { var m = {}; new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: TZ, hourCycle: 'h23' }, opt)).formatToParts(d).forEach(function (p) { m[p.type] = p.value; }); return m; };
    if (!o.day && !o.hour) return new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: TZ }, o)).format(d);
    var out = [];
    if (o.day) { var a = get({ day: '2-digit', month: '2-digit', year: 'numeric' }); out.push(a.day + '/' + a.month + '/' + a.year); }
    if (o.hour) { var b = get({ hour: '2-digit', minute: '2-digit' }); out.push(b.hour + ':' + b.minute); }
    return out.join(' ');
  } catch (e) { return String(d); }
}
function bytes(n) { if (!n) return ''; var u = ['B', 'KB', 'MB', 'GB'], i = 0; while (n >= 1024 && i < 3) { n /= 1024; i++; } return n.toFixed(i ? 1 : 0) + ' ' + u[i]; }

/* ---------- api ---------- */
function api(path, o) {
  o = o || {};
  var h = { 'x-aos': '1' }; var init = { method: o.method || 'GET', credentials: 'same-origin', headers: h };
  if (o.json !== undefined) { init.body = JSON.stringify(o.json); h['content-type'] = 'application/json'; }
  if (o.body) init.body = o.body; if (o.headers) Object.keys(o.headers).forEach(function (k) { h[k] = o.headers[k]; });
  return fetch(path, init).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (j) {
      if (r.status === 401 && path !== '/api/session') { S.user = null; render(); }
      if (!r.ok) { var e = new Error(j.error || r.statusText); e.code = j.code; e.status = r.status; throw e; }
      return j;
    });
  });
}

/* ---------- state ---------- */
var S = {
  user: null, login: {}, view: 'home', apps: [], settings: null,
  tab: 'timeline', pq: '', album: null, albums: null, imm: null,
  tl: { items: [], next: 1, loading: false, error: null, loaded: false }, fav: { items: [], next: 1, loading: false, error: null, loaded: false }, sr: { q: '', items: [], mode: '', loading: false },
  ins: { data: null, error: null, code: null, loading: false }, rf: 'all', rq: '', appCat: 'All', aq: '', openApp: null, lb: null, info: true,
  chatOpen: false, chatSet: false, msgs: [], busy: false, ctx: { photos: true, insights: true, apps: true, files: true, cards: true, pulse: true }, model: ''
};

/* ---------- data loading ---------- */
function loadImm() { return api('/api/photos/status').then(function (s) { S.imm = s; if (s.connected) { loadPage(S.tl, '/api/photos/timeline'); } }).catch(function () { S.imm = { configured: false, connected: false }; }).then(function () { redraw(); }); }
function loadPage(set, url) {
  if (set.loading || (set.loaded && !set.next)) return Promise.resolve();
  set.loading = true; set.error = null;
  return api(url + '?page=' + set.next).then(function (r) { set.items = set.items.concat(r.items); set.next = r.next; set.loaded = true; }).catch(function (e) { set.error = e.message; set.loaded = true; set.next = null; }).then(function () { set.loading = false; if (S.view === 'photos') photosGrid(); else if (S.view === 'home') redraw(); });
}
function loadAlbums() { if (S.albums) return Promise.resolve(); return api('/api/photos/albums').then(function (a) { S.albums = a; }).catch(function (e) { S.albums = []; S.albumErr = e.message; }).then(function () { if (S.view === 'photos') photosGrid(); }); }
function loadIns(force) {
  S.ins.loading = true; if (S.view === 'insights') redraw();
  return api('/api/insights' + (force ? '?refresh=1' : '')).then(function (d) { S.ins = { data: d, error: null, code: null, loading: false }; }).catch(function (e) { S.ins = { data: null, error: e.message, code: e.code, loading: false }; }).then(function () { if (S.view === 'insights' || S.view === 'home') redraw(); });
}
function loadSettings() { api('/api/mailboxes').then(function (r) { S.mbx = r.accounts; if (S.view === 'settings') render(); }).catch(function () {}); return api('/api/settings').then(function (s) { S.settings = s; }).catch(function () {}); }
function googleBack() {
  try {
    var q = new URLSearchParams(location.search), r = q.get('g'); if (!r) return;
    var m = q.get('m') || (r === 'ok' ? 'Google Drive connected.' : 'Google sign-in failed.');
    history.replaceState(null, '', location.pathname + location.hash);
    if (r === 'ok') { toast(m); if (S.drive) { S.drive.root = '/Google Drive'; S.drive.path = '/'; S.drive.sec = 'my'; } go('drive'); }
    else { S.settingsMsg = m; go('settings'); setTimeout(function () { var e = document.getElementById('r_google'); if (e) { e.textContent = m; e.className = 'note bad'; } toast(m); }, 300); }
  } catch (e) {}
}
function isOwnerU() { return !S.user || !S.user.role || S.user.role === 'owner'; }
function can(a) { if (isOwnerU()) return true; var p = S.user.perm || {}; return a === 'open' || (p.apps || []).indexOf(a) > -1; }
var VAREA = { photos: 'photos', drive: 'drive', dedit: 'drive', vault: 'vault', insights: 'insights', servers: 'insights', pulse: 'pulse', vpn: 'vpn', cards: 'cards', money: '_owner', subs: '_owner', invest: '_owner', editor: '_owner', player: '_owner', recorder: '_owner', terminal: '_owner', belong: '_owner', house: '_owner', apps: 'suite', app: 'suite', home: 'open', appearance: 'open' };
function viewOk(v) { return isOwnerU() || (VAREA[v] !== undefined && can(VAREA[v])); }
function boot() {
  Promise.all([api('/api/session'), fetch('/apps.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })]).then(function (x) {
    S.login = x[0]; S.user = x[0].user; S.apps = x[1];
    if (S.user && !isOwnerU()) { var sp = (S.user.perm || {}).suite || []; S.apps = can('suite') ? S.apps.filter(function (a) { return sp.indexOf('*') > -1 || sp.indexOf(a.slug) > -1; }) : []; }
    document.documentElement.classList.toggle('guest', !!S.user && !isOwnerU());
    if (S.user) { return Promise.all([loadSettings()]).then(function () { buildNav(); var r0 = routeNow(); if (r0 && r0 !== 'home') { popping = true; try { go0(r0); } finally { popping = false; } } else render(); if (can('photos')) loadImm(); if (can('insights')) loadIns(false); googleBack(); }); }
    render();
  }).catch(function () { $('#view').innerHTML = '<div class="center"><div class="empty"><h2>Cannot reach the server</h2><p>Reload the page in a moment.</p></div></div>'; });
}

/* ---------- shell ---------- */
var NAV = [['home', 'Home', 'home'], ['photos', 'Photos', 'photos'], ['drive', 'Drive', 'cloud'], ['vault', 'Vault', 'lock'], ['insights', 'Insights', 'insights'], ['pulse', 'Pulse', 'pulse'], ['vpn', 'VPN', 'vpn'], ['cards', 'Cards', 'cards'], ['apps', 'Suite', 'apps']];
function cur(v) { if (v === 'apps' && ['money', 'subs', 'invest', 'belong', 'house', 'editor', 'player', 'recorder', 'terminal'].indexOf(S.view) >= 0) return true; if (S.view === 'dedit' || (S.view === 'app' && S.openFile)) return v === 'drive'; if (v === 'insights' && S.view === 'servers') return true; return S.view === v || (v === 'apps' && S.view === 'app'); }
function buildNav() {
  var h = '<button class="logo" data-act="nav" data-v="home" aria-label="Home"><img src="/logo-white.png" alt=""></button><div class="rsep"></div>';
  NAV.filter(function (n) { return viewOk(n[0]); }).forEach(function (n) { h += '<button class="nav" data-act="nav" data-v="' + n[0] + '" title="' + n[1] + '"' + (cur(n[0]) ? ' aria-current="page"' : '') + '>' + ic(n[2]) + n[1] + '</button>'; });
  if (can('chat')) h += '<button class="nav" data-act="chat" title="Ask the assistant">' + ic('chat') + 'Ask AI</button>';
  if (isOwnerU()) h += '<button class="nav bot" data-act="nav" data-v="settings" title="Settings"' + (S.view === 'settings' ? ' aria-current="page"' : '') + '>' + ic('settings') + 'Settings</button>';
  $('#rail').innerHTML = h;
  var t = ''; NAV.filter(function (n) { return viewOk(n[0]); }).concat([['pal', 'Search', 'search']]).forEach(function (n) { t += '<button ' + (n[0] === 'pal' ? 'data-act="pal"' : 'data-act="nav" data-v="' + n[0] + '"') + (cur(n[0]) ? ' aria-current="page"' : '') + '>' + ic(n[2]) + n[1] + '</button>'; });
  $('#tabs').innerHTML = t;
}
/* The address bar follows the page (#photos, #vault ...), so Refresh stays on the page and Back goes to the previous one. */
var ROUTES = ['home', 'photos', 'drive', 'vault', 'insights', 'servers', 'pulse', 'vpn', 'cards', 'money', 'subs', 'invest', 'editor', 'player', 'recorder', 'terminal', 'belong', 'house', 'apps', 'settings', 'security', 'appearance', 'team'], popping = false;
function routeNow() { var h = location.hash.replace(/^#/, ''); return ROUTES.indexOf(h) >= 0 ? h : ''; }
var RECV = { photos: ['Photos', 'photos'], pulse: ['Pulse', 'pulse'], cards: ['Cards', 'cards'], vault: ['Vault', 'vault'], drive: ['Drive', 'drive'], insights: ['Insights', 'insights'], servers: ['Servers', 'servers'], vpn: ['VPN', 'vpn'], money: ['Money', 'money'], subs: ['Subscriptions', 'subs'], invest: ['Investments', 'invest'], editor: ['Editor', 'editor'], player: ['Player', 'player'], recorder: ['Recorder', 'recorder'], terminal: ['Terminal', 'terminal'], belong: ['Belong', 'belong'], house: ['House', 'house'], security: ['Security', 'vault'] };
function noteRecent(k) { try { var r = (LS.get('rlist', []) || []).filter(function (x) { return x !== k; }); r.unshift(k); LS.set('rlist', r.slice(0, 8)); } catch (e) {} }
function go(v, x) {
  if (RECV[v]) noteRecent('v:' + v);
  if (!popping && ROUTES.indexOf(v) >= 0 && routeNow() !== v) { try { history.pushState({ v: v }, '', '#' + v); } catch (e) {} }
  return go0(v, x);
}
document.addEventListener('error', function (e) { var v = e.target; if (v && v.tagName === 'VIDEO' && v.dataset.src && !v.dataset.tx) { v.dataset.tx = '1'; v.src = v.dataset.src + '?tx=1'; v.load(); v.play().catch(function () {}); return; } var t = e.target; if (!t || t.tagName !== 'IMG' || !t.classList.contains('phimg')) return; if (!t.dataset.tried) { t.dataset.tried = '1'; t.src = '/api/photos/asset/' + t.dataset.id + '/preview'; return; } t.removeAttribute('src'); t.parentNode.classList.add('nothumb'); }, true);
window.addEventListener('popstate', function () { if (!S.user) return; var r = routeNow() || 'home'; popping = true; try { go0(r); } finally { popping = false; } });
var lastSeen = Date.now(); document.addEventListener('visibilitychange', function () { if (document.hidden) { lastSeen = Date.now(); return; } if (S.user && Date.now() - lastSeen > 30000 && S.view === 'photos' && S.imm && S.imm.connected && !S.lb) { var fresh = function () { return { items: [], next: 1, loading: false, error: null, loaded: false }; }; S.tl = fresh(); S.fav = fresh(); S.albums = null; loadImm(); loadAlbums(); } });
function go0(v, x) { if (!viewOk(v)) v = 'home'; if (window.AOSOnGo && window.AOSOnGo[v]) setTimeout(window.AOSOnGo[v], 0); if (v === 'vault' && S.view !== 'vault') S.vault.noAuto = false; S.view = v; if (x) for (var k in x) S[k] = x[k]; buildNav(); render(); $('#view').scrollTop = 0; if (v === 'drive') loadDrive(); if (v === 'vault') loadVault(); if (v === 'photos') { loadAlbums(); if (S.imm && S.imm.connected) loadPage(S.tl, '/api/photos/timeline'); } if (v === 'insights' && !S.ins.data && !S.ins.loading) loadIns(false); if (window.AOSInt) window.AOSInt.onGo(v); if (window.AOSSrv) window.AOSSrv.onGo(v); if (window.AOSPulse) window.AOSPulse.onGo(v); if (window.AOSHome) window.AOSHome.onGo(v); }
function redraw() { var y = $('#view').scrollTop; render(); $('#view').scrollTop = y; }
function render() {
  var app = $('#app'), tabs = $('#tabs'), fab = $('#fab');
  if (!S.user) { app.hidden = true; tabs.hidden = true; fab.hidden = true; $('#chat').hidden = true; $('#login').hidden = false; $('#login').innerHTML = loginV(); return; }
  $('#login').hidden = true; app.hidden = false; tabs.hidden = false; fab.hidden = S.chatOpen || !can('chat');
  if (window.AOSProfile) AOSProfile.paint(); else $('#avatar').textContent = (S.user.name || 'A').charAt(0).toUpperCase();
  var v = $('#view');
  if (S.view === 'home') v.innerHTML = homeV();
  else if (S.view === 'photos') { v.innerHTML = photosShell(); photosGrid(); }
  else if (S.view === 'drive') v.innerHTML = driveV();
  else if (S.view === 'vault') v.innerHTML = vaultV();
  else if (S.view === 'dedit') v.innerHTML = dedV();
  else if (S.view === 'insights') v.innerHTML = insightsV();
  else if (S.view === 'servers') v.innerHTML = window.AOSSrv ? window.AOSSrv.view() : '';
  else if (S.view === 'pulse') v.innerHTML = window.AOSPulse ? window.AOSPulse.view() : '';
  else if (S.view === 'vpn') v.innerHTML = window.AOSInt ? window.AOSInt.vpnView() : '';
  else if (S.view === 'cards') v.innerHTML = window.AOSInt ? window.AOSInt.cardsView() : '';
  else if (S.view === 'apps') v.innerHTML = appsV();
  else if (S.view === 'app') v.innerHTML = appWinV();
  else if (S.view === 'settings') v.innerHTML = settingsV();
  else if (window.AOSViews && window.AOSViews[S.view]) v.innerHTML = window.AOSViews[S.view]();
}

/* ---------- login ---------- */
function loginV() {
  var l = S.login || {}, h = '<div class="center"><div class="login card"><div class="logo"><img src="/logo-white.png" alt=""></div><h1>Anands OS</h1>';
  if (l.method === 'oidc') h += '<a class="btn primary" style="justify-content:center;width:100%" href="/auth/login">Sign in with Anands SSO</a>';
  if (l.method === 'password' || l.passwordToo) h += (l.method === 'oidc' ? '<div class="rsep" style="width:100%;margin:18px 0"></div>' : '') + '<form id="pwf" style="text-align:left"><div class="field"><label for="pw">Password</label><input class="input" id="pw" type="password" autocomplete="current-password" required></div><button class="btn primary" style="justify-content:center;width:100%" type="submit">Sign in</button></form>';
  return h + '<p class="err" id="lerr" role="alert"></p></div></div>';
}

/* ---------- home ---------- */
function svcState(n) {
  var d = S.ins.data; if (!n || !d) return ['na', 'Not tracked'];
  var r = d.resources.filter(function (x) { return x.n === n; })[0]; if (!r) return ['na', 'Not tracked in Coolify'];
  return r.s === 'ok' ? ['', 'Healthy'] : r.s === 'nohc' ? ['warn', 'Running, no health check'] : ['bad', 'Not healthy'];
}
var ICONROW = ['spreadsheet', 'documents', 'presentation', 'whiteboard', 'pdf', 'email', 'calendar', 'notes', 'photo-studio', 'video-studio', 'chess'];
function homeV() {
  if (!isOwnerU()) return guestHomeV();
  var hr = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(new Date())), g = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  var d = S.ins.data, count = function (t) { return d ? d.resources.filter(function (r) { return r.t === t; }).length : '–'; };
  var cats = {}; S.apps.forEach(function (a) { cats[a.category] = (cats[a.category] || 0) + 1; });
  var cc = Object.keys(cats).map(function (c) { return '<span class="chip" style="cursor:default">' + esc(c) + ' <b style="color:var(--accent-text)">' + cats[c] + '</b></span>'; }).join('');
  var ics = ICONROW.map(function (s) { var a = S.apps.filter(function (x) { return x.slug === s; })[0]; return a && a.hasSource ? '<button data-act="app" data-s="' + s + '" aria-label="Open ' + esc(a.name) + '" title="' + esc(a.name) + '"><img src="/_icons/' + s + '.png" alt=""></button>' : ''; }).join('');
  var live = S.apps.filter(function (a) { return a.hasSource; }).length;
  var prompts = ['Which resources have no health check?', 'What deployed most recently?', 'How many photos are in my library?', 'Which apps replace Excel?'];
  var srv = d ? '<div class="top"><span class="eyebrow">Your server</span><span style="display:flex;align-items:center;gap:7px;font-size:13px;color:' + (d.server.reachable === false ? 'var(--bad)' : d.server.reachable ? 'var(--ok)' : 'var(--muted)') + '"><i class="dot ' + (d.server.reachable === false ? 'bad' : d.server.reachable ? '' : 'na') + '"></i>' + (d.server.reachable === false ? 'Unreachable' : d.server.reachable ? 'Reachable' : 'Status unknown') + '</span></div><div class="tiles"><div><b>' + count('App') + '</b><span>apps</span></div><div><b>' + count('Service') + '</b><span>services</span></div><div><b>' + count('Database') + '</b><span>databases</span></div></div>'
    : '<div class="top"><span class="eyebrow">Your server</span></div><p style="margin:0;color:var(--muted)">' + (S.ins.loading ? 'Loading from Coolify...' : esc(S.ins.error || 'Not loaded.')) + '</p>';
  var recent = '', rl = (LS.get('rlist', []) || []).slice();
  ['v:photos', 'a:notes', 'a:tasks'].forEach(function (k) { if (rl.indexOf(k) < 0) rl.push(k); });
  rl.slice(0, 4).forEach(function (k) {
    var kind = k.charAt(0), id = k.slice(2);
    if (kind === 'v' && RECV[id]) { var sub = id === 'photos' ? (S.tl.items.length ? 'latest ' + esc(fmt(new Date(S.tl.items[0].takenAt), { day: 'numeric', month: 'short' })) : (S.imm && S.imm.connected ? 'connected' : 'not connected')) : 'Anands OS'; recent += '<button class="rr" data-act="nav" data-v="' + id + '"><img src="/oicons/' + RECV[id][1] + '.svg" alt=""><span>' + RECV[id][0] + '</span><small>' + sub + '</small></button>'; }
    else if (kind === 'a') { var a = S.apps.filter(function (x) { return x.slug === id; })[0]; if (a) recent += '<button class="rr" data-act="app" data-s="' + id + '"><img src="/_icons/' + id + '.png" alt=""><span>' + esc(a.name) + '</span><small>Suite</small></button>'; }
  });
  return '<div class="wrap"><section class="hello" style="padding:26px 0 22px"><h1>' + g + ', ' + esc((S.user.name || 'Anand').split(' ')[0]) + '</h1></section>' +
    '<section class="hgrid"><div class="ask"><div class="eyebrow">' + ic('chat') + 'Anands AI</div><form class="askbox" id="hf"><input id="hq" placeholder="Ask anything, or tell it what to do across your apps" aria-label="Ask the assistant" autocomplete="off"><button type="submit" aria-label="Ask">' + ic('send') + '</button></form><div class="chips" style="margin-top:16px">' + prompts.map(function (q) { return '<button class="chip" data-act="ask" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div></div>' +
    '<div class="srv">' + srv + '<div class="row"><span>App backend</span><span style="display:flex;align-items:center;gap:7px;font-size:13px;color:var(--muted)">this container<i class="dot"></i></span></div><button class="link" style="margin-top:auto;text-align:left" data-act="nav" data-v="insights">Open Cloud Insights &rarr;</button></div></section>' +
    (window.AOSHome ? window.AOSHome.right() + window.AOSHome.services(svcState) : '') +
    '<section class="suitep"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap"><div><h2 style="font-size:22px;margin-bottom:4px">Anands Suite</h2><p style="margin:0;color:var(--muted);font-size:14.5px;max-width:62ch">' + live + ' apps that replace Excel, Word, PowerPoint, Slack, Photoshop, QuickBooks and more. Their data lives in your container, not on puter.com.</p></div><button class="btn primary" data-act="nav" data-v="apps">Open Suite</button></div><div class="chips" style="margin-top:18px">' + cc + '</div><div class="icons">' + ics + '<button class="more" style="margin:0" data-act="nav" data-v="apps" aria-label="All apps">+' + Math.max(0, live - 11) + '</button></div></section>' +
    '<section class="hgrid" style="margin-top:38px">' + (window.AOSHome ? window.AOSHome.today() : '<div class="today"></div>') + '<div class="recent"><div class="eyebrow">Recent</div>' + recent + '</div></section></div>';
}

/* ---------- photos ---------- */
function connectBlock(what, act, why) { return '<div class="empty"><h2>' + what + '</h2><p>' + why + ' Set it up in Settings.</p></div>'; }
function photosShell() {
  var im = S.imm, h = '<div class="wrap"><div class="pagehead"><div><h1>Photos</h1></div><div style="display:flex;gap:10px;flex-wrap:wrap">' + (im && im.connected ? '<button class="btn" data-act="photoref">Refresh</button><button class="btn" data-act="upload">' + ic('upload') + 'Upload</button>' : '') + '<input type="file" id="fileIn" accept="image/*,video/*" multiple hidden></div></div>';
  if (!im) return h + '<p style="color:var(--muted)">Checking Immich...</p></div>';
  if (!im.configured) return h + connectBlock('Photos are not connected yet', 'immich', 'Add your Immich address and an API key (Immich: Account settings, API keys). Photos then show up here like they do in Nextcloud.') + '</div>';
  if (!im.connected) return h + '<div class="banner"><i class="dot bad"></i><span>Immich is configured but not reachable (' + esc(im.reason || 'no answer') + '). Check the address and key.</span></div></div>';
  h += '<div class="toolbar"><div class="seg" role="group" aria-label="View">';
  [['timeline', 'Timeline'], ['albums', 'Albums'], ['favs', 'Favourites']].concat(window.AOSPX ? window.AOSPX.tabs : []).forEach(function (t) { h += '<button data-act="ptab" data-t="' + t[0] + '" aria-pressed="' + (S.tab === t[0] && !S.album && !S.pq) + '">' + t[1] + '</button>'; });
  return h + '</div><div class="search">' + ic('search') + '<input class="input" id="pq" type="search" placeholder="Search your photos (people, places, things)" value="' + esc(S.pq) + '" aria-label="Search photos" data-in="pq"></div>' + (window.AOSPX ? '<button class="btn sm" data-phx="filters">Filters</button><button class="btn sm" data-phx="selmode" aria-pressed="' + !!window.AOSPX.selMode + '">Select</button>' : '') + '</div><div id="pg"></div></div>';
}
var thumb = function (id) { return '/api/photos/asset/' + id + '/thumb'; };
function photoCard(p) { var X = window.AOSPX, sl = X && X.isSel(p.id); return '<div class="ph' + (sl ? ' sel' : '') + '" data-pid="' + p.id + '">' + (X ? '<button class="pcheck" data-act="psel" data-id="' + p.id + '" aria-label="Select">&#10003;</button>' : '') + '<button style="all:unset;display:block;width:100%;height:100%;cursor:pointer" data-act="lb" data-id="' + p.id + '" aria-label="Open ' + esc(p.name) + '"><img class="phimg" data-id="' + p.id + '" loading="lazy" src="' + thumb(p.id) + '" alt="' + esc(p.name) + '">' + (p.type === 'video' ? '<span style="position:absolute;left:6px;bottom:6px;background:rgba(0,0,0,.6);color:#fff;border-radius:6px;padding:1px 6px;font-size:12px">Video</span>' : '') + '</button><button class="heart' + (p.fav ? ' on' : '') + '" data-act="fav" data-id="' + p.id + '" aria-label="' + (p.fav ? 'Remove from favourites' : 'Add to favourites') + '">' + ic('heart') + '</button></div>'; }
function curSet() { var xs = window.AOSPX && window.AOSPX.curSet(); if (xs) return xs; if (S.pq) return S.sr; if (S.album) return S.album; return S.tab === 'favs' ? S.fav : S.tl; }
function curItems() { return curSet().items || []; }
function photosGrid() {
  var el = $('#pg'); if (!el) return;
  if (window.AOSPX && window.AOSPX.owns(S.tab) && !S.album && !S.pq) { window.AOSPX.grid(el); return; }
  photosGrid0(el); if (window.AOSPX) window.AOSPX.after(el);
}
function photosGrid0(el) {
  if (S.tab === 'albums' && !S.album && !S.pq) {
    if (!S.albums) { el.innerHTML = '<p style="color:var(--muted)">Loading albums...</p>'; return; }
    el.innerHTML = S.albums.length ? '<div class="albums">' + S.albums.map(function (a) { return '<button class="album" data-act="album" data-id="' + a.id + '" data-name="' + esc(a.name) + '"><div class="mosaic" style="grid-template-columns:1fr;grid-template-rows:1fr">' + (a.thumb ? '<img src="' + thumb(a.thumb) + '" alt="">' : '<div style="background:var(--surface2)"></div>') + '</div><h3>' + esc(a.name) + '</h3><small>' + a.count + ' item' + (a.count === 1 ? '' : 's') + '</small></button>'; }).join('') + '</div>' : '<div class="empty"><h2>No albums</h2><p>' + esc(S.albumErr || 'Create an album in Immich and it will appear here.') + '</p></div>';
    return;
  }
  var set = curSet(), ps = set.items || [], h = '';
  if (S.album) h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px"><button class="btn sm" data-act="album" data-id="">' + ic('back') + 'Albums</button><h2 style="font-size:24px">' + esc(S.album.name) + '</h2></div>';
  if (S.pq && set.mode) h += '<p style="color:var(--muted);margin:0 0 8px">' + (set.mode === 'smart' ? 'Smart search results' : 'Matching file names') + ' for "' + esc(S.pq) + '"</p>';
  if (set.error) h += '<div class="banner"><i class="dot bad"></i><span>' + esc(set.error) + '</span></div>';
  if (!ps.length) { el.innerHTML = h + '<div class="empty">' + ((set.loading || (!set.loaded && !S.album)) ? 'Loading...' : S.pq ? 'No photos match.' : S.tab === 'favs' ? 'No favourites yet. Tap the heart on any photo.' : 'No photos yet.') + '</div>'; return; }
  var curM = '', grp = [];
  function flush() { if (!grp.length) return; h += '<div class="month"><h3>' + curM + '</h3><small>' + grp.length + (set.next ? '+' : '') + ' item' + (grp.length > 1 ? 's' : '') + '</small></div><div class="photos">' + grp.map(photoCard).join('') + '</div>'; grp = []; }
  ps.forEach(function (p) { var m = fmt(new Date(p.takenAt), { month: 'long', year: 'numeric' }); if (m !== curM) { flush(); curM = m; } grp.push(p); }); flush();
  if (set.next) h += '<button class="btn more" data-act="more">' + (set.loading ? 'Loading...' : 'Load more') + '</button>';
  el.innerHTML = h;
}
function findPhoto(id) { var sets = [S.tl.items, S.fav.items, S.sr.items, S.album ? S.album.items : [], window.AOSPX ? window.AOSPX.items() : []]; for (var i = 0; i < sets.length; i++) for (var j = 0; j < sets[i].length; j++) if (sets[i][j].id === id) return sets[i][j]; return null; }
function setFav(id, v) { [S.tl.items, S.fav.items, S.sr.items, S.album ? S.album.items : [], S.albumItems || [], window.AOSPX ? window.AOSPX.items() : []].forEach(function (l) { l.forEach(function (p) { if (p.id === id) p.fav = v; }); }); }
function toggleFav(id) {
  var p = findPhoto(id); if (!p) return; var v = !p.fav; setFav(id, v); if (S.view === 'photos') photosGrid(); if (S.lb) drawLb();
  api('/api/photos/favorite', { method: 'POST', json: { ids: [id], value: v } }).then(function () { S.fav = { items: [], next: 1, loading: false, error: null, loaded: false }; }).catch(function (e) { setFav(id, !v); toast('Could not update favourite: ' + e.message); if (S.view === 'photos') photosGrid(); if (S.lb) drawLb(); });
}
function openLb(id) { S.lb = id; drawLb(); }
function drawLb() {
  var el = $('#lb'); if (!S.lb) { el.hidden = true; el.innerHTML = ''; return; }
  var l = curItems(), i = l.map(function (p) { return p.id; }).indexOf(S.lb); if (i < 0) { S.lb = null; el.hidden = true; return; } var p = l[i];
  el.hidden = false;
  var media = p.type === 'video' ? '<video controls autoplay playsinline poster="/api/photos/asset/' + p.id + '/preview" src="/api/photos/asset/' + p.id + '/video" data-src="/api/photos/asset/' + p.id + '/video" style="max-width:100%;max-height:100%"></video>' : '<img src="/api/photos/asset/' + p.id + '/preview" alt="' + esc(p.name) + '">';
  el.innerHTML = '<div class="stage"><div class="bar"><button class="ib" data-act="lbx" aria-label="Close">' + ic('x') + '</button><span style="padding-left:6px">' + esc(p.name) + '</span><span class="sp"></span><a class="ib" href="/api/photos/asset/' + p.id + '/original" download="' + esc(p.name) + '" aria-label="Download original">' + ic('upload', ' style="transform:rotate(180deg)"') + '</a><button class="ib' + (p.fav ? ' on' : '') + '" data-act="lbfav" aria-label="Favourite">' + ic('heart') + '</button><button class="ib" data-act="lbinfo" aria-label="Details">' + ic('info') + '</button></div>' +
    (i > 0 ? '<button class="ib nx l" data-act="lbp" aria-label="Previous">' + ic('l') + '</button>' : '') + media + (i < l.length - 1 ? '<button class="ib nx r" data-act="lbn" aria-label="Next">' + ic('r') + '</button>' : '') + '</div>' +
    (S.info ? '<aside><h3 style="font-size:20px;word-break:break-all">' + esc(p.name) + '</h3><dl><dt>Taken</dt><dd>' + fmt(new Date(p.takenAt), { day: 'numeric', month: 'long', year: 'numeric' }) + '</dd>' + (p.where ? '<dt>Place</dt><dd>' + esc(p.where) + '</dd>' : '') + (p.camera ? '<dt>Camera</dt><dd>' + esc(p.camera) + '</dd>' : '') + (p.w ? '<dt>Size</dt><dd>' + p.w + ' x ' + p.h + '</dd>' : '') + (p.bytes ? '<dt>File</dt><dd>' + bytes(p.bytes) + '</dd>' : '') + '<dt>Type</dt><dd>' + p.type + '</dd></dl></aside>' : '');
  if (window.AOSPX) window.AOSPX.lbExtra(p, el);
  var b = el.querySelector('[data-act="lbx"]'); if (b) b.focus();
  if (i === l.length - 1 && curSet().next) { var set = curSet(); if (set === S.tl) loadPage(S.tl, '/api/photos/timeline'); else if (set === S.fav) loadPage(S.fav, '/api/photos/favorites'); }
}
function lbMove(d) { var l = curItems(), i = l.map(function (p) { return p.id; }).indexOf(S.lb) + d; if (i >= 0 && i < l.length) { S.lb = l[i].id; drawLb(); } }
function uploadFiles(files) {
  var list = Array.prototype.slice.call(files || []), ok = 0, fail = 0;
  if (!list.length) return; toast('Uploading ' + list.length + ' file' + (list.length > 1 ? 's' : '') + '...');
  list.reduce(function (pr, f) { return pr.then(function () { return api('/api/photos/upload', { method: 'POST', body: f, headers: { 'x-filename': encodeURIComponent(f.name), 'x-created': String(f.lastModified || Date.now()), 'content-type': f.type || 'application/octet-stream' } }).then(function () { ok++; }, function (e) { fail++; toast('Upload failed: ' + e.message); }); }); }, Promise.resolve()).then(function () {
    S.tl = { items: [], next: 1, loading: false, error: null, loaded: false }; S.albums = null; loadPage(S.tl, '/api/photos/timeline'); if (ok) toast(ok + ' uploaded to Immich' + (fail ? ', ' + fail + ' failed' : '') + '.');
  });
}
var searchTimer;
function runSearch(q) {
  S.pq = q; clearTimeout(searchTimer);
  if (!q.trim()) { S.sr = { q: '', items: [], mode: '', loading: false }; photosGrid(); return; }
  searchTimer = setTimeout(function () { S.sr.loading = true; api('/api/photos/search?q=' + encodeURIComponent(q.trim())).then(function (r) { if (S.pq !== q) return; S.sr = { q: q, items: r.items, mode: r.mode, loading: false, next: null, loaded: true }; }).catch(function (e) { S.sr = { q: q, items: [], mode: '', loading: false, error: e.message, loaded: true }; }).then(function () { if (S.view === 'photos') photosGrid(); }); }, 350);
}

/* ---------- insights ---------- */
function mmss(s) { return s == null ? 'n/a' : Math.floor(s / 60) + 'm ' + ('0' + (s % 60)).slice(-2) + 's'; }
function pill(s) { return s === 'ok' ? '<span class="pill ok"><i class="dot"></i>Healthy</span>' : s === 'nohc' ? '<span class="pill warn"><i class="dot warn"></i>No health check</span>' : '<span class="pill bad"><i class="dot bad"></i>Not healthy</span>'; }
function insightsV() { return insightsV0(); }
function insTabs(a) { return '<div class="toolbar"><div class="seg" role="tablist">' + [['insights', 'Cloud'], ['servers', 'Servers']].map(function (t) { return '<button data-act="nav" data-v="' + t[0] + '" aria-pressed="' + (a === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div></div>'; }
function insightsV0() {
  var head = '<div class="wrap"><div class="pagehead"><div><h1>Insights</h1></div><div style="display:flex;gap:10px"><button class="btn" data-act="refresh">' + (S.ins.loading ? 'Refreshing...' : 'Refresh') + '</button></div></div>' + insTabs('insights');
  var d = S.ins.data;
  if (!d) {
    if (S.ins.loading) return head + '<p style="color:var(--muted)">Loading from Coolify...</p></div>';
    if (S.ins.code === 'not_configured') return head + connectBlock('Coolify is not connected yet', 'coolify', 'Add your Coolify address and a read-only API token (Coolify: Keys and tokens, API tokens).') + '</div>';
    return head + '<div class="banner"><i class="dot bad"></i><span>' + esc(S.ins.error || 'Could not load.') + '</span></div></div>';
  }
  var R = d.resources, ok = R.filter(function (r) { return r.s === 'ok'; }).length, nohc = R.filter(function (r) { return r.s === 'nohc'; }), bad = R.filter(function (r) { return r.s === 'bad'; }), tot = R.length || 1;
  var pj = {}; R.forEach(function (r) { pj[r.p] = (pj[r.p] || 0) + 1; }); var projs = Object.keys(pj).sort(function (a, b) { return pj[b] - pj[a]; });
  var taken = fmt(new Date(d.takenAt), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  var secsAll = d.deploys.map(function (x) { return x.sec || 0; }), max = Math.max.apply(null, secsAll.concat([1]));
  var rows = R.filter(function (r) { if (S.rf === 'nohc' && r.s !== 'nohc') return false; if (S.rf === 'bad' && r.s !== 'bad') return false; if (S.rf === 'app' && r.t !== 'App') return false; if (S.rf === 'service' && r.t !== 'Service') return false; if (S.rf === 'db' && r.t !== 'Database') return false; if (S.rq && (r.n + ' ' + r.p + ' ' + r.d + ' ' + r.r).toLowerCase().indexOf(S.rq.toLowerCase()) < 0) return false; return true; }).map(function (r) {
    return '<tr><td><b>' + esc(r.n) + '</b></td><td>' + r.t + '</td><td>' + esc(r.p) + '</td><td>' + pill(r.s) + '</td><td>' + (r.d ? '<a href="https://' + esc(r.d) + '" target="_blank" rel="noopener" style="color:var(--accent-text)">' + esc(r.d) + '</a>' : '<span style="color:var(--muted)">none set</span>') + '</td><td class="mono" style="font-size:12.5px;color:var(--muted)">' + esc(r.r || '') + '</td></tr>'; }).join('');
  var f = [['all', 'All'], ['app', 'Apps'], ['service', 'Services'], ['db', 'Databases'], ['nohc', 'No health check'], ['bad', 'Not healthy']].map(function (x) { return '<button class="chip" data-act="rf" data-f="' + x[0] + '" aria-pressed="' + (S.rf === x[0]) + '">' + x[1] + '</button>'; }).join('');
  var dep = d.deploys.map(function (x) { return '<div class="dep"><div class="msg"><b>' + esc(x.app) + (x.status && x.status !== 'finished' ? ' <span class="pill ' + (x.status === 'failed' ? 'bad' : 'warn') + '" style="font-size:11px">' + esc(x.status) + '</span>' : '') + '</b><span title="' + esc(x.msg) + '">' + esc(x.msg || '(no message)') + '</span><span>' + fmt(new Date(x.at), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</span></div><div class="bw"><div class="track"><div class="fill" style="width:' + ((x.sec || 0) / max * 100).toFixed(1) + '%"></div></div></div><div class="mono" style="text-align:right;font-size:13px">' + mmss(x.sec) + '</div></div>'; }).join('') || '<p style="color:var(--muted);margin:8px 0 0">No deployment history returned.</p>';
  var looks = '';
  if (bad.length) looks += '<div class="look"><i class="dot bad"></i><div><b>' + bad.length + ' not healthy.</b><br><span style="color:var(--muted)">' + esc(bad.map(function (r) { return r.n; }).join(', ')) + '</span></div></div>';
  if (nohc.length) looks += '<div class="look"><i class="dot warn"></i><div><b>' + nohc.length + ' run with no health check.</b><br><span style="color:var(--muted)">' + esc(nohc.map(function (r) { return r.n; }).join(', ')) + '. Coolify can only tell the container is up, not that it works.</span></div></div>';
  var failed = d.deploys.filter(function (x) { return x.status === 'failed'; });
  if (failed.length) looks += '<div class="look"><i class="dot bad"></i><div><b>' + failed.length + ' recent deployment' + (failed.length > 1 ? 's' : '') + ' failed.</b><br><span style="color:var(--muted)">' + esc(failed.map(function (x) { return x.app; }).join(', ')) + '</span></div></div>';
  if (!looks) looks = '<div class="look"><i class="dot"></i><div><b>Nothing needs attention.</b><br><span style="color:var(--muted)">Everything reports healthy and recent deployments succeeded.</span></div></div>';
  var sv = d.server, rch = sv.reachable === false ? ['bad', 'Unreachable', 'var(--bad)'] : sv.reachable ? ['', 'Reachable', 'var(--ok)'] : ['na', 'Unknown', 'var(--muted)'];
  return head.replace('what changed lately.', 'what changed lately. Updated ' + taken + '.') +
    '<div class="kpis"><div class="card kpi"><div class="eyebrow">Server</div><div class="stat" style="margin-top:8px"><span class="n" style="font-size:24px;color:' + rch[2] + '">' + rch[1] + '</span><span class="l mono">' + esc(sv.name + (sv.ip ? ' · ' + sv.ip : '')) + '</span></div></div>' +
    '<div class="card kpi"><div class="stat"><span class="n">' + R.length + '</span><span class="l">resources, ' + d.projects + ' project' + (d.projects === 1 ? '' : 's') + '</span></div></div><div class="card kpi"><div class="stat"><span class="n" style="color:var(--ok)">' + ok + '</span><span class="l">report healthy</span></div></div>' +
    '<div class="card kpi"><div class="stat"><span class="n" style="color:var(--warn)">' + nohc.length + '</span><span class="l">no health check</span></div></div><div class="card kpi"><div class="stat"><span class="n" style="color:' + (bad.length ? 'var(--bad)' : 'var(--ok)') + '">' + bad.length + '</span><span class="l">not healthy</span></div></div></div>' +
    '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr));margin-bottom:18px"><div class="card"><h2 style="font-size:20px">Health</h2><div class="statusbar" role="img" aria-label="' + ok + ' healthy, ' + nohc.length + ' no health check, ' + bad.length + ' not healthy"><i style="width:' + (ok / tot * 100) + '%;background:var(--ok)"></i><i style="width:' + (nohc.length / tot * 100) + '%;background:var(--warn)"></i><i style="width:' + (bad.length / tot * 100) + '%;background:var(--bad)"></i></div><div class="legend"><span><i class="dot"></i>Healthy ' + ok + '</span><span><i class="dot warn"></i>No health check ' + nohc.length + '</span><span><i class="dot bad"></i>Not healthy ' + bad.length + '</span></div>' +
    '<h2 style="font-size:20px;margin-top:24px">Resources per project</h2>' + projs.map(function (p) { return '<div class="barrow"><span>' + esc(p) + '</span><div class="track"><div class="fill" style="width:' + (pj[p] / pj[projs[0]] * 100) + '%"></div></div><span class="mono" style="text-align:right">' + pj[p] + '</span></div>'; }).join('') + '</div>' +
    '<div class="card"><h2 style="font-size:20px;margin-bottom:14px">Worth a look</h2>' + looks + (d.totals.length ? '<p style="color:var(--muted);font-size:13.5px;margin:14px 0 0">Deployments so far: ' + esc(d.totals.map(function (t) { return t.app + ' ' + t.n; }).join(', ')) + '</p>' : '') + '</div></div>' +
    '<div class="card" style="margin-bottom:18px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:6px"><h2 style="font-size:20px">Recent deployments</h2><span style="color:var(--muted);font-size:13.5px">Bar length is build time</span></div>' + dep + '</div>' +
    '<div class="toolbar" style="margin-top:6px"><h2 style="font-size:20px;margin-right:6px">Resources</h2><div class="chips">' + f + '</div><div class="search" style="margin-left:auto">' + ic('search') + '<input class="input" id="rq" type="search" placeholder="Filter by name, project or domain" value="' + esc(S.rq) + '" data-in="rq" aria-label="Filter resources"></div></div>' +
    '<div class="tablewrap"><table><thead><tr><th>Name</th><th>Type</th><th>Project</th><th>Status</th><th>Domain</th><th>Source</th></tr></thead><tbody id="rows">' + (rows || '<tr><td colspan="6" style="color:var(--muted)">Nothing matches.</td></tr>') + '</tbody></table></div></div>';
}

/* ---------- suite ---------- */
function appsV() {
  var ORDER = ['Office', 'Productivity', 'Collaboration', 'Business', 'Finance', 'Creative Tools', 'Engineering', 'Developer Tools', 'Games'];
  var q = (S.aq || '').toLowerCase();
  var list = S.apps.filter(function (a) { return !q || (a.name + ' ' + a.alternativeTo + ' ' + a.category).toLowerCase().indexOf(q) > -1; });
  var cats = []; list.forEach(function (a) { if (cats.indexOf(a.category) < 0) cats.push(a.category); });
  cats.sort(function (x, y) { var i = ORDER.indexOf(x), j = ORDER.indexOf(y); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || (x < y ? -1 : 1); });
  var baseTile = function (a) { return '<button class="app' + (a.hasSource ? '' : ' soon') + '" ' + (a.hasSource ? 'data-act="app" data-s="' + a.slug + '"' : 'disabled') + '><img src="/_icons/' + a.slug + '.png" alt=""><span style="min-width:0"><b>' + esc(a.name) + '</b><small>' + esc(a.alternativeTo) + '</small></span>' + (a.hasSource ? '' : '<em class="tag" style="font-style:normal">Soon</em>') + '</button>'; };
  var tile;
  var NATIVE = [['money', 'Money', 'Budget, accounts, spending', 'Finance'], ['subs', 'Subscriptions', 'Renewals and dates', 'Finance'], ['invest', 'Investments', 'Holdings and net worth', 'Finance'], ['belong', 'Belongings', 'What you own, warranties, receipts', 'Productivity'], ['house', 'Household', 'Pantry stock and shopping lists', 'Productivity'], ['pulse', 'Pulse', 'Mail, calendar, tasks and notes', 'Productivity'], ['vault', 'Vault', 'Passwords and secure notes', 'Productivity'], ['paperless', 'Documents', 'Scan, OCR and search paper documents', 'Productivity', true], ['cards', 'Cards', 'Business card scanner and contacts', 'Business'], ['photos', 'Photos', 'Your photo library', 'Creative Tools'], ['player', 'Player', 'Music and video with playlists', 'Creative Tools'], ['recorder', 'Recorder', 'Screen and voice, saved to Drive', 'Creative Tools'], ['editor', 'Editor', 'Code and config files', 'Developer Tools'], ['terminal', 'Terminal', 'Command line on your server', 'Developer Tools'], ['insights', 'Insights', 'Cloud and server overview', 'Engineering'], ['servers', 'Servers', 'Your Hetzner servers', 'Engineering'], ['vpn', 'VPN', 'WireGuard access', 'Engineering']].filter(function (n) { return (n[4] ? isOwnerU() : viewOk(n[0])) && (!q || (n[1] + ' ' + n[2] + ' ' + n[3]).toLowerCase().indexOf(q) > -1); }).map(function (n) { return { native: n[0], ext: !!n[4], slug: n[0], name: n[1], alternativeTo: n[2], category: n[3], hasSource: true }; });
  list = list.concat(NATIVE); cats = []; list.forEach(function (a) { if (cats.indexOf(a.category) < 0) cats.push(a.category); });
  cats.sort(function (x, y) { var i = ORDER.indexOf(x), j = ORDER.indexOf(y); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || (x < y ? -1 : 1); });
  tile = function (a) { return a.ext ? '<a class="app" href="' + esc(((S.settings || {}).links || {})[a.native] || '#') + '" target="_blank" rel="noopener"><img src="/oicons/' + a.native + '.svg" alt=""><span style="min-width:0"><b>' + esc(a.name) + '</b><small>' + esc(a.alternativeTo) + '</small></span></a>' : a.native ? '<button class="app" data-act="nav" data-v="' + a.native + '"><img src="/oicons/' + a.native + '.svg" alt=""><span style="min-width:0"><b>' + esc(a.name) + '</b><small>' + esc(a.alternativeTo) + '</small></span></button>' : baseTile(a); };
  var sections = cats.map(function (c) { var l = list.filter(function (a) { return a.category === c; }); return '<section class="appcat" aria-label="' + esc(c) + '"><h2>' + esc(c) + ' <span>' + l.length + '</span></h2><div class="apps">' + l.map(tile).join('') + '</div></section>'; }).join('');
  return '<div class="wrap"><div class="pagehead"><div><h1>Suite</h1></div></div>' +
    '<div class="toolbar"><div class="search">' + ic('search') + '<input class="input" id="aq" type="search" placeholder="Search apps, or what they replace" value="' + esc(S.aq) + '" data-in="aq" aria-label="Search apps"></div></div><div id="appgrid">' + (sections || '<div class="card" style="color:var(--muted)">No app matches.</div>') + '</div></div>';
}
function launch(slug, file) { var a = S.apps.filter(function (x) { return x.slug === slug; })[0]; if (!a || !a.hasSource) return; S.openApp = slug; S.openFile = file || null; var r = (LS.get('recent', []) || []).filter(function (x) { return x !== slug; }); r.unshift(slug); LS.set('recent', r.slice(0, 6)); noteRecent('a:' + slug); go('app'); }
function appWinV() {
  var a = S.apps.filter(function (x) { return x.slug === S.openApp; })[0]; if (!a) return '';
  return '<div class="wrap appwin" style="display:flex;flex-direction:column;height:100%;max-width:none"><div class="winbar"><button class="btn sm" data-act="nav" data-v="' + (S.openFile ? 'drive' : 'apps') + '">' + ic('back') + (S.openFile ? 'Drive' : 'Suite') + '</button><img src="/_icons/' + a.slug + '.png" alt=""><div><b style="font-family:var(--display);font-size:20px;font-weight:500">' + esc(a.name) + '</b><div style="color:var(--muted);font-size:13px">replaces ' + esc(a.alternativeTo) + '</div></div><span style="flex:1"></span><span class="pill ok" title="The app can only talk to this server"><i class="dot"></i>Local mode</span><a class="btn sm" href="/apps/' + a.slug + '/' + (S.openFile ? '?open=' + encodeURIComponent(S.openFile) : '') + '" target="_blank" rel="noopener">' + ic('ext') + 'New tab</a></div><iframe class="appframe" title="' + esc(a.name) + '" src="/apps/' + a.slug + '/' + (S.openFile ? '?open=' + encodeURIComponent(S.openFile) : '') + '" allow="clipboard-read; clipboard-write; fullscreen; microphone; camera; display-capture"></iframe></div>';
}

/* ---------- settings ---------- */
var MBX_PRESETS = { gmail: ['imap.gmail.com', 'smtp.gmail.com'], outlook: ['outlook.office365.com', 'smtp.office365.com'], icloud: ['imap.mail.me.com', 'smtp.mail.me.com'], yahoo: ['imap.mail.yahoo.com', 'smtp.mail.yahoo.com'], zoho: ['imap.zoho.com', 'smtp.zoho.com'] };
function mbxList() {
  var l = S.mbx || []; if (!l.length) return '<p class="note">No accounts added yet.</p>';
  return '<div style="display:grid;gap:8px;margin-bottom:14px">' + l.map(function (a) { return '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;border:1px solid var(--line);border-radius:10px;padding:8px 10px"><div style="flex:1;min-width:140px"><b>' + esc(a.address) + '</b>' + (a.default ? ' <span class="note">default</span>' : '') + '<div class="note">' + (a.error ? esc(a.error) : a.lastSync ? a.count + ' messages, synced ' + esc(new Date(a.lastSync).toLocaleString()) : 'Not synced yet') + '</div></div><button class="btn sm" data-act="mbxsync" data-id="' + a.id + '">Sync</button>' + (a.default ? '' : '<button class="btn sm" data-act="mbxdef" data-id="' + a.id + '">Make default</button>') + '<button class="btn sm" data-act="mbxdel" data-id="' + a.id + '">Remove</button></div>'; }).join('') + '</div>';
}
function settingsV() {
  var c = S.settings || { immich: {}, coolify: {}, llm: {} }; c.dav = c.dav || {}; c.mail = c.mail || {};
  var field = function (id, label, val, ph, type) { return '<div class="field"><label for="' + id + '">' + label + '</label><input class="input" id="' + id + '" type="' + (type || 'text') + '" value="' + esc(val || '') + '" placeholder="' + esc(ph || '') + '" autocomplete="off"></div>'; };
  return '<div class="wrap"><div class="pagehead"><div><h1>Settings</h1></div><a class="btn" href="/auth/logout">' + ic('out') + 'Sign out</a></div><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))">' +
    '<div class="card"><h2 style="font-size:20px;margin-bottom:14px">Immich (Photos)</h2>' + field('s_iu', 'Server address', c.immich.url, 'https://photos.anands.xyz') + field('s_ik', 'API key' + (c.immich.keySet ? ' (saved, leave blank to keep)' : ''), '', c.immich.keySet ? '••••••••' : 'Immich: Account settings, API keys', 'password') + '<div id="r_immich" class="note" role="status"></div><button class="btn primary" data-act="save" data-k="immich">Save and test</button></div>' +
    '<div class="card"><h2 style="font-size:20px;margin-bottom:14px">Coolify (Cloud Insights)</h2>' + field('s_cu', 'Coolify address', c.coolify.url, 'https://coolify.anands.xyz') + field('s_ct', 'API token, read only' + (c.coolify.tokenSet ? ' (saved, leave blank to keep)' : ''), '', c.coolify.tokenSet ? '••••••••' : 'Coolify: Keys and tokens', 'password') + '<div id="r_coolify" class="note" role="status"></div><button class="btn primary" data-act="save" data-k="coolify">Save and test</button></div>' +
    '<div class="card"><h2 style="font-size:20px;margin-bottom:6px">Direct sign-in links</h2><p class="note" style="margin:0 0 14px">Where the Files and Storage tiles on Home go. Use each app\'s single sign-on start address so you land signed in through Authentik, without seeing its login page.</p>' + field('s_la', 'AI Chat (LibreChat)', (c.links || {}).ai, 'https://ai.anands.xyz/oauth/openid') + field('s_lf', 'Files', (c.links || {}).files, 'https://files.anands.xyz/api/auth/oidc/login') + field('s_ls', 'Storage', (c.links || {}).storage, 'https://s3-admin.anands.xyz') + field('s_lp', 'Documents (Paperless)', (c.links || {}).paperless, 'https://paperless.anands.xyz') + '<div id="r_links" class="note" role="status"></div><button class="btn primary" data-act="save" data-k="links">Save</button></div>' +
    '<div class="card"><h2 style="font-size:20px;margin-bottom:6px">Vault (Vaultwarden)</h2><p class="note" style="margin:0 0 14px">Only the address is saved. Your email and master password are typed on the Vault screen and are never stored.</p>' + field('s_vu', 'Vault address', (c.vault || {}).url, 'https://pass.anands.xyz') + '<div id="r_vault" class="note" role="status"></div><button class="btn primary" data-act="save" data-k="vault">Save and test</button></div>' +
    '<div class="card"><h2 style="font-size:20px;margin-bottom:6px">Drive (Cloudreve, WebDAV)</h2><p class="note" style="margin:0 0 14px">In Cloudreve: Settings, WebDAV, create an account. Use its address (for example https://drive.anands.xyz/dav), name and password.</p>' + field('s_du', 'WebDAV address', c.dav.url, 'https://drive.anands.xyz/dav') + field('s_dn', 'Account name', c.dav.user, 'you@example.com') + field('s_dp', 'Password' + (c.dav.passSet ? ' (saved, leave blank to keep)' : ''), '', c.dav.passSet ? '••••••••' : 'WebDAV account password', 'password') + '<div id="r_dav" class="note" role="status"></div><button class="btn primary" data-act="save" data-k="dav">Save and test</button></div>' +
    '<div class="card"><h2 style="font-size:20px;margin-bottom:6px">Full browser (Desktop)</h2><p class="note" style="margin:0 0 14px">Desktop Browser already runs a real Chromium inside this server (no sound or camera). Only if you also want a streamed Chrome with sound and video calls, run Neko or Kasm Chrome separately and put its address here; Desktop then offers it as Full browser when the built-in one is not installed.</p>' + field('s_rb', 'Remote browser address', (c.rbrowser || {}).url, 'https://browser.anands.xyz') + '<div id="r_rbrowser" class="note" role="status"></div><button class="btn primary" data-act="save" data-k="rbrowser">Save</button></div>' +
    '<div class="card"><h2 style="font-size:20px;margin-bottom:6px">Email accounts (Anands Email)</h2><p class="note" style="margin:0 0 14px">Add your own mailboxes. Anands Email shows their recent mail and sends through them. Use an app password for Gmail, Outlook or iCloud.</p>' + mbxList() + '<div class="field"><label for="x_pr">Provider</label><select class="input" id="x_pr" data-act="mpreset"><option value="">Other (type the servers)</option><option value="gmail">Gmail</option><option value="outlook">Outlook / Microsoft 365</option><option value="icloud">iCloud</option><option value="yahoo">Yahoo</option><option value="zoho">Zoho</option></select></div>' + field('x_ad', 'Email address', '', 'you@example.com') + field('x_pw', 'Password or app password', '', '', 'password') + field('x_ih', 'Incoming server (IMAP)', '', 'imap.example.com') + field('x_sh', 'Outgoing server (SMTP)', '', 'smtp.example.com') + '<div id="r_mbx" class="note" role="status"></div><button class="btn primary" data-act="mbxadd">Add and sync</button></div>' +
    '<div class="card"><h2 style="font-size:20px;margin-bottom:6px">Email (SMTP)</h2><p class="note" style="margin:0 0 14px">Used by Calendar for invitations, RSVP replies and booking confirmations. Use your provider\'s SMTP details (for Gmail, an app password).</p>' + field('s_mh', 'SMTP server', c.mail.host, 'smtp.gmail.com') + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' + field('s_mp', 'Port', c.mail.port || '', '587') + '<div class="field"><label for="s_ms">Security</label><select class="input" id="s_ms">' + [['starttls', 'STARTTLS (587)'], ['ssl', 'SSL/TLS (465)'], ['none', 'None (not recommended)']].map(function (o) { return '<option value="' + o[0] + '"' + (c.mail.security === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div></div>' + field('s_mu', 'Username', c.mail.user, 'you@example.com') + field('s_mw', 'Password' + (c.mail.passSet ? ' (saved, leave blank to keep)' : ''), '', c.mail.passSet ? '••••••••' : 'SMTP password or app password', 'password') + field('s_mf', 'From address', c.mail.from, 'you@example.com') + field('s_mn', 'From name', c.mail.fromName, 'Anand') + field('s_mc', 'Daily email limit', c.mail.dailyCap, '200') + field('s_pu', 'Public address of this site (links in emails)', (c.public || {}).url, 'https://os.anands.xyz') + '<div id="r_mail" class="note" role="status"></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" data-act="save" data-k="mail">Save and test</button><button class="btn" data-act="mtest">Send a test email</button></div></div>' +
    '<div class="card"><h2 style="font-size:20px;margin-bottom:6px">Anands Meeting relay (optional)</h2><p class="note" style="margin:0 0 14px">Meetings connect browsers directly. Guests behind strict firewalls need a TURN relay such as coturn (set <code>use-auth-secret</code> and <code>static-auth-secret</code> in its config). Leave empty to use direct connections only.</p>' + field('s_tu', 'TURN address(es), comma separated', c.turn && c.turn.urls, 'turn:turn.anands.xyz:3478,turns:turn.anands.xyz:5349') + field('s_tw', 'TURN shared secret' + (c.turn && c.turn.secretSet ? ' (saved, leave blank to keep)' : ''), '', c.turn && c.turn.secretSet ? '••••••••' : 'static-auth-secret', 'password') + field('s_ts', 'STUN address(es) (optional)', c.turn && c.turn.stun, 'stun:stun.l.google.com:19302') + '<div id="r_turn" class="note" role="status"></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" data-act="save" data-k="turn">Save</button></div></div>' +
    (window.AOSInt ? window.AOSInt.settingsCards(field) : '') +
    '<div class="card"><h2 style="font-size:20px;margin-bottom:14px">Assistant (FreeLLMAPI)</h2>' + field('s_lb', 'API address (OpenAI compatible)', c.llm.base, 'https://llm.anands.xyz/v1') + field('s_lk', 'API key' + (c.llm.keySet ? ' (saved, leave blank to keep)' : ''), '', c.llm.keySet ? '••••••••' : 'sk-...', 'password') + field('s_lm', 'Model', c.llm.model, 'gpt-4o-mini') + '<div id="r_llm" class="note" role="status"></div><button class="btn primary" data-act="save" data-k="llm">Save and test</button></div>' +
    '<div class="card"><h2 style="font-size:20px;margin-bottom:14px">Local mode</h2><dl class="dl"><dt>Sign-in</dt><dd>' + (S.login.method === 'oidc' ? 'Your SSO' : 'Password') + ', handled by this server</dd><dt>App data</dt><dd>Database in your data volume</dd><dt>Files</dt><dd>Folder in your data volume</dd><dt>AI</dt><dd>Your FreeLLMAPI</dd><dt>External services</dt><dd>Apps cannot connect (CSP)</dd></dl></div></div></div>';
}
/* ---------- Drive (Cloudreve via WebDAV) ---------- */
S.drive = { path: '/', items: [], loading: false, error: null, code: null, sel: [], status: null };
function loadDrive(p, quiet) { return window.AOSDrive ? window.AOSDrive.load(p, quiet) : Promise.resolve(); }
function driveV() { return window.AOSDrive ? window.AOSDrive.view() : '<div class="wrap"><div class="empty">Loading Drive...</div></div>'; }
var OPENWITH = { csv: ['spreadsheet'], xlsx: ['spreadsheet'], xls: ['spreadsheet'], docx: ['documents'], doc: ['documents'], pdf: ['pdf'], pptx: ['presentation'], ppt: ['presentation'], jpg: ['photo-studio'], jpeg: ['photo-studio'], png: ['photo-studio'], webp: ['photo-studio'], gif: ['photo-studio'], mp4: ['video-studio'], mov: ['video-studio'], mp3: ['audio-studio'], wav: ['audio-studio'], svg: ['vector-studio'], drawio: ['whiteboard'] };
/* Apps verified to read a file handed to them at launch (puter.ui.onLaunchedWithItems). The rest open normally and use their own Open dialog, which lists /Drive. */
var LAUNCHES = ['audio-studio', 'cad', 'circuits', 'documents', 'parametric', 'pdf', 'photo-studio', 'presentation', 'spreadsheet', 'vector-studio', 'video-studio'];
var TEXTEXT = /^(txt|md|csv|tsv|json|html|htm|xml|yml|yaml|log|ini|conf|js|css|py|sh)$/;
function dext(n) { var m = /\.([a-z0-9]+)$/i.exec(n); return m ? m[1].toLowerCase() : ''; }
function dedV() {
  var e = S.dedit || {}, name = (e.path || '').split('/').pop();
  return '<div class="wrap"><div class="winbar"><button class="btn sm" data-act="nav" data-v="drive">' + ic('back') + 'Drive</button><div><b style="font-family:var(--display);font-size:20px;font-weight:500">' + esc(name) + '</b><div class="mono" style="color:var(--muted);font-size:12.5px">' + esc(e.path || '') + '</div></div><span style="flex:1"></span><span id="dstat" style="font-size:13px;color:var(--muted)">' + (e.loading ? 'Loading...' : e.error ? '' : 'Loaded from Drive') + '</span><button class="btn primary sm" data-act="dsave"' + (e.loading || e.error ? ' disabled' : '') + '>Save to Drive</button></div>' +
    (e.error ? '<div class="banner"><i class="dot bad"></i><span>' + esc(e.error) + '</span></div>' : '<div class="card"><textarea class="input mono" id="dtxt" data-in="dtxt" aria-label="File contents" style="width:100%;min-height:55vh;line-height:1.55;resize:vertical;white-space:pre"' + (e.loading ? ' disabled' : '') + '>' + esc(e.text || '') + '</textarea></div>') + '</div>';
}
function dedOpen(p) {
  S.dedit = { path: p, text: '', loading: true, error: null }; go('dedit');
  fetch('/_local/fs/get?path=' + encodeURIComponent(p), { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error('Could not read the file (' + r.status + ').'); return r.text(); })
    .then(function (t) { S.dedit.text = t; S.dedit.loading = false; }).catch(function (e) { S.dedit.error = e.message; S.dedit.loading = false; }).then(function () { if (S.view === 'dedit') redraw(); });
}
function dedSave() {
  var e = S.dedit; if (!e || e.loading) return; var st = $('#dstat'); if (st) { st.textContent = 'Saving...'; st.style.color = 'var(--muted)'; }
  api('/_local/fs/write?path=' + encodeURIComponent(e.path) + '&overwrite=1', { method: 'POST', body: e.text, headers: { 'content-type': 'text/plain' } })
    .then(function () { st = $('#dstat'); if (st) { st.textContent = 'Saved to Drive'; st.style.color = 'var(--ok)'; } }).catch(function (x) { st = $('#dstat'); if (st) { st.textContent = 'Could not save: ' + x.message; st.style.color = 'var(--bad)'; } });
}
function note(id, text, cls) { var el = $('#' + id); if (el) { el.textContent = text; el.style.color = cls === 'ok' ? 'var(--ok)' : cls === 'bad' ? 'var(--bad)' : 'var(--muted)'; } }
function saveGroup(k, after) {
  var v = function (id) { var e = $('#' + id); return e ? e.value : ''; }, body = {};
  if (k === 'immich') body.immich = { url: v('s_iu'), key: v('s_ik') };
  if (k === 'coolify') body.coolify = { url: v('s_cu'), token: v('s_ct') };
  if (k === 'vault') body.vault = { url: v('s_vu') };
  if (k === 'rbrowser') body.rbrowser = { url: v('s_rb') };
  if (k === 'links') body.links = { ai: v('s_la'), files: v('s_lf'), storage: v('s_ls'), paperless: v('s_lp') };
  if (k === 'status' || k === 'vpn' || k === 'cards') body[k] = { url: v('s_' + k + 'u'), user: v('s_' + k + 'n'), pass: v('s_' + k + 'p') };
  if (k === 'google') body.google = { clientId: v('s_gid'), clientSecret: v('s_gsec') };
  if (k === 'pulse') body.pulse = { url: v('s_pulseu'), token: v('s_pulset'), user: v('s_pulseus'), pass: v('s_pulsepw') };
  if (k === 'dav') body.dav = { url: v('s_du'), user: v('s_dn'), pass: v('s_dp') };
  if (k === 'llm') body.llm = { base: v('s_lb'), key: v('s_lk'), model: v('s_lm') };
  if (k === 'mail') { body.mail = { host: v('s_mh'), port: v('s_mp'), security: v('s_ms'), user: v('s_mu'), pass: v('s_mw'), from: v('s_mf'), fromName: v('s_mn'), dailyCap: v('s_mc') }; body.public = { url: v('s_pu') }; }
  if (k === 'turn') body.turn = { urls: v('s_tu'), secret: v('s_tw'), stun: v('s_ts') };
  note('r_' + k, 'Saving...');
  return api('/api/settings', { method: 'PUT', json: body }).then(function (s) { S.settings = s; if (k === 'turn') { note('r_turn', 'Saved. Guests behind strict firewalls can now use your relay.', 'ok'); return; } if (k === 'links') { note('r_links', 'Saved. The Home tiles use these now.', 'ok'); return; } if (k === 'rbrowser') { note('r_rbrowser', 'Saved. Reload the page, then open Browser in Desktop and press Full browser.', 'ok'); return; } note('r_' + k, 'Saved. Testing...');
    if (k === 'llm') return api('/api/chat/test', { method: 'POST', json: {} }).then(function (r) { note('r_llm', r.ok ? 'Connected. Model replied (' + (r.model || '?') + ').' : 'Saved, but the test failed: ' + r.message, r.ok ? 'ok' : 'bad'); });
    return api('/api/settings/test', { method: 'POST', json: { target: k } }).then(function (r) {
      if (k === 'immich') { S.imm = r; S.tl = { items: [], next: 1, loading: false, error: null, loaded: false }; S.albums = null; if (r.connected) loadPage(S.tl, '/api/photos/timeline'); }
      if (k === 'pulse' && window.AOSPulse) { var pst = window.AOSPulse.state; pst.d = {}; pst.err = {}; if (window.AOSPulse2) window.AOSPulse2.state.boot = null; }
      if (k === 'dav') { S.drive.status = r; S.drive.items = []; }
      if (k === 'vault') { S.vault.status = r; }
      if (window.AOSInt && (k === 'status' || k === 'vpn' || k === 'cards')) window.AOSInt.after(k, r);
      if (k === 'coolify') { S.ins = { data: null, error: null, code: null, loading: false }; if (r.connected) loadIns(true); }
      note('r_' + k, r.connected ? (k === 'mail' ? 'Connected and signed in to your mail server. Send a test email to be sure.' : 'Connected') + (r.version ? ' (Immich ' + r.version + ')' : r.resources != null ? ' (' + r.resources + ' ' + (r.unit || 'resources') + ')' : '') + '.' : 'Saved, but not reachable: ' + (r.reason || 'no answer') + '.', r.connected ? 'ok' : 'bad'); if (after) after(r); });
  }).catch(function (e) { note('r_' + k, e.message, 'bad'); });
}
function modal(html) { var m = $('#modal'); if (!html) { m.hidden = true; m.innerHTML = ''; return; } m.hidden = false; m.innerHTML = '<div class="modal" data-act="mx"><div class="card" role="dialog" aria-modal="true">' + html + '</div></div>'; }
function connectModal(k) {
  var c = S.settings || { immich: {}, coolify: {} }, isI = k === 'immich';
  modal('<h2 style="font-size:22px;margin-bottom:6px">Connect ' + (isI ? 'Immich' : 'Coolify') + '</h2><p style="color:var(--muted);margin:0 0 16px">' + (isI ? 'The OS reads albums and photos through the Immich API, the same way Nextcloud Memories does. Create an API key in Immich under Account settings.' : 'Cloud Insights reads your server through the Coolify API. Create a read-only token under Keys and tokens.') + '</p><div class="field"><label for="m1">Address</label><input class="input" id="m1" value="' + esc((isI ? c.immich : c.coolify).url || '') + '" placeholder="https://' + (isI ? 'photos' : 'coolify') + '.anands.xyz"></div><div class="field"><label for="m2">' + (isI ? 'API key' : 'API token') + '</label><input class="input" id="m2" type="password" autocomplete="off" placeholder="' + ((isI ? c.immich.keySet : c.coolify.tokenSet) ? 'Saved, leave blank to keep' : '') + '"></div><div id="mres" style="margin-bottom:14px;font-size:14px" role="status"></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" data-act="mx2">Close</button><button class="btn primary" data-act="msave" data-k="' + k + '">Save and test</button></div>');
  var f = $('#m1'); if (f) f.focus();
}

/* ---------- Vault (Vaultwarden, decrypted in this tab only) ---------- */
P.eye = 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z';
P.copy = 'M9 9h11v11H9z M5 15H4V4h11v1';
P.key = 'M21 2l-2 2 M11.4 11.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8z M11.4 11.6L15.5 7.5 M15.5 7.5l3 3L22 7l-3-3';
P.open = 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3';
var VLOCK_MS = 300000;
S.vault = { folders: [], edit: null, items: null, skipped: null, sel: null, folder: 'All', q: '', show: false, err: '', busy: false, twofa: null, email: LS.get('vault.email', ''), lockAt: 0, status: null };
function vWeak(p) { return !!p && (p.length < 10 || /^(password|qwerty|123456|summer|letmein)/i.test(p)); }
function vReused(it) { return !!it.pw && S.vault.items.filter(function (x) { return x.pw === it.pw; }).length > 1; }
function vFlags(it) { var f = []; if (it.type === 'login' && it.pw) { if (vWeak(it.pw)) f.push('weak'); if (vReused(it)) f.push('reused'); if (it.age > 365) f.push('old'); } return f; }
function vLock(auto) { var V = S.vault; try { window.AOSVault.lock(); } catch (e) {} V.edit = null; V.items = null; V.sel = null; V.show = false; V.q = ''; V.folder = 'All'; V.twofa = null; V.pending = null; V.noAuto = true; V.err = auto === true ? 'Locked after 5 minutes without activity.' : ''; if (S.view === 'vault') redraw(); if (auto !== true) toast('Vault locked. Nothing is kept in memory.'); }
function vTouch() { if (S.vault.items) S.vault.lockAt = Date.now() + VLOCK_MS; }
function vClip(text, label) {
  var done = function () { toast(label + ' copied. The clipboard is cleared in 30 seconds.'); clearTimeout(vClip.t); vClip.t = setTimeout(function () { try { navigator.clipboard.writeText('').catch(function () {}); } catch (e) {} }, 30000); };
  try { navigator.clipboard.writeText(text).then(done).catch(function () { toast('Copy was blocked by the browser. Select the text instead.'); }); } catch (e) { toast('Copy was blocked by the browser. Select the text instead.'); }
}
function vMatch(it) {
  var q = S.vault.q.toLowerCase().trim(), f = S.vault.folder;
  if (f === 'weak' || f === 'reused' || f === 'old') { if (vFlags(it).indexOf(f) < 0) return false; } else if (f === 'fav') { if (!it.fav) return false; } else if (f !== 'All' && it.folder !== f) return false;
  return !q || (it.name + ' ' + it.user + ' ' + it.url).toLowerCase().indexOf(q) > -1;
}
function vTile(it) { var h = 0; for (var i = 0; i < it.name.length; i++) h = (h * 31 + it.name.charCodeAt(i)) % 360; return '<span class="vtile">' + esc(it.name.charAt(0).toUpperCase()) + '</span>'; }
function vListHtml() {
  var rows = S.vault.items.filter(vMatch).sort(function (a, b) { return a.name.localeCompare(b.name); });
  return rows.map(function (it) {
    var fl = vFlags(it);
    return '<button class="drow vrow' + (S.vault.sel === it.id ? ' sel' : '') + '" data-act="vsel" data-id="' + esc(it.id) + '">' + vTile(it) + '<span class="dn"><b>' + esc(it.name) + '</b><small>' + esc(it.user || (it.type === 'note' ? 'Secure note' : '')) + '</small></span><span class="dm">' + (fl.length ? '<span class="pill ' + (fl.indexOf('weak') > -1 ? 'bad' : 'warn') + '">' + fl[0] + '</span>' : '') + '</span><span class="dm dd">' + (it.fav ? '&#9733;' : '') + '</span></button>';
  }).join('') || '<div class="empty" style="margin:16px">Nothing matches</div>';
}
function vField(label, val, k, extra) { return '<div class="vfield"><div><div class="eyebrow">' + label + '</div><div class="vval mono">' + val + '</div></div><div class="vbtns">' + (extra || '') + '<button class="btn sm" data-act="vcopy" data-k="' + k + '" aria-label="Copy ' + label.toLowerCase() + '">' + ic('copy') + 'Copy</button></div></div>'; }
function vSel() { return S.vault.items.filter(function (x) { return x.id === S.vault.sel; })[0]; }
function vDetail() {
  var V = S.vault, it = vSel(); if (V.edit) return vEditForm();
  if (!it) return '<div class="dpanel"><h3 style="font-size:18px;margin-bottom:6px">Pick an item</h3><p style="color:var(--muted);margin:0;font-size:14px">Everything here is decrypted in this tab. Copy puts a value on your clipboard for 30 seconds.</p></div>';
  var fl = vFlags(it), warn = fl.map(function (f) { return f === 'weak' ? 'This password is short or common.' : f === 'reused' ? 'The same password is used on ' + V.items.filter(function (x) { return x.pw === it.pw; }).length + ' items.' : 'Not changed for ' + Math.round(it.age / 30) + ' months.'; }).join(' ');
  var pwv = V.show ? esc(it.pw) : '&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;';
  return '<div class="dpanel"><div style="display:flex;gap:12px;align-items:center;margin-bottom:6px">' + vTile(it) + '<div style="min-width:0"><h3 style="font-size:20px;word-break:break-word">' + esc(it.name) + '</h3><div style="color:var(--muted);font-size:13px">' + esc(it.folder) + '</div></div></div>' +
    (warn ? '<div class="vwarn">' + esc(warn) + '</div>' : '') +
    (it.user ? vField('Username', esc(it.user), 'user') : '') +
    (it.pw ? vField('Password', pwv, 'pw', '<button class="btn sm" data-act="vreveal">' + ic('eye') + (V.show ? 'Hide' : 'Show') + '</button>') : '') +
    (it.totp ? '<div class="vfield"><div><div class="eyebrow">One-time code</div><div class="vval mono" style="font-size:22px;letter-spacing:.08em" id="vtotp">------</div></div><div class="vbtns"><svg class="vring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--line)" stroke-width="3"/><circle id="vringc" cx="18" cy="18" r="15" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-dasharray="94.2" stroke-dashoffset="0" transform="rotate(-90 18 18)"/></svg><button class="btn sm" data-act="vcopy" data-k="totp">' + ic('copy') + 'Copy</button></div></div>' : '') +
    (it.url ? '<div class="vfield"><div><div class="eyebrow">Website</div><div class="vval mono" style="word-break:break-all">' + esc(it.url.replace(/^https?:\/\//, '')) + '</div></div><div class="vbtns">' + (/^https?:\/\//i.test(it.url) ? '<a class="btn sm" href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer">' + ic('open') + 'Open</a>' : '') + '</div></div>' : '') +
    (it.notes ? '<div class="vfield" style="display:block"><div class="eyebrow">Notes</div><div style="margin-top:4px;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere">' + esc(it.notes) + '</div></div>' : '') +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn primary" data-act="vedit">' + ic('doc') + 'Edit</button><button class="btn" data-act="vdel">' + ic('trash') + 'Delete</button></div>' + (V.delAsk ? '<div class="vwarn" style="margin-top:10px">Move this item to the trash in your Vault? <button class="btn sm" data-act="vdelyes">Yes, delete</button> <button class="btn sm" data-act="vdelno">Keep</button></div>' : '') + '<p class="note" style="margin:10px 0 0">Changed ' + (it.age < 60 ? it.age + ' days' : Math.round(it.age / 30) + ' months') + ' ago. Edits are encrypted here and saved to your Vault.</p></div>';
}
function vEditForm() {
  var V = S.vault, e = V.edit, it = e.draft, isLogin = it.type !== 'note';
  var fld = function (id, l, v, cls) { return '<div class="field"><label for="' + id + '">' + l + '</label><input class="input' + (cls || '') + '" id="' + id + '" value="' + esc(v || '') + '" autocomplete="off" spellcheck="false"></div>'; };
  var folders = '<option value="">No folder</option>' + V.folders.map(function (f) { return '<option value="' + esc(f.id) + '"' + (it.folderId === f.id ? ' selected' : '') + '>' + esc(f.name) + '</option>'; }).join('');
  return '<div class="dpanel"><h3 style="font-size:20px;margin-bottom:8px">' + (e.id ? 'Edit' : 'New') + (isLogin ? ' login' : ' note') + '</h3><form id="vef" autocomplete="off">' +
    fld('ve_name', 'Name', it.name) +
    (isLogin ? fld('ve_user', 'Username', it.user) + '<div class="field"><label for="ve_pw">Password</label><div style="display:flex;gap:8px"><input class="input mono" id="ve_pw" value="' + esc(it.pw || '') + '" autocomplete="off" spellcheck="false"><button class="btn" type="button" data-act="vgen">Generate</button></div></div>' + fld('ve_totp', 'Authenticator key (optional)', it.totp, ' mono') + fld('ve_url', 'Website', it.url) : '') +
    '<div class="field"><label for="ve_notes">Notes</label><textarea class="input" id="ve_notes" rows="4">' + esc(it.notes || '') + '</textarea></div>' +
    '<div class="field"><label for="ve_folder">Folder</label><select class="input" id="ve_folder">' + folders + '</select></div>' +
    '<label style="display:flex;gap:8px;align-items:center;margin-bottom:14px"><input type="checkbox" id="ve_fav"' + (it.fav ? ' checked' : '') + '> Favourite</label>' +
    (e.err ? '<p role="alert" style="color:var(--bad);font-size:14px;margin:0 0 10px">' + esc(e.err) + '</p>' : '') +
    '<div style="display:flex;gap:8px"><button class="btn primary" type="submit"' + (e.busy ? ' disabled' : '') + '>' + (e.busy ? 'Saving...' : 'Save') + '</button><button class="btn" type="button" data-act="vcancel">Cancel</button></div></form></div>';
}
function vEditRead() {
  var e = S.vault.edit, d = e.draft, v = function (id) { var x = $('#' + id); return x ? x.value : ''; };
  d.name = v('ve_name').trim(); d.notes = v('ve_notes'); d.folderId = v('ve_folder') || null; d.fav = !!($('#ve_fav') || {}).checked;
  if (d.type !== 'note') { d.user = v('ve_user').trim(); d.pw = v('ve_pw'); d.totp = v('ve_totp').trim(); d.url = v('ve_url').trim(); }
  return d;
}
function vEditSave() {
  var V = S.vault, e = V.edit; if (!e || e.busy) return; var d = vEditRead();
  if (!d.name) { e.err = 'Give the item a name.'; redraw(); return; }
  var orig = e.id ? V.items.filter(function (x) { return x.id === e.id; })[0] : null; d.pwChanged = !orig || orig.pw !== d.pw;
  e.busy = true; e.err = ''; redraw();
  window.AOSVault.save(d).then(function (saved) {
    var i = V.items.map(function (x) { return x.id; }).indexOf(saved.id); if (i > -1) V.items[i] = saved; else V.items.push(saved);
    V.edit = null; V.sel = saved.id; V.show = false; toast('Saved to your Vault.'); redraw(); vTick();
  }).catch(function (x) { e.busy = false; e.err = x.message; redraw(); });
}
function vaultV() {
  var V = S.vault, head = '<div class="pagehead"><div><h1>Vault</h1></div><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">';
  if (V.status && !V.status.configured) return '<div class="wrap">' + head + '</div></div>' + connectBlock('Connect your Vault', 'vsettings', 'Enter the address of your Vaultwarden (for example https://pass.anands.xyz) in Settings. Your master password is never saved.') + '</div>';
  if (!V.items) {
    var two = V.twofa;
    return '<div class="wrap">' + head + '<span class="pill warn"><i class="dot warn"></i>Locked</span></div></div><div class="card vlockcard"><div class="vlockic">' + ic('lock') + '</div><h2 style="font-size:24px;margin:10px 0 4px">' + (two ? 'Two-step code' : 'Vault is locked') + '</h2><p style="color:var(--muted);margin:0 0 18px;font-size:14.5px">' + (two ? 'Enter the code from your authenticator app.' : 'Enter your master password. It is used in this tab only.') + '</p>' +
      '<form id="vf" autocomplete="off">' + (!two && V.savedOn ? '<p class="note" style="margin:0 0 12px">Saved login: <b>' + esc(V.savedEmail) + '</b></p><button class="btn primary" type="button" data-act="vsaved" style="width:100%;justify-content:center;margin-bottom:10px"' + (V.busy ? ' disabled' : '') + '>' + ic('key') + 'Unlock with saved login</button><p style="text-align:center;margin:0 0 6px"><button class="btn sm ghost" type="button" data-act="vforget">Forget saved login</button></p>' : '') + (two ? '<div class="field"><label for="v2">Code</label><input class="input mono" id="v2" inputmode="numeric" autocomplete="one-time-code" placeholder="123456"></div>' : '<div class="field"><label for="vem">Email</label><input class="input" id="vem" type="email" autocomplete="username" value="' + esc(V.email) + '" placeholder="you@example.com"></div><div class="field"><label for="vpw">Master password</label><input class="input" id="vpw" type="password" autocomplete="off" placeholder="Master password"></div><label class="vremb"><input type="checkbox" id="vrem"' + (V.rem ? ' checked' : '') + '> Remember me on this device, so next time I only enter the code</label>') +
      (V.err ? '<p role="alert" style="color:var(--bad);font-size:14px;margin:-4px 0 12px">' + esc(V.err) + '</p>' : '') +
      '<button class="btn primary" type="submit" style="width:100%;justify-content:center"' + (V.busy ? ' disabled' : '') + '>' + ic('key') + (V.busy ? 'Unlocking...' : 'Unlock') + '</button></form></div>'+ '</div>';
  }
  var items = V.items, n = items.length, w = items.filter(function (x) { return x.type === 'login' && vWeak(x.pw); }).length, r = items.filter(function (x) { return x.type === 'login' && vReused(x); }).length, o = items.filter(function (x) { return x.type === 'login' && x.pw && x.age > 365; }).length;
  var rem = Math.max(0, Math.round((V.lockAt - Date.now()) / 1000));
  var kp = function (l, v, f, c) { return '<button class="vstat' + (V.folder === f ? ' on' : '') + '" data-act="vfold" data-f="' + f + '"><b style="' + (c && v ? 'color:' + c : '') + '">' + v + '</b><span>' + l + '</span></button>'; };
  var fnames = []; items.forEach(function (x) { if (fnames.indexOf(x.folder) < 0) fnames.push(x.folder); }); fnames.sort();
  var chips = ['All', 'fav'].concat(fnames).map(function (f) { return '<button class="chip" data-act="vfold" data-f="' + esc(f) + '" aria-pressed="' + (V.folder === f) + '">' + (f === 'fav' ? 'Favourites' : esc(f)) + '</button>'; }).join('');
  return '<div class="vapp">' + head + '<span class="pill ok"><i class="dot"></i>Unlocked &middot; locks in <span id="vlockt" class="mono">' + Math.floor(rem / 60) + ':' + ('0' + rem % 60).slice(-2) + '</span></span><button class="btn" data-act="vlock">' + ic('lock') + 'Lock now</button></div></div>' +
    '<div class="vstats">' + kp('Items', n, 'All') + kp('Weak', w, 'weak', 'var(--bad)') + kp('Reused', r, 'reused', 'var(--warn)') + kp('Not changed in a year', o, 'old', 'var(--warn)') + '</div>' +
    '<div class="toolbar"><div class="search">' + ic('search') + '<input class="input" id="vq" type="search" placeholder="Search name, username or site" value="' + esc(V.q) + '" aria-label="Search vault" data-in="vq"></div><div class="chips">' + chips + '</div><button class="btn primary" data-act="vnew" data-t="login" style="margin-left:auto">' + ic('plus') + 'New login</button><button class="btn" data-act="vnew" data-t="note">' + ic('doc') + 'New note</button></div>' +
    '<div class="vsplit"><div class="vlistc"><div id="vlist">' + vListHtml() + '</div></div>' + vDetail() + '</div>' +
    (V.skipped && (V.skipped.org || V.skipped.other) ? '<p class="note" style="margin-top:12px">Not shown here: ' + (V.skipped.org ? V.skipped.org + ' shared (organization) item' + (V.skipped.org === 1 ? '' : 's') : '') + (V.skipped.org && V.skipped.other ? ', ' : '') + (V.skipped.other ? V.skipped.other + ' card, identity or unreadable item' + (V.skipped.other === 1 ? '' : 's') : '') + '. Open them in the Vault web app.</p>' : '')+ '</div>';
}
function loadVault() { S.vault.savedOn = !!(window.AOSVault && AOSVault.hasSaved()); return api('/api/vault/status').then(function (s) { S.vault.status = s; }).catch(function () { S.vault.status = { configured: true, connected: false }; }).then(function () { if (S.view === 'vault') redraw(); vAuto(); }); }
function vAuto(force) {
  var V = S.vault; if (!window.AOSVault || V.items || V.busy || V.twofa || (V.noAuto && !force) || !V.status || !V.status.configured || !AOSVault.hasSaved()) return;
  AOSVault.saved().then(function (c) { if (!c) { V.savedOn = false; if (S.view === 'vault') redraw(); return; } V.savedEmail = c.email; V.savedOn = true; V.email = c.email; V.pending = c.pw; V.fromSaved = true; vDo(c.email, c.pw, null, false); });
}
function vTick() {
  var V = S.vault; if (!V.items) return;
  var rem = Math.round((V.lockAt - Date.now()) / 1000); if (rem <= 0) { vLock(true); return; }
  var t = $('#vlockt'); if (t) t.textContent = Math.floor(rem / 60) + ':' + ('0' + rem % 60).slice(-2);
  var it = vSel(), el = $('#vtotp');
  if (it && it.totp && el && S.view === 'vault') window.AOSVault.totp(it.totp).then(function (r) { var e = $('#vtotp'); if (!e || !r) return; e.textContent = r.code.length === 6 ? r.code.slice(0, 3) + ' ' + r.code.slice(3) : r.code; var rc = $('#vringc'); if (rc) { rc.setAttribute('stroke-dashoffset', String(94.2 * (1 - r.left / r.period))); rc.setAttribute('stroke', r.left <= 5 ? 'var(--bad)' : 'var(--accent)'); } });
}
setInterval(vTick, 1000);
document.addEventListener('click', vTouch, true); document.addEventListener('keydown', vTouch, true);
function vSubmit() {
  var V = S.vault; if (V.busy) return;
  var emailEl = $('#vem'), pwEl = $('#vpw'), codeEl = $('#v2'), remEl = $('#vrem');
  if (!V.twofa) { V.email = emailEl ? emailEl.value.trim() : V.email; V.pending = pwEl ? pwEl.value : ''; V.rem = remEl ? remEl.checked : V.rem; if (!V.email || !V.pending) { V.err = 'Enter your email and master password.'; redraw(); return; } LS.set('vault.email', V.email); V.fromSaved = false; }
  var tf = V.twofa ? { code: (codeEl ? codeEl.value : '').replace(/\s/g, ''), provider: V.twofa.provider } : null; if (tf && !tf.code) return;
  vDo(V.email, V.pending, tf, V.rem && !V.fromSaved);
}
function vDo(email, pw, tf, remember) {
  var V = S.vault; V.busy = true; V.err = ''; redraw();
  window.AOSVault.login(email, pw, tf).then(function (r) {
    if (remember) { AOSVault.remember(email, pw).then(function () { V.savedOn = true; V.savedEmail = email; }).catch(function () {}); }
    V.items = r.items; V.folders = r.folders; V.edit = null; V.skipped = r.skipped; V.pending = null; V.twofa = null; V.busy = false; V.sel = null; V.lockAt = Date.now() + VLOCK_MS; V.fromSaved = false; redraw(); vTick();
  }).catch(function (e) {
    V.busy = false;
    if (e.code === '2fa') { var p = e.providers.filter(function (x) { return x === 0 || x === 1; })[0]; if (p === undefined) { V.err = 'This account needs a two-step method that is not supported here (security key or similar). Use the Vault web app.'; V.pending = null; } else V.twofa = { provider: p }; }
    else {
      V.err = e.code === 'not_configured' ? 'Add the Vault address in Settings first.' : e.message;
      if (V.twofa) V.twofa = V.twofa; else V.pending = null;
      if (V.fromSaved && e.code === 'bad_login' && !tf) { AOSVault.forget(); V.savedOn = false; V.err = 'The saved login no longer works (master password changed?). Enter it again.'; V.fromSaved = false; }
    }
    redraw(); var f = $('#vpw') || $('#v2'); if (f) f.focus();
  });
}

/* ---------- palette ---------- */
var PAL = [];
function palItems() {
  var l = [['Home', 'Overview', 'home', 'home'], ['Photos', 'Immich library', 'photos', 'photos'], ['Drive', 'Cloudreve files', 'cloud', 'drive'], ['Vault', 'Vaultwarden passwords', 'lock', 'vault'], ['Cloud Insights', 'Coolify health and deployments', 'insights', 'insights'], ['Suite', 'All apps', 'apps', 'apps'], ['Settings', 'Immich, Coolify, assistant', 'settings', 'settings']].map(function (x) { return { n: x[0], s: x[1], ic: x[2], run: function () { S.openApp = null; go(x[3]); } }; });
  (S.albums || []).forEach(function (a) { l.push({ n: a.name, s: 'Photo album', ic: 'photos', run: function () { openAlbum(a.id, a.name); } }); });
  S.apps.forEach(function (a) { if (a.hasSource) l.push({ n: a.name, s: 'replaces ' + a.alternativeTo, img: '/_icons/' + a.slug + '.png', run: function () { launch(a.slug); } }); });
  if (S.ins.data) S.ins.data.resources.forEach(function (r) { l.push({ n: r.n, s: r.t + ' · ' + r.p, ic: 'cloud', run: function () { S.rf = 'all'; S.rq = r.n; go('insights'); } }); });
  return l;
}
function palList(q) { q = (q || '').toLowerCase().trim(); return PAL.filter(function (x) { return !q || (x.n + ' ' + x.s).toLowerCase().indexOf(q) > -1; }).slice(0, 8); }
function palDraw(q) { var r = $('#palres'); if (!r) return; var ls = palList(q); r.innerHTML = ls.length ? ls.map(function (x, i) { return '<button class="it' + (i === 0 ? ' sel' : '') + '" data-act="pick" data-i="' + PAL.indexOf(x) + '">' + (x.img ? '<img src="' + x.img + '" alt="">' : '<span style="color:var(--accent-text)">' + ic(x.ic) + '</span>') + '<span>' + esc(x.n) + '</span><small>' + esc(x.s) + '</small></button>'; }).join('') : '<p style="margin:12px;color:var(--muted)">Nothing matches.</p>'; }
function palette() { if (!S.user) return; if (window.AOSOmni) return window.AOSOmni.open(); PAL = palItems(); var m = $('#modal'); m.hidden = false; m.innerHTML = '<div class="modal" data-act="mx"><div class="card pal" role="dialog" aria-modal="true" aria-label="Search"><input id="pi" data-in="pal" placeholder="Search apps, albums, server resources" autocomplete="off" aria-label="Search"><div class="res" id="palres"></div></div></div>'; palDraw(''); var i = $('#pi'); if (i) i.focus(); loadAlbums().then(function () { if ($('#pi')) { PAL = palItems(); palDraw($('#pi').value); } }); }
function openAlbum(id, name) {
  S.tab = 'timeline'; S.pq = ''; S.album = { id: id, name: name, items: [], next: null, loading: true, loaded: false }; go('photos');
  api('/api/photos/albums/' + id).then(function (r) { S.album.items = r.items; S.album.name = r.name || name; S.album.loaded = true; }).catch(function (e) { S.album.error = e.message; S.album.loaded = true; }).then(function () { S.album.loading = false; if (S.view === 'photos') photosGrid(); });
}

/* ---------- assistant ---------- */
function md(t) { var h = esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>'), lines = h.split('\n'), o = '', inl = false; lines.forEach(function (l) { if (/^\s*[-*] /.test(l)) { if (!inl) { o += '<ul>'; inl = true; } o += '<li>' + l.replace(/^\s*[-*] /, '') + '</li>'; } else { if (inl) { o += '</ul>'; inl = false; } o += (l ? l + '<br>' : ''); } }); if (inl) o += '</ul>'; return o.replace(/(<br>)+$/, ''); }
function drawChat() {
  var el = $('#chat'), st = S.settings || { llm: {} };
  var head = '<div class="ch"><span style="color:var(--accent-text)">' + ic('chat') + '</span><b>Anands Assistant</b><span class="sp"></span>' + (S.model ? '<span class="pill" style="font-size:11.5px">' + esc(S.model) + '</span>' : '') + '<button class="ib2" data-act="chatset" aria-label="Assistant settings">' + ic('settings') + '</button><button class="ib2" data-act="chatx" aria-label="Close assistant">' + ic('x') + '</button></div>';
  if (S.chatSet) {
    var c = st.llm || {};
    el.innerHTML = head + '<div class="cset"><h3 style="font-size:18px;margin-bottom:4px">Connect your FreeLLMAPI</h3><p class="note">Any OpenAI-compatible address works. The key is stored on the server and never comes back to the browser.</p><div class="field"><label for="c1">API address</label><input class="input" id="s_lb" value="' + esc(c.base || '') + '" placeholder="https://llm.anands.xyz/v1"></div><div class="field"><label for="c2">API key' + (c.keySet ? ' (saved, leave blank to keep)' : '') + '</label><input class="input" id="s_lk" type="password" autocomplete="off" placeholder="' + (c.keySet ? '••••••••' : 'sk-...') + '"></div><div class="field"><label for="c3">Model</label><input class="input" id="s_lm" value="' + esc(c.model || '') + '"></div><div id="r_llm" class="note" role="status"></div><div style="display:flex;gap:10px"><button class="btn primary" data-act="save" data-k="llm">Save and test</button><button class="btn" data-act="chatdone">Back to chat</button></div></div>';
    return;
  }
  var ctx = '<div class="ctx"><span style="color:var(--muted);font-size:12.5px;align-self:center">Knows:</span>' + [['photos', 'Photos'], ['insights', 'Cloud Insights'], ['cards', 'Cards'], ['pulse', 'Pulse'], ['apps', 'Suite'], ['files', 'Files']].map(function (x) { return '<button class="chip" data-act="ctx" data-k="' + x[0] + '" aria-pressed="' + S.ctx[x[0]] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  var m = '';
  if (!S.msgs.length) m = '<div class="msg a">Ask me about your photos, your server, your apps or files saved by the apps. I only know what is connected, and I will say when something is not.</div><div class="sugg">' + ['Which resources have no health check?', 'What deployed most recently, and how long did it take?', 'What photos did I add this month?', 'Which apps replace Excel or Word?', 'Summarise my server in three lines'].map(function (q) { return '<button data-act="ask" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>';
  else m = S.msgs.map(function (x, i) { return '<div class="msg ' + (x.r === 'u' ? 'u' : 'a') + '" id="m' + i + '">' + (x.r === 'u' ? esc(x.t) : x.t === '...' ? '<span class="typing"><i></i><i></i><i></i></span>' : x.err ? '<span style="color:var(--bad)">' + esc(x.t) + '</span>' + (x.code === 'not_configured' ? '<br><button class="link" data-act="chatset">Connect FreeLLMAPI</button>' : '') : md(x.t) + (x.used && x.used.length ? '<span class="via">Used: ' + esc(x.used.join(', ')) + '</span>' : '')) + '</div>'; }).join('');
  el.innerHTML = head + ctx + '<div id="msgs">' + m + '</div><form class="cin" id="cf"><textarea id="ci" rows="1" placeholder="Ask about your photos, server, apps or files" aria-label="Message" data-in="chatIn"></textarea><button class="send" type="submit" aria-label="Send"' + (S.busy ? ' disabled' : '') + '>' + ic('send') + '</button></form>';
  var b = $('#msgs'); b.scrollTop = b.scrollHeight;
}
function openChat(q) { S.chatOpen = true; S.chatSet = false; $('#chat').hidden = false; $('#fab').hidden = true; drawChat(); if (q) send(q); else { var i = $('#ci'); if (i) i.focus(); } }
function closeChat() { S.chatOpen = false; $('#chat').hidden = true; $('#fab').hidden = false; }
function send(q) {
  q = (q || '').trim(); if (!q || S.busy) return;
  var hist = S.msgs.filter(function (m) { return m.t !== '...' && !m.err; }).slice(-8).map(function (m) { return { role: m.r === 'u' ? 'user' : 'assistant', content: m.t }; });
  S.msgs.push({ r: 'u', t: q }); S.msgs.push({ r: 'a', t: '...' }); S.busy = true; drawChat();
  var idx = S.msgs.length - 1;
  api('/api/chat', { method: 'POST', json: { messages: hist.concat([{ role: 'user', content: q }]), ctx: S.ctx } }).then(function (r) { S.msgs[idx] = { r: 'a', t: r.text, used: r.used }; S.model = r.model || S.model; }).catch(function (e) { S.msgs[idx] = { r: 'a', t: e.message, err: true, code: e.code }; }).then(function () { S.busy = false; drawChat(); });
}

/* ---------- events ---------- */
document.addEventListener('click', function (ev) {
  var t = ev.target.closest('[data-act]'); if (!t) return; var a = t.getAttribute('data-act'), d = t.dataset;
  if (a === 'mx') { if (ev.target === t) modal(); return; }
  switch (a) {
    case 'desk': modal(); if (window.AOSDesk) window.AOSDesk.show(); break;
    case 'nav': S.openApp = null; S.openFile = null; modal(); go(d.v); break;
    case 'pal': palette(); break;
    case 'pick': { var it = PAL[+d.i]; modal(); if (it) it.run(); break; }
    case 'ask': openChat(d.q); break;
    case 'chat': openChat(); break;
    case 'ptab': S.tab = d.t; S.album = null; S.pq = ''; S.sr = { q: '', items: [], mode: '', loading: false }; if (window.AOSPX) window.AOSPX.onTab(d.t); render(); if (d.t === 'albums') loadAlbums(); if (d.t === 'favs') loadPage(S.fav, '/api/photos/favorites'); break;
    case 'album': if (d.id) openAlbum(d.id, d.name); else { S.album = null; S.tab = 'albums'; render(); loadAlbums(); } break;
    case 'more': { var set = curSet(); if (window.AOSPX && window.AOSPX.more(set)) break; if (set === S.fav) loadPage(S.fav, '/api/photos/favorites'); else if (set === S.tl) loadPage(S.tl, '/api/photos/timeline'); break; }
    case 'lb': if (window.AOSPX && (window.AOSPX.sel.length || window.AOSPX.selMode)) window.AOSPX.toggle(d.id); else openLb(d.id); break;
    case 'psel': ev.stopPropagation(); window.AOSPX.selMode = true; window.AOSPX.toggle(d.id); break;
    case 'fav': toggleFav(d.id); break;
    case 'lbx': S.lb = null; drawLb(); break;
    case 'lbp': lbMove(-1); break; case 'lbn': lbMove(1); break;
    case 'lbfav': toggleFav(S.lb); break;
    case 'lbinfo': S.info = !S.info; drawLb(); break;
    case 'photoref': { var fresh = function () { return { items: [], next: 1, loading: false, error: null, loaded: false }; }; S.tl = fresh(); S.fav = fresh(); S.albums = null; if (S.sr) S.sr = fresh(); if (S.album && S.album.items) S.album = null; redraw(); loadImm(); loadAlbums(); toast('Refreshing your photos'); break; }
    case 'upload': { var f = $('#fileIn'); if (f) f.click(); break; }
    case 'immich': connectModal('immich'); break;
    case 'coolify': connectModal('coolify'); break;
    case 'mx2': modal(); break;
    case 'msave': { var k = d.k, body = k === 'immich' ? { immich: { url: $('#m1').value, key: $('#m2').value } } : { coolify: { url: $('#m1').value, token: $('#m2').value } }; var out = $('#mres'); out.style.color = 'var(--muted)'; out.textContent = 'Saving and testing...';
      api('/api/settings', { method: 'PUT', json: body }).then(function (s) { S.settings = s; return api('/api/settings/test', { method: 'POST', json: { target: k } }); }).then(function (r) {
        if (r.connected) { modal(); toast((k === 'immich' ? 'Immich' : 'Coolify') + ' connected.'); if (k === 'immich') { S.imm = r; S.tl = { items: [], next: 1, loading: false, error: null, loaded: false }; S.albums = null; loadPage(S.tl, '/api/photos/timeline'); redraw(); } else { S.ins = { data: null, error: null, code: null, loading: false }; loadIns(true); } }
        else { out.style.color = 'var(--bad)'; out.textContent = 'Saved, but it is not reachable: ' + (r.reason || 'no answer') + '. Check the address and key.'; }
      }).catch(function (e) { out.style.color = 'var(--bad)'; out.textContent = e.message; }); break; }
    case 'save': saveGroup(d.k); break;
    case 'mbxadd': { var ad = ($('#x_ad') || {}).value, mb = { address: ad, pass: ($('#x_pw') || {}).value, imapHost: ($('#x_ih') || {}).value, smtpHost: ($('#x_sh') || {}).value }; note('r_mbx', 'Connecting and syncing...'); api('/api/mailboxes', { method: 'POST', json: mb }).then(function () { return api('/api/mailboxes'); }).then(function (r) { S.mbx = r.accounts; toast('Email account added.'); render(); }).catch(function (e) { note('r_mbx', e.message, 'bad'); }); break; }
    case 'mbxsync': note('r_mbx', 'Syncing...'); api('/api/mailboxes/' + d.id + '/sync', { method: 'POST' }).then(function () { return api('/api/mailboxes'); }).then(function (r) { S.mbx = r.accounts; render(); }).catch(function (e) { note('r_mbx', e.message, 'bad'); }); break;
    case 'mbxdef': api('/api/mailboxes/' + d.id + '/default', { method: 'POST' }).then(function (r) { S.mbx = r.accounts; render(); }); break;
    case 'mbxdel': api('/api/mailboxes/' + d.id, { method: 'DELETE' }).then(function (r) { S.mbx = r.accounts; render(); }); break;
    case 'mtest': { var to = ($('#s_mf') || {}).value || ''; note('r_mail', 'Sending...'); api('/api/mail/test', { method: 'POST', json: { to: to } }).then(function (r) { note('r_mail', 'Sent to ' + r.sentTo + '. Check that inbox.', 'ok'); }).catch(function (e) { note('r_mail', e.message, 'bad'); }); break; }
    case 'rf': S.rf = d.f; redraw(); break;
    case 'refresh': loadIns(true); break;
    case 'cat': S.appCat = d.c; redraw(); break;
    case 'vlock': vLock(); break;
    case 'vsaved': vAuto(true); break;
    case 'vforget': AOSVault.forget().then(function () { S.vault.savedOn = false; S.vault.noAuto = true; if (S.view === 'vault') redraw(); toast('Saved login removed from this device.'); }); break;
    case 'vsel': S.vault.edit = null; S.vault.delAsk = false; S.vault.sel = d.id; S.vault.show = false; redraw(); vTick(); if (innerWidth < 900) { var vp = $('.dpanel'); if (vp) vp.scrollIntoView({ block: 'start' }); } break;
    case 'vreveal': S.vault.show = !S.vault.show; redraw(); vTick(); break;
    case 'vfold': S.vault.folder = d.f; redraw(); vTick(); break;
    case 'vcopy': { var vi = vSel(); if (!vi) break; if (d.k === 'totp') window.AOSVault.totp(vi.totp).then(function (r) { if (r) vClip(r.code, 'Code'); }); else vClip(d.k === 'pw' ? vi.pw : vi.user, d.k === 'pw' ? 'Password' : 'Username'); break; }
    case 'vsettings': go('settings'); break;
    case 'vnew': S.vault.edit = { id: null, draft: { id: null, type: d.t, name: '', user: '', pw: '', totp: '', url: '', notes: '', folderId: null, fav: false }, err: '', busy: false }; S.vault.sel = null; redraw(); if (innerWidth < 900) { var vp2 = $('.dpanel'); if (vp2) vp2.scrollIntoView({ block: 'start' }); } break;
    case 'vedit': { var ei = vSel(); if (ei) { S.vault.edit = { id: ei.id, draft: JSON.parse(JSON.stringify(ei)), err: '', busy: false }; S.vault.delAsk = false; redraw(); } break; }
    case 'vcancel': S.vault.edit = null; redraw(); break;
    case 'vgen': { var gp = $('#ve_pw'); if (gp) gp.value = window.AOSVault.generate(20); break; }
    case 'vdel': S.vault.delAsk = true; redraw(); break;
    case 'vdelno': S.vault.delAsk = false; redraw(); break;
    case 'vdelyes': { var di = vSel(); if (!di) break; window.AOSVault.remove(di.id).then(function () { S.vault.items = S.vault.items.filter(function (x) { return x.id !== di.id; }); S.vault.sel = null; S.vault.delAsk = false; toast('Moved to the trash in your Vault.'); redraw(); }).catch(function (x) { toast(x.message); }); break; }

    case 'dopen': if (LAUNCHES.indexOf(d.s) < 0) toast('This app has no direct file hand-off. Use its Open dialog and choose ' + d.p + '.'); launch(d.s, LAUNCHES.indexOf(d.s) < 0 ? null : d.p); break;
    case 'dedit': dedOpen(d.p); break;
    case 'dsave': dedSave(); break;
    case 'dsettings': go('settings'); break;
    case 'app': launch(d.s); break;
    case 'chatx': closeChat(); break;
    case 'chatset': S.chatOpen = true; S.chatSet = !S.chatSet; $('#chat').hidden = false; $('#fab').hidden = true; drawChat(); break;
    case 'chatdone': S.chatSet = false; drawChat(); break;
    case 'ctx': S.ctx[d.k] = !S.ctx[d.k]; drawChat(); break;
  }
});
document.addEventListener('input', function (ev) {
  var t = ev.target, k = t.getAttribute && t.getAttribute('data-in'); if (!k) return;
  if (k === 'pq') runSearch(t.value);
  else if (k === 'vq') { S.vault.q = t.value; var vl = $('#vlist'); if (vl) vl.innerHTML = vListHtml(); }
  else if (k === 'aq') { S.aq = t.value; var g = $('#appgrid'); if (g) { var dd = document.createElement('div'); dd.innerHTML = appsV(); g.innerHTML = dd.querySelector('#appgrid').innerHTML; } }
  else if (k === 'rq') { S.rq = t.value; var dd2 = document.createElement('div'); dd2.innerHTML = insightsV(); var n = dd2.querySelector('#rows'); if (n && $('#rows')) $('#rows').innerHTML = n.innerHTML; }
  else if (k === 'pal') palDraw(t.value);
  else if (k === 'dtxt') { if (S.dedit) S.dedit.text = t.value; var ds = $('#dstat'); if (ds) { ds.textContent = 'Unsaved changes'; ds.style.color = 'var(--warn)'; } }
  else if (k === 'chatIn') { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }
});
document.addEventListener('keydown', function (ev) {
  var t = ev.target;
  if ((ev.key === 'k' && (ev.ctrlKey || ev.metaKey)) || (ev.key === '/' && !/INPUT|TEXTAREA/.test(t.tagName))) { ev.preventDefault(); palette(); return; }
  if (t.id === 'pi' && ev.key === 'Enter') { ev.preventDefault(); var ls = palList(t.value); if (ls[0]) { modal(); ls[0].run(); } return; }
  if (t.id === 'ci' && ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); var v = t.value; t.value = ''; send(v); }
  if (S.lb) { if (ev.key === 'Escape') { S.lb = null; drawLb(); } else if (ev.key === 'ArrowLeft') lbMove(-1); else if (ev.key === 'ArrowRight') lbMove(1); }
  else if (ev.key === 'Escape') { if (!$('#modal').hidden) modal(); else if (S.chatOpen) closeChat(); }
});
document.addEventListener('submit', function (ev) {
  var id = ev.target.id;
  if (id === 'vf') { ev.preventDefault(); vSubmit(); }
  else if (id === 'vef') { ev.preventDefault(); vEditSave(); }
  else if (id === 'cf') { ev.preventDefault(); var i = $('#ci'), v = i.value; i.value = ''; i.style.height = 'auto'; send(v); }
  else if (id === 'hf') { ev.preventDefault(); var q = $('#hq').value; $('#hq').value = ''; openChat(q.trim() ? q : undefined); }
  else if (id === 'pwf') { ev.preventDefault(); var e = $('#lerr'); e.textContent = ''; fetch('/auth/password', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: $('#pw').value }) }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Could not sign in'); }); }).then(function () { boot(); }).catch(function (x) { e.textContent = x.message; }); }
});
document.addEventListener('change', function (ev) { if (ev.target.id === 'x_pr') { var pr = MBX_PRESETS[ev.target.value]; if (pr) { $('#x_ih').value = pr[0]; $('#x_sh').value = pr[1]; } return; } if (ev.target.id === 'fileIn') { uploadFiles(ev.target.files); ev.target.value = ''; } });
$('#fab').innerHTML = ic('chat', ' style="width:26px;height:26px"');
$('#fab').addEventListener('click', function () { openChat(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(function () {});
function guestHomeV() {
  var u = S.user, p = u.perm || {}, areas = [['photos', 'Photos', 'photos'], ['drive', 'Drive', 'cloud'], ['vault', 'Vault', 'lock'], ['pulse', 'Pulse', 'pulse'], ['cards', 'Cards', 'cards'], ['insights', 'Insights', 'insights'], ['vpn', 'VPN', 'vpn']].filter(function (a) { return can(a[0]); });
  var h = '<div class="wrap"><div class="pagehead"><div><h1>Welcome, ' + esc((u.name || '').split(' ')[0] || 'there') + '</h1><p class="note" style="margin:4px 0 0">' + (u.role === 'guest' ? 'You are a guest here.' : 'You are a team member.') + (p.expires ? ' Your access ends on ' + fmt(new Date(p.expires), { day: '2-digit' }) + '.' : '') + '</p></div></div>';
  var tiles = areas.map(function (a) { return '<button class="svc" data-act="nav" data-v="' + a[0] + '"><span class="ic">' + ic(a[2]) + '</span><span class="tx"><b>' + a[1] + '</b></span></button>'; }).join('') + S.apps.filter(function (a) { return a.hasSource; }).map(function (a) { return '<button class="svc" data-act="app" data-s="' + esc(a.slug) + '"><span class="ic"><img src="/_icons/' + esc(a.slug) + '.png" alt="" style="width:26px;height:26px;border-radius:7px"></span><span class="tx"><b>' + esc(a.name) + '</b></span></button>'; }).join('');
  return h + (tiles ? '<div class="svcs" style="margin-top:20px">' + tiles + '</div>' : '<div class="empty"><h2>Nothing shared yet</h2><p>Ask Anand to give you access to something.</p></div>') + '</div>';
}
window.AOSViews = window.AOSViews || {}; window.AOSOnGo = window.AOSOnGo || {};
window.AOS = { link: function (k) { return ((S.settings || {}).links || {})[k] || ''; }, can: can, isOwner: isOwnerU, vaultLock: function () { vLock(false); if (S.view === 'vault') redraw(); }, vaultReport: function () { var V = S.vault; if (!V.items) return null; return V.items.filter(function (i) { return i.type === 'login'; }).map(function (i) { return { id: i.id, name: i.name, user: i.user, url: i.url, flags: vFlags(i), age: i.age, totp: !!i.totp }; }); }, insTabs: insTabs, S: S, $: $, esc: esc, api: api, toast: toast, LS: LS, fmt: fmt, bytes: bytes, modal: modal, OPENWITH: OPENWITH, LAUNCHES: LAUNCHES, TEXTEXT: TEXTEXT, dedOpen: dedOpen, launch: launch, connectBlock: connectBlock, ic: ic, go: go, redraw: redraw, photoCard: photoCard, curItems: curItems, openAlbum: openAlbum, loadPage: loadPage, loadAlbums: loadAlbums, photosGrid: photosGrid, drawLb: drawLb, render: render };
boot();
})();
