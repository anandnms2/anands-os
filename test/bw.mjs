/* Builds a real Bitwarden-format vault (EncString type 2) for tests, so the browser code is checked against actual crypto. */
import crypto from 'node:crypto';
const b64 = (b) => Buffer.from(b).toString('base64');
const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
export function encString(buf, k) {
  const iv = crypto.randomBytes(16), c = crypto.createCipheriv('aes-256-cbc', k.enc, iv), ct = Buffer.concat([c.update(buf), c.final()]);
  return '2.' + b64(iv) + '|' + b64(ct) + '|' + b64(hmac(k.mac, Buffer.concat([iv, ct])));
}
const S = (s, k) => encString(Buffer.from(s, 'utf8'), k);
export function makeVault(email, pw, iter, items, mkOverride) {
  const mk = mkOverride || crypto.pbkdf2Sync(pw, email, iter, 32, 'sha256');
  const hash = b64(crypto.pbkdf2Sync(mk, pw, 1, 32, 'sha256'));
  const sk = { enc: hmac(mk, Buffer.concat([Buffer.from('enc'), Buffer.from([1])])), mac: hmac(mk, Buffer.concat([Buffer.from('mac'), Buffer.from([1])])) };
  const ub = crypto.randomBytes(64), uk = { enc: ub.subarray(0, 32), mac: ub.subarray(32) };
  const Key = encString(ub, sk);
  const ciphers = items.map((it, i) => {
    let k = uk, key;
    if (it.itemKey) { const ib = crypto.randomBytes(64); k = { enc: ib.subarray(0, 32), mac: ib.subarray(32) }; key = encString(ib, uk); }
    const o = { id: 'c' + i, type: it.type || 1, name: S(it.name, k), notes: it.notes ? S(it.notes, k) : null, favorite: !!it.fav, folderId: it.folder ? 'f-' + it.folder : null, revisionDate: new Date(Date.now() - (it.age || 10) * 86400000).toISOString(), deletedDate: it.deleted ? new Date().toISOString() : null, organizationId: it.org ? 'org1' : null, key };
    if (!it.type || it.type === 1) o.login = { username: S(it.user || '', k), password: S(it.pw || '', k), totp: it.totp ? S(it.totp, k) : null, uris: it.url ? [{ uri: S(it.url, k) }] : [] };
    return o;
  });
  const folders = [...new Set(items.filter((i) => i.folder).map((i) => i.folder))].map((f) => ({ id: 'f-' + f, name: S(f, uk) }));
  return { hash, Key, sync: { ciphers, folders } };
}
