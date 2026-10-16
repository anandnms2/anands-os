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
  root.innerHTML = '<div class="dk-wall" id="dkwall"></div><div class="dk-icons" id="dkicons"></div><div class="dk-wins" id="dkwins"></div><div class="dk-menu" id="dkmenu" hidden></div><div class="dk-ctx" id="dkctx" hidden></div><button class="dk-fab" id="dkfab" data-dk="aifab" aria-label="Ask the assistant" title="Ask the assistant"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg></button>' +
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
  var TOOLS = [['editor', 'Editor', '/tools/editor.html', 1000, 640, 'file'], ['player', 'Player', '/tools/player.html', 920, 600, 'play'], ['recorder', 'Recorder', '/tools/recorder.html', 820, 640, 'mic'], ['terminal', 'Terminal', '/tools/terminal.html', 900, 580, 'terminal'], ['money', 'Money', '/tools/money.html#overview', 1040, 660, 'card'], ['subs', 'Subscriptions', '/tools/money.html#subs', 940, 640, 'card'], ['invest', 'Investments', '/tools/money.html#invest', 980, 640, 'card'], ['belong', 'Belongings', '/tools/home.html#belong', 980, 640, 'folder'], ['house', 'Household', '/tools/home.html#house', 940, 640, 'folder'], ['paperless', 'Paperless', '/tools/paperless.html', 1100, 680, 'file']];
  var SYS = [['browser', 'Browser', 'globe'], ['files', 'Files', 'folder'], ['google', 'Google Drive', 'cloud'], ['ai', 'Assistant', 'chat'], ['calc', 'Calculator', 'card']].concat(TOOLS.map(function (o) { return ['tool:' + o[0], o[1], o[5]]; })).concat(OSAPPS.map(function (o) { return ['os:' + o[0], o[1], o[2]]; }));
  var DEF_ICONS = ['browser', 'files', 'ai'].concat(OSAPPS.map(function (o) { return 'os:' + o[0]; })).concat(['google']).concat(TOOLS.map(function (o) { return 'tool:' + o[0]; })), DEF_PINS = ['browser', 'files', 'ai', 'calc'];
  var NCAT = { calc: 'Productivity', 'tool:paperless': 'Productivity', 'tool:editor': 'Developer Tools', 'tool:terminal': 'Developer Tools', 'tool:player': 'Creative Tools', 'tool:recorder': 'Creative Tools', 'tool:money': 'Finance', 'tool:subs': 'Finance', 'tool:invest': 'Finance', 'tool:belong': 'Productivity', 'tool:house': 'Productivity', 'os:photos': 'Creative Tools', 'os:pulse': 'Productivity', 'os:cards': 'Business', 'os:vault': 'Productivity', 'os:insights': 'Engineering', 'os:servers': 'Engineering', 'os:vpn': 'Engineering' };
  function catalog() {
    var l = SYS.map(function (i) { return { id: i[0], name: i[1], ic: i[2], cat: NCAT[i[0]] || 'System', hay: i[1] + ' system' + (i[0] === 'google' ? ' drive cloud' : '') + (i[0] === 'browser' ? ' web internet' : '') }; });
    apps().forEach(function (a) { l.push({ id: 'app:' + a.slug, name: a.name, img: '/_icons/' + a.slug + '.png', slug: a.slug, cat: CATS.indexOf(a.category) >= 0 ? a.category : 'Other', hay: a.name + ' ' + (a.category || '') + ' ' + (a.alternativeTo || '') }); });
    return l;
  }
  function itemBy(id) { return catalog().filter(function (i) { return i.id === id; })[0]; }
  function itAttr(it) { return (it.slug ? 'data-dk="app" data-s="' + esc(it.slug) + '"' : 'data-dk="launch" data-w="' + esc(it.id) + '"') + ' data-k="' + esc(it.id) + '"'; }
  var OI = { calc: 'calc', 'tool:paperless': 'paperless', 'tool:editor': 'editor', 'tool:player': 'player', 'tool:recorder': 'recorder', 'tool:terminal': 'terminal', 'tool:money': 'money', 'tool:subs': 'subs', 'tool:invest': 'invest', 'tool:belong': 'belong', 'tool:house': 'house', browser: 'browser', files: 'files', google: 'drive', ai: 'ai', 'os:photos': 'photos', 'os:pulse': 'pulse', 'os:cards': 'cards', 'os:vault': 'vault', 'os:insights': 'insights', 'os:vpn': 'vpn', 'os:servers': 'servers' };
  function wIcon(w) { if (w.icon) return w.icon; var k = w.kind === 'rbrowser' || w.kind === 'browser' ? 'browser' : w.kind === 'ai' || w.kind === 'files' ? w.kind : w.tool ? 'tool:' + w.tool : w.view ? 'os:' + w.view : ''; return OI[k] ? '/oicons/' + OI[k] + '.svg' : ''; }
  function itGlyph(it, cls) { if (!it.img && OI[it.id]) it.img = '/oicons/' + OI[it.id] + '.svg'; return it.img ? '<img src="' + esc(it.img) + '" alt="">' : '<span class="dk-icg' + (cls ? ' ' + cls : '') + '">' + ic(it.ic) + '</span>'; }
  function lsList(k, d) { var v = LS.get(k, null); return Array.isArray(v) ? v : d.slice(); }
  function deskIds() { return lsList('deskicons', DEF_ICONS); }
  function pinIds() { return lsList('deskpins', DEF_PINS); }
  function setIcons(l) { LS.set('deskicons', l); icons(); }
  function setPins(l) { LS.set('deskpins', l); task(); }
  function used(id) { var u = LS.get('deskuse', {}) || {}; u[id] = (u[id] || 0) + 1; LS.set('deskuse', u); var r = (LS.get('deskrecent', []) || []).filter(function (x) { return x !== id; }); r.unshift(id); LS.set('deskrecent', r.slice(0, 6)); }
  function toggle(list, id, on) { var l = list.filter(function (x) { return x !== id; }); if (on) l.push(id); return l; }
  function icons() {
    var cat = catalog();
    $('#dkicons').innerHTML = deskIds().map(function (id) { return cat.filter(function (i) { return i.id === id; })[0]; }).filter(Boolean).map(function (it) { return '<button class="dk-ic" ' + itAttr(it) + '>' + itGlyph(it) + '<span>' + esc(it.name) + '</span></button>'; }).join('');
  }
  function pinBtn(it) { return '<button class="dk-pin" ' + itAttr(it) + ' title="' + esc(it.name) + '">' + (it.img ? '<img src="' + esc(it.img) + '" alt="">' : ic(it.ic)) + '</button>'; }
  function task() {
    var cat = catalog(), pins = pinIds().map(function (id) { return cat.filter(function (i) { return i.id === id; })[0]; }).filter(Boolean);
    var h = '<button class="dk-start' + (D.menu ? ' on' : '') + '" data-dk="menu" aria-label="Start"><img src="/logo-orange.png" alt=""></button><div class="dk-pins">' + pins.map(pinBtn).join('') + '</div><div class="dk-run">';
    D.wins.forEach(function (w) { if (w.kind === 'ai') return; h += '<button class="dk-rb' + (w.min ? ' min' : '') + (w.id === D.top && !w.min ? ' on' : '') + '" data-dk="tb" data-id="' + w.id + '" title="' + esc(w.title) + '">' + (wIcon(w) ? '<img src="' + esc(wIcon(w)) + '" alt="">' : '<span class="dk-rg">' + ic(KIND_IC[w.kind] || (w.view && OSICON[w.view]) || 'folder') + '</span>') + '<span>' + esc(w.title) + '</span></button>'; });
    h += '</div><span class="sp"></span><button class="dk-tray" data-dk="fs" title="Full screen, so Alt + Tab and the Windows key work here" aria-label="Full screen">' + ic('ext') + '</button><button class="dk-tray" data-dk="wall" title="Wallpaper">' + ic('photos') + '</button><span class="dk-clock" id="dkclock">' + esc(clock()) + '</span><button class="dk-exit" data-dk="exit" title="Back to Anands OS">' + ic('out') + 'Exit</button>';
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
        else if (sd.t === 'ai') w = aiWin(); else if (sd.t === 'calc') w = calcWin(); else if (sd.t === 'rb') w = rbWin(); else if (sd.t === 'br') { w = browserWin(sd.urls && sd.urls[0]); (sd.urls || []).slice(1).forEach(function (u) { newTab(w, u); }); }
      } catch (e) { w = null; }
      if (!w) return;
      if (typeof r.x === 'number') { w.x = r.x; w.y = r.y; w.w = r.w; w.h = r.h; } w.max = !!r.max; w.min = !!r.min; place(w); if (r.act) act = w;
    });
    if (act && !act.min) focus(act); else task();
  }
  function place(w) { saveSess(); var el = w.el, ar = area(); el.hidden = w.min; el.style.zIndex = w.z; if (w.max) { el.style.left = 0; el.style.top = 0; el.style.width = ar.w + 'px'; el.style.height = ar.h + 'px'; } else { el.style.left = w.x + 'px'; el.style.top = w.y + 'px'; el.style.width = w.w + 'px'; el.style.height = w.h + 'px'; } el.classList.toggle('max', !!w.max); el.classList.toggle('bare', !!w.max && (w.kind === 'rbrowser' || w.kind === 'browser')); }
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

  /* ---------- Anands OS pages as windows (Photos, Pulse, Cards...) ---------- */
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
  function loadRb() { if (D.rbTried) return; D.rbTried = true; fetch('/api/rb/status', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (c) { D.rbn = !!(c && c.available); }).catch(function () {}); fetch('/api/settings', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (c) { var u = c && c.rbrowser && c.rbrowser.url; if (u && /^https?:/i.test(u)) { D.rb = u; D.wins.forEach(function (w) { if (w.kind === 'browser') { if (w.b.full === undefined) w.b.full = true; paintBrowser(w); } }); } }).catch(function () {}); }
  function browserWin(url) {
    loadRb();
    var w = mk('browser', 'Browser', { w: 1000, h: 640 }); w.sd = { t: 'br' }; w.b = { tabs: [], cur: 0, n: 0, full: D.rb ? (url ? false : true) : undefined }; newTab(w, url); return w;
  }
  function newTab(w, url) { var t = { id: ++w.b.n, url: '', title: 'New tab', hist: [], i: -1 }; w.b.tabs.push(t); w.b.cur = t.id; paintBrowser(w); if (url) nav(w, t, url); else { var q = w.body.querySelector('.dk-url'); if (q) q.focus(); } return t; }
  function nav(w, t, input, noPush) {
    var u = normUrl(input); if (!u) return; t.url = u; t.want = u; t.force = true; t.title = u.replace(/^https?:\/\//, '').slice(0, 40);
    if (!noPush) { t.hist = t.hist.slice(0, t.i + 1); t.hist.push(u); t.i = t.hist.length - 1; }
    paintBrowser(w); if (window.AOSBS) AOSBS.visit(u, t.title);
  }
  function bstart(w) {
    return '<div class="dk-start2"><h2>Browser</h2><form data-dk-form="url" data-id="' + w.id + '" class="dk-sf"><input class="input dk-url" placeholder="Search the web or type an address" autocomplete="off" aria-label="Search"><button class="btn primary">Go</button></form><div class="dk-q">' + QUICK.map(function (q) { return '<button class="btn" data-dk="bgo" data-id="' + w.id + '" data-u="' + esc(q[1]) + '">' + esc(q[0]) + '</button>'; }).join('') + '</div>' +
      '<p class="note">Pages open through your Anands server in a sandbox, so sites cannot see your Anands session. Simple pages work best. Cookies are kept for your session, so many sign-ins and forms work. For video calls, payments and heavy web apps press Full browser (a complete remote Chrome, set up in Settings) or open the page in a real tab.</p></div>';
  }
  function paintBrowser(w) {
    var b = w.b, t = btab(w);
    if (!w.body.querySelector('.dk-br')) w.body.innerHTML = '<div class="dk-br"><div class="dk-bts" role="tablist"></div><div class="dk-barw"></div><div class="dk-bv"><div class="dk-sw"></div></div></div>';
    w.body.querySelector('.dk-bts').innerHTML = b.tabs.map(function (x) { return '<div class="dk-bt' + (x.id === b.cur ? ' on' : '') + '" data-dk="btab" data-id="' + w.id + '" data-t="' + x.id + '" role="tab" aria-selected="' + (x.id === b.cur) + '"><span>' + esc(x.title) + '</span>' + (b.tabs.length > 1 ? '<button data-dk="bclose" data-id="' + w.id + '" data-t="' + x.id + '" aria-label="Close tab">&#10005;</button>' : '') + '</div>'; }).join('') + '<button class="dk-bnew" data-dk="bnew" data-id="' + w.id + '" aria-label="New tab">+</button><button class="dk-bnew" data-dk="bset" data-id="' + w.id + '" aria-label="Browser settings" title="Browser settings">' + ic('settings') + '</button>' + (D.rb ? '<button class="btn sm dk-bfull' + (b.full ? ' on' : '') + '" data-dk="bfull" data-id="' + w.id + '" title="A complete remote browser: sign-ins, video, web apps">' + (b.full ? 'Simple tabs' : 'Full browser') + '</button>' : '');
    var rf = w.body.querySelector('.dk-bv iframe.dk-rb');
    if (b.full && D.rb) { if (!rf) { rf = document.createElement('iframe'); rf.className = 'dkw-frame dk-rb'; rf.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-pointer-lock'); rf.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen; microphone; camera; autoplay'); rf.title = 'Full browser'; rf.src = D.rb; w.body.querySelector('.dk-bv').appendChild(rf); } rf.hidden = false; w.body.querySelector('.dk-barw').hidden = true; } else { if (rf) rf.hidden = true; w.body.querySelector('.dk-barw').hidden = false; }
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

  /* ---------- full Chromium running inside the Anands OS server, streamed here ---------- */
  function openBrowser(url) { if (D.rbn) return rbWin(url); if (!D.rbTried) { loadRb(); return void fetch('/api/rb/status', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (c) { D.rbn = !!(c && c.available); openBrowser(url); }).catch(function () { D.rbn = false; browserWin(url); }); } return browserWin(url); }
  function rbWin(url) {
    var ex = D.wins.filter(function (x) { return x.kind === 'rbrowser'; })[0]; if (ex) { focus(ex); if (url) rbPost(ex, '/open', { url: normUrl(url) }); return ex; }
    var w = mk('rbrowser', 'Browser', { w: 1100, h: 700 }); w.sd = { t: 'rb' }; w.r = { tabs: [], active: null, q: [], mv: null, wh: null, fw: 0, fh: 0, down: false };
    w.body.innerHTML = '<div class="dk-br"><div class="dk-bts" role="tablist"></div><div class="dk-barw"></div><div class="dk-bv dk-rv"><canvas class="dk-rc" tabindex="0" aria-label="Web page"></canvas><div class="dk-rmsg" hidden></div></div></div>';
    rbBar(w); var cv = w.body.querySelector('.dk-rc'); rbWire(w, cv); if (window.AOSBS) AOSBS.sync(w);
    var es = new EventSource('/api/rb/events'); w.r.es = es; w.onclose = function () { try { es.close(); } catch (e) {} clearInterval(w.r.tick); };
    es.addEventListener('tabs', function (e) { var d = JSON.parse(e.data); w.r.tabs = d.tabs; w.r.active = d.active; rbBar(w); var t = rbTab(w); if (window.AOSBS && t && t.url && !t.loading && t.url !== w.r.lastv) { w.r.lastv = t.url; AOSBS.visit(t.url, t.title); } w.title = (t && t.title ? t.title + ' - ' : '') + 'Browser'; task(); });
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
    bar.innerHTML = '<form class="dk-bar2" data-dk-form="rburl" data-id="' + w.id + '"><button type="button" class="btn sm" data-dk="rbback" data-id="' + w.id + '" aria-label="Back">' + ic('back') + '</button><button type="button" class="btn sm" data-dk="rbfwd" data-id="' + w.id + '" aria-label="Forward">' + ic('r') + '</button><button type="button" class="btn sm" data-dk="rbreload" data-id="' + w.id + '" aria-label="Reload">&#8635;</button><input class="input dk-url" aria-label="Address or search" placeholder="Search or type a web address" value="' + esc(t ? t.url : '') + '" autocomplete="off" spellcheck="false"><button type="button" class="btn sm dk-star" data-dk="bmstar" data-id="' + w.id + '" aria-label="Bookmark this page" title="Bookmark this page">' + ic('star') + '</button><button type="button" class="btn sm" data-dk="rbset" data-id="' + w.id + '" aria-label="Browser settings" title="Browser settings">' + ic('settings') + '</button></form>';
    if (keep !== null) { var ui = bar.querySelector('.dk-url'); ui.value = keep; ui.focus(); }
    if (window.AOSBS) AOSBS.bar(w);
  }
  function rbQ(w, e, flushNow) { w.r.q.push(e); if (flushNow) rbFlush(w); }
  function rbFlush(w) {
    var r = w.r; if (!r.active) return; var ev = r.q; r.q = []; if (r.mv) { ev.push(r.mv); r.mv = null; } if (r.wh) { ev.push(r.wh); r.wh = null; }
    if (ev.length) rbPost(w, '/input', { tab: r.active, ev: ev }, true);
  }
  function rbWire(w, cv) {
    function zoomBy(d) { var z = d === 0 ? 100 : Math.max(25, Math.min(300, (Number(LS.get('brzoom', 100)) || 100) + d)); LS.set('brzoom', z); rbPost(w, '/prefs', { zoom: z }, true); A.toast && A.toast('Zoom ' + z + '%'); }
    function pos(e) { var b = cv.getBoundingClientRect(), fw = w.r.fw || cv.width || 1, fh = w.r.fh || cv.height || 1; return { x: Math.round((e.clientX - b.left) * fw / b.width), y: Math.round((e.clientY - b.top) * fh / b.height) }; }
    var mod = function (e) { return (e.altKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.metaKey ? 4 : 0) | (e.shiftKey ? 8 : 0); };
    cv.addEventListener('mousemove', function (e) { var p = pos(e); w.r.mv = { t: 'm', k: 'move', x: p.x, y: p.y, mod: mod(e), held: e.buttons ? 1 : 0, b: e.buttons & 4 ? 1 : e.buttons & 2 ? 2 : 0 }; });
    cv.addEventListener('mousedown', function (e) { cv.focus(); var p = pos(e); w.r.down = true; rbQ(w, { t: 'm', k: 'down', x: p.x, y: p.y, b: e.button, cc: e.detail || 1, mod: mod(e) }, true); e.preventDefault(); });
    window.addEventListener('mouseup', function (e) { if (!w.r.down) return; w.r.down = false; if (!document.contains(cv)) return; var p = pos(e); rbQ(w, { t: 'm', k: 'up', x: p.x, y: p.y, b: e.button, cc: e.detail || 1, mod: mod(e) }, true); });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    cv.addEventListener('wheel', function (e) { e.preventDefault(); if (e.ctrlKey || e.metaKey) { zoomBy(e.deltaY < 0 ? 10 : -10); return; } var p = pos(e), k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 600 : 1; var o = w.r.wh || { t: 'w', x: p.x, y: p.y, dx: 0, dy: 0, mod: mod(e) }; o.x = p.x; o.y = p.y; o.dx += e.deltaX * k; o.dy += e.deltaY * k; w.r.wh = o; }, { passive: false });
    cv.addEventListener('keydown', function (e) {
      var m = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      if (m && (k === '+' || k === '=' || k === '-' || k === '_' || k === '0')) { zoomBy(k === '0' ? 0 : (k === '-' || k === '_') ? -10 : 10); e.preventDefault(); return; } /* page zoom goes through the zoom setting, never raw Chromium zoom */
      if (m && k === 'v') return; /* the paste event brings the text */
      if (m && (k === 'c' || k === 'x')) { rbQ(w, { t: 'k', k: 'down', key: e.key, code: e.code, kc: e.keyCode, mod: mod(e) }, true); rbPost(w, '/copy', { tab: w.r.active }, true).then(function (j) { if (j && j.text) { try { navigator.clipboard.writeText(j.text); } catch (x) {} } }); e.preventDefault(); return; }
      rbQ(w, { t: 'k', k: 'down', key: e.key, code: e.code, kc: e.keyCode, mod: mod(e), rep: e.repeat ? 1 : 0 }, true); e.preventDefault();
    });
    cv.addEventListener('keyup', function (e) { var m = e.ctrlKey || e.metaKey; if (m && e.key.toLowerCase() === 'v') return; rbQ(w, { t: 'k', k: 'up', key: e.key, code: e.code, kc: e.keyCode, mod: mod(e) }, true); e.preventDefault(); });
    cv.addEventListener('paste', function (e) { var t = e.clipboardData && e.clipboardData.getData('text'); if (t) rbQ(w, { t: 'text', s: t }, true); e.preventDefault(); });
  }
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
  function rbHand(a, b, w) {
    var id = b.getAttribute('data-t');
    if (a === 'rbtab') return void rbPost(w, '/activate', { tab: id });
    if (a === 'rbclose') return void rbPost(w, '/close', { tab: id });
    if (a === 'rbnew') { var home = newHome(); return void rbPost(w, '/open', home ? { url: normUrl(home) } : {}).then(function () { var u = w.body.querySelector('.dk-url'); if (u) u.focus(); }); }
    if (a === 'rbback') return void rbPost(w, '/go', { tab: w.r.active, dir: 'back' });
    if (a === 'rbfwd') return void rbPost(w, '/go', { tab: w.r.active, dir: 'forward' });
    if (a === 'rbreload') return void rbPost(w, '/go', { tab: w.r.active, dir: 'reload' });
    if (a === 'rbsimple') return void browserWin();
    if (a === 'rbset') return void rbSettings(w);
    if (a === 'bmstar') return void (window.AOSBS && AOSBS.star(w));
    if (a === 'bmgo') return void (window.AOSBS && AOSBS.go(w, b.getAttribute('data-u')));
    if (a === 'rbsetx') { var bs = w.body.querySelector('.dk-bset'); if (bs) bs.remove(); return; }
    if (a === 'rbclear') { return void rbPost(w, '/clear', {}).then(function () { toast('Cookies and cache cleared'); }); }
    if (a === 'rbq') { var q = b.getAttribute('data-q'); LS.set('brqual', q); rbPost(w, '/quality', { q: q }); return void rbSettings(w, true); }
  }
  function bhand(a, b, w) {
    var t = btab(w);
    if (a === 'bset') return void rbSettings(w);
    if (a === 'bmstar') return void (window.AOSBS && AOSBS.star(w));
    if (a === 'bmgo') return void (window.AOSBS && AOSBS.go(w, b.getAttribute('data-u')));
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
  function calcEval(src) {
    var t = src.replace(/\u00d7/g, '*').replace(/\u00f7/g, '/').replace(/\u2212/g, '-').replace(/,/g, ''), i = 0;
    function ws() { while (t[i] === ' ') i++; }
    function num() { ws(); var m = /^(\d+\.?\d*|\.\d+)/.exec(t.slice(i)); if (!m) throw 0; i += m[0].length; var v = parseFloat(m[0]); ws(); while (t[i] === '%') { v /= 100; i++; ws(); } return v; }
    function atom() { ws(); if (t[i] === '-') { i++; return -atom(); } if (t[i] === '+') { i++; return atom(); } if (t[i] === '(') { i++; var v = expr(); ws(); if (t[i] !== ')') throw 0; i++; ws(); while (t[i] === '%') { v /= 100; i++; ws(); } return v; } return num(); }
    function term() { var v = atom(); for (;;) { ws(); if (t[i] === '*') { i++; v *= atom(); } else if (t[i] === '/') { i++; v /= atom(); } else return v; } }
    function expr() { var v = term(); for (;;) { ws(); if (t[i] === '+') { i++; v += term(); } else if (t[i] === '-') { i++; v -= term(); } else return v; } }
    var open = (t.match(/\(/g) || []).length - (t.match(/\)/g) || []).length; while (open-- > 0) t += ')';
    var v = expr(); ws(); if (i < t.length || !isFinite(v)) throw 0; return Math.round(v * 1e12) / 1e12;
  }
  function calcWin() {
    var ex = D.wins.filter(function (x) { return x.kind === 'calc'; })[0]; if (ex) { focus(ex); return ex; }
    var w = mk('calc', 'Calculator', { w: 320, h: 470, icon: '/oicons/calc.svg' }); w.sd = { t: 'calc' }; w.x = Math.max(0, Math.round((area().w - w.w) / 2)); place(w);
    var keys = [['C', 'fn'], ['(', 'fn'], [')', 'fn'], ['\u00f7', 'op'], ['7'], ['8'], ['9'], ['\u00d7', 'op'], ['4'], ['5'], ['6'], ['\u2212', 'op'], ['1'], ['2'], ['3'], ['+', 'op'], ['%', 'fn'], ['0'], ['.'], ['=', 'eq']];
    w.body.innerHTML = '<div class="dk-calc" tabindex="0"><div class="dk-cx" aria-live="polite"><div class="dk-ch" data-calc-h></div><div class="dk-cv" data-calc-v>0</div></div><div class="dk-ck">' + keys.map(function (k) { return '<button class="' + (k[1] || 'num') + '" data-calc="' + esc(k[0]) + '">' + esc(k[0]) + '</button>'; }).join('') + '</div><button class="dk-cb" data-calc="\u232b" aria-label="Delete the last character">\u232b Delete</button></div>';
    var box = w.body.querySelector('.dk-calc'), V = w.body.querySelector('[data-calc-v]'), H = w.body.querySelector('[data-calc-h]'), cur = '', done = false;
    function show(err) { V.textContent = err ? 'Error' : (cur === '' ? '0' : cur); V.classList.toggle('bad', !!err); }
    function press(k) {
      var isOp = /^[+\u2212\u00d7\u00f7]$/.test(k);
      if (k === 'C') { cur = ''; H.textContent = ''; done = false; return show(); }
      if (k === '\u232b') { if (done) { cur = ''; done = false; H.textContent = ''; } else cur = cur.slice(0, -1); return show(); }
      if (k === '=') { if (!cur) return; try { var r = calcEval(cur); H.textContent = cur + ' ='; cur = String(r); done = true; show(); } catch (e) { show(true); cur = ''; done = false; } return; }
      if (done) { if (isOp || k === '%') done = false; else { cur = ''; done = false; H.textContent = ''; } }
      if (isOp) { if (!cur && k !== '\u2212') return; if (/[+\u2212\u00d7\u00f7]$/.test(cur)) cur = cur.slice(0, -1); }
      if (k === '.') { var last = cur.split(/[+\u2212\u00d7\u00f7()%]/).pop(); if (last.indexOf('.') >= 0) return; if (!last) cur += '0'; }
      if (k === '%' && !/[\d)]$/.test(cur)) return;
      cur += k; if (cur.length > 60) cur = cur.slice(0, 60); show();
    }
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-calc]'); if (b) { press(b.getAttribute('data-calc')); box.focus(); } });
    box.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) { if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'c') { try { navigator.clipboard.writeText(V.textContent); } catch (x) {} e.preventDefault(); } return; }
      var k = e.key, m = { '*': '\u00d7', '/': '\u00f7', '-': '\u2212', 'x': '\u00d7', 'X': '\u00d7', ',': '.', 'Enter': '=', '=': '=', 'Backspace': '\u232b', 'Escape': 'C', 'Delete': 'C' };
      if (m[k]) k = m[k]; if (/^[0-9.+()%\u00d7\u00f7\u2212=C\u232b]$/.test(k)) { e.preventDefault(); e.stopPropagation(); press(k); }
    });
    setTimeout(function () { box.focus(); }, 30); return w;
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
    fitView(); restoreSess();
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
    if (D.menu && (a === 'launch' || a === 'app' || a === 'settings' || a === 'chooser')) { D.menu = false; menu(); task(); }
    if (a === 'launch' || a === 'app') { try { used(a === 'app' ? 'app:' + b.getAttribute('data-s') : b.getAttribute('data-w')); } catch (e) {} }
    if (a === 'mcat') { D.cat = b.getAttribute('data-c'); return void menu(); }
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
    if (a === 'launch') { var k = b.getAttribute('data-w'); if (k === 'ai') { var aw2 = D.ai.win; if (aw2 && !aw2.min && D.top === aw2.id) { aw2.min = true; place(aw2); task(); return; } return void aiWin(); } if (k === 'calc') return void calcWin(); if (k === 'browser') return void openBrowser(); if (k.indexOf('link:') === 0) { var lu = (window.AOS && AOS.link(k.slice(5))) || ''; if (!/^https?:\/\//.test(lu)) return void toast('Set this address in Settings, Direct sign-in links.'); window.open(lu, '_blank', 'noopener'); return; } if (k.indexOf('os:') === 0) return void osWin(k.slice(3)); if (k.indexOf('tool:') === 0) return void toolWin(k.slice(5)); return void filesWin(k === 'google' ? 'google' : 'cloud'); }
    if (a === 'app') return void openApp(b.getAttribute('data-s'));
    if (a === 'settings') { hide(); return void A.go('settings'); }
    if (a === 'tb') { if (!w) return; if (!w.min && D.top === w.id) { w.min = true; place(w); task(); } else focus(w); return; }
    if (w && (a === 'bmstar' || a === 'bmgo') && window.AOSBS) return void (a === 'bmstar' ? AOSBS.star(w) : AOSBS.go(w, b.getAttribute('data-u')));
    if (w && w.kind === 'rbrowser' && /^rb/.test(a)) return void rbHand(a, b, w);
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
  document.addEventListener('submit', function (ev) { var fm = ev.target; if (fm.getAttribute && fm.getAttribute('data-dk-form') === 'rburl') { ev.preventDefault(); var rw = byId(fm.getAttribute('data-id')); if (rw) { var ri = fm.querySelector('.dk-url'), u = normUrl(ri.value); if (u) { rbPost(rw, rw.r.active ? '/nav' : '/open', { tab: rw.r.active, url: u }); var cvv = rw.body.querySelector('.dk-rc'); if (cvv) cvv.focus(); } } return; }
    if (fm.getAttribute && fm.getAttribute('data-dk-form') === 'url') { ev.preventDefault(); var bw = byId(fm.getAttribute('data-id')); if (bw) { var inp = fm.querySelector('.dk-url'); nav(bw, btab(bw), inp.value); } return; } if (ev.target.getAttribute && ev.target.getAttribute('data-dk-form') === 'ai') { ev.preventDefault(); var i = $('#dkain'); var v = i.value; i.value = ''; aiSend(v); } });
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
    var deskItems = [['Choose desktop icons...', 'chooser'], ['Wallpaper...', 'wall'], '-', ['Open Files', 'launch', ' data-w="files"'], ['Open Browser', 'launch', ' data-w="browser"'], ['Open Assistant', 'launch', ' data-w="ai"'], ['Show desktop', 'showdesk'], ['Keyboard shortcuts', 'keys'], '-', ['Settings', 'settings'], ['Exit to Anands OS', 'exit']];
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
    ['Desktop', [['Win (tap)  or  Ctrl + Esc', 'Open or close the Start menu'], ['Win + S', 'Start menu, searching'], ['Win + D  or  Ctrl + Alt + D', 'Show the desktop, again to bring windows back'], ['Win + 1 to 9  or  Ctrl + Alt + 1 to 9', 'Go to the 1st to 9th window on the taskbar'], ['Ctrl + K', 'Search everything'], ['F1  or  Ctrl + /', 'This list']]],
    ['Open an app', [['Win + E  or  Ctrl + Alt + E', 'Files'], ['Ctrl + Alt + T', 'Terminal'], ['Ctrl + Alt + B', 'Browser'], ['Ctrl + Alt + A', 'Assistant'], ['Ctrl + Alt + P', 'Paperless'], ['Ctrl + Alt + C', 'Calculator']]]
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
    navigator.keyboard.lock().then(function () { if (say) toast('Keys captured. Hold Esc to leave full screen.'); }).catch(function () {});
  }
  document.addEventListener('fullscreenchange', function () { if (document.fullscreenElement) lockKeys(false); else { try { navigator.keyboard && navigator.keyboard.unlock && navigator.keyboard.unlock(); } catch (e) {} } });
  function topWin() { var w = byId(D.top); return w && !w.min ? w : null; }
  function toggleMenu(force) { D.menu = force === undefined ? !D.menu : force; D.q = ''; menu(); task(); var q = $('#dkq'); if (D.menu && q) q.focus(); }
  function launchKey(k) { if (k === 'ai') return aiWin(); if (k === 'calc') return calcWin(); if (k === 'browser') return openBrowser(); if (k.indexOf('os:') === 0) return osWin(k.slice(3)); if (k.indexOf('tool:') === 0) { var id = k.slice(5); if (/^(terminal|money|subs|invest|belong|house|paperless)$/.test(id) && !(window.AOS && AOS.isOwner && AOS.isOwner())) return toast('Only the owner can open this.'); return toolWin(id); } return filesWin(k === 'google' ? 'google' : 'cloud'); }
  function snap(w, side) { var ar = area(); w.max = false; w.w = Math.max(320, Math.floor(ar.w / 2)); w.h = ar.h; w.y = 0; w.x = side < 0 ? 0 : ar.w - w.w; place(w); focus(w); }
  function winUp(w) { if (!w.max) { w.max = true; place(w); } }
  function winDown(w) { if (w.max) { w.max = false; place(w); } else { w.min = true; place(w); task(); var n = D.wins.filter(function (x) { return !x.min; }).sort(function (a, b) { return b.z - a.z; })[0]; if (n) focus(n); } }
  function showDesk() { var vis = D.wins.filter(function (x) { return !x.min; }); if (vis.length) { D.hid = vis; vis.forEach(function (x) { x.min = true; place(x); }); task(); } else if (D.hid) { var l = D.hid.filter(function (x) { return D.wins.indexOf(x) >= 0; }); D.hid = null; l.forEach(function (x, i) { x.min = false; if (i === l.length - 1) focus(x); else place(x); }); task(); } }
  function nthWin(n) { var w = D.wins.filter(function (x) { return x.kind !== 'ai'; })[n - 1]; if (w) { if (!w.min && D.top === w.id) { w.min = true; place(w); task(); } else focus(w); } else { var pins = pinIds(); if (pins[n - 1] && pins[n - 1].indexOf('link:') !== 0) launchKey(pins[n - 1]); } }
  function helpPanel(show) {
    var el = $('#dkhelp'); if (!show) { if (el) el.hidden = true; return; }
    if (!el) { el = document.createElement('div'); el.id = 'dkhelp'; el.className = 'dk-help'; root.appendChild(el); el.addEventListener('click', function (e) { if (e.target === el || e.target.closest('[data-hx]')) el.hidden = true; }); }
    el.innerHTML = '<div class="dk-hbox" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts"><div class="dk-hh"><b>Keyboard shortcuts</b><button data-hx aria-label="Close">&#10005;</button></div>' + SHORTCUTS.map(function (g) { return '<h4>' + g[0] + '</h4>' + g[1].map(function (r) { return '<div class="dk-hr"><span class="dk-keys">' + r[0].split(/\s+/).map(function (k) { return /^(\+|or|to|\(tap\))$/.test(k) ? '<em>' + k + '</em>' : '<kbd>' + esc(k) + '</kbd>'; }).join('') + '</span><span>' + esc(r[1]) + '</span></div>'; }).join(''); }).join('') + '<p class="dk-hn">Your browser or computer keeps a few of these for itself, such as Alt + Tab and the Windows key. Press the full screen button on the taskbar (Chrome or Edge) and Alt + Tab and the Windows key work here too. Otherwise use the Ctrl + Alt versions.</p></div>'; el.hidden = false;
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
      var app = { e: 'files', t: 'tool:terminal', b: 'browser', a: 'ai', p: 'tool:paperless', c: 'calc' }[low]; if (app && (cA || (win && low === 'e'))) { launchKey(app); return true; }
    }
    return false;
  }
  document.addEventListener('keydown', function (ev) { if (shortcut({ t: 'keydown', key: ev.key, alt: ev.altKey, ctrl: ev.ctrlKey, shift: ev.shiftKey, meta: ev.metaKey, edit: !!(ev.getModifierState && ev.getModifierState('AltGraph')) })) { ev.preventDefault(); ev.stopPropagation(); } }, true);
  document.addEventListener('keyup', function (ev) { if (shortcut({ t: 'keyup', key: ev.key, alt: ev.altKey, ctrl: ev.ctrlKey, shift: ev.shiftKey, meta: ev.metaKey })) ev.preventDefault(); }, true);
  window.addEventListener('blur', function () { switcherEnd(false); D.metaTap = false; });
  D.shortcut = shortcut;

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

  window.AOSBR = { ENGINES: ENGINES, QLAB: QLAB, rbPost: rbPost, rbTab: rbTab, btab: btab, nav: nav, normUrl: normUrl, newTab: newTab };
  window.AOSDesk = { tool: toolWin, show: show, hide: hide, state: D, openApp: openApp, walls: WALLS, light: LIGHT, setWall: function (k) { D.wall = k; LS.set('deskwall', k); wallStyle(); }, wallImg: wallImg };
})();
