/* Home page live sections: "Right now" cards, a real Today panel, and every service grouped. Data comes from the connected services only. */
(function () {
  'use strict';
  var A = window.AOS; if (!A) return;
  var S = A.S, esc = A.esc, api = A.api, ic = A.ic;
  var H = { pulse: null, cards: null, rem: null, vpn: null, st: null, at: 0, busy: false };
  function cfg(k) { var c = (S.settings || {})[k]; return !!(c && c.url); }
  function pulseOn() { var c = (S.settings || {}).pulse; return !!(c && c.url && c.user && c.passSet); }
  function ok(p) { return p.then(function (d) { return d; }, function () { return null; }); }
  function load(force) {
    if (H.busy || (!force && Date.now() - H.at < 20000)) return; H.busy = true;
    var go = function () {
      return Promise.all([
        pulseOn() ? ok(api('/api/pulse/s/bootstrap')) : Promise.resolve(null),
        cfg('cards') ? ok(api('/api/cards/stats')) : Promise.resolve(null),
        cfg('cards') ? ok(api('/api/cs/reminders')) : Promise.resolve(null),
        cfg('vpn') ? ok(api('/api/vpn')) : Promise.resolve(null),
        cfg('status') ? ok(api('/api/status')) : Promise.resolve(null)
      ]).then(function (r) { H.pulse = r[0]; H.cards = r[1]; H.rem = r[2]; H.vpn = r[3]; H.st = r[4]; H.at = Date.now(); });
    };
    (S.settings ? Promise.resolve() : api('/api/settings').then(function (s) { S.settings = s; }, function () {})).then(go).then(function () { H.busy = false; if (S.view === 'home') A.redraw(); }, function () { H.busy = false; });
  }
  function onGo(v) { if (v === 'home') load(false); }
  function sv(k) { return (S.settings || {})[k] || {}; }

  function pulseFacts() {
    var b = H.pulse; if (!b) return null;
    var td = (b.now && b.now.today) || '', its = (b.items || []).filter(function (i) { return !i.handled; });
    var tks = (b.tasks || []).filter(function (t) { return t.status !== 'done'; });
    var evs = (b.events || []).filter(function (e) { return e.d === td; }).sort(function (a, c) { return (a.s || 0) - (c.s || 0); });
    return {
      unread: its.filter(function (i) { return !i.read && i.cls !== 'noise'; }).length,
      urgent: its.filter(function (i) { return i.cls === 'urgent'; }),
      reply: its.filter(function (i) { return i.reply && i.cls !== 'urgent'; }),
      due: tks.filter(function (t) { return t.key === 'overdue' || t.key === 'today'; }),
      open: tks.length, evs: evs, mode: b.settings && b.settings.mode
    };
  }
  function hh(h) { var x = Math.floor(h), m = Math.round((h - x) * 60); return ('0' + x).slice(-2) + ':' + ('0' + m).slice(-2); }
  function stat(view, icon, label, value, sub, cls) {
    return '<button class="live" data-act="nav" data-v="' + view + '"><span class="lh">' + ic(icon) + '<em>' + label + '</em></span><b class="' + (cls || '') + '">' + value + '</b><small>' + sub + '</small></button>';
  }
  function right() {
    if (!H.at && !H.busy) setTimeout(function () { load(false); }, 0);
    var out = [], p = pulseFacts(), d = S.ins.data;
    if (pulseOn()) out.push(p ? stat('pulse', 'pulse', 'Pulse', p.unread, p.urgent.length ? p.urgent.length + ' urgent' : 'unread', p.urgent.length ? 'bad' : '') : stat('pulse', 'pulse', 'Pulse', '–', H.busy ? 'loading' : 'not reachable'));
    else out.push(stat('pulse', 'pulse', 'Pulse', '–', 'connect in Settings'));
    if (p) out.push(stat('pulse', 'check', 'Tasks today', p.due.length, p.open + ' open'));
    if (p) { var nx = p.evs[0]; out.push(stat('pulse', 'calendar', 'Next event', nx ? (nx.allDay ? 'All day' : hh(nx.s)) : 'None', nx ? esc(nx.title).slice(0, 28) : 'nothing today')); }
    if (cfg('cards')) {
      var n = H.cards && (H.cards.total != null ? H.cards.total : H.cards.count); var rm = H.rem && (H.rem.reminders || []).length;
      out.push(stat('cards', 'card', 'Cards', n == null ? '–' : n, rm ? rm + ' reminders' : 'contacts'));
    }
    var im = S.imm; out.push(stat('photos', 'photos', 'Photos', S.tl && S.tl.items.length ? S.tl.items.length + '+' : (im && im.connected ? 'OK' : '–'), im && im.connected ? 'library connected' : 'not connected'));
    if (d) { var res = d.resources || [], good = res.filter(function (r) { return r.s === 'ok'; }).length; out.push(stat('insights', 'pulse', 'Cloud', good + '/' + res.length, 'healthy', good < res.length ? 'warn' : '')); }
    if (H.st && H.st.systems) { var up = H.st.systems.filter(function (x) { return x.status === 'up'; }).length; out.push(stat('insights', 'monitor', 'Servers', up + '/' + H.st.systems.length, 'online', up < H.st.systems.length ? 'bad' : '')); }
    if (H.vpn) out.push(stat('vpn', 'shield', 'VPN', (H.vpn.online || 0) + '/' + (H.vpn.total || 0), 'devices online'));
    return '<div class="lives">' + out.join('') + '</div>';
  }
  function today() {
    if (!pulseOn()) return '<div class="today"><div class="eyebrow">Today</div><p style="margin:10px 0 0;font-family:var(--display);font-size:20px;font-weight:500">Connect Pulse to see your day</p><p style="margin:6px 0 0;color:var(--muted);font-size:14.5px">Add your Pulse address, email and password in <a href="#settings" data-act="nav" data-v="settings">Settings</a>.</p></div>';
    var p = pulseFacts(); if (!p) return '<div class="today"><div class="eyebrow">Today</div><p style="margin:10px 0 0;color:var(--muted)">' + (H.busy ? 'Loading your day...' : 'Pulse could not be reached.') + '</p></div>';
    var rows = function (arr, f) { return arr.map(f).join(''); };
    var h = '<div class="today"><div class="eyebrow" style="display:flex;justify-content:space-between"><span>Today</span><button class="link" data-act="nav" data-v="pulse">Open Pulse &rarr;</button></div>';
    h += '<div class="tdh">Events</div>' + (p.evs.length ? rows(p.evs.slice(0, 5), function (e) { return '<div class="trow"><time>' + (e.allDay ? 'All day' : hh(e.s)) + '</time><span>' + esc(e.title) + '</span></div>'; }) : '<p class="tnone">No events today.</p>');
    h += '<div class="tdh">Tasks due</div>' + (p.due.length ? rows(p.due.slice(0, 5), function (t) { return '<div class="trow"><time>' + esc(t.due || '') + '</time><span>' + esc(t.title) + '</span></div>'; }) : '<p class="tnone">Nothing due.</p>');
    var need = p.urgent.concat(p.reply);
    h += '<div class="tdh">Needs you</div>' + (need.length ? rows(need.slice(0, 5), function (i) { return '<button class="trow" data-act="nav" data-v="pulse"><time>' + (i.cls === 'urgent' ? 'Urgent' : 'Reply') + '</time><span>' + esc(i.sum || i.subj || i.from || '') + '</span></button>'; }) : '<p class="tnone">Nothing is waiting for you.</p>');
    return h + '</div>';
  }
  var GROUPS = [
    ['Everyday', [['Pulse', 'pulse', '#pulse', 'Anands Control Center'], ['Photos', 'photos', '#photos', 'Anands Photos'], ['Cards', 'card', '#cards', 'Anands Cards'], ['Drive', 'cloud', '#drive', 'Anands Drive'], ['Vault', 'lock', '#vault', 'Anands Password'], ['Files', 'folder', 'https://files.anands.xyz/api/auth/oidc/login', 'Anands Filemanager', 'files'], ['Documents', 'folder', 'https://paperless.anands.xyz', 'Anands Documents', 'paperless']]],
    ['Servers and network', [['Cloud Insights', 'pulse', '#insights', ''], ['Servers', 'monitor', '#servers', ''], ['VPN', 'shield', '#vpn', 'Anands VPN'], ['Status', 'pulse', 'https://status.anands.xyz', 'Anands Status'], ['Storage', 'folder', 'https://s3-admin.anands.xyz', 'Anands S3 Storage', 'storage']]]
  ];
  function tile(s, state) {
    var st = state(s[3]), OIM = { Pulse: 'pulse', Photos: 'photos', Cards: 'cards', Drive: 'drive', Vault: 'vault', 'AI Chat': 'ai', Files: 'files', 'Cloud Insights': 'insights', Servers: 'servers', VPN: 'vpn', Status: 'status', Storage: 'storage', Money: 'money', Documents: 'paperless', Subscriptions: 'subs', Investments: 'invest', Belongings: 'belong', Household: 'house' }, inner = '<span class="ic' + (OIM[s[0]] ? ' img' : '') + '">' + (OIM[s[0]] ? '<img src="/oicons/' + OIM[s[0]] + '.svg" alt="">' : ic(s[1])) + '</span><span class="tx"><b>' + s[0] + '</b></span><i class="dot ' + st[0] + '" title="' + st[1] + '" role="img" aria-label="' + st[1] + '"></i>';
    if (s[2].charAt(0) === '#') return '<button class="svc" data-act="nav" data-v="' + s[2].slice(1) + '">' + inner + '</button>';
    var L = (S.settings || {}).links || {}, href = (s[4] && L[s[4]]) || s[2];
    return '<a class="svc" href="' + esc(href) + '" target="_blank" rel="noopener">' + inner + '</a>';
  }
  function services(state) {
    var own = window.AOS && AOS.isOwner && AOS.isOwner(), G = own ? GROUPS.concat([['Money', [['Money', 'card', '#money', ''], ['Subscriptions', 'pulse', '#subs', ''], ['Investments', 'pulse', '#invest', ''], ['Belongings', 'folder', '#belong', ''], ['Household', 'folder', '#house', '']]]]) : GROUPS;
    return G.map(function (g) { return '<div class="sech"><h2>' + g[0] + '</h2></div><div class="svcs">' + g[1].map(function (s) { return tile(s, state); }).join('') + '</div>'; }).join('');
  }
  window.AOSHome = { right: right, today: today, services: services, onGo: onGo, load: load, state: H };
  A.homeLoad = load;
})();
