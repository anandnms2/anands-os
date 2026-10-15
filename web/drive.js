/* Drive: a Google-Drive-style file manager for your Cloudreve files (WebDAV).
 * Sidebar, breadcrumbs, list and grid views, multi-select, right-click menus, drag and drop (in and out of folders, and uploads from your computer),
 * move / copy dialogs, preview, rename, delete, starred and recent. Talks to the same /_local/fs endpoints the apps use. */
(function () {
'use strict';
var A = window.AOS; if (!A) return;
var S = A.S, $ = A.$, esc = A.esc, api = A.api, toast = A.toast, LS = A.LS;
var ROOT = '/Drive';
var D = S.drive = { path: '/', items: [], loading: false, error: null, code: null, status: null, sec: 'my', sel: [], anchor: null, q: '', view: LS.get('dview', 'list'), sort: LS.get('dsort', { k: 'name', d: 1 }), det: LS.get('ddet', false), clip: null, flat: [], drag: null, loaded: false };

/* ---------- paths and names ---------- */
var rel = function (p) { return String(p).replace(/^\/Drive/, '') || '/'; };
var abs = function (r) { return ROOT + (r === '/' ? '' : r); };
var up = function (r) { return r.replace(/\/[^/]*$/, '') || '/'; };
var baseOf = function (p) { return String(p).split('/').pop(); };
var join = function (dir, name) { return (dir === '/' ? '' : dir) + '/' + name; };
var ext = function (n) { var m = /\.([a-z0-9]+)$/i.exec(n); return m ? m[1].toLowerCase() : ''; };
var enc = encodeURIComponent;
var getUrl = function (p) { return '/_local/fs/get?path=' + enc(p); };
var fsApi = function (op, json) { return api('/_local/fs/' + op, { method: 'POST', json: json }); };
function uniq(name, taken) {
  if (!taken[name.toLowerCase()]) return name;
  var m = /^(.*?)(\.[^.]*)?$/.exec(name), b = m[1] || name, e = m[2] || '';
  for (var i = 1; i < 500; i++) { var n = b + ' (' + i + ')' + e; if (!taken[n.toLowerCase()]) return n; }
  return b + ' ' + Date.now() + e;
}
function takenIn(items) { var t = {}; (items || D.items).forEach(function (f) { t[f.name.toLowerCase()] = 1; }); return t; }

/* ---------- file kinds, colours and icons ---------- */
var KIND = [
  ['image', /^(jpe?g|png|gif|webp|bmp|avif|heic|svg)$/, '#c04bd1', 'Image'], ['video', /^(mp4|mov|webm|mkv|avi|m4v)$/, '#ea5a47', 'Video'], ['audio', /^(mp3|wav|ogg|m4a|flac|aac)$/, '#f08c2c', 'Audio'],
  ['pdf', /^pdf$/, '#e5453a', 'PDF'], ['doc', /^(docx?|odt|rtf)$/, '#4a86f7', 'Document'], ['sheet', /^(xlsx?|ods|csv|tsv)$/, '#1fa463', 'Spreadsheet'], ['slides', /^(pptx?|odp)$/, '#f4a21d', 'Presentation'],
  ['archive', /^(zip|rar|7z|tar|gz|tgz)$/, '#8d6e63', 'Archive'], ['code', /^(js|css|py|sh|json|html?|xml|ya?ml|ts|sql|php|java|c|cpp|go|rs)$/, '#5f6b7a', 'Code'], ['text', /^(txt|md|log|ini|conf)$/, '#7a8594', 'Text']
];
function kindOf(f) { if (f.is_dir) return { k: 'folder', c: '#8b94a3', l: 'Folder' }; var e = ext(f.name); for (var i = 0; i < KIND.length; i++) if (KIND[i][1].test(e)) return { k: KIND[i][0], c: KIND[i][2], l: KIND[i][3] }; return { k: 'file', c: '#7a8594', l: (e ? e.toUpperCase() + ' file' : 'File') }; }
var GLYPH = {
  image: '<path d="M7 17l3.5-4.5 2.5 3 2-2.5 2.5 4z" fill="#fff"/><circle cx="9" cy="10.5" r="1.4" fill="#fff"/>', video: '<path d="M10 9.5v6l5-3z" fill="#fff"/>', audio: '<path d="M11 17a1.7 1.7 0 1 1-1.2-1.6V9l5-1.2v6.2a1.7 1.7 0 1 1-1.2-1.6V9.7l-2.6.6" fill="#fff"/>',
  pdf: '<path d="M8 15.5c2.5-1 3.5-3.2 3.2-5.5-.1-.6-.9-.5-.9.2.2 2.2 2.3 4.2 5 4.6M8 15.5c-.7.5-.9 1.2-.4 1.4.6.3 1.7-.8 2.3-2.1" stroke="#fff" stroke-width="1.1" fill="none"/>',
  doc: '<path d="M8 11h8M8 14h8M8 17h5" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>', sheet: '<path d="M8 10.5h8v7H8zM8 14h8M12 10.5v7" stroke="#fff" stroke-width="1.2" fill="none"/>', slides: '<rect x="8" y="10.5" width="8" height="6" rx="1" stroke="#fff" stroke-width="1.3" fill="none"/>',
  archive: '<path d="M12 9v8M10.5 10.5h3M10.5 13h3M10.5 15.5h3" stroke="#fff" stroke-width="1.3"/>', code: '<path d="M10.5 11l-2.5 2.5 2.5 2.5M13.5 11l2.5 2.5-2.5 2.5" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>', text: '<path d="M8 11.5h8M8 14.5h8M8 17.5h4.5" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>', file: ''
};
function fico(f, size) {
  var k = kindOf(f), s = size || 22;
  if (k.k === 'folder') return '<svg class="gd-fi" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2.2h6.5A2.5 2.5 0 0 1 21 8.7v9.3a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18z" fill="' + k.c + '"/></svg>';
  return '<svg class="gd-fi" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="' + k.c + '"/><path d="M14.5 2L20 7.5h-4.2a1.3 1.3 0 0 1-1.3-1.3z" fill="#fff" fill-opacity=".38"/>' + (GLYPH[k.k] || '') + '</svg>';
}
var I = {
  plus: 'M12 5v14M5 12h14', drive: 'M7 3h10l5 9-5 9H7l-5-9z', clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 7v5l3 2', star: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z', list: 'M4 6h16M4 12h16M4 18h16', info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01', dl: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  ul: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12', trash: 'M3 6h18 M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  move: 'M5 9l-3 3 3 3 M9 5l3-3 3 3 M15 19l-3 3-3-3 M19 9l3 3-3 3 M2 12h20 M12 2v20', copy: 'M9 9h11v11H9z M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1', open: 'M14 3h7v7 M10 14L21 3 M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
  x: 'M18 6L6 18M6 6l12 12', more: 'M12 5.5h.01M12 12h.01M12 18.5h.01', newf: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z M12 11v6 M9 14h6', newt: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M14 3v6h6 M12 12v6 M9 15h6',
  search_: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M21 21l-4.3-4.3', chev: 'M9 18l6-6-6-6', cdown: 'M6 9l6 6 6-6', paste: 'M9 3h6v3H9z M7 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2', refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8 M21 3v5h-5', sel: 'M3 3h18v18H3z M8 12l3 3 5-6',
  up: 'M12 19V5 M5 12l7-7 7 7', link: 'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1 M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1', check: 'M5 12l5 5 9-10', sort: 'M12 5v14 M6 13l6 6 6-6', cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'
};
function g(n, s, fill) { return '<svg class="gd-i" width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="' + (fill ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + I[n] + '"/></svg>'; }

/* ---------- stars and recent (kept in this browser) ---------- */
var stars = function () { return LS.get('dstar', []); };
var isStar = function (p) { return stars().indexOf(p) > -1; };
function setStar(paths, on) { var s = stars().filter(function (x) { return paths.indexOf(x) < 0; }); if (on) s = s.concat(paths); LS.set('dstar', s); }
function noteRecent(p) { var r = LS.get('drecent', []).filter(function (x) { return x.p !== p; }); r.unshift({ p: p, t: Date.now() }); LS.set('drecent', r.slice(0, 40)); }

/* ---------- loading ---------- */
function load(p, quiet, keep) {
  if (p !== undefined) { D.path = p; D.q = ''; D.sec = 'my'; if (!keep) { D.sel = []; D.anchor = null; } }
  D.loading = !quiet; D.error = null; if (S.view === 'drive') paint();
  return api('/api/drive/status').then(function (st) {
    D.status = st;
    if (!st.connected) { D.items = []; D.flat = []; D.loading = false; D.error = st.configured ? 'Drive is configured but not reachable (' + (st.reason || 'no answer') + ').' : null; D.code = st.configured ? 'unreachable' : 'not_configured'; return; }
    D.code = null;
    if (D.sec === 'my') return fsApi('readdir', { path: abs(D.path) }).then(function (items) { D.items = items; D.loading = false; D.loaded = true; });
    var paths = D.sec === 'starred' ? stars() : LS.get('drecent', []).map(function (x) { return x.p; });
    return Promise.all(paths.slice(0, 60).map(function (p) { return fsApi('stat', { path: p }).then(function (o) { o.path = o.path || p; return o; }, function () { return null; }); })).then(function (l) { D.flat = l.filter(Boolean); D.loading = false; D.loaded = true; });
  }).catch(function (e) { D.items = []; D.flat = []; D.loading = false; D.error = e.message; D.code = e.code || 'error'; })
    .then(function () { D.sel = D.sel.filter(function (p) { return list().some(function (f) { return f.path === p; }); }); if (S.view === 'drive') paint(); });
}
function section(s) { D.sec = s; D.sel = []; D.anchor = null; D.q = ''; if (s === 'my') return load(D.path); return load(undefined); }
function list() {
  var src = D.sec === 'my' ? D.items : D.flat, q = D.q.trim().toLowerCase();
  var out = q ? src.filter(function (f) { return f.name.toLowerCase().indexOf(q) > -1; }) : src.slice();
  if (D.sec === 'recent') { var order = LS.get('drecent', []).map(function (x) { return x.p; }); return out.sort(function (a, b) { return order.indexOf(a.path) - order.indexOf(b.path); }); }
  var k = D.sort.k, d = D.sort.d;
  return out.sort(function (a, b) {
    if (D.sec === 'my' && a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
    var r = k === 'size' ? (a.size || 0) - (b.size || 0) : k === 'modified' ? (a.modified || 0) - (b.modified || 0) : a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    return (r || a.name.localeCompare(b.name)) * d;
  });
}
var byPath = function (p) { var l = D.sec === 'my' ? D.items : D.flat; for (var i = 0; i < l.length; i++) if (l[i].path === p) return l[i]; return null; };
var selItems = function () { return D.sel.map(byPath).filter(Boolean); };

/* ---------- drawing ---------- */
function when(f) { if (!f.modified) return ''; var d = new Date(f.modified * 1000), n = new Date(); return A.fmt(d, d.getFullYear() === n.getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' }); }
function whenLong(f) { return f.modified ? A.fmt(new Date(f.modified * 1000), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'; }
function rowHtml(f) {
  var k = kindOf(f), s = D.sel.indexOf(f.path) > -1, loc = D.sec !== 'my';
  return '<div class="gd-it gd-row' + (s ? ' sel' : '') + '" role="row" tabindex="-1" draggable="true" data-p="' + esc(f.path) + '"' + (f.is_dir ? ' data-dir="' + esc(rel(f.path)) + '"' : '') + ' aria-selected="' + s + '">' +
    '<span class="gd-c1">' + fico(f, 22) + '</span><span class="gd-name"><b>' + esc(f.name) + '</b>' + (isStar(f.path) ? '<span class="gd-star" title="Starred">' + g('star', 14, true) + '</span>' : '') + '</span>' +
    '<span class="gd-c3 gd-hide-s">' + (loc ? '<button class="gd-loc" data-d="loc" data-p="' + esc(rel(up(f.path))) + '">' + esc(rel(up(f.path)) === '/' ? 'My Drive' : baseOf(up(f.path))) + '</button>' : esc(k.l)) + '</span>' +
    '<span class="gd-c4 gd-hide-s">' + when(f) + '</span><span class="gd-c5 gd-hide-s">' + (f.is_dir ? '-' : A.bytes(f.size) || '0 B') + '</span>' +
    '<span class="gd-c6"><button class="gd-ib" data-d="more" aria-label="More actions for ' + esc(f.name) + '">' + g('more', 18) + '</button></span></div>';
}
function cardHtml(f) {
  var k = kindOf(f), s = D.sel.indexOf(f.path) > -1, thumb = k.k === 'image' && ext(f.name) !== 'svg' && (f.size || 0) < 8e6 && (f.size || 0) > 0;
  return '<div class="gd-it gd-card' + (f.is_dir ? ' gd-fold' : '') + (s ? ' sel' : '') + '" tabindex="-1" draggable="true" data-p="' + esc(f.path) + '"' + (f.is_dir ? ' data-dir="' + esc(rel(f.path)) + '"' : '') + ' aria-selected="' + s + '">' +
    (f.is_dir ? '' : '<div class="gd-thumb">' + (thumb ? '<img loading="lazy" alt="" draggable="false" src="' + getUrl(f.path) + '">' : fico(f, 56)) + '</div>') +
    '<div class="gd-cf">' + fico(f, 20) + '<b>' + esc(f.name) + '</b>' + (isStar(f.path) ? '<span class="gd-star">' + g('star', 13, true) + '</span>' : '') + '<button class="gd-ib" data-d="more" aria-label="More actions for ' + esc(f.name) + '">' + g('more', 18) + '</button></div></div>';
}
function bodyHtml() {
  if (D.loading && !D.loaded) return '<div class="gd-empty"><div class="gd-spin"></div><p>Loading your files...</p></div>';
  var l = list();
  if (!l.length) {
    var msg = D.q ? ['No matches', 'Nothing in this folder matches "' + esc(D.q) + '".'] : D.sec === 'starred' ? ['Nothing starred yet', 'Right-click a file and choose Add to starred to find it here fast.'] : D.sec === 'recent' ? ['No recent files', 'Files you open or upload show up here.'] : ['This folder is empty', 'Drop files here, or use New to upload a file or make a folder.'];
    return '<div class="gd-empty">' + fico({ is_dir: true, name: '' }, 72) + '<h3>' + msg[0] + '</h3><p>' + msg[1] + '</p></div>';
  }
  if (D.view === 'grid') {
    var fo = l.filter(function (f) { return f.is_dir; }), fi = l.filter(function (f) { return !f.is_dir; }), h = '';
    if (fo.length) h += '<div class="gd-sec">Folders</div><div class="gd-grid gd-grid-f">' + fo.map(cardHtml).join('') + '</div>';
    if (fi.length) h += '<div class="gd-sec">Files</div><div class="gd-grid">' + fi.map(cardHtml).join('') + '</div>';
    return h;
  }
  var arrow = function (k) { return D.sort.k === k ? '<span class="gd-arr">' + (D.sort.d > 0 ? '&#8593;' : '&#8595;') + '</span>' : ''; }, loc = D.sec !== 'my';
  return '<div class="gd-list" role="grid"><div class="gd-row gd-head" role="row"><span class="gd-c1"></span><button class="gd-name gd-h" data-d="sort" data-k="name">Name' + arrow('name') + '</button><span class="gd-c3 gd-hide-s">' + (loc ? 'Location' : 'Type') + '</span>' +
    '<button class="gd-c4 gd-h gd-hide-s" data-d="sort" data-k="modified">Last modified' + arrow('modified') + '</button><button class="gd-c5 gd-h gd-hide-s" data-d="sort" data-k="size">Size' + arrow('size') + '</button><span class="gd-c6"></span></div>' + l.map(rowHtml).join('') + '</div>';
}
function crumbsHtml() {
  if (D.sec !== 'my') return '<div class="gd-crumbs"><span class="gd-cur">' + (D.sec === 'starred' ? 'Starred' : 'Recent') + '</span></div>';
  var h = '<div class="gd-crumbs"><button class="gd-cr" data-d="go" data-p="/" data-dir="/">My Drive</button>', acc = '', parts = D.path.split('/').filter(Boolean);
  parts.forEach(function (x, i) { acc += '/' + x; h += g('chev', 16) + (i === parts.length - 1 ? '<span class="gd-cur">' + esc(x) + '</span>' : '<button class="gd-cr" data-d="go" data-p="' + esc(acc) + '" data-dir="' + esc(acc) + '">' + esc(x) + '</button>'); });
  return h + '</div>';
}
function barHtml() {
  var sel = selItems(), tgl = '<div class="gd-seg" role="group" aria-label="Layout"><button class="gd-ib' + (D.view === 'list' ? ' on' : '') + '" data-d="view" data-v="list" aria-label="List layout" title="List layout">' + g('list', 18) + '</button><button class="gd-ib' + (D.view === 'grid' ? ' on' : '') + '" data-d="view" data-v="grid" aria-label="Grid layout" title="Grid layout">' + g('grid', 18) + '</button></div>' +
    '<button class="gd-ib' + (D.det ? ' on' : '') + '" data-d="det" aria-label="View details" title="View details">' + g('info', 20) + '</button>';
  if (sel.length) {
    var files = sel.every(function (f) { return !f.is_dir; });
    return '<div class="gd-selbar"><button class="gd-ib" data-d="clear" aria-label="Clear selection" title="Clear selection">' + g('x', 18) + '</button><b>' + sel.length + ' selected</b><span class="gd-sp"></span>' +
      (files ? '<button class="gd-ib" data-d="a-dl" title="Download" aria-label="Download">' + g('dl', 19) + '</button>' : '') + '<button class="gd-ib" data-d="a-move" title="Move to" aria-label="Move to">' + g('move', 19) + '</button><button class="gd-ib" data-d="a-copyto" title="Make a copy in..." aria-label="Make a copy in">' + g('copy', 19) + '</button>' +
      '<button class="gd-ib" data-d="a-del" title="Delete" aria-label="Delete">' + g('trash', 19) + '</button><button class="gd-ib' + (D.det ? ' on' : '') + '" data-d="det" title="View details" aria-label="View details">' + g('info', 19) + '</button><button class="gd-ib" data-d="more" title="More actions" aria-label="More actions">' + g('more', 19) + '</button></div>';
  }
  return crumbsHtml() + '<span class="gd-sp"></span>' + tgl;
}
function detHtml() {
  var sel = selItems(), h = '<div class="gd-dh"><b>' + (sel.length === 1 ? esc(sel[0].name) : sel.length ? sel.length + ' items' : D.sec === 'my' ? esc(D.path === '/' ? 'My Drive' : baseOf(D.path)) : D.sec === 'starred' ? 'Starred' : 'Recent') + '</b><button class="gd-ib" data-d="det" aria-label="Close details">' + g('x', 18) + '</button></div>';
  if (sel.length === 1) {
    var f = sel[0], k = kindOf(f), ows = f.is_dir ? [] : openWith(f), canText = !f.is_dir && A.TEXTEXT.test(ext(f.name)) && f.size <= 1048576;
    h += '<div class="gd-dpic">' + (k.k === 'image' && ext(f.name) !== 'svg' && f.size < 8e6 ? '<img alt="" src="' + getUrl(f.path) + '">' : fico(f, 84)) + '</div><div class="gd-dl">' +
      dl('Type', k.l) + (f.is_dir ? '' : dl('Size', A.bytes(f.size) || '0 B')) + dl('Location', rel(up(f.path)) === '/' ? 'My Drive' : rel(up(f.path))) + dl('Modified', whenLong(f)) + dl('Path', '<span class="mono">' + esc(f.path) + '</span>') + '</div><div class="gd-dact">' +
      (f.is_dir ? '<button class="btn sm" data-d="a-open">Open folder</button>' : (canText ? '<button class="btn sm" data-d="a-edit">' + g('edit', 16) + 'Edit as text</button>' : '') + ows.map(function (a) { return '<button class="btn sm" data-d="a-app" data-s="' + a.slug + '"><img src="/_icons/' + a.slug + '.png" alt="" width="18" height="18">Open in ' + esc(a.name) + '</button>'; }).join('') + '<a class="btn sm" href="' + getUrl(f.path) + '" download="' + esc(f.name) + '">' + g('dl', 16) + 'Download</a>') + '</div>';
  } else if (sel.length) {
    var tot = sel.reduce(function (n, f) { return n + (f.is_dir ? 0 : f.size || 0); }, 0);
    h += '<div class="gd-dpic">' + g('sel', 56) + '</div><div class="gd-dl">' + dl('Selected', sel.length + ' items') + dl('Total size', tot ? A.bytes(tot) : '-') + '</div>';
  } else {
    var l = list(), nf = l.filter(function (f) { return f.is_dir; }).length;
    h += '<div class="gd-dpic">' + fico({ is_dir: true, name: '' }, 84) + '</div><div class="gd-dl">' + dl('Folders', nf) + dl('Files', l.length - nf) + (D.sec === 'my' ? dl('Path', '<span class="mono">' + esc(abs(D.path)) + '</span>') : '') + '</div><p class="gd-hint">Select a file to see its details and the apps that can open it.</p>';
  }
  return h;
}
var dl = function (k, v) { return '<div class="gd-dr"><span>' + k + '</span><div>' + v + '</div></div>'; };
function sideHtml() {
  var n = function (id, label, icon) { return '<button class="gd-nav' + (D.sec === id ? ' on' : '') + '" data-d="sec" data-s="' + id + '"' + (id === 'my' ? ' data-dir="/"' : '') + '>' + g(icon, 20) + '<span>' + label + '</span></button>'; };
  return '<button class="gd-new" data-d="newmenu">' + g('plus', 22) + '<span>New</span></button><div class="gd-navs">' + n('my', 'My Drive', 'drive') + n('recent', 'Recent', 'clock') + n('starred', 'Starred', 'star') + '</div>' +
    '<div class="gd-conn"><span class="pill ok"><i class="dot"></i>Cloudreve connected</span><button class="link" data-act="nav" data-v="settings">Drive settings</button></div>';
}
function view() {
  var st = D.status;
  if (D.code === 'not_configured' || (st && !st.configured)) return '<div class="wrap"><div class="pagehead"><div><h1>Drive</h1><p>Your Cloudreve files inside the OS.</p></div></div>' + A.connectBlock('Connect your Cloudreve', 'dsettings', 'In Cloudreve, open Settings, then WebDAV, and create an account. Enter its address, name and password in Settings here.') + '</div>';
  if (D.error) return '<div class="wrap"><div class="pagehead"><div><h1>Drive</h1></div></div><div class="banner"><i class="dot bad"></i><span>' + esc(D.error) + '</span><button class="btn sm" data-d="retry">Retry</button><button class="btn sm" data-act="nav" data-v="settings">Drive settings</button></div></div>';
  return '<div class="gd' + (D.det ? ' det' : '') + '" id="gd"><aside class="gd-side" id="gd-side">' + sideHtml() + '</aside><section class="gd-main"><div class="gd-top"><label class="gd-search">' + g('search_', 18) + '<input id="gd-q" type="search" placeholder="Search in ' + (D.sec === 'my' ? (D.path === '/' ? 'My Drive' : esc(baseOf(D.path))) : D.sec === 'starred' ? 'Starred' : 'Recent') + '" value="' + esc(D.q) + '" autocomplete="off" aria-label="Search files"></label></div>' +
    '<div class="gd-bar" id="gd-bar">' + barHtml() + '</div><div class="gd-body" id="gd-body" tabindex="0" aria-label="Files">' + bodyHtml() + '</div></section><aside class="gd-det" id="gd-det">' + detHtml() + '</aside><div class="gd-drop" id="gd-drop" hidden><div>' + g('ul', 40) + '<b>Drop to upload</b><span id="gd-dropt"></span></div></div></div>';
}
function paint() {
  if (S.view !== 'drive') return;
  if (!$('#gd') || D.error || D.code === 'not_configured' || (D.status && !D.status.configured)) { var y = $('#view').scrollTop; $('#view').innerHTML = view(); $('#view').scrollTop = y; return; }
  var set = function (id, h) { var e = $(id); if (e) e.innerHTML = h; };
  set('#gd-side', sideHtml()); set('#gd-bar', barHtml()); set('#gd-det', detHtml()); var b = $('#gd-body'), y2 = b ? b.scrollTop : 0; set('#gd-body', bodyHtml()); if (b) b.scrollTop = y2;
  $('#gd').classList.toggle('det', D.det); var q = $('#gd-q'); if (q) q.placeholder = 'Search in ' + (D.sec === 'my' ? (D.path === '/' ? 'My Drive' : baseOf(D.path)) : D.sec === 'starred' ? 'Starred' : 'Recent');
}
function paintSel() { // selection changed: no need to redraw the list
  var on = {}; D.sel.forEach(function (p) { on[p] = 1; });
  document.querySelectorAll('#gd-body .gd-it').forEach(function (e) { var s = !!on[e.getAttribute('data-p')]; e.classList.toggle('sel', s); e.setAttribute('aria-selected', s); });
  var bar = $('#gd-bar'); if (bar) bar.innerHTML = barHtml(); var d = $('#gd-det'); if (d) d.innerHTML = detHtml();
}

/* ---------- selection ---------- */
function pick(p, ev) {
  var l = list().map(function (f) { return f.path; });
  if (ev && ev.shiftKey && D.anchor && l.indexOf(D.anchor) > -1) { var a = l.indexOf(D.anchor), b = l.indexOf(p); D.sel = l.slice(Math.min(a, b), Math.max(a, b) + 1); }
  else if (ev && (ev.ctrlKey || ev.metaKey)) { var i = D.sel.indexOf(p); if (i > -1) D.sel.splice(i, 1); else D.sel.push(p); D.anchor = p; }
  else { D.sel = [p]; D.anchor = p; }
  paintSel();
}
function selectAll() { D.sel = list().map(function (f) { return f.path; }); paintSel(); }
function clearSel() { D.sel = []; D.anchor = null; paintSel(); }

/* ---------- opening ---------- */
function openWith(f) { return (A.OPENWITH[ext(f.name)] || []).map(function (s) { return S.apps.filter(function (a) { return a.slug === s && a.hasSource; })[0]; }).filter(Boolean); }
var PREV = { image: 1, video: 1, audio: 1, pdf: 1 };
function openItem(f) {
  if (!f) return;
  if (f.is_dir) { D.sec = 'my'; return load(rel(f.path)); }
  noteRecent(f.path); var k = kindOf(f).k;
  if (PREV[k] && !(k === 'image' && ext(f.name) === 'svg' && false)) return preview(f);
  if (A.TEXTEXT.test(ext(f.name)) && f.size <= 1048576) return A.dedOpen(f.path);
  var ows = openWith(f); if (ows.length) return openIn(ows[0].slug, f);
  download([f]);
}
function openIn(slug, f) { noteRecent(f.path); if (A.LAUNCHES.indexOf(slug) < 0) toast('This app has no direct file hand-off. Use its Open dialog and choose ' + f.path + '.'); A.launch(slug, A.LAUNCHES.indexOf(slug) < 0 ? null : f.path); }
function download(fs) {
  var files = fs.filter(function (f) { return !f.is_dir; }); if (!files.length) return toast('Folders cannot be downloaded yet. Open it and download the files inside.');
  files.forEach(function (f, i) { setTimeout(function () { var a = document.createElement('a'); a.href = getUrl(f.path); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); }, i * 350); });
}
function preview(f) {
  var l = list().filter(function (x) { return !x.is_dir && PREV[kindOf(x).k]; }), i = Math.max(0, l.map(function (x) { return x.path; }).indexOf(f.path));
  var ov = document.createElement('div'); ov.className = 'gd-pv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  function draw() {
    var x = l[i], k = kindOf(x).k, src = getUrl(x.path);
    ov.innerHTML = '<div class="gd-pvh"><button class="gd-ib" data-pv="x" aria-label="Close">' + g('x', 22) + '</button>' + fico(x, 22) + '<b>' + esc(x.name) + '</b><span class="gd-sp"></span><span class="gd-pvn">' + (l.length > 1 ? (i + 1) + ' / ' + l.length : '') + '</span>' + (openWith(x).length ? '<button class="gd-ib" data-pv="app" aria-label="Open in an app" title="Open in an app">' + g('open', 20) + '</button>' : '') + '<a class="gd-ib" href="' + src + '" download="' + esc(x.name) + '" aria-label="Download" title="Download">' + g('dl', 20) + '</a></div>' +
      '<div class="gd-pvb" data-pv="bg">' + (l.length > 1 ? '<button class="gd-pvnav l" data-pv="p" aria-label="Previous">' + g('chev', 28).replace('<svg ', '<svg style="transform:rotate(180deg)" ') + '</button><button class="gd-pvnav r" data-pv="n" aria-label="Next">' + g('chev', 28) + '</button>' : '') +
      (k === 'image' ? '<img alt="' + esc(x.name) + '" src="' + src + '">' : k === 'video' ? '<video controls autoplay src="' + src + '"></video>' : k === 'audio' ? '<div class="gd-pva">' + fico(x, 96) + '<audio controls autoplay src="' + src + '"></audio></div>' : '<iframe title="' + esc(x.name) + '" src="' + src + '"></iframe>') + '</div>';
  }
  function close() { ov.remove(); document.removeEventListener('keydown', key, true); }
  function step(n) { i = (i + n + l.length) % l.length; noteRecent(l[i].path); draw(); }
  function key(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } else if (e.key === 'ArrowLeft' && l.length > 1) { e.preventDefault(); step(-1); } else if (e.key === 'ArrowRight' && l.length > 1) { e.preventDefault(); step(1); } }
  ov.addEventListener('click', function (e) { var t = e.target.closest('[data-pv]'); if (!t) return; var a = t.getAttribute('data-pv'); if (a === 'x' || (a === 'bg' && e.target === t)) close(); else if (a === 'p') step(-1); else if (a === 'n') step(1); else if (a === 'app') { var ows = openWith(l[i]); close(); if (ows[0]) openIn(ows[0].slug, l[i]); } });
  document.addEventListener('keydown', key, true); document.body.appendChild(ov); draw();
}

/* ---------- operations ---------- */
function busy(msg) { toast(msg); }
function done(msg, sel) { if (msg) toast(msg); return load(undefined, true, true).then(function () { if (sel) { D.sel = sel.map(function (n) { return abs(join(D.path, n)); }).filter(byPath); D.anchor = D.sel[0] || null; paintSel(); var e = D.sel[0] && document.querySelector('.gd-it[data-p="' + CSS.escape(D.sel[0]) + '"]'); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'nearest' }); } }); }
var fail = function (what) { return function (e) { toast(what + ': ' + (e && e.message || 'something went wrong')); return load(undefined, true, true); }; };
function dlg(html) { A.modal('<div class="gd-dlg">' + html + '</div>'); var i = $('#gd-in'); if (i) { i.focus(); var n = i.value, d = n.lastIndexOf('.'); i.setSelectionRange(0, d > 0 && i.dataset.sel === 'base' ? d : n.length); } }
function newFolder() {
  dlg('<h2>New folder</h2><input class="input" id="gd-in" value="Untitled folder" aria-label="Folder name" autocomplete="off"><div class="gd-dbtn"><button class="btn" data-d="mx">Cancel</button><button class="btn primary" data-d="ok-newf">Create</button></div>');
}
function newText() {
  dlg('<h2>New text file</h2><input class="input" id="gd-in" data-sel="base" value="Untitled.txt" aria-label="File name" autocomplete="off"><div class="gd-dbtn"><button class="btn" data-d="mx">Cancel</button><button class="btn primary" data-d="ok-newt">Create</button></div>');
}
function cleanName(n) { n = String(n || '').trim(); if (!n || /[\\/]/.test(n) || n === '.' || n === '..') return null; return n.slice(0, 200); }
function doNewFolder() {
  var n = cleanName($('#gd-in').value); if (!n) return toast('Use a name without slashes.'); A.modal(); n = uniq(n, takenIn());
  fsApi('mkdir', { path: abs(join(D.path, n)), parents: false }).then(function () { return done('Folder created', [n]); }, fail('Could not create the folder'));
}
function doNewText() {
  var n = cleanName($('#gd-in').value); if (!n) return toast('Use a name without slashes.'); A.modal(); n = uniq(n, takenIn()); var p = abs(join(D.path, n));
  api('/_local/fs/write?path=' + enc(p) + '&overwrite=0', { method: 'POST', body: '', headers: { 'content-type': 'text/plain' } }).then(function () { return done(null, [n]).then(function () { A.dedOpen(p); }); }, fail('Could not create the file'));
}
function renameDlg(f) {
  dlg('<h2>Rename</h2><input class="input" id="gd-in" data-sel="base" value="' + esc(f.name) + '" aria-label="New name" autocomplete="off"><div class="gd-dbtn"><button class="btn" data-d="mx">Cancel</button><button class="btn primary" data-d="ok-ren" data-p="' + esc(f.path) + '">OK</button></div>');
}
function doRename(p) {
  var n = cleanName($('#gd-in').value); if (!n) return toast('Use a name without slashes.'); if (n === baseOf(p)) return A.modal();
  if (D.items.some(function (x) { return x.name.toLowerCase() === n.toLowerCase() && x.path !== p; })) return toast('Something in this folder already has that name.');
  A.modal(); fsApi('rename', { path: p, name: n }).then(function () { var was = isStar(p); if (was) { setStar([p], false); setStar([join(up(p), n)], true); } return done('Renamed', [n]); }, fail('Could not rename'));
}
function deleteDlg(items) {
  var one = items.length === 1;
  dlg('<h2>Delete ' + (one ? '"' + esc(items[0].name) + '"' : items.length + ' items') + '?</h2><p class="gd-dp">' + (one && items[0].is_dir ? 'The folder and everything in it will be deleted.' : 'This is permanent. Drive has no bin, so it cannot be undone.') + '</p><div class="gd-dbtn"><button class="btn" data-d="mx">Cancel</button><button class="btn danger" id="gd-ok" data-d="ok-del">Delete forever</button></div>');
  D._del = items.map(function (f) { return f.path; }); var b = $('#gd-ok'); if (b) b.focus();
}
function doDelete() {
  var ps = D._del || []; A.modal(); busy('Deleting...');
  ps.reduce(function (p, x) { return p.then(function () { return fsApi('delete', { path: x }); }); }, Promise.resolve()).then(function () { setStar(ps, false); D.sel = []; return done('Deleted ' + ps.length + (ps.length === 1 ? ' item' : ' items')); }, fail('Could not delete'));
}
function transfer(mode, paths, destRel) { // mode: move | copy
  var dest = abs(destRel), taken = null;
  return fsApi('readdir', { path: dest }).then(function (l) { taken = {}; l.forEach(function (x) { taken[x.name.toLowerCase()] = 1; }); }).then(function () {
    return paths.reduce(function (p, src) { return p.then(function () {
      var name = baseOf(src), same = up(rel(src)) === destRel;
      if (mode === 'move' && same) return null; if (mode === 'move' && (destRel + '/').indexOf(rel(src) + '/') === 0) throw new Error('A folder cannot go inside itself.');
      var n = mode === 'copy' || taken[name.toLowerCase()] ? uniq(name, taken) : name; taken[n.toLowerCase()] = 1;
      return fsApi(mode, { from: src, to: dest + '/' + n });
    }); }, Promise.resolve());
  });
}
function pasteHere(destRel) {
  var c = D.clip; if (!c) return toast('Nothing to paste.'); busy(c.op === 'cut' ? 'Moving...' : 'Copying...');
  transfer(c.op === 'cut' ? 'move' : 'copy', c.paths, destRel || D.path).then(function () { if (c.op === 'cut') D.clip = null; return done(c.op === 'cut' ? 'Moved' : 'Copied'); }, fail(c.op === 'cut' ? 'Could not move' : 'Could not copy'));
}
/* the folder chooser for Move to / Make a copy in */
var PK = null;
function chooser(mode, items) {
  PK = { mode: mode, paths: items.map(function (f) { return f.path; }), name: items.length === 1 ? items[0].name : items.length + ' items', path: D.sec === 'my' ? D.path : '/', dirs: [], loading: true };
  chooserLoad(PK.path);
}
function chooserLoad(p) {
  PK.path = p; PK.loading = true; chooserDraw();
  fsApi('readdir', { path: abs(p) }).then(function (l) { PK.dirs = l.filter(function (x) { return x.is_dir; }).sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); }); PK.loading = false; chooserDraw(); }, function (e) { PK.dirs = []; PK.loading = false; PK.err = e.message; chooserDraw(); });
}
function chooserDraw() {
  if (!PK) return;
  var acc = '', crumbs = '<button class="gd-cr" data-d="pk-go" data-p="/">My Drive</button>';
  PK.path.split('/').filter(Boolean).forEach(function (x) { acc += '/' + x; crumbs += g('chev', 14) + '<button class="gd-cr" data-d="pk-go" data-p="' + esc(acc) + '">' + esc(x) + '</button>'; });
  var blocked = function (d) { return PK.mode === 'move' && PK.paths.some(function (p) { return p === d.path; }); };
  var rows = PK.loading ? '<div class="gd-pkn">Loading...</div>' : PK.err ? '<div class="gd-pkn">' + esc(PK.err) + '</div>' : PK.dirs.map(function (d) { return '<button class="gd-pkr" data-d="pk-go" data-p="' + esc(rel(d.path)) + '"' + (blocked(d) ? ' disabled' : '') + '>' + fico(d, 22) + '<span>' + esc(d.name) + '</span>' + g('chev', 16) + '</button>'; }).join('') || '<div class="gd-pkn">No folders here.</div>';
  var same = PK.mode === 'move' && PK.paths.every(function (p) { return up(rel(p)) === PK.path; }), inside = PK.mode === 'move' && PK.paths.some(function (p) { return (PK.path + '/').indexOf(rel(p) + '/') === 0; });
  A.modal('<div class="gd-dlg gd-pk"><h2>' + (PK.mode === 'move' ? 'Move' : 'Make a copy of') + ' "' + esc(PK.name) + '"</h2><div class="gd-crumbs gd-pkc">' + crumbs + '</div><div class="gd-pkl">' + rows + '</div><div class="gd-dbtn"><button class="btn" data-d="pk-new">' + g('newf', 16) + 'New folder</button><span class="gd-sp"></span><button class="btn" data-d="mx">Cancel</button><button class="btn primary" data-d="pk-ok"' + (same || inside || PK.loading ? ' disabled' : '') + '>' + (PK.mode === 'move' ? 'Move here' : 'Copy here') + '</button></div></div>');
}
function chooserNew() {
  var el = $('.gd-pk .gd-dbtn'); if (!el || $('#gd-pkin')) return; el.insertAdjacentHTML('beforebegin', '<div class="gd-pkadd"><input class="input" id="gd-pkin" value="New folder" aria-label="Folder name" autocomplete="off"><button class="btn primary sm" data-d="pk-mk">Create</button></div>'); var i = $('#gd-pkin'); i.focus(); i.select();
}
function chooserMake() {
  var n = cleanName($('#gd-pkin').value); if (!n) return toast('Use a name without slashes.');
  fsApi('mkdir', { path: abs(join(PK.path, n)), parents: false }).then(function () { chooserLoad(join(PK.path, n)); }, function (e) { toast('Could not create the folder: ' + e.message); });
}
function chooserOk() {
  var pk = PK; PK = null; A.modal(); busy(pk.mode === 'move' ? 'Moving...' : 'Copying...');
  transfer(pk.mode, pk.paths, pk.path).then(function () { D.sel = []; return done(pk.mode === 'move' ? 'Moved to ' + (pk.path === '/' ? 'My Drive' : baseOf(pk.path)) : 'Copied to ' + (pk.path === '/' ? 'My Drive' : baseOf(pk.path))); }, fail(pk.mode === 'move' ? 'Could not move' : 'Could not copy'));
}

