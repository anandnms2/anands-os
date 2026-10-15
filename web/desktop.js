/* Anands Desktop: a windowed desktop on top of the OS. Opens from the Desktop button next to the logo.
 * Windows hold the Suite apps (served by this container), a file manager for your Cloudreve Drive and Google Drive, viewers and its own assistant. */
(function () {
  'use strict';
  var A = window.AOS; if (!A) return;
  var S = A.S, $ = A.$, esc = A.esc, api = A.api, toast = A.toast, ic = A.ic, LS = A.LS;
  var ROOT = '/Drive', enc = encodeURIComponent, TASK = 52;
  var WALLS = [['dusk', 'Dusk', 'linear-gradient(135deg,#1b1020 0%,#3a1c10 55%,#f68712 130%)'], ['night', 'Night', 'linear-gradient(135deg,#07080b,#161a24 60%,#243049)'], ['ember', 'Ember', 'radial-gradient(1200px 700px at 80% 100%,#f68712 0%,#5b2506 40%,#0d0a08 100%)'], ['forest', 'Forest', 'linear-gradient(135deg,#07130e,#12301f 60%,#2a6a45)'], ['paper', 'Paper', 'linear-gradient(135deg,#f6f1e8,#e6dcc8)']];
  var CATS = ['Office', 'Productivity', 'Collaboration', 'Business', 'Finance', 'Creative Tools', 'Engineering', 'Developer Tools', 'Games'];
  var D = { open: false, wins: [], z: 10, n: 0, menu: false, wall: LS.get('deskwall', 'dusk'), g: null, ai: { msgs: [], busy: false, file: null, win: null }, ctxm: null, q: '' };

  var OSAPPS = [['photos', 'Photos', 'photos'], ['pulse', 'Pulse', 'pulse'], ['cards', 'Cards', 'card'], ['vault', 'Vault', 'lock'], ['insights', 'Insights', 'insights'], ['vpn', 'VPN', 'vpn'], ['servers', 'Servers', 'monitor']];
  var OSICON = {}; OSAPPS.forEach(function (o) { OSICON[o[0]] = o[2]; });
  var KIND_IC = { ai: 'chat', browser: 'globe', files: 'folder' };
  function ext(n) { var m = /\.([a-z0-9]+)$/i.exec(n || ''); return m ? m[1].toLowerCase() : ''; }
  function parent(p) { return p.replace(/\/[^/]*$/, '') || '/'; }
  function join(d, n) { return (d === '/' ? '' : d) + '/' + n; }
  function abs(p) { return ROOT + (p === '/' ? '' : p); }
  function bytes(n) { return A.bytes ? A.bytes(n) : n + ' B'; }
  function apps() { return (S.apps || []).filter(function (a) { return a.hasSource; }); }
  function appBy(slug) { return apps().filter(function (a) { return a.slug === slug; })[0]; }
  function glyph(name, dir) { var e = ext(name), c = dir ? '#8b94a3' : /^(jpe?g|png|gif|webp|svg|bmp|avif)$/.test(e) ? '#c04bd1' : /^(mp4|mov|webm|mkv)$/.test(e) ? '#ea5a47' : /^(mp3|wav|ogg|m4a|flac)$/.test(e) ? '#f08c2c' : e === 'pdf' ? '#e5453a' : /^(docx?|odt|rtf)$/.test(e) ? '#4a86f7' : /^(xlsx?|csv|ods|tsv)$/.test(e) ? '#1fa463' : /^(pptx?|odp)$/.test(e) ? '#f4a21d' : '#7a8594'; return '<svg class="dk-fi" viewBox="0 0 24 24" aria-hidden="true">' + (dir ? '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.2h8.5A1.5 1.5 0 0 1 21 8.7v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" fill="' + c + '"/>' : '<path d="M6 3h8l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="' + c + '"/><path d="M14 3v5h5" fill="#fff" opacity=".35"/>') + '</svg>'; }
  function clock() { var d = new Date(); return A.fmt(d, { day: 'numeric', hour: 'numeric' }); }

  /* ---------- shell ---------- */
  var root = document.createElement('div'); root.id = 'desk'; root.hidden = true; document.body.appendChild(root);
  root.innerHTML = '<div class="dk-wall" id="dkwall"></div><div class="dk-icons" id="dkicons"></div><div class="dk-wins" id="dkwins"></div><div class="dk-menu" id="dkmenu" hidden></div><div class="dk-ctx" id="dkctx" hidden></div>' +
    '<div class="dk-task" id="dktask"></div>';
  function wallStyle() { var w = WALLS.filter(function (x) { return x[0] === D.wall; })[0] || WALLS[0]; $('#dkwall').style.background = w[2]; root.classList.toggle('dk-light', w[0] === 'paper'); }

  function icons() {
    var items = [['browser', 'Browser', 'globe'], ['files', 'Files', 'folder'], ['ai', 'Assistant', 'chat']].concat(OSAPPS.map(function (o) { return ['os:' + o[0], o[1], o[2]]; }));
    var h = items.map(function (i) { return '<button class="dk-ic" data-dk="launch" data-w="' + i[0] + '"><span class="dk-icg">' + ic(i[2]) + '</span><span>' + i[1] + '</span></button>'; }).join('');
    h += '<button class="dk-ic" data-dk="launch" data-w="google"><span class="dk-icg">' + ic('cloud') + '</span><span>Google Drive</span></button>';
    (LS.get('recent', []) || []).slice(0, 4).forEach(function (s) { var a = appBy(s); if (a) h += '<button class="dk-ic" data-dk="app" data-s="' + esc(a.slug) + '"><img src="/_icons/' + esc(a.slug) + '.png" alt=""><span>' + esc(a.name) + '</span></button>'; });
    $('#dkicons').innerHTML = h;
  }
  function task() {
    var h = '<button class="dk-start' + (D.menu ? ' on' : '') + '" data-dk="menu" aria-label="Start"><img src="/logo-orange.png" alt=""></button><div class="dk-pins"><button class="dk-pin" data-dk="launch" data-w="browser" title="Browser">' + ic('globe') + '</button><button class="dk-pin" data-dk="launch" data-w="files" title="Files">' + ic('folder') + '</button><button class="dk-pin" data-dk="launch" data-w="ai" title="Assistant">' + ic('chat') + '</button></div><div class="dk-run">';
    D.wins.forEach(function (w) { h += '<button class="dk-rb' + (w.min ? ' min' : '') + (w.id === D.top && !w.min ? ' on' : '') + '" data-dk="tb" data-id="' + w.id + '" title="' + esc(w.title) + '">' + (w.icon ? '<img src="' + esc(w.icon) + '" alt="">' : '<span class="dk-rg">' + ic(KIND_IC[w.kind] || (w.view && OSICON[w.view]) || 'folder') + '</span>') + '<span>' + esc(w.title) + '</span></button>'; });
    h += '</div><span class="sp"></span><button class="dk-tray" data-dk="wall" title="Wallpaper">' + ic('photos') + '</button><span class="dk-clock" id="dkclock">' + esc(clock()) + '</span><button class="dk-exit" data-dk="exit" title="Back to Anands OS">' + ic('out') + 'Exit</button>';
    $('#dktask').innerHTML = h;
  }
  function menu() {
    var m = $('#dkmenu'); m.hidden = !D.menu; if (!D.menu) return;
    var q = D.q.toLowerCase(), list = apps().filter(function (a) { return !q || (a.name + ' ' + (a.category || '') + ' ' + (a.alternativeTo || '')).toLowerCase().indexOf(q) >= 0; });
    var h = '<div class="dk-mh"><input class="input" id="dkq" type="search" placeholder="Search apps" value="' + esc(D.q) + '" autocomplete="off"></div><div class="dk-ml">';
    if (!q || 'browser web internet files drive assistant google settings photos pulse cards vault insights vpn servers'.indexOf(q) >= 0) h += '<div class="dk-mc">System</div>' + [['browser', 'Browser', 'globe'], ['files', 'Files', 'folder'], ['google', 'Google Drive', 'cloud'], ['ai', 'Assistant', 'chat']].concat(OSAPPS.map(function (o) { return ['os:' + o[0], o[1], o[2]]; })).map(function (i) { return '<button class="dk-mi" data-dk="launch" data-w="' + i[0] + '"><span class="dk-icg sm">' + ic(i[2]) + '</span>' + i[1] + '</button>'; }).join('') + '<button class="dk-mi" data-dk="settings"><span class="dk-icg sm">' + ic('settings') + '</span>Settings</button>';
    CATS.concat(['Other']).forEach(function (c) { var l = list.filter(function (a) { return (CATS.indexOf(a.category) >= 0 ? a.category : 'Other') === c; }); if (!l.length) return; h += '<div class="dk-mc">' + esc(c) + '</div>' + l.map(function (a) { return '<button class="dk-mi" data-dk="app" data-s="' + esc(a.slug) + '"><img src="/_icons/' + esc(a.slug) + '.png" alt="">' + esc(a.name) + '</button>'; }).join(''); });
    m.innerHTML = h + '</div>';
  }

  /* ---------- windows ---------- */
  function area() { return { w: root.clientWidth, h: root.clientHeight - TASK }; }
  function mk(kind, title, o) {
    o = o || {}; var ar = area(), small = ar.w < 760, n = D.n++, w = { id: 'w' + (++D.id0), kind: kind, title: title, icon: o.icon || '', x: 230 + (n % 8) * 30, y: 40 + (n % 8) * 26, w: Math.min(o.w || 900, ar.w - 20), h: Math.min(o.h || 580, ar.h - 20), min: false, max: small, z: ++D.z, data: o.data || {} };
    w.x = Math.max(0, Math.min(w.x, ar.w - w.w)); w.y = Math.max(0, Math.min(w.y, ar.h - w.h));
    var el = document.createElement('div'); el.className = 'dkw'; el.setAttribute('data-id', w.id); el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', title);
    el.innerHTML = '<div class="dkw-bar" data-bar><span class="dkw-t">' + (w.icon ? '<img src="' + esc(w.icon) + '" alt="">' : '') + '<b>' + esc(title) + '</b></span><span class="sp"></span><button data-dk="wmin" data-id="' + w.id + '" aria-label="Minimise">&#8211;</button><button data-dk="wmax" data-id="' + w.id + '" aria-label="Maximise">&#9633;</button><button class="x" data-dk="wclose" data-id="' + w.id + '" aria-label="Close">&#10005;</button></div><div class="dkw-body"></div><i class="rz rz-r" data-rz="r"></i><i class="rz rz-b" data-rz="b"></i><i class="rz rz-br" data-rz="br"></i>';
    w.el = el; w.body = el.querySelector('.dkw-body'); $('#dkwins').appendChild(el); D.wins.push(w); place(w); focus(w); task(); return w;
  }
  D.id0 = 0;
  function place(w) { var el = w.el, ar = area(); el.hidden = w.min; el.style.zIndex = w.z; if (w.max) { el.style.left = 0; el.style.top = 0; el.style.width = ar.w + 'px'; el.style.height = ar.h + 'px'; } else { el.style.left = w.x + 'px'; el.style.top = w.y + 'px'; el.style.width = w.w + 'px'; el.style.height = w.h + 'px'; } el.classList.toggle('max', !!w.max); }
  function focus(w) { w.z = ++D.z; D.top = w.id; if (w.min) { w.min = false; } D.wins.forEach(function (x) { x.el.classList.toggle('act', x === w); place(x); }); task(); }
  function byId(id) { return D.wins.filter(function (w) { return w.id === id; })[0]; }
  function closeWin(w) { w.el.remove(); D.wins = D.wins.filter(function (x) { return x !== w; }); if (D.ai.win === w) D.ai.win = null; if (D.top === w.id) { var t = D.wins.filter(function (x) { return !x.min; }).sort(function (a, b) { return b.z - a.z; })[0]; D.top = t ? t.id : null; if (t) focus(t); } task(); }

  function openApp(slug, file) {
    var a = appBy(slug); if (!a) return toast('That app is not available');
    var r = (LS.get('recent', []) || []).filter(function (x) { return x !== slug; }); r.unshift(slug); LS.set('recent', r.slice(0, 6));
    var w = mk('app', a.name, { icon: '/_icons/' + a.slug + '.png', w: 980, h: 640 });
    w.body.innerHTML = '<iframe class="dkw-frame" title="' + esc(a.name) + '" src="/apps/' + esc(a.slug) + '/' + (file ? '?open=' + enc(file) : '') + '" allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"></iframe>'; icons();
    return w;
  }
  function openFileInApp(path) {
    var e = ext(path), m = A.OPENWITH && A.OPENWITH[e];
    if (/^(jpe?g|png|gif|webp|svg|bmp|avif|pdf|mp4|webm|mov|m4v|mp3|wav|ogg|m4a|flac)$/.test(e) || A.TEXTEXT.test(e)) return viewer(path);
    if (m && m.length) { var slug = m[0]; if (A.LAUNCHES.indexOf(slug) < 0) { toast('Opening ' + (appBy(slug) || {}).name + '. Use its Open dialog and choose ' + path); return openApp(slug); } return openApp(slug, path); }
    return viewer(path);
  }

  /* ---------- Anands OS pages as windows (Photos, Pulse, Cards...) ---------- */
  function osWin(view) {
    var o = OSAPPS.filter(function (x) { return x[0] === view; })[0]; if (!o) return;
    var ex = D.wins.filter(function (x) { return x.kind === 'os' && x.view === view; })[0]; if (ex) { focus(ex); return ex; }
    var w = mk('os', o[1], { w: 1040, h: 660 }); w.view = view;
    w.body.innerHTML = '<iframe class="dkw-frame" title="' + esc(o[1]) + '" src="/?embed=1#' + esc(view) + '" allow="clipboard-read; clipboard-write; fullscreen"></iframe>'; return w;
  }

  /* ---------- browser ---------- */
  var SEARCH = 'https://html.duckduckgo.com/html/?q=';
  var QUICK = [['Wikipedia', 'https://en.wikipedia.org/'], ['Hacker News', 'https://news.ycombinator.com/'], ['DuckDuckGo', 'https://html.duckduckgo.com/html/'], ['BBC News', 'https://www.bbc.com/news'], ['Example', 'https://example.com/']];
  function normUrl(t) {
    t = String(t || '').trim(); if (!t) return '';
    if (/^https?:\/\//i.test(t)) return t;
    if (!/\s/.test(t) && /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#].*)?$/i.test(t)) return 'https://' + t;
    if (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?([/?#].*)?$/i.test(t)) return 'http://' + t;
    return SEARCH + enc(t);
  }
  function btab(w) { var b = w.b; return b.tabs.filter(function (t) { return t.id === b.cur; })[0]; }
  function browserWin(url) {
    var w = mk('browser', 'Browser', { w: 1000, h: 640 }); w.b = { tabs: [], cur: 0, n: 0 }; newTab(w, url); return w;
  }
  function newTab(w, url) { var t = { id: ++w.b.n, url: '', title: 'New tab', hist: [], i: -1 }; w.b.tabs.push(t); w.b.cur = t.id; paintBrowser(w); if (url) nav(w, t, url); else { var q = w.body.querySelector('.dk-url'); if (q) q.focus(); } return t; }
  function nav(w, t, input, noPush) {
    var u = normUrl(input); if (!u) return; t.url = u; t.want = u; t.force = true; t.title = u.replace(/^https?:\/\//, '').slice(0, 40);
    if (!noPush) { t.hist = t.hist.slice(0, t.i + 1); t.hist.push(u); t.i = t.hist.length - 1; }
    paintBrowser(w);
  }
  function bstart(w) {
    return '<div class="dk-start2"><h2>Browser</h2><form data-dk-form="url" data-id="' + w.id + '" class="dk-sf"><input class="input dk-url" placeholder="Search the web or type an address" autocomplete="off" aria-label="Search"><button class="btn primary">Go</button></form><div class="dk-q">' + QUICK.map(function (q) { return '<button class="btn" data-dk="bgo" data-id="' + w.id + '" data-u="' + esc(q[1]) + '">' + esc(q[0]) + '</button>'; }).join('') + '</div>' +
      '<p class="note">Pages open through your Anands server in a sandbox, so sites cannot see your Anands session. Simple pages work best. Sign-in, payments and heavy web apps may not work; use Open in a real tab (top right) for those, or the Linux Desktop on Kasm.</p></div>';
  }
  function paintBrowser(w) {
    var b = w.b, t = btab(w);
    if (!w.body.querySelector('.dk-br')) w.body.innerHTML = '<div class="dk-br"><div class="dk-bts" role="tablist"></div><div class="dk-barw"></div><div class="dk-bv"><div class="dk-sw"></div></div></div>';
    w.body.querySelector('.dk-bts').innerHTML = b.tabs.map(function (x) { return '<div class="dk-bt' + (x.id === b.cur ? ' on' : '') + '" data-dk="btab" data-id="' + w.id + '" data-t="' + x.id + '" role="tab" aria-selected="' + (x.id === b.cur) + '"><span>' + esc(x.title) + '</span>' + (b.tabs.length > 1 ? '<button data-dk="bclose" data-id="' + w.id + '" data-t="' + x.id + '" aria-label="Close tab">&#10005;</button>' : '') + '</div>'; }).join('') + '<button class="dk-bnew" data-dk="bnew" data-id="' + w.id + '" aria-label="New tab">+</button>';
    var keep = (document.activeElement && document.activeElement.classList.contains('dk-url') && w.body.contains(document.activeElement)) ? document.activeElement.value : null;
    w.body.querySelector('.dk-barw').innerHTML = '<form class="dk-bar2" data-dk-form="url" data-id="' + w.id + '"><button type="button" class="btn sm" data-dk="bback" data-id="' + w.id + '"' + (t.i > 0 ? '' : ' disabled') + ' aria-label="Back">' + ic('back') + '</button><button type="button" class="btn sm" data-dk="bfwd" data-id="' + w.id + '"' + (t.i < t.hist.length - 1 ? '' : ' disabled') + ' aria-label="Forward">' + ic('r') + '</button><button type="button" class="btn sm" data-dk="breload" data-id="' + w.id + '" aria-label="Reload"' + (t.url ? '' : ' disabled') + '>&#8635;</button><button type="button" class="btn sm" data-dk="bhome" data-id="' + w.id + '" aria-label="Start page">' + ic('home') + '</button>' +
      '<input class="input dk-url" aria-label="Address or search" placeholder="Search or type a web address" value="' + esc(t.url) + '" autocomplete="off" spellcheck="false"><button type="button" class="btn sm" data-dk="bext" data-id="' + w.id + '"' + (t.url ? '' : ' disabled') + ' title="Open this page in a real browser tab" aria-label="Open in a real tab">' + ic('ext') + '</button></form>';
    if (keep !== null) { var ui = w.body.querySelector('.dk-bar2 .dk-url'); ui.value = keep; ui.focus(); }
    var bv = w.body.querySelector('.dk-bv'), sw = bv.querySelector('.dk-sw'); sw.hidden = !!t.url; if (!t.url) sw.innerHTML = bstart(w);
    var have = {}; bv.querySelectorAll('iframe.dk-bf').forEach(function (f) { have[f.getAttribute('data-tab')] = f; });
    Object.keys(have).forEach(function (k) { if (!b.tabs.some(function (x) { return String(x.id) === k; })) have[k].remove(); });
    b.tabs.forEach(function (x) {
      var f = have[x.id];
      if (x.url && !f) { f = document.createElement('iframe'); f.className = 'dkw-frame dk-bf'; f.setAttribute('data-tab', x.id); f.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads'); f.setAttribute('referrerpolicy', 'no-referrer'); f.title = 'Web page'; bv.appendChild(f); x.force = true; }
      if (f && x.force && x.want) { f.src = '/api/browse?url=' + enc(x.want); x.force = false; }
      if (f) f.hidden = !(x.id === b.cur && x.url);
    });
    w.title = t.url && t.title ? t.title + ' - Browser' : 'Browser'; task();
  }
  window.addEventListener('message', function (ev) {
    var d = ev.data; if (!d || typeof d !== 'object' || (!d.aosBrowse && !d.aosTitle)) return;
    for (var i = 0; i < D.wins.length; i++) { var w = D.wins[i]; if (w.kind !== 'browser') continue;
      var fr = Array.prototype.filter.call(w.body.querySelectorAll('iframe.dk-bf'), function (f) { return f.contentWindow === ev.source; })[0]; if (!fr) continue;
      var t = w.b.tabs.filter(function (x) { return String(x.id) === fr.getAttribute('data-tab'); })[0]; if (!t) return;
      if (d.aosBrowse) { if (d.tab) newTab(w, d.aosBrowse); else nav(w, t, d.aosBrowse); return; }
      if (d.aosTitle !== undefined) { t.loading = false; if (d.aosTitle) t.title = String(d.aosTitle).slice(0, 60); if (d.aosUrl && d.aosUrl !== t.url && /^https?:/i.test(d.aosUrl)) { t.url = d.aosUrl; if (t.hist[t.i] !== d.aosUrl) t.hist[t.i] = d.aosUrl; } var cur = w.b.cur === t.id; var tb = w.body.querySelector('.dk-bt[data-t="' + t.id + '"] span'); if (tb) tb.textContent = t.title; var ui = w.body.querySelector('.dk-bar2 .dk-url'); if (ui && cur) ui.value = t.url; w.title = t.title + ' - Browser'; task(); return; }
    }
  });
  function bhand(a, b, w) {
    var t = btab(w);
    if (a === 'bnew') return void newTab(w);
    if (a === 'btab') { w.b.cur = Number(b.getAttribute('data-t')); return void paintBrowser(w); }
    if (a === 'bclose') { var id = Number(b.getAttribute('data-t')); w.b.tabs = w.b.tabs.filter(function (x) { return x.id !== id; }); if (!w.b.tabs.length) return void closeWin(w); if (w.b.cur === id) w.b.cur = w.b.tabs[w.b.tabs.length - 1].id; return void paintBrowser(w); }
    if (a === 'bback' && t.i > 0) { t.i--; return void nav(w, t, t.hist[t.i], true); }
    if (a === 'bfwd' && t.i < t.hist.length - 1) { t.i++; return void nav(w, t, t.hist[t.i], true); }
    if (a === 'breload') { t.want = t.url; t.force = true; return void paintBrowser(w); }
    if (a === 'bhome') { t.url = ''; t.title = 'New tab'; t.i = -1; t.hist = []; return void paintBrowser(w); }
    if (a === 'bgo') return void nav(w, t, b.getAttribute('data-u'));
    if (a === 'bext') return void window.open(t.url, '_blank', 'noopener');
  }

  /* ---------- viewer ---------- */
  function viewer(path, remote) {
    var e = ext(path), name = path.split('/').pop(), url = remote ? remote.url : '/_local/fs/get?path=' + enc(path);
    var w = mk('viewer', name, { w: 860, h: 600 }); w.data = { path: path, remote: remote };
    if (/^(jpe?g|png|gif|webp|svg|bmp|avif)$/.test(e)) w.body.innerHTML = '<div class="dk-vw"><img src="' + esc(url) + '" alt="' + esc(name) + '"></div>';
    else if (e === 'pdf') w.body.innerHTML = '<iframe class="dkw-frame" title="' + esc(name) + '" src="' + esc(url) + '"></iframe>';
    else if (/^(mp4|webm|mov|m4v)$/.test(e)) w.body.innerHTML = '<div class="dk-vw"><video src="' + esc(url) + '" controls autoplay></video></div>';
    else if (/^(mp3|wav|ogg|m4a|flac)$/.test(e)) w.body.innerHTML = '<div class="dk-vw"><audio src="' + esc(url) + '" controls autoplay></audio></div>';
    else if (A.TEXTEXT.test(e) || e === '') {
      w.body.innerHTML = '<div class="dk-tb"><span class="note" id="vs' + w.id + '">Loading...</span><span class="sp"></span>' + '<button class="btn sm" data-dk="vai" data-id="' + w.id + '">Ask AI</button>' + (remote ? '' : '<button class="btn sm primary" data-dk="vsave" data-id="' + w.id + '">Save</button>') + '</div><textarea class="dk-ta mono" spellcheck="false" aria-label="' + esc(name) + '" disabled></textarea>';
      fetch(url, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error('Could not read the file (' + r.status + ')'); return r.text(); }).then(function (t) { var ta = w.body.querySelector('textarea'); ta.value = t; ta.disabled = !!remote; $('#vs' + w.id).textContent = remote ? 'Read only' : 'Loaded from Drive'; }).catch(function (x) { $('#vs' + w.id).textContent = x.message; });
    } else w.body.innerHTML = '<div class="dk-vw"><div class="empty"><h2>' + esc(name) + '</h2><p>This file type has no preview.</p><a class="btn primary" href="' + esc(url) + '" download>Download</a></div></div>';
    return w;
  }

  /* ---------- files ---------- */
  function filesWin(src) {
    var w = mk('files', src === 'google' ? 'Google Drive' : 'Files', { w: 940, h: 600 });
    w.f = { src: src || 'cloud', path: '/', stack: [{ id: 'root', name: 'My Drive' }], items: [], loading: false, err: null, code: null, sel: null, q: '', gst: null };
    filesLoad(w); return w;
  }
  function filesLoad(w) {
    var f = w.f; f.loading = true; f.err = null; paintFiles(w); w.title = f.src === 'google' ? 'Google Drive' : 'Files'; w.el.querySelector('.dkw-t b').textContent = w.title; task();
    var p;
    if (f.src === 'google') {
      p = api('/api/gdrive/status').then(function (st) { f.gst = st; if (!st.configured || !st.connected) { f.items = []; return; } var cur = f.stack[f.stack.length - 1]; return api('/api/gdrive/list?folder=' + enc(cur.id) + (f.q ? '&q=' + enc(f.q) : '')).then(function (d) { f.items = d.files || []; }); });
    } else p = api('/_local/fs/readdir', { method: 'POST', json: { path: abs(f.path) } }).then(function (l) { f.items = l.sort(function (a, b) { return (b.is_dir - a.is_dir) || a.name.localeCompare(b.name, undefined, { numeric: true }); }); }).then(function () { return fetch('/api/drive/status').catch(function () {}); });
    p.catch(function (e) { f.err = e.message; f.code = e.code; f.items = []; }).then(function () { f.loading = false; paintFiles(w); });
  }
  function paintFiles(w) {
    var f = w.f, g = f.src === 'google', h = '<div class="dk-fm"><aside class="dk-side"><button data-dk="fsrc" data-id="' + w.id + '" data-s="cloud" aria-pressed="' + !g + '">' + ic('folder') + 'Drive</button><button data-dk="fsrc" data-id="' + w.id + '" data-s="google" aria-pressed="' + g + '">' + ic('cloud') + 'Google Drive</button></aside><section class="dk-main">';
    var crumbs = g ? f.stack.map(function (s, i) { return '<button data-dk="fcrumb" data-id="' + w.id + '" data-i="' + i + '">' + esc(s.name) + '</button>'; }).join('<i>/</i>') : ['Drive'].concat(f.path.split('/').filter(Boolean)).map(function (s, i, a) { return '<button data-dk="fcrumb" data-id="' + w.id + '" data-i="' + i + '">' + esc(s) + '</button>'; }).join('<i>/</i>');
    var sel = f.sel != null ? f.items[f.sel] : null;
    h += '<div class="dk-tb"><button class="btn sm" data-dk="fup" data-id="' + w.id + '"' + ((g ? f.stack.length < 2 : f.path === '/') ? ' disabled' : '') + ' aria-label="Up">' + ic('back') + '</button><div class="dk-cr">' + crumbs + '</div><span class="sp"></span>' + (g ? '<input class="input dk-fq" data-dkq="' + w.id + '" type="search" placeholder="Search Google Drive" value="' + esc(f.q) + '">' : '') +
      '<button class="btn sm" data-dk="fref" data-id="' + w.id + '">Refresh</button>' + (g ? '' : '<button class="btn sm" data-dk="fnew" data-id="' + w.id + '">New folder</button><button class="btn sm" data-dk="fup2" data-id="' + w.id + '">Upload</button>') +
      (sel && !sel.is_dir ? '<button class="btn sm" data-dk="fai" data-id="' + w.id + '">Ask AI</button>' : '') + (sel && g && !sel.is_dir ? '<button class="btn sm primary" data-dk="fimp" data-id="' + w.id + '">Import to Drive</button>' : '') + (sel && !g ? '<button class="btn sm" data-dk="fren" data-id="' + w.id + '">Rename</button><button class="btn sm danger" data-dk="fdel" data-id="' + w.id + '">Delete</button>' : '') + '</div><div class="dk-list">';
    if (g && f.gst && (!f.gst.configured || !f.gst.connected)) h += '<div class="empty"><h2>Google Drive is not connected</h2><p>' + (f.gst.configured ? 'Connect your Google account in Settings, Google Drive.' : 'Add a Google client ID and secret in Settings, then connect.') + '</p><button class="btn primary" data-dk="settings">Open Settings</button></div>';
    else if (f.err) h += '<div class="banner"><i class="dot bad"></i><span>' + esc(f.err) + (f.code === 'not_configured' ? ' Set it up in Settings.' : '') + '</span></div>' + (f.code === 'not_configured' ? '<button class="btn primary" data-dk="settings">Open Settings</button>' : '');
    else if (f.loading && !f.items.length) h += '<p class="note" style="padding:14px">Loading...</p>';
    else if (!f.items.length) h += '<p class="note" style="padding:14px">This folder is empty.</p>';
    else h += '<table class="dk-t"><thead><tr><th>Name</th><th>Size</th><th>Modified</th></tr></thead><tbody>' + f.items.map(function (it, i) { return '<tr class="' + (f.sel === i ? 'sel' : '') + '" data-dk="frow" data-id="' + w.id + '" data-i="' + i + '" tabindex="0"><td>' + glyph(it.name, it.is_dir) + '<span>' + esc(it.name) + '</span></td><td>' + (it.is_dir ? '' : bytes(it.size || 0)) + '</td><td>' + (it.modified ? A.fmt(new Date(it.modified * 1000), { day: 'numeric' }) : '') + '</td></tr>'; }).join('') + '</tbody></table>';
    w.body.innerHTML = h + '</div></section></div><input type="file" id="dkup' + w.id + '" multiple hidden>';
  }
  function fOpen(w, it) {
    var f = w.f;
    if (f.src === 'google') {
      if (it.is_dir) { f.stack.push({ id: it.id, name: it.name }); f.sel = null; f.q = ''; return filesLoad(w); }
      var e = ext(it.name); if (/^(jpe?g|png|gif|webp|svg|pdf|mp4|webm|mp3|wav)$/.test(e) || A.TEXTEXT.test(e)) return viewer(it.name, { url: '/api/gdrive/file?id=' + enc(it.id) });
      return gImport(w, it, true);
    }
    var p = join(f.path, it.name); if (it.is_dir) { f.path = p; f.sel = null; return filesLoad(w); }
    openFileInApp(abs(p));
  }
  function gImport(w, it, open) {
    toast('Copying to your Drive...'); api('/api/gdrive/import', { method: 'POST', json: { id: it.id } }).then(function (r) { toast('Saved to Drive: Google Drive/' + r.name); if (open) openFileInApp(r.path); }).catch(function (e) { toast(e.message); });
  }
  function selFile(w) { var f = w.f, it = f.sel != null ? f.items[f.sel] : null; return it; }
  function textOf(w, it) {
    var f = w.f, url = f.src === 'google' ? '/api/gdrive/file?id=' + enc(it.id) : '/_local/fs/get?path=' + enc(abs(join(f.path, it.name)));
    return fetch(url, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error('Could not read that file'); var e = ext(it.name); if (!(A.TEXTEXT.test(e) || e === '')) throw new Error('The assistant can read text files (txt, md, csv, json, html and similar).'); return r.text(); });
  }

  /* ---------- assistant ---------- */
  function aiWin() { if (D.ai.win) { focus(D.ai.win); return D.ai.win; } var w = mk('ai', 'Assistant', { w: 460, h: 600 }); w.x = Math.max(0, area().w - w.w - 30); place(w); D.ai.win = w; paintAi(); return w; }
  function paintAi() {
    var w = D.ai.win; if (!w) return; var ai = D.ai, h = '<div class="dk-ai"><div class="dk-aim" id="dkaim">';
    if (!ai.msgs.length) h += '<div class="dk-aie"><b>Desktop assistant</b><p>Ask about your files, apps and everything connected to Anands OS. Select a text file in Files and choose Ask AI to talk about it. Ask me to open an app or a file.</p></div>';
    ai.msgs.forEach(function (m) { h += '<div class="dk-m ' + m.role + '">' + esc(m.content).replace(/\n/g, '<br>') + '</div>'; });
    if (ai.busy) h += '<div class="dk-m assistant"><span class="note">Thinking...</span></div>';
    h += '</div>' + (ai.file ? '<div class="dk-att">' + ic('doc') + '<span>' + esc(ai.file.name) + '</span><button data-dk="aidrop" aria-label="Remove file">&#10005;</button></div>' : '') + '<form class="dk-aif" data-dk-form="ai"><textarea class="input" id="dkain" rows="2" placeholder="Ask something" aria-label="Message"></textarea><button class="btn primary"' + (ai.busy ? ' disabled' : '') + '>Send</button></form></div>';
    w.body.innerHTML = h; var m = $('#dkaim'); if (m) m.scrollTop = m.scrollHeight;
  }
  function aiSend(text) {
    var ai = D.ai; if (!text.trim() || ai.busy) return; ai.msgs.push({ role: 'user', content: text.trim() }); ai.busy = true; paintAi();
    var fw = D.wins.filter(function (x) { return x.kind === 'files'; })[0];
    api('/api/chat', { method: 'POST', json: { messages: ai.msgs.slice(-12), ctx: { photos: false, insights: false, cards: false, pulse: false, files: true, apps: true }, desktop: { windows: D.wins.map(function (x) { return x.title; }), folder: fw ? (fw.f.src === 'google' ? 'Google Drive' : ROOT + fw.f.path) : '', file: ai.file } } }).then(function (r) {
      var t = String(r.text || ''), act = null; t = t.replace(/^\s*ACTION:\s*(open|openfile)\s+(.+?)\s*$/gim, function (_, k, v) { act = { k: k, v: v.trim() }; return ''; }).trim();
      ai.msgs.push({ role: 'assistant', content: t || 'Done.' }); ai.busy = false; paintAi();
      if (act && act.k === 'open' && (act.v.toLowerCase() === 'browser' || OSICON[act.v.toLowerCase()])) { if (act.v.toLowerCase() === 'browser') browserWin(); else osWin(act.v.toLowerCase()); act = null; }
      if (act && act.k === 'open') { var a = apps().filter(function (x) { return x.slug === act.v || x.name.toLowerCase() === act.v.toLowerCase(); })[0]; if (a) openApp(a.slug); }
      if (act && act.k === 'openfile' && /^\/Drive\//.test(act.v)) openFileInApp(act.v);
    }).catch(function (e) { ai.msgs.push({ role: 'assistant', content: 'Sorry, that did not work: ' + e.message }); ai.busy = false; paintAi(); });
  }
  function askAboutFile(name, textPromise) {
    aiWin(); textPromise.then(function (t) { D.ai.file = { name: name, text: t }; paintAi(); toast('File attached. Ask your question.'); var i = $('#dkain'); if (i) i.focus(); }).catch(function (e) { toast(e.message); });
  }

  /* ---------- open / close ---------- */
  function show() {
    if (!S.user) return; D.open = true; root.hidden = false; document.body.classList.add('dk-on'); wallStyle(); icons(); task(); D.wins.forEach(place);
    if (location.hash !== '#desktop') { try { history.pushState({ v: 'desktop' }, '', '#desktop'); } catch (e) {} }
  }
  function hide(back) { D.open = false; D.menu = false; menu(); root.hidden = true; document.body.classList.remove('dk-on'); if (location.hash === '#desktop') { try { history.replaceState(null, '', '#home'); } catch (e) {} } if (back) A.go('home'); }

  /* ---------- events ---------- */
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-dk]'); var t = ev.target;
    if (!b) { if (D.menu && !t.closest('#dkmenu')) { D.menu = false; menu(); task(); } if (!t.closest('#dkctx') && !$('#dkctx').hidden) $('#dkctx').hidden = true; var inWin = t.closest && t.closest('.dkw'); if (inWin) { var w0 = byId(inWin.getAttribute('data-id')); if (w0 && D.top !== w0.id) focus(w0); } return; }
    var a = b.getAttribute('data-dk'), id = b.getAttribute('data-id'), w = id ? byId(id) : null;
    if (a === 'open') return void show();
    if (a === 'exit') return void hide(true);
    if (a === 'menu') { D.menu = !D.menu; D.q = ''; menu(); task(); var q = $('#dkq'); if (q) q.focus(); return; }
    if (D.menu && (a === 'launch' || a === 'app' || a === 'settings')) { D.menu = false; menu(); task(); }
    if (a === 'launch') { var k = b.getAttribute('data-w'); if (k === 'ai') return void aiWin(); if (k === 'browser') return void browserWin(); if (k.indexOf('os:') === 0) return void osWin(k.slice(3)); return void filesWin(k === 'google' ? 'google' : 'cloud'); }
    if (a === 'app') return void openApp(b.getAttribute('data-s'));
    if (a === 'settings') { hide(); return void A.go('settings'); }
    if (a === 'tb') { if (!w) return; if (!w.min && D.top === w.id) { w.min = true; place(w); task(); } else focus(w); return; }
    if (w && w.kind === 'browser' && /^b/.test(a) && a !== 'bar') return void bhand(a, b, w);
    if (a === 'wmin' && w) { w.min = true; place(w); task(); return; }
    if (a === 'wmax' && w) { w.max = !w.max; place(w); return; }
    if (a === 'wclose' && w) return void closeWin(w);
    if (a === 'wall') { var i = WALLS.findIndex(function (x) { return x[0] === D.wall; }); D.wall = WALLS[(i + 1) % WALLS.length][0]; LS.set('deskwall', D.wall); return void wallStyle(); }
    /* files */
    if (a === 'fsrc' && w) { w.f.src = b.getAttribute('data-s'); w.f.sel = null; w.f.items = []; w.f.q = ''; w.f.stack = [{ id: 'root', name: 'My Drive' }]; w.f.path = '/'; return void filesLoad(w); }
    if (a === 'fcrumb' && w) { var ci = Number(b.getAttribute('data-i')); if (w.f.src === 'google') w.f.stack = w.f.stack.slice(0, ci + 1); else w.f.path = '/' + w.f.path.split('/').filter(Boolean).slice(0, ci).join('/'); w.f.sel = null; return void filesLoad(w); }
    if (a === 'fup' && w) { if (w.f.src === 'google') w.f.stack.pop(); else w.f.path = parent(w.f.path); w.f.sel = null; return void filesLoad(w); }
    if (a === 'fref' && w) return void filesLoad(w);
    if (a === 'frow' && w) { var it = w.f.items[Number(b.getAttribute('data-i'))]; var was = w.f.sel === Number(b.getAttribute('data-i')); w.f.sel = Number(b.getAttribute('data-i')); w.body.querySelectorAll('tr.sel').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); clearTimeout(w.pt); w.pt = setTimeout(function () { paintFiles(w); }, 350); return; }
    if (a === 'fnew' && w) return void prompt2('New folder name', '', function (nm) { api('/_local/fs/mkdir', { method: 'POST', json: { path: abs(join(w.f.path, nm)) } }).then(function () { filesLoad(w); }).catch(function (e) { toast(e.message); }); });
    if (a === 'fren' && w) { var it2 = selFile(w); if (!it2) return; return void prompt2('Rename to', it2.name, function (nn) { if (nn === it2.name) return; api('/_local/fs/rename', { method: 'POST', json: { path: abs(join(w.f.path, it2.name)), name: nn } }).then(function () { w.f.sel = null; filesLoad(w); }).catch(function (e) { toast(e.message); }); }); }
    if (a === 'fdel' && w) { var it3 = selFile(w); if (!it3) return; return void confirm2('Delete ' + it3.name + '?', function () { api('/_local/fs/delete', { method: 'POST', json: { path: abs(join(w.f.path, it3.name)) } }).then(function () { w.f.sel = null; filesLoad(w); toast('Deleted'); }).catch(function (e) { toast(e.message); }); }); }
    if (a === 'fup2' && w) { var inp = $('#dkup' + w.id); if (inp) inp.click(); return; }
    if (a === 'fai' && w) { var it4 = selFile(w); return void (it4 && askAboutFile(it4.name, textOf(w, it4))); }
    if (a === 'fimp' && w) { var it5 = selFile(w); return void (it5 && gImport(w, it5, false)); }
    if (a === 'vsave' && w) { var ta = w.body.querySelector('textarea'), st = $('#vs' + w.id); st.textContent = 'Saving...'; return void api('/_local/fs/write?path=' + enc(w.data.path) + '&overwrite=1', { method: 'POST', body: ta.value, headers: { 'content-type': 'text/plain' } }).then(function () { st.textContent = 'Saved to Drive'; }).catch(function (e) { st.textContent = 'Could not save: ' + e.message; }); }
    if (a === 'vai' && w) { var ta2 = w.body.querySelector('textarea'); return void askAboutFile(w.title, Promise.resolve(ta2.value)); }
    if (a === 'aidrop') { D.ai.file = null; return void paintAi(); }
  });
  document.addEventListener('dblclick', function (ev) { var r = ev.target.closest && ev.target.closest('tr[data-dk="frow"]'); if (!r) return; var w = byId(r.getAttribute('data-id')); if (w) { clearTimeout(w.pt); fOpen(w, w.f.items[Number(r.getAttribute('data-i'))]); } });
  document.addEventListener('keydown', function (ev) {
    if (!D.open) return; if (ev.key === 'Escape') { if (D.menu) { D.menu = false; menu(); task(); } return; }
    var r = ev.target.closest && ev.target.closest('tr[data-dk="frow"]'); if (r && ev.key === 'Enter') { var w = byId(r.getAttribute('data-id')); if (w) fOpen(w, w.f.items[Number(r.getAttribute('data-i'))]); }
    if (ev.key === 'Enter' && !ev.shiftKey && ev.target.id === 'dkain') { ev.preventDefault(); var v = ev.target.value; ev.target.value = ''; aiSend(v); }
  });
  document.addEventListener('submit', function (ev) { var fm = ev.target; if (fm.getAttribute && fm.getAttribute('data-dk-form') === 'url') { ev.preventDefault(); var bw = byId(fm.getAttribute('data-id')); if (bw) { var inp = fm.querySelector('.dk-url'); nav(bw, btab(bw), inp.value); } return; } if (ev.target.getAttribute && ev.target.getAttribute('data-dk-form') === 'ai') { ev.preventDefault(); var i = $('#dkain'); var v = i.value; i.value = ''; aiSend(v); } });
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (t.id === 'dkq') { D.q = t.value; var pos = t.selectionStart; menu(); var n = $('#dkq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }
    if (t.getAttribute && t.getAttribute('data-dkq')) { var w = byId(t.getAttribute('data-dkq')); if (w) { w.f.q = t.value; clearTimeout(w.qt); w.qt = setTimeout(function () { var pos2 = t.selectionStart; filesLoad(w); setTimeout(function () { var n2 = w.body.querySelector('.dk-fq'); if (n2) { n2.focus(); n2.setSelectionRange(pos2, pos2); } }, 0); }, 350); } }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t.id || t.id.indexOf('dkup') !== 0 || !t.files || !t.files.length) return; var w = byId(t.id.slice(4)); if (!w) return;
    var files = Array.prototype.slice.call(t.files); t.value = ''; var done = 0;
    files.reduce(function (p, file) { return p.then(function () { return api('/_local/fs/write?path=' + enc(abs(join(w.f.path, file.name))) + '&overwrite=0', { method: 'POST', body: file, headers: { 'content-type': file.type || 'application/octet-stream' } }).then(function () { done++; }).catch(function (e) { toast(file.name + ': ' + e.message); }); }); }, Promise.resolve()).then(function () { if (done) toast(done + ' uploaded'); filesLoad(w); });
  });
  document.addEventListener('contextmenu', function (ev) { if (!D.open || !ev.target.closest('#dkicons, .dk-wall')) return; ev.preventDefault(); var c = $('#dkctx'); c.innerHTML = '<button data-dk="wall">Change wallpaper</button><button data-dk="launch" data-w="files">Open Files</button><button data-dk="exit">Exit to Anands OS</button>'; c.style.left = Math.min(ev.clientX, innerWidth - 190) + 'px'; c.style.top = Math.min(ev.clientY, innerHeight - 140) + 'px'; c.hidden = false; });
  function dlg(html, onOk) {
    var d = document.createElement('div'); d.className = 'dk-dlg'; d.innerHTML = '<form class="dk-dlgc">' + html + '<div class="dk-dlgb"><button type="button" class="btn sm" data-x="1">Cancel</button><button class="btn sm primary" type="submit">OK</button></div></form>';
    root.appendChild(d); var f = d.querySelector('form'), i = d.querySelector('input'); if (i) { i.focus(); i.select(); }
    d.addEventListener('click', function (ev) { if (ev.target === d || ev.target.getAttribute('data-x')) d.remove(); });
    d.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') d.remove(); });
    f.addEventListener('submit', function (ev) { ev.preventDefault(); ev.stopPropagation(); var v = i ? i.value.trim() : true; d.remove(); if (v) onOk(v); });
  }
  function prompt2(label, val, ok) { dlg('<label>' + esc(label) + '</label><input class="dk-dlgi" value="' + esc(val || '') + '">', ok); }
  function confirm2(msg, yes) { dlg('<p>' + esc(msg) + '</p>', yes); }

  /* drag and resize */
  var drag = null;
  root.addEventListener('pointerdown', function (ev) {
    var bar = ev.target.closest && ev.target.closest('[data-bar]'), rz = ev.target.closest && ev.target.closest('[data-rz]'); if (!bar && !rz) return; if (ev.target.closest('button') && !rz) return;
    var el = ev.target.closest('.dkw'), w = byId(el.getAttribute('data-id')); if (!w) return; focus(w);
    if (bar && w.max) { if (ev.target.closest('button')) return; w.max = false; w.x = Math.max(0, ev.clientX - w.w / 2); w.y = 0; place(w); }
    drag = { w: w, mode: bar ? 'move' : rz.getAttribute('data-rz'), sx: ev.clientX, sy: ev.clientY, ox: w.x, oy: w.y, ow: w.w, oh: w.h }; root.classList.add('dk-drag'); ev.preventDefault();
    try { root.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  root.addEventListener('pointermove', function (ev) {
    if (!drag) return; var w = drag.w, dx = ev.clientX - drag.sx, dy = ev.clientY - drag.sy, ar = area();
    if (drag.mode === 'move') { w.x = Math.max(-w.w + 80, Math.min(ar.w - 80, drag.ox + dx)); w.y = Math.max(0, Math.min(ar.h - 36, drag.oy + dy)); }
    else { if (/r/.test(drag.mode)) w.w = Math.max(320, Math.min(ar.w - w.x, drag.ow + dx)); if (/b/.test(drag.mode)) w.h = Math.max(220, Math.min(ar.h - w.y, drag.oh + dy)); }
    place(w);
  });
  var end = function () { if (drag) { drag = null; root.classList.remove('dk-drag'); } };
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
  window.addEventListener('resize', function () { if (D.open) D.wins.forEach(place); });
  setInterval(function () { var c = $('#dkclock'); if (c && D.open) c.textContent = clock(); }, 20000);
  window.addEventListener('popstate', function () { if (location.hash === '#desktop') { if (!D.open) show(); } else if (D.open) hide(false); });
  (function wait(n) { if (S.user) { if (location.hash === '#desktop') show(); return; } if (n < 80) setTimeout(function () { wait(n + 1); }, 150); })(0);

  window.AOSDesk = { show: show, hide: hide, state: D, openApp: openApp };
})();
