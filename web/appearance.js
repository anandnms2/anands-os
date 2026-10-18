/* Appearance: light/dark, accent colour, wallpaper, text size, desktop widgets, and keyboard shortcuts. */
(function () {
'use strict';
var A = window.AOS; if (!A) return;
var S = A.S, $ = A.$, esc = A.esc, api = A.api, ic = A.ic, toast = A.toast, LS = A.LS;
var DEF = { mode: 'system', accent: 'default', oswall: false, fs: 15, keys: true, widgets: {}, t: 0 };
var L = Object.assign({}, DEF, LS.get('look', {}));
var ACC = [['default', 'Orange', '#f68712'], ['#3b82f6', 'Blue', '#3b82f6'], ['#14b8a6', 'Teal', '#14b8a6'], ['#22c55e', 'Green', '#22c55e'], ['#8b5cf6', 'Violet', '#8b5cf6'], ['#f43f5e', 'Rose', '#f43f5e'], ['#eab308', 'Gold', '#eab308']];
var WD = [['clock', 'Clock', 'Dar es Salaam and Kochi', 230, 128], ['servers', 'Servers', 'Health of your apps', 230, 130]];
var saveT = null;

/* ---------- colour ---------- */
function rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
function hex(c) { return '#' + c.map(function (v) { return ('0' + Math.round(Math.max(0, Math.min(255, v))).toString(16)).slice(-2); }).join(''); }
function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex(x.map(function (v, i) { return v * (1 - t) + y[i] * t; })); }
function lum(h) { var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function accentCss(h) {
  var d = { a: h, ink: lum(h) > 0.34 ? '#0b0b0c' : '#ffffff', t: mix(h, '#ffffff', 0.25), s: mix(h, '#0b0b0c', 0.88), l: mix(h, '#0b0b0c', 0.72) };
  var lt = mix(h, '#000000', 0.12), g = { a: lt, ink: lum(lt) > 0.34 ? '#0b0b0c' : '#ffffff', t: mix(h, '#000000', 0.38), s: mix(h, '#ffffff', 0.88), l: mix(h, '#ffffff', 0.6) };
  var v = function (c) { return '--accent:' + c.a + ';--accent-ink:' + c.ink + ';--accent-text:' + c.t + ';--accent-soft:' + c.s + ';--accent-line:' + c.l + ';'; };
  return ':root{' + v(d) + '}@media (prefers-color-scheme:light){:root:not([data-theme="dark"]){' + v(g) + '}}:root[data-theme="light"]{' + v(g) + '}:root[data-theme="dark"]{' + v(d) + '}';
}

/* ---------- apply ---------- */
function wallCss() {
  var D = window.AOSDesk; if (!D) return ''; var k = LS.get('deskwall', 'dusk'), img = k === 'custom' && D.wallImg ? D.wallImg() : null;
  if (img) return 'url(' + img + ') center/cover no-repeat'; var w = D.walls.filter(function (x) { return x[0] === k; })[0] || D.walls[0]; return w[2];
}
function apply() {
  var r = document.documentElement;
  if (L.mode === 'light' || L.mode === 'dark') r.setAttribute('data-theme', L.mode); else r.removeAttribute('data-theme');
  var st = document.getElementById('lookcss'); if (!st) { st = document.createElement('style'); st.id = 'lookcss'; document.head.appendChild(st); }
  st.textContent = (L.accent && L.accent !== 'default' ? accentCss(L.accent) : '') + 'body{font-size:' + (L.fs || 15) + 'px}';
  var tc = document.querySelector('meta[name="theme-color"]'); if (tc) { var dark = L.mode === 'dark' || (L.mode !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); tc.setAttribute('content', dark ? '#0b0b0c' : '#f6f5f2'); }
  r.classList.toggle('oswall', !!L.oswall && !!window.AOSDesk);
  if (L.oswall && window.AOSDesk) r.style.setProperty('--wall', wallCss()); else r.style.removeProperty('--wall');
  r.classList.toggle('wall-light', !!(window.AOSDesk && window.AOSDesk.light[LS.get('deskwall', 'dusk')]));
}
function save() {
  L.t = Date.now(); LS.set('look', L); apply(); clearTimeout(saveT);
  saveT = setTimeout(function () { if (!S.user) return; api('/api/prefs', { method: 'PUT', json: { mode: L.mode, accent: L.accent, oswall: L.oswall, fs: L.fs, keys: L.keys, widgets: L.widgets, wall: LS.get('deskwall', 'dusk') === 'custom' ? undefined : LS.get('deskwall', 'dusk') } }).catch(function () {}); }, 600);
}
apply();
function pull() {
  api('/api/prefs').then(function (s) {
    if (!s || !s.t || s.t <= (L.t || 0)) return; L = Object.assign({}, DEF, L, s); LS.set('look', L);
    if (s.wall && window.AOSDesk) window.AOSDesk.setWall(s.wall); apply(); if (S.view === 'appearance') A.redraw(); drawWidgets();
  }).catch(function () {});
}

/* ---------- widgets ---------- */
var desk, layer, WS = { ins: null, insAt: 0 };
function wdef(id) { return WD.filter(function (w) { return w[0] === id; })[0]; }
function wstate(id) { var s = L.widgets[id]; if (!s) { var i = WD.map(function (w) { return w[0]; }).indexOf(id); s = L.widgets[id] = { on: id === 'clock', x: -1, y: -1 }; s._i = i; } return s; }
function place(id, el) {
  var s = wstate(id), d = wdef(id), W = desk.clientWidth, H = desk.clientHeight - 60, x = s.x, y = s.y;
  if (x < 0 || y < 0) { var i = WD.map(function (w) { return w[0]; }).indexOf(id), col = Math.floor(i / 3); x = W - d[3] - 24 - col * (d[3] + 16); y = 20 + (i % 3) * 190; }
  x = Math.max(4, Math.min(W - d[3] - 4, x)); y = Math.max(4, Math.min(H - 80, y)); el.style.left = x + 'px'; el.style.top = y + 'px';
}
function tz(z, o) { try { return new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: z, hourCycle: 'h23' }, o)).format(new Date()); } catch (e) { return ''; } }
var DEFZ = [{ n: 'Dar es Salaam', z: 'Africa/Dar_es_Salaam' }, { n: 'Kochi', z: 'Asia/Kolkata' }];
function zname(z) { return String(z).split('/').pop().replace(/_/g, ' '); }
function validZone(z) { try { new Intl.DateTimeFormat('en-GB', { timeZone: z }); return /^[A-Za-z_]+(\/[A-Za-z_+\-0-9]+){0,2}$|^UTC$/.test(z); } catch (e) { return false; } }
function clockZones() { var c = wstate('clock'); var z = Array.isArray(c.zones) ? c.zones.filter(function (x) { return x && validZone(x.z); }) : []; return z.length ? z.slice(0, 6) : DEFZ; }
function allZones() { try { return Intl.supportedValuesOf('timeZone'); } catch (e) { return ['Africa/Dar_es_Salaam', 'Africa/Nairobi', 'Africa/Lusaka', 'Africa/Johannesburg', 'Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'America/New_York', 'Asia/Singapore', 'Australia/Sydney']; } }
function clockEditor(zs) {
  return '<div class="wd-zl">' + zs.map(function (c, i) { return '<div class="wd-row"><span>' + esc(c.n) + '</span><b>' + tz(c.z, { hour: '2-digit', minute: '2-digit' }) + '</b>' + (zs.length > 1 ? '<button type="button" class="wd-x" data-wd="zdel" data-i="' + i + '" aria-label="Remove ' + esc(c.n) + '">&#10005;</button>' : '') + '</div>'; }).join('') + '</div>' +
    (zs.length < 6 ? '<input class="wd-zi" list="wd-zones" placeholder="Add a time zone, e.g. London" aria-label="Add a time zone" data-wd="zin"><datalist id="wd-zones">' + allZones().map(function (z) { return '<option value="' + esc(z) + '">'; }).join('') + '</datalist><button type="button" class="wd-zb" data-wd="zadd">Add</button>' : '<div class="wd-sub">Up to 6 time zones</div>') +
    '<button type="button" class="wd-zb" data-wd="zdone">Done</button>';
}
function body(id) {
  if (id === 'clock') {
    var zs = clockZones(), a = zs[0];
    if (WS.edit) return clockEditor(zs);
    return '<div class="wd-time">' + tz(a.z, { hour: '2-digit', minute: '2-digit' }) + '</div><div class="wd-sub">' + esc(a.n) + ' · ' + tz(a.z, { weekday: 'short', day: 'numeric', month: 'short' }) + '</div>' + zs.slice(1).map(function (c) { return '<div class="wd-row"><span>' + esc(c.n) + '</span><b>' + tz(c.z, { hour: '2-digit', minute: '2-digit' }) + '</b></div>'; }).join('');
  }
  if (id === 'servers') {
    var d = S.ins && S.ins.data || WS.ins; if (!d) return '<p class="wd-none">Loading...</p>'; var R = d.resources, bad = R.filter(function (r) { return r.s === 'bad'; }), ok = R.filter(function (r) { return r.s === 'ok'; }).length;
    return '<div class="wd-time" style="color:' + (bad.length ? 'var(--bad)' : 'var(--ok)') + '">' + (bad.length ? bad.length + ' down' : 'All good') + '</div><div class="wd-sub">' + ok + ' healthy of ' + R.length + '</div>' + (bad.length ? '<div class="wd-sub">' + esc(bad.slice(0, 2).map(function (r) { return r.n; }).join(', ')) + '</div>' : '');
  }
  return '';
}
function drawWidgets(force) {
  if (!layer || window.innerWidth < 760) { if (layer) layer.innerHTML = ''; return; }
  var keepNote = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('wd-note'); if (keepNote && force !== true) return;
  layer.innerHTML = '';
  WD.forEach(function (d) {
    var s = wstate(d[0]); if (!s.on) return; var el = document.createElement('section'); el.className = 'wd'; el.setAttribute('data-w', d[0]); el.style.width = d[3] + 'px';
    el.innerHTML = '<header class="wd-h"><b>' + esc(d[1]) + '</b>' + (d[0] === 'clock' ? '<button type="button" data-wd="edit" aria-label="Edit time zones" title="Edit time zones">&#9998;</button>' : '') + '<button type="button" data-wd="off" aria-label="Hide ' + esc(d[1]) + '">&#10005;</button></header><div class="wd-b"' + (d[0] === 'servers' ? ' data-wd="go" role="link" tabindex="0" title="Open Insights" aria-label="Open Insights"' : '') + '>' + body(d[0]) + '</div>'; layer.appendChild(el); place(d[0], el);
  });
}
function initDesk() {
  desk = document.getElementById('desk'); if (!desk) return setTimeout(initDesk, 300);
  layer = document.createElement('div'); layer.id = 'dkwid'; var icons = document.getElementById('dkicons'); desk.insertBefore(layer, icons ? icons.nextSibling : null);
  new MutationObserver(function () { if (!desk.hidden) { drawWidgets(true); refreshData();  } }).observe(desk, { attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('resize', function () { drawWidgets(); });
  setInterval(function () { if (!desk.hidden) { var c = layer.querySelector('[data-w="clock"] .wd-b'); if (c && !WS.edit) c.innerHTML = body('clock'); } }, 15000);
  setInterval(function () { if (!desk.hidden) { refreshData(); drawWidgets(); } }, 60000);
}
function refreshData() {
  if (wstate('servers').on && !(S.ins && S.ins.data) && Date.now() - WS.insAt > 120000) { WS.insAt = Date.now(); api('/api/insights').then(function (d) { WS.ins = d; drawWidgets(); }).catch(function () {}); }
}
var drag = null;
document.addEventListener('pointerdown', function (e) {
  var h = e.target.closest && e.target.closest('.wd-h'); if (!h || e.target.closest('button')) return; var w = h.parentNode; var r = w.getBoundingClientRect(), dr = desk.getBoundingClientRect();
  drag = { w: w, id: w.getAttribute('data-w'), dx: e.clientX - r.left, dy: e.clientY - r.top, ox: dr.left, oy: dr.top }; try { h.setPointerCapture(e.pointerId); } catch (x) {} w.classList.add('drag'); e.preventDefault();
});
document.addEventListener('pointermove', function (e) {
  if (!drag) return; var d = wdef(drag.id), W = desk.clientWidth, H = desk.clientHeight - 60;
  var x = Math.max(4, Math.min(W - d[3] - 4, e.clientX - drag.ox - drag.dx)), y = Math.max(4, Math.min(H - 60, e.clientY - drag.oy - drag.dy)); drag.w.style.left = x + 'px'; drag.w.style.top = y + 'px'; drag.x = x; drag.y = y;
});
document.addEventListener('pointerup', function () { if (!drag) return; drag.w.classList.remove('drag'); if (drag.x != null) { var s = wstate(drag.id); s.x = Math.round(drag.x); s.y = Math.round(drag.y); save(); } drag = null; });
var noteT = null;
document.addEventListener('input', function (e) { if (e.target.getAttribute && e.target.getAttribute('data-wd') === 'note') { var v = e.target.value; clearTimeout(noteT); noteT = setTimeout(function () { snSave(v); }, 600); } });
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-wd]'); if (!b || b.tagName === 'TEXTAREA') return; var a = b.getAttribute('data-wd');
  var wid = b.closest('.wd'), cz = wstate('clock');
  if (a === 'go') { if (window.AOSDesk && AOSDesk.x && AOSDesk.x.launchKey) AOSDesk.x.launchKey('os:insights'); return; }
  if (a === 'edit') { WS.edit = !WS.edit; drawWidgets(true); return; }
  if (a === 'zdone') { WS.edit = false; drawWidgets(true); return; }
  if (a === 'zdel') { var zs = clockZones().slice(); zs.splice(+b.getAttribute('data-i'), 1); cz.zones = zs; save(); drawWidgets(true); return; }
  if (a === 'zadd') { var inp = wid.querySelector('.wd-zi'), v = inp && inp.value.trim(); if (!v) return; var zz = allZones().filter(function (z) { return z.toLowerCase() === v.toLowerCase().replace(/ /g, '_') || zname(z).toLowerCase() === v.toLowerCase(); })[0]; if (!zz) return toast('Pick a time zone from the list'); var cur = clockZones().slice(); if (cur.some(function (c) { return c.z === zz; })) return toast('Already added'); cur.push({ n: zname(zz), z: zz }); cz.zones = cur; save(); drawWidgets(true); return; }
  if (a === 'off') { var id = b.closest('.wd').getAttribute('data-w'); wstate(id).on = false; save(); drawWidgets(true); if (S.view === 'appearance') A.redraw(); }
});

/* ---------- keyboard ---------- */
var GO = { h: ['home', 'Home'], p: ['photos', 'Photos'], d: ['drive', 'Drive'], v: ['vault', 'Vault'], i: ['insights', 'Cloud Insights'], l: ['pulse', 'Pulse'], c: ['cards', 'Cards'], a: ['apps', 'Suite'], s: ['settings', 'Settings'], e: ['security', 'Security center'], t: ['appearance', 'Appearance'] };
var pend = 0;
function typing(t) { return t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable); }
document.addEventListener('keydown', function (e) {
  if (!S.user || e.ctrlKey || e.metaKey) return; var t = e.target;
  if (e.altKey && e.code === 'KeyD' && window.AOSDesk) { e.preventDefault(); if (document.getElementById('desk').hidden) AOSDesk.show(); else AOSDesk.hide(true); return; }
  if (typing(t) || e.altKey || L.keys === false) return;
  if (e.key === '?') { e.preventDefault(); help(); return; }
  if (pend && Date.now() - pend < 1500) { pend = 0; var g = GO[e.key.toLowerCase()]; if (g) { e.preventDefault(); var d = document.getElementById('desk'); if (d && !d.hidden && window.AOSDesk) AOSDesk.hide(false); A.modal(); A.go(g[0]); } return; }
  if (e.key === 'g') { pend = Date.now(); return; }
  if (e.key === 'n') { if (window.AOSCapture) { e.preventDefault(); AOSCapture.open(); } return; }
  if (e.key === 'd' && L.mode !== undefined) { e.preventDefault(); toggleMode(); }
});
function help() {
  var k = function (a) { return a.map(function (x) { return '<kbd>' + x + '</kbd>'; }).join(' '); };
  var rows = [['Search everything and run commands', ['Ctrl', 'K']], ['Search (alternative)', ['/']], ['Quick capture', ['Alt', 'N']], ['Quick capture (single key)', ['n']], ['Open or close the Desktop', ['Alt', 'D']], ['Switch light and dark', ['d']], ['Show this list', ['?']], ['Close any window', ['Esc']]];
  var gr = Object.keys(GO).map(function (x) { return ['Go to ' + GO[x][1], ['g', x]]; });
  var m = $('#modal'); m.hidden = false; m.innerHTML = '<div class="modal" data-act="mx"><div class="card kbh" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts"><div class="caph"><h2>Keyboard shortcuts</h2><button class="btn sm" data-act="mx2" aria-label="Close">' + ic('x') + '</button></div><div class="kbg">' +
    rows.concat(gr).map(function (r) { return '<div class="kbr"><span>' + r[0] + '</span><span>' + k(r[1]) + '</span></div>'; }).join('') + '</div><p class="note" style="padding:0 18px 16px">Single-key shortcuts work when you are not typing in a box. Turn them off in Appearance.</p></div></div>';
}
function toggleMode() {
  var dark = L.mode === 'dark' || (L.mode !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); L.mode = dark ? 'light' : 'dark'; save(); if (S.view === 'appearance') A.redraw(); toast(dark ? 'Light mode' : 'Dark mode');
}

/* ---------- page ---------- */
function seg(name, cur, opts) { return '<div class="seg" role="group">' + opts.map(function (o) { return '<button type="button" data-ap="' + name + '" data-v="' + o[0] + '" aria-pressed="' + (String(cur) === String(o[0])) + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
function view() {
  var D = window.AOSDesk, cur = LS.get('deskwall', 'dusk'), custom = D && D.wallImg && D.wallImg();
  var h = '<div class="wrap"><div class="pagehead"><div><h1>Appearance</h1><p class="note" style="margin:4px 0 0">Make it yours. Changes apply straight away and follow you to your other devices.</p></div></div>';
  h += '<div class="card apc"><h2>Theme</h2>' + seg('mode', L.mode, [['system', 'Match device'], ['light', 'Light'], ['dark', 'Dark']]) + '</div>';
  h += '<div class="card apc"><h2>Accent colour</h2><div class="apsw">' + ACC.map(function (c) { return '<button type="button" class="apdot' + (L.accent === c[0] ? ' on' : '') + '" data-ap="accent" data-v="' + c[0] + '" style="background:' + c[2] + '" title="' + c[1] + '" aria-label="' + c[1] + '" aria-pressed="' + (L.accent === c[0]) + '"></button>'; }).join('') +
    '<label class="apdot custom' + (L.accent !== 'default' && !ACC.some(function (c) { return c[0] === L.accent; }) ? ' on' : '') + '" title="Pick any colour"><input type="color" id="apcol" value="' + (/^#/.test(L.accent) ? L.accent : '#f68712') + '" aria-label="Custom colour"><span>+</span></label></div></div>';
  if (D) h += '<div class="card apc"><h2>Wallpaper</h2><div class="apwall">' + D.walls.map(function (w) { return '<button type="button" class="apw' + (cur === w[0] ? ' on' : '') + '" data-ap="wall" data-v="' + w[0] + '" style="background:' + esc(w[2]) + '" title="' + esc(w[1]) + '" aria-label="' + esc(w[1]) + '" aria-pressed="' + (cur === w[0]) + '"></button>'; }).join('') +
    (custom ? '<button type="button" class="apw' + (cur === 'custom' ? ' on' : '') + '" data-ap="wall" data-v="custom" style="background:url(' + custom + ') center/cover" title="Your picture" aria-label="Your picture"></button>' : '') + '</div><div class="aprow"><label class="btn sm">Upload a picture<input type="file" id="apwf" accept="image/*" hidden></label><label class="apchk"><input type="checkbox" data-ap="oswall"' + (L.oswall ? ' checked' : '') + '> Also show it behind the OS pages</label></div><p class="note">The Desktop uses this wallpaper too. An uploaded picture stays on this device.</p></div>';
  h += '<div class="card apc"><h2>Text size</h2>' + seg('fs', L.fs, [[14, 'Small'], [15, 'Normal'], [16, 'Large'], [18, 'Larger']]) + '</div>';
  h += '<div class="card apc"><h2>Desktop widgets</h2><p class="note" style="margin:0 0 10px">They sit on your Desktop. Drag one by its title to move it. Hidden on phones.</p>' + WD.map(function (w) { var s = wstate(w[0]); return '<label class="aprow wrow"><input type="checkbox" data-ap="widget" data-v="' + w[0] + '"' + (s.on ? ' checked' : '') + '><span><b>' + w[1] + '</b><span class="note"> ' + w[2] + '</span></span></label>'; }).join('') + '<div class="aprow"><button class="btn sm" data-ap="resetw">Reset positions</button>' + (window.AOSDesk ? '<button class="btn sm" data-ap="opendesk">Open Desktop</button>' : '') + '</div></div>';
  h += '<div class="card apc"><h2>Keyboard</h2><label class="apchk"><input type="checkbox" data-ap="keys"' + (L.keys !== false ? ' checked' : '') + '> Single-key shortcuts (g then a letter to go places, n for a new capture, d for dark mode)</label><div class="aprow"><button class="btn sm" data-ap="help">Show all shortcuts</button></div></div>';
  return h + (window.AOSShare ? AOSShare.card() : '') + '</div>';
}
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-ap]'); if (!b) return; var a = b.getAttribute('data-ap'), v = b.getAttribute('data-v');
  if (a === 'mode') { L.mode = v; save(); A.redraw(); }
  else if (a === 'accent') { L.accent = v; save(); A.redraw(); }
  else if (a === 'wall') { if (window.AOSDesk) AOSDesk.setWall(v); save(); A.redraw(); }
  else if (a === 'fs') { L.fs = Number(v); save(); A.redraw(); }
  else if (a === 'resetw') { WD.forEach(function (w) { var s = wstate(w[0]); s.x = -1; s.y = -1; }); save(); drawWidgets(true); toast('Widgets moved back'); }
  else if (a === 'opendesk') { if (window.AOSDesk) AOSDesk.show(); }
  else if (a === 'help') help();
});
document.addEventListener('change', function (e) {
  var t = e.target; if (t.id === 'apcol') { L.accent = t.value; save(); return void A.redraw(); }
  if (t.id === 'apwf') return void wallFile(t.files && t.files[0]);
  var a = t.getAttribute && t.getAttribute('data-ap'); if (!a) return;
  if (a === 'oswall') { L.oswall = t.checked; save(); }
  else if (a === 'keys') { L.keys = t.checked; save(); }
  else if (a === 'widget') { wstate(t.getAttribute('data-v')).on = t.checked; save(); drawWidgets(true); refreshData(); }
});
function wallFile(file) {
  if (!file || !/^image\//.test(file.type)) return toast('Choose a picture file.');
  var u = URL.createObjectURL(file), im = new Image();
  im.onload = function () {
    var r = Math.min(1, 1920 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * r); cv.height = Math.round(im.height * r); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u);
    try { localStorage.setItem('aos.deskwallimg', cv.toDataURL('image/jpeg', 0.85)); AOSDesk.setWall('custom'); save(); A.redraw(); toast('Wallpaper set'); } catch (x) { toast('That picture is too large to keep. Try a smaller one.'); }
  };
  im.onerror = function () { URL.revokeObjectURL(u); toast('That file could not be read as a picture.'); }; im.src = u;
}
window.AOSViews.appearance = view;
window.AOSAppearance = { toggleMode: toggleMode, help: help, state: function () { return L; }, apply: apply };
if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply);
(function wait(n) { if (S.user) { pull(); apply(); return; } if (n < 80) setTimeout(function () { wait(n + 1); }, 200); })(0);
initDesk();
})();

document.addEventListener('keydown', function (e) {
  var t = e.target; if (!t || !t.getAttribute) return; var a = t.getAttribute('data-wd');
  if (a === 'zin' && e.key === 'Enter') { e.preventDefault(); var b = t.closest('.wd').querySelector('[data-wd="zadd"]'); if (b) b.click(); }
  if (a === 'go' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); t.click(); }
});