/* ---------- uploading ---------- */
function collect(dt) { // files and folders from a drop or an input
  var out = [], items = dt.items ? Array.prototype.slice.call(dt.items) : [];
  var ents = items.map(function (i) { return i.webkitGetAsEntry && i.webkitGetAsEntry(); }).filter(Boolean);
  if (!ents.length) return Promise.resolve(Array.prototype.slice.call(dt.files || []).map(function (f) { return { file: f, rel: f.name }; }));
  function walk(e, pre) {
    if (e.isFile) return new Promise(function (r) { e.file(function (f) { out.push({ file: f, rel: pre + f.name }); r(); }, function () { r(); }); });
    return new Promise(function (r) { var rd = e.createReader(), all = []; (function more() { rd.readEntries(function (b) { if (!b.length) return Promise.all(all.map(function (c) { return walk(c, pre + e.name + '/'); })).then(r); all = all.concat(Array.prototype.slice.call(b)); more(); }, function () { r(); }); })(); });
  }
  return Promise.all(ents.map(function (e) { return walk(e, ''); })).then(function () { return out; });
}
function upload(entries, destRel) {
  destRel = destRel || D.path; if (!entries.length) return;
  var total = entries.length, n = 0, bad = 0, dirs = {}, tops = {}, taken = destRel === D.path ? takenIn() : {};
  entries.forEach(function (e) { var top = e.rel.split('/')[0]; if (e.rel.indexOf('/') > -1 && !(top in tops)) tops[top] = uniq(top, taken); });
  entries.forEach(function (e) { if (e.rel.indexOf('/') < 0) { e.dest = uniq(e.rel, taken); taken[e.dest.toLowerCase()] = 1; } else { var p = e.rel.split('/'); p[0] = tops[p[0]]; e.dest = p.join('/'); } });
  toast('Uploading ' + total + (total === 1 ? ' file' : ' files') + '...');
  var chain = Promise.resolve();
  entries.forEach(function (e) {
    chain = chain.then(function () {
      var d = up(join(destRel, e.dest)); var mk = d !== destRel && !dirs[d] ? (dirs[d] = 1, fsApi('mkdir', { path: abs(d), parents: true }).catch(function () {})) : Promise.resolve();
      return mk.then(function () { return api('/_local/fs/write?path=' + enc(abs(join(destRel, e.dest))) + '&overwrite=0', { method: 'POST', body: e.file, headers: { 'content-type': e.file.type || 'application/octet-stream' } }); })
        .then(function () { n++; noteRecent(abs(join(destRel, e.dest))); if (total > 1) toast('Uploaded ' + n + ' of ' + total + '...'); }, function () { bad++; });
    });
  });
  return chain.then(function () { var names = Object.keys(tops).map(function (k) { return tops[k]; }).concat(entries.filter(function (e) { return e.rel.indexOf('/') < 0; }).map(function (e) { return e.dest; })); return done(bad ? 'Uploaded ' + n + ', ' + bad + ' failed' : n === 1 ? 'Uploaded ' + (entries[0].dest.split('/')[0]) : 'Uploaded ' + n + ' files', destRel === D.path ? names : null); });
}
function pickFiles(folder) { var i = document.createElement('input'); i.type = 'file'; i.multiple = true; if (folder) i.webkitdirectory = true; i.onchange = function () { var l = Array.prototype.slice.call(i.files || []).map(function (f) { return { file: f, rel: f.webkitRelativePath || f.name }; }); upload(l); }; i.click(); }

