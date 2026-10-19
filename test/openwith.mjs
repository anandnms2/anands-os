// "Open with": the opened copy is written back to the original file, and reopening does not duplicate it.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const { create } = createRequire(import.meta.url)('../desktop/openwith.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-ow-')), data = path.join(tmp, 'data'), docs = path.join(tmp, 'Docs'); fs.mkdirSync(docs);
const orig = path.join(docs, 'report.pdf'); fs.writeFileSync(orig, 'v1');
const errs = []; const ow = create(data, (o, e) => errs.push(o));
let pass = 0, bad = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { bad++; console.log('FAIL ' + n + '\n     ' + String(e.stack || e).split('\n').slice(0, 3).join('\n     ')); } };
const abs = (p) => path.join(data, 'fs', p.replace(/^\//, ''));
let osPath;
await t('the file appears in the OS and has the original name', async () => { osPath = ow.open(orig); assert.match(osPath, /^\/Opened from PC\/[0-9a-f]{8}\/report\.pdf$/); assert.equal(fs.readFileSync(abs(osPath), 'utf8'), 'v1'); });
await t('a save in the app is written back to the original, after the copy settles', async () => { await new Promise((r) => setTimeout(r, 20)); fs.writeFileSync(abs(osPath), 'v2 edited'); ow.poll(); assert.equal(fs.readFileSync(orig, 'utf8'), 'v1'); ow.poll(); assert.equal(fs.readFileSync(orig, 'utf8'), 'v2 edited'); });
await t('a second save is written back too', async () => { await new Promise((r) => setTimeout(r, 20)); fs.writeFileSync(abs(osPath), 'v3'); ow.poll(); ow.poll(); assert.equal(fs.readFileSync(orig, 'utf8'), 'v3'); });
await t('reopening gives the same copy, not a new one', async () => { assert.equal(ow.open(orig), osPath); assert.equal(fs.readdirSync(path.join(data, 'fs', 'Opened from PC')).length, 1); });
await t('an unsaved-to-original edit is not lost when the original changes meanwhile', async () => { await new Promise((r) => setTimeout(r, 20)); fs.writeFileSync(abs(osPath), 'mine'); fs.writeFileSync(orig, 'changed elsewhere'); const fut = new Date(Date.now() + 5000); fs.utimesSync(orig, fut, fut); ow.open(orig); assert.equal(fs.readFileSync(abs(osPath), 'utf8'), 'mine'); });
await t('an unedited copy refreshes when the original changed', async () => { const o2 = path.join(docs, 'b.docx'); fs.writeFileSync(o2, 'one'); const p2 = ow.open(o2); await new Promise((r) => setTimeout(r, 20)); fs.writeFileSync(o2, 'two!!'); const fut = new Date(Date.now() + 9000); fs.utimesSync(o2, fut, fut); ow.open(o2); assert.equal(fs.readFileSync(abs(p2), 'utf8'), 'two!!'); });
await t('a write-back that fails is reported once, and the copy stays', async () => { const o3 = path.join(docs, 'c.xlsx'); fs.writeFileSync(o3, 'x'); const p3 = ow.open(o3); fs.rmSync(docs, { recursive: true }); await new Promise((r) => setTimeout(r, 20)); fs.writeFileSync(abs(p3), 'y'); ow.poll(); ow.poll(); ow.poll(); assert.equal(errs.filter((e) => /c\.xlsx/.test(e)).length, 1); assert.equal(fs.readFileSync(abs(p3), 'utf8'), 'y'); });
console.log(`${pass} passed${bad ? ', ' + bad + ' failed' : ''}`); process.exit(bad ? 1 : 0);
