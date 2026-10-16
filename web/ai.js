/* AI: FreeLLMAPI analytics inside Insights. Requests, tokens, speed, errors, models, providers, keys, clients and a request log with
 * the fallback attempts of each call. All data comes through this server's /api/aiusage routes; the FreeLLMAPI login stays on the server. */
(function () {
  'use strict';
  var A = window.AOS; if (!A) return;
  var S = A.S, $ = A.$, esc = A.esc, api = A.api, toast = A.toast;
  var I = { tab: 'overview', range: '7d', d: null, busy: false, err: null, code: null, mq: '', kq: '', log: null, lbusy: false, lerr: null, lstatus: '', lprov: '', loff: 0, det: null, dbusy: false };
  var RANGES = [['24h', '24 hours'], ['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days']];
  var TABS = [['overview', 'Overview'], ['models', 'Models'], ['providers', 'Providers'], ['keys', 'Keys'], ['clients', 'Apps'], ['log', 'Requests'], ['errors', 'Errors']];
  var COL = ['var(--accent)', '#4fa3ff', '#3ecf8e', '#b58cff', '#f5b83d', '#ff6b6b', '#5fd6d6', '#e58bd8'];
  var PAGE = 50;

  /* ---------- formatting ---------- */
  var num = function (v) { return v == null || isNaN(v) ? null : +v; };
  function n0(v) { v = num(v); return v == null ? '–' : v.toLocaleString('en-US'); }
  function short(v) { v = num(v); if (v == null) return '–'; if (v >= 1e9) return (v / 1e9).toFixed(v >= 1e10 ? 0 : 1) + 'B'; if (v >= 1e6) return (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + 'M'; if (v >= 1e4) return Math.round(v / 1e3) + 'K'; if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'; return String(Math.round(v)); }
  function ms(v) { v = num(v); if (v == null) return '–'; return v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + ' s' : Math.round(v) + ' ms'; }
  function pc(v) { v = num(v); return v == null ? '–' : (v >= 99.95 || v === 0 ? Math.round(v) : v.toFixed(1)) + '%'; }
  function usd(v) { v = num(v); return v == null ? '–' : '$' + (v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(2)); }
  function left(sec) { return sec >= 3600 ? Math.round(sec / 3600) + ' h' : sec >= 60 ? Math.round(sec / 60) + ' min' : sec + ' s'; }
  function ago(iso) { if (!iso) return 'never'; var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' d ago'; }
  function when(iso) { return iso ? A.fmt(new Date(iso), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '–'; }
  var pill = function (t, c) { return '<span class="pill ' + (c || '') + '">' + esc(t) + '</span>'; };
  var rate = function (v) { return v == null ? '–' : '<b style="color:' + (v >= 95 ? 'var(--ok)' : v >= 80 ? 'var(--warn)' : 'var(--bad)') + '">' + pc(v) + '</b>'; };
  var host = function (u) { try { return new URL(u).host; } catch (e) { return u || ''; } };
  var prov = function (r) { return r.platform === 'custom' && r.endpoint ? 'custom · ' + host(r.endpoint) : r.platform; };
  var kp = function (n, l, c, sub) { return '<div class="card kpi"><div class="stat"><span class="n"' + (c ? ' style="color:' + c + '"' : '') + '>' + n + '</span><span class="l">' + l + '</span>' + (sub ? '<span class="note" style="font-size:12px">' + sub + '</span>' : '') + '</div></div>'; };
  var empty = function (t, p) { return '<div class="empty"><h2>' + t + '</h2><p>' + p + '</p></div>'; };
  var cmp = function (k, dir) { return function (a, b) { return ((num(b[k]) || 0) - (num(a[k]) || 0)) * (dir || 1); }; };
  /* a horizontal share bar for a table cell */
  function share(v, max, col) { return '<div class="ibar cell" style="grid-template-columns:1fr 54px"><div class="track"><div class="fill" style="width:' + (max > 0 ? Math.max(2, Math.round(v / max * 100)) : 0) + '%;' + (col ? 'background:' + col : '') + '"></div></div><b class="mono">' + short(v) + '</b></div>'; }

  /* ---------- loading ---------- */
  function load(force, quiet) {
    I.busy = true; if (!quiet) A.redraw();
    return api('/api/aiusage?range=' + I.range + (force ? '&refresh=1' : '')).then(function (d) { I.d = d; I.err = null; I.code = null; }).catch(function (e) { I.err = e.message; I.code = e.code; if (!quiet) I.d = I.d && I.d.range === I.range ? I.d : null; }).then(function () { I.busy = false; if (S.view === 'ai' && !(quiet && document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) A.redraw(); });
  }
  function loadLog() {
    I.lbusy = true; A.redraw();
    var q = '/api/aiusage/requests?range=' + I.range + '&limit=' + PAGE + '&offset=' + I.loff + (I.lstatus ? '&status=' + I.lstatus : '') + (I.lprov ? '&provider=' + encodeURIComponent(I.lprov) : '');
    return api(q).then(function (d) { I.log = d; I.lerr = null; }).catch(function (e) { I.lerr = e.message; }).then(function () { I.lbusy = false; if (S.view === 'ai') A.redraw(); });
  }
  function openReq(id) { I.det = { id: id }; I.dbusy = true; A.modal(detailModal()); api('/api/aiusage/request?id=' + id).then(function (d) { I.det = d; }).catch(function (e) { I.det = { id: id, error: e.message }; }).then(function () { I.dbusy = false; if (!$('#modal').hidden) A.modal(detailModal()); }); }

  /* ---------- pages ---------- */
  function chartOf(spec) { spec.range = I.d.interval === 'hour' ? '20m' : 'D'; return window.AOSSrv ? window.AOSSrv.chart(spec) : ''; }
  function overview(d) {
    var s = d.summary || {}, tl = d.timeline, t = tl.map(function (x) { return x.t; });
    var total = s.totalRequests || 0, rc = s.requestTypeCounts || {};
    var out = '<div class="kpis">' + kp(n0(total), 'requests', '', s.lifetimeTotalRequests ? n0(s.lifetimeTotalRequests) + ' all time' : '') + kp(pc(s.successRate), 'success rate', s.successRate == null ? '' : s.successRate >= 95 ? 'var(--ok)' : s.successRate >= 80 ? 'var(--warn)' : 'var(--bad)') + kp(short((s.totalInputTokens || 0) + (s.totalOutputTokens || 0)), 'tokens', '', short(s.totalInputTokens) + ' in · ' + short(s.totalOutputTokens) + ' out') + kp(ms(s.avgLatencyMs), 'average speed', '', 'p50 ' + ms(s.p50LatencyMs) + ' · p95 ' + ms(s.p95LatencyMs)) + kp(ms(s.avgTtfbMs), 'time to first token') + kp(usd(s.estimatedCostSavings), 'paid-API cost saved', 'var(--ok)', 'estimate') + '</div>';
    out += '<div class="grid ich-grid">';
    out += chartOf({ title: 'Requests', t: t, stacked: true, fmt: short, series: [{ name: 'Succeeded', v: tl.map(function (x) { return x.ok; }), color: '#3ecf8e' }, { name: 'Failed', v: tl.map(function (x) { return x.fail; }), color: '#ff6b6b' }] });
    out += chartOf({ title: 'Tokens', t: t, stacked: true, fmt: short, series: [{ name: 'Input', v: tl.map(function (x) { return x.inTok; }), color: '#4fa3ff' }, { name: 'Output', v: tl.map(function (x) { return x.outTok; }), color: 'var(--accent)' }] });
    var mx = d.byModel.slice().sort(cmp('requests')).slice(0, 8), mmax = mx.length ? mx[0].requests : 0;
    out += '<div class="card"><h2 style="font-size:17px;margin-bottom:10px">Busiest models</h2>' + (mx.length ? mx.map(function (m) { return '<div class="ibar" style="grid-template-columns:minmax(0,150px) 1fr 46px"><span title="' + esc(m.displayName || m.modelId) + '" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(m.displayName || m.modelId) + '</span><div class="track"><div class="fill" style="width:' + Math.max(2, Math.round(m.requests / mmax * 100)) + '%"></div></div><b class="mono">' + short(m.requests) + '</b></div>'; }).join('') : '<p class="note">No requests in this range.</p>') + '</div>';
    var pv = d.byPlatform.slice().sort(cmp('requests')).slice(0, 8), pmax = pv.length ? pv[0].requests : 0;
    out += '<div class="card"><h2 style="font-size:17px;margin-bottom:10px">Providers</h2>' + (pv.length ? pv.map(function (p) { return '<div class="ibar" style="grid-template-columns:minmax(0,150px) 1fr 46px"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(prov(p)) + '</span><div class="track"><div class="fill ' + (p.successRate < 80 ? 'bad' : p.successRate < 95 ? 'warn' : '') + '" style="width:' + Math.max(2, Math.round(p.requests / pmax * 100)) + '%"></div></div><b class="mono">' + short(p.requests) + '</b></div>'; }).join('') : '<p class="note">No requests in this range.</p>') + '</div>';
    var ed = d.errorDist.byCategory || [], emax = ed.reduce(function (a, x) { return Math.max(a, x.count); }, 0);
    out += '<div class="card"><h2 style="font-size:17px;margin-bottom:10px">Why requests failed</h2>' + (ed.length ? ed.map(function (e) { return '<div class="ibar" style="grid-template-columns:minmax(0,150px) 1fr 46px"><span>' + esc(e.category) + '</span><div class="track"><div class="fill bad" style="width:' + Math.max(2, Math.round(e.count / emax * 100)) + '%"></div></div><b class="mono">' + short(e.count) + '</b></div>'; }).join('') : '<p class="note">No failures in this range.</p>') + '</div>';
    var kk = d.keys, ok = kk.filter(function (k) { return k.enabled && k.status === 'healthy'; }).length, cool = kk.reduce(function (a, k) { return a + k.cooldowns.length; }, 0), bad = kk.filter(function (k) { return k.enabled && k.status && k.status !== 'healthy' && k.status !== 'unknown'; }).length;
    out += '<div class="card"><h2 style="font-size:17px;margin-bottom:10px">Right now</h2><div class="ikv"><span>API keys</span><b>' + kk.length + ' (' + ok + ' healthy' + (bad ? ', ' + bad + ' failing' : '') + ')</b><span>Models in the fallback chain</span><b>' + d.models.filter(function (m) { return m.enabled && m.fallback; }).length + ' of ' + d.models.length + '</b><span>Cooling down</span><b>' + (cool ? cool + ' key and model pair' + (cool > 1 ? 's' : '') : 'none') + '</b><span>Chat · embeddings</span><b>' + n0(rc.chat) + ' · ' + n0(rc.embedding) + '</b><span>Pinned to a model</span><b>' + n0(s.pinnedRequests) + (s.pinHonoredRequests != null ? ' (' + n0(s.pinHonoredRequests) + ' honoured)' : '') + '</b><span>First request</span><b>' + (s.firstRequestAt ? esc(when(s.firstRequestAt)) : '–') + '</b></div></div>';
    return out + '</div>';
  }
  function modelsPage(d) {
    var q = I.mq.toLowerCase(), rows = d.byModel.filter(function (m) { return !q || ((m.displayName || '') + ' ' + m.modelId + ' ' + m.platform).toLowerCase().indexOf(q) > -1; }).sort(cmp('requests')), max = rows.length ? rows[0].requests : 0;
    var used = {}; d.byModel.forEach(function (m) { used[m.platform + '|' + m.modelId] = 1; });
    var cfg = d.models.filter(function (m) { return !q || ((m.name || '') + ' ' + m.model + ' ' + m.platform).toLowerCase().indexOf(q) > -1; });
    var t1 = rows.length ? '<div class="tablewrap"><table><thead><tr><th>Model</th><th>Requests</th><th>Success</th><th>Speed</th><th>Tokens in</th><th>Tokens out</th><th>Pinned</th><th>Saved</th></tr></thead><tbody>' + rows.map(function (m) { return '<tr><td><b>' + esc(m.displayName || m.modelId) + '</b><div class="note mono">' + esc(prov(m)) + ' · ' + esc(m.modelId) + '</div></td><td>' + share(m.requests, max) + '</td><td>' + rate(m.successRate) + '</td><td class="mono">' + ms(m.avgLatencyMs) + '</td><td class="mono">' + short(m.totalInputTokens) + '</td><td class="mono">' + short(m.totalOutputTokens) + '</td><td class="mono">' + n0(m.pinnedRequests) + '</td><td class="mono">' + usd(m.estimatedCost) + '</td></tr>'; }).join('') + '</tbody></table></div>' : empty('No model traffic', 'Nothing was routed in this range.');
    var t2 = cfg.length ? '<h2 style="font-size:19px;margin:24px 0 10px">Catalog and limits (' + cfg.length + ')</h2><div class="tablewrap"><table><thead><tr><th>Model</th><th>State</th><th>Order</th><th>Keys</th><th>Per minute</th><th>Per day</th><th>Tokens / min</th><th>Context</th><th>Can do</th></tr></thead><tbody>' + cfg.slice().sort(function (a, b) { return (a.priority == null ? 1e9 : a.priority) - (b.priority == null ? 1e9 : b.priority); }).map(function (m) { return '<tr><td><b>' + esc(m.name || m.model) + '</b><div class="note mono">' + esc(m.platform) + (m.size ? ' · ' + esc(m.size) : '') + (m.source === 'custom' ? ' · custom' : '') + '</div></td><td>' + (m.enabled ? (m.fallback ? pill('In chain', 'ok') : pill('On')) : pill('Off')) + '</td><td class="mono">' + (m.priority == null ? '–' : m.priority) + '</td><td class="mono">' + (m.keys == null ? '–' : m.keys) + '</td><td class="mono">' + n0(m.rpm) + '</td><td class="mono">' + n0(m.rpd) + '</td><td class="mono">' + short(m.tpm) + '</td><td class="mono">' + short(m.ctx) + '</td><td class="note">' + [m.vision ? 'vision' : '', m.tools ? 'tools' : ''].filter(Boolean).join(', ') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '';
    return '<div class="toolbar"><div class="search">' + A.ic('search') + '<input class="input" id="aiq" type="search" placeholder="Filter models" value="' + esc(I.mq) + '" data-ain="mq" aria-label="Filter models"></div></div>' + t1 + t2;
  }
  function providersPage(d) {
    var rows = d.byPlatform.slice().sort(cmp('requests')), max = rows.length ? rows[0].requests : 0;
    if (!rows.length) return empty('No provider traffic', 'Nothing was routed in this range.');
    var kc = {}; d.keys.forEach(function (k) { var a = kc[k.platform] = kc[k.platform] || { n: 0, ok: 0 }; a.n++; if (k.enabled && k.status === 'healthy') a.ok++; });
    return '<div class="tablewrap"><table><thead><tr><th>Provider</th><th>Requests</th><th>Success</th><th>Errors</th><th>Speed</th><th>Slowest 5%</th><th>First token</th><th>Tokens / sec</th><th>Tokens</th><th>Keys</th></tr></thead><tbody>' + rows.map(function (p) { var k = kc[p.platform]; return '<tr><td><b>' + esc(prov(p)) + '</b></td><td>' + share(p.requests, max) + '</td><td>' + rate(p.successRate) + '</td><td class="mono">' + n0(p.errorCount) + '</td><td class="mono">' + ms(p.avgLatencyMs) + '</td><td class="mono">' + ms(p.p95LatencyMs) + '</td><td class="mono">' + ms(p.avgTtfbMs) + '</td><td class="mono">' + (p.avgTokensPerSecond == null ? '–' : Math.round(p.avgTokensPerSecond)) + '</td><td class="mono note">' + short(p.totalInputTokens) + ' in · ' + short(p.totalOutputTokens) + ' out</td><td class="mono">' + (k ? k.ok + '/' + k.n : '–') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function keysPage(d) {
    var use = {}; d.byKey.forEach(function (k) { use[k.keyId] = k; });
    var q = I.kq.toLowerCase(), rows = d.keys.filter(function (k) { return !q || (k.label + ' ' + k.platform).toLowerCase().indexOf(q) > -1; });
    var st = function (k) { return !k.enabled ? pill('Off') : k.status === 'healthy' ? pill('Healthy', 'ok') : k.status === 'unknown' || !k.status ? pill('Not checked') : pill(String(k.status).replace(/_/g, ' '), 'bad'); };
    var max = d.byKey.reduce(function (a, k) { return Math.max(a, k.requests); }, 0);
    return '<div class="toolbar"><div class="search">' + A.ic('search') + '<input class="input" id="aik" type="search" placeholder="Filter keys" value="' + esc(I.kq) + '" data-ain="kq" aria-label="Filter keys"></div></div>' +
      (rows.length ? '<div class="tablewrap"><table><thead><tr><th>Key</th><th>Provider</th><th>State</th><th>Requests</th><th>Success</th><th>Speed</th><th>Tokens</th><th>Checked</th><th>Cooling down</th></tr></thead><tbody>' + rows.map(function (k) { var u = use[k.id]; return '<tr><td><b>' + esc(k.label || 'Key ' + k.id) + '</b><div class="note mono">' + esc(k.keyless ? 'no key needed' : k.masked || '') + '</div></td><td>' + esc(k.platform) + (k.base ? '<div class="note mono">' + esc(host(k.base)) + '</div>' : '') + '</td><td>' + st(k) + (k.error ? '<div class="note" style="max-width:240px;color:var(--bad)">' + esc(k.error) + '</div>' : '') + '</td><td>' + (u ? share(u.requests, max) : '<span class="note">none</span>') + '</td><td>' + (u ? rate(u.successRate) : '–') + '</td><td class="mono">' + (u ? ms(u.avgLatencyMs) : '–') + '</td><td class="mono note">' + (u ? short(u.totalInputTokens) + ' in · ' + short(u.totalOutputTokens) + ' out' : '–') + '</td><td class="note">' + ago(k.checked) + '</td><td class="note">' + (k.cooldowns.length ? k.cooldowns.slice(0, 3).map(function (c) { return esc(c.model) + ' (' + left(c.left) + ')'; }).join('<br>') + (k.cooldowns.length > 3 ? '<br>+' + (k.cooldowns.length - 3) + ' more' : '') : '–') + '</td></tr>'; }).join('') + '</tbody></table></div>' : empty('No keys', 'Add provider keys in FreeLLMAPI and they appear here.'));
  }
  function clientsPage(d) {
    var rows = d.byClient.slice().sort(cmp('requests')), max = rows.length ? rows[0].requests : 0;
    if (!rows.length) return empty('No apps yet', 'FreeLLMAPI tells apart the tools that call it (editors, chat apps, scripts). They show up here once they send requests.');
    return '<div class="tablewrap"><table><thead><tr><th>App</th><th>Requests</th><th>Success</th><th>Speed</th><th>Tokens in</th><th>Tokens out</th><th>Last seen</th></tr></thead><tbody>' + rows.map(function (c) { return '<tr><td><b>' + esc(c.clientAgent || 'Unknown') + '</b></td><td>' + share(c.requests, max) + '</td><td>' + rate(c.successRate) + '</td><td class="mono">' + ms(c.avgLatencyMs) + '</td><td class="mono">' + short(c.totalInputTokens) + '</td><td class="mono">' + short(c.totalOutputTokens) + '</td><td class="note">' + ago(c.lastSeenAt) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function errorsPage(d) {
    var det = d.errorDist.detailed || [], bp = d.errorDist.byPlatform || [];
    var out = '<div class="grid ich-grid">';
    var bc = d.errorDist.byCategory || [], bm = bc.reduce(function (a, x) { return Math.max(a, x.count); }, 0);
    out += '<div class="card"><h2 style="font-size:17px;margin-bottom:10px">By kind</h2>' + (bc.length ? bc.map(function (e) { return '<div class="ibar" style="grid-template-columns:minmax(0,160px) 1fr 46px"><span>' + esc(e.category) + '</span><div class="track"><div class="fill bad" style="width:' + Math.max(2, Math.round(e.count / bm * 100)) + '%"></div></div><b class="mono">' + short(e.count) + '</b></div>'; }).join('') : '<p class="note">No failures in this range.</p>') + '</div>';
    var pm = bp.reduce(function (a, x) { return Math.max(a, x.count); }, 0);
    out += '<div class="card"><h2 style="font-size:17px;margin-bottom:10px">By provider</h2>' + (bp.length ? bp.slice().sort(cmp('count')).map(function (e) { return '<div class="ibar" style="grid-template-columns:minmax(0,160px) 1fr 46px"><span>' + esc(prov(e)) + '</span><div class="track"><div class="fill bad" style="width:' + Math.max(2, Math.round(e.count / pm * 100)) + '%"></div></div><b class="mono">' + short(e.count) + '</b></div>'; }).join('') : '<p class="note">None.</p>') + '</div></div>';
    if (det.length) out += '<h2 style="font-size:19px;margin:20px 0 10px">Model by model</h2><div class="tablewrap"><table><thead><tr><th>Provider</th><th>Model</th><th>Kind</th><th>Count</th></tr></thead><tbody>' + det.slice().sort(cmp('count')).slice(0, 60).map(function (e) { return '<tr><td>' + esc(e.platform) + '</td><td class="mono">' + esc(e.model_id) + '</td><td>' + esc(e.error_category) + '</td><td class="mono">' + n0(e.count) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    out += '<h2 style="font-size:19px;margin:22px 0 10px">Latest failures</h2>' + (d.errors.length ? '<div class="tablewrap"><table><thead><tr><th>When</th><th>Provider</th><th>Model</th><th>Error</th><th>Took</th><th></th></tr></thead><tbody>' + d.errors.map(function (e) { return '<tr class="clk" data-ai="req" data-id="' + e.id + '" tabindex="0"><td class="note">' + esc(when(e.createdAt)) + '</td><td>' + esc(prov(e)) + '</td><td class="mono">' + esc(e.modelId || '') + '</td><td style="max-width:360px;color:var(--bad)">' + esc(String(e.error || '').slice(0, 220)) + '</td><td class="mono">' + ms(e.latencyMs) + '</td><td><span class="note">Details</span></td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="note">No failures in this range.</p>');
    return out;
  }
  function logPage(d) {
    var provs = d.byPlatform.map(function (p) { return p.platform === 'custom' && p.endpoint ? 'custom:' + p.endpoint : p.platform; });
    var sel = function (id, cur, opts) { return '<select class="input" id="' + id + '" style="width:auto;min-width:130px">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; };
    var bar = '<div class="toolbar" style="gap:10px;flex-wrap:wrap">' + sel('ai_st', I.lstatus, [['', 'Any result'], ['success', 'Succeeded'], ['error', 'Failed'], ['canceled', 'Cancelled']]) + sel('ai_pv', I.lprov, [['', 'Any provider']].concat(provs.filter(function (p, i) { return provs.indexOf(p) === i; }).map(function (p) { return [p, p.replace(/^custom:/, 'custom · ')]; }))) + '</div>';
    var L = I.log;
    if (!L) return bar + (I.lerr ? '<div class="banner"><i class="dot bad"></i><span>' + esc(I.lerr) + '</span></div>' : '<p class="note">Loading requests...</p>');
    if (!L.rows.length) return bar + empty('No requests', 'Nothing matches these filters in this range.');
    var pg = '<div style="display:flex;gap:10px;align-items:center;margin-top:12px"><button class="btn sm" data-ai="prev"' + (I.loff ? '' : ' disabled') + '>Newer</button><span class="note">' + (I.loff + 1) + '–' + (I.loff + L.rows.length) + ' of ' + n0(L.total) + '</span><button class="btn sm" data-ai="next"' + (I.loff + PAGE < L.total ? '' : ' disabled') + '>Older</button></div>';
    return bar + '<div class="tablewrap"><table><thead><tr><th>When</th><th>Result</th><th>Model</th><th>App</th><th>Tokens</th><th>Took</th><th>Tries</th></tr></thead><tbody>' + L.rows.map(function (r) { return '<tr class="clk" data-ai="req" data-id="' + r.id + '" tabindex="0"><td class="note">' + esc(when(r.createdAt)) + '</td><td>' + (r.status === 'success' ? pill('OK', 'ok') : r.status === 'canceled' ? pill('Cancelled') : pill('Failed', 'bad')) + '</td><td><b>' + esc(r.modelId || r.requestedModel || '') + '</b><div class="note mono">' + esc(r.platform || '') + (r.requestType && r.requestType !== 'chat' ? ' · ' + esc(r.requestType) : '') + '</div></td><td>' + esc(r.clientAgent || '–') + '</td><td class="mono note">' + short(r.inputTokens) + ' in · ' + short(r.outputTokens) + ' out</td><td class="mono">' + ms(r.latencyMs) + '</td><td class="mono">' + (r.attemptCount || 1) + '</td></tr>'; }).join('') + '</tbody></table></div>' + pg;
  }
  function detailModal() {
    var r = I.det; if (!r) return '';
    var body = r.error && !r.platform ? '<p class="note" style="color:var(--bad)">' + esc(r.error) + '</p>' : I.dbusy && !r.platform ? '<p class="note">Loading...</p>' :
      '<div class="ikv"><span>When</span><b>' + esc(when(r.createdAt)) + '</b><span>Result</span><b>' + (r.status === 'success' ? 'Succeeded' : r.status === 'canceled' ? 'Cancelled' : 'Failed') + '</b><span>Asked for</span><b class="mono">' + esc(r.requestedModel || 'automatic') + '</b><span>Served by</span><b class="mono">' + esc((r.platform || '') + ' / ' + (r.servedModel || r.modelId || '')) + '</b><span>Kind</span><b>' + esc(r.requestType || 'chat') + '</b><span>Tokens</span><b>' + n0(r.inputTokens) + ' in · ' + n0(r.outputTokens) + ' out</b><span>Total time</span><b>' + ms(r.latencyMs) + '</b><span>First token</span><b>' + ms(r.ttfbMs) + '</b><span>App</span><b>' + esc(r.clientAgent || '–') + '</b><span>From</span><b class="mono">' + esc(r.clientIp || '–') + '</b></div>' +
      (r.error ? '<div class="banner" style="margin-top:12px"><i class="dot bad"></i><span>' + esc(r.error) + '</span></div>' : '') +
      '<h3 style="font-size:16px;margin:16px 0 8px">Tries (' + (r.attempts || []).length + ')</h3>' + ((r.attempts || []).length ? '<div class="tablewrap"><table><thead><tr><th>#</th><th>Provider and model</th><th>Key</th><th>Outcome</th><th>Starts at</th><th>Took</th></tr></thead><tbody>' + r.attempts.map(function (a) { return '<tr><td class="mono">' + a.ordinal + '</td><td><b>' + esc(a.platform) + '</b><div class="note mono">' + esc(a.modelId) + '</div></td><td>' + esc(a.keyLabel || (a.keyOrdinal != null ? 'Key ' + a.keyOrdinal : '–')) + '</td><td>' + (a.outcome === 'success' ? pill('OK', 'ok') : pill(String(a.outcome || 'failed').replace(/_/g, ' '), 'bad')) + (a.errorSummary ? '<div class="note" style="max-width:260px">' + esc(String(a.errorSummary).slice(0, 200)) + '</div>' : '') + '</td><td class="mono">' + ms(a.startOffsetMs) + '</td><td class="mono">' + ms(a.durationMs) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="note">No attempt details were kept for this request.</p>');
    return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h2 style="font-size:20px">Request ' + esc(r.id) + '</h2><button class="btn sm" data-act="mx2">Close</button></div>' + body;
  }

  /* ---------- view ---------- */
  function view() {
    if (window.AOSSrv) window.AOSSrv.reset();
    var rseg = '<div class="seg" role="group" aria-label="Time range">' + RANGES.map(function (r) { return '<button data-ai="range" data-r="' + r[0] + '" aria-pressed="' + (I.range === r[0]) + '">' + r[1] + '</button>'; }).join('') + '</div>';
    var head = '<div class="wrap"><div class="pagehead"><div><h1>Insights</h1></div><div style="display:flex;gap:10px"><button class="btn" data-ai="refresh">' + (I.busy ? 'Refreshing...' : 'Refresh') + '</button></div></div>' + A.insTabs('ai') + '<div class="toolbar" style="margin-bottom:14px;justify-content:space-between">' + '<div class="chips">' + TABS.map(function (t) { return '<button class="chip" data-ai="tab" data-t="' + t[0] + '" aria-pressed="' + (I.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' + rseg + '</div>';
    var d = I.d;
    if (!d) {
      if (I.busy) return head + '<p class="note">Loading from FreeLLMAPI...</p></div>';
      if (I.code === 'not_configured') return head + '<div class="card"><h2 style="font-size:20px;margin-bottom:6px">AI insights are not connected yet</h2><p class="note" style="margin:0 0 14px">Add your FreeLLMAPI dashboard address, email and password in Settings. The address can stay blank when the assistant address is already set.</p><button class="btn primary" data-act="nav" data-v="settings">Open Settings</button></div></div>';
      return head + '<div class="banner"><i class="dot bad"></i><span>' + esc(I.err || 'Could not load.') + '</span></div><div style="margin-top:12px"><button class="btn" data-ai="refresh">Try again</button> <button class="btn" data-act="nav" data-v="settings">Open Settings</button></div></div>';
    }
    var body = I.tab === 'models' ? modelsPage(d) : I.tab === 'providers' ? providersPage(d) : I.tab === 'keys' ? keysPage(d) : I.tab === 'clients' ? clientsPage(d) : I.tab === 'errors' ? errorsPage(d) : I.tab === 'log' ? logPage(d) : overview(d);
    var warn = I.err ? '<div class="banner" style="margin-bottom:12px"><i class="dot bad"></i><span>Could not refresh: ' + esc(I.err) + '</span></div>' : '';
    return head + warn + body + '<p class="note" style="margin-top:14px">From FreeLLMAPI · updated ' + esc(ago(d.takenAt)) + '</p>' + '</div>';
  }

  /* ---------- hooks ---------- */
  function onGo(v) { if (v !== 'ai') return; if ((!I.d || I.d.range !== I.range) && !I.busy) load(false); else if (Date.now() - Date.parse(I.d.takenAt) > 30000 && !I.busy) load(false, true); if (I.tab === 'log' && !I.log && !I.lbusy) loadLog(); }
  function after(r) { I.d = null; I.log = null; I.err = null; I.code = null; if (r && r.connected) load(true); }
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-ai]'); if (!el) return; var a = el.getAttribute('data-ai');
    if (a === 'tab') { I.tab = el.getAttribute('data-t'); A.redraw(); if (I.tab === 'log' && !I.log && !I.lbusy) loadLog(); return; }
    if (a === 'range') { I.range = el.getAttribute('data-r'); I.log = null; I.loff = 0; load(false); if (I.tab === 'log') loadLog(); return; }
    if (a === 'refresh') { load(true); if (I.tab === 'log') loadLog(); return; }
    if (a === 'req') return void openReq(el.getAttribute('data-id'));
    if (a === 'next') { I.loff += PAGE; return void loadLog(); }
    if (a === 'prev') { I.loff = Math.max(0, I.loff - PAGE); return void loadLog(); }
  });
  document.addEventListener('keydown', function (ev) { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('tr[data-ai="req"]')) { ev.preventDefault(); openReq(ev.target.getAttribute('data-id')); } });
  document.addEventListener('input', function (ev) { var t = ev.target, k = t.getAttribute && t.getAttribute('data-ain'); if (!k) return; I[k] = t.value; var pos = t.selectionStart; A.redraw(); var n = document.getElementById(t.id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { } } });
  document.addEventListener('change', function (ev) { var id = ev.target.id; if (id === 'ai_st' || id === 'ai_pv') { I.lstatus = $('#ai_st').value; I.lprov = $('#ai_pv').value; I.loff = 0; loadLog(); } });
  setInterval(function () { if (S.view !== 'ai' || document.hidden || I.busy || !$('#modal').hidden) return; load(false, true); }, 60000);

  window.AOSAI = { view: view, onGo: onGo, after: after, state: I };
})();
