/* Status (Beszel) in Insights, VPN (wg-easy) and Cards (Card Scan). Loaded after os.js; talks only to this server's /api/status, /api/vpn and /api/cards. */
(function () {
  'use strict';
  var A = window.AOS; if (!A) return;
  var S = A.S, $ = A.$, esc = A.esc, api = A.api, toast = A.toast, ic = A.ic, modal = A.modal;
  var I = { st: { data: null, loading: false, error: null, code: null }, vpn: { data: null, loading: false, error: null, code: null }, cards: { data: null, loading: false, error: null, code: null, q: '', group: '', cards: [], offset: 0, open: null } };
  var LIMIT = 60, timer = null;

  function ago(iso) { if (!iso) return 'never'; var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' d ago'; }
  function dur(sec) { if (sec == null) return ''; var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600); return d ? d + 'd ' + h + 'h' : h + 'h ' + Math.floor(sec % 3600 / 60) + 'm'; }
  function tone(v) { return v == null ? '' : v >= 90 ? 'bad' : v >= 75 ? 'warn' : ''; }
  function bar(label, v) { return '<div class="ibar"><span>' + label + '</span><div class="track"><div class="fill ' + tone(v) + '" style="width:' + Math.min(100, v || 0) + '%"></div></div><b class="mono">' + (v == null ? '–' : Math.round(v) + '%') + '</b></div>'; }
  function connectCard(title, text, where) { return '<div class="card"><h2 style="font-size:20px;margin-bottom:6px">' + esc(title) + '</h2><p class="note" style="margin:0 0 14px">' + esc(text) + '</p><button class="btn primary" data-act="nav" data-v="settings">Open Settings</button></div>'; }
  function fail(st, label) { return '<div class="banner"><i class="dot bad"></i><span>' + esc(st.error || ('Could not load ' + label + '.')) + '</span></div>'; }
  function load(key, url, after, quiet) {
    var st = I[key]; st.loading = true; if (!quiet && current(key)) A.redraw();
    return api(url).then(function (d) { st.data = d; st.error = null; st.code = null; if (after) after(d); }).catch(function (e) { st.error = e.message; st.code = e.code; if (e.code === 'not_configured') st.data = null; }).then(function () { st.loading = false; if (current(key) && !(quiet && document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) A.redraw(); });
  }
  function current(key) { return S.view === (key === 'st' ? 'insights' : key); }

  /* ---------- Status: Servers section in Insights ---------- */
  function servers() {
    var st = I.st, d = st.data;
    var head = '<div class="toolbar" style="margin-top:6px;margin-bottom:12px"><h2 style="font-size:20px;margin-right:6px">Servers</h2>' + (d ? '<span class="note">' + d.up + ' up' + (d.down ? ', <b style="color:var(--bad)">' + d.down + ' down</b>' : '') + (d.alertsFiring ? ', <b style="color:var(--warn)">' + d.alertsFiring + ' alert' + (d.alertsFiring > 1 ? 's' : '') + ' firing</b>' : '') + '</span>' : '') + '<span style="flex:1"></span><button class="btn sm" data-ia="stref">' + (st.loading ? 'Refreshing...' : 'Refresh') + '</button></div>';
    if (!d) {
      if (st.loading) return '<div class="card" style="margin-bottom:18px">' + head + '<p class="note">Loading from Status...</p></div>';
      if (st.code === 'not_configured') return '<div style="margin-bottom:18px">' + connectCard('Servers: connect Status (Beszel)', 'Add your Status address and a read-only user in Settings to see CPU, memory, disk, containers and alerts for every server here.') + '</div>';
      return '<div style="margin-bottom:18px">' + head + fail(st, 'servers') + '</div>';
    }
    if (!d.systems.length) return '<div class="card" style="margin-bottom:18px">' + head + '<p class="note">Status has no servers yet. Add an agent in Beszel.</p></div>';
    var cards = d.systems.map(function (s) {
      var down = s.status !== 'up';
      return '<button class="card isrv" data-ia="srv" data-id="' + esc(s.id) + '" aria-label="' + esc(s.name) + ' details"><div class="isrv-h"><i class="dot ' + (s.status === 'up' ? '' : s.status === 'down' ? 'bad' : 'warn') + '"></i><b>' + esc(s.name) + '</b><span class="pill ' + (s.status === 'up' ? 'ok' : s.status === 'down' ? 'bad' : 'warn') + '" style="margin-left:auto">' + (s.status === 'up' ? 'Up' : s.status === 'down' ? 'Down' : 'Waiting') + '</span></div><div class="mono note" style="margin:-4px 0 10px">' + esc(s.host || '') + (s.uptime != null && !down ? ' · up ' + dur(s.uptime) : down ? ' · seen ' + ago(s.updated) : '') + '</div>' +
        (down ? '' : bar('CPU', s.cpu) + bar('Memory', s.mem) + bar('Disk', s.disk)) +
        ((s.alerts.filter(function (a) { return a.triggered; }).length || (s.services && s.services.failed) || (s.temp != null)) ? '<div class="isrv-f">' + s.alerts.filter(function (a) { return a.triggered; }).map(function (a) { return '<span class="pill bad">' + esc(a.name) + '</span>'; }).join('') + (s.services && s.services.failed ? '<span class="pill warn">' + s.services.failed + ' service' + (s.services.failed > 1 ? 's' : '') + ' failed</span>' : '') + (s.temp != null ? '<span class="pill ' + tone(s.temp + 10) + '">' + s.temp + ' °C</span>' : '') + '</div>' : '') + '</button>';
    }).join('');
    return '<div style="margin-bottom:18px">' + head + '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(270px,1fr))">' + cards + '</div></div>';
  }
  function spark(series, key, color) {
    var pts = series.map(function (x) { return x[key]; }).filter(function (v) { return v != null; });
    if (pts.length < 2) return '<div class="note" style="padding:14px 0">Not enough history yet.</div>';
    var W = 300, H = 60, max = Math.max(100, Math.max.apply(null, pts)), step = W / (pts.length - 1);
    var d = pts.map(function (v, i) { return (i ? 'L' : 'M') + (i * step).toFixed(1) + ' ' + (H - v / max * (H - 4) - 2).toFixed(1); }).join(' ');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="ispark" role="img" aria-label="' + key + ' over the last hour"><path d="' + d + ' L' + W + ' ' + H + ' L0 ' + H + 'Z" fill="' + color + '" opacity=".12"/><path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  }
  function srvModal(id) {
    var s0 = (I.st.data ? I.st.data.systems : []).filter(function (x) { return x.id === id; })[0] || { name: 'Server' };
    modal('<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:12px"><h2 style="font-size:22px">' + esc(s0.name) + '</h2><button class="btn sm" data-act="mx2">Close</button></div><p class="note" id="srvbody">Loading...</p>');
    var box = $('#modal .card'); if (box) box.style.width = 'min(640px,100%)';
    api('/api/status/system?id=' + encodeURIComponent(id)).then(function (d) {
      var el = $('#srvbody'); if (!el) return; var n = d.now || {}, i = d.info || {};
      var h = '<div class="ikv">' + (i.os ? '<span>OS</span><b>' + esc(i.os) + '</b>' : '') + (i.kernel ? '<span>Kernel</span><b>' + esc(i.kernel) + '</b>' : '') + (i.cpu ? '<span>CPU</span><b>' + esc(i.cpu) + (i.cores ? ' · ' + i.cores + ' cores' : '') + '</b>' : '') + (n.memTotal ? '<span>Memory</span><b>' + n.memUsed + ' / ' + n.memTotal + ' GB</b>' : '') + (n.diskTotal ? '<span>Disk</span><b>' + n.diskUsed + ' / ' + n.diskTotal + ' GB</b>' : '') + (d.system.agent ? '<span>Agent</span><b>' + esc(d.system.agent) + '</b>' : '') + '</div>';
      h += '<h3 class="ih">CPU, last hour</h3>' + spark(d.series, 'cpu', 'var(--accent)') + '<h3 class="ih">Memory, last hour</h3>' + spark(d.series, 'mem', 'var(--ok)');
      h += '<h3 class="ih">Containers (' + d.containers.length + ')</h3>' + (d.containers.length ? '<div class="tablewrap"><table><thead><tr><th>Name</th><th>Status</th><th>CPU</th><th>Memory</th></tr></thead><tbody>' + d.containers.map(function (c) { return '<tr><td><b>' + esc(c.name) + '</b></td><td>' + esc(c.status || '') + '</td><td class="mono">' + (c.cpu == null ? '–' : c.cpu + '%') + '</td><td class="mono">' + (c.mem == null ? '–' : c.mem + ' MB') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="note">No container data. Enable Docker access for the Beszel agent.</p>');
      el.outerHTML = h;
    }).catch(function (e) { var el = $('#srvbody'); if (el) el.textContent = e.message; });
  }

  /* ---------- VPN ---------- */
  function vpnView() {
    var st = I.vpn, d = st.data;
    var head = '<div class="wrap"><div class="pagehead"><div><h1>VPN</h1><p>Devices allowed onto your WireGuard network. Add a phone or laptop, scan its QR code, and switch devices off when you lose them.</p></div><div style="display:flex;gap:10px"><button class="btn" data-ia="vpref">' + (st.loading ? 'Refreshing...' : 'Refresh') + '</button><button class="btn primary" data-ia="vpnew"' + (d ? '' : ' disabled') + '>Add device</button></div></div>';
    if (!d) {
      if (st.loading) return head + '<p class="note">Loading from your VPN...</p></div>';
      if (st.code === 'not_configured') return head + connectCard('VPN is not connected yet', 'Add your wg-easy address and a user in Settings. Use a user without two-factor sign-in; the API cannot use those.') + '</div>';
      return head + fail(st, 'the VPN') + '</div>';
    }
    var rows = d.clients.map(function (c) {
      var pill = !c.enabled ? '<span class="pill">Off</span>' : c.online ? '<span class="pill ok"><i class="dot"></i>Online</span>' : '<span class="pill warn">Idle</span>';
      return '<tr><td><b>' + esc(c.name) + '</b><div class="mono note">' + esc(c.address) + '</div></td><td>' + pill + '</td><td class="note">' + (c.handshake ? ago(c.handshake) : 'never') + (c.endpoint && c.online ? '<div class="mono">' + esc(c.endpoint) + '</div>' : '') + '</td><td class="mono note">' + (c.rx || c.tx ? '↓ ' + A.bytes(c.rx) + '<br>↑ ' + A.bytes(c.tx) : '–') + '</td><td class="note">' + (c.expiresAt ? A.fmt(new Date(c.expiresAt), { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never') + '</td><td><div class="iacts"><button class="btn sm" data-ia="vqr" data-id="' + c.id + '">QR code</button><a class="btn sm" href="/api/vpn/' + c.id + '/config?name=' + encodeURIComponent(c.name) + '" download>Config</a><button class="btn sm" data-ia="vtog" data-id="' + c.id + '">' + (c.enabled ? 'Turn off' : 'Turn on') + '</button><button class="btn sm" data-ia="vren" data-id="' + c.id + '">Rename</button><button class="btn sm danger" data-ia="vdel" data-id="' + c.id + '">Delete</button></div></td></tr>';
    }).join('');
    return head + '<div class="kpis"><div class="card kpi"><div class="stat"><span class="n">' + d.total + '</span><span class="l">devices</span></div></div><div class="card kpi"><div class="stat"><span class="n" style="color:var(--ok)">' + d.online + '</span><span class="l">online now</span></div></div><div class="card kpi"><div class="stat"><span class="n">' + d.enabled + '</span><span class="l">turned on</span></div></div></div>' +
      (d.clients.length ? '<div class="tablewrap"><table><thead><tr><th>Device</th><th>State</th><th>Last seen</th><th>Data</th><th>Expires</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<div class="empty"><h2>No devices yet</h2><p>Add your first device to get a QR code.</p></div>') + '</div>';
  }
  function vClient(id) { return ((I.vpn.data || {}).clients || []).filter(function (c) { return String(c.id) === String(id); })[0]; }
  function vAct(act, id, extra) {
    var ep = '/api/vpn' + (id != null ? '/' + id : '') + (extra || '');
    return ep;
  }
  function vErr(e) { toast(e.message || 'Something went wrong'); }
  function vNew() { modal('<h2 style="font-size:22px;margin-bottom:14px">Add a device</h2><div class="field"><label for="vn">Device name</label><input class="input" id="vn" placeholder="Anand phone" autocomplete="off"></div><div class="field"><label for="ve">Expires (optional)</label><input class="input" id="ve" type="date"></div><div id="vm" class="note" role="status"></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" data-act="mx2">Cancel</button><button class="btn primary" data-ia="vcreate">Add device</button></div>'); var f = $('#vn'); if (f) f.focus(); }
  function vQr(id) { var c = vClient(id); if (!c) return; modal('<h2 style="font-size:22px;margin-bottom:6px">' + esc(c.name) + '</h2><p class="note" style="margin:0 0 12px">In the WireGuard app choose Add tunnel, then Scan QR code.</p><div class="iqr"><img src="/api/vpn/' + c.id + '/qr" alt="QR code for ' + esc(c.name) + '"></div><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px"><a class="btn" href="/api/vpn/' + c.id + '/config?name=' + encodeURIComponent(c.name) + '" download>Download config</a><button class="btn primary" data-act="mx2">Done</button></div>'); }
  function vRen(id) { var c = vClient(id); if (!c) return; modal('<h2 style="font-size:22px;margin-bottom:14px">Rename device</h2><div class="field"><label for="vn">Device name</label><input class="input" id="vn" value="' + esc(c.name) + '" autocomplete="off"></div><div id="vm" class="note" role="status"></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" data-act="mx2">Cancel</button><button class="btn primary" data-ia="vrensave" data-id="' + c.id + '">Save</button></div>'); var f = $('#vn'); if (f) { f.focus(); f.select(); } }
  function vDel(id) { var c = vClient(id); if (!c) return; modal('<h2 style="font-size:22px;margin-bottom:8px">Delete ' + esc(c.name) + '?</h2><p class="note" style="margin:0 0 16px">The device loses access straight away and its configuration stops working. This cannot be undone. To keep it, turn it off instead.</p><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" data-act="mx2">Keep it</button><button class="btn danger" data-ia="vdelyes" data-id="' + c.id + '">Delete device</button></div>'); }

  /* ---------- Cards ---------- */
  var FIELDS = [['name', 'Name'], ['designation', 'Title'], ['company', 'Company'], ['phone', 'Phone'], ['phone2', 'Phone 2'], ['phone3', 'Phone 3'], ['whatsapp', 'WhatsApp'], ['email', 'Email'], ['email2', 'Email 2'], ['email3', 'Email 3'], ['website', 'Website'], ['address', 'Address']];
  function loadCards(more) {
    var C = I.cards; C.loading = true; if (!more) { C.offset = 0; } if (S.view === 'cards') A.redraw();
    var qs = '?limit=' + LIMIT + '&offset=' + (more ? C.cards.length : 0) + (C.q ? '&q=' + encodeURIComponent(C.q) : '') + (C.group ? '&group=' + encodeURIComponent(C.group) : '');
    var my = ++seq;
    return api('/api/cards' + qs).then(function (d) { if (my !== seq) return; C.data = d; C.cards = more ? C.cards.concat(d.cards) : d.cards; C.error = null; C.code = null; }).catch(function (e) { if (my !== seq) return; C.error = e.message; C.code = e.code; if (e.code === 'not_configured') C.data = null; }).then(function () { if (my !== seq) return; C.loading = false; if (S.view === 'cards') { var keep = $('#cq'), foc = document.activeElement === keep, pos = keep ? keep.selectionStart : 0; A.redraw(); if (foc) { var n = $('#cq'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } } } });
  }
  var seq = 0, qt = null;
  function link(href, text) { return '<a href="' + esc(href) + '" style="color:var(--accent-text)">' + esc(text) + '</a>'; }
  function cardsView() {
    var C = I.cards, d = C.data;
    var head = '<div class="wrap"><div class="pagehead"><div><h1>Cards</h1><p>Business cards you scanned with Card Scan. Open one to edit it, mark it contacted or delete it.</p></div>' + (window.AOSCards ? window.AOSCards.head() : '') + (d && !window.AOSCards ? '<div class="note">' + (d.stats ? d.stats.total + ' cards · ' + d.stats.companies + ' companies · ' + d.stats.addedThisWeek + ' this week' : d.total + ' cards') + '</div>' : '') + '</div>' + (window.AOSCards ? window.AOSCards.tabs() : '');
    if (window.AOSCards && window.AOSCards.tab() !== 'cards') return head + window.AOSCards.tabView() + '</div>';
    if (!d) {
      if (C.loading) return head + '<p class="note">Loading your cards...</p></div>';
      if (C.code === 'not_configured') return head + connectCard('Card Scan is not connected yet', 'Add your Card Scan address, email and password in Settings.') + '</div>';
      return head + fail(C, 'your cards') + '</div>';
    }
    var chips = '<button class="chip" data-ia="cgrp" data-g="" aria-pressed="' + !C.group + '">All</button>' + (d.groups || []).map(function (g) { return '<button class="chip" data-ia="cgrp" data-g="' + esc(g.id) + '" aria-pressed="' + (C.group === g.id) + '">' + esc(g.name) + '</button>'; }).join('');
    var tiles = C.cards.map(function (c) {
      var title = c.name || c.company || 'Unnamed';
      var sel = window.AOSCards && C.selecting; return '<div class="icardw' + (sel && C.sel[c.id] ? ' sel' : '') + '">' + (sel ? '<input type="checkbox" class="icsel" data-ca="selone" data-id="' + esc(c.id) + '"' + (C.sel[c.id] ? ' checked' : '') + ' aria-label="Select ' + esc(title) + '">' : '') + '<button class="card icard" data-ia="' + (sel ? 'csel' : 'copen') + '" data-id="' + esc(c.id) + '"><div class="icard-img">' + (c.image_thumb ? '<img src="' + esc(c.image_thumb) + '" alt="" loading="lazy">' : '<span>' + esc(title.charAt(0).toUpperCase()) + '</span>') + '</div><div class="icard-t"><b>' + esc(title) + '</b>' + (c.name && c.company ? '<span>' + esc(c.company) + '</span>' : '') + (c.designation ? '<span class="note">' + esc(c.designation) + '</span>' : '') + '<span class="note mono">' + esc(c.phone || c.email || '') + '</span>' + (c.group_name ? '<em class="tag" style="font-style:normal;align-self:flex-start">' + esc(c.group_name) + '</em>' : '') + '</div></button></div>';
    }).join('');
    return head + '<div class="toolbar"><div class="search">' + ic('search') + '<input class="input" id="cq" type="search" placeholder="Search name, company, phone, email" value="' + esc(C.q) + '" data-ii="cq" aria-label="Search cards"></div><div class="chips">' + chips + '</div></div>' +
      (C.error ? fail(C, 'cards') : '') + (window.AOSCards ? window.AOSCards.bulkBar() : '') +
      (C.cards.length ? '<div class="icards">' + tiles + '</div>' : '<div class="empty"><h2>' + (C.q || C.group ? 'No cards match' : 'No cards yet') + '</h2><p>' + (C.q || C.group ? 'Try another search or group.' : 'Scan cards in Card Scan and they appear here.') + '</p></div>') +
      (C.cards.length < d.total ? '<div style="text-align:center;margin:18px 0"><button class="btn" data-ia="cmore">' + (C.loading ? 'Loading...' : 'Show more (' + (d.total - C.cards.length) + ' left)') + '</button></div>' : '') + '</div>';
  }
  function cardModal(c, mode, side) {
    var C = I.cards; C.open = { card: c, mode: mode, side: side || 'front', confirm: false };
    var img = C.open.side === 'back' ? c.image_back : c.image;
    var imgBox = (c.image || c.image_back || c.image_thumb) ? '<div class="icard-big">' + ((img || c.image_thumb) ? '<img src="' + esc(img || c.image_thumb) + '" alt="Card ' + C.open.side + '">' : '') + ((c.image && c.image_back) ? '<button class="btn sm" data-ia="cflip">Show ' + (C.open.side === 'back' ? 'front' : 'back') + '</button>' : '') + '</div>' : '';
    var body;
    if (mode === 'edit') {
      body = '<div class="icform">' + FIELDS.map(function (f) { return '<div class="field"><label for="cf_' + f[0] + '">' + f[1] + '</label><input class="input" id="cf_' + f[0] + '" value="' + esc(c[f[0]] || '') + '" autocomplete="off"></div>'; }).join('') + '</div>' +
        '<div class="field"><label for="cf_group">Group</label><select class="input" id="cf_group">' + ((C.data && C.data.groups) || []).map(function (g) { return '<option value="' + esc(g.id) + '"' + (g.id === c.group_id ? ' selected' : '') + '>' + esc(g.name) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="cf_tags">Tags (comma separated)</label><input class="input" id="cf_tags" value="' + esc((c.tags || []).join(', ')) + '" autocomplete="off"></div>' +
        '<div class="field"><label for="cf_notes">Notes</label><textarea class="input" id="cf_notes" rows="4">' + esc(c.notes || '') + '</textarea></div><div id="cm" class="note" role="status"></div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap"><button class="btn" data-ia="cview">Cancel</button><button class="btn primary" data-ia="csave">Save changes</button></div>';
    } else {
      var rows = [];
      [['phone', 'Phone', 'tel:'], ['phone2', 'Phone 2', 'tel:'], ['phone3', 'Phone 3', 'tel:'], ['whatsapp', 'WhatsApp', 'https://wa.me/'], ['email', 'Email', 'mailto:'], ['email2', 'Email 2', 'mailto:'], ['email3', 'Email 3', 'mailto:']].forEach(function (f) { if (c[f[0]]) rows.push('<span>' + f[1] + '</span><b>' + link(f[2] + (f[2].indexOf('wa.me') > 0 ? String(c[f[0]]).replace(/[^\d]/g, '') : c[f[0]]), c[f[0]]) + '</b>'); });
      if (c.website) { var w = /^https?:\/\//i.test(c.website) ? c.website : 'https://' + c.website; rows.push('<span>Website</span><b>' + link(w, c.website) + '</b>'); }
      if (c.address) rows.push('<span>Address</span><b>' + esc(c.address) + '</b>');
      if (c.group_name) rows.push('<span>Group</span><b>' + esc(c.group_name) + '</b>');
      if ((c.tags || []).length) rows.push('<span>Tags</span><b>' + c.tags.map(esc).join(', ') + '</b>');
      rows.push('<span>Added</span><b>' + (c.created_at ? A.fmt(new Date(c.created_at), { day: 'numeric', month: 'short', year: 'numeric' }) : '') + (c.added_by_name ? ' by ' + esc(c.added_by_name) : '') + '</b>');
      rows.push('<span>Last contacted</span><b>' + (c.last_contacted_at ? ago(c.last_contacted_at) : 'Not yet') + '</b>');
      body = '<div class="ikv">' + rows.join('') + '</div>' + (c.notes ? '<h3 class="ih">Notes</h3><p style="white-space:pre-wrap;margin:0 0 6px">' + esc(c.notes) + '</p>' : '') + '<div id="cm" class="note" role="status"></div>' +
        (C.open.confirm ? '' : '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px">' + (window.AOSCards ? '<button class="btn" data-ca="notes">Notes</button><button class="btn" data-ca="remind">Remind me</button><button class="btn" data-ca="share">Share</button>' : '') + '<button class="btn danger" data-ia="cdelask">Delete</button><button class="btn" data-ia="ccont">Mark contacted</button><button class="btn primary" data-ia="cedit">Edit</button></div>');
    }
    modal('<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:12px"><div><h2 style="font-size:22px">' + esc(c.name || c.company || 'Card') + '</h2>' + (c.name && c.company ? '<div class="note">' + esc((c.designation ? c.designation + ', ' : '') + c.company) + '</div>' : '') + '</div><button class="btn sm" data-act="mx2">Close</button></div>' + imgBox + body);
    var box = $('#modal .card'); if (box) box.style.width = 'min(680px,100%)';
  }
  function openCard(id) {
    var C = I.cards, t = C.cards.filter(function (x) { return x.id === id; })[0] || { id: id }; cardModal(t, 'view');
    api('/api/cards/' + id).then(function (d) { if (C.open && C.open.card.id === id && !$('#modal').hidden) cardModal(Object.assign({}, t, d.card), C.open.mode, C.open.side); }).catch(function (e) { var m = $('#cm'); if (m) { m.style.color = 'var(--bad)'; m.textContent = e.message; } });
  }
  function C0() { return I.cards; }
  function patchList(card) { var C = I.cards; C.cards = C.cards.map(function (x) { return x.id === card.id ? Object.assign({}, x, card) : x; }); }
  function cardAct(a, el) {
    var C = I.cards, o = C.open, m = function (t, bad) { var n = $('#cm'); if (n) { n.style.color = bad ? 'var(--bad)' : 'var(--muted)'; n.textContent = t; } };
    if (a === 'cflip') return cardModal(o.card, o.mode, o.side === 'back' ? 'front' : 'back');
    if (a === 'cedit') return cardModal(o.card, 'edit', o.side);
    if (a === 'cview') return cardModal(o.card, 'view', o.side);
    if (a === 'ccont') { m('Saving...'); return api('/api/cards/' + o.card.id, { method: 'PATCH', json: { markContacted: true } }).then(function (d) { var c = Object.assign({}, o.card, d.card); patchList(c); cardModal(c, 'view', o.side); toast('Marked as contacted'); }).catch(function (e) { m(e.message, true); }); }
    if (a === 'csave') {
      var body = {}; FIELDS.forEach(function (f) { body[f[0]] = $('#cf_' + f[0]).value; }); body.notes = $('#cf_notes').value; body.tags = $('#cf_tags').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean); var g = $('#cf_group'); if (g && g.value && g.value !== o.card.group_id) body.groupId = g.value;
      if (!body.name.trim() && !body.company.trim()) return m('Add at least a name or a company.', true);
      m('Saving...'); return api('/api/cards/' + o.card.id, { method: 'PATCH', json: body }).then(function (d) { var c = Object.assign({}, o.card, d.card); patchList(c); cardModal(c, 'view', o.side); toast('Card saved'); A.redraw(); }).catch(function (e) { m(e.message, true); });
    }
    if (a === 'cdelask') { o.confirm = true; var box = document.createElement('div'); box.innerHTML = '<div class="banner" style="margin-top:14px"><i class="dot bad"></i><span>Delete this card for good? It is removed from Card Scan too.</span></div><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px"><button class="btn" data-ia="cview">Keep it</button><button class="btn danger" data-ia="cdelyes">Delete card</button></div>'; var cm = $('#cm'); if (cm) cm.parentNode.insertBefore(box, cm.nextSibling); var bs = document.querySelector('#modal [data-ia="cdelask"]'); if (bs) bs.parentNode.style.display = 'none'; return; }
    if (a === 'cdelyes') { m('Deleting...'); return api('/api/cards/' + o.card.id, { method: 'DELETE' }).then(function () { I.cards.cards = I.cards.cards.filter(function (x) { return x.id !== o.card.id; }); if (I.cards.data) { I.cards.data.total = Math.max(0, I.cards.data.total - 1); if (I.cards.data.stats) I.cards.data.stats.total = Math.max(0, I.cards.data.stats.total - 1); } modal(); toast('Card deleted'); A.redraw(); }).catch(function (e) { m(e.message, true); }); }
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-ia]'); if (!el) return; var a = el.getAttribute('data-ia'), id = el.getAttribute('data-id');
    if (a === 'stref') return void load('st', '/api/status?refresh=1');
    if (a === 'srv') return void (window.AOSSrv ? window.AOSSrv.open(id) : srvModal(id));
    if (a === 'vpref') return void load('vpn', '/api/vpn');
    if (a === 'vpnew') return void vNew();
    if (a === 'vqr') return void vQr(id); if (a === 'vren') return void vRen(id); if (a === 'vdel') return void vDel(id);
    if (a === 'vcreate') { var n = $('#vn').value.trim(), e = $('#ve').value; if (!n) { $('#vm').textContent = 'Give the device a name.'; return; } $('#vm').textContent = 'Adding...'; return void api('/api/vpn', { method: 'POST', json: { name: n, expiresAt: e } }).then(function (r) { return load('vpn', '/api/vpn').then(function () { modal(); toast('Device added'); if (r.id != null && vClient(r.id)) vQr(r.id); }); }).catch(function (x) { $('#vm').style.color = 'var(--bad)'; $('#vm').textContent = x.message; }); }
    if (a === 'vrensave') { var nn = $('#vn').value.trim(); if (!nn) { $('#vm').textContent = 'Give the device a name.'; return; } $('#vm').textContent = 'Saving...'; return void api('/api/vpn/' + id, { method: 'PUT', json: { name: nn } }).then(function () { return load('vpn', '/api/vpn'); }).then(function () { modal(); toast('Renamed'); }).catch(function (x) { $('#vm').style.color = 'var(--bad)'; $('#vm').textContent = x.message; }); }
    if (a === 'vtog') { var c = vClient(id); if (!c) return; return void api('/api/vpn/' + id + '/' + (c.enabled ? 'disable' : 'enable'), { method: 'POST', json: {} }).then(function () { toast(c.name + (c.enabled ? ' turned off' : ' turned on')); return load('vpn', '/api/vpn'); }).catch(vErr); }
    if (a === 'vdelyes') return void api('/api/vpn/' + id, { method: 'DELETE' }).then(function () { modal(); toast('Device deleted'); return load('vpn', '/api/vpn'); }).catch(function (x) { modal(); vErr(x); });
    if (a === 'cgrp') { I.cards.group = el.getAttribute('data-g') || ''; return void loadCards(); }
    if (a === 'cmore') return void loadCards(true);
    if (a === 'copen') return void openCard(id);
    if (a === 'csel') { C0().sel[id] = !C0().sel[id]; return void A.redraw(); }
    if (/^c(flip|edit|view|cont|save|delask|delyes)$/.test(a) && I.cards.open) return void cardAct(a, el);
  });
  document.addEventListener('input', function (ev) { var t = ev.target; if (t.getAttribute && t.getAttribute('data-ii') === 'cq') { I.cards.q = t.value; clearTimeout(qt); qt = setTimeout(function () { loadCards(); }, 280); } });

  /* ---------- hooks used by os.js ---------- */
  function onGo(v) {
    if (v === 'insights') { if (!I.st.data && !I.st.loading) load('st', '/api/status'); else if (Date.now() - ((I.st.data && Date.parse(I.st.data.takenAt)) || 0) > 20000 && !I.st.loading) load('st', '/api/status'); }
    if (v === 'vpn' && !I.vpn.loading) load('vpn', '/api/vpn');
    if (v === 'cards' && !I.cards.loading) loadCards();
    if (v === 'cards' && window.AOSCards) window.AOSCards.onGo(v);
  }
  function settingsCards(field) {
    var c = S.settings || {}; var g = function (k) { return c[k] || {}; };
    var card = function (k, title, help, urlPh, userLabel, userPh, passPh) {
      var s = g(k);
      return '<div class="card"><h2 style="font-size:20px;margin-bottom:6px">' + title + '</h2><p class="note" style="margin:0 0 14px">' + help + '</p>' + field('s_' + k + 'u', 'Address', s.url, urlPh) + field('s_' + k + 'n', userLabel, s.user, userPh) + field('s_' + k + 'p', 'Password' + (s.passSet ? ' (saved, leave blank to keep)' : ''), '', s.passSet ? '••••••••' : passPh, 'password') + '<div id="r_' + k + '" class="note" role="status"></div><button class="btn primary" data-act="save" data-k="' + k + '">Save and test</button></div>';
    };
    return card('status', 'Status (Beszel, in Insights)', 'Shows CPU, memory, disk, containers and alerts for each server. Create a read-only user in Beszel for this.', 'https://status.anands.xyz', 'Email', 'viewer@example.com', 'Beszel user password') +
      card('vpn', 'VPN (wg-easy)', 'Lists devices and lets you add, switch off and delete them. Use a wg-easy user without two-factor sign-in.', 'https://vpn.anands.xyz', 'Username', 'admin', 'wg-easy password') +
      '<div class="card"><h2 style="font-size:20px;margin-bottom:6px">Pulse (Anands Control Center)</h2><p class="note" style="margin:0 0 14px">Shows your Pulse data here and lets the assistant read it. In Pulse open Settings, Automation, Access for your AI tools, and create a read-only token.</p>' + field('s_pulseu', 'Address', g('pulse').url, 'https://control.anands.xyz') + field('s_pulset', 'Access token' + (g('pulse').tokenSet ? ' (saved, leave blank to keep)' : ''), '', g('pulse').tokenSet ? '••••••••' : 'pulse_…', 'password') + '<div id="r_pulse" class="note" role="status"></div><button class="btn primary" data-act="save" data-k="pulse">Save and test</button></div>' +
      card('cards', 'Cards (Card Scan)', 'Browse, edit and delete scanned business cards. Sign in with the email and password you use in Card Scan.', 'https://cards.anands.xyz', 'Email', 'you@example.com', 'Card Scan password');
  }
  function reset(k) { if (k === 'status') I.st = { data: null, loading: false, error: null, code: null }; if (k === 'vpn') I.vpn = { data: null, loading: false, error: null, code: null }; if (k === 'cards') { var q = I.cards; I.cards = { data: null, loading: false, error: null, code: null, q: q.q, group: '', cards: [], offset: 0, open: null }; } }
  function after(k, r) { reset(k); if (r && r.connected) { if (k === 'status') load('st', '/api/status?refresh=1'); if (k === 'vpn') load('vpn', '/api/vpn'); if (k === 'cards') loadCards(); } }
  /* quiet refresh of the servers while Insights stays open */
  timer = setInterval(function () { if (S.view === 'insights' && !document.hidden && I.st.data && !I.st.loading && $('#modal').hidden) load('st', '/api/status', null, true); }, 30000);

  window.AOSInt = { servers: servers, vpnView: vpnView, cardsView: cardsView, onGo: onGo, settingsCards: settingsCards, after: after, state: I, loadCards: function () { return loadCards(); }, reopen: function (id) { openCard(id); }, FIELDS: FIELDS };
})();
