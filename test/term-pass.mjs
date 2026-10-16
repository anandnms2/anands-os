// Terminal: sign in to the server with a password instead of a key.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-fk-')); fs.writeFileSync(path.join(bin, 'ssh'), '#!/bin/bash\nstty -echo\nprintf "anand@host\'s password: "\nread -rs pw\necho\nif [ "$pw" = "s3cret" ]; then echo WELCOME-OK; else echo DENIED; fi\nsleep 5\n', { mode: 0o755 });
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-tp-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PATH: bin + ':' + process.env.PATH, PORT: String(port), DATA_DIR: data, APP_PASSWORD: 'pw' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
const H = { 'x-aos': '1', 'content-type': 'application/json' };
async function out(id, ck, ms = 2500) { const ac = new AbortController(); setTimeout(() => ac.abort(), ms); let txt = ''; try { const r = await fetch(B + '/api/term/' + id + '/out', { headers: { cookie: ck }, signal: ac.signal }); if (process.env.DBG) console.log('status', r.status); const rd = r.body.getReader(), dec = new TextDecoder(); for (;;) { const { value, done } = await rd.read(); if (done) break; for (const l of dec.decode(value).split('\n')) if (l.startsWith('data: ')) txt += Buffer.from(l.slice(6), 'base64').toString(); } } catch {} return txt; }
try {
  const ck = (await fetch(B + '/auth/password', { method: 'POST', headers: H, body: JSON.stringify({ password: 'pw' }) })).headers.get('set-cookie').split(';')[0];
  const put = (b) => fetch(B + '/api/settings', { method: 'PUT', headers: { ...H, cookie: ck }, body: JSON.stringify({ terminal: b }) });
  const open = (b) => fetch(B + '/api/term/open', { method: 'POST', headers: { ...H, cookie: ck }, body: JSON.stringify({ target: 'host', confirm: 'OPEN', password: 'pw', ...b }) });
  await t('saving a password makes the server ready without a key', async () => {
    assert.equal((await put({ host: 'srv.example', user: 'anand', auth: 'password', pass: 's3cret' })).status, 200);
    const s = await (await fetch(B + '/api/term/status', { headers: { cookie: ck } })).json(); assert.equal(s.hostReady, true); assert.equal(s.auth, 'password'); assert.equal(s.passSet, true);
    assert.ok(!JSON.stringify(await (await fetch(B + '/api/settings', { headers: { cookie: ck } })).json()).includes('s3cret'));
  });
  await t('the saved password is typed at the prompt', async () => { const r = await open({}); assert.equal(r.status, 200); const { id } = await r.json(); if (process.env.DBG) console.log('opened', id, await (await fetch(B + '/api/term/status', { headers: { cookie: ck } })).text()); const o = await out(id, ck, 3500); console.log(JSON.stringify(o)); assert.ok(o.includes('WELCOME-OK'), o); assert.ok(!o.includes('s3cret')); });
  await t('without a saved password it asks, and a typed one works', async () => {
    await put({ clearPass: true }); const bad = await open({}); assert.equal(bad.status, 400);
    const r = await open({ sshpass: 's3cret' }); assert.equal(r.status, 200); assert.ok((await out((await r.json()).id, ck)).includes('WELCOME-OK'));
  });
} finally { srv.kill(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
