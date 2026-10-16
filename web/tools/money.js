/* Money app, part 1: shared pieces, charts, the transaction form, Overview, Transactions and Accounts. */
(function () {
'use strict';
var T = window.T, $ = T.$, esc = T.esc;
var M = window.M = { after: {}, st: null, tab: 'overview', routes: {}, tx: { items: [], total: 0, income: 0, expense: 0, loading: false, f: { q: '', acct: '', cat: '', type: '', range: 'month' } }, rep: null, payees: [] };
M.api = function (m, p, b) { return T.api('/api/money' + p, { method: m, json: b }); };
M.set = function (st) { M.st = st; return st; };
var CURSYM = { USD: '$', EUR: '€', GBP: '£', INR: '₹', TZS: 'TSh', KES: 'KSh', UGX: 'USh', ZAR: 'R', AED: 'AED', ZMW: 'ZK', CDF: 'FC' }, ZERO = { TZS: 1, UGX: 1, JPY: 1, KRW: 1, CDF: 1 };
M.fmt = function (n, cur, o) {
  o = o || {}; cur = cur || (M.st && M.st.settings.base) || 'USD'; n = Number(n) || 0; var z = ZERO[cur] ? 0 : 2, a = Math.abs(n), s;
  if (o.compact && a >= 10000) s = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(a); else s = new Intl.NumberFormat('en', { minimumFractionDigits: o.whole ? 0 : z, maximumFractionDigits: o.whole ? 0 : z }).format(a);
  var sym = CURSYM[cur]; var body = sym && sym.length === 1 ? sym + s : (sym || cur) + ' ' + s; return (n < 0 ? '−' : o.plus && n > 0 ? '+' : '') + body;
};
M.cat = function (id) { return (M.st.categories.filter(function (c) { return c.id === id; })[0]) || null; };
M.acct = function (id) { return (M.st.accounts.filter(function (a) { return a.id === id; })[0]) || null; };
M.today = function () { return M.st ? M.st.today : new Date().toISOString().slice(0, 10); };
M.ym = function (d) { return d.slice(0, 7); };
M.monthName = function (ym, long) { var p = ym.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, 15)).toLocaleDateString('en', { month: long ? 'long' : 'short', year: long ? 'numeric' : '2-digit', timeZone: 'UTC' }); };
M.dayName = function (d) { var t = new Date(d + 'T12:00:00Z'), td = M.today(); if (d === td) return 'Today'; var y = new Date(td + 'T12:00:00Z'); y.setUTCDate(y.getUTCDate() - 1); if (d === y.toISOString().slice(0, 10)) return 'Yesterday'; return t.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: d.slice(0, 4) === td.slice(0, 4) ? undefined : 'numeric', timeZone: 'UTC' }); };
M.initial = function (s) { return (String(s || '?').trim().charAt(0) || '?').toUpperCase(); };
M.tone = function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return ['#f68712', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6', '#eab308'][h % 10]; };
M.opts = function (list, sel, empty) { return (empty ? '<option value="">' + esc(empty) + '</option>' : '') + list.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === sel ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join(''); };
M.acctOpts = function (sel, empty, skip) { return M.opts(M.st.accounts.filter(function (a) { return !a.archived && a.id !== skip || a.id === sel; }).map(function (a) { return [a.id, a.name + ' (' + a.currency + ')']; }), sel, empty); };
M.catOpts = function (kind, sel, empty) { return M.opts(M.st.categories.filter(function (c) { return c.kind === kind; }).map(function (c) { return [c.id, c.name]; }), sel, empty); };
M.rangeOf = function (k) {
  var t = M.today(), y = +t.slice(0, 4), mo = +t.slice(5, 7), p = function (n) { return ('0' + n).slice(-2); }, last = function (yy, mm) { return new Date(Date.UTC(yy, mm, 0)).getUTCDate(); };
  if (k === 'month') return [y + '-' + p(mo) + '-01', y + '-' + p(mo) + '-' + last(y, mo)];
  if (k === 'last') { var yy = mo === 1 ? y - 1 : y, mm = mo === 1 ? 12 : mo - 1; return [yy + '-' + p(mm) + '-01', yy + '-' + p(mm) + '-' + last(yy, mm)]; }
  if (k === '3m') { var m3 = mo - 2, y3 = y; if (m3 < 1) { m3 += 12; y3--; } return [y3 + '-' + p(m3) + '-01', y + '-' + p(mo) + '-' + last(y, mo)]; }
  if (k === 'year') return [y + '-01-01', y + '-12-31'];
  return ['', ''];
};
M.err = function (e) { T.toast(e && e.message ? e.message : 'Something went wrong'); };

/* ---------- modal ---------- */
M.modal = function (html, onOpen) {
  var m = $('#mmodal'); m.innerHTML = '<div class="mbox" role="dialog" aria-modal="true">' + html + '</div>'; m.hidden = false; M._prev = document.activeElement;
  var f = m.querySelector('input:not([type=hidden]),select,textarea'); if (f) setTimeout(function () { f.focus(); }, 30); if (onOpen) onOpen(m);
};
M.close = function () { var m = $('#mmodal'); m.hidden = true; m.innerHTML = ''; try { if (M._prev) M._prev.focus(); } catch (e) {} };
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#mmodal').hidden) M.close(); });
$('#mmodal').addEventListener('mousedown', function (e) { if (e.target === this) M.close(); });
M.confirm = function (msg, yes, label) { M.modal('<h2>' + esc(msg) + '</h2><div class="acts"><button class="mbtn" data-m="close">Cancel</button><button class="mbtn pri" id="cyes">' + esc(label || 'Yes') + '</button></div>'); $('#cyes').onclick = function () { M.close(); yes(); }; };

/* ---------- tooltip for charts ---------- */
var tip; function showTip(e, html) { if (!tip) { tip = document.createElement('div'); tip.className = 'mtip'; document.body.appendChild(tip); } tip.innerHTML = html; tip.style.display = 'block'; var x = Math.min(innerWidth - tip.offsetWidth - 8, e.clientX + 12), y = Math.min(innerHeight - tip.offsetHeight - 8, e.clientY + 14); tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
function hideTip() { if (tip) tip.style.display = 'none'; }
document.addEventListener('mousemove', function (e) { var g = e.target.closest && e.target.closest('[data-tip]'); if (g) showTip(e, g.getAttribute('data-tip')); else hideTip(); });
document.addEventListener('focusin', function (e) { var g = e.target.closest && e.target.closest('[data-tip]'); if (g) { var r = g.getBoundingClientRect(); showTip({ clientX: r.left, clientY: r.top }, g.getAttribute('data-tip')); } });
document.addEventListener('focusout', hideTip);

/* ---------- charts (plain SVG) ---------- */
function niceMax(v) { if (v <= 0) return 10; var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
M.barChart = function (months) { // income vs expense per month
  var W = 640, H = 220, L = 46, B = 24, Tp = 8, max = niceMax(Math.max.apply(null, months.map(function (m) { return Math.max(m.income, m.expense); }).concat([1]))), n = months.length, cw = (W - L - 6) / n, bw = Math.min(16, cw / 2 - 3), h = '';
  [0, .5, 1].forEach(function (f) { var y = Tp + (H - B - Tp) * (1 - f); h += '<line class="grid" x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + M.fmt(max * f, null, { compact: true, whole: true }).replace(/^[^\d]*/, '') + '</text>'; });
  months.forEach(function (m, i) {
    var x = L + i * cw + cw / 2, hi = (H - B - Tp) * (m.income / max), he = (H - B - Tp) * (m.expense / max), yb = H - B;
    var tp = '<b>' + esc(M.monthName(m.m, true)) + '</b><br>Income ' + esc(M.fmt(m.income)) + '<br>Spent ' + esc(M.fmt(m.expense));
    h += '<g data-tip="' + esc(tp) + '" tabindex="0" aria-label="' + esc(M.monthName(m.m, true) + ': income ' + M.fmt(m.income) + ', spent ' + M.fmt(m.expense)) + '"><rect class="hv" x="' + (x - cw / 2) + '" y="' + Tp + '" width="' + cw + '" height="' + (H - B - Tp) + '"/><rect x="' + (x - bw - 1) + '" y="' + (yb - hi) + '" width="' + bw + '" height="' + Math.max(hi, 0) + '" rx="3" fill="var(--ok)"/><rect x="' + (x + 1) + '" y="' + (yb - he) + '" width="' + bw + '" height="' + Math.max(he, 0) + '" rx="3" fill="var(--accent)"/>' + (n <= 12 || i % 2 === 0 ? '<text x="' + x + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(M.monthName(m.m).split(' ')[0]) + '</text>' : '') + '</g>';
  });
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Income and spending by month">' + h + '</svg><div class="legend"><span><i style="background:var(--ok)"></i>Income</span><span><i style="background:var(--accent)"></i>Spent</span></div>';
};
M.donut = function (items, total, centre) { // items: [{name,color,amount,pct}]
  var R = 70, r = 46, cx = 80, cy = 80, a0 = -Math.PI / 2, h = '', sum = items.reduce(function (s, x) { return s + x.amount; }, 0) || 1;
  if (items.length === 1) h = '<circle cx="' + cx + '" cy="' + cy + '" r="' + ((R + r) / 2) + '" fill="none" stroke="' + items[0].color + '" stroke-width="' + (R - r) + '"/>';
  else items.forEach(function (it) { var a1 = a0 + it.amount / sum * Math.PI * 2 - 0.012, big = a1 - a0 > Math.PI ? 1 : 0; if (a1 <= a0) return; var p = function (rad, a) { return (cx + rad * Math.cos(a)).toFixed(2) + ' ' + (cy + rad * Math.sin(a)).toFixed(2); }; h += '<path data-tip="' + esc('<b>' + it.name + '</b><br>' + M.fmt(it.amount) + ' · ' + Math.round(it.pct) + '%') + '" tabindex="0" d="M' + p(R, a0) + ' A' + R + ' ' + R + ' 0 ' + big + ' 1 ' + p(R, a1) + ' L' + p(r, a1) + ' A' + r + ' ' + r + ' 0 ' + big + ' 0 ' + p(r, a0) + ' Z" fill="' + it.color + '"/>'; a0 += it.amount / sum * Math.PI * 2; });
  return '<svg class="chart" style="max-width:190px;margin:0 auto" viewBox="0 0 160 160" role="img" aria-label="Share by category">' + h + '<text x="80" y="76" text-anchor="middle" style="font:600 13px var(--display);fill:var(--fg)">' + esc(centre || '') + '</text><text x="80" y="93" text-anchor="middle">' + esc(total || '') + '</text></svg>';
};
M.line = function (pts, label) { // pts: [{m,value}]
  var W = 640, H = 170, L = 8, B = 22, Tp = 14, vals = pts.map(function (p) { return p.value; }), lo = Math.min.apply(null, vals.concat([0])), hi = Math.max.apply(null, vals.concat([1])), rng = (hi - lo) || 1, n = pts.length;
  var X = function (i) { return L + (W - L * 2) * (n === 1 ? .5 : i / (n - 1)); }, Y = function (v) { return Tp + (H - B - Tp) * (1 - (v - lo) / rng); }, d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.value).toFixed(1); }).join('');
  var h = '<path d="' + d + 'L' + X(n - 1) + ' ' + (H - B) + 'L' + X(0) + ' ' + (H - B) + 'Z" fill="var(--accent)" opacity=".12"/><path d="' + d + '" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>';
  pts.forEach(function (p, i) { h += '<g data-tip="' + esc('<b>' + M.monthName(p.m, true) + '</b><br>' + M.fmt(p.value)) + '" tabindex="0"><rect class="hv" x="' + (X(i) - 14) + '" y="0" width="28" height="' + (H - B) + '"/><circle cx="' + X(i) + '" cy="' + Y(p.value) + '" r="' + (i === n - 1 ? 4.5 : 3) + '" fill="var(--bg)" stroke="var(--accent)" stroke-width="2"/>' + (i % 2 === 0 || n < 7 ? '<text x="' + X(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(M.monthName(p.m).split(' ')[0]) + '</text>' : '') + '</g>'; });
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label || 'Trend') + '">' + h + '</svg>';
};
M.progress = function (pct, kind) { var k = kind || (pct >= 100 ? 'bad' : pct >= 85 ? 'warn' : ''); return '<div class="bar ' + k + '" role="progressbar" aria-valuenow="' + Math.round(Math.min(pct, 100)) + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + Math.min(100, Math.max(0, pct)) + '%"></i></div>'; };

/* ---------- transaction form ---------- */
M.txForm = function (t, pre) {
  t = t || {}; pre = pre || {}; var type = t.type || pre.type || 'expense', isNew = !t.id;
  var acct = t.acct || pre.acct || (M.st.accounts.filter(function (a) { return !a.archived; })[0] || {}).id || '';
  if (!M.st.accounts.length) { M.modal('<h2>Add an account first</h2><p class="tmuted" style="margin:0">Money needs somewhere to live: a bank account, wallet or mobile money.</p><div class="acts"><button class="mbtn" data-m="close">Not now</button><button class="mbtn pri" data-m="newacct">Add an account</button></div>'); return; }
  M.modal('<h2>' + (isNew ? 'Add a transaction' : 'Edit transaction') + '</h2><div class="seg" id="tseg" role="radiogroup" aria-label="Type"><button type="button" data-ty="expense" class="' + (type === 'expense' ? 'on' : '') + '">Expense</button><button type="button" data-ty="income" class="' + (type === 'income' ? 'on' : '') + '">Income</button><button type="button" data-ty="transfer" class="' + (type === 'transfer' ? 'on' : '') + '">Transfer</button></div>' +
    '<div class="row2"><label>Amount<input class="tin num" id="tamt" inputmode="decimal" autocomplete="off" value="' + (t.amount || '') + '" placeholder="0.00"></label><label>Date<input class="tin" id="tdate" type="date" value="' + esc(t.date || M.today()) + '"></label></div>' +
    '<div class="row2"><label><span id="tal">' + (type === 'income' ? 'Into account' : 'From account') + '</span><select id="tacct">' + M.acctOpts(acct) + '</select></label><label id="tcw"' + (type === 'transfer' ? ' hidden' : '') + '>Category<select id="tcat">' + M.catOpts(type === 'income' ? 'income' : 'expense', t.cat || '', 'No category') + '</select></label><label id="ttw"' + (type === 'transfer' ? '' : ' hidden') + '>To account<select id="tto">' + M.acctOpts(t.to || '', 'Choose...', acct) + '</select></label></div>' +
    '<label id="trw" hidden>Amount received<input class="tin num" id="tramt" inputmode="decimal" value="' + (t.toAmount || '') + '"><small id="trn" class="tmuted"></small></label>' +
    '<label id="tpw"' + (type === 'transfer' ? ' hidden' : '') + '>' + (type === 'income' ? 'From' : 'Paid to') + '<input class="tin" id="tpay" list="tpays" value="' + esc(t.payee || '') + '" autocomplete="off"><datalist id="tpays">' + M.payees.map(function (p) { return '<option value="' + esc(p) + '">'; }).join('') + '</datalist></label>' +
    '<label>Note<input class="tin" id="tnote" value="' + esc(t.note || '') + '" maxlength="300"></label><div class="err" id="terr" role="alert"></div>' +
    '<div class="acts">' + (isNew ? '' : '<button class="mbtn dng" data-m="deltx" data-id="' + t.id + '">Delete</button><span style="flex:1"></span>') + '<button class="mbtn" data-m="close">Cancel</button><button class="mbtn pri" id="tsave">' + (isNew ? 'Add' : 'Save') + '</button></div>',
  function () {
    var st = { type: type }; var fx = function () { var a = M.acct($('#tacct').value), b = M.acct($('#tto').value), show = st.type === 'transfer' && a && b && a.currency !== b.currency; $('#trw').hidden = !show; if (show) { var r = (M.st.rates.map[a.currency] ? (M.st.rates.map[b.currency] || 0) / M.st.rates.map[a.currency] : 0); $('#trn').textContent = 'In ' + b.currency + '.' + (r ? ' About ' + M.fmt((Number($('#tamt').value) || 0) * r, b.currency) + ' at today\'s rate.' : ''); } };
    $('#tseg').onclick = function (e) { var b = e.target.closest('[data-ty]'); if (!b) return; st.type = b.dataset.ty; [].forEach.call(this.children, function (c) { c.classList.toggle('on', c === b); }); var tr = st.type === 'transfer'; $('#tcw').hidden = tr; $('#tpw').hidden = tr; $('#ttw').hidden = !tr; $('#tal').textContent = st.type === 'income' ? 'Into account' : 'From account'; if (!tr) { $('#tcat').innerHTML = M.catOpts(st.type === 'income' ? 'income' : 'expense', '', 'No category'); } fx(); };
    $('#tacct').onchange = fx; $('#tto').onchange = fx; $('#tamt').oninput = fx; fx();
    $('#tsave').onclick = function () {
      var b = { type: st.type, amount: $('#tamt').value.replace(/,/g, ''), date: $('#tdate').value, acct: $('#tacct').value, note: $('#tnote').value };
      if (st.type === 'transfer') { b.to = $('#tto').value; if (!$('#trw').hidden && $('#tramt').value) b.toAmount = $('#tramt').value.replace(/,/g, ''); b.cat = ''; b.payee = ''; } else { b.cat = $('#tcat').value; b.payee = $('#tpay').value; b.to = ''; }
      $('#tsave').disabled = true; M.api(isNew ? 'POST' : 'PUT', isNew ? '/tx' : '/tx/' + t.id, b).then(function () { M.close(); T.toast(isNew ? 'Added' : 'Saved'); return M.reload(); }).catch(function (e) { $('#terr').textContent = e.message; $('#tsave').disabled = false; });
    };
    $('#mmodal').onkeydown = function (e) { if (e.key === 'Enter' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') $('#tsave').click(); };
  });
};

/* ---------- loading ---------- */
M.reload = function () { return M.api('GET', '/state').then(function (s) { M.set(s); return M.loadTx(true); }).then(function () { return M.loadRep(); }).then(function () { M.draw(); }).catch(M.err); };
M.loadTx = function (reset) {
  var f = M.tx.f, r = M.rangeOf(f.range), q = ['limit=60', 'offset=' + (reset ? 0 : M.tx.items.length)]; if (r[0]) q.push('from=' + r[0], 'to=' + r[1]); ['acct', 'cat', 'type', 'q'].forEach(function (k) { if (f[k]) q.push(k + '=' + encodeURIComponent(f[k])); });
  return M.api('GET', '/tx?' + q.join('&')).then(function (r2) { M.tx.items = reset ? r2.items : M.tx.items.concat(r2.items); M.tx.total = r2.total; M.tx.income = r2.income; M.tx.expense = r2.expense; r2.items.forEach(function (t) { if (t.payee && M.payees.indexOf(t.payee) < 0) M.payees.push(t.payee); }); });
};
M.loadRep = function (q) { return M.api('GET', '/report' + (q || '')).then(function (r) { M.rep = r; return r; }); };

/* ---------- overview ---------- */
M.routes.overview = function () {
  var s = M.st, r = M.rep, nw = s.netWorth, h = '<div class="mhead"><div><h1>Overview</h1><p>' + esc(M.monthName(M.ym(M.today()), true)) + ' in ' + esc(s.settings.base) + '</p></div><span class="sp"></span><button class="mbtn pri" data-m="newtx">Add transaction</button></div>';
  if (s.missingRates.length) h += '<div class="mban"><span>No exchange rate for <b>' + esc(s.missingRates.join(', ')) + '</b>. Those amounts are counted at face value.</span><button class="mbtn sm" data-m="rates">Get rates</button></div>';
  if (!s.accounts.length) return h + '<div class="mc mempty"><b>Welcome to Money</b><span>Add the places your money lives, then record spending and income. Budgets, subscriptions and investments build on the same accounts.</span><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="mbtn pri" data-m="newacct">Add your first account</button><button class="mbtn" data-tab="settings">Choose your main currency</button></div></div>';
  var hist = r ? r.netWorth : [], prev = hist.length > 1 ? hist[hist.length - 2].value : null, delta = prev == null ? null : nw.total - prev;
  h += '<div class="mgrid"><div class="mc s4"><div class="kpi"><small>Net worth</small><b>' + esc(M.fmt(nw.total)) + '</b><span>' + (delta == null ? '' : '<span class="' + (delta >= 0 ? 'pos' : 'neg') + '">' + esc(M.fmt(delta, null, { plus: true })) + '</span> vs last month') + '</span></div></div>' +
    '<div class="mc s4"><div class="kpi"><small>Income this month</small><b class="pos">' + esc(M.fmt(r ? r.income : 0)) + '</b><span>Saved ' + (r && r.income ? Math.round(r.saveRate) + '% of it' : 'nothing yet') + '</span></div></div>' +
    '<div class="mc s4"><div class="kpi"><small>Spent this month</small><b>' + esc(M.fmt(r ? r.expense : 0)) + '</b><span>' + (s.subTotals.count ? esc(M.fmt(s.subTotals.monthly)) + ' of it is subscriptions' : 'No subscriptions tracked') + '</span></div></div>';
  h += '<div class="mc s8"><h2>Income and spending</h2>' + (r ? M.barChart(r.months) : '') + '</div>';
  var cats = r ? r.categories.slice(0, 6) : []; h += '<div class="mc s4"><h2>Where it went</h2>' + (cats.length ? M.donut(cats, M.fmt(r.expense, null, { compact: true }), 'Spent') + '<div class="mbig" style="margin-top:8px">' + cats.map(function (c) { return '<div style="display:flex;gap:8px;font-size:13px"><i class="mdot" style="width:10px;height:10px;border-radius:3px;background:' + c.color + ';margin-top:5px"></i><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(c.name) + '</span><b class="num" style="font-weight:500">' + esc(M.fmt(c.amount, null, { whole: true })) + '</b></div>'; }).join('') + '</div>' : '<p class="tmuted">No spending recorded this month.</p>') + '</div>';
  var bud = r ? r.budgets.slice(0, 5) : []; h += '<div class="mc s6"><h2>Budgets <span class="sp"></span><button class="mbtn sm" data-tab="budgets">Open</button></h2>' + (bud.length ? bud.map(function (b) { return '<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:5px"><span>' + esc(b.name) + '</span><span class="num tmuted">' + esc(M.fmt(b.spent, null, { whole: true })) + ' of ' + esc(M.fmt(b.budget, null, { whole: true })) + '</span></div>' + M.progress(b.pct) + '</div>'; }).join('') : '<p class="tmuted">Set a monthly limit for the things you want to watch, such as Groceries or Fuel.</p><button class="mbtn sm" data-tab="budgets">Set budgets</button>') + '</div>';
  var up = s.subs.filter(function (x) { return x.active; }).sort(function (a, b) { return a.next.localeCompare(b.next); }).slice(0, 4);
  h += '<div class="mc s6"><h2>Coming up <span class="sp"></span><button class="mbtn sm" data-tab="subs">Subscriptions</button></h2>' + (up.length ? up.map(function (x) { return '<div class="mrow"><span class="mdot" style="background:' + (x.color || M.tone(x.name)) + '">' + esc(M.initial(x.name)) + '</span><div class="grow"><b>' + esc(x.name) + '</b><small>' + (x.overdue ? '<span class="neg">Overdue</span>' : x.days === 0 ? 'Today' : 'In ' + x.days + ' day' + (x.days === 1 ? '' : 's')) + ' · ' + esc(x.cycle) + '</small></div><b class="num" style="font-weight:500">' + esc(M.fmt(x.amount, x.currency)) + '</b></div>'; }).join('') : '<p class="tmuted">Track Netflix, domains, insurance and anything else that renews.</p><button class="mbtn sm" data-tab="subs">Add a subscription</button>') + '</div>';
  var rec = M.tx.items.slice(0, 6); h += '<div class="mc s7"><h2>Latest <span class="sp"></span><button class="mbtn sm" data-tab="tx">All transactions</button></h2>' + (rec.length ? rec.map(M.txRow).join('') : '<p class="tmuted">Nothing yet. Press N to add your first.</p>') + '</div>';
  var gl = s.goals; h += '<div class="mc s5"><h2>Goals <span class="sp"></span><button class="mbtn sm" data-m="newgoal">Add</button></h2>' + (gl.length ? gl.map(function (g) { var pc = g.target ? g.saved / g.target * 100 : 0; return '<div style="margin:10px 0" class="click" data-m="editgoal" data-id="' + g.id + '"><div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:5px"><span>' + esc(g.name) + '</span><span class="num tmuted">' + esc(M.fmt(g.saved, g.currency, { whole: true })) + ' / ' + esc(M.fmt(g.target, g.currency, { whole: true })) + '</span></div>' + M.progress(pc, 'ok') + '</div>'; }).join('') : '<p class="tmuted">Saving for something? Add a goal and add to it as you go.</p>') + '</div>';
  h += '<div class="mc"><h2>Net worth over the year</h2>' + (hist.length ? M.line(hist, 'Net worth by month') : '') + '<p class="tmuted" style="margin:6px 0 0;font-size:12px">Accounts at each month end. Investments are shown at today\'s value.</p></div></div>';
  return h;
};
M.txRow = function (t) {
  var c = M.cat(t.cat), a = M.acct(t.acct), b = M.acct(t.to), sign = t.type === 'income' ? 1 : t.type === 'expense' ? -1 : 0, cur = a ? a.currency : M.st.settings.base;
  var title = t.type === 'transfer' ? 'Transfer to ' + (b ? b.name : '?') : (t.payee || (c ? c.name : t.type === 'income' ? 'Income' : 'Expense'));
  var sub = [t.type === 'transfer' ? (a ? a.name : '') : (c ? c.name : 'No category'), t.type !== 'transfer' && a ? a.name : '', t.note].filter(Boolean).join(' · ');
  return '<div class="mrow click" data-m="edittx" data-id="' + t.id + '"><span class="mdot" style="background:' + (t.type === 'transfer' ? '#64748b' : c ? c.color : '#8a8a92') + '">' + esc(M.initial(title)) + '</span><div class="grow"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></div><b class="num ' + (sign > 0 ? 'pos' : '') + '" style="font-weight:500">' + esc(M.fmt(sign * t.amount, cur, { plus: sign > 0 })) + '</b></div>';
};

/* ---------- transactions ---------- */
M.routes.tx = function () {
  var f = M.tx.f, s = M.st, h = '<div class="mhead"><div><h1>Transactions</h1><p>' + M.tx.total + ' found</p></div><span class="sp"></span><button class="mbtn" data-m="import">Import CSV</button><a class="mbtn" href="/api/money/tx/export.csv" download>Export</a><button class="mbtn pri" data-m="newtx">Add</button></div>';
  h += '<div class="mchips" role="group" aria-label="Period">' + [['month', 'This month'], ['last', 'Last month'], ['3m', '3 months'], ['year', 'This year'], ['all', 'Everything']].map(function (x) { return '<button class="mchip' + (f.range === x[0] ? ' on' : '') + '" data-range="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  h += '<div class="mfilter"><input class="tin" id="fq" type="search" placeholder="Search payee or note" value="' + esc(f.q) + '" aria-label="Search"><select class="tin" id="fa" aria-label="Account">' + M.acctOpts(f.acct, 'All accounts') + '</select><select class="tin" id="fc" aria-label="Category">' + M.opts([['none', 'No category']].concat(s.categories.map(function (c) { return [c.id, c.name]; })), f.cat, 'All categories') + '</select><select class="tin" id="ft" aria-label="Type">' + M.opts([['expense', 'Spending'], ['income', 'Income'], ['transfer', 'Transfers']], f.type, 'All types') + '</select></div>';
  h += '<div class="mc"><div style="display:flex;gap:18px;flex-wrap:wrap;font-size:13.5px;margin-bottom:6px"><span>Income <b class="pos num">' + esc(M.fmt(M.tx.income)) + '</b></span><span>Spent <b class="num">' + esc(M.fmt(M.tx.expense)) + '</b></span><span>Net <b class="num ' + (M.tx.income - M.tx.expense >= 0 ? 'pos' : 'neg') + '">' + esc(M.fmt(M.tx.income - M.tx.expense, null, { plus: true })) + '</b></span></div>';
  if (!M.tx.items.length) h += '<div class="mempty"><b>' + (f.q || f.acct || f.cat || f.type || f.range !== 'all' ? 'Nothing matches' : 'No transactions yet') + '</b><span>Change the filters, or add one.</span></div>';
  else { var last = ''; M.tx.items.forEach(function (t) { if (t.date !== last) { last = t.date; h += '<div class="mday"><span>' + esc(M.dayName(t.date)) + '</span></div>'; } h += M.txRow(t); }); if (M.tx.items.length < M.tx.total) h += '<div style="text-align:center;padding:10px"><button class="mbtn" data-m="more">Show more (' + (M.tx.total - M.tx.items.length) + ')</button></div>'; }
  return h + '</div>';
};
M.after.tx = function () {
  var go = function () { M.loadTx(true).then(function () { var q = $('#fq'), pos = q && document.activeElement === q ? q.selectionStart : -1; M.draw(); if (pos >= 0) { var n = $('#fq'); n.focus(); n.setSelectionRange(pos, pos); } }).catch(M.err); }, f = M.tx.f, dq;
  $('#fq').oninput = function () { f.q = this.value; clearTimeout(dq); dq = setTimeout(go, 250); }; $('#fa').onchange = function () { f.acct = this.value; go(); }; $('#fc').onchange = function () { f.cat = this.value; go(); }; $('#ft').onchange = function () { f.type = this.value; go(); };
};

/* ---------- accounts ---------- */
var TYPES = [['bank', 'Bank account'], ['cash', 'Cash'], ['mobile', 'Mobile money'], ['savings', 'Savings'], ['credit', 'Credit card'], ['investment', 'Investment account'], ['loan', 'Loan'], ['asset', 'Property or other asset'], ['other', 'Other']];
M.routes.accounts = function () {
  var s = M.st, h = '<div class="mhead"><div><h1>Accounts</h1><p>Everything you own and owe, in one list</p></div><span class="sp"></span><button class="mbtn pri" data-m="newacct">Add account</button></div>';
  if (!s.accounts.length) return h + '<div class="mc mempty"><b>No accounts yet</b><span>Add your bank, your wallet, mobile money, a credit card.</span><button class="mbtn pri" data-m="newacct">Add an account</button></div>';
  var groups = {}; s.accounts.forEach(function (a) { (groups[a.archived ? 'archived' : a.type] = groups[a.archived ? 'archived' : a.type] || []).push(a); });
  h += '<div class="mc" style="margin-bottom:14px"><div class="kpi"><small>Total in ' + esc(s.settings.base) + '</small><b>' + esc(M.fmt(s.netWorth.accounts)) + '</b><span>Across ' + s.accounts.filter(function (a) { return !a.archived && a.net; }).length + ' accounts' + (s.invest.holdings.length ? ', plus ' + esc(M.fmt(s.invest.totals.value)) + ' invested' : '') + '</span></div></div>';
  TYPES.map(function (t) { return t[0]; }).concat(['archived']).forEach(function (k) { var l = groups[k]; if (!l) return; h += '<div class="mc" style="margin-bottom:14px"><h2>' + esc(k === 'archived' ? 'Archived' : TYPES.filter(function (t) { return t[0] === k; })[0][1] + 's') + '</h2>' + l.map(function (a) { return '<div class="mrow click" data-m="editacct" data-id="' + a.id + '"><span class="mdot" style="background:' + (a.color || M.tone(a.name)) + '">' + esc(M.initial(a.name)) + '</span><div class="grow"><b>' + esc(a.name) + '</b><small>' + esc(a.currency) + (a.note ? ' · ' + esc(a.note) : '') + (a.net ? '' : ' · not counted in net worth') + '</small></div><div style="text-align:right"><b class="num ' + (a.balance < 0 ? 'neg' : '') + '" style="font-weight:500">' + esc(M.fmt(a.balance, a.currency)) + '</b>' + (a.currency !== s.settings.base ? '<small class="tmuted" style="display:block">' + esc(M.fmt(a.balanceBase)) + '</small>' : '') + '</div></div>'; }).join('') + '</div>'; });
  return h;
};
M.acctForm = function (a) {
  a = a || {}; var isNew = !a.id;
  M.modal('<h2>' + (isNew ? 'Add an account' : 'Edit ' + esc(a.name)) + '</h2><label>Name<input class="tin" id="an" value="' + esc(a.name || '') + '" placeholder="CRDB current account" maxlength="60"></label><div class="row2"><label>Type<select id="at">' + M.opts(TYPES, a.type || 'bank') + '</select></label><label>Currency<input class="tin" id="ac" value="' + esc(a.currency || M.st.settings.base) + '" maxlength="5" list="acs"><datalist id="acs"><option value="USD"><option value="TZS"><option value="INR"><option value="EUR"><option value="KES"><option value="ZMW"><option value="ZAR"><option value="AED"><option value="GBP"></datalist></label></div>' +
    '<label>' + (isNew ? 'Balance today' : 'Starting balance') + '<input class="tin num" id="ao" inputmode="decimal" value="' + (a.opening || '') + '" placeholder="0.00"></label>' + (isNew ? '' : '<p class="tmuted" style="margin:0;font-size:12.5px">Current balance is ' + esc(M.fmt(a.balance, a.currency)) + '. To match your bank, use Reconcile.</p>') +
    '<label>Note<input class="tin" id="ano" value="' + esc(a.note || '') + '" maxlength="200"></label><label style="display:flex;gap:8px;align-items:center;grid-auto-flow:column;justify-content:start"><input type="checkbox" id="anet"' + (a.net === false ? '' : ' checked') + '> Count in net worth</label><div class="err" id="aerr" role="alert"></div>' +
    '<div class="acts">' + (isNew ? '' : '<button class="mbtn" data-m="reconcile" data-id="' + a.id + '">Reconcile</button><button class="mbtn" data-m="archacct" data-id="' + a.id + '">' + (a.archived ? 'Restore' : 'Archive') + '</button><button class="mbtn dng" data-m="delacct" data-id="' + a.id + '">Delete</button><span style="flex:1"></span>') + '<button class="mbtn" data-m="close">Cancel</button><button class="mbtn pri" id="asave">Save</button></div>',
  function () { $('#asave').onclick = function () { var b = { name: $('#an').value, type: $('#at').value, currency: $('#ac').value.toUpperCase(), opening: $('#ao').value.replace(/,/g, '') || 0, note: $('#ano').value, net: $('#anet').checked }; M.api(isNew ? 'POST' : 'PUT', isNew ? '/accounts' : '/accounts/' + a.id, b).then(function (s) { M.set(s); M.close(); T.toast('Saved'); return M.reload(); }).catch(function (e) { $('#aerr').textContent = e.message; }); }; });
};
M.reconcile = function (a) {
  M.modal('<h2>Reconcile ' + esc(a.name) + '</h2><p class="tmuted" style="margin:0">Type the balance your bank shows. Money adds a transaction for the difference so the two agree.</p><label>Balance now<input class="tin num" id="rb" inputmode="decimal" placeholder="' + a.balance + '"></label><div class="err" id="rerr"></div><div class="acts"><button class="mbtn" data-m="close">Cancel</button><button class="mbtn pri" id="rok">Adjust</button></div>', function () { $('#rok').onclick = function () { var v = Number($('#rb').value.replace(/,/g, '')); if (!isFinite(v) || $('#rb').value === '') return void ($('#rerr').textContent = 'Enter the balance'); var diff = Math.round((v - a.balance) * 100) / 100; if (!diff) { M.close(); return T.toast('Already matches'); } M.api('POST', '/tx', { type: diff > 0 ? 'income' : 'expense', amount: Math.abs(diff), date: M.today(), acct: a.id, payee: 'Balance adjustment', note: 'Reconciled to ' + v }).then(function () { M.close(); T.toast('Adjusted by ' + M.fmt(diff, a.currency, { plus: true })); return M.reload(); }).catch(function (e) { $('#rerr').textContent = e.message; }); }; });
};
M.goalForm = function (g) {
  g = g || {}; var isNew = !g.id;
  M.modal('<h2>' + (isNew ? 'New goal' : esc(g.name)) + '</h2><label>What for<input class="tin" id="gn" value="' + esc(g.name || '') + '" maxlength="60"></label><div class="row2"><label>Target<input class="tin num" id="gt" inputmode="decimal" value="' + (g.target || '') + '"></label><label>Saved so far<input class="tin num" id="gs" inputmode="decimal" value="' + (g.saved || '') + '"></label></div><div class="row2"><label>Currency<input class="tin" id="gc" value="' + esc(g.currency || M.st.settings.base) + '" maxlength="5"></label><label>Aim for<input class="tin" id="gd" type="date" value="' + esc(g.date || '') + '"></label></div><div class="err" id="gerr"></div>' +
    '<div class="acts">' + (isNew ? '' : '<button class="mbtn dng" data-m="delgoal" data-id="' + g.id + '">Delete</button><span style="flex:1"></span>') + '<button class="mbtn" data-m="close">Cancel</button><button class="mbtn pri" id="gok">Save</button></div>',
  function () { $('#gok').onclick = function () { var b = { name: $('#gn').value, target: $('#gt').value.replace(/,/g, ''), saved: $('#gs').value.replace(/,/g, '') || 0, currency: $('#gc').value.toUpperCase(), date: $('#gd').value }; M.api(isNew ? 'POST' : 'PUT', isNew ? '/goals' : '/goals/' + g.id, b).then(function (s) { M.set(s); M.close(); M.draw(); }).catch(function (e) { $('#gerr').textContent = e.message; }); }; });
};

/* ---------- shell ---------- */

var NAV = [['overview', 'Overview', 'list'], ['tx', 'Transactions', 'file'], ['accounts', 'Accounts', 'folder'], ['budgets', 'Budgets', 'rep'], ['subs', 'Subscriptions', 'refresh'], ['invest', 'Investments', 'up'], ['reports', 'Reports', 'search'], ['settings', 'Settings', 'wrap']];
M.draw = function () {
  var n = $('#mnav'); n.innerHTML = '<div class="brand"><img src="/oicons/money.svg" alt="">Money</div>' + NAV.map(function (x) { return '<button data-tab="' + x[0] + '"' + (M.tab === x[0] ? ' aria-current="page"' : '') + '>' + T.ic(x[2]) + x[1] + '</button>'; }).join('');
  var main = $('#mmain'), y = main.scrollTop; main.innerHTML = (M.routes[M.tab] || M.routes.overview)(); if (M.after[M.tab]) M.after[M.tab](); main.scrollTop = y;
  try { if (parent !== window) parent.postMessage({ aosTool: 'title', title: NAV.filter(function (x) { return x[0] === M.tab; })[0][1] + ' - Money' }, location.origin); } catch (e) {}
};
M.go = function (tab) { M.tab = M.routes[tab] ? tab : 'overview'; try { history.replaceState(null, '', '#' + M.tab); } catch (e) {} M.draw(); $('#mmain').scrollTop = 0; };
M.act = {};
M.act.close = function () { M.close(); }; M.act.newtx = function () { M.txForm(); }; M.act.newacct = function () { M.close(); M.acctForm(); }; M.act.newgoal = function () { M.goalForm(); };
M.act.edittx = function (b) { M.api('GET', '/tx?limit=500&from=0000-01-01').then(function () { var t = M.tx.items.filter(function (x) { return x.id === b.dataset.id; })[0]; if (t) M.txForm(t); }); };
M.act.deltx = function (b) { M.confirm('Delete this transaction?', function () { M.api('DELETE', '/tx/' + b.dataset.id).then(function () { T.toast('Deleted'); return M.reload(); }).catch(M.err); }, 'Delete'); };
M.act.more = function () { M.loadTx(false).then(M.draw); };
M.act.editacct = function (b) { M.acctForm(M.acct(b.dataset.id)); };
M.act.reconcile = function (b) { M.close(); M.reconcile(M.acct(b.dataset.id)); };
M.act.archacct = function (b) { var a = M.acct(b.dataset.id); M.api('PUT', '/accounts/' + a.id, { archived: !a.archived }).then(function (s) { M.set(s); M.close(); M.draw(); }).catch(M.err); };
M.act.delacct = function (b) { var a = M.acct(b.dataset.id); M.confirm('Delete ' + a.name + ' and all of its transactions? This cannot be undone.', function () { M.api('DELETE', '/accounts/' + a.id + '?force=1').then(function () { T.toast('Deleted'); return M.reload(); }).catch(M.err); }, 'Delete everything'); };
M.act.editgoal = function (b) { M.goalForm(M.st.goals.filter(function (g) { return g.id === b.dataset.id; })[0]); };
M.act.delgoal = function (b) { M.api('DELETE', '/goals/' + b.dataset.id).then(function (s) { M.set(s); M.close(); M.draw(); }).catch(M.err); };
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-m],[data-tab],[data-range],[data-ty]'); if (!b) return;
  if (b.dataset.tab) { if ($('#mmodal').hidden === false) M.close(); return M.go(b.dataset.tab); }
  if (b.dataset.range) { M.tx.f.range = b.dataset.range; return M.loadTx(true).then(M.draw); }
  if (b.dataset.m && M.act[b.dataset.m]) M.act[b.dataset.m](b);
});
$('#mfab').innerHTML = T.ic('plus'); $('#mfab').onclick = function () { M.txForm(); };
document.addEventListener('keydown', function (e) { if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && $('#mmodal').hidden) { e.preventDefault(); M.txForm(); } });
M.boot = function () {
  var h = location.hash.replace('#', ''); M.api('GET', '/state').then(function (s) { M.set(s); M.tab = h && M.routes[h] ? h : (T.q('tab') && M.routes[T.q('tab')] ? T.q('tab') : 'overview'); return Promise.all([M.loadTx(true), M.loadRep()]); }).then(function () { M.draw(); }).catch(function (e) { $('#mmain').innerHTML = '<div class="mempty"><b>Could not open Money</b><span>' + esc(e.message) + '</span></div>'; });
};
window.addEventListener('hashchange', function () { var h = location.hash.replace('#', ''); if (M.st && h !== M.tab && M.routes[h]) { M.tab = h; M.draw(); } });
M.TYPES = TYPES; M.NAV = NAV;
})();
