/* A tiny stand-in for Linkwarden's REST API, for tests and previews. */
import http from 'node:http';
export const TOKEN = 'fake-links-token';
const cols = [{ id: 1, name: 'Dev tools', color: '#f68712', _count: { links: 2 } }, { id: 2, name: 'Reading', color: '#3b82f6', _count: { links: 1 } }];
const tags = [{ id: 1, name: 'docker', _count: { links: 1 } }, { id: 2, name: 'api', _count: { links: 1 } }];
export const links = [
  { id: 1, name: 'Coolify documentation', url: 'https://coolify.io/docs', description: 'Self-hosting platform docs', collectionId: 1, collection: cols[0], tags: [tags[0]], createdAt: '2026-10-01T08:00:00Z', pinnedBy: [{ id: 1 }] },
  { id: 2, name: 'Linkwarden API reference', url: 'https://docs.linkwarden.app/api', description: '', collectionId: 1, collection: cols[0], tags: [tags[1]], createdAt: '2026-10-05T08:00:00Z', pinnedBy: [] },
  { id: 3, name: 'Sourdough starter guide', url: 'https://example.com/sourdough', description: 'Bread', collectionId: 2, collection: cols[1], tags: [], createdAt: '2026-10-09T08:00:00Z', pinnedBy: [] }
];
export function start(port) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x'), p = u.pathname, j = (c, o) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(JSON.stringify({ response: o })); };
      if (req.headers.authorization !== 'Bearer ' + TOKEN) return j(401, 'Unauthorized');
      if (p === '/api/v1/collections') return j(200, cols);
      if (p === '/api/v1/tags') return j(200, tags);
      let m;
      if (p === '/api/v1/links' && req.method === 'GET') {
        const q = (u.searchParams.get('searchQueryString') || '').toLowerCase(), c = +u.searchParams.get('collectionId') || 0, t = +u.searchParams.get('tagId') || 0, pin = u.searchParams.get('pinnedOnly') === 'true';
        return j(200, links.filter((l) => (!q || (l.name + l.url + l.description).toLowerCase().includes(q)) && (!c || l.collectionId === c) && (!t || l.tags.some((x) => x.id === t)) && (!pin || l.pinnedBy.length)));
      }
      if (p === '/api/v1/links' && req.method === 'POST') { const ch = []; req.on('data', (d) => ch.push(d)); req.on('end', () => { const b = JSON.parse(Buffer.concat(ch).toString()); const l = { id: links.length + 10, name: b.name || b.url, url: b.url, description: b.description || '', collectionId: b.collection?.id || 1, collection: cols[0], tags: (b.tags || []).map((x, i) => ({ id: 50 + i, name: x.name })), createdAt: '2026-10-18T08:00:00Z', pinnedBy: [] }; links.push(l); j(200, l); }); return; }
      if ((m = p.match(/^\/api\/v1\/links\/(\d+)$/)) && req.method === 'DELETE') { const i = links.findIndex((l) => l.id === +m[1]); if (i < 0) return j(404, 'Not found'); links.splice(i, 1); return j(200, {}); }
      j(404, 'Not found');
    });
    srv.listen(port, '127.0.0.1', () => resolve(srv));
  });
}
