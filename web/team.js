/* Team and guests: invite people, choose what they can open, switch access off. Owner only. */
(function () {
'use strict';
var A = window.AOS; if (!A) return;
var S = A.S, $ = A.$, esc = A.esc, api = A.api, toast = A.toast;
var X = { d: null, err: null, form: null, link: null, edit: null };

function load() { api('/api/team').then(function (d) { X.d = d; X.err = null; }).catch(function (e) { X.err = e.message; }).then(function () { if (S.view === 'team') A.redraw(); }); }
function ago(t) { if (!t) return 'never'; var m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' days ago'; }
function suiteApps() { return (S.apps || []).filter(function (a) { return a.hasSource; }); }
function boxes(f) {
  var h = '<div class="tmgrid">' + X.d.areas.map(function (a) { return '<label class="tmck"><input type="checkbox" data-tm-area="' + esc(a.key) + '"' + (f.apps.indexOf(a.key) >= 0 ? ' checked' : '') + '><span><b>' + esc(a.name) + '</b><small>' + esc(a.note) + (a.shares === 'yours' ? ' <em>Shows your own data.</em>' : '') + '</small></span></label>'; }).join('') + '</div>';
  if (f.apps.indexOf('suite') >= 0) {
    var all = f.suite.indexOf('*') >= 0;
    h += '<div class="tmsuite"><label class="tmck"><input type="checkbox" data-tm-all' + (all ? ' checked' : '') + '><span><b>All Suite apps</b></span></label>' + (all ? '' : '<div class="tmchips">' + suiteApps().map(function (a) { return '<label class="chip"><input type="checkbox" data-tm-suite="' + esc(a.slug) + '"' + (f.suite.indexOf(a.slug) >= 0 ? ' checked' : '') + '>' + esc(a.name) + '</label>'; }).join('') + '</div>') + '</div>';
  }
  return h;
}
function form() {
  var f = X.form; if (!f) return '';
  return '<div class="card tmform"><div class="sech2"><h2>' + (f.id ? 'Edit ' + esc(f.name) : 'Invite someone') + '</h2></div>' +
    '<div class="tmrow"><label>Name<input id="tmn" value="' + esc(f.name) + '" maxlength="60"></label><label>Role<select id="tmr"><option value="guest"' + (f.role === 'guest' ? ' selected' : '') + '>Guest (limited)</option><option value="member"' + (f.role === 'member' ? ' selected' : '') + '>Team member</option></select></label></div>' +
    '<div class="tmrow"><label>Single sign-on email (optional)<input id="tme" type="email" value="' + esc(f.email) + '" placeholder="name@company.com"></label>' + (f.id ? '' : '<label>Link valid for (days)<input id="tmd" type="number" min="0" max="365" value="' + f.days + '"></label><label>Link can be used<input id="tmu" type="number" min="1" max="20" value="' + f.maxUses + '"></label>') + '</div>' +
    '<h3 class="tmh">What they can open</h3>' + boxes(f) +
    '<div class="tmact"><button class="btn primary" data-tm="save">' + (f.id ? 'Save changes' : 'Create invite') + '</button><button class="btn" data-tm="cancel">Cancel</button></div></div>';
}
function view() {
  var d = X.d, h = '<div class="wrap"><div class="pagehead"><div><h1>Team and guests</h1><p class="note" style="margin:4px 0 0">Give colleagues access to only the parts you choose. Each person gets their own private storage. Switch them off at any time.</p></div><button class="btn primary" data-tm="new">Invite someone</button></div>';
  if (X.err) return h + '<div class="banner"><i class="dot bad"></i><span>' + esc(X.err) + '</span></div></div>';
  if (!d) return h + '<p class="note">Loading...</p></div>';
  if (X.link) h += '<div class="card tmlink"><b>Invite link for ' + esc(X.link.name) + '</b><p class="note">Shown once. Send it to them; opening it signs them in.</p><div class="tmcopy"><input id="tml" readonly value="' + esc(X.link.url) + '"><button class="btn" data-tm="copy">Copy</button><button class="btn" data-tm="hidelink">Done</button></div></div>';
  h += form();
  h += '<div class="card secc"><div class="secrows">' + (d.members.length ? d.members.map(function (m) {
    var exp = m.expires ? (m.expires < Date.now() ? 'Link expired' : 'Link ends ' + A.fmt(new Date(m.expires), { day: '2-digit' })) : 'Link does not expire';
    return '<div class="secrow"><div style="min-width:0;flex:1"><b>' + esc(m.name) + '</b> <span class="pill ' + (m.disabled ? 'bad' : 'ok') + '"><i class="dot"></i>' + (m.disabled ? 'Off' : m.role === 'member' ? 'Member' : 'Guest') + '</span><div class="note">' + esc((m.email ? m.email + ' · ' : '') + (m.apps.length ? m.apps.map(function (k) { var a = d.areas.filter(function (x) { return x.key === k; })[0]; return a ? a.name : k; }).join(', ') : 'No access yet') + ' · Last seen ' + ago(m.seen) + (m.hasLink ? ' · ' + exp + ' · used ' + m.uses + '/' + m.maxUses : '')) + '</div></div>' +
      '<div class="tmbtns"><button class="btn sm" data-tm="edit" data-id="' + m.id + '">Edit</button><button class="btn sm" data-tm="link" data-id="' + m.id + '">New link</button><button class="btn sm" data-tm="toggle" data-id="' + m.id + '">' + (m.disabled ? 'Turn on' : 'Turn off') + '</button><button class="btn sm" data-tm="del" data-id="' + m.id + '">Remove</button></div></div>';
  }).join('') : '<p class="note">Nobody yet. Invite a colleague to try it.</p>') + '</div></div>';
  return h + '</div>';
}
function read() {
  var f = X.form; f.name = $('#tmn').value; f.role = $('#tmr').value; f.email = $('#tme').value.trim();
  if ($('#tmd')) { f.days = Number($('#tmd').value) || 0; f.maxUses = Number($('#tmu').value) || 1; }
  f.apps = [].map.call(document.querySelectorAll('[data-tm-area]:checked'), function (x) { return x.getAttribute('data-tm-area'); });
  if (document.querySelector('[data-tm-all]')) f.suite = document.querySelector('[data-tm-all]').checked ? ['*'] : [].map.call(document.querySelectorAll('[data-tm-suite]:checked'), function (x) { return x.getAttribute('data-tm-suite'); });
}
document.addEventListener('change', function (ev) { if (X.form && ev.target.closest && ev.target.closest('.tmform') && (ev.target.matches('[data-tm-area]') || ev.target.matches('[data-tm-all]'))) { read(); A.redraw(); } });
document.addEventListener('click', function (ev) {
  var b = ev.target.closest && ev.target.closest('[data-tm]'); if (!b) return; var a = b.getAttribute('data-tm'), id = b.getAttribute('data-id');
  var mem = function () { return X.d.members.filter(function (m) { return m.id === id; })[0]; };
  var fail = function (e) { toast(e.message); };
  if (a === 'new') { X.form = { name: '', role: 'guest', email: '', apps: [], suite: [], days: 7, maxUses: 3 }; return void A.redraw(); }
  if (a === 'cancel') { X.form = null; return void A.redraw(); }
  if (a === 'edit') { var m = mem(); X.form = { id: m.id, name: m.name, role: m.role, email: m.email, apps: m.apps.slice(), suite: m.suite.slice() }; return void A.redraw(); }
  if (a === 'save') {
    read(); var f = X.form, body = { name: f.name, role: f.role, email: f.email, apps: f.apps, suite: f.suite };
    if (f.id) return void api('/api/team/' + f.id, { method: 'PUT', json: body }).then(function () { X.form = null; toast('Saved'); load(); }).catch(fail);
    body.days = f.days; body.maxUses = f.maxUses;
    return void api('/api/team', { method: 'POST', json: body }).then(function (r) { X.form = null; X.link = r.link ? { name: r.member.name, url: r.link } : null; toast('Invite created'); load(); }).catch(fail);
  }
  if (a === 'link') return void api('/api/team/' + id + '/link', { method: 'POST', json: { days: 7 } }).then(function (r) { X.link = { name: mem().name, url: r.link }; load(); }).catch(fail);
  if (a === 'toggle') { var t = mem(); return void api('/api/team/' + id, { method: 'PUT', json: { disabled: !t.disabled } }).then(function () { toast(t.disabled ? 'Turned on' : 'Turned off and signed out'); load(); }).catch(fail); }
  if (a === 'del') { var n = mem(); if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Sure?'; return; } return void api('/api/team/' + id, { method: 'DELETE' }).then(function () { toast(n.name + ' removed'); load(); }).catch(fail); }
  if (a === 'copy') { var i = $('#tml'); try { navigator.clipboard.writeText(i.value).then(function () { toast('Copied'); }, function () { i.select(); }); } catch (e) { i.select(); } return; }
  if (a === 'hidelink') { X.link = null; return void A.redraw(); }
});
window.AOSViews.team = view; window.AOSOnGo.team = load;
window.AOSTeam = { load: load, state: X };
})();
