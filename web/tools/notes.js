/* Notes inside Anands OS: your Joplin notes, notebooks, tags and to-dos. The OS server holds the login. */
(function () {
'use strict';
var T = window.T, $ = T.$, esc = T.esc;
var P = { st: null, meta: null, view: 'all', folder: '', tag: '', q: '', list: [], next: null, total: 0, cur: null, prev: false, seq: 0, dirty: false, saving: false };
var api = function (m, p, b) { return T.api('/api/joplin' + p, { method: m, json: b }); };
function err(e) { T.toast(e && e.message ? e.message : 'Something went wrong'); }
function lookup(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
function title(t) { try { if (parent !== window) parent.postMessage({ aosTool: 'title', title: t }, location.origin); } catch (e) {} }
function modal(html, run) { var m = $('#mmodal'); m.innerHTML = '<div class="mbox" role="dialog" aria-modal="true">' + html + '</div>'; m.hidden = false; if (run) run(); }
function close() { var m = $('#mmodal'); m.hidden = true; m.innerHTML = ''; }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#mmodal').hidden) { close(); e.stopPropagation(); } });
$('#mmodal').addEventListener('mousedown', function (e) { if (e.target === this) close(); });
function ago(ms) { var d = Math.round((Date.now() - ms) / 60000); if (d < 1) return 'just now'; if (d < 60) return d + ' min ago'; if (d < 1440) return Math.round(d / 60) + ' h ago'; return new Date(ms).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }); }

/* small safe markdown */
function md(src) {
  var lines = String(src).split('\n'), out = [], inCode = false, code = [], list = false;
  function inl(s) { s = esc(s); s = s.replace(/!\[([^\]]*)\]\(:\/([0-9a-f]{32})\)/g, '<img src="/api/joplin/res/$2" alt="$1" loading="lazy" style="max-width:100%">').replace(/\[([^\]]+)\]\(:\/([0-9a-f]{32})\)/g, '<a href="/api/joplin/res/$2" target="_blank" rel="noopener">$1</a>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>'); return s; }
  function endList() { if (list) { out.push('</ul>'); list = false; } }
  lines.forEach(function (l) {
    if (/^```/.test(l)) { if (inCode) { out.push('<pre>' + esc(code.join('\n')) + '</pre>'); code = []; inCode = false; } else { endList(); inCode = true; } return; }
    if (inCode) { code.push(l); return; }
    var h = l.match(/^(#{1,3})\s+(.*)$/); if (h) { endList(); out.push('<h' + h[1].length + '>' + inl(h[2]) + '</h' + h[1].length + '>'); return; }
    var li = l.match(/^\s*[-*]\s+(\[( |x)\]\s+)?(.*)$/); if (li) { if (!list) { out.push('<ul style="list-style:none;padding-left:4px">'); list = true; } out.push('<li>' + (li[1] ? '<input type="checkbox" disabled' + (li[2] === 'x' ? ' checked' : '') + '> ' : '&bull; ') + inl(li[3]) + '</li>'); return; }
    endList(); if (/^>\s?/.test(l)) { out.push('<blockquote>' + inl(l.replace(/^>\s?/, '')) + '</blockquote>'); return; }
    if (l.trim() === '') { out.push(''); return; } out.push('<p>' + inl(l) + '</p>');
  });
  endList(); if (inCode) out.push('<pre>' + esc(code.join('\n')) + '</pre>'); return out.join('\n');
}

/* sidebar */
function tree(folders) {
  var out = [], ids = {}; folders.forEach(function (f) { ids[f.id] = 1; });
  (function add(par, d) { folders.forEach(function (f) { if (f.parent === par || (par === '' && f.parent && !ids[f.parent])) { out.push(Object.assign({ depth: d }, f)); add(f.id, d + 1); } }); })('', 0);
  return out;
}
function nav() {
  var m = P.meta || { folders: [], tags: [], counts: { all: 0, todo: 0, trash: 0 } };
  function tab(v, label, n, ic) { return '<button data-tab="' + v + '"' + (P.view === v && !P.folder && !P.tag ? ' aria-current="page"' : '') + '>' + T.ic(ic) + label + (n ? ' <span class="tmuted">(' + n + ')</span>' : '') + '</button>'; }
  $('#mnav').innerHTML = '<div class="brand"><img src="/oicons/notes.svg" alt="">Notes</div>' + tab('all', 'All notes', m.counts.all, 'file') + tab('todo', 'To-dos', m.counts.todo, 'list') + tab('trash', 'Trash', m.counts.trash, 'trash') +
    '<button data-a="newfolder">' + T.ic('plus') + 'New notebook</button>' +
    (m.folders.length ? '<div class="pl-side"><div class="hd">Notebooks</div>' + tree(m.folders).map(function (f) { return '<button class="pl-t" data-a="folder" data-id="' + f.id + '" aria-pressed="' + (P.folder === f.id) + '" style="padding-left:' + (10 + f.depth * 14) + 'px"><i style="background:#f68712"></i><span>' + esc(f.title) + '</span><small class="tmuted">' + f.count + '</small></button>'; }).join('') + '</div>' : '') +
    (m.tags.length ? '<div class="pl-side"><div class="hd">Tags</div>' + m.tags.slice(0, 60).map(function (t) { return '<button class="pl-t" data-a="tag" data-id="' + t.id + '" aria-pressed="' + (P.tag === t.id) + '"><b class="tmuted" style="width:10px;text-align:center">#</b><span>' + esc(t.title) + '</span><small class="tmuted">' + t.count + '</small></button>'; }).join('') + '</div>' : '') +
    '<a class="mbtn" style="margin-top:auto;justify-content:center" href="' + esc((P.st && P.st.url) || '#') + '" target="_blank" rel="noopener">Open Joplin Server</a>';
}
function heading() {
  var m = P.meta || { folders: [], tags: [] }, f = P.folder ? lookup(m.folders, P.folder) : null, t = P.tag ? lookup(m.tags, P.tag) : null;
  if (f) return esc(f.title); if (t) return '#' + esc(t.title); return P.view === 'todo' ? 'To-dos' : P.view === 'trash' ? 'Trash' : 'All notes';
}

/* list column */
function layout() {
  nav(); $('#mmain').innerHTML = '<div class="nt-wrap' + (P.cur ? ' open' : '') + '" id="ntw"><section class="nt-list" aria-label="Notes"><div class="nt-top"><div class="row"><h1 id="nth">' + heading() + '</h1><button class="mbtn pri" data-a="newnote">' + T.ic('plus') + 'Note</button><button class="mbtn" data-a="newtodo" title="New to-do">' + T.ic('list') + '</button></div>' +
    '<label class="pl-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input class="tin" id="ntq" type="search" placeholder="Search notes" value="' + esc(P.q) + '" aria-label="Search notes"></label></div><div class="nt-items" id="nti"></div></section><section class="nt-ed" id="nte"></section></div>';
  var tm; $('#ntq').oninput = function () { var v = this.value; clearTimeout(tm); tm = setTimeout(function () { P.q = v.trim(); loadList(); }, 280); };
  title('Notes'); paintList(); paintEditor(); loadList();
}
function paintList() {
  var r = $('#nti'); if (!r) return;
  if (!P.list.length) { r.innerHTML = '<div class="nt-empty"><div><b>' + (P.q ? 'Nothing matches' : P.view === 'trash' ? 'Trash is empty' : 'No notes here yet') + '</b><br>' + (P.q ? 'Try fewer words.' : P.view === 'trash' ? '' : 'Press Note to write the first one.') + '</div></div>'; return; }
  r.innerHTML = P.list.map(function (n) {
    return '<div class="nt-item' + (n.done ? ' done' : '') + '" tabindex="0" data-a="open" data-id="' + n.id + '" role="button" aria-current="' + (P.cur && P.cur.id === n.id) + '">' + (n.todo ? '<input type="checkbox" class="ck" data-a="tick" data-id="' + n.id + '"' + (n.done ? ' checked' : '') + ' aria-label="Done">' : '') +
      '<div class="g"><b>' + esc(n.title) + '</b><small>' + ago(n.updated) + (n.snippet ? ' &middot; ' + esc(n.snippet) : '') + '</small></div></div>';
  }).join('') + (P.next ? '<div class="pl-pg"><button class="mbtn" data-a="more">Load more</button></div>' : '');
}
function loadList(more) {
  var seq = ++P.seq, qs = ['view=' + P.view]; if (P.q) qs.push('q=' + encodeURIComponent(P.q)); if (P.folder) qs.push('folder=' + P.folder); if (P.tag) qs.push('tag=' + P.tag); if (more && P.next) qs.push('offset=' + P.next);
  api('GET', '/notes?' + qs.join('&')).then(function (d) { if (seq !== P.seq) return; P.list = more ? P.list.concat(d.results) : d.results; P.next = d.next; P.total = d.total; paintList(); }).catch(function (e) {
    if (seq !== P.seq) return; if (e.status === 409) { P.st.connected = false; return setup(e.message); } var r = $('#nti'); if (r) r.innerHTML = '<div class="nt-empty"><div><b>Could not load notes</b><br>' + esc(e.message) + '</div></div>'; });
}
function refreshMeta() { return api('GET', '/meta').then(function (m) { P.meta = m; nav(); }).catch(function () {}); }

/* editor */
function paintEditor() {
  var e = $('#nte'); if (!e) return; var n = P.cur;
  if (!n) { e.innerHTML = '<div class="nt-empty"><div>Pick a note or start a new one.</div></div>'; return; }
  var m = P.meta || { folders: [] };
  if (n.locked) { e.innerHTML = '<div class="nt-bar"><button class="mbtn nt-back" data-a="back">Back</button></div><div class="nt-lock"><b>This note is locked.</b><p>It is protected by end-to-end encryption in Joplin, so it cannot be read here. Open it in the Joplin app.</p></div>'; return; }
  e.innerHTML = '<div class="nt-bar"><button class="mbtn nt-back" data-a="back">Back</button><select class="tin" id="ntf" aria-label="Notebook">' + tree(m.folders).map(function (f) { return '<option value="' + f.id + '"' + (f.id === n.folder ? ' selected' : '') + '>' + '  '.repeat(f.depth) + esc(f.title) + '</option>'; }).join('') + '</select>' +
    '<label class="nt-st"><input type="checkbox" id="ntt"' + (n.todo ? ' checked' : '') + '> To-do</label><span class="sp"></span><span class="nt-st" id="nts"></span>' +
    (n.trashed ? '' : '<button class="mbtn" data-a="sketch" title="Draw a sketch and add it to this note">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Sketch</button>') + '<button class="mbtn" data-a="preview">' + (P.prev ? 'Edit' : 'Preview') + '</button>' + (n.trashed ? '<button class="mbtn pri" data-a="restore">Restore</button>' : '<button class="mbtn" data-a="trash" title="Move to trash">' + T.ic('trash') + '</button>') + '</div>' +
    '<input class="nt-title" id="ntti" maxlength="300" placeholder="Title" value="' + esc(n.title) + '" aria-label="Title"' + (n.trashed ? ' disabled' : '') + '>' +
    '<div class="nt-tags"><input id="ntg" placeholder="# tags, separated by commas" value="' + esc(n.tags.map(function (t) { return t.title; }).join(', ')) + '" aria-label="Tags"' + (n.trashed ? ' disabled' : '') + '></div>' +
    (P.prev ? '<div class="nt-prev" id="ntp">' + md(n.body) + '</div>' : '<textarea class="nt-body" id="ntb" aria-label="Note text" placeholder="Write here. Markdown works."' + (n.trashed ? ' disabled' : '') + '>' + esc(n.body) + '</textarea>');
  if (n.trashed) return;
  var tm; function queue() { P.dirty = true; status('Typing...'); clearTimeout(tm); tm = setTimeout(save, 900); }
  $('#ntti').oninput = function () { n.title = this.value; queue(); }; $('#ntg').oninput = queue;
  if ($('#ntb')) $('#ntb').oninput = function () { n.body = this.value; queue(); };
  $('#ntf').onchange = function () { n.folder = this.value; queue(); }; $('#ntt').onchange = function () { n.todo = this.checked; queue(); };
}
function status(t) { var s = $('#nts'); if (s) s.textContent = t; }
function save() {
  var n = P.cur; if (!n || n.locked || n.trashed || !P.dirty) return; if (P.saving) { setTimeout(save, 400); return; }
  P.dirty = false; P.saving = true; status('Saving...');
  var tags = ($('#ntg') ? $('#ntg').value : n.tags.map(function (t) { return t.title; }).join(',')).split(',').map(function (s) { return s.replace(/^#/, '').trim(); }).filter(Boolean);
  api('PUT', '/notes/' + n.id, { title: n.title, body: n.body, folder: n.folder, todo: n.todo, tags: tags, base: n.rev }).then(function (r) {
    P.saving = false; if (P.cur && P.cur.id === r.id) { P.cur.rev = r.rev; P.cur.tags = r.tags; } status('Saved'); var i = lookup(P.list, r.id); if (i) { i.title = r.title; i.updated = r.updated; i.todo = r.todo; i.done = r.done; i.snippet = (r.body || '').replace(/[#>*`_\[\]()!-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160); paintList(); } refreshMeta();
  }).catch(function (e) { P.saving = false; P.dirty = true; status(e.message || 'Could not save'); if (e.status === 409) { modal('<h2>Note changed elsewhere</h2><p style="color:var(--muted)">' + esc(e.message) + '</p><div class="acts"><button class="mbtn pri" data-a="reload">Reload note</button></div>'); } });
}
function openNote(id) {
  if (P.dirty) save();
  api('GET', '/notes/' + id).then(function (n) { P.cur = n; P.prev = false; var w = $('#ntw'); if (w) w.classList.add('open'); paintList(); paintEditor(); }).catch(err);
}
function create(todo) {
  var m = P.meta || { folders: [] }, f = P.folder || (m.folders[0] && m.folders[0].id) || '';
  if (!f) return A.newfolder();
  api('POST', '/notes', { title: todo ? 'New to-do' : 'New note', body: '', folder: f, todo: !!todo }).then(function (n) { P.view = P.view === 'trash' ? 'all' : P.view; P.cur = n; P.prev = false; refreshMeta(); loadList(); var w = $('#ntw'); if (w) w.classList.add('open'); paintEditor(); var t = $('#ntti'); if (t) { t.focus(); t.select(); } }).catch(err);
}
function setup(why) {
  var s = P.st || {}, noUrl = !s.configured;
  $('#mnav').innerHTML = '<div class="brand"><img src="/oicons/notes.svg" alt="">Notes</div>';
  $('#mmain').innerHTML = '<div class="mc pl-setup" style="margin:30px auto"><h2 style="font-size:22px">' + (noUrl ? 'Connect Notes' : 'One more step') + '</h2><p style="margin:0;color:var(--muted)">' + esc(why || 'Anands OS reads your Joplin notes and shows them here. Your password stays on the server.') + '</p><ol>' +
    '<li><b>Address.</b> ' + (noUrl ? 'Add your Notes address in Settings.' : 'Using ' + esc(s.url) + '.') + '</li>' +
    '<li><b>Login.</b> Enter the email and password of your Joplin Server account in Settings under Notes. Use an account without two-step login.</li>' +
    '<li><b>Come back</b> and press Check connection.</li></ol><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="mbtn pri" href="/#settings" target="_top">Open Settings</a><button class="mbtn" data-a="retry">Check connection</button></div></div>';
  title('Notes');
}

