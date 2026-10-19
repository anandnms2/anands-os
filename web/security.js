/* Security center: signed-in devices, sign-in history, Authentik logins, and Vault password health. */
(function () {
'use strict';
var A = window.AOS; if (!A) return;
var S = A.S, $ = A.$, esc = A.esc, api = A.api, ic = A.ic, toast = A.toast;
var X = { d: null, err: null, ak: null, akBusy: false, loading: false, akForm: false };

function ua(s) {
  s = String(s || ''); var b = /Edg\//.test(s) ? 'Edge' : /OPR\//.test(s) ? 'Opera' : /Firefox\//.test(s) ? 'Firefox' : /Chrome\//.test(s) ? 'Chrome' : /Safari\//.test(s) ? 'Safari' : s ? 'Browser' : 'Unknown browser';
  var o = /Windows/.test(s) ? 'Windows' : /iPhone|iPad/.test(s) ? 'iPhone' : /Android/.test(s) ? 'Android' : /Mac OS/.test(s) ? 'Mac' : /Linux/.test(s) ? 'Linux' : ''; return b + (o ? ' on ' + o : '');
}
function when(t) { return t ? A.fmt(new Date(t), { day: '2-digit', hour: '2-digit' }) : ''; }
function ago(t) { var m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' days ago'; }
var EVN = { phone_paired: ['Phone paired', 'ok'], pair_started: ['Pairing started', ''], term_open: ['Terminal opened', 'warn'], term_close: ['Terminal closed', ''], term_denied: ['Terminal blocked', 'bad'], login: ['Signed in', 'ok'], login_failed: ['Wrong password', 'bad'], login_denied: ['Not allowed', 'bad'], logout: ['Signed out', ''], revoked: ['Session ended', 'warn'], revoked_all: ['All other sessions ended', 'warn'], invite_used: ['Guest link used', ''], invite_created: ['Guest link created', ''] };
function pill(e) { var x = EVN[e] || [e, '']; return '<span class="pill ' + (x[1] || '') + '"><i class="dot"></i>' + esc(x[0]) + '</span>'; }

function load() {
  X.loading = true; api('/api/security').then(function (d) { X.d = d; X.err = null; }).catch(function (e) { X.err = e.message; }).then(function () { X.loading = false; if (S.view === 'security') A.redraw(); });
  loadAk();
}
function loadAk() {
  if (!(((S.settings || {}).authentik || {}).tokenSet)) { X.ak = null; return; }
  X.akBusy = true; api('/api/security/authentik').then(function (d) { X.ak = d; }).catch(function (e) { X.ak = { configured: true, events: [], error: e.message }; }).then(function () { X.akBusy = false; if (S.view === 'security') A.redraw(); });
}

/* ---------- password health ---------- */
function health() {
  var r = A.vaultReport && A.vaultReport();
  if (!r) return '<div class="card secc"><div class="sech2"><h2>Password health</h2></div><p class="note" style="margin:6px 0 12px">Your Vault is locked, so nothing has been scanned. The scan happens in this browser. Passwords are never sent anywhere.</p><button class="btn primary" data-sec="vault">Unlock Vault to scan</button></div>';
  var weak = r.filter(function (i) { return i.flags.indexOf('weak') > -1; }), reused = r.filter(function (i) { return i.flags.indexOf('reused') > -1; }), old = r.filter(function (i) { return i.flags.indexOf('old') > -1; });
  var no2 = r.filter(function (i) { return !i.totp && i.url; });
  var bad = {}; weak.concat(reused, old).forEach(function (i) { bad[i.id] = 1; }); var good = r.length - Object.keys(bad).length, score = r.length ? Math.round(good * 100 / r.length) : 100;
  var tile = function (n, t, c) { return '<div class="sectile"><b class="' + (n ? c : 'ok') + '">' + n + '</b><span>' + t + '</span></div>'; };
  var row = function (i) { return '<div class="secrow"><div style="min-width:0;flex:1"><b>' + esc(i.name) + '</b><div class="note">' + esc(i.user || i.url || '') + '</div></div><span class="secflags">' + i.flags.map(function (f) { return '<span class="pill ' + (f === 'old' ? 'warn' : 'bad') + '">' + (f === 'old' ? 'Older than a year' : f === 'weak' ? 'Weak' : 'Reused') + '</span>'; }).join('') + '</span><button class="btn sm" data-sec="open" data-id="' + esc(i.id) + '">Open</button></div>'; };
  var list = r.filter(function (i) { return i.flags.length; }).sort(function (a, b) { return b.flags.length - a.flags.length; });
  return '<div class="card secc"><div class="sech2"><h2>Password health</h2><span class="note">' + r.length + ' logins scanned in this browser</span></div>' +
    '<div class="sectiles"><div class="sectile score"><b>' + score + '%</b><span>healthy</span></div>' + tile(weak.length, 'weak', 'bad') + tile(reused.length, 'reused', 'bad') + tile(old.length, 'over a year old', 'warn') + tile(no2.length, 'without a one-time code', 'warn') + '</div>' +
    (list.length ? '<div class="secrows">' + list.slice(0, 40).map(row).join('') + '</div>' : '<p class="note" style="margin-top:12px">No weak, reused or old passwords found.</p>') + '</div>';
}

/* ---------- views ---------- */
function view() {
  var d = X.d, h = '<div class="wrap"><div class="pagehead"><div><h1>Security center</h1><p class="note" style="margin:4px 0 0">Where you are signed in, who tried to get in, and how strong your passwords are.</p></div><button class="btn" data-sec="refresh">' + (X.loading ? 'Refreshing...' : 'Refresh') + '</button></div>';
  if (X.err) return h + '<div class="banner"><i class="dot bad"></i><span>' + esc(X.err) + '</span></div></div>';
  if (!d) return h + '<p class="note">Loading...</p></div>';
  var failed = d.history.filter(function (e) { return e.ev === 'login_failed' && Date.now() - e.t < 7 * 864e5; }).length;
  h += '<div class="sectiles top">' +
    '<div class="sectile"><b>' + d.sessions.length + '</b><span>signed-in device' + (d.sessions.length === 1 ? '' : 's') + '</span></div>' +
    '<div class="sectile"><b class="' + (failed ? 'bad' : 'ok') + '">' + failed + '</b><span>failed sign-ins this week</span></div>' +
    '<div class="sectile"><b>' + (d.method === 'sso' ? 'SSO' : 'Password') + '</b><span>how you sign in' + (d.method === 'sso' ? '' : ' (SSO is safer)') + '</span></div>' +
    '<div class="sectile"><b class="' + (location.protocol === 'https:' ? 'ok' : 'bad') + '">' + (location.protocol === 'https:' ? 'On' : 'Off') + '</b><span>HTTPS</span></div></div>';
  h += '<div class="card secc"><div class="sech2"><h2>Pair a phone</h2></div><p class="note" style="margin:0 0 10px">Scan a code with your phone camera to sign it in without typing your password. Each phone shows up below, and you can sign it out at any time. Then use Add to Home Screen to install it as an app.</p>' +
    (X.pair ? '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><img alt="QR code to pair your phone" width="176" height="176" style="background:#fff;border-radius:12px;padding:8px" src="' + esc(X.pair.img) + '"><div style="flex:1;min-width:200px"><b>Scan with the phone</b><p class="note" style="margin:6px 0">Works once and expires in five minutes. The phone will ask you to confirm.</p><button class="btn sm" data-sec="pair-cancel">Done</button></div></div>' : '<div style="display:flex;gap:8px;flex-wrap:wrap"><input id="pairlabel" class="input" style="max-width:240px" placeholder="Name this phone, e.g. Anand iPhone" maxlength="40" aria-label="Phone name"><button class="btn primary sm" data-sec="pair">Show QR code</button></div>') + '</div>';
  h += '<div class="card secc"><div class="sech2"><h2>App access tokens</h2></div><p class="note" style="margin:0 0 10px">For phone shortcuts and other apps that need to add expenses or shopping items. A token only reaches the part you choose, appears below as a device, and stops working when you sign it out.</p>' +
    (X.tok ? '<div class="banner"><i class="dot ok"></i><span>Copy this now, it is not shown again:<br><code style="word-break:break-all;user-select:all">' + esc(X.tok) + '</code><br><span class="note">Send it as <code>Authorization: Bearer ...</code> to <code>' + esc(location.origin) + '/api/money/tx</code> or <code>/api/house/shopping</code>.</span></span></div><button class="btn sm" data-sec="tok-done">Done</button>' : '<div style="display:flex;gap:8px;flex-wrap:wrap"><input id="toklabel" class="input" style="max-width:220px" placeholder="Name, e.g. iPhone Shortcut" maxlength="40" aria-label="Token name"><select id="tokscope" class="input" style="max-width:200px" aria-label="Reach"><option value="money">Money only</option><option value="house">Household only</option><option value="both">Money and Household</option></select><button class="btn primary sm" data-sec="tok">Create token</button></div>') + '</div>';
  h += '<div class="card secc"><div class="sech2"><h2>Signed-in devices</h2>' + (d.sessions.length > 1 ? '<button class="btn sm" data-sec="revoke-others">Sign out everywhere else</button>' : '') + '</div>' +
    (d.legacy ? '<div class="banner"><i class="dot warn"></i><span>This device signed in before sessions were tracked. Sign out and in again to see it here.</span></div>' : '') +
    '<div class="secrows">' + (d.sessions.length ? d.sessions.map(function (s) {
      return '<div class="secrow"><span class="secic">' + ic(/iPhone|Android/.test(s.ua) ? 'cards' : 'monitor') + '</span><div style="min-width:0;flex:1"><b>' + esc(ua(s.ua)) + '</b>' + (s.current ? ' <span class="pill ok"><i class="dot"></i>This device</span>' : '') + (s.role && s.role !== 'owner' ? ' <span class="pill">' + esc(s.role) + '</span>' : '') + '<div class="note">' + esc(s.name || '') + ' · ' + esc(s.ip || 'unknown address') + ' · ' + (s.method === 'sso' ? 'SSO' : s.method === 'invite' ? 'guest link' : s.method === 'paired' ? 'paired phone' : s.method === 'token' ? 'access token' : 'password') + ' · active ' + ago(s.seen) + ' · signed in ' + when(s.created) + '</div></div>' + (s.current ? '' : '<button class="btn sm" data-sec="revoke" data-id="' + esc(s.id) + '">Sign out</button>') + '</div>';
    }).join('') : '<p class="note">No tracked sessions.</p>') + '</div></div>';
  h += health();
  h += '<div class="card secc"><div class="sech2"><h2>Sign-in history</h2><span class="note">Anands OS</span></div><div class="secrows">' + (d.history.length ? d.history.slice(0, 30).map(function (e) {
    return '<div class="secrow"><div style="min-width:130px">' + pill(e.ev) + '</div><div style="min-width:0;flex:1"><b>' + esc(e.user || '') + '</b> <span class="note">' + esc(ua(e.ua)) + ' · ' + esc(e.ip || '') + '</span></div><time class="note">' + when(e.t) + '</time></div>';
  }).join('') : '<p class="note">Nothing recorded yet.</p>') + '</div></div>';
  var akSet = ((S.settings || {}).authentik || {});
  h += '<div class="card secc"><div class="sech2"><h2>Authentik logins</h2>' + (akSet.tokenSet ? '<button class="btn sm" data-sec="akform">Change token</button>' : '') + '</div>';
  if (!akSet.tokenSet || X.akForm) h += '<p class="note" style="margin:6px 0 12px">Shows who signed in through single sign-on across all your apps. In Authentik create an API token (Directory, Tokens and App passwords) for a user that can view events, then paste it here.</p><div class="icform"><div class="field"><label for="akurl">Authentik address</label><input class="input" id="akurl" value="' + esc(akSet.url || '') + '" placeholder="https://sso.example.com"></div><div class="field"><label for="aktok">API token</label><input class="input" id="aktok" type="password" autocomplete="off" placeholder="' + (akSet.tokenSet ? 'Saved. Type to replace' : 'Paste the token') + '"></div></div><div class="cpact" style="margin-top:12px"><button class="btn primary" data-sec="aksave">Save and load</button></div>';
  else if (X.akBusy && !X.ak) h += '<p class="note">Loading...</p>';
  else if (X.ak && X.ak.error) h += '<div class="banner"><i class="dot bad"></i><span>' + esc(X.ak.error) + '</span></div>';
  else if (X.ak) h += '<div class="secrows">' + (X.ak.events.length ? X.ak.events.map(function (e) { return '<div class="secrow"><div style="min-width:130px">' + pill(e.ev) + '</div><div style="min-width:0;flex:1"><b>' + esc(e.user) + '</b> <span class="note">' + esc([e.app, e.method, e.ip].filter(Boolean).join(' · ')) + '</span></div><time class="note">' + when(e.t) + '</time></div>'; }).join('') : '<p class="note">No sign-in events.</p>') + '</div>';
  h += '</div>';
  var sv = window.AOSVault && AOSVault.hasSaved && AOSVault.hasSaved();
  h += '<div class="card secc"><div class="sech2"><h2>This browser</h2></div><div class="secrow"><div style="flex:1"><b>Remembered Vault login</b><div class="note">' + (sv ? 'Your Vault email and master password are saved on this device, sealed with a key that never leaves the browser. You still enter the two-step code.' : 'Nothing saved. The Vault asks for your email and master password each time.') + '</div></div>' + (sv ? '<button class="btn sm" data-sec="forgetvault">Forget</button>' : '') + '</div></div>';
  return h + '</div>';
}
document.addEventListener('click', function (ev) {
  var b = ev.target.closest && ev.target.closest('[data-sec]'); if (!b) return; var a = b.getAttribute('data-sec'), id = b.getAttribute('data-id');
  if (a === 'refresh') return void load();
  if (a === 'vault') return void A.go('vault');
  if (a === 'open') { S.vault.sel = id; S.vault.q = ''; return void A.go('vault'); }
  if (a === 'revoke') return void api('/api/security/revoke', { method: 'POST', json: { id: id } }).then(function () { toast('Device signed out'); load(); }).catch(function (e) { toast(e.message); });
  if (a === 'revoke-others') return void api('/api/security/revoke-others', { method: 'POST', json: {} }).then(function (r) { toast(r.count + ' other session' + (r.count === 1 ? '' : 's') + ' ended'); load(); }).catch(function (e) { toast(e.message); });
  if (a === 'pair') { var lab = ($('#pairlabel') || {}).value || ''; return void api('/api/security/pair', { method: 'POST', json: { label: lab } }).then(function (r) { var img = ''; try { var q = window.qrcode(0, 'M'); q.addData(r.url); q.make(); img = q.createDataURL(6, 3); } catch (e) {} if (!img) return toast('Could not draw the code'); X.pair = { img: img, url: r.url }; A.redraw(); clearTimeout(X.pt); X.pt = setTimeout(function () { X.pair = null; A.redraw(); }, 300000); }).catch(function (e) { toast(e.message); }); }
  if (a === 'tok') return void api('/api/security/token', { method: 'POST', json: { name: ($('#toklabel') || {}).value || '', scope: ($('#tokscope') || {}).value || 'money' } }).then(function (r) { X.tok = r.token; load(); A.redraw(); }).catch(function (e) { toast(e.message); });
  if (a === 'tok-done') { X.tok = null; load(); return void A.redraw(); }
  if (a === 'pair-cancel') { X.pair = null; load(); return void A.redraw(); }
  if (a === 'akform') { X.akForm = true; return void A.redraw(); }
  if (a === 'aksave') { var u = $('#akurl').value.trim(), t = $('#aktok').value.trim(); return void api('/api/settings', { method: 'PUT', json: { authentik: { url: u, token: t } } }).then(function (s) { S.settings = s; X.akForm = false; toast('Saved'); load(); }).catch(function (e) { toast(e.message); }); }
  if (a === 'forgetvault') { try { AOSVault.forget(); } catch (e) {} S.vault.savedOn = false; toast('Vault login forgotten on this device'); return void A.redraw(); }
});
window.AOSViews.security = view; window.AOSOnGo.security = load;
window.AOSSec = { load: load, state: X };
})();
