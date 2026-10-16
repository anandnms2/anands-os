'use strict';
/* Anands Browser: tabs, address bar and history around Scramjet frames. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var token = new URLSearchParams(location.search).get('t') || '';
  try { if (token) sessionStorage.setItem('sjt', token); else token = sessionStorage.getItem('sjt') || ''; } catch (e) {}
  var tabsEl = $('tabs'), urlEl = $('url'), stage = $('stage'), home = $('home'), status = $('status');
  var tabs = [], cur = null, ctl = null, ready = null, n = 0;
  var SEARCH = 'https://duckduckgo.com/?q=%s';
  var QUICK = [['Google', 'https://www.google.com/'], ['DuckDuckGo', 'https://duckduckgo.com/'], ['YouTube', 'https://www.youtube.com/'], ['Wikipedia', 'https://www.wikipedia.org/'], ['Reddit', 'https://www.reddit.com/']];

  function fail(msg) { status.hidden = false; status.innerHTML = '<b>The browser could not start</b><p></p><button id="retry">Try again</button>'; status.querySelector('p').textContent = msg; $('retry').onclick = function () { status.hidden = true; ready = null; boot(); }; }

  function toUrl(v) {
    v = String(v || '').trim(); if (!v) return '';
    try { var u = new URL(v); if (/^https?:$/.test(u.protocol)) return u.href; } catch (e) {}
    if (/^[^\s\/]+\.[a-z]{2,}(?:[:\/?#].*)?$/i.test(v) || /^localhost(?::\d+)?(?:[\/?#].*)?$/i.test(v)) return 'https://' + v;
    return SEARCH.replace('%s', encodeURIComponent(v));
  }

  function boot() {
    if (ready) return ready;
    ready = (async function () {
      if (!('serviceWorker' in navigator)) throw new Error('This browser does not support service workers.');
      var C = $scramjetLoadController().ScramjetController;
      ctl = new C({ prefix: '/sj/~/', files: { wasm: '/sj/scram/scramjet.wasm.wasm', all: '/sj/scram/scramjet.all.js', sync: '/sj/scram/scramjet.sync.js' } });
      await ctl.init(); /* creates the settings database, which the service worker then reads */
      await navigator.serviceWorker.register('/sj/sw.js', { scope: '/sj/' });
      await navigator.serviceWorker.ready;
      var conn = new BareMux.BareMuxConnection('/sj/baremux/worker.js');
      var wisp = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host + '/sj/wisp/' + encodeURIComponent(token) + '/';
      await conn.setTransport('/sj/libcurl/index.mjs', [{ websocket: wisp }]);
      /* the transport loads its wasm in the background: ask it for something until it stops saying it is not ready, so the first page does not hit that */
      var probe = new BareMux.BareClient();
      for (var i = 0; i < 60; i++) {
        try { await probe.fetch('http://ready-check.invalid/'); break; }
        catch (e) { if (!/wasm not loaded|not (yet )?ready|not loaded/i.test(String(e && e.message || e))) break; await new Promise(function (r) { setTimeout(r, 250); }); }
      }
    })();
    ready.catch(function (e) { ready = null; fail(String(e && e.message || e)); });
    return ready;
  }

  function label(t) { return t.title || (t.url ? t.url.replace(/^https?:\/\/(www\.)?/, '') : 'New tab'); }
  function paintTabs() {
    Array.prototype.slice.call(tabsEl.querySelectorAll('.tab')).forEach(function (x) { x.remove(); });
    tabs.forEach(function (t) {
      var b = document.createElement('button'); b.className = 'tab' + (t === cur ? ' on' : ''); b.setAttribute('role', 'tab'); b.title = label(t);
      var s = document.createElement('span'); s.textContent = label(t); var x = document.createElement('b'); x.textContent = '×'; x.title = 'Close tab';
      b.appendChild(s); b.appendChild(x);
      b.onclick = function (e) { if (e.target === x) close(t); else select(t); };
      b.onauxclick = function (e) { if (e.button === 1) close(t); };
      tabsEl.insertBefore(b, $('newtab'));
    });
  }
  function paintBar() { urlEl.value = cur && cur.url ? cur.url : ''; $('back').disabled = !cur || !cur.url; $('fwd').disabled = !cur || !cur.url; $('reload').disabled = !cur || !cur.url; document.title = cur ? label(cur) + ' - Anands Browser' : 'Anands Browser'; }
  function select(t) {
    cur = t; tabs.forEach(function (x) { if (x.frame) x.frame.frame.hidden = x !== t; });
    home.hidden = !!(t && t.frame); paintTabs(); paintBar(); if (!t || !t.url) urlEl.focus();
  }
  function add(url) {
    var t = { id: ++n, url: '', title: '', frame: null }; tabs.push(t); select(t); if (url) go(url); return t;
  }
  function close(t) {
    var i = tabs.indexOf(t); if (i < 0) return; if (t.frame) t.frame.frame.remove(); tabs.splice(i, 1);
    if (!tabs.length) { add(); return; } if (cur === t) select(tabs[Math.min(i, tabs.length - 1)]); else paintTabs();
  }
  async function go(raw) {
    var u = toUrl(raw); if (!u || !cur) return; var t = cur;
    try { await boot(); } catch (e) { return; }
    if (!t.frame) {
      var f = ctl.createFrame(); t.frame = f; f.frame.title = 'Web page';
      f.frame.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen; autoplay; encrypted-media; picture-in-picture');
      stage.insertBefore(f.frame, status); home.hidden = true;
      f.addEventListener('urlchange', function (ev) { t.url = ev.url; if (t === cur) paintBar(); paintTabs(); });
      f.frame.addEventListener('load', function () { try { var d = f.frame.contentDocument; t.title = (d && d.title) || ''; } catch (e) {} paintTabs(); if (t === cur) paintBar(); });
    }
    t.url = u; t.title = ''; t.frame.go(u); select(t);
  }

  $('bar').addEventListener('submit', function (e) { e.preventDefault(); go(urlEl.value); urlEl.blur(); });
  $('newtab').onclick = function () { add(); };
  $('back').onclick = function () { if (cur && cur.frame) cur.frame.back(); };
  $('fwd').onclick = function () { if (cur && cur.frame) cur.frame.forward(); };
  $('reload').onclick = function () { if (cur && cur.frame) cur.frame.reload(); };
  $('full').onclick = function () { window.open(location.href, '_blank'); };
  urlEl.addEventListener('focus', function () { urlEl.select(); });
  document.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'l') { e.preventDefault(); urlEl.focus(); }
    else if ((e.ctrlKey || e.metaKey) && k === 't') { e.preventDefault(); add(); }
    else if ((e.ctrlKey || e.metaKey) && k === 'w' && cur) { e.preventDefault(); close(cur); }
  });
  QUICK.forEach(function (q) { var b = document.createElement('button'); b.textContent = q[0]; b.onclick = function () { go(q[1]); }; $('quick').appendChild(b); });

  /* the OS can ask for an address to open: ?go=<url> or a postMessage from the desktop */
  window.addEventListener('message', function (e) { if (e.data && e.data.aosGo) { var t = cur && !cur.url ? cur : add(); cur = t; go(e.data.aosGo); } });
  var first = new URLSearchParams(location.search).get('go');
  add(first || ''); boot();
  window.__sj = { tabs: tabs, go: go, add: add };
})();
