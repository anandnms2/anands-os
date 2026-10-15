/* Full browser settings for the Desktop browsers: General, Search, Appearance, Display, Bookmarks, History, Privacy and Advanced.
 * Works for both the simple browser and the full (streamed Chromium) browser; options that only make sense for one say so. */
(function () {
'use strict';
var A = window.AOS; if (!A) return;
var LS = A.LS, esc = A.esc, toast = A.toast, ic = A.ic, $ = A.$;
var BS = window.AOSBS = {};
var BR = function () { return window.AOSBR || {}; };
var LANGS = [['en-US', 'English (US)'], ['en-GB', 'English (UK)'], ['sw', 'Kiswahili'], ['fr', 'Français'], ['ar', 'العربية'], ['hi', 'हिन्दी'], ['pt', 'Português'], ['es', 'Español'], ['de', 'Deutsch']];
var DEF = { brsearch: 'ddg', brsearchcustom: '', brhome: '', brstart: LS.get('brhome', '') ? 'home' : 'new', brbar: true, brhistoff: false, brqual: 'sharp', brzoom: 100, brdark: 'auto', brlang: 'en-US', brmobile: false };
var SECT = [['general', 'General', 'settings'], ['search', 'Search', 'search'], ['appearance', 'Appearance', 'eye'], ['bookmarks', 'Bookmarks', 'star'], ['history', 'History', 'hourglass'], ['privacy', 'Privacy and data', 'shield'], ['advanced', 'Advanced', 'list']];
var isRb = function (w) { return w.kind === 'rbrowser'; };
var norm = function (u) { try { return BR().normUrl ? BR().normUrl(u) : u; } catch (e) { return u; } };
var hostOf = function (u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };

/* ---------- data ---------- */
function bms() { var l = LS.get('brbm', []); return Array.isArray(l) ? l : []; }
function hist() { var l = LS.get('brhist', []); return Array.isArray(l) ? l : []; }
BS.visit = function (u, title) {
  if (!u || !/^https?:/i.test(u) || LS.get('brhistoff', false)) return;
  var h = hist().filter(function (x) { return x.u !== u; }); h.unshift({ u: u, t: String(title || hostOf(u)).slice(0, 120), ts: Date.now() }); LS.set('brhist', h.slice(0, 300));
};
function curUrl(w) { if (isRb(w)) { var t = BR().rbTab && BR().rbTab(w); return t ? t.url : ''; } var b = BR().btab && BR().btab(w); return b ? b.url : ''; }
function curTitle(w) { if (isRb(w)) { var t = BR().rbTab(w); return t ? (t.title || t.url) : ''; } var b = BR().btab(w); return b ? b.title : ''; }
BS.go = function (w, u) {
  if (!u) return; var url = norm(u); if (!url) return;
  if (isRb(w)) BR().rbPost(w, w.r.active ? '/nav' : '/open', { tab: w.r.active, url: url }); else BR().nav(w, BR().btab(w), url);
};
BS.star = function (w) {
  var u = curUrl(w); if (!u) return toast('Open a page first'); var l = bms(), i = l.findIndex(function (x) { return x.u === u; });
  if (i >= 0) { l.splice(i, 1); toast('Bookmark removed'); } else { l.unshift({ u: u, t: String(curTitle(w) || hostOf(u)).slice(0, 80) }); toast('Bookmarked'); }
  LS.set('brbm', l.slice(0, 200)); repaintAll();
};
BS.bar = function (w) {
  var br = w.body.querySelector('.dk-br'); if (!br) return; var el = br.querySelector('.dk-bmw');
  if (!el) { el = document.createElement('div'); el.className = 'dk-bmw'; var bw = br.querySelector('.dk-barw'); bw.parentNode.insertBefore(el, bw.nextSibling); }
  var l = bms(), show = LS.get('brbar', true) && l.length; el.hidden = !show;
  el.innerHTML = show ? l.slice(0, 30).map(function (b) { return '<button class="dk-bm" data-dk="bmgo" data-id="' + w.id + '" data-u="' + esc(b.u) + '" title="' + esc(b.u) + '">' + esc(b.t || hostOf(b.u)) + '</button>'; }).join('') : '';
  var u = curUrl(w), st = w.body.querySelector('.dk-star'); if (st) st.classList.toggle('on', !!u && l.some(function (x) { return x.u === u; }));
};
function repaintAll() { (A.DESK ? A.DESK() : (window.AOSDesk && window.AOSDesk.state.wins) || []).forEach(function (w) { if (w.kind === 'browser' || w.kind === 'rbrowser') { BS.bar(w); var p = w.body.querySelector('.bsx'); if (p) paint(w); } }); }

/* ---------- prefs ---------- */
function pref(k) { return LS.get(k, DEF[k]); }
function pushPrefs(w) { if (!isRb(w)) return; BR().rbPost(w, '/prefs', { dark: pref('brdark'), zoom: pref('brzoom'), lang: pref('brlang'), mobile: pref('brmobile') }, true); BR().rbPost(w, '/quality', { q: pref('brqual') }, true); }
BS.sync = pushPrefs;

/* ---------- panel ---------- */
BS.toggle = function (w) { var old = w.body.querySelector('.bsx'); if (old) { old.remove(); return; } var el = document.createElement('div'); el.className = 'bsx'; w.bs = w.bs || { sec: 'general', hq: '' }; w.body.appendChild(el); paint(w); };
function row(label, hint, ctl) { return '<div class="bsr"><div><b>' + label + '</b>' + (hint ? '<span>' + hint + '</span>' : '') + '</div><div class="bsc">' + ctl + '</div></div>'; }
function toggle(id, on) { return '<button class="bst' + (on ? ' on' : '') + '" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" data-bs="tog" data-k="' + id + '"><i></i></button>'; }
function seg(k, opts, cur) { return '<div class="bsg">' + opts.map(function (o) { return '<button class="' + (o[0] === cur ? 'on' : '') + '" data-bs="set" data-k="' + k + '" data-v="' + esc(o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
function onlyFull(w, html) { return isRb(w) ? html : '<span class="note">Available in the Full browser</span>'; }
function body(w) {
  var s = w.bs.sec, se = pref('brsearch'), h = '';
  if (s === 'general') {
    h += '<h3>On startup</h3>' + row('New tab opens', 'What a new tab shows', seg('brstart', [['new', 'Blank page'], ['home', 'Home page']], pref('brstart'))) +
      row('Home page', 'Used by the Home button and new tabs', '<input class="input" id="bshome" placeholder="https://example.com" value="' + esc(pref('brhome')) + '" autocomplete="off">') +
      row('Bookmarks bar', 'Show saved pages under the address bar', toggle('brbar', pref('brbar')));
  } else if (s === 'search') {
    h += '<h3>Search engine</h3>' + row('Used in the address bar', 'Anything that is not a web address is searched', '<select class="input" id="bsse">' + (BR().ENGINES || []).map(function (e) { return '<option value="' + e[0] + '"' + (e[0] === se ? ' selected' : '') + '>' + e[1] + '</option>'; }).join('') + '<option value="custom"' + (se === 'custom' ? ' selected' : '') + '>Custom</option></select>') +
      (se === 'custom' ? row('Custom address', 'Use %s where the search words go', '<input class="input" id="bscust" placeholder="https://example.com/search?q=%s" value="' + esc(pref('brsearchcustom')) + '" autocomplete="off">') : '');
  } else if (s === 'appearance') {
    h += '<h3>Pages</h3>' + row('Page colours', 'Ask sites for a light or dark look', onlyFull(w, seg('brdark', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], pref('brdark')))) +
      row('Zoom', 'Default size of pages', onlyFull(w, '<div class="bsz"><button data-bs="zoom" data-d="-10" aria-label="Zoom out">&minus;</button><b>' + pref('brzoom') + '%</b><button data-bs="zoom" data-d="10" aria-label="Zoom in">+</button><button class="bsl" data-bs="zoom" data-d="0">Reset</button></div>')) +
      row('Sites show', 'Ask for the desktop or the mobile version of sites', onlyFull(w, seg('brmobile', [['0', 'Desktop'], ['1', 'Mobile']], pref('brmobile') ? '1' : '0'))) +
      row('Language', 'Preferred language sent to sites', onlyFull(w, '<select class="input" id="bslang">' + LANGS.map(function (l) { return '<option value="' + l[0] + '"' + (l[0] === pref('brlang') ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select>')) +
      '<h3>Picture</h3>' + row('Quality', 'Sharper pictures use more data', onlyFull(w, seg('brqual', (BR().QLAB || []).map(function (q) { return [q[0], q[1]]; }), pref('brqual'))));
  } else if (s === 'bookmarks') {
    var l = bms(); h += '<h3>Bookmarks</h3><div class="bsa"><button class="btn sm primary" data-bs="addbm">Bookmark this page</button><button class="btn sm" data-bs="exportbm"' + (l.length ? '' : ' disabled') + '>Export</button><button class="btn sm" data-bs="clearbm"' + (l.length ? '' : ' disabled') + '>Delete all</button></div>' +
      (l.length ? '<ul class="bsl2">' + l.map(function (b, i) { return '<li><button class="bsli" data-bs="open" data-u="' + esc(b.u) + '"><b>' + esc(b.t || hostOf(b.u)) + '</b><span>' + esc(hostOf(b.u)) + '</span></button><button class="bsx2" data-bs="rmbm" data-i="' + i + '" aria-label="Remove">&#10005;</button></li>'; }).join('') + '</ul>' : '<p class="note">No bookmarks yet. Press the star beside the address bar to save a page.</p>');
  } else if (s === 'history') {
    var q = (w.bs.hq || '').toLowerCase(), hl = hist().filter(function (x) { return !q || (x.t + ' ' + x.u).toLowerCase().indexOf(q) >= 0; }).slice(0, 80);
    h += '<h3>History</h3>' + row('Save browsing history', 'Pages you open are listed here', toggle('brhistoff', !pref('brhistoff'))) + '<div class="bsa"><input class="input" id="bshq" type="search" placeholder="Search history" value="' + esc(w.bs.hq || '') + '"><button class="btn sm" data-bs="clearhist"' + (hist().length ? '' : ' disabled') + '>Clear history</button></div>' +
      (hl.length ? '<ul class="bsl2">' + hl.map(function (x) { return '<li><button class="bsli" data-bs="open" data-u="' + esc(x.u) + '"><b>' + esc(x.t) + '</b><span>' + esc(hostOf(x.u)) + ' &middot; ' + new Date(x.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</span></button><button class="bsx2" data-bs="rmh" data-u="' + esc(x.u) + '" aria-label="Remove">&#10005;</button></li>'; }).join('') + '</ul>' : '<p class="note">Nothing here yet.</p>');
  } else if (s === 'privacy') {
    h += '<h3>Clear browsing data</h3>' + row('Cookies and sites\' saved data', isRb(w) ? 'Signs you out of sites in the Full browser' : 'Signs you out of sites opened in the Simple browser', '<button class="btn sm" data-bs="clearck">Clear cookies</button>') +
      row('Cached pages', 'Frees space and loads fresh copies', onlyFull(w, '<button class="btn sm" data-bs="clearcache">Clear cache</button>')) +
      row('History', 'The list of pages you opened', '<button class="btn sm" data-bs="clearhist">Clear history</button>') +
      row('Everything', 'Cookies, cache, history and bookmarks', '<button class="btn sm danger" data-bs="clearall">Clear all</button>') +
      '<p class="note">Pages in the Simple browser open through your Anands server in a sandbox and cannot see your Anands session. The Full browser is one shared Chrome on your server, so clear it before handing the screen to someone else.</p>';
  } else {
    h += '<h3>Advanced</h3>' + row('Browser', isRb(w) ? 'Full browser (Chromium on your server)' : 'Simple browser (pages through your Anands server)', '') +
      row('Reset browser settings', 'Back to defaults. Bookmarks and history are kept.', '<button class="btn sm" data-bs="reset">Reset settings</button>') +
      '<p class="note">Settings are saved on this device. Full browser options apply to its tabs as soon as you change them.</p>';
  }
  return h;
}
function paint(w) {
  var el = w.body.querySelector('.bsx'); if (!el) return; var keep = el.querySelector('.bsmain'), top = keep ? keep.scrollTop : 0;
  el.innerHTML = '<div class="bsh"><b>Settings</b><span class="note">' + (isRb(w) ? 'Full browser' : 'Simple browser') + '</span><button data-bs="close" aria-label="Close settings">&#10005;</button></div><div class="bsb"><nav class="bsnav" role="tablist">' +
    SECT.map(function (x) { return '<button role="tab" class="' + (x[0] === w.bs.sec ? 'on' : '') + '" data-bs="sec" data-v="' + x[0] + '">' + ic(x[2]) + '<span>' + x[1] + '</span></button>'; }).join('') + '</nav><div class="bsmain">' + body(w) + '</div></div>';
  var m = el.querySelector('.bsmain'); if (m) m.scrollTop = top;
}
function winOf(t) { var el = t.closest('.dkw'); if (!el) return null; var id = el.getAttribute('data-id'); return ((window.AOSDesk && window.AOSDesk.state.wins) || []).filter(function (x) { return x.id === id; })[0]; }
function download(name, text, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
function clearCookies(w) { var jobs = [fetch('/api/browse/clear', { method: 'POST', credentials: 'same-origin', headers: { 'x-aos': '1' } })]; if (isRb(w)) jobs.push(BR().rbPost(w, '/clear', { cache: false, cookies: true }, true)); return Promise.all(jobs); }

document.addEventListener('click', function (ev) {
  var t = ev.target.closest('[data-bs]'); if (!t) return; var w = winOf(t); if (!w || !w.bs) return; var a = t.getAttribute('data-bs'), k = t.getAttribute('data-k'), v = t.getAttribute('data-v');
  ev.stopPropagation();
  if (a === 'close') { var x = w.body.querySelector('.bsx'); if (x) x.remove(); return; }
  if (a === 'sec') { w.bs.sec = v; return paint(w); }
  if (a === 'tog') { LS.set(k, k === 'brhistoff' ? !LS.get(k, false) : !pref(k)); repaintAll(); return paint(w); }
  if (a === 'set') { var val = k === 'brmobile' ? v === '1' : v; LS.set(k, val); if (k === 'brqual' || k === 'brdark' || k === 'brmobile') pushPrefs(w); return paint(w); }
  if (a === 'zoom') { var d = Number(t.getAttribute('data-d')), z = d === 0 ? 100 : Math.max(25, Math.min(300, pref('brzoom') + d)); LS.set('brzoom', z); pushPrefs(w); return paint(w); }
  if (a === 'open') { BS.go(w, t.getAttribute('data-u')); var xo = w.body.querySelector('.bsx'); if (xo) xo.remove(); return; }
  if (a === 'addbm') { var u = curUrl(w); if (!u) return toast('Open a page first'); if (!bms().some(function (b) { return b.u === u; })) BS.star(w); else toast('Already bookmarked'); return paint(w); }
  if (a === 'rmbm') { var l = bms(); l.splice(Number(t.getAttribute('data-i')), 1); LS.set('brbm', l); repaintAll(); return paint(w); }
  if (a === 'clearbm') { LS.set('brbm', []); repaintAll(); return paint(w); }
  if (a === 'exportbm') { download('bookmarks.html', '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n' + bms().map(function (b) { return '<DT><A HREF="' + esc(b.u) + '">' + esc(b.t || b.u) + '</A>'; }).join('\n') + '\n</DL><p>\n', 'text/html'); return; }
  if (a === 'rmh') { LS.set('brhist', hist().filter(function (x) { return x.u !== t.getAttribute('data-u'); })); return paint(w); }
  if (a === 'clearhist') { LS.set('brhist', []); toast('History cleared'); return paint(w); }
  if (a === 'clearck') { clearCookies(w).then(function () { toast('Cookies cleared'); }); return; }
  if (a === 'clearcache') { BR().rbPost(w, '/clear', { cache: true, cookies: false }).then(function () { toast('Cache cleared'); }); return; }
  if (a === 'clearall') { LS.set('brhist', []); LS.set('brbm', []); repaintAll(); clearCookies(w).then(function () { if (isRb(w)) BR().rbPost(w, '/clear', { cache: true, cookies: true }, true); toast('Browsing data cleared'); }); return paint(w); }
  if (a === 'reset') { Object.keys(DEF).forEach(function (kk) { LS.set(kk, DEF[kk]); }); pushPrefs(w); repaintAll(); toast('Browser settings reset'); return paint(w); }
});
document.addEventListener('change', function (ev) {
  var t = ev.target; if (!t.id || t.id.indexOf('bs') !== 0) return; var w = winOf(t); if (!w || !w.bs) return;
  if (t.id === 'bsse') { LS.set('brsearch', t.value); return paint(w); }
  if (t.id === 'bscust') { var c = t.value.trim(); if (c && !/^https?:\/\//i.test(c)) return toast('Start with https://'); LS.set('brsearchcustom', c); toast('Saved'); return; }
  if (t.id === 'bshome') { var hv = t.value.trim(); if (hv && !norm(hv)) return toast('Enter a web address'); LS.set('brhome', hv); toast('Home page saved'); return; }
  if (t.id === 'bslang') { LS.set('brlang', t.value); pushPrefs(w); return; }
});
document.addEventListener('input', function (ev) { var t = ev.target; if (t.id !== 'bshq') return; var w = winOf(t); if (!w || !w.bs) return; w.bs.hq = t.value; var pos = t.selectionStart; paint(w); var n = w.body.querySelector('#bshq'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } });
document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { var x = document.querySelector('.dkw.act .bsx'); if (x) x.remove(); } });
})();
