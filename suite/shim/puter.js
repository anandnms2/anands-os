/* Anands local Puter shim.
 * Replaces https://js.puter.com/v2/. Implements the parts of Puter.js the apps use
 * (auth, kv, fs, ai, a few ui helpers) against THIS server's /_local endpoints.
 * Nothing here ever contacts puter.com. Unsupported features fail with a clear error. */
(function (g) {
  'use strict';
  var APP = (location.pathname.match(/^\/apps\/([^\/]+)/) || [])[1] || 'os';
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
  var auth = {
    isSignedIn: function () { return Promise.resolve(true); },
    getUser: function () { return userP || (userP = fetch('/_local/auth/user', { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw mk('auth_required', 'Not signed in'); return r.json(); })); },
    signIn: function () { return auth.getUser(); },
    signOut: function () { location.href = '/auth/logout'; return Promise.resolve(); },
    getProfilePicture: function () { return Promise.resolve(null); }
  };

  function norm(v) { return v; }
  var kv = {
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
  var ui = bagOf('ui', {
    showOpenFilePicker: function (o) { o = o || {}; var acc = o.accept; if (acc && typeof acc !== 'string') acc = [].concat(acc).join(','); return pick(acc, !!o.multiple); },
    showSaveFilePicker: function (data, name) {
      var a = document.createElement('a'); var b = toBlob(data); a.href = URL.createObjectURL(b); a.download = name || 'download';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      return Promise.resolve({ name: name || 'download', path: '/' + (name || 'download') });
    },
    setWindowTitle: function (t) { try { document.title = t; } catch (e) {} return Promise.resolve(); },
    parentApp: function () { return null; },
    onLaunchedWithItems: function () {}, onItemsOpened: function () {}, onWindowClose: function () {},
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

  var P = {
    env: 'web', appID: 'anands-' + APP, version: 'v2-local', local: true,
    auth: auth, kv: kv, fs: fs, ui: ui, ai: ai,
    randName: function () { var w = ['amber', 'basalt', 'cedar', 'delta', 'ember', 'fjord', 'granite', 'harbor', 'indigo', 'juniper']; return w[Math.floor(Math.random() * w.length)] + '-' + w[Math.floor(Math.random() * w.length)] + '-' + Math.floor(Math.random() * 1000); },
    print: function (t) { try { document.body.insertAdjacentHTML('beforeend', t); } catch (e) {} },
    exit: function () {}, getUser: function () { return auth.getUser(); },
    events: bagOf('events', { onLocal: function () {}, on: function () {} }, lenient),
    perms: bagOf('perms', {}, unsupported), hosting: bagOf('hosting', {}, unsupported),
    workers: bagOf('workers', {}, unsupported), peer: bagOf('peer', {}, unsupported),
    apps: bagOf('apps', {}, unsupported), net: bagOf('net', {}, unsupported)
  };
  g.puter = new Proxy(P, { get: function (t, k) { if (k in t) return t[k]; if (typeof k !== 'string' || k === 'then') return undefined; return bagOf(k, {}, unsupported); } });
  try { g.dispatchEvent(new Event('puter-ready')); } catch (e) {}
})(window);