var A = { close: close };
A.open = function (b) { openNote(b.dataset.id); }; A.back = function () { if (P.dirty) save(); P.cur = null; var w = $('#ntw'); if (w) w.classList.remove('open'); paintList(); paintEditor(); };
A.more = function () { loadList(true); }; A.retry = function () { init(); }; A.reload = function () { close(); if (P.cur) openNote(P.cur.id); };
A.newnote = function () { create(false); }; A.newtodo = function () { create(true); };
A.preview = function () { if (P.cur) { P.prev = !P.prev; paintEditor(); } };
A.folder = function (b) { P.folder = P.folder === b.dataset.id ? '' : b.dataset.id; P.tag = ''; P.view = 'all'; P.cur = null; layout(); };
A.tag = function (b) { P.tag = P.tag === b.dataset.id ? '' : b.dataset.id; P.folder = ''; P.view = 'all'; P.cur = null; layout(); };
A.tick = function (b, e) { e.stopPropagation(); var id = b.dataset.id, on = b.checked; api('PUT', '/notes/' + id, { done: on }).then(function () { var i = lookup(P.list, id); if (i) i.done = on; if (P.cur && P.cur.id === id) P.cur.done = on; refreshMeta(); if (P.view === 'todo') loadList(); else paintList(); }).catch(function (x) { b.checked = !on; err(x); }); };
A.trash = function () { var n = P.cur; if (!n) return; P.dirty = false; api('POST', '/notes/' + n.id + '/trash').then(function () { T.toast('Moved to trash'); P.cur = null; refreshMeta(); loadList(); paintEditor(); var w = $('#ntw'); if (w) w.classList.remove('open'); }).catch(err); };
A.restore = function () { var n = P.cur; if (!n) return; api('POST', '/notes/' + n.id + '/restore').then(function () { T.toast('Restored'); P.cur = null; refreshMeta(); loadList(); paintEditor(); }).catch(err); };
A.sketch = function () {
  var n = P.cur; if (!n || n.trashed || n.locked) return;
  var W = 960, H = 600, col = '#111111', size = 4, erase = false, snaps = [], drawing = false, last = null, COLORS = ['#111111', '#f68712', '#2563eb', '#dc2626', '#16a34a'];
  modal('<h2>Sketch</h2><div class="nt-sktools" id="skt">' + COLORS.map(function (c, i) { return '<button type="button" class="nt-sw' + (i === 0 ? ' on' : '') + '" data-c="' + c + '" style="background:' + c + '" aria-label="Colour ' + (i + 1) + '"></button>'; }).join('') +
    '<select id="sks" class="tin" aria-label="Pen size"><option value="2">Fine</option><option value="4" selected>Medium</option><option value="9">Thick</option></select><button type="button" class="mbtn" id="ske">Eraser</button><button type="button" class="mbtn" id="sku">Undo</button><button type="button" class="mbtn" id="skc">Clear</button></div>' +
    '<canvas id="skv" width="' + W + '" height="' + H + '" aria-label="Drawing area"></canvas><div class="err" id="ske2" role="alert"></div><div class="acts"><button class="mbtn" data-a="close">Cancel</button><button class="mbtn pri" id="sksv">Add to note</button></div>', function () {
      var box = document.querySelector('#mmodal .mbox'); box.classList.add('nt-sk');
      var cv = $('#skv'), cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H); cx.lineCap = 'round'; cx.lineJoin = 'round';
      function snap() { snaps.push(cx.getImageData(0, 0, W, H)); if (snaps.length > 25) snaps.shift(); }
      function pt(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, p: e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5 }; }
      cv.addEventListener('pointerdown', function (e) { e.preventDefault(); cv.setPointerCapture(e.pointerId); snap(); drawing = true; last = pt(e); seg(last, last, e); });
      cv.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pt(e); seg(last, p, e); last = p; });
      function seg(a, b, e) { cx.strokeStyle = erase ? '#fff' : col; var w = erase ? size * 3 : e.pointerType === 'pen' ? size * (0.4 + b.p * 1.4) : size; cx.lineWidth = w; cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x + 0.01, b.y); cx.stroke(); }
      ['pointerup', 'pointercancel'].forEach(function (t) { cv.addEventListener(t, function () { drawing = false; }); });
      $('#skt').addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (!b) return; col = b.dataset.c; erase = false; $('#ske').classList.remove('pri'); Array.prototype.forEach.call(document.querySelectorAll('#skt .nt-sw'), function (x) { x.classList.toggle('on', x === b); }); });
      $('#sks').onchange = function () { size = +this.value; }; $('#ske').onclick = function () { erase = !erase; this.classList.toggle('pri', erase); };
      $('#sku').onclick = function () { var s = snaps.pop(); if (s) cx.putImageData(s, 0, 0); }; $('#skc').onclick = function () { snap(); cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H); };
      $('#sksv').onclick = function () {
        var b = $('#sksv'); b.disabled = true; $('#ske2').textContent = '';
        cv.toBlob(function (blob) {
          fetch('/api/joplin/resources?name=sketch', { method: 'POST', credentials: 'same-origin', headers: { 'x-aos': '1', 'content-type': 'image/png' }, body: blob }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.message || d.error || 'Could not save the sketch'); return d; }); }).then(function (d) {
            close(); if (P.prev) { P.prev = false; paintEditor(); } var ta = $('#ntb'); if (!ta) return; var a = ta.selectionStart || ta.value.length, ins = (a > 0 && ta.value[a - 1] !== '\n' ? '\n\n' : '') + d.markdown + '\n\n';
            ta.value = ta.value.slice(0, a) + ins + ta.value.slice(ta.selectionEnd || a); ta.selectionStart = ta.selectionEnd = a + ins.length; ta.dispatchEvent(new Event('input')); T.toast('Sketch added');
          }).catch(function (e) { b.disabled = false; $('#ske2').textContent = e.message; });
        }, 'image/png');
      };
    });
};
A.newfolder = function () {
  var m = P.meta || { folders: [] };
  modal('<h2>New notebook</h2><label>Name<input class="tin" id="fn" maxlength="200"></label><label>Inside<select id="fp" class="tin"><option value="">Top level</option>' + tree(m.folders).map(function (f) { return '<option value="' + f.id + '">' + '  '.repeat(f.depth) + esc(f.title) + '</option>'; }).join('') + '</select></label><div class="err" id="fe" role="alert"></div><div class="acts"><button class="mbtn" data-a="close">Cancel</button><button class="mbtn pri" id="fok">Create</button></div>', function () {
    $('#fn').focus(); $('#fok').onclick = function () { api('POST', '/folders', { title: $('#fn').value, parent: $('#fp').value }).then(function (f) { close(); T.toast('Notebook created'); P.folder = f.id; return refreshMeta().then(function () { layout(); }); }).catch(function (e) { $('#fe').textContent = e.message; }); };
  });
};
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-a],[data-tab]'); if (!b) return;
  if (b.dataset.tab) { close(); if (P.dirty) save(); P.view = b.dataset.tab; P.folder = ''; P.tag = ''; P.cur = null; return layout(); }
  if (b.dataset.a === 'open' && e.target.closest('[data-a="tick"]')) return;
  if (A[b.dataset.a]) A[b.dataset.a](b, e);
}, true);
document.addEventListener('keydown', function (e) { var t = e.target; if (e.key === 'Enter' && t.classList && t.classList.contains('nt-item')) { e.preventDefault(); openNote(t.dataset.id); } });
window.addEventListener('beforeunload', function () { if (P.dirty) save(); });
function init() {
  api('GET', '/status').then(function (s) {
    P.st = s; if (!s.connected) return setup(s.reason);
    return api('GET', '/meta').then(function (m) { P.meta = m; layout(); });
  }).catch(function (e) { $('#mmain').innerHTML = '<div class="nt-empty"><div><b>Could not open Notes</b><br>' + esc(e.message) + '</div></div>'; });
}
init();
})();
