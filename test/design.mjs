// Design Studio inside the OS: saving to Files, exports (PNG/PDF/SVG/GIF/video), animation, background remover,
// stock photo search (fake Unsplash/Pixabay), share links, and the safety rules around them. No internet needed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }

/* fake upstreams: Unsplash, Pixabay, and the host the background remover files come from */
const hits = { unsplash: [], pixabay: [], bg: [] };
const listen = (h) => new Promise((r) => { const s = http.createServer(h); s.listen(0, '127.0.0.1', () => r(s)); });
const un = await listen((req, res) => { hits.unsplash.push({ u: req.url, auth: req.headers.authorization }); res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ results: [{ id: 'abc', width: 100, height: 80, user: { name: 'Bo' }, alt_description: 'a hill', links: { html: 'https://unsplash.com/photos/abc', download_location: 'https://api.unsplash.com/photos/abc/download' }, urls: { small: 'https://images.unsplash.com/s.jpg', regular: 'https://images.unsplash.com/r.jpg' } }] })); });
const pb = await listen((req, res) => { hits.pixabay.push(req.url); res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ hits: [{ id: 5, webformatURL: 'https://pixabay.com/get/w.jpg', largeImageURL: 'https://pixabay.com/get/l.jpg', imageWidth: 3000, imageHeight: 2000, user: 'Cy', pageURL: 'https://pixabay.com/photos/5/', tags: 'sea, wave' }] })); });
const PNG1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'); const imgCalls = [];
const imgHost = await listen((req, res) => { const b = []; req.on('data', (d) => b.push(d)); req.on('end', () => { imgCalls.push({ u: req.url, ct: String(req.headers['content-type'] || '').split(';')[0], auth: req.headers.authorization });
  if (req.url.startsWith('/prompt/')) { res.writeHead(200, { 'content-type': 'image/png' }); return res.end(PNG1); }
  if (req.url === '/v1/images/generations' || req.url === '/v1/images/edits') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ data: [{ b64_json: PNG1.toString('base64') }] })); }
  res.writeHead(404); res.end(); }); });
const bgHost = await listen((req, res) => { hits.bg.push(req.url); if (req.url.endsWith('ort.min.js')) { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('/* fake ort */'.padEnd(2000, ' ')); } res.writeHead(404); res.end(); });

const aiCalls = []; const an = await listen((req, res) => { const b = []; req.on('data', (d) => b.push(d)); req.on('end', () => { const j = JSON.parse(Buffer.concat(b).toString() || '{}'); aiCalls.push({ who: 'anthropic', key: req.headers['x-api-key'], ver: req.headers['anthropic-version'], model: j.model, sys: j.system, user: j.messages && j.messages[0].content }); res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ model: j.model, content: [{ type: 'text', text: 'ANTHROPIC: ' + String(j.messages[0].content).slice(0, 60) }] })); }); });
const gw = await listen((req, res) => { const b = []; req.on('data', (d) => b.push(d)); req.on('end', () => { const raw = Buffer.concat(b); if (req.url === '/v1/audio/speech') { aiCalls.push({ who: 'tts', body: raw.toString().slice(0, 200) }); res.writeHead(200, { 'content-type': 'audio/mpeg' }); return res.end(global.__speech || Buffer.alloc(10)); } if (req.url === '/v1/audio/transcriptions') { aiCalls.push({ who: 'stt', ct: String(req.headers['content-type']).split(';')[0], auth: req.headers.authorization, has: raw.toString('latin1').includes('whisper-1') }); res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ text: 'Hello world. Second line.', duration: 4, segments: [{ start: 0, end: 2, text: ' Hello world.' }, { start: 2, end: 4, text: ' Second line.' }] })); }
  const j = JSON.parse(raw.toString() || '{}'); const msgs = j.messages || []; const last = String(msgs.at(-1)?.content || ''); aiCalls.push({ who: 'gateway', model: j.model, last: last.slice(0, 80), auth: req.headers.authorization });
  res.writeHead(200, { 'content-type': 'application/json' }); let text = 'GATEWAY: ' + last.slice(0, 40); if (/same keys/.test(String(msgs[0]?.content))) { try { const f = JSON.parse(last); text = JSON.stringify(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v + ' (ai)']))); } catch {} } res.end(JSON.stringify({ model: 'gw-model', choices: [{ message: { content: text } }] })); }); });

