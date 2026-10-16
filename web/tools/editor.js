/* Editor: tabs, folder list, syntax colours, save with Ctrl+S. Works on the same files as Drive. */
(function () {
'use strict';
var T = window.T, $ = T.$, esc = T.esc;
var MODES = { js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript', ts: { name: 'javascript', typescript: true }, tsx: { name: 'javascript', typescript: true }, json: { name: 'javascript', json: true }, py: 'python', sh: 'shell', bash: 'shell', zsh: 'shell', env: 'properties', ini: 'properties', conf: 'nginx', cfg: 'properties', properties: 'properties', toml: 'toml', yml: 'yaml', yaml: 'yaml', md: 'markdown', markdown: 'markdown', html: 'htmlmixed', htm: 'htmlmixed', xml: 'xml', svg: 'xml', css: 'css', sql: 'sql', diff: 'diff', patch: 'diff', go: 'go', rs: 'rust', php: 'php', rb: 'ruby', c: 'text/x-csrc', h: 'text/x-csrc', cpp: 'text/x-c++src', java: 'text/x-java', cs: 'text/x-csharp', kt: 'text/x-kotlin' };
var BYNAME = { dockerfile: 'dockerfile', 'nginx.conf': 'nginx', '.env': 'properties', '.gitignore': 'properties', makefile: 'shell', '.bashrc': 'shell', '.zshrc': 'shell' };
var BIN = /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|tar|7z|mp3|mp4|mov|webm|wav|woff2?|ttf|exe|bin|sqlite|db)$/i;
var E = { tabs: [], cur: -1, dir: '/', wrap: false, last: '' };
try { E.last = localStorage.getItem('aos.edir') || ''; } catch (x) {}
function modeFor(p) { var b = T.baseOf(p).toLowerCase(), ext = b.indexOf('.') >= 0 ? b.split('.').pop() : ''; return BYNAME[b] || MODES[ext] || null; }
function cm() { return E.cur >= 0 ? E.tabs[E.cur].cm : null; }
function mkCm(host, text, path) {
  var c = CodeMirror(host, { value: text, lineNumbers: true, indentUnit: 2, tabSize: 2, indentWithTabs: false, matchBrackets: true, autoCloseBrackets: true, styleActiveLine: true, lineWrapping: E.wrap, mode: modeFor(path) || 'text/plain', extraKeys: { 'Ctrl-S': save, 'Cmd-S': save, Tab: function (c) { if (c.somethingSelected()) c.indentSelection('add'); else c.replaceSelection('  ', 'end'); } } });
  return c;
}
function tabsHtml() {
  $('#tabs').innerHTML = E.tabs.map(function (t, i) { return '<div class="etab' + (i === E.cur ? ' on' : '') + (t.dirty ? ' dirty' : '') + '" role="tab" data-i="' + i + '"><span data-i="' + i + '">' + esc(T.baseOf(t.path)) + '</span><i></i><button class="x" data-x="' + i + '" aria-label="Close ' + esc(T.baseOf(t.path)) + '">' + T.ic('x') + '</button></div>'; }).join('');
}
function show(i) {
  E.cur = i; E.tabs.forEach(function (t, k) { t.host.hidden = k !== i; });
  $('#empty').hidden = E.tabs.length > 0; tabsHtml(); status();
  if (i >= 0) { var c = E.tabs[i].cm; setTimeout(function () { c.refresh(); c.focus(); }, 0); }
  try { if (parent !== window && i >= 0) parent.postMessage({ aosTool: 'title', title: T.baseOf(E.tabs[i].path) + ' - Editor' }, location.origin); } catch (e) {}
}
function status() {
  var t = E.tabs[E.cur]; if (!t) { $('#stat').textContent = ''; $('#pos').textContent = ''; return; }
  var c = t.cm, p = c.getCursor(), m = c.getMode(); $('#pos').textContent = 'Ln ' + (p.line + 1) + ', Col ' + (p.ch + 1);
  $('#stat').innerHTML = '<span>' + esc(t.path) + '</span><span>' + esc(m.name === 'null' ? 'Plain text' : (m.helperType || m.name)) + '</span><span>' + c.lineCount() + ' lines</span>' + (t.dirty ? '<span style="color:var(--accent-text)">Unsaved changes</span>' : '');
}
function open(path) {
  path = String(path || '').replace(/\/+/g, '/'); if (!path) return;
  for (var i = 0; i < E.tabs.length; i++) if (E.tabs[i].path === path) return show(i);
  if (BIN.test(path)) return T.toast('That is not a text file. Open it from Drive instead.');
  T.fs.read(path).then(function (txt) { add(path, txt, false); }).catch(function (e) { T.toast(e.message); });
}
function add(path, txt, dirty) {
  var host = document.createElement('div'); host.style.cssText = 'position:absolute;inset:0'; $('#box').appendChild(host);
  var c = mkCm(host, txt, path), t = { path: path, cm: c, host: host, dirty: !!dirty, gen: c.changeGeneration(), isNew: !!dirty };
  c.on('change', function () { var d = !c.isClean(t.gen); if (d !== t.dirty) { t.dirty = d; tabsHtml(); } status(); });
  c.on('cursorActivity', status); E.tabs.push(t); show(E.tabs.length - 1); if (!dirty) { try { localStorage.setItem('aos.edir', T.dirOf(path)); } catch (x) {} }
}
function save() {
  var t = E.tabs[E.cur]; if (!t) return; var txt = t.cm.getValue();
  T.fs.write(t.path, txt, 'text/plain', true).then(function () { t.gen = t.cm.changeGeneration(); t.dirty = false; t.isNew = false; tabsHtml(); status(); T.toast('Saved ' + T.baseOf(t.path)); }).catch(function (e) { T.toast(e.message); });
}
function closeTab(i) {
  var t = E.tabs[i]; if (t.dirty && !t.sure) { t.sure = true; T.toast('Unsaved changes. Press close again to discard them.'); return; }
  t.host.remove(); E.tabs.splice(i, 1);
  if (!E.tabs.length) { E.cur = -1; return show(-1); }
  show(Math.max(0, Math.min(E.cur >= i ? E.cur - 1 : E.cur, E.tabs.length - 1)));
}
function tree(dir) {
  E.dir = dir; $('#crumb').textContent = dir;
  T.fs.list(dir).then(function (l) {
    l.sort(function (a, b) { return (b.is_dir - a.is_dir) || a.name.localeCompare(b.name); });
    $('#tree').innerHTML = (dir !== '/' ? '<button class="trow" data-dir="' + esc(T.dirOf(dir)) + '">' + T.ic('up') + '<span>..</span></button>' : '') + l.map(function (f) { return '<button class="trow' + (E.tabs[E.cur] && E.tabs[E.cur].path === f.path ? ' on' : '') + '" data-' + (f.is_dir ? 'dir' : 'file') + '="' + esc(f.path) + '">' + T.ic(f.is_dir ? 'folder' : 'file') + '<span>' + esc(f.name) + '</span></button>'; }).join('') || '<p class="tmuted" style="padding:12px">This folder is empty.</p>';
  }).catch(function (e) { $('#tree').innerHTML = '<p class="tmuted" style="padding:12px">' + esc(e.message) + '</p>'; });
}
function newFile() {
  var r = $('#newrow'); if (r) { r.remove(); return; }
  r = document.createElement('div'); r.id = 'newrow'; r.className = 'tbar'; r.innerHTML = '<input class="tin" id="newname" placeholder="notes.md or /Drive/script.sh" aria-label="New file name" style="flex:1"><button class="tb pri" id="newok">Create</button><button class="tb" id="newno">Cancel</button>';
  $('.tbar').after(r); var inp = $('#newname'); inp.focus();
  var go = function () { var n = inp.value.trim(); if (!n || /\\/.test(n)) return T.toast('Type a plain file name'); r.remove(); add(n.charAt(0) === '/' ? n.replace(/\/+/g, '/') : T.join(E.dir, n), '', true); };
  $('#newok').onclick = go; $('#newno').onclick = function () { r.remove(); }; inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); if (e.key === 'Escape') r.remove(); });
}
function find() {
  var c = cm(); if (!c) return; var q = $('#gofind').value; if (!q) return; var cur = c.getCursor('to'), s = c.getSearchCursor(q, cur, { caseFold: true });
  if (!s.findNext()) { s = c.getSearchCursor(q, { line: 0, ch: 0 }, { caseFold: true }); if (!s.findNext()) return T.toast('Not found'); }
  c.setSelection(s.from(), s.to()); c.scrollIntoView({ from: s.from(), to: s.to() }, 80);
}
function init() {
  $('#bsave').innerHTML = T.ic('save') + '<span>Save</span>'; $('#bnew').innerHTML = T.ic('plus') + '<span>New</span>'; $('#bside').innerHTML = T.ic('folder'); $('#bwrap').innerHTML = T.ic('wrap') + '<span>Wrap</span>'; $('#bgo').innerHTML = T.ic('search');
  $('#bsave').onclick = save; $('#bnew').onclick = newFile; $('#bside').onclick = function () { var s = $('#side'); s.hidden = !s.hidden; };
  $('#bwrap').onclick = function () { E.wrap = !E.wrap; this.classList.toggle('on', E.wrap); this.setAttribute('aria-pressed', E.wrap); E.tabs.forEach(function (t) { t.cm.setOption('lineWrapping', E.wrap); }); };
  $('#bgo').onclick = find; $('#gofind').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); find(); } });
  $('#tree').addEventListener('click', function (e) { var b = e.target.closest('.trow'); if (!b) return; if (b.dataset.dir !== undefined) tree(b.dataset.dir); else open(b.dataset.file); });
  $('#tabs').addEventListener('click', function (e) { var x = e.target.closest('[data-x]'); if (x) return closeTab(+x.dataset.x); var t = e.target.closest('[data-i]'); if (t) show(+t.dataset.i); });
  document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && cm()) { e.preventDefault(); $('#gofind').focus(); $('#gofind').select(); } });
  window.addEventListener('beforeunload', function (e) { if (E.tabs.some(function (t) { return t.dirty; })) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('message', function (e) { if (e.origin === location.origin && e.data && e.data.aosTool === 'open') open(e.data.path); });
  var f = T.q('path'); tree(f ? T.dirOf(f) : E.last || '/'); if (f) open(f); else $('#empty').hidden = false;
  if (matchMedia('(max-width:620px)').matches) $('#side').hidden = !!f;
}
init();
})();
