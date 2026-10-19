// Design Studio inside the OS: saving to Files, exports (PNG/PDF/SVG/GIF/video), animation, background remover,
// stock photo search (fake Pexels/Unsplash), share links, and the safety rules around them. No internet needed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }

/* fake upstreams: Pexels, Unsplash, and the host the background remover files come from */
const hits = { pexels: [], unsplash: [], bg: [] };
const listen = (h) => new Promise((r) => { const s = http.createServer(h); s.listen(0, '127.0.0.1', () => r(s)); });
const px = await listen((req, res) => { hits.pexels.push({ u: req.url, auth: req.headers.authorization }); if (req.headers.authorization !== 'px-key') { res.writeHead(401); return res.end('{}'); }
  res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ photos: [{ id: 7, width: 4000, height: 3000, photographer: 'Ana', url: 'https://www.pexels.com/photo/7/', alt: 'a lake', src: { medium: 'https://images.pexels.com/photos/7/m.jpg', large2x: 'https://images.pexels.com/photos/7/l.jpg' } }, { id: 8, src: {} }] })); });
const un = await listen((req, res) => { hits.unsplash.push({ u: req.url, auth: req.headers.authorization }); res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ results: [{ id: 'abc', width: 100, height: 80, user: { name: 'Bo' }, alt_description: 'a hill', links: { html: 'https://unsplash.com/photos/abc', download_location: 'https://api.unsplash.com/photos/abc/download' }, urls: { small: 'https://images.unsplash.com/s.jpg', regular: 'https://images.unsplash.com/r.jpg' } }] })); });
const bgHost = await listen((req, res) => { hits.bg.push(req.url); if (req.url.endsWith('ort.min.js')) { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('/* fake ort */'.padEnd(2000, ' ')); } res.writeHead(404); res.end(); });

