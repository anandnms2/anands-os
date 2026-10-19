/* Email app: Gmail-style folders (Promotions, Social, Updates, Forums, your labels, All Mail) next to Inbox/Archive/Trash,
 * a scrollable sidebar, and a resizable reading pane (message opens on the right of the list on wide screens).
 * Runs before the app starts; the app's bundle is patched at build time to read window.__aosBoxes/__aosDirs/__aosActs. */
(function () {
  window.__aosBoxes = { main: [], labels: [] }; window.__aosDirs = {}; window.__aosActs = {};
  try {
    var st = document.createElement('style');
    st.textContent = [
      '.app-body{min-height:0}.app-frame{max-height:100vh}',
      '.sidebar{overflow-y:auto!important;overflow-x:hidden;padding-bottom:84px!important;overscroll-behavior:contain;scrollbar-width:thin;min-height:0}',
      '.sidebar>*{flex-shrink:0!important}',
      '.sidebar .nav-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1}',
      '.nav-head{margin:14px 0 4px;padding:0 16px 0 14px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;opacity:.65}',
      '.split-h{display:none}',
      '@media (min-width:900px){',
      '.reading .card{flex-direction:row!important}',
      '.reading .list-view{display:flex!important;flex:0 0 var(--lw,40%)!important;width:var(--lw,40%);min-width:280px;max-width:75%}',
      '.reading .message-view{flex:1 1 0!important;min-width:320px;border-left:1px solid rgba(128,128,128,.25)}',
      '.reading .split-h{display:block;flex:none;width:7px;margin:0 -4px 0 -3px;z-index:5;cursor:col-resize;position:relative;touch-action:none}',
      '.reading .split-h:hover,.split-h.drag{background:rgba(74,144,226,.25)}',
      '}'
    ].join('\n');
    document.head.appendChild(st);
  } catch (e) {}
  try {
    var x = new XMLHttpRequest(); x.open('GET', '/api/mailboxes/boxes', false); x.withCredentials = true; x.setRequestHeader('x-aos', '1'); x.send();
    if (x.status === 200) { var b = JSON.parse(x.responseText); window.__aosBoxes = { main: b.main || [], labels: b.labels || [] }; window.__aosDirs = b.dirs || {}; window.__aosActs = b.acts || {}; }
  } catch (e) {}
  /* Gmail-style sidebar order (Inbox, Starred, Sent, Drafts, Archive, All Mail, Trash, Categories, Labels at the bottom) and a resizable reading panel. */
  function setup() {
    var nav = document.querySelector('nav.sidebar'), card = document.querySelector('.app-body .card'); if (!nav || !card) return false;
    var items = {}; nav.querySelectorAll('.nav-item').forEach(function (b) { var l = b.querySelector('.nav-label'); if (l) items[l.textContent.trim()] = b; });
    var take = function (n) { var b = items[n]; delete items[n]; return b; }, head = function (t) { var d = document.createElement('div'); d.className = 'nav-head'; d.textContent = t; return d; };
    var out = []; ['Inbox', 'Starred', 'Sent', 'Drafts', 'Archive', 'All Mail', 'Trash'].forEach(function (n) { var b = take(n); if (b) out.push(b); });
    var cats = ['Social', 'Updates', 'Forums', 'Promotions'].map(take).filter(Boolean); if (cats.length) { out.push(head('Categories')); out = out.concat(cats); }
    var rest = Object.keys(items); var labs = (window.__aosBoxes && window.__aosBoxes.labels || []).map(function (l) { return l.label.trim(); });
    var lb = Object.keys(items).filter(function (n) { return labs.indexOf(n) >= 0; }).map(take), other = Object.keys(items).map(take);
    out = out.concat(other); if (lb.length) { out.push(head('Labels')); out = out.concat(lb); }
    out.forEach(function (n) { nav.appendChild(n); });
    var list = card.querySelector('.list-view'), h = document.createElement('div'); h.className = 'split-h'; h.title = 'Drag to resize'; if (list && list.nextSibling) card.insertBefore(h, list.nextSibling); else card.appendChild(h);
    try { var w = localStorage.getItem('aos-mail-lw'); if (w) card.style.setProperty('--lw', w); } catch (e) {}
    h.addEventListener('pointerdown', function (ev) { ev.preventDefault(); h.setPointerCapture(ev.pointerId); h.classList.add('drag'); var r = card.getBoundingClientRect();
      var mv = function (e) { var p = Math.max(280, Math.min(e.clientX - r.left, r.width * .75, r.width - 340)); card.style.setProperty('--lw', p + 'px'); };
      var up = function () { h.classList.remove('drag'); h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); try { localStorage.setItem('aos-mail-lw', card.style.getPropertyValue('--lw')); } catch (e) {} };
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); });
    h.addEventListener('dblclick', function () { card.style.removeProperty('--lw'); try { localStorage.removeItem('aos-mail-lw'); } catch (e) {} });
    return true;
  }
  var tries = 0, iv = setInterval(function () { if (setup() || ++tries > 100) clearInterval(iv); }, 100);
})();
