import http from 'node:http';
const listen = (h) => new Promise((r) => { const s = http.createServer(h); s.listen(0, '127.0.0.1', () => r(s)); });
const send = (res, c, o, ct = 'application/json') => { res.writeHead(c, { 'content-type': ct }); res.end(typeof o === 'string' || Buffer.isBuffer(o) ? o : JSON.stringify(o)); };
export const tree = new Map([["/", { dir: true }]]);
export const davLog = [];
const rawBody = (req) => new Promise((r) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });
const xmlEsc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const entry = (p, e) => `<D:response><D:href>/dav${p === '/' ? '/' : p.split('/').map(encodeURIComponent).join('/') + (e.dir ? '/' : '')}</D:href><D:propstat><D:prop><D:resourcetype>${e.dir ? '<D:collection/>' : ''}</D:resourcetype>${e.dir ? '' : `<D:getcontentlength>${e.data.length}</D:getcontentlength>`}<D:getlastmodified>${new Date(e.m || Date.UTC(2026, 9, 14, 10)).toUTCString()}</D:getlastmodified></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>`;
export const start = () => listen(handler); const handler = (async (req, res) => {
  davLog.push(req.method + ' ' + req.url);
  if (req.headers.authorization !== 'Basic ' + Buffer.from('anand@example.com:dav-secret').toString('base64')) return send(res, 401, 'no', 'text/plain');
  const body = await rawBody(req);
  const u = new URL(req.url, 'http://x'); const p = '/' + decodeURIComponent(u.pathname).replace(/^\/dav\/?/, '').replace(/\/+$/, ''); const key = p === '/' ? '/' : p.replace(/\/$/, '');
  const e = tree.get(key);
  if (req.method === 'PROPFIND') {
    if (!e) return send(res, 404, '', 'text/plain');
    const items = [[key, e]]; if (req.headers.depth !== '0' && e.dir) for (const [k, v] of tree) if (k !== '/' && k.slice(0, k.lastIndexOf('/')) === (key === '/' ? '' : key)) items.push([k, v]);
    return send(res, 207, `<?xml version="1.0"?><D:multistatus xmlns:D="DAV:">${items.map(([k, v]) => entry(k, v)).join('')}</D:multistatus>`, 'application/xml');
  }
  if (req.method === 'GET') { if (!e || e.dir) return send(res, 404, '', 'text/plain'); const m = /bytes=(\d+)-(\d*)/.exec(req.headers.range || ''); if (m) { const part = e.data.subarray(Number(m[1]), m[2] ? Number(m[2]) + 1 : undefined); res.writeHead(206, { 'content-range': `bytes ${m[1]}-${Number(m[1]) + part.length - 1}/${e.data.length}`, 'content-length': part.length }); return res.end(part); } return send(res, 200, e.data, 'application/octet-stream'); }
  if (req.method === 'PUT') { const par = key.slice(0, key.lastIndexOf('/')) || '/'; if (!tree.get(par)?.dir) return send(res, 409, '', 'text/plain'); tree.set(key, { data: body }); return send(res, e ? 204 : 201, '', 'text/plain'); }
  if (req.method === 'MKCOL') { if (e) return send(res, 405, '', 'text/plain'); const par = key.slice(0, key.lastIndexOf('/')) || '/'; if (!tree.get(par)?.dir) return send(res, 409, '', 'text/plain'); tree.set(key, { dir: true }); return send(res, 201, '', 'text/plain'); }
  if (req.method === 'DELETE') { if (!e) return send(res, 404, '', 'text/plain'); for (const k of [...tree.keys()]) if (k === key || k.startsWith(key + '/')) tree.delete(k); return send(res, 204, '', 'text/plain'); }
  if (req.method === 'MOVE' || req.method === 'COPY') { if (!e) return send(res, 404, '', 'text/plain'); const dest = '/' + decodeURIComponent(new URL(req.headers.destination).pathname).replace(/^\/dav\/?/, '').replace(/\/+$/, ''); tree.set(dest, e); if (req.method === 'MOVE') tree.delete(key); return send(res, 201, '', 'text/plain'); }
  send(res, 405, '', 'text/plain');
});