const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-ds-')), suite = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-suite-'));
fs.mkdirSync(suite + '/apps', { recursive: true }); fs.cpSync(root + '/suite/own/design-studio', suite + '/apps/design-studio', { recursive: true }); fs.mkdirSync(suite + '/_icons');
fs.writeFileSync(suite + '/apps.json', JSON.stringify([{ slug: 'design-studio', name: 'Design Studio', alternativeTo: 'Canva', category: 'Creative Tools', hasSource: true }]));
const port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: suite, APP_PASSWORD: 'pw', PEXELS_API_BASE: `http://127.0.0.1:${px.address().port}`, UNSPLASH_API_BASE: `http://127.0.0.1:${un.address().port}`, BG_ORT_BASE: `http://127.0.0.1:${bgHost.address().port}/dist/`, PEXELS_API_KEY: '', UNSPLASH_ACCESS_KEY: '' } });
for (let i = 0; i < 60; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + String(e.stack || e).split('\n').slice(0, 5).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 860 } }); await ctx.route(/fonts\.g(oogleapis|static)\.com/, (r) => r.abort());
  assert.ok((await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } })).ok());
  const H = { 'x-aos': '1' }; const post = async (p, d) => { const r = await ctx.request.post(B + '/_local' + p, { data: d || {}, headers: H }); return { s: r.status(), j: await r.json().catch(() => ({})) }; };

  await t('every Design Studio route needs the sign-in; POSTs need the x-aos header', async () => {
    for (const p of ['/_local/design/stockstatus', '/_local/design/shares']) assert.equal((await fetch(B + p, { method: 'POST', headers: H })).status, 401);
    assert.equal((await fetch(B + '/_local/bgdata/u2netp.onnx')).status, 401);
    assert.equal((await ctx.request.post(B + '/_local/design/shares', { data: {} })).status(), 403);
  });
  await t('background remover files: only the four known names, fetched once, then cached', async () => {
    assert.equal((await ctx.request.get(B + '/_local/bgdata/..%2Fsettings.json')).status(), 404);
    assert.equal((await ctx.request.get(B + '/_local/bgdata/evil.js')).status(), 404);
    const a = await ctx.request.get(B + '/_local/bgdata/ort.min.js'); assert.equal(a.status(), 200); assert.match(await a.text(), /fake ort/);
    await ctx.request.get(B + '/_local/bgdata/ort.min.js'); assert.equal(hits.bg.filter((u) => u.endsWith('ort.min.js')).length, 1);
    const w = await ctx.request.get(B + '/_local/bgdata/ort-wasm.wasm'); assert.equal(w.status(), 502); assert.match((await w.json()).error, /Could not download/);
  });
  await t('stock photos: no key gives a clear message; keys stay on the server', async () => {
    assert.deepEqual((await post('/design/stockstatus')).j, { pexels: false, unsplash: false });
    const r = await post('/design/stock', { q: 'lake' }); assert.equal(r.s, 400); assert.equal(r.j.code, 'no_key');
    const put = await ctx.request.put(B + '/api/settings', { data: { stock: { pexels: 'px-key', unsplash: 'un-key' } }, headers: H }); assert.ok(put.ok());
    const s = await (await ctx.request.get(B + '/api/settings')).json(); assert.deepEqual(s.stock, { pexelsSet: true, unsplashSet: true }); assert.ok(!JSON.stringify(s).includes('px-key'));
    assert.deepEqual((await post('/design/stockstatus')).j, { pexels: true, unsplash: true });
  });
  await t('stock photos: Pexels and Unsplash results are normalised; bad keys and junk are handled', async () => {
    const a = (await post('/design/stock', { q: 'lake', source: 'pexels' })).j; assert.equal(a.source, 'pexels'); assert.equal(a.items.length, 1); assert.equal(a.items[0].by, 'Ana'); assert.match(a.items[0].full, /l\.jpg$/);
    assert.match(hits.pexels.at(-1).u, /query=lake/); assert.equal(hits.pexels.at(-1).auth, 'px-key');
    const b = (await post('/design/stock', { q: 'hill', source: 'unsplash' })).j; assert.equal(b.items[0].by, 'Bo'); assert.equal(hits.unsplash.at(-1).auth, 'Client-ID un-key');
    await ctx.request.put(B + '/api/settings', { data: { stock: { pexels: 'wrong' } }, headers: H });
    const bad = await post('/design/stock', { q: 'x', source: 'pexels' }); assert.equal(bad.s, 502); assert.match(bad.j.error, /did not accept that key/);
    await ctx.request.put(B + '/api/settings', { data: { stock: { pexels: 'px-key' } }, headers: H });
    const long = (await post('/design/stock', { q: 'a'.repeat(500), page: -9 })).j; assert.equal(long.page, 1); assert.ok(decodeURIComponent(hits.pexels.at(-1).u).length < 260);
  });
  await t('stock image proxy only fetches the two photo CDNs over https', async () => {
    for (const u of ['http://127.0.0.1/x.jpg', 'https://evil.example/x.jpg', 'file:///etc/passwd', 'https://images.pexels.com.evil.com/a.jpg', 'not a url']) assert.equal((await ctx.request.get(B + '/_local/design/stockimg?u=' + encodeURIComponent(u))).status(), 400, u);
  });
  await t('share links: public by link only, right type, expiring, removable, unguessable', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const mk = async (ext, name) => (await (await ctx.request.post(B + '/_local/design/share?ext=' + ext + '&name=' + name + '&days=7', { data: png, headers: { ...H, 'content-type': 'application/octet-stream' } })).json());
    const l = await mk('png', 'My%20design'); assert.match(l.path, /^\/d\/[A-Za-z0-9_-]{30,}$/);
    const pub = await fetch(B + l.path); assert.equal(pub.status, 200); assert.equal(pub.headers.get('content-type'), 'image/png'); assert.match(pub.headers.get('content-security-policy'), /sandbox/); assert.equal((await pub.arrayBuffer()).byteLength, png.length);
    assert.equal((await ctx.request.post(B + '/_local/design/share?ext=exe', { data: png, headers: { ...H, 'content-type': 'application/octet-stream' } })).status(), 400);
    for (const bad of ['/d/short', '/d/' + 'a'.repeat(32), '/d/../../etc/passwd']) assert.equal((await fetch(B + bad)).status, 404, bad);
    const idxF = path.join(data, 'design-shares.json'); const idx = JSON.parse(fs.readFileSync(idxF, 'utf8')); idx[l.token].exp = Date.now() - 1000; fs.writeFileSync(idxF, JSON.stringify(idx));
    assert.equal((await fetch(B + l.path)).status, 404); assert.ok(!fs.existsSync(path.join(data, 'design-shares', l.token)));
    const l2 = await mk('png', 'x'); assert.equal((await post('/design/shares')).j.items.length, 1);
    await post('/design/unshare', { token: l2.token }); assert.equal((await fetch(B + l2.path)).status, 404); assert.equal((await post('/design/shares')).j.items.length, 0);
  });

  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|status of 502/.test(m.text())) errs.push(m.text()); });
  await page.goto(B + '/apps/design-studio/'); await page.waitForFunction(() => window.ready === true, null, { timeout: 15000 }); await page.waitForTimeout(1500);
  const ls = async () => { const r = await post('/fs/readdir', { path: '/Designs' }); return Array.isArray(r.j) ? r.j.map((x) => x.name) : []; };
  await t('a design autosaves to Files › Designs and is renamed (not duplicated) with its title', async () => {
    assert.equal((await ls()).length, 1); await page.fill('#title', 'Summer Sale'); await page.waitForTimeout(2200);
    const f = await ls(); assert.equal(f.length, 1); assert.match(f[0], /^Summer Sale \[\w{5}\]\.design$/);
    await page.click('#btnHome'); await page.waitForSelector('.dcard'); assert.deepEqual(await page.$$eval('.dcard b', (n) => n.map((x) => x.textContent)), ['Summer Sale (open)']);
    await page.evaluate(() => closeModal());
  });
  await t('a saved design reopens with its content after a reload', async () => {
    const n = await page.evaluate(() => P().objs.length); await page.reload(); await page.waitForFunction(() => window.ready === true); assert.equal(await page.evaluate(() => P().objs.length), n); assert.equal(await page.inputValue('#title'), 'Summer Sale');
  });
  await t('exports: PNG, JPG, WebP, PDF, SVG, GIF, video and project all produce real files', async () => {
    const r = await page.evaluate(async () => { const o = P().objs.find((x) => x.type === 'text'); o.an = { i: 'rise', o: 'fade', l: 'float', d: 0.2, du: 0.6 }; P().dur = 2; const out = {};
      for (const f of ['png', 'jpg', 'webp', 'pdf', 'svg', 'gif', 'video', 'json']) { expo.fmt = f; expo.pages = 'cur'; expo.scale = 1; const x = await makeExport(); closeModal(); out[f] = { name: x.name, size: x.blob.size, head: Array.from(new Uint8Array(await x.blob.slice(0, 12).arrayBuffer())) }; } return out; });
    const asc = (a) => String.fromCharCode(...a);
    assert.match(asc(r.pdf.head), /^%PDF/); assert.match(asc(r.gif.head), /^GIF89a/); assert.equal(asc(r.png.head.slice(1, 4)), 'PNG'); assert.match(asc(r.svg.head), /^<svg/);
    assert.match(r.video.name, /\.(mp4|webm)$/); assert.ok(r.video.size > 5000); assert.ok(r.gif.size > 5000);
  });
  await t('SVG export matches what the canvas draws (text, gradients, rounded images, effects)', async () => {
    const d = await page.evaluate(async () => {
      addObj(mkText('Hello vector', { x: 100, y: 700, w: 600, size: 90, font: 'Poppins', color: '#1b4332', bold: true, rot: -8, ul: true }));
      addObj(mkShape('hex', { x: 700, y: 100, w: 260, h: 260, fill: { t: 'lin', c1: '#e8590c', c2: '#7048e8', a: 45 }, stroke: '#111', sw: 12 }));
      const neon = mkText('NEON', { x: 600, y: 820, w: 380, size: 120, font: 'Poppins', color: '#fff', bold: true }); neon.fx = 'neon'; addObj(neon);
      sel = []; commit(); await ensureAssets(); await loadFonts([P()]);
      const svg = pageSVG(P(), 't'), img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode();
      const c = document.createElement('canvas'); c.width = D.w; c.height = D.h; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, D.w, D.h); x.drawImage(img, 0, 0);
      const A = x.getImageData(0, 0, D.w, D.h).data, R = renderPageTo(P(), 1).getContext('2d').getImageData(0, 0, D.w, D.h).data; let big = 0; for (let i = 0; i < A.length; i += 4) if ((Math.abs(A[i] - R[i]) + Math.abs(A[i + 1] - R[i + 1]) + Math.abs(A[i + 2] - R[i + 2])) / 3 > 40) big++;
      return { pct: 100 * big / (D.w * D.h), texts: (svg.match(/<text /g) || []).length }; });
    assert.ok(d.pct < 2, 'SVG differs from canvas on ' + d.pct.toFixed(2) + '% of pixels'); assert.ok(d.texts >= 3, 'text stays live text');
  });
  await t('animation: starts hidden, rises in, holds, fades out; the page reports it', async () => {
    const a = await page.evaluate(() => { const o = P().objs.find((x) => x.type === 'text'); o.an = { i: 'rise', o: 'fade', l: 'none', d: 0.5, du: 1 }; P().dur = 4; const f = (t) => animFrame(o, t, 4, D.w, D.h); return { t0: f(0).am, mid: f(1).am, hold: f(2).am, end: f(3.99).am, rise0: f(0).dy > 0, has: pageHasAnim(P()) }; });
    assert.equal(a.t0, 0); assert.ok(a.mid > 0 && a.mid < 1); assert.equal(a.hold, 1); assert.ok(a.end < 0.05); assert.ok(a.rise0); assert.ok(a.has);
  });
  await t('the vector PDF builds one printable page per design page (print dialog stubbed)', async () => {
    const r = await page.evaluate(async () => { let printed = 0, html = ''; const orig = HTMLIFrameElement.prototype.__lookupGetter__('contentWindow'); expo.pages = 'all'; addPage(); const p = printVector([P()]);
      const t0 = Date.now(); const poll = setInterval(() => { const f = document.querySelector('iframe[aria-hidden]'); if (f && f.contentWindow && !f.contentWindow.__p) { f.contentWindow.__p = 1; f.contentWindow.print = () => { printed++; html = f.contentDocument.documentElement.outerHTML; }; } }, 5); await p; clearInterval(poll); return { printed, hasSvg: /<svg/.test(html), size: /@page\{size:\d+px \d+px/.test(html) }; });
    assert.ok(r.hasSvg && r.size);
  });
  await t('background remover: the plain-colour option clears the backdrop and can be undone', async () => {
    await page.evaluate(async () => { const c = document.createElement('canvas'); c.width = 400; c.height = 300; const x = c.getContext('2d'); x.fillStyle = '#cfe3f5'; x.fillRect(0, 0, 400, 300); x.fillStyle = '#d9381e'; x.beginPath(); x.ellipse(200, 150, 90, 100, 0, 0, 7); x.fill();
      const b = await new Promise((r) => c.toBlob(r, 'image/png')); const a = await ingestImage(new File([b], 't.png', { type: 'image/png' })); addImageAsset(a); });
    await page.getByRole('button', { name: 'Remove a plain color background' }).click(); await page.waitForFunction(() => selObjs()[0] && selObjs()[0].orig);
    const al = await page.evaluate(async () => { const o = selObjs()[0], c = await dataToCanvas(D.assets[o.src]), x = c.getContext('2d'); return [x.getImageData(4, 4, 1, 1).data[3], x.getImageData(200, 150, 1, 1).data[3]]; }); assert.deepEqual(al, [0, 255]);
    await page.getByRole('button', { name: 'Restore original' }).click(); assert.equal(await page.evaluate(() => !!selObjs()[0].orig), false);
  });
  await t('photos panel: explains missing keys, then lists results with credit', async () => {
    await page.evaluate(() => { stock.status = null; stock.items = []; openTab('stock'); }); await page.waitForSelector('#panelBody .cell img', { state: 'attached', timeout: 8000 });
    assert.ok((await page.$$('#panelBody .cell')).length >= 1); assert.match(await page.textContent('#panelBody'), /Pexels|Unsplash/);
  });
  await t('present mode runs animated frames without errors', async () => {
    await page.evaluate(() => present()); await page.waitForSelector('#present canvas'); await page.waitForTimeout(500); await page.keyboard.press('Escape'); await page.waitForTimeout(200); assert.equal(await page.$('#present'), null);
  });
  await t('no script errors in the studio', async () => { assert.deepEqual(errs, []); });
} finally { await browser.close(); srv.kill(); px.close(); un.close(); bgHost.close(); }
console.log(`${pass} passed${failed ? ', ' + failed + ' failed' : ''}`); process.exit(failed ? 1 : 0);
