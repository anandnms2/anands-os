/* Terminal window: confirm, then a live shell on your server over a secure connection. */
(function () {
'use strict';
var T = window.T, $ = T.$, esc = T.esc;
var S = { st: null, id: '', term: null, fit: null, es: null, ctrl: false, q: [], sending: false, setup: false };
var KEYS = { esc: '\x1b', tab: '\t', up: '\x1b[A', down: '\x1b[B', right: '\x1b[C', left: '\x1b[D' };
function gate() {
  var st = S.st, g = $('#gate'); if (!st) { g.innerHTML = '<p class="tmuted">Loading...</p>'; return; }
  if (S.setup) {
    g.innerHTML = '<form class="tcard" id="sf"><h2>Connect your server</h2><p class="tmuted">The terminal signs in over SSH with a key you paste here. It is stored on this server only and never shown again. Create a key just for this, and add its public half to the server\'s authorized keys.</p>' +
      '<label>Server address<input class="tin" id="sh" value="' + esc(st.host) + '" placeholder="203.0.113.10 or server.anands.xyz" required></label><div style="display:flex;gap:8px"><label style="flex:1">User<input class="tin" id="su" value="' + esc(st.user) + '"></label><label style="width:90px">Port<input class="tin" id="sp" type="number" value="' + st.port + '"></label></div>' +
      '<div class="topt"><label><input type="radio" name="sa" value="key"' + (st.auth === 'password' ? '' : ' checked') + '><span><b>Private key</b><small>Safer</small></span></label><label><input type="radio" name="sa" value="password"' + (st.auth === 'password' ? ' checked' : '') + '><span><b>Password</b><small>The server\'s SSH password</small></span></label></div><div id="sbk"><label>Private key' + (st.keySet ? ' (leave empty to keep the saved one)' : '') + '<textarea id="sk" spellcheck="false" placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"></textarea></label></div><div id="sbp"><label>Server password' + (st.passSet ? ' (leave empty to keep the saved one)' : ' (leave empty to type it each time you open)') + '<input class="tin" id="spw" type="password" autocomplete="off"></label>' + (st.passSet ? '<label style="flex-direction:row;gap:8px;align-items:center"><input type="checkbox" id="scl"> Forget the saved password</label>' : '') + '</div><div class="terr" id="se"></div><div style="display:flex;gap:8px"><button class="tb pri" type="submit">Save</button><button class="tb" type="button" id="sc">Back</button></div></form>';
    $('#sc').onclick = function () { S.setup = false; gate(); };
    var tg2 = function () { var pw = $('input[name=sa]:checked').value === 'password'; $('#sbk').hidden = pw; $('#sbp').hidden = !pw; }; [].forEach.call(document.querySelectorAll('input[name=sa]'), function (r) { r.onchange = tg2; }); tg2();
    $('#sf').onsubmit = function (e) { e.preventDefault(); var t = { host: $('#sh').value.trim(), user: $('#su').value.trim(), port: $('#sp').value }; t.auth = $('input[name=sa]:checked').value; if ($('#sk').value.trim()) t.key = $('#sk').value; if ($('#spw').value) t.pass = $('#spw').value; if ($('#scl') && $('#scl').checked) t.clearPass = true; T.api('/api/settings', { method: 'PUT', json: { terminal: t } }).then(function () { return load(); }).then(function () { S.setup = false; gate(); T.toast('Saved'); }).catch(function (er) { $('#se').textContent = er.message; }); };
    return;
  }
  var hostOk = st.hostReady;
  g.innerHTML = '<form class="tcard" id="of"><h2>Open a terminal</h2><div class="twarn">A terminal can change anything on the machine it opens on. Every session is written to the Security center.</div>' +
    '<div class="topt"><label><input type="radio" name="tg" value="host"' + (hostOk ? ' checked' : ' disabled') + '><span><b>Your server</b><small>' + (hostOk ? esc(st.user + '@' + st.host) + (st.auth === 'password' ? ' (password)' : '') : 'Not connected yet') + '</small></span></label><label><input type="radio" name="tg" value="local"' + (hostOk ? '' : ' checked') + '><span><b>This app</b><small>The container Anands OS runs in</small></span></label></div>' +
    ((st.auth === 'password' && !st.passSet) ? '<label>Server password<input class="tin" id="osp" type="password" autocomplete="off" required></label>' : '') + (st.needsPassword ? '<label>Your password<input class="tin" id="op" type="password" autocomplete="current-password" required></label>' : '') + '<label>Type OPEN to confirm<input class="tin" id="oc" autocomplete="off" placeholder="OPEN" required></label><div class="terr" id="oe"></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="tb pri" type="submit">Open terminal</button><button class="tb" type="button" id="os">' + (st.keySet || st.host ? 'Change server connection' : 'Connect your server') + '</button></div>' + (st.pythonOk ? '' : '<div class="terr">The terminal helper is missing from this install.</div>') + '</form>';
  $('#os').onclick = function () { S.setup = true; gate(); };
  $('#of').onsubmit = function (e) { e.preventDefault(); var tg = ($('input[name=tg]:checked') || {}).value || 'local', b = { target: tg, confirm: $('#oc').value, password: $('#op') ? $('#op').value : '', sshpass: $('#osp') ? $('#osp').value : '', cols: 100, rows: 30 }; $('#oe').textContent = ''; T.api('/api/term/open', { method: 'POST', json: b }).then(function (r) { start(r); }).catch(function (er) { $('#oe').textContent = er.message; }); };
}
function load() { return T.api('/api/term/status').then(function (s) { S.st = s; }).catch(function (e) { $('#gate').innerHTML = '<p class="terr">' + esc(e.message) + '</p>'; }); }
function css(v, d) { var x = getComputedStyle(document.documentElement).getPropertyValue(v).trim(); return x || d; }
function send(d) { S.q.push(d); if (S.sending) return; S.sending = true; (function go() { if (!S.q.length) { S.sending = false; return; } var chunk = S.q.join(''); S.q = []; T.api('/api/term/' + S.id + '/in', { method: 'POST', json: { d: chunk } }).catch(function () {}).then(go); })(); }
function start(r) {
  S.id = r.id; $('#gate').hidden = true; $('#tterm').hidden = false; $('#tlabel').textContent = r.label;
  var term = new Terminal({ fontFamily: css('--mono', 'monospace'), fontSize: 13, cursorBlink: true, scrollback: 5000, allowProposedApi: false, theme: { background: css('--stage', '#050506'), foreground: css('--fg', '#f2f2f3'), cursor: css('--accent', '#f68712'), selectionBackground: '#f6871255', black: '#1b1b1e', red: '#ff6b6b', green: '#3ecf8e', yellow: '#f5b83d', blue: '#6fc7ff', magenta: '#c792ea', cyan: '#4fd1c5', white: '#e6e6ea', brightBlack: '#6b6b74' } });
  var fit = new FitAddon.FitAddon(); term.loadAddon(fit); term.open($('#screen')); S.term = term; S.fit = fit; fit.fit(); term.focus();
  term.onData(function (d) { if (S.ctrl && d.length === 1) { var c = d.toUpperCase().charCodeAt(0); if (c >= 64 && c <= 95) d = String.fromCharCode(c - 64); S.ctrl = false; $('#kctl').classList.remove('on'); } send(d); });
  var doFit = function () { try { fit.fit(); T.api('/api/term/' + S.id + '/resize', { method: 'POST', json: { cols: term.cols, rows: term.rows } }).catch(function () {}); } catch (e) {} };
  new ResizeObserver(function () { clearTimeout(S.rt); S.rt = setTimeout(doFit, 150); }).observe($('#screen')); setTimeout(doFit, 200);
  var es = new EventSource('/api/term/' + S.id + '/out'); S.es = es;
  es.onmessage = function (e) { var bin = atob(e.data), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); term.write(u); };
  es.addEventListener('exit', function (e) { var w = ''; try { w = JSON.parse(e.data).why; } catch (x) {} es.close(); term.write('\r\n\x1b[33m[' + (w || 'The session ended.') + ']\x1b[0m\r\n'); S.id = ''; setTimeout(back, 1500); });
  es.onerror = function () { if (S.id) { /* the browser retries by itself; a dead session answers 404 and we stop */ T.api('/api/term/status').then(function (s) { if (!s.sessions.some(function (x) { return x.id === S.id; })) { es.close(); S.id = ''; term.write('\r\n\x1b[33m[The session ended.]\x1b[0m\r\n'); setTimeout(back, 1500); } }).catch(function () {}); } };
}
function back() { if (S.es) S.es.close(); if (S.term) { S.term.dispose(); S.term = null; } $('#screen').innerHTML = ''; $('#tterm').hidden = true; $('#gate').hidden = false; load().then(gate); }
function close() { if (S.id) T.api('/api/term/' + S.id, { method: 'DELETE' }).catch(function () {}); S.id = ''; back(); }
document.addEventListener('click', function (e) { var k = e.target.closest('[data-k]'); if (k && S.id) { send(KEYS[k.dataset.k]); if (S.term) S.term.focus(); } });
$('#kctl').onclick = function () { S.ctrl = !S.ctrl; this.classList.toggle('on', S.ctrl); this.setAttribute('aria-pressed', S.ctrl); if (S.term) S.term.focus(); };
$('#tclose').onclick = close; window.addEventListener('beforeunload', function () { if (S.id) navigator.sendBeacon && 0; });
gate(); load().then(gate);
})();
