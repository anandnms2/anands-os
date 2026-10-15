/* More of Immich in Photos: People, Places, Archive, Trash, Duplicates, Shared links, Memories, multi-select actions (favourite, archive, albums,
 * share link, tags, download, delete), album tools, filtered search and a fuller photo details panel. Works on top of the Photos screen in os.js. */
(function () {
'use strict';
var A = window.AOS; if (!A) return;
var S = A.S, $ = A.$, esc = A.esc, api = A.api, toast = A.toast, fmt = A.fmt, bytes = A.bytes;
var TABS = [['people', 'People'], ['places', 'Places'], ['archive', 'Archive'], ['trash', 'Trash'], ['links', 'Shared'], ['dups', 'Duplicates']];
var X = '/api/photos/x/';
var P = window.AOSPX = { tabs: TABS, sel: [], selMode: false, cur: null, data: {}, info: {}, filters: {} };
var fresh = function () { return { items: [], next: 1, loading: false, error: null, loaded: false }; };
var u = function (p) { return X + p; };
var post = function (p, b, m) { return api(u(p), { method: m || 'POST', json: b || {} }); };
var fail = function (what) { return function (e) { toast(what + ': ' + e.message); }; };
var owned = function (t) { return TABS.some(function (x) { return x[0] === t; }); };
P.owns = function (t) { return owned(t); };
P.curSet = function () { return P.cur && P.cur.set && (owned(S.tab) || S.tab === 'timeline' || S.tab === 'favs') && !S.album && !S.pq ? P.cur.set : null; };
P.items = function () { return P.cur && P.cur.set ? P.cur.set.items : []; };

/* ---------- loading ---------- */
function loadSet(set, url) {
  if (set.loading || (set.loaded && !set.next)) return Promise.resolve(); set.loading = true; set.error = null; redraw();
  return api(u(url) + (url.indexOf('?') > -1 ? '&' : '?') + 'page=' + (set.next || 1)).then(function (r) { set.items = set.items.concat(r.items || []); set.next = r.next; set.loaded = true; }).catch(function (e) { set.error = e.message; set.loaded = true; set.next = null; }).then(function () { set.loading = false; redraw(); });
}
function redraw() { if (S.view === 'photos' && typeof A.photosGrid === 'function') A.photosGrid(); }
function openSet(kind, title, url, extra) { P.cur = { kind: kind, title: title, url: url, set: fresh(), extra: extra || {} }; loadSet(P.cur.set, url); redraw(); }
P.onTab = function (t) { P.cur = null; clearSel(); if (!owned(t)) return; if (t === 'people') load('people', 'people'); if (t === 'places') load('places', 'places'); if (t === 'links') load('links', 'links'); if (t === 'dups') load('dups', 'duplicates'); if (t === 'archive') openSet('archive', 'Archive', 'archive'); if (t === 'trash') openSet('trash', 'Trash', 'trash'); };
function load(key, path) { P.data[key] = { loading: true, items: null }; redraw(); return api(u(path)).then(function (r) { P.data[key] = { items: r.people || r }; }).catch(function (e) { P.data[key] = { items: [], error: e.message }; }).then(redraw); }
P.more = function (set) { if (P.cur && P.cur.set === set) { loadSet(set, P.cur.url); return true; } return false; };

/* ---------- selection ---------- */
function clearSel() { P.sel = []; P.selMode = false; bar(); if (S.view === 'photos') { var b = document.querySelector('[data-px="selmode"]'); if (b) b.setAttribute('aria-pressed', 'false'); redraw(); } }
P.toggle = function (id) { var i = P.sel.indexOf(id); if (i < 0) P.sel.push(id); else P.sel.splice(i, 1); if (!P.sel.length && !P.selMode) bar(); else bar(); document.querySelectorAll('.ph[data-pid="' + id + '"]').forEach(function (e) { e.classList.toggle('sel', P.sel.indexOf(id) > -1); }); };
P.isSel = function (id) { return P.sel.indexOf(id) > -1; };
function bar() {
  var el = document.getElementById('pxbar'), n = P.sel.length; if (!n && !P.selMode) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'pxbar'; el.setAttribute('role', 'toolbar'); el.setAttribute('aria-label', 'Selected photos'); document.body.appendChild(el); }
  var inTrash = P.cur && P.cur.kind === 'trash' && S.tab === 'trash', inArch = P.cur && P.cur.kind === 'archive' && S.tab === 'archive', inAlbum = !!S.album;
  var b = function (a, t, c) { return '<button class="btn sm' + (c ? ' ' + c : '') + '" data-px="' + a + '"' + (n ? '' : ' disabled') + '>' + t + '</button>'; };
  el.innerHTML = '<b>' + (n ? n + ' selected' : 'Select photos') + '</b>' + (inTrash ? b('restore', 'Restore') + b('forever', 'Delete forever', 'danger') : b('fav', 'Favourite') + b(inArch ? 'unarchive' : 'archive', inArch ? 'Unarchive' : 'Archive') + b('toalbum', 'Add to album') + (inAlbum ? b('fromalbum', 'Remove from album') : '') + b('share', 'Share link') + b('tag', 'Tag') + b('dl', 'Download') + b('trash', 'Delete', 'danger')) + '<button class="btn sm" data-px="selall">Select all</button><button class="btn sm" data-px="selx">Done</button>';
}
function afterChange(msg) { if (msg) toast(msg); P.sel = []; P.selMode = false; bar(); refresh(); }
function refresh() {
  S.tl = fresh(); S.fav = fresh(); S.albums = null; if (S.album && S.album.id) { var a = S.album; A.openAlbum(a.id, a.name); } else { A.loadPage(S.tl, '/api/photos/timeline'); if (S.tab === 'favs') A.loadPage(S.fav, '/api/photos/favorites'); if (S.tab === 'albums') A.loadAlbums(); }
  if (P.cur && P.cur.set) { P.cur.set = fresh(); loadSet(P.cur.set, P.cur.url); } P.data = {}; if (owned(S.tab) && !P.cur) P.onTab(S.tab); if (S.view === 'photos') A.redraw();
}
function ids() { return P.sel.slice(); }
function allIds() { return A.curItems().map(function (p) { return p.id; }); }

/* ---------- small dialogs ---------- */
function ask(title, fields, ok, cb, note) {
  A.modal('<h2 style="font-size:22px;margin-bottom:12px">' + esc(title) + '</h2>' + (note ? '<p class="note" style="margin:0 0 12px">' + note + '</p>' : '') + fields.map(function (f, i) { return '<div class="field"><label for="pxf' + i + '">' + esc(f.label) + '</label>' + (f.options ? '<select class="input" id="pxf' + i + '">' + f.options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === f.value ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>' : f.area ? '<textarea class="input" id="pxf' + i + '" rows="4">' + esc(f.value || '') + '</textarea>' : '<input class="input" id="pxf' + i + '" type="' + (f.type || 'text') + '" value="' + esc(f.value || '') + '" placeholder="' + esc(f.ph || '') + '" autocomplete="off">') + '</div>'; }).join('') + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px"><button class="btn" data-px="mclose">Cancel</button><button class="btn primary" data-px="mok">' + esc(ok) + '</button></div>');
  P.ok = function () { var v = fields.map(function (f, i) { var e = $('#pxf' + i); return e ? (f.check ? e.checked : e.value) : ''; }); cb(v); }; var f0 = $('#pxf0'); if (f0 && f0.focus) f0.focus();
}
function confirm2(msg, ok, cb) { A.modal('<p style="margin:0 0 16px;font-size:16px">' + esc(msg) + '</p><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" data-px="mclose">Cancel</button><button class="btn danger" data-px="mok">' + esc(ok) + '</button></div>'); P.ok = function () { cb(); }; }
function albumPicker(list, cb) {
  var go = function () { A.modal('<h2 style="font-size:22px;margin-bottom:12px">Add to album</h2><div style="display:grid;gap:6px;max-height:44vh;overflow:auto;margin-bottom:12px">' + ((S.albums || []).map(function (a) { return '<button class="btn" style="justify-content:flex-start" data-px="pickalbum" data-id="' + a.id + '">' + esc(a.name) + ' <span class="note">(' + a.count + ')</span></button>'; }).join('') || '<p class="note">No albums yet. Make one below.</p>') + '</div><div class="field"><label for="pxna">New album</label><input class="input" id="pxna" placeholder="Album name" autocomplete="off"></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" data-px="mclose">Cancel</button><button class="btn primary" data-px="newalbumwith">Create and add</button></div>'); P.list = list; };
  if (S.albums) go(); else api('/api/photos/albums').then(function (a) { S.albums = a; go(); }).catch(function () { S.albums = []; go(); });
}

/* ---------- views for the extra tabs ---------- */
function backBar(title, extra) { return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap"><button class="btn sm" data-px="back">' + A.ic('back') + 'Back</button><h2 style="font-size:24px">' + esc(title) + '</h2><span style="flex:1"></span>' + (extra || '') + '</div>'; }
function grid(set, empty) {
  var h = ''; if (set.error) h += '<div class="banner"><i class="dot bad"></i><span>' + esc(set.error) + '</span></div>';
  if (!set.items.length) return h + '<div class="empty">' + (set.loading || !set.loaded ? 'Loading...' : esc(empty)) + '</div>';
  return h + '<div class="photos">' + set.items.map(A.photoCard).join('') + '</div>' + (set.next ? '<button class="btn more" data-px="more">' + (set.loading ? 'Loading...' : 'Load more') + '</button>' : '');
}
P.grid = function (el) {
  var t = S.tab, h = '', d;
  if (P.cur && P.cur.set) {
    var c = P.cur, ex = '';
    if (c.kind === 'trash') ex = '<button class="btn danger sm" data-px="empty">Empty trash</button>';
    if (c.kind === 'person') ex = '<button class="btn sm" data-px="rename" data-id="' + esc(c.extra.id) + '" data-name="' + esc(c.extra.name) + '">Rename</button>';
    h = backBar(c.title, ex) + (c.kind === 'trash' ? '<p class="note" style="margin:0 0 10px">Photos in the trash are removed for good after 30 days by Immich.</p>' : '') + grid(c.set, c.kind === 'trash' ? 'The trash is empty.' : c.kind === 'archive' ? 'Nothing archived. Archived photos stay out of your timeline.' : 'No photos here.');
  } else if (t === 'people') {
    d = P.data.people; if (!d || d.loading) h = '<p class="note">Loading people...</p>'; else if (d.error) h = '<div class="banner"><i class="dot bad"></i><span>' + esc(d.error) + '</span></div>';
    else h = d.items.length ? '<div class="pxpeople">' + d.items.map(function (p) { return '<button class="pxperson" data-px="person" data-id="' + p.id + '" data-name="' + esc(p.name) + '"><img loading="lazy" src="/api/immich/people/' + p.id + '/thumbnail" alt=""><span>' + (esc(p.name) || '<i class="note">Unnamed</i>') + '</span></button>'; }).join('') + '</div>' : '<div class="empty"><h2>No people yet</h2><p>Immich finds faces after it has processed your library.</p></div>';
  } else if (t === 'places') {
    d = P.data.places; if (!d || d.loading) h = '<p class="note">Loading places...</p>'; else if (d.error) h = '<div class="banner"><i class="dot bad"></i><span>' + esc(d.error) + '</span></div>';
    else h = d.items.length ? '<div class="albums">' + d.items.map(function (p) { return '<button class="album" data-px="place" data-city="' + esc(p.city) + '" data-country="' + esc(p.country) + '"><div class="mosaic" style="grid-template-columns:1fr;grid-template-rows:1fr"><img src="/api/photos/asset/' + p.thumb + '/thumb" alt=""></div><h3>' + esc(p.city) + '</h3><small>' + esc(p.country) + '</small></button>'; }).join('') + '</div>' : '<div class="empty"><h2>No places</h2><p>Photos with a location show up here by city.</p></div>';
  } else if (t === 'links') {
    d = P.data.links; if (!d || d.loading) h = '<p class="note">Loading shared links...</p>'; else if (d.error) h = '<div class="banner"><i class="dot bad"></i><span>' + esc(d.error) + '</span></div>';
    else h = d.items.length ? '<div style="display:grid;gap:10px">' + d.items.map(function (l) { return '<div class="card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:220px"><b>' + esc(l.album ? 'Album: ' + l.album.name : l.count + ' photo' + (l.count === 1 ? '' : 's')) + '</b>' + (l.desc ? ' <span class="note">' + esc(l.desc) + '</span>' : '') + '<div class="note" style="word-break:break-all">' + esc(l.url) + '</div><div class="note">' + (l.expires ? 'Expires ' + esc(fmt(new Date(l.expires), { day: 'numeric', month: 'short', year: 'numeric' })) : 'Never expires') + (l.password ? ', password protected' : '') + (l.download ? '' : ', downloads off') + '</div></div><button class="btn sm" data-px="copylink" data-url="' + esc(l.url) + '">Copy link</button><a class="btn sm" href="' + esc(l.url) + '" target="_blank" rel="noopener">Open</a><button class="btn sm danger" data-px="dellink" data-id="' + l.id + '">Remove</button></div>'; }).join('') + '</div>' : '<div class="empty"><h2>No shared links</h2><p>Select photos or open an album and choose Share link.</p></div>';
  } else if (t === 'dups') {
    d = P.data.dups; if (!d || d.loading) h = '<p class="note">Looking for duplicates...</p>'; else if (d.error) h = '<div class="banner"><i class="dot bad"></i><span>' + esc(d.error) + '</span></div>';
    else h = d.items.length ? '<p class="note" style="margin:0 0 10px">Immich found these look-alikes. Keep the one you like and the rest go to the trash.</p>' + d.items.map(function (g) { return '<div class="card" style="margin-bottom:12px"><div class="photos" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">' + g.items.map(function (a) { return '<div><div class="ph"><img src="/api/photos/asset/' + a.id + '/thumb" alt="' + esc(a.name) + '"></div><div class="note" style="margin:4px 0;word-break:break-all">' + esc(a.name) + (a.bytes ? ' · ' + bytes(a.bytes) : '') + (a.w ? ' · ' + a.w + '×' + a.h : '') + '</div><button class="btn sm" data-px="keep" data-g="' + g.id + '" data-id="' + a.id + '">Keep this one</button></div>'; }).join('') + '</div><div style="margin-top:10px"><button class="btn sm" data-px="notdup" data-g="' + g.id + '">Not duplicates</button></div></div>'; }).join('') : '<div class="empty"><h2>No duplicates</h2><p>Nothing to tidy up.</p></div>';
  }
  el.innerHTML = h;
};

/* extra bits above the usual Photos views: memories, album tools */
P.after = function (el) {
  if (!el) return;
  if (S.album && S.album.id && !S.pq) el.insertAdjacentHTML('afterbegin', '<div class="pxtools"><button class="btn sm" data-px="albrename">Rename</button><button class="btn sm" data-px="albshare">Share</button><button class="btn sm" data-px="alblink">Share link</button><button class="btn sm danger" data-px="albdel">Delete album</button></div>');
  else if (S.tab === 'albums' && !S.album && !S.pq) el.insertAdjacentHTML('afterbegin', '<div class="pxtools"><button class="btn sm primary" data-px="albnew">New album</button></div>');
  else if (S.tab === 'timeline' && !S.pq && !S.album) {
    var m = P.memories;
    if (m === undefined) { P.memories = null; api(u('memories')).then(function (r) { P.memories = r; redraw(); }, function () { P.memories = []; }); }
    else if (m && m.length) el.insertAdjacentHTML('afterbegin', '<div class="pxmem"><h3>On this day</h3><div class="pxmrow">' + m.slice(0, 12).map(function (z, i) { return '<button class="pxmcard" data-px="memory" data-i="' + i + '"><img loading="lazy" src="/api/photos/asset/' + z.items[0].id + '/thumb" alt=""><b>' + (z.year ? esc(String(new Date().getFullYear() - z.year)) + ' years ago' : 'Memory') + '</b><small>' + z.items.length + ' photos</small></button>'; }).join('') + '</div></div>');
  }
  if (S.pq && S.sr && S.sr.mode === 'filter') el.insertAdjacentHTML('afterbegin', '<p class="note" style="margin:0 0 8px">Filtered results. <button class="btn sm" data-px="filters">Change filters</button> <button class="btn sm" data-px="clearfilters">Clear</button></p>');
};

/* ---------- filtered search ---------- */
function filtersDialog() {
  var f = P.filters;
  var go = function (people) {
    ask('Search filters', [{ label: 'Words (people, places, things)', value: S.pq && S.pq !== 'Filtered' ? S.pq : '' }, { label: 'Type', value: f.type || '', options: [['', 'Photos and videos'], ['image', 'Photos only'], ['video', 'Videos only']] }, { label: 'From date', type: 'date', value: f.from || '' }, { label: 'To date', type: 'date', value: f.to || '' }, { label: 'City', value: f.city || '' }, { label: 'Country', value: f.country || '' }, { label: 'Camera make', value: f.make || '' }, { label: 'Person', value: f.person || '', options: [['', 'Anyone']].concat((people || []).map(function (p) { return [p.id, p.name || 'Unnamed']; })) }, { label: 'Favourites only', type: 'checkbox', check: true }], 'Search', function (v) {
      P.filters = { q: v[0], type: v[1], from: v[2], to: v[3], city: v[4], country: v[5], make: v[6], person: v[7], favorite: v[8] }; runFind();
    });
    var cb = $('#pxf8'); if (cb) { cb.style.width = 'auto'; cb.checked = !!f.favorite; }
  };
  if (P.data.people && P.data.people.items) go(P.data.people.items); else api(u('people')).then(function (r) { P.data.people = { items: r.people }; go(r.people); }, function () { go([]); });
}
function runFind() {
  var f = P.filters, any = Object.keys(f).some(function (k) { return f[k]; }); if (!any) return clearFilters();
  A.modal(); S.pq = f.q || 'Filtered'; S.tab = 'timeline'; S.album = null; P.cur = null; S.sr = { q: S.pq, items: [], mode: '', loading: true }; A.redraw();
  post('find', { q: f.q, type: f.type, from: f.from, to: f.to, city: f.city, country: f.country, make: f.make, model: f.model, favorite: f.favorite, people: f.person ? [f.person] : [] }).then(function (r) { S.sr = { q: S.pq, items: r.items, mode: f.q ? r.mode : 'filter', loading: false, next: null, loaded: true }; }).catch(function (e) { S.sr = { q: S.pq, items: [], mode: '', loading: false, error: e.message, loaded: true }; }).then(function () { A.redraw(); });
}
function clearFilters() { P.filters = {}; A.modal(); S.pq = ''; S.sr = { q: '', items: [], mode: '', loading: false }; A.redraw(); }

/* ---------- the photo viewer: extra buttons and a fuller details panel ---------- */
P.lbExtra = function (p, el) {
  var bar2 = el.querySelector('.bar'), info = el.querySelector('[data-act="lbinfo"]'); if (!bar2 || !info) return;
  var mk = function (a, t) { return '<button class="ib pxlb" data-px="' + a + '" data-id="' + p.id + '" title="' + t + '" aria-label="' + t + '" style="width:auto;padding:0 10px;font-size:13px">' + t + '</button>'; };
  info.insertAdjacentHTML('beforebegin', mk('lbalbum', 'Album') + mk('lbshare', 'Share') + mk('lbarchive', 'Archive') + mk('lbtrash', 'Delete'));
  var aside = el.querySelector('aside'); if (!aside) return;
  var c = P.info[p.id]; if (c && c.d) return fillInfo(aside, p, c.d);
  if (!c) { P.info[p.id] = { loading: true }; api(u('asset/' + p.id + '/info')).then(function (d) { P.info[p.id] = { d: d }; if (S.lb === p.id) { var a2 = document.querySelector('#lb aside'); if (a2) fillInfo(a2, p, d); } }, function () { P.info[p.id] = { d: null }; }); }
};
function fillInfo(aside, p, d) {
  var row = function (k, v) { return v ? '<dt>' + k + '</dt><dd>' + v + '</dd>' : ''; }, ex = d.exposure || {};
  aside.innerHTML = '<h3 style="font-size:20px;word-break:break-all">' + esc(d.name || p.name) + '</h3>' +
    '<div class="field" style="margin:10px 0"><label for="pxdesc">Description</label><textarea class="input" id="pxdesc" rows="3" placeholder="Add a description">' + esc(d.desc) + '</textarea><button class="btn sm" style="margin-top:6px" data-px="savedesc" data-id="' + p.id + '">Save description</button></div>' +
    (d.people && d.people.length ? '<div class="pxchips">' + d.people.map(function (z) { return '<button class="pxchip" data-px="person" data-id="' + z.id + '" data-name="' + esc(z.name) + '">' + esc(z.name || 'Unnamed') + '</button>'; }).join('') + '</div>' : '') +
    '<dl>' + row('Taken', d.takenAt ? esc(fmt(new Date(d.takenAt), { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })) : '') + row('Place', d.place ? esc(d.place) : '') + (d.lat != null ? row('Map', '<a href="https://www.openstreetmap.org/?mlat=' + d.lat + '&mlon=' + d.lon + '#map=14/' + d.lat + '/' + d.lon + '" target="_blank" rel="noopener">' + d.lat.toFixed(4) + ', ' + d.lon.toFixed(4) + '</a>') : '') +
    row('Camera', esc(d.camera || '')) + row('Lens', esc(d.lens || '')) + row('Exposure', [ex.f ? 'f/' + ex.f : '', ex.time ? ex.time + ' s' : '', ex.iso ? 'ISO ' + ex.iso : '', ex.mm ? ex.mm + ' mm' : ''].filter(Boolean).join(' · ')) + row('Size', d.w ? d.w + ' × ' + d.h : '') + row('File', d.bytes ? bytes(d.bytes) : '') + row('Length', d.duration && d.duration !== '0:00:00.00000' ? esc(String(d.duration).slice(0, 8)) : '') + row('Type', d.type) + row('Path', d.path ? '<span style="word-break:break-all">' + esc(d.path) + '</span>' : '') + '</dl>' +
    '<div class="pxchips">' + (d.tags || []).map(function (z) { return '<span class="pxchip">#' + esc(z.name) + ' <button class="x" data-px="untag" data-id="' + p.id + '" data-tag="' + z.id + '" aria-label="Remove tag">×</button></span>'; }).join('') + '<button class="pxchip" data-px="tag1" data-id="' + p.id + '">+ Tag</button></div>';
}

/* ---------- actions ---------- */
function shareDialog(body) {
  ask('Share link', [{ label: 'Expires after (days, empty for never)', type: 'number', ph: '7' }, { label: 'Password (optional)', type: 'password' }, { label: 'Allow downloads', type: 'checkbox', check: true }], 'Create link', function (v) {
    var b = Object.assign({}, body, { days: Number(v[0]) || 0, password: v[1], download: v[2] }); post('links', b).then(function (l) { A.modal(); P.data.links = null; copy(l.url); A.modal('<h2 style="font-size:22px;margin-bottom:8px">Link ready</h2><p class="note" style="word-break:break-all">' + esc(l.url) + '</p><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" data-px="copylink" data-url="' + esc(l.url) + '">Copy</button><button class="btn primary" data-px="mclose">Done</button></div>'); }, fail('Could not create the link'));
  }, 'Anyone with the link can see these photos without signing in.'); var cb = $('#pxf2'); if (cb) { cb.style.width = 'auto'; cb.checked = true; }
}
function copy(t) { try { navigator.clipboard.writeText(t).then(function () { toast('Link copied'); }, function () {}); } catch (e) {} }
function download(list) {
  toast('Preparing download...'); fetch(u('download'), { method: 'POST', credentials: 'same-origin', headers: { 'x-aos': '1', 'content-type': 'application/json' }, body: JSON.stringify({ ids: list }) }).then(function (r) { if (!r.ok) return r.json().then(function (j) { throw new Error((j.error && j.error.message) || j.error || r.status); }); return r.blob(); }).then(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = list.length === 1 ? 'photo.zip' : 'photos.zip'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }).catch(fail('Download failed'));
}
function tagDialog(list) { ask('Tag photos', [{ label: 'Tag name', ph: 'e.g. Safari' }], 'Add tag', function (v) { if (!v[0].trim()) return; A.modal(); post('tag', { ids: list, name: v[0] }).then(function () { list.forEach(function (i) { delete P.info[i]; }); toast('Tagged'); }, fail('Could not tag')); }); }
function addToAlbum(list, albumId) { post('albums/' + albumId + '/add', { ids: list }).then(function (r) { A.modal(); afterChange((r.added || 0) + ' added' + (r.dup ? ', ' + r.dup + ' already there' : '')); }, fail('Could not add')); }

document.addEventListener('click', function (ev) {
  var b = ev.target.closest && ev.target.closest('[data-px]'); if (!b) return; var a = b.getAttribute('data-px'), id = b.getAttribute('data-id'), l = ids();
  if (a !== 'copylink') ev.stopPropagation();
  switch (a) {
    case 'selmode': P.selMode = !P.selMode; b.setAttribute('aria-pressed', String(P.selMode)); if (!P.selMode) P.sel = []; bar(); redraw(); return;
    case 'selx': clearSel(); return;
    case 'selall': P.sel = allIds(); bar(); redraw(); return;
    case 'mclose': A.modal(); return;
    case 'mok': if (P.ok) P.ok(); return;
    case 'back': P.cur = null; redraw(); if (owned(S.tab) && S.tab !== 'archive' && S.tab !== 'trash') return; if (S.tab === 'archive' || S.tab === 'trash') { S.tab = 'timeline'; A.render(); } return;
    case 'more': if (P.cur) loadSet(P.cur.set, P.cur.url); return;
    case 'person': openSet('person', b.getAttribute('data-name') || 'Unnamed person', 'person/' + id + '/assets', { id: id, name: b.getAttribute('data-name') || '' }); if (S.lb) { S.lb = null; A.drawLb(); } if (S.tab !== 'people') { S.tab = 'people'; A.render(); P.cur = null; openSet('person', b.getAttribute('data-name') || 'Unnamed person', 'person/' + id + '/assets', { id: id, name: b.getAttribute('data-name') || '' }); } return;
    case 'rename': ask('Name this person', [{ label: 'Name', value: b.getAttribute('data-name') }], 'Save', function (v) { A.modal(); post('person/' + id, { name: v[0] }, 'PUT').then(function () { if (P.cur) { P.cur.title = v[0] || 'Unnamed person'; P.cur.extra.name = v[0]; } P.data.people = null; redraw(); toast('Saved'); }, fail('Could not rename')); }); return;
    case 'place': openSet('place', b.getAttribute('data-city'), 'place?city=' + encodeURIComponent(b.getAttribute('data-city')) + '&country=' + encodeURIComponent(b.getAttribute('data-country'))); return;
    case 'empty': confirm2('Empty the trash? These photos are deleted for good.', 'Empty trash', function () { A.modal(); post('trash-empty').then(function () { afterChange('Trash emptied'); }, fail('Could not empty the trash')); }); return;
    case 'copylink': copy(b.getAttribute('data-url')); return;
    case 'dellink': post('links/' + id, {}, 'DELETE').then(function () { P.data.links = null; P.onTab('links'); toast('Link removed'); }, fail('Could not remove the link')); return;
    case 'keep': { var g = (P.data.dups.items.filter(function (z) { return z.id === b.getAttribute('data-g'); })[0]) || { items: [] }; post('duplicates', { id: g.id, drop: g.items.filter(function (z) { return z.id !== id; }).map(function (z) { return z.id; }) }).then(function () { P.data.dups.items = P.data.dups.items.filter(function (z) { return z !== g; }); redraw(); toast('Kept one, the rest are in the trash'); }, fail('Could not tidy')); return; }
    case 'notdup': post('duplicates', { id: b.getAttribute('data-g'), drop: [] }).then(function () { P.data.dups.items = P.data.dups.items.filter(function (z) { return z.id !== b.getAttribute('data-g'); }); redraw(); }, fail('Failed')); return;
    case 'memory': { var m = P.memories[Number(b.getAttribute('data-i'))]; if (m) { P.cur = { kind: 'memory', title: m.year ? (new Date().getFullYear() - m.year) + ' years ago' : 'Memory', url: '', set: { items: m.items, next: null, loading: false, loaded: true, error: null }, extra: {} }; S.tab = 'timeline'; redraw(); } return; }
    case 'filters': filtersDialog(); return;
    case 'clearfilters': clearFilters(); return;
    /* selection actions */
    case 'fav': if (!l.length) return; api('/api/photos/favorite', { method: 'POST', json: { ids: l, value: true } }).then(function () { afterChange('Added to favourites'); }, fail('Failed')); return;
    case 'archive': case 'unarchive': if (!l.length) return; post('archive', { ids: l, value: a === 'archive' }).then(function () { afterChange(a === 'archive' ? 'Archived' : 'Moved back to your timeline'); }, fail('Failed')); return;
    case 'toalbum': if (l.length) albumPicker(l); return;
    case 'fromalbum': if (l.length && S.album) post('albums/' + S.album.id + '/remove', { ids: l }).then(function () { afterChange('Removed from album'); }, fail('Failed')); return;
    case 'share': if (l.length) shareDialog({ ids: l }); return;
    case 'tag': if (l.length) tagDialog(l); return;
    case 'dl': if (l.length) download(l); return;
    case 'trash': if (l.length) confirm2('Move ' + l.length + ' photo' + (l.length === 1 ? '' : 's') + ' to the trash?', 'Move to trash', function () { A.modal(); post('trash', { ids: l }).then(function () { afterChange('Moved to trash'); }, fail('Failed')); }); return;
    case 'restore': if (l.length) post('restore', { ids: l }).then(function () { afterChange('Restored'); }, fail('Failed')); return;
    case 'forever': if (l.length) confirm2('Delete ' + l.length + ' photo' + (l.length === 1 ? '' : 's') + ' for good? This cannot be undone.', 'Delete forever', function () { A.modal(); post('delete-forever', { ids: l }).then(function () { afterChange('Deleted'); }, fail('Failed')); }); return;
    /* albums */
    case 'pickalbum': addToAlbum(P.list, id); return;
    case 'newalbumwith': { var nm = ($('#pxna') || {}).value; if (!nm || !nm.trim()) return toast('Give the album a name.'); post('albums', { name: nm, ids: P.list }).then(function () { A.modal(); afterChange('Album created'); }, fail('Could not create the album')); return; }
    case 'albnew': ask('New album', [{ label: 'Name', ph: 'Safari 2026' }], 'Create', function (v) { if (!v[0].trim()) return; A.modal(); post('albums', { name: v[0], ids: [] }).then(function () { S.albums = null; A.loadAlbums().then(redraw); toast('Album created'); }, fail('Could not create the album')); }); return;
    case 'albrename': ask('Rename album', [{ label: 'Name', value: S.album.name }], 'Save', function (v) { if (!v[0].trim()) return; A.modal(); post('albums/' + S.album.id, { name: v[0] }, 'PATCH').then(function () { S.album.name = v[0]; S.albums = null; redraw(); toast('Renamed'); }, fail('Could not rename')); }); return;
    case 'albdel': confirm2('Delete the album "' + S.album.name + '"? The photos stay in your library.', 'Delete album', function () { A.modal(); post('albums/' + S.album.id, {}, 'DELETE').then(function () { S.album = null; S.tab = 'albums'; S.albums = null; A.render(); A.loadAlbums(); toast('Album deleted'); }, fail('Could not delete')); }); return;
    case 'alblink': shareDialog({ albumId: S.album.id }); return;
    case 'albshare': api(u('albums/' + S.album.id + '/info')).then(function (inf) { return api(u('users')).then(function (us) {
      var have = {}; (inf.users || []).forEach(function (z) { have[z.id] = z.role; });
      A.modal('<h2 style="font-size:22px;margin-bottom:6px">Share album with people</h2><p class="note" style="margin:0 0 10px">Other accounts on your Immich server. Tick who can see "' + esc(inf.name) + '".</p><div style="display:grid;gap:8px;max-height:44vh;overflow:auto">' + (us.length ? us.map(function (z) { return '<label style="display:flex;gap:10px;align-items:center"><input type="checkbox" class="pxuser" data-id="' + z.id + '"' + (have[z.id] ? ' checked' : '') + '> ' + esc(z.name || z.email) + ' <span class="note">' + esc(z.email || '') + '</span><select class="input pxrole" data-id="' + z.id + '" style="width:auto;margin-left:auto"><option value="editor"' + (have[z.id] !== 'viewer' ? ' selected' : '') + '>Can add photos</option><option value="viewer"' + (have[z.id] === 'viewer' ? ' selected' : '') + '>Can view</option></select></label>'; }).join('') : '<p class="note">There are no other accounts on this Immich server.</p>') + '</div><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px"><button class="btn" data-px="mclose">Cancel</button><button class="btn primary" data-px="saveusers">Save</button></div>');
    }); }).catch(fail('Could not load sharing')); return;
    case 'saveusers': { var users = []; document.querySelectorAll('.pxuser').forEach(function (c) { if (c.checked) users.push({ userId: c.getAttribute('data-id'), role: (document.querySelector('.pxrole[data-id="' + c.getAttribute('data-id') + '"]') || {}).value }); }); post('albums/' + S.album.id + '/users', { users: users }, 'PUT').then(function () { A.modal(); toast('Sharing saved'); }, fail('Could not save sharing')); return; }
    /* viewer */
    case 'lbalbum': albumPicker([id]); return;
    case 'lbshare': shareDialog({ ids: [id] }); return;
    case 'lbarchive': post('archive', { ids: [id], value: true }).then(function () { S.lb = null; A.drawLb(); afterChange('Archived'); }, fail('Failed')); return;
    case 'lbtrash': confirm2('Move this photo to the trash?', 'Move to trash', function () { A.modal(); post('trash', { ids: [id] }).then(function () { S.lb = null; A.drawLb(); afterChange('Moved to trash'); }, fail('Failed')); }); return;
    case 'savedesc': post('asset/' + id, { description: ($('#pxdesc') || {}).value || '' }, 'PATCH').then(function () { delete P.info[id]; toast('Saved'); }, fail('Could not save')); return;
    case 'tag1': tagDialog([id]); return;
    case 'untag': post('untag', { tagId: b.getAttribute('data-tag'), ids: [id] }).then(function () { delete P.info[id]; A.drawLb(); }, fail('Failed')); return;
  }
}, true);
document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && (P.sel.length || P.selMode) && S.view === 'photos' && !S.lb && $('#modal').hidden) clearSel(); });
})();
