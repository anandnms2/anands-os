/* A tiny stand-in for Paperless-ngx's REST API, for tests and previews. */
import http from 'node:http';
export const TOKEN = 'fake-token-123';
const tags = [{ id: 1, name: 'Insurance', color: '#f68712', is_inbox_tag: false, document_count: 3 }, { id: 2, name: 'Customs', color: '#3b82f6', is_inbox_tag: false, document_count: 1 }, { id: 3, name: 'Vehicles', color: '#10b981', is_inbox_tag: false, document_count: 2 }, { id: 4, name: 'Tax', color: '#a855f7', is_inbox_tag: false, document_count: 1 }, { id: 5, name: 'Inbox', color: '#eab308', is_inbox_tag: true, document_count: 2 }];
const cors = [{ id: 1, name: 'Jubilee Insurance', document_count: 2 }, { id: 2, name: 'COMESA', document_count: 1 }, { id: 3, name: 'TRA', document_count: 2 }];
const types = [{ id: 1, name: 'Certificate', document_count: 3 }, { id: 2, name: 'Invoice', document_count: 2 }, { id: 3, name: 'Letter', document_count: 1 }];
export const docs = [
  { id: 1, title: 'Motor insurance certificate, trailer T 482 DKF', created: '2026-08-12', added: '2026-08-13T08:00:00Z', correspondent: 1, document_type: 1, tags: [1, 3], original_file_name: 'cert-t482.pdf', page_count: 2, content: 'This insurance certificate confirms cover for the period 01 Sep 2026 to 31 Aug 2027. Policy holder: Usangu.' },
  { id: 2, title: 'Insurance certificate renewal notice', created: '2026-07-28', added: '2026-07-29T08:00:00Z', correspondent: 1, document_type: 3, tags: [1], original_file_name: 'renewal.pdf', page_count: 1, content: 'Renewal of your insurance certificate is due before 31 August.' },
  { id: 3, title: 'COMESA yellow card, Zambia corridor', created: '2026-05-03', added: '2026-05-04T08:00:00Z', correspondent: 2, document_type: 1, tags: [2], original_file_name: 'yellow-card.pdf', page_count: 1, content: 'A valid insurance certificate must be carried at all border crossings.' },
  { id: 4, title: 'Vehicle licence renewal receipt', created: '2026-01-19', added: '2026-01-20T08:00:00Z', correspondent: 3, document_type: 2, tags: [3, 4], original_file_name: 'licence.pdf', page_count: 1, content: 'Road licence renewed. Attach a copy of the insurance certificate.' },
  { id: 5, title: 'Scan 2026-10-14 0932', created: '2026-10-14', added: '2026-10-14T09:32:00Z', correspondent: null, document_type: null, tags: [5], original_file_name: 'scan.pdf', page_count: 3, content: 'Delivery note and packing list.' },
  { id: 6, title: 'Tax clearance certificate 2026', created: '2026-03-02', added: '2026-03-03T08:00:00Z', correspondent: 3, document_type: 1, tags: [4], original_file_name: 'tcc.pdf', page_count: 1, content: 'Tax clearance certificate valid until 31 December 2026.' }
];
export const uploads = [];
const PDF = Buffer.from('%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 100]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');
const THUMB = (t) => `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="270" viewBox="0 0 200 270"><rect width="200" height="270" fill="#fff"/><rect x="16" y="20" width="90" height="10" fill="#222"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="16" y="${50 + i * 18}" width="${168 - (i % 3) * 30}" height="5" fill="#c9c9d1"/>`).join('')}<text x="16" y="250" font-size="11" fill="#888" font-family="sans-serif">${t.replace(/[<&]/g, '')}</text></svg>`;
const PAGE = (d) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 560" width="100%" height="100%"><rect width="420" height="560" fill="#fff"/><text x="36" y="64" font-family="sans-serif" font-size="20" font-weight="700" fill="#222">${d.title.replace(/[<&]/g, '')}</text><text x="36" y="92" font-family="sans-serif" font-size="12" fill="#888">${d.created}</text>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `<rect x="36" y="${130 + i * 26}" width="${348 - (i % 4) * 40}" height="7" rx="3" fill="#d6d6dc"/>`).join('')}</svg>`;
export function start(port) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x'), p = u.pathname, j = (c, o) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
      if (req.headers.authorization !== 'Token ' + TOKEN) return j(401, { detail: 'Invalid token.' });
      const page = (list) => j(200, { count: list.length, next: null, previous: null, results: list });
      if (p === '/api/statistics/') return j(200, { documents_total: docs.length + uploads.length, documents_inbox: docs.filter((d) => d.tags.includes(5)).length });
      if (p === '/api/tags/') return page(tags); if (p === '/api/correspondents/') return page(cors); if (p === '/api/document_types/') return page(types);
      let m;
      if (p === '/api/documents/') {
        const q = (u.searchParams.get('query') || '').toLowerCase(), tg = (u.searchParams.get('tags__id__all') || '').split(',').filter(Boolean).map(Number), co = Number(u.searchParams.get('correspondent__id') || 0), ty = Number(u.searchParams.get('document_type__id') || 0), inbox = u.searchParams.get('is_in_inbox') === '1';
        let l = docs.filter((d) => (!q || (d.title + ' ' + d.content).toLowerCase().includes(q)) && tg.every((t) => d.tags.includes(t)) && (!co || d.correspondent === co) && (!ty || d.document_type === ty) && (!inbox || d.tags.includes(5)));
        l = l.map((d) => { const o = { ...d }; if (q) { const i = d.content.toLowerCase().indexOf(q); o.__search_hit__ = { score: 1, highlights: i >= 0 ? d.content.slice(0, i) + '<span class="match term0">' + d.content.slice(i, i + q.length) + '</span>' + d.content.slice(i + q.length) : d.content }; } return o; });
        const ord = u.searchParams.get('ordering'); if (!q) l.sort((a, b) => ord === 'created' ? a.created.localeCompare(b.created) : ord === 'title' ? a.title.localeCompare(b.title) : ord === '-added' ? b.added.localeCompare(a.added) : b.created.localeCompare(a.created));
        return page(l);
      }
      if (p === '/api/documents/post_document/' && req.method === 'POST') { const ch = []; req.on('data', (c) => ch.push(c)); req.on('end', () => { uploads.push({ size: Buffer.concat(ch).length, type: req.headers['content-type'] }); res.writeHead(200, { 'content-type': 'application/json' }); res.end('"task-id"'); }); return; }
      if ((m = p.match(/^\/api\/documents\/(\d+)\/$/))) { const d = docs.find((x) => x.id === +m[1]); if (!d) return j(404, { detail: 'Not found.' }); if (req.method === 'PATCH') { const ch = []; req.on('data', (c) => ch.push(c)); req.on('end', () => { Object.assign(d, JSON.parse(Buffer.concat(ch).toString())); j(200, d); }); return; } return j(200, d); }
      if ((m = p.match(/^\/api\/documents\/(\d+)\/(thumb|preview|download)\/$/))) { const d = docs.find((x) => x.id === +m[1]); if (!d) return j(404, {}); if (m[2] === 'thumb') { res.writeHead(200, { 'content-type': 'image/svg+xml' }); return res.end(THUMB(d.title)); } if (process.env.FAKE_SVG_PREVIEW && m[2] === 'preview') { res.writeHead(200, { 'content-type': 'image/svg+xml' }); return res.end(PAGE(d)); } res.writeHead(200, { 'content-type': 'application/pdf', 'content-length': PDF.length }); return res.end(PDF); }
      j(404, { detail: 'Not found.' });
    });
    srv.listen(port, '127.0.0.1', () => resolve(srv));
  });
}
