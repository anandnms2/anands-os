/* Bitwarden / Vaultwarden client crypto, run entirely in the browser (window.AOSVault).
   The master password and the keys never leave this page. Only the standard login hash is sent, through the OS relay. */
(function () {
'use strict';
var enc = new TextEncoder(), dec = new TextDecoder(), subtle = crypto.subtle;
function b64d(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
function b64e(u) { var s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
function cat(a, b) { var o = new Uint8Array(a.length + b.length); o.set(a, 0); o.set(b, a.length); return o; }
function pick(o, k) { return o[k] !== undefined ? o[k] : o[k.charAt(0).toUpperCase() + k.slice(1)]; }
function pbkdf2(pw, salt, iter) { return subtle.importKey('raw', pw, 'PBKDF2', false, ['deriveBits']).then(function (k) { return subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, k, 256); }).then(function (b) { return new Uint8Array(b); }); }
function hmac(key, data) { return subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']).then(function (k) { return subtle.sign('HMAC', k, data); }).then(function (b) { return new Uint8Array(b); }); }
function eq(a, b) { if (a.length !== b.length) return false; var d = 0; for (var i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; }
function loadArgon() { if (window.hashwasm && window.hashwasm.argon2id) return Promise.resolve(); return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = '/vendor/argon2.js'; s.onload = ok; s.onerror = function () { no(new Error('Could not load the Argon2 module.')); }; document.head.appendChild(s); }); }
function masterKey(pw, email, kdf) {
  var pwb = enc.encode(pw), em = enc.encode(email.trim().toLowerCase());
  if (kdf.type === 1) {
    return loadArgon().then(function () { return subtle.digest('SHA-256', em); }).then(function (salt) {
      return window.hashwasm.argon2id({ password: pwb, salt: new Uint8Array(salt), parallelism: kdf.par || 4, iterations: kdf.iter || 3, memorySize: (kdf.mem || 64) * 1024, hashLength: 32, outputType: 'binary' }); });
  }
  return pbkdf2(pwb, em, kdf.iter || 600000);
}
function expand(key, info) { return hmac(key, cat(enc.encode(info), new Uint8Array([1]))); }
function stretch(mk) { return Promise.all([expand(mk, 'enc'), expand(mk, 'mac')]).then(function (r) { return { enc: r[0], mac: r[1] }; }); }
/* EncString type 2: "2.iv|data|mac" (AES-256-CBC + HMAC-SHA256) */
function decryptBytes(str, k) {
  if (typeof str !== 'string' || !str) return Promise.resolve(null);
  var m = /^(\d)\.(.*)$/.exec(str); if (!m) return Promise.reject(new Error('Unsupported data format'));
  if (m[1] !== '2') return Promise.reject(new Error('This account uses an encryption format that is not supported here yet (type ' + m[1] + ').'));
  var p = m[2].split('|'); if (p.length < 3) return Promise.reject(new Error('Malformed encrypted value'));
  var iv = b64d(p[0]), ct = b64d(p[1]), mac = b64d(p[2]);
  return hmac(k.mac, cat(iv, ct)).then(function (calc) {
    if (!eq(calc, mac)) throw new Error('Wrong key or damaged data');
    return subtle.importKey('raw', k.enc, 'AES-CBC', false, ['decrypt']);
  }).then(function (ck) { return subtle.decrypt({ name: 'AES-CBC', iv: iv }, ck, ct); }).then(function (b) { return new Uint8Array(b); });
}
function decryptStr(str, k) { return decryptBytes(str, k).then(function (b) { return b ? dec.decode(b) : ''; }); }
function toKey(b) { return { enc: b.slice(0, 32), mac: b.slice(32, 64) }; }
function deviceId() { try { var d = localStorage.getItem('aos.vault.device'); if (d) return d; d = crypto.randomUUID(); localStorage.setItem('aos.vault.device', d); return d; } catch (e) { return crypto.randomUUID(); } }
function relay(path, init) {
  init = init || {}; init.credentials = 'same-origin'; init.headers = Object.assign({ 'x-aos': '1' }, init.headers || {});
  return fetch('/api/vault/' + path, init).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, ok: r.ok, body: j }; }); });
}
function fail(msg, code, extra) { var e = new Error(msg); e.code = code; if (extra) Object.keys(extra).forEach(function (k) { e[k] = extra[k]; }); return e; }

