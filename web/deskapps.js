/* Desktop-only apps: Sticky Notes, Clock (world / alarms / timer / stopwatch / focus), Converter, Screenshot and Snip, Quick Launcher.
 * They live in the desktop shell only (not in the Suite). Notes and alarms are saved on the server per person (/api/desk). */
(function () {
  'use strict';
  var A = window.AOS; if (!A) return;
  var $ = A.$, esc = A.esc, api = A.api, toast = A.toast, LS = A.LS, enc = encodeURIComponent;
  var X = { ids: { clock: 1, conv: 1, snip: 1 } };
  var N = { notes: [], alarms: [], loaded: false, t: 0, z: 1 };
  var COLS = { y: '#ffd966', o: '#ffb066', p: '#ff9fb2', g: '#a8e6a1', b: '#9fd0ff' };
  function dx() { return window.AOSDesk && window.AOSDesk.x; }
  function rid() { return Math.random().toString(36).slice(2, 10); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- storage ---------- */
  function persist() {
    LS.set('deskx', { notes: N.notes, alarms: N.alarms });
    clearTimeout(N.t); N.t = setTimeout(function () { api('/api/desk', { method: 'PUT', json: { notes: N.notes, alarms: N.alarms } }).catch(function () {}); }, 700);
    clearTimeout(JM.t); JM.t = setTimeout(mirror, 2000);
  }
  /* Every sticky note is also a note in the "Sticky Notes" notebook of Notes (Joplin). Quietly skipped when Notes is not connected. */
  var JM = { t: 0, busy: false, off: false, folder: '' };
  function jmap() { return LS.get('snj', {}) || {}; }
  function jf(path, o) { return api('/api/joplin' + path, o); }
  function jfolder() {
    if (JM.folder) return Promise.resolve(JM.folder);
    return jf('/meta').then(function (m) { var f = (m.folders || []).filter(function (x) { return x.title === 'Sticky Notes' && !x.parent; })[0]; return f || jf('/folders', { method: 'POST', json: { title: 'Sticky Notes' } }); }).then(function (f) { JM.folder = f.id; return f.id; });
  }
  function mirror() {
    if (JM.off) return; if (JM.busy) { JM.t = setTimeout(mirror, 1500); return; } var J = jmap(), live = {}, todo = [];
    N.notes.forEach(function (n) { live[n.id] = 1; var e = J[n.id]; if (n.t && (!e || e.t !== n.t)) todo.push(n); });
    var gone = Object.keys(J).filter(function (k) { return !live[k]; }); if (!todo.length && !gone.length) return; JM.busy = true;
    var chain = jfolder();
    todo.forEach(function (n) { chain = chain.then(function (fid) {
      var e = J[n.id], title = (n.t.split('\n')[0] || 'Sticky note').trim().slice(0, 60) || 'Sticky note', txt = n.t;
      var rq = e && e.id ? jf('/notes/' + e.id, { method: 'PUT', json: { title: title, body: txt, base: e.rev } }) : jf('/notes', { method: 'POST', json: { title: title, body: txt, folder: fid } });
      return rq.then(function (r) { J[n.id] = { id: r.id, rev: r.rev, t: txt }; LS.set('snj', J); return fid; }, function (er) { if (er && er.status === 409 && e) { return jf('/notes/' + e.id).then(function (r) { J[n.id] = { id: r.id, rev: r.rev, t: e.t }; LS.set('snj', J); JM.t = setTimeout(mirror, 500); return fid; }); } throw er; });
    }); });
    gone.forEach(function (k) { chain = chain.then(function (fid) { var e = J[k]; delete J[k]; LS.set('snj', J); return e && e.id ? jf('/notes/' + e.id + '/trash', { method: 'POST', json: {} }).then(function () { return fid; }, function () { return fid; }) : fid; }); });
    chain.then(function () { JM.busy = false; }, function (er) { JM.busy = false; if (er && (er.status === 404 || er.status === 403 || er.status === 401 || er.status === 502 || er.status === 503)) JM.off = true; });
  }
  function load() {
    if (N.loaded) return Promise.resolve();
    var loc = LS.get('deskx', null);
    return api('/api/desk').then(function (j) { N.notes = j.notes || []; N.alarms = j.alarms || []; if (!N.notes.length && !N.alarms.length && loc) { N.notes = loc.notes || []; N.alarms = loc.alarms || []; } N.loaded = true; }, function () { if (loc) { N.notes = loc.notes || []; N.alarms = loc.alarms || []; } N.loaded = true; });
  }

  /* ---------- sound ---------- */
  var AC = null;
  function beep(times) {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
      for (var i = 0; i < (times || 3); i++) { var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + i * 0.35; o.type = 'sine'; o.frequency.value = 880; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + 0.3); }
    } catch (e) {}
  }

  /* ---------- Sticky Notes ---------- */
  function stickHost() { return document.getElementById('dkstick'); }
  function noteEl(n) {
    var el = document.createElement('div'); el.className = 'dk-sn'; el.setAttribute('data-nid', n.id); el.setAttribute('data-c', n.c || 'y');
    el.innerHTML = '<div class="dk-sn-t" data-sn="drag"><span class="dk-sn-cs">' + Object.keys(COLS).map(function (k) { return '<button type="button" data-sn="col" data-c="' + k + '" style="background:' + COLS[k] + '" aria-label="Colour ' + k + '"></button>'; }).join('') + '</span><span class="sp"></span><button type="button" class="dk-sn-x" data-sn="del" aria-label="Delete note" title="Delete note">&#215;</button></div>' +
      '<div class="dk-sn-b" contenteditable="plaintext-only" spellcheck="false" aria-label="Sticky note"></div>';
    el.querySelector('.dk-sn-b').textContent = n.t || '';
    return el;
  }
  function paintNote(el, n) {
    var ar = dx() ? dx().area() : { w: innerWidth, h: innerHeight - 52 };
    n.w = Math.max(150, Math.min(n.w || 230, ar.w)); n.h = Math.max(110, Math.min(n.h || 220, ar.h));
    n.x = Math.max(0, Math.min(n.x || 0, ar.w - 60)); n.y = Math.max(0, Math.min(n.y || 0, ar.h - 40));
    el.style.cssText = 'left:' + n.x + 'px;top:' + n.y + 'px;width:' + n.w + 'px;height:' + n.h + 'px;z-index:' + (n.z || 1);
    el.setAttribute('data-c', n.c || 'y');
  }
  function renderNotes() {
    var h = stickHost(); if (!h) return;
    var have = {}; [].forEach.call(h.children, function (e) { have[e.getAttribute('data-nid')] = e; });
    var ids = {}; N.notes.forEach(function (n) {
      ids[n.id] = 1; var el = have[n.id]; if (!el) { el = noteEl(n); h.appendChild(el); } paintNote(el, n);
      N.z = Math.max(N.z, n.z || 1);
    });
    Object.keys(have).forEach(function (k) { if (!ids[k]) have[k].remove(); });
  }
  function noteBy(el) { var id = el && el.closest('.dk-sn') && el.closest('.dk-sn').getAttribute('data-nid'); return N.notes.filter(function (n) { return n.id === id; })[0]; }
  function raise(n, el) { n.z = ++N.z; el.style.zIndex = n.z; }
  function newNote(text, at) {
    return load().then(function () {
      if (N.notes.length >= 60) { toast('You have 60 notes. Delete one first'); return null; }
      var ar = dx() ? dx().area() : { w: innerWidth, h: innerHeight - 52 }, k = N.notes.length % 8;
      var n = { id: rid(), x: at ? at.x : 90 + k * 28, y: at ? at.y : 70 + k * 28, w: 230, h: 220, z: ++N.z, c: ['y', 'o', 'p', 'g', 'b'][N.notes.length % 5], t: text || '' };
      n.x = Math.max(0, Math.min(n.x, ar.w - n.w)); n.y = Math.max(0, Math.min(n.y, ar.h - n.h));
      N.notes.push(n); renderNotes(); persist();
      var el = stickHost() && stickHost().querySelector('[data-nid="' + n.id + '"] .dk-sn-b'); if (el && !text) setTimeout(function () { el.focus(); }, 30);
      return n;
    });
  }
  function bindNotes() {
    var h = stickHost(); if (!h || h._bound) return; h._bound = true;
    h.addEventListener('input', function (e) { var n = noteBy(e.target); if (n && e.target.classList.contains('dk-sn-b')) { n.t = (e.target.innerText || '').slice(0, 4000); persist(); } });
    h.addEventListener('keydown', function (e) { e.stopPropagation(); });
    h.addEventListener('pointerdown', function (e) {
      var el = e.target.closest('.dk-sn'); if (!el) return; var n = noteBy(el); if (!n) return; raise(n, el);
      var t = e.target.closest('[data-sn]'); if (!t) return;
      var a = t.getAttribute('data-sn');
      if (a === 'col') { n.c = t.getAttribute('data-c'); el.setAttribute('data-c', n.c); persist(); return; }
      if (a === 'del') { if (!n.t) { N.notes = N.notes.filter(function (x) { return x !== n; }); el.remove(); persist(); return; } if (t.getAttribute('data-ask')) { N.notes = N.notes.filter(function (x) { return x !== n; }); el.remove(); persist(); return; } t.setAttribute('data-ask', '1'); t.textContent = 'Delete?'; t.classList.add('ask'); setTimeout(function () { t.removeAttribute('data-ask'); t.textContent = '×'; t.classList.remove('ask'); }, 3000); return; }
      if (a === 'drag') {
        e.preventDefault(); var sx = e.clientX, sy = e.clientY, ox = n.x, oy = n.y; el.classList.add('mv');
        var mv = function (m) { var ar = dx().area(); n.x = Math.max(0, Math.min(ox + m.clientX - sx, ar.w - 60)); n.y = Math.max(0, Math.min(oy + m.clientY - sy, ar.h - 40)); el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; };
        var up = function () { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); el.classList.remove('mv'); persist(); };
        document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
      }
    });
    h.addEventListener('pointerup', function (e) { var el = e.target.closest('.dk-sn'); if (!el) return; var n = noteBy(el); if (!n) return; var w = Math.round(el.offsetWidth), hh = Math.round(el.offsetHeight); if (w !== n.w || hh !== n.h) { n.w = w; n.h = hh; persist(); } });
  }

  /* ---------- Clock ---------- */
  var ZONES = [['Africa/Dar_es_Salaam', 'Dar es Salaam'], ['Africa/Lusaka', 'Lusaka'], ['Africa/Kinshasa', 'Kinshasa'], ['Africa/Kampala', 'Kampala'], ['Africa/Nairobi', 'Nairobi'], ['Africa/Johannesburg', 'Johannesburg'], ['Asia/Dubai', 'Dubai'], ['Asia/Kolkata', 'Kochi']];
  var C = { tab: 'world', tm: { total: 300, end: 0, left: 300, run: false }, sw: { acc: 0, start: 0, run: false, laps: [] }, pf: { phase: 'focus', end: 0, left: 1500, run: false, n: 0 }, fired: '', pop: null };
  function fmtHMS(ms, cs) { var t = Math.max(0, Math.floor(ms / 10)), c = t % 100, s = Math.floor(t / 100) % 60, m = Math.floor(t / 6000) % 60, h = Math.floor(t / 360000); return (h ? h + ':' + pad(m) : m) + ':' + pad(s) + (cs ? '.' + pad(c) : ''); }
  function zoneTime(z, d) { try { return new Intl.DateTimeFormat([], { timeZone: z, hour: '2-digit', minute: '2-digit', hour12: false }).format(d); } catch (e) { return '--:--'; } }
  function zoneDay(z, d) { try { var a = new Intl.DateTimeFormat('en-CA', { timeZone: z }).format(d), b = new Intl.DateTimeFormat('en-CA').format(d); return a === b ? 'Today' : a > b ? 'Tomorrow' : 'Yesterday'; } catch (e) { return ''; } }
  function zoneOff(z, d) { try { var s = new Intl.DateTimeFormat('en-US', { timeZone: z, timeZoneName: 'shortOffset' }).format(d); return (s.match(/GMT[^ ]*/) || [''])[0].replace('GMT', 'UTC'); } catch (e) { return ''; } }
  function popHtml() {
    var tabs = [['world', 'World'], ['alarm', 'Alarms'], ['timer', 'Timer'], ['sw', 'Stopwatch'], ['pf', 'Focus']];
    return '<div class="dk-cp-tabs" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-cp="tab" data-t="' + t[0] + '" class="' + (C.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div><div class="dk-cp-b" id="dkcpb"></div>';
  }
  function paintPop() {
    var b = document.getElementById('dkcpb'); if (!b) return; var now = new Date(), h = '';
    document.querySelectorAll('#dkclockpop [data-cp="tab"]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-t') === C.tab); });
    if (C.tab === 'world') {
      h = '<div class="dk-cp-big">' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + '</div><div class="dk-cp-sub">' + esc(now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) + '</div><div class="dk-cp-zl">' + ZONES.map(function (z) { return '<div class="dk-cp-z"><span><b>' + esc(z[1]) + '</b><small>' + zoneDay(z[0], now) + ' &middot; ' + esc(zoneOff(z[0], now)) + '</small></span><em>' + zoneTime(z[0], now) + '</em></div>'; }).join('') + '</div>';
    } else if (C.tab === 'alarm') {
      if (b.getAttribute('data-k') === 'alarm') return;
      h = '<div class="dk-cp-al">' + (N.alarms.length ? N.alarms.map(function (a) { return '<div class="dk-cp-a"><label class="dk-sw"><input type="checkbox" data-cp="aon" data-id="' + a.id + '"' + (a.on ? ' checked' : '') + '><i></i></label><span><b>' + pad(a.h) + ':' + pad(a.m) + '</b><small>' + esc(a.label || 'Alarm') + ' &middot; ' + (a.days && a.days.length ? a.days.map(function (d) { return 'SMTWTFS'[d]; }).join(' ') : 'Once') + '</small></span><button type="button" data-cp="adel" data-id="' + a.id + '" aria-label="Delete alarm">&#215;</button></div>'; }).join('') : '<p class="dk-cp-e">No alarms yet.</p>') + '</div>' +
        '<form class="dk-cp-f" data-cp-form="alarm"><input type="time" name="t" value="07:00" required aria-label="Time"><input name="l" placeholder="Label" maxlength="40" aria-label="Label"><span class="dk-cp-d">' + 'SMTWTFS'.split('').map(function (c, i) { return '<label><input type="checkbox" name="d" value="' + i + '"><span>' + c + '</span></label>'; }).join('') + '</span><button class="btn pri sm" type="submit">Add alarm</button></form>';
    } else if (C.tab === 'timer') {
      var left = C.tm.run ? Math.max(0, C.tm.end - Date.now()) : C.tm.left * 1000;
      h = '<div class="dk-cp-big" id="dkcpt">' + fmtHMS(left) + '</div><div class="dk-cp-pre">' + [[60, '1 min'], [300, '5 min'], [600, '10 min'], [900, '15 min'], [1800, '30 min'], [3600, '1 hour']].map(function (p) { return '<button type="button" data-cp="tset" data-s="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div><div class="dk-cp-act"><button class="btn pri" type="button" data-cp="tgo">' + (C.tm.run ? 'Pause' : 'Start') + '</button><button class="btn" type="button" data-cp="treset">Reset</button></div>';
    } else if (C.tab === 'sw') {
      var el = C.sw.acc + (C.sw.run ? Date.now() - C.sw.start : 0);
      h = '<div class="dk-cp-big" id="dkcps">' + fmtHMS(el, true) + '</div><div class="dk-cp-act"><button class="btn pri" type="button" data-cp="sgo">' + (C.sw.run ? 'Stop' : 'Start') + '</button><button class="btn" type="button" data-cp="slap"' + (C.sw.run ? '' : ' disabled') + '>Lap</button><button class="btn" type="button" data-cp="sreset">Reset</button></div><ol class="dk-cp-laps">' + C.sw.laps.slice().reverse().map(function (l, i) { return '<li><span>Lap ' + (C.sw.laps.length - i) + '</span><em>' + fmtHMS(l, true) + '</em></li>'; }).join('') + '</ol>';
    } else {
      var pl = C.pf.run ? Math.max(0, C.pf.end - Date.now()) : C.pf.left * 1000, foc = C.pf.phase === 'focus';
      h = '<div class="dk-cp-sub">' + (foc ? 'Focus' : C.pf.phase === 'long' ? 'Long break' : 'Short break') + ' &middot; round ' + (C.pf.n % 4 + (foc ? 1 : 0) || 4) + ' of 4</div><div class="dk-cp-big" id="dkcpp">' + fmtHMS(pl) + '</div><div class="dk-cp-act"><button class="btn pri" type="button" data-cp="pgo">' + (C.pf.run ? 'Pause' : 'Start') + '</button><button class="btn" type="button" data-cp="pskip">Skip</button><button class="btn" type="button" data-cp="preset">Reset</button></div><p class="dk-cp-e">25 minutes focus, 5 minutes break, 15 after four rounds.</p>';
    }
    if (b.getAttribute('data-k') === C.tab && (C.tab === 'timer' || C.tab === 'sw' || C.tab === 'pf') && b.getAttribute('data-h') === h.replace(/>[0-9:.]+</g, '><')) {
      var big = b.querySelector('.dk-cp-big'), nb = h.match(/dk-cp-big"[^>]*>([^<]*)</); if (big && nb) big.textContent = nb[1]; return;
    }
    b.setAttribute('data-k', C.tab); b.setAttribute('data-h', h.replace(/>[0-9:.]+</g, '><')); b.innerHTML = h;
  }
  function closePop() { var p = document.getElementById('dkclockpop'); if (p) p.remove(); document.removeEventListener('pointerdown', popOut, true); document.removeEventListener('keydown', popKey, true); }
  function popOut(e) { var p = document.getElementById('dkclockpop'); if (p && !p.contains(e.target) && !e.target.closest('[data-dk="clockpop"]')) closePop(); }
  function popKey(e) { if (e.key === 'Escape') { closePop(); e.stopPropagation(); } }
  X.clockpop = function () {
    if (document.getElementById('dkclockpop')) return closePop();
    load().then(function () {
      var r = dx().root, p = document.createElement('div'); p.id = 'dkclockpop'; p.className = 'dk-cp'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Clock'); p.innerHTML = popHtml(); r.appendChild(p);
      paintPop(); document.addEventListener('pointerdown', popOut, true); document.addEventListener('keydown', popKey, true);
    });
  };
  X.open = function (id) {
    if (id === 'clock') { if (!document.getElementById('dkclockpop')) X.clockpop(); return null; }
    if (id === 'snip') { X.snip(); return null; }
    if (id === 'conv') return convWin();
  };
  function ringAlarms() {
    var d = new Date(), key = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes();
    if (C.fired === key) return; var hit = false;
    N.alarms.forEach(function (a) { if (a.on && a.h === d.getHours() && a.m === d.getMinutes() && (!a.days || !a.days.length || a.days.indexOf(d.getDay()) >= 0)) { hit = true; toast('Alarm ' + pad(a.h) + ':' + pad(a.m) + (a.label ? ' - ' + a.label : '')); if (!a.days || !a.days.length) a.on = false; } });
    if (hit) { C.fired = key; beep(4); persist(); var pb = document.getElementById('dkcpb'); if (pb) pb.removeAttribute('data-k'); }
  }
  function tick() {
    var now = Date.now();
    if (C.tm.run && now >= C.tm.end) { C.tm.run = false; C.tm.left = C.tm.total; beep(4); toast('Timer finished'); }
    if (C.pf.run && now >= C.pf.end) { pfNext(true); }
    if (N.loaded) ringAlarms();
    if (document.getElementById('dkclockpop')) paintPop();
  }
  function pfNext(auto) {
    var p = C.pf; if (p.phase === 'focus') { p.n++; p.phase = p.n % 4 === 0 ? 'long' : 'short'; } else p.phase = 'focus';
    p.left = p.phase === 'focus' ? 1500 : p.phase === 'long' ? 900 : 300; p.run = !!auto; p.end = Date.now() + p.left * 1000;
    if (auto) { beep(3); toast(p.phase === 'focus' ? 'Break over. Time to focus' : 'Focus round done. Take a break'); }
  }
  var pop = function (e) {
    var t = e.target.closest('[data-cp]'); if (!t) return; var a = t.getAttribute('data-cp');
    if (a === 'tab') { C.tab = t.getAttribute('data-t'); return paintPop(); }
    if (a === 'tset') { C.tm.total = C.tm.left = +t.getAttribute('data-s'); C.tm.run = false; return paintPop(); }
    if (a === 'tgo') { if (C.tm.run) { C.tm.left = Math.max(1, Math.round((C.tm.end - Date.now()) / 1000)); C.tm.run = false; } else { C.tm.end = Date.now() + C.tm.left * 1000; C.tm.run = true; try { if (!AC) beep(0); } catch (x) {} } return paintPop(); }
    if (a === 'treset') { C.tm.run = false; C.tm.left = C.tm.total; return paintPop(); }
    if (a === 'sgo') { if (C.sw.run) { C.sw.acc += Date.now() - C.sw.start; C.sw.run = false; } else { C.sw.start = Date.now(); C.sw.run = true; } return paintPop(); }
    if (a === 'slap') { C.sw.laps.push(C.sw.acc + Date.now() - C.sw.start); return paintPop(); }
    if (a === 'sreset') { C.sw = { acc: 0, start: 0, run: false, laps: [] }; return paintPop(); }
    if (a === 'pgo') { if (C.pf.run) { C.pf.left = Math.max(1, Math.round((C.pf.end - Date.now()) / 1000)); C.pf.run = false; } else { C.pf.end = Date.now() + C.pf.left * 1000; C.pf.run = true; try { if (!AC) beep(0); } catch (x) {} } return paintPop(); }
    if (a === 'pskip') { pfNext(C.pf.run); return paintPop(); }
    if (a === 'preset') { C.pf = { phase: 'focus', end: 0, left: 1500, run: false, n: 0 }; return paintPop(); }
    if (a === 'adel') { N.alarms = N.alarms.filter(function (x) { return x.id !== t.getAttribute('data-id'); }); persist(); var b = document.getElementById('dkcpb'); if (b) b.removeAttribute('data-k'); return paintPop(); }
  };
  document.addEventListener('click', function (e) { if (e.target.closest('#dkclockpop')) pop(e); });
  document.addEventListener('change', function (e) { var t = e.target; if (t.getAttribute && t.getAttribute('data-cp') === 'aon') { var a = N.alarms.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]; if (a) { a.on = t.checked; persist(); } } });
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f.getAttribute || f.getAttribute('data-cp-form') !== 'alarm') return; e.preventDefault();
    var tv = (f.elements.t.value || '07:00').split(':'), days = [].map.call(f.querySelectorAll('input[name="d"]:checked'), function (c) { return +c.value; });
    if (N.alarms.length >= 30) return toast('You have 30 alarms. Delete one first');
    N.alarms.push({ id: rid(), h: +tv[0], m: +tv[1], label: (f.elements.l.value || '').trim().slice(0, 40), on: true, days: days }); N.alarms.sort(function (a, b) { return a.h * 60 + a.m - (b.h * 60 + b.m); }); persist();
    var b = document.getElementById('dkcpb'); if (b) b.removeAttribute('data-k'); paintPop();
  });

  /* ---------- Converter ---------- */
  var CAT = {
    Weight: { base: 'kg', u: [['tonne', 1000, 't'], ['kg', 1, 'kg'], ['g', 0.001, 'g'], ['short ton', 907.18474, 'ton'], ['lb', 0.45359237, 'lb']] },
    Distance: { base: 'm', u: [['km', 1000, 'km'], ['m', 1, 'm'], ['mile', 1609.344, 'mi'], ['nautical mile', 1852, 'nmi'], ['ft', 0.3048, 'ft']] },
    'Fuel and volume': { base: 'L', u: [['litre', 1, 'L'], ['m³', 1000, 'm3'], ['US gallon', 3.785411784, 'gal'], ['UK gallon', 4.54609, 'ukgal'], ['barrel', 158.987294928, 'bbl'], ['mL', 0.001, 'mL']] }
  };
  var ALIAS = { t: 'tonne', tonnes: 'tonne', tonne: 'tonne', kg: 'kg', kgs: 'kg', kilo: 'kg', kilos: 'kg', g: 'g', gram: 'g', grams: 'g', ton: 'short ton', tons: 'short ton', lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb', km: 'km', m: 'm', metre: 'm', meter: 'm', metres: 'm', meters: 'm', mi: 'mile', mile: 'mile', miles: 'mile', nm: 'nautical mile', nmi: 'nautical mile', ft: 'ft', feet: 'ft', foot: 'ft', l: 'litre', litre: 'litre', litres: 'litre', liter: 'litre', liters: 'litre', m3: 'm³', gal: 'US gallon', gallon: 'US gallon', gallons: 'US gallon', usgal: 'US gallon', ukgal: 'UK gallon', bbl: 'barrel', barrel: 'barrel', barrels: 'barrel', ml: 'mL' };
  var RATES = null;
  function loadRates() { if (RATES) return Promise.resolve(RATES); return api('/api/rates').then(function (j) { RATES = j; return j; }, function () { return null; }); }
  function unitOf(name) {
    var k = String(name || '').trim().toLowerCase(), cur = RATES && RATES.rates && Object.keys(RATES.rates).filter(function (c) { return c.toLowerCase() === k; })[0];
    var u = ALIAS[k]; if (!u) for (var cc in CAT) CAT[cc].u.forEach(function (x) { if (x[0].toLowerCase() === k) u = x[0]; });
    if (u) for (var c in CAT) { var f = CAT[c].u.filter(function (x) { return x[0] === u; })[0]; if (f) return { cat: c, name: u, f: f[1] }; }
    if (cur) return { cat: 'Currency', name: cur, f: 1 / RATES.rates[cur] };
    return null;
  }
  function conv(v, from, to) { var a = unitOf(from), b = unitOf(to); if (!a || !b || a.cat !== b.cat) return null; return v * a.f / b.f; }
  function numFmt(n) { if (n == null || !isFinite(n)) return '-'; var a = Math.abs(n); return a >= 1e9 || (a > 0 && a < 1e-4) ? n.toExponential(4) : (+n.toPrecision(10)).toLocaleString([], { maximumFractionDigits: a < 1 ? 8 : 4 }); }
  function convWin() {
    var d = dx(), found = null; (window.AOSDesk.state.wins || []).forEach(function (w) { if (w.kind === 'conv') found = w; }); if (found) { d.focus(found); return found; }
    var w = d.mk('conv', 'Converter', { w: 400, h: 520, icon: '/oicons/conv.svg' }); w.sd = { t: 'ext', id: 'conv' }; w.x = Math.max(0, Math.round((d.area().w - w.w) / 2)); d.place(w);
    var S = { cat: 'Weight', from: 'tonne', to: 'kg', v: '1' }, LSK = LS.get('convprefs', null); if (LSK && LSK.cat) S.cat = LSK.cat, S.from = LSK.from || S.from, S.to = LSK.to || S.to;
    w.body.innerHTML = '<div class="dk-conv" tabindex="0"><div class="dk-cv-c" role="tablist"></div><div class="dk-cv-row"><input class="dk-cv-v" inputmode="decimal" aria-label="Value" autocomplete="off"><select class="dk-cv-f" aria-label="From"></select></div><button type="button" class="dk-cv-sw" aria-label="Swap" title="Swap">&#8645;</button><div class="dk-cv-row"><output class="dk-cv-r" aria-live="polite"></output><select class="dk-cv-t" aria-label="To"></select></div><div class="dk-cv-n"></div><div class="dk-cv-all"></div></div>';
    var q = function (s) { return w.body.querySelector(s); };
    function units() { return S.cat === 'Currency' ? (RATES ? Object.keys(RATES.rates) : []) : CAT[S.cat].u.map(function (u) { return u[0]; }); }
    function draw() {
      var us = units(); if (us.indexOf(S.from) < 0) S.from = us[0]; if (us.indexOf(S.to) < 0) S.to = us[1] || us[0];
      q('.dk-cv-c').innerHTML = Object.keys(CAT).concat(['Currency']).map(function (c) { return '<button type="button" role="tab" data-c="' + esc(c) + '" class="' + (c === S.cat ? 'on' : '') + '">' + esc(c) + '</button>'; }).join('');
      var opts = us.map(function (u) { return '<option>' + esc(u) + '</option>'; }).join(''); q('.dk-cv-f').innerHTML = opts; q('.dk-cv-t').innerHTML = opts; q('.dk-cv-f').value = S.from; q('.dk-cv-t').value = S.to;
      calc();
    }
    function calc() {
      var v = parseFloat(String(S.v).replace(/,/g, '')), r = q('.dk-cv-r'), all = q('.dk-cv-all'), nt = q('.dk-cv-n');
      if (S.cat === 'Currency' && !RATES) { r.textContent = '-'; all.innerHTML = ''; nt.textContent = 'Rates are not available right now. Check your connection and try again.'; return; }
      if (!isFinite(v)) { r.textContent = '-'; all.innerHTML = ''; return; }
      var out = conv(v, S.from, S.to); r.textContent = out == null ? '-' : numFmt(out);
      all.innerHTML = units().filter(function (u) { return u !== S.from; }).slice(0, 12).map(function (u) { var o = conv(v, S.from, u); return '<div><span>' + esc(u) + '</span><em>' + numFmt(o) + '</em></div>'; }).join('');
      nt.textContent = S.cat === 'Currency' && RATES ? 'Rates updated ' + new Date(RATES.updated).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + (RATES.stale ? ' (the last saved rates, could not refresh)' : '') : '';
      LS.set('convprefs', { cat: S.cat, from: S.from, to: S.to });
    }
    var vi = q('.dk-cv-v'); vi.value = S.v;
    vi.addEventListener('input', function () { S.v = vi.value; calc(); });
    w.body.addEventListener('click', function (e) {
      var c = e.target.closest('[data-c]'); if (c) { S.cat = c.getAttribute('data-c'); if (S.cat === 'Currency') { S.from = 'USD'; S.to = 'TZS'; return loadRates().then(draw); } S.from = CAT[S.cat].u[0][0]; S.to = CAT[S.cat].u[1][0]; return draw(); }
      if (e.target.closest('.dk-cv-sw')) { var t = S.from; S.from = S.to; S.to = t; q('.dk-cv-f').value = S.from; q('.dk-cv-t').value = S.to; calc(); }
      if (e.target.closest('.dk-cv-r') && q('.dk-cv-r').textContent !== '-') { try { navigator.clipboard.writeText(q('.dk-cv-r').textContent.replace(/,/g, '')); toast('Copied'); } catch (x) {} }
    });
    w.body.addEventListener('change', function (e) { if (e.target.matches('.dk-cv-f')) { S.from = e.target.value; calc(); } if (e.target.matches('.dk-cv-t')) { S.to = e.target.value; calc(); } });
    w.body.addEventListener('keydown', function (e) { e.stopPropagation(); });
    if (S.cat === 'Currency') loadRates().then(draw); else draw();
    setTimeout(function () { vi.focus(); vi.select(); }, 30);
    return w;
  }

  /* ---------- Quick Launcher ---------- */
  var Q = { el: null, items: [], sel: 0, seq: 0, tm: 0 };
  var SETS = [['Settings', 'settings'], ['Servers', 'servers'], ['Photos', 'photos'], ['Insights', 'insights']];
  function isMath(s) { return /^[\d\s+\-*/().,%^x×÷√]+$|^(sqrt|sin|cos|tan|ln|log|pi)\b/i.test(s) && /[\d)]/.test(s) && /[+\-*/^x×÷%(]|sqrt|sin|cos|tan|ln|log/i.test(s); }
  function cmdItems(s) {
    var out = [], m, ce = dx() && dx().calcEval;
    if ((m = s.match(/^(?:calc|=)\s*(.+)$/i)) || isMath(s)) { var ex = m ? m[1] : s; try { var r = ce(ex.replace(/x/g, '*'), true, 0); if (r != null && !isNaN(r) && isFinite(r)) out.push({ g: 'Calculate', t: ex + ' = ' + numFmt(r), s: 'Press Enter to copy the answer', run: function () { try { navigator.clipboard.writeText(String(+r.toPrecision(12))); } catch (e) {} toast('Copied ' + numFmt(r)); } }); } catch (e) {} }
    if ((m = s.match(/^(?:convert\s+)?(-?[\d.,]+)\s*([a-z³0-9 ]+?)\s+(?:to|in|into)\s+([a-z³0-9 ]+)$/i))) {
      var r2 = conv(parseFloat(m[1].replace(/,/g, '')), m[2], m[3]); if (r2 != null) { var tu = unitOf(m[3]); out.push({ g: 'Convert', t: m[1] + ' ' + m[2].trim() + ' = ' + numFmt(r2) + ' ' + tu.name, s: 'Press Enter to copy the number', run: function () { try { navigator.clipboard.writeText(String(+r2.toPrecision(12))); } catch (e) {} toast('Copied ' + numFmt(r2)); } }); }
    }
    if ((m = s.match(/^note\s+(.+)$/i))) { var ntx = m[1]; out.push({ g: 'Sticky note', t: 'New note: ' + ntx.slice(0, 60), s: 'Press Enter to pin it to the desktop (also saved in Notes)', run: function () { newNote(ntx); } }); }
    else if (/^note$/i.test(s)) out.push({ g: 'Sticky note', t: 'New sticky note', s: 'Press Enter', run: function () { newNote(); } });
    if ((m = s.match(/^timer\s+(\d+(?:\.\d+)?)\s*(s|sec|m|min|h)?$/i))) { var secs = parseFloat(m[1]) * ({ s: 1, sec: 1, m: 60, min: 60, h: 3600 }[(m[2] || 'm').toLowerCase()] || 60); out.push({ g: 'Timer', t: 'Start a timer for ' + fmtHMS(secs * 1000), s: 'Press Enter to start. It rings here when done', run: function () { C.tm.total = C.tm.left = Math.round(secs); C.tm.end = Date.now() + secs * 1000; C.tm.run = true; beep(0); toast('Timer started'); } }); }
    return out;
  }
  function stdItems(s) {
    var d = dx(), low = s.toLowerCase(), out = [];
    d.catalog().forEach(function (c) { if ((c.name + ' ' + (c.hay || '')).toLowerCase().indexOf(low) >= 0 && out.length < 8) out.push({ g: 'Apps', t: c.name, s: c.cat, run: function () { d.launchKey(c.id); } }); });
    SETS.forEach(function (x) { if (x[0].toLowerCase().indexOf(low) >= 0 && (x[1] !== 'settings' || true)) out.push({ g: 'Go to', t: x[0], s: 'Open in Anands OS', run: function () { window.AOSDesk.hide(); A.go(x[1]); } }); });
    return out;
  }
  function openQ() {
    if (Q.el) { Q.el.querySelector('input').focus(); return; }
    var el = document.createElement('div'); el.className = 'dk-ql'; el.id = 'dkql'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Quick Launcher');
    el.innerHTML = '<div class="dk-ql-b"><div class="dk-ql-i"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="text" autocomplete="off" spellcheck="false" placeholder="Search apps and files, or try: 5 t to kg, 12*7, note buy tyres, timer 10" aria-label="Quick Launcher"></div><div class="dk-ql-r" role="listbox"></div><div class="dk-ql-h"><span>Enter open</span><span>Up Down choose</span><span>Esc close</span></div></div>';
    dx().root.appendChild(el); Q.el = el; Q.items = []; Q.sel = 0;
    var inp = el.querySelector('input'); inp.focus();
    el.addEventListener('pointerdown', function (e) { if (e.target === el) closeQ(); });
    el.addEventListener('click', function (e) { var r = e.target.closest('[data-qi]'); if (r) pick(+r.getAttribute('data-qi')); });
    el.addEventListener('mousemove', function (e) { var r = e.target.closest('[data-qi]'); if (r && +r.getAttribute('data-qi') !== Q.sel) { Q.sel = +r.getAttribute('data-qi'); mark(); } });
    inp.addEventListener('input', function () { search(inp.value.trim()); });
    inp.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); closeQ(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); Q.sel = Math.min(Q.items.length - 1, Q.sel + 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); Q.sel = Math.max(0, Q.sel - 1); mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(Q.sel); }
    });
    search('');
  }
  function closeQ() { if (Q.el) { Q.el.remove(); Q.el = null; } }
  function pick(i) { var it = Q.items[i]; if (!it) return; closeQ(); try { it.run(); } catch (e) { toast('Could not do that'); } }
  function mark() { if (!Q.el) return; Q.el.querySelectorAll('[data-qi]').forEach(function (r) { var on = +r.getAttribute('data-qi') === Q.sel; r.classList.toggle('on', on); r.setAttribute('aria-selected', on ? 'true' : 'false'); if (on) r.scrollIntoView({ block: 'nearest' }); }); }
  function paintQ() {
    if (!Q.el) return; var h = '', last = '';
    if (!Q.items.length) h = '<p class="dk-ql-e">Nothing found.</p>';
    Q.items.forEach(function (it, i) { if (it.g !== last) { h += '<div class="dk-ql-g">' + esc(it.g) + '</div>'; last = it.g; } h += '<div class="dk-ql-x" role="option" data-qi="' + i + '"><b>' + esc(it.t) + '</b><small>' + esc(it.s || '') + '</small></div>'; });
    Q.el.querySelector('.dk-ql-r').innerHTML = h; Q.sel = Math.min(Q.sel, Math.max(0, Q.items.length - 1)); mark();
  }
  function search(s) {
    var seq = ++Q.seq; clearTimeout(Q.tm);
    if (!s) { var d = dx(), rec = (LS.get('rlist', []) || []).slice(0, 6), items = [{ g: 'Try', t: 'Calculate', s: '12 * 7 + 3', run: function () { openQ(); Q.el.querySelector('input').value = '12 * 7 + 3'; search('12 * 7 + 3'); } }, { g: 'Try', t: 'Convert', s: '5 t to kg, 100 USD to TZS', run: function () { openQ(); Q.el.querySelector('input').value = '5 t to kg'; search('5 t to kg'); } }, { g: 'Try', t: 'New sticky note', s: 'note buy tyres', run: function () { newNote(); } }];
      Q.items = d.catalog().filter(function (c) { return rec.indexOf('a:' + c.id.replace('app:', '')) >= 0; }).slice(0, 5).map(function (c) { return { g: 'Recent', t: c.name, s: c.cat, run: function () { d.launchKey(c.id); } }; }).concat(items); Q.sel = 0; return paintQ(); }
    Q.items = cmdItems(s).concat(stdItems(s)); Q.sel = 0; paintQ();
    if (s.length < 2) return;
    Q.tm = setTimeout(function () {
      var more = [], jobs = [api('/api/search/files?q=' + enc(s)).then(function (j) {
        (j.items || []).slice(0, 6).forEach(function (f) { more.push({ g: 'Files', t: f.n, s: f.p, run: function () { dx().openFile(f.p); } }); });
      }, function () {})];
      if (A.isOwner && A.isOwner()) jobs.push(api('/api/paperless/documents?q=' + enc(s)).then(function (j) {
        (j.results || []).slice(0, 4).forEach(function (r) { more.push({ g: 'Paperless', t: r.title || ('Document ' + r.id), s: r.correspondent || r.created || '', run: function () { window.AOSDesk.tool('paperless'); } }); });
      }, function () {}));
      if (A.isOwner && A.isOwner()) jobs.push(api('/api/bookmarks/links?q=' + enc(s)).then(function (j) {
        (j.results || []).slice(0, 4).forEach(function (r) { more.push({ g: 'Links', t: r.name, s: r.host || '', run: function () { window.open(r.url, '_blank', 'noopener'); } }); });
      }, function () {}));
      if (A.isOwner && A.isOwner()) jobs.push(api('/api/joplin/notes?q=' + enc(s)).then(function (j) {
        (j.results || []).slice(0, 4).forEach(function (r) { more.push({ g: 'Notes', t: r.title, s: r.snippet || '', run: function () { window.AOSDesk.tool('notes'); } }); });
      }, function () {}));
      Promise.all(jobs).then(function () { if (seq !== Q.seq || !Q.el) return; var keep = Q.items; Q.items = keep.concat(more); paintQ(); });
    }, 250);
  }
  X.qs = function () { if (Q.el) closeQ(); else openQ(); };

  /* ---------- Screenshot and Snip ---------- */
  var SN = { el: null, mode: 'desk', busy: false };
  function saveShot(blob, dest) {
    var name = 'Screenshot ' + new Date().toISOString().slice(0, 19).replace('T', ' ').replace(/:/g, '-') + '.png';
    if (dest === 'drive') return api('/_local/fs/write?path=' + enc('/Drive/Screenshots/' + name) + '&mkdirs=1&overwrite=0', { method: 'POST', body: blob, headers: { 'content-type': 'image/png' } }).then(function () { toast('Saved to Drive / Screenshots'); return name; });
    if (dest === 'paperless') return api('/api/paperless/upload?name=' + enc(name), { method: 'POST', body: blob, headers: { 'content-type': 'image/png' } }).then(function () { toast('Sent to Paperless'); return name; });
    if (dest === 'clip') return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function () { toast('Copied to clipboard'); return name; }, function () { toast('Your browser would not copy the image. Use Download'); });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); toast('Downloaded'); return Promise.resolve(name);
  }
  X.saveShot = saveShot;
  function snipBar() {
    var own = A.isOwner && A.isOwner();
    return '<div class="dk-sp-m" role="group" aria-label="Capture"><button type="button" data-sp="m" data-m="desk" class="on">This desktop</button><button type="button" data-sp="m" data-m="pick">Window or screen</button><button type="button" data-sp="m" data-m="region">Region</button></div><span class="dk-sp-d">Save to <select data-sp="dest" aria-label="Save to"><option value="drive">Drive / Screenshots</option>' + (own ? '<option value="paperless">Paperless</option>' : '') + '<option value="clip">Clipboard</option><option value="dl">Download</option></select></span><button type="button" class="btn pri sm" data-sp="go">Capture</button><button type="button" class="dk-sp-x" data-sp="x" aria-label="Close">&#215;</button>';
  }
  function closeSnip() { if (SN.el) { SN.el.remove(); SN.el = null; } var o = document.getElementById('dkspov'); if (o) o.remove(); }
  X.snip = function () {
    if (SN.el) return closeSnip();
    var b = document.createElement('div'); b.className = 'dk-sp'; b.id = 'dksp'; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', 'Screenshot and Snip'); b.innerHTML = snipBar(); dx().root.appendChild(b); SN.el = b; SN.mode = 'desk';
    b.addEventListener('click', function (e) {
      var t = e.target.closest('[data-sp]'); if (!t) return; var a = t.getAttribute('data-sp');
      if (a === 'x') return closeSnip();
      if (a === 'm') { SN.mode = t.getAttribute('data-m'); b.querySelectorAll('[data-sp="m"]').forEach(function (x) { x.classList.toggle('on', x === t); }); return; }
      if (a === 'go') return capture(b.querySelector('[data-sp="dest"]').value);
    });
    b.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSnip(); });
  };
  function fromSvgDesktop() {
    // Draw the desktop (wallpaper, notes, windows' titles) into a canvas by rasterising a foreignObject copy. Iframes cannot be drawn, so they appear as plain panels.
    var r = dx().root, w = r.clientWidth, h = r.clientHeight, clone = r.cloneNode(true);
    ['dksp', 'dkql', 'dkclockpop'].forEach(function (id) { var e = clone.querySelector('#' + id); if (e) e.remove(); });
    clone.querySelectorAll('iframe').forEach(function (f) { var d = document.createElement('div'); d.style.cssText = 'width:100%;height:100%;background:#1a1a1f'; f.replaceWith(d); });
    clone.querySelectorAll('[contenteditable]').forEach(function (n) { n.removeAttribute('contenteditable'); });
    clone.removeAttribute('hidden'); clone.style.cssText = 'position:relative;width:' + w + 'px;height:' + h + 'px';
    var css = ''; for (var i = 0; i < document.styleSheets.length; i++) { try { css += [].map.call(document.styleSheets[i].cssRules, function (x) { return x.cssText; }).join('\n'); } catch (e) {} }
    var xml = new XMLSerializer().serializeToString(clone), svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>' + css.replace(/</g, '&lt;') + '</style>' + xml + '</div></foreignObject></svg>';
    return new Promise(function (ok, no) {
      var img = new Image(); img.onload = function () { var c = document.createElement('canvas'), k = Math.min(2, devicePixelRatio || 1); c.width = w * k; c.height = h * k; var g = c.getContext('2d'); g.scale(k, k); g.drawImage(img, 0, 0, w, h); c.toBlob(function (bl) { bl ? ok(bl) : no(new Error('blank')); }, 'image/png'); }; img.onerror = function () { no(new Error('raster')); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }
  function grabDisplay() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return Promise.reject(new Error('unsupported'));
    return navigator.mediaDevices.getDisplayMedia({ video: true, audio: false, preferCurrentTab: false }).then(function (st) {
      var v = document.createElement('video'); v.srcObject = st; v.muted = true;
      return v.play().then(function () { return new Promise(function (r) { setTimeout(r, 250); }); }).then(function () {
        var c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); st.getTracks().forEach(function (t) { t.stop(); }); return c;
      });
    });
  }
  function regionPick(canvas) {
    return new Promise(function (ok, no) {
      var ov = document.createElement('div'); ov.className = 'dk-spo'; ov.id = 'dkspov'; ov.innerHTML = '<div class="dk-spo-h">Drag to choose an area. Esc cancels</div><div class="dk-spo-r" hidden></div>'; document.body.appendChild(ov);
      var box = ov.querySelector('.dk-spo-r'), sx = 0, sy = 0, on = false;
      var done = function () { ov.remove(); document.removeEventListener('keydown', kd, true); };
      var kd = function (e) { if (e.key === 'Escape') { done(); no(new Error('cancel')); } }; document.addEventListener('keydown', kd, true);
      ov.addEventListener('pointerdown', function (e) { on = true; sx = e.clientX; sy = e.clientY; box.hidden = false; box.style.cssText = 'left:' + sx + 'px;top:' + sy + 'px;width:0;height:0'; ov.setPointerCapture(e.pointerId); });
      ov.addEventListener('pointermove', function (e) { if (!on) return; var x = Math.min(sx, e.clientX), y = Math.min(sy, e.clientY); box.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + Math.abs(e.clientX - sx) + 'px;height:' + Math.abs(e.clientY - sy) + 'px'; });
      ov.addEventListener('pointerup', function (e) {
        on = false; var x = Math.min(sx, e.clientX), y = Math.min(sy, e.clientY), w = Math.abs(e.clientX - sx), h = Math.abs(e.clientY - sy); done();
        if (w < 8 || h < 8) return no(new Error('cancel'));
        var kx = canvas.width / innerWidth, ky = canvas.height / innerHeight, c = document.createElement('canvas'); c.width = Math.round(w * kx); c.height = Math.round(h * ky); c.getContext('2d').drawImage(canvas, x * kx, y * ky, w * kx, h * ky, 0, 0, c.width, c.height); c.toBlob(function (bl) { ok(bl); }, 'image/png');
      });
    });
  }
  function capture(dest) {
    if (SN.busy) return; SN.busy = true; var mode = SN.mode, bar = SN.el; bar.style.visibility = 'hidden';
    var toBlob = function (c) { return new Promise(function (r) { c.toBlob(r, 'image/png'); }); };
    var job = mode === 'desk' ? fromSvgDesktop()
      : mode === 'pick' ? grabDisplay().then(toBlob)
      : grabDisplay().then(function (c) { return regionPick(c); });
    job.then(function (bl) { return saveShot(bl, dest); }).then(function () { closeSnip(); }, function (e) {
      if (e && e.message === 'cancel') toast('Snip cancelled'); else if (e && (e.name === 'NotAllowedError')) toast('Screen capture was not allowed'); else toast('Could not capture the screen. Try Window or screen');
      if (SN.el) SN.el.style.visibility = '';
    }).then(function () { SN.busy = false; if (SN.el) SN.el.style.visibility = ''; });
  }

  /* ---------- hooks used by the desktop shell ---------- */
  X.snew = function (b, ev) { var at = window.AOSDesk && window.AOSDesk.state && window.AOSDesk.state.ctxAt; newNote('', at); };
  X.show = function () {
    bindNotes(); load().then(function () { renderNotes(); });
    if (!X.timer) X.timer = setInterval(tick, 500);
  };
  X.closeAll = function () { closePop(); closeQ(); closeSnip(); };
  window.addEventListener('resize', function () { renderNotes(); });
  window.AOSDeskX = X;
})();
