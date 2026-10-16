/* Money app, part 3: reports, CSV import and settings. */
(function () {
'use strict';
var M = window.M, T = window.T, $ = T.$, esc = T.esc;
function num(v) { return String(v || '').replace(/,/g, ''); }

/* ---------- reports ---------- */
M.rp = M.rp || { range: '3m', data: null };
M.routes.reports = function () {
  var rp = M.rp, d = rp.data, h = '<div class="mhead"><div><h1>Reports</h1><p>Where the money comes from and goes</p></div></div><div class="mchips" role="group" aria-label="Period">' + [['month', 'This month'], ['last', 'Last month'], ['3m', '3 months'], ['year', 'This year']].map(function (x) { return '<button class="mchip' + (rp.range === x[0] ? ' on' : '') + '" data-rrange="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  if (!d) return h + '<p class="tmuted">Loading...</p>';
  h += '<div class="mgrid"><div class="mc s4"><div class="kpi"><small>Income</small><b class="pos">' + esc(M.fmt(d.income)) + '</b></div></div><div class="mc s4"><div class="kpi"><small>Spent</small><b>' + esc(M.fmt(d.expense)) + '</b></div></div><div class="mc s4"><div class="kpi"><small>Saved</small><b class="' + (d.net >= 0 ? 'pos' : 'neg') + '">' + esc(M.fmt(d.net, null, { plus: true })) + '</b><span>' + (d.income ? Math.round(d.saveRate) + '% of income' : '') + '</span></div></div>';
  h += '<div class="mc s8"><h2>By month</h2>' + M.barChart(d.months) + '</div>';
  h += '<div class="mc s4"><h2>By category</h2>' + (d.categories.length ? M.donut(d.categories.slice(0, 8), M.fmt(d.expense, null, { compact: true }), 'Spent') : '<p class="tmuted">No spending.</p>') + '</div>';
  h += '<div class="mc s6"><h2>Top categories</h2>' + d.categories.slice(0, 10).map(function (c) { return '<div style="margin:9px 0"><div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:4px"><span><i class="mdot" style="display:inline-block;width:9px;height:9px;border-radius:3px;background:' + c.color + ';margin-right:7px"></i>' + esc(c.name) + '</span><span class="num tmuted">' + esc(M.fmt(c.amount, null, { whole: true })) + ' · ' + Math.round(c.pct) + '%</span></div>' + M.progress(c.pct, 'ok') + '</div>'; }).join('') + '</div>';
  h += '<div class="mc s6"><h2>Top payees</h2>' + (d.payees.length ? d.payees.map(function (p) { return '<div class="mrow"><span class="mdot" style="background:' + M.tone(p.name) + '">' + esc(M.initial(p.name)) + '</span><div class="grow"><b>' + esc(p.name) + '</b></div><b class="num" style="font-weight:500">' + esc(M.fmt(p.amount)) + '</b></div>'; }).join('') : '<p class="tmuted">None yet.</p>') + '</div></div>';
  return h;
};
M.after.reports = function () { if (!M.rp.data) M.rpLoad(); };
M.rpLoad = function () { var r = M.rangeOf(M.rp.range); M.loadRep('?from=' + r[0] + '&to=' + r[1]).then(function (d) { M.rp.data = d; M.loadRep().then(function () {}); if (M.tab === 'reports') M.draw(); }).catch(M.err); };
document.addEventListener('click', function (e) { var b = e.target.closest('[data-rrange]'); if (!b) return; M.rp.range = b.dataset.rrange; M.rp.data = null; M.draw(); });

/* ---------- CSV import ---------- */
function parseCsv(text) {
  var rows = [], row = [], cur = '', q = false, i, c; text = text.replace(/^﻿/, ''); var first = text.split(/\r?\n/)[0] || '', sep = (first.split(';').length > first.split(',').length) ? ';' : (first.split('\t').length > first.split(',').length ? '\t' : ',');
  for (i = 0; i < text.length; i++) { c = text[i]; if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; } else if (c === '"') q = true; else if (c === sep) { row.push(cur); cur = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some(function (x) { return x.trim(); })) rows.push(row); row = []; } else cur += c; }
  row.push(cur); if (row.some(function (x) { return x.trim(); })) rows.push(row); return rows;
}
function normDate(s) {
  s = String(s || '').trim(); var m; if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return m[1] + '-' + m[2] + '-' + m[3];
  if ((m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/))) { var a = +m[1], b = +m[2], y = m[3].length === 2 ? '20' + m[3] : m[3], day = a > 12 ? a : b > 12 ? b : a, mo = a > 12 ? b : b > 12 ? a : b; if (M.imp && M.imp.us && a <= 12 && b <= 12) { mo = a; day = b; } return y + '-' + ('0' + mo).slice(-2) + '-' + ('0' + day).slice(-2); }
  var t = Date.parse(s + ' UTC'); return isNaN(t) ? '' : new Date(t).toISOString().slice(0, 10);
}
function guess(head, names) { for (var i = 0; i < head.length; i++) { var h = head[i].toLowerCase(); if (names.some(function (n) { return h.indexOf(n) >= 0; })) return i; } return -1; }
M.act.import = function () {
  M.imp = { rows: null }; M.modal('<h2>Import transactions</h2><p class="tmuted" style="margin:0">Choose a CSV exported from your bank or from another app. Nothing is saved until you confirm.</p><label>Into account<select id="iacct">' + M.acctOpts('') + '</select></label><label>CSV file<input type="file" id="ifile" accept=".csv,text/csv,.txt"></label><div id="imap"></div><div class="err" id="ierr"></div><div class="acts"><button class="mbtn" data-m="close">Close</button><button class="mbtn pri" id="iok" disabled>Import</button></div>', function () {
    $('#ifile').onchange = function () {
      var f = this.files[0]; if (!f) return; var fr = new FileReader(); fr.onload = function () {
        var rows = parseCsv(String(fr.result)); if (rows.length < 2) return void ($('#ierr').textContent = 'That file has no rows.'); var head = rows[0], opt = function (sel, none) { return (none ? '<option value="-1">' + none + '</option>' : '') + head.map(function (h, i) { return '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + esc(h || 'Column ' + (i + 1)) + '</option>'; }).join(''); };
        var dI = guess(head, ['date', 'posted']), aI = guess(head, ['amount', 'value']), pI = guess(head, ['payee', 'description', 'merchant', 'narrat', 'details', 'name']), nI = guess(head, ['note', 'memo', 'reference']), cr = guess(head, ['credit', 'deposit']), dr = guess(head, ['debit', 'withdraw']);
        $('#imap').innerHTML = '<div class="row2"><label>Date<select id="m-d">' + opt(dI) + '</select></label><label>Amount<select id="m-a">' + opt(aI >= 0 ? aI : dr, 'Use debit and credit columns') + '</select></label></div><div class="row2"><label>Description<select id="m-p">' + opt(pI, 'None') + '</select></label><label>Note<select id="m-n">' + opt(nI, 'None') + '</select></label></div><div class="row2" id="m-dc"' + (aI >= 0 ? ' hidden' : '') + '><label>Money out<select id="m-dr">' + opt(dr, 'None') + '</select></label><label>Money in<select id="m-cr">' + opt(cr, 'None') + '</select></label></div><label style="display:flex;gap:8px;align-items:center;grid-auto-flow:column;justify-content:start"><input type="checkbox" id="m-neg"> Positive amounts are spending (some cards)</label><label style="display:flex;gap:8px;align-items:center;grid-auto-flow:column;justify-content:start"><input type="checkbox" id="m-us"> Dates are month first (12/31/2026)</label><p class="tmuted" id="ipre" style="margin:0;font-size:12.5px"></p>';
        M.imp.rows = rows; $('#iok').disabled = false; var upd = function () { $('#m-dc').hidden = $('#m-a').value !== '-1'; M.imp.us = $('#m-us').checked; var r = build(); $('#ipre').textContent = r.length + ' transactions found' + (r.length ? ', first on ' + r[0].date + ' for ' + r[0].amount : '') + '.'; }; ['m-d', 'm-a', 'm-p', 'm-n', 'm-dr', 'm-cr', 'm-neg', 'm-us'].forEach(function (id) { $('#' + id).onchange = upd; }); upd();
      }; fr.readAsText(f);
    };
    function build() {
      var rows = M.imp.rows.slice(1), g = function (id) { return +$('#' + id).value; }, d = g('m-d'), a = g('m-a'), p = g('m-p'), n = g('m-n'), dr = g('m-dr'), cr = g('m-cr'), flip = $('#m-neg').checked, out = [];
      rows.forEach(function (r) { var date = normDate(r[d]), amt; if (a >= 0) amt = parseFloat(String(r[a] || '').replace(/[^0-9.\-()]/g, '').replace(/^\((.*)\)$/, '-$1')); else { var o = dr >= 0 ? parseFloat(String(r[dr] || '').replace(/[^0-9.\-]/g, '')) || 0 : 0, i = cr >= 0 ? parseFloat(String(r[cr] || '').replace(/[^0-9.\-]/g, '')) || 0 : 0; amt = i - Math.abs(o); } if (!date || !isFinite(amt) || amt === 0) return; if (flip) amt = -amt; out.push({ date: date, amount: amt, payee: p >= 0 ? String(r[p] || '').trim() : '', note: n >= 0 ? String(r[n] || '').trim() : '' }); }); return out;
    }
    $('#iok').onclick = function () { var rows = build(); if (!rows.length) return void ($('#ierr').textContent = 'No usable rows. Check the column choices.'); $('#iok').disabled = true; M.api('POST', '/tx/bulk', { acct: $('#iacct').value, rows: rows }).then(function (r) { M.close(); T.toast('Added ' + r.added + (r.skipped ? ', ' + r.skipped + ' duplicates skipped' : '') + (r.invalid ? ', ' + r.invalid + ' unreadable' : '')); return M.reload(); }).catch(function (e) { $('#ierr').textContent = e.message; $('#iok').disabled = false; }); };
  });
};

/* ---------- settings ---------- */
M.routes.settings = function () {
  var s = M.st, h = '<div class="mhead"><div><h1>Settings</h1><p>Currency, rates, categories and rules</p></div></div>';
  h += '<div class="mc" style="margin-bottom:14px"><h2>Main currency</h2><p class="tmuted" style="margin:0 0 10px">Totals, budgets and reports are shown in this currency. Accounts can hold others.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><input class="tin" id="sbase" value="' + esc(s.settings.base) + '" maxlength="5" style="width:110px" list="acs2" aria-label="Main currency"><datalist id="acs2"><option value="USD"><option value="TZS"><option value="INR"><option value="EUR"><option value="KES"><option value="GBP"><option value="ZAR"><option value="AED"></datalist><button class="mbtn" data-m="savebase">Change</button></div><p class="tmuted" style="margin:8px 0 0;font-size:12.5px">Changing it resets exchange rates; fetch them again afterwards.</p></div>';
  var cur = Object.keys(s.rates.map).filter(function (k) { return k !== s.rates.base; });
  h += '<div class="mc" style="margin-bottom:14px"><h2>Exchange rates <span class="sp"></span><button class="mbtn sm" data-m="rates">Fetch now</button></h2><p class="tmuted" style="margin:0 0 8px;font-size:13px">' + (s.rates.at ? 'Updated ' + esc(new Date(s.rates.at).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })) : 'Not fetched yet') + '. 1 ' + esc(s.rates.base) + ' equals:</p>' + (cur.length ? cur.map(function (k) { return '<div class="mrow"><div class="grow"><b>' + esc(k) + '</b></div><input class="tin num" style="width:130px" data-rate="' + esc(k) + '" value="' + s.rates.map[k] + '" inputmode="decimal" aria-label="Rate for ' + esc(k) + '"></div>'; }).join('') + '<div style="margin-top:8px"><button class="mbtn" data-m="saverates">Save rates</button></div>' : '<p class="tmuted">Only ' + esc(s.rates.base) + ' so far. Add an account in another currency, then fetch.</p>') + '</div>';
  var cl = function (kind) { return s.categories.filter(function (c) { return c.kind === kind; }).map(function (c) { return '<button class="mchip" data-m="editcat" data-id="' + c.id + '"><i class="mdot" style="width:8px;height:8px;border-radius:2px;background:' + c.color + ';display:inline-block;margin-right:6px"></i>' + esc(c.name) + '</button>'; }).join(''); };
  h += '<div class="mc" style="margin-bottom:14px"><h2>Categories <span class="sp"></span><button class="mbtn sm" data-m="newcat">Add</button></h2><small class="tmuted">Spending</small><div class="mchips" style="margin:6px 0 12px">' + cl('expense') + '</div><small class="tmuted">Income</small><div class="mchips" style="margin-top:6px">' + cl('income') + '</div></div>';
  h += '<div class="mc" style="margin-bottom:14px"><h2>Auto-categorise <span class="sp"></span><button class="mbtn sm" data-m="addrule">Add rule</button></h2><p class="tmuted" style="margin:0 0 8px;font-size:13px">When a payee contains the text, new transactions get that category.</p>' + (s.rules.length ? s.rules.map(function (r, i) { var c = M.cat(r.cat); return '<div class="mrow"><div class="grow"><b>' + esc(r.match) + '</b><small>' + esc(r.type) + ' → ' + esc(c ? c.name : '?') + '</small></div><button class="mbtn sm" data-m="delrule" data-i="' + i + '" aria-label="Remove rule">' + T.ic('x') + '</button></div>'; }).join('') : '<p class="tmuted" style="margin:0">No rules yet.</p>') + '</div>';
  h += '<div class="mc"><h2>Your data</h2><p class="tmuted" style="margin:0 0 10px;font-size:13px">' + s.count + ' transactions are stored on your own server. Nothing is sent anywhere except rate and price lookups.</p><a class="mbtn" href="/api/money/tx/export.csv" download>Export all as CSV</a></div>';
  return h;
};
M.act.savebase = function () { var v = $('#sbase').value.toUpperCase(); M.api('PUT', '/settings', { base: v }).then(function () { return M.api('POST', '/rates/refresh', {}).catch(function () {}); }).then(function () { T.toast('Main currency is ' + v); return M.reload(); }).catch(M.err); };
M.act.rates = function () { T.toast('Fetching rates...'); M.api('POST', '/rates/refresh', {}).then(function (s) { M.set(s); M.draw(); T.toast(s.missingRates.length ? 'Still missing ' + s.missingRates.join(', ') : 'Rates updated'); }).catch(function () { T.toast('Could not reach the rate service. Enter rates by hand in Settings.'); }); };
M.act.saverates = function () { var map = {}; [].forEach.call(document.querySelectorAll('[data-rate]'), function (i) { map[i.dataset.rate] = num(i.value); }); M.api('PUT', '/rates', { map: map }).then(function (s) { M.set(s); T.toast('Saved'); M.draw(); }).catch(M.err); };
M.catForm = function (c) {
  c = c || {}; var isNew = !c.id;
  M.modal('<h2>' + (isNew ? 'New category' : 'Edit category') + '</h2><label>Name<input class="tin" id="cn" value="' + esc(c.name || '') + '" maxlength="40"></label>' + (isNew ? '<label>Kind<select id="ck">' + M.opts([['expense', 'Spending'], ['income', 'Income']], 'expense') + '</select></label>' : '') + '<label>Colour<input type="color" id="cc" value="' + esc(c.color || '#f68712') + '" style="height:38px;width:80px;padding:2px"></label><div class="err" id="cerr"></div><div class="acts">' + (isNew ? '' : '<button class="mbtn dng" data-m="delcat" data-id="' + c.id + '">Delete</button><span style="flex:1"></span>') + '<button class="mbtn" data-m="close">Cancel</button><button class="mbtn pri" id="cok">Save</button></div>', function () {
    $('#cok').onclick = function () { var b = { name: $('#cn').value, color: $('#cc').value }; if (isNew) b.kind = $('#ck').value; M.api(isNew ? 'POST' : 'PUT', isNew ? '/categories' : '/categories/' + c.id, b).then(function () { M.close(); return M.reload(); }).catch(function (e) { $('#cerr').textContent = e.message; }); };
  });
};
M.act.newcat = function () { M.catForm(); }; M.act.editcat = function (b) { M.catForm(M.cat(b.dataset.id)); };
M.act.delcat = function (b) { M.api('DELETE', '/categories/' + b.dataset.id).then(function () { M.close(); T.toast('Deleted. Its transactions are now uncategorised.'); return M.reload(); }).catch(M.err); };
M.act.addrule = function () {
  M.modal('<h2>New rule</h2><label>Payee contains<input class="tin" id="rm" maxlength="60" placeholder="uber, shell, safaricom"></label><div class="row2"><label>Type<select id="rt">' + M.opts([['expense', 'Spending'], ['income', 'Income']], 'expense') + '</select></label><label>Category<select id="rc">' + M.catOpts('expense', '') + '</select></label></div><div class="err" id="rerr"></div><div class="acts"><button class="mbtn" data-m="close">Cancel</button><button class="mbtn pri" id="rok">Add</button></div>', function () {
    $('#rt').onchange = function () { $('#rc').innerHTML = M.catOpts(this.value, ''); };
    $('#rok').onclick = function () { if (!$('#rm').value.trim() || !$('#rc').value) return void ($('#rerr').textContent = 'Fill in the text and category'); M.api('PUT', '/rules', { rules: M.st.rules.concat([{ match: $('#rm').value.trim(), type: $('#rt').value, cat: $('#rc').value }]) }).then(function () { M.close(); return M.reload(); }).catch(function (e) { $('#rerr').textContent = e.message; }); };
  });
};
M.act.delrule = function (b) { var r = M.st.rules.slice(); r.splice(+b.dataset.i, 1); M.api('PUT', '/rules', { rules: r }).then(function () { return M.reload(); }).catch(M.err); };

/* ---------- boot ---------- */
M.boot();
})();
