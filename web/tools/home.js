/* Belongings and Household: what you own (warranties, receipts) and what is in the pantry (stock, shopping list). */
(function () {
'use strict';
var T = window.T, $ = T.$, esc = T.esc, H = { st: null, tab: 'items', q: '', loc: '', cat: '' };
var api = function (m, p, b) { return T.api('/api/house' + p, { method: m, json: b }); };
var NAV = [['items', 'Belongings', 'folder'], ['warranty', 'Warranties', 'save'], ['pantry', 'Pantry', 'list'], ['shop', 'Shopping list', 'rep'], ['places', 'Places', 'file']];
var TOOLTITLE = { items: 'Belongings', warranty: 'Warranties', pantry: 'Pantry', shop: 'Shopping list', places: 'Places' };
function loc(id) { return H.st.locations.filter(function (l) { return l.id === id; })[0]; }
function locOpts(sel, none) { return '<option value="">' + esc(none || 'No place') + '</option>' + H.st.locations.map(function (l) { return '<option value="' + l.id + '"' + (l.id === sel ? ' selected' : '') + '>' + esc(l.name) + '</option>'; }).join(''); }
function tone(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return ['#f68712', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6', '#eab308'][h % 10]; }
function fd(d) { return d ? new Date(d + 'T12:00:00Z').toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''; }
function money(n, c) { try { return new Intl.NumberFormat('en', { style: 'currency', currency: c || 'USD', maximumFractionDigits: 0 }).format(n); } catch (e) { return (c || '') + ' ' + n; } }
function num(v) { return String(v || '').replace(/,/g, ''); }
function err(e) { T.toast(e && e.message ? e.message : 'Something went wrong'); }
function set(s) { H.st = s; draw(); }
/* modal */
function modal(html, on) { var m = $('#mmodal'); m.innerHTML = '<div class="mbox" role="dialog" aria-modal="true">' + html + '</div>'; m.hidden = false; var f = m.querySelector('input:not([type=hidden]):not([type=file]),select,textarea'); if (f) setTimeout(function () { f.focus(); }, 30); if (on) on(); }
function close() { var m = $('#mmodal'); m.hidden = true; m.innerHTML = ''; }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#mmodal').hidden) close(); });
$('#mmodal').addEventListener('mousedown', function (e) { if (e.target === this) close(); });

function badge(i) { if (i.warrantyDays == null) return ''; if (i.warrantyDays < 0) return '<span class="pill bad" style="color:var(--bad)">Warranty ended ' + fd(i.warranty) + '</span>'; if (i.warrantyDays <= 60) return '<span style="color:var(--warn)">Warranty ends in ' + i.warrantyDays + ' day' + (i.warrantyDays === 1 ? '' : 's') + '</span>'; return '<span>Warranty to ' + fd(i.warranty) + '</span>'; }

var R = {};
R.items = function () {
  var s = H.st, sm = s.summary, q = H.q.toLowerCase(), list = s.items.filter(function (i) { return (!q || (i.name + ' ' + i.category + ' ' + i.serial + ' ' + i.store).toLowerCase().indexOf(q) >= 0) && (!H.loc || i.location === H.loc); });
  var h = '<div class="mhead"><div><h1>Belongings</h1><p>' + sm.items + ' item' + (sm.items === 1 ? '' : 's') + (sm.value ? ' worth ' + esc(money(sm.value, sm.currency)) : '') + '</p></div><span class="sp"></span><button class="mbtn pri" data-a="newitem">Add item</button></div>';
  if (!s.items.length) return h + '<div class="mc mempty"><b>Nothing here yet</b><span>Record what you own with its place, price, serial number, warranty and receipt. When something breaks, you will know whether it is covered.</span><button class="mbtn pri" data-a="newitem">Add your first item</button></div>';
  h += '<div class="mfilter"><input class="tin" id="hq" type="search" placeholder="Search name, serial, store" value="' + esc(H.q) + '" aria-label="Search"><select class="tin" id="hl" aria-label="Place">' + locOpts(H.loc, 'All places') + '</select></div><div class="mc">';
  h += list.length ? list.map(function (i) { var l = loc(i.location); return '<div class="mrow click" data-a="edititem" data-id="' + i.id + '"><span class="mdot" style="background:' + tone(i.name) + '">' + esc(i.name.charAt(0).toUpperCase()) + '</span><div class="grow"><b>' + esc(i.name) + (i.qty > 1 ? ' <span class="tmuted" style="font-weight:400">× ' + i.qty + '</span>' : '') + '</b><small>' + [l ? esc(l.name) : '', i.category ? esc(i.category) : '', badge(i)].filter(Boolean).join(' · ') + '</small></div>' + (i.receipt ? '<a class="mbtn sm" href="' + T.fs.url(i.receipt) + '" target="_blank" rel="noopener" data-a="none">Receipt</a>' : '') + (i.value ? '<b class="num" style="font-weight:500">' + esc(money(i.value, i.currency)) + '</b>' : '') + '</div>'; }).join('') : '<p class="tmuted">Nothing matches.</p>';
  return h + '</div>';
};
R.warranty = function () {
  var l = H.st.items.filter(function (i) { return i.warranty; }).sort(function (a, b) { return a.warranty.localeCompare(b.warranty); }), h = '<div class="mhead"><div><h1>Warranties</h1><p>Soonest to end first</p></div></div>';
  if (!l.length) return h + '<div class="mc mempty"><b>No warranties recorded</b><span>Add a warranty end date to an item and it shows up here.</span></div>';
  var act = l.filter(function (i) { return i.warrantyDays >= 0; }), old = l.filter(function (i) { return i.warrantyDays < 0; });
  var row = function (i) { return '<div class="mrow click" data-a="edititem" data-id="' + i.id + '"><span class="mdot" style="background:' + (i.warrantyDays < 0 ? '#8a8a92' : i.warrantyDays <= 60 ? '#f59e0b' : '#10b981') + '">' + (i.warrantyDays < 0 ? '×' : '✓') + '</span><div class="grow"><b>' + esc(i.name) + '</b><small>' + (i.warrantyDays < 0 ? 'Ended ' + fd(i.warranty) : i.warrantyDays === 0 ? 'Ends today' : 'Ends ' + fd(i.warranty) + ' · ' + i.warrantyDays + ' days left') + (i.store ? ' · ' + esc(i.store) : '') + '</small></div>' + (i.receipt ? '<a class="mbtn sm" data-a="none" href="' + T.fs.url(i.receipt) + '" target="_blank" rel="noopener">Receipt</a>' : '') + '</div>'; };
  h += '<div class="mc"><h2>Covered</h2>' + (act.map(row).join('') || '<p class="tmuted">None.</p>') + '</div>'; if (old.length) h += '<div class="mc" style="margin-top:14px"><h2>Ended</h2>' + old.map(row).join('') + '</div>'; return h;
};
R.pantry = function () {
  var s = H.st, sm = s.summary, q = H.q.toLowerCase(), list = s.products.filter(function (p) { return !q || p.name.toLowerCase().indexOf(q) >= 0; });
  var h = '<div class="mhead"><div><h1>Pantry</h1><p>' + s.products.length + ' products' + (sm.low ? ' · ' + sm.low + ' running low' : '') + (sm.expiring ? ' · ' + sm.expiring + ' expiring soon' : '') + '</p></div><span class="sp"></span><button class="mbtn pri" data-a="newprod">Add product</button></div>';
  if (!s.products.length) return h + '<div class="mc mempty"><b>Your pantry is empty</b><span>Add what you keep at home, set a minimum, and the shopping list can fill itself when stock runs low.</span><button class="mbtn pri" data-a="newprod">Add a product</button></div>';
  h += '<div class="mfilter"><input class="tin" id="hq" type="search" placeholder="Search products" value="' + esc(H.q) + '" aria-label="Search"></div><div class="mc">' + list.map(function (p) { var l = loc(p.location), ex = p.expiresDays != null && p.stock > 0 ? (p.expiresDays < 0 ? '<span style="color:var(--bad)">Expired ' + fd(p.expires) + '</span>' : p.expiresDays <= 7 ? '<span style="color:var(--warn)">Best before ' + fd(p.expires) + '</span>' : 'Best before ' + fd(p.expires)) : ''; return '<div class="mrow"><span class="mdot" style="background:' + (p.low ? '#ef4444' : tone(p.name)) + '">' + esc(p.name.charAt(0).toUpperCase()) + '</span><div class="grow click" data-a="editprod" data-id="' + p.id + '"><b>' + esc(p.name) + '</b><small>' + [l ? esc(l.name) : '', p.low ? '<span style="color:var(--bad)">Low, minimum ' + p.min + '</span>' : '', ex].filter(Boolean).join(' · ') + '</small></div><button class="mbtn sm" data-a="use" data-id="' + p.id + '" aria-label="Use one of ' + esc(p.name) + '"' + (p.stock <= 0 ? ' disabled' : '') + '>−</button><b class="num" style="min-width:62px;text-align:center;font-weight:500">' + +p.stock.toFixed(2) + ' <small class="tmuted">' + esc(p.unit) + '</small></b><button class="mbtn sm" data-a="addst" data-id="' + p.id + '" aria-label="Add stock of ' + esc(p.name) + '">+</button></div>'; }).join('') + '</div>';
  return h;
};
R.shop = function () {
  var s = H.st, todo = s.shopping.filter(function (x) { return !x.done; }), done = s.shopping.filter(function (x) { return x.done; });
  var h = '<div class="mhead"><div><h1>Shopping list</h1><p>' + todo.length + ' to buy</p></div><span class="sp"></span><button class="mbtn" data-a="missing">Add what is low</button></div><form class="mfilter" id="shf"><input class="tin" id="shn" placeholder="Add something to buy" maxlength="60" aria-label="Item" autocomplete="off" list="shp"><datalist id="shp">' + s.products.map(function (p) { return '<option value="' + esc(p.name) + '">'; }).join('') + '</datalist><input class="tin num" id="shq" inputmode="decimal" placeholder="Qty" style="max-width:90px" aria-label="Quantity"><button class="mbtn pri" type="submit">Add</button></form>';
  h += '<div class="mc">' + (todo.length ? todo.map(function (x) { return '<div class="mrow"><button class="mbtn sm" data-a="bought" data-id="' + x.id + '" aria-label="Mark ' + esc(x.name) + ' as bought">✓</button><div class="grow"><b>' + esc(x.name) + '</b><small>' + (x.product ? 'Goes into the pantry when bought' : '') + '</small></div><b class="num" style="font-weight:500">' + x.qty + '</b><button class="mbtn sm" data-a="shdel" data-id="' + x.id + '" aria-label="Remove ' + esc(x.name) + '">' + T.ic('x') + '</button></div>'; }).join('') : '<div class="mempty"><b>Nothing to buy</b><span>Type above, or let Household add what is running low.</span></div>') + '</div>';
  if (done.length) h += '<div class="mc" style="margin-top:14px"><h2>Bought <span class="sp"></span><button class="mbtn sm" data-a="clrdone">Clear</button></h2>' + done.map(function (x) { return '<div class="mrow" style="opacity:.6"><div class="grow"><b style="text-decoration:line-through">' + esc(x.name) + '</b></div><b class="num">' + x.qty + '</b></div>'; }).join('') + '</div>';
  return h;
};
R.places = function () {
  var s = H.st, h = '<div class="mhead"><div><h1>Places</h1><p>Rooms and storage spots used by both apps</p></div></div><form class="mfilter" id="plf"><input class="tin" id="pln" placeholder="New place, e.g. Garage shelf" maxlength="40" aria-label="Place name"><button class="mbtn pri" type="submit">Add</button></form><div class="mc">';
  return h + s.locations.map(function (l) { var n = s.items.filter(function (i) { return i.location === l.id; }).length + s.products.filter(function (p) { return p.location === l.id; }).length; return '<div class="mrow"><div class="grow"><b>' + esc(l.name) + '</b><small>' + n + ' thing' + (n === 1 ? '' : 's') + '</small></div><button class="mbtn sm" data-a="delloc" data-id="' + l.id + '" aria-label="Remove ' + esc(l.name) + '">' + T.ic('x') + '</button></div>'; }).join('') + '</div>';
};
function draw() {
  var n = $('#mnav'); n.innerHTML = '<div class="brand"><img src="/oicons/' + (H.tab === 'pantry' || H.tab === 'shop' ? 'house' : 'belong') + '.svg" alt="">Home</div>' + NAV.map(function (x) { return '<button data-tab="' + x[0] + '"' + (H.tab === x[0] ? ' aria-current="page"' : '') + '>' + T.ic(x[2]) + x[1] + (x[0] === 'shop' && H.st.summary.toBuy ? ' <span class="tmuted">(' + H.st.summary.toBuy + ')</span>' : '') + '</button>'; }).join('');
  var main = $('#mmain'), y = main.scrollTop, had = document.activeElement && document.activeElement.id === 'hq', pos = had ? document.activeElement.selectionStart : 0; main.innerHTML = R[H.tab](); main.scrollTop = y;
  if (had && $('#hq')) { $('#hq').focus(); $('#hq').setSelectionRange(pos, pos); }
  if ($('#hq')) $('#hq').oninput = function () { H.q = this.value; draw(); }; if ($('#hl')) $('#hl').onchange = function () { H.loc = this.value; draw(); };
  if ($('#shf')) $('#shf').onsubmit = function (e) { e.preventDefault(); var nm = $('#shn').value.trim(); if (!nm) return; var pr = H.st.products.filter(function (p) { return p.name.toLowerCase() === nm.toLowerCase(); })[0]; api('POST', '/shopping', { name: nm, qty: num($('#shq').value) || 1, product: pr ? pr.id : '' }).then(function (s) { set(s); $('#shn').focus(); }).catch(err); };
  if ($('#plf')) $('#plf').onsubmit = function (e) { e.preventDefault(); if ($('#pln').value.trim()) api('POST', '/locations', { name: $('#pln').value }).then(set).catch(err); };
  try { if (parent !== window) parent.postMessage({ aosTool: 'title', title: TOOLTITLE[H.tab] }, location.origin); } catch (e) {}
}
function go(t) { H.tab = R[t] ? t : 'items'; H.q = ''; try { history.replaceState(null, '', '#' + (t === 'pantry' || t === 'shop' ? 'house' : 'belong')); } catch (e) {} draw(); $('#mmain').scrollTop = 0; }

/* forms */
function itemForm(i) {
  i = i || {}; var isNew = !i.id, cur = i.currency || 'USD';
  modal('<h2>' + (isNew ? 'Add an item' : esc(i.name)) + '</h2><label>Name<input class="tin" id="in" value="' + esc(i.name || '') + '" maxlength="80"></label><div class="row2"><label>Place<select id="il">' + locOpts(i.location || '') + '</select></label><label>Category<input class="tin" id="ic" value="' + esc(i.category || '') + '" maxlength="40" placeholder="Electronics, furniture..."></label></div><div class="row2"><label>Price paid<input class="tin num" id="iv" inputmode="decimal" value="' + (i.value || '') + '"></label><label>Currency<input class="tin" id="icu" value="' + esc(cur) + '" maxlength="5"></label></div><div class="row2"><label>Bought on<input class="tin" id="ib" type="date" value="' + esc(i.bought || '') + '"></label><label>Warranty ends<input class="tin" id="iw" type="date" value="' + esc(i.warranty || '') + '"></label></div><div class="row2"><label>Store<input class="tin" id="is" value="' + esc(i.store || '') + '" maxlength="60"></label><label>Serial number<input class="tin" id="isn" value="' + esc(i.serial || '') + '" maxlength="60"></label></div><label>How many<input class="tin num" id="iq" inputmode="numeric" value="' + (i.qty || 1) + '"></label><label>Receipt or manual <small class="tmuted">(saved in your Drive under Receipts)</small><input type="file" id="ir" accept="image/*,application/pdf">' + (i.receipt ? '<small>Current: <a href="' + T.fs.url(i.receipt) + '" target="_blank" rel="noopener">' + esc(T.baseOf(i.receipt)) + '</a></small>' : '') + '</label><label>Notes<input class="tin" id="ino" value="' + esc(i.notes || '') + '" maxlength="500"></label><div class="err" id="ie" role="alert"></div><div class="acts">' + (isNew ? '' : '<button class="mbtn dng" data-a="delitem" data-id="' + i.id + '">Delete</button><span style="flex:1"></span>') + '<button class="mbtn" data-a="close">Cancel</button><button class="mbtn pri" id="iok">Save</button></div>', function () {
    $('#iok').onclick = function () {
      var b = { name: $('#in').value, location: $('#il').value, category: $('#ic').value, value: num($('#iv').value) || 0, currency: $('#icu').value.toUpperCase(), bought: $('#ib').value, warranty: $('#iw').value, store: $('#is').value, serial: $('#isn').value, qty: num($('#iq').value) || 1, notes: $('#ino').value }, f = $('#ir').files[0]; $('#iok').disabled = true;
      var up = f ? T.fs.mkdir('/Receipts').catch(function () {}).then(function () { var p = '/Receipts/' + Date.now().toString(36) + '-' + f.name.replace(/[^\w.\-]+/g, '_'); return T.fs.write(p, f, f.type || 'application/octet-stream', true).then(function () { b.receipt = p; }); }) : Promise.resolve();
      up.then(function () { return api(isNew ? 'POST' : 'PUT', isNew ? '/items' : '/items/' + i.id, b); }).then(function (s) { close(); set(s); T.toast('Saved'); }).catch(function (e) { $('#ie').textContent = e.message; $('#iok').disabled = false; });
    };
  });
}
function prodForm(p) {
  p = p || {}; var isNew = !p.id;
  modal('<h2>' + (isNew ? 'Add a product' : esc(p.name)) + '</h2><label>Name<input class="tin" id="pn" value="' + esc(p.name || '') + '" maxlength="60"></label><div class="row2"><label>Unit<select id="pu">' + H.st.units.map(function (u) { return '<option' + (u === (p.unit || 'pcs') ? ' selected' : '') + '>' + u + '</option>'; }).join('') + '</select></label><label>Keep at least<input class="tin num" id="pm" inputmode="decimal" value="' + (p.min || '') + '" placeholder="0"></label></div><label>Stored in<select id="pl">' + locOpts(p.location || '') + '</select></label>' + (isNew ? '<div class="row2"><label>In stock now<input class="tin num" id="ps" inputmode="decimal"></label><label>Best before<input class="tin" id="pe" type="date"></label></div>' : '') + '<div class="err" id="pe2" role="alert"></div><div class="acts">' + (isNew ? '' : '<button class="mbtn dng" data-a="delprod" data-id="' + p.id + '">Delete</button><span style="flex:1"></span>') + '<button class="mbtn" data-a="close">Cancel</button><button class="mbtn pri" id="pok">Save</button></div>', function () {
    $('#pok').onclick = function () { var b = { name: $('#pn').value, unit: $('#pu').value, min: num($('#pm').value) || 0, location: $('#pl').value }; if (isNew) { b.stock = num($('#ps').value) || 0; b.expires = $('#pe').value; } api(isNew ? 'POST' : 'PUT', isNew ? '/products' : '/products/' + p.id, b).then(function (s) { close(); set(s); }).catch(function (e) { $('#pe2').textContent = e.message; }); };
  });
}
function stockForm(p) {
  modal('<h2>Add ' + esc(p.name) + '</h2><div class="row2"><label>How many (' + esc(p.unit) + ')<input class="tin num" id="sq" inputmode="decimal" value="1"></label><label>Best before<input class="tin" id="se" type="date"></label></div><div class="err" id="se2" role="alert"></div><div class="acts"><button class="mbtn" data-a="close">Cancel</button><button class="mbtn pri" id="sok">Add to stock</button></div>', function () { $('#sok').onclick = function () { api('POST', '/products/' + p.id + '/stock', { delta: num($('#sq').value), expires: $('#se').value }).then(function (s) { close(); set(s); }).catch(function (e) { $('#se2').textContent = e.message; }); }; $('#mmodal').onkeydown = function (e) { if (e.key === 'Enter') $('#sok').click(); }; });
}
var A = {};
A.close = close; A.none = function () {};
A.newitem = function () { itemForm(); }; A.edititem = function (b) { itemForm(H.st.items.filter(function (i) { return i.id === b.dataset.id; })[0]); };
A.delitem = function (b) { api('DELETE', '/items/' + b.dataset.id).then(function (s) { close(); set(s); }).catch(err); };
A.newprod = function () { prodForm(); }; A.editprod = function (b) { prodForm(H.st.products.filter(function (p) { return p.id === b.dataset.id; })[0]); };
A.delprod = function (b) { api('DELETE', '/products/' + b.dataset.id).then(function (s) { close(); set(s); }).catch(err); };
A.use = function (b) { api('POST', '/products/' + b.dataset.id + '/stock', { delta: -1 }).then(set).catch(err); };
A.addst = function (b) { stockForm(H.st.products.filter(function (p) { return p.id === b.dataset.id; })[0]); };
A.bought = function (b) { api('POST', '/shopping/' + b.dataset.id + '/bought', {}).then(set).catch(err); };
A.shdel = function (b) { api('DELETE', '/shopping/' + b.dataset.id).then(set).catch(err); };
A.clrdone = function () { api('DELETE', '/shopping/done').then(set).catch(err); };
A.missing = function () { api('POST', '/shopping/missing', {}).then(function (r) { set(r.state); T.toast(r.added ? 'Added ' + r.added + ' to the list' : 'Nothing is running low'); }).catch(err); };
A.delloc = function (b) { api('DELETE', '/locations/' + b.dataset.id).then(set).catch(err); };
document.addEventListener('click', function (e) { var b = e.target.closest('[data-a],[data-tab]'); if (!b) return; if (b.dataset.tab) { close(); return go(b.dataset.tab); } if (b.dataset.a === 'none') return; if (A[b.dataset.a]) A[b.dataset.a](b); });
$('#mfab').innerHTML = T.ic('plus'); $('#mfab').onclick = function () { if (H.tab === 'pantry') prodForm(); else if (H.tab === 'shop') { var i = $('#shn'); if (i) i.focus(); } else if (H.tab === 'places') { var p = $('#pln'); if (p) p.focus(); } else itemForm(); };
var h0 = location.hash.replace('#', ''); H.tab = h0 === 'house' ? 'pantry' : 'items';
api('GET', '/state').then(function (s) { H.st = s; draw(); }).catch(function (e) { $('#mmain').innerHTML = '<div class="mempty"><b>Could not open</b><span>' + esc(e.message) + '</span></div>'; });
window.addEventListener('hashchange', function () { var h = location.hash.replace('#', ''); if (H.st && (h === 'house' || h === 'belong')) { var t = h === 'house' ? 'pantry' : 'items'; if ((t === 'pantry') !== (H.tab === 'pantry' || H.tab === 'shop')) go(t); } });
})();
