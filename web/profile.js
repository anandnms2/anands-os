/* Your profile: click the avatar (top right) for an account menu; edit your name, contact details and picture. */
(function () {
'use strict';
var A = window.AOS; if (!A) return;
var S = A.S, esc = A.esc, api = A.api, toast = A.toast, ic = A.ic;
var PF = window.AOSProfile = { data: null, open: false };
var FIELDS = [['name', 'Display name', 'text', 'Your full name'], ['title', 'Job title', 'text', 'What you do'], ['company', 'Company', 'text', ''], ['email', 'Email', 'email', 'you@example.com'], ['phone', 'Phone', 'tel', '+255 ...'], ['location', 'Location', 'text', 'City, country']];

function initial() { return ((S.user && S.user.name) || 'A').trim().charAt(0).toUpperCase() || 'A'; }
function avatarHtml(url, cls) { return url ? '<img class="' + (cls || '') + '" src="' + esc(url) + '" alt="">' : esc(initial()); }
PF.paint = function () {
  var el = document.getElementById('avatar'); if (!el) return;
  var u = (S.user && S.user.avatar) || ''; el.innerHTML = avatarHtml(u); el.classList.toggle('has', !!u);
  el.setAttribute('title', (S.user && S.user.name) || 'Profile');
};
function menu(show) {
  var old = document.getElementById('pfmenu'); if (old) old.remove(); document.getElementById('avatar').setAttribute('aria-expanded', show ? 'true' : 'false'); PF.open = !!show; if (!show) return;
  var u = S.user || {}, m = document.createElement('div'); m.id = 'pfmenu'; m.className = 'pfmenu'; m.setAttribute('role', 'menu');
  m.innerHTML = '<div class="pfhead"><span class="pfav">' + avatarHtml(u.avatar) + '</span><div><b>' + esc(u.name || 'You') + '</b><span>' + esc(u.title || u.email || '') + '</span></div></div>' +
    '<button role="menuitem" data-pf="edit">' + ic('user') + 'Edit profile</button><button role="menuitem" data-pf="pic">' + ic('image') + 'Change picture</button>' +
    '<button role="menuitem" data-pf="settings">' + ic('settings') + 'Settings</button><div class="pfsep"></div><a role="menuitem" href="/auth/logout">' + ic('out') + 'Sign out</a>';
  document.getElementById('top').appendChild(m);
}
function load() { return api('/api/profile').then(function (p) { PF.data = p; return p; }); }
function form(p) {
  return '<div class="pfm"><div class="pfhd"><h2>Profile</h2><button class="btn ghost sm" data-pf="close" aria-label="Close">&#10005;</button></div>' +
    '<div class="pfpic"><button class="pfbig" data-pf="pic" aria-label="Change picture"><span id="pfbig">' + avatarHtml(p.avatar) + '</span><i>' + ic('camera') + '<em>Change</em></i></button>' +
    '<div><b id="pfn">' + esc(p.name || (S.user && S.user.name) || '') + '</b><span class="note">@' + esc(p.username || '') + (p.signin ? ' &middot; signs in as ' + esc(p.signin) : '') + '</span>' +
    '<div class="pfbtns"><button class="btn sm" data-pf="pic">Upload picture</button>' + (p.avatar ? '<button class="btn sm ghost" data-pf="rmpic">Remove</button>' : '') + '</div></div></div>' +
    '<div class="pfgrid">' + FIELDS.map(function (f) { return '<label>' + f[1] + '<input class="input" data-pfin="' + f[0] + '" type="' + f[2] + '" placeholder="' + f[3] + '" value="' + esc(p[f[0]] || '') + '" autocomplete="off"></label>'; }).join('') + '</div>' +
    '<label class="pfbio">About you<textarea class="input" data-pfin="bio" rows="3" maxlength="400" placeholder="A line or two about you">' + esc(p.bio || '') + '</textarea></label>' +
    '<div class="pffoot"><span class="note" id="pfmsg"></span><button class="btn" data-pf="close">Cancel</button><button class="btn primary" data-pf="save">Save</button></div>' +
    '<input type="file" id="pffile" accept="image/jpeg,image/png,image/webp,image/gif" hidden></div>';
}
PF.edit = function () { menu(false); load().then(function (p) { A.modal(form(p)); var f = document.querySelector('.pfm [data-pfin="name"]'); if (f) f.focus(); }).catch(function (e) { toast(e.message); }); };
function sync(p) { PF.data = p; if (S.user) { S.user.avatar = p.avatar; S.user.name = p.name || S.user.name; S.user.title = p.title; if (p.email) S.user.email = p.email; } PF.paint(); }
function save() {
  var b = {}; document.querySelectorAll('.pfm [data-pfin]').forEach(function (i) { b[i.getAttribute('data-pfin')] = i.value; });
  var m = document.getElementById('pfmsg'); if (m) m.textContent = 'Saving...';
  api('/api/profile', { method: 'PUT', json: b }).then(function (p) { sync(p); A.modal(); toast('Profile saved'); if (S.view === 'home') A.redraw && A.redraw(); }).catch(function (e) { if (m) m.textContent = e.message; });
}
/* resize to a 320px square (centre crop) so uploads stay small */
function square(file) {
  return new Promise(function (ok, bad) {
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function () {
      var s = Math.min(im.width, im.height), c = document.createElement('canvas'); c.width = c.height = 320;
      c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 320, 320); URL.revokeObjectURL(url);
      c.toBlob(function (b) { b ? ok(b) : bad(new Error('Could not read that picture')); }, 'image/jpeg', 0.9);
    };
    im.onerror = function () { URL.revokeObjectURL(url); bad(new Error('Could not read that picture')); }; im.src = url;
  });
}
function upload(file) {
  if (!file) return; if (file.size > 20 * 1024 * 1024) return toast('That picture is too large');
  square(file).then(function (blob) { return api('/api/profile/avatar', { method: 'POST', body: blob, headers: { 'content-type': 'image/jpeg' } }); })
    .then(function (p) { sync(p); var big = document.getElementById('pfbig'); if (big) big.innerHTML = avatarHtml(p.avatar); toast('Picture updated'); if (document.querySelector('.pfm')) load().then(function (q) { var v = document.querySelector('.pfm'); if (v) { var keep = {}; v.querySelectorAll('[data-pfin]').forEach(function (i) { keep[i.getAttribute('data-pfin')] = i.value; }); Object.keys(keep).forEach(function (k) { q[k] = keep[k]; }); A.modal(form(q)); } }); })
    .catch(function (e) { toast(e.message || 'Could not upload'); });
}
function pick() { var f = document.getElementById('pffile'); if (!f) { f = document.createElement('input'); f.type = 'file'; f.id = 'pffile'; f.accept = 'image/jpeg,image/png,image/webp,image/gif'; f.hidden = true; document.body.appendChild(f); } f.value = ''; f.onchange = function () { upload(f.files && f.files[0]); }; f.click(); }
document.addEventListener('click', function (ev) {
  var av = ev.target.closest('#avatar'); if (av) { ev.stopPropagation(); menu(!PF.open); return; }
  var t = ev.target.closest('[data-pf]');
  if (!t) { if (PF.open && !ev.target.closest('#pfmenu')) menu(false); return; }
  var a = t.getAttribute('data-pf');
  if (a === 'edit') return PF.edit();
  if (a === 'pic') { menu(false); return pick(); }
  if (a === 'settings') { menu(false); return A.go('settings'); }
  if (a === 'close') return A.modal();
  if (a === 'save') return save();
  if (a === 'rmpic') return void api('/api/profile/avatar', { method: 'DELETE' }).then(function (p) { sync(p); var v = document.querySelector('.pfm'); if (v) { PF.edit(); } toast('Picture removed'); }).catch(function (e) { toast(e.message); });
});
document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && PF.open) { menu(false); var a = document.getElementById('avatar'); if (a) a.focus(); } });
var a0 = document.getElementById('avatar'); if (a0) { a0.setAttribute('role', 'button'); a0.setAttribute('tabindex', '0'); a0.setAttribute('aria-haspopup', 'menu'); a0.setAttribute('aria-expanded', 'false'); a0.removeAttribute('aria-hidden'); a0.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); menu(!PF.open); } }); }
PF.paint();
})();
