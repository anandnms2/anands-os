/* Anands OS desktop. Runs the same OS server on this computer (127.0.0.1 only) and shows it in a window,
 * so everything that lives on this computer works with no internet. Your files stay in the app's data folder. */
const { syncFromWeb } = require('./sync.js');
const { app, BrowserWindow, Menu, shell, dialog, session, ipcMain, safeStorage } = require('electron');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto'); const fs = require('node:fs'); const net = require('node:net'); const path = require('node:path');

const appRoot = app.isPackaged ? path.join(process.resourcesPath, 'app') : path.join(__dirname, '..');
const suiteDir = process.env.SUITE_DIR || path.join(appRoot, 'suite', 'dist');
let child = null, win = null, base = '', port = 0, restarting = false;
const dataDir = () => path.join(app.getPath('userData'), 'data');
const DEFAULT_WEB = '';
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

const freePort = () => new Promise((ok, no) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); s.on('error', no); });
function credentials(dir) {
  const w = readWeb(); if (w && w.password) return String(w.password); // linked to the web version: the same password you use there
  const f = path.join(dir, 'desktop-password');
  try { return fs.readFileSync(f, 'utf8').trim(); } catch {}
  const v = crypto.randomBytes(18).toString('base64url'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(f, v + '\n', { mode: 0o600 }); return v;
}
/* ---- This PC: the folders Files may open on this computer ---- */
const pcFile = () => path.join(dataDir(), 'pc-folders.json');
function pcFolders() { try { return JSON.parse(fs.readFileSync(pcFile(), 'utf8')); } catch { return null; } }
function savePcFolders(l) { fs.mkdirSync(dataDir(), { recursive: true }); fs.writeFileSync(pcFile(), JSON.stringify(l, null, 1)); }
function ensurePcDefaults() {
  if (pcFolders()) return;
  const l = []; for (const [name, key] of [['Documents', 'documents'], ['Downloads', 'downloads'], ['Desktop', 'desktop'], ['Pictures', 'pictures'], ['Music', 'music'], ['Videos', 'videos']]) { try { const p = app.getPath(key); if (fs.existsSync(p)) l.push({ name, path: p }); } catch {} }
  savePcFolders(l);
}
async function addPcFolder() {
  const r = await dialog.showOpenDialog(win, { title: 'Add a folder from this computer', properties: ['openDirectory'] }); if (r.canceled || !r.filePaths[0]) return;
  const p = r.filePaths[0], l = pcFolders() || []; if (l.some((x) => x.path === p)) return;
  let name = path.basename(p) || p, n = name, i = 2; while (l.some((x) => x.name === n)) n = name + ' ' + i++; l.push({ name: n, path: p }); savePcFolders(l); menu();
  if (win) win.webContents.reload();
}
function removePcFolder(name) { savePcFolders((pcFolders() || []).filter((x) => x.name !== name)); menu(); if (win) win.webContents.reload(); }

/* ---- Anands Web: the online Anands OS, reached with the password you save here (kept encrypted by the system when it can) ---- */
const webFile = () => path.join(dataDir(), 'web-link.bin');
function readWeb() {
  try { const raw = fs.readFileSync(webFile()); const txt = raw[0] === 0x7b ? raw.toString('utf8') : safeStorage.decryptString(raw); const j = JSON.parse(txt); return j && j.url && j.password ? j : null; } catch { return null; }
}
function saveWeb(v) {
  const txt = JSON.stringify(v); fs.mkdirSync(dataDir(), { recursive: true });
  fs.writeFileSync(webFile(), safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(txt) : Buffer.from(txt), { mode: 0o600 });
}
async function checkWeb(url, password) {
  let r; try { r = await fetch(url.replace(/\/+$/, '') + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password }), signal: AbortSignal.timeout(10000) }); } catch { return 'Could not reach ' + url + '. Check your internet connection.'; }
  return r.ok ? '' : r.status === 401 || r.status === 403 ? 'That password was not accepted.' : 'The web version answered with an error (' + r.status + ').';
}
function connectWindow() {
  const w = new BrowserWindow({ width: 440, height: 380, parent: win || undefined, modal: !!win, resizable: false, minimizable: false, autoHideMenuBar: true, title: 'Connect to Anands Web', backgroundColor: '#121212', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true } });
  const cur = readWeb();
  w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html><meta charset=utf-8><style>body{font:14px system-ui;background:#121212;color:#eee;margin:0;padding:22px}h2{margin:0 0 6px}p{color:#aaa;margin:0 0 14px;line-height:1.4}label{display:block;margin:10px 0 4px;color:#bbb}input{width:100%;box-sizing:border-box;padding:9px;border-radius:8px;border:1px solid #444;background:#1c1c1c;color:#fff}button{margin-top:16px;padding:9px 16px;border:0;border-radius:8px;background:#ff7a1a;color:#111;font-weight:600;cursor:pointer}button.s{background:#333;color:#eee;margin-left:8px}#m{margin-top:12px;color:#ff9a7a;min-height:18px}</style>
<h2>Connect to Anands Web</h2><p>This app opens for your Anands account only. Enter your website address and the password you sign in with there. After this first connection it also works offline.</p>
<label>Address</label><input id=u placeholder="https://os.example.com" value="${(cur ? cur.url : DEFAULT_WEB).replace(/"/g, '')}"><label>Password</label><input id=p type=password autofocus>
<button id=go>Connect</button>${cur ? '<button class=s id=off>Disconnect</button>' : ''}<button class=s id=x>Cancel</button><div id=m></div>
<script>const $=i=>document.getElementById(i);$('go').onclick=async()=>{$('m').textContent='Checking...';const r=await aosDesktop.connectWeb($('u').value.trim(),$('p').value);if(r)$('m').textContent=r};$('x').onclick=()=>aosDesktop.close();if($('off'))$('off').onclick=()=>aosDesktop.disconnectWeb();$('p').onkeydown=e=>{if(e.key==='Enter')$('go').click()}</script>`));
  return w;
}
ipcMain.handle('web:connect', async (e, url, password) => {
  url = String(url || '').trim().replace(/\/+$/, ''); if (!/^https?:\/\/[^\s]+$/.test(url)) return 'Enter the full address, like https://os.example.com';
  if (!password) return 'Enter your password.'; const err = await checkWeb(url, String(password)); if (err) return err;
  saveWeb({ url, password: String(password) }); BrowserWindow.fromWebContents(e.sender).close();
  if (gateResolve) { gateResolve(true); gateResolve = null; return ''; } // first start: the app opens only after this
  await restartServer(); runSync(true, false); return '';
});
ipcMain.handle('web:disconnect', async (e) => { try { fs.rmSync(webFile(), { force: true }); } catch {} BrowserWindow.fromWebContents(e.sender).close(); app.relaunch(); app.quit(); }); // locks again: the app needs the web password to open
ipcMain.handle('win:close', (e) => { BrowserWindow.fromWebContents(e.sender).close(); });

async function startServer() {
  const data = dataDir(); fs.mkdirSync(data, { recursive: true }); ensurePcDefaults();
  const password = credentials(data); if (!port) port = await freePort(); base = `http://127.0.0.1:${port}`; const web = readWeb();
  child = spawn(process.execPath, [path.join(appRoot, 'server', 'index.js')], {
    cwd: appRoot, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port), DATA_DIR: data, SUITE_DIR: suiteDir, APP_PASSWORD: password, SESSION_SECRET: crypto.createHash('sha256').update('aos-desktop' + password).digest('hex'), PUBLIC_URL: '', AOS_DESKTOP: '1', ...(web ? { WEB_URL: web.url, WEB_PASSWORD: web.password } : {}) }
  });
  let log = ''; const add = (d) => { log = (log + d).slice(-4000); }; child.stdout.on('data', add); child.stderr.on('data', add);
  child.on('exit', (c) => { if (!app.isQuitting && !restarting) { dialog.showErrorBox('Anands OS stopped', 'The local server stopped (code ' + c + ').\n\n' + log.slice(-800)); app.quit(); } });
  for (let i = 0; i < 150; i++) { try { if ((await fetch(base + '/healthz')).ok) return password; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  throw new Error('The local server did not start.\n' + log.slice(-800));
}
async function restartServer() {
  restarting = true; const old = child; if (old) { await new Promise((ok) => { old.once('exit', ok); old.kill(); setTimeout(ok, 3000); }); }
  try { const pw = await startServer(); await signIn(pw); if (win) win.webContents.reload(); } finally { restarting = false; }
}
async function signIn(password) {
  const r = await fetch(base + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password }) });
  if (!r.ok) throw new Error('Could not sign in locally (' + r.status + ')');
  for (const c of r.headers.getSetCookie()) { const [kv] = c.split(';'); const i = kv.indexOf('='); await session.defaultSession.cookies.set({ url: base, name: kv.slice(0, i), value: kv.slice(i + 1), httpOnly: true, expirationDate: Math.floor(Date.now() / 1000) + 86400 * 30 }); }
}
let syncing = false;
async function runSync(manual, filesOnly) {
  const w = readWeb(); if (!w || syncing) { if (manual && !w) dialog.showMessageBox(win, { type: 'info', message: 'Connect to Anands Web first', detail: 'Use "Connect to Anands Web…" in the menu, then sync.' }); return; }
  syncing = true;
  try {
    const r = await syncFromWeb({ url: w.url, password: w.password, dataDir: dataDir(), filesOnly, onProgress: (n, t) => { if (win) win.setProgressBar(t ? n / t : -1); } });
    if (win) win.setProgressBar(-1);
    if (r.appData) await restartServer();
    if (manual) dialog.showMessageBox(win, { type: 'info', message: 'Synced with Anands Web', detail: r.downloaded + ' updated, ' + r.unchanged + ' already current' + (r.removed ? ', ' + r.removed + ' removed' : '') + (r.kept ? ', ' + r.kept + ' kept because you changed them on this computer' : '') + (r.skipped ? ', ' + r.skipped + ' skipped for size' : '') + (r.errors ? ', ' + r.errors + ' failed (try again)' : '') + '.' });
  } catch (e) { if (win) win.setProgressBar(-1); if (manual) dialog.showMessageBox(win, { type: 'warning', message: 'Could not sync', detail: String(e.message || e).replace(/fetch failed/, 'The web version is not reachable. You are working offline.') }); }
  finally { syncing = false; }
}
function menu() {
  const pcs = pcFolders() || [];
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Anands OS', submenu: [
      { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => win && win.webContents.reload() },
      { label: 'Full screen', accelerator: 'F11', click: () => win && win.setFullScreen(!win.isFullScreen()) },
      { type: 'separator' },
      { label: 'Add a folder from this computer…', click: () => addPcFolder() },
      { label: 'Remove a folder', submenu: pcs.length ? pcs.map((f) => ({ label: f.name + '  (' + f.path + ')', click: () => removePcFolder(f.name) })) : [{ label: 'No folders added', enabled: false }] },
      { label: readWeb() ? 'Anands Web connection…' : 'Connect to Anands Web…', click: () => connectWindow() },
      { label: 'Sync with Anands Web now', click: () => runSync(true, false) },
      { label: 'Show the sign-in password', click: () => dialog.showMessageBox(win, { type: 'info', message: 'Sign-in password for this app', detail: readWeb() ? 'This app uses the same password as your Anands Web account.' : 'Not connected to Anands Web, so this app uses its own password:\n\n' + credentials(dataDir()) + '\n\nConnect to Anands Web to use your website password instead.' }) },
      { label: 'Open data folder', click: () => shell.openPath(dataDir()) },
      { type: 'separator' }, { role: 'quit' } ] },
    { role: 'editMenu' }, { role: 'windowMenu' }
  ]));
}
let gateResolve = null;
/* The app only opens for the owner: until it is connected to the web version with the website password, only this sign-in window shows.
 * Anyone else who downloads the installer from the public repository has nothing to open. */
