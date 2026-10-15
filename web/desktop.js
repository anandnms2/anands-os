/* Anands Desktop: a windowed desktop on top of the OS. Opens from the Desktop button next to the logo.
 * Windows hold the Suite apps (served by this container), a file manager for your Cloudreve Drive and Google Drive, viewers and its own assistant. */
(function () {
  'use strict';
  var A = window.AOS; if (!A) return;
  var S = A.S, $ = A.$, esc = A.esc, api = A.api, toast = A.toast, ic = A.ic, LS = A.LS;
  var ROOT = '/Drive', enc = encodeURIComponent, TASK = 52;
  var WALLS = [['dusk', 'Dusk', 'linear-gradient(135deg,#1b1020 0%,#3a1c10 55%,#f68712 130%)'], ['night', 'Night', 'linear-gradient(135deg,#07080b,#161a24 60%,#243049)'], ['ember', 'Ember', 'radial-gradient(1200px 700px at 80% 100%,#f68712 0%,#5b2506 40%,#0d0a08 100%)'], ['forest', 'Forest', 'linear-gradient(135deg,#07130e,#12301f 60%,#2a6a45)'], ['paper', 'Paper', 'linear-gradient(135deg,#f6f1e8,#e6dcc8)'], ['aurora', 'Aurora', 'radial-gradient(900px 500px at 20% 10%,#1f8a70 0%,transparent 60%),radial-gradient(900px 600px at 85% 90%,#6a3fd0 0%,transparent 60%),#0a0d14'], ['sunset', 'Sunset', 'linear-gradient(180deg,#2b1055 0%,#d4506a 55%,#f6a640 100%)'], ['ocean', 'Ocean', 'linear-gradient(160deg,#03111f,#0a3a5c 55%,#1a8fb0)'], ['graphite', 'Graphite', 'linear-gradient(135deg,#111214,#24262b)'], ['rose', 'Rose', 'linear-gradient(135deg,#2a0f1d,#7a2b4a 60%,#e07a8f)'], ['sand', 'Sand', 'linear-gradient(135deg,#efe3cf,#d9bf92)'], ['grid', 'Grid', 'linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px) 0 0/40px 40px,linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px) 0 0/40px 40px,#0b0c10'], ['mist', 'Mist', 'linear-gradient(135deg,#dfe7ef,#b9c6d6)']];
  var LIGHT = { paper: 1, sand: 1, mist: 1 };
  var CATS = ['Office', 'Productivity', 'Collaboration', 'Business', 'Finance', 'Creative Tools', 'Engineering', 'Developer Tools', 'Games'];
  var D = { open: false, wins: [], z: 10, n: 0, menu: false, wall: LS.get('deskwall', 'dusk'), g: null, ai: { msgs: [], busy: false, file: null, win: null }, ctxm: null, q: '' };

  var OSAPPS = [['photos', 'Photos', 'photos'], ['pulse', 'Pulse', 'pulse'], ['cards', 'Cards', 'card'], ['vault', 'Vault', 'lock'], ['insights', 'Insights', 'insights'], ['vpn', 'VPN', 'vpn'], ['servers', 'Servers', 'monitor']];
  var OSICON = {}; OSAPPS.forEach(function (o) { OSICON[o[0]] = o[2]; });
  var KIND_IC = { ai: 'chat', browser: 'globe', rbrowser: 'globe', files: 'folder' };
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
  function wallImg() { try { return localStorage.getItem('aos.deskwallimg'); } catch (e) { return null; } }
  function wallStyle() { var el = $('#dkwall'), img = D.wall === 'custom' ? wallImg() : null;
    if (img) { el.style.background = 'url(' + img + ') center/cover no-repeat #000'; root.classList.remove('dk-light'); return; }
    var w = WALLS.filter(function (x) { return x[0] === D.wall; })[0] || WALLS[0]; el.style.background = w[2]; root.classList.toggle('dk-light', !!LIGHT[w[0]]); }
  function wallPanel() {
    var c = $('#dkctx'), cur = D.wall, img = wallImg();
    c.innerHTML = '<div class="dk-wp"><b>Wallpaper</b><div class="dk-wg">' + WALLS.map(function (w) { return '<button class="dk-wsw' + (cur === w[0] ? ' on' : '') + '" data-dk="wallset" data-k="' + w[0] + '" style="background:' + esc(w[2]) + '" title="' + esc(w[1]) + '" aria-label="' + esc(w[1]) + '"></button>'; }).join('') + (img ? '<button class="dk-wsw' + (cur === 'custom' ? ' on' : '') + '" data-dk="wallset" data-k="custom" style="background:url(' + img + ') center/cover" title="Your picture" aria-label="Your picture"></button>' : '') + '</div><div class="dk-wa"><button class="btn sm" data-dk="wallup">Use my own picture</button>' + (img ? '<button class="btn sm" data-dk="walldel">Remove it</button>' : '') + '</div><input type="file" id="dkwf" accept="image/*" hidden><p class="note" id="dkwn"></p></div>';
    c.style.left = Math.max(8, innerWidth - 330) + 'px'; c.style.top = Math.max(8, innerHeight - 330) + 'px'; c.hidden = false;
  }
  function wallFile(file) {
    var n = $('#dkwn'); if (!file || !/^image\//.test(file.type)) { if (n) n.textContent = 'Choose a picture file.'; return; }
    var u = URL.createObjectURL(file), im = new Image(); im.onload = function () {
      var r = Math.min(1, 1920 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * r); cv.height = Math.round(im.height * r); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u);
      try { localStorage.setItem('aos.deskwallimg', cv.toDataURL('image/jpeg', 0.85)); D.wall = 'custom'; LS.set('deskwall', 'custom'); wallStyle(); wallPanel(); } catch (e) { if (n) n.textContent = 'That picture is too large to keep. Try a smaller one.'; }
    }; im.onerror = function () { URL.revokeObjectURL(u); if (n) n.textContent = 'That file could not be read as a picture (HEIC is not supported here).'; }; im.src = u;
  }

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
    el.insertAdjacentHTML('beforeend', '<div class="dk-wc"><button data-dk="wmin" data-id="' + w.id + '" aria-label="Minimise">&#8211;</button><button data-dk="wmax" data-id="' + w.id + '" aria-label="Exit full screen">&#10530;</button><button data-dk="wclose" data-id="' + w.id + '" aria-label="Close">&#10005;</button></div>');
    w.el = el; w.body = el.querySelector('.dkw-body'); $('#dkwins').appendChild(el); D.wins.push(w); place(w); focus(w); task(); return w;
  }
  D.id0 = 0;
  function place(w) { var el = w.el, ar = area(); el.hidden = w.min; el.style.zIndex = w.z; if (w.max) { el.style.left = 0; el.style.top = 0; el.style.width = ar.w + 'px'; el.style.height = ar.h + 'px'; } else { el.style.left = w.x + 'px'; el.style.top = w.y + 'px'; el.style.width = w.w + 'px'; el.style.height = w.h + 'px'; } el.classList.toggle('max', !!w.max); el.classList.toggle('bare', !!w.max && (w.kind === 'rbrowser' || w.kind === 'browser')); }
  function focus(w) { w.z = ++D.z; D.top = w.id; if (w.min) { w.min = false; } D.wins.forEach(function (x) { x.el.classList.toggle('act', x === w); place(x); }); task(); }
  function byId(id) { return D.wins.filter(function (w) { return w.id === id; })[0]; }
  function closeWin(w) { if (w.onclose) { try { w.onclose(); } catch (e) {} } w.el.remove(); D.wins = D.wins.filter(function (x) { return x !== w; }); if (D.ai.win === w) D.ai.win = null; if (D.top === w.id) { var t = D.wins.filter(function (x) { return !x.min; }).sort(function (a, b) { return b.z - a.z; })[0]; D.top = t ? t.id : null; if (t) focus(t); } task(); }

  function openApp(slug, file) {
    var a = appBy(slug); if (!a) return toast('That app is not available');
    var r = (LS.get('recent', []) || []).filter(function (x) { return x !== slug; }); r.unshift(slug); LS.set('recent', r.slice(0, 6));
    var w = mk('app', a.name, { icon: '/_icons/' + a.slug + '.png', w: 980, h: 640 });
    w.body.innerHTML = '<iframe class="dkw-frame" title="' + esc(a.name) + '" src="/apps/' + esc(a.slug) + '/' + (file ? '?open=' + enc(file) : '') + '" allow="clipboard-read; clipboard-write; fullscreen; microphone; camera; display-capture"></iframe>'; icons();
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
  function loadRb() { if (D.rbTried) return; D.rbTried = true; fetch('/api/rb/status', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (c) { D.rbn = !!(c && c.available); }).catch(function () {}); fetch('/api/settings', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (c) { var u = c && c.rbrowser && c.rbrowser.url; if (u && /^https?:/i.test(u)) { D.rb = u; D.wins.forEach(function (w) { if (w.kind === 'browser') { if (w.b.full === undefined) w.b.full = true; paintBrowser(w); } }); } }).catch(function () {}); }
  function browserWin(url) {
    loadRb();
    var w = mk('browser', 'Browser', { w: 1000, h: 640 }); w.b = { tabs: [], cur: 0, n: 0, full: D.rb ? (url ? false : true) : undefined }; newTab(w, url); return w;
  }
  function newTab(w, url) { var t = { id: ++w.b.n, url: '', title: 'New tab', hist: [], i: -1 }; w.b.tabs.push(t); w.b.cur = t.id; paintBrowser(w); if (url) nav(w, t, url); else { var q = w.body.querySelector('.dk-url'); if (q) q.focus(); } return t; }
  function nav(w, t, input, noPush) {
    var u = normUrl(input); if (!u) return; t.url = u; t.want = u; t.force = true; t.title = u.replace(/^https?:\/\//, '').slice(0, 40);
    if (!noPush) { t.hist = t.hist.slice(0, t.i + 1); t.hist.push(u); t.i = t.hist.length - 1; }
    paintBrowser(w);
  }
  function bstart(w) {
    return '<div class="dk-start2"><h2>Browser</h2><form data-dk-form="url" data-id="' + w.id + '" class="dk-sf"><input class="input dk-url" placeholder="Search the web or type an address" autocomplete="off" aria-label="Search"><button class="btn primary">Go</button></form><div class="dk-q">' + QUICK.map(function (q) { return '<button class="btn" data-dk="bgo" data-id="' + w.id + '" data-u="' + esc(q[1]) + '">' + esc(q[0]) + '</button>'; }).join('') + '</div>' +
      '<p class="note">Pages open through your Anands server in a sandbox, so sites cannot see your Anands session. Simple pages work best. Cookies are kept for your session, so many sign-ins and forms work. For video calls, payments and heavy web apps press Full browser (a complete remote Chrome, set up in Settings) or open the page in a real tab.</p></div>';
  }
  function paintBrowser(w) {
    var b = w.b, t = btab(w);
    if (!w.body.querySelector('.dk-br')) w.body.innerHTML = '<div class="dk-br"><div class="dk-bts" role="tablist"></div><div class="dk-barw"></div><div class="dk-bv"><div class="dk-sw"></div></div></div>';
    w.body.querySelector('.dk-bts').innerHTML = b.tabs.map(function (x) { return '<div class="dk-bt' + (x.id === b.cur ? ' on' : '') + '" data-dk="btab" data-id="' + w.id + '" data-t="' + x.id + '" role="tab" aria-selected="' + (x.id === b.cur) + '"><span>' + esc(x.title) + '</span>' + (b.tabs.length > 1 ? '<button data-dk="bclose" data-id="' + w.id + '" data-t="' + x.id + '" aria-label="Close tab">&#10005;</button>' : '') + '</div>'; }).join('') + '<button class="dk-bnew" data-dk="bnew" data-id="' + w.id + '" aria-label="New tab">+</button>' + (D.rb ? '<button class="btn sm dk-bfull' + (b.full ? ' on' : '') + '" data-dk="bfull" data-id="' + w.id + '" title="A complete remote browser: sign-ins, video, web apps">' + (b.full ? 'Simple tabs' : 'Full browser') + '</button>' : '');
    var rf = w.body.querySelector('.dk-bv iframe.dk-rb');
    if (b.full && D.rb) { if (!rf) { rf = document.createElement('iframe'); rf.className = 'dkw-frame dk-rb'; rf.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-pointer-lock'); rf.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen; microphone; camera; autoplay'); rf.title = 'Full browser'; rf.src = D.rb; w.body.querySelector('.dk-bv').appendChild(rf); } rf.hidden = false; w.body.querySelector('.dk-barw').hidden = true; } else { if (rf) rf.hidden = true; w.body.querySelector('.dk-barw').hidden = false; }
    var keep = (document.activeElement && document.activeElement.classList.contains('dk-url') && w.body.contains(document.activeElement)) ? document.activeElement.value : null;
    w.body.querySelector('.dk-barw').innerHTML = '<form class="dk-bar2" data-dk-form="url" data-id="' + w.id + '"><button type="button" class="btn sm" data-dk="bback" data-id="' + w.id + '"' + (t.i > 0 ? '' : ' disabled') + ' aria-label="Back">' + ic('back') + '</button><button type="button" class="btn sm" data-dk="bfwd" data-id="' + w.id + '"' + (t.i < t.hist.length - 1 ? '' : ' disabled') + ' aria-label="Forward">' + ic('r') + '</button><button type="button" class="btn sm" data-dk="breload" data-id="' + w.id + '" aria-label="Reload"' + (t.url ? '' : ' disabled') + '>&#8635;</button><button type="button" class="btn sm" data-dk="bhome" data-id="' + w.id + '" aria-label="Start page">' + ic('home') + '</button>' +
      '<input class="input dk-url" aria-label="Address or search" placeholder="Search or type a web address" value="' + esc(t.url) + '" autocomplete="off" spellcheck="false"><button type="button" class="btn sm" data-dk="bext" data-id="' + w.id + '"' + (t.url ? '' : ' disabled') + ' title="Open this page in a real browser tab" aria-label="Open in a real tab">' + ic('ext') + '</button></form>';
    if (keep !== null) { var ui = w.body.querySelector('.dk-bar2 .dk-url'); ui.value = keep; ui.focus(); }
    var bv = w.body.querySelector('.dk-bv'), sw = bv.querySelector('.dk-sw'); sw.hidden = !!t.url || !!b.full; if (!t.url) sw.innerHTML = bstart(w);
    var have = {}; bv.querySelectorAll('iframe.dk-bf').forEach(function (f) { have[f.getAttribute('data-tab')] = f; });
    Object.keys(have).forEach(function (k) { if (!b.tabs.some(function (x) { return String(x.id) === k; })) have[k].remove(); });
    b.tabs.forEach(function (x) {
      var f = have[x.id];
      if (x.url && !f) { f = document.createElement('iframe'); f.className = 'dkw-frame dk-bf'; f.setAttribute('data-tab', x.id); f.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads'); f.setAttribute('referrerpolicy', 'no-referrer'); f.title = 'Web page'; bv.appendChild(f); x.force = true; }
      if (f && x.force && x.want) { f.src = '/api/browse?url=' + enc(x.want); x.force = false; }
      if (f) f.hidden = b.full || !(x.id === b.cur && x.url);
    });
    w.title = t.url && t.title ? t.title + ' - Browser' : 'Browser'; task();
  }
  window.addEventListener('message', function (ev) {
    var d = ev.data; if (!d || typeof d !== 'object' || (!d.aosBrowse && !d.aosTitle && !d.aosPost)) return;
    for (var i = 0; i < D.wins.length; i++) { var w = D.wins[i]; if (w.kind !== 'browser') continue;
      var fr = Array.prototype.filter.call(w.body.querySelectorAll('iframe.dk-bf'), function (f) { return f.contentWindow === ev.source; })[0]; if (!fr) continue;
      var t = w.b.tabs.filter(function (x) { return String(x.id) === fr.getAttribute('data-tab'); })[0]; if (!t) return;
      if (d.aosPost && d.aosPost.url && /^https?:/i.test(d.aosPost.url)) { postTo(fr, d.aosPost); t.url = d.aosPost.url; t.loading = true; return; }
      if (d.aosBrowse) { if (d.tab) newTab(w, d.aosBrowse); else nav(w, t, d.aosBrowse); return; }
      if (d.aosTitle !== undefined) { t.loading = false; if (d.aosTitle) t.title = String(d.aosTitle).slice(0, 60); if (d.aosUrl && d.aosUrl !== t.url && /^https?:/i.test(d.aosUrl)) { t.url = d.aosUrl; if (t.hist[t.i] !== d.aosUrl) t.hist[t.i] = d.aosUrl; } var cur = w.b.cur === t.id; var tb = w.body.querySelector('.dk-bt[data-t="' + t.id + '"] span'); if (tb) tb.textContent = t.title; var ui = w.body.querySelector('.dk-bar2 .dk-url'); if (ui && cur) ui.value = t.url; w.title = t.title + ' - Browser'; task(); return; }
    }
  });
  function postTo(fr, p) {
    if (!fr.name) fr.name = 'dkf' + Math.random().toString(36).slice(2, 8);
    var f = document.createElement('form'); f.method = 'POST'; f.action = '/api/browse?url=' + enc(p.url); f.target = fr.name; f.style.display = 'none'; f.acceptCharset = 'utf-8';
    (p.fields || []).slice(0, 300).forEach(function (kv) { var i = document.createElement('input'); i.type = 'hidden'; i.name = String(kv[0]); i.value = String(kv[1]); f.appendChild(i); });
    document.body.appendChild(f); f.submit(); f.remove();
  }

  /* ---------- full Chromium running inside the Anands OS server, streamed here ---------- */
  function openBrowser(url) { if (D.rbn) return rbWin(url); if (!D.rbTried) { loadRb(); return void fetch('/api/rb/status', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (c) { D.rbn = !!(c && c.available); openBrowser(url); }).catch(function () { D.rbn = false; browserWin(url); }); } return browserWin(url); }
  function rbWin(url) {
    var ex = D.wins.filter(function (x) { return x.kind === 'rbrowser'; })[0]; if (ex) { focus(ex); if (url) rbPost(ex, '/open', { url: normUrl(url) }); return ex; }
    var w = mk('rbrowser', 'Browser', { w: 1100, h: 700 }); w.r = { tabs: [], active: null, q: [], mv: null, wh: null, fw: 0, fh: 0, down: false };
    w.body.innerHTML = '<div class="dk-br"><div class="dk-bts" role="tablist"></div><div class="dk-barw"></div><div class="dk-bv dk-rv"><canvas class="dk-rc" tabindex="0" aria-label="Web page"></canvas><div class="dk-rmsg" hidden></div></div></div>';
    rbBar(w); var cv = w.body.querySelector('.dk-rc'); rbWire(w, cv);
    var es = new EventSource('/api/rb/events'); w.r.es = es; w.onclose = function () { try { es.close(); } catch (e) {} clearInterval(w.r.tick); };
    es.addEventListener('tabs', function (e) { var d = JSON.parse(e.data); w.r.tabs = d.tabs; w.r.active = d.active; rbBar(w); var t = rbTab(w); w.title = (t && t.title ? t.title + ' - ' : '') + 'Browser'; task(); });
    es.addEventListener('frame', function (e) { var d = JSON.parse(e.data); if (d.tab !== w.r.active) return; var im = new Image(); im.onload = function () { if (cv.width !== im.width || cv.height !== im.height) { cv.width = im.width; cv.height = im.height; } cv.getContext('2d').drawImage(im, 0, 0); w.r.fw = d.w; w.r.fh = d.h; var m = w.body.querySelector('.dk-rmsg'); if (m) m.hidden = true; }; im.src = 'data:image/jpeg;base64,' + d.d; });
    es.addEventListener('down', function () { var m = w.body.querySelector('.dk-rmsg'); if (m) { m.hidden = false; m.textContent = 'The browser stopped. It restarts when you open a page.'; } });
    es.onerror = function () { var m = w.body.querySelector('.dk-rmsg'); if (m && es.readyState === 2) { m.hidden = false; m.textContent = 'The browser is not available right now. Use Simple browser from the top bar.'; } };
    w.r.tick = setInterval(function () { rbFlush(w); }, 40);
    var ro = new ResizeObserver(function () { clearTimeout(w.r.rt); w.r.rt = setTimeout(function () { var v = w.body.querySelector('.dk-rv'); if (v && v.clientWidth > 100) rbPost(w, '/size', { w: v.clientWidth, h: v.clientHeight, dpr: window.devicePixelRatio || 1 }, true); }, 250); }); ro.observe(w.body.querySelector('.dk-rv'));
    setTimeout(function () { var v = w.body.querySelector('.dk-rv'); if (v) rbPost(w, '/size', { w: v.clientWidth, h: v.clientHeight, dpr: window.devicePixelRatio || 1 }, true); if (url) rbPost(w, '/open', { url: normUrl(url) }); else cv.focus(); }, 300);
    return w;
  }
  function rbTab(w) { return w.r.tabs.filter(function (t) { return t.id === w.r.active; })[0]; }
  function rbPost(w, path, body, quiet) { return fetch('/api/rb' + path, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify(body || {}) }).then(function (r) { return r.json().then(function (j) { if (!r.ok && !quiet) toast(j.error || 'The browser could not do that'); return j; }); }).catch(function () {}); }
  function rbBar(w) {
    var r = w.r, t = rbTab(w), st = w.body.querySelector('.dk-bts');
    st.innerHTML = r.tabs.map(function (x) { return '<div class="dk-bt' + (x.id === r.active ? ' on' : '') + '" data-dk="rbtab" data-id="' + w.id + '" data-t="' + esc(x.id) + '" role="tab" aria-selected="' + (x.id === r.active) + '"><span>' + esc((x.loading ? '... ' : '') + (x.title || x.url || 'New tab')) + '</span>' + (r.tabs.length > 1 ? '<button data-dk="rbclose" data-id="' + w.id + '" data-t="' + esc(x.id) + '" aria-label="Close tab">&#10005;</button>' : '') + '</div>'; }).join('') + '<button class="dk-bnew" data-dk="rbnew" data-id="' + w.id + '" aria-label="New tab">+</button><button class="btn sm dk-bfull" data-dk="rbsimple" data-id="' + w.id + '" title="Lighter browser that works inside this site">Simple browser</button>';
    var bar = w.body.querySelector('.dk-barw'), keep = (document.activeElement && document.activeElement.classList.contains('dk-url') && bar.contains(document.activeElement)) ? document.activeElement.value : null;
    bar.innerHTML = '<form class="dk-bar2" data-dk-form="rburl" data-id="' + w.id + '"><button type="button" class="btn sm" data-dk="rbback" data-id="' + w.id + '" aria-label="Back">' + ic('back') + '</button><button type="button" class="btn sm" data-dk="rbfwd" data-id="' + w.id + '" aria-label="Forward">' + ic('r') + '</button><button type="button" class="btn sm" data-dk="rbreload" data-id="' + w.id + '" aria-label="Reload">&#8635;</button><input class="input dk-url" aria-label="Address or search" placeholder="Search or type a web address" value="' + esc(t ? t.url : '') + '" autocomplete="off" spellcheck="false"></form>';
    if (keep !== null) { var ui = bar.querySelector('.dk-url'); ui.value = keep; ui.focus(); }
  }
  function rbQ(w, e, flushNow) { w.r.q.push(e); if (flushNow) rbFlush(w); }
  function rbFlush(w) {
    var r = w.r; if (!r.active) return; var ev = r.q; r.q = []; if (r.mv) { ev.push(r.mv); r.mv = null; } if (r.wh) { ev.push(r.wh); r.wh = null; }
    if (ev.length) rbPost(w, '/input', { tab: r.active, ev: ev }, true);
  }
  function rbWire(w, cv) {
    function pos(e) { var b = cv.getBoundingClientRect(), fw = w.r.fw || cv.width || 1, fh = w.r.fh || cv.height || 1; return { x: Math.round((e.clientX - b.left) * fw / b.width), y: Math.round((e.clientY - b.top) * fh / b.height) }; }
    var mod = function (e) { return (e.altKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.metaKey ? 4 : 0) | (e.shiftKey ? 8 : 0); };
    cv.addEventListener('mousemove', function (e) { var p = pos(e); w.r.mv = { t: 'm', k: 'move', x: p.x, y: p.y, mod: mod(e), held: e.buttons ? 1 : 0, b: e.buttons & 4 ? 1 : e.buttons & 2 ? 2 : 0 }; });
    cv.addEventListener('mousedown', function (e) { cv.focus(); var p = pos(e); w.r.down = true; rbQ(w, { t: 'm', k: 'down', x: p.x, y: p.y, b: e.button, cc: e.detail || 1, mod: mod(e) }, true); e.preventDefault(); });
    window.addEventListener('mouseup', function (e) { if (!w.r.down) return; w.r.down = false; if (!document.contains(cv)) return; var p = pos(e); rbQ(w, { t: 'm', k: 'up', x: p.x, y: p.y, b: e.button, cc: e.detail || 1, mod: mod(e) }, true); });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    cv.addEventListener('wheel', function (e) { e.preventDefault(); var p = pos(e), k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 600 : 1; var o = w.r.wh || { t: 'w', x: p.x, y: p.y, dx: 0, dy: 0, mod: mod(e) }; o.x = p.x; o.y = p.y; o.dx += e.deltaX * k; o.dy += e.deltaY * k; w.r.wh = o; }, { passive: false });
    cv.addEventListener('keydown', function (e) {
      var m = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      if (m && k === 'v') return; /* the paste event brings the text */
      if (m && (k === 'c' || k === 'x')) { rbQ(w, { t: 'k', k: 'down', key: e.key, code: e.code, kc: e.keyCode, mod: mod(e) }, true); rbPost(w, '/copy', { tab: w.r.active }, true).then(function (j) { if (j && j.text) { try { navigator.clipboard.writeText(j.text); } catch (x) {} } }); e.preventDefault(); return; }
      rbQ(w, { t: 'k', k: 'down', key: e.key, code: e.code, kc: e.keyCode, mod: mod(e), rep: e.repeat ? 1 : 0 }, true); e.preventDefault();
    });
    cv.addEventListener('keyup', function (e) { var m = e.ctrlKey || e.metaKey; if (m && e.key.toLowerCase() === 'v') return; rbQ(w, { t: 'k', k: 'up', key: e.key, code: e.code, kc: e.keyCode, mod: mod(e) }, true); e.preventDefault(); });
    cv.addEventListener('paste', function (e) { var t = e.clipboardData && e.clipboardData.getData('text'); if (t) rbQ(w, { t: 'text', s: t }, true); e.preventDefault(); });
  }
  function rbHand(a, b, w) {
    var id = b.getAttribute('data-t');
    if (a === 'rbtab') return void rbPost(w, '/activate', { tab: id });
    if (a === 'rbclose') return void rbPost(w, '/close', { tab: id });
    if (a === 'rbnew') { return void rbPost(w, '/open', {}).then(function () { var u = w.body.querySelector('.dk-url'); if (u) u.focus(); }); }
    if (a === 'rbback') return void rbPost(w, '/go', { tab: w.r.active, dir: 'back' });
    if (a === 'rbfwd') return void rbPost(w, '/go', { tab: w.r.active, dir: 'forward' });
    if (a === 'rbreload') return void rbPost(w, '/go', { tab: w.r.active, dir: 'reload' });
    if (a === 'rbsimple') return void browserWin();
  }
  function bhand(a, b, w) {
    var t = btab(w);
    if (a === 'bfull') { w.b.full = !w.b.full; return void paintBrowser(w); }
    if (a === 'bnew') { w.b.full = false; return void newTab(w); }
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

  /* ---------- files: the same Drive as in Anands OS (Cloudreve + Google Drive), with all its menus, in a window ---------- */
  function filesWin(src) {
    var url = '/?embed=1' + (src === 'google' ? '&root=google' : '') + '#drive', ex = D.wins.filter(function (x) { return x.kind === 'files'; })[0];
    if (ex) { var fr = ex.body.querySelector('iframe'); if (fr && ex.src !== src) { fr.src = url; ex.src = src; } ex.title = src === 'google' ? 'Google Drive' : 'Files'; ex.el.querySelector('.dkw-t b').textContent = ex.title; focus(ex); return ex; }
    var w = mk('files', src === 'google' ? 'Google Drive' : 'Files', { w: 1080, h: 680 }); w.src = src;
    w.body.innerHTML = '<iframe class="dkw-frame" title="Files" src="' + url + '" allow="clipboard-read; clipboard-write; fullscreen"></iframe>'; return w;
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
    api('/api/chat', { method: 'POST', json: { messages: ai.msgs.slice(-12), ctx: { photos: false, insights: false, cards: false, pulse: false, files: true, apps: true }, desktop: { windows: D.wins.map(function (x) { return x.title; }), folder: fw ? (fw.src === 'google' ? 'Google Drive' : 'Files') : '', file: ai.file } } }).then(function (r) {
      var t = String(r.text || ''), act = null; t = t.replace(/^\s*ACTION:\s*(open|openfile)\s+(.+?)\s*$/gim, function (_, k, v) { act = { k: k, v: v.trim() }; return ''; }).trim();
      ai.msgs.push({ role: 'assistant', content: t || 'Done.' }); ai.busy = false; paintAi();
      if (act && act.k === 'open' && (act.v.toLowerCase() === 'browser' || OSICON[act.v.toLowerCase()])) { if (act.v.toLowerCase() === 'browser') openBrowser(); else osWin(act.v.toLowerCase()); act = null; }
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
    if (b.classList.contains('cm')) $('#dkctx').hidden = true;
    var a = b.getAttribute('data-dk'), id = b.getAttribute('data-id'), w = id ? byId(id) : null;
    if (a === 'open') return void show();
    if (a === 'exit') return void hide(true);
    if (a === 'menu') { D.menu = !D.menu; D.q = ''; menu(); task(); var q = $('#dkq'); if (q) q.focus(); return; }
    if (D.menu && (a === 'launch' || a === 'app' || a === 'settings')) { D.menu = false; menu(); task(); }
    if (a === 'launch') { var k = b.getAttribute('data-w'); if (k === 'ai') return void aiWin(); if (k === 'browser') return void openBrowser(); if (k.indexOf('os:') === 0) return void osWin(k.slice(3)); return void filesWin(k === 'google' ? 'google' : 'cloud'); }
    if (a === 'app') return void openApp(b.getAttribute('data-s'));
    if (a === 'settings') { hide(); return void A.go('settings'); }
    if (a === 'tb') { if (!w) return; if (!w.min && D.top === w.id) { w.min = true; place(w); task(); } else focus(w); return; }
    if (w && w.kind === 'rbrowser' && /^rb/.test(a)) return void rbHand(a, b, w);
    if (w && w.kind === 'browser' && /^b/.test(a) && a !== 'bar') return void bhand(a, b, w);
    if (a === 'wmin' && w) { w.min = true; place(w); task(); return; }
    if (a === 'wmax' && w) { w.max = !w.max; place(w); return; }
    if (a === 'wclose' && w) return void closeWin(w);
    if (a === 'showdesk') { D.wins.forEach(function (x) { x.min = true; place(x); }); task(); return; }
    if (a === 'closeall') { D.wins.slice().forEach(closeWin); return; }
    if (a === 'wall') return void wallPanel();
    if (a === 'wallset') { D.wall = b.getAttribute('data-k'); LS.set('deskwall', D.wall); wallStyle(); return void wallPanel(); }
    if (a === 'wallup') { var wf = $('#dkwf'); if (wf) wf.click(); return; }
    if (a === 'walldel') { try { localStorage.removeItem('aos.deskwallimg'); } catch (e) {} if (D.wall === 'custom') { D.wall = 'dusk'; LS.set('deskwall', 'dusk'); } wallStyle(); return void wallPanel(); }
    /* files */
    if (a === 'vsave' && w) { var ta = w.body.querySelector('textarea'), st = $('#vs' + w.id); st.textContent = 'Saving...'; return void api('/_local/fs/write?path=' + enc(w.data.path) + '&overwrite=1', { method: 'POST', body: ta.value, headers: { 'content-type': 'text/plain' } }).then(function () { st.textContent = 'Saved to Drive'; }).catch(function (e) { st.textContent = 'Could not save: ' + e.message; }); }
    if (a === 'vai' && w) { var ta2 = w.body.querySelector('textarea'); return void askAboutFile(w.title, Promise.resolve(ta2.value)); }
    if (a === 'aidrop') { D.ai.file = null; return void paintAi(); }
  });
  document.addEventListener('keydown', function (ev) {
    if (!D.open) return; if (ev.key === 'Escape' && !$('#dkctx').hidden) { $('#dkctx').hidden = true; return; } if (ev.key === 'Escape') { if (D.menu) { D.menu = false; menu(); task(); } return; }
    if (ev.key === 'Enter' && !ev.shiftKey && ev.target.id === 'dkain') { ev.preventDefault(); var v = ev.target.value; ev.target.value = ''; aiSend(v); }
  });
  document.addEventListener('submit', function (ev) { var fm = ev.target; if (fm.getAttribute && fm.getAttribute('data-dk-form') === 'rburl') { ev.preventDefault(); var rw = byId(fm.getAttribute('data-id')); if (rw) { var ri = fm.querySelector('.dk-url'), u = normUrl(ri.value); if (u) { rbPost(rw, rw.r.active ? '/nav' : '/open', { tab: rw.r.active, url: u }); var cvv = rw.body.querySelector('.dk-rc'); if (cvv) cvv.focus(); } } return; }
    if (fm.getAttribute && fm.getAttribute('data-dk-form') === 'url') { ev.preventDefault(); var bw = byId(fm.getAttribute('data-id')); if (bw) { var inp = fm.querySelector('.dk-url'); nav(bw, btab(bw), inp.value); } return; } if (ev.target.getAttribute && ev.target.getAttribute('data-dk-form') === 'ai') { ev.preventDefault(); var i = $('#dkain'); var v = i.value; i.value = ''; aiSend(v); } });
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (t.id === 'dkq') { D.q = t.value; var pos = t.selectionStart; menu(); var n = $('#dkq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }
  });
  /* right-click menus: desktop, icons, pinned apps, window title bars, taskbar buttons and the taskbar itself */
  function ctx(ev, items) {
    var c = $('#dkctx'); c.innerHTML = items.map(function (x) { return x === '-' ? '<hr>' : '<button class="cm" data-dk="' + x[1] + '"' + (x[2] || '') + (x[3] ? ' disabled' : '') + '>' + esc(x[0]) + '</button>'; }).join('');
    c.hidden = false; c.style.left = Math.max(4, Math.min(ev.clientX, innerWidth - c.offsetWidth - 6)) + 'px'; c.style.top = Math.max(4, Math.min(ev.clientY, innerHeight - c.offsetHeight - 6)) + 'px';
  }
  var winItems = function (w) { return [[w.min ? 'Restore' : 'Minimise', w.min ? 'tb' : 'wmin', ' data-id="' + w.id + '"'], [w.max ? 'Restore size' : 'Maximise', 'wmax', ' data-id="' + w.id + '"'], '-', ['Close', 'wclose', ' data-id="' + w.id + '"']]; };
  document.addEventListener('contextmenu', function (ev) {
    if (!D.open) return; var t = ev.target; if (!t.closest || t.closest('#dkctx')) return ev.preventDefault();
    if (t.closest('input, textarea, [contenteditable], canvas, iframe')) return;
    var deskItems = [['Wallpaper...', 'wall'], '-', ['Open Files', 'launch', ' data-w="files"'], ['Open Browser', 'launch', ' data-w="browser"'], ['Open Assistant', 'launch', ' data-w="ai"'], ['Show desktop', 'showdesk'], '-', ['Settings', 'settings'], ['Exit to Anands OS', 'exit']];
    var el;
    if ((el = t.closest('.dkw-bar'))) { var w = byId(el.closest('.dkw').getAttribute('data-id')); if (!w) return; ev.preventDefault(); return ctx(ev, winItems(w).concat([['Close all windows', 'closeall']])); }
    if ((el = t.closest('.dk-rb'))) { var w2 = byId(el.getAttribute('data-id')); if (!w2) return; ev.preventDefault(); return ctx(ev, winItems(w2)); }
    if ((el = t.closest('.dk-ic, .dk-pin'))) { var d = el.getAttribute('data-dk'); ev.preventDefault(); var open = [['Open', d, (el.getAttribute('data-w') ? ' data-w="' + el.getAttribute('data-w') + '"' : '') + (el.getAttribute('data-s') ? ' data-s="' + esc(el.getAttribute('data-s')) + '"' : '')]]; return ctx(ev, open.concat(['-', ['Wallpaper...', 'wall'], ['Show desktop', 'showdesk']])); }
    if (t.closest('.dk-task')) { ev.preventDefault(); return ctx(ev, [['Show desktop', 'showdesk'], ['Close all windows', 'closeall', '', !D.wins.length], '-', ['Wallpaper...', 'wall'], ['Exit to Anands OS', 'exit']]); }
    if (t.closest('#dkicons, .dk-wall, .dk-wins') && !t.closest('.dkw')) { ev.preventDefault(); return ctx(ev, deskItems); }
    if (t.closest('.dkw, #dkmenu')) { if (t.closest('.dkw-body') && !t.closest('a, button')) return; ev.preventDefault(); }
  });

  /* drag and resize */
  var drag = null;
  root.addEventListener('pointerdown', function (ev) {
    if (ev.button) return;
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
  document.addEventListener('change', function (ev) { if (ev.target.id === 'dkwf') { wallFile(ev.target.files[0]); ev.target.value = ''; } });
  window.addEventListener('popstate', function () { if (location.hash === '#desktop') { if (!D.open) show(); } else if (D.open) hide(false); });
  (function wait(n) { if (S.user) { if (location.hash === '#desktop') show(); return; } if (n < 80) setTimeout(function () { wait(n + 1); }, 150); })(0);

  window.AOSDesk = { show: show, hide: hide, state: D, openApp: openApp };
})();