/* ---- TOTP (RFC 6238) ---- */
function b32(s) { var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', bits = '', o = []; s.replace(/[\s=-]/g, '').toUpperCase().split('').forEach(function (c) { var i = A.indexOf(c); if (i > -1) bits += ('00000' + i.toString(2)).slice(-5); }); for (var i = 0; i + 8 <= bits.length; i += 8) o.push(parseInt(bits.substr(i, 8), 2)); return new Uint8Array(o); }
function totpParams(v) {
  if (!v) return null; v = String(v).trim();
  if (/^otpauth:\/\//i.test(v)) { try { var u = new URL(v), q = u.searchParams, sec = q.get('secret'); if (!sec) return null; return { secret: sec, digits: +q.get('digits') || 6, period: +q.get('period') || 30, algo: (q.get('algorithm') || 'SHA1').toUpperCase() }; } catch (e) { return null; } }
  if (/^steam:\/\//i.test(v)) return null;
  return { secret: v, digits: 6, period: 30, algo: 'SHA1' };
}
function totp(v, now) {
  var p = totpParams(v); if (!p) return Promise.resolve(null);
  var hash = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA512: 'SHA-512' }[p.algo] || 'SHA-1', c = Math.floor((now || Date.now()) / 1000 / p.period), buf = new ArrayBuffer(8);
  new DataView(buf).setUint32(4, c);
  return subtle.importKey('raw', b32(p.secret), { name: 'HMAC', hash: hash }, false, ['sign']).then(function (k) { return subtle.sign('HMAC', k, buf); }).then(function (sg) {
    var h = new Uint8Array(sg), o = h[h.length - 1] & 15, n = (((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % Math.pow(10, p.digits);
    return { code: ('0000000000' + n).slice(-p.digits), period: p.period, left: p.period - (Math.floor((now || Date.now()) / 1000) % p.period) };
  });
}

/* ---- login + sync ---- */
function login(email, pw, twofa) {
  email = email.trim().toLowerCase(); var mk, hash, kdf;
  return relay('identity/accounts/prelogin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: email }) }).then(function (r) {
    if (!r.ok) throw fail(r.body.error || 'Could not reach the Vault', r.body.code || 'upstream');
    var b = r.body; kdf = { type: +pick(b, 'kdf') || 0, iter: +pick(b, 'kdfIterations') || 600000, mem: +pick(b, 'kdfMemory') || 0, par: +pick(b, 'kdfParallelism') || 0 };
    return masterKey(pw, email, kdf);
  }).then(function (k) { mk = k; return pbkdf2(mk, enc.encode(pw), 1); }).then(function (h) {
    hash = b64e(h);
    var f = { grant_type: 'password', username: email, password: hash, scope: 'api offline_access', client_id: 'web', deviceType: '9', deviceName: 'anands-os', deviceIdentifier: deviceId() };
    if (twofa) { f.twoFactorToken = twofa.code; f.twoFactorProvider = String(twofa.provider); f.twoFactorRemember = '0'; }
    return relay('identity/connect/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'auth-email': b64e(enc.encode(email)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), 'device-type': '9' }, body: new URLSearchParams(f).toString() });
  }).then(function (r) {
    var b = r.body;
    if (!r.ok) {
      var prov = pick(b, 'twoFactorProviders'); if (prov && prov.length && !twofa) throw fail('Two-step code needed', '2fa', { providers: prov.map(Number) });
      var msg = (b.error_description || (b.ErrorModel && b.ErrorModel.Message) || b.error || '').toString();
      if (r.status === 400 || r.status === 401) throw fail(twofa ? 'That code was not accepted.' : 'Wrong email or master password.', 'bad_login');
      throw fail(msg || 'The Vault refused the login.', b.code || 'upstream');
    }
    var token = b.access_token, ukey = pick(b, 'key');
    if (!token || !ukey) throw fail('The Vault did not return a key for this account.', 'upstream');
    return stretch(mk).then(function (sk) { return decryptBytes(ukey, sk); }).then(function (kb) {
      if (kb.length === 32) return stretch(kb); if (kb.length === 64) return toKey(kb); throw fail('Unexpected key size', 'upstream');
    }).then(function (userKey) { mk = null; return relay('api/sync', { headers: { authorization: 'Bearer ' + token } }).then(function (s) { var tk = token; token = null; if (!s.ok) throw fail(s.body.error || 'Sync failed', 'upstream'); return openVault(s.body, userKey, tk); }); });
  });
}
var sess = null; /* { userKey, token, folders:{id:name}, raw:{id:cipher} } lives only in this page's memory */
function encStr(str, k) {
  if (str == null || str === '') return Promise.resolve(null);
  var iv = crypto.getRandomValues(new Uint8Array(16)), data = typeof str === 'string' ? enc.encode(str) : str;
  return subtle.importKey('raw', k.enc, 'AES-CBC', false, ['encrypt']).then(function (ck) { return subtle.encrypt({ name: 'AES-CBC', iv: iv }, ck, data); }).then(function (ct) {
    ct = new Uint8Array(ct); return hmac(k.mac, cat(iv, ct)).then(function (mac) { return '2.' + b64e(iv) + '|' + b64e(ct) + '|' + b64e(mac); });
  });
}
function cipherKey(c) { var ik = pick(c, 'key'); return ik ? decryptBytes(ik, sess.userKey).then(toKey) : Promise.resolve(sess.userKey); }
function decryptCipher(c) {
  return cipherKey(c).then(function (k) {
    var type = +pick(c, 'type'), l = pick(c, 'login') || {}, uris = pick(l, 'uris') || [], d = function (v) { return v ? decryptStr(v, k).catch(function () { return ''; }) : Promise.resolve(''); };
    return Promise.all([d(pick(c, 'name')), d(pick(c, 'notes')), d(pick(l, 'username')), d(pick(l, 'password')), d(pick(l, 'totp')), uris.length ? d(pick(uris[0], 'uri')) : Promise.resolve('')]).then(function (x) {
      var rev = Date.parse(pick(c, 'revisionDate')) || Date.now(), fid = pick(c, 'folderId');
      return { id: pick(c, 'id'), type: type === 1 ? 'login' : 'note', name: x[0] || '(no name)', notes: x[1], user: x[2], pw: x[3], totp: x[4], url: x[5], folderId: fid || null, folder: sess.folders[fid] || 'No folder', fav: !!pick(c, 'favorite'), age: Math.max(0, Math.round((Date.now() - rev) / 86400000)) };
    });
  });
}
function openVault(sync, userKey, token) {
  var skipped = { org: 0, other: 0 }, ciphers = sync.ciphers || sync.Ciphers || [], fl = sync.folders || sync.Folders || [];
  sess = { userKey: userKey, token: token, folders: {}, raw: {} };
  return Promise.all(fl.map(function (f) { return decryptStr(pick(f, 'name'), userKey).then(function (n) { sess.folders[pick(f, 'id')] = n; }).catch(function () {}); })).then(function () {
    return Promise.all(ciphers.map(function (c) {
      if (pick(c, 'deletedDate')) return null;
      if (pick(c, 'organizationId')) { skipped.org++; return null; }
      var type = +pick(c, 'type'); if (type !== 1 && type !== 2) { skipped.other++; return null; }
      return decryptCipher(c).then(function (it) { sess.raw[it.id] = c; return it; }).catch(function () { skipped.other++; return null; });
    }));
  }).then(function (items) { return { items: items.filter(Boolean), skipped: skipped, folders: Object.keys(sess.folders).map(function (id) { return { id: id, name: sess.folders[id] }; }) }; });
}
function lock() { sess = null; }
/* create (it.id empty) or update one item; it = {type,name,user,pw,totp,url,notes,folderId,fav} */
function save(it) {
  if (!sess) return Promise.reject(fail('Vault is locked', 'locked'));
  var raw = it.id ? sess.raw[it.id] : null, ck = raw ? cipherKey(raw) : Promise.resolve(sess.userKey);
  return ck.then(function (k) {
    var isLogin = it.type !== 'note';
    return Promise.all([encStr(it.name, k), encStr(it.notes, k), isLogin ? encStr(it.user, k) : null, isLogin ? encStr(it.pw, k) : null, isLogin ? encStr(it.totp, k) : null, isLogin && it.url ? encStr(it.url, k) : null]).then(function (x) {
      var body = {};
      if (raw) ['fields', 'passwordHistory', 'attachments', 'key', 'reprompt', 'card', 'identity'].forEach(function (f) { var v = pick(raw, f); if (v != null) body[f] = v; });
      body.type = isLogin ? 1 : 2; body.folderId = it.folderId || null; body.organizationId = null; body.favorite = !!it.fav; body.name = x[0]; body.notes = x[1];
      if (isLogin) { var old = raw ? (pick(raw, 'login') || {}) : {}; var oldUris = pick(old, 'uris') || [];
        body.login = { username: x[2], password: x[3], totp: x[4], uris: x[5] ? [{ uri: x[5], match: oldUris[0] ? pick(oldUris[0], 'match') : null }] : [], passwordRevisionDate: (raw && it.pwChanged !== true) ? pick(old, 'passwordRevisionDate') || null : new Date().toISOString() }; }
      else body.secureNote = { type: 0 };
      if (raw) body.lastKnownRevisionDate = pick(raw, 'revisionDate');
      var path = raw ? 'api/ciphers/' + it.id : 'api/ciphers';
      return relay(path, { method: raw ? 'PUT' : 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + sess.token }, body: JSON.stringify(body) });
    });
  }).then(function (r) {
    if (r.status === 401) throw fail('Your session with the Vault expired. Lock and unlock again.', 'expired');
    if (!r.ok) throw fail((r.body && (r.body.message || r.body.error || (r.body.ErrorModel && r.body.ErrorModel.Message))) || 'The Vault refused the change.', 'upstream');
    var c = r.body; return decryptCipher(c).then(function (dec) { sess.raw[dec.id] = c; return dec; });
  });
}
function remove(id) {
  if (!sess) return Promise.reject(fail('Vault is locked', 'locked'));
  return relay('api/ciphers/' + id + '/delete', { method: 'PUT', headers: { authorization: 'Bearer ' + sess.token } }).then(function (r) {
    if (r.status === 401) throw fail('Your session with the Vault expired. Lock and unlock again.', 'expired');
    if (!r.ok) throw fail('The Vault refused the delete.', 'upstream'); delete sess.raw[id]; return true;
  });
}
function generate(len, opts) {
  opts = opts || {}; len = len || 20; var sets = ['abcdefghijkmnopqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789'].concat(opts.symbols === false ? [] : ['!@#$%^&*-_+=?']), all = sets.join(''), out = [];
  var rnd = function (n) { var a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n; do { crypto.getRandomValues(a); } while (a[0] >= lim); return a[0] % n; };
  sets.forEach(function (st) { out.push(st[rnd(st.length)]); }); while (out.length < len) out.push(all[rnd(all.length)]);
  for (var i = out.length - 1; i > 0; i--) { var j = rnd(i + 1), t = out[i]; out[i] = out[j]; out[j] = t; } return out.join('');
}
window.AOSVault = { login: login, save: save, remove: remove, lock: lock, generate: generate, totp: totp, _b64d: b64d, _b64e: b64e, _decrypt: decryptStr, _stretch: stretch, _masterKey: masterKey };
})();