function requireConnection() {
  return new Promise((ok) => {
    gateResolve = ok; const w = connectWindow();
    w.on('closed', () => { if (gateResolve) app.quit(); });
  });
}
/* ---- Open with: files from this computer open in the matching Suite app ---- */
const OPEN_EXT = /\.(pdf|docx?|odt|xlsx?|csv|pptx?|jpe?g|png|webp|gif|svg|mp4|mov|mp3|wav)$/i;
let pendingOpen = [], uiReady = false;
const fileArgs = (argv) => argv.slice(1).filter((a) => a && !a.startsWith('-') && OPEN_EXT.test(a) && fs.existsSync(a));
function importFile(src) {
  const dir = path.join(dataDir(), 'fs', 'Opened from PC'); fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(src), stem = path.basename(src, ext), st = fs.statSync(src); let name = stem + ext, n = 2;
  while (fs.existsSync(path.join(dir, name))) { const o = fs.statSync(path.join(dir, name)); if (o.size === st.size && Math.abs(o.mtimeMs - st.mtimeMs) < 2000) break; name = stem + ' (' + n++ + ')' + ext; }
  const dest = path.join(dir, name); if (!fs.existsSync(dest)) { fs.copyFileSync(src, dest); fs.utimesSync(dest, st.atime, st.mtime); }
  return '/Opened from PC/' + name;
}
async function openFromPc(files) {
  for (const f of files) {
    let p; try { p = importFile(f); } catch { continue; }
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
    for (let i = 0; i < 100; i++) { try { if (await win.webContents.executeJavaScript('!!(window.AOS && AOS.openPath && AOS.openPath(' + JSON.stringify(p) + '))')) break; } catch {} await new Promise((r) => setTimeout(r, 300)); }
  }
}
function queueOpen(files) { if (!files.length) return; if (uiReady) openFromPc(files); else pendingOpen.push(...files); }
if (!app.requestSingleInstanceLock()) { app.quit(); }
app.on('second-instance', (e, argv) => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } queueOpen(fileArgs(argv)); });
app.on('open-file', (e, f) => { e.preventDefault(); queueOpen([f]); });
async function main() {
  menu(); pendingOpen.push(...fileArgs(process.argv));
  if (!readWeb()) await requireConnection();
  const password = await startServer(); await signIn(password);
  win = new BrowserWindow({ width: 1360, height: 860, minWidth: 900, minHeight: 600, backgroundColor: '#121212', title: 'Anands OS', icon: path.join(__dirname, 'icon.png'), autoHideMenuBar: true, webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false } });
  win.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith(base)) return { action: 'allow' }; shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(base)) { e.preventDefault(); shell.openExternal(url); } });
  await win.loadURL(base + '/');
  uiReady = true; if (pendingOpen.length) { const l = pendingOpen.splice(0); openFromPc(l); }
  runSync(false, false); setInterval(() => runSync(false, true), 15 * 60 * 1000);
}
app.whenReady().then(() => main().catch((e) => { dialog.showErrorBox('Anands OS could not start', String(e.message || e)); app.quit(); }));
app.on('before-quit', () => { app.isQuitting = true; if (child) child.kill(); });
app.on('window-all-closed', () => app.quit());
