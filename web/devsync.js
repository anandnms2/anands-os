/* Keeps the look and layout that live in this browser (desktop icons and pins, custom wallpaper picture, view choices) the same on the desktop app.
 * The website sends each change to the server; the desktop app applies what it received with its sync. Vault data is never included. */
(function () {
  'use strict';
  var desktop = /Electron\//.test(navigator.userAgent), SKIP = /^aos\.(vault\.|capq$|offline$|__)/;
  function ok(k) { return typeof k === 'string' && k.indexOf('aos.') === 0 && !SKIP.test(k); }
  var set = {}, del = {}, timer = null, ls = window.localStorage;
  var hdr = { 'x-aos': '1', 'content-type': 'application/json' };
  if (desktop) {
    fetch('/api/devstate', { credentials: 'same-origin', headers: { 'x-aos': '1' } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.t) return;
      var seen = 0; try { seen = Number(ls.getItem('aos.__dt')) || 0; } catch (e) {}
      if (seen === d.t) return;
      var changed = false;
      Object.keys(d.items || {}).forEach(function (k) { if (ok(k) && ls.getItem(k) !== d.items[k]) { try { ls.setItem(k, d.items[k]); changed = true; } catch (e) {} } });
      try { ls.setItem('aos.__dt', String(d.t)); } catch (e) {}
      if (changed) location.reload();
    }).catch(function () {});
    return;
  }
  function flush() {
    timer = null; var body = { set: set, del: Object.keys(del) }; set = {}; del = {};
    if (!Object.keys(body.set).length && !body.del.length) return;
    fetch('/api/devstate', { method: 'PUT', credentials: 'same-origin', headers: hdr, body: JSON.stringify(body) }).catch(function () {});
  }
  function later() { if (!timer) timer = setTimeout(flush, 2500); }
  var sI = Storage.prototype.setItem, rI = Storage.prototype.removeItem;
  Storage.prototype.setItem = function (k, v) { var r = sI.apply(this, arguments); if (this === ls && ok(k)) { set[k] = String(v); delete del[k]; later(); } return r; };
  Storage.prototype.removeItem = function (k) { var r = rI.apply(this, arguments); if (this === ls && ok(k)) { del[k] = 1; delete set[k]; later(); } return r; };
  // first visit after this update: send what this browser already has, once
  try { if (!ls.getItem('aos.__ds1')) { for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (ok(k)) set[k] = ls.getItem(k); } sI.call(ls, 'aos.__ds1', '1'); later(); } } catch (e) {}
})();
