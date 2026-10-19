/* Copies the owner's account from the online Anands OS into this computer's data folder, so the desktop app shows the same files, mail,
 * calendar, contacts and connection settings and keeps working offline. Web is the source; a file you changed on this computer since the
 * last sync is never overwritten (it is counted as kept). Files removed online are removed here unless changed here. */
const fs = require('node:fs'), fsp = require('node:fs/promises'), path = require('node:path');

async function login(url, password) {
  const r = await fetch(url + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password }), signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'The saved web password was not accepted. Reconnect from the app menu.' : 'Could not sign in to the web version (' + r.status + ').');
  return r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
}
const within = (root, p) => { const a = path.resolve(root, p); return a.startsWith(path.resolve(root) + path.sep) ? a : null; };

async function syncFromWeb({ url, password, dataDir, filesOnly, onProgress }) {
  url = String(url).replace(/\/+$/, '');
  const cookie = await login(url, password), H = { 'x-aos': '1', cookie };
  const mr = await fetch(url + '/api/sync/manifest', { headers: H, signal: AbortSignal.timeout(60000) });
  if (mr.status === 403) throw new Error('Only the owner account can be copied to the desktop app.');
  if (!mr.ok) throw new Error('The web version could not list its data (' + mr.status + '). Update the web version first.');
  const man = await mr.json();
  const sf = path.join(dataDir, 'web-sync.json'); let state = {}; try { state = JSON.parse(fs.readFileSync(sf, 'utf8')); } catch {}
  state.files = state.files || {};
  const res = { downloaded: 0, kept: 0, removed: 0, unchanged: 0, skipped: (man.skipped || []).length, appData: false, errors: 0 };
  const remote = new Map(man.files.map((f) => [f.p, f]));
  const isApp = (p) => !p.startsWith('fs/');
  const todo = [];
  for (const f of man.files) {
    if (filesOnly && isApp(f.p)) continue;
    const abs = within(dataDir, f.p); if (!abs) continue;
    const prev = state.files[f.p]; let st = null; try { st = fs.statSync(abs); } catch {}
    if (prev && prev.size === f.size && prev.mtime === f.mtime && (prev.h || '') === (f.h || '') && st) { res.unchanged++; continue; }
    if (st && prev && Math.abs(st.mtimeMs - prev.local) > 1500) { res.kept++; continue; }
    if (st && !prev && st.size === f.size && Math.floor(st.mtimeMs) === f.mtime) { res.unchanged++; state.files[f.p] = { size: f.size, mtime: f.mtime, local: st.mtimeMs }; continue; }
    todo.push({ f, abs });
  }
  let n = 0;
  async function one({ f, abs }) {
    try {
      const r = await fetch(url + '/api/sync/file?p=' + encodeURIComponent(f.p), { headers: H, signal: AbortSignal.timeout(10 * 60 * 1000) });
      if (!r.ok) throw new Error(String(r.status));
      await fsp.mkdir(path.dirname(abs), { recursive: true });
      const tmp = abs + '.sync-part'; await fsp.writeFile(tmp, Buffer.from(await r.arrayBuffer()));
      const t = new Date(f.mtime); await fsp.utimes(tmp, t, t); await fsp.rename(tmp, abs);
      state.files[f.p] = { size: f.size, mtime: f.mtime, h: f.h, local: fs.statSync(abs).mtimeMs };
      res.downloaded++; if (isApp(f.p)) res.appData = true;
    } catch { res.errors++; }
    n++; if (onProgress) onProgress(n, todo.length);
  }
  const q = todo.slice(); await Promise.all(Array.from({ length: 4 }, async () => { while (q.length) await one(q.shift()); }));
  if (!filesOnly) {
    for (const p of Object.keys(state.files)) {
      if (remote.has(p)) continue;
      const abs = within(dataDir, p); let st = null; try { st = fs.statSync(abs); } catch {}
      if (st && Math.abs(st.mtimeMs - state.files[p].local) <= 1500) { try { fs.rmSync(abs); res.removed++; if (isApp(p)) res.appData = true; } catch {} }
      delete state.files[p];
    }
  }
  state.last = Date.now(); state.url = url; fs.writeFileSync(sf, JSON.stringify(state));
  return res;
}
module.exports = { syncFromWeb };
