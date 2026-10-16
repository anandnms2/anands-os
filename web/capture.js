/* Quick capture: Alt+N from anywhere (or the + in the top bar). Note, task, voice memo or photo, filed in the right place. */
(function () {
'use strict';
var A = window.AOS; if (!A) return;
var S = A.S, $ = A.$, esc = A.esc, api = A.api, ic = A.ic, toast = A.toast, LS = A.LS;
var C = { tab: 'note', rec: null, chunks: [], t0: 0, tick: null, stream: null, blob: null, busy: false };
var TABS = [['note', 'Note', 'doc'], ['task', 'Task', 'check'], ['voice', 'Voice', 'camera'], ['photo', 'Photo', 'image']];
function pulseOn() { var c = (S.settings || {}).pulse; return !!(c && c.url && c.user && c.passSet); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function stamp(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()); }
function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

/* "buy tyres tomorrow !high @personal" */
function parseTask(text) {
  var t = String(text).trim(), o = { dom: 'Work', pri: 'normal' }, now = new Date(), m;
  if ((m = /\s@(personal|work)\b/i.exec(' ' + t))) { o.dom = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase(); t = t.replace(/\s?@(personal|work)\b/i, ''); }
  if ((m = /\s!(low|high|urgent)\b/i.exec(' ' + t))) { o.pri = m[1].toLowerCase(); t = t.replace(/\s?!(low|high|urgent)\b/i, ''); }
  var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  if ((m = /\b(today|tomorrow)\s*$/i.exec(t))) { var d = new Date(now); if (/tomorrow/i.test(m[1])) d.setDate(d.getDate() + 1); o.due_date = ymd(d); t = t.slice(0, m.index); }
  else if ((m = /\b(?:on\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s*$/i.exec(t))) { var d2 = new Date(now), k = days.indexOf(m[1].toLowerCase()), diff = (k - d2.getDay() + 7) % 7 || 7; d2.setDate(d2.getDate() + diff); o.due_date = ymd(d2); t = t.slice(0, m.index); }
  else if ((m = /\b(\d{4}-\d\d-\d\d)\s*$/.exec(t))) { o.due_date = m[1]; t = t.slice(0, m.index); }
  o.title = t.trim().replace(/\s+/g, ' ').slice(0, 200); return o;
}

/* ---------- where things go ---------- */
function folderCandidates() { return ['/Drive/Captures', '/Captures']; }
function driveOn() { var d = (S.settings || {}).dav; return !!(d && d.url && d.passSet); }
function putFile(name, body, type) {
  var dirs = driveOn() ? folderCandidates() : ['/Captures'];
  var try1 = function (i) { var path = dirs[i] + '/' + name; return api('/_local/fs/write?path=' + encodeURIComponent(path) + '&mkdirs=1&overwrite=0', { method: 'POST', body: body, headers: { 'content-type': type || 'text/plain' } }).then(function () { return path; }, function (e) { if (i + 1 < dirs.length) return try1(i + 1); throw e; }); };
  return try1(0);
}
function queue(item) { var q = LS.get('capq', []); q.push(item); LS.set('capq', q.slice(-50)); }
function offline(e) { return e instanceof TypeError || /Failed to fetch|NetworkError|Load failed/i.test(String(e && e.message)); }
function flush() {
  var q = LS.get('capq', []); if (!q.length || !navigator.onLine || !S.user) return; LS.set('capq', []);
  q.reduce(function (p, it) { return p.then(function () { return it.k === 'task' ? sendTask(it.o, true) : sendNote(it.text, it.at, true); }).catch(function () {}); }, Promise.resolve()).then(function () { toast(q.length + ' saved while offline are now filed'); });
}
function sendTask(o, quiet) {
  if (!pulseOn()) return sendNote('Task: ' + o.title + (o.due_date ? ' (due ' + o.due_date + ')' : ''), null, quiet);
  return api('/api/pulse/s/task', { method: 'POST', json: o }).then(function () { if (!quiet) toast('Task added to Pulse'); if (window.AOSPulse2) { var P = AOSPulse2.state; if (P.boot) AOSPulse2.load(true); } return true; }, function (e) { if (offline(e)) { queue({ k: 'task', o: o }); if (!quiet) toast('Offline. The task is saved and will be added when you are back online.'); return true; } throw e; });
}
function sendNote(text, at, quiet) {
  var d = at ? new Date(at) : new Date(), first = String(text).split('\n')[0].replace(/[^\w ]+/g, ' ').trim().slice(0, 40);
  return putFile(stamp(d) + ' ' + (first || 'note') + '.md', text + '\n').then(function (p) { if (!quiet) toast('Note saved to ' + p.replace(/\/[^/]*$/, '')); return true; }, function (e) { if (offline(e)) { queue({ k: 'note', text: text, at: d.getTime() }); if (!quiet) toast('Offline. The note is saved and will be filed when you are back online.'); return true; } throw e; });
}

/* ---------- ui ---------- */
function head() { return '<div class="cptabs" role="tablist">' + TABS.map(function (t) { return '<button type="button" role="tab" aria-selected="' + (C.tab === t[0]) + '" data-cap="tab" data-t="' + t[0] + '">' + ic(t[2]) + t[1] + '</button>'; }).join('') + '</div>'; }
function body() {
  if (C.tab === 'note') return '<textarea id="cpt" class="input" rows="6" placeholder="Write a note..." aria-label="Note"></textarea><p class="note">Saved as a text file in ' + (driveOn() ? 'Drive / Captures' : 'Files / Captures') + '.</p><div class="cpact"><button class="btn primary" data-cap="savenote">Save note</button></div>';
  if (C.tab === 'task') return '<input id="cpk" class="input" autocomplete="off" placeholder="buy tyres tomorrow !high @personal" aria-label="Task"><p class="note">' + (pulseOn() ? 'Goes to your Pulse tasks.' : 'Pulse is not connected, so it is saved as a note.') + ' Add <b>today</b>, <b>tomorrow</b> or a weekday for the due date, <b>!high</b> for priority, <b>@personal</b> for the area.</p><div class="cpact"><button class="btn primary" data-cap="savetask">Add task</button></div>';
  if (C.tab === 'voice') {
    if (!navigator.mediaDevices || !window.MediaRecorder) return '<p class="note">This browser cannot record audio.</p>';
    var rec = !!C.rec;
    return '<div class="cpvoice"><button type="button" class="cprec' + (rec ? ' on' : '') + '" data-cap="' + (rec ? 'stop' : 'start') + '" aria-label="' + (rec ? 'Stop recording' : 'Start recording') + '"><i></i></button><div class="mono cptime" id="cptime">0:00</div></div>' +
      (C.blob ? '<audio controls src="' + URL.createObjectURL(C.blob) + '" style="width:100%"></audio><div class="cpact"><button class="btn" data-cap="discard">Discard</button><button class="btn primary" data-cap="savevoice">Save voice memo</button></div>' : '<p class="note">' + (rec ? 'Recording... press the button to stop.' : 'Press the button to start. Saved as an audio file in ' + (driveOn() ? 'Drive / Captures' : 'Files / Captures') + '.') + '</p>');
  }
  var imm = S.imm && S.imm.connected;
  return '<label class="cpdrop"><input id="cpf" type="file" accept="image/*" capture="environment" multiple hidden>' + ic('camera') + '<b>Take or choose a photo</b><span class="note">' + (imm ? 'Goes to your Immich library.' : 'Saved in Files / Captures.') + '</span></label>';
}
function draw() { var el = $('#cpbody'); if (el) { el.innerHTML = head() + '<div class="cpmain">' + body() + '</div>'; var f = $('#cpt') || $('#cpk'); if (f) f.focus(); } }
function open(tab, text) {
  if (!S.user) return; if (tab && TABS.some(function (t) { return t[0] === tab; })) C.tab = tab; C.blob = null;
  var m = $('#modal'); m.hidden = false;
  m.innerHTML = '<div class="modal" data-act="mx"><div class="card cap" role="dialog" aria-modal="true" aria-label="Quick capture"><div class="caph"><h2>Quick capture</h2><button class="btn sm" data-act="mx2" data-cap="close" aria-label="Close">' + ic('x') + '</button></div><div id="cpbody"></div></div></div>';
  draw(); if (text) { var f = $('#cpt') || $('#cpk'); if (f) f.value = text; }
}
function close() { stopRec(true); A.modal(); }
function stopRec(drop) { try { if (C.rec && C.rec.state !== 'inactive') { if (drop) C.rec.onstop = null; C.rec.stop(); } } catch (e) {} if (C.stream) C.stream.getTracks().forEach(function (t) { t.stop(); }); C.rec = null; C.stream = null; clearInterval(C.tick); }
function startRec() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function (st) {
    C.stream = st; C.chunks = []; C.blob = null; var types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'], mt = types.filter(function (t) { return MediaRecorder.isTypeSupported(t); })[0] || '';
    var r = new MediaRecorder(st, mt ? { mimeType: mt } : undefined); C.rec = r; C.mime = r.mimeType || mt || 'audio/webm';
    r.ondataavailable = function (e) { if (e.data && e.data.size) C.chunks.push(e.data); };
    r.onstop = function () { C.blob = new Blob(C.chunks, { type: C.mime }); stopRec(); draw(); };
    r.start(); C.t0 = Date.now(); draw(); C.tick = setInterval(function () { var s = Math.floor((Date.now() - C.t0) / 1000), el = $('#cptime'); if (el) el.textContent = Math.floor(s / 60) + ':' + pad(s % 60); }, 500);
  }).catch(function (e) { toast(e && e.name === 'NotAllowedError' ? 'Microphone is blocked. Allow it in the browser address bar.' : 'No microphone found.'); });
}
function busy(b) { C.busy = b; var x = document.querySelectorAll('.cap [data-cap]'); for (var i = 0; i < x.length; i++) x[i].disabled = b; }
function done(p) { busy(true); return p.then(function () { busy(false); close(); }).catch(function (e) { busy(false); toast(e.message || 'Could not save'); }); }
function ext(mime) { return /mp4/.test(mime) ? 'm4a' : /ogg/.test(mime) ? 'ogg' : 'webm'; }
document.addEventListener('click', function (ev) {
  var b = ev.target.closest && ev.target.closest('[data-cap]'); if (!b) return; var a = b.getAttribute('data-cap'); if (a === 'close') return void close();
  if (a === 'open') { ev.preventDefault(); return void open(); }
  if (!$('.cap')) return;
  if (a === 'tab') { stopRec(true); C.tab = b.getAttribute('data-t'); C.blob = null; return void draw(); }
  if (a === 'savenote') { var t = ($('#cpt').value || '').trim(); if (!t) return toast('Write something first'); return void done(sendNote(t)); }
  if (a === 'savetask') { var o = parseTask($('#cpk').value); if (!o.title) return toast('Write the task first'); return void done(sendTask(o)); }
  if (a === 'start') return void startRec(); if (a === 'stop') return void stopRec();
  if (a === 'discard') { C.blob = null; return void draw(); }
  if (a === 'savevoice' && C.blob) { var bl = C.blob; return void done(putFile(stamp() + ' voice memo.' + ext(bl.type), bl, bl.type).then(function (p) { toast('Voice memo saved to ' + p.replace(/\/[^/]*$/, '')); C.blob = null; })); }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id !== 'cpf') return; var files = Array.prototype.slice.call(ev.target.files || []); ev.target.value = ''; if (!files.length) return;
  var imm = S.imm && S.imm.connected;
  done(files.reduce(function (p, f) {
    return p.then(function () {
      if (imm) return api('/api/photos/upload', { method: 'POST', body: f, headers: { 'x-filename': encodeURIComponent(f.name || 'photo.jpg'), 'x-created': String(f.lastModified || Date.now()), 'content-type': f.type || 'image/jpeg' } });
      return putFile(stamp() + ' ' + (f.name || 'photo.jpg'), f, f.type || 'image/jpeg');
    });
  }, Promise.resolve()).then(function () { toast(files.length + (files.length > 1 ? ' photos' : ' photo') + ' saved' + (imm ? ' to Immich' : '')); if (imm) { S.tl = { items: [], next: 1, loading: false, error: null, loaded: false }; S.albums = null; } }));
});
document.addEventListener('keydown', function (ev) {
  if (ev.altKey && !ev.ctrlKey && !ev.metaKey && ev.code === 'KeyN') { ev.preventDefault(); open(); return; }
  if (ev.target && ev.target.id === 'cpk' && ev.key === 'Enter') { ev.preventDefault(); var b = document.querySelector('[data-cap="savetask"]'); if (b) b.click(); }
  if (ev.target && ev.target.id === 'cpt' && ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); var n = document.querySelector('[data-cap="savenote"]'); if (n) n.click(); }
});
window.addEventListener('online', flush); setTimeout(flush, 4000);
window.AOSCapture = { putFile: putFile, stamp: stamp, open: open, addTask: function (text) { var o = parseTask(text); if (!o.title) return toast('Write the task first'); return sendTask(o).catch(function (e) { toast(e.message); }); }, addNote: function (text) { return sendNote(text).catch(function (e) { toast(e.message); }); }, parseTask: parseTask, flush: flush };
})();