/* ---------- menus ---------- */
var MENU = null;
function closeMenu() { if (MENU) { MENU.remove(); MENU = null; } }
function mi(id, label, icon, o) { o = o || {}; return { id: id, label: label, icon: icon, kbd: o.kbd, dis: o.dis, danger: o.danger, sub: o.sub }; }
function itemsFor(sel) {
  var m = [], one = sel.length === 1, f = sel[0], files = sel.every(function (x) { return !x.is_dir; }), starred = sel.every(function (x) { return isStar(x.path); });
  if (one) {
    m.push(mi('open', f.is_dir ? 'Open' : 'Open', 'open', { kbd: 'Enter' }));
    if (!f.is_dir) { var sub = [], ows = openWith(f); if (A.TEXTEXT.test(ext(f.name)) && f.size <= 1048576) sub.push(mi('edit', 'Edit as text', 'edit')); ows.forEach(function (a) { sub.push({ id: 'app:' + a.slug, label: a.name, img: '/_icons/' + a.slug + '.png' }); }); if (sub.length) m.push(mi('with', 'Open with', 'open', { sub: sub })); }
  }
  if (files) m.push(mi('dl', 'Download', 'dl'));
  if (m.length) m.push('-');
  m.push(mi('star', starred ? 'Remove from starred' : 'Add to starred', 'star'));
  if (one) m.push(mi('rename', 'Rename', 'edit', { kbd: 'F2' }));
  m.push(mi('copyto', 'Make a copy...', 'copy'), mi('move', 'Move to...', 'move'), '-');
  m.push(mi('cut', 'Cut', 'move', { kbd: 'Ctrl+X' }), mi('copy', 'Copy', 'copy', { kbd: 'Ctrl+C' }));
  if (one && f.is_dir && D.clip) m.push(mi('pasteinto', 'Paste into folder', 'paste', { kbd: 'Ctrl+V' }));
  m.push('-', mi('copypath', 'Copy path', 'link'));
  if (!D.det || sel.length !== 1) m.push(mi('details', 'View details', 'info'));
  m.push('-', mi('del', sel.length > 1 ? 'Delete ' + sel.length + ' items' : 'Delete', 'trash', { danger: true, kbd: 'Del' }));
  return m;
}
function bgItems() {
  var my = D.sec === 'my', m = [];
  if (my) m.push(mi('newf', 'New folder', 'newf'), mi('newt', 'New text file', 'newt'), '-', mi('upf', 'File upload', 'ul'), mi('upd', 'Folder upload', 'ul'), '-');
  if (my && D.clip) m.push(mi('paste', 'Paste', 'paste', { kbd: 'Ctrl+V' }), '-');
  m.push(mi('all', 'Select all', 'sel', { kbd: 'Ctrl+A' }), mi('refresh', 'Refresh', 'refresh'), '-', mi('layout', D.view === 'list' ? 'Switch to grid layout' : 'Switch to list layout', D.view === 'list' ? 'grid' : 'list'), mi('details', D.det ? 'Hide details' : 'View details', 'info'));
  return m;
}
function newItems() { return [mi('newf', 'New folder', 'newf'), '-', mi('upf', 'File upload', 'ul'), mi('upd', 'Folder upload', 'ul'), '-', mi('newt', 'New text file', 'newt')]; }
function menuHtml(items, sub) {
  return '<div class="gd-menu' + (sub ? ' gd-submenu' : '') + '" role="menu">' + items.map(function (it) {
    if (it === '-') return '<div class="gd-sep" role="separator"></div>';
    return '<div class="gd-mit' + (it.danger ? ' danger' : '') + (it.sub ? ' has-sub' : '') + '" role="menuitem" tabindex="-1" data-m="' + it.id + '"' + (it.dis ? ' aria-disabled="true"' : '') + '>' + (it.img ? '<img src="' + it.img + '" alt="" width="20" height="20">' : g(it.icon || 'more', 18)) + '<span>' + esc(it.label) + '</span>' + (it.kbd ? '<kbd>' + it.kbd + '</kbd>' : '') + (it.sub ? g('chev', 16) + menuHtml(it.sub, true) : '') + '</div>';
  }).join('') + '</div>';
}
function showMenu(x, y, items, ctx) {
  closeMenu(); var wrap = document.createElement('div'); wrap.className = 'gd-menuwrap'; wrap.innerHTML = menuHtml(items); var m = wrap.firstChild; document.body.appendChild(wrap); MENU = wrap; MENU._ctx = ctx; MENU._t = Date.now();
  var w = m.offsetWidth, h = m.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
  m.style.left = Math.max(6, Math.min(x, vw - w - 6)) + 'px'; m.style.top = Math.max(6, Math.min(y, vh - h - 6)) + 'px';
  if (m.getBoundingClientRect().right + 230 > vw) m.classList.add('flip');
  var first = m.querySelector('.gd-mit:not([aria-disabled])'); if (first) first.focus({ preventScroll: true });
}
function menuAt(ev, items) { showMenu(ev.clientX, ev.clientY, items, null); }
function runMenu(id) {
  var ctx = MENU && MENU._ctx; closeMenu(); var sel = ctx && ctx.length ? ctx : selItems();
  if (id.indexOf('app:') === 0) return sel[0] && openIn(id.slice(4), sel[0]);
  switch (id) {
    case 'open': return openItem(sel[0]); case 'edit': return A.dedOpen(sel[0].path); case 'dl': return download(sel);
    case 'star': { var on = !sel.every(function (x) { return isStar(x.path); }); setStar(sel.map(function (x) { return x.path; }), on); toast(on ? 'Added to starred' : 'Removed from starred'); if (D.sec === 'starred') return load(undefined, true, true); return paint(); }
    case 'rename': return renameDlg(sel[0]); case 'move': return chooser('move', sel); case 'copyto': return chooser('copy', sel);
    case 'cut': D.clip = { op: 'cut', paths: sel.map(function (x) { return x.path; }) }; return toast(sel.length + (sel.length === 1 ? ' item' : ' items') + ' cut. Open a folder and paste.');
    case 'copy': D.clip = { op: 'copy', paths: sel.map(function (x) { return x.path; }) }; return toast(sel.length + (sel.length === 1 ? ' item' : ' items') + ' copied. Open a folder and paste.');
    case 'paste': return pasteHere(); case 'pasteinto': return pasteHere(rel(sel[0].path));
    case 'copypath': return copyText(sel.map(function (x) { return x.path; }).join('\n'));
    case 'details': D.det = sel.length ? true : !D.det; LS.set('ddet', D.det); return paint();
    case 'del': return deleteDlg(sel);
    case 'newf': return newFolder(); case 'newt': return newText(); case 'upf': return pickFiles(false); case 'upd': return pickFiles(true);
    case 'all': return selectAll(); case 'refresh': return load(undefined, true, true).then(function () { toast('Refreshed'); });
    case 'layout': D.view = D.view === 'list' ? 'grid' : 'list'; LS.set('dview', D.view); return paint();
  }
}
function copyText(t) { try { navigator.clipboard.writeText(t).then(function () { toast('Copied'); }, function () { toast(t); }); } catch (e) { toast(t); } }

