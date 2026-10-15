/* Anands local Puter shim.
 * Replaces https://js.puter.com/v2/. Implements the parts of Puter.js the apps use
 * (auth, kv, fs, ai, a few ui helpers) against THIS server's /_local endpoints.
 * Nothing here ever contacts puter.com. Unsupported features fail with a clear error. */
(function (g) {
  'use strict';
  /* /meet/ is the guest copy of the Meetings app: no account, no stored files. */
  var ON_MEET = location.pathname.indexOf('/meet/') === 0 || location.pathname === '/meet';
  /* Someone who is signed in to this OS and opens a meeting link is the host, not a guest: they can start the meeting. One quick check, before the app starts. */
  var GUEST = ON_MEET;
  if (ON_MEET) { try { var x = new XMLHttpRequest(); x.open('GET', '/_local/auth/user', false); x.send(); if (x.status === 200) GUEST = false; } catch (e) {} }
  var APP = ON_MEET ? 'meetings' : ((location.pathname.match(/^\/apps\/([^\/]+)/) || [])[1] || 'os');
  function mk(code, msg) { var e = new Error(msg || code); e.code = code; return e; }
  function post(path, body, extra) {
    var h = { 'x-aos': '1', 'x-app': APP };
    var init = { method: 'POST', credentials: 'same-origin', headers: h };
    if (body instanceof Blob || body instanceof ArrayBuffer || ArrayBuffer.isView(body)) { init.body = body; h['content-type'] = 'application/octet-stream'; }
    else { init.body = JSON.stringify(body || {}); h['content-type'] = 'application/json'; }
    return fetch('/_local' + path + (extra || ''), init).then(function (r) {
      if (r.ok) return r;
      return r.json().catch(function () { return {}; }).then(function (j) { throw mk(j.code || 'http_' + r.status, j.message || r.statusText); });
    });
  }
  function unsupported(name) { return function () { return Promise.reject(mk('not_available', name + ' is not available in Anands local mode')); }; }
  function lenient(name) { return function () { if (g.console) console.debug('[anands-puter] ' + name + ' ignored'); return Promise.resolve(undefined); }; }
  function bagOf(prefix, real, fallback) {
    return new Proxy(real, { get: function (t, k) { if (k in t) return t[k]; if (typeof k !== 'string' || k === 'then') return undefined; return fallback(prefix + '.' + k); } });
  }

  var userP = null;
  var auth = bagOf('auth', {
    isSignedIn: function () { return !GUEST; },
    getUser: function () { if (GUEST) return Promise.reject(mk('auth_required', 'Not signed in')); return userP || (userP = fetch('/_local/auth/user', { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw mk('auth_required', 'Not signed in'); return r.json(); })); },
    whoami: function () { return auth.getUser(); },
    signIn: function () { return auth.getUser(); },
    signOut: function () { location.href = '/auth/logout'; return Promise.resolve(); },
    getProfilePicture: function () { return Promise.resolve(null); },
    getMonthlyUsage: function () { return Promise.resolve({ allowanceInfo: { monthUsageAllowance: 0, remaining: 0 }, usage: {} }); }
  }, unsupported);

  function norm(v) { return v; }
  var LS = 'aosk:';
  function lsGet(k) { try { var v = localStorage.getItem(LS + k); return v === null ? null : JSON.parse(v); } catch (e) { return null; } }
  var kvLocal = {
    get: function (k) { return Promise.resolve(lsGet(k)); },
    set: function (k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) {} return Promise.resolve(true); },
    add: function (k, v) { var o = lsGet(k); var a = Array.isArray(o) ? o : []; a.push(v); return kvLocal.set(k, a).then(function () { return a; }); },
    del: function (k) { try { localStorage.removeItem(LS + k); } catch (e) {} return Promise.resolve(true); },
    incr: function (k, by) { var n = (Number(lsGet(k)) || 0) + (by == null ? 1 : by); return kvLocal.set(k, n).then(function () { return n; }); },
    decr: function (k, by) { return kvLocal.incr(k, -(by == null ? 1 : by)); },
    list: function (pat, vals) { var out = []; try { var re = new RegExp('^' + String(typeof pat === 'string' ? pat : '*').replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'); for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(LS) === 0 && re.test(k.slice(LS.length))) out.push(vals === true || pat === true ? { key: k.slice(LS.length), value: lsGet(k.slice(LS.length)) } : k.slice(LS.length)); } } catch (e) {} return Promise.resolve(out); },
    flush: function () { return Promise.resolve(true); }
  };
  var kv = GUEST ? kvLocal : {
    get: function (key) { return post('/kv', { op: 'get', key: key }).then(function (r) { return r.json(); }).then(function (j) { return j.result == null ? null : j.result; }); },
    set: function (key, value) { return post('/kv', { op: 'set', key: key, value: value }).then(function () { return true; }); },
    add: function (key, value) { return post('/kv', { op: 'add', key: key, value: value }).then(function (r) { return r.json(); }).then(function (j) { return j.result; }); },
    del: function (key) { return post('/kv', { op: 'del', key: key }).then(function () { return true; }); },
    incr: function (key, by) { return post('/kv', { op: 'incr', key: key, by: by == null ? 1 : by }).then(function (r) { return r.json(); }).then(function (j) { return j.result; }); },
    decr: function (key, by) { return kv.incr(key, -(by == null ? 1 : by)); },
    list: function (pattern, returnValues) {
      if (typeof pattern === 'boolean') { returnValues = pattern; pattern = '*'; }
      return post('/kv', { op: 'list', pattern: pattern || '*', values: !!returnValues }).then(function (r) { return r.json(); }).then(function (j) { return j.result; });
    },
    flush: function () { return post('/kv', { op: 'flush' }).then(function () { return true; }); }
  };

  function enc(p) { return '?path=' + encodeURIComponent(p); }
  function toBlob(d) {
    if (d instanceof Blob) return d;
    if (typeof d === 'string') return new Blob([d], { type: 'text/plain' });
    if (d instanceof ArrayBuffer || ArrayBuffer.isView(d)) return new Blob([d]);
    return new Blob([JSON.stringify(d)], { type: 'application/json' });
  }
  var fs = {
    read: function (path) { return post('/fs/read', { path: path }).then(function (r) { return r.blob(); }); },
    write: function (path, data, opts) {
      opts = opts || {};
      var q = enc(path) + '&mkdirs=' + (opts.createMissingParents ? 1 : 0) + '&overwrite=' + (opts.overwrite === false ? 0 : 1);
      return post('/fs/write', toBlob(data), q).then(function (r) { return r.json(); });
    },
    readdir: function (path) { return post('/fs/readdir', { path: path }).then(function (r) { return r.json(); }); },
    stat: function (path) { return post('/fs/stat', { path: path }).then(function (r) { return r.json(); }); },
    mkdir: function (path, opts) { return post('/fs/mkdir', { path: path, parents: !!(opts && opts.createMissingParents) }).then(function (r) { return r.json(); }); },
    delete: function (path, opts) { return post('/fs/delete', { path: path, recursive: !(opts && opts.recursive === false) }).then(function () { return undefined; }); },
    rename: function (path, name) { return post('/fs/rename', { path: path, name: name }).then(function (r) { return r.json(); }); },
    move: function (src, dest) { return post('/fs/move', { from: src, to: dest }).then(function (r) { return r.json(); }); },
    copy: function (src, dest) { return post('/fs/copy', { from: src, to: dest }).then(function (r) { return r.json(); }); },
    exists: function (path) { return fs.stat(path).then(function () { return true; }, function () { return false; }); },
    getReadURL: function (path) { return Promise.resolve('/_local/fs/get' + enc(path)); },
    upload: function (files, dest) {
      var list = Array.prototype.slice.call(files && files.length != null ? files : [files]);
      return Promise.all(list.map(function (f) { return fs.write((dest || '/') + '/' + f.name, f, { createMissingParents: true }); }));
    }
  };

  function pick(accept, multiple) {
    return new Promise(function (resolve, reject) {
      var i = document.createElement('input'); i.type = 'file'; if (multiple) i.multiple = true;
      if (accept) i.accept = accept;
      i.onchange = function () {
        var fl = Array.prototype.slice.call(i.files || []);
        if (!fl.length) return reject(mk('cancelled', 'No file chosen'));
        var items = fl.map(function (f) { return { name: f.name, path: '/' + f.name, size: f.size, is_dir: false, read: function () { return Promise.resolve(f); }, text: function () { return f.text(); } }; });
        resolve(multiple ? items : items[0]);
      };
      i.click();
    });
  }
  /* ---- files opened from the OS (?open=/Drive/...) ---- */
  function itemOf(st) { var p = st.path; return { name: st.name, path: p, size: st.size, is_dir: !!st.is_dir, read: function () { return fs.read(p); }, text: function () { return fs.read(p).then(function (b) { return b.text(); }); } }; }
  var launchP = null;
  try { var lo = new URLSearchParams(location.search).getAll('open'); if (lo.length) launchP = Promise.all(lo.map(function (p) { return fs.stat(p).then(itemOf).catch(function () { return null; }); })).then(function (a) { return a.filter(Boolean); }); } catch (e) {}
  // Apps with no launch hand-off but a hidden <input type=file>: feed the Drive file to it once the app has started.
  (function () {
    var m = location.pathname.match(/\/apps\/([^\/]+)/); if (!launchP || !m || ['photo-studio'].indexOf(m[1]) < 0) return;
    launchP.then(function (items) {
      if (!items.length) return; var tries = 0, done = false;
      (function poll() {
        if (done) return; var inp = document.getElementById('file-input') || document.querySelector('input[type=file]');
        if (!inp) { if (++tries < 100) setTimeout(poll, 300); return; }
        done = true;
        setTimeout(function () {
          Promise.all(items.map(function (it) { return it.read().then(function (b) { return new File([b], it.name, { type: b.type || '' }); }); })).then(function (files) {
            var dt = new DataTransfer(); files.forEach(function (f) { dt.items.add(f); }); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
          }).catch(function () {});
        }, 1200);
      })();
    });
  })();
  function onLaunch(cb) { if (launchP && typeof cb === 'function') launchP.then(function (items) { if (items.length) cb(items); }); }

  /* ---- in-page file browser for Open / Save (lists local files and /Drive) ---- */
  var EXT = { 'image/*': 'png jpg jpeg gif webp svg', 'application/pdf': 'pdf', 'text/*': 'txt md csv json html', 'audio/*': 'mp3 wav ogg m4a', 'video/*': 'mp4 webm mov' };
  function accepts(accept) {
    var toks = (accept ? [].concat(accept).join(',') : '').split(',').map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
    var exts = []; toks.forEach(function (t) { if (t.charAt(0) === '.') exts.push(t.slice(1)); else if (EXT[t]) exts = exts.concat(EXT[t].split(' ')); });
    return function (name) { if (!exts.length) return true; var m = /\.([a-z0-9]+)$/i.exec(name); return !!m && exts.indexOf(m[1].toLowerCase()) > -1; };
  }
  function el(tag, css, text) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; return e; }
  function browse(mode, o) {
    return new Promise(function (resolve, reject) {
      var cwd = '/', ok = accepts(o.accept), done = false;
      var ov = el('div', 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.5);display:grid;place-items:center;font:14px system-ui,sans-serif;color-scheme:light dark');
      var box = el('div', 'width:min(560px,94vw);max-height:82vh;display:flex;flex-direction:column;background:Canvas;color:CanvasText;border:1px solid rgba(128,128,128,.4);border-radius:14px;overflow:hidden');
      var head = el('div', 'padding:14px 16px;border-bottom:1px solid rgba(128,128,128,.3);font-weight:600', mode === 'open' ? 'Open a file' : 'Save to');
      var crumb = el('div', 'padding:8px 16px;font-size:13px;opacity:.75;border-bottom:1px solid rgba(128,128,128,.2)');
      var list = el('div', 'overflow:auto;min-height:220px;flex:1');
      var foot = el('div', 'padding:12px 16px;border-top:1px solid rgba(128,128,128,.3);display:flex;gap:8px;align-items:center;flex-wrap:wrap');
      var BTN = 'font:inherit;padding:7px 12px;border-radius:9px;border:1px solid rgba(128,128,128,.5);background:transparent;color:inherit;cursor:pointer';
      function btn(t, primary) { var b = el('button', BTN + (primary ? ';background:#f68712;border-color:#f68712;color:#111;font-weight:600' : ''), t); b.type = 'button'; return b; }
      function finish(fn, v) { if (done) return; done = true; ov.remove(); fn(v); }
      function row(label, hint, onclick) { var r = el('button', 'display:flex;gap:10px;width:100%;text-align:left;padding:10px 16px;border:0;border-bottom:1px solid rgba(128,128,128,.15);background:transparent;color:inherit;font:inherit;cursor:pointer'); r.type = 'button'; r.appendChild(el('span', 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', label)); if (hint) r.appendChild(el('span', 'opacity:.6;font-size:12.5px', hint)); r.onclick = onclick; return r; }
      var nameIn = null;
      function load(p) {
        cwd = p; crumb.textContent = p; list.textContent = 'Loading...';
        fs.readdir(p).then(function (items) {
          items.sort(function (a, b) { return (b.is_dir ? 1 : 0) - (a.is_dir ? 1 : 0) || a.name.localeCompare(b.name); }); list.textContent = '';
          if (p !== '/') list.appendChild(row('..', 'Up', function () { load(p.replace(/\/[^/]*$/, '') || '/'); }));
          var n = 0; items.forEach(function (it) {
            if (it.is_dir) { n++; list.appendChild(row('📁 ' + it.name, '', function () { load(it.path); })); }
            else if (mode === 'open' ? ok(it.name) : true) { n++; list.appendChild(row(it.name, it.size ? Math.max(1, Math.round(it.size / 1024)) + ' KB' : '', function () { if (mode === 'open') finish(resolve, o.multiple ? [itemOf(it)] : itemOf(it)); else nameIn.value = it.name; })); }
          });
          if (!n) list.appendChild(el('div', 'padding:20px 16px;opacity:.65', 'Nothing here.'));
        }).catch(function (e) { list.textContent = 'Could not read this folder' + (e && e.message ? ': ' + e.message : '') + '.'; });
      }
      if (mode === 'save') {
        nameIn = el('input', 'flex:1;min-width:140px;font:inherit;padding:7px 10px;border-radius:9px;border:1px solid rgba(128,128,128,.5);background:transparent;color:inherit'); nameIn.value = o.name || 'untitled'; nameIn.setAttribute('aria-label', 'File name'); foot.appendChild(nameIn);
        var sv = btn('Save', true); sv.onclick = function () { var nm = (nameIn.value || '').replace(/[\\/]/g, '_').trim(); if (!nm) return; var full = (cwd === '/' ? '' : cwd) + '/' + nm; sv.disabled = true; sv.textContent = 'Saving...'; fs.write(full, o.data, { overwrite: true, createMissingParents: true }).then(function () { finish(resolve, { name: nm, path: full }); }).catch(function (e) { sv.disabled = false; sv.textContent = 'Save'; crumb.textContent = 'Could not save: ' + ((e && e.message) || 'error'); }); };
        var dl = btn('Download instead'); dl.onclick = function () { var a = document.createElement('a'); a.href = URL.createObjectURL(toBlob(o.data)); a.download = nameIn.value || 'download'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000); finish(resolve, { name: nameIn.value || 'download', path: '/' + (nameIn.value || 'download') }); };
        foot.appendChild(dl); foot.appendChild(sv);
      } else {
        var dev = btn('From this device'); dev.onclick = function () { ov.remove(); done = true; pick(o.accept, !!o.multiple).then(resolve, reject); }; foot.appendChild(dev);
      }
      var cn = btn('Cancel'); cn.onclick = function () { finish(reject, mk('cancelled', 'Cancelled')); }; foot.appendChild(cn);
      ov.onclick = function (e) { if (e.target === ov) cn.onclick(); };
      ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') cn.onclick(); });
      box.appendChild(head); box.appendChild(crumb); box.appendChild(list); box.appendChild(foot); ov.appendChild(box); document.body.appendChild(ov);
      load('/');
    });
  }
  var ui = bagOf('ui', {
    showOpenFilePicker: function (o) { return browse('open', o || {}); },
    showSaveFilePicker: function (data, name) { return browse('save', { data: data, name: name }); },
    setWindowTitle: function (t) { try { document.title = t; } catch (e) {} return Promise.resolve(); },
    parentApp: function () { return null; },
    onLaunchedWithItems: onLaunch, onItemsOpened: onLaunch, onWindowClose: function () {},
    on: function () {}, off: function () {}
  }, lenient);

  function asText(x) { if (typeof x === 'string') return x; if (x && x.message) return typeof x.message.content === 'string' ? x.message.content : JSON.stringify(x.message.content); return String(x); }
  function chatResult(text, model) { var r = { message: { role: 'assistant', content: text }, model: model || 'local', toString: function () { return text; }, valueOf: function () { return text; } }; return r; }
  var ai = bagOf('ai', {
    chat: function (a, b, c) {
      var messages, opts = {};
      if (typeof a === 'string') messages = [{ role: 'user', content: a }];
      else if (Array.isArray(a)) messages = a;
      else messages = [{ role: 'user', content: String(a) }];
      [b, c].forEach(function (x) { if (x && typeof x === 'object' && !Array.isArray(x)) opts = Object.assign(opts, x); });
      if (opts.system) messages = [{ role: 'system', content: opts.system }].concat(messages);
      return post('/ai/chat', { messages: messages, model: opts.model, temperature: opts.temperature }).then(function (r) { return r.json(); }).then(function (j) { return chatResult(j.text, j.model); });
    },
    txt: function (p, o) { return ai.chat(p, o).then(asText); }
  }, unsupported);

  /* Workers: the Calendar's RSVP and booking endpoint runs on this server (see server/workers.js). Its public address is this site's own address. */
  function withUrl(r) { return r.json().then(function (j) { if (j && j.name) j.url = location.origin; return j; }); }
  var workers = bagOf('workers', {
    create: function (name, path) { return post('/workers/create', { name: name, path: path }).then(withUrl); },
    get: function (name) { return post('/workers/get', { name: name }).then(withUrl); },
    list: function () { return post('/workers/list', {}).then(function (r) { return r.json(); }); },
    delete: function (name) { return post('/workers/delete', { name: name }).then(function (r) { return r.json(); }); },
    exec: function (url, opts) {
      var u; try { u = new URL(url, location.href); } catch (e) { return Promise.reject(mk('bad_url', 'Bad worker address')); }
      if (u.hostname === 'calendar-email.puter.work' && /^\/(invites|cancellations|replies)$/.test(u.pathname)) {
        return fetch('/_local/mail-service' + u.pathname, { method: 'POST', credentials: 'same-origin', headers: { 'x-aos': '1', 'x-app': APP, 'content-type': 'application/json' }, body: (opts && opts.body) || '{}' });
      }
      if (u.origin === location.origin && /^\/(rsvp|book|booking|api\/(rsvp|book|booking)|admin)\//.test(u.pathname)) return fetch(u.href, { method: (opts && opts.method) || 'GET', headers: opts && opts.headers, body: opts && opts.body, credentials: 'omit' });
      return unsupported('workers.exec')();
    }
  }, unsupported);
  /* Email goes out through the SMTP server you set in Settings. */
  var email = bagOf('email', { send: function (m) { return post('/mail/send', m || {}).then(function (r) { return r.json(); }); } }, unsupported);

  /* Peer-to-peer: loaded on first use. Meetings, multiplayer games and shared whiteboards use it. */
  var peerP = null;
  function loadPeer() {
    return peerP || (peerP = new Promise(function (res, rej) {
      if (g.__aosPeer) return res(g.__aosPeer);
      var sc = document.createElement('script'); sc.src = '/_suite/peer.js'; sc.onload = function () { res(g.__aosPeer); };
      sc.onerror = function () { peerP = null; rej(mk('not_available', 'Could not load the peer service')); }; document.head.appendChild(sc);
    }));
  }
  var peer = {};
  ['serve', 'connect', 'ensureTurnRelays', 'createGuestGrant'].forEach(function (n) { peer[n] = function () { var a = arguments; return loadPeer().then(function (p) { return p[n].apply(p, a); }); }; });

  var P = {
    env: 'web', appID: 'anands-' + APP, version: 'v2-local', local: true,
    auth: auth, kv: kv, fs: fs, ui: ui, ai: ai,
    randName: function () { var w = ['amber', 'basalt', 'cedar', 'delta', 'ember', 'fjord', 'granite', 'harbor', 'indigo', 'juniper']; return w[Math.floor(Math.random() * w.length)] + '-' + w[Math.floor(Math.random() * w.length)] + '-' + Math.floor(Math.random() * 1000); },
    print: function (t) { try { document.body.insertAdjacentHTML('beforeend', t); } catch (e) {} },
    exit: function () {}, getUser: function () { return auth.getUser(); },
    events: bagOf('events', { onLocal: function () {}, on: function () {} }, lenient),
    perms: bagOf('perms', { request: function () { return Promise.resolve(true); }, has: function () { return Promise.resolve(true); } }, unsupported), hosting: bagOf('hosting', {}, unsupported),
    workers: workers, email: email, peer: peer,
    apps: bagOf('apps', {}, unsupported), net: bagOf('net', {}, unsupported)
  };
  g.puter = new Proxy(P, { get: function (t, k) { if (k in t) return t[k]; if (typeof k !== 'string' || k === 'then') return undefined; return bagOf(k, {}, unsupported); } });
  try { g.dispatchEvent(new Event('puter-ready')); } catch (e) {}
})(window);
