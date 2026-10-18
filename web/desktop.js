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

  var OSAPPS = [['photos', 'Photos', 'photos'], ['vault', 'Vault', 'lock'], ['insights', 'Insights', 'insights'], ['vpn', 'VPN', 'vpn'], ['servers', 'Servers', 'monitor']];
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
  root.innerHTML = '<div class="dk-wall" id="dkwall"></div><div class="dk-stick" id="dkstick"></div><div class="dk-icons" id="dkicons"></div><div class="dk-wins" id="dkwins"></div><div class="dk-menu" id="dkmenu" hidden></div><div class="dk-ctx" id="dkctx" hidden></div><button class="dk-fab" id="dkfab" data-dk="aifab" aria-label="Ask the assistant" title="Ask the assistant"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg></button>' +
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

  /* ---------- launcher: catalog, desktop icons, taskbar pins, Start menu, icon chooser ---------- */
  var TOOLS = [['editor', 'Editor', '/tools/editor.html', 1000, 640, 'file'], ['player', 'Player', '/tools/player.html', 920, 600, 'play'], ['recorder', 'Recorder', '/tools/recorder.html', 820, 640, 'mic'], ['terminal', 'Terminal', '/tools/terminal.html', 900, 580, 'terminal'], ['money', 'Money', '/tools/money.html#overview', 1040, 660, 'card'], ['subs', 'Subscriptions', '/tools/money.html#subs', 940, 640, 'card'], ['invest', 'Investments', '/tools/money.html#invest', 980, 640, 'card'], ['belong', 'Belongings', '/tools/home.html#belong', 980, 640, 'folder'], ['house', 'Household', '/tools/home.html#house', 940, 640, 'folder'], ['paperless', 'Paperless', '/tools/paperless.html', 1100, 680, 'file'], ['bookmarks', 'Links', '/tools/bookmarks.html', 1100, 680, 'file'], ['notes', 'Notes', '/tools/notes.html', 1100, 680, 'file']];
  var SYS = [['browser', 'Browser', 'globe'], ['files', 'Files', 'folder'], ['google', 'Google Drive', 'cloud'], ['ai', 'Assistant', 'chat'], ['calc', 'Calculator', 'card'], ['sticky', 'Sticky Notes', 'file'], ['clock', 'Clock', 'photos'], ['conv', 'Converter', 'card'], ['snip', 'Screenshot and Snip', 'photos']].concat(TOOLS.map(function (o) { return ['tool:' + o[0], o[1], o[5]]; })).concat(OSAPPS.map(function (o) { return ['os:' + o[0], o[1], o[2]]; }));
  var DEF_ICONS = ['browser', 'files', 'ai'].concat(OSAPPS.map(function (o) { return 'os:' + o[0]; })).concat(['google']).concat(TOOLS.map(function (o) { return 'tool:' + o[0]; })).concat(['conv']), DEF_PINS = ['browser', 'files', 'ai', 'calc'];
  var NCAT = { calc: 'Productivity', sticky: 'Productivity', clock: 'Productivity', conv: 'Productivity', snip: 'Creative Tools', 'tool:paperless': 'Productivity', 'tool:bookmarks': 'Productivity', 'tool:notes': 'Productivity', 'tool:editor': 'Developer Tools', 'tool:terminal': 'Developer Tools', 'tool:player': 'Creative Tools', 'tool:recorder': 'Creative Tools', 'tool:money': 'Finance', 'tool:subs': 'Finance', 'tool:invest': 'Finance', 'tool:belong': 'Productivity', 'tool:house': 'Productivity', 'os:photos': 'Creative Tools', 'os:cards': 'Business', 'os:vault': 'Productivity', 'os:insights': 'Engineering', 'os:servers': 'Engineering', 'os:vpn': 'Engineering' };
  function catalog() {
    var l = SYS.map(function (i) { return { id: i[0], name: i[1], ic: i[2], cat: NCAT[i[0]] || 'System', hay: i[1] + ' system' + (i[0] === 'google' ? ' drive cloud' : '') + (i[0] === 'browser' ? ' web internet' : '') }; });
    apps().forEach(function (a) { l.push({ id: 'app:' + a.slug, name: a.name, img: '/_icons/' + a.slug + '.png', slug: a.slug, cat: CATS.indexOf(a.category) >= 0 ? a.category : 'Other', hay: a.name + ' ' + (a.category || '') + ' ' + (a.alternativeTo || '') }); });
    return l;
  }
  function itemBy(id) { return catalog().filter(function (i) { return i.id === id; })[0]; }
  function itAttr(it) { return (it.slug ? 'data-dk="app" data-s="' + esc(it.slug) + '"' : 'data-dk="launch" data-w="' + esc(it.id) + '"') + ' data-k="' + esc(it.id) + '"'; }
  var OI = { calc: 'calc', sticky: 'sticky', clock: 'clock', conv: 'conv', snip: 'snip', 'tool:paperless': 'paperless', 'tool:bookmarks': 'bookmarks', 'tool:notes': 'notes', 'tool:editor': 'editor', 'tool:player': 'player', 'tool:recorder': 'recorder', 'tool:terminal': 'terminal', 'tool:money': 'money', 'tool:subs': 'subs', 'tool:invest': 'invest', 'tool:belong': 'belong', 'tool:house': 'house', browser: 'browser', files: 'files', google: 'drive', ai: 'ai', 'os:photos': 'photos', 'os:cards': 'cards', 'os:vault': 'vault', 'os:insights': 'insights', 'os:vpn': 'vpn', 'os:servers': 'servers' };
  function wIcon(w) { if (w.icon) return w.icon; var k = w.kind === 'rbrowser' || w.kind === 'browser' ? 'browser' : w.kind === 'ai' || w.kind === 'files' ? w.kind : w.tool ? 'tool:' + w.tool : w.view ? 'os:' + w.view : ''; return OI[k] ? '/oicons/' + OI[k] + '.svg' : ''; }
  function itGlyph(it, cls) { if (!it.img && OI[it.id]) it.img = '/oicons/' + OI[it.id] + '.svg'; return it.img ? '<img src="' + esc(it.img) + '" alt="">' : '<span class="dk-icg' + (cls ? ' ' + cls : '') + '">' + ic(it.ic) + '</span>'; }
  function lsList(k, d) { var v = LS.get(k, null); return Array.isArray(v) ? v : d.slice(); }
  function deskIds() { return lsList('deskicons', DEF_ICONS); }
  function pinIds() { return lsList('deskpins', DEF_PINS); }
  function setIcons(l) { LS.set('deskicons', l); icons(); }
  function setPins(l) { LS.set('deskpins', l); task(); }
  function used(id) { var u = LS.get('deskuse', {}) || {}; u[id] = (u[id] || 0) + 1; LS.set('deskuse', u); var r = (LS.get('deskrecent', []) || []).filter(function (x) { return x !== id; }); r.unshift(id); LS.set('deskrecent', r.slice(0, 6)); }
  function toggle(list, id, on) { var l = list.filter(function (x) { return x !== id; }); if (on) l.push(id); return l; }
  /* Desktop icons sit on a grid. Each has a cell (column, row); drag one onto another cell to move it, onto an icon to swap. */
  var CW = 100, CH = 106;
  function gridSize() { var c = $('#dkicons'); return { cols: Math.max(1, Math.floor(((c && c.clientWidth) || 800) / CW)), rows: Math.max(1, Math.floor(((c && c.clientHeight) || 600) / CH)) }; }
  function cells(ids) {
    var g = gridSize(), saved = LS.get('deskpos', {}) || {}, taken = {}, out = {};
    ids.forEach(function (id) { var q = saved[id]; if (q && q[0] < g.cols && q[1] < g.rows && !taken[q[0] + ',' + q[1]]) { taken[q[0] + ',' + q[1]] = id; out[id] = [q[0], q[1]]; } });
    var c = 0, r = 0; ids.forEach(function (id) { if (out[id]) return; while (taken[c + ',' + r]) { r++; if (r >= g.rows) { r = 0; c++; } } if (c >= g.cols) { c = g.cols - 1; r = g.rows - 1; } taken[c + ',' + r] = id; out[id] = [c, r]; });
    return out;
  }
  function icons() {
    var cat = catalog(), ids = deskIds().filter(function (id) { return cat.some(function (i) { return i.id === id; }); }), pos = cells(ids);
    var box = $('#dkicons'), mob = window.matchMedia('(max-width:760px)').matches; box.classList.toggle('mob', mob);
    if (mob) { box.innerHTML = ids.map(function (id) { var it = cat.filter(function (i) { return i.id === id; })[0]; return '<button class="dk-ic" ' + itAttr(it) + '>' + itGlyph(it) + '<span>' + esc(it.name) + '</span></button>'; }).join(''); return; }
    $('#dkicons').innerHTML = ids.map(function (id) { var it = cat.filter(function (i) { return i.id === id; })[0]; return '<button class="dk-ic" style="left:' + pos[id][0] * CW + 'px;top:' + pos[id][1] * CH + 'px" ' + itAttr(it) + '>' + itGlyph(it) + '<span>' + esc(it.name) + '</span></button>'; }).join('');
  }
  function iconsArrange(mode) {
    var cat = catalog(), ids = deskIds().filter(function (id) { return cat.some(function (i) { return i.id === id; }); });
    if (mode === 'name' || mode === 'type') {
      var it = function (id) { return cat.filter(function (i) { return i.id === id; })[0]; }, nm = function (id) { return it(id).name.toLowerCase(); }, order = ['System'].concat(CATS, ['Other']), ty = function (id) { var c = it(id).cat, n = order.indexOf(c); return n < 0 ? 99 : n; };
      ids.sort(function (a, b) { if (mode === 'type' && ty(a) !== ty(b)) return ty(a) - ty(b); return nm(a) < nm(b) ? -1 : nm(a) > nm(b) ? 1 : 0; }); LS.set('deskicons', ids);
    }
    LS.set('deskpos', {}); icons();
  }
  (function iconDrag() {
    var st = null;
    document.addEventListener('pointerdown', function (e) {
      var b = e.target.closest && e.target.closest('#dkicons .dk-ic'); if (!b || e.button || b.parentNode.classList.contains('mob')) return;
      st = { b: b, x: e.clientX, y: e.clientY, id: b.getAttribute('data-k'), on: false, l: parseFloat(b.style.left), t: parseFloat(b.style.top) };
    });
    document.addEventListener('pointermove', function (e) {
      if (!st) return; var dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.on) { if (Math.abs(dx) + Math.abs(dy) < 7) return; st.on = true; st.b.classList.add('drag'); try { st.b.setPointerCapture(e.pointerId); } catch (x) {} }
      st.b.style.left = (st.l + dx) + 'px'; st.b.style.top = (st.t + dy) + 'px'; e.preventDefault();
    });
    function end(e) {
      if (!st) return; var s = st; st = null; if (!s.on) return; s.b.classList.remove('drag'); D.noClick = Date.now();
      var g = gridSize(), ids = deskIds(), pos = cells(ids), c = Math.max(0, Math.min(g.cols - 1, Math.round((parseFloat(s.b.style.left)) / CW))), r = Math.max(0, Math.min(g.rows - 1, Math.round((parseFloat(s.b.style.top)) / CH))), from = pos[s.id];
      var other = ids.filter(function (i) { return i !== s.id && pos[i] && pos[i][0] === c && pos[i][1] === r; })[0];
      var all = {}; ids.forEach(function (i) { all[i] = pos[i]; }); all[s.id] = [c, r]; if (other) all[other] = from; LS.set('deskpos', all); icons();
    }
    document.addEventListener('dragstart', function (e) { if (e.target.closest && e.target.closest('#dkicons')) e.preventDefault(); });
    document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
    document.addEventListener('click', function (e) { if (D.noClick && Date.now() - D.noClick < 400 && e.target.closest && e.target.closest('#dkicons .dk-ic')) { e.stopPropagation(); e.preventDefault(); D.noClick = 0; } }, true);
    window.addEventListener('resize', function () { if (D.open) icons(); });
  })();
  function pinBtn(it) { return '<button class="dk-pin" ' + itAttr(it) + ' title="' + esc(it.name) + '">' + (it.img ? '<img src="' + esc(it.img) + '" alt="">' : ic(it.ic)) + '</button>'; }
  /* the assistant button is out of the way while a window fills the screen */
  function fabVis() { var f = document.getElementById('dkfab'); if (f) f.classList.toggle('away', !!document.fullscreenElement || D.wins.some(function (x) { return x.max && !x.min && x.kind !== 'ai'; })); }
  document.addEventListener('fullscreenchange', function () { fabVis(); });
  function task() {
    fabVis();
    var cat = catalog(), pins = pinIds().map(function (id) { return cat.filter(function (i) { return i.id === id; })[0]; }).filter(Boolean);
    var h = '<button class="dk-start' + (D.menu ? ' on' : '') + '" data-dk="menu" aria-label="Start"><img src="/logo-orange.png" alt=""></button><button class="dk-pin dk-qs" data-dk="qs" title="Quick Launcher (Ctrl + Space)" aria-label="Quick Launcher">' + ic('search') + '</button><div class="dk-pins">' + pins.map(pinBtn).join('') + '</div><div class="dk-run">';
    D.wins.forEach(function (w) { if (w.kind === 'ai') return; h += '<button class="dk-rb' + (w.min ? ' min' : '') + (w.id === D.top && !w.min ? ' on' : '') + '" data-dk="tb" data-id="' + w.id + '" title="' + esc(w.title) + '">' + (wIcon(w) ? '<img src="' + esc(wIcon(w)) + '" alt="">' : '<span class="dk-rg">' + ic(KIND_IC[w.kind] || (w.view && OSICON[w.view]) || 'folder') + '</span>') + '<span>' + esc(w.title) + '</span></button>'; });
    h += '</div><span class="sp"></span><button class="dk-tray" data-dk="snip" title="Screenshot and Snip (Ctrl + Alt + S)" aria-label="Screenshot and Snip"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/></svg></button><button class="dk-tray" data-dk="fs" title="Full screen, so Alt + Tab and the Windows key work here" aria-label="Full screen">' + ic('ext') + '</button><button class="dk-tray" data-dk="wall" title="Wallpaper">' + ic('photos') + '</button><button class="dk-clock" id="dkclock" data-dk="clockpop" title="Clock, timer and stopwatch" aria-label="Clock">' + esc(clock()) + '</button><button class="dk-exit" data-dk="exit" title="Back to Anands OS">' + ic('out') + 'Exit</button>';
    $('#dktask').innerHTML = h;
  }
  function menu() {
    var m = $('#dkmenu'); m.hidden = !D.menu; if (!D.menu) return;
    var q = D.q.toLowerCase().trim(), all = catalog(), row = function (it) { return '<button class="dk-mi" ' + itAttr(it) + '>' + itGlyph(it, 'sm') + '<span>' + esc(it.name) + '</span></button>'; };
    var h = '<div class="dk-mh"><input class="input" id="dkq" type="search" placeholder="Search apps, then press Enter" value="' + esc(D.q) + '" autocomplete="off"></div>';
    var cats = ['System'].concat(CATS, ['Other']).filter(function (c) { return all.some(function (i) { return i.cat === c; }); });
    if (!q) h += '<div class="dk-chips">' + ['All'].concat(cats).map(function (c) { var on = (D.cat || 'All') === c; return '<button class="dk-chip' + (on ? ' on' : '') + '" data-dk="mcat" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>';
    h += '<div class="dk-ml">';
    if (q) { var r = all.filter(function (i) { return i.hay.toLowerCase().indexOf(q) >= 0; }); h += r.length ? '<div class="dk-mg">' + r.map(row).join('') + '</div>' : '<p class="note" style="padding:14px 8px">Nothing matches "' + esc(D.q) + '".</p>'; }
    else {
      var rec = (!D.cat || D.cat === 'All') ? (LS.get('deskrecent', []) || []).map(function (id) { return all.filter(function (i) { return i.id === id; })[0]; }).filter(Boolean).slice(0, 6) : [], seen = {};
      if (rec.length) { h += '<div class="dk-mc">Recent</div><div class="dk-mg">' + rec.map(function (i) { seen[i.id] = 1; return row(i); }).join('') + '</div>'; }
      cats.forEach(function (c) { if (D.cat && D.cat !== 'All' && D.cat !== c) return; var l = all.filter(function (i) { return i.cat === c && !seen[i.id]; }); if (!l.length) return; h += '<div class="dk-mc">' + esc(c === 'System' ? 'System' : c) + '</div><div class="dk-mg">' + l.map(row).join('') + '</div>'; });
    }
    h += '</div><div class="dk-mf"><button class="dk-mi" data-dk="settings"><span class="dk-icg sm">' + ic('settings') + '</span><span>Settings</span></button><button class="dk-mi" data-dk="chooser"><span class="dk-icg sm">' + ic('folder') + '</span><span>Choose desktop icons</span></button></div>';
    m.innerHTML = h;
  }
  function chooser() {
    var ex = D.wins.filter(function (x) { return x.kind === 'chooser'; })[0]; if (ex) { focus(ex); return ex; }
    var w = mk('chooser', 'Desktop icons', { w: 560, h: 620 }); w.q = ''; paintChooser(w); return w;
  }
  function paintChooser(w) {
    var all = catalog(), on = deskIds(), pins = pinIds(), u = LS.get('deskuse', {}) || {}, q = (w.q || '').toLowerCase();
    var cats = ['System'].concat(CATS, ['Other']), h = '<div class="dk-ch"><p class="note">Tick what you want on your desktop. Everything stays in the Start menu either way.</p><input class="input" id="dkcq" type="search" placeholder="Search" value="' + esc(w.q || '') + '" autocomplete="off"><div class="dk-cb"><button class="btn sm" data-dk="chsuggest">Suggest for me</button><button class="btn sm" data-dk="chall">Select all</button><button class="btn sm" data-dk="chnone">Clear all</button><button class="btn sm" data-dk="chreset">Reset</button><span class="sp"></span><span class="note" id="dkcn">' + on.length + ' on desktop</span><button class="btn sm primary" data-dk="chdone" data-id="' + w.id + '">Done</button></div><div class="dk-cl">';
    cats.forEach(function (c) { var l = all.filter(function (i) { return i.cat === c && (!q || i.hay.toLowerCase().indexOf(q) >= 0); }); if (!l.length) return; h += '<div class="dk-mc">' + esc(c) + '</div>' + l.map(function (i) { return '<div class="dk-cr"><label>' + '<input type="checkbox" class="dk-cki" data-k="' + esc(i.id) + '"' + (on.indexOf(i.id) >= 0 ? ' checked' : '') + '>' + itGlyph(i, 'sm') + '<span>' + esc(i.name) + '</span></label><em>' + (u[i.id] ? 'opened ' + u[i.id] + (u[i.id] === 1 ? ' time' : ' times') : '') + '</em><button class="btn sm' + (pins.indexOf(i.id) >= 0 ? ' on' : '') + '" data-dk="chpin" data-k="' + esc(i.id) + '" title="Show on the taskbar">' + (pins.indexOf(i.id) >= 0 ? 'On taskbar' : 'Pin') + '</button></div>'; }).join(''); });
    w.body.innerHTML = h + '</div></div>';
  }
  function chRepaint() { D.wins.forEach(function (x) { if (x.kind === 'chooser') { var s = x.body.querySelector('.dk-cl'), t = s ? s.scrollTop : 0; paintChooser(x); var n = x.body.querySelector('.dk-cl'); if (n) n.scrollTop = t; } }); }
  function suggest() {
    var u = LS.get('deskuse', {}) || {}, top = Object.keys(u).sort(function (a, b) { return u[b] - u[a]; }).filter(itemBy).slice(0, 8);
    var l = ['browser', 'files', 'ai'].concat(top); return l.filter(function (x, i) { return l.indexOf(x) === i; });
  }

  /* ---------- windows ---------- */
  function area() { var t = $('.dk-task'); return { w: root.clientWidth, h: root.clientHeight - ((t && t.offsetHeight) || TASK) }; }
  function mk(kind, title, o) {
    o = o || {}; var ar = area(), small = ar.w < 760, n = D.n++, w = { id: 'w' + (++D.id0), kind: kind, title: title, icon: o.icon || '', x: 230 + (n % 8) * 30, y: 40 + (n % 8) * 26, w: Math.min(o.w || 900, ar.w - 20), h: Math.min(o.h || 580, ar.h - 20), min: false, max: small, z: ++D.z, data: o.data || {} };
    w.x = Math.max(0, Math.min(w.x, ar.w - w.w)); w.y = Math.max(0, Math.min(w.y, ar.h - w.h));
    var el = document.createElement('div'); el.className = 'dkw'; el.setAttribute('data-id', w.id); el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', title);
    el.innerHTML = '<div class="dkw-bar" data-bar><span class="dkw-t">' + (w.icon ? '<img src="' + esc(w.icon) + '" alt="">' : '') + '<b>' + esc(title) + '</b></span><span class="sp"></span><span class="dkw-lm" title="Runs on your own server"><i class="dot"></i>Local mode</span><button class="dkw-nt" data-dk="wtab" data-id="' + w.id + '" aria-label="Open in a new tab" title="Open in a new tab" hidden><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>New tab</button><button data-dk="wmin" data-id="' + w.id + '" aria-label="Minimise">&#8211;</button><button data-dk="wmax" data-id="' + w.id + '" aria-label="Maximise">&#9633;</button><button class="x" data-dk="wclose" data-id="' + w.id + '" aria-label="Close">&#10005;</button></div><div class="dkw-body"></div><i class="rz rz-r" data-rz="r"></i><i class="rz rz-b" data-rz="b"></i><i class="rz rz-br" data-rz="br"></i>';
    el.insertAdjacentHTML('beforeend', '<div class="dk-wc"><button data-dk="wmin" data-id="' + w.id + '" aria-label="Minimise">&#8211;</button><button data-dk="wmax" data-id="' + w.id + '" aria-label="Exit full screen">&#10530;</button><button data-dk="wclose" data-id="' + w.id + '" aria-label="Close">&#10005;</button></div>');
    w.el = el; w.body = el.querySelector('.dkw-body'); $('#dkwins').appendChild(el); D.wins.push(w); place(w); focus(w); task(); return w;
  }
  D.id0 = 0;
  function tabUrl(w, u) { w.url = u; var b = w.el.querySelector('[data-bar] [data-dk="wtab"]'); if (b) { b.hidden = !u; var lm = w.el.querySelector('[data-bar] .dkw-lm'); if (lm) lm.hidden = !u; } }
  var sessT = 0;
  function saveSess() {
    clearTimeout(sessT); sessT = setTimeout(function () {
      var l = D.wins.filter(function (w) { return w.sd; }).sort(function (a, b) { return a.z - b.z; }).map(function (w) {
        var sd = Object.assign({}, w.sd); if (w.kind === 'browser' && w.b) sd.urls = w.b.tabs.map(function (t) { return t.url; }).filter(Boolean);
        return { sd: sd, x: w.x, y: w.y, w: w.w, h: w.h, min: !!w.min, max: !!w.max, act: w.id === D.top };
      });
      LS.set('desksess', l);
    }, 350);
  }
  function restoreSess() {
    if (D.restored) return; D.restored = true; if (D.wins.length) return;
    var l = LS.get('desksess', []); if (!Array.isArray(l) || !l.length) return;
    var act = null;
    l.slice(0, 12).forEach(function (r) {
      var sd = r && r.sd, w = null; if (!sd) return;
      try {
        if (sd.t === 'app') w = openApp(sd.slug, sd.file); else if (sd.t === 'os') w = osWin(sd.view); else if (sd.t === 'tool') w = toolWin(sd.id, sd.path); else if (sd.t === 'files') w = filesWin(sd.src); else if (sd.t === 'viewer') w = viewer(sd.path, sd.remote);
        else if (sd.t === 'ext' && window.AOSDeskX) w = window.AOSDeskX.open(sd.id); else if (sd.t === 'ai') w = aiWin(); else if (sd.t === 'calc') w = calcWin();  else if (sd.t === 'br') { w = browserWin(sd.urls && sd.urls[0]); (sd.urls || []).slice(1).forEach(function (u) { newTab(w, u); }); }
      } catch (e) { w = null; }
      if (!w) return;
      if (typeof r.x === 'number') { w.x = r.x; w.y = r.y; w.w = r.w; w.h = r.h; } w.max = !!r.max; w.min = !!r.min; place(w); if (r.act) act = w;
    });
    if (act && !act.min) focus(act); else task();
  }
  function place(w) { saveSess(); var el = w.el, ar = area(); el.hidden = w.min; el.style.zIndex = w.z; if (w.max) { el.style.left = 0; el.style.top = 0; el.style.width = ar.w + 'px'; el.style.height = ar.h + 'px'; } else { el.style.left = w.x + 'px'; el.style.top = w.y + 'px'; el.style.width = w.w + 'px'; el.style.height = w.h + 'px'; } el.classList.toggle('max', !!w.max); el.classList.toggle('bare', !!w.max && (w.kind === 'rbrowser' || w.kind === 'browser')); fabVis(); }
  function focus(w) { w.z = ++D.z; D.top = w.id; if (w.min) { w.min = false; } D.wins.forEach(function (x) { x.el.classList.toggle('act', x === w); place(x); }); task(); }
  function byId(id) { return D.wins.filter(function (w) { return w.id === id; })[0]; }
  function closeWin(w) { saveSess(); if (w.onclose) { try { w.onclose(); } catch (e) {} } w.el.remove(); D.wins = D.wins.filter(function (x) { return x !== w; }); if (D.ai.win === w) D.ai.win = null; if (D.top === w.id) { var t = D.wins.filter(function (x) { return !x.min; }).sort(function (a, b) { return b.z - a.z; })[0]; D.top = t ? t.id : null; if (t) focus(t); } task(); }

  function openApp(slug, file) {
    var a = appBy(slug); if (!a) return toast('That app is not available');
    var r = (LS.get('recent', []) || []).filter(function (x) { return x !== slug; }); r.unshift(slug); LS.set('recent', r.slice(0, 6)); try { var rl = (LS.get('rlist', []) || []).filter(function (x) { return x !== 'a:' + slug; }); rl.unshift('a:' + slug); LS.set('rlist', rl.slice(0, 8)); } catch (e) {}
    var w = mk('app', a.name, { icon: '/_icons/' + a.slug + '.png', w: 980, h: 640 }); w.sd = { t: 'app', slug: a.slug, file: file || '' };
    w.body.innerHTML = '<iframe class="dkw-frame" title="' + esc(a.name) + '" src="/apps/' + esc(a.slug) + '/' + (file ? '?open=' + enc(file) : '') + '" allow="clipboard-read; clipboard-write; fullscreen; microphone; camera; display-capture"></iframe>'; icons(); tabUrl(w, '/apps/' + a.slug + '/' + (file ? '?open=' + enc(file) : ''));
    return w;
  }
  function openFileInApp(path) {
    var e = ext(path), m = A.OPENWITH && A.OPENWITH[e];
    if (/^(jpe?g|png|gif|webp|svg|bmp|avif|pdf|mp4|webm|mov|m4v|mp3|wav|ogg|m4a|flac)$/.test(e) || A.TEXTEXT.test(e)) return viewer(path);
    if (m && m.length) { var slug = m[0]; if (A.LAUNCHES.indexOf(slug) < 0) { toast('Opening ' + (appBy(slug) || {}).name + '. Use its Open dialog and choose ' + path); return openApp(slug); } return openApp(slug, path); }
    return viewer(path);
  }

  /* ---------- Anands OS pages as windows (Photos, Cards...) ---------- */
  function toolWin(id, path) {
    var o = TOOLS.filter(function (x) { return x[0] === id; })[0]; if (!o) return;
    var ex = D.wins.filter(function (x) { return x.kind === 'tool' && x.tool === id; })[0];
    if (ex) { focus(ex); if (path) { try { ex.body.querySelector('iframe').contentWindow.postMessage({ aosTool: 'open', path: path }, location.origin); } catch (e) {} } return ex; }
    var w = mk('tool', o[1], { w: o[3], h: o[4], icon: '/oicons/' + id + '.svg' }); w.tool = id; w.sd = { t: 'tool', id: id, path: path || '' };
    w.body.innerHTML = '<iframe class="dkw-frame" title="' + esc(o[1]) + '" src="' + o[2] + (path ? '?path=' + enc(path) : '') + '" allow="clipboard-read; clipboard-write; fullscreen; microphone; camera; display-capture; autoplay"></iframe>'; tabUrl(w, o[2] + (path ? '?path=' + enc(path) : '')); return w;
  }
  function osWin(view) {
    var o = OSAPPS.filter(function (x) { return x[0] === view; })[0]; if (!o) return;
    var ex = D.wins.filter(function (x) { return x.kind === 'os' && x.view === view; })[0]; if (ex) { focus(ex); return ex; }
    var w = mk('os', o[1], { w: 1040, h: 660 }); w.view = view; w.sd = { t: 'os', view: view };
    w.body.innerHTML = '<iframe class="dkw-frame" title="' + esc(o[1]) + '" src="/?embed=1#' + esc(view) + '" allow="clipboard-read; clipboard-write; fullscreen"></iframe>'; tabUrl(w, '/#' + view); return w;
  }

  /* ---------- browser ---------- */
  var ENGINES = [['ddg', 'DuckDuckGo', 'https://html.duckduckgo.com/html/?q='], ['google', 'Google', 'https://www.google.com/search?q='], ['bing', 'Bing', 'https://www.bing.com/search?q='], ['brave', 'Brave Search', 'https://search.brave.com/search?q='], ['startpage', 'Startpage', 'https://www.startpage.com/do/search?q=']];
  function newHome() { var h = LS.get('brhome', ''); return LS.get('brstart', h ? 'home' : 'new') === 'home' ? h : ''; }
  function searchFor(t) { var k = LS.get('brsearch', 'ddg'), c = String(LS.get('brsearchcustom', '') || ''); if (k === 'custom' && /^https?:\/\//i.test(c)) return c.indexOf('%s') >= 0 ? c.replace('%s', enc(t)) : c + enc(t); return SEARCHURL() + enc(t); }
  function SEARCHURL() { var k = LS.get('brsearch', 'ddg'); return (ENGINES.filter(function (e) { return e[0] === k; })[0] || ENGINES[0])[2]; }
  var QLAB = [['sharp', 'Sharp', 'Best text and images, uses the most data'], ['balanced', 'Balanced', 'Good quality, lighter'], ['fast', 'Fast', 'Smoothest on a slow connection']];
  var QUICK = [['Wikipedia', 'https://en.wikipedia.org/'], ['Hacker News', 'https://news.ycombinator.com/'], ['DuckDuckGo', 'https://html.duckduckgo.com/html/'], ['BBC News', 'https://www.bbc.com/news'], ['Example', 'https://example.com/']];
  function normUrl(t) {
    t = String(t || '').trim(); if (!t) return '';
    if (/^https?:\/\//i.test(t)) return t;
    if (!/\s/.test(t) && /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#].*)?$/i.test(t)) return 'https://' + t;
    if (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?([/?#].*)?$/i.test(t)) return 'http://' + t;
    return searchFor(t);
  }
  function btab(w) { var b = w.b; return b.tabs.filter(function (t) { return t.id === b.cur; })[0]; }
  function loadRb(again) {
    if (D.rbTried && !again) return; D.rbTried = true;
    fetch('/api/sj/open', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
      if (!c || !c.ok) return; D.rb = c.src; D.rbUp = true; D.rbWhy = '';
      D.wins.forEach(function (w) { if (w.kind === 'browser') { if (w.b.full === undefined) w.b.full = true; paintBrowser(w); } });
    }).catch(function () {});
  }
  /* keep the streamed screen the same size as its window (needs the Neko admin password in Settings; quietly does nothing without it) */
  function nkFit(f) {
    var last = '', tm = 0;
    function send() { if (!f.isConnected || f.hidden) return; var r = f.getBoundingClientRect(), k = Math.round(r.width) + 'x' + Math.round(r.height); if (r.width < 200 || k === last) return; last = k;
      fetch('/api/chrome/fit', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ w: r.width, h: r.height }) }).then(function (x) { return x.json(); }).then(function (j) { if (j && j.reason === 'no_admin') last = 'off'; if (j && j.reason === 'expired') last = ''; }).catch(function () { last = ''; }); }
    var go = function () { clearTimeout(tm); tm = setTimeout(send, 900); };
    try { if (window.ResizeObserver) new ResizeObserver(go).observe(f); } catch (e) {} f.addEventListener('load', function () { last = ''; setTimeout(send, 2500); });
  }
  function loadNk(again) {
    if (D.nkTried && !again) return; D.nkTried = true;
    fetch('/api/chrome/open', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
      D.nk = c && c.ok ? c.src : ''; D.nkWhy = c && !c.ok ? (c.reason || '') : '';
      D.wins.forEach(function (w) { if (w.kind === 'browser') paintBrowser(w); });
    }).catch(function () {});
  }
  function browserWin(url) {
    loadRb(); loadNk();
    var w = mk('browser', 'Browser', { w: 1000, h: 640 }); w.sd = { t: 'br' }; w.b = { tabs: [], cur: 0, n: 0, full: D.rb ? true : undefined, go: url || '' }; newTab(w, url); return w;
  }
  function newTab(w, url) { var t = { id: ++w.b.n, url: '', title: 'New tab', hist: [], i: -1 }; w.b.tabs.push(t); w.b.cur = t.id; paintBrowser(w); if (url) nav(w, t, url); else { var q = w.body.querySelector('.dk-url'); if (q) q.focus(); } return t; }
  function nav(w, t, input, noPush) {
    var u = normUrl(input); if (!u) return; t.url = u; t.want = u; t.force = true; t.title = u.replace(/^https?:\/\//, '').slice(0, 40);
    if (!noPush) { t.hist = t.hist.slice(0, t.i + 1); t.hist.push(u); t.i = t.hist.length - 1; }
    paintBrowser(w); if (window.AOSBS) AOSBS.visit(u, t.title);
  }
  function bstart(w) {
    return '<div class="dk-start2"><h2>Browser</h2><form data-dk-form="url" data-id="' + w.id + '" class="dk-sf"><input class="input dk-url" placeholder="Search the web or type an address" autocomplete="off" aria-label="Search"><button class="btn primary">Go</button></form><div class="dk-q">' + QUICK.map(function (q) { return '<button class="btn" data-dk="bgo" data-id="' + w.id + '" data-u="' + esc(q[1]) + '">' + esc(q[0]) + '</button>'; }).join('') + '</div>' +
      '<p class="note">Pages open through your Anands server in a sandbox, so sites cannot see your Anands session. Simple pages work best. Cookies are kept for your session, so many sign-ins and forms work. For video calls, payments and heavy web apps press Full browser (a complete Chrome with sound, set up in Settings) or open the page in a real tab.</p></div>';
  }
  function paintBrowser(w) {
    var b = w.b, t = btab(w);
    if (!w.body.querySelector('.dk-br')) w.body.innerHTML = '<div class="dk-br"><div class="dk-bts" role="tablist"></div><div class="dk-barw"></div><div class="dk-bv"><div class="dk-sw"></div></div></div>';
    w.body.querySelector('.dk-bts').innerHTML = b.tabs.map(function (x) { return '<div class="dk-bt' + (x.id === b.cur ? ' on' : '') + '" data-dk="btab" data-id="' + w.id + '" data-t="' + x.id + '" role="tab" aria-selected="' + (x.id === b.cur) + '"><span>' + esc(x.title) + '</span>' + (b.tabs.length > 1 ? '<button data-dk="bclose" data-id="' + w.id + '" data-t="' + x.id + '" aria-label="Close tab">&#10005;</button>' : '') + '</div>'; }).join('') + '<button class="dk-bnew" data-dk="bnew" data-id="' + w.id + '" aria-label="New tab">+</button><button class="dk-bnew" data-dk="bset" data-id="' + w.id + '" aria-label="Browser settings" title="Browser settings">' + ic('settings') + '</button>' + (D.rb ? '<button class="btn sm dk-bfull' + (b.full ? ' on' : '') + '" data-dk="bfull" data-id="' + w.id + '" title="A complete remote browser: sign-ins, video, web apps">' + (b.full ? 'Simple tabs' : 'Full browser') + '</button>' : '');
    w.body.querySelector('.dk-br').classList.toggle('isfull', !!(b.full && D.rb && D.rbUp !== false));
    var br0 = w.body.querySelector('.dk-br'), mb = br0.querySelector('.dk-mbar'), showM = !!(b.full && D.rb && D.rbUp !== false);
    if (!mb) { mb = document.createElement('div'); mb.className = 'dk-mbar'; br0.insertBefore(mb, br0.querySelector('.dk-barw')); }
    mb.hidden = !showM; mb.innerHTML = '<button class="' + (b.chrome ? '' : 'on') + '" data-dk="bmode" data-m="sj" data-id="' + w.id + '">Built-in browser</button><button class="' + (b.chrome ? 'on' : '') + '" data-dk="bmode" data-m="chrome" data-id="' + w.id + '" title="A real Chrome with your Google sign-in">Real Chrome</button>';
    var nf = w.body.querySelector('.dk-bv iframe.dk-nkf');
    if (showM && b.chrome && D.nk) { if (!nf) { nf = document.createElement('iframe'); nf.className = 'dkw-frame dk-nkf'; nf.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-pointer-lock'); nf.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen; microphone; camera; autoplay'); nf.title = 'Real Chrome'; nf.src = D.nk; w.body.querySelector('.dk-bv').appendChild(nf); nkFit(nf); } nf.hidden = false; }
    else if (nf) nf.hidden = true;
    var nm = w.body.querySelector('.dk-nkmsg'); if (showM && b.chrome && !D.nk) { if (!nm) { nm = document.createElement('div'); nm.className = 'dk-rbmsg dk-nkmsg'; w.body.querySelector('.dk-bv').appendChild(nm); } nm.innerHTML = '<b>Real Chrome is not set up yet</b><p>' + esc(D.nkWhy || 'Checking...') + '</p><div><button class="btn primary" data-dk="bnkset" data-id="' + w.id + '">Open Settings</button> <button class="btn" data-dk="bmode" data-m="sj" data-id="' + w.id + '">Use the built-in browser</button></div>'; } else if (nm) nm.remove();
    var rf = w.body.querySelector('.dk-bv iframe.dk-rbf');
    if (b.full && D.rb) { if (!rf) { rf = document.createElement('iframe'); rf.className = 'dkw-frame dk-rbf'; rf.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-pointer-lock'); rf.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen; microphone; camera; autoplay'); rf.title = 'Browser'; rf.src = D.rbUp === false ? 'about:blank' : D.rb + (w.b.go ? '&go=' + encodeURIComponent(w.b.go) : ''); w.body.querySelector('.dk-bv').appendChild(rf); } rf.hidden = D.rbUp === false || !!b.chrome; if (D.rbUp !== false && rf.getAttribute('src') === 'about:blank') rf.src = D.rb + (w.b.go ? '&go=' + encodeURIComponent(w.b.go) : ''); w.body.querySelector('.dk-barw').hidden = true; } else { if (rf) rf.hidden = true; w.body.querySelector('.dk-barw').hidden = false; }
    var mg = w.body.querySelector('.dk-rbmsg'); if (b.full && D.rb && D.rbUp === false) { if (!mg) { mg = document.createElement('div'); mg.className = 'dk-rbmsg'; w.body.querySelector('.dk-bv').appendChild(mg); } mg.innerHTML = '<b>The browser could not start</b><p>' + esc(D.rbWhy || 'Check that its container is running.') + '</p><div><button class="btn primary" data-dk="bretry" data-id="' + w.id + '">Try again</button> <button class="btn" data-dk="bfull" data-id="' + w.id + '">Use Simple tabs</button></div>'; } else if (mg) mg.remove();
    var keep = (document.activeElement && document.activeElement.classList.contains('dk-url') && w.body.contains(document.activeElement)) ? document.activeElement.value : null;
    w.body.querySelector('.dk-barw').innerHTML = '<form class="dk-bar2" data-dk-form="url" data-id="' + w.id + '"><button type="button" class="btn sm" data-dk="bback" data-id="' + w.id + '"' + (t.i > 0 ? '' : ' disabled') + ' aria-label="Back">' + ic('back') + '</button><button type="button" class="btn sm" data-dk="bfwd" data-id="' + w.id + '"' + (t.i < t.hist.length - 1 ? '' : ' disabled') + ' aria-label="Forward">' + ic('r') + '</button><button type="button" class="btn sm" data-dk="breload" data-id="' + w.id + '" aria-label="Reload"' + (t.url ? '' : ' disabled') + '>&#8635;</button><button type="button" class="btn sm" data-dk="bhome" data-id="' + w.id + '" aria-label="Start page">' + ic('home') + '</button>' +
      '<input class="input dk-url" aria-label="Address or search" placeholder="Search or type a web address" value="' + esc(t.url) + '" autocomplete="off" spellcheck="false"><button type="button" class="btn sm dk-star" data-dk="bmstar" data-id="' + w.id + '" aria-label="Bookmark this page" title="Bookmark this page"' + (t.url ? '' : ' disabled') + '>' + ic('star') + '</button><button type="button" class="btn sm" data-dk="bext" data-id="' + w.id + '"' + (t.url ? '' : ' disabled') + ' title="Open this page in a real browser tab" aria-label="Open in a real tab">' + ic('ext') + '</button></form>';
    if (keep !== null) { var ui = w.body.querySelector('.dk-bar2 .dk-url'); ui.value = keep; ui.focus(); }
    var bv = w.body.querySelector('.dk-bv'), sw = bv.querySelector('.dk-sw'); sw.hidden = !!t.url || !!b.full; if (!t.url) sw.innerHTML = bstart(w); if (window.AOSBS) AOSBS.bar(w);
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
    var td = ev.data; if (td && typeof td === 'object' && td.aosKey && ev.origin === location.origin) { var kk = td.aosKey; if (D.shortcut) D.shortcut({ t: kk.t === 'keyup' ? 'keyup' : 'keydown', key: String(kk.key || '').slice(0, 20), alt: !!kk.alt, ctrl: !!kk.ctrl, shift: !!kk.shift, meta: !!kk.meta, edit: !!kk.edit }); return; }
    if (td && typeof td === 'object' && td.aosTool && ev.origin === location.origin) {
      if (td.aosTool === 'launch' && /^(editor|player|recorder|terminal)$/.test(td.tool)) toolWin(td.tool, String(td.path || ''));
      if (td.aosTool === 'title') D.wins.forEach(function (w) { if (w.kind === 'tool' && w.body.querySelector('iframe') && w.body.querySelector('iframe').contentWindow === ev.source) { var b = w.el.querySelector('.dkw-t b'); if (b) b.textContent = String(td.title || '').slice(0, 60); w.title = String(td.title || '').slice(0, 60); task(); } });
      return;
    }
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

  /* ---------- Full browser: the built-in engine at /sj/ (see server/webproxy.js and web/sj/) ---------- */
  function openBrowser(url) { return browserWin(url); }
  function rbSettings(w, keep) {
    if (window.AOSBS) return AOSBS.toggle(w);
    var old = w.body.querySelector('.dk-bset'); if (old && !keep) return void old.remove(); if (old) old.remove();
    var el = document.createElement('div'); el.className = 'dk-bset'; var q = LS.get('brqual', 'sharp'), se = LS.get('brsearch', 'ddg');
    el.innerHTML = '<div class="dk-bsh"><b>Browser settings</b><button data-dk="' + (w.kind === 'browser' ? 'bsetx' : 'rbsetx') + '" data-id="' + w.id + '" aria-label="Close">&#10005;</button></div>' +
      '<label>Search engine<select id="brse">' + ENGINES.map(function (e) { return '<option value="' + e[0] + '"' + (e[0] === se ? ' selected' : '') + '>' + e[1] + '</option>'; }).join('') + '</select></label>' +
      '<label>New tab opens<input id="brhome" class="input" placeholder="Blank page, or a web address like https://example.com" value="' + esc(LS.get('brhome', '')) + '" autocomplete="off"></label>' +
      (w.kind === 'browser' ? '' : '<div class="dk-bsq"><span>Picture quality</span>' + QLAB.map(function (x) { return '<button class="btn sm' + (x[0] === q ? ' primary' : '') + '" data-dk="rbq" data-id="' + w.id + '" data-q="' + x[0] + '" title="' + x[2] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="dk-bsq"><span>Browsing data</span><button class="btn sm" data-dk="rbclear" data-id="' + w.id + '">Clear cookies and cache</button></div>') +
      '<p class="note">Saved on this device.</p>';
    w.body.querySelector('.dk-br').appendChild(el);
  }
  function bhand(a, b, w) {
    var t = btab(w);
    if (a === 'bset') return void rbSettings(w);
    if (a === 'bmstar') return void (window.AOSBS && AOSBS.star(w));
    if (a === 'bmgo') return void (window.AOSBS && AOSBS.go(w, b.getAttribute('data-u')));
    if (a === 'bretry') { D.rbTried = false; loadRb(true); return; }
    if (a === 'bmode') { w.b.chrome = b.getAttribute('data-m') === 'chrome'; if (w.b.chrome) loadNk(true); return void paintBrowser(w); }
    if (a === 'bnkset') { hide(); return void A.go('settings'); }
    if (a === 'bfull') { w.b.full = !w.b.full; return void paintBrowser(w); }
    if (a === 'bsetx') { var bs2 = w.body.querySelector('.dk-bset'); if (bs2) bs2.remove(); return; }
    if (a === 'bnew') { w.b.full = false; return void newTab(w, newHome()); }
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
    var w = mk('viewer', name, { w: 860, h: 600 }); w.data = { path: path, remote: remote }; w.sd = { t: 'viewer', path: path, remote: !!remote };
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
    var w = mk('files', src === 'google' ? 'Google Drive' : 'Files', { w: 1080, h: 680 }); w.src = src; w.sd = { t: 'files', src: src || '' }; tabUrl(w, '/#drive');
    w.body.innerHTML = '<iframe class="dkw-frame" title="Files" src="' + url + '" allow="clipboard-read; clipboard-write; fullscreen"></iframe>'; return w;
  }

  /* ---------- calculator (desktop only, not part of the Suite) ---------- */
  var CALC_FN = { sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1, ln: 1, log: 1, sqrt: 1, cbrt: 1 };
  function calcEval(src, deg, ans) {
    var t = String(src).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/√/g, 'sqrt').replace(/∛/g, 'cbrt').replace(/π/g, 'pi').replace(/,/g, ''), i = 0;
    var open = (t.match(/\(/g) || []).length - (t.match(/\)/g) || []).length; while (open-- > 0) t += ')';
    function ws() { while (t[i] === ' ') i++; }
    function fact(n) { if (n < 0 || n !== Math.floor(n) || n > 170) throw 0; var r = 1; for (var k = 2; k <= n; k++) r *= k; return r; }
    function rad(x) { return deg ? x * Math.PI / 180 : x; } function back(x) { return deg ? x * 180 / Math.PI : x; }
    function call(f, x) {
      switch (f) { case 'sin': return Math.sin(rad(x)); case 'cos': return Math.cos(rad(x)); case 'tan': if (deg && Math.abs(((x % 180) + 180) % 180 - 90) < 1e-9) throw 0; return Math.tan(rad(x));
        case 'asin': if (Math.abs(x) > 1) throw 0; return back(Math.asin(x)); case 'acos': if (Math.abs(x) > 1) throw 0; return back(Math.acos(x)); case 'atan': return back(Math.atan(x));
        case 'ln': if (x <= 0) throw 0; return Math.log(x); case 'log': if (x <= 0) throw 0; return Math.log10(x); case 'sqrt': if (x < 0) throw 0; return Math.sqrt(x); case 'cbrt': return Math.cbrt(x); }
      throw 0;
    }
    function primary() {
      ws(); var m, rest = t.slice(i);
      if ((m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(rest)) && !/^\d+\.?\d*e(?![+-]?\d)/i.test(rest)) { i += m[0].length; return parseFloat(m[0]); }
      if ((m = /^\d+\.?\d*|^\.\d+/.exec(rest))) { i += m[0].length; return parseFloat(m[0]); }
      if ((m = /^(asin|acos|atan|sin|cos|tan|ln|log|sqrt|cbrt)/.exec(rest))) { i += m[0].length; ws(); if (t[i] !== '(') throw 0; i++; var a = expr(); ws(); if (t[i] !== ')') throw 0; i++; return call(m[0], a); }
      if (rest.indexOf('pi') === 0) { i += 2; return Math.PI; } if (rest.indexOf('Ans') === 0) { i += 3; return ans || 0; } if (rest[0] === 'e') { i++; return Math.E; }
      if (t[i] === '(') { i++; var v = expr(); ws(); if (t[i] !== ')') throw 0; i++; return v; }
      throw 0;
    }
    function postfix() { var v = primary(); for (;;) { ws(); if (t[i] === '!') { i++; v = fact(v); } else if (t[i] === '%') { i++; v /= 100; } else return v; } }
    function power() { var b = postfix(); ws(); if (t[i] === '^') { i++; var e = unary(); var r = Math.pow(b, e); if (!isFinite(r)) throw 0; return r; } return b; }
    function unary() { ws(); if (t[i] === '-') { i++; return -unary(); } if (t[i] === '+') { i++; return unary(); } return power(); }
    function startsOperand() { ws(); return t[i] === '(' || /^(\d|\.|pi|Ans|e(?![+\-\d])|asin|acos|atan|sin|cos|tan|ln|log|sqrt|cbrt)/.test(t.slice(i)); }
    function term() { var v = unary(); for (;;) { ws(); if (t[i] === '*') { i++; v *= unary(); } else if (t[i] === '/') { i++; var d = unary(); if (d === 0) throw 0; v /= d; } else if (startsOperand()) { v *= unary(); } else return v; } }
    function expr() { var v = term(); for (;;) { ws(); if (t[i] === '+') { i++; v += term(); } else if (t[i] === '-') { i++; v -= term(); } else return v; } }
    var v = expr(); ws(); if (i < t.length || !isFinite(v)) throw 0;
    if (Math.abs(v) < 1e-12) return 0; return parseFloat(v.toPrecision(13));
  }
  function calcFmt(v) { if (v === 0) return '0'; var a = Math.abs(v); if (a >= 1e15 || a < 1e-9) return String(parseFloat(v.toExponential(9))).replace('e+', 'e'); return String(v); }
  function calcWin() {
    var ex = D.wins.filter(function (x) { return x.kind === 'calc'; })[0]; if (ex) { focus(ex); return ex; }
    var w = mk('calc', 'Calculator', { w: 360, h: 560, icon: '/oicons/calc.svg' }); w.sd = { t: 'calc' }; w.x = Math.max(0, Math.round((area().w - w.w) / 2)); place(w);
    var pref = LS.get('calcprefs', {}) || {}, S = { mode: pref.mode || 'auto', deg: pref.deg !== false, mem: Number(LS.get('calcmem', 0)) || 0, hist: LS.get('calchist', []) || [], showH: !!pref.hist, cur: '', last: 0, done: false, wide: false };
    var STD = [['C', 'fn'], ['(', 'fn'], [')', 'fn'], ['÷', 'op'], ['7'], ['8'], ['9'], ['×', 'op'], ['4'], ['5'], ['6'], ['−', 'op'], ['1'], ['2'], ['3'], ['+', 'op'], ['±', 'fn'], ['0'], ['.'], ['=', 'eq']];
    var SCI2 = [['π', 'f'], ['e', 'f'], ['sin(', 'f'], ['cos(', 'f'], ['tan(', 'f'], ['√(', 'f'], ['x²', 'f'], ['^', 'f'], ['ln(', 'f'], ['log(', 'f'], ['asin(', 'f'], ['acos(', 'f'], ['atan(', 'f'], ['!', 'f'], ['1/x', 'f'], ['%', 'f'], ['Ans', 'f'], ['∛(', 'f'], ['⌫', 'f']];
    var btn = function (k) { var lab = k[0]; return '<button class="' + (k[1] || 'num') + '" data-calc="' + esc(lab) + '">' + esc(lab.length > 1 ? lab.replace('(', '') : lab) + '</button>'; };
    w.body.innerHTML = '<div class="dk-calc" tabindex="0"><div class="dk-cbar"><div class="dk-cseg" role="group" aria-label="Mode"><button data-cm="std">Standard</button><button data-cm="sci">Scientific</button></div><button class="dk-cdeg" data-cm="deg" title="Angles in degrees or radians"></button><span class="sp"></span><button class="dk-chb" data-cm="hist" title="History">History</button></div>' +
      '<div class="dk-cmem"><button data-calc="MC">MC</button><button data-calc="MR">MR</button><button data-calc="M+">M+</button><button data-calc="M−">M−</button><button data-calc="MS">MS</button><span class="dk-cmi" data-mi></span></div>' +
      '<div class="dk-cmain"><div class="dk-calcl"><div class="dk-cx" aria-live="polite"><div class="dk-calch" data-calc-h></div><div class="dk-cv" data-calc-v>0</div></div><div class="dk-cpad"><div class="dk-csci">' + SCI2.map(function (k) { return btn(k); }).join('') + '</div><div class="dk-ck">' + STD.map(btn).join('') + '</div></div></div><aside class="dk-chist" data-hist></aside></div></div>';
    var box = w.body.querySelector('.dk-calc'), V = box.querySelector('[data-calc-v]'), H = box.querySelector('[data-calc-h]'), MI = box.querySelector('[data-mi]'), HL = box.querySelector('[data-hist]');
    function save() { LS.set('calcprefs', { mode: S.mode, deg: S.deg, hist: S.showH }); }
    function sci() { return S.mode === 'sci' || (S.mode === 'auto' && S.wide); }
    function fit() { V.style.fontSize = ''; var fs = parseFloat(getComputedStyle(V).fontSize), n = 0; while (V.scrollWidth > V.parentNode.clientWidth - 4 && fs > 12 && n++ < 60) { fs *= 0.92; V.style.fontSize = fs + 'px'; } V.scrollLeft = V.scrollWidth; }
    function paint() {
      box.classList.toggle('sci', sci()); box.classList.toggle('showh', S.showH);
      box.querySelectorAll('[data-cm="std"]').forEach(function (b) { b.classList.toggle('on', !sci()); }); box.querySelectorAll('[data-cm="sci"]').forEach(function (b) { b.classList.toggle('on', sci()); });
      box.querySelector('[data-cm="deg"]').textContent = S.deg ? 'DEG' : 'RAD'; box.querySelector('[data-cm="hist"]').classList.toggle('on', S.showH);
      MI.textContent = S.mem ? 'M = ' + calcFmt(S.mem) : ''; box.querySelector('[data-calc="MC"]').disabled = box.querySelector('[data-calc="MR"]').disabled = !S.mem;
      HL.innerHTML = '<div class="dk-hh2"><b>History</b><button data-cm="hclr"' + (S.hist.length ? '' : ' disabled') + '>Clear</button></div>' + (S.hist.length ? S.hist.map(function (h, n) { return '<button class="dk-hi" data-hi="' + n + '"><span>' + esc(h[0]) + ' =</span><b>' + esc(h[1]) + '</b></button>'; }).join('') : '<p class="note">Your calculations will show here.</p>');
    }
    try { if (window.ResizeObserver) new ResizeObserver(function () { fit(); }).observe(box); } catch (e) {}
    function show(err) { V.textContent = err ? 'Error' : (S.cur === '' ? '0' : S.cur); V.classList.toggle('bad', !!err); fit(); }
    function curVal() { if (S.cur === '') return 0; return calcEval(S.cur, S.deg, S.last); }
    function add(s) { if (S.done) { if (/^[+−×÷^!%]/.test(s)) S.done = false; else { S.cur = ''; S.done = false; H.textContent = ''; } } S.cur += s; if (S.cur.length > 120) S.cur = S.cur.slice(0, 120); show(); }
    function equals() { if (!S.cur) return; try { var r = calcEval(S.cur, S.deg, S.last), txt = calcFmt(r); H.textContent = S.cur + ' ='; S.hist.unshift([S.cur, txt]); S.hist = S.hist.slice(0, 40); LS.set('calchist', S.hist); S.last = r; S.cur = txt; S.done = true; show(); paint(); } catch (e) { show(true); S.cur = ''; S.done = false; } }
    function memory(op) {
      try { if (op === 'MC') S.mem = 0; else if (op === 'MR') { add(calcFmt(S.mem)); } else { var v = curVal(); if (op === 'MS') S.mem = v; else if (op === 'M+') S.mem += v; else S.mem -= v; S.mem = parseFloat(S.mem.toPrecision(13)); } LS.set('calcmem', S.mem); paint(); } catch (e) { show(true); }
    }
    function press(k) {
      if (k === 'C') { S.cur = ''; H.textContent = ''; S.done = false; return show(); }
      if (k === '⌫') { if (S.done) { S.cur = ''; S.done = false; H.textContent = ''; } else S.cur = S.cur.replace(/(asin\(|acos\(|atan\(|sin\(|cos\(|tan\(|ln\(|log\(|√\(|∛\(|Ans|.)$/, ''); return show(); }
      if (k === '=') return equals();
      if (/^M[CRS+−]$/.test(k)) return memory(k === 'M−' ? 'M−' : k);
      if (k === '±') { if (!S.cur) { S.cur = '−'; return show(); } S.cur = /^−\(.*\)$/.test(S.cur) ? S.cur.slice(2, -1) : '−(' + S.cur + ')'; S.done = false; return show(); }
      if (k === 'x²') return add('^2'); if (k === '1/x') { if (!S.cur) return; S.cur = '1÷(' + S.cur + ')'; S.done = false; return show(); }
      var isOp = /^[+−×÷^]$/.test(k);
      if (isOp) { if (!S.cur && !S.done && k !== '−') return; if (/[+−×÷^]$/.test(S.cur) && !S.done) S.cur = S.cur.slice(0, -1); }
      if (k === '.') { var last = S.cur.split(/[+−×÷()%^!]/).pop(); if (S.done) { S.cur = ''; S.done = false; H.textContent = ''; last = ''; } if (last.indexOf('.') >= 0) return; if (!last) S.cur += '0'; }
      if ((k === '%' || k === '!') && !/[\d)πe]$/.test(S.cur)) return;
      add(k);
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-calc]'); if (b) { press(b.getAttribute('data-calc')); return void box.focus(); }
      var m = e.target.closest('[data-cm]'); if (m) { var c = m.getAttribute('data-cm'); if (c === 'std' || c === 'sci') S.mode = c; else if (c === 'deg') S.deg = !S.deg; else if (c === 'hist') S.showH = !S.showH; else if (c === 'hclr') { S.hist = []; LS.set('calchist', []); } save(); paint(); return void box.focus(); }
      var h = e.target.closest('[data-hi]'); if (h) { var it = S.hist[+h.getAttribute('data-hi')]; if (it) { S.cur = it[1]; S.done = true; H.textContent = it[0] + ' ='; show(); } box.focus(); }
    });
    var KEYS = { '*': '×', '/': '÷', '-': '−', 'x': '×', 'X': '×', ',': '.', 'Enter': '=', '=': '=', 'Backspace': '⌫', 'Escape': 'C', 'Delete': 'C', 'p': 'π', 's': 'sin(', 'c': 'cos(', 't': 'tan(', 'l': 'ln(', 'g': 'log(', 'r': '√(', 'e': 'e', 'a': 'Ans', 'm': 'MS', 'q': 'x²' };
    box.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) { var lk = e.key.toLowerCase(); if ((e.ctrlKey || e.metaKey) && !e.altKey && lk === 'c') { try { navigator.clipboard.writeText(V.textContent); } catch (x) {} e.preventDefault(); } return; }
      var k = e.key; if (KEYS[k]) k = KEYS[k];
      if (/^(asin|acos|atan|sin|cos|tan|ln|log|√|∛)\($|^(Ans|e|π|x²|MS)$|^[0-9.+()%×÷−=C⌫^!]$/.test(k)) { e.preventDefault(); e.stopPropagation(); press(k); }
    });
    box.addEventListener('paste', function (e) { var tx = (e.clipboardData && e.clipboardData.getData('text')) || ''; tx = tx.replace(/\s+/g, '').replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−'); if (/^[0-9.+()%×÷−^!]+$/.test(tx)) { e.preventDefault(); add(tx); } });
    function size() { var wide = box.clientWidth >= 620; if (wide !== S.wide) { S.wide = wide; paint(); } fit(); }
    if (window.ResizeObserver) { var ro = new ResizeObserver(size); ro.observe(box); w.onclose = function () { ro.disconnect(); }; }
    S.wide = box.clientWidth >= 620; paint(); show(); setTimeout(function () { size(); box.focus(); }, 30); return w;
  }

  /* ---------- assistant ---------- */
  function aiWin() { if (D.ai.win) { focus(D.ai.win); return D.ai.win; } var w = mk('ai', 'Assistant', { w: 460, h: 600 }); w.sd = { t: 'ai' }; w.x = Math.max(0, area().w - w.w - 30); place(w); D.ai.win = w; paintAi(); return w; }
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
    api('/api/chat', { method: 'POST', json: { messages: ai.msgs.slice(-12), ctx: { photos: false, insights: false, cards: false, files: true, apps: true }, desktop: { windows: D.wins.map(function (x) { return x.title; }), folder: fw ? (fw.src === 'google' ? 'Google Drive' : 'Files') : '', file: ai.file } } }).then(function (r) {
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
    fitView(); restoreSess(); if (window.AOSDeskX) window.AOSDeskX.show();
  }
  function hide(back) { D.open = false; D.menu = false; menu(); root.hidden = true; document.body.classList.remove('dk-on'); if (location.hash === '#desktop') { try { history.replaceState(null, '', '#home'); } catch (e) {} } if (back) A.go('home'); }

  /* ---------- events ---------- */
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-dk]'); var t = ev.target;
    if (!b) { if (D.menu && !t.closest('#dkmenu')) { D.menu = false; menu(); task(); } if (!t.closest('#dkctx') && !$('#dkctx').hidden) $('#dkctx').hidden = true; var inWin = t.closest && t.closest('.dkw'); if (inWin) { var w0 = byId(inWin.getAttribute('data-id')); if (w0 && D.top !== w0.id) focus(w0); } return; }
    if (b.classList.contains('cm')) $('#dkctx').hidden = true;
    var a = b.getAttribute('data-dk'), id = b.getAttribute('data-id'), w = id ? byId(id) : null;
    if (a === 'qs' || a === 'snip' || a === 'clockpop' || a === 'snew') { var X0 = window.AOSDeskX; if (X0 && X0[a]) X0[a](b, ev); return; }
    if (a === 'open') return void show();
    if (a === 'exit') return void hide(true);
    if (a === 'menu') { D.menu = !D.menu; D.q = ''; menu(); task(); var q = $('#dkq'); if (q) q.focus(); return; }
    if (D.menu && (a === 'launch' || a === 'app' || a === 'settings' || a === 'chooser')) { D.menu = false; menu(); task(); }
    if (a === 'launch' || a === 'app') { try { used(a === 'app' ? 'app:' + b.getAttribute('data-s') : b.getAttribute('data-w')); } catch (e) {} }
    if (a === 'mcat') { D.cat = b.getAttribute('data-c'); return void menu(); }
    if (a === 'isort') return void iconsArrange('name');
    if (a === 'itype') return void iconsArrange('type');
    if (a === 'iauto') return void iconsArrange('auto');
    if (a === 'chooser') { D.menu = false; menu(); task(); return void chooser(); }
    if (a === 'chdone' && w) return void closeWin(w);
    if (a === 'chsuggest') { setIcons(suggest()); return void chRepaint(); }
    if (a === 'chall') { setIcons(catalog().map(function (i) { return i.id; })); return void chRepaint(); }
    if (a === 'chnone') { setIcons([]); return void chRepaint(); }
    if (a === 'chreset') { setIcons(DEF_ICONS); setPins(DEF_PINS); return void chRepaint(); }
    if (a === 'chpin') { var pk = b.getAttribute('data-k'); setPins(toggle(pinIds(), pk, pinIds().indexOf(pk) < 0)); return void chRepaint(); }
    if (a === 'deskadd' || a === 'deskrm') { var dk = b.getAttribute('data-k'); setIcons(toggle(deskIds(), dk, a === 'deskadd')); return void chRepaint(); }
    if (a === 'pinadd' || a === 'pinrm') { setPins(toggle(pinIds(), b.getAttribute('data-k'), a === 'pinadd')); return void chRepaint(); }
    if (a === 'aifab') { var aw = D.ai.win; if (aw && !aw.min && D.top === aw.id) { aw.min = true; place(aw); task(); } else aiWin(); return; }
    if (a === 'launch') { var k = b.getAttribute('data-w'); if (window.AOSDeskX && window.AOSDeskX.ids[k]) return void window.AOSDeskX.open(k); if (k === 'ai') { var aw2 = D.ai.win; if (aw2 && !aw2.min && D.top === aw2.id) { aw2.min = true; place(aw2); task(); return; } return void aiWin(); } if (k === 'calc') return void calcWin(); if (k === 'browser') return void openBrowser(); if (k.indexOf('link:') === 0) { var lu = (window.AOS && AOS.link(k.slice(5))) || ''; if (!/^https?:\/\//.test(lu)) return void toast('Set this address in Settings, Direct sign-in links.'); window.open(lu, '_blank', 'noopener'); return; } if (k.indexOf('os:') === 0) return void osWin(k.slice(3)); if (k.indexOf('tool:') === 0) return void toolWin(k.slice(5)); return void filesWin(k === 'google' ? 'google' : 'cloud'); }
    if (a === 'app') return void openApp(b.getAttribute('data-s'));
    if (a === 'settings') { hide(); return void A.go('settings'); }
    if (a === 'tb') { if (!w) return; if (!w.min && D.top === w.id) { w.min = true; place(w); task(); } else focus(w); return; }
    if (w && (a === 'bmstar' || a === 'bmgo') && window.AOSBS) return void (a === 'bmstar' ? AOSBS.star(w) : AOSBS.go(w, b.getAttribute('data-u')));
    if (w && w.kind === 'browser' && /^b/.test(a) && a !== 'bar') return void bhand(a, b, w);
    if (a === 'wtab' && w) { if (w.url) window.open(w.url, '_blank', 'noopener'); return; }
    if (a === 'wmin' && w) { w.min = true; place(w); task(); return; }
    if (a === 'wmax' && w) { w.max = !w.max; place(w); return; }
    if (a === 'wclose' && w) return void closeWin(w);
    if (a === 'showdesk') { D.wins.forEach(function (x) { x.min = true; place(x); }); task(); return; }
    if (a === 'keys') return void helpPanel(true);
    if (a === 'fs') return void fullKeys();
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
    if (!D.open) return; if (ev.key === 'Escape' && !$('#dkctx').hidden) { $('#dkctx').hidden = true; return; } if (ev.key === 'Enter' && ev.target.id === 'dkq') { ev.preventDefault(); var f0 = $('#dkmenu .dk-ml .dk-mi'); if (f0) f0.click(); return; }
    if (ev.key === 'Escape') { if (D.menu) { D.menu = false; menu(); task(); } return; }
    if (ev.key === 'Enter' && !ev.shiftKey && ev.target.id === 'dkain') { ev.preventDefault(); var v = ev.target.value; ev.target.value = ''; aiSend(v); }
  });
  document.addEventListener('submit', function (ev) { var fm = ev.target;     if (fm.getAttribute && fm.getAttribute('data-dk-form') === 'url') { ev.preventDefault(); var bw = byId(fm.getAttribute('data-id')); if (bw) { var inp = fm.querySelector('.dk-url'); nav(bw, btab(bw), inp.value); } return; } if (ev.target.getAttribute && ev.target.getAttribute('data-dk-form') === 'ai') { ev.preventDefault(); var i = $('#dkain'); var v = i.value; i.value = ''; aiSend(v); } });
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (t.id === 'dkcq') { var cw = byId(t.closest('.dkw').getAttribute('data-id')); if (cw) { cw.q = t.value; var p2 = t.selectionStart; paintChooser(cw); var n2 = cw.body.querySelector('#dkcq'); if (n2) { n2.focus(); n2.setSelectionRange(p2, p2); } } return; }
    if (t.id === 'dkq') { D.q = t.value; var pos = t.selectionStart; menu(); var n = $('#dkq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }
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
    D.ctxAt = { x: ev.clientX, y: ev.clientY }; var deskItems = [['New sticky note', 'snew'], '-', ['Arrange icons by name', 'isort'], ['Arrange icons by type', 'itype'], ['Line icons up in the grid', 'iauto'], ['Choose desktop icons...', 'chooser'], ['Wallpaper...', 'wall'], '-', ['Open Files', 'launch', ' data-w="files"'], ['Open Browser', 'launch', ' data-w="browser"'], ['Open Assistant', 'launch', ' data-w="ai"'], ['Show desktop', 'showdesk'], ['Keyboard shortcuts', 'keys'], '-', ['Settings', 'settings'], ['Exit to Anands OS', 'exit']];
    var el;
    if ((el = t.closest('.dkw-bar'))) { var w = byId(el.closest('.dkw').getAttribute('data-id')); if (!w) return; ev.preventDefault(); return ctx(ev, winItems(w).concat([['Close all windows', 'closeall']])); }
    if ((el = t.closest('.dk-rb'))) { var w2 = byId(el.getAttribute('data-id')); if (!w2) return; ev.preventDefault(); return ctx(ev, winItems(w2)); }
    if ((el = t.closest('.dk-ic, .dk-pin, .dk-mi[data-k]'))) { var d = el.getAttribute('data-dk'), kk = el.getAttribute('data-k'), onD = deskIds().indexOf(kk) >= 0, onP = pinIds().indexOf(kk) >= 0; ev.preventDefault(); var kat = ' data-k="' + esc(kk) + '"'; var open = [['Open', d, (el.getAttribute('data-w') ? ' data-w="' + el.getAttribute('data-w') + '"' : '') + (el.getAttribute('data-s') ? ' data-s="' + esc(el.getAttribute('data-s')) + '"' : '')]]; return ctx(ev, open.concat(['-', onD ? ['Remove from desktop', 'deskrm', kat] : ['Add to desktop', 'deskadd', kat], onP ? ['Unpin from taskbar', 'pinrm', kat] : ['Pin to taskbar', 'pinadd', kat], '-', ['Choose desktop icons...', 'chooser'], ['Wallpaper...', 'wall']])); }
    if (t.closest('.dk-task')) { ev.preventDefault(); return ctx(ev, [['Show desktop', 'showdesk'], ['Close all windows', 'closeall', '', !D.wins.length], '-', ['Wallpaper...', 'wall'], ['Exit to Anands OS', 'exit']]); }
    if (t.closest('#dkicons, .dk-wall, .dk-wins') && !t.closest('.dkw')) { ev.preventDefault(); return ctx(ev, deskItems); }
    if (t.closest('.dkw, #dkmenu')) { if (t.closest('.dkw-body') && !t.closest('a, button')) return; ev.preventDefault(); }
  });

  /* ---------- keyboard shortcuts, Windows and Linux style ----------
     Shortcuts the browser or the computer's own desktop keeps for itself (Alt+Tab, the Windows key on some systems) cannot be caught here,
     so every action also has a Ctrl+Alt twin. Keys pressed inside an app window are forwarded here by the window. */
  var SHORTCUTS = [
    ['Windows', [['Alt + Tab', 'Switch window (hold Alt, press Tab again to go on, Shift to go back)'], ['Alt + F4', 'Close the window'], ['Alt + F9', 'Minimise the window'], ['Alt + F10', 'Maximise or restore'], ['Win + Up / Down', 'Maximise, restore or minimise'], ['Win + Left / Right', 'Snap to the left or right half'], ['Ctrl + Alt + Arrows', 'The same, if Win keys are taken by your computer']]],
    ['Desktop', [['Win (tap)  or  Ctrl + Esc', 'Open or close the Start menu'], ['Win + S', 'Start menu, searching'], ['Win + D  or  Ctrl + Alt + D', 'Show the desktop, again to bring windows back'], ['Win + 1 to 9  or  Ctrl + Alt + 1 to 9', 'Go to the 1st to 9th window on the taskbar'], ['Ctrl + Space  or  Ctrl + K', 'Quick Launcher: search apps, files, documents, or type calc 12*45'], ['F1  or  Ctrl + /', 'This list']]],
    ['Open an app', [['Win + E  or  Ctrl + Alt + E', 'Files'], ['Ctrl + Alt + T', 'Terminal'], ['Ctrl + Alt + B', 'Browser'], ['Ctrl + Alt + A', 'Assistant'], ['Ctrl + Alt + P', 'Paperless'], ['Ctrl + Alt + C', 'Calculator'], ['Ctrl + Alt + N', 'New sticky note'], ['Ctrl + Alt + S', 'Screenshot and Snip']]]
  ];
  /* Full screen plus the Keyboard Lock API (Chrome and Edge): while locked, Alt + Tab, the Windows key, Esc and friends come to this page instead of the computer. */
  function fullKeys() {
    var el = document.documentElement;
    if (document.fullscreenElement) { try { if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock(); } catch (e) {} return void document.exitFullscreen(); }
    if (!el.requestFullscreen) return toast('This browser cannot go full screen. Use the Ctrl + Alt shortcuts.');
    el.requestFullscreen().then(function () { lockKeys(true); }).catch(function () { toast('Full screen was refused. Use the Ctrl + Alt shortcuts.'); });
  }
  function lockKeys(say) {
    if (!document.fullscreenElement) return;
    if (!(navigator.keyboard && navigator.keyboard.lock)) { if (say) toast('Full screen is on. This browser keeps Alt + Tab and the Windows key, so use the Ctrl + Alt shortcuts.'); return; }
    navigator.keyboard.lock().then(function () { if (say) toast('Keys captured. Hold Esc to leave full screen.'); }).catch(function () { toast('Your browser did not allow key capture. Use the Ctrl + Alt shortcuts.'); });
  }
  document.addEventListener('fullscreenchange', function () { if (document.fullscreenElement) lockKeys(false); else { try { navigator.keyboard && navigator.keyboard.unlock && navigator.keyboard.unlock(); } catch (e) {} } });
  function topWin() { var w = byId(D.top); return w && !w.min ? w : null; }
  function toggleMenu(force) { D.menu = force === undefined ? !D.menu : force; D.q = ''; menu(); task(); var q = $('#dkq'); if (D.menu && q) q.focus(); }
  function launchKey(k) { if (window.AOSDeskX && window.AOSDeskX.ids[k]) return window.AOSDeskX.open(k); if (k === 'ai') return aiWin(); if (k === 'calc') return calcWin(); if (k === 'browser') return openBrowser(); if (k.indexOf('os:') === 0) return osWin(k.slice(3)); if (k.indexOf('tool:') === 0) { var id = k.slice(5); if (/^(terminal|money|subs|invest|belong|house|paperless)$/.test(id) && !(window.AOS && AOS.isOwner && AOS.isOwner())) return toast('Only the owner can open this.'); return toolWin(id); } return filesWin(k === 'google' ? 'google' : 'cloud'); }
  function snap(w, side) { var ar = area(); w.max = false; w.w = Math.max(320, Math.floor(ar.w / 2)); w.h = ar.h; w.y = 0; w.x = side < 0 ? 0 : ar.w - w.w; place(w); focus(w); }
  function winUp(w) { if (!w.max) { w.max = true; place(w); } }
  function winDown(w) { if (w.max) { w.max = false; place(w); } else { w.min = true; place(w); task(); var n = D.wins.filter(function (x) { return !x.min; }).sort(function (a, b) { return b.z - a.z; })[0]; if (n) focus(n); } }
  function showDesk() { var vis = D.wins.filter(function (x) { return !x.min; }); if (vis.length) { D.hid = vis; vis.forEach(function (x) { x.min = true; place(x); }); task(); } else if (D.hid) { var l = D.hid.filter(function (x) { return D.wins.indexOf(x) >= 0; }); D.hid = null; l.forEach(function (x, i) { x.min = false; if (i === l.length - 1) focus(x); else place(x); }); task(); } }
  function nthWin(n) { var w = D.wins.filter(function (x) { return x.kind !== 'ai'; })[n - 1]; if (w) { if (!w.min && D.top === w.id) { w.min = true; place(w); task(); } else focus(w); } else { var pins = pinIds(); if (pins[n - 1] && pins[n - 1].indexOf('link:') !== 0) launchKey(pins[n - 1]); } }
  function helpPanel(show) {
    var el = $('#dkhelp'); if (!show) { if (el) el.hidden = true; return; }
    if (!el) { el = document.createElement('div'); el.id = 'dkhelp'; el.className = 'dk-help'; root.appendChild(el); el.addEventListener('click', function (e) { if (e.target === el || e.target.closest('[data-hx]')) el.hidden = true; }); }
    el.innerHTML = '<div class="dk-hbox" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts"><div class="dk-hh"><b>Keyboard shortcuts</b><button data-hx aria-label="Close">&#10005;</button></div>' + SHORTCUTS.map(function (g) { return '<h4>' + g[0] + '</h4>' + g[1].map(function (r) { return '<div class="dk-hr"><span class="dk-keys">' + r[0].split(/\s+/).map(function (k) { return /^(\+|or|to|\(tap\))$/.test(k) ? '<em>' + k + '</em>' : '<kbd>' + esc(k) + '</kbd>'; }).join('') + '</span><span>' + esc(r[1]) + '</span></div>'; }).join(''); }).join('') + '<p class="dk-hn">Your browser or computer keeps a few of these for itself, such as Alt + Tab and the Windows key. Use the full screen button on the taskbar, not the F11 key (Chrome or Edge), and Alt + Tab and the Windows key work here too. Otherwise use the Ctrl + Alt versions.</p></div>'; el.hidden = false;
  }
  function switcher(dir) {
    var sw = D.sw; if (!sw) { var l = D.wins.filter(function (x) { return x.kind !== 'ai'; }).sort(function (a, b) { return b.z - a.z; }); if (!l.length) return; sw = D.sw = { l: l, i: 0 }; var el = document.createElement('div'); el.id = 'dkalt'; el.className = 'dk-alt'; root.appendChild(el); sw.el = el; }
    var n = sw.l.length; sw.i = (sw.i + dir + n) % n; if (n === 1) sw.i = 0;
    sw.el.innerHTML = sw.l.map(function (w, i) { return '<div class="dk-alti' + (i === sw.i ? ' on' : '') + '">' + (wIcon(w) ? '<img src="' + esc(wIcon(w)) + '" alt="">' : '<span class="dk-rg">' + ic(KIND_IC[w.kind] || (w.view && OSICON[w.view]) || 'folder') + '</span>') + '<span>' + esc(w.title) + '</span></div>'; }).join('');
  }
  function switcherEnd(commit) { var sw = D.sw; if (!sw) return; D.sw = null; sw.el.remove(); if (commit && sw.l[sw.i] && D.wins.indexOf(sw.l[sw.i]) >= 0) focus(sw.l[sw.i]); }
  /* returns true when the key was a shortcut and has been used */
  function shortcut(k) {
    if (!D.open) return false; var key = k.key, low = String(key || '').toLowerCase(), w = topWin(), win = k.meta, cA = k.ctrl && k.alt && !k.meta;
    if (k.t === 'keyup') {
      if (key === 'Alt' && D.sw) { switcherEnd(true); return true; }
      if (key === 'Meta') { var tap = D.metaTap; D.metaTap = false; if (tap) { toggleMenu(); return true; } }
      return false;
    }
    if (key === 'Meta') { D.metaTap = true; return false; } if (win) D.metaTap = false;
    if (D.sw) { if (key === 'Tab') { switcher(k.shift ? -1 : 1); return true; } if (key === 'Escape') { switcherEnd(false); return true; } if (key === 'ArrowRight' || key === 'ArrowDown') { switcher(1); return true; } if (key === 'ArrowLeft' || key === 'ArrowUp') { switcher(-1); return true; } }
    if (key === 'Tab' && k.alt && !k.ctrl && !win) { switcher(k.shift ? -1 : 1); return true; }
    if (k.ctrl && !k.alt && !win && !k.edit && (key === ' ' || (low === 'k' && !k.fr))) { if (window.AOSDeskX) window.AOSDeskX.qs(); return true; }
    if (key === 'F1' || (k.ctrl && !k.alt && !win && key === '/')) { helpPanel($('#dkhelp') ? $('#dkhelp').hidden : true); return true; }
    if (key === 'Escape' && $('#dkhelp') && !$('#dkhelp').hidden) { helpPanel(false); return true; }
    if (k.ctrl && !k.alt && !win && key === 'Escape') { toggleMenu(); return true; }
    if (k.alt && !k.ctrl && !win && key === 'F4') { if (w) closeWin(w); return true; }
    if (k.alt && !k.ctrl && !win && key === 'F9') { if (w) { w.min = true; place(w); task(); } return true; }
    if (k.alt && !k.ctrl && !win && key === 'F10') { if (w) { w.max = !w.max; place(w); } return true; }
    if ((win || cA) && !(k.edit && (cA || win) && /^[a-z0-9]$/.test(low))) {
      if (key === 'ArrowUp') { if (w) winUp(w); return true; } if (key === 'ArrowDown') { if (w) winDown(w); return true; }
      if (key === 'ArrowLeft') { if (w) snap(w, -1); return true; } if (key === 'ArrowRight') { if (w) snap(w, 1); return true; }
      if (low === 'd') { showDesk(); return true; }
      if (/^[1-9]$/.test(key)) { nthWin(+key); return true; }
      if (win && !k.alt && !k.ctrl && low === 's') { toggleMenu(true); return true; }
      var app = { e: 'files', t: 'tool:terminal', b: 'browser', a: 'ai', p: 'tool:paperless', c: 'calc', n: 'sticky', s: 'snip' }[low]; if (app && (cA || (win && low === 'e'))) { launchKey(app); return true; }
    }
    return false;
  }
  document.addEventListener('keydown', function (ev) { if (shortcut({ t: 'keydown', key: ev.key, alt: ev.altKey, ctrl: ev.ctrlKey, shift: ev.shiftKey, meta: ev.metaKey, edit: !!(ev.getModifierState && ev.getModifierState('AltGraph')) })) { ev.preventDefault(); ev.stopPropagation(); } }, true);
  document.addEventListener('keyup', function (ev) { if (shortcut({ t: 'keyup', key: ev.key, alt: ev.altKey, ctrl: ev.ctrlKey, shift: ev.shiftKey, meta: ev.metaKey })) ev.preventDefault(); }, true);
  window.addEventListener('blur', function () { switcherEnd(false); D.metaTap = false; });
  D.shortcut = shortcut;
  /* Keys typed inside an app window go to that window, not to the desktop. Every window is served from this same site, so listen inside it too and run the same shortcuts.
     (Anands OS pages inside a window already forward their keys; they are skipped here so nothing runs twice.) */
  function hookFrame(f) {
    try {
      var cw = f.contentWindow, d = cw && cw.document; if (!d || d.__aosk || cw.AOS) return; d.__aosk = 1;
      var h = function (e) { if (!D.open) return; if (shortcut({ t: e.type === 'keyup' ? 'keyup' : 'keydown', key: e.key, alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey, meta: e.metaKey, fr: 1, edit: !!(e.getModifierState && e.getModifierState('AltGraph')) })) { e.preventDefault(); e.stopPropagation(); } };
      d.addEventListener('keydown', h, true); d.addEventListener('keyup', h, true);
    } catch (e) {}
  }
  var wins0 = $('#dkwins'); if (wins0) { wins0.addEventListener('load', function (e) { if (e.target && e.target.tagName === 'IFRAME') hookFrame(e.target); }, true); }

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
  /* phones: follow the visible area so the taskbar stays on screen as the browser bar and keyboard come and go */
  function fitView() {
    var vv = window.visualViewport; if (!root) return;
    if (vv && window.innerWidth < 900) { root.style.top = Math.round(vv.offsetTop) + 'px'; root.style.height = Math.round(vv.height) + 'px'; } else { root.style.top = ''; root.style.height = ''; }
    if (D.open) D.wins.forEach(place);
  }
  window.addEventListener('resize', fitView); if (window.visualViewport) { window.visualViewport.addEventListener('resize', fitView); window.visualViewport.addEventListener('scroll', function () { if (window.innerWidth < 900) fitView(); }); }
  window.addEventListener('orientationchange', function () { setTimeout(fitView, 250); });
  setInterval(function () { var c = $('#dkclock'); if (c && D.open) c.textContent = clock(); }, 20000);
  document.addEventListener('change', function (ev) { if (ev.target.id === 'brse') { LS.set('brsearch', ev.target.value); toast('Search engine: ' + ev.target.options[ev.target.selectedIndex].text); return; } if (ev.target.id === 'brhome') { var hv = ev.target.value.trim(); if (hv && !normUrl(hv)) return toast('Enter a web address'); LS.set('brhome', hv ? normUrl(hv) : ''); toast(hv ? 'New tab page saved' : 'New tab opens a blank page'); return; } if (ev.target.classList && ev.target.classList.contains('dk-cki')) { setIcons(toggle(deskIds(), ev.target.getAttribute('data-k'), ev.target.checked)); var cn = ev.target.closest('.dk-ch').querySelector('#dkcn'); if (cn) cn.textContent = deskIds().length + ' on desktop'; return; } if (ev.target.id === 'dkwf') { wallFile(ev.target.files[0]); ev.target.value = ''; } });
  window.addEventListener('popstate', function () { if (location.hash === '#desktop') { if (!D.open) show(); } else if (D.open) hide(false); });
  (function wait(n) { if (S.user) { if (location.hash === '#desktop') show(); return; } if (n < 80) setTimeout(function () { wait(n + 1); }, 150); })(0);

  window.AOSBR = { ENGINES: ENGINES, QLAB: QLAB, rbPost: function () { return Promise.resolve(); }, rbTab: function () { return null; }, btab: btab, nav: nav, normUrl: normUrl, newTab: newTab };
  window.AOSDesk = { x: { mk: mk, focus: focus, place: place, closeWin: closeWin, task: task, area: area, root: root, catalog: catalog, launchKey: launchKey, calcEval: calcEval, byId: byId, saveSess: saveSess, openFile: openFileInApp }, tool: toolWin, show: show, hide: hide, state: D, openApp: openApp, walls: WALLS, light: LIGHT, setWall: function (k) { D.wall = k; LS.set('deskwall', k); wallStyle(); }, wallImg: wallImg };
})();
