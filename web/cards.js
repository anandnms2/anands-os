/* Full Card Scan inside the OS: scan or add a card (photos, AI reading, duplicate check), select and move/delete/merge/export,
 * notes and timeline, reminders, share links, alerts, and the full Card Scan app in a frame. Everything goes through /api/cards and /api/cs. */
(function () {
  'use strict';
  var A = window.AOS, X = window.AOSInt; if (!A || !X) return;
  var S = A.S, $ = A.$, esc = A.esc, api = A.api, toast = A.toast, ic = A.ic, modal = A.modal;
  var C = X.state.cards, FIELDS = X.FIELDS;
  var T = { tab: 'cards', rem: null, notes: null, remErr: null, noteErr: null, newc: null, ai: null };
  C.sel = {}; C.selecting = false;
  function ago(iso) { if (!iso) return ''; var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' d ago'; }
  function m(t, bad) { var n = $('#cm'); if (n) { n.style.color = bad ? 'var(--bad)' : 'var(--muted)'; n.textContent = t; } }
  function selIds() { return Object.keys(C.sel).filter(function (k) { return C.sel[k]; }); }
  function url() { return ((S.settings || {}).cards || {}).url || ''; }
  function box(w) { var b = $('#modal .card'); if (b) b.style.width = 'min(' + (w || 680) + 'px,100%)'; }
  function title(t, extra) { return '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:14px"><h2 style="font-size:22px">' + t + '</h2><button class="btn sm" data-act="mx2">Close</button></div>' + (extra || ''); }
  function groups() { return (C.data && C.data.groups) || []; }
  function groupSel(id, cur) { return '<select class="input" id="' + id + '">' + groups().map(function (g) { return '<option value="' + esc(g.id) + '"' + (g.id === cur ? ' selected' : '') + '>' + esc(g.name) + '</option>'; }).join('') + '</select>'; }
  function today(n) { var d = new Date(Date.now() + (n || 0) * 86400000); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dfmt(s) { var d = new Date(s); return isNaN(d) ? String(s || '') : A.fmt(d, { day: 'numeric', month: 'short', year: 'numeric' }); }
  function reload() { return X.loadCards(); }

  /* ---------- page pieces used by integrations.js ---------- */
  function head() {
    var n = selIds().length;
    return '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" data-ca="new">' + ic('upload') + ' Scan card</button><button class="btn" data-ca="export">Export CSV</button>' + (T.tab === 'cards' ? '<button class="btn" data-ca="selmode" aria-pressed="' + C.selecting + '">' + (C.selecting ? 'Done' : 'Select') + '</button>' : '') + '</div>';
  }
  function tabs() {
    var unread = T.notes ? T.notes.unreadCount : 0, rc = T.rem ? (T.rem.reminders || []).length : 0;
    return '<div class="toolbar"><div class="seg" role="tablist">' + [['cards', 'Cards'], ['mine', 'My cards'], ['reminders', 'Reminders' + (rc ? ' (' + rc + ')' : '')], ['alerts', 'Alerts' + (unread ? ' (' + unread + ')' : '')]].map(function (t) { return '<button data-ca="tab" data-t="' + t[0] + '" aria-pressed="' + (T.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div></div>';
  }
  function bulkBar() {
    var ids = selIds(); if (!C.selecting) return '';
    return '<div class="banner" style="position:sticky;top:8px;z-index:5;background:var(--surface)"><span><b>' + ids.length + '</b> selected</span><button class="btn sm" data-ca="selall">Select all shown</button><button class="btn sm" data-ca="selnone">Clear</button>' +
      '<button class="btn sm" data-ca="bmove"' + (ids.length ? '' : ' disabled') + '>Move to group</button><button class="btn sm" data-ca="bmerge"' + (ids.length === 2 ? '' : ' disabled title="Pick exactly two cards"') + '>Merge two</button><button class="btn sm" data-ca="bexport"' + (ids.length ? '' : ' disabled') + '>Export</button><button class="btn sm danger" data-ca="bdel"' + (ids.length ? '' : ' disabled') + '>Delete</button></div>';
  }
  function tabView() {
    if (T.tab === 'mine') return window.AOSMine ? window.AOSMine.view() : '';
    if (T.tab === 'reminders') {
      if (T.remErr) return '<div class="banner"><i class="dot bad"></i><span>' + esc(T.remErr) + '</span></div>'; if (!T.rem) return '<p class="note">Loading reminders...</p>';
      var l = T.rem.reminders || []; if (!l.length) return '<div class="empty"><h2>No open reminders</h2><p>Open a card and choose Remind me to follow up.</p></div>';
      return '<div class="card" style="padding:4px 16px">' + l.map(function (r) {
        var late = r.due_date && new Date(r.due_date) < new Date(today(0)) ;
        return '<div class="prow"><div style="flex:1;min-width:0"><button class="linkbtn" data-ca="opencard" data-id="' + esc(r.card_id) + '"><b>' + esc(r.card_name || 'Card') + '</b></button>' + (r.card_company ? ' <span class="note">' + esc(r.card_company) + '</span>' : '') + '<div class="note">' + esc(r.note || 'Follow up') + '</div></div><span class="pill ' + (late ? 'bad' : '') + '">' + esc(dfmt(r.due_date)) + '</span><div class="iacts"><button class="btn sm" data-ca="remdone" data-id="' + esc(r.id) + '">Done</button><button class="btn sm" data-ca="remsnz" data-id="' + esc(r.id) + '" data-n="1">+1 day</button><button class="btn sm" data-ca="remsnz" data-id="' + esc(r.id) + '" data-n="7">+1 week</button></div></div>';
      }).join('') + '</div>';
    }
    if (T.tab === 'alerts') {
      if (!T.notes) return '<p class="note">Loading alerts...</p>'; var n = T.notes.notifications || [];
      return '<div class="toolbar"><button class="btn sm" data-ca="markread"' + (T.notes.unreadCount ? '' : ' disabled') + '>Mark all as read</button></div>' + (n.length ? '<div class="card" style="padding:4px 16px">' + n.map(function (x) { return '<div class="prow"><div style="flex:1"><b' + (x.read ? ' style="font-weight:500"' : '') + '>' + esc(x.message) + '</b><div class="note">' + esc(ago(x.created_at)) + '</div></div>' + (x.read ? '' : '<span class="pill warn">New</span>') + (x.card_id ? '<button class="btn sm" data-ca="opencard" data-id="' + esc(x.card_id) + '">Open</button>' : '') + '</div>'; }).join('') + '</div>' : '<div class="empty"><h2>No alerts</h2></div>');
    }
    return '';
  }
  function loadRem() { T.remErr = null; return api('/api/cs/reminders').then(function (d) { T.rem = d; }).catch(function (e) { T.remErr = e.message; }).then(function () { if (S.view === 'cards') A.redraw(); }); }
  function loadNotes() { return api('/api/cs/notifications').then(function (d) { T.notes = d; }).catch(function () {}).then(function () { if (S.view === 'cards') A.redraw(); }); }

  /* ---------- images ---------- */
  function readImage(file, max, q) {
    return new Promise(function (res, rej) {
      var fr = new FileReader(); fr.onerror = function () { rej(new Error('Could not read that photo')); };
      fr.onload = function () { var im = new Image(); im.onerror = function () { rej(new Error('That file is not a photo')); }; im.onload = function () { var r = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * r); c.height = Math.round(im.height * r); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q)); }; im.src = fr.result; };
      fr.readAsDataURL(file);
    });
  }
  function both(file) { return Promise.all([readImage(file, 1400, 0.82), readImage(file, 320, 0.7)]).then(function (r) { return { full: r[0], thumb: r[1] }; }); }

  /* ---------- scan / add ---------- */
  function newCard() {
    T.newc = { front: null, back: null, f: {}, tags: '', notes: '', group: (C.group || (groups()[0] || {}).id || ''), dups: null };
    if (T.ai == null) api('/api/cs/ai/status').then(function (d) { T.ai = !!(d && d.configured); drawNew(); }).catch(function () { T.ai = false; });
    drawNew();
  }
  function keep() { var N = T.newc; if (!N) return; FIELDS.forEach(function (f) { var e = $('#nf_' + f[0]); if (e) N.f[f[0]] = e.value; }); var t = $('#nf_tags'), n = $('#nf_notes'), g = $('#nf_group'); if (t) N.tags = t.value; if (n) N.notes = n.value; if (g) N.group = g.value; }
  function drawNew() {
    var N = T.newc; if (!N) return;
    var pick = function (side, label) { var im = N[side]; return '<div class="field" style="flex:1;min-width:200px"><label>' + label + '</label>' + (im ? '<div class="icard-big" style="margin-bottom:6px"><img src="' + im.full + '" alt="' + label + '"></div><button class="btn sm" data-ca="rmimg" data-s="' + side + '">Remove</button>' : '<label class="btn" style="display:inline-flex;gap:8px;cursor:pointer">' + ic('upload') + ' Take or choose photo<input type="file" accept="image/*"' + (side === 'front' ? ' capture="environment"' : '') + ' data-cf="' + side + '" hidden></label>') + '</div>'; };
    var h = title('Scan a card') + '<div style="display:flex;gap:14px;flex-wrap:wrap">' + pick('front', 'Front') + pick('back', 'Back (optional)') + '</div>' +
      (T.ai ? '<div style="margin:6px 0 14px"><button class="btn" data-ca="airead"' + (N.front ? '' : ' disabled') + '>' + (N.reading ? 'Reading...' : 'Read details with AI') + '</button> <span class="note">Fills the fields from the photo. Check them before saving.</span></div>' : '') +
      '<div class="icform">' + FIELDS.map(function (f) { return '<div class="field"><label for="nf_' + f[0] + '">' + f[1] + '</label><input class="input" id="nf_' + f[0] + '" value="' + esc(N.f[f[0]] || '') + '" autocomplete="off"></div>'; }).join('') + '</div>' +
      '<div class="field"><label for="nf_group">Group</label>' + groupSel('nf_group', N.group) + '</div><div class="field"><label for="nf_tags">Tags (comma separated)</label><input class="input" id="nf_tags" value="' + esc(N.tags) + '" autocomplete="off"></div><div class="field"><label for="nf_notes">Notes</label><textarea class="input" id="nf_notes" rows="3">' + esc(N.notes) + '</textarea></div>' +
      (N.dups ? '<div class="banner"><i class="dot warn"></i><span><b>Looks like a duplicate.</b> ' + N.dups.map(function (d) { return esc(d.name || d.company || 'Card') + (d.matches ? ' (same ' + esc([].concat(d.matches).join(' and ')) + ')' : ''); }).join(', ') + '</span><button class="btn sm" data-ca="savenew" data-force="1">Save anyway</button></div>' : '') +
      '<div id="cm" class="note" role="status"></div><div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap"><button class="btn" data-act="mx2">Cancel</button><button class="btn primary" data-ca="savenew">Save card</button></div>';
    modal(h); box(720);
  }
  function aiRead() {
    var N = T.newc; keep(); N.reading = true; drawNew();
    api('/api/cs/ai/extract-card', { method: 'POST', json: { front: N.front.full, back: N.back ? N.back.full : undefined } }).then(function (d) { var f = (d && d.fields) || d || {}; FIELDS.forEach(function (k) { if (f[k[0]] && !N.f[k[0]]) N.f[k[0]] = String(f[k[0]]); }); N.reading = false; drawNew(); toast('Details filled in. Please check them.'); }).catch(function (e) { N.reading = false; drawNew(); m(e.message, true); });
  }
  function saveNew(force) {
    var N = T.newc; keep(); if (!(N.f.name || '').trim() && !(N.f.company || '').trim()) return m('Add at least a name or a company.', true);
    var go = function () {
      var b = Object.assign({}, N.f, { groupId: N.group, notes: N.notes, tags: N.tags.split(',').map(function (x) { return x.trim(); }).filter(Boolean) });
      if (N.front) { b.image = N.front.full; b.imageThumb = N.front.thumb; } if (N.back) { b.imageBack = N.back.full; b.imageBackThumb = N.back.thumb; }
      m('Saving...'); return api('/api/cards', { method: 'POST', json: b }).then(function () { T.newc = null; modal(); toast('Card saved'); return reload(); }).catch(function (e) { m(e.message, true); });
    };
    if (force || N.dupChecked) return go();
    var qs = []; if (N.f.phone) qs.push('phone=' + encodeURIComponent(N.f.phone)); if (N.f.email) qs.push('email=' + encodeURIComponent(N.f.email));
    if (!qs.length) return go(); m('Checking for duplicates...');
    return api('/api/cards/check-duplicate?' + qs.join('&')).then(function (d) { var ms = (d && d.matches) || []; if (ms.length) { N.dups = ms; N.dupChecked = true; drawNew(); } else go(); }).catch(function () { go(); });
  }

  /* ---------- bulk ---------- */
  function bulkMove() { var ids = selIds(); modal(title('Move ' + ids.length + ' card' + (ids.length > 1 ? 's' : '')) + '<div class="field"><label for="bg">Group</label>' + groupSel('bg', C.group) + '</div><div id="cm" class="note" role="status"></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" data-act="mx2">Cancel</button><button class="btn primary" data-ca="bmoveyes">Move</button></div>'); box(420); }
  function bulkDel() { var ids = selIds(); modal(title('Delete ' + ids.length + ' card' + (ids.length > 1 ? 's' : '') + '?') + '<p class="note" style="margin:0 0 16px">They are removed from Card Scan too. This cannot be undone.</p><div id="cm" class="note" role="status"></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" data-act="mx2">Keep them</button><button class="btn danger" data-ca="bdelyes">Delete</button></div>'); box(440); }
  function findCard(id) { return C.cards.filter(function (c) { return c.id === id; })[0]; }
  var MG = null;
  function bulkMerge() {
    var ids = selIds(); if (ids.length !== 2) return; MG = { a: findCard(ids[0]), b: findCard(ids[1]), primary: ids[0], pick: {} }; drawMerge();
  }
  function drawMerge() {
    var g = MG, P = g.primary === g.a.id ? g.a : g.b, D = P === g.a ? g.b : g.a;
    var rows = FIELDS.filter(function (f) { return P[f[0]] || D[f[0]]; }).map(function (f) {
      var pv = P[f[0]] || '', dv = D[f[0]] || '', diff = pv && dv && pv !== dv, cur = g.pick[f[0]] || (pv ? 'p' : 'd');
      return '<tr><th scope="row" style="text-align:left">' + f[1] + '</th>' + (diff ? '<td><label><input type="radio" name="mg_' + f[0] + '" value="p"' + (cur === 'p' ? ' checked' : '') + '> ' + esc(pv) + '</label></td><td><label><input type="radio" name="mg_' + f[0] + '" value="d"' + (cur === 'd' ? ' checked' : '') + '> ' + esc(dv) + '</label></td>' : '<td colspan="2">' + esc(pv || dv) + '</td>') + '</tr>';
    }).join('');
    modal(title('Merge two cards') + '<div class="field"><label for="mg_p">Keep this card</label><select class="input" id="mg_p"><option value="' + esc(g.a.id) + '"' + (g.primary === g.a.id ? ' selected' : '') + '>' + esc(g.a.name || g.a.company) + '</option><option value="' + esc(g.b.id) + '"' + (g.primary === g.b.id ? ' selected' : '') + '>' + esc(g.b.name || g.b.company) + '</option></select></div><p class="note" style="margin:0 0 8px">Where they differ, choose which value to keep. The other card is deleted.</p><div class="tablewrap"><table><thead><tr><th></th><th>Kept card</th><th>Other card</th></tr></thead><tbody>' + rows + '</tbody></table></div><div id="cm" class="note" role="status"></div><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px"><button class="btn" data-act="mx2">Cancel</button><button class="btn primary" data-ca="mgyes">Merge cards</button></div>'); box(720);
  }
  function doMerge() {
    var g = MG, P = g.primary === g.a.id ? g.a : g.b, D = P === g.a ? g.b : g.a, fields = {};
    FIELDS.forEach(function (f) { var r = document.querySelector('input[name="mg_' + f[0] + '"]:checked'), pv = P[f[0]] || '', dv = D[f[0]] || ''; fields[f[0]] = r ? (r.value === 'd' ? dv : pv) : (pv || dv); });
    m('Merging...'); api('/api/cards/merge', { method: 'POST', json: { primaryId: P.id, duplicateId: D.id, fields: fields, groupId: P.group_id, keepImage: 'primary' } }).then(function () { MG = null; C.sel = {}; modal(); toast('Cards merged'); return reload(); }).catch(function (e) { m(e.message, true); });
  }

  /* ---------- per card: notes, reminder, share ---------- */
  function cardId() { return C.open && C.open.card && C.open.card.id; }
  function notesModal(id) {
    modal(title('Notes and history') + '<div class="field"><label for="nn">Add a note</label><textarea class="input" id="nn" rows="3" placeholder="What did you talk about?"></textarea></div><div id="cm" class="note" role="status"></div><div style="display:flex;justify-content:flex-end;gap:10px;margin-bottom:14px"><button class="btn" data-ca="backcard">Back to card</button><button class="btn primary" data-ca="noteadd" data-id="' + esc(id) + '">Add note</button></div><div id="tl"><p class="note">Loading...</p></div>'); box(620);
    api('/api/cards/' + id + '/timeline').then(function (d) {
      var el = $('#tl'); if (!el) return; var ev = d.events || [];
      el.innerHTML = '<h3 class="ih">Timeline</h3>' + (ev.length ? '<div class="card" style="padding:4px 14px">' + ev.map(function (e) { return '<div class="prow"><div style="flex:1;overflow-wrap:anywhere">' + (e.kind === 'note' ? '<b>Note</b><div style="white-space:pre-wrap">' + esc(e.note) + '</div>' : '<b>' + esc(String(e.action || 'activity').replace(/_/g, ' ')) + '</b>' + (e.detail ? '<div class="note">' + esc(typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail)) + '</div>' : '')) + '</div><span class="note" style="white-space:nowrap">' + esc(e.userName || '') + ' · ' + esc(ago(e.createdAt)) + '</span></div>'; }).join('') + '</div>' : '<p class="note">Nothing yet.</p>') + (d.lastViewedAt ? '<p class="note" style="margin-top:8px">Last viewed ' + esc(ago(d.lastViewedAt)) + '</p>' : '');
    }).catch(function (e) { var el = $('#tl'); if (el) el.innerHTML = '<p class="note" style="color:var(--bad)">' + esc(e.message) + '</p>'; });
  }
  function remindModal(id) { modal(title('Remind me') + '<div class="field"><label for="rd">Date</label><input class="input" id="rd" type="date" value="' + today(3) + '" min="' + today(0) + '"></div><div class="field"><label for="rn">Note</label><input class="input" id="rn" placeholder="Send the quote" autocomplete="off"></div><div id="cm" class="note" role="status"></div><div style="display:flex;justify-content:flex-end;gap:10px"><button class="btn" data-ca="backcard">Back to card</button><button class="btn primary" data-ca="remadd" data-id="' + esc(id) + '">Set reminder</button></div>'); box(440); }
  var DAYS = [[1, '1 day'], [7, '7 days'], [14, '14 days'], [30, '30 days'], [60, '60 days'], [90, '90 days'], [180, '180 days'], [365, '1 year']];
  function shareModal(id) {
    modal(title('Share this card') + '<p class="note" style="margin:0 0 12px">Anyone with the link can see this card until it expires. You can switch it off at any time.</p><div class="field"><label for="sd">Link works for</label><select class="input" id="sd">' + DAYS.map(function (d) { return '<option value="' + d[0] + '"' + (d[0] === 7 ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select></div><div class="field"><label for="sv">Number of views</label><select class="input" id="sv"><option value="">Unlimited</option><option value="1">1 view</option><option value="2">2 views</option></select></div><div id="cm" class="note" role="status"></div><div id="sres"></div><div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap"><button class="btn" data-ca="backcard">Back to card</button><button class="btn danger" data-ca="shareoff" data-id="' + esc(id) + '">Switch off link</button><button class="btn primary" data-ca="sharemake" data-id="' + esc(id) + '">Create link</button></div>'); box(480);
  }
  function backCard() { if (C.open) { modal(); X.reopen(C.open.card.id); } }

  /* ---------- events ---------- */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-ca]'); if (!el) return; var a = el.getAttribute('data-ca'), id = el.getAttribute('data-id');
    if (a === 'tab') { T.tab = el.getAttribute('data-t'); A.redraw(); if (T.tab === 'reminders') loadRem(); if (T.tab === 'alerts') loadNotes(); if (T.tab === 'mine' && window.AOSMine) window.AOSMine.onGo(); return; }
    if (a === 'new') return void newCard();
    if (a === 'cshare') { var cc = C.open && C.open.card; return void (cc && window.AOSMine && window.AOSMine.contactShare(cc)); }
    if (a === 'export') return void (location.href = '/api/cards/export' + (C.group ? '?groupId=' + encodeURIComponent(C.group) : ''));
    if (a === 'bexport') return void (location.href = '/api/cards/export?ids=' + encodeURIComponent(selIds().join(',')));
    if (a === 'selmode') { C.selecting = !C.selecting; if (!C.selecting) C.sel = {}; return void A.redraw(); }
    if (a === 'selall') { C.cards.forEach(function (c) { C.sel[c.id] = true; }); return void A.redraw(); }
    if (a === 'selnone') { C.sel = {}; return void A.redraw(); }
    if (a === 'bmove') return void bulkMove(); if (a === 'bdel') return void bulkDel(); if (a === 'bmerge') return void bulkMerge();
    if (a === 'bmoveyes') { var gid = $('#bg').value; m('Moving...'); return void api('/api/cards/bulk-move', { method: 'POST', json: { ids: selIds(), groupId: gid } }).then(function () { C.sel = {}; modal(); toast('Moved'); return reload(); }).catch(function (e) { m(e.message, true); }); }
    if (a === 'bdelyes') { m('Deleting...'); return void api('/api/cards/bulk-delete', { method: 'POST', json: { ids: selIds() } }).then(function () { C.sel = {}; C.selecting = false; modal(); toast('Deleted'); return reload(); }).catch(function (e) { m(e.message, true); }); }
    if (a === 'mgyes') return void doMerge();
    if (a === 'opencard') { T.tab = 'cards'; A.redraw(); return void X.reopen(id); }
    if (a === 'rmimg') { keep(); T.newc[el.getAttribute('data-s')] = null; return void drawNew(); }
    if (a === 'airead') return void aiRead();
    if (a === 'savenew') return void saveNew(el.getAttribute('data-force') === '1');
    if (a === 'notes') return void notesModal(cardId()); if (a === 'remind') return void remindModal(cardId()); if (a === 'share') return void shareModal(cardId()); if (a === 'backcard') return void backCard();
    if (a === 'noteadd') { var t = $('#nn').value.trim(); if (!t) return m('Write a note first.', true); m('Saving...'); return void api('/api/cards/' + id + '/notes', { method: 'POST', json: { note: t } }).then(function () { notesModal(id); toast('Note added'); }).catch(function (e) { m(e.message, true); }); }
    if (a === 'remadd') { var dd = $('#rd').value; if (!dd) return m('Pick a date.', true); m('Saving...'); return void api('/api/cards/' + id + '/reminders', { method: 'POST', json: { dueDate: dd, note: $('#rn').value } }).then(function () { toast('Reminder set'); T.rem = null; backCard(); }).catch(function (e) { m(e.message, true); }); }
    if (a === 'remdone') return void api('/api/cs/reminders/' + id, { method: 'PATCH', json: { done: true } }).then(function () { toast('Marked done'); return loadRem(); }).catch(function (e) { toast(e.message); });
    if (a === 'remsnz') return void api('/api/cs/reminders/' + id, { method: 'PATCH', json: { snoozeToDate: today(Number(el.getAttribute('data-n'))) } }).then(function () { toast('Snoozed'); return loadRem(); }).catch(function (e) { toast(e.message); });
    if (a === 'markread') return void api('/api/cs/notifications/mark-read', { method: 'POST', json: {} }).then(loadNotes);
    if (a === 'sharemake') { m('Creating link...'); return void api('/api/cards/' + id + '/share', { method: 'POST', json: { validityDays: Number($('#sd').value), maxViews: $('#sv').value ? Number($('#sv').value) : null } }).then(function (d) { m(''); $('#sres').innerHTML = '<div class="field"><label for="surl">Share link' + (d.expiresAt ? ' (valid until ' + esc(dfmt(d.expiresAt)) + ')' : '') + '</label><div style="display:flex;gap:8px"><input class="input" id="surl" readonly value="' + esc(d.url) + '"><button class="btn" data-ca="copy">Copy</button></div></div>'; var i = $('#surl'); if (i) i.select(); }).catch(function (e) { m(e.message, true); }); }
    if (a === 'copy') { var v = $('#surl'); if (!v) return; v.select(); try { navigator.clipboard.writeText(v.value).then(function () { toast('Link copied'); }, function () { toast('Press Ctrl+C to copy'); }); } catch (e) { toast('Press Ctrl+C to copy'); } return; }
    if (a === 'shareoff') return void api('/api/cards/' + id + '/share', { method: 'DELETE' }).then(function () { toast('Link switched off'); var s = $('#sres'); if (s) s.innerHTML = ''; }).catch(function (e) { m(e.message, true); });
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target, side = t.getAttribute && t.getAttribute('data-cf');
    if (side && t.files && t.files[0]) { keep(); both(t.files[0]).then(function (im) { T.newc[side] = im; drawNew(); }).catch(function (e) { m(e.message, true); }); }
    if (t.id === 'mg_p' && MG) { MG.primary = t.value; MG.pick = {}; drawMerge(); }
    if (t.getAttribute && t.getAttribute('data-ca') === 'selone') { C.sel[t.getAttribute('data-id')] = t.checked; A.redraw(); }
  });
  function onGo(v) { if (v !== 'cards') return; if (T.tab === 'mine' && window.AOSMine) window.AOSMine.onGo(); if (T.tab === 'reminders') loadRem(); if (T.tab === 'alerts' || !T.notes) loadNotes(); }
  window.AOSCards = { head: head, tabs: tabs, bulkBar: bulkBar, tab: function () { return T.tab; }, tabView: tabView, onGo: onGo, state: T };
})();
