/* Full Anands Pulse inside the OS: Today, a Gmail-style inbox (mail and WhatsApp), WhatsApp chats, tasks, calendar, waiting, tracked, lists, notes and sources,
 * with the Personal / Work switch. Signs in to Pulse with your Pulse email and password on the server (Settings). Only fixed Pulse routes are reachable. */
(function () {
  'use strict';
  var A = window.AOS; if (!A) return;
  var S = A.S, $ = A.$, esc = A.esc, api = A.api, toast = A.toast, ic = A.ic;
  var P = { boot: null, loading: false, err: null, code: null, view: A.LS.get('pxview', 'today'), filter: 'all', ch: '', q: '', sres: null, sel: null, item: null, itemBusy: false, reading: false, chat: null, imgs: {}, week: 0, tdone: false, adding: false,
    ents: null, entq: '', entSel: null, entD: null, waits: null, lists: null, chatq: '', more: false, olderBusy: false, note: null };
  var VIEWS = [['today', 'Today'], ['inbox', 'Inbox'], ['chats', 'WhatsApp'], ['tasks', 'Tasks'], ['calendar', 'Calendar'], ['waiting', 'Waiting'], ['tracked', 'Tracked'], ['lists', 'Lists'], ['notes', 'Notes'], ['sources', 'Sources']];
  function s(path, o) { return api('/api/pulse/s' + path, o); }
  function on() { var c = (S.settings || {}).pulse; return !!(c && c.url && c.user && c.passSet); }
  function work() { return !!(P.boot && P.boot.settings && P.boot.settings.mode === 'work'); }
  function names() { return (P.boot && P.boot.settings && P.boot.settings.names) || {}; }
  function chName(c) { var n = names()[c]; return n || ({ EO: 'Office mail', EP: 'Personal mail', WA: 'WhatsApp', WB: 'WhatsApp 2', WS: 'WhatsApp send' }[c] || c); }
  function today() { return (P.boot && P.boot.now && P.boot.now.today) || ''; }
  function tfmt(ts) {
    if (!ts) return ''; var d = String(ts).slice(0, 10), t = String(ts).slice(11, 16);
    if (d === today()) return t || 'Today'; var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(d); return m ? m[3] + '/' + m[2] + '/' + m[1] : String(ts);
  }
  function dfull(d) { var m = /^(\d{4})-(\d\d)-(\d\d)/.exec(String(d || '')); return m ? m[3] + '/' + m[2] + '/' + m[1] : String(d || ''); }
  function linkify(t) { return esc(t).replace(/(https?:\/\/[^\s<]+)/g, function (u) { return '<a href="' + u + '" target="_blank" rel="noopener">' + u + '</a>'; }); }
  function hue(n) { var h = 0; String(n || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 360; }); return h; }
  function items() { return (P.boot && P.boot.items) || []; }
  function find(ref) { return items().filter(function (i) { return i.id === ref; })[0]; }
  function isMail(i) { return i && i.id[0] === 'e'; }
  function redraw() { if (S.view === 'pulse') A.redraw(); }

  /* ---------- loading ---------- */
  function load(quiet) {
    if (P.loading) return Promise.resolve(); P.loading = true; if (!quiet) P.err = null; if (!quiet && !P.boot) redraw();
    return s('/bootstrap').then(function (b) { var keep = P.boot; P.boot = b; P.err = null; P.code = null; P.more = !!b.itemsMore; if (quiet && keep && S.view === 'pulse' && P.view === 'inbox' && $('#pxl')) { pl(); } else if (!quiet || !keep) redraw(); else if (S.view === 'pulse' && P.view === 'today') redraw(); })
      .catch(function (e) { P.err = e.message; P.code = e.code; if (!quiet || !P.boot) redraw(); }).then(function () { P.loading = false; });
  }
  function onGo(v) { if (v !== 'pulse' || !on()) return; if (!P.boot) load(); else load(true); loadView(); }
  function loadView() {
    if (P.view === 'waiting' && !P.waits) s('/waits').then(function (d) { P.waits = d; redraw(); }).catch(function () { P.waits = []; redraw(); });
    if (P.view === 'lists' && !P.lists) s('/lists').then(function (d) { P.lists = d; redraw(); }).catch(function () { P.lists = []; redraw(); });
    if (P.view === 'tracked' && !P.ents) loadEnts();
  }
  function loadEnts() { P.ents = null; return s('/entities?q=' + encodeURIComponent(P.entq)).then(function (d) { P.ents = d; }).catch(function (e) { P.ents = { error: e.message }; }).then(redraw); }
  setInterval(function () { if (S.view === 'pulse' && !document.hidden && on() && P.boot) load(true); }, 60000);

  /* ---------- shell ---------- */
  function setView(v) { P.view = v; P.sel = null; P.selX = null; P.item = null; A.LS.set('pxview', v); P.reading = false; redraw(); loadView(); }
  var VIC = { today: 'pulse', inbox: 'mail', chats: 'chat', tasks: 'check', calendar: 'cal', waiting: 'hourglass', tracked: 'truck', lists: 'list', notes: 'doc', sources: 'apps' };
  function side() {
    var m = P.boot && P.boot.settings && P.boot.settings.mode === 'work' ? 'work' : 'personal';
    var unread = items().filter(function (i) { return !i.read && i.cls !== 'noise' && !i.handled; }).length;
    return '<aside class="pxside"><div class="pxbrand">' + ic('pulse') + '<h1>Pulse</h1></div>' +
      (P.boot && P.boot.settings && P.boot.settings.mode ? '<div class="seg pxmode" role="group" aria-label="Life mode"><button data-px="mode" data-m="personal" aria-pressed="' + (m !== 'work') + '">Personal</button><button data-px="mode" data-m="work" aria-pressed="' + (m === 'work') + '">Work</button></div>' : '') +
      '<nav class="pxnav" role="tablist">' + VIEWS.filter(function (v) { return v[0] !== 'lists' || work(); }).map(function (v) { var lbl = v[0] === 'tracked' ? (work() ? 'Trucks' : 'Parcels') : v[1]; return '<button data-px="view" data-v="' + v[0] + '" aria-pressed="' + (P.view === v[0]) + '" title="' + esc(lbl) + '">' + ic(VIC[v[0]] || 'apps') + '<span>' + lbl + '</span>' + (v[0] === 'inbox' && unread ? '<b class="pxn">' + unread + '</b>' : '') + '</button>'; }).join('') + '</nav>' +
      '<button class="pxrefresh" data-px="refresh" title="Refresh">' + ic('refresh') + '<span>Refresh</span></button></aside>';
  }
  function notReady() {
    return '<div class="wrap"><div class="pagehead"><div><h1>Pulse</h1></div></div><div class="banner"><i class="dot warn"></i><span>Add your Pulse address, email and password in Settings to see mail, WhatsApp, tasks and the calendar here.</span><button class="btn sm" data-act="nav" data-v="settings">Open Settings</button></div></div>';
  }
  var SPLIT = { today: 1, inbox: 1, chats: 1, tasks: 1, waiting: 1, notes: 1 };
  function view() {
    if (!on()) return notReady();
    if (P.err && !P.boot) return '<div class="wrap"><div class="pagehead"><div><h1>Pulse</h1></div></div><div class="banner"><i class="dot bad"></i><span>' + esc(P.err) + '</span><button class="btn sm" data-px="refresh">Try again</button></div></div>';
    if (!P.boot) return '<div class="wrap"><div class="pagehead"><div><h1>Pulse</h1></div></div><p class="note">Loading Pulse...</p></div>';
    var v = P.view, h = '';
    if (v === 'today') h = today0(); else if (v === 'inbox') h = inbox(); else if (v === 'chats') h = chats(); else if (v === 'tasks') h = tasks(); else if (v === 'calendar') h = calendar();
    else if (v === 'waiting') h = waiting(); else if (v === 'tracked') h = tracked(); else if (v === 'lists') h = lists(); else if (v === 'notes') h = notes(); else if (v === 'sources') h = sources();
    return '<div class="pxapp">' + side() + '<section class="pxmain">' + (P.err ? '<div class="banner"><i class="dot bad"></i><span>' + esc(P.err) + '</span></div>' : '') + (SPLIT[v] ? h : '<div class="pxscroll">' + h + '</div>') + '</section></div>';
  }

  /* ---------- list on the left, the communication behind it on the right (Today, Tasks, Waiting, like Inbox) ---------- */
  function refOf(v) { if (!v) return ''; if (typeof v === 'object') return refOf(v.id || v.ref); v = String(v); return /^[ew]\d{1,12}$/.test(v) ? v : ''; }
  function linkRef(x) {
    var r = ''; ['src', 'ref', 'item', 'itemId', 'source', 'msg', 'from_item'].some(function (k) { r = refOf(x[k]); return !!r; });
    if (r && (find(r) || true)) return r;
    var who = String(x.who || '').toLowerCase(), t = String(x.title || '').toLowerCase().slice(0, 24), hit = null;
    items().some(function (i) { var hay = String((i.subj || '') + ' ' + (i.sum || '') + ' ' + (i.snip || '')).toLowerCase(); if ((t && t.length > 6 && hay.indexOf(t) >= 0) || (who && who.length > 2 && String(i.from || '').toLowerCase().indexOf(who) >= 0 && x.kind !== 'task')) { hit = i; return true; } return false; });
    return hit ? hit.id : '';
  }
  function split(left, above) { return (above || '') + '<div class="px' + (P.reading ? ' reading' : '') + '"><div class="pxlist"><div id="pxl" class="pxrows pxflat">' + left + '</div></div><div class="pxread" id="pxr">' + readHtml() + '</div></div>'; }
  function detailHtml() {
    var x = P.selX; if (!x) return ''; var isT = x.k === 'task', o = x.o;
    return '<div class="pxacts">' + backBtn() + '<b class="pxct">' + esc(o.title || '') + '</b></div><div class="pxhd" style="padding:16px"><div class="note">' + esc(isT ? 'Task' : 'Waiting on someone') + (o.due ? ' · due ' + esc(o.due) : '') + (o.who || o.where ? ' · ' + esc(o.who || o.where) : '') + (o.pri ? ' · ' + esc(o.pri) : '') + '</div><p class="note" style="margin-top:14px">No message is linked to this ' + (isT ? 'task' : 'item') + ', so there is nothing to show here. Tasks made from an email or WhatsApp message open that message.</p></div>';
  }
  function waitsArr() { var w = Array.isArray(P.waits) ? P.waits : (P.waits && Array.isArray(P.waits.waits) ? P.waits.waits : null); return w && w.length ? w : ((P.boot && P.boot.waitsList) || []); }
  function pick(kind, id) {
    var list = kind === 'task' ? (P.boot.tasks || []) : waitsArr(), o = list.filter(function (x) { return String(x.id) === String(id); })[0]; if (!o) return;
    var ref = linkRef(o); P.selX = { k: kind, id: id, o: o }; P.reading = true;
    if (ref && (find(ref))) return void open(ref); P.sel = null; pl(); pr();
  }

  /* ---------- today ---------- */
  function rowItem(i) { return '<button class="prow" data-px="open" data-id="' + esc(i.id) + '"><div style="min-width:0;flex:1"><b style="overflow-wrap:anywhere">' + esc(i.sum || i.subj || String(i.text || i.snip || '').slice(0, 100)) + '</b><div class="note">' + esc(i.from || '') + ' · ' + esc(chName(i.ch)) + ' · ' + esc(tfmt(i.ts)) + '</div></div>' + (i.cls === 'urgent' ? '<span class="pill bad">Urgent</span>' : '') + '</button>'; }
  function sec(h, body, n) { return '<h2 style="font-size:19px;margin:22px 0 10px">' + h + (n ? ' <span class="note" style="font-size:14px">' + n + '</span>' : '') + '</h2>' + body; }
  function today0() {
    var b = P.boot, td = today(), its = items().filter(function (i) { return !i.handled; });
    var urgent = its.filter(function (i) { return i.cls === 'urgent'; }), reply = its.filter(function (i) { return i.reply && i.cls !== 'urgent'; });
    var unread = its.filter(function (i) { return !i.read && i.cls !== 'noise'; }).length;
    var tks = (b.tasks || []).filter(function (t) { return t.status !== 'done'; }), over = tks.filter(function (t) { return t.key === 'overdue'; }), tdy = tks.filter(function (t) { return t.key === 'today'; });
    var evs = (b.events || []).filter(function (e) { return e.d === td; }), wl = b.waitsList || [];
    var kp = '<div class="kpis"><div class="card kpi"><div class="stat"><span class="n">' + unread + '</span><span class="l">unread</span></div></div><div class="card kpi"><div class="stat"><span class="n" style="color:' + (urgent.length ? 'var(--bad)' : 'inherit') + '">' + urgent.length + '</span><span class="l">urgent</span></div></div><div class="card kpi"><div class="stat"><span class="n">' + over.length + '</span><span class="l">overdue tasks</span></div></div><div class="card kpi"><div class="stat"><span class="n">' + evs.length + '</span><span class="l">events today</span></div></div></div>';
    var card = function (inner) { return '<div class="card" style="padding:4px 16px">' + inner + '</div>'; };
    var tr = function (t) { return '<div class="prow' + (P.selX && P.selX.id === t.id ? ' on' : '') + '" data-px="lnk" data-k="task" data-id="' + esc(t.id) + '" style="cursor:pointer"><div style="flex:1;min-width:0"><b>' + esc(t.title) + '</b><div class="note">' + esc(t.due) + (t.src ? ' · from a message' : '') + '</div></div>' + (t.pri === 'urgent' || t.pri === 'high' ? '<span class="pill bad">' + esc(t.pri) + '</span>' : '') + '</div>'; };
    return split(todayLeft(urgent, reply, over, tdy, evs, wl, card, tr), kp);
  }
  function todayLeft(urgent, reply, over, tdy, evs, wl, card, tr) {
    return sec('Needs you', urgent.length || reply.length ? card(urgent.slice(0, 8).concat(reply.slice(0, 6)).map(rowItem).join('')) : '<p class="note">Nothing is waiting for you.</p>', urgent.length + reply.length) +
      sec('Tasks', over.length + tdy.length ? card(over.concat(tdy).slice(0, 10).map(tr).join('')) : '<p class="note">No tasks due today.</p>') +
      sec('Today', evs.length ? card(evs.map(function (e) { return '<div class="prow"><div style="flex:1"><b>' + esc(e.title) + '</b><div class="note">' + (e.allDay ? 'All day' : hh(e.s) + ' - ' + hh(e.e)) + (e.loc ? ' · ' + esc(e.loc) : '') + '</div></div></div>'; }).join('')) : '<p class="note">No events today.</p>') +
      (wl.length ? sec('Waiting on others', card(wl.slice(0, 6).map(function (w) { return '<div class="prow' + (P.selX && P.selX.id === w.id ? ' on' : '') + '" data-px="lnk" data-k="wait" data-id="' + esc(w.id) + '" style="cursor:pointer"><div style="flex:1"><b>' + esc(w.title) + '</b><div class="note">' + esc(w.who || w.where || '') + '</div></div>' + (w.overdue ? '<span class="pill warn">Overdue</span>' : '') + '</div>'; }).join('')), wl.length) : '') +
      '';
  }
  function hh(h) { var x = Math.floor(h), m = Math.round((h - x) * 60); return ('0' + x).slice(-2) + ':' + ('0' + m).slice(-2); }

  /* ---------- inbox ---------- */
  function visible() {
    var l = P.sres ? P.sres.items : items();
    return l.filter(function (i) {
      if (P.ch && i.ch !== P.ch) return false;
      if (P.sres) return true;
      if (P.filter === 'unread') return !i.read && !i.handled; if (P.filter === 'reply') return !!i.reply; if (P.filter === 'urgent') return i.cls === 'urgent' && !i.handled; if (P.filter === 'star') return !!i.star; if (P.filter === 'mail') return isMail(i); if (P.filter === 'wa') return !isMail(i);
      return i.cls !== 'noise' || !i.read;
    });
  }
  function chips() {
    var f = [['all', 'All'], ['unread', 'Unread'], ['reply', 'Needs reply'], ['urgent', 'Urgent'], ['star', 'Starred'], ['mail', 'Mail'], ['wa', 'WhatsApp']];
    var chs = {}; items().forEach(function (i) { chs[i.ch] = 1; });
    return '<div class="chips">' + f.map(function (x) { return '<button class="chip" data-px="filter" data-f="' + x[0] + '" aria-pressed="' + (P.filter === x[0] && !P.sres) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="chips" style="margin-top:8px">' + ['EO', 'EP', 'WA', 'WB'].filter(function (c) { return chs[c]; }).map(function (c) { return '<button class="chip" data-px="chan" data-c="' + c + '" aria-pressed="' + (P.ch === c) + '"><i class="chd" style="background:hsl(' + hue(c) + ' 60% 50%)"></i>' + esc(chName(c)) + '</button>'; }).join('') + '</div>';
  }
  function listHtml() {
    var l = visible();
    if (!l.length) return '<div class="empty" style="padding:30px 10px"><h2>' + (P.sres ? 'No matches' : 'Nothing here') + '</h2><p>' + (P.sres ? 'Try other words.' : 'You are all caught up.') + '</p></div>';
    return l.map(function (i) {
      var mail = isMail(i), unread = !i.read && !i.handled, title = mail ? (i.subj || '(no subject)') : (i.g && P.boot ? (grp(i.g) || 'WhatsApp') : 'WhatsApp');
      var snip = mail ? (i.snip || '') : (i.chat ? (i.sum || i.snip) : i.snip);
      return '<button class="pxrow' + (P.sel === i.id ? ' on' : '') + (unread ? ' un' : '') + '" data-px="open" data-id="' + esc(i.id) + '"><span class="pxav" style="background:hsl(' + hue(i.from) + ' 50% 42%)">' + esc(String(mail ? (i.from || '?') : title).charAt(0).toUpperCase()) + '</span><span class="pxt"><span class="pxl1"><b>' + esc(mail ? (i.from || '') : title) + '</b><time>' + esc(tfmt(i.ts)) + '</time></span><span class="pxl2">' + (mail ? esc(title) : '<span style="color:var(--muted)">' + esc(i.from || '') + ':</span> ' + esc(String(snip).slice(0, 90))) + '</span><span class="pxl3">' + (mail ? esc(String(snip).slice(0, 110)) : '') + '</span><span class="pxtags">' + (i.cls === 'urgent' ? '<em class="tg bad">Urgent</em>' : '') + (i.reply ? '<em class="tg">Reply</em>' : '') + (i.vip ? '<em class="tg">VIP</em>' : '') + (i.star ? '<em class="tg">★</em>' : '') + (i.att && i.att.length ? '<em class="tg">📎 ' + i.att.length + '</em>' : '') + (i.chat && i.stats && i.stats.unread ? '<em class="tg warn">' + i.stats.unread + ' unread</em>' : '') + '<em class="tg ch" style="--c:hsl(' + hue(i.ch) + ' 60% 50%)">' + esc(chName(i.ch)) + '</em></span></span></button>';
    }).join('') + (P.more && !P.sres ? '<div style="text-align:center;padding:12px"><button class="btn sm" data-px="older">' + (P.olderBusy ? 'Loading...' : 'Older messages') + '</button></div>' : '');
  }
  function grp(g) { var x = ((P.boot && P.boot.groups) || []).filter(function (y) { return y.id === g; })[0]; return x ? x.name : ''; }
  function inbox() {
    return '<form data-px="search" class="toolbar" style="margin-bottom:12px"><div class="search" style="flex:1">' + ic('search') + '<input class="input" id="pxq" type="search" placeholder="Search mail and WhatsApp (from:, is:unread, after:7d, a plate or reference)" value="' + esc(P.q) + '" aria-label="Search Pulse"></div><button class="btn" type="submit">Search</button>' + (P.sres ? '<button class="btn" type="button" data-px="clearq">Clear</button>' : '') + '</form>' +
      '<div class="px' + (P.reading ? ' reading' : '') + '"><div class="pxlist"><div class="pxfilters">' + chips() + '</div><div id="pxl" class="pxrows">' + listHtml() + '</div></div><div class="pxread" id="pxr">' + readHtml() + '</div></div>';
  }
  function pl() { var e = $('#pxl'); if (!e) return; if (P.view === 'inbox') e.innerHTML = listHtml(); else redraw(); }
  function pr() { var e = $('#pxr'); if (!e) return redraw(); e.innerHTML = P.view === 'chats' ? chatPane() : readHtml(); var w = $('.px'); if (w) w.classList.toggle('reading', P.reading); var c = $('#pxchat'); if (c && !(P.chat && P.chat.keep)) c.scrollTop = c.scrollHeight; if (P.chat) P.chat.keep = false; }
  function backBtn() { return '<button class="btn sm pxback" data-px="back">' + ic('back') + ' Back</button>'; }
  function chatPane() { if (!P.chat) return '<div class="empty" style="padding:60px 20px"><h2>Select a chat</h2></div>'; var by = items().filter(function (i) { return i.chat && i.g === P.chat.g; })[0] || {}; return chatHtml({ g: P.chat.g, ch: by.ch || '' }, backBtn()); }
  function readHtml() {
    if (P.selX && !P.sel) return detailHtml();
    var i = P.sel && (find(P.sel) || (P.sres && P.sres.items.filter(function (x) { return x.id === P.sel; })[0]));
    if (!i) return '<div class="empty" style="padding:60px 20px"><h2>Select a message</h2><p>Mail opens here like Gmail. WhatsApp opens as the chat.</p></div>';
    var back = '<button class="btn sm pxback" data-px="back">' + ic('back') + ' Back</button>';
    if (!isMail(i)) return chatHtml(i, back);
    var f = P.item && P.item.id === i.id ? P.item : i;
    var acts = '<div class="pxacts">' + back + '<button class="btn sm" data-px="done" data-id="' + esc(i.id) + '">Done</button>' + (i.read ? '' : '<button class="btn sm" data-px="markread" data-id="' + esc(i.id) + '">Mark read</button>') + (i.task ? '<span class="pill ok">Task made</span>' : '<button class="btn sm" data-px="mktask" data-id="' + esc(i.id) + '">Make task</button>') + '</div>';
    var meta = '<div class="pxhd"><h2>' + esc(f.subj || '(no subject)') + '</h2><div class="pxfrom"><span class="pxav" style="background:hsl(' + hue(f.from) + ' 50% 42%)">' + esc(String(f.from || '?').charAt(0).toUpperCase()) + '</span><div style="min-width:0"><b>' + esc(f.from || '') + '</b> <span class="note">&lt;' + esc(f.addr || '') + '&gt;</span><div class="note">to ' + esc(f.to || 'me') + ' · ' + esc(dfull(String(f.ts).slice(0, 10)) + ' ' + String(f.ts).slice(11, 16)) + ' · ' + esc(chName(f.ch)) + '</div></div></div></div>';
    var ai = (f.sum && f.sum !== f.subj) || f.why || f.act ? '<div class="pxai"><b>' + (f.cls === 'urgent' ? 'Urgent. ' : '') + esc(f.sum || '') + '</b>' + (f.why ? '<div class="note">' + esc(f.why) + '</div>' : '') + (f.act ? '<div class="note">Suggested: ' + esc(typeof f.act === 'string' ? f.act : (f.act.title || f.act.text || JSON.stringify(f.act))) + '</div>' : '') + '</div>' : '';
    var att = (f.files || []).length ? '<div class="pxatt">' + f.files.map(function (a) { return '<a class="pxa" href="/api/pulse/s/att/' + esc(i.id.slice(1)) + '/' + a.idx + '?download=1">📎 ' + esc(a.name) + (a.size ? ' <span class="note">' + bytes(a.size) + '</span>' : '') + '</a>'; }).join('') + '</div>' : '';
    var imgs = P.imgs[i.id] ? 1 : 0;
    var body = f.html ? '<div class="note" style="margin:6px 0"><label><input type="checkbox" data-px="imgs" data-id="' + esc(i.id) + '"' + (imgs ? ' checked' : '') + '> Show remote images</label></div><iframe class="pxframe" title="Email" sandbox="allow-popups allow-popups-to-escape-sandbox" src="/api/pulse/s/mailhtml/' + esc(i.id.slice(1)) + '?images=' + imgs + '"></iframe>' : '<div class="pxtext">' + linkify(f.text || '') + '</div>';
    return acts + '<div class="pxbody">' + meta + ai + att + (P.itemBusy ? '<p class="note">Loading the full message...</p>' : '') + body + '</div>';
  }
  function bytes(n) { return A.bytes ? A.bytes(n) : n + ' B'; }

  /* ---------- WhatsApp thread ---------- */
  function mediaHtml(x) {
    var url = '/api/pulse/s/media/' + x.id, ready = x.status === 'ready', word = { image: 'photo', sticker: 'sticker', video: 'video', audio: 'voice note', document: 'file' }[x.kind] || 'file';
    var st = ready ? '' : (x.status === 'pending' ? 'Downloading...' : x.status === 'expired' ? esc(x.error || 'WhatsApp no longer has this file.') : '<button class="btn sm" data-px="mload" data-id="' + x.id + '">' + (x.status === 'failed' ? 'Try again' : 'Load ' + word + (x.size ? ' (' + bytes(x.size) + ')' : '')) + '</button>');
    if (x.kind === 'image' || x.kind === 'sticker') return ready ? '<a href="' + url + '" target="_blank" rel="noopener"><img class="pxmedia" loading="lazy" src="' + url + '" alt="' + word + '"></a>' : '<div class="pxph">' + (x.thumb ? '<img class="blur" src="' + url + '/thumb" alt="">' : '') + '<div>' + st + '</div></div>';
    if (x.kind === 'video') return ready ? '<video class="pxmedia" controls preload="metadata" src="' + url + '"></video>' : '<div class="pxph">' + (x.thumb ? '<img class="blur" src="' + url + '/thumb" alt="">' : '') + '<div>' + st + '</div></div>';
    if (x.kind === 'audio') return ready ? '<audio controls preload="none" src="' + url + '"></audio>' : '<div class="pxph"><div>🎤 ' + st + '</div></div>';
    return '<div class="pxdoc"><b>📄 ' + esc(x.name || 'File') + '</b> <span class="note">' + (x.size ? bytes(x.size) : '') + '</span><div>' + (ready ? '<a class="btn sm" href="' + url + '?download=1">Download</a>' : st) + '</div></div>';
  }
  function bubbles(msgs, hl) {
    var out = '', last = '', prev = null, div = false, td = today(), unreadN = msgs.filter(function (m) { return !m.mine && !m.read; }).length;
    msgs.forEach(function (m) {
      var day = String(m.ts).slice(0, 10);
      if (day !== last) { out += '<div class="cday"><span>' + (day === td ? 'Today' : dfull(day)) + '</span></div>'; last = day; prev = null; }
      if (!div && !m.mine && !m.read) { out += '<div class="cunread"><span>' + unreadN + ' unread message' + (unreadN === 1 ? '' : 's') + '</span></div>'; div = true; }
      var showName = !m.mine && (!prev || prev.from !== m.from || prev.mine || (m.at - prev.at) > 300000);
      var txt = m.media && /^\[(Image|Video|Voice message|Sticker|Document)\]/.test(m.text) ? '' : m.text;
      out += '<div class="cb' + (m.mine ? ' mine' : '') + (m.id === hl ? ' hl' : '') + '" id="cb-' + esc(m.id) + '">' + (showName ? '<div class="cn" style="color:hsl(' + hue(m.from) + ' 55% 40%)">' + (m.vip ? '⭐ ' : '') + esc(m.from) + '</div>' : '') + (m.media ? mediaHtml(m.media) : '') +
        (m.media && m.media.ocr ? '<details class="ocr"><summary>Text in this ' + (m.media.kind === 'document' ? 'file' : 'picture') + '</summary><div class="note" style="white-space:pre-wrap">' + esc(m.media.ocr) + '</div></details>' : '') + (m.media && m.media.spoken ? '<div class="note">🎤 Said: ' + esc(m.media.spoken) + '</div>' : '') +
        (m.deleted ? '<div class="cdel">🚫 This message was deleted</div>' : (txt ? '<div class="ct">' + linkify(txt) + '</div>' : '')) +
        ((m.reactions || []).length ? '<div class="crx">' + m.reactions.map(function (r) { return '<span>' + esc(r.emoji) + (r.n > 1 ? ' ' + r.n : '') + '</span>'; }).join('') + '</div>' : '') +
        '<div class="cmeta">' + (m.edited ? 'edited · ' : '') + esc(String(m.ts).slice(11, 16)) + '</div></div>';
      prev = m;
    });
    return out;
  }
  function chatHtml(i, back) {
    var g = i.g, c = P.chat && P.chat.g === g ? P.chat : null, name = grp(g) || 'WhatsApp chat';
    var acts = '<div class="pxacts">' + (back || '') + '<b class="pxct">' + esc(name) + '</b><span class="note">' + esc(chName(i.ch)) + (c && c.d && c.d.group && c.d.group.members ? ' · ' + c.d.group.members + ' members' : '') + '</span><span class="sp"></span><button class="btn sm" data-px="cread" data-g="' + esc(g) + '">Mark read</button><button class="btn sm" data-px="cdone" data-g="' + esc(g) + '">All done</button></div>';
    if (!c || !c.d) return acts + '<div id="pxchat" class="pxchat"><p class="note" style="padding:16px">' + (c && c.err ? esc(c.err) : 'Opening the chat...') + '</p></div>';
    var d = c.d, dg = d.digest && d.digest.summary ? d.digest.summary : null;
    return acts + (dg && dg.headline ? '<div class="pxai" style="margin:8px 12px 0"><b>Summary</b> ' + esc(dg.headline) + '</div>' : '') + '<div id="pxchat" class="pxchat">' + (d.earlier ? '<div style="text-align:center;padding:8px"><button class="btn sm" data-px="earlier">' + (c.busy ? 'Loading...' : 'Earlier messages') + '</button></div>' : '') + bubbles(d.messages || [], c.hl) + '</div>' +
      '<div class="pxnote">Read-only here. Reply from WhatsApp or Pulse.</div>';
  }
  function openChat(g, ref, opts) {
    opts = opts || {}; P.chat = { g: g, d: null, hl: ref || null, busy: false, keep: false }; pr();
    return s('/chat/' + g + (ref && opts.around ? '?around=' + ref : '')).then(function (d) { if (!P.chat || P.chat.g !== g) return; P.chat.d = d; pr(); if (ref && opts.around) { var e = document.getElementById('cb-' + ref); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'center' }); } }).catch(function (e) { if (P.chat && P.chat.g === g) { P.chat.err = e.message; pr(); } });
  }
  function earlier() {
    var c = P.chat; if (!c || !c.d || c.busy) return; var first = c.d.messages[0]; if (!first) return; c.busy = true; c.keep = true; pr();
    s('/chat/' + c.g + '?before=' + first.at).then(function (d) { c.d.messages = d.messages.concat(c.d.messages); c.d.earlier = d.earlier; c.busy = false; pr(); }).catch(function (e) { c.busy = false; toast(e.message); pr(); });
  }

  /* ---------- open / actions ---------- */
  function setItem(ref, patch) { var i = find(ref) || (P.sres && P.sres.items.filter(function (x) { return x.id === ref; })[0]); if (i) Object.assign(i, patch); }
  function open(ref) {
    var i = find(ref) || (P.sres && P.sres.items.filter(function (x) { return x.id === ref; })[0]); if (!i) return; P.sel = ref; P.reading = true; P.item = null;
    if (isMail(i)) {
      P.itemBusy = true; pl(); pr();
      s('/item/' + ref).then(function (d) { if (P.sel === ref) { P.item = d; P.itemBusy = false; pr(); } }).catch(function () { P.itemBusy = false; pr(); });
      if (!i.read) s('/item/' + ref + '/read', { method: 'POST', json: {} }).then(function () { setItem(ref, { read: true }); pl(); }).catch(function () {});
    } else { pl(); openChat(i.g, ref, { around: !!P.sres }); }
  }
  function mode(m) { s('/mode', { method: 'PUT', json: { mode: m } }).then(function () { P.boot = null; P.waits = null; P.lists = null; P.ents = null; toast(m === 'work' ? 'Work mode' : 'Personal mode'); return load(); }).catch(function (e) { toast(e.message); }); }
  function patchTask(id, body, msg) { return s('/task/' + id, { method: 'PATCH', json: body }).then(function () { if (msg) toast(msg); return load(true).then(function () { if (P.view === 'tasks') redraw(); }); }).catch(function (e) { toast(e.message); }); }

  /* ---------- WhatsApp list ---------- */
  function chats() {
    var gs = ((P.boot && P.boot.groups) || []).slice(), q = P.chatq.toLowerCase();
    var rows = items().filter(function (i) { return i.chat; }), by = {}; rows.forEach(function (i) { by[i.g] = i; });
    gs = gs.filter(function (g) { return !q || (g.name || '').toLowerCase().indexOf(q) >= 0; }).sort(function (a, b) { var x = by[a.id], y = by[b.id]; return (y ? y.at : 0) - (x ? x.at : 0) || b.today - a.today; });
    return '<div class="toolbar"><div class="search" style="flex:1">' + ic('search') + '<input class="input" data-pin="chatq" type="search" placeholder="Find a chat" value="' + esc(P.chatq) + '" aria-label="Find a chat"></div></div>' + '<div class="px' + (P.reading ? ' reading' : '') + '"><div class="pxlist"><div class="pxrows">' + (gs.length ? gs.map(function (g) {
      var r = by[g.id]; return '<button class="pxrow' + (P.chat && P.chat.g === g.id ? ' on' : '') + (r && !r.read ? ' un' : '') + '" data-px="chat" data-g="' + esc(g.id) + '"><span class="pxav" style="background:hsl(' + hue(g.name) + ' 50% 42%)">' + esc(String(g.name || '?').charAt(0).toUpperCase()) + '</span><span class="pxt"><span class="pxl1"><b>' + esc(g.name) + '</b><time>' + esc(g.last || '') + '</time></span><span class="pxl2">' + (r ? esc(r.lastFrom || '') + ': ' + esc(String(r.lastText || r.snip || '').slice(0, 80)) : (g.today ? g.today + ' today' : '')) + '</span><span class="pxtags">' + (r && r.stats && r.stats.unread ? '<em class="tg warn">' + r.stats.unread + ' unread</em>' : '') + (r && r.stats && r.stats.urgent ? '<em class="tg bad">' + r.stats.urgent + ' urgent</em>' : '') + '<em class="tg ch" style="--c:hsl(' + hue(g.ch) + ' 60% 50%)">' + esc(chName(g.ch)) + '</em></span></span></button>';
    }).join('') : '<div class="empty" style="padding:30px"><h2>No chats</h2></div>') + '</div></div><div class="pxread" id="pxr">' + chatPane() + '</div></div>';
  }

  /* ---------- tasks ---------- */
  function tasks() {
    var all = (P.boot.tasks || []), open = all.filter(function (t) { return t.status !== 'done'; }), done = all.filter(function (t) { return t.status === 'done'; });
    var grp0 = [['overdue', 'Overdue'], ['today', 'Today'], ['soon', 'Later']];
    var row = function (t) { return '<div class="prow' + (P.selX && P.selX.id === t.id ? ' on' : '') + '" data-px="lnk" data-k="task" data-id="' + esc(t.id) + '" style="cursor:pointer"><input type="checkbox" data-px="tdone" data-id="' + esc(t.id) + '"' + (t.status === 'done' ? ' checked' : '') + ' aria-label="Done"><div style="flex:1;min-width:0;margin-left:10px"><b style="' + (t.status === 'done' ? 'text-decoration:line-through;color:var(--muted)' : '') + ';overflow-wrap:anywhere">' + esc(t.title) + '</b><div class="note">' + esc(t.due) + ' · ' + esc(t.dom) + (t.src ? ' · from a message' : '') + '</div></div>' + (t.pri === 'urgent' || t.pri === 'high' ? '<span class="pill bad">' + esc(t.pri) + '</span>' : '') + '<button class="btn sm" data-px="tdel" data-id="' + esc(t.id) + '" aria-label="Delete task">Delete</button></div>'; };
    var form = P.adding ? '<form data-px="addtask" class="card" style="display:grid;gap:10px;margin-bottom:16px"><div class="field"><label for="nt">Task</label><input class="input" id="nt" autocomplete="off" placeholder="What needs doing?"></div><div class="icform"><div class="field"><label for="nd">Due date</label><input class="input" id="nd" type="date"></div><div class="field"><label for="np">Priority</label><select class="input" id="np"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option><option value="low">Low</option></select></div><div class="field"><label for="ndm">Area</label><select class="input" id="ndm"><option' + (work() ? '' : ' selected') + '>Personal</option><option' + (work() ? ' selected' : '') + '>Work</option></select></div></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" type="button" data-px="canceltask">Cancel</button><button class="btn primary" type="submit">Add task</button></div></form>' : '';
    return split('<div class="toolbar" style="padding:10px 12px 0"><button class="btn primary" data-px="newtask">New task</button><label class="note" style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-px="showdone"' + (P.tdone ? ' checked' : '') + '> Show completed</label></div>' + form +
      grp0.map(function (g) { var l = open.filter(function (t) { return t.key === g[0]; }); return l.length ? sec(g[1], '<div class="card" style="padding:4px 16px">' + l.map(row).join('') + '</div>', l.length) : ''; }).join('') + (!open.length ? '<div class="empty"><h2>No open tasks</h2></div>' : '') +
      (P.tdone && done.length ? sec('Completed', '<div class="card" style="padding:4px 16px">' + done.map(row).join('') + '</div>', done.length) : ''));
  }

  /* ---------- calendar ---------- */
  function addDays(d, n) { var x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  function calendar() {
    var mon = addDays(P.boot.now.monday || today(), P.week * 7), days = []; for (var k = 0; k < 7; k++) days.push(addDays(mon, k));
    var evs = P.boot.events || [], dn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return '<div class="toolbar"><div class="seg"><button data-px="week" data-w="-1">Previous</button><button data-px="week" data-w="0" aria-pressed="' + (P.week === 0) + '">This week</button><button data-px="week" data-w="1">Next</button></div><span class="note">' + dfull(days[0]) + ' to ' + dfull(days[6]) + '. Events come from email invitations and calendars connected in Pulse.</span></div>' +
      '<div class="pxweek">' + days.map(function (d, k) {
        var l = evs.filter(function (e) { return e.d === d; }).sort(function (a, b) { return a.s - b.s; });
        return '<div class="card pxday' + (d === today() ? ' now' : '') + '"><div class="pxdh"><b>' + dn[k] + '</b> <span class="note">' + d.slice(8) + '/' + d.slice(5, 7) + '</span></div>' + (l.length ? l.map(function (e) { return '<div class="pxev"><span class="note">' + (e.allDay ? 'All day' : hh(e.s)) + '</span> <b>' + esc(e.title) + '</b>' + (e.loc ? '<div class="note">' + esc(e.loc) + '</div>' : '') + (e.invite ? '<em class="tg">Invite</em>' : '') + '</div>'; }).join('') : '<div class="note">Free</div>') + '</div>';
      }).join('') + '</div>';
  }

  /* ---------- waiting, tracked, lists, notes, sources ---------- */
  function waiting() {
    var w = waitsArr(); if (P.waits && P.waits.error) return '<div class="banner"><i class="dot bad"></i><span>' + esc(P.waits.error) + '</span></div>'; w = Array.isArray(w) ? w.filter(function (x) { return x.status !== 'done' && x.status !== 'dismissed'; }) : [];
    return split(w.length ? '<div class="card" style="padding:4px 16px;margin:10px 12px">' + w.map(function (x) { return '<div class="prow' + (P.selX && String(P.selX.id) === String(x.id) ? ' on' : '') + '" data-px="lnk" data-k="wait" data-id="' + esc(x.id) + '" style="cursor:pointer"><div style="flex:1;min-width:0"><b style="overflow-wrap:anywhere">' + esc(x.title) + '</b><div class="note">' + esc(x.who || x.where || '') + (x.askedAt ? ' · asked ' + esc(tfmt(new Date(x.askedAt).toISOString().replace('T', ' ').slice(0, 16))) : '') + '</div></div>' + (x.overdue ? '<span class="pill warn">Overdue</span>' : '') + (x.kind === 'delegated' ? '<span class="pill">Delegated</span>' : '') + '</div>'; }).join('') + '</div>' : '<div class="empty"><h2>Nobody owes you anything</h2></div>');
  }
  function tracked() {
    if (P.entSel) { var d = P.entD; return '<div class="winbar"><button class="btn sm" data-px="entback">' + ic('back') + ' All</button><b>' + esc((d && d.name) || P.entSel) + '</b></div>' + (d ? (d.error ? '<div class="banner"><i class="dot bad"></i><span>' + esc(d.error) + '</span></div>' : '<div class="card" style="padding:4px 16px">' + ((d.timeline || []).map(function (e) { return '<div class="prow"><div style="flex:1;min-width:0"><b>' + esc(e.who || e.from || '') + '</b> <span class="note">' + esc(e.where || '') + ' · ' + esc(tfmt(e.ts)) + '</span><div style="overflow-wrap:anywhere">' + esc(e.text || e.snip || e.sum || '') + '</div></div></div>'; }).join('') || '<p class="note">Nothing yet.</p>') + '</div>') : '<p class="note">Loading...</p>'); }
    var list = P.ents; var arr = Array.isArray(list) ? list : (list && (list.entities || list.items)) || [];
    return '<form data-px="entsearch" class="toolbar"><div class="search" style="flex:1">' + ic('search') + '<input class="input" id="entq" type="search" placeholder="Number, plate, reference or name" value="' + esc(P.entq) + '" aria-label="Search tracked"></div></form>' + (list ? (list.error ? '<div class="banner"><i class="dot bad"></i><span>' + esc(list.error) + '</span></div>' : arr.length ? '<div class="card" style="padding:4px 16px">' + arr.map(function (x) { return '<button class="prow" data-px="ent" data-k="' + esc(x.key) + '"><div style="flex:1;min-width:0"><b>' + esc(x.name || x.key) + '</b><div class="note">' + esc(x.kind || '') + (x.mentions ? ' · ' + x.mentions + ' mentions' : '') + (x.last ? ' · ' + esc(tfmt(x.last)) : '') + '</div></div></button>'; }).join('') + '</div>' : '<div class="empty"><h2>Nothing tracked yet</h2></div>') : '<p class="note">Loading...</p>');
  }
  function lists() {
    var l = P.lists; if (!l) return '<p class="note">Loading...</p>'; var arr = Array.isArray(l) ? l : l.lists || [];
    return arr.length ? arr.map(function (g) { return sec(esc(g.name || 'List'), '<div class="tablewrap"><table><thead><tr><th>Item</th><th>Waiting</th></tr></thead><tbody>' + (g.rows || []).map(function (r) { return '<tr' + (r.over ? ' style="color:var(--bad)"' : '') + '><td>' + esc(r.ref) + '</td><td>' + esc(String(r.value) + (g.unit ? ' ' + g.unit : '')) + '</td></tr>'; }).join('') + '</tbody></table></div>'); }).join('') : '<div class="empty"><h2>No status lists</h2></div>';
  }
  function notes() {
    var n = (P.boot.notes || []); if (!n.length) return '<div class="empty"><h2>No notes</h2></div>';
    return '<div class="px' + (P.note ? ' reading' : '') + '"><div class="pxlist"><div class="pxrows">' + n.map(function (x) { return '<button class="pxrow' + (P.note === x.id ? ' on' : '') + '" data-px="note" data-id="' + esc(x.id) + '"><span class="pxt"><span class="pxl1"><b>' + esc(x.title || 'Untitled') + '</b><time>' + esc(x.upd || '') + '</time></span><span class="pxl2">' + esc(String(x.body || '').slice(0, 90)) + '</span></span></button>'; }).join('') + '</div></div><div class="pxread"><div class="pxacts"><button class="btn sm pxback" data-px="notback">' + ic('back') + ' Back</button></div>' + (function () { var x = n.filter(function (y) { return y.id === P.note; })[0]; return x ? '<div class="pxbody"><h2>' + esc(x.title) + '</h2>' + (x.tags ? '<div class="note">' + esc(x.tags) + '</div>' : '') + '<div class="pxtext">' + linkify(x.body || '') + '</div></div>' : '<div class="empty" style="padding:60px 20px"><h2>Select a note</h2></div>'; })() + '</div></div>';
  }
  function sources() {
    var l = P.boot.sources || [], h = P.boot.health;
    return (h && h.text ? '<div class="banner"><i class="dot ' + (h.level === 'bad' ? 'bad' : 'warn') + '"></i><span>' + esc(h.text) + '</span></div>' : '') + '<div class="card" style="padding:4px 16px">' + l.map(function (x) { return '<div class="prow"><div style="flex:1;min-width:0"><b>' + esc(x.name) + '</b><div class="note">' + esc(x.detail || '') + (x.n ? ' · ' + esc(x.n) : '') + (x.sync ? ' · synced ' + esc(x.sync) : '') + '</div>' + (x.error ? '<div class="note" style="color:var(--bad)">' + esc(x.error) + '</div>' : '') + '</div><span class="pill ' + (x.status === 'connected' ? 'ok' : x.status === 'error' ? 'bad' : 'warn') + '">' + esc(x.status) + '</span></div>'; }).join('') + '</div>';
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-px]'); if (!el || el.tagName === 'FORM' || el.tagName === 'INPUT' && el.type !== 'checkbox') return; var a = el.getAttribute('data-px'), id = el.getAttribute('data-id');
    if (a === 'view') return void setView(el.getAttribute('data-v'));
    if (a === 'refresh') { P.boot && (P.boot = null); P.waits = null; P.lists = null; P.sres = null; return void load().then(loadView); }
    if (a === 'mode') return void mode(el.getAttribute('data-m'));
    if (a === 'filter') { P.filter = el.getAttribute('data-f'); P.sres = null; P.q = ''; return void redraw(); }
    if (a === 'chan') { P.ch = P.ch === el.getAttribute('data-c') ? '' : el.getAttribute('data-c'); return void redraw(); }
    if (a === 'lnk') return void pick(el.getAttribute('data-k'), id);
    if (a === 'open') { P.selX = null; return void open(id); }
    if (a === 'back') { P.reading = false; var w = $('.px'); if (w) w.classList.remove('reading'); return; }
    if (a === 'clearq') { P.q = ''; P.sres = null; return void redraw(); }
    if (a === 'older') { var last = items()[items().length - 1]; if (!last || P.olderBusy) return; P.olderBusy = true; pl(); return void s('/items?limit=100&before=' + last.at).then(function (d) { P.boot.items = P.boot.items.concat(d.items || []); P.more = !!d.more; }).catch(function (e) { toast(e.message); }).then(function () { P.olderBusy = false; pl(); }); }
    if (a === 'done') return void s('/item/' + id + '/handled', { method: 'POST', json: {} }).then(function () { setItem(id, { handled: true, read: true, reply: false }); toast('Marked done'); P.sel = null; pl(); pr(); }).catch(function (e) { toast(e.message); });
    if (a === 'markread') return void s('/item/' + id + '/read', { method: 'POST', json: {} }).then(function () { setItem(id, { read: true }); pl(); pr(); }).catch(function (e) { toast(e.message); });
    if (a === 'mktask') return void s('/item/' + id + '/task', { method: 'POST', json: {} }).then(function (d) { setItem(id, { task: d.id }); toast('Task made'); pr(); return load(true); }).catch(function (e) { toast(e.message); });
    if (a === 'chat') { P.reading = true; var w2 = $('.px'); if (w2) w2.classList.add('reading'); return void openChat(el.getAttribute('data-g')); }
    if (a === 'earlier') return void earlier();
    if (a === 'mload') return void s('/media/' + id + '/load', { method: 'POST', json: {} }).then(function () { var g = P.chat && P.chat.g; if (g) { var keep = P.chat.d; return s('/chat/' + g + '?limit=' + Math.max(60, (keep.messages || []).length)).then(function (d) { P.chat.d = d; P.chat.keep = true; pr(); }); } }).catch(function (e) { toast(e.message); });
    if (a === 'cread' || a === 'cdone') return void s('/chat/' + el.getAttribute('data-g') + '/action', { method: 'POST', json: { action: a === 'cdone' ? 'done' : 'read' } }).then(function () { toast(a === 'cdone' ? 'Chat marked done' : 'Marked read'); return load(true).then(function () { openChat(el.getAttribute('data-g')); }); }).catch(function (e) { toast(e.message); });
    if (a === 'tdone') return;
    if (a === 'tdel') return void s('/task/' + id, { method: 'DELETE' }).then(function () { toast('Task deleted'); return load(true).then(redraw); }).catch(function (e) { toast(e.message); });
    if (a === 'newtask') { P.adding = true; redraw(); var f = $('#nt'); if (f) f.focus(); return; }
    if (a === 'canceltask') { P.adding = false; return void redraw(); }
    if (a === 'week') { var wv = Number(el.getAttribute('data-w')); P.week = wv === 0 ? 0 : P.week + wv; return void redraw(); }
    if (a === 'ent') { P.entSel = el.getAttribute('data-k'); P.entD = null; redraw(); return void s('/entity/' + encodeURIComponent(P.entSel)).then(function (d) { P.entD = d; }).catch(function (e) { P.entD = { error: e.message }; }).then(redraw); }
    if (a === 'entback') { P.entSel = null; return void redraw(); }
    if (a === 'note') { P.note = id; return void redraw(); } if (a === 'notback') { P.note = null; return void redraw(); }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target, a = t.getAttribute && t.getAttribute('data-px'); if (!a) return;
    if (a === 'tdone') return void patchTask(t.getAttribute('data-id'), { status: t.checked ? 'done' : 'todo' }, t.checked ? 'Done' : 'Reopened');
    if (a === 'showdone') { P.tdone = t.checked; return void redraw(); }
    if (a === 'imgs') { P.imgs[t.getAttribute('data-id')] = t.checked; return void pr(); }
  });
  document.addEventListener('input', function (ev) { var k = ev.target.getAttribute && ev.target.getAttribute('data-pin'); if (k === 'chatq') { P.chatq = ev.target.value; var c = ev.target.selectionStart; redraw(); var n = document.querySelector('[data-pin="chatq"]'); if (n) { n.focus(); try { n.setSelectionRange(c, c); } catch (e) {} } } });
  document.addEventListener('submit', function (ev) {
    var f = ev.target, a = f.getAttribute && f.getAttribute('data-px'); if (!a) return; ev.preventDefault();
    if (a === 'search') { var q = $('#pxq').value.trim(); P.q = q; if (!q) { P.sres = null; return void redraw(); } return void s('/items?q=' + encodeURIComponent(q)).then(function (d) { P.sres = { items: d.items || [], chips: d.parsed }; P.sel = null; redraw(); }).catch(function (e) { toast(e.message); }); }
    if (a === 'addtask') { var t = $('#nt').value.trim(); if (!t) return toast('Write the task first'); return void s('/task', { method: 'POST', json: { title: t, due_date: $('#nd').value || undefined, pri: $('#np').value, dom: $('#ndm').value } }).then(function () { P.adding = false; toast('Task added'); return load(true).then(redraw); }).catch(function (e) { toast(e.message); }); }
    if (a === 'entsearch') { P.entq = $('#entq').value.trim(); return void loadEnts(); }
  });
  window.AOSPulse2 = { on: on, view: view, onGo: onGo, state: P };

  /* drag the edge of the Pulse sidebar or the list pane to resize; saved on this device */
  (function () {
    var EDGE = 7, drag = null;
    function saved() { try { return JSON.parse(localStorage.getItem('aos.pxw') || '{}') || {}; } catch (e) { return {}; } }
    function apply() { var s = saved(), r = document.documentElement.style; if (s.side) r.setProperty('--pxs', s.side + 'px'); if (s.list) r.setProperty('--pxl', s.list + 'px'); }
    function pick(e) { var t = e.target.closest && e.target.closest('.pxside, .pxlist'); if (!t || window.innerWidth <= 900) return null; var b = t.getBoundingClientRect(); return (e.clientX >= b.right - EDGE && e.clientX <= b.right + 2) ? t : null; }
    document.addEventListener('mousemove', function (e) { if (drag) return; var t = pick(e); document.querySelectorAll('.pxgrab').forEach(function (x) { if (x !== t) x.classList.remove('pxgrab'); }); if (t) t.classList.add('pxgrab'); });
    document.addEventListener('pointerdown', function (e) {
      var t = pick(e); if (!t) return; var b = t.getBoundingClientRect(); drag = { k: t.classList.contains('pxside') ? 'side' : 'list', x: e.clientX, w: b.width, max: (t.parentElement.getBoundingClientRect().width || 1000) - 320 };
      document.body.classList.add('pxdrag'); e.preventDefault();
    });
    document.addEventListener('pointermove', function (e) {
      if (!drag) return; var lo = drag.k === 'side' ? 150 : 240, hi = Math.max(lo + 20, Math.min(drag.k === 'side' ? 380 : 640, drag.max));
      var w = Math.round(Math.max(lo, Math.min(hi, drag.w + e.clientX - drag.x))); drag.cur = w; document.documentElement.style.setProperty(drag.k === 'side' ? '--pxs' : '--pxl', w + 'px');
    });
    function end() { if (!drag) return; var s = saved(); if (drag.cur) s[drag.k] = drag.cur; try { localStorage.setItem('aos.pxw', JSON.stringify(s)); } catch (e) {} drag = null; document.body.classList.remove('pxdrag'); }
    document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
    document.addEventListener('dblclick', function (e) { var t = pick(e); if (!t) return; var s = saved(); delete s[t.classList.contains('pxside') ? 'side' : 'list']; try { localStorage.setItem('aos.pxw', JSON.stringify(s)); } catch (x) {} document.documentElement.style.removeProperty(t.classList.contains('pxside') ? '--pxs' : '--pxl'); apply(); });
    apply();
  })();
})();
