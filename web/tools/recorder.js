/* Recorder: screen (with or without sound), camera and voice. Recordings are saved to your files. */
(function () {
'use strict';
var T = window.T, $ = T.$, esc = T.esc;
var MODES = [['screen', 'screen', 'Screen'], ['cam', 'rec', 'Screen and camera'], ['voice', 'mic', 'Voice only']];
var R = { mode: 'screen', rec: null, chunks: [], streams: [], t0: 0, paused: 0, pa: 0, tick: null, blob: null, dir: '/Recordings', ctx: null };
function stamp() { var d = new Date(), z = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + '.' + z(d.getMinutes()) + '.' + z(d.getSeconds()); }
function types() { var l = R.mode === 'voice' ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'] : ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']; return l.filter(function (t) { return window.MediaRecorder && MediaRecorder.isTypeSupported(t); })[0] || ''; }
function drawModes() {
  $('#modes').innerHTML = MODES.map(function (m) { return '<button role="radio" aria-checked="' + (m[0] === R.mode) + '" data-m="' + m[0] + '" class="' + (m[0] === R.mode ? 'on' : '') + '">' + T.ic(m[1]) + '<span>' + m[2] + '</span></button>'; }).join('');
  $('#rsub').textContent = R.mode === 'voice' ? 'Records your microphone' : R.mode === 'screen' ? 'Pick a window, tab or your whole screen. Sound from the tab is included when the browser allows it.' : 'Records your screen with your camera in the corner.';
}
function ctl() {
  var h = ''; if (!R.rec) h = '<button class="tb pri" data-a="start">' + T.ic('rec') + '<span>Start recording</span></button>';
  else h = '<span class="recdot"></span><span class="rtime" id="rtime">0:00</span><span class="sp"></span><button class="tb" data-a="pause">' + T.ic(R.rec.state === 'paused' ? 'play' : 'pause') + '<span>' + (R.rec.state === 'paused' ? 'Resume' : 'Pause') + '</span></button><button class="tb pri" data-a="stop">' + T.ic('stop') + '<span>Stop</span></button>';
  $('#rctl').innerHTML = h;
}
function elapsed() { var n = Date.now(); return Math.floor((n - R.t0 - R.paused - (R.rec && R.rec.state === 'paused' ? n - R.pa : 0)) / 1000); }
function fmt(s) { var m = Math.floor(s / 60); return m + ':' + ('0' + (s % 60)).slice(-2); }
function stopStreams() { R.streams.forEach(function (s) { s.getTracks().forEach(function (t) { t.stop(); }); }); R.streams = []; if (R.ctx) { try { R.ctx.close(); } catch (e) {} R.ctx = null; } $('#lvl').hidden = true; $('#rstage').classList.remove('on'); $('#live').srcObject = null; }
function countdown() { return new Promise(function (ok) { var n = 3, c = $('#rcount'); c.hidden = false; c.textContent = n; var iv = setInterval(function () { n--; if (n <= 0) { clearInterval(iv); c.hidden = true; ok(); } else c.textContent = n; }, 900); }); }
function level(stream) {
  try { var AC = window.AudioContext || window.webkitAudioContext; R.ctx = new AC(); var an = R.ctx.createAnalyser(); an.fftSize = 256; R.ctx.createMediaStreamSource(stream).connect(an); var buf = new Uint8Array(an.frequencyBinCount); $('#lvl').hidden = false;
    (function lp() { if (!R.ctx) return; an.getByteTimeDomainData(buf); var m = 0; for (var i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i] - 128)); $('#lvlbar').style.width = Math.min(100, m / 90 * 100) + '%'; requestAnimationFrame(lp); })(); } catch (e) {}
}
function start() {
  var get; var need = R.mode === 'voice' ? { audio: { echoCancellation: true, noiseSuppression: true } } : null;
  if (R.mode === 'voice') get = navigator.mediaDevices.getUserMedia(need).then(function (s) { return [s, s]; });
  else {
    if (!navigator.mediaDevices.getDisplayMedia) return T.toast('Screen recording is not available in this browser. Use the desktop version or choose Voice only.');
    get = navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true }).then(function (scr) {
      return navigator.mediaDevices.getUserMedia({ audio: true, video: R.mode === 'cam' }).catch(function () { return null; }).then(function (mic) {
        R.streams.push(scr); if (mic) R.streams.push(mic);
        var tracks = scr.getVideoTracks().slice(); var ac = new (window.AudioContext || window.webkitAudioContext)(), dest = ac.createMediaStreamDestination(), any = false;
        [scr, mic].forEach(function (s) { if (s && s.getAudioTracks().length) { ac.createMediaStreamSource(new MediaStream(s.getAudioTracks())).connect(dest); any = true; } });
        R.ctx = ac; if (any) tracks = tracks.concat(dest.stream.getAudioTracks()); return [new MediaStream(tracks), scr];
      });
    });
  }
  get.then(function (r) {
    var ms = r[0], src = r[1]; if (R.streams.indexOf(src) < 0) R.streams.push(src);
    $('#rsave').hidden = true; return countdown().then(function () {
      R.chunks = []; var type = types(); var rec; try { rec = new MediaRecorder(ms, type ? { mimeType: type, videoBitsPerSecond: 3500000 } : {}); } catch (e) { stopStreams(); return T.toast('This browser cannot record in this format'); }
      R.rec = rec; R.type = rec.mimeType || type || (R.mode === 'voice' ? 'audio/webm' : 'video/webm'); rec.ondataavailable = function (e) { if (e.data && e.data.size) R.chunks.push(e.data); }; rec.onstop = done;
      src.getVideoTracks().forEach(function (t) { t.onended = function () { if (R.rec && R.rec.state !== 'inactive') R.rec.stop(); }; });
      if (R.mode !== 'voice') { var v = $('#live'); v.srcObject = new MediaStream(src.getVideoTracks()); v.play().catch(function () {}); $('#rstage').classList.add('on'); } else { $('#rhint').firstChild.textContent = 'Recording voice'; }
      level(ms); R.t0 = Date.now(); R.paused = 0; rec.start(1000); ctl(); R.tick = setInterval(function () { var t = $('#rtime'); if (t) t.textContent = fmt(elapsed()); }, 500);
    });
  }).catch(function (e) { stopStreams(); R.rec = null; ctl(); T.toast(e && e.name === 'NotAllowedError' ? 'Permission was not given' : 'Could not start: ' + (e && e.message || 'unknown error')); });
}
function done() {
  clearInterval(R.tick); var secs = elapsed(); stopStreams(); var ext = /mp4/.test(R.type) ? (R.mode === 'voice' ? 'm4a' : 'mp4') : /ogg/.test(R.type) ? 'ogg' : (R.mode === 'voice' ? 'webm' : 'webm');
  R.blob = new Blob(R.chunks, { type: R.type.split(';')[0] }); R.rec = null; R.ext = ext; ctl(); if (!R.blob.size) return T.toast('Nothing was recorded');
  var p = $('#prev'); if (p.src) URL.revokeObjectURL(p.src); p.src = URL.createObjectURL(R.blob); $('#rfn').value = (R.mode === 'voice' ? 'Voice ' : 'Recording ') + stamp(); $('#rinfo').textContent = '.' + ext + ' · ' + fmt(secs) + ' · ' + T.fmtSize(R.blob.size); $('#rsave').hidden = false; $('#rsave').scrollIntoView({ block: 'nearest' });
}
function baseDir() { return T.fs.stat('/Drive').then(function () { return '/Drive/Recordings'; }, function () { return '/Recordings'; }); }
function save() {
  var n = $('#rfn').value.trim().replace(/[\\/:*?"<>|]/g, '-') || 'Recording ' + stamp(); $('#rsv').disabled = true;
  baseDir().then(function (d) { R.dir = d; return T.fs.mkdir(d).catch(function () {}).then(function () { return T.fs.write(d + '/' + n + '.' + R.ext, R.blob, R.blob.type, false); }); })
    .then(function () { T.toast('Saved to ' + R.dir); $('#rsave').hidden = true; R.blob = null; list(); }).catch(function (e) { T.toast(e.message); }).then(function () { $('#rsv').disabled = false; });
}
function list() {
  baseDir().then(function (d) { return T.fs.list(d).then(function (l) { return [d, l]; }); }).then(function (r) {
    var l = r[1].filter(function (f) { return !f.is_dir && /\.(webm|mp4|m4a|ogg)$/i.test(f.name); }).sort(function (a, b) { return (b.modified || 0) - (a.modified || 0); }).slice(0, 12);
    $('#rlist').innerHTML = l.length ? l.map(function (f) { return '<div class="rrow"><span>' + esc(f.name) + '</span><span class="tmuted">' + T.fmtSize(f.size) + '</span><button class="tb" data-play="' + esc(f.path) + '">' + T.ic('play') + '<span>Play</span></button><a class="tb" href="' + T.fs.url(f.path) + '" download>' + T.ic('down') + '</a></div>'; }).join('') : '<p class="tmuted">Nothing saved yet.</p>';
  }).catch(function () { $('#rlist').innerHTML = '<p class="tmuted">Nothing saved yet.</p>'; });
}
function init() {
  drawModes(); ctl(); list(); $('#rsv').innerHTML = T.ic('save') + '<span>Save to my files</span>'; $('#rdl').innerHTML = T.ic('down') + '<span>Download</span>'; $('#rdc').innerHTML = T.ic('trash') + '<span>Discard</span>';
  $('#modes').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (!b || R.rec) return; R.mode = b.dataset.m; drawModes(); });
  $('#rctl').addEventListener('click', function (e) { var b = e.target.closest('[data-a]'); if (!b) return; var a = b.dataset.a; if (a === 'start') start(); if (a === 'stop' && R.rec) R.rec.stop(); if (a === 'pause' && R.rec) { if (R.rec.state === 'paused') { R.paused += Date.now() - R.pa; R.rec.resume(); } else { R.pa = Date.now(); R.rec.pause(); } ctl(); } });
  $('#rsv').onclick = save; $('#rdc').onclick = function () { R.blob = null; $('#rsave').hidden = true; };
  $('#rdl').onclick = function () { if (!R.blob) return; var a = document.createElement('a'); a.href = URL.createObjectURL(R.blob); a.download = ($('#rfn').value || 'recording') + '.' + R.ext; a.click(); };
  $('#rlist').addEventListener('click', function (e) { var b = e.target.closest('[data-play]'); if (b) try { parent.postMessage({ aosTool: 'launch', tool: 'player', path: b.dataset.play }, location.origin); } catch (x) {} });
  window.addEventListener('beforeunload', function (e) { if (R.rec || R.blob) { e.preventDefault(); e.returnValue = ''; } });
}
init();
})();
