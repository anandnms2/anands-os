/* Player: music and video from your files, a queue, and saved playlists (kept in /Playlists/playlists.json so they follow you across devices). */
(function () {
'use strict';
var T = window.T, $ = T.$, esc = T.esc, vid = $('#vid');
var VIDEO = /\.(mp4|m4v|webm|mov|mkv|ogv)$/i, AUDIO = /\.(mp3|m4a|wav|flac|ogg|oga|opus|aac)$/i, MEDIA = /\.(mp4|m4v|webm|mov|mkv|ogv|mp3|m4a|wav|flac|ogg|oga|opus|aac)$/i;
var P = { tab: 'lib', dir: '/', files: [], q: [], i: -1, shuf: false, rep: 0, pls: {}, plLoaded: false, a: new Audio() };
var el = function () { return P.cur && P.cur.v ? vid : P.a; };
function isV(p) { return VIDEO.test(p); }
function fmt(s) { if (!isFinite(s)) return '0:00'; s = Math.floor(s); var m = Math.floor(s / 60); return m + ':' + ('0' + (s % 60)).slice(-2); }
function name(p) { return T.baseOf(p).replace(/\.[^.]+$/, ''); }
/* playback */
function play(i) {
  if (i < 0 || i >= P.q.length) return; P.i = i; var p = P.q[i], v = isV(p); P.cur = { path: p, v: v };
  try { vid.pause(); P.a.pause(); } catch (e) {}
  var m = el(); m.src = T.fs.url(p); m.playbackRate = Number($('#spd').value); m.volume = $('#vol').value / 100; m.play().catch(function () { T.toast('Could not play that file'); });
  $('#stage').classList.toggle('v', v); $('#ptitle').textContent = name(p); $('#psub').textContent = T.dirOf(p); hook(m); sync(); drawBody();
  try { if (parent !== window) parent.postMessage({ aosTool: 'title', title: name(p) + ' - Player' }, location.origin); } catch (e) {}
  try { if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: name(p), artist: 'Anands Player' }); } catch (e) {}
}
function hook(m) {
  if (m._h) return; m._h = 1;
  m.addEventListener('timeupdate', function () { if (el() !== m) return; $('#tcur').textContent = fmt(m.currentTime); $('#tdur').textContent = fmt(m.duration); if (m.duration) $('#seek').value = Math.round(m.currentTime / m.duration * 1000); });
  m.addEventListener('ended', function () { if (el() === m) next(true); });
  m.addEventListener('play', sync); m.addEventListener('pause', sync); m.addEventListener('error', function () { if (el() === m && P.cur) T.toast('This format cannot be played in the browser'); });
}
function sync() { var m = el(), on = P.cur && !m.paused; $('#bplay').innerHTML = T.ic(on ? 'pause' : 'play'); $('#bplay').setAttribute('aria-label', on ? 'Pause' : 'Play'); $('#pl').classList.toggle('playing', !!on); }
function toggle() { if (!P.cur) { if (P.q.length) play(Math.max(P.i, 0)); return; } var m = el(); if (m.paused) m.play(); else m.pause(); }
function next(auto) {
  if (!P.q.length) return; if (auto && P.rep === 2) return play(P.i);
  var n = P.shuf ? Math.floor(Math.random() * P.q.length) : P.i + 1;
  if (n >= P.q.length) { if (P.rep === 1 || !auto) n = 0; else return sync(); } play(n);
}
function prev() { var m = el(); if (P.cur && m.currentTime > 4) { m.currentTime = 0; return; } play(P.i <= 0 ? P.q.length - 1 : P.i - 1); }
function addQ(paths, now) { var first = P.q.length; paths.forEach(function (p) { if (P.q.indexOf(p) < 0) P.q.push(p); }); if (now) play(P.q.indexOf(paths[0])); else T.toast(paths.length + ' added to the queue'); drawBody(); void first; }
/* library */
function lib(dir) {
  P.dir = dir; T.fs.list(dir).then(function (l) { l.sort(function (a, b) { return (b.is_dir - a.is_dir) || a.name.localeCompare(b.name, undefined, { numeric: true }); }); P.files = l; drawBody(); }).catch(function (e) { $('#pbody').innerHTML = '<p class="tmuted" style="padding:12px">' + esc(e.message) + '</p>'; });
}
function row(p, label, kind, cur) { return '<div class="trow' + (cur ? ' cur' : '') + '" data-p="' + esc(p) + '" data-k="' + kind + '">' + T.ic(kind === 'dir' ? 'folder' : 'play') + '<span>' + esc(label) + '</span>' + (kind === 'file' ? '<div class="acts"><button data-a="add" aria-label="Add to queue">' + T.ic('plus') + '</button></div>' : kind === 'q' ? '<div class="acts"><button data-a="rm" aria-label="Remove">' + T.ic('x') + '</button></div>' : '') + '</div>'; }
function drawBody() {
  var b = $('#pbody'), h = '';
  if (P.tab === 'lib') {
    var media = P.files.filter(function (f) { return !f.is_dir && MEDIA.test(f.name); });
    h = '<div class="crumb">' + esc(P.dir) + '</div>' + (P.dir !== '/' ? row(T.dirOf(P.dir), '..', 'dir') : '') + P.files.filter(function (f) { return f.is_dir; }).map(function (f) { return row(f.path, f.name, 'dir'); }).join('') + (media.length ? '<div class="plhead"><button class="tb" data-a="addall">Play all ' + media.length + '</button></div>' : '') + media.map(function (f) { return row(f.path, f.name, 'file', P.cur && P.cur.path === f.path); }).join('');
    if (!media.length && !P.files.some(function (f) { return f.is_dir; })) h += '<p class="tmuted" style="padding:12px">No audio or video in this folder.</p>';
  } else if (P.tab === 'q') {
    h = '<div class="plhead"><button class="tb" data-a="clear">Clear</button><button class="tb" data-a="saveq">Save as playlist</button></div>' + (P.q.length ? P.q.map(function (p, i) { return '<div class="trow' + (i === P.i ? ' cur' : '') + '" data-i="' + i + '" data-k="q">' + T.ic('play') + '<span>' + esc(name(p)) + '</span><div class="acts"><button data-a="rm" aria-label="Remove">' + T.ic('x') + '</button></div></div>'; }).join('') : '<p class="tmuted" style="padding:12px">The queue is empty. Add songs or videos from the library.</p>');
  } else {
    var names = Object.keys(P.pls);
    h = (names.length ? names.map(function (n) { return '<div class="trow" data-pl="' + esc(n) + '">' + T.ic('list') + '<span>' + esc(n) + ' <small class="tmuted">' + P.pls[n].length + '</small></span><div class="acts"><button data-a="plplay" aria-label="Play">' + T.ic('play') + '</button><button data-a="pldel" aria-label="Delete playlist">' + T.ic('trash') + '</button></div></div>'; }).join('') : '<p class="tmuted" style="padding:12px">No playlists yet. Build a queue, then choose Save as playlist.</p>');
    if (T._plsave) h = '<div class="plhead"><input class="tin" id="plname" placeholder="Playlist name" aria-label="Playlist name"><button class="tb pri" data-a="plok">Save</button></div>' + h;
  }
  b.innerHTML = h;
}
function loadPls() { return T.fs.read('/Playlists/playlists.json').then(function (t) { try { P.pls = JSON.parse(t) || {}; } catch (e) { P.pls = {}; } }).catch(function () { P.pls = {}; }).then(function () { P.plLoaded = true; }); }
function savePls() { return T.fs.mkdir('/Playlists').catch(function () {}).then(function () { return T.fs.write('/Playlists/playlists.json', JSON.stringify(P.pls), 'application/json', true); }).catch(function (e) { T.toast(e.message); }); }
function init() {
  ['shuf', 'prev', 'next', 'rep'].forEach(function (k) { $('#b' + k).innerHTML = T.ic(k); }); sync();
  $('#bplay').onclick = toggle; $('#bnext').onclick = function () { next(false); }; $('#bprev').onclick = prev;
  $('#bshuf').onclick = function () { P.shuf = !P.shuf; this.classList.toggle('on', P.shuf); this.setAttribute('aria-pressed', P.shuf); };
  $('#brep').onclick = function () { P.rep = (P.rep + 1) % 3; this.classList.toggle('on', P.rep > 0); this.setAttribute('aria-pressed', P.rep > 0); this.title = ['Repeat off', 'Repeat all', 'Repeat one'][P.rep]; T.toast(this.title); };
  $('#seek').oninput = function () { var m = el(); if (m.duration) m.currentTime = this.value / 1000 * m.duration; };
  $('#vol').oninput = function () { vid.volume = P.a.volume = this.value / 100; }; $('#spd').onchange = function () { vid.playbackRate = P.a.playbackRate = Number(this.value); };
  $('#bfull').onclick = function () { var s = $('#stage'); (s.requestFullscreen || function () {}).call(s); };
  $('.ptabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; P.tab = b.dataset.t; [].forEach.call(this.children, function (c) { c.classList.toggle('on', c === b); }); if (P.tab === 'pls' && !P.plLoaded) loadPls().then(drawBody); drawBody(); });
  $('#pbody').addEventListener('click', function (e) {
    var a = e.target.closest('[data-a]'), r = e.target.closest('.trow'), act = a && a.dataset.a;
    if (act === 'addall') { var ps = P.files.filter(function (f) { return !f.is_dir && MEDIA.test(f.name); }).map(function (f) { return f.path; }); P.q = []; P.i = -1; return addQ(ps, true); }
    if (act === 'clear') { P.q = []; P.i = -1; return drawBody(); }
    if (act === 'saveq') { if (!P.q.length) return T.toast('Add something to the queue first'); T._plsave = true; P.tab = 'pls'; [].forEach.call($('.ptabs').children, function (c) { c.classList.toggle('on', c.dataset.t === 'pls'); }); return (P.plLoaded ? Promise.resolve() : loadPls()).then(function () { drawBody(); var n = $('#plname'); if (n) n.focus(); }); }
    if (act === 'plok') { var n = $('#plname').value.trim(); if (!n) return T.toast('Name the playlist'); P.pls[n] = P.q.slice(); T._plsave = false; return savePls().then(function () { T.toast('Saved ' + n); drawBody(); }); }
    if (!r) return; var k = r.dataset.k, p = r.dataset.p;
    if (r.dataset.pl) { var pn = r.dataset.pl; if (act === 'pldel') { delete P.pls[pn]; return savePls().then(drawBody); } P.q = P.pls[pn].slice(); P.i = -1; P.tab = 'q'; [].forEach.call($('.ptabs').children, function (c) { c.classList.toggle('on', c.dataset.t === 'q'); }); if (!P.q.length) return drawBody(); return play(0); }
    if (act === 'add') return addQ([p], false); if (act === 'rm') { var i = +r.dataset.i; P.q.splice(i, 1); if (i < P.i) P.i--; else if (i === P.i) { P.i = -1; } return drawBody(); }
    if (k === 'dir') return lib(p); if (k === 'file') { var at = P.q.indexOf(p); if (at < 0) { P.q.push(p); at = P.q.length - 1; } return play(at); } if (k === 'q') return play(+r.dataset.i);
  });
  document.addEventListener('keydown', function (e) { if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'range') return; if (e.code === 'Space') { e.preventDefault(); toggle(); } if (e.key === 'ArrowRight') { var m = el(); m.currentTime += 10; } if (e.key === 'ArrowLeft') { var n = el(); n.currentTime -= 10; } if (e.key.toLowerCase() === 'n') next(false); if (e.key.toLowerCase() === 'p') prev(); });
  window.addEventListener('message', function (e) { if (e.origin === location.origin && e.data && e.data.aosTool === 'open') { addQ([e.data.path], true); } });
  var f = T.q('path'); lib(f && MEDIA.test(f) ? T.dirOf(f) : f || '/'); if (f && MEDIA.test(f)) addQ([f], true); loadPls();
  try { if ('mediaSession' in navigator) { navigator.mediaSession.setActionHandler('play', toggle); navigator.mediaSession.setActionHandler('pause', toggle); navigator.mediaSession.setActionHandler('nexttrack', function () { next(false); }); navigator.mediaSession.setActionHandler('previoustrack', prev); } } catch (e) {}
}
init();
})();
