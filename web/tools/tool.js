/* Shared helpers for the built-in OS tools (editor, player, recorder, terminal). Each tool is its own page that opens in a Desktop window. */
(function () {
'use strict';
var T = window.T = {};
T.$ = function (s, r) { return (r || document).querySelector(s); };
T.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
T.q = function (k) { return new URLSearchParams(location.search).get(k) || ''; };
T.api = function (path, o) {
  o = o || {}; var h = { 'x-aos': '1' }, init = { method: o.method || 'GET', credentials: 'same-origin', headers: h };
  if (o.json !== undefined) { init.body = JSON.stringify(o.json); h['content-type'] = 'application/json'; }
  if (o.body !== undefined) init.body = o.body; if (o.headers) Object.keys(o.headers).forEach(function (k) { h[k] = o.headers[k]; });
  return fetch(path, init).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (j) {
      if (r.status === 401) { T.toast('Your session ended. Sign in again.'); }
      if (!r.ok) { var e = new Error(j.error || r.statusText); e.status = r.status; throw e; } return j;
    });
  });
};
T.fs = {
  list: function (p) { return T.api('/_local/fs/readdir', { method: 'POST', json: { path: p } }); },
  stat: function (p) { return T.api('/_local/fs/stat', { method: 'POST', json: { path: p } }); },
  mkdir: function (p) { return T.api('/_local/fs/mkdir', { method: 'POST', json: { path: p, parents: true } }); },
  del: function (p) { return T.api('/_local/fs/delete', { method: 'POST', json: { path: p } }); },
  url: function (p) { return '/_local/fs/get?path=' + encodeURIComponent(p); },
  read: function (p) { return fetch(T.fs.url(p), { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(r.status === 404 ? 'File not found' : 'Could not open the file'); return r.text(); }); },
  write: function (p, body, type, overwrite) { return fetch('/_local/fs/write?path=' + encodeURIComponent(p) + '&overwrite=' + (overwrite === false ? '0' : '1'), { method: 'POST', credentials: 'same-origin', headers: { 'x-aos': '1', 'content-type': type || 'text/plain' }, body: body }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Could not save'); return j; }); }); }
};
T.dirOf = function (p) { var i = p.lastIndexOf('/'); return i <= 0 ? '/' : p.slice(0, i); };
T.baseOf = function (p) { return p.slice(p.lastIndexOf('/') + 1); };
T.join = function (a, b) { return (a === '/' ? '' : a.replace(/\/$/, '')) + '/' + b; };
var tt; T.toast = function (m) { var t = T.$('#tt'); if (!t) { t = document.createElement('div'); t.id = 'tt'; t.className = 'ttoast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('on'); }, 2800); };
/* follow the OS theme and accent from the parent window */
try { if (parent !== window) { var pd = parent.document.documentElement, th = pd.getAttribute('data-theme'); if (th) document.documentElement.setAttribute('data-theme', th); var pl = parent.document.getElementById('lookcss'); if (pl) { var st = document.createElement('style'); st.textContent = pl.textContent; document.head.appendChild(st); } } } catch (e) {}
T.ic = function (n) {
  var P = { save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8M8 21v-7h8v7"/>', folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>', plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', up: '<path d="m6 15 6-6 6 6"/>', play: '<path d="M7 4v16l13-8z"/>', pause: '<path d="M8 4v16M16 4v16"/>', next: '<path d="M6 4v16l10-8zM18 4v16"/>', prev: '<path d="M18 4v16L8 12zM6 4v16"/>', rec: '<circle cx="12" cy="12" r="6"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>', mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', shuffle: '<path d="M3 6h4l10 12h4M3 18h4l3-4M14 8l3-2h4M18 3l3 3-3 3M18 15l3 3-3 3"/>', rep: '<path d="M17 2l3 3-3 3M3 11V9a4 4 0 0 1 4-4h13M7 22l-3-3 3-3M21 13v2a4 4 0 0 1-4 4H4"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', vol: '<path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6"/>', down: '<path d="M12 4v12m-5-5 5 5 5-5M5 20h14"/>', refresh: '<path d="M20 11a8 8 0 0 0-14-4M4 5v4h4M4 13a8 8 0 0 0 14 4M20 19v-4h-4"/>', wrap: '<path d="M3 6h18M3 12h14a3 3 0 0 1 0 6h-4m0 0 2-2m-2 2 2 2M3 18h5"/>' };
  return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || '') + '</svg>';
};
T.fmtSize = function (n) { n = +n || 0; return n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; };
/* Desktop shortcuts: window-level keys pressed inside an app window are passed up to the Desktop */
if (window.parent !== window) {
  var fwd = function (e) {
    if (!(e.altKey || e.metaKey || e.key === 'Meta' || e.key === 'Alt' || (e.ctrlKey && e.key === 'Escape') || e.key === 'F1' || (e.ctrlKey && e.key === '/'))) return;
    var ed = !!(e.getModifierState && e.getModifierState('AltGraph'));
    try { window.parent.postMessage({ aosKey: { t: e.type, key: e.key, alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey, meta: e.metaKey, edit: ed } }, location.origin); } catch (x) {}
    if (e.type === 'keydown' && (e.key === 'F1' || (e.altKey && (e.key === 'Tab' || /^F(4|9|10)$/.test(e.key))))) e.preventDefault();
  };
  document.addEventListener('keydown', fwd, true); document.addEventListener('keyup', fwd, true);
}
})();
