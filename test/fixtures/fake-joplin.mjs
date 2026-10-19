/* A tiny stand-in for Joplin Server's API (sessions, items), for tests and previews. */
import http from 'node:http';
export const EMAIL = 'me@example.com', PASSWORD = 'pw-notes', SID = 'sess-123';
const t0 = '2026-10-10T08:00:00.000Z';
const id = (n) => n.toString(16).padStart(32, '0');
const propsNote = (i, parent, extra = {}) => ['id: ' + id(i), 'parent_id: ' + id(parent), 'created_time: ' + t0, 'updated_time: ' + (extra.upd || t0), 'is_conflict: 0', 'is_todo: ' + (extra.todo ? 1 : 0), 'todo_completed: ' + (extra.done ? 1790000000000 : 0), 'user_created_time: ' + t0, 'user_updated_time: ' + (extra.upd || t0), 'encryption_applied: ' + (extra.enc ? 1 : 0), 'markup_language: 1', 'deleted_time: ' + (extra.del || 0), 'type_: 1'].join('\n');
const folder = (i, title, parent = 0) => `${title}\n\nid: ${id(i)}\nparent_id: ${parent ? id(parent) : ''}\ncreated_time: ${t0}\nupdated_time: ${t0}\nuser_created_time: ${t0}\nuser_updated_time: ${t0}\nencryption_applied: 0\ndeleted_time: 0\ntype_: 2`;
const tag = (i, title) => `${title}\n\nid: ${id(i)}\ncreated_time: ${t0}\nupdated_time: ${t0}\nuser_created_time: ${t0}\nuser_updated_time: ${t0}\nencryption_applied: 0\ntype_: 5`;
const link = (i, note, tg) => `id: ${id(i)}\nnote_id: ${id(note)}\ntag_id: ${id(tg)}\ncreated_time: ${t0}\nupdated_time: ${t0}\nencryption_applied: 0\ntype_: 6`;
export const files = new Map(), updated = new Map(); let clock = 1790000000000;
const put = (name, text) => { files.set(name, text); updated.set(name, ++clock); };
export const blobs = new Map();
put(id(1) + '.md', folder(1, 'Work')); put(id(2) + '.md', folder(2, 'Home')); put(id(3) + '.md', folder(3, 'Trips', 1));
put(id(10) + '.md', `Trip checklist\n\n- [ ] passport\n- [x] tickets\n\n${propsNote(10, 1, { todo: 1 })}`);
put(id(11) + '.md', `Meeting notes\n\n# Agenda\n\nDiscuss **fleet** budget\nLine two\n\n${propsNote(11, 1)}`);
put(id(12) + '.md', `Recipe: dosa\n\nRice and lentils, soak overnight.\n\n${propsNote(12, 2)}`);
put(id(13) + '.md', `Old note\n\nGone\n\n${propsNote(13, 2, { del: 1790000000000 })}`);
put(id(14) + '.md', `Secret\n\nJED01000...\n\n${propsNote(14, 2, { enc: 1 })}`);
put(id(20) + '.md', tag(20, 'ops')); put(id(21) + '.md', link(21, 11, 20));
export const log = [];
export function start(port) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname), j = (c, o) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
      if (p === '/api/sessions' && req.method === 'POST') { const ch = []; req.on('data', (d) => ch.push(d)); req.on('end', () => { const b = JSON.parse(Buffer.concat(ch).toString() || '{}'); if (b.email === EMAIL && b.password === PASSWORD) return j(200, { id: SID, user_id: 'u1' }); j(403, { error: 'Invalid email or password' }); }); return; }
      if (req.headers['x-api-auth'] !== SID) return j(403, { error: 'Invalid session' });
      if (p === '/api/items/root:/:/children') { const names = [...files.keys()]; return j(200, { items: names.map((n) => ({ id: 'row-' + n, name: n, updated_time: updated.get(n) })), has_more: false }); }
      const m = p.match(/^\/api\/items\/root:\/([^:]+):(\/content)?$/);
      if (m) {
        const name = m[1];
        if (req.method === 'GET' && m[2] && blobs.has(name)) { res.writeHead(200, { 'content-type': 'application/octet-stream' }); return res.end(blobs.get(name)); }
        if (req.method === 'GET' && m[2]) { if (!files.has(name)) return j(404, {}); res.writeHead(200, { 'content-type': 'application/octet-stream' }); return res.end(files.get(name)); }
        if (req.method === 'GET') { if (!files.has(name)) return j(404, {}); return j(200, { name, updated_time: updated.get(name) }); }
        if (req.method === 'PUT' && m[2]) { const ch = []; req.on('data', (d) => ch.push(d)); req.on('end', () => { const body = Buffer.concat(ch); const a = body.indexOf('\r\n\r\n'), b = body.lastIndexOf('\r\n--'); if (name.startsWith('.resource/')) blobs.set(name, body.subarray(a + 4, b)); else put(name, body.subarray(a + 4, b).toString()); log.push('PUT ' + name); j(200, { name, updated_time: updated.get(name) }); }); return; }
        if (req.method === 'DELETE') { files.delete(name); updated.delete(name); log.push('DELETE ' + name); return j(200, {}); }
      }
      j(404, { error: 'Not found' });
    });
    srv.listen(port, '127.0.0.1', () => resolve(srv));
  });
}
