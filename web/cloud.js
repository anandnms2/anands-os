/* Cloud tab of Insights. One status strip, projects that fold away, the latest changes, and a set of insight cards
 * (backups, deploy reliability, the server itself, updates, domains and certificates). Data comes from /api/insights. */
(function () {
  'use strict';
  var A = window.AOS; if (!A) return;
  var S = A.S, $ = A.$, esc = A.esc, ic = A.ic;
  var U = { open: {}, more: false };
  var FILTERS = [['all', 'All'], ['app', 'Apps'], ['service', 'Services'], ['db', 'Databases'], ['nohc', 'No health check'], ['bad', 'Not healthy']];

  /* ---------- small helpers ---------- */
  function mmss(s) { return s == null ? 'n/a' : Math.floor(s / 60) + 'm ' + ('0' + (s % 60)).slice(-2) + 's'; }
  function ago(iso) { if (!iso) return 'never'; var s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000); if (s < 90) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; var d = Math.round(s / 86400); return d === 1 ? 'yesterday' : d + ' days ago'; }
  function when(iso) { var d = new Date(iso); if (isNaN(d)) return ''; var same = d.toDateString() === new Date().toDateString(); return A.fmt(d, same ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function dur(sec) { if (sec == null) return '–'; var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600); return d ? d + ' days' : h + ' h'; }
  function mb(v) { return v == null ? '–' : v >= 1024 ? (v / 1024).toFixed(1) + ' GB' : Math.round(v) + ' MB'; }
  function pc(v) { return v == null ? '–' : (v >= 10 ? Math.round(v) : v.toFixed(1)) + '%'; }
  var dot = function (c) { return '<i class="dot' + (c ? ' ' + c : '') + '"></i>'; };
  var tone = function (v) { return v == null ? '' : v >= 90 ? 'bad' : v >= 75 ? 'warn' : ''; };
  var kv = function (rows) { return '<div class="cl-kv">' + rows.map(function (r) { return '<span>' + r[0] + '</span><b' + (r[2] ? ' class="' + r[2] + '"' : '') + '>' + r[1] + '</b>'; }).join('') + '</div>'; };
  var meter = function (label, v, text) { return '<div class="cl-m"><span>' + esc(label) + '</span><div class="track"><div class="fill ' + tone(v) + '" style="width:' + Math.max(2, Math.min(100, v || 0)) + '%"></div></div><b class="mono">' + esc(text == null ? pc(v) : text) + '</b></div>'; };
  var card = function (title, tag, body, cls) { return '<article class="card cl-card' + (cls ? ' ' + cls : '') + '"><header><h2>' + title + '</h2>' + (tag ? '<span class="cl-tag">' + tag + '</span>' : '') + '</header>' + body + '</article>'; };
  function bars(vals, fails, label) {
    var mx = Math.max.apply(null, vals.concat([1]));
    return '<div class="cl-spark" role="img" aria-label="' + esc(label) + '">' + vals.map(function (v, i) { return '<i' + (fails && fails[i] ? ' class="f"' : '') + ' style="height:' + Math.max(v ? 6 : 3, v / mx * 100) + '%"></i>'; }).join('') + '</div>';
  }

  /* ---------- the status strip ---------- */
  function strip(d, R, ok, nohc, bad) {
    var sv = d.server, tot = R.length || 1, projects = d.projects;
    var rch = sv.reachable === false ? 'Unreachable' : sv.reachable ? 'reachable' : 'status unknown';
    var head = bad.length ? bad.length + ' not healthy' : nohc.length ? ok + ' of ' + R.length + ' healthy' : 'All ' + R.length + ' healthy';
    var dc = bad.length || sv.reachable === false ? 'bad' : nohc.length ? 'warn' : '';
    var tags = [];
    if (bad.length) tags.push(['bad', bad.length + ' not healthy: ' + bad.map(function (r) { return r.n; }).join(', ')]);
    var failed = d.deploys.filter(function (x) { return x.status === 'failed'; }); var lastFail = failed[0];
    if (lastFail && Date.now() - Date.parse(lastFail.at) < 3 * 86400e3) tags.push(['bad', 'Deployment failed: ' + lastFail.app + ', ' + ago(lastFail.at)]);
    var nb = (d.backups || []).filter(function (b) { return !b.scheduled; });
    if (nb.length) tags.push(['warn', nb.length + (nb.length > 1 ? ' databases have' : ' database has') + ' no backup scheduled: ' + nb.map(function (b) { return b.name; }).join(', ')]);
    if (nohc.length) tags.push(['warn', nohc.length + ' without a health check: ' + nohc.map(function (r) { return r.n; }).join(', ')]);
    var soon = ((d.domains || {}).certs || []).filter(function (c) { return c.days != null && c.days < 14; });
    if (soon.length) tags.push([soon.some(function (c) { return c.days < 5; }) ? 'bad' : 'warn', 'Certificate ends soon: ' + soon.map(function (c) { return c.host + ' (' + c.days + ' d)'; }).join(', ')]);
    var b = d.box; if (b && b.disk >= 85) tags.push([b.disk >= 92 ? 'bad' : 'warn', 'Server disk is ' + pc(b.disk) + ' full']);
    if (b && b.updates && b.updates.security) tags.push(['warn', b.updates.security + ' security update' + (b.updates.security > 1 ? 's' : '') + ' waiting on the server']);
    var taken = A.fmt(new Date(d.takenAt), { hour: '2-digit', minute: '2-digit' });
    return '<section class="cl-strip card" aria-label="Overall status"><div class="cl-big"><i class="dot ' + dc + '"></i><span>' + esc(head) + '</span></div>' +
      '<div class="cl-meta"><span>Server <b>' + esc(sv.name) + '</b>' + (sv.ip ? ' · <span class="mono">' + esc(sv.ip) + '</span>' : '') + ' · ' + rch + '</span><span><b>' + R.length + '</b> resources in <b>' + projects + '</b> project' + (projects === 1 ? '' : 's') + '</span><span>Updated ' + esc(taken) + '</span></div>' +
      '<div class="statusbar" role="img" aria-label="' + ok + ' healthy, ' + nohc.length + ' no health check, ' + bad.length + ' not healthy"><i style="width:' + (ok / tot * 100) + '%;background:var(--ok)"></i><i style="width:' + (nohc.length / tot * 100) + '%;background:var(--warn)"></i><i style="width:' + (bad.length / tot * 100) + '%;background:var(--bad)"></i></div>' +
      (tags.length ? '<div class="cl-look">' + tags.map(function (t) { return '<span class="cl-chip ' + t[0] + '">' + dot(t[0]) + esc(t[1]) + '</span>'; }).join('') + '</div>' : '<p class="note" style="margin:0">Nothing needs attention.</p>') + '</section>';
  }

  /* ---------- projects ---------- */
  function projects(d, R) {
    var q = (S.rq || '').toLowerCase(), f = S.rf || 'all';
    var pass = function (r) { if (f === 'nohc' && r.s !== 'nohc') return false; if (f === 'bad' && r.s !== 'bad') return false; if (f === 'app' && r.t !== 'App') return false; if (f === 'service' && r.t !== 'Service') return false; if (f === 'db' && r.t !== 'Database') return false; return !q || (r.n + ' ' + r.p + ' ' + r.d + ' ' + r.r).toLowerCase().indexOf(q) > -1; };
    var names = []; R.forEach(function (r) { if (names.indexOf(r.p) < 0) names.push(r.p); }); names.sort(function (a, b) { return R.filter(function (r) { return r.p === b; }).length - R.filter(function (r) { return r.p === a; }).length; });
    var any = false, out = names.map(function (p) {
      var all = R.filter(function (r) { return r.p === p; }), rows = all.filter(pass); if (!rows.length) return ''; any = true;
      var attn = all.some(function (r) { return r.s !== 'ok'; });
      var open = U.open[p] != null ? U.open[p] : (!!q || (f !== 'all') || attn);
      return '<div class="cl-grp" data-open="' + open + '"><button type="button" data-cl="grp" data-p="' + esc(p) + '" aria-expanded="' + open + '">' + ic('chev') + '<span class="nm">' + esc(p) + '</span><span class="cl-dots" aria-hidden="true">' + all.map(function (r) { return dot(r.s === 'ok' ? '' : r.s === 'bad' ? 'bad' : 'warn'); }).join('') + '</span><span class="mono note">' + all.length + '</span></button>' +
        (open ? '<div class="cl-rows">' + rows.map(function (r) { return '<div class="cl-row">' + dot(r.s === 'ok' ? '' : r.s === 'bad' ? 'bad' : 'warn') + '<span class="n" title="' + esc(r.t + (r.r ? ' · ' + r.r : '')) + '">' + esc(r.n) + '<small>' + esc(r.t) + (r.r ? ' · ' + esc(r.r.replace(/^.*\//, '')) : '') + '</small></span>' + (r.d ? '<a href="https://' + esc(r.d) + '" target="_blank" rel="noopener">' + esc(r.d) + '</a>' : '<span class="note">no domain</span>') + '</div>'; }).join('') + '</div>' : '') + '</div>';
    }).join('');
    var chips = FILTERS.map(function (x) { return '<button class="chip" data-cl="rf" data-f="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + '</button>'; }).join('');
    return '<section class="card" aria-label="Resources by project"><header class="cl-h"><h2>Projects</h2><div class="search">' + ic('search') + '<input class="input" id="rq" type="search" placeholder="Find an app, service or domain" value="' + esc(S.rq || '') + '" data-cin="rq" aria-label="Find a resource"></div></header><div class="chips" style="margin-bottom:6px">' + chips + '</div>' + (any ? out : '<p class="note" style="margin:10px 0 0">Nothing matches.</p>') + '</section>';
  }

  /* ---------- latest changes: same commit built for two apps shows once ---------- */
  function changes(d) {
    var groups = [];
    d.deploys.forEach(function (x) {
      var key = (x.sha || (x.msg || '').slice(0, 40)) + '|' + (x.status || '');
      var g = groups.filter(function (y) { return y.key === key && Math.abs(Date.parse(y.at) - Date.parse(x.at)) < 20 * 60e3; })[0];
      if (g) { if (g.apps.indexOf(x.app) < 0) g.apps.push(x.app); g.sec = Math.max(g.sec || 0, x.sec || 0) || null; } else groups.push({ key: key, apps: [x.app], msg: String(x.msg || '').split('\n')[0].trim(), at: x.at, sec: x.sec, status: x.status });
    });
    var show = U.more ? groups.length : 4, rest = groups.length - 4;
    var rows = groups.slice(0, show).map(function (g) {
      var st = g.status && g.status !== 'finished' ? (g.status === 'failed' ? 'bad' : 'warn') : '';
      return '<div class="cl-act">' + dot(st) + '<div style="min-width:0"><b>' + esc(g.apps.join(', ')) + (st ? ' <span class="pill ' + st + '" style="font-size:11px">' + esc(g.status) + '</span>' : '') + '</b><div class="m" title="' + esc(g.msg) + '">' + esc(g.msg || '(no message)') + '</div></div><div class="t">' + esc(when(g.at)) + '<span class="mono">' + mmss(g.sec) + '</span></div></div>';
    }).join('') || '<p class="note">No deployment history returned.</p>';
    return '<section class="card" aria-label="Latest changes"><header class="cl-h"><h2>Latest changes</h2><span class="note" style="margin-left:auto">newest first, build time on the right</span></header>' + rows + (rest > 0 ? '<button class="cl-more" data-cl="more">' + (U.more ? 'Show fewer' : 'Show ' + rest + ' more') + '</button>' : '') + '</section>';
  }

  /* ---------- insight cards ---------- */
  function cards(d) {
    var out = [], st = d.stats, b = d.box, dm = d.domains;
    var bk = d.backups || [];
    if (bk.length) {
      var lines = bk.map(function (x) {
        var s, c = '';
        if (!x.scheduled) { s = 'No backup scheduled'; c = 'bad'; }
        else if (!x.last) { s = 'Scheduled, no run yet'; c = 'warn'; }
        else if (/fail|error/i.test(x.last.status || '')) { s = 'Last backup failed, ' + ago(x.last.at); c = 'bad'; }
        else { var old = Date.now() - Date.parse(x.last.at) > 36 * 3600e3; s = ago(x.last.at) + (x.last.size ? ' · ' + A.bytes(x.last.size) : ''); c = old ? 'warn' : 'ok'; }
        return [esc(x.name), esc(s), c];
      });
      var bad = bk.some(function (x) { return !x.scheduled; });
      out.push(card('Backups', bad ? '<span class="pill bad">Needs attention</span>' : '', kv(lines) + (bad ? '<p class="note">Set up a scheduled backup in Coolify under each database, then it shows its last run here.</p>' : ''), bad ? 'hot' : ''));
    }
    if (st && st.count) {
      out.push(card('Deploy reliability', 'last ' + st.window + ' days', kv([['Success rate', st.rate == null ? '–' : st.rate + '%', st.rate != null && st.rate < 90 ? 'warn' : ''], ['Deployments', st.count + (st.failed ? ' (' + st.failed + ' failed)' : ''), st.failed ? 'warn' : ''], ['Average build', mmss(st.avgSec)], ['Slowest', st.slowest ? mmss(st.slowest.sec) + ' · ' + esc(st.slowest.app) : '–']]) + bars(st.perDay, st.failDay, 'Deployments per day for the last 30 days')));
    }
    if (b) {
      out.push(card('Server now', 'from Status', meter('CPU', b.cpu) + meter('Memory', b.mem) + meter('Disk', b.disk) + '<p class="note" style="margin:0">Up ' + dur(b.uptime) + (b.load ? ' · load ' + b.load.join(' ') : '') + (b.temp != null ? ' · ' + b.temp + ' °C' : '') + '</p>'));
      var up = b.updates, svc = b.services;
      out.push(card('Needs updating', 'from Status', kv([['OS packages', up ? up.total + (up.security ? ' (' + up.security + ' security)' : '') : '–', up && up.security ? 'warn' : ''], ['Container images', b.containers ? (b.imageUpdates ? b.imageUpdates + ' have a newer version' : 'all current') : '–', b.imageUpdates ? 'warn' : ''], ['Failed system services', svc ? String(svc.failed) : '–', svc && svc.failed ? 'bad' : '']])));
      if (b.top && b.top.length) { var mx = Math.max.apply(null, b.top.map(function (x) { return x.mem || 0; }).concat([1])); out.push(card('Biggest containers', 'by memory', b.top.map(function (x) { return meter(x.name, (x.mem || 0) / mx * 100, mb(x.mem)).replace('class="fill ', 'class="fill n '); }).join(''))); }
    } else out.push(card('Server details', '', '<p class="note" style="margin:0 0 10px">CPU, memory, disk, pending updates and the heaviest containers come from Status (Beszel).</p><button class="btn sm" data-act="nav" data-v="settings">Connect Status</button>'));
    if (dm && dm.total) {
      var c0 = (dm.certs || []).filter(function (c) { return c.days != null; })[0];
      out.push(card('Domains and HTTPS', '', kv([['Apps with a domain', dm.withDomain + ' of ' + dm.total], ['No domain set', dm.none.length ? esc(dm.none.join(', ')) : 'none'], ['Next certificate to end', c0 ? esc(c0.host) + ' in ' + c0.days + ' days' : 'not readable', c0 && c0.days < 14 ? 'warn' : '']])));
    }
    if (st && st.last && st.last.length) {
      out.push(card('Last deployed', 'oldest first', kv(st.last.slice(0, 5).map(function (x) { var days = x.at ? (Date.now() - Date.parse(x.at)) / 86400e3 : null; return [esc(x.app), x.at ? ago(x.at) : 'no history', days != null && days > 14 ? 'warn' : '']; })) + '<p class="note">Apps nobody has touched for a while.</p>'));
    }
    if (st && st.trend && st.trend.length > 2) {
      out.push(card('Build time trend', 'latest ' + st.trend.length + ' builds', bars(st.trend.map(function (x) { return x.sec; }), null, 'Build time of the latest builds') + '<p class="note">Shows a build slowly getting heavier. Slowest bar: ' + mmss(Math.max.apply(null, st.trend.map(function (x) { return x.sec; }))) + '.</p>'));
    }
    return '<div class="cl-ins">' + out.join('') + '</div>';
  }

  /* ---------- page ---------- */
  function view(head, d) {
    var R = d.resources, ok = R.filter(function (r) { return r.s === 'ok'; }).length, nohc = R.filter(function (r) { return r.s === 'nohc'; }), bad = R.filter(function (r) { return r.s === 'bad'; });
    return head + strip(d, R, ok, nohc, bad) + '<div class="cl-cols">' + projects(d, R) + changes(d) + '</div>' + cards(d) + '</div>';
  }
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-cl]'); if (!el) return; var a = el.getAttribute('data-cl');
    if (a === 'grp') { var p = el.getAttribute('data-p'), cur = el.getAttribute('aria-expanded') === 'true'; U.open[p] = !cur; return void A.redraw(); }
    if (a === 'rf') { S.rf = el.getAttribute('data-f'); return void A.redraw(); }
    if (a === 'more') { U.more = !U.more; return void A.redraw(); }
  });
  document.addEventListener('input', function (ev) { var t = ev.target; if (!t.getAttribute || t.getAttribute('data-cin') !== 'rq') return; S.rq = t.value; var pos = t.selectionStart; A.redraw(); var n = document.getElementById('rq'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { } } });
  window.AOSCloud = { view: view };
})();
