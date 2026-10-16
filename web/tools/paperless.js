/* Paperless inside Anands OS: search, browse, preview, tag and upload documents. The OS server holds the token. */
(function () {
'use strict';
var T = window.T, $ = T.$, esc = T.esc;
var P = { st: null, meta: null, tab: 'all', q: '', tags: [], cor: '', type: '', sort: '-created', page: 1, data: null, busy: false, seq: 0 };
var api = function (m, p, b) { return T.api('/api/paperless' + p, { method: m, json: b }); };
var TXT = ['#f68712', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#eab308'];
function tone(t) { if (t.color && /^#[0-9a-f]{6}$/i.test(t.color)) return t.color; var h = 0, s = String(t.name || t.id); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return TXT[h % TXT.length]; }
function fd(d) { return d ? new Date(d + 'T12:00:00Z').toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''; }
function err(e) { T.toast(e && e.message ? e.message : 'Something went wrong'); }
function lookup(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
function hl(s) { return esc(s).replace(/&lt;(\/?)mark&gt;/g, '<$1mark>'); }
function modal(html, on) { var m = $('#mmodal'); m.innerHTML = '<div class="mbox' + (on && on.cls ? ' ' + on.cls : '') + '" role="dialog" aria-modal="true">' + html + '</div>'; m.hidden = false; if (on && on.run) on.run(); }
function close() { var m = $('#mmodal'); m.hidden = true; m.innerHTML = ''; }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#mmodal').hidden) { close(); e.stopPropagation(); } });
$('#mmodal').addEventListener('mousedown', function (e) { if (e.target === this) close(); });

function title(t) { try { if (parent !== window) parent.postMessage({ aosTool: 'title', title: t }, location.origin); } catch (e) {} }
function nav() {
  var m = P.meta || { tags: [], correspondents: [], types: [] }, s = P.st || {};
  $('#mnav').innerHTML = '<div class="brand"><img src="/oicons/paperless.svg" alt="">Paperless</div>' +
    '<button data-tab="all"' + (P.tab === 'all' ? ' aria-current="page"' : '') + '>' + T.ic('file') + 'All documents' + (s.total ? ' <span class="tmuted">(' + s.total + ')</span>' : '') + '</button>' +
    '<button data-tab="inbox"' + (P.tab === 'inbox' ? ' aria-current="page"' : '') + '>' + T.ic('down') + 'Inbox' + (s.inbox ? ' <span class="tmuted">(' + s.inbox + ')</span>' : '') + '</button>' +
    '<button data-a="upload">' + T.ic('plus') + 'Upload</button>' +
    (m.tags.length ? '<div class="pl-side"><div class="hd">Tags</div>' + m.tags.slice(0, 40).map(function (t) { return '<button class="pl-t" data-a="tag" data-id="' + t.id + '" aria-pressed="' + (P.tags.indexOf(t.id) >= 0) + '"><i style="background:' + tone(t) + '"></i><span>' + esc(t.name) + '</span><em>' + t.count + '</em></button>'; }).join('') + '</div>' : '') +
    '<a class="mbtn" style="margin-top:auto;justify-content:center" href="' + esc((s && s.url) || '#') + '" target="_blank" rel="noopener">Open full Paperless</a>';
}
function head() {
  var m = P.meta || { correspondents: [], types: [] };
  function opts(list, sel, none) { return '<option value="">' + none + '</option>' + list.map(function (c) { return '<option value="' + c.id + '"' + (String(c.id) === String(sel) ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join(''); }
  return '<div class="mhead"><div><h1>' + (P.tab === 'inbox' ? 'Inbox' : 'Documents') + '</h1><p id="plsub"></p></div><span class="sp"></span><button class="mbtn pri" data-a="upload">' + T.ic('plus') + 'Upload</button></div>' +
    '<div class="pl-bar"><label class="pl-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input class="tin" id="plq" type="search" placeholder="Search inside every document" value="' + esc(P.q) + '" aria-label="Search documents"><span class="pl-k">/</span></label>' +
    '<select class="tin" id="plc" aria-label="Correspondent">' + opts(m.correspondents, P.cor, 'Anyone') + '</select><select class="tin" id="plt" aria-label="Document type">' + opts(m.types, P.type, 'Any type') + '</select>' +
    '<select class="tin" id="pls" aria-label="Sort"><option value="-created"' + (P.sort === '-created' ? ' selected' : '') + '>Newest first</option><option value="created"' + (P.sort === 'created' ? ' selected' : '') + '>Oldest first</option><option value="-added"' + (P.sort === '-added' ? ' selected' : '') + '>Recently added</option><option value="title"' + (P.sort === 'title' ? ' selected' : '') + '>Title A to Z</option></select></div>' +
    (P.tags.length ? '<div class="mchips">' + P.tags.map(function (id) { var t = lookup(m.tags || [], id); return t ? '<button class="mchip on" data-a="tag" data-id="' + id + '">' + esc(t.name) + ' &#10005;</button>' : ''; }).join('') + '</div>' : '') + '<div id="plres"></div>';
}
function tagsHtml(ids) { var m = P.meta || { tags: [] }; return ids.length ? '<div class="pl-tags">' + ids.map(function (id) { var t = lookup(m.tags, id); return t ? '<span class="pl-tag" style="background:' + tone(t) + '">' + esc(t.name) + '</span>' : ''; }).join('') + '</div>' : ''; }
function row(d) {
  var m = P.meta, c = d.correspondent ? lookup(m.correspondents, d.correspondent) : null, ty = d.type ? lookup(m.types, d.type) : null;
  var meta = [c && c.name, fd(d.created), ty && ty.name, d.pages ? d.pages + (d.pages === 1 ? ' page' : ' pages') : ''].filter(Boolean).map(esc).join(' &middot; ');
  return '<div class="pl-doc" tabindex="0" data-a="open" data-id="' + d.id + '" role="button" aria-label="Open ' + esc(d.title) + '"><div class="pl-th"><img src="/api/paperless/documents/' + d.id + '/thumb" alt="" loading="lazy"></div><div class="grow"><b>' + esc(d.title) + '</b><small>' + meta + '</small>' +
    ((d.hit && d.hit.snippet) || d.snippet ? '<div class="pl-sn">' + (d.hit && d.hit.snippet ? hl(d.hit.snippet) : esc(d.snippet)) + '</div>' : '') + tagsHtml(d.tags) + '</div></div>';
}
function setup(why) {
  var s = P.st || {}, noUrl = !s.configured;
  $('#mnav').innerHTML = '<div class="brand"><img src="/oicons/paperless.svg" alt="">Paperless</div>';
  $('#mmain').innerHTML = '<div class="mc pl-setup"><h2 style="font-size:22px">' + (noUrl ? 'Connect Paperless' : 'One more step') + '</h2><p style="margin:0;color:var(--muted)">' + esc(why || 'Anands OS reads your documents from Paperless and shows them here in its own look. Your token stays on the server.') + '</p><ol>' +
    '<li><b>Address.</b> ' + (noUrl ? 'Add your Paperless address in Settings under Direct sign-in links.' : 'Using ' + esc(s.url) + '.') + '</li>' +
    '<li><b>Token.</b> In Paperless open <b>My Profile</b>, choose <b>Auth Tokens</b> and create one. Paste it in Settings under Paperless.</li>' +
    '<li><b>Come back</b> and press Check connection.</li></ol><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="mbtn pri" href="/#settings" target="_top">Open Settings</a><button class="mbtn" data-a="retry">Check connection</button></div></div>';
  $('#mfab').hidden = true; title('Paperless');
}
function load() {
  var seq = ++P.seq, qs = ['page=' + P.page, 'sort=' + encodeURIComponent(P.sort)]; if (P.q) qs.push('q=' + encodeURIComponent(P.q)); if (P.tags.length) qs.push('tags=' + P.tags.join(',')); if (P.cor) qs.push('correspondent=' + P.cor); if (P.type) qs.push('type=' + P.type); if (P.tab === 'inbox') qs.push('inbox=1');
  api('GET', '/documents?' + qs.join('&')).then(function (d) { if (seq !== P.seq) return; P.data = d; list(); }).catch(function (e) { if (seq !== P.seq) return; if (e.status === 409) { P.st.connected = false; setup(e.message); return; } var r = $('#plres'); if (r) r.innerHTML = '<div class="mc mempty"><b>Could not load documents</b><span>' + esc(e.message) + '</span><button class="mbtn" data-a="retry">Try again</button></div>'; });
}
function list() {
  var d = P.data, r = $('#plres'); if (!r) return; var sub = $('#plsub'); if (sub) sub.textContent = d.count + (d.count === 1 ? ' document' : ' documents') + (P.q ? ' match' : '');
  if (!d.results.length) { r.innerHTML = '<div class="mc mempty"><b>' + (P.q || P.tags.length || P.cor || P.type ? 'Nothing matches' : P.tab === 'inbox' ? 'Inbox is empty' : 'No documents yet') + '</b><span>' + (P.q || P.tags.length || P.cor || P.type ? 'Try fewer words or clear the filters.' : 'Drop a scan or PDF anywhere on this page. Paperless reads it, so you can search the text inside later.') + '</span></div>'; return; }
  r.innerHTML = '<div class="mc" style="padding:6px 10px">' + d.results.map(row).join('') + '</div>' + (d.pageCount > 1 ? '<div class="pl-pg"><button class="mbtn" data-a="prev"' + (P.page <= 1 ? ' disabled' : '') + '>Previous</button><span>Page ' + P.page + ' of ' + d.pageCount + '</span><button class="mbtn" data-a="next"' + (P.page >= d.pageCount ? ' disabled' : '') + '>Next</button></div>' : '');
}
function draw() {
  nav(); var main = $('#mmain'), had = document.activeElement && document.activeElement.id === 'plq', pos = had ? document.activeElement.selectionStart : 0;
  main.innerHTML = head(); $('#mfab').hidden = false;
  if (had) { $('#plq').focus(); $('#plq').setSelectionRange(pos, pos); }
  var tm; $('#plq').oninput = function () { var v = this.value; clearTimeout(tm); tm = setTimeout(function () { P.q = v.trim(); P.page = 1; load(); }, 280); };
  $('#plc').onchange = function () { P.cor = this.value; P.page = 1; load(); }; $('#plt').onchange = function () { P.type = this.value; P.page = 1; load(); }; $('#pls').onchange = function () { P.sort = this.value; P.page = 1; load(); };
  title(P.tab === 'inbox' ? 'Paperless: Inbox' : 'Paperless'); if (P.data) list(); load();
}
function go(t) { P.tab = t === 'inbox' ? 'inbox' : 'all'; P.page = 1; P.data = null; try { history.replaceState(null, '', '#' + (P.tab === 'inbox' ? 'inbox' : 'paperless')); } catch (e) {} draw(); }

/* one document */
function view(id) {
  api('GET', '/documents/' + id).then(function (d) {
    var m = P.meta, sel = d.tags.slice();
    function opts(list, v, none) { return '<option value="">' + none + '</option>' + list.map(function (c) { return '<option value="' + c.id + '"' + (c.id === v ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join(''); }
    var isImg = /\.(png|jpe?g|gif|webp|tiff?)$/i.test(d.file || '');
    modal('<div class="pv">' + (isImg ? '<img src="/api/paperless/documents/' + id + '/thumb" alt="">' : '<iframe title="' + esc(d.title) + '" src="/api/paperless/documents/' + id + '/preview"></iframe>') + '</div>' +
      '<div class="pf"><h2 style="word-break:break-word">' + esc(d.title) + '</h2><small class="tmuted">' + [fd(d.created), d.file, d.pages ? d.pages + ' pages' : ''].filter(Boolean).map(esc).join(' &middot; ') + '</small>' +
      '<label>Title<input class="tin" id="vt" value="' + esc(d.title) + '" maxlength="128"></label><div class="row2"><label>Correspondent<select id="vc">' + opts(m.correspondents, d.correspondent, 'None') + '</select></label><label>Type<select id="vy">' + opts(m.types, d.type, 'None') + '</select></label></div>' +
      '<div>Tags</div><div class="pl-tagpick" id="vtg">' + m.tags.map(function (t) { var on = sel.indexOf(t.id) >= 0; return '<button type="button" data-tg="' + t.id + '" class="' + (on ? 'on' : '') + '" style="' + (on ? 'background:' + tone(t) : '') + '">' + esc(t.name) + '</button>'; }).join('') + '</div>' +
      (d.content ? '<div class="pc" aria-label="Text found in the document">' + esc(d.content.slice(0, 1500)) + '</div>' : '') + '<div class="err" id="ve" role="alert"></div>' +
      '<div class="acts"><a class="mbtn" href="/api/paperless/documents/' + id + '/download" download>Download</a><a class="mbtn" href="' + esc(P.st.url) + '/documents/' + id + '/details" target="_blank" rel="noopener">Open in Paperless</a><button class="mbtn" data-a="close">Close</button><button class="mbtn pri" id="vok">Save</button></div></div>', {
        cls: 'pl-view', run: function () {
          $('#vtg').onclick = function (e) { var b = e.target.closest('[data-tg]'); if (!b) return; var n = +b.dataset.tg, i = sel.indexOf(n), t = lookup(m.tags, n); if (i >= 0) { sel.splice(i, 1); b.classList.remove('on'); b.style.background = ''; } else { sel.push(n); b.classList.add('on'); b.style.background = tone(t); } };
          $('#vok').onclick = function () { $('#vok').disabled = true; api('PATCH', '/documents/' + id, { title: $('#vt').value, correspondent: $('#vc').value, type: $('#vy').value, tags: sel }).then(function () { close(); T.toast('Saved'); load(); refreshMeta(); }).catch(function (e) { $('#ve').textContent = e.message; $('#vok').disabled = false; }); };
        }
      });
  }).catch(err);
}
/* upload */
function upload(files) {
  files = Array.prototype.slice.call(files || []); if (!files.length) return; var ok = 0, bad = 0;
  T.toast('Uploading ' + files.length + (files.length === 1 ? ' file...' : ' files...'));
  files.reduce(function (p, f) { return p.then(function () { return fetch('/api/paperless/upload?name=' + encodeURIComponent(f.name), { method: 'POST', credentials: 'same-origin', headers: { 'x-aos': '1', 'content-type': f.type || 'application/octet-stream' }, body: f }).then(function (r) { if (r.ok) ok++; else bad++; }).catch(function () { bad++; }); }); }, Promise.resolve()).then(function () {
    T.toast(ok ? 'Sent ' + ok + ' to Paperless. It will appear in your Inbox once it has been read.' + (bad ? ' ' + bad + ' failed.' : '') : 'Could not upload'); setTimeout(function () { refreshMeta(); if (P.tab === 'inbox') load(); }, 4000);
  });
}
function refreshMeta() { return Promise.all([api('GET', '/status'), api('GET', '/meta')]).then(function (r) { P.st = r[0]; P.meta = r[1]; nav(); }).catch(function () {}); }

var A = { close: close };
A.open = function (b) { view(+b.dataset.id); }; A.upload = function () { $('#plfile').click(); };
A.tag = function (b) { var id = +b.dataset.id, i = P.tags.indexOf(id); if (i >= 0) P.tags.splice(i, 1); else P.tags.push(id); P.page = 1; draw(); };
A.prev = function () { P.page = Math.max(1, P.page - 1); load(); $('#mmain').scrollTop = 0; }; A.next = function () { P.page++; load(); $('#mmain').scrollTop = 0; };
A.retry = function () { init(); };
document.addEventListener('click', function (e) { var b = e.target.closest('[data-a],[data-tab]'); if (!b) return; if (b.dataset.tab) { close(); return go(b.dataset.tab); } if (A[b.dataset.a]) A[b.dataset.a](b); });
document.addEventListener('keydown', function (e) {
  var t = e.target; if (e.key === 'Enter' && t.classList && t.classList.contains('pl-doc')) { e.preventDefault(); return view(+t.dataset.id); }
  if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && $('#plq')) { e.preventDefault(); $('#plq').focus(); }
});
$('#plfile').onchange = function () { upload(this.files); this.value = ''; };
$('#mfab').innerHTML = T.ic('plus'); $('#mfab').onclick = function () { $('#plfile').click(); };
var dc = 0; document.addEventListener('dragenter', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { dc++; $('#pldrop').hidden = false; } });
document.addEventListener('dragleave', function () { dc = Math.max(0, dc - 1); if (!dc) $('#pldrop').hidden = true; }); document.addEventListener('dragover', function (e) { e.preventDefault(); });
document.addEventListener('drop', function (e) { e.preventDefault(); dc = 0; $('#pldrop').hidden = true; if (e.dataTransfer && e.dataTransfer.files.length) upload(e.dataTransfer.files); });
function init() {
  api('GET', '/status').then(function (s) {
    P.st = s; if (!s.connected) return setup(s.reason);
    return api('GET', '/meta').then(function (m) { P.meta = m; var h = location.hash.replace('#', ''); P.tab = h === 'inbox' ? 'inbox' : 'all'; draw(); });
  }).catch(function (e) { $('#mmain').innerHTML = '<div class="mempty"><b>Could not open Paperless</b><span>' + esc(e.message) + '</span></div>'; });
}
init();
})();
