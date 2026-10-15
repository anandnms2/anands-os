/* Adds "Add email account" inside the Anands Email app. The app itself reads the mailbox folder; this script lets you connect real
 * mailboxes (Gmail, Outlook, iCloud, Yahoo, Zoho or any IMAP server) without leaving the app. Mail is synced into the same folder the app reads. */
(function () {
'use strict';
var P = { gmail: ['imap.gmail.com', 'smtp.gmail.com', 'Gmail needs an app password: Google Account, Security, 2-Step Verification, App passwords.'], outlook: ['outlook.office365.com', 'smtp.office365.com', 'Outlook and Microsoft 365 may need an app password.'], icloud: ['imap.mail.me.com', 'smtp.mail.me.com', 'iCloud needs an app-specific password from appleid.apple.com.'], yahoo: ['imap.mail.yahoo.com', 'smtp.mail.yahoo.com', 'Yahoo needs an app password.'], zoho: ['imap.zoho.com', 'smtp.zoho.com', ''], custom: ['', '', 'Enter the incoming (IMAP) and outgoing (SMTP) server names from your provider.'] };
var H = { 'x-aos': '1', 'content-type': 'application/json' };
function api(p, o) { o = o || {}; o.headers = H; o.credentials = 'same-origin'; return fetch(p, o).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error((j.error && (j.error.message || j.error)) || j.message || ('Error ' + r.status)); return j; }); }); }
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var css = '.aem-b{position:fixed;left:12px;bottom:14px;z-index:60;display:flex;align-items:center;gap:8px;padding:9px 14px;border:1px solid rgba(128,128,128,.35);border-radius:999px;background:#fff;color:#1f1f1f;font:500 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.18)}.aem-b:hover{background:#f1f4f9}' +
  '.aem-o{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:16px}.aem-m{width:min(520px,100%);max-height:92vh;overflow:auto;background:#fff;color:#1f1f1f;border-radius:16px;padding:20px;font:14px/1.45 system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.4)}' +
  '.aem-m h2{margin:0 0 4px;font-size:20px}.aem-m p{margin:0 0 12px;color:#5f6368}.aem-m label{display:block;font-size:12px;color:#5f6368;margin:10px 0 4px}.aem-m input,.aem-m select{width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #c4c7c5;border-radius:8px;font:inherit;background:#fff;color:#1f1f1f}' +
  '.aem-r{display:grid;grid-template-columns:1fr 1fr;gap:10px}.aem-a{display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}.aem-m button{padding:8px 14px;border:1px solid #c4c7c5;border-radius:999px;background:#fff;color:#1f1f1f;font:500 13px system-ui;cursor:pointer}.aem-m button.p{background:#0b57d0;border-color:#0b57d0;color:#fff}.aem-m button:disabled{opacity:.6;cursor:default}' +
  '.aem-acc{display:flex;gap:8px;align-items:center;flex-wrap:wrap;border:1px solid #dadce0;border-radius:10px;padding:8px 10px;margin:6px 0}.aem-acc div{flex:1;min-width:140px}.aem-acc small{display:block;color:#5f6368}.aem-n{margin-top:10px;font-size:13px;color:#5f6368}.aem-n.bad{color:#b3261e}.aem-n.ok{color:#146c2e}' +
  '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .aem-b,:root:not([data-theme="light"]) .aem-m,:root:not([data-theme="light"]) .aem-m input,:root:not([data-theme="light"]) .aem-m select,:root:not([data-theme="light"]) .aem-m button{background:#2b2c2f;color:#e3e3e3;border-color:#5f6368}:root:not([data-theme="light"]) .aem-m button.p{background:#a8c7fa;color:#062e6f}:root:not([data-theme="light"]) .aem-m p,:root:not([data-theme="light"]) .aem-m label,:root:not([data-theme="light"]) .aem-acc small,:root:not([data-theme="light"]) .aem-n{color:#c4c7c5}}' +
  ':root[data-theme="dark"] .aem-b,:root[data-theme="dark"] .aem-m,:root[data-theme="dark"] .aem-m input,:root[data-theme="dark"] .aem-m select,:root[data-theme="dark"] .aem-m button{background:#2b2c2f;color:#e3e3e3;border-color:#5f6368}:root[data-theme="dark"] .aem-m button.p{background:#a8c7fa;color:#062e6f}:root[data-theme="dark"] .aem-m p,:root[data-theme="dark"] .aem-m label,:root[data-theme="dark"] .aem-acc small,:root[data-theme="dark"] .aem-n{color:#c4c7c5}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
