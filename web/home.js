/* Home page live sections: "Right now" cards, and every service grouped. Data comes from the connected services only. */
(function () {
  'use strict';
  var A = window.AOS; if (!A) return;
  var S = A.S, esc = A.esc, api = A.api, ic = A.ic;
  var H = { cards: null, rem: null, vpn: null, st: null, at: 0, busy: false };
  function cfg(k) { var c = (S.settings || {})[k]; return !!(c && c.url); }
  function ok(p) { return p.then(function (d) { return d; }, function () { return null; }); }
  function load(force) {
    if (H.busy || (!force && Date.now() - H.at < 20000)) return; H.busy = true;
    var go = function () {
      return Promise.all([
        cfg('cards') ? ok(api('/api/cards/stats')) : Promise.resolve(null),
        cfg('cards') ? ok(api('/api/cs/reminders')) : Promise.resolve(null),
        cfg('vpn') ? ok(api('/api/vpn')) : Promise.resolve(null),
        cfg('status') ? ok(api('/api/status')) : Promise.resolve(null)
      ]).then(function (r) { H.cards = r[0]; H.rem = r[1]; H.vpn = r[2]; H.st = r[3]; H.at = Date.now(); });
    };
    (S.settings ? Promise.resolve() : api('/api/settings').then(function (s) { S.settings = s; }, function () {})).then(go).then(function () { H.busy = false; if (S.view === 'home') A.redraw(); }, function () { H.busy = false; });
  }
  function onGo(v) { if (v === 'home') load(false); }
  function sv(k) { return (S.settings || {})[k] || {}; }

  function stat(view, icon, label, value, sub, cls) {
    return '<button class="live" data-act="nav" data-v="' + view + '"><span class="lh">' + ic(icon) + '<em>' + label + '</em></span><b class="' + (cls || '') + '">' + value + '</b><small>' + sub + '</small></button>';
  }
  function right() {
    if (!H.at && !H.busy) setTimeout(function () { load(false); }, 0);
    var out = [], d = S.ins.data;
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
  var GROUPS = [
    ['Everyday', [['Pulse', 'pulse', 'https://control.anands.xyz', 'Anands Control Center', 'pulse'], ['Photos', 'photos', '#photos', 'Anands Photos'], ['Drive', 'cloud', '#drive', 'Anands Drive'], ['Vault', 'lock', '#vault', 'Anands Password'], ['Files', 'folder', 'https://files.anands.xyz/api/auth/oidc/login', 'Anands Filemanager', 'files']]],
    ['Servers and network', [['Cloud Insights', 'pulse', '#insights', ''], ['Servers', 'monitor', '#servers', ''], ['VPN', 'shield', '#vpn', 'Anands VPN'], ['Status', 'pulse', 'https://status.anands.xyz', 'Anands Status'], ['Storage', 'folder', 'https://s3-admin.anands.xyz', 'Anands S3 Storage', 'storage']]]
  ];
  function tile(s, state) {
    var st = state(s[3]), OIM = { Pulse: 'pulse', Photos: 'photos', Cards: 'cards', Drive: 'drive', Vault: 'vault', 'AI Chat': 'ai', Files: 'files', 'Cloud Insights': 'insights', Servers: 'servers', VPN: 'vpn', Status: 'status', Storage: 'storage', Money: 'money', Paperless: 'paperless', Links: 'bookmarks', Subscriptions: 'subs', Investments: 'invest', Belongings: 'belong', Household: 'house' }, inner = '<span class="ic' + (OIM[s[0]] ? ' img' : '') + '">' + (OIM[s[0]] ? '<img src="/oicons/' + OIM[s[0]] + '.svg" alt="">' : ic(s[1])) + '</span><span class="tx"><b>' + s[0] + '</b></span><i class="dot ' + st[0] + '" title="' + st[1] + '" role="img" aria-label="' + st[1] + '"></i>';
    if (s[2].charAt(0) === '#') return '<button class="svc" data-act="nav" data-v="' + s[2].slice(1) + '">' + inner + '</button>';
    var L = (S.settings || {}).links || {}, href = (s[4] && L[s[4]]) || s[2];
    return '<a class="svc" href="' + esc(href) + '" target="_blank" rel="noopener">' + inner + '</a>';
  }
  function services(state) {
    var own = window.AOS && AOS.isOwner && AOS.isOwner(), G = own ? GROUPS.concat([['Money', [['Money', 'card', '#money', ''], ['Subscriptions', 'pulse', '#subs', ''], ['Investments', 'pulse', '#invest', ''], ['Belongings', 'folder', '#belong', ''], ['Household', 'folder', '#house', ''], ['Paperless', 'folder', '#paperless', ''], ['Links', 'folder', '#bookmarks', '']]]]) : GROUPS;
    return G.map(function (g) { return '<div class="sech"><h2>' + g[0] + '</h2></div><div class="svcs">' + g[1].map(function (s) { return tile(s, state); }).join('') + '</div>'; }).join('');
  }
  window.AOSHome = { right: right, services: services, onGo: onGo, load: load, state: H };
  A.homeLoad = load;
})();
