// Notes (Joplin Server) inside the OS: server proxy, settings, app page, Suite tile, Desktop icon.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-nt-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
import { start as fakeJoplin, EMAIL, PASSWORD, files, log, blobs } from './fixtures/fake-joplin.mjs';
const fport = port + 1, fake = await fakeJoplin(fport);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
const id = (n) => n.toString(16).padStart(32, '0');
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const lr = await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } }); assert.ok(lr.ok());
  const H = { 'x-aos': '1' }; const get = async (p) => { const r = await ctx.request.get(B + '/api/joplin' + p); return { s: r.status(), j: await r.json().catch(() => ({})) }; };
  const send = async (m, p, data) => { const r = await ctx.request.fetch(B + '/api/joplin' + p, { method: m, data, headers: H }); return { s: r.status(), j: await r.json().catch(() => ({})) }; };
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message));
  await t('needs the login, rejects a wrong password, never echoes it', async () => {
    await ctx.request.put(B + '/api/settings', { data: { joplin: { url: 'http://127.0.0.1:' + fport, email: EMAIL } }, headers: H });
    let r = await get('/status'); assert.equal(r.j.connected, false); assert.match(r.j.reason, /password/i);
    await ctx.request.put(B + '/api/settings', { data: { joplin: { pass: 'wrong' } }, headers: H });
    r = await get('/status'); assert.match(r.j.reason, /refused the email or password/i);
    const s = await (await ctx.request.get(B + '/api/settings')).json(); assert.equal(s.joplin.passSet, true); assert.equal(s.joplin.email, EMAIL); assert.ok(!JSON.stringify(s).includes('wrong'));
    await ctx.request.put(B + '/api/settings', { data: { joplin: { pass: PASSWORD } }, headers: H });
    r = await get('/status'); assert.equal(r.j.connected, true); assert.equal(r.j.notes, 4);
    const tr = await (await ctx.request.post(B + '/api/settings/test', { data: { target: 'joplin' }, headers: H })).json(); assert.equal(tr.connected, true);
  });
  await t('lists notebooks, tags, counts; filters and searches', async () => {
    const m = (await get('/meta')).j; assert.deepEqual(m.folders.map((f) => f.title), ['Home', 'Trips', 'Work']); assert.equal(m.tags[0].title, 'ops'); assert.equal(m.counts.all, 4); assert.equal(m.counts.todo, 1); assert.equal(m.counts.trash, 1);
    assert.equal((await get('/notes')).j.total, 4);
    assert.equal((await get('/notes?q=fleet')).j.results[0].title, 'Meeting notes');
    assert.equal((await get('/notes?folder=' + id(1))).j.total, 2);
    assert.equal((await get('/notes?tag=' + id(20))).j.total, 1);
    assert.equal((await get('/notes?view=todo')).j.results[0].title, 'Trip checklist');
    assert.equal((await get('/notes?view=trash')).j.results[0].title, 'Old note');
    const lock = (await get('/notes')).j.results.find((n) => n.locked); assert.ok(lock); assert.equal(lock.snippet.includes('JED'), false);
    assert.equal((await send('PUT', '/notes/' + id(14), { title: 'x' })).s, 409);
  });
  await t('editing keeps Joplin properties; tags, to-do, move and trash are written back', async () => {
    const g = (await get('/notes/' + id(11))).j; assert.equal(g.body, '# Agenda\n\nDiscuss **fleet** budget\nLine two');
    const r = await send('PUT', '/notes/' + id(11), { title: 'Meeting 2', body: 'new body\n\nsecond para', folder: id(2), tags: ['ops', 'Fresh'], base: g.rev }); assert.equal(r.s, 200, JSON.stringify(r.j));
    const f = files.get(id(11) + '.md'); assert.ok(f.startsWith('Meeting 2\n\nnew body\n\nsecond para\n\nid: ' + id(11))); assert.ok(f.includes('parent_id: ' + id(2))); assert.ok(f.includes('markup_language: 1')); assert.ok(f.trim().endsWith('type_: 1')); assert.ok(!f.includes('updated_time: 2026-10-10T08:00:00.000Z\nis_conflict: 0\nis_todo: 0\ntodo_completed: 0\nuser_created_time: 2026-10-10T08:00:00.000Z\nuser_updated_time: 2026-10-10T08:00:00.000Z'));
    const tags = (await get('/notes/' + id(11))).j.tags.map((x) => x.title).sort(); assert.deepEqual(tags, ['fresh', 'ops']);
    assert.equal((await send('PUT', '/notes/' + id(11), { tags: ['ops'], base: r.j.rev })).s, 200); assert.ok(log.some((l) => l.startsWith('DELETE ')));
    assert.equal((await send('PUT', '/notes/' + id(11), { title: 'stale', base: 1 })).s, 409);
    assert.equal((await send('PUT', '/notes/' + id(10), { done: true })).s, 200); assert.equal((await get('/notes?view=todo')).j.total, 0);
    assert.equal((await send('POST', '/notes/' + id(12) + '/trash')).s, 200); assert.match(files.get(id(12) + '.md'), /deleted_time: \d{13}/); assert.equal((await get('/notes?view=trash')).j.total, 2);
    assert.equal((await send('POST', '/notes/' + id(12) + '/restore')).s, 200); assert.match(files.get(id(12) + '.md'), /deleted_time: 0\n/);
  });
  await t('creates notebooks and notes in Joplin format', async () => {
    const f = await send('POST', '/folders', { title: 'Ideas', parent: id(1) }); assert.equal(f.s, 201); assert.match(files.get(f.j.id + '.md'), /^Ideas\n\nid: [0-9a-f]{32}\nparent_id: 0{31}1\n/);
    const n = await send('POST', '/notes', { title: 'Fresh', body: 'hi', folder: f.j.id, todo: true }); assert.equal(n.s, 201); assert.match(files.get(n.j.id + '.md'), /^Fresh\n\nhi\n\nid: [0-9a-f]{32}\nparent_id: /); assert.ok(files.get(n.j.id + '.md').includes('is_todo: 1')); assert.equal((await send('POST', '/folders', { title: '  ' })).s, 400);
  });
  await t('app page lists, opens, edits and autosaves a note without exposing the password', async () => {
    await page.goto(B + '/#notes'); await page.waitForSelector('.appframe'); const fr = page.frameLocator('.appframe');
    await fr.locator('.nt-item').first().waitFor(); assert.ok(!(await page.content()).includes(PASSWORD));
    await fr.locator('.nt-item', { hasText: 'Recipe: dosa' }).click(); await fr.locator('#ntb').waitFor(); assert.match(await fr.locator('#ntb').inputValue(), /soak overnight/);
    await fr.locator('#ntb').fill('Rice, lentils and fenugreek'); await fr.locator('#nts', { hasText: 'Saved' }).waitFor({ timeout: 8000 }); assert.ok(files.get(id(12) + '.md').includes('Rice, lentils and fenugreek'));
    await fr.locator('[data-a="preview"]').click(); await fr.locator('#ntp').waitFor(); assert.match(await fr.locator('#ntp').innerText(), /fenugreek/);
    await fr.locator('#ntq').fill('fenugreek'); await page.waitForTimeout(700); assert.equal(await fr.locator('.nt-item').count(), 1);
    await fr.locator('#ntq').fill(''); await page.waitForTimeout(600);
    await fr.locator('.pl-t', { hasText: 'Work' }).click(); await fr.locator('.nt-item').first().waitFor(); assert.match(await fr.locator('#nth').innerText(), /Work/);
    await fr.locator('[data-tab="todo"]').click(); await page.waitForTimeout(500);
  });
  await t('sketch pad saves a picture into the note as a Joplin attachment, and the preview shows it', async () => {
    await page.goto(B + '/#notes'); await page.waitForSelector('.appframe'); const fr = page.frameLocator('.appframe');
    await fr.locator('.nt-item', { hasText: 'Recipe: dosa' }).click(); await fr.locator('#ntb').waitFor(); await fr.locator('[data-a="sketch"]').click(); const cv = fr.locator('#skv'); await cv.waitFor();
    const bb = await cv.boundingBox(); await page.mouse.move(bb.x + 60, bb.y + 60); await page.mouse.down(); await page.mouse.move(bb.x + 200, bb.y + 160, { steps: 8 }); await page.mouse.move(bb.x + 320, bb.y + 90, { steps: 8 }); await page.mouse.up();
    await fr.locator('#sksv').click(); await fr.locator('#ntb').waitFor(); await page.waitForFunction(() => document.querySelector('.appframe').contentDocument.querySelector('#ntb').value.includes('](:/'), null, { timeout: 8000 });
    await fr.locator('#nts', { hasText: 'Saved' }).waitFor({ timeout: 8000 });
    const note = files.get(id(12) + '.md'); const m = note.match(/!\[sketch\]\(:\/([0-9a-f]{32})\)/); assert.ok(m, note);
    assert.ok(blobs.get('.resource/' + m[1]).subarray(1, 4).toString() === 'PNG'); assert.match(files.get(m[1] + '.md'), /^sketch\.png\n\nid: [0-9a-f]{32}\nmime: image\/png\n[\s\S]*file_extension: png\n[\s\S]*type_: 4$/);
    await fr.locator('[data-a="preview"]').click(); const img = fr.locator('#ntp img'); await img.waitFor(); await page.waitForTimeout(500); assert.ok(await img.evaluate((e) => e.complete && e.naturalWidth > 0));
    const r = await ctx.request.get(B + '/api/joplin/res/' + m[1]); assert.equal(r.status(), 200); assert.equal(r.headers()['content-type'], 'image/png'); assert.match(r.headers()['content-security-policy'], /sandbox/);
    assert.equal((await ctx.request.post(B + '/api/joplin/resources', { data: 'x', headers: { ...H, 'content-type': 'text/html' } })).status(), 400);
  });
  await t('Suite tile, Home tile and Desktop icon exist', async () => {
    await page.goto(B + '/#apps'); await page.waitForSelector('.appcat'); assert.equal(await page.locator('.app', { hasText: 'notebooks, tags and to-dos' }).count(), 1);
    await page.goto(B + '/'); await page.waitForSelector('.svc'); assert.ok(await page.locator('.svc', { hasText: 'Notes' }).count() >= 1);
    await page.goto(B + '/#desktop'); await page.waitForSelector('#dkfab'); assert.equal(await page.locator('#dkicons [data-w="tool:notes"]').count(), 1);
  });
  await t('settings card saves the login and connects', async () => {
    await page.goto(B + '/#settings'); await page.waitForSelector('#s_jp'); await page.locator('#s_jp').fill(PASSWORD); await page.locator('[data-k="joplin"]').click(); await page.locator('#r_joplin', { hasText: 'Connected' }).waitFor();
  });
  await t('desktop sticky notes are mirrored into a Sticky Notes notebook in Notes', async () => {
    const dp = await ctx.newPage(); dp.on('pageerror', (e) => errs.push(e.message)); await dp.goto(B + '/'); await dp.waitForSelector('#avatar'); await dp.evaluate(() => AOSDesk.show()); await dp.waitForSelector('#dkstick', { state: 'attached' });
    await dp.evaluate(() => AOSDeskX.snew()); await dp.waitForSelector('.dk-sn'); await dp.locator('.dk-sn .dk-sn-b').first().click(); await dp.keyboard.type('park the trucks at Kapiri'); await dp.waitForTimeout(3500);
    const f = (await get('/meta')).j.folders.find((x) => x.title === 'Sticky Notes'); assert.ok(f, 'notebook created');
    let l = (await get('/notes?folder=' + f.id)).j; assert.equal(l.total, 1); assert.match((await get('/notes/' + l.results[0].id)).j.body, /Kapiri/);
    await dp.keyboard.type(' now'); await dp.waitForTimeout(3500); l = (await get('/notes?folder=' + f.id)).j; assert.equal(l.total, 1); assert.match((await get('/notes/' + l.results[0].id)).j.body, /Kapiri now/);
    const x = dp.locator('.dk-sn .dk-sn-x').first(); await x.dispatchEvent('pointerdown'); await x.dispatchEvent('pointerdown'); await dp.waitForTimeout(3500);
    assert.equal((await get('/notes?folder=' + f.id)).j.total, 0); await dp.close();
  });
  await t('no page errors', async () => { assert.deepEqual(errs, []); });
} finally { await browser.close(); srv.kill(); fake.close(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
