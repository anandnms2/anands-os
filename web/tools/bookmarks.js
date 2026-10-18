/* Links inside Anands OS: search, browse and add bookmarks from your Linkwarden. The OS server holds the token. */
(function () {
'use strict';
var T = window.T, $ = T.$, esc = T.esc;
var P = { st: null, meta: null, tab: 'all', q: '', col: 0, tag: 0, sort: 'new', list: [], next: null, seq: 0 };
var api = function (m, p, b) { return T.api('/api/bookmarks' + p, { method: m, json: b }); };
function err(e) { T.toast(e && e.message ? e.message : 'Something went wrong'); }
function lookup(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
function modal(html, run) { var m = $('#mmodal'); m.innerHTML = '<div class="mbox" role="dialog" aria-modal="true">' + html + '</div>'; m.hidden = false; if (run) run(); }
function close() { var m = $('#mmodal'); m.hidden = true; m.innerHTML = ''; }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#mmodal').hidden) { close(); e.stopPropagation(); } });
$('#mmodal').addEventListener('mousedown', function (e) { if (e.target === this) close(); });
function title(t) { try { if (parent !== window) parent.postMessage({ aosTool: 'title', title: t }, location.origin); } catch (e) {} }
function dot(c) { return '<i style="background:' + (c && /^#[0-9a-f]{6}$/i.test(c) ? c : '#f68712') + '"></i>'; }

function ordered(cols) {
  var out = [], ids = {}; cols.forEach(function (c) { ids[c.id] = 1; });
  (function add(parent, depth) { cols.forEach(function (c) { if ((c.parent || null) === parent || (parent === null && c.parent && !ids[c.parent])) { out.push(Object.assign({ depth: depth }, c)); add(c.id, depth + 1); } }); })(null, 0);
  return out;
}
function nav() {
  var m = P.meta || { collections: [], tags: [] };
  $('#mnav').innerHTML = '<div class="brand"><img src="/oicons/bookmarks.svg" alt="">Links</div>' +
    '<button data-tab="all"' + (P.tab === 'all' && !P.col && !P.tag ? ' aria-current="page"' : '') + '>' + T.ic('list') + 'All links</button>' +
    '<button data-tab="pinned"' + (P.tab === 'pinned' ? ' aria-current="page"' : '') + '>' + T.ic('up') + 'Pinned</button>' +
    '<button data-a="add">' + T.ic('plus') + 'Add link</button>' +
    '<button data-tab="collections"' + (P.tab === 'collections' ? ' aria-current="page"' : '') + '>' + T.ic('folder') + 'Collections</button>' +
    '<button data-tab="tags"' + (P.tab === 'tags' ? ' aria-current="page"' : '') + '><b style="width:18px;text-align:center">#</b>Tags</button>' +
    (m.collections.length ? '<div class="pl-side"><div class="hd">Collections</div>' + ordered(m.collections).map(function (c) { return '<button class="pl-t" data-a="col" data-id="' + c.id + '" aria-pressed="' + (P.col === c.id) + '" style="padding-left:' + (10 + c.depth * 14) + 'px">' + dot(c.color) + '<span>' + esc(c.name) + '</span><small class="tmuted">' + c.count + '</small></button>'; }).join('') + '</div>' : '') +
    (m.tags.length ? '<div class="pl-side"><div class="hd">Tags</div>' + m.tags.slice(0, 60).map(function (t) { return '<button class="pl-t" data-a="tag" data-id="' + t.id + '" aria-pressed="' + (P.tag === t.id) + '"><b class="tmuted" style="width:10px;text-align:center">#</b><span>' + esc(t.name) + '</span><small class="tmuted">' + t.count + '</small></button>'; }).join('') + '</div>' : '') +
    '<a class="mbtn" style="margin-top:auto;justify-content:center" href="' + esc((P.st && P.st.url) || '#') + '" target="_blank" rel="noopener">Open full Links</a>';
}
function heading() {
  var m = P.meta || { collections: [], tags: [] }, c = P.col ? lookup(m.collections, P.col) : null, t = P.tag ? lookup(m.tags, P.tag) : null;
  if (c || t) return (c ? dot(c.color).replace('<i ', '<i class="hdot" ') + esc(c.name) : '') + (c && t ? ' ' : '') + (t ? '#' + esc(t.name) : '');
  return P.tab === 'pinned' ? 'Pinned' : 'Links';
}
function head() {
  return '<div class="mhead"><div><h1>' + heading() + '</h1><p id="lksub"></p></div><span class="sp"></span><button class="mbtn pri" data-a="add">' + T.ic('plus') + 'Add link</button></div>' +
    '<div class="pl-bar"><label class="pl-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input class="tin" id="lkq" type="search" placeholder="Search names, addresses, tags and page text" value="' + esc(P.q) + '" aria-label="Search links"></label>' +
    '<select class="tin" id="lks" aria-label="Sort"><option value="new"' + (P.sort === 'new' ? ' selected' : '') + '>Newest first</option><option value="old"' + (P.sort === 'old' ? ' selected' : '') + '>Oldest first</option></select></div><div id="lkres"></div>';
}
function tagsHtml(ts) { return ts.length ? '<div class="pl-tags">' + ts.map(function (t) { return '<span class="pl-tag" style="background:var(--accent-soft);color:var(--accent-text)">' + esc(t.name) + '</span>'; }).join('') + '</div>' : ''; }
function row(l) {
  var meta = [l.host, l.collection && l.collection.name, l.created].filter(Boolean).map(esc).join(' &middot; ');
  return '<div class="pl-doc" tabindex="0" data-a="go" data-u="' + esc(l.url) + '" role="link" aria-label="Open ' + esc(l.name) + '"><div class="grow"><b>' + esc(l.name) + '</b><small>' + meta + '</small>' +
    (l.description ? '<div class="pl-sn">' + esc(l.description) + '</div>' : '') + tagsHtml(l.tags) + '</div><button class="mbtn" data-a="del" data-id="' + l.id + '" aria-label="Delete ' + esc(l.name) + '" title="Delete">' + T.ic('trash') + '</button></div>';
}
function render() {
  var r = $('#lkres'); if (!r) return; var sub = $('#lksub'); if (sub) sub.textContent = P.list.length + (P.next ? '+' : '') + (P.list.length === 1 ? ' link' : ' links');
  if (!P.list.length) { var f = P.q || P.col || P.tag || P.tab === 'pinned'; r.innerHTML = '<div class="mc mempty"><b>' + (f ? 'Nothing matches' : 'No links yet') + '</b><span>' + (f ? 'Try fewer words or clear the filters.' : 'Add your first link with the button above.') + '</span></div>'; return; }
  r.innerHTML = '<div class="mc" style="padding:6px 10px">' + P.list.map(row).join('') + '</div>' + (P.next ? '<div class="pl-pg"><button class="mbtn" data-a="more">Load more</button></div>' : '');
}
function load(more) {
  var seq = ++P.seq, qs = ['sort=' + P.sort]; if (P.q) qs.push('q=' + encodeURIComponent(P.q)); if (P.col) qs.push('collection=' + P.col); if (P.tag) qs.push('tag=' + P.tag); if (P.tab === 'pinned') qs.push('pinned=1'); if (more && P.next) qs.push('cursor=' + P.next);
  api('GET', '/links?' + qs.join('&')).then(function (d) { if (seq !== P.seq) return; P.list = more ? P.list.concat(d.results) : d.results; P.next = d.next; render(); }).catch(function (e) {
    if (seq !== P.seq) return; if (e.status === 409) { P.st.connected = false; return setup(e.message); } var r = $('#lkres'); if (r) r.innerHTML = '<div class="mc mempty"><b>Could not load links</b><span>' + esc(e.message) + '</span></div>'; });
}
function overview() {
  var m = P.meta || { collections: [], tags: [] }, isC = P.tab === 'collections';
  $('#mmain').innerHTML = '<div class="mhead"><div><h1>' + (isC ? 'Collections' : 'Tags') + '</h1><p>' + (isC ? m.collections.length + ' collections' : m.tags.length + ' tags') + '</p></div><span class="sp"></span><button class="mbtn pri" data-a="add">' + T.ic('plus') + 'Add link</button></div>' +
    (isC ? '<div class="lk-grid">' + ordered(m.collections).map(function (c) { return '<button class="mc lk-card" data-a="col" data-id="' + c.id + '"><span class="lk-bar" style="background:' + (/^#[0-9a-f]{6}$/i.test(c.color) ? c.color : '#f68712') + '"></span><b>' + esc(c.name) + '</b><small>' + c.count + (c.count === 1 ? ' link' : ' links') + (c.depth ? ' &middot; sub-collection' : '') + '</small></button>'; }).join('') + '</div>'
      : '<div class="lk-tags">' + m.tags.map(function (t) { return '<button class="mchip" data-a="tag" data-id="' + t.id + '"># ' + esc(t.name) + ' <small class="tmuted">' + t.count + '</small></button>'; }).join('') + '</div>');
  if (!(isC ? m.collections : m.tags).length) $('#mmain').insertAdjacentHTML('beforeend', '<div class="mc mempty"><b>' + (isC ? 'No collections yet' : 'No tags yet') + '</b><span>They appear here once you add them in Links.</span></div>');
  title('Links');
}
function draw() {
  nav(); if (P.tab === 'collections' || P.tab === 'tags') { $('#mfab').hidden = false; return overview(); } var had = document.activeElement && document.activeElement.id === 'lkq', pos = had ? document.activeElement.selectionStart : 0;
  $('#mmain').innerHTML = head(); $('#mfab').hidden = false;
  if (had) { $('#lkq').focus(); $('#lkq').setSelectionRange(pos, pos); }
  var tm; $('#lkq').oninput = function () { var v = this.value; clearTimeout(tm); tm = setTimeout(function () { P.q = v.trim(); load(); }, 280); };
  $('#lks').onchange = function () { P.sort = this.value; load(); };
  title('Links'); render(); load();
}
function setup(why) {
  var s = P.st || {}, noUrl = !s.configured;
  $('#mnav').innerHTML = '<div class="brand"><img src="/oicons/bookmarks.svg" alt="">Links</div>';
  $('#mmain').innerHTML = '<div class="mc pl-setup"><h2 style="font-size:22px">' + (noUrl ? 'Connect Links' : 'One more step') + '</h2><p style="margin:0;color:var(--muted)">' + esc(why || 'Anands OS reads your bookmarks from Links and shows them here. Your token stays on the server.') + '</p><ol>' +
    '<li><b>Address.</b> ' + (noUrl ? 'Add your Links address in Settings.' : 'Using ' + esc(s.url) + '.') + '</li>' +
    '<li><b>Token.</b> In Links open <b>Settings</b>, choose <b>Access Tokens</b> and create one. Paste it in Settings under Links.</li>' +
    '<li><b>Come back</b> and press Check connection.</li></ol><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="mbtn pri" href="/#settings" target="_top">Open Settings</a><button class="mbtn" data-a="retry">Check connection</button></div></div>';
  $('#mfab').hidden = true; title('Links');
}
function add() {
  var m = P.meta || { collections: [] };
  modal('<h2>Add link</h2><label>Address<input class="tin" id="au" type="url" placeholder="https://" autocomplete="off"></label><label>Name (optional)<input class="tin" id="an" maxlength="200"></label>' +
    '<label>Collection<select id="ac" class="tin"><option value="">Unorganized</option>' + m.collections.map(function (c) { return '<option value="' + c.id + '"' + (c.id === P.col ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></label>' +
    '<label>Tags (comma separated)<input class="tin" id="at" maxlength="200"></label><div class="err" id="ae" role="alert"></div>' +
    '<div class="acts"><button class="mbtn" data-a="close">Cancel</button><button class="mbtn pri" id="aok">Add</button></div>', function () {
      $('#au').focus();
      $('#aok').onclick = function () {
        var b = $('#aok'); b.disabled = true;
        api('POST', '/links', { url: $('#au').value, name: $('#an').value, collection: $('#ac').value, tags: $('#at').value }).then(function () { close(); T.toast('Link added'); refreshMeta(); load(); }).catch(function (e) { b.disabled = false; $('#ae').textContent = e.message || 'Could not add that link'; });
      };
    });
}
function refreshMeta() { return Promise.all([api('GET', '/status'), api('GET', '/meta')]).then(function (r) { P.st = r[0]; P.meta = r[1]; nav(); }).catch(function () {}); }
function home() { P.tab = 'all'; P.col = 0; P.tag = 0; draw(); }
var A = { close: close, add: add };
A.go = function (b) { var u = b.dataset.u; if (/^https?:\/\//i.test(u)) window.open(u, '_blank', 'noopener'); };
A.col = function (b) { var id = +b.dataset.id; P.col = P.col === id && P.tab === 'all' ? 0 : id; P.tag = 0; P.tab = 'all'; draw(); };
A.tag = function (b) { var id = +b.dataset.id; P.tag = P.tag === id && P.tab === 'all' ? 0 : id; P.col = 0; P.tab = 'all'; draw(); };
A.more = function () { load(true); }; A.retry = function () { init(); };
A.del = function (b) {
  var id = +b.dataset.id, l = lookup(P.list, id); if (!l) return;
  modal('<h2>Delete this link?</h2><p style="color:var(--muted)">' + esc(l.name) + ' will be removed from Links.</p><div class="acts"><button class="mbtn" data-a="close">Keep it</button><button class="mbtn pri" id="dok">Delete</button></div>', function () {
    $('#dok').onclick = function () { api('DELETE', '/links/' + id).then(function () { close(); T.toast('Link deleted'); refreshMeta(); load(); }).catch(function (e) { close(); err(e); }); };
  });
};
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-a],[data-tab]'); if (!b) return;
  if (b.dataset.tab) { close(); P.tab = b.dataset.tab; P.col = 0; P.tag = 0; return draw(); }
  if (b.dataset.a === 'go' && e.target.closest('[data-a="del"]')) return;
  if (A[b.dataset.a]) { e.stopPropagation(); A[b.dataset.a](b); }
}, true);
document.addEventListener('keydown', function (e) {
  var t = e.target; if (e.key === 'Enter' && t.classList && t.classList.contains('pl-doc')) { e.preventDefault(); return A.go(t); }
  if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && $('#lkq')) { e.preventDefault(); $('#lkq').focus(); }
});
$('#mfab').innerHTML = T.ic('plus'); $('#mfab').onclick = add;
function init() {
  api('GET', '/status').then(function (s) {
    P.st = s; if (!s.connected) return setup(s.reason);
    return api('GET', '/meta').then(function (m) { P.meta = m; home(); });
  }).catch(function (e) { $('#mmain').innerHTML = '<div class="mempty"><b>Could not open Links</b><span>' + esc(e.message) + '</span></div>'; });
}
init();
})();
