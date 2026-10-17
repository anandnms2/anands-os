/* Card Scan features inside the Contacts app: scan a card (photos, AI reading, duplicate check), card photos, group, notes and history,
 * reminders, share links, alerts, your own cards and CSV export. Talks to this server's /api/cards, /api/cs and /api/my-cards, so it works
 * on the same login as the rest of Anands OS. Contacts that came from a card have ids starting with "cs-". */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function api(path, o) {
    o = o || {}; var h = { 'x-aos': '1' }; if (o.json) h['content-type'] = 'application/json';
    return fetch(path, { method: o.method || 'GET', headers: h, credentials: 'same-origin', body: o.json ? JSON.stringify(o.json) : undefined }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) { var e = new Error(d.error || d.message || 'Something went wrong (' + r.status + ')'); e.status = r.status; e.code = d.code; throw e; } return d; });
    });
  }
  var css = document.createElement('style');
  css.textContent = '.cx-back{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.cx-box{background:var(--bg-elev,#fff);color:var(--text,#161a22);border:1px solid var(--border,#e7e9ee);border-radius:var(--radius-lg,18px);width:min(680px,100%);max-height:calc(100dvh - 32px);overflow:auto;padding:18px;font:14px var(--font,system-ui)}' +
    '.cx-box h2{margin:0;font-size:20px}.cx-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.cx-sp{justify-content:space-between}.cx-mt{margin-top:12px}' +
    '.cx-tabs{display:flex;gap:6px;margin:12px 0;flex-wrap:wrap}.cx-tabs button{border:1px solid var(--border);background:var(--bg-subtle);color:inherit;border-radius:99px;padding:6px 12px;cursor:pointer;font:inherit}.cx-tabs button.on{background:var(--accent);color:var(--accent-text);border-color:var(--accent)}' +
    '.cx-in{width:100%;box-sizing:border-box;border:1px solid var(--border-strong);background:var(--bg);color:inherit;border-radius:var(--radius-sm,9px);padding:8px 10px;font:inherit}.cx-lab{display:block;font-size:12px;opacity:.7;margin:10px 0 3px}' +
    '.cx-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}@media(max-width:560px){.cx-grid{grid-template-columns:1fr}}' +
    '.cx-item{display:flex;gap:10px;align-items:flex-start;justify-content:space-between;padding:10px 0;border-top:1px solid var(--border)}.cx-item:first-child{border-top:0}.cx-note{opacity:.7;font-size:12px}' +
    '.cx-img{max-width:100%;max-height:150px;border-radius:8px;border:1px solid var(--border);object-fit:contain;background:var(--bg-subtle)}.cx-err{color:var(--danger)}.cx-ok{color:var(--success)}' +
    '.cx-card{margin:18px 0 0;padding:14px;border:1px solid var(--border);border-radius:var(--radius,12px);background:var(--bg-subtle)}.cx-card h2{font-size:15px;margin:0 0 8px}';
  document.head.appendChild(css);

  var root = null, state = { tab: 'scan' };
  function close() { if (root) { root.remove(); root = null; } }
  function open(html, w) { close(); root = document.createElement('div'); root.className = 'cx-back'; root.innerHTML = '<div class="cx-box" role="dialog" aria-modal="true"' + (w ? ' style="width:min(' + w + 'px,100%)"' : '') + '>' + html + '</div>'; root.addEventListener('mousedown', function (e) { if (e.target === root) close(); }); document.body.appendChild(root); return root.firstChild; }
  function head(t) { return '<div class="cx-row cx-sp"><h2>' + t + '</h2><button class="btn btn--soft btn--sm" data-cx="close">Close</button></div>'; }
  function msg(t, bad) { var n = $('#cx-m'); if (n) { n.className = bad ? 'cx-err' : 'cx-note'; n.textContent = t; } }
  function ago(iso) { if (!iso) return ''; var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000); return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' d ago'; }
  function day(n) { var d = new Date(Date.now() + n * 86400000); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function readImage(file, max, q) {
    return new Promise(function (res, rej) {
      var fr = new FileReader(); fr.onerror = function () { rej(new Error('Could not read that photo')); };
      fr.onload = function () { var im = new Image(); im.onerror = function () { rej(new Error('That file is not a photo')); }; im.onload = function () { var r = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * r); c.height = Math.round(im.height * r); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q)); }; im.src = fr.result; };
      fr.readAsDataURL(file);
    });
  }
  function download(name, text, type) { var u = URL.createObjectURL(new Blob([text], { type: type })), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 3000); }

  /* ---------- the Cards panel (top bar button) ---------- */
  var TABS = [['scan', 'Scan a card'], ['rem', 'Reminders'], ['alerts', 'Alerts'], ['mine', 'My cards']];
  var FIELDS = [['name', 'Name'], ['designation', 'Job title'], ['company', 'Company'], ['phone', 'Phone'], ['phone2', 'Phone 2'], ['email', 'Email'], ['whatsapp', 'WhatsApp'], ['website', 'Website'], ['address', 'Address']];
  var N = null, groups = null;
  function panel() {
    var b = open(head('Cards') + '<div class="cx-tabs">' + TABS.map(function (t) { return '<button data-cx="tab" data-t="' + t[0] + '" class="' + (state.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '<button data-cx="export">Export CSV</button></div><div id="cx-body"></div>');
    tab(state.tab); return b;
  }
  function tab(t) {
    state.tab = t; Array.prototype.forEach.call(document.querySelectorAll('[data-cx="tab"]'), function (b) { b.classList.toggle('on', b.getAttribute('data-t') === t); });
    var el = $('#cx-body'); if (!el) return;
    if (t === 'scan') return scanView(el);
    el.innerHTML = '<p class="cx-note">Loading...</p>';
    if (t === 'rem') api('/api/cs/reminders').then(function (d) {
      var l = d.reminders || []; el.innerHTML = l.length ? l.map(function (r) { return '<div class="cx-item"><div><b>' + esc(r.card_name || 'Card') + '</b>' + (r.card_company ? ' <span class="cx-note">' + esc(r.card_company) + '</span>' : '') + '<div>' + esc(r.note || '') + '</div><div class="cx-note">Due ' + esc(String(r.due_date || '').slice(0, 10)) + '</div></div><div class="cx-row"><button class="btn btn--soft btn--sm" data-cx="remsnz" data-id="' + esc(r.id) + '">Tomorrow</button><button class="btn btn--primary btn--sm" data-cx="remdone" data-id="' + esc(r.id) + '">Done</button></div></div>'; }).join('') : '<p class="cx-note">No open reminders. Open a card contact and choose Remind me.</p>';
    }).catch(function (e) { el.innerHTML = '<p class="cx-err">' + esc(e.message) + '</p>'; });
    if (t === 'alerts') api('/api/cs/notifications').then(function (d) {
      var n = d.notifications || []; el.innerHTML = '<div class="cx-row"><button class="btn btn--soft btn--sm" data-cx="markread"' + (d.unreadCount ? '' : ' disabled') + '>Mark all as read</button></div>' + (n.length ? n.map(function (x) { return '<div class="cx-item"><div><b style="font-weight:' + (x.read ? 500 : 700) + '">' + esc(x.message) + '</b><div class="cx-note">' + esc(ago(x.created_at)) + '</div></div></div>'; }).join('') : '<p class="cx-note">No alerts.</p>');
    }).catch(function (e) { el.innerHTML = '<p class="cx-err">' + esc(e.message) + '</p>'; });
    if (t === 'mine') api('/api/my-cards').then(function (d) {
      var l = d.cards || d.myCards || []; el.innerHTML = (l.length ? l.map(function (c) { return '<div class="cx-item"><div><b>' + esc(c.name || 'Untitled card') + '</b><div class="cx-note">' + esc([c.title || c.designation, c.company].filter(Boolean).join(' · ')) + '</div>' + (c.share_token ? '<div class="cx-note">Shared · ' + esc(c.views != null ? c.views + ' views' : 'link on') + '</div>' : '<div class="cx-note">Not shared</div>') + '</div>' + (c.share_token ? '<button class="btn btn--soft btn--sm" data-cx="copymine" data-tok="' + esc(c.share_token) + '">Copy link</button>' : '') + '</div>'; }).join('') : '<p class="cx-note">You have no digital cards yet.</p>') + '<p class="cx-note cx-mt">Design and edit your own cards in Card Scan.</p>';
    }).catch(function (e) { el.innerHTML = '<p class="cx-err">' + esc(e.message) + '</p>'; });
  }
  function loadGroups() { return groups ? Promise.resolve(groups) : api('/api/cards?limit=1').then(function (d) { groups = d.groups || []; return groups; }).catch(function () { groups = []; return groups; }); }
  function scanView(el) {
    N = N || { f: {}, front: null, back: null, groupId: '', dups: null };
    loadGroups().then(function (gs) {
      if (!N.groupId && gs[0]) N.groupId = gs[0].id;
      var photos = [['front', 'Front of the card'], ['back', 'Back (optional)']].map(function (p) { return '<div><label class="cx-lab">' + p[1] + '</label><input type="file" accept="image/*" capture="environment" data-cx="photo" data-side="' + p[0] + '">' + (N[p[0]] ? '<div class="cx-mt"><img class="cx-img" alt="" src="' + esc(N[p[0]].thumb) + '"></div>' : '') + '</div>'; }).join('');
      el.innerHTML = '<div class="cx-grid">' + photos + '</div><div class="cx-row cx-mt"><button class="btn btn--soft btn--sm" data-cx="airead"' + (N.front ? '' : ' disabled') + '>' + (N.reading ? 'Reading...' : 'Read details with AI') + '</button><span class="cx-note">Fills the fields from the photo. Check them before saving.</span></div>' +
        '<div class="cx-grid">' + FIELDS.map(function (f) { return '<div><label class="cx-lab" for="cxf-' + f[0] + '">' + f[1] + '</label><input class="cx-in" id="cxf-' + f[0] + '" data-cx="field" data-k="' + f[0] + '" value="' + esc(N.f[f[0]] || '') + '" autocomplete="off"></div>'; }).join('') + '<div><label class="cx-lab" for="cxg">Group</label><select class="cx-in" id="cxg" data-cx="group">' + gs.map(function (g) { return '<option value="' + esc(g.id) + '"' + (g.id === N.groupId ? ' selected' : '') + '>' + esc(g.name) + '</option>'; }).join('') + '</select></div></div>' +
        (N.dups ? '<p class="cx-err cx-mt"><b>Looks like a duplicate:</b> ' + N.dups.map(function (d) { return esc(d.name || d.company || 'Card'); }).join(', ') + '</p>' : '') +
        '<div id="cx-m" class="cx-note cx-mt" role="status"></div><div class="cx-row cx-mt" style="justify-content:flex-end"><button class="btn btn--primary" data-cx="save">' + (N.dups ? 'Save anyway' : 'Save card') + '</button></div>';
    });
  }
  function grab() { Array.prototype.forEach.call(document.querySelectorAll('[data-cx="field"]'), function (i) { N.f[i.getAttribute('data-k')] = i.value; }); var g = $('#cxg'); if (g) N.groupId = g.value; }
  function save(force) {
    grab(); if (!(N.f.name || '').trim() && !(N.f.company || '').trim()) return msg('Add a name or a company first.', true);
    var go = function () {
      msg('Saving...'); var b = {}; Object.keys(N.f).forEach(function (k) { if (N.f[k]) b[k] = N.f[k]; }); if (N.groupId) b.groupId = N.groupId;
      if (N.front) { b.image = N.front.full; b.imageThumb = N.front.thumb; } if (N.back) { b.imageBack = N.back.full; b.imageBackThumb = N.back.thumb; }
      return api('/api/cards', { method: 'POST', json: b }).then(function () { N = null; msg('Saved. Refreshing your contacts...'); setTimeout(function () { location.reload(); }, 600); }).catch(function (e) { msg(e.message, true); });
    };
    if (force) return go();
    var qs = []; if (N.f.phone) qs.push('phone=' + encodeURIComponent(N.f.phone)); if (N.f.email) qs.push('email=' + encodeURIComponent(N.f.email));
    if (!qs.length) return go();
    api('/api/cards/check-duplicate?' + qs.join('&')).then(function (d) { var ms = (d && d.matches) || []; if (ms.length) { N.dups = ms; scanView($('#cx-body')); } else go(); }).catch(go);
  }

  /* ---------- card details inside a contact that came from a card ---------- */
  var shownFor = '';
  function selectedId() { var s = $('.contact-item.is-selected[data-id]'); return s ? s.getAttribute('data-id') : ''; }
  function cardSection() {
    var det = $('.detail__card'); if (!det) { shownFor = ''; return; }
    var id = selectedId(); if (!/^cs-[0-9a-f-]{36}$/i.test(id)) { var old = $('.cx-card'); if (old) old.remove(); shownFor = ''; return; }
    if ($('.cx-card') && shownFor === id) return;
    shownFor = id; var cid = id.slice(3); var old2 = $('.cx-card'); if (old2) old2.remove();
    var box = document.createElement('section'); box.className = 'cx-card'; box.innerHTML = '<h2>Business card</h2><p class="cx-note">Loading...</p>';
    var foot = $('.detail__meta', det); if (foot) foot.parentNode.insertBefore(box, foot); else det.appendChild(box);
    Promise.all([api('/api/cards/' + cid), loadGroups()]).then(function (r) {
      if (shownFor !== id) return; var c = r[0].card || {}, gs = r[1], shared = c.share_token || c.shareToken;
      box.innerHTML = '<h2>Business card</h2><div class="cx-row">' + (c.image ? '<img class="cx-img" alt="Front of the card" src="' + esc(c.image) + '">' : '') + (c.image_back ? '<img class="cx-img" alt="Back of the card" src="' + esc(c.image_back) + '">' : '') + '</div>' +
        '<div class="cx-row cx-mt"><label class="cx-note" for="cx-grp">Group</label><select class="cx-in" id="cx-grp" style="width:auto" data-cx="setgroup" data-id="' + esc(cid) + '">' + gs.map(function (g) { return '<option value="' + esc(g.id) + '"' + (g.id === c.group_id ? ' selected' : '') + '>' + esc(g.name) + '</option>'; }).join('') + '</select>' + (c.last_contacted_at ? '<span class="cx-note">Last contacted ' + esc(ago(c.last_contacted_at)) + '</span>' : '') + '</div>' +
        '<div class="cx-row cx-mt"><button class="btn btn--soft btn--sm" data-cx="contacted" data-id="' + esc(cid) + '">Mark contacted</button><button class="btn btn--soft btn--sm" data-cx="notes" data-id="' + esc(cid) + '">Notes and history</button><button class="btn btn--soft btn--sm" data-cx="remind" data-id="' + esc(cid) + '">Remind me</button><button class="btn btn--soft btn--sm" data-cx="share" data-id="' + esc(cid) + '">' + (shared ? 'Sharing is on' : 'Share card') + '</button></div><div id="cx-m2" class="cx-note cx-mt" role="status"></div>';
    }).catch(function (e) { box.innerHTML = '<h2>Business card</h2><p class="cx-note">' + esc(e.message) + '</p>'; });
  }
  function m2(t, bad) { var n = $('#cx-m2'); if (n) { n.className = 'cx-mt ' + (bad ? 'cx-err' : 'cx-note'); n.textContent = t; } }
  function notesModal(id) {
    open(head('Notes and history') + '<label class="cx-lab" for="cx-nn">Add a note</label><textarea class="cx-in" id="cx-nn" rows="3" placeholder="What did you talk about?"></textarea><div id="cx-m" class="cx-note" role="status"></div><div class="cx-row cx-mt" style="justify-content:flex-end"><button class="btn btn--primary btn--sm" data-cx="noteadd" data-id="' + esc(id) + '">Add note</button></div><div id="cx-tl"><p class="cx-note">Loading...</p></div>');
    api('/api/cards/' + id + '/timeline').then(function (d) {
      var ev = d.events || [], el = $('#cx-tl'); if (!el) return;
      el.innerHTML = '<h2 style="font-size:15px;margin:14px 0 4px">Timeline</h2>' + (ev.length ? ev.map(function (e) { return '<div class="cx-item"><div style="overflow-wrap:anywhere">' + (e.kind === 'note' ? '<b>Note</b><div style="white-space:pre-wrap">' + esc(e.note) + '</div>' : '<b>' + esc(String(e.action || 'activity').replace(/_/g, ' ')) + '</b>' + (e.detail ? '<div class="cx-note">' + esc(typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail)) + '</div>' : '')) + '</div><span class="cx-note" style="white-space:nowrap">' + esc(e.userName || '') + ' · ' + esc(ago(e.createdAt)) + '</span></div>'; }).join('') : '<p class="cx-note">Nothing yet.</p>');
    }).catch(function (e) { var el = $('#cx-tl'); if (el) el.innerHTML = '<p class="cx-err">' + esc(e.message) + '</p>'; });
  }
  function remindModal(id) { open(head('Remind me') + '<label class="cx-lab" for="cx-rd">Date</label><input class="cx-in" id="cx-rd" type="date" value="' + day(3) + '" min="' + day(0) + '"><label class="cx-lab" for="cx-rn">Note</label><input class="cx-in" id="cx-rn" placeholder="Send the quote" autocomplete="off"><div id="cx-m" class="cx-note" role="status"></div><div class="cx-row cx-mt" style="justify-content:flex-end"><button class="btn btn--primary btn--sm" data-cx="remadd" data-id="' + esc(id) + '">Set reminder</button></div>', 440); }
  var DAYS = [[1, '1 day'], [7, '7 days'], [14, '14 days'], [30, '30 days'], [60, '60 days'], [90, '90 days'], [180, '180 days'], [365, '1 year']];
  function shareModal(id) {
    open(head('Share this card') + '<p class="cx-note">Anyone with the link can see this card until it expires. You can switch it off at any time.</p><label class="cx-lab" for="cx-sd">Link works for</label><select class="cx-in" id="cx-sd">' + DAYS.map(function (d) { return '<option value="' + d[0] + '"' + (d[0] === 30 ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select><label class="cx-lab" for="cx-sv">Maximum views (optional)</label><input class="cx-in" id="cx-sv" type="number" min="1" placeholder="No limit"><div id="cx-m" class="cx-note" role="status"></div><div id="cx-sres"></div><div class="cx-row cx-mt" style="justify-content:flex-end"><button class="btn btn--soft btn--sm" data-cx="shareoff" data-id="' + esc(id) + '">Switch sharing off</button><button class="btn btn--primary btn--sm" data-cx="sharemake" data-id="' + esc(id) + '">Create link</button></div>', 480);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cx]'); if (!t) return; var a = t.getAttribute('data-cx'), id = t.getAttribute('data-id');
    if (a === 'open') { state.tab = 'scan'; return void panel(); }
    if (a === 'close') return void close();
    if (a === 'tab') return void tab(t.getAttribute('data-t'));
    if (a === 'export') return void fetch('/api/cards/export', { headers: { 'x-aos': '1' }, credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error('Could not export'); return r.text(); }).then(function (x) { download('contacts.csv', x, 'text/csv'); }).catch(function (er) { msg(er.message, true); });
    if (a === 'airead') { grab(); N.reading = true; scanView($('#cx-body')); return void api('/api/cs/ai/extract-card', { method: 'POST', json: { front: N.front.full, back: N.back ? N.back.full : undefined } }).then(function (d) { var f = (d && d.fields) || d || {}; FIELDS.forEach(function (k) { if (f[k[0]] && !N.f[k[0]]) N.f[k[0]] = String(f[k[0]]); }); N.reading = false; scanView($('#cx-body')); msg('Details filled in. Please check them.'); }).catch(function (er) { N.reading = false; scanView($('#cx-body')); msg(er.message, true); }); }
    if (a === 'save') return void save(!!N.dups);
    if (a === 'remdone') return void api('/api/cs/reminders/' + id, { method: 'PATCH', json: { done: true } }).then(function () { tab('rem'); }).catch(function (er) { msg(er.message, true); });
    if (a === 'remsnz') return void api('/api/cs/reminders/' + id, { method: 'PATCH', json: { snoozeToDate: day(1) } }).then(function () { tab('rem'); }).catch(function (er) { msg(er.message, true); });
    if (a === 'markread') return void api('/api/cs/notifications/mark-read', { method: 'POST', json: {} }).then(function () { tab('alerts'); });
    if (a === 'copymine') { var tok = t.getAttribute('data-tok'); return void api('/api/settings').then(function (d) { var link = (((d.cards || {}).url) || '').replace(/\/+$/, '') + '/m/' + tok; try { navigator.clipboard.writeText(link).then(function () { t.textContent = 'Copied'; }, function () { prompt_(link); }); } catch (x) { prompt_(link); } }).catch(function () {}); }
    if (a === 'notes') return void notesModal(id);
    if (a === 'remind') return void remindModal(id);
    if (a === 'share') return void shareModal(id);
    if (a === 'contacted') return void api('/api/cards/' + id, { method: 'PATCH', json: { markContacted: true } }).then(function () { m2('Marked as contacted today.'); }).catch(function (er) { m2(er.message, true); });
    if (a === 'noteadd') { var nn = $('#cx-nn'); if (!nn.value.trim()) return msg('Write the note first.', true); return void api('/api/cards/' + id + '/notes', { method: 'POST', json: { note: nn.value } }).then(function () { notesModal(id); }).catch(function (er) { msg(er.message, true); }); }
    if (a === 'remadd') return void api('/api/cards/' + id + '/reminders', { method: 'POST', json: { dueDate: $('#cx-rd').value, note: $('#cx-rn').value } }).then(function () { close(); m2('Reminder set.'); }).catch(function (er) { msg(er.message, true); });
    if (a === 'sharemake') { msg('Creating link...'); return void api('/api/cards/' + id + '/share', { method: 'POST', json: { validityDays: Number($('#cx-sd').value), maxViews: $('#cx-sv').value ? Number($('#cx-sv').value) : null } }).then(function (d) { msg(''); $('#cx-sres').innerHTML = '<label class="cx-lab">Link</label><input class="cx-in" readonly value="' + esc(d.url || '') + '" onfocus="this.select()">'; }).catch(function (er) { msg(er.message, true); }); }
    if (a === 'shareoff') return void api('/api/cards/' + id + '/share', { method: 'DELETE' }).then(function () { msg('Sharing is off.'); }).catch(function (er) { msg(er.message, true); });
  });
  function prompt_(link) { var n = $('#cx-body'); if (n) n.insertAdjacentHTML('beforeend', '<input class="cx-in cx-mt" readonly value="' + esc(link) + '" onfocus="this.select()">'); }
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.getAttribute) return; var a = t.getAttribute('data-cx');
    if (a === 'photo') { var side = t.getAttribute('data-side'), f = t.files && t.files[0]; if (!f) return; grab(); msg('Preparing the photo...'); Promise.all([readImage(f, 1600, 0.82), readImage(f, 320, 0.7)]).then(function (r) { N[side] = { full: r[0], thumb: r[1] }; scanView($('#cx-body')); }).catch(function (er) { msg(er.message, true); }); }
    if (a === 'setgroup') api('/api/cards/' + t.getAttribute('data-id'), { method: 'PATCH', json: { groupId: t.value } }).then(function () { m2('Group changed.'); }).catch(function (er) { m2(er.message, true); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root) close(); });

  /* ---------- put the button in the top bar and watch for card contacts ---------- */
  function mount() {
    var bar = $('.topbar__actions'); if (bar && !$('[data-cx="open"]')) { var b = document.createElement('button'); b.className = 'btn btn--soft btn--sm'; b.setAttribute('data-cx', 'open'); b.title = 'Scan cards, reminders and alerts'; b.innerHTML = '<span>Cards</span>'; bar.insertBefore(b, bar.firstChild); }
    cardSection();
  }
  var tmr = null; new MutationObserver(function () { clearTimeout(tmr); tmr = setTimeout(mount, 120); }).observe(document.documentElement, { childList: true, subtree: true });
  mount();
})();
