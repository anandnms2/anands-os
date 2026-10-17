/* Life: Today (Daily Brief), Journal and notes, Documents, Net worth, Search. */
(function () {
'use strict';
var T = window.T, $ = T.$, esc = T.esc;
var L = { tab: 'today', brief: null, notes: null, cur: null, q: '', tag: '', kind: '', edit: false, docs: null, worth: null, sq: '', sres: null, saving: 0 };
var api = function (m, p, b) { return T.api('/api/life' + p, { method: m, json: b }); };
var NAV = [['today', 'Today', 'list'], ['journal', 'Journal and notes', 'file'], ['docs', 'Documents', 'save'], ['worth', 'Net worth', 'up'], ['search', 'Search', 'search']];
var TITLE = { today: 'Daily Brief', journal: 'Journal and notes', docs: 'Documents', worth: 'Net worth', search: 'Life Search' };
function pad(n) { return (n < 10 ? '0' : '') + n; }
function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function fd(d) { return d ? new Date(d + 'T12:00:00Z').toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''; }
function fdl(d) { return d ? new Date(d + 'T12:00:00Z').toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''; }
function money(n, c) { try { return new Intl.NumberFormat('en', { style: 'currency', currency: c || 'USD', maximumFractionDigits: 0 }).format(n); } catch (e) { return (c || '') + ' ' + Math.round(n); } }
function tone(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return ['#f68712', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6', '#eab308'][h % 10]; }
function err(e) { T.toast(e && e.message ? e.message : 'Something went wrong'); }
function modal(html, on) { var m = $('#mmodal'); m.innerHTML = '<div class="mbox" role="dialog" aria-modal="true">' + html + '</div>'; m.hidden = false; var f = m.querySelector('input:not([type=hidden]):not([type=file]),select,textarea'); if (f) setTimeout(function () { f.focus(); }, 30); if (on) on(); }
function close() { var m = $('#mmodal'); m.hidden = true; m.innerHTML = ''; }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#mmodal').hidden) close(); });
$('#mmodal').addEventListener('mousedown', function (e) { if (e.target === this) close(); });
function openApp(id) { try { if (parent !== window) parent.postMessage({ aosTool: 'app', id: id }, location.origin); } catch (e) {} }
function greeting() { var h = new Date().getHours(); return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
var MOODS = ['', '😞', '😕', '😐', '🙂', '😄'];

var R = {};
/* ---------- Today ---------- */
R.today = function () {
  var b = L.brief; if (!b) return '<p class="tmuted" style="padding:20px">Loading...</p>';
  var h = '<h1 class="lgreet">' + greeting() + '</h1><p class="lsub">' + esc(fdl(b.today)) + '</p>';
  var j = b.journal || {};
  h += '<div class="lhero"><div class="g"><b>' + (j.today ? 'You wrote today' : 'Write today\'s journal') + '</b><small>' + (j.streak ? j.streak + '-day streak' : 'Start a streak with a few lines') + '</small></div><button class="mbtn pri" data-a="today-entry">' + (j.today ? 'Open today' : 'Write now') + '</button></div>';
  if (b.pulse && !b.pulse.connected) h += '<p class="tmuted" style="margin:10px 2px 0">Calendar, tasks and messages appear here when Pulse is connected in Settings.</p>';
  if (!b.sections.length) return h + '<div class="lclear">Nothing needs you right now.</div>';
  h += '<div class="lcards">' + b.sections.map(function (s) { return '<section class="lcard"><h2>' + esc(s.title) + '</h2>' + s.items.map(function (i) { return '<button class="lrow click ' + (i.tone || '') + '" data-a="brief-go" data-go="' + esc(i.go || '') + '" data-id="' + esc(i.id || '') + '"><div class="g"><b>' + esc(i.text) + '</b>' + (i.sub ? '<small>' + esc(i.sub) + '</small>' : '') + '</div></button>'; }).join('') + '</section>'; }).join('') + '</div>';
  return h;
};

/* ---------- Journal and notes ---------- */
function noteRow(n) {
  return '<button class="jn' + (L.cur && L.cur.id === n.id ? ' on' : '') + '" data-a="open-note" data-id="' + n.id + '"><b>' + (n.pinned ? '📌 ' : '') + (n.mood ? MOODS[n.mood] + ' ' : '') + esc(n.name) + '</b><span class="d">' + (n.kind === 'journal' ? 'Journal · ' : 'Note · ') + esc(fd(n.date)) + '</span><small>' + esc(n.excerpt) + '</small></button>';
}
R.journal = function () {
  var N = L.notes; if (!N) return '<p class="tmuted" style="padding:20px">Loading...</p>';
  var h = '<div class="mhead"><div><h1>Journal and notes</h1><p>' + N.total + ' entr' + (N.total === 1 ? 'y' : 'ies') + (N.streak ? ' · ' + N.streak + '-day journal streak' : '') + '</p></div><span class="sp"></span><button class="mbtn" data-a="new-note">New note</button><button class="mbtn pri" data-a="today-entry">Write today</button></div>';
  h += '<div class="jr' + (L.edit ? ' edit' : '') + '"><div class="jl"><input class="tin" id="jq" type="search" placeholder="Search your notes" value="' + esc(L.q) + '" style="width:100%" aria-label="Search notes"><div class="jf">' + [['', 'All'], ['journal', 'Journal'], ['note', 'Notes']].map(function (k) { return '<button class="lchip' + (L.kind === k[0] ? ' on' : '') + '" data-a="kind" data-k="' + k[0] + '">' + k[1] + '</button>'; }).join('') + (L.tag ? '<button class="lchip on" data-a="tag" data-t="">#' + esc(L.tag) + ' ×</button>' : '') + '</div>' +
    (L.tag ? '' : '<div class="jf">' + N.tags.slice(0, 12).map(function (t) { return '<button class="lchip" data-a="tag" data-t="' + esc(t.tag) + '">#' + esc(t.tag) + ' ' + t.count + '</button>'; }).join('') + '</div>') +
    (N.items.length ? N.items.map(noteRow).join('') : '<div class="lclear">' + (L.q || L.tag || L.kind ? 'Nothing matches.' : 'Nothing written yet. Start with today\'s journal.') + '</div>') + '</div>';
  h += '<div class="je" id="je">' + (L.cur ? editor() : '<div class="lclear">Choose an entry, or write a new one.<br><br><small>Use #tags to group entries and [[Title]] to link notes together.</small></div>') + '</div></div>';
  return h;
};
function editor() {
  var n = L.cur, h = '<div class="meta"><button class="mbtn sm jback" data-a="back">‹ Back</button><div class="seg" style="min-width:150px"><button data-a="kindset" data-k="journal" class="' + (n.kind === 'journal' ? 'on' : '') + '">Journal</button><button data-a="kindset" data-k="note" class="' + (n.kind === 'note' ? 'on' : '') + '">Note</button></div><input class="tin" id="jd" type="date" value="' + esc(n.date || todayStr()) + '" aria-label="Date"><span class="mood" role="group" aria-label="Mood">' + [1, 2, 3, 4, 5].map(function (m) { return '<button data-a="mood" data-m="' + m + '" class="' + (n.mood === m ? 'on' : '') + '" aria-label="Mood ' + m + '">' + MOODS[m] + '</button>'; }).join('') + '</span><span style="flex:1"></span><span id="jst" class="tmuted"></span><button class="mbtn sm" data-a="pin">' + (n.pinned ? 'Unpin' : 'Pin') + '</button>' + (n.id ? '<button class="mbtn sm" data-a="del-note">Delete</button>' : '') + '</div>';
  h += '<input class="ti" id="jt" placeholder="' + (n.kind === 'journal' ? 'Title (optional)' : 'Title') + '" value="' + esc(n.title || '') + '" maxlength="120" aria-label="Title"><textarea class="bd" id="jb" placeholder="' + (n.kind === 'journal' ? 'How was your day? What did you do, learn or decide?' : 'Write anything. #tags group it, [[Title]] links to another note.') + '" aria-label="Text">' + esc(n.body || '') + '</textarea>';
  var tg = (n.tags || []).map(function (t) { return '<button class="lchip" data-a="tag" data-t="' + esc(t) + '">#' + esc(t) + '</button>'; }).join('');
  var ln = (n.links || []).map(function (l) { return l.id ? '<button class="lchip" data-a="open-note" data-id="' + l.id + '">' + esc(l.title) + '</button>' : '<button class="lchip new" data-a="make-linked" data-title="' + esc(l.title) + '" title="Create this note">+ ' + esc(l.title) + '</button>'; }).join('');
  var bk = (n.back || []).map(function (l) { return '<button class="lchip" data-a="open-note" data-id="' + l.id + '">' + esc(l.name) + '</button>'; }).join('');
  if (tg) h += '<div class="lchips">' + tg + '</div>'; if (ln) h += '<div class="meta">Links to <span class="lchips">' + ln + '</span></div>'; if (bk) h += '<div class="meta">Linked from <span class="lchips">' + bk + '</span></div>';
  return h;
}
function loadNotes(keep) {
  var qs = '?limit=200' + (L.q ? '&q=' + encodeURIComponent(L.q) : '') + (L.tag ? '&tag=' + encodeURIComponent(L.tag) : '') + (L.kind ? '&kind=' + L.kind : '');
  return api('GET', '/notes' + qs).then(function (r) { L.notes = r; if (!keep) draw(); else refreshList(); }).catch(err);
}
function refreshList() { var jl = document.querySelector('.jl'); if (!jl) return draw(); var y = jl.scrollTop, q = $('#jq'), had = document.activeElement === q, pos = q ? q.selectionStart : 0; draw(); var j2 = document.querySelector('.jl'); if (j2) j2.scrollTop = y; if (had && $('#jq')) { $('#jq').focus(); $('#jq').setSelectionRange(pos, pos); } }
function setCur(n) { L.cur = n; L.edit = !!n; draw(); if (n && $('#jb') && !n.id) $('#jb').focus(); }
var saveT = null, saveSeq = 0;
function collect() { var n = L.cur; n.title = $('#jt').value; n.body = $('#jb').value; n.date = $('#jd').value || todayStr(); }
function queueSave() { if (!L.cur) return; collect(); var s = $('#jst'); if (s) s.textContent = 'Typing…'; clearTimeout(saveT); saveT = setTimeout(saveNow, 700); }
function saveNow() {
  clearTimeout(saveT); var n = L.cur; if (!n || !$('#jb')) return Promise.resolve(); collect();
  if (!n.id && !(n.title || n.body).trim()) return Promise.resolve();
  var seq = ++saveSeq, b = { kind: n.kind, title: n.title, body: n.body, date: n.date, mood: n.mood || 0, pinned: !!n.pinned };
  var s = $('#jst'); if (s) s.textContent = 'Saving…';
  return api(n.id ? 'PUT' : 'POST', n.id ? '/notes/' + n.id : '/notes', b).then(function (r) {
    if (seq !== saveSeq || L.cur !== n) return; var back = r.note; n.id = back.id; n.tags = back.tags; n.links = back.links; n.back = back.back; n.name = back.name;
    var st = $('#jst'); if (st) st.textContent = 'Saved'; return loadNotes(true).then(function () { rebuildMeta(); });
  }).catch(function (e) { var st = $('#jst'); if (st) st.textContent = 'Not saved'; err(e); });
}
function rebuildMeta() { /* tags and links under the editor change as you type; redraw only that part, keep the cursor */ var je = $('#je'); if (!je || !L.cur) return; var a = document.activeElement, id = a && a.id, pos = a && a.selectionStart, y = $('#jb') ? $('#jb').scrollTop : 0; var keep = { t: $('#jt').value, b: $('#jb').value }; je.innerHTML = editor(); $('#jt').value = keep.t; $('#jb').value = keep.b; $('#jb').scrollTop = y; if (id && $('#' + id)) { $('#' + id).focus(); try { $('#' + id).setSelectionRange(pos, pos); } catch (e) {} } var st = $('#jst'); if (st) st.textContent = 'Saved'; }
function openNote(id) { return saveNow().then(function () { return api('GET', '/notes/' + id); }).then(function (r) { setCur(r.note); }).catch(err); }

/* ---------- Documents ---------- */
var STAT = { expired: ['Expired', 'bad'], week: ['Under 7 days', 'bad'], month: ['Under 30 days', 'warn'], quarter: ['Under 90 days', 'warn'], ok: ['Valid', 'ok'], none: ['No expiry', ''] };
R.docs = function () {
  var D = L.docs; if (!D) return '<p class="tmuted" style="padding:20px">Loading...</p>'; var s = D.summary;
  var h = '<div class="mhead"><div><h1>Documents</h1><p>Passports, visas, licences, insurance and more, with reminders at 90, 30 and 7 days</p></div><span class="sp"></span><button class="mbtn pri" data-a="new-doc">Add document</button></div>';
  if (!D.items.length) return h + '<div class="mc mempty"><b>No documents yet</b><span>Add a passport, visa, driving licence or insurance policy with its expiry date. You will be reminded in your Daily Brief well before it runs out.</span><button class="mbtn pri" data-a="new-doc">Add your first document</button></div>';
  h += '<div class="lsum"><div class="k"><b>' + s.total + '</b><small>Documents</small></div><div class="k"><b' + (s.expired ? ' style="color:var(--bad)"' : '') + '>' + s.expired + '</b><small>Expired</small></div><div class="k"><b' + (s.soon ? ' style="color:var(--warn)"' : '') + '>' + s.soon + '</b><small>Expire within 30 days</small></div><div class="k"><b>' + s.quarter + '</b><small>Within 90 days</small></div></div><div class="mc">';
  h += D.items.map(function (x) { var st = STAT[x.status], when = x.expires ? (x.days < 0 ? 'Expired ' + fd(x.expires) : x.days === 0 ? 'Expires today' : 'Expires ' + fd(x.expires) + ' · ' + x.days + ' day' + (x.days === 1 ? '' : 's')) : 'No expiry date'; return '<div class="mrow click" data-a="edit-doc" data-id="' + x.id + '"><span class="dtone" style="background:' + tone(x.kind) + '">' + esc(x.kind.charAt(0)) + '</span><div class="grow"><b>' + esc(x.name) + '</b><small>' + [esc(x.kind), x.holder ? esc(x.holder) : '', when].filter(Boolean).join(' · ') + '</small></div>' + (x.file ? '<a class="mbtn sm" href="' + esc(T.fs.url(x.file)) + '" target="_blank" rel="noopener" data-a="none" title="Open the scan">Scan</a>' : '') + '<span class="pillx ' + st[1] + '">' + st[0] + '</span></div>'; }).join('') + '</div>';
  return h;
};
function docForm(x) {
  x = x || {}; var isNew = !x.id;
  modal('<h2>' + (isNew ? 'Add a document' : esc(x.name)) + '</h2><label>Name<input class="tin" id="dn" value="' + esc(x.name || '') + '" maxlength="80" placeholder="e.g. Passport"></label><div class="row2"><label>Type<select id="dk">' + L.docs.kinds.map(function (k) { return '<option' + (k === (x.kind || 'Other') ? ' selected' : '') + '>' + esc(k) + '</option>'; }).join('') + '</select></label><label>Holder<input class="tin" id="dh" value="' + esc(x.holder || '') + '" maxlength="60"></label></div><div class="row2"><label>Number<input class="tin" id="dnum" value="' + esc(x.number || '') + '" maxlength="60"></label><label>Issued by<input class="tin" id="di" value="' + esc(x.issuer || '') + '" maxlength="80"></label></div><div class="row2"><label>Issued<input class="tin" id="dis" type="date" value="' + esc(x.issued || '') + '"></label><label>Expires<input class="tin" id="dex" type="date" value="' + esc(x.expires || '') + '"></label></div><label>Scan or photo<input class="tin" id="df" type="file" accept="image/*,application/pdf"></label>' + (x.file ? '<p class="tmuted" style="margin:0">Current scan: ' + esc(x.file) + '</p>' : '') + '<label>Notes<textarea id="dno" rows="2" maxlength="500">' + esc(x.notes || '') + '</textarea></label><div class="err" id="de"></div><div class="acts">' + (isNew ? '' : '<button class="mbtn" data-a="del-doc" data-id="' + x.id + '" style="margin-right:auto">Delete</button>') + '<button class="mbtn" data-a="close">Cancel</button><button class="mbtn pri" id="dok">Save</button></div>', function () {
    $('#dok').onclick = function () {
      var b = { name: $('#dn').value, kind: $('#dk').value, holder: $('#dh').value, number: $('#dnum').value, issuer: $('#di').value, issued: $('#dis').value, expires: $('#dex').value, notes: $('#dno').value }, f = $('#df').files[0];
      var up = f ? T.fs.mkdir('/Documents').catch(function () {}).then(function () { var p = '/Documents/' + Date.now().toString(36) + '-' + f.name.replace(/[^\w.\-]+/g, '_'); return T.fs.write(p, f, f.type || 'application/octet-stream', false).then(function () { b.file = p; }); }) : Promise.resolve();
      up.then(function () { return api(isNew ? 'POST' : 'PUT', isNew ? '/docs' : '/docs/' + x.id, b); }).then(function (d) { close(); L.docs = d; draw(); T.toast('Saved'); }).catch(function (e) { $('#de').textContent = e.message; });
    };
  });
}

/* ---------- Net worth ---------- */
function spark(snaps, base) {
  if (!snaps || snaps.length < 2) return '<p class="tmuted" style="margin:6px 0 0">The chart appears after the second monthly snapshot. A snapshot is saved automatically once a month, or press Save snapshot.</p>';
  var w = 600, hgt = 150, p = 28, min = Math.min.apply(null, snaps.map(function (s) { return s.total; })), max = Math.max.apply(null, snaps.map(function (s) { return s.total; })); if (max === min) { max += 1; min -= 1; }
  var pts = snaps.map(function (s, i) { return [p + i * (w - 2 * p) / (snaps.length - 1), hgt - 24 - (s.total - min) / (max - min) * (hgt - 44)]; }), line = pts.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('');
  return '<svg class="spark" viewBox="0 0 ' + w + ' ' + hgt + '" preserveAspectRatio="none" role="img" aria-label="Net worth over time"><path class="a" d="' + line + 'L' + pts[pts.length - 1][0] + ' ' + (hgt - 24) + 'L' + pts[0][0] + ' ' + (hgt - 24) + 'Z"/><path class="l" d="' + line + '"/><text x="' + p + '" y="' + (hgt - 6) + '">' + esc(fd(snaps[0].date)) + '</text><text x="' + (w - p) + '" y="' + (hgt - 6) + '" text-anchor="end">' + esc(fd(snaps[snaps.length - 1].date)) + '</text><text x="' + p + '" y="12">' + esc(money(max, base)) + '</text></svg>';
}
R.worth = function () {
  var W = L.worth; if (!W) return '<p class="tmuted" style="padding:20px">Loading...</p>'; var c = W.base;
  var h = '<div class="mhead"><div><h1>Net worth</h1><p>Bank accounts and investments from Money, plus what you own and owe</p></div><span class="sp"></span><button class="mbtn" data-a="snap">Save snapshot</button><button class="mbtn" data-a="new-debt">Add a debt</button><button class="mbtn pri" data-a="new-asset">Add an asset</button></div>';
  var tot = W.totalAssets || 1, seg = function (v, col) { return v > 0 ? '<i style="width:' + (v / tot * 100) + '%;background:' + col + '"></i>' : ''; };
  var other = W.assets.reduce(function (s, a) { return s + a.base; }, 0);
  h += '<div class="mgrid"><div class="mc s7"><div class="kpi"><small>Net worth</small><span class="nwbig ' + (W.total < 0 ? 'neg' : '') + '">' + esc(money(W.total, c)) + '</span><span>' + esc(money(W.totalAssets, c)) + ' owned · ' + esc(money(W.totalDebts, c)) + ' owed</span></div><div class="nwsplit" aria-hidden="true">' + seg(W.bank, '#3b82f6') + seg(W.investments, '#10b981') + seg(other, '#f68712') + '</div><div class="legend"><span><i style="background:#3b82f6"></i>Bank ' + esc(money(W.bank, c)) + '</span><span><i style="background:#10b981"></i>Investments ' + esc(money(W.investments, c)) + '</span><span><i style="background:#f68712"></i>Other assets ' + esc(money(other, c)) + '</span></div>' + spark(W.snaps, c) + '</div>';
  h += '<div class="mc s5"><h2>Goals <span class="sp"></span><button class="mbtn sm" data-a="open-money">Money</button></h2>' + (W.goals.length ? W.goals.map(function (g) { var pc = g.target > 0 ? Math.min(100, Math.round(g.saved / g.target * 100)) : 0; return '<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-weight:500">' + esc(g.name) + '</b><span class="tmuted">' + pc + '%</span></div><div class="bar ' + (pc >= 100 ? 'ok' : '') + '"><i style="width:' + pc + '%"></i></div><small class="tmuted">' + esc(money(g.saved, g.currency)) + ' of ' + esc(money(g.target, g.currency)) + (g.date ? ' · by ' + esc(fd(g.date)) : '') + '</small></div>'; }).join('') : '<p class="tmuted">No savings goals yet. Add them in Money, and they show up here and in your Daily Brief.</p>') + '</div></div>';
  if (W.missingRates.length) h += '<p class="tmuted" style="margin:10px 2px">No exchange rate for ' + esc(W.missingRates.join(', ')) + ' yet, so those amounts count at face value. Refresh rates in Money.</p>';
  var row = function (a, kind) { return '<div class="mrow click" data-a="edit-' + kind + '" data-id="' + a.id + '"><span class="dtone" style="background:' + tone(a.kind) + '">' + esc(a.kind.charAt(0)) + '</span><div class="grow"><b>' + esc(a.name) + '</b><small>' + esc(a.kind) + (a.currency !== c ? ' · ' + esc(money(kind === 'asset' ? a.value : a.balance, a.currency)) : '') + (a.rate ? ' · ' + a.rate + '% interest' : '') + '</small></div><b class="num" style="font-weight:500">' + esc(money(a.base, c)) + '</b></div>'; };
  h += '<div class="mgrid" style="margin-top:14px"><div class="mc s6"><h2>What you own</h2><div class="mrow"><div class="grow"><b>Bank accounts</b><small>' + W.moneyAccounts + ' in Money</small></div><b class="num" style="font-weight:500">' + esc(money(W.bank, c)) + '</b></div><div class="mrow"><div class="grow"><b>Investments</b><small>From Money</small></div><b class="num" style="font-weight:500">' + esc(money(W.investments, c)) + '</b></div>' + W.assets.map(function (a) { return row(a, 'asset'); }).join('') + '</div><div class="mc s6"><h2>What you owe</h2>' + (W.debts.length ? W.debts.map(function (a) { return row(a, 'debt'); }).join('') : '<p class="tmuted">No debts recorded.</p>') + '</div></div>';
  return h;
};
function entryForm(kind, x) {
  x = x || {}; var isNew = !x.id, ks = L.worth.kinds[kind], amt = kind === 'asset' ? 'value' : 'balance';
  modal('<h2>' + (isNew ? (kind === 'asset' ? 'Add an asset' : 'Add a debt') : esc(x.name)) + '</h2><label>Name<input class="tin" id="en" value="' + esc(x.name || '') + '" maxlength="80" placeholder="' + (kind === 'asset' ? 'e.g. Apartment, Car' : 'e.g. Car loan') + '"></label><div class="row2"><label>Type<select id="ek">' + ks.map(function (k) { return '<option' + (k === (x.kind || ks[ks.length - 1]) ? ' selected' : '') + '>' + esc(k) + '</option>'; }).join('') + '</select></label><label>' + (kind === 'asset' ? 'Value now' : 'Balance owed') + '<input class="tin num" id="ev" inputmode="decimal" value="' + (x[amt] != null ? x[amt] : '') + '"></label></div><div class="row2"><label>Currency<input class="tin" id="ec" value="' + esc(x.currency || L.worth.base) + '" maxlength="5"></label>' + (kind === 'debt' ? '<label>Interest % a year<input class="tin num" id="er" inputmode="decimal" value="' + (x.rate || '') + '"></label>' : '<span></span>') + '</div><label>Note<input class="tin" id="eno" value="' + esc(x.note || '') + '" maxlength="200"></label><div class="err" id="ee"></div><div class="acts">' + (isNew ? '' : '<button class="mbtn" data-a="del-entry" data-kind="' + kind + '" data-id="' + x.id + '" style="margin-right:auto">Delete</button>') + '<button class="mbtn" data-a="close">Cancel</button><button class="mbtn pri" id="eok">Save</button></div>', function () {
    $('#eok').onclick = function () {
      var b = { name: $('#en').value, kind: $('#ek').value, currency: $('#ec').value, note: $('#eno').value }; b[amt] = $('#ev').value; if (kind === 'debt') b.rate = $('#er').value;
      api(isNew ? 'POST' : 'PUT', (kind === 'asset' ? '/assets' : '/debts') + (isNew ? '' : '/' + x.id), b).then(function (w) { close(); L.worth = w; draw(); T.toast('Saved'); }).catch(function (e) { $('#ee').textContent = e.message; });
    };
  });
}

/* ---------- Search ---------- */
R.search = function () {
  var h = '<div class="mhead"><div><h1>Search</h1><p>Journal, notes, documents, belongings, pantry, money and files</p></div></div><form class="lsearch" id="sf"><input class="tin" id="sq" type="search" placeholder="Search everything, e.g. warranty, passport, rent" value="' + esc(L.sq) + '" aria-label="Search everything" autocomplete="off"></form>';
  if (!L.sres) return h + (L.sq ? '<p class="tmuted">Searching…</p>' : '<div class="lclear">Type to search across your whole life.</div>');
  if (!L.sres.groups.length) return h + '<div class="lclear">Nothing found for "' + esc(L.sres.q) + '".</div>';
  return h + L.sres.groups.map(function (g) { return '<section class="lcard" style="margin-bottom:12px"><h2>' + esc(g.title) + '</h2>' + g.items.map(function (i) { return '<button class="lrow click" data-a="sgo" data-g="' + g.key + '" data-id="' + esc(i.id) + '" data-k="' + esc(i.kind || '') + '"><div class="g"><b>' + esc(i.name) + '</b><small>' + esc(i.sub || '') + '</small></div></button>'; }).join('') + '</section>'; }).join('');
};
var sT = null;
function doSearch() { var q = L.sq.trim(); if (!q) { L.sres = null; return draw(true); } api('GET', '/search?q=' + encodeURIComponent(q)).then(function (r) { if (r.q !== L.sq.trim().slice(0, 100)) return; L.sres = r; draw(true); }).catch(err); }

/* ---------- shell ---------- */
function draw(keepSearch) {
  var n = $('#mnav'); n.innerHTML = '<div class="brand"><img src="/oicons/' + ({ today: 'brief', journal: 'journal', docs: 'docs', worth: 'worth', search: 'lsearch' }[L.tab]) + '.svg" alt="">Life</div>' + NAV.map(function (x) { return '<button data-tab="' + x[0] + '"' + (L.tab === x[0] ? ' aria-current="page"' : '') + '>' + T.ic(x[2]) + x[1] + '</button>'; }).join('');
  $('#mn').classList.add('life');
  var main = $('#mmain'), y = main.scrollTop, act = document.activeElement, keepId = keepSearch && act && act.id === 'sq' ? 'sq' : (act && act.id === 'jq' ? 'jq' : ''), pos = keepId ? act.selectionStart : 0;
  var ed = L.tab === 'journal' && L.cur && $('#jb') ? { t: $('#jt').value, b: $('#jb').value, y: $('#jb').scrollTop, f: act && /^j[tbd]$/.test(act.id) ? act.id : '', p: act && act.selectionStart } : null;
  main.innerHTML = R[L.tab](); main.scrollTop = y;
  if (ed && $('#jb') && L.cur) { $('#jt').value = ed.t; $('#jb').value = ed.b; $('#jb').scrollTop = ed.y; if (ed.f) { $('#' + ed.f).focus(); try { $('#' + ed.f).setSelectionRange(ed.p, ed.p); } catch (e) {} } }
  if (keepId && $('#' + keepId)) { $('#' + keepId).focus(); $('#' + keepId).setSelectionRange(pos, pos); }
  bind();
  try { if (parent !== window) parent.postMessage({ aosTool: 'title', title: TITLE[L.tab] }, location.origin); } catch (e) {}
}
function bind() {
  if ($('#jq')) $('#jq').oninput = function () { L.q = this.value; clearTimeout(sT); sT = setTimeout(function () { loadNotes(true); }, 250); };
  ['jt', 'jb', 'jd'].forEach(function (id) { var e = $('#' + id); if (e) { e.oninput = queueSave; if (id === 'jd') e.onchange = queueSave; } });
  if ($('#sq')) { $('#sq').oninput = function () { L.sq = this.value; clearTimeout(sT); sT = setTimeout(doSearch, 250); }; $('#sf').onsubmit = function (e) { e.preventDefault(); clearTimeout(sT); doSearch(); }; }
}
function go(t) {
  var leave = L.tab === 'journal' ? saveNow() : Promise.resolve();
  return leave.then(function () {
    L.tab = R[t] ? t : 'today'; try { history.replaceState(null, '', '#' + L.tab); } catch (e) {}
    draw(); $('#mmain').scrollTop = 0; load(L.tab);
  });
}
function load(t) {
  if (t === 'today') return api('GET', '/brief?d=' + todayStr()).then(function (b) { L.brief = b; if (L.tab === 'today') draw(); }).catch(err);
  if (t === 'journal') return loadNotes();
  if (t === 'docs') return api('GET', '/docs?d=' + todayStr()).then(function (d) { L.docs = d; if (L.tab === 'docs') draw(); }).catch(err);
  if (t === 'worth') return api('GET', '/worth').then(function (w) { L.worth = w; if (L.tab === 'worth') draw(); }).catch(err);
  if (t === 'search') { draw(); var q = $('#sq'); if (q) q.focus(); }
}
function newNote(kind, title) { saveNow().then(function () { L.cur = { kind: kind, title: title || '', body: '', date: todayStr(), mood: 0, pinned: false, tags: [] }; L.edit = true; if (L.tab !== 'journal') { L.tab = 'journal'; } draw(); if (!L.notes) loadNotes(true); var f = $(title ? '#jb' : '#jt'); if (f) f.focus(); }); }

var A = {};
A.close = close; A.none = function () {};
A['today-entry'] = function () { saveNow().then(function () { return api('POST', '/journal/today?d=' + todayStr()); }).then(function (r) { L.tab = 'journal'; try { history.replaceState(null, '', '#journal'); } catch (e) {} L.cur = r.note; L.edit = true; return loadNotes().then(function () { draw(); if ($('#jb')) { $('#jb').focus(); var l = $('#jb').value.length; $('#jb').setSelectionRange(l, l); } }); }).catch(err); };
A['new-note'] = function () { newNote('note'); };
A['open-note'] = function (b) { openNote(b.dataset.id).then(function () { if (L.tab !== 'journal') go('journal'); }); };
A['make-linked'] = function (b) { var t = b.dataset.title; saveNow().then(function () { return api('POST', '/notes', { kind: 'note', title: t, body: ' ' }); }).then(function (r) { return loadNotes(true).then(function () { return openNote(r.note.id); }); }).catch(err); };
A.back = function () { saveNow().then(function () { L.edit = false; L.cur = null; draw(); }); };
A.kind = function (b) { L.kind = b.dataset.k; loadNotes(); };
A.tag = function (b) { L.tag = b.dataset.t; if (L.tab !== 'journal') { L.tab = 'journal'; } saveNow().then(function () { return loadNotes(); }); };
A.kindset = function (b) { if (!L.cur) return; L.cur.kind = b.dataset.k; draw(); queueSave(); };
A.mood = function (b) { if (!L.cur) return; var m = +b.dataset.m; L.cur.mood = L.cur.mood === m ? 0 : m; draw(); queueSave(); };
A.pin = function () { if (!L.cur) return; L.cur.pinned = !L.cur.pinned; draw(); saveNow(); };
A['del-note'] = function () { var n = L.cur; if (!n || !n.id) return; modal('<h2>Delete this entry?</h2><p class="tmuted">"' + esc(n.name || n.title || 'Untitled') + '" will be removed for good.</p><div class="acts"><button class="mbtn" data-a="close">Keep</button><button class="mbtn pri" id="dly">Delete</button></div>', function () { $('#dly').onclick = function () { api('DELETE', '/notes/' + n.id).then(function () { close(); L.cur = null; L.edit = false; return loadNotes(); }).catch(err); }; }); };
A['brief-go'] = function (b) { var g = b.dataset.go; if (g === 'docs' || g === 'journal') { if (g === 'journal' && b.dataset.id) return openNote(b.dataset.id).then(function () { go('journal'); }); return go(g); } if (g) openApp(g); };
A['new-doc'] = function () { docForm(); };
A['edit-doc'] = function (b) { docForm(L.docs.items.filter(function (x) { return x.id === b.dataset.id; })[0]); };
A['del-doc'] = function (b) { api('DELETE', '/docs/' + b.dataset.id).then(function (d) { close(); L.docs = d; draw(); }).catch(err); };
A['new-asset'] = function () { entryForm('asset'); }; A['new-debt'] = function () { entryForm('debt'); };
A['edit-asset'] = function (b) { entryForm('asset', L.worth.assets.filter(function (x) { return x.id === b.dataset.id; })[0]); };
A['edit-debt'] = function (b) { entryForm('debt', L.worth.debts.filter(function (x) { return x.id === b.dataset.id; })[0]); };
A['del-entry'] = function (b) { api('DELETE', (b.dataset.kind === 'asset' ? '/assets/' : '/debts/') + b.dataset.id).then(function (w) { close(); L.worth = w; draw(); }).catch(err); };
A.snap = function () { api('POST', '/worth/snapshot').then(function (w) { L.worth = w; draw(); T.toast('Snapshot saved'); }).catch(err); };
A['open-money'] = function () { openApp('money'); };
A.sgo = function (b) {
  var g = b.dataset.g, id = b.dataset.id;
  if (g === 'notes') return openNote(id).then(function () { go('journal'); }); if (g === 'docs') return go('docs').then(function () { var x = L.docs && L.docs.items.filter(function (y) { return y.id === id; })[0]; if (x) docForm(x); else api('GET', '/docs?d=' + todayStr()).then(function (d) { L.docs = d; var z = d.items.filter(function (y) { return y.id === id; })[0]; if (z) docForm(z); }); });
  if (g === 'things') return openApp(b.dataset.k === 'product' ? 'house' : 'belong'); if (g === 'money') return openApp('money');
  if (g === 'files') window.open(T.fs.url(id), '_blank', 'noopener');
};
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-a],[data-tab]'); if (!b) return;
  if (b.dataset.tab) { close(); return go(b.dataset.tab); }
  var f = A[b.dataset.a]; if (f) { if (b.tagName === 'A' && b.dataset.a === 'none') return; f(b, e); }
});
window.addEventListener('beforeunload', function () { if (L.tab === 'journal' && L.cur && $('#jb')) { collect(); var n = L.cur; if (n.id || (n.title || n.body).trim()) { try { fetch('/api/life' + (n.id ? '/notes/' + n.id : '/notes'), { method: n.id ? 'PUT' : 'POST', keepalive: true, credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ kind: n.kind, title: n.title, body: n.body, date: n.date, mood: n.mood || 0, pinned: !!n.pinned }) }); } catch (x) {} } } });
window.addEventListener('hashchange', function () { var h = location.hash.replace('#', ''); if (R[h] && h !== L.tab) go(h); });
var h0 = location.hash.replace('#', ''); L.tab = R[h0] ? h0 : 'today'; draw(); load(L.tab);
})();