var changed = false, accounts = [], ov = null;
function note(t, k) { var n = ov && ov.querySelector('.aem-n'); if (n) { n.textContent = t || ''; n.className = 'aem-n ' + (k || ''); } }
function close() { if (ov) { ov.remove(); ov = null; } if (changed) location.reload(); }
function draw(preset) {
  preset = preset || 'gmail'; var p = P[preset];
  var list = accounts.length ? accounts.map(function (a) { return '<div class="aem-acc"><div><b>' + esc(a.address) + '</b>' + (a.default ? ' (default sender)' : '') + '<small>' + (a.error ? esc(a.error) : a.lastSync ? esc(a.count + ' messages, synced ' + new Date(a.lastSync).toLocaleString()) : 'Not synced yet') + '</small></div><button data-a="sync" data-id="' + a.id + '">Sync now</button>' + (a.default ? '' : '<button data-a="def" data-id="' + a.id + '">Make default</button>') + '<button data-a="del" data-id="' + a.id + '">Remove</button></div>'; }).join('') : '<p>No accounts connected yet. Add one below and its mail appears in this inbox.</p>';
  ov.innerHTML = '<div class="aem-m" role="dialog" aria-label="Email accounts"><h2>Email accounts</h2><p>Connect your own mailboxes. Messages are copied into this inbox, and you send from the account you choose.</p>' + list +
    '<h2 style="font-size:16px;margin-top:16px">Add an account</h2><label for="aem-pr">Provider</label><select id="aem-pr">' + Object.keys(P).map(function (k) { return '<option value="' + k + '"' + (k === preset ? ' selected' : '') + '>' + (k === 'custom' ? 'Other (IMAP)' : k[0].toUpperCase() + k.slice(1)) + '</option>'; }).join('') + '</select>' +
    '<label for="aem-ad">Email address</label><input id="aem-ad" type="email" autocomplete="off" placeholder="you@example.com"><label for="aem-pw">Password or app password</label><input id="aem-pw" type="password" autocomplete="new-password">' +
    '<div class="aem-r"><div><label for="aem-ih">Incoming (IMAP) server</label><input id="aem-ih" value="' + esc(p[0]) + '" placeholder="imap.example.com"></div><div><label for="aem-sh">Outgoing (SMTP) server</label><input id="aem-sh" value="' + esc(p[1]) + '" placeholder="smtp.example.com"></div></div>' +
    '<div class="aem-n" role="status">' + esc(p[2]) + '</div><div class="aem-a"><button data-a="x">Close</button><button class="p" data-a="add">Add and sync</button></div></div>';
  var f = ov.querySelector('#aem-ad'); if (f) f.focus();
}
function refresh() { return api('/api/mailboxes').then(function (r) { accounts = r.accounts || []; }); }
function open() {
  if (ov) return; ov = document.createElement('div'); ov.className = 'aem-o';
  ov.addEventListener('click', function (ev) { if (ev.target === ov) return close(); var b = ev.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a'), id = b.getAttribute('data-id');
    if (a === 'x') return close();
    if (a === 'add') { var g = function (i) { return ov.querySelector(i).value.trim(); }; b.disabled = true; note('Connecting and syncing, this can take a minute...');
      return api('/api/mailboxes', { method: 'POST', body: JSON.stringify({ address: g('#aem-ad'), pass: ov.querySelector('#aem-pw').value, imapHost: g('#aem-ih'), smtpHost: g('#aem-sh') }) }).then(refresh).then(function () { changed = true; draw(); note('Account added. Close this window to see its mail.', 'ok'); }).catch(function (e) { b.disabled = false; note(e.message, 'bad'); }); }
    if (a === 'sync') { b.disabled = true; note('Syncing...'); return api('/api/mailboxes/' + id + '/sync', { method: 'POST', body: '{}' }).then(refresh).then(function () { changed = true; draw(); note('Synced.', 'ok'); }).catch(function (e) { b.disabled = false; note(e.message, 'bad'); }); }
    if (a === 'def') return api('/api/mailboxes/' + id + '/default', { method: 'POST', body: '{}' }).then(function (r) { accounts = r.accounts || accounts; draw(); });
    if (a === 'del') return api('/api/mailboxes/' + id, { method: 'DELETE' }).then(function (r) { accounts = r.accounts || []; changed = true; draw(); });
  });
  ov.addEventListener('change', function (ev) { if (ev.target.id === 'aem-pr') { var ad = ov.querySelector('#aem-ad').value; draw(ev.target.value); ov.querySelector('#aem-ad').value = ad; } });
  ov.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') close(); });
  document.body.appendChild(ov); refresh().then(function () { draw(); }, function () { accounts = []; draw(); });
}
function mount() {
  if (document.getElementById('aem-btn')) return; var b = document.createElement('button'); b.id = 'aem-btn'; b.className = 'aem-b'; b.type = 'button'; b.setAttribute('aria-label', 'Add email account');
  b.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Add email account'; b.addEventListener('click', open); document.body.appendChild(b);
}
/* also offer it in the app's own Settings (gear) menu */
function menuHook() {
  var mo = new MutationObserver(function () {
    var n = Array.prototype.filter.call(document.querySelectorAll('[role=menu] *, .menu *'), function (e) { return !e.children.length && /^Notify me on this device$/.test((e.textContent || '').trim()); })[0];
    if (!n) return; var row = n.closest('[role=menuitem], [role=menuitemcheckbox], button') || n.parentElement; if (!row || !row.parentElement || row.parentElement.querySelector('[data-aem]')) return;
    var c = row.cloneNode(true); c.setAttribute('data-aem', '1'); c.removeAttribute('aria-checked'); var t = c.querySelectorAll('*'); for (var i = 0; i < t.length; i++) if (!t[i].children.length && /Notify me/.test(t[i].textContent)) t[i].textContent = 'Email accounts...';
    c.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); setTimeout(open, 50); }, true);
    row.parentElement.appendChild(c);
  }); mo.observe(document.body, { childList: true, subtree: true });
}
if (document.body) { mount(); menuHook(); } else document.addEventListener('DOMContentLoaded', function () { mount(); menuHook(); });
setTimeout(mount, 1500);
})();