/* ---------- events ---------- */
var inGd = function (e) { return e.target && e.target.closest && e.target.closest('#gd'); };
document.addEventListener('click', function (ev) {
  var mt = ev.target.closest && ev.target.closest('.gd-mit'); if (mt) { ev.preventDefault(); if (!mt.classList.contains('has-sub')) runMenu(mt.getAttribute('data-m')); else if (ev.target.closest('.gd-mit') === mt) mt.classList.toggle('open'); return; }
  if (MENU && !(ev.target.closest && ev.target.closest('.gd-menuwrap'))) closeMenu();
  var d = ev.target.closest && ev.target.closest('[data-d]'); if (!d || (!inGd(ev) && !d.closest('.gd-dlg') && !d.closest('.gd-pv'))) return;
  var a = d.getAttribute('data-d'), p = d.getAttribute('data-p');
  switch (a) {
    case 'go': return load(p); case 'loc': ev.stopPropagation(); D.sec = 'my'; return load(p); case 'sec': return section(d.getAttribute('data-s'));
    case 'sort': { var k = d.getAttribute('data-k'); D.sort = D.sort.k === k ? { k: k, d: -D.sort.d } : { k: k, d: 1 }; LS.set('dsort', D.sort); return paint(); }
    case 'view': D.view = d.getAttribute('data-v'); LS.set('dview', D.view); return paint();
    case 'det': D.det = !D.det; LS.set('ddet', D.det); return paint();
    case 'clear': return clearSel(); case 'retry': return load(undefined);
    case 'newmenu': { var r = d.getBoundingClientRect(); return showMenu(r.left, r.bottom + 6, newItems(), null); }
    case 'more': { ev.stopPropagation(); var it = d.closest('.gd-it'), r2 = d.getBoundingClientRect(); if (it) { var pp = it.getAttribute('data-p'); if (D.sel.indexOf(pp) < 0) { D.sel = [pp]; D.anchor = pp; paintSel(); } } return showMenu(r2.right - 220, r2.bottom + 4, selItems().length ? itemsFor(selItems()) : bgItems(), null); }
    case 'a-dl': return download(selItems()); case 'a-move': return chooser('move', selItems()); case 'a-copyto': return chooser('copy', selItems()); case 'a-del': return deleteDlg(selItems());
    case 'a-open': return openItem(selItems()[0]); case 'a-edit': return A.dedOpen(selItems()[0].path); case 'a-app': return openIn(d.getAttribute('data-s'), selItems()[0]);
    case 'mx': return A.modal(); case 'ok-newf': return doNewFolder(); case 'ok-newt': return doNewText(); case 'ok-ren': return doRename(p); case 'ok-del': return doDelete();
    case 'pk-go': PK && chooserLoad(p); return; case 'pk-ok': return chooserOk(); case 'pk-new': return chooserNew(); case 'pk-mk': return chooserMake();
  }
});
document.addEventListener('mousedown', function (ev) { // pick the row; a plain click on a row selects it without redrawing, so double-click still works
  if (ev.button !== 0 || !inGd(ev)) return; var it = ev.target.closest('.gd-it');
  if (ev.target.closest('button.gd-ib, button.gd-loc, a')) return;
  if (it) { var p = it.getAttribute('data-p'); if (!ev.shiftKey && !ev.ctrlKey && !ev.metaKey && D.sel.indexOf(p) > -1 && D.sel.length > 1) return; pick(p, ev); var b = $('#gd-body'); if (b && !ev.shiftKey) b.focus({ preventScroll: true }); }
  else if (ev.target.closest('#gd-body') && !ev.target.closest('.gd-head')) { if (D.sel.length) clearSel(); }
});
document.addEventListener('click', function (ev) { // a click on a multi-selection row (kept for dragging) narrows to that row
  if (!inGd(ev)) return; var it = ev.target.closest('.gd-it'); if (!it || ev.shiftKey || ev.ctrlKey || ev.metaKey || ev.target.closest('button, a')) return;
  var p = it.getAttribute('data-p'); if (D.sel.length > 1 && D.sel.indexOf(p) > -1) pick(p, ev);
});
document.addEventListener('dblclick', function (ev) { if (!inGd(ev) || ev.target.closest('button, a')) return; var it = ev.target.closest('.gd-it'); if (it) openItem(byPath(it.getAttribute('data-p'))); });
document.addEventListener('contextmenu', function (ev) {
  if (S.view !== 'drive' || !inGd(ev)) return; if (ev.target.closest('input, textarea')) return; ev.preventDefault();
  var it = ev.target.closest('.gd-it');
  if (it) { var p = it.getAttribute('data-p'); if (D.sel.indexOf(p) < 0) { D.sel = [p]; D.anchor = p; paintSel(); } return menuAt(ev, itemsFor(selItems())); }
  if (ev.target.closest('.gd-main')) { if (D.sel.length && ev.target.closest('#gd-body')) clearSel(); return menuAt(ev, bgItems()); }
});
var lp = null; // long-press on touch screens opens the menu
document.addEventListener('touchstart', function (ev) { if (S.view !== 'drive' || !inGd(ev) || ev.touches.length !== 1) return; var it = ev.target.closest('.gd-it'); if (!it) return; var t = ev.touches[0]; clearTimeout(lp); lp = setTimeout(function () { var p = it.getAttribute('data-p'); D.sel = [p]; D.anchor = p; paintSel(); showMenu(t.clientX, t.clientY, itemsFor(selItems()), null); }, 520); }, { passive: true });
['touchend', 'touchmove', 'touchcancel'].forEach(function (n) { document.addEventListener(n, function () { clearTimeout(lp); }, { passive: true }); });
document.addEventListener('input', function (ev) { if (ev.target.id === 'gd-q') { D.q = ev.target.value; var b = $('#gd-body'); if (b) b.innerHTML = bodyHtml(); D.sel = D.sel.filter(function (p) { return list().some(function (f) { return f.path === p; }); }); var bar = $('#gd-bar'); if (bar) bar.innerHTML = barHtml(); } });
function typing(t) { return t && /INPUT|TEXTAREA|SELECT/.test(t.tagName); }
document.addEventListener('keydown', function (ev) {
  if (MENU) { // arrow keys inside an open menu
    var m = MENU.querySelector('.gd-menu'), its = Array.prototype.slice.call(m.querySelectorAll(':scope > .gd-mit:not([aria-disabled])')), i = its.indexOf(document.activeElement);
    if (ev.key === 'Escape') { ev.preventDefault(); closeMenu(); return; } if ((ev.key === 'Enter' || ev.key === ' ') && document.activeElement.classList.contains('gd-mit')) { ev.preventDefault(); document.activeElement.click(); return; } if (ev.key === 'ArrowDown') { ev.preventDefault(); (its[(i + 1) % its.length] || its[0]).focus(); return; } if (ev.key === 'ArrowUp') { ev.preventDefault(); (its[(i - 1 + its.length) % its.length] || its[0]).focus(); return; }
    if (ev.key === 'ArrowRight' && document.activeElement.classList.contains('has-sub')) { ev.preventDefault(); var s = document.activeElement.querySelector('.gd-mit'); if (s) s.focus(); return; } if (ev.key === 'ArrowLeft' && document.activeElement.closest('.gd-submenu')) { ev.preventDefault(); document.activeElement.closest('.has-sub').focus(); return; }
    return;
  }
  if (S.view !== 'drive' || !$('#gd')) return; var t = ev.target;
  if (typing(t)) { if (t.id === 'gd-in' && ev.key === 'Enter') { ev.preventDefault(); var ok = document.querySelector('.gd-dlg [data-d^="ok-"]'); if (ok) ok.click(); } else if (t.id === 'gd-pkin' && ev.key === 'Enter') { ev.preventDefault(); chooserMake(); } else if (t.id === 'gd-q' && ev.key === 'Escape') { t.value = ''; D.q = ''; paint(); } return; }
  if (!$('#modal').hidden || document.querySelector('.gd-pv')) return;
  var mod = ev.ctrlKey || ev.metaKey, l = list(), sel = selItems();
  if (mod && ev.key.toLowerCase() === 'a') { ev.preventDefault(); return selectAll(); }
  if (mod && ev.key.toLowerCase() === 'c' && sel.length) { ev.preventDefault(); D.clip = { op: 'copy', paths: D.sel.slice() }; return toast(sel.length + ' copied'); }
  if (mod && ev.key.toLowerCase() === 'x' && sel.length) { ev.preventDefault(); D.clip = { op: 'cut', paths: D.sel.slice() }; return toast(sel.length + ' cut'); }
  if (mod && ev.key.toLowerCase() === 'v' && D.clip && D.sec === 'my') { ev.preventDefault(); return pasteHere(); }
  if (ev.key === 'F2' && sel.length === 1) { ev.preventDefault(); return renameDlg(sel[0]); }
  if ((ev.key === 'Delete' || (ev.key === 'Backspace' && mod)) && sel.length) { ev.preventDefault(); return deleteDlg(sel); }
  if (ev.key === 'Enter' && sel.length === 1) { ev.preventDefault(); return openItem(sel[0]); }
  if (ev.key === 'Escape') { if (D.sel.length) clearSel(); return; }
  if ((ev.altKey && (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft')) || (ev.key === 'Backspace' && !mod)) { if (D.sec === 'my' && D.path !== '/') { ev.preventDefault(); return load(up(D.path)); } return; }
  if (/^Arrow/.test(ev.key) && l.length) {
    ev.preventDefault(); var cur = l.map(function (f) { return f.path; }).indexOf(D.anchor), cols = 1;
    if (D.view === 'grid') { var cards = document.querySelectorAll('#gd-body .gd-card'); if (cards.length > 1) { var top = cards[0].offsetTop; cols = 0; for (var i = 0; i < cards.length && cards[i].offsetTop === top; i++) cols++; } cols = Math.max(1, cols); }
    var step = ev.key === 'ArrowDown' ? (D.view === 'grid' ? cols : 1) : ev.key === 'ArrowUp' ? (D.view === 'grid' ? -cols : -1) : ev.key === 'ArrowRight' ? 1 : -1;
    var n = cur < 0 ? 0 : Math.max(0, Math.min(l.length - 1, cur + step)); pick(l[n].path, ev); var el = document.querySelector('.gd-it[data-p="' + CSS.escape(l[n].path) + '"]'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }
});
/* drag and drop: files in from your computer, and items onto folders */
var dragDepth = 0;
function dropText(target) { var t = $('#gd-dropt'); if (t) t.textContent = 'to ' + (target || (D.path === '/' ? 'My Drive' : baseOf(D.path))); }
function hasFiles(ev) { return ev.dataTransfer && Array.prototype.indexOf.call(ev.dataTransfer.types || [], 'Files') > -1; }
document.addEventListener('dragstart', function (ev) {
  var it = ev.target.closest && ev.target.closest('.gd-it'); if (!it || !inGd(ev)) return; var p = it.getAttribute('data-p'); if (D.sel.indexOf(p) < 0) { D.sel = [p]; D.anchor = p; paintSel(); }
  D.drag = D.sel.slice(); ev.dataTransfer.effectAllowed = 'copyMove'; ev.dataTransfer.setData('text/plain', D.drag.map(baseOf).join('\n'));
  var gh = document.createElement('div'); gh.className = 'gd-ghost'; gh.textContent = D.drag.length === 1 ? baseOf(D.drag[0]) : D.drag.length + ' items'; document.body.appendChild(gh); ev.dataTransfer.setDragImage(gh, 12, 12); setTimeout(function () { gh.remove(); }, 0);
});
document.addEventListener('dragend', function () { D.drag = null; document.querySelectorAll('.drop').forEach(function (e) { e.classList.remove('drop'); }); });
document.addEventListener('dragenter', function (ev) { if (S.view !== 'drive' || !inGd(ev) || !hasFiles(ev)) return; dragDepth++; var o = $('#gd-drop'); if (o && D.sec === 'my') { o.hidden = false; dropText(); } });
document.addEventListener('dragleave', function (ev) { if (S.view !== 'drive' || !hasFiles(ev)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) { var o = $('#gd-drop'); if (o) o.hidden = true; } });
document.addEventListener('dragover', function (ev) {
  if (S.view !== 'drive' || !inGd(ev)) return; var tgt = ev.target.closest('[data-dir]'), files = hasFiles(ev);
  document.querySelectorAll('.drop').forEach(function (e) { e.classList.remove('drop'); });
  if (D.sec !== 'my' && !tgt) return;
  if (tgt && (files || (D.drag && D.drag.indexOf(abs(tgt.getAttribute('data-dir'))) < 0))) { ev.preventDefault(); ev.dataTransfer.dropEffect = files ? 'copy' : (ev.altKey ? 'copy' : 'move'); tgt.classList.add('drop'); if (files) dropText(tgt.textContent.trim() || 'this folder'); }
  else if (files || D.drag) { ev.preventDefault(); ev.dataTransfer.dropEffect = files ? 'copy' : 'move'; }
});
document.addEventListener('drop', function (ev) {
  if (S.view !== 'drive' || !inGd(ev)) return; var o = $('#gd-drop'); if (o) o.hidden = true; dragDepth = 0;
  var tgt = ev.target.closest('[data-dir]'), dest = tgt ? tgt.getAttribute('data-dir') : D.path; document.querySelectorAll('.drop').forEach(function (e) { e.classList.remove('drop'); });
  if (hasFiles(ev) && !D.drag) { ev.preventDefault(); if (D.sec !== 'my' && !tgt) return; return collect(ev.dataTransfer).then(function (l) { return upload(l, dest); }); }
  if (D.drag && D.drag.length) { ev.preventDefault(); var ps = D.drag.slice(); D.drag = null; if (ps.indexOf(abs(dest)) > -1) return; var copy = ev.altKey; busy(copy ? 'Copying...' : 'Moving...');
    transfer(copy ? 'copy' : 'move', ps, dest).then(function () { D.sel = []; return done((copy ? 'Copied to ' : 'Moved to ') + (dest === '/' ? 'My Drive' : baseOf(dest))); }, fail(copy ? 'Could not copy' : 'Could not move')); }
});
window.addEventListener('blur', closeMenu); window.addEventListener('resize', closeMenu); document.addEventListener('scroll', function (e) { if (MENU && Date.now() - MENU._t > 400 && !(e.target.closest && e.target.closest('.gd-menuwrap'))) closeMenu(); }, true);

window.AOSDrive = { view: view, load: load, paint: paint, state: D };
})();
