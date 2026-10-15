/* Servers: the full Beszel analytics inside the OS. Systems, per-server history charts (1 hour to 30 days), containers, systemd services,
 * S.M.A.R.T. disks, alerts (rules, history, quiet hours), and network probes. All data comes through this server's /api/status routes. */
(function () {
  'use strict';
  var A = window.AOS; if (!A) return;
  var S = A.S, $ = A.$, esc = A.esc, api = A.api, toast = A.toast, ic = A.ic;
  var I = { tab: 'systems', q: '', filter: 'all', id: null, dtab: 'overview', range: '1m', det: null, ct: null, sv: null, sm: null, al: null, pr: null, busy: {}, err: {}, svq: '', svf: 'all', open: {} };
  var RANGES = [['1m', '1 hour'], ['10m', '12 hours'], ['20m', '24 hours'], ['120m', '1 week'], ['480m', '30 days']];
  var COL = ['var(--accent)', '#4fa3ff', '#3ecf8e', '#b58cff', '#f5b83d', '#ff6b6b', '#5fd6d6', '#e58bd8', '#9fb3c8', '#c8a96b', '#7bd36b', '#d98c5f'];
  var CH = {}, chN = 0;

  /* ---------- formatting ---------- */
  var num = function (v) { return v == null || isNaN(v) ? null : +v; };
  function bps(v) { v = num(v); if (v == null) return '–'; var u = ['B/s', 'KB/s', 'MB/s', 'GB/s'], i = 0; while (v >= 1024 && i < 3) { v /= 1024; i++; } return (v >= 100 || !i ? Math.round(v) : v.toFixed(1)) + ' ' + u[i]; }
  function by(v) { v = num(v); if (v == null) return '–'; var u = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0; while (v >= 1024 && i < 4) { v /= 1024; i++; } return (v >= 100 || !i ? Math.round(v) : v.toFixed(1)) + ' ' + u[i]; }
  function gb(v) { v = num(v); return v == null ? '–' : (v >= 100 ? Math.round(v) : v.toFixed(v < 10 ? 2 : 1)) + ' GB'; }
  var pct = function (v) { v = num(v); return v == null ? '–' : (v >= 10 ? Math.round(v) : v.toFixed(1)) + '%'; };
  function dur(sec) { if (sec == null) return '–'; var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60); return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + m + 'm' : m + 'm'; }
  function ago(iso) { if (!iso) return 'never'; var s = Math.max(0, (Date.now() - ts(iso)) / 1000); if (s < 60) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' d ago'; }
  function ts(s) { return new Date(String(s).replace(' ', 'T')).getTime(); }
  var tone = function (v) { return v == null ? '' : v >= 90 ? 'bad' : v >= 75 ? 'warn' : ''; };
  var bar = function (label, v, w) { return '<div class="ibar"' + (w ? ' style="grid-template-columns:' + w + 'px 1fr 42px"' : '') + '><span>' + label + '</span><div class="track"><div class="fill ' + tone(v) + '" style="width:' + Math.min(100, v || 0) + '%"></div></div><b class="mono">' + pct(v) + '</b></div>'; };
  var pill = function (t, c) { return '<span class="pill ' + (c || '') + '">' + esc(t) + '</span>'; };
  var stPill = function (s) { return s === 'up' ? pill('Up', 'ok') : s === 'down' ? pill('Down', 'bad') : s === 'paused' ? pill('Paused') : pill('Waiting', 'warn'); };
  function tlabel(iso, range) { var d = new Date(ts(iso)); return range === '1m' || range === '10m' ? A.fmt(d, { hour: '2-digit', minute: '2-digit' }) : range === '20m' ? A.fmt(d, { hour: '2-digit', minute: '2-digit' }) : A.fmt(d, { day: 'numeric', month: 'short' }); }

  /* ---------- charts: SVG lines with a hover read-out ---------- */
  /* spec: {title, t:[iso], series:[{name,v:[],color}], fmt(v), max?, min?, stacked?, area?, note?} */
  function chart(spec) {
    var id = 'ch' + (++chN), W = 600, H = 150, L = 4, R = 4, T = 8, B = 4, n = spec.t.length;
    var live = spec.series.filter(function (s) { return s.v.some(function (x) { return x != null; }); });
    if (!n || !live.length) return '<div class="card ichart"><div class="ich-h"><b>' + esc(spec.title) + '</b></div><p class="note" style="margin:10px 0 4px">No data for this range yet.</p></div>';
    var stack = spec.stacked, tot = []; if (stack) for (var k = 0; k < n; k++) tot[k] = live.reduce(function (a, s) { return a + (num(s.v[k]) || 0); }, 0);
    var mx = spec.max != null ? spec.max : Math.max.apply(null, stack ? tot : live.map(function (s) { return Math.max.apply(null, s.v.filter(function (x) { return x != null; })); }).concat([0])); if (!(mx > 0)) mx = 1;
    if (spec.max == null) mx = nice(mx);
    var X = function (i) { return n < 2 ? W / 2 : L + i * (W - L - R) / (n - 1); }, Y = function (v) { return T + (H - T - B) * (1 - Math.min(v, mx) / mx); };
    var paths = '', base = new Array(n).fill(0);
    live.forEach(function (s, si) {
      var col = s.color || COL[si % COL.length], d = '', top = [], run = false;
      for (var i = 0; i < n; i++) { var v = num(s.v[i]); if (v == null) { run = false; continue; } var tv = stack ? base[i] + v : v; top[i] = tv; d += (run ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(tv).toFixed(1); run = true; }
      if (stack || spec.area) { var up = '', dn = ''; for (var j = 0; j < n; j++) if (top[j] != null) { up += (up ? 'L' : 'M') + X(j).toFixed(1) + ' ' + Y(top[j]).toFixed(1); dn = 'L' + X(j).toFixed(1) + ' ' + Y(stack ? base[j] : 0).toFixed(1) + dn; } paths += '<path d="' + up + dn + 'Z" fill="' + col + '" opacity="' + (stack ? '.55' : '.12') + '"/>'; }
      if (!stack) paths += '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="1.8" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
      if (stack) for (var q = 0; q < n; q++) base[q] = top[q] != null ? top[q] : base[q];
    });
    var grid = [0, .5, 1].map(function (f) { var y = Y(mx * f); return '<line x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>'; }).join('');
    var fmt = spec.fmt || function (v) { return String(v); };
    CH[id] = { t: spec.t, series: live.map(function (s, si) { return { name: s.name, v: s.v, color: s.color || COL[si % COL.length] }; }), fmt: fmt, range: I.range, n: n, W: W, L: L, R: R, stack: !!stack };
    var legend = live.length > 1 || spec.legend ? '<div class="ich-lg">' + live.map(function (s, si) { return '<span><i style="background:' + (s.color || COL[si % COL.length]) + '"></i>' + esc(s.name) + '</span>'; }).join('') + '</div>' : '';
    return '<div class="card ichart"><div class="ich-h"><b>' + esc(spec.title) + '</b>' + (spec.note ? '<span class="note">' + spec.note + '</span>' : '') + '</div>' +
      '<div class="ich-plot" data-ch="' + id + '"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="ich-svg" role="img" aria-label="' + esc(spec.title) + '">' + grid + paths + '<line class="ich-x" x1="0" x2="0" y1="0" y2="' + H + '" stroke="var(--muted)" stroke-width="1" vector-effect="non-scaling-stroke" style="display:none"/></svg>' +
      '<span class="ich-y ich-ytop">' + esc(fmt(mx)) + '</span><span class="ich-y ich-ybot">' + esc(fmt(0)) + '</span><div class="ich-tip" hidden></div></div>' +
      '<div class="ich-ax"><span>' + tlabel(spec.t[0], I.range) + '</span><span>' + tlabel(spec.t[Math.floor(n / 2)], I.range) + '</span><span>' + tlabel(spec.t[n - 1], I.range) + '</span></div>' + legend + '</div>';
  }
  function nice(v) { var p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
  document.addEventListener('pointermove', function (ev) {
    var plot = ev.target.closest && ev.target.closest('.ich-plot'); var all = document.querySelectorAll('.ich-plot .ich-x'); if (!plot) { all.forEach(function (x) { x.style.display = 'none'; }); document.querySelectorAll('.ich-tip').forEach(function (t) { t.hidden = true; }); return; }
    var c = CH[plot.getAttribute('data-ch')]; if (!c) return; var r = plot.getBoundingClientRect(), f = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), i = Math.round(f * (c.n - 1));
    var line = plot.querySelector('.ich-x'), x = c.n < 2 ? c.W / 2 : c.L + i * (c.W - c.L - c.R) / (c.n - 1); line.setAttribute('x1', x); line.setAttribute('x2', x); line.style.display = '';
    var tip = plot.querySelector('.ich-tip'); tip.hidden = false;
    tip.innerHTML = '<b>' + esc(A.fmt(new Date(ts(c.t[i])), c.range === '1m' || c.range === '10m' || c.range === '20m' ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit' })) + '</b>' + c.series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + (c.series.length > 1 ? esc(s.name) + ' ' : '') + esc(s.v[i] == null ? '–' : c.fmt(s.v[i])) + '</span>'; }).join('');
    tip.style.left = Math.min(Math.max(0, f * r.width - 70), r.width - 150) + 'px';
  });

  /* ---------- data loading ---------- */
  function get(key, url, set, quiet) {
    I.busy[key] = true; if (!quiet) A.redraw();
    return api(url).then(function (d) { set(d); I.err[key] = null; }).catch(function (e) { I.err[key] = e.message; if (e.code === 'not_configured') I.err[key] = 'not_configured'; }).then(function () { I.busy[key] = false; if (S.view === 'servers' && !(quiet && document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) A.redraw(); });
  }
  function loadSystems(quiet) { var st = window.AOSInt && window.AOSInt.state.st; return get('sys', '/api/status' + (quiet ? '' : '?refresh=1'), function (d) { st.data = d; st.error = null; st.code = null; }, quiet); }
  function loadDetail(quiet) {
    var id = I.id; if (!id) return; var r = I.range;
    var p = [get('det', '/api/status/system?id=' + id + '&range=' + r, function (d) { if (I.id === id && I.range === r) I.det = d; }, quiet)];
    if (I.dtab === 'containers') p.push(get('ct', '/api/status/containers?id=' + id + '&range=' + r, function (d) { I.ct = d; }, quiet));
    if (I.dtab === 'services') p.push(get('sv', '/api/status/services?id=' + id, function (d) { I.sv = d; }, quiet));
    if (I.dtab === 'disks') p.push(get('sm', '/api/status/smart?id=' + id, function (d) { I.sm = d; }, quiet));
    if (I.dtab === 'alerts') p.push(loadAlerts(quiet));
    return Promise.all(p);
  }
  function loadAlerts(quiet) { return get('al', '/api/status/alerts', function (d) { I.al = d; }, quiet); }
  function loadProbes(quiet) { return get('pr', '/api/status/probes', function (d) { I.pr = d; }, quiet); }
  function sysData() { var st = window.AOSInt && window.AOSInt.state.st; return st && st.data; }

  /* ---------- fleet view ---------- */
  function fleet() {
    var d = sysData(), st = window.AOSInt.state.st;
    var tabs = [['systems', 'Systems'], ['alerts', 'Alerts'], ['probes', 'Network probes']].map(function (t) { return '<button class="chip" data-sa="tab" data-t="' + t[0] + '" aria-pressed="' + (I.tab === t[0]) + '">' + t[1] + (t[0] === 'alerts' && d && d.alertsFiring ? ' <b style="color:var(--bad)">' + d.alertsFiring + '</b>' : '') + '</button>'; }).join('');
    var head = '<div class="wrap"><div class="pagehead"><div><h1>Insights</h1></div><div style="display:flex;gap:10px"><button class="btn" data-sa="refresh">' + (I.busy.sys ? 'Refreshing...' : 'Refresh') + '</button></div></div>' + A.insTabs('servers') + '<div class="chips" style="margin-bottom:16px">' + tabs + '</div>';
    if (!d) {
      if (st.loading || I.busy.sys) return head + '<p class="note">Loading from Status...</p></div>';
      if (st.code === 'not_configured' || I.err.sys === 'not_configured') return head + '<div class="card"><h2 style="font-size:20px;margin-bottom:6px">Status is not connected yet</h2><p class="note" style="margin:0 0 14px">Add your Status (Beszel) address and a user in Settings.</p><button class="btn primary" data-act="nav" data-v="settings">Open Settings</button></div></div>';
      return head + '<div class="banner"><i class="dot bad"></i><span>' + esc(st.error || I.err.sys || 'Could not load.') + '</span></div></div>';
    }
    if (I.tab === 'alerts') return head + alertsPage() + '</div>';
    if (I.tab === 'probes') return head + probesPage() + '</div>';
    var sy = d.systems, up = sy.filter(function (s) { return s.status === 'up'; });
    var avg = function (k) { var l = up.map(function (s) { return s[k]; }).filter(function (v) { return v != null; }); return l.length ? l.reduce(function (a, b) { return a + b; }, 0) / l.length : null; };
    var rows = sy.filter(function (s) { if (I.filter !== 'all' && s.status !== I.filter) return false; return !I.q || (s.name + ' ' + s.host).toLowerCase().indexOf(I.q.toLowerCase()) > -1; });
    var kp = function (n, l, c) { return '<div class="card kpi"><div class="stat"><span class="n"' + (c ? ' style="color:' + c + '"' : '') + '>' + n + '</span><span class="l">' + l + '</span></div></div>'; };
    var f = [['all', 'All'], ['up', 'Up'], ['down', 'Down'], ['paused', 'Paused'], ['pending', 'Waiting']].map(function (x) { return '<button class="chip" data-sa="filter" data-f="' + x[0] + '" aria-pressed="' + (I.filter === x[0]) + '">' + x[1] + '</button>'; }).join('');
    var tbl = '<div class="tablewrap"><table class="srvtbl"><thead><tr><th>System</th><th>State</th><th>CPU</th><th>Memory</th><th>Disk</th><th>Network</th><th>Load</th><th>Temp</th><th>Uptime</th></tr></thead><tbody>' + rows.map(function (s) {
      return '<tr class="clk" data-sa="open" data-id="' + esc(s.id) + '" tabindex="0"><td><b>' + esc(s.name) + '</b><div class="mono note">' + esc(s.host || '') + '</div></td><td>' + stPill(s.status) + (s.alerts.some(function (a) { return a.triggered; }) ? ' ' + pill('Alert', 'bad') : '') + '</td><td>' + (s.status === 'up' ? bar('', s.cpu, 0) : '–') + '</td><td>' + (s.status === 'up' ? bar('', s.mem, 0) : '–') + '</td><td>' + (s.status === 'up' ? bar('', s.disk, 0) : '–') + '</td><td class="mono note">' + (s.net != null ? bps(s.net) : '–') + '</td><td class="mono note">' + (s.load ? s.load.join(' ') : '–') + '</td><td class="mono note">' + (s.temp != null ? s.temp + ' °C' : '–') + '</td><td class="note">' + (s.status === 'up' ? dur(s.uptime) : ago(s.updated)) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    return head + '<div class="kpis">' + kp(sy.length, 'systems') + kp(d.up, 'up', 'var(--ok)') + kp(d.down, 'down', d.down ? 'var(--bad)' : '') + kp(d.alertsFiring, 'alerts firing', d.alertsFiring ? 'var(--warn)' : '') + kp(pct(avg('cpu')), 'average CPU') + kp(pct(avg('mem')), 'average memory') + '</div>' +
      '<div class="toolbar"><div class="search">' + ic('search') + '<input class="input" id="sq" type="search" placeholder="Filter systems" value="' + esc(I.q) + '" data-sin="q" aria-label="Filter systems"></div><div class="chips">' + f + '</div></div>' + (rows.length ? tbl : '<div class="empty"><h2>No systems match</h2></div>') + '</div>';
  }

  /* ---------- one system ---------- */
  function detailView() {
    var d = I.det, s0 = (sysData() ? sysData().systems : []).filter(function (x) { return x.id === I.id; })[0] || (d && d.system) || { name: 'Server', status: 'pending' };
    var tabs = [['overview', 'Overview'], ['containers', 'Containers'], ['services', 'Services'], ['disks', 'Disks'], ['alerts', 'Alerts']].map(function (t) { return '<button class="chip" data-sa="dtab" data-t="' + t[0] + '" aria-pressed="' + (I.dtab === t[0]) + '">' + t[1] + '</button>'; }).join('');
    var rseg = '<div class="seg" role="group" aria-label="Time range">' + RANGES.map(function (r) { return '<button data-sa="range" data-r="' + r[0] + '" aria-pressed="' + (I.range === r[0]) + '">' + r[1] + '</button>'; }).join('') + '</div>';
    var head = '<div class="wrap"><div class="winbar" style="margin-bottom:14px"><button class="btn sm" data-sa="back">' + ic('back') + 'Servers</button><div><b style="font-family:var(--display);font-size:24px;font-weight:500">' + esc(s0.name) + '</b> ' + stPill(s0.status) + '<div class="mono note">' + esc(s0.host || '') + (d && d.info.connection ? ' · ' + d.info.connection : '') + '</div></div><span style="flex:1"></span><button class="btn sm" data-sa="pause" data-p="' + (s0.status === 'paused' ? '0' : '1') + '">' + (s0.status === 'paused' ? 'Resume monitoring' : 'Pause monitoring') + '</button></div><div class="toolbar" style="margin-bottom:14px"><div class="chips">' + tabs + '</div>' + (I.dtab === 'overview' || I.dtab === 'containers' ? '<span style="margin-left:auto">' + rseg + '</span>' : '') + '</div>';
    if (!d) return head + (I.err.det ? '<div class="banner"><i class="dot bad"></i><span>' + esc(I.err.det) + '</span></div>' : '<p class="note">Loading...</p>') + '</div>';
    var body = I.dtab === 'overview' ? overview(d) : I.dtab === 'containers' ? containers(d) : I.dtab === 'services' ? services() : I.dtab === 'disks' ? disks(d) : sysAlerts(s0);
    return head + body + '</div>';
  }
  function overview(d) {
    var P = d.series, t = P.map(function (p) { return p.t; }), col = function (f) { return P.map(f); }, L = d.last || {}, i = d.info, sy = d.system;
    var ser = function (name, f, color) { return { name: name, v: col(f), color: color }; };
    var out = '<div class="grid ich-grid">';
    var kv = '<div class="card"><h2 style="font-size:17px;margin-bottom:10px">System</h2><div class="ikv">' + [['OS', i.os], ['Kernel', i.kernel], ['CPU', i.cpu ? i.cpu + (i.cores ? ' · ' + i.cores + ' cores' + (i.threads ? ' / ' + i.threads + ' threads' : '') : '') : ''], ['Architecture', i.arch], ['Memory', i.memory ? by(i.memory) : ''], ['Uptime', sy.status === 'up' ? dur(sy.uptime) : ''], ['Agent', sy.agent ? 'Beszel ' + sy.agent : ''], ['Updates', i.updates ? i.updates.total + ' available' + (i.updates.security ? ', ' + i.updates.security + ' security' : '') : ''], ['Services', sy.services ? (sy.services.total - sy.services.failed) + ' running' + (sy.services.failed ? ', ' + sy.services.failed + ' failed' : '') : ''], ['Battery', i.battery && i.battery[0] ? i.battery[0] + '%' : '']].filter(function (r) { return r[1]; }).map(function (r) { return '<span>' + r[0] + '</span><b>' + esc(r[1]) + '</b>'; }).join('') + '</div></div>';
    out += kv;
    out += chart({ title: 'CPU usage', t: t, max: 100, area: true, fmt: pct, series: [ser('CPU', function (p) { return p.cpu; }, COL[0])].concat(P.some(function (p) { return p.cpum != null; }) ? [ser('Peak', function (p) { return p.cpum; }, COL[5])] : []) });
    if (P.some(function (p) { return p.cpub; })) { var nm = ['User', 'System', 'I/O wait', 'Steal']; out += chart({ title: 'CPU breakdown', t: t, stacked: true, max: 100, fmt: pct, series: nm.map(function (n, k) { return { name: n, v: col(function (p) { return p.cpub ? p.cpub[k] : null; }), color: COL[k + 1] }; }) }); }
    if (L.cpus && L.cpus.length) out += '<div class="card ichart"><div class="ich-h"><b>CPU cores now</b></div><div class="icores">' + L.cpus.map(function (v, k) { return '<div title="Core ' + k + ': ' + v + '%"><i class="' + tone(v) + '" style="height:' + Math.max(3, v) + '%"></i><span>' + k + '</span></div>'; }).join('') + '</div></div>';
    out += chart({ title: 'Memory', t: t, area: true, fmt: gb, max: L.mm || (d.info.memory ? d.info.memory / 1073741824 : null), series: [ser('Used', function (p) { return p.mu; }, COL[1]), ser('Buffers and cache', function (p) { return p.mb; }, COL[2]), ser('ZFS ARC', function (p) { return p.mz; }, COL[3])] });
    if (P.some(function (p) { return p.su; })) out += chart({ title: 'Swap', t: t, fmt: gb, series: [ser('Used', function (p) { return p.su; }, COL[4])] });
    out += chart({ title: 'Disk usage', t: t, max: 100, fmt: pct, area: true, series: [ser('Root disk', function (p) { return p.dp; }, COL[0])] });
    out += chart({ title: 'Disk I/O', t: t, fmt: bps, series: [ser('Read', function (p) { return p.dio ? p.dio[0] : p.dr != null ? p.dr * 1048576 : null; }, COL[1]), ser('Write', function (p) { return p.dio ? p.dio[1] : p.dw != null ? p.dw * 1048576 : null; }, COL[4])] });
    if (P.some(function (p) { return p.dios; })) out += chart({ title: 'Disk busy time', t: t, max: 100, fmt: pct, series: [ser('Utilization', function (p) { return p.dios ? p.dios[2] : null; }, COL[5])] });
    out += chart({ title: 'Network traffic', t: t, fmt: bps, series: [ser('Upload', function (p) { return p.b ? p.b[0] : null; }, COL[1]), ser('Download', function (p) { return p.b ? p.b[1] : null; }, COL[2])] });
    out += chart({ title: 'Load average', t: t, fmt: function (v) { return (+v).toFixed(2); }, series: ['1 min', '5 min', '15 min'].map(function (n, k) { return ser(n, function (p) { return p.la ? p.la[k] : null; }, COL[k + 1]); }) });
    var sensors = {}; P.forEach(function (p) { if (p.t_all) Object.keys(p.t_all).forEach(function (k) { sensors[k] = 1; }); });
    if (Object.keys(sensors).length) out += chart({ title: 'Temperatures', t: t, fmt: function (v) { return (+v).toFixed(0) + ' °C'; }, series: Object.keys(sensors).slice(0, 10).map(function (k) { return { name: k, v: col(function (p) { return p.t_all ? p.t_all[k] : null; }) }; }) });
    var gpus = {}; P.forEach(function (p) { if (p.gpu) Object.keys(p.gpu).forEach(function (k) { gpus[k] = p.gpu[k].n || k; }); });
    Object.keys(gpus).slice(0, 4).forEach(function (k) {
      out += chart({ title: 'GPU: ' + gpus[k], t: t, max: 100, fmt: pct, series: [ser('Usage', function (p) { return p.gpu && p.gpu[k] ? p.gpu[k].u : null; }, COL[3])] });
      if (P.some(function (p) { return p.gpu && p.gpu[k] && p.gpu[k].mt; })) out += chart({ title: 'GPU memory: ' + gpus[k], t: t, fmt: gb, series: [ser('Used', function (p) { return p.gpu && p.gpu[k] ? p.gpu[k].mu : null; }, COL[2])] });
      if (P.some(function (p) { return p.gpu && p.gpu[k] && p.gpu[k].p; })) out += chart({ title: 'GPU power: ' + gpus[k], t: t, fmt: function (v) { return (+v).toFixed(0) + ' W'; }, series: [ser('Power', function (p) { return p.gpu && p.gpu[k] ? p.gpu[k].p : null; }, COL[4])] });
    });
    var fans = {}; P.forEach(function (p) { if (p.fans) Object.keys(p.fans).forEach(function (k) { fans[k] = 1; }); });
    if (Object.keys(fans).length) out += chart({ title: 'Fans', t: t, fmt: function (v) { return Math.round(v) + ' rpm'; }, series: Object.keys(fans).slice(0, 8).map(function (k) { return { name: k, v: col(function (p) { return p.fans ? p.fans[k] : null; }) }; }) });
    var bats = {}; P.forEach(function (p) { if (p.bats) Object.keys(p.bats).forEach(function (k) { bats[k] = 1; }); });
    if (P.some(function (p) { return p.bat && p.bat[0]; })) out += chart({ title: 'Battery', t: t, max: 100, fmt: pct, series: [ser('Charge', function (p) { return p.bat ? p.bat[0] : null; }, COL[2])] });
    out += '</div>';
    if (L.efs && Object.keys(L.efs).length) out += '<h2 style="font-size:19px;margin:22px 0 10px">Filesystems</h2><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">' + Object.keys(L.efs).map(function (k) { var f = L.efs[k], u = f.d ? f.du / f.d * 100 : null; return '<div class="card"><b>' + esc(k) + '</b>' + bar('', u, 0) + '<div class="note mono">' + gb(f.du) + ' of ' + gb(f.d) + (f.r != null ? ' · ↓ ' + (f.rb != null ? bps(f.rb) : (+f.r).toFixed(1) + ' MB/s') + ' ↑ ' + (f.wb != null ? bps(f.wb) : (+f.w).toFixed(1) + ' MB/s') : '') + '</div></div>'; }).join('') + '</div>';
    if (L.zfs && Object.keys(L.zfs).length) out += '<h2 style="font-size:19px;margin:22px 0 10px">ZFS pools</h2><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">' + Object.keys(L.zfs).map(function (k) { var z = L.zfs[k]; return '<div class="card"><b>' + esc(z.n || k) + '</b> ' + pill(z.h || 'ONLINE', z.h && z.h !== 'ONLINE' ? 'bad' : 'ok') + bar('', z.d ? z.du / z.d * 100 : null, 0) + '<div class="note mono">' + gb(z.du) + ' of ' + gb(z.d) + '</div></div>'; }).join('') + '</div>';
    if (L.ni && Object.keys(L.ni).length) out += '<h2 style="font-size:19px;margin:22px 0 10px">Network interfaces</h2><div class="tablewrap"><table><thead><tr><th>Interface</th><th>Upload</th><th>Download</th><th>Total sent</th><th>Total received</th></tr></thead><tbody>' + Object.keys(L.ni).map(function (k) { var n = L.ni[k]; return '<tr><td><b>' + esc(k) + '</b></td><td class="mono">' + bps(n[0]) + '</td><td class="mono">' + bps(n[1]) + '</td><td class="mono">' + by(n[2]) + '</td><td class="mono">' + by(n[3]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    return out;
  }
  function containers(d) {
    var C = d.containers, ct = I.ct, out = '';
    var hp = function (h) { return h === 2 ? pill('Healthy', 'ok') : h === 3 ? pill('Unhealthy', 'bad') : h === 1 ? pill('Starting', 'warn') : ''; };
    if (ct && ct.names.length) {
      out += '<div class="grid ich-grid">' + chart({ title: 'Container CPU', t: ct.t, fmt: pct, legend: true, series: ct.names.map(function (n) { return { name: n, v: ct.cpu[n] }; }) }) + chart({ title: 'Container memory', t: ct.t, fmt: function (v) { return v >= 1024 ? (v / 1024).toFixed(1) + ' GB' : Math.round(v) + ' MB'; }, legend: true, series: ct.names.map(function (n) { return { name: n, v: ct.mem[n] }; }) }) + chart({ title: 'Container network', t: ct.t, fmt: bps, legend: true, series: ct.names.map(function (n) { return { name: n, v: ct.net[n] }; }) }) + '</div>';
    } else if (I.busy.ct) out += '<p class="note">Loading container history...</p>';
    out += '<h2 style="font-size:19px;margin:22px 0 10px">Containers (' + C.length + ')</h2>';
    out += C.length ? '<div class="tablewrap"><table><thead><tr><th>Name</th><th>Image</th><th>Status</th><th>CPU</th><th>Memory</th><th>Network</th></tr></thead><tbody>' + C.map(function (c) { return '<tr><td><b>' + esc(c.name) + '</b>' + (c.updatable ? ' ' + pill('Update available', 'warn') : '') + (c.ports ? '<div class="mono note">' + esc(c.ports) + '</div>' : '') + '</td><td class="mono note" style="max-width:240px;overflow:hidden;text-overflow:ellipsis">' + esc(c.image) + '</td><td>' + esc(c.status || '') + ' ' + hp(c.health) + '</td><td class="mono">' + (c.cpu == null ? '–' : c.cpu + '%') + '</td><td class="mono">' + (c.mem == null ? '–' : c.mem + ' MB') + '</td><td class="mono">' + (c.net == null ? '–' : bps(c.net)) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty"><h2>No container data</h2><p>Give the Beszel agent access to the Docker or Podman socket.</p></div>';
    return out;
  }
  function services() {
    var sv = I.sv; if (!sv) return I.err.sv ? '<div class="banner"><i class="dot bad"></i><span>' + esc(I.err.sv) + '</span></div>' : '<p class="note">Loading services...</p>';
    var l = sv.services.filter(function (x) { return (I.svf === 'all' || (I.svf === 'failed' ? x.state === 'failed' : I.svf === 'running' ? x.sub === 'running' : x.sub !== 'running')) && (!I.svq || x.name.toLowerCase().indexOf(I.svq.toLowerCase()) > -1); });
    var f = [['all', 'All (' + sv.services.length + ')'], ['failed', 'Failed (' + sv.services.filter(function (x) { return x.state === 'failed'; }).length + ')'], ['running', 'Running'], ['other', 'Not running']].map(function (x) { return '<button class="chip" data-sa="svf" data-f="' + x[0] + '" aria-pressed="' + (I.svf === x[0]) + '">' + x[1] + '</button>'; }).join('');
    return '<div class="toolbar"><div class="search">' + ic('search') + '<input class="input" id="svq" type="search" placeholder="Filter services" value="' + esc(I.svq) + '" data-sin="svq" aria-label="Filter services"></div><div class="chips">' + f + '</div></div>' + (l.length ? '<div class="tablewrap"><table><thead><tr><th>Service</th><th>State</th><th>CPU</th><th>Peak CPU</th><th>Memory</th><th>Peak memory</th></tr></thead><tbody>' + l.map(function (x) { return '<tr><td><b>' + esc(x.name) + '</b></td><td>' + pill(x.state + (x.sub && x.sub !== x.state ? ' (' + x.sub + ')' : ''), x.state === 'failed' ? 'bad' : x.state === 'active' ? 'ok' : x.state === 'inactive' ? '' : 'warn') + '</td><td class="mono">' + (x.cpu == null ? '–' : x.cpu + '%') + '</td><td class="mono">' + (x.cpuPeak == null ? '–' : x.cpuPeak + '%') + '</td><td class="mono">' + by(x.mem) + '</td><td class="mono">' + by(x.memPeak) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty"><h2>No services</h2><p>' + (sv.services.length ? 'Nothing matches.' : 'This agent does not report systemd services.') + '</p></div>');
  }
  function disks(d) {
    var sm = I.sm, out = '', L = d.last || {};
    if (!sm) out += I.err.sm ? '<div class="banner"><i class="dot bad"></i><span>' + esc(I.err.sm) + '</span></div>' : '<p class="note">Loading disk health...</p>';
    else if (!sm.devices.length) out += '<div class="empty"><h2>No S.M.A.R.T. data</h2><p>Enable S.M.A.R.T. on the Beszel agent (SMART_DEVICES) to see disk health, temperature and wear.</p></div>';
    else out += '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">' + sm.devices.map(function (x) {
      var open = I.open[x.id];
      return '<div class="card"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b>' + esc(x.name) + '</b>' + pill(x.state || 'Unknown', x.state === 'PASSED' ? 'ok' : x.state ? 'bad' : '') + '</div><div class="note">' + esc(x.model || '') + '</div><div class="ikv" style="margin-top:10px">' + [['Type', x.type], ['Capacity', x.capacity ? by(x.capacity) : ''], ['Temperature', x.temp ? x.temp + ' °C' : ''], ['Power on', x.hours ? Math.round(x.hours / 24) + ' days (' + x.hours + ' h)' : ''], ['Power cycles', x.cycles || ''], ['Firmware', x.firmware], ['Serial', x.serial]].filter(function (r) { return r[1]; }).map(function (r) { return '<span>' + r[0] + '</span><b>' + esc(r[1]) + '</b>'; }).join('') + '</div>' +
        (x.attributes.length ? '<button class="btn sm" style="margin-top:10px" data-sa="smattr" data-id="' + esc(x.id) + '">' + (open ? 'Hide' : 'Show') + ' ' + x.attributes.length + ' attributes</button>' + (open ? '<div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>Attribute</th><th>Value</th><th>Worst</th><th>Limit</th><th>Raw</th></tr></thead><tbody>' + x.attributes.map(function (a) { return '<tr><td>' + esc(a.name || a.id) + '</td><td class="mono">' + (a.value ?? '–') + '</td><td class="mono">' + (a.worst ?? '–') + '</td><td class="mono">' + (a.threshold ?? '–') + '</td><td class="mono">' + (a.raw ?? '–') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '') : '') + '</div>';
    }).join('') + '</div>';
    return out;
  }
  function kindOpts(al, sel) { return Object.keys(al.kinds).map(function (k) { return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(al.kinds[k]) + '</option>'; }).join(''); }
  function unitOf(n) { return n === 'Status' ? '' : n === 'Temperature' ? '°C' : n === 'Bandwidth' ? 'MB/s' : n.indexOf('Load') === 0 ? '' : '%'; }
  function ruleLine(r, withSys) { return '<tr><td>' + (withSys ? '<b>' + esc(r.systemName || r.system) + '</b>' : '<b>' + esc(r.name) + '</b>') + '</td>' + (withSys ? '<td>' + esc(r.name) + '</td>' : '') + '<td class="mono">' + (r.name === 'Status' ? 'goes down' : '&gt; ' + esc(r.value) + ' ' + unitOf(r.name)) + '</td><td class="mono">' + esc(r.min) + ' min</td><td>' + (r.triggered ? pill('Firing', 'bad') : pill('OK', 'ok')) + '</td><td style="text-align:right"><button class="btn sm danger" data-sa="alrm" data-id="' + esc(r.id) + '">Remove</button></td></tr>'; }
  function histTable(h) { return h.length ? '<div class="tablewrap"><table><thead><tr><th>Server</th><th>Alert</th><th>Value</th><th>Started</th><th>Resolved</th></tr></thead><tbody>' + h.map(function (x) { return '<tr><td><b>' + esc(x.systemName || '') + '</b></td><td>' + esc(x.name) + (x.monitor ? ' · ' + esc(x.monitor) : '') + '</td><td class="mono">' + esc(x.value) + '</td><td class="note">' + A.fmt(new Date(ts(x.created)), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</td><td>' + (x.resolved ? '<span class="note">' + A.fmt(new Date(ts(x.resolved)), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</span>' : pill('Still firing', 'bad')) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="note">No alerts have fired yet.</p>'; }
  function alertForm(sysId) {
    var al = I.al; return '<div class="card" style="margin-bottom:16px"><h2 style="font-size:17px;margin-bottom:10px">Add or change an alert</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;align-items:end">' +
      (sysId ? '' : '<div class="field" style="margin:0"><label for="af_s">Server</label><select class="input" id="af_s">' + (sysData().systems.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + '</option>'; }).join('')) + '</select></div>') +
      '<div class="field" style="margin:0"><label for="af_n">Alert when</label><select class="input" id="af_n">' + kindOpts(al, 'CPU') + '</select></div><div class="field" style="margin:0"><label for="af_v">Above (% or value)</label><input class="input" id="af_v" type="number" step="any" value="80"></div><div class="field" style="margin:0"><label for="af_m">For minutes</label><input class="input" id="af_m" type="number" min="1" max="60" value="10"></div><button class="btn primary" data-sa="alsave"' + (sysId ? ' data-id="' + esc(sysId) + '"' : '') + '>Save alert</button></div><div id="af_r" class="note" role="status"></div></div>';
  }
  function sysAlerts(s0) {
    var al = I.al; if (!al) return I.err.al ? '<div class="banner"><i class="dot bad"></i><span>' + esc(I.err.al) + '</span></div>' : '<p class="note">Loading alerts...</p>';
    var rules = al.rules.filter(function (r) { return r.system === I.id; }), hist = al.history.filter(function (h) { return h.system === I.id; });
    return alertForm(I.id) + '<h2 style="font-size:19px;margin:6px 0 10px">Alerts on this server</h2>' + (rules.length ? '<div class="tablewrap"><table><thead><tr><th>Alert</th><th>Condition</th><th>For</th><th>State</th><th></th></tr></thead><tbody>' + rules.map(function (r) { return ruleLine(r, false); }).join('') + '</tbody></table></div>' : '<p class="note">No alerts set for this server.</p>') + '<h2 style="font-size:19px;margin:22px 0 10px">History</h2>' + histTable(hist);
  }
  function alertsPage() {
    var al = I.al; if (!al) return I.err.al ? '<div class="banner"><i class="dot bad"></i><span>' + esc(I.err.al) + '</span></div>' : '<p class="note">Loading alerts...</p>';
    return alertForm(null) + '<h2 style="font-size:19px;margin:6px 0 10px">Alert rules (' + al.rules.length + ')</h2>' + (al.rules.length ? '<div class="tablewrap"><table><thead><tr><th>Server</th><th>Alert</th><th>Condition</th><th>For</th><th>State</th><th></th></tr></thead><tbody>' + al.rules.map(function (r) { return ruleLine(r, true); }).join('') + '</tbody></table></div>' : '<p class="note">No alerts are set. Add one above.</p>') +
      '<h2 style="font-size:19px;margin:22px 0 10px">Quiet hours</h2>' + (al.quiet.length ? '<div class="tablewrap"><table><thead><tr><th>Applies to</th><th>Type</th><th>From</th><th>To</th></tr></thead><tbody>' + al.quiet.map(function (q) { return '<tr><td><b>' + esc(q.systemName || 'All servers') + '</b></td><td>' + esc(q.type || '') + '</td><td class="mono">' + esc(q.start || '') + '</td><td class="mono">' + esc(q.end || '') + '</td></tr>'; }).join('') + '</tbody></table></div><p class="note">Quiet hours are managed in Beszel.</p>' : '<p class="note">No quiet hours set in Beszel.</p>') +
      '<h2 style="font-size:19px;margin:22px 0 10px">History</h2>' + histTable(al.history);
  }
  function probesPage() {
    var pr = I.pr; if (!pr) return I.err.pr ? '<div class="banner"><i class="dot bad"></i><span>' + esc(I.err.pr) + '</span></div>' : '<p class="note">Loading probes...</p>';
    if (!pr.probes.length) return '<div class="empty"><h2>No network probes</h2><p>Add ping, TCP, HTTP or DNS probes in Beszel (newer versions) and they show up here.</p></div>';
    return '<div class="tablewrap"><table><thead><tr><th>Probe</th><th>Target</th><th>From</th><th>Success</th><th>Average</th><th>Min / max</th><th>Every</th></tr></thead><tbody>' + pr.probes.map(function (p) { return '<tr><td><b>' + esc(p.name) + '</b> ' + pill(p.protocol || '') + '</td><td class="mono">' + esc(p.target || '') + (p.port ? ':' + p.port : '') + '</td><td>' + esc(p.systemName) + '</td><td>' + (p.ok == null ? '–' : pill(p.ok + '%', p.ok >= 99 ? 'ok' : p.ok >= 90 ? 'warn' : 'bad')) + '</td><td class="mono">' + (p.avg == null ? '–' : p.avg + ' ms') + '</td><td class="mono">' + (p.min == null ? '–' : p.min + ' / ' + p.max + ' ms') + '</td><td class="mono">' + (p.interval ? p.interval + ' s' : '–') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }

  /* ---------- hooks ---------- */
  function view() { chN = 0; CH = {}; return I.id ? detailView() : fleet(); }
  function open(id) { I.id = id; I.dtab = 'overview'; I.det = null; I.ct = null; I.sv = null; I.sm = null; if (S.view !== 'servers') A.go('servers'); else { A.redraw(); loadDetail(); } }
  function onGo(v) { if (v !== 'servers') return; if (!sysData() && !I.busy.sys) loadSystems(); if (I.id) loadDetail(); if (I.tab === 'alerts' && !I.al) loadAlerts(); if (I.tab === 'probes' && !I.pr) loadProbes(); }
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-sa]'); if (!el) return; var a = el.getAttribute('data-sa'), id = el.getAttribute('data-id');
    if (a === 'tab') { I.tab = el.getAttribute('data-t'); A.redraw(); if (I.tab === 'alerts') loadAlerts(); if (I.tab === 'probes') loadProbes(); return; }
    if (a === 'refresh') { if (I.id) loadDetail(); return void loadSystems(); }
    if (a === 'filter') { I.filter = el.getAttribute('data-f'); return void A.redraw(); }
    if (a === 'open') return void open(id);
    if (a === 'back') { I.id = null; A.redraw(); return void loadSystems(true); }
    if (a === 'dtab') { I.dtab = el.getAttribute('data-t'); A.redraw(); return void loadDetail(); }
    if (a === 'range') { I.range = el.getAttribute('data-r'); I.det = null; I.ct = null; return void loadDetail(); }
    if (a === 'svf') { I.svf = el.getAttribute('data-f'); return void A.redraw(); }
    if (a === 'smattr') { I.open[id] = !I.open[id]; return void A.redraw(); }
    if (a === 'pause') { var pz = el.getAttribute('data-p') === '1'; return void api('/api/status/pause', { method: 'POST', json: { id: I.id, paused: pz } }).then(function () { toast(pz ? 'Monitoring paused' : 'Monitoring resumed'); return loadSystems(); }).catch(function (e) { toast(e.message); }); }
    if (a === 'alsave') {
      var sys = id || ($('#af_s') || {}).value, r = $('#af_r'); r.style.color = 'var(--muted)'; r.textContent = 'Saving...';
      return void api('/api/status/alerts', { method: 'POST', json: { system: sys, name: $('#af_n').value, value: $('#af_v').value, min: $('#af_m').value } }).then(function (d) { I.al = d; toast('Alert saved'); A.redraw(); loadSystems(true); }).catch(function (e) { r.style.color = 'var(--bad)'; r.textContent = e.message; });
    }
    if (a === 'alrm') return void api('/api/status/alerts?id=' + encodeURIComponent(id), { method: 'DELETE' }).then(function (d) { I.al = d; toast('Alert removed'); A.redraw(); }).catch(function (e) { toast(e.message); });
  });
  document.addEventListener('keydown', function (ev) { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('tr[data-sa="open"]')) { ev.preventDefault(); open(ev.target.getAttribute('data-id')); } });
  document.addEventListener('input', function (ev) { var t = ev.target, k = t.getAttribute && t.getAttribute('data-sin'); if (!k) return; I[k] = t.value; var pos = t.selectionStart; A.redraw(); var n = document.getElementById(t.id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } });
  document.addEventListener('change', function (ev) { if (ev.target.id === 'af_n') { var v = $('#af_v'); if (ev.target.value === 'Status') v.value = 1; } });
  /* keep the open page fresh */
  setInterval(function () { if (S.view !== 'servers' || document.hidden) return; if (I.id) loadDetail(true); else if (I.tab === 'systems') loadSystems(true); }, 30000);

  window.AOSSrv = { view: view, open: open, onGo: onGo, state: I };
})();