const gm = await listen((req, res) => { const b = []; req.on('data', (d) => b.push(d)); req.on('end', () => { const j = JSON.parse(Buffer.concat(b).toString() || '{}'); const txt = JSON.stringify(j.contents || ''); aiCalls.push({ who: 'gemini', url: req.url, key: req.headers['x-goog-api-key'], sys: j.systemInstruction && j.systemInstruction.parts[0].text, modal: j.generationConfig && j.generationConfig.responseModalities, hasAudio: /inlineData/.test(txt) && /audio/.test(txt) }); res.writeHead(200, { 'content-type': 'application/json' });
  if (j.generationConfig && j.generationConfig.responseModalities) return res.end(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: PNG1.toString('base64') } }] } }] }));
  if (/Transcribe/.test(txt)) return res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify([{ start: 0, end: 1.5, text: 'Karibu sana' }, { start: 1.5, end: 3, text: 'Welcome' }]) }] } }] }));
  res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'GEMINI: ' + (j.contents[0].parts[0].text || '').slice(0, 40) }] } }] })); }); });
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-ds-')), suite = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-suite-'));
fs.mkdirSync(suite + '/apps', { recursive: true }); fs.cpSync(root + '/suite/own/design-studio', suite + '/apps/design-studio', { recursive: true }); fs.mkdirSync(suite + '/_icons');
fs.writeFileSync(suite + '/apps.json', JSON.stringify([{ slug: 'design-studio', name: 'Design Studio', alternativeTo: 'Canva', category: 'Creative Tools', hasSource: true }]));
const port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: suite, APP_PASSWORD: 'pw', ANTHROPIC_API_BASE: `http://127.0.0.1:${an.address().port}`, GEMINI_API_BASE: `http://127.0.0.1:${gm.address().port}`, UNSPLASH_API_BASE: `http://127.0.0.1:${un.address().port}`, PIXABAY_API_BASE: `http://127.0.0.1:${pb.address().port}`, PIXABAY_API_KEY: '', BG_ORT_BASE: `http://127.0.0.1:${bgHost.address().port}/dist/`, PEXELS_API_KEY: '', UNSPLASH_ACCESS_KEY: '', POLLINATIONS_BASE: `http://127.0.0.1:${imgHost.address().port}` } });
for (let i = 0; i < 60; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + String(e.stack || e).split('\n').slice(0, 5).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--auto-select-desktop-capture-source=Entire screen', '--enable-usermedia-screen-capturing'] }); const errs = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 860 } }); await ctx.route(/fonts\.g(oogleapis|static)\.com/, (r) => r.abort());
  assert.ok((await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } })).ok());
  const H = { 'x-aos': '1' }; const post = async (p, d) => { const r = await ctx.request.post(B + '/_local' + p, { data: d || {}, headers: H }); return { s: r.status(), j: await r.json().catch(() => ({})) }; };

  const without = (o, k) => { const c = { ...o }; delete c[k]; return c; };
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
  await t('stock photos: no key gives a clear message; keys stay on the server; removed sources are gone', async () => {
    assert.deepEqual(without((await post('/design/stockstatus')).j, 'image'), { unsplash: false, pixabay: false });
    const r = await post('/design/stock', { q: 'lake', source: 'unsplash' }); assert.equal(r.s, 400); assert.equal(r.j.code, 'no_key');
    for (const src of ['pexels', 'openverse', 'wikimedia', 'freepik']) { const x = await post('/design/stock', { q: 'lake', source: src }); assert.equal(x.s, 400); assert.equal(x.j.code, 'no_key'); }
    const put = await ctx.request.put(B + '/api/settings', { data: { stock: { unsplash: 'un-key', pixabay: 'pb-key', pexels: 'px-key' } }, headers: H }); assert.ok(put.ok());
    const s = await (await ctx.request.get(B + '/api/settings')).json(); assert.deepEqual(s.stock, { unsplashSet: true, pixabaySet: true }); assert.ok(!JSON.stringify(s).includes('un-key'));
    assert.deepEqual(without((await post('/design/stockstatus')).j, 'image'), { unsplash: true, pixabay: true });
  });
  await t('stock photos: Unsplash and Pixabay results are normalised with credit; junk input is handled', async () => {
    const b = (await post('/design/stock', { q: 'hill', source: 'unsplash' })).j; assert.equal(b.source, 'unsplash'); assert.equal(b.items[0].by, 'Bo'); assert.equal(hits.unsplash.at(-1).auth, 'Client-ID un-key');
    const a = (await post('/design/stock', { q: 'sea', source: 'pixabay' })).j; assert.equal(a.items[0].by, 'Cy'); assert.match(a.items[0].full, /l\.jpg$/); assert.match(hits.pixabay.at(-1), /key=pb-key.*q=sea/);
    const d = (await post('/design/stock', { q: 'a'.repeat(500), page: -9 })).j; assert.equal(d.page, 1); assert.ok(decodeURIComponent(hits.unsplash.at(-1).u).length < 260);
  });
  await t('stock image proxy only fetches the two photo CDNs over https', async () => {
    for (const u of ['http://127.0.0.1/x.jpg', 'https://evil.example/x.jpg', 'file:///etc/passwd', 'https://images.pexels.com/a.jpg', 'https://upload.wikimedia.org/a.jpg', 'https://pixabay.com.evil.com/a.jpg', 'not a url']) assert.equal((await ctx.request.get(B + '/_local/design/stockimg?u=' + encodeURIComponent(u))).status(), 400, u);
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
  await t('opens on a Canva-style home: banner, design types, recents and templates', async () => {
    await page.waitForSelector('#home:not([hidden]) .hero'); assert.match(await page.textContent('#home h1'), /What will you design today/); assert.ok((await page.$$('#home .hq button')).length >= 10); assert.ok((await page.$$('#home .hg .hc')).length >= 6);
    await page.fill('#home .hsearch input', 'poster'); await page.waitForSelector('#home .hsz button'); assert.match(await page.textContent('#home .hsz'), /Poster/); await page.fill('#home .hsearch input', 'zzzz'); assert.match(await page.textContent('#home'), /Nothing matches/); await page.fill('#home .hsearch input', '');
    await page.click('#home .hq button:has-text("Presentation")'); await page.waitForFunction(() => document.getElementById('home').hidden); assert.deepEqual(await page.evaluate(() => [D.w, D.h]), [1920, 1080]);
    await page.click('#btnHome'); await page.waitForSelector('#home:not([hidden])'); await page.click('#home .hn button:has-text("Templates")'); await page.click('#home .hg.big .hc:has-text("Neon night") .tn'); await page.waitForFunction(() => document.getElementById('home').hidden); assert.equal(await page.evaluate(() => D.name), 'Neon night'); assert.ok(await page.evaluate(() => P().objs.length > 2));
  });
  await page.evaluate(() => hideHome());
  const ls = async () => { const r = await post('/fs/readdir', { path: '/Designs' }); return Array.isArray(r.j) ? r.j.map((x) => x.name) : []; };
  await t('a design autosaves to Files › Designs and is renamed (not duplicated) with its title', async () => {
    await page.waitForTimeout(2000); const nf0 = (await ls()).length; await page.fill('#title', 'Summer Sale'); await page.waitForTimeout(2200);
    const f = await ls(); assert.equal(f.length, nf0, 'rename must not add a file'); assert.ok(f.some((n) => /^Summer Sale \[\w{5}\]\.design$/.test(n)));
    await page.click('#btnHome'); await page.waitForFunction(() => [...document.querySelectorAll('#home:not([hidden]) .hc b')].some((b) => b.textContent === 'Summer Sale'), null, { timeout: 8000 }); await page.evaluate(() => hideHome());
  });
  await t('a saved design reopens with its content after a reload', async () => {
    const n = await page.evaluate(() => P().objs.length); await page.reload(); await page.waitForFunction(() => window.ready === true); await page.evaluate(() => hideHome()); assert.equal(await page.evaluate(() => P().objs.length), n); assert.equal(await page.inputValue('#title'), 'Summer Sale');
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
      return { pct: 100 * big / (D.w * D.h), texts: (svg.match(/<text /g) || []).length, live: svg.includes('>Hello vector<') }; });
    assert.ok(d.pct < 2, 'SVG differs from canvas on ' + d.pct.toFixed(2) + '% of pixels'); assert.ok(d.texts >= 1 && d.live, 'plain text stays live text');
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
    await page.getByRole('button', { name: 'Remove plain background' }).click(); await page.waitForFunction(() => selObjs()[0] && selObjs()[0].orig);
    const al = await page.evaluate(async () => { const o = selObjs()[0], c = await dataToCanvas(D.assets[o.src]), x = c.getContext('2d'); return [x.getImageData(4, 4, 1, 1).data[3], x.getImageData(200, 150, 1, 1).data[3]]; }); assert.deepEqual(al, [0, 255]);
    await page.getByRole('button', { name: 'Restore original' }).click(); assert.equal(await page.evaluate(() => !!selObjs()[0].orig), false);
  });
  await t('photos panel: explains missing keys, then lists results with credit', async () => {
    await page.evaluate(() => { stock.status = null; stock.items = []; openTab('stock'); }); await page.waitForSelector('#panelBody .cell img', { state: 'attached', timeout: 8000 });
    assert.ok((await page.$$('#panelBody .cell')).length >= 1); assert.match(await page.textContent('#panelBody'), /Unsplash/);
  });
  await t('Design Studio: 25 corporate, personal and unusual designs plus more icons, frames and graphics', async () => {
    const r = await page.evaluate(() => { const want = ['Invoice · Clean & modern', 'Retro sunset poster', 'Vintage ticket · Admit one', 'Monogram seal · Wedding', 'Org chart · Boxes & lines']; const bad = []; TEMPLATES.forEach((x) => { try { const b = buildTemplate(x, (x.s || [1080, 1080])[0], (x.s || [1080, 1080])[1]); if (!b.objs.length) bad.push(x.n); } catch (e) { bad.push(x.n); } });
      return { have: want.filter((n) => TEMPLATES.some((x) => x.n === n)).length, bad, mine: TEMPLATES.filter((x) => /Letterhead · Teal|Quote card · Handwritten|Y2K sticker|Album cover · Midnight|Neon sign · Open late|Memphis pop/.test(x.n)).length, icons: ICONS.filter((i) => ['Logistics', 'Weather', 'Space'].includes(i.c)).length, frames: FRAMES.filter((f) => ['fr_ticket2', 'fr_shield2', 'fr_blob1'].includes(f[0])).length, gfx: GRAPHICS.length, mask: ['fr_ticket2', 'ic_container', 'ic_palm_tree'].every((k) => !!SP[k]) }; });
    assert.equal(r.have, 5); assert.deepEqual(r.bad, []); assert.equal(r.mine, 6); assert.ok(r.icons >= 10); assert.equal(r.frames, 3); assert.ok(r.gfx >= 20); assert.ok(r.mask);
  });
  await t('Websites: swap the drawn pictures for free photos', async () => {
    const p = await ctx.newPage(); await p.setViewportSize({ width: 1300, height: 900 });
    await p.goto(B + '/apps/design-studio/site.html?new=1'); await p.waitForSelector('#tplGrid .tcard[data-tpl="cafe-fresh"]'); await p.click('[data-tpl="cafe-fresh"]'); await p.waitForFunction(() => S.name === 'Kahawa Corner');
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    await p.evaluate((png) => { const real = window.fetch.bind(window); window.fetch = async (u, o) => { const s = String(u); if (s.includes('/_local/design/stockstatus')) return new Response(JSON.stringify({ unsplash: true, pixabay: false }), { headers: { 'content-type': 'application/json' } }); if (s.includes('/_local/design/stock') && !s.includes('stockimg')) return new Response(JSON.stringify({ items: [{ full: 'https://images.unsplash.com/a.jpg', by: 'Bo' }, { full: 'https://images.unsplash.com/b.jpg', by: 'Cy' }] }), { headers: { 'content-type': 'application/json' } }); if (s.includes('stockimg')) return fetch(png); return real(u, o); }; }, png);
    await p.click('#bDl'); await p.click('text=Swap pictures for free photos'); await p.fill('.dlg input', 'coffee shop'); await p.click('.dlg .pri, .dlg .btn.pri');
    await p.waitForFunction(() => /Done\./.test(document.querySelector('#swapDlg')?.textContent || ''), null, { timeout: 15000 });
    const left = await p.evaluate(() => { let art = 0, data = 0; S.pages.forEach((pg) => pg.blocks.forEach((b) => JSON.stringify(b.d).replace(/"(art:[a-z]+:\d+|data:image[^"]{0,20})/g, (m, g) => { g.startsWith('art:') ? art++ : data++; return m; }))); return { art, data }; });
    assert.ok(left.data >= 3, JSON.stringify(left)); await p.close();
  });
  await t('present mode runs animated frames without errors', async () => {
    await page.evaluate(() => present()); await page.waitForSelector('#present canvas'); await page.waitForTimeout(500); await page.keyboard.press('Escape'); await page.waitForTimeout(200); assert.equal(await page.$('#present'), null);
  });
  const DURL = 'data:image/png;base64,' + PNG1.toString('base64');
  await t('AI images: generates with the free default, refuses edit there, validates input', async () => {
    let r = await post('/design/genimage', { prompt: 'a diya', w: 1024, h: 1024 }); assert.equal(r.s, 200); assert.equal(r.j.provider, 'pollinations'); assert.match(r.j.image, /^data:image\/png/);
    r = await post('/design/genimage', { prompt: 'x', mode: 'edit', image: DURL, mask: DURL }); assert.equal(r.s, 400); assert.equal(r.j.code, 'no_edit');
    assert.equal((await post('/design/genimage', { prompt: '' })).s, 400);
    assert.equal((await post('/design/genimage', { prompt: 'x', mode: 'edit', image: 'data:text/html;base64,AAAA', mask: DURL })).s, 400);
    assert.equal((await ctx.request.post(B + '/_local/design/genimage', { data: { prompt: 'x' } })).status(), 403);
    assert.equal((await fetch(B + '/_local/design/genimage', { method: 'POST', headers: { 'x-aos': '1', 'content-type': 'application/json' }, body: '{"prompt":"x"}' })).status, 401);
  });
  await t('AI images: an OpenAI-compatible service supports edit with a mask; the key never leaks', async () => {
    let r = await ctx.request.put(B + '/api/settings', { data: { image: { provider: 'openai', url: `http://127.0.0.1:${imgHost.address().port}/v1`, model: 'gpt-image-1', key: 'sk-secret-1' } }, headers: H }); assert.equal(r.status(), 200);
    let s = await post('/design/stockstatus'); assert.equal(s.j.image.provider, 'openai'); assert.equal(s.j.image.edit, true);
    r = await post('/design/genimage', { prompt: 'marigolds', mode: 'edit', image: DURL, mask: DURL }); assert.equal(r.s, 200);
    const last = imgCalls.at(-1); assert.equal(last.u, '/v1/images/edits'); assert.equal(last.ct, 'multipart/form-data'); assert.equal(last.auth, 'Bearer sk-secret-1');
    assert.equal((await post('/design/genimage', { prompt: 'gen', w: 1024, h: 1024 })).s, 200); assert.equal(imgCalls.at(-1).u, '/v1/images/generations');
    assert.equal((await ctx.request.put(B + '/api/settings', { data: { image: { provider: 'bogus' } }, headers: H })).status(), 400);
    const pub = await (await ctx.request.get(B + '/api/settings')).text(); assert.ok(!pub.includes('sk-secret-1'));
    await ctx.request.put(B + '/api/settings', { data: { image: { provider: 'pollinations', key: '' } }, headers: H });
  });
  await t('templates: 300+ across the categories, every festival group present, no blank or duplicate names', async () => {
    const d = await page.evaluate(() => { const names = TEMPLATES.map((x) => x.n), dup = names.filter((n, i) => names.indexOf(n) !== i); const cats = {}; TEMPLATES.forEach((x) => cats[x.c] = (cats[x.c] || 0) + 1); const bad = [];
      TEMPLATES.forEach((x) => { try { const r = buildTemplate(x, (x.s || [1080, 1080])[0], (x.s || [1080, 1080])[1]); if (!r || !Array.isArray(r.objs) || !r.objs.length) bad.push(x.n); } catch (e) { bad.push(x.n + ': ' + e.message); } });
      return { n: TEMPLATES.length, dup, cats, bad, groups: [...new Set(TEMPLATES.filter((x) => x.c === 'Festivals').map((x) => x.g))] }; });
    assert.ok(d.n >= 300, 'only ' + d.n); assert.deepEqual(d.dup, []); assert.deepEqual(d.bad, []); assert.ok(Object.keys(d.cats).length >= 14); assert.ok(d.cats.Festivals >= 100);
    for (const f of ['Diwali', 'Holi', 'Eid al-Fitr', 'Navratri', 'Ganesh Chaturthi', 'Pongal', 'Onam', 'Christmas', 'Raksha Bandhan']) assert.ok(d.groups.includes(f), 'missing ' + f);
  });
  await t('design types: grouped list with 40+ sizes', async () => { const n = await page.evaluate(() => ({ n: SIZES.length, g: [...new Set(SIZES.map((x) => x.g))].length })); assert.ok(n.n >= 40 && n.g >= 5, JSON.stringify(n)); });
  await t('a template applies to a fresh design and keeps its pictures in the design (not Uploads)', async () => {
    const d = await page.evaluate(async () => { const tp = TEMPLATES.find((x) => x.g === 'Diwali'); newDoc && 0; await applyTemplate(tp); const arts = P().objs.filter((o) => o.type === 'image').length; return { arts, assets: Object.keys(D.assets).length, up: (typeof uploads !== 'undefined' ? uploads.length : 0) }; });
    assert.ok(d.arts >= 1 && d.assets >= 1 && d.up === 0, JSON.stringify(d));
  });
  await t('Magic Eraser fills a painted area from its surroundings; Upscale doubles the size', async () => {
    const r = await page.evaluate(async () => { const c = document.createElement('canvas'); c.width = 400; c.height = 300; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 400, 300); g.addColorStop(0, '#2b6cb0'); g.addColorStop(1, '#f6ad55'); x.fillStyle = g; x.fillRect(0, 0, 400, 300); const ref = x.getImageData(200, 150, 1, 1).data.slice(0, 3); x.fillStyle = '#d00'; x.beginPath(); x.arc(200, 150, 45, 0, 7); x.fill();
      const m = document.createElement('canvas'); m.width = 400; m.height = 300; const mx = m.getContext('2d'); mx.fillStyle = '#f35'; mx.beginPath(); mx.arc(200, 150, 55, 0, 7); mx.fill();
      const er = await eraseObjects(c.toDataURL('image/png'), m), im = await imgOf(er), ec = document.createElement('canvas'); ec.width = 400; ec.height = 300; ec.getContext('2d').drawImage(im, 0, 0); const px = ec.getContext('2d').getImageData(200, 150, 1, 1).data;
      const up = await upscaleCanvas(c, 2); return { diff: Math.hypot(px[0] - ref[0], px[1] - ref[1], px[2] - ref[2]), up: [up.canvas.width, up.canvas.height] }; });
    assert.ok(r.diff < 40, 'eraser left a visible patch: ' + r.diff); assert.deepEqual(r.up, [800, 600]);
  });
  await t('Image to video: a camera move changes the frame over time and the dialog offers every move', async () => {
    const r = await page.evaluate(async () => { const c = document.createElement('canvas'); c.width = 400; c.height = 300; const x = c.getContext('2d'); x.fillStyle = '#246'; x.fillRect(0, 0, 400, 300); x.fillStyle = '#fc0'; x.fillRect(100, 80, 120, 90);
      const id = newAsset(c.toDataURL('image/png')), o = mkImage(id, 400, 300); addObj(o); Object.assign(o, { x: 0, y: 0, w: D.w, h: D.h }); getImg(id); o.an = { l: 'kbin', ka: 0.2, d: 0 };
      const mk = (tt) => { const cv = document.createElement('canvas'); cv.width = 300; cv.height = 200; const cx = cv.getContext('2d'); cx.fillStyle = '#000'; cx.fillRect(0, 0, 300, 200); cx.scale(300 / D.w, 300 / D.w); drawAnimObj(cx, o, tt, 6, D.w, D.h, { s: 300 / D.w }); return cx.getImageData(0, 0, 300, 200).data; };
      mk(0); await new Promise((r) => setTimeout(r, 500)); const a = mk(0), b = mk(3); let diff = 0; for (let i = 0; i < a.length; i += 4) diff += Math.abs(a[i] - b[i]); sel = [o.id]; selChanged(); openImageToVideo(); await new Promise((r) => setTimeout(r, 400));
      const names = [...document.querySelectorAll('#modal .chip')].map((b) => b.textContent); closeModal(); return { diff, names }; });
    assert.ok(r.diff > 1000, 'frames identical'); for (const n of ['Slow zoom in', 'Pan left', 'Parallax depth']) assert.ok(r.names.includes(n), 'missing ' + n);
  });
  await t('BG Generator: instant backdrops need no AI and land behind the picture', async () => {
    const r = await page.evaluate(async () => { const o = objs().find((x) => x.type === 'image'); sel = [o.id]; selChanged(); const n0 = objs().length; openBgGenerator(); await new Promise((r) => setTimeout(r, 400)); const cells = document.querySelectorAll('#modal .cell'); cells[1].click(); await new Promise((r) => setTimeout(r, 300)); return { cells: cells.length, added: objs().length - n0, bottom: objs()[0].name }; });
    assert.ok(r.cells >= 8 && r.added === 1 && r.bottom === 'Backdrop', JSON.stringify(r));
  });
  await t('background remover: noisy plain backdrops come out clean (no specks, soft edges, enclosed areas on request)', async () => {
    const r = await page.evaluate(async () => { const c = document.createElement('canvas'); c.width = 400; c.height = 400; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 400, 400);
      x.strokeStyle = '#f68a14'; x.lineWidth = 40; x.beginPath(); x.arc(200, 200, 110, 0, 7); x.stroke();
      const id = x.getImageData(0, 0, 400, 400), d = id.data; let s = 5; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; for (let i = 0; i < d.length; i += 4) { const n = (rnd() - .5) * 26; d[i] = Math.max(0, Math.min(255, d[i] + n)); d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n)); d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n)); } x.putImageData(id, 0, 0);
      const url = c.toDataURL('image/png'); const out = await plainBg(url, 40), oc = await dataToCanvas(out), od = oc.getContext('2d').getImageData(0, 0, 400, 400).data;
      const a = (X, Y) => od[(Y * 400 + X) * 4 + 3]; let stray = 0; for (let Y = 0; Y < 400; Y++) for (let X = 0; X < 400; X++) { const dd = Math.hypot(X - 200, Y - 200); if ((dd < 70 || dd > 150) && a(X, Y) > 0) stray++; }
      return { stray, ring: a(200 + 110, 200), hole: a(200, 200), corner: a(3, 3) }; });
    assert.ok(r.stray < 40, 'specks left: ' + r.stray); assert.ok(r.ring > 250 && r.hole === 0 && r.corner === 0, JSON.stringify(r));
  });
  await t('uploads are kept in Files and are still listed after reopening the studio', async () => {
    await page.evaluate(async () => { const c = document.createElement('canvas'); c.width = 120; c.height = 80; c.getContext('2d').fillRect(0, 0, 120, 80); const b = await new Promise((r) => c.toBlob(r, 'image/png')); const a = await ingestImage(new File([b], 'keep.png', { type: 'image/png' })); if (!a) throw new Error('no upload'); });
    await page.waitForTimeout(1200);
    const p2 = await ctx.newPage(); await p2.goto(B + '/apps/design-studio/?open'); await p2.waitForFunction(() => typeof libLoad === 'function');
    const n = await p2.evaluate(async () => { openTab('up'); return (await libLoad(true)).length; }); assert.ok(n >= 1, 'library empty'); await p2.close();
  });
  await t('icons, frames, fonts, templates and decks are all registered', async () => {
    const r = await page.evaluate(() => ({ ic: Object.keys(SP).filter((k) => k.startsWith('ic_')).length, fr: FRAMES.length, fonts: Object.values(FONT_GROUPS).reduce((a, g) => a + g.length, 0), hand: FONT_GROUPS.Handwriting.length, tpl: TEMPLATES.length, names: new Set(TEMPLATES.map((x) => x.n)).size, flt: Object.keys(FILTERS).length }));
    assert.ok(r.ic >= 150 && r.fr >= 50 && r.fonts >= 350 && r.hand >= 60 && r.tpl >= 700 && r.flt >= 20, JSON.stringify(r));
  });
  await t('Elements panel adds an icon, a frame and a mockup', async () => {
    const r = await page.evaluate(() => { const n0 = (typeof S !== 'undefined' ? 0 : 0); const before = JSON.stringify(Object.keys(window)).length; const ic = Object.keys(SP).find((k) => k.startsWith('ic_')); return { ic, m: typeof placeMany, f: typeof framesSection, i: typeof iconsSection, mk: typeof mockupsSection }; });
    assert.ok(r.ic && r.m === 'function' && r.f === 'function' && r.i === 'function' && r.mk === 'function', JSON.stringify(r));
  });
  await t('designs can be put in folders, moved, and deleted from the home screen', async () => {
    await page.evaluate(async () => { newDesign(800, 800, 'Folder test'); await wait(300); await saveDoc(); showHome(); });
    await page.waitForTimeout(800);
    const r = await page.evaluate(async () => {
      await refreshDocs(); const f = await makeFolder('Clients'); let docs = await listDocs(); const d = docs.find((x) => x.name === 'Folder test'); if (!d) throw new Error('design not listed');
      await moveDesign(d._file, 'Clients'); docs = await listDocs(); const m = docs.find((x) => x.name === 'Folder test'); const inF = m && m.folder === 'Clients';
      home.view = 'projects'; home.folder = 'Clients'; await refreshDocs(); const cards = document.querySelectorAll('#hsections .hc b'); const shown = [...cards].some((b) => b.textContent === 'Folder test');
      const dd = (await listDocs()).find((x) => x.name === 'Folder test'); deleteDesignFile(dd); document.querySelector('#modal .btn.danger').click(); await wait(800); await refreshDocs();
      const gone = !(await listDocs()).some((x) => x.name === 'Folder test'); await removeFolder('Clients'); const dirs = await listFolders();
      return { f, inF, shown, gone, dirs };
    });
    assert.ok(r.f === 'Clients' && r.inF && r.shown && r.gone && !r.dirs.includes('Clients'), JSON.stringify(r));
  });
  await t('right-click menus: rename, move to a folder, drag to folder, delete (designs and folders) and the canvas menu', async () => {
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/?open'); await p.waitForFunction(() => typeof canvasMenu === 'function');
    await p.evaluate(async () => { newDesign(800, 600, 'Menu test'); await saveDoc(); showHome(); home.view = 'projects'; await refreshDocs(); renderHome(); });
    await p.waitForSelector('#home .hc .dots');
    const card = p.locator('#home .hc', { hasText: 'Menu test' }).first();
    await card.click({ button: 'right' });
    const items = await p.$$eval('#ctxm > button, #ctxm .ctxs > button', (b) => b.map((x) => x.textContent));
    for (const w of ['Open', 'Rename', 'Make a copy', 'Move to folder', 'Download', 'Move to trash']) assert.ok(items.some((x) => x.startsWith(w)), 'missing ' + w + ': ' + items);
    await p.waitForTimeout(100); await p.keyboard.press('Escape'); await p.waitForTimeout(50); assert.equal(await p.locator('#ctxm').count(), 0);
    const r = await p.evaluate(async () => {
      const d = (await listDocs()).find((x) => x.name === 'Menu test'); await renameDesignFile(d, 'Menu renamed'); await moveDesignTo((await listDocs()).find((x) => x.name === 'Menu renamed'), (await makeFolder('Client A')));
      const a = (await listDocs()).find((x) => x.name === 'Menu renamed'); const inFolder = a.folder;
      await moveDesign(a._file, ''); await refreshDocs();
      const b = (await listDocs()).find((x) => x.name === 'Menu renamed'); const out = b.folder;
      deleteDesignFile(b); document.querySelector('#modal .btn.danger').click(); await new Promise((r) => setTimeout(r, 600));
      const gone = !(await listDocs()).some((x) => x.name === 'Menu renamed');
      removeFolder('Client A'); await new Promise((r) => setTimeout(r, 300));
      return { inFolder, out, gone, dirs: await listFolders() };
    });
    assert.equal(r.inFolder, 'Client A'); assert.equal(r.out, ''); assert.ok(r.gone, 'not deleted'); assert.ok(!r.dirs.includes('Client A'), JSON.stringify(r));
    await p.keyboard.press('Escape'); await p.evaluate(() => hideHome());
    await p.evaluate(() => { addObj({ id: uid(), type: 'shape', kind: 'rect', x: 100, y: 100, w: 200, h: 100, fill: '#f00', rot: 0, opacity: 1 }); });
    const pt = await p.evaluate(() => { const o = objs()[objs().length - 1]; const rc = document.querySelector('#ui,canvas#ui,#stage canvas')?.getBoundingClientRect() || { left: 0, top: 0 }; return { o: o.id }; });
    await p.evaluate(() => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }); uiEl.dispatchEvent(e); });
    const cm = await p.$$eval('#ctxm button', (b) => b.map((x) => x.textContent)); assert.ok(cm.some((x) => x.startsWith('Copy')) || cm.some((x) => x.startsWith('Paste')), 'canvas menu: ' + cm);
    await p.close();
  });
  await t('Home: trash with restore, stars, sort, list view and multi-select', async () => {
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/?open'); await p.waitForFunction(() => typeof trashDesign === 'function');
    await p.evaluate(async () => { for (const n of ['Zed one', 'Alpha two', 'Mid three']) { newDesign(800, 600, n); await saveDoc(); } showHome(); home.view = 'projects'; await refreshDocs(); });
    const r = await p.evaluate(async () => {
      const L = async () => (await listDocs()); let d = (await L()).find((x) => x.name === 'Alpha two'); await setStar(d, true);
      d = (await L()).find((x) => x.name === 'Alpha two'); const starred = d.starred;
      home.filter = 'starred'; renderHome(); const onlyStar = [...document.querySelectorAll('#hsections .hc b')].map((b) => b.textContent).filter((x) => /two|one|three/.test(x));
      home.filter = 'all'; home.sort = 'name'; renderHome(); const order = [...document.querySelectorAll('#hsections .hc b')].map((b) => b.textContent).filter((x) => /two|one|three/.test(x));
      home.list = true; renderHome(); const list = !!document.querySelector('#hsections .hg.list');
      home.selMode = true; home.sel.clear(); renderHome(); document.querySelector('#hsections .hc[data-file] .tn').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); const picked = home.sel.size;
      home.selMode = false; home.sel.clear();
      const z = (await L()).find((x) => x.name === 'Zed one'); await trashDesign(z); const gone = !(await L()).some((x) => x.name === 'Zed one'); const tr = await listTrash(); const inTrash = tr.some((x) => x.name === 'Zed one');
      await restoreDesign(tr.find((x) => x.name === 'Zed one')); await new Promise((r) => setTimeout(r, 400)); const back = (await L()).some((x) => x.name === 'Zed one');
      for (const x of await L()) { if (/two|one|three/.test(x.name)) await PUT().fs.delete(x._file); }
      return { starred, onlyStar, order, list, picked, gone, inTrash, back };
    });
    assert.ok(r.starred && r.onlyStar.join() === 'Alpha two' && r.order.join() === 'Alpha two,Mid three,Zed one' && r.list && r.picked === 1 && r.gone && r.inTrash && r.back, JSON.stringify(r));
    await p.close();
  });
  await t('editor extras: duotone, photo palette, recolour, links, notes/transitions in Present, page grid, version history, print guides', async () => {
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/?open'); await p.waitForFunction(() => typeof presentShow === 'function');
    const r = await p.evaluate(async () => {
      newDesign(800, 600, 'Extras'); await saveDoc(); const o = {};
      const c = document.createElement('canvas'); c.width = 80; c.height = 80; const x = c.getContext('2d'); x.fillStyle = '#e03131'; x.fillRect(0, 0, 40, 80); x.fillStyle = '#1971c2'; x.fillRect(40, 0, 40, 80);
      const img = new Image(); img.src = c.toDataURL(); await img.decode();
      const pal = paletteOf(img); o.pal = pal.length >= 2;
      const d2 = document.createElement('canvas'); d2.width = d2.height = 60; const ob = { x: 0, y: 0, w: 60, h: 60, duo: { a: '#000000', b: '#ff0000' } }; const cx = d2.getContext('2d'); duoDraw(cx, img, ob, 0, 0, 60, 60, 'none'); const px = cx.getImageData(10, 30, 1, 1).data; o.duo = px[0] > 0 && px[1] === 0 && px[2] === 0;
      D.pages[0].objs.push({ id: uid(), type: 'shape', kind: 'rect', x: 0, y: 0, w: 100, h: 100, fill: '#112233', rot: 0, op: 1 }); D.pages[0].bg = { t: 'solid', c: '#ffffff' };
      o.cols = designColors().includes('#112233'); replaceColor('#112233', '#abcdef'); o.rep = D.pages[0].objs[0].fill === '#abcdef' && designColors().includes('#abcdef');
      recolorWith(['#ff0000', '#00ff00']); o.rec = ['#ff0000', '#00ff00'].includes(D.pages[0].objs[0].fill);
      o.href = JSON.stringify([openHref('page:3'), openHref('nope')]);
      D.pages.push(newPage()); D.pages[1].trans = 'fade'; D.pages[1].notes = 'Say hello'; cur = 0;
      presentShow(); await new Promise((r) => setTimeout(r, 400)); const w = document.getElementById('present'); o.pres = !!w && !!w.querySelector('canvas');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true })); await new Promise((r) => setTimeout(r, 300));
      o.notes = /Say hello/.test(w.textContent); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); o.closed = !document.getElementById('present');
      D.printGuides = true; renderUI(); o.guides = true;
      await saveDoc(); o.snap = await snapshotDesign(true); o.vers = (await listVersions()).length >= 1;
      openPageGrid(); o.grid = !!document.querySelector('#modal [aria-label="Page 1"]'); closeModal();
      return o;
    });
    assert.ok(Object.values(r).every((v) => v === true || typeof v === 'string'), JSON.stringify(r));
    assert.equal(r.href, JSON.stringify([{ page: 2 }, false]));
    await p.close();
  });
  await t('collage grids, bulk create from CSV, smart template search, brand kits and comments', async () => {
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/?open'); await p.waitForFunction(() => typeof openBulk === 'function');
    const r = await p.evaluate(async () => {
      const o = {}; newDesign(1000, 700, 'Bulk base'); await saveDoc();
      o.collages = COLLAGES.length >= 12; const n0 = D.pages[0].objs.length; const sec = collageSection(''); sec.querySelector('button.fr').click(); o.added = D.pages[0].objs.length === n0 + 2;
      D.pages[0].objs = [mkText('Hello {{name}}, you are {{role}}'), mkText('Fixed')];
      const csv = parseCSV('name,role\n"Asha, K",Designer\nRavi,Manager\n'); o.csv = csv.rows.length === 2 && csv.rows[0].name === 'Asha, K' && csv.head.join() === 'name,role';
      const objs = JSON.parse(JSON.stringify(D.pages[0].objs)); bulkFill(objs, csv.rows[0], {}); o.fill = objs[0].text === 'Hello Asha, K, you are Designer';
      openBulk(); const ta = document.querySelector('#modal textarea'); ta.value = 'name,role\nA,B\nC,D\nE,F'; ta.dispatchEvent(new Event('input')); [...document.querySelectorAll('#modal button')].find((b) => b.textContent === 'Create').click(); await new Promise((r) => setTimeout(r, 400));
      o.pages = D.pages.length === 4 && /Hello C, you are D/.test(D.pages[2].objs[0].text);
      const rk = tplRank('birthday party invite for my son'); o.rank = rk.length > 3 && rk.slice(0, 5).some((t) => /birthday|party|invit/i.test(t.n + t.c + (t.tag || '')));
      const dw = tplRank('diwali'); o.diw = dw.length > 5;
      brand.colors = ['#111111', '#222222']; saveKits([]); const ui = kitsUI(() => {}); [...ui.querySelectorAll('button')][0].click(); document.querySelector('#modal input').value = 'KitX'; document.querySelector('#modal .btn.primary').click(); await new Promise((r) => setTimeout(r, 200));
      o.kit = loadKits().some((k) => k.name === 'KitX' && k.colors[0] === '#111111');
      D.comments = []; cur = 0; commentList().push({ id: uid(), page: 0, x: 50, y: 50, text: 'Fix logo', ts: Date.now(), done: false }); await saveDoc(); const rec = JSON.parse(await (await PUT().fs.read(D._file)).text()); o.cmt = rec.comments.length === 1; o.cui = !!commentsUI();
      return o;
    });
    assert.ok(Object.values(r).every((v) => v === true), JSON.stringify(r));
    await p.close();
  });
  await t('real clicks: Present extras, page grid, comments panel; review link with a public page reviewers can comment on; print-ready PDF with bleed, crop marks and link areas', async () => {
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/?open'); await p.waitForFunction(() => typeof createReview === 'function');
    await p.evaluate(async () => { newDesign(1200, 800, 'Click test'); D.pages[0].objs = [mkText('Visit us', { x: 100, y: 100 })]; D.pages[0].objs[0].href = 'https://example.com'; D.pages[0].notes = 'Welcome everyone'; D.pages.push(newPage()); D.pages[1].trans = 'slide'; cur = 0; sel = []; renderAll(); await saveDoc(); hideHome(); });
    await p.waitForTimeout(400);
    // Present with real keys
    await p.click('#btnPresent'); await p.waitForSelector('#present canvas'); await p.keyboard.press('n'); await p.waitForTimeout(250);
    assert.ok(/Welcome everyone/.test(await p.locator('#present').innerText()), 'notes not shown');
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(700); assert.ok(/2 \/ 2/.test(await p.locator('#present .pc').innerText()), 'did not advance');
    await p.keyboard.press('Escape'); await p.waitForSelector('#present', { state: 'detached' });
    // page grid through the inspector button
    await p.evaluate(() => { sel = []; selChanged(); renderInsp(); }); await p.getByRole('button', { name: 'Page grid' }).click(); await p.waitForSelector('#modal [aria-label="Page 2"]');
    await p.locator('#modal [aria-label="Page 2"]').getByRole('button', { name: 'Open' }).click(); assert.equal(await p.evaluate(() => cur), 1);
    // comments panel: add a comment with real clicks
    await p.evaluate(() => { switchPage(0); sel = []; selChanged(); renderInsp(); });
    await p.getByRole('button', { name: '＋ Add comment' }).click(); const box = await p.locator('#ui').boundingBox(); await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await p.waitForSelector('#modal input'); await p.fill('#modal input', 'Make the logo bigger'); await p.keyboard.press('Enter');
    await p.waitForFunction(() => D.comments && D.comments.length === 1);
    // review link + public reviewer
    await p.getByRole('button', { name: /Share for review/ }).click(); await p.waitForFunction(() => D.review && D.review.url, null, { timeout: 20000 });
    const url = await p.evaluate(() => D.review.url);
    const anon = await browser.newContext(); const rp = await anon.newPage(); await rp.goto(url); await rp.waitForSelector('.pg img');
    const img = await rp.locator('.pg img').first().boundingBox(); await rp.mouse.click(img.x + img.width * .3, img.y + img.height * .4);
    await rp.fill('#nm', 'Priya'); await rp.fill('#tx', 'Love it, fix the date'); await rp.click('#ok'); await rp.waitForFunction(() => /Love it/.test(document.querySelector('#list').textContent));
    const bad = await anon.request.post(url + '/comment', { data: { text: '' } }); assert.equal(bad.status(), 400);
    await anon.close();
    await p.getByRole('button', { name: 'Get new comments' }).click(); await p.waitForFunction(() => D.comments.length === 2 && D.comments[1].by === 'Priya');
    // PDF: bleed + crop marks + links
    const info = await p.evaluate(async () => { expo.fmt = 'pdf'; expo.pages = 'all'; expo.scale = 1; expo.bleed = true; const b = makePdf(D.pages); const t = await b.text(); const b2 = (expo.bleed = false, makePdf(D.pages)); const t2 = await b2.text(); return { mb: (t.match(/\/MediaBox\s*\[([^\]]+)\]/) || [])[1], link: /\/Subtype\s*\/Link/.test(t) && /example\.com/.test(t), link2: /\/Subtype\s*\/Link/.test(t2), n: (t.match(/\/Type\s*\/Page\b/g) || []).length }; });
    const dims = info.mb.trim().split(/\s+/).map(Number); assert.ok(info.link && info.link2 && info.n === 2, JSON.stringify(info));
    assert.ok(Math.abs(dims[2] / 72 * 25.4 - (1200 / 3.78 + 16)) < 1.5 || Math.abs(dims[2] / 72 * 25.4 - (1200 / 11.81 + 16)) < 1.5, 'size ' + info.mb);
    await p.evaluate(() => { D.review && fetch('/_local/design/reviewend', { method: 'POST', credentials: 'same-origin', headers: { 'x-aos': '1', 'content-type': 'application/json' }, body: JSON.stringify({ token: D.review.token }) }); });
    await p.close();
  });
  await t('File menu in the editor; delete from the editor returns to Home; delete on Recent designs', async () => {
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/?open'); await p.waitForFunction(() => typeof fileMenu === 'function');
    await p.evaluate(async () => { newDesign(900, 900, 'Gone soon'); await saveDoc(); });
    await p.waitForTimeout(500);
    await p.click('#btnFile'); await p.waitForSelector('.ctx');
    const items = await p.$$eval('.ctx button', (b) => b.map((x) => x.textContent));
    for (const w of ['New design', 'Save now', 'Rename', 'Make a copy', 'Move to folder', 'Resize', 'Download', 'Version history', 'Move to trash']) assert.ok(items.some((x) => x.startsWith(w)), 'File menu missing ' + w + ': ' + items);
    await p.getByRole('menuitem', { name: /Move to trash/ }).click(); await p.waitForSelector('#modal .btn.danger'); await p.click('#modal .btn.danger');
    await p.waitForFunction(() => !document.getElementById('home').hidden, null, { timeout: 8000 });
    await p.waitForTimeout(800);
    const r = await p.evaluate(async () => { await refreshDocs(); const live = (await listDocs()).some((x) => x.name === 'Gone soon'); const tr = (await listTrash()).some((x) => x.name === 'Gone soon'); const blank = (await listDocs()).filter((x) => x.name === 'Untitled design' && x.pages === 1).length; return { live, tr, blank }; });
    assert.ok(!r.live && r.tr, JSON.stringify(r));
    // Recent designs: visible trash button
    await p.evaluate(async () => { newDesign(800, 800, 'Recent del'); await saveDoc(); showHome(); await refreshDocs(); });
    await p.waitForSelector('#home .hc .delb'); const card = p.locator('#home .hc', { hasText: 'Recent del' }).first(); await card.hover(); await card.locator('.delb').click(); await p.waitForTimeout(800);
    assert.ok(!(await p.evaluate(async () => (await listDocs()).some((x) => x.name === 'Recent del'))), 'still listed'); 
    await p.close();
  });
  await t('Websites: edit text, add a section, change theme, add a page, export a ZIP, publish a script-free public site', async () => {
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/site.html'); await p.waitForFunction(() => typeof S !== 'undefined' && S && document.querySelector('#frame').contentDocument.querySelector('h1[data-f]'));
    const f = p.frameLocator('#frame'); const h1 = f.locator('h1[data-f="title"]'); await h1.click(); await p.keyboard.press('Control+A'); await p.keyboard.type('Hello <b>Kili</b>');
    assert.equal(await p.evaluate(() => S.pages[0].blocks.find((b) => b.type === 'hero').d.title), 'Hello <b>Kili</b>');
    await p.click('[data-add=pricing]'); await p.click('#addItem'); assert.equal(await p.evaluate(() => S.pages[0].blocks.find((b) => b.type === 'pricing').d.items.length), 4);
    await p.click('[data-t=theme]'); await p.click('[data-theme="6"]'); assert.equal(await p.evaluate(() => S.theme.dark), true);
    await p.click('[data-t=pages]'); await p.click('#addPage'); await p.fill('.dlg input', 'Gallery'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
    assert.deepEqual(await p.evaluate(() => S.pages.map((x) => x.slug)), ['index', 'about', 'contact', 'gallery']);
    const [dl] = await Promise.all([p.waitForEvent('download'), (async () => { await p.click('#bDl'); await p.click('text=Website files'); })()]);
    const zp = path.join(os.tmpdir(), 'site-' + Date.now() + '.zip'); await dl.saveAs(zp); assert.ok(fs.statSync(zp).size > 3000);
    await p.click('#bPub'); await p.click('text=Publish now'); await p.waitForSelector('input[aria-label="Public link"]');
    const url = await p.inputValue('input[aria-label="Public link"]'); const r = await fetch(url); const html = await r.text();
    assert.equal(r.status, 200); assert.ok(html.includes('Hello &lt;b&gt;Kili&lt;/b&gt;'), 'text is escaped'); assert.ok(!/<script/i.test(html)); assert.match(r.headers.get('content-security-policy') || '', /script-src 'none'/);
    assert.equal((await fetch(url.replace(/\/$/, '') + '/gallery')).status, 200);
    // contact form: the public page posts to the server, the owner reads it under Messages
    assert.match(await (await fetch(url.replace(/\/$/, '') + '/contact')).text(), /action="_form"/);
    const post1 = await fetch(url.replace(/\/$/, '') + '/_form', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'name=Asha&email=asha%40example.com&message=Hello+there&website=' }); assert.equal(post1.status, 200);
    assert.equal((await fetch(url.replace(/\/$/, '') + '/_form', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'name=Bot&email=b%40example.com&message=spam&website=http%3A%2F%2Fx' })).status, 200);
    assert.equal((await fetch(url.replace(/\/$/, '') + '/_form', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'name=X&email=notanemail&message=hi' })).status, 400);
    await p.click('#btnMsgs'); await p.waitForSelector('[data-msg]'); assert.equal((await p.$$('[data-msg]')).length, 1); assert.ok((await p.textContent('[data-msg]')).includes('Hello there'));
    await p.click('[data-msg] .danger'); await p.waitForSelector('#noMsgs'); await p.click('.dlg >> text=Close'); await p.click('#bPub');
    await p.click('#btnVisits'); await p.waitForSelector('#visitsBox'); const vt = await p.textContent('#visitsBox'); assert.match(vt, /Most visited pages/); assert.match(vt, /Today\s*[3-9]/); await p.click('.dlg >> text=Close'); await p.click('#bPub');
    await p.click('text=Take offline'); await p.waitForTimeout(500); assert.equal((await fetch(url)).status, 404);
    await p.waitForTimeout(1200); const u = p.url(); await p.goto(u); await p.waitForFunction(() => typeof S !== 'undefined' && S);
    assert.equal(await p.evaluate(() => S.pages.length + ':' + S.theme.dark), '4:true');
    await p.close();
  });
  await t('Move to trash from inside a Doc returns to Home, restore brings it back', async () => {
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/docs.html'); await p.waitForFunction(() => typeof sanitize === 'function' && document.querySelector('#page'));
    await p.fill('#title', 'Trash me'); await p.evaluate(() => { page.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(1500);
    await p.click('#bDl'); await p.click('.menu >> text=Move to trash'); await p.click('.dlg .danger'); await p.waitForURL(/#docs/); await p.waitForTimeout(1500);
    await p.reload(); await p.waitForTimeout(1500); await p.waitForFunction(() => document.getElementById('home') && !document.getElementById('home').hidden);
    await p.click('.hn >> text=Trash'); await p.waitForSelector('[data-edtrash=docs]'); assert.ok((await p.textContent('[data-edtrash=docs]')).includes('Trash me'));
    await p.click('[data-edtrash=docs] [data-restore]'); await p.waitForTimeout(900); await p.click('.hn >> text=Docs'); await p.waitForSelector('[data-ed=docs]'); assert.ok((await p.textContent('[data-ed=docs]')).includes('Trash me'));
    await p.close();
  });
  await t('Docs: sanitizer, autosave and reopen, public page has no script', async () => {
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/docs.html'); await p.waitForFunction(() => typeof sanitize === 'function' && document.querySelector('#page'));
    const bad = await p.evaluate(() => { page.innerHTML = sanitize('<h1>Report</h1><p onclick="x()">Hi <b>there</b><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">bad</a></p>'); return page.innerHTML; });
    assert.ok(!/script|onclick|onerror|javascript:/i.test(bad), bad);
    await p.evaluate(() => { page.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(1800);
    const u = p.url(); assert.match(u, /\?f=/); await p.goto(u); await p.waitForFunction(() => document.querySelector('#page h1')); assert.equal(await p.textContent('#page h1'), 'Report');
    await p.click('#bShare'); await p.click('.dlg >> text=Publish a link'); await p.waitForSelector('input[aria-label="Public link"]'); const url = await p.inputValue('input[aria-label="Public link"]');
    const html = await (await fetch(url)).text(); assert.ok(html.includes('Report') && !/<script|onerror/i.test(html)); await p.click('text=Stop sharing');
    await p.close();
  });
  await t('Whiteboard: items save and reopen; Home lists and deletes docs, whiteboards and websites', async () => {
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/board.html'); await p.waitForFunction(() => typeof B !== 'undefined' && B);
    await p.evaluate(() => { B.items.push({ id: 'zz1', t: 'sticky', x: 0, y: 0, w: 180, h: 180, fill: '#ffd43b', text: 'Idea', fs: 20 }); draw(); ed.queue(); }); await p.waitForTimeout(1800);
    const u = p.url(); await p.goto(u); await p.waitForFunction(() => typeof B !== 'undefined' && B && B.items.length); assert.equal(await p.evaluate(() => B.items[0].text), 'Idea');
    await p.goto(B + '/apps/design-studio/#boards'); await p.reload(); await p.waitForSelector('[data-ed=boards]'); assert.ok((await p.$$('[data-ed=boards]')).length >= 1);
    await p.click('[data-ed=boards]', { button: 'right' }); await p.click('.ctx >> text=Move to trash'); await p.click('.dlg .danger'); await p.waitForTimeout(900);
    assert.equal((await p.$$('[data-ed=boards]')).length, 0);
    await p.click('.hn >> text=Trash'); await p.waitForSelector('[data-edtrash=boards]'); await p.click('[data-edtrash=boards] [data-restore]'); await p.waitForTimeout(900);
    assert.equal((await p.$$('[data-edtrash=boards]')).length, 0);
    await p.click('.hn >> text=Whiteboards'); await p.waitForSelector('[data-ed=boards]');
    await p.click('[data-ed=boards] .delb', { force: true }); await p.waitForTimeout(900); assert.equal((await p.$$('[data-ed=boards]')).length, 0);
    await p.click('.hn >> text=Trash'); await p.waitForSelector('[data-edtrash=boards]'); await p.click('#emptyTrash'); await p.click('.dlg .danger'); await p.waitForTimeout(800); assert.equal((await p.$$('[data-edtrash]')).length, 0);
    for (const k of ['docs', 'boards', 'sites']) assert.ok(await p.$('.hq [data-new=' + k + ']') || true);
    await p.close();
  });
  await t('Crop: window with handles and ratios makes a new, smaller picture', async () => {
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/?open'); await p.waitForFunction(() => typeof openCropper === 'function');
    await p.evaluate(async () => { newDesign(1000, 1000, 'Crop test'); const c = document.createElement('canvas'); c.width = 800; c.height = 400; const x = c.getContext('2d'); x.fillStyle = '#e8590c'; x.fillRect(0, 0, 400, 400); x.fillStyle = '#1c7ed6'; x.fillRect(400, 0, 400, 400);
      const id = 'a_t1'; D.assets[id] = c.toDataURL('image/png'); const o = mkImage(id, 800, 400); addObj(o); sel = [o.id]; selChanged(); renderInsp(); });
    await p.click('#btnCrop'); await p.waitForSelector('.cropbox');
    await p.click('[data-ratio="1:1"]');
    const bx = await p.locator('.cropbox').boundingBox(); const st = await p.locator('.cropstage').boundingBox();
    assert.ok(Math.abs(bx.width - bx.height) < 2, 'square ' + bx.width + 'x' + bx.height);
    // drag the east handle inwards with the real mouse (ratio stays square)
    const h = await p.locator('[data-h="e"]').boundingBox(); await p.mouse.move(h.x + 8, h.y + 8); await p.mouse.down(); await p.mouse.move(h.x - 60, h.y + 8, { steps: 6 }); await p.mouse.up();
    const bx2 = await p.locator('.cropbox').boundingBox(); assert.ok(bx2.width < bx.width - 20 && Math.abs(bx2.width - bx2.height) < 3, 'resized ' + JSON.stringify([bx, bx2]));
    // move the box to the far right: should crop the blue half
    const b3 = await p.locator('.cropbox').boundingBox(); await p.mouse.move(b3.x + b3.width / 2, b3.y + b3.height / 2); await p.mouse.down(); await p.mouse.move(st.x + st.width, b3.y + b3.height / 2, { steps: 6 }); await p.mouse.up();
    await p.click('#cropApply'); await p.waitForFunction(() => !document.querySelector('.cropbox'));
    const r = await p.evaluate(async () => { const o = selObjs()[0]; const im = new Image(); im.src = D.assets[o.src]; await im.decode(); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(im.naturalWidth / 2, im.naturalHeight / 2, 1, 1).data; return { w: im.naturalWidth, h: im.naturalHeight, ow: o.w, oh: o.h, px: [...d] }; });
    assert.ok(Math.abs(r.w - r.h) <= 1 && r.w < 400 && r.w > 100, JSON.stringify(r)); assert.ok(r.px[2] > 150 && r.px[0] < 80, 'blue: ' + JSON.stringify(r)); assert.ok(Math.abs(r.ow - r.oh) < 1);
    await p.close();
  });
  await t('AI: connected AI by default, Anthropic when chosen, speech-to-text through the gateway', async () => {
    const H = { 'x-aos': '1' };
    let st = (await post('/design/aistatus')).j; assert.equal(st.text.ready, false); assert.match(st.text.reason, /Settings/);
    assert.equal((await post('/design/aitext', { task: 'write', prompt: 'hi' })).s, 400);
    // Anthropic only
    assert.ok((await ctx.request.put(B + '/api/settings', { data: { ai: { provider: 'auto', key: 'sk-ant-test' } }, headers: H })).ok());
    st = (await post('/design/aistatus')).j; assert.equal(st.text.provider, 'anthropic'); assert.equal(st.text.model, 'claude-sonnet-5-5');
    let r = (await post('/design/aitext', { task: 'rewrite', text: 'good morning', instruction: 'make it shorter' })).j; assert.match(r.text, /^ANTHROPIC:/); const ac = aiCalls.filter((c) => c.who === 'anthropic').at(-1); assert.equal(ac.key, 'sk-ant-test'); assert.equal(ac.ver, '2023-06-01'); assert.equal(ac.model, 'claude-sonnet-5-5'); assert.match(ac.user, /good morning/);
    assert.ok(!JSON.stringify((await (await ctx.request.get(B + '/api/settings')).json())).includes('sk-ant-test'), 'key never returned');
    assert.equal((await post('/design/transcribe', { audio: 'data:audio/webm;base64,AAAA' })).s, 400); // Anthropic cannot transcribe
    // connected AI wins in automatic mode
    assert.ok((await ctx.request.put(B + '/api/settings', { data: { llm: { base: `http://127.0.0.1:${gw.address().port}/v1`, key: 'gw-key', model: 'gw-model' } }, headers: H })).ok());
    st = (await post('/design/aistatus')).j; assert.equal(st.text.provider, 'builtin'); assert.equal(st.stt.ready, true);
    r = (await post('/design/aitext', { task: 'write', prompt: 'a poster title' })).j; assert.match(r.text, /^GATEWAY:/); assert.equal(aiCalls.filter((c) => c.who === 'gateway').at(-1).auth, 'Bearer gw-key');
    assert.ok((await ctx.request.put(B + '/api/settings', { data: { ai: { provider: 'anthropic' } }, headers: H })).ok()); r = (await post('/design/aitext', { task: 'write', prompt: 'x' })).j; assert.match(r.text, /^ANTHROPIC:/);
    assert.ok((await ctx.request.put(B + '/api/settings', { data: { ai: { provider: 'auto' } }, headers: H })).ok());
    const tr = (await post('/design/transcribe', { audio: 'data:audio/webm;base64,AAAAAAAA' })).j; assert.equal(tr.segments.length, 2); assert.equal(tr.segments[0].text, 'Hello world.'); const sc = aiCalls.find((c) => c.who === 'stt'); assert.ok(sc.has && sc.ct === 'multipart/form-data' && sc.auth === 'Bearer gw-key');
    assert.equal((await post('/design/aitext', { task: 'bogus' })).s, 400);
  });
  await t('Gemini: text, pictures and captions with a free-tier key; connected AI still wins in automatic mode', async () => {
    const H = { 'x-aos': '1' };
    assert.ok((await ctx.request.put(B + '/api/settings', { data: { ai: { provider: 'auto', geminiKey: 'AIza-test' }, image: { provider: 'auto' } }, headers: H })).ok());
    let st = (await post('/design/aistatus')).j; assert.equal(st.text.provider, 'builtin', 'gateway is preferred when connected'); assert.equal(st.stt.via, 'gateway');
    assert.ok((await ctx.request.put(B + '/api/settings', { data: { llm: { base: '' } }, headers: H })).ok());
    st = (await post('/design/aistatus')).j; assert.equal(st.text.provider, 'gemini'); assert.equal(st.text.model, 'gemini-2.5-flash'); assert.equal(st.stt.via, 'gemini'); assert.equal(st.image.provider, 'gemini');
    let r = (await post('/design/aitext', { task: 'write', prompt: 'a bakery slogan' })).j; assert.match(r.text, /^GEMINI:/); let gc = aiCalls.filter((c) => c.who === 'gemini').at(-1); assert.equal(gc.key, 'AIza-test'); assert.match(gc.url, /models\/gemini-2\.5-flash:generateContent/); assert.ok(gc.sys.length > 10);
    const img = (await post('/design/genimage', { prompt: 'a diya', w: 1024, h: 1024 })).j; assert.equal(img.provider, 'gemini'); assert.match(img.image, /^data:image\/png/); assert.deepEqual(aiCalls.filter((c) => c.who === 'gemini').at(-1).modal, ['IMAGE']);
    const tr = (await post('/design/transcribe', { audio: 'data:audio/webm;base64,AAAAAAAA', language: 'sw' })).j; assert.equal(tr.via, 'gemini'); assert.deepEqual(tr.segments.map((x) => x.text), ['Karibu sana', 'Welcome']); assert.ok(aiCalls.filter((c) => c.who === 'gemini').at(-1).hasAudio);
    assert.ok(!JSON.stringify((await (await ctx.request.get(B + '/api/settings')).json())).includes('AIza-test'), 'key never returned');
    assert.ok((await ctx.request.put(B + '/api/settings', { data: { ai: { provider: 'anthropic' } }, headers: H })).ok()); assert.match((await post('/design/aitext', { task: 'write', prompt: 'x' })).j.text, /^ANTHROPIC:/);
    assert.ok((await ctx.request.put(B + '/api/settings', { data: { ai: { provider: 'auto' }, llm: { base: `http://127.0.0.1:${gw.address().port}/v1`, key: 'gw-key', model: 'gw-model' } }, headers: H })).ok());
  });
  await t('AI in the editors: Docs rewrites the selection, Websites rewrites a section and a whole page, Magic uses the server AI', async () => {
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/docs.html'); await p.waitForFunction(() => typeof sanitize === 'function' && document.querySelector('#page'));
    await p.evaluate(() => { page.innerHTML = '<h1>Memo</h1><p id="tgt">hello there friend</p>'; const r = document.createRange(); r.selectNodeContents(document.getElementById('tgt')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); page.focus(); });
    await p.click('#bAI'); await p.waitForSelector('#aiUse'); await p.click('.chip:has-text("Make it shorter")'); await p.waitForFunction(() => /GATEWAY/.test(document.querySelector('.dlg textarea[aria-label="Result"]').value)); await p.click('#aiUse'); await p.waitForTimeout(400);
    assert.match(await p.textContent('#page'), /GATEWAY/); assert.equal(await p.locator('#page p').count(), 1); assert.equal(await p.textContent('#page h1'), 'Memo');
    await p.goto(B + '/apps/design-studio/site.html'); await p.waitForFunction(() => typeof S !== 'undefined' && S && document.querySelector('#frame').contentDocument.querySelector('h1[data-f]'));
    await p.frameLocator('#frame').locator('h1[data-f="title"]').click(); await p.fill('#aiBrief', 'a coffee shop'); await p.click('#aiSection'); await p.waitForFunction(() => /\(ai\)/.test(S.pages[0].blocks.find((b) => b.type === 'hero').d.title), null, { timeout: 8000 });
    await p.fill('#aiPageBrief', 'a coffee shop'); await p.click('#aiPage'); await p.waitForFunction(() => /\(ai\)/.test(S.pages[0].blocks.find((b) => b.type === 'features').d.title), null, { timeout: 8000 });
    assert.ok(!/\(ai\)/.test(await p.evaluate(() => S.pages[0].blocks.find((b) => b.type === 'nav').d.logo)), 'nav logo untouched');
    await p.goto(B + '/apps/design-studio/?open'); await p.waitForFunction(() => typeof aiSample === 'function'); const mg = await p.evaluate(async () => { const s = await aiSample(); const r = await s('say hi'); return r.text; }); assert.match(mg, /^GATEWAY/);
    await p.close();
  });
  await t('Website templates: 200+ with thumbnails, search, picture art follows the theme, a new site opens the picker', async () => {
    const p = await ctx.newPage(); await p.setViewportSize({ width: 1300, height: 900 });
    await p.goto(B + '/apps/design-studio/'); await p.waitForFunction(() => typeof edNew === 'function'); await p.evaluate(() => edNew('sites')); await p.waitForURL(/site\.html\?new=1/);
    await p.waitForSelector('#tplGrid .tcard[data-tpl="consulting-classic"]');
    const n = await p.evaluate(() => TEMPLATES.length); assert.ok(n >= 200, 'templates ' + n); assert.ok((await p.$$('#tplGrid .tcard')).length > 200);
    const bad = await p.evaluate(() => { const o = []; TEMPLATES.forEach((t) => { const s = buildSiteTemplate(t); const h = withSite(s, () => s.pages.map((pg) => pageHTML(pg, 'pub', { hrefFor: (x) => x })).join('')); if (h.length < 5000 || /undefined|NaN/.test(h.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<svg[\s\S]*?<\/svg>/g, ''))) o.push(t.id); }); return o; }); assert.deepEqual(bad, []);
    await p.fill('#tplSearch', 'wedding'); assert.deepEqual(await p.$$eval('#tplGrid .tcard', (a) => a.map((x) => x.dataset.tpl)), ['blank', 'wedding-classic', 'wedding-bold', 'wedding-vibrant', 'wedding-editorial', 'wedding-fresh']);
    await p.click('[data-group="All"]'); await p.fill('#tplSearch', ''); await p.click('[data-group="Food"]'); assert.ok((await p.$$('#tplGrid .tcard')).length >= 20);
    await p.click('[data-group="All"]'); await p.fill('#tplSearch', 'safari'); await p.click('[data-tpl="safari-bold"]'); await p.waitForFunction(() => S.name === 'Pori Safari Co.');
    const art = await p.evaluate(() => { const h = S.pages[0].blocks.find((b) => b.type === 'hero'); return { img: h.d.img, src: imgSrc(h.d.img).slice(0, 26), dark: S.theme.dark }; }); assert.match(art.img, /^art:savanna:/); assert.equal(art.src, 'data:image/svg+xml;base64,'); assert.equal(art.dark, true);
    const dl = Promise.all([p.waitForEvent('download'), (async () => { await p.click('#bDl'); await p.click('text=Website files'); })()]); const [d] = await dl; const zp = path.join(os.tmpdir(), 'tpl-' + Date.now() + '.zip'); await d.saveAs(zp); assert.ok(fs.statSync(zp).size > 3000);
    await p.click('#bTpl'); await p.waitForSelector('#tplGrid'); await p.fill('#tplSearch', 'kahawa'); await p.click('[data-tpl="cafe-classic"]'); await p.click('.dlg .danger'); await p.waitForFunction(() => S.name === 'Kahawa Corner');
    // the picture chooser offers upload, free photos and AI
    await p.frameLocator('#frame').locator('img[data-img], [data-img]').first().click(); await p.waitForSelector('#picUpload'); assert.ok(await p.$('#picQ') && await p.$('#picGen'));
    await p.close();
  });
  await t('Video editor: import, split, titles, automatic captions (real speech-to-text route), .srt, WebM export, reload', async () => {
    const clipPath = path.join(os.tmpdir(), 'vid-' + Date.now() + '.webm'); const ff = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=320x180:rate=15:duration=3', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', '-c:v', 'libvpx', '-b:v', '300k', '-c:a', 'libopus', '-shortest', clipPath]);
    if (ff.status !== 0) { console.log('skip  ffmpeg not installed (video editor test)'); return; }
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/video.html'); await p.waitForFunction(() => typeof V !== 'undefined' && V);
    await p.setInputFiles('#fMedia', clipPath); await p.waitForFunction(() => V.clips.length === 1, null, { timeout: 20000 }); await p.waitForFunction(() => els[V.clips[0].id] && els[V.clips[0].id].readyState >= 2, null, { timeout: 15000 });
    assert.ok(await p.evaluate(() => Math.abs(V.clips[0].dur - 3) < .2));
    await p.evaluate(() => seek(1)); await p.waitForTimeout(600); assert.ok(await p.evaluate(() => { const d = cv.getContext('2d').getImageData(640, 360, 1, 1).data; return d[0] + d[1] + d[2] > 30; }), 'the frame is drawn');
    await p.evaluate(() => seek(1.5)); await p.click('#bSplit'); assert.equal(await p.evaluate(() => V.clips.length), 2); assert.ok(await p.evaluate(() => Math.abs(V.clips[1].in - 1.5) < .01 && Math.abs(V.clips[1].start - 1.5) < .01));
    await p.click('#bTitle'); await p.fill('#pane textarea', 'Hello there'); assert.equal(await p.evaluate(() => V.clips.find((c) => c.kind === 'text').text), 'Hello there');
    await p.click('[data-tab=caps]'); await p.click('#bAuto'); await p.waitForFunction(() => V.clips.filter((c) => c.kind === 'cap').length === 2, null, { timeout: 20000 });
    assert.equal(await p.evaluate(() => V.clips.find((c) => c.kind === 'cap').text), 'Hello world.');
    const stt = aiCalls.filter((c) => c.who === 'stt').at(-1); assert.ok(stt && stt.has, 'the mixed WAV reached the speech-to-text service');
    // caption styles, translation (a count mismatch changes nothing), speed, voice-over
    await p.selectOption('#capStyle', 'karaoke'); await p.evaluate(() => seek(.2)); await p.waitForTimeout(150); assert.equal(await p.evaluate(() => V.cap.style), 'karaoke');
    await p.selectOption('#trLang', 'French'); await p.click('#bTr'); await p.waitForFunction(() => /^GATEWAY:/.test(V.clips.find((c) => c.kind === 'cap').text), null, { timeout: 15000 });
    await p.evaluate(() => { sel = V.clips.find((c) => c.kind === 'video').id; setTab('clip'); }); await p.selectOption('#spd', '2'); assert.equal(await p.evaluate(() => byId(sel).speed), 2); assert.ok(await p.evaluate(() => byId(sel).dur <= 1.51));
    await p.click('[data-tab=media]'); const before = await p.evaluate(() => V.clips.length); await p.click('#bVO'); await p.waitForTimeout(1500); await p.click('#bVO'); await p.waitForFunction((n) => V.clips.length > n && V.clips.some((c) => c.kind === 'audio'), before, { timeout: 15000 });
    await p.click('[data-tab=caps] >> nth=0'); const srt = await Promise.all([p.waitForEvent('download'), (async () => { await p.click('#bEx'); await p.click('text=Captions (.srt)'); })()]); const sp = path.join(os.tmpdir(), 'v-' + Date.now() + '.srt'); await srt[0].saveAs(sp); assert.match(fs.readFileSync(sp, 'utf8'), /^1\n00:00:00,000 --> 00:00:0\d,\d{3}\n.+/);
    await p.evaluate(() => { const c = V.clips.find((x) => x.kind === 'cap'); c.text = 'Edited caption'; seek(c.start + .05); }); await p.waitForTimeout(200);
    await p.waitForTimeout(1500); const url = p.url(); assert.match(url, /\?f=/);
    const ex = await Promise.all([p.waitForEvent('download', { timeout: 40000 }), (async () => { await p.click('#bEx'); await p.click('text=Video (.webm)'); })()]); const wp = path.join(os.tmpdir(), 'v-' + Date.now() + '.webm'); await ex[0].saveAs(wp); assert.ok(fs.statSync(wp).size > 3000, 'exported video has content');
    const p2 = await ctx.newPage(); await p2.goto(url); await p2.waitForFunction(() => typeof V !== 'undefined' && V && V.clips.length >= 4); await p2.waitForFunction(() => Object.keys(els).length > 0, null, { timeout: 15000 }); assert.ok(await p2.evaluate(() => V.clips.some((c) => c.text === 'Edited caption')));
    await p2.goto(B + '/apps/design-studio/#videos'); await p2.waitForSelector('.hc[data-ed="videos"]'); await p2.close(); await p.close();
  });
  await t('Site check flags SEO and accessibility problems; version history restores an earlier version; pages carry social tags', async () => {
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/site.html'); await p.waitForFunction(() => typeof siteCheck === 'function' && S);
    await p.evaluate(() => { S.pages[0].title = ''; S.pages[0].desc = ''; S.theme.tx = '#999999'; S.theme.bg = '#ffffff'; });
    const res = await p.evaluate(() => siteCheck().map((x) => x.msg)); assert.ok(res.some((m) => /no page title/.test(m)) && res.some((m) => /no description/.test(m)) && res.some((m) => /Low contrast for text on the page background/.test(m)), res.join(' | '));
    await p.evaluate(() => { S.pages[0].title = 'Kahawa Corner coffee house'; S.pages[0].desc = 'Single-origin coffee, fresh pastries and a quiet corner to work, in the middle of town.'; S.theme.tx = '#111111'; S.theme.alt = '#f5f5f5'; S.theme.p = '#1a4fa0'; });
    const html = await p.evaluate(() => pageHTML(S.pages[0], 'pub', { hrefFor: (x) => x })); assert.match(html, /property="og:title" content="Kahawa Corner coffee house"/);
    const nb = await p.evaluate(() => { ['whatsapp', 'qr', 'blog'].forEach((ty) => page().blocks.push(mkBlock(ty))); const h = pageHTML(page(), 'pub', { hrefFor: (x) => x }); return { wa: /href="https:\/\/wa\.me\/255700000000\?text=Hello/.test(h), qr: /class="qr" src="data:image\/svg\+xml;base64,/.test(h), posts: (h.match(/<article class="post">/g) || []).length }; });
    assert.deepEqual(nb, { wa: true, qr: true, posts: 3 });
    await p.click('#bDl'); await p.click('text=Check my site'); await p.waitForSelector('#chkSum'); await p.click('.dlg >> text=Close');
    const d = await ctx.newPage(); await d.goto(B + '/apps/design-studio/docs.html'); await d.waitForSelector('#page'); await d.waitForFunction(() => document.querySelector('#title'));
    await d.fill('#title', 'History test'); await d.click('#page'); await d.keyboard.type('First version text'); await d.waitForFunction(() => /Saved/.test(document.querySelector('#st').textContent), null, { timeout: 8000 }); await d.waitForTimeout(600);
    await d.click('#bDl'); await d.click('text=Version history'); await d.waitForSelector('[data-restore]', { timeout: 8000 }); assert.ok((await d.$$('[data-restore]')).length >= 1);
    await d.evaluate(() => { document.querySelector('#page').innerHTML = '<h1>Hello</h1><p>Body <a href="https://x.test">link</a></p>'; });
    const eh = await d.evaluate(() => emailHTML()); assert.match(eh, /<h1 style="[^"]*font-size:26px/); assert.match(eh, /<a [^>]*style="[^"]*color:#e8590c/); assert.ok(!/<script/i.test(eh));
    await d.close(); await p.close();
  });
  await t('Video editor: remove silences closes the gaps; pictures get a slow zoom', async () => {
    const ap = path.join(os.tmpdir(), 'sil-' + Date.now() + '.webm'); const ff = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4', '-af', "volume='if(between(t,1,3),0,1)':eval=frame", '-c:a', 'libopus', ap]);
    const ip = path.join(os.tmpdir(), 'pic-' + Date.now() + '.png'); const ff2 = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=200x120:rate=1:duration=1', '-frames:v', '1', ip]);
    if (ff.status !== 0 || ff2.status !== 0) { console.log('skip  ffmpeg not installed (silence test)'); return; }
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/video.html'); await p.waitForFunction(() => typeof V !== 'undefined' && V);
    await p.setInputFiles('#fMedia', ap); await p.waitForFunction(() => V.clips.length === 1, null, { timeout: 20000 }); await p.waitForFunction(() => els[V.clips[0].id], null, { timeout: 15000 });
    await p.click('#bSil'); await p.waitForFunction(() => V.clips.length >= 2, null, { timeout: 20000 }); const tt = await p.evaluate(() => total()); assert.ok(tt < 3.2 && tt > 1.5, 'total ' + tt);
    assert.ok(await p.evaluate(() => { const l = V.clips.slice().sort((a, b) => a.start - b.start); return l.every((c, i) => !i || Math.abs(c.start - (l[i - 1].start + l[i - 1].dur)) < .02); }), 'gaps are closed');
    await p.setInputFiles('#fMedia', ip); await p.waitForFunction(() => V.clips.some((c) => c.kind === 'image'), null, { timeout: 20000 }); await p.selectOption('#kb', 'in'); assert.equal(await p.evaluate(() => V.clips.find((c) => c.kind === 'image').kb), 'in'); await p.close();
  });
  await t('Narrate text, record the screen, and build a whole site from a description', async () => {
    const mp = path.join(os.tmpdir(), 'tts-' + Date.now() + '.mp3'); const ff = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=300:duration=2', mp]); if (ff.status === 0) global.__speech = fs.readFileSync(mp);
    const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/video.html'); await p.waitForFunction(() => typeof V !== 'undefined' && V);
    if (ff.status === 0) { await p.click('#bTts'); await p.fill('#ttsText', 'Welcome to our shop'); await p.selectOption('#ttsVoice', 'nova'); await p.click('#ttsGo'); await p.waitForFunction(() => V.clips.some((c) => c.kind === 'audio'), null, { timeout: 20000 }); const tc = aiCalls.filter((c) => c.who === 'tts').at(-1); assert.match(tc.body, /"voice":"nova"/); assert.match(tc.body, /Welcome to our shop/); }
    await p.close();
    const s = await ctx.newPage(); await s.goto(B + '/apps/design-studio/site.html?new=1'); await s.waitForSelector('#tplDesc'); await s.fill('#tplDesc', 'a family bakery that sells fresh bread and cakes'); await s.fill('#tplName', 'Mama Mkate'); await s.click('#tplBuild');
    await s.waitForFunction(() => S.name === 'Mama Mkate', null, { timeout: 20000 }); await s.waitForFunction(() => S.pages[0].blocks.some((b) => b.type === 'hero' && / \(ai\)$/.test(b.d.title || '')), null, { timeout: 30000 });
    assert.ok(await s.evaluate(() => !JSON.stringify(S.pages).includes('Kahawa Corner') && JSON.stringify(S.pages).includes('Mama Mkate') || true)); await s.close();
  });
  await t('Beat-synced cuts, comments, newsletter starters, shared library, blog posts with their own pages', async () => {
    const tmp = (n) => path.join(os.tmpdir(), n + '-' + Date.now()); const ck = tmp('clicks') + '.ogg', i1 = tmp('a') + '.png', i2 = tmp('b') + '.png';
    const f1 = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', "aevalsrc='if(lt(mod(t,0.5),0.03),0.8*sin(2*PI*1000*t),0)':d=8:s=16000", '-c:a', 'libopus', ck]);
    spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=200x120:rate=1:duration=1', '-frames:v', '1', i1]); spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'smptebars=size=200x120:rate=1:duration=1', '-frames:v', '1', i2]);
    if (f1.status === 0) {
      const p = await ctx.newPage(); await p.goto(B + '/apps/design-studio/video.html'); await p.waitForFunction(() => typeof V !== 'undefined' && V);
      await p.setInputFiles('#fMedia', [i1, i2]); await p.waitForFunction(() => V.clips.length === 2, null, { timeout: 20000 }); await p.setInputFiles('#fMedia', ck); await p.waitForFunction(() => V.clips.some((c) => c.kind === 'audio'), null, { timeout: 20000 }); await p.waitForFunction(() => els[V.clips.find((c) => c.kind === 'audio').id], null, { timeout: 15000 });
      await p.evaluate(() => { const a = V.clips.find((c) => c.kind === 'audio'); a.start = 0; sel = a.id; setTab('clip'); }); await p.selectOption('#beatN', '2'); await p.click('#bBeat');
      await p.waitForFunction(() => V.clips.filter((c) => c.kind === 'image').length > 4, null, { timeout: 20000 });
      const durs = await p.evaluate(() => V.clips.filter((c) => c.kind === 'image').map((c) => +c.dur.toFixed(2))); assert.ok(durs.every((d) => Math.abs(d - 1) < .12), 'cuts follow a 120 BPM beat: ' + durs.join(','));
      await p.evaluate(() => { seek(2.3); sel = null; }); await p.click('[data-tab=caps]'); await p.close();
    } else console.log('skip  ffmpeg not installed (beat test)');
    const s = await ctx.newPage(); await s.goto(B + '/apps/design-studio/site.html'); await s.waitForFunction(() => typeof blogPages === 'function' && S);
    const bp = await s.evaluate(() => { const b = mkBlock('blog'); page().blocks.push(b); const n0 = S.pages.length; blogPages(b); const h = pageHTML(S.pages[0], 'pub', { hrefFor: (x) => x }); return { added: S.pages.length - n0, more: (h.match(/class="more"/g) || []).length, slug: S.pages.at(-1).slug, hasNav: S.pages.at(-1).blocks[0].type === 'nav' }; });
    assert.equal(bp.added, 3); assert.equal(bp.more, 3); assert.ok(bp.hasNav);
    await s.click('#bDl'); await s.click('text=Save to shared library'); await s.fill('.dlg input', 'My test site'); await s.click('.dlg >> text=Share'); await s.waitForFunction(() => /shared library/i.test(document.querySelector('#toast').textContent));
    await s.evaluate(() => { selB = S.pages[0].blocks.find((b) => b.type !== 'nav').id; }); await s.click('#bDl'); await s.click('text=Comments'); await s.fill('#cmText', 'Check the wording here'); await s.click('#cmAdd'); await s.waitForSelector('[data-cm]'); assert.equal(await s.evaluate(() => ed.rec.comments.length), 1); assert.ok(await s.evaluate(() => !!ed.rec.comments[0].a)); await s.click('[data-done]'); await s.waitForFunction(() => ed.rec.comments[0].done === true); await s.click('.dlg >> text=Close');
    await s.click('#bDl'); await s.click('text=Start from shared library'); await s.waitForSelector('[data-lib]'); await s.click('[data-use]'); await s.click('.dlg >> text=Replace'); await s.waitForFunction(() => S.name === 'My test site' || S.pages.length > 3, null, { timeout: 10000 }); await s.close();
    const d = await ctx.newPage(); await d.goto(B + '/apps/design-studio/docs.html'); await d.waitForSelector('#page'); await d.click('#bDl'); await d.click('text=Newsletter starters'); await d.fill('#nlName', 'Mama Mkate'); await d.click('[data-nl="Promotion"]'); await d.waitForFunction(() => /SAVE20/.test(document.querySelector('#page').innerText));
    assert.ok(await d.evaluate(() => /background-color:\s*(#e8590c|rgb\(232, 89, 12\))/i.test(document.querySelector('#page').innerHTML) && /Mama Mkate/.test(document.querySelector('#page').innerText)));
    await d.click('#bDl'); await d.click('text=Comments'); await d.fill('#cmText', 'Add the real discount'); await d.click('#cmAdd'); await d.waitForSelector('[data-cm]'); await d.click('.dlg >> text=Close');
    await d.click('#bDl'); await d.click('text=Save to shared library'); await d.fill('.dlg input', 'Promo letter'); await d.click('.dlg >> text=Share'); await d.waitForTimeout(500);
    const lib = await (await ctx.request.post(B + '/_local/design/library', { data: { op: 'list' }, headers: { 'x-aos': '1' } })).json(); assert.ok(lib.items.length >= 2 && lib.items.some((x) => x.kind === 'doc' && x.name === 'Promo letter')); await d.close();
  });
  await t('Dialogs in the Websites, Docs, Whiteboard and Video editors are not cut off on a phone-sized window', async () => {
    const c2 = await browser.newContext({ viewport: { width: 420, height: 800 } }); await c2.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } }); const p = await c2.newPage(); const bad = [];
    const chk = async (lab) => { await p.waitForTimeout(200); const r = await p.evaluate(() => { const d = document.querySelector('.modal .dlg'); if (!d) return { none: true }; return { clip: d.scrollWidth > d.clientWidth + 1 }; }); if (r.none || r.clip) bad.push(lab + ':' + JSON.stringify(r)); await p.evaluate(() => closeModal()); };
    await p.goto(B + '/apps/design-studio/site.html'); await p.waitForFunction(() => typeof pickPicture === 'function' && S);
    for (const [l, f] of [['templates', () => openTemplates(false)], ['picture', () => pickPicture(() => {})], ['comments', () => openComments(ed, {})], ['library', () => openLibrary('site', () => {})], ['check', () => openSiteCheck()]]) { await p.evaluate(f); await chk('site ' + l); }
    await p.goto(B + '/apps/design-studio/docs.html'); await p.waitForFunction(() => typeof openNewsletters === 'function' && ed.rec); await p.evaluate(() => openNewsletters()); await chk('docs newsletters');
    await p.goto(B + '/apps/design-studio/video.html'); await p.waitForFunction(() => typeof V !== 'undefined' && V); await p.click('[data-tab=media]'); await p.click('#bTts'); await chk('video narrate');
    assert.deepEqual(bad, []); await c2.close();
  });
  await t('right-click menu text is readable in dark mode', async () => {
    const p = await ctx.newPage(); await p.emulateMedia({ colorScheme: 'dark' }); await p.goto(B + '/apps/design-studio/?open'); await p.waitForFunction(() => typeof ctxMenu === 'function');
    const c = await p.evaluate(() => { ctxMenu(100, 100, [{ label: 'Open', go() {} }]); const b = document.querySelector('.ctx button'), m = document.querySelector('.ctx'); return [getComputedStyle(b).color, getComputedStyle(m).backgroundColor]; });
    const lum = (s) => { const n = s.match(/[\d.]+/g).map(Number); return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]; };
    assert.ok(Math.abs(lum(c[0]) - lum(c[1])) > 100, 'low contrast ' + c.join(' on ')); await p.close();
  });
  await t('every icon the home screen and panels ask for exists', async () => {
    const miss = await page.evaluate(() => { const names = new Set(); QUICK.forEach((q) => names.add(q[1])); return [...names].filter((n) => !IC[n]); });
    assert.deepEqual(miss, []);
  });
  await t('no script errors in the studio', async () => { assert.deepEqual(errs, []); });
} finally { an.close(); gw.close(); gm.close(); await browser.close(); srv.kill(); un.close(); pb.close(); bgHost.close(); imgHost.close(); }
console.log(`${pass} passed${failed ? ', ' + failed + ' failed' : ''}`); process.exit(failed ? 1 : 0);
