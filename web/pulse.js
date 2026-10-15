/* Anands Pulse inside the OS: today, chats, tasks, waiting, tracked, lists, health, search, and the full Pulse app in a frame.
 * Read-only: this page only calls GET /api/pulse/*. The token stays on the server. */
(function () {
  'use strict';
  var A = window.AOS; if (!A) return;
  var S = A.S, $ = A.$, esc = A.esc, api = A.api, ic = A.ic;
  var TABS = [['today', 'Today'], ['chats', 'Chats'], ['tasks', 'Tasks'], ['waiting', 'Waiting'], ['tracked', 'Tracked'], ['lists', 'Lists'], ['search', 'Search'], ['health', 'Health'], ['app', 'Full app']];
  var I = { tab: 'today', d: {}, busy: {}, err: {}, chat: null, msgs: null, tr: null, trd: null, q: '', sq: '', res: null, tstatus: 'open', all: false };

  function ago(iso) { if (!iso) return ''; var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000); if (isNaN(s)) return ''; if (s < 60) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' d ago'; }
  function url() { return ((S.settings || {}).pulse || {}).url || ''; }
  function pick(o, ks) { for (var i = 0; i < ks.length; i++) if (o[ks[i]] != null && o[ks[i]] !== '') return o[ks[i]]; return ''; }
  function title(o) { return typeof o === 'string' ? o : String(pick(o, ['title', 'what', 'name', 'subject', 'text', 'summary', 'where', 'label', 'id'])); }
  function metaOf(o) {
    if (typeof o !== 'object') return '';
    var parts = [], f = pick(o, ['from', 'who', 'owner', 'chat', 'source']); if (f) parts.push(esc(f));
    var d = pick(o, ['due', 'due_date', 'at', 'when', 'date']); if (d) parts.push(esc(/^\d{4}-\d\d-\d\dT/.test(d) ? ago(d) : d));
    if (o.asked_hours_ago != null) parts.push('asked ' + (o.asked_hours_ago >= 24 ? Math.round(o.asked_hours_ago / 24) + ' d' : o.asked_hours_ago + ' h') + ' ago');
    if (o.mentions != null) parts.push(o.mentions + ' mentions'); if (o.kind) parts.push(esc(o.kind));
    return parts.join(' · ');
  }
  function pills(o) {
    if (typeof o !== 'object') return ''; var h = '';
    if (o.overdue) h += '<span class="pill bad">Overdue</span>'; if (o.urgent && o.urgent !== true) h += '<span class="pill bad">' + esc(o.urgent) + ' urgent</span>'; if (o.urgent === true) h += '<span class="pill bad">Urgent</span>';
    if (o.priority && o.priority !== 'normal') h += '<span class="pill ' + (o.priority === 'high' || o.priority === 'urgent' ? 'bad' : '') + '">' + esc(o.priority) + '</span>';
    if (o.unread) h += '<span class="pill warn">' + esc(o.unread) + ' unread</span>'; if (o.asks) h += '<span class="pill">' + esc(o.asks) + ' asks</span>'; if (o.status && o.status !== 'open') h += '<span class="pill">' + esc(o.status) + '</span>';
    return h;
  }
  function rows(list, attr) {
    return '<div class="card" style="padding:4px 16px">' + list.map(function (o, i) {
      var key = typeof o === 'object' ? (o.chat_id || o.key || o.id || '') : '';
      var inner = '<div style="min-width:0;flex:1"><b style="overflow-wrap:anywhere">' + esc(title(o)) + '</b><div class="note">' + metaOf(o) + '</div></div><div class="iacts" style="justify-content:flex-end">' + pills(o) + '</div>';
      return attr && key ? '<button class="prow" data-pa="' + attr + '" data-id="' + esc(key) + '">' + inner + '</button>' : '<div class="prow">' + inner + '</div>';
    }).join('') + '</div>';
  }
  function section(h, list, attr, empty) { return '<h2 style="font-size:19px;margin:22px 0 10px">' + h + (list && list.length ? ' <span class="note" style="font-size:14px">' + list.length + '</span>' : '') + '</h2>' + (list && list.length ? rows(list, attr) : '<p class="note">' + (empty || 'Nothing here.') + '</p>'); }
  function arrOf(d, ks) { if (Array.isArray(d)) return d; for (var i = 0; i < ks.length; i++) if (d && Array.isArray(d[ks[i]])) return d[ks[i]]; return []; }

  function get(key, path, set, force) {
    I.busy[key] = true; if (S.view === 'pulse') A.redraw();
    return api('/api/pulse' + path).then(function (d) { set(d); I.err[key] = null; }).catch(function (e) { I.err[key] = e.code === 'not_configured' ? 'not_configured' : e.message; }).then(function () { I.busy[key] = false; if (S.view === 'pulse' && !(document.activeElement && /INPUT/.test(document.activeElement.tagName) && document.activeElement.hasAttribute('data-pin'))) A.redraw(); });
  }
  function load(tab, force) {
    if (tab === 'today') return get('today', '/today', function (d) { I.d.today = d; });
    if (tab === 'chats') return get('chats', '/chats?limit=50' + (I.all ? '&all=1' : ''), function (d) { I.d.chats = d; });
    if (tab === 'tasks') return get('tasks', '/tasks?status=' + I.tstatus, function (d) { I.d.tasks = d; });
    if (tab === 'waiting') return get('waiting', '/waiting', function (d) { I.d.waiting = d; });
    if (tab === 'tracked') return get('tracked', '/tracked?q=' + encodeURIComponent(I.q), function (d) { I.d.tracked = d; });
    if (tab === 'lists') return get('lists', '/lists', function (d) { I.d.lists = d; });
    if (tab === 'health') return get('health', '/health', function (d) { I.d.health = d; });
  }
  function onGo(v) { if (v !== 'pulse') return; if (I.tab !== 'search' && I.tab !== 'app' && !I.d[I.tab] && !I.busy[I.tab]) load(I.tab); }

  function head(sub) {
    var u = url();
    return '<div class="wrap"><div class="pagehead"><div><h1>Pulse</h1><p>' + (sub || 'Your mail, chats, tasks and what you are waiting on, from Anands Pulse. Read-only here. Ask the assistant about any of it.') + '</p></div><div style="display:flex;gap:10px">' + (I.tab !== 'app' ? '<button class="btn" data-pa="refresh">Refresh</button>' : '') + (u ? '<a class="btn" href="' + esc(u) + '" target="_blank" rel="noopener">Open Pulse ' + ic('ext') + '</a>' : '') + '</div></div>' +
      '<div class="toolbar"><div class="seg" role="tablist">' + TABS.map(function (t) { return '<button data-pa="tab" data-t="' + t[0] + '" aria-pressed="' + (I.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div></div>';
  }
  function fail(key) { var e = I.err[key]; return e ? '<div class="banner"><i class="dot bad"></i><span>' + esc(e) + '</span><button class="btn sm" data-pa="refresh">Try again</button></div>' : ''; }
  function notConnected() { return '<div class="wrap"><div class="pagehead"><div><h1>Pulse</h1><p>Anands Pulse is not connected yet.</p></div></div><div class="banner"><i class="dot warn"></i><span>Add your Pulse address and a read-only token in Settings. Create the token in Pulse: Settings, Automation, Access for your AI tools.</span><button class="btn primary" data-act="nav" data-v="settings">Open Settings</button></div></div>'; }

  function view() {
    if (Object.keys(I.err).some(function (k) { return I.err[k] === 'not_configured'; })) return notConnected();
    var h = head(), t = I.tab, d = I.d;
    if (t === 'app') {
      var u = url(); if (!u) return notConnected();
      return h + '<div class="card" style="padding:0;overflow:hidden"><iframe src="' + esc(u) + '" title="Anands Pulse" style="width:100%;height:calc(100vh - 290px);min-height:480px;border:0;display:block;background:var(--bg)" allow="clipboard-write"></iframe></div><p class="note" style="margin-top:10px">If this stays blank your Pulse server refuses to be shown inside other sites. Use Open Pulse above, or allow this address in Pulse (FRAME_ANCESTORS).</p></div>';
    }
    h += fail(t);
    if (t === 'today') {
      var x = d.today; if (!x) return h + '<p class="note">Loading today...</p></div>';
      var kp = '<div class="kpis"><div class="card kpi"><div class="stat"><span class="n">' + (x.unread_items != null ? x.unread_items : 0) + '</span><span class="l">unread items</span></div></div>' +
        (x.urgent ? '<div class="card kpi"><div class="stat"><span class="n" style="color:var(--bad)">' + x.urgent.length + '</span><span class="l">urgent</span></div></div>' : '') +
        (x.overdue_tasks ? '<div class="card kpi"><div class="stat"><span class="n">' + x.overdue_tasks.length + '</span><span class="l">overdue tasks</span></div></div>' : '') +
        (x.meetings ? '<div class="card kpi"><div class="stat"><span class="n">' + x.meetings.length + '</span><span class="l">meetings</span></div></div>' : '') + '</div>';
      var secs = '', known = { date: 1, unread_items: 1 };
      Object.keys(x).forEach(function (k) { if (known[k] || !Array.isArray(x[k])) return; secs += section(esc(k.replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); })), x[k], '', 'Nothing here.'); });
      return h + kp + (x.date ? '<p class="note">' + esc(x.date) + '</p>' : '') + secs + '</div>';
    }
    if (t === 'chats') {
      var chats = arrOf(d.chats, ['chats']);
      if (I.chat) {
        var m = I.msgs, c0 = chats.filter(function (c) { return String(c.chat_id) === String(I.chat); })[0] || {};
        return h + '<div class="winbar"><button class="btn sm" data-pa="chatback">' + ic('back') + ' All chats</button><b>' + esc((m && m.chat) || c0.name || 'Chat') + '</b>' + (m && m.members ? '<span class="note">' + m.members + ' members</span>' : '') + '</div>' + (I.err.msgs ? '<div class="banner"><i class="dot bad"></i><span>' + esc(I.err.msgs) + '</span></div>' : '') +
          (m ? '<div class="card pmsgs">' + (arrOf(m, ['messages']).slice().reverse().length ? arrOf(m, ['messages']).map(function (g) { return '<div class="pmsg"><div class="note"><b style="color:var(--fg)">' + esc(g.from || g.who || '') + '</b> · ' + esc(ago(g.at)) + '</div><div>' + esc(g.text || '') + '</div></div>'; }).join('') : '<p class="note">No messages.</p>') + '</div>' : '<p class="note">Loading messages...</p>') + '</div>';
      }
      return h + '<div class="toolbar"><label class="note" style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-pa="all"' + (I.all ? ' checked' : '') + '> Include quiet chats</label></div>' + (d.chats ? (chats.length ? rows(chats, 'chat') : '<div class="empty"><h2>No chats</h2></div>') : '<p class="note">Loading chats...</p>') + '</div>';
    }
    if (t === 'tasks') {
      var ts = arrOf(d.tasks, ['tasks']);
      return h + '<div class="toolbar"><div class="chips">' + ['open', 'done', 'all'].map(function (s) { return '<button class="chip" data-pa="tstatus" data-s="' + s + '" aria-pressed="' + (I.tstatus === s) + '">' + s.charAt(0).toUpperCase() + s.slice(1) + '</button>'; }).join('') + '</div></div>' + (d.tasks ? (ts.length ? rows(ts) : '<div class="empty"><h2>No tasks</h2></div>') : '<p class="note">Loading tasks...</p>') + '</div>';
    }
    if (t === 'waiting') { var w = arrOf(d.waiting, ['waiting', 'items']); return h + (d.waiting ? (w.length ? rows(w) : '<div class="empty"><h2>Nobody owes you anything</h2></div>') : '<p class="note">Loading...</p>') + '</div>'; }
    if (t === 'tracked') {
      if (I.tr) {
        var td = I.trd; return h + '<div class="winbar"><button class="btn sm" data-pa="trback">' + ic('back') + ' All tracked</button><b>' + esc((td && td.name) || I.tr) + '</b></div>' + (I.err.trd ? '<div class="banner"><i class="dot bad"></i><span>' + esc(I.err.trd) + '</span></div>' : '') +
          (td ? '<div class="card" style="padding:4px 16px">' + (arrOf(td, ['timeline']).map(function (e) { return '<div class="prow"><div style="flex:1"><b>' + esc(e.who || e.from || '') + '</b> <span class="note">' + esc(ago(e.at)) + '</span><div>' + esc(e.text || e.what || '') + '</div></div></div>'; }).join('') || '<p class="note">No timeline yet.</p>') + '</div>' : '<p class="note">Loading...</p>') + '</div>';
      }
      var tr = arrOf(d.tracked, ['items']);
      return h + '<div class="toolbar"><div class="search">' + ic('search') + '<input class="input" data-pin="q" type="search" placeholder="Plate, name, number" value="' + esc(I.q) + '" aria-label="Search tracked"></div></div>' + (d.tracked ? (tr.length ? rows(tr, 'tracked') : '<div class="empty"><h2>Nothing tracked</h2></div>') : '<p class="note">Loading...</p>') + '</div>';
    }
    if (t === 'lists') { var ls = arrOf(d.lists, ['lists']); return h + (d.lists ? (ls.length ? rows(ls) : '<div class="empty"><h2>No lists</h2></div>') : '<p class="note">Loading...</p>') + '</div>'; }
    if (t === 'health') {
      var hh = d.health; if (!hh) return h + '<p class="note">Loading...</p></div>';
      var pr = arrOf(hh, ['problems']);
      return h + '<div class="card"><div class="pill ' + (hh.ok === false || pr.length ? 'bad' : 'ok') + '"><i class="dot ' + (hh.ok === false || pr.length ? 'bad' : '') + '"></i>' + (hh.ok === false || pr.length ? 'Needs attention' : 'Everything works') + '</div></div>' + (pr.length ? section('Problems', pr) : '') + '</div>';
    }
    if (t === 'search') {
      var rs = I.res ? arrOf(I.res, ['results']) : null;
      return h + '<div class="toolbar"><form data-pa="dosearch" style="display:flex;gap:10px;flex:1"><div class="search" style="flex:1">' + ic('search') + '<input class="input" data-pin="sq" type="search" placeholder="Search mail, chats and tasks, e.g. invoices from last week" value="' + esc(I.sq) + '" aria-label="Search Pulse"></div><button class="btn primary">Search</button></form></div>' +
        (I.busy.search ? '<p class="note">Searching...</p>' : '') + (I.err.search ? '<div class="banner"><i class="dot bad"></i><span>' + esc(I.err.search) + '</span></div>' : '') + (rs ? (rs.length ? rows(rs.map(function (r) { return { title: r.where || r.text || r.from || r.id, from: (r.source ? r.source + ': ' : '') + (r.from || ''), at: r.at }; })) : '<div class="empty"><h2>No results</h2></div>') : '') + '</div>';
    }
    return h + '</div>';
  }

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-pa]'); if (!el || el.tagName === 'FORM' || el.tagName === 'INPUT') return;
    var a = el.getAttribute('data-pa'), id = el.getAttribute('data-id');
    if (a === 'tab') { I.tab = el.getAttribute('data-t'); I.chat = null; I.tr = null; A.redraw(); return void (!I.d[I.tab] && load(I.tab)); }
    if (a === 'refresh') return void (I.chat ? openChat(I.chat) : load(I.tab, true));
    if (a === 'tstatus') { I.tstatus = el.getAttribute('data-s'); return void load('tasks'); }
    if (a === 'chat') return void openChat(id);
    if (a === 'chatback') { I.chat = null; I.msgs = null; return void A.redraw(); }
    if (a === 'tracked') { I.tr = id; I.trd = null; A.redraw(); return void get('trd', '/tracked/' + encodeURIComponent(id), function (d) { I.trd = d; }); }
    if (a === 'trback') { I.tr = null; return void A.redraw(); }
  });
  function openChat(id) { I.chat = id; I.msgs = null; A.redraw(); return get('msgs', '/chats/' + encodeURIComponent(id) + '/messages', function (d) { I.msgs = d; }); }
  document.addEventListener('change', function (ev) { if (ev.target.getAttribute && ev.target.getAttribute('data-pa') === 'all') { I.all = ev.target.checked; load('chats'); } });
  var qt = null;
  document.addEventListener('input', function (ev) { var k = ev.target.getAttribute && ev.target.getAttribute('data-pin'); if (!k) return; I[k] = ev.target.value; if (k === 'q') { clearTimeout(qt); qt = setTimeout(function () { load('tracked'); }, 350); } });
  document.addEventListener('submit', function (ev) {
    if (!ev.target.getAttribute || ev.target.getAttribute('data-pa') !== 'dosearch') return; ev.preventDefault(); if (!I.sq.trim()) return;
    I.res = null; get('search', '/search?q=' + encodeURIComponent(I.sq), function (d) { I.res = d; });
  });
  setInterval(function () { if (S.view === 'pulse' && !document.hidden && !I.chat && !I.tr && ['today', 'chats', 'waiting'].indexOf(I.tab) >= 0) { var tab = I.tab, key = tab; api('/api/pulse/' + (tab === 'chats' ? 'chats' : tab)).then(function (d) { I.d[tab] = d; if (S.view === 'pulse' && I.tab === tab && !I.chat) A.redraw(); }).catch(function () {}); } }, 60000);

  window.AOSPulse = { view: view, onGo: onGo, state: I };
})();
