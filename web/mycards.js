/* My Cards (your own digital business cards) and contact sharing for scanned cards, inside the OS.
 * Mirrors Card Scan: themes, share link with QR, custom link, WhatsApp / email / SMS sharing, vCard, views and on/off. */
(function () {
  'use strict';
  var A = window.AOS; if (!A) return;
  var S = A.S, $ = A.$, esc = A.esc, api = A.api, toast = A.toast, modal = A.modal;
  var M = { list: null, loading: false, err: null, edit: null, cur: null };
  var THEMES = { classic: { accent: '#f68712', light: '#ffab4d', dark: true }, forest: { accent: '#4fa800', light: '#78c22e', dark: true }, midnight: { accent: '#3d8bfd', light: '#6fa8ff', dark: true }, daylight: { accent: '#c96900', light: '#f68712', dark: false } };
  var THEME_NAMES = [['classic', 'Classic'], ['forest', 'Forest'], ['midnight', 'Midnight'], ['daylight', 'Daylight']];
  var STYLES = [['banner-hero', 'Banner Hero'], ['split-header', 'Split Header'], ['minimal-list', 'Minimal List'], ['literal-card', 'Literal Card'], ['link-stack', 'Link Stack'], ['bento-grid', 'Bento Grid'], ['editorial', 'Editorial'], ['digital-id', 'Digital ID Badge'], ['compact-native', 'Compact Native'], ['wallet-pass', 'Wallet Pass'], ['glass', 'Glass'], ['neumorphic', 'Neumorphic'], ['full-bleed-photo', 'Full-Bleed Photo'], ['two-tone-split', 'Two-Tone Split'], ['dashboard', 'Dashboard'], ['holographic', 'Holographic'], ['brutalist', 'Brutalist'], ['polaroid', 'Polaroid'], ['aurora-mesh', 'Aurora Mesh'], ['duotone', 'Duotone'], ['chalkboard', 'Chalkboard'], ['report-cover', 'Report Cover'], ['deck-slide', 'Deck Slide'], ['fintech', 'Fintech'], ['press-kit', 'Press Kit'], ['woven-fabric', 'Woven Fabric'], ['bauhaus', 'Bauhaus'], ['vinyl', 'Vinyl'], ['topographic', 'Topographic Map']];
  var FONTS = [['system', 'System'], ['serif', 'Serif Editorial'], ['rounded', 'Rounded Friendly'], ['mono', 'Mono Technical']];
  var SHAPES = [['rounded', 'Rounded'], ['sharp', 'Sharp / Square'], ['pill', 'Pill']];
  var SOCIAL = [['linkedin', 'LinkedIn'], ['x', 'X / Twitter'], ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['github', 'GitHub'], ['youtube', 'YouTube'], ['other', 'Other']];
  var FIELDS = [['name', 'Name'], ['title', 'Title'], ['company', 'Company'], ['tagline', 'Tagline'], ['phone', 'Phone'], ['phone2', 'Phone 2'], ['email', 'Email'], ['email2', 'Email 2'], ['whatsapp', 'WhatsApp'], ['whatsapp2', 'WhatsApp 2'], ['website', 'Website'], ['address', 'Address']];
  var FONT_CSS = { system: 'inherit', serif: "Georgia,'Times New Roman',serif", rounded: "'Trebuchet MS',sans-serif", mono: "'Courier New',monospace" };
  var RADIUS = { rounded: 18, sharp: 4, pill: 22 };

  function base() { return (((S.settings || {}).cards || {}).url || '').replace(/\/+$/, ''); }
  function shareUrl(c) { return c.share_token ? base() + '/m/' + c.share_token : ''; }
  function box(w) { var b = $('#modal .card'); if (b) b.style.width = 'min(' + (w || 560) + 'px,100%)'; }
  function head(t, back) { return '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:14px"><h2 style="font-size:22px">' + t + '</h2><button class="btn sm" data-act="mx2">Close</button></div>'; }
  function msg(t, bad) { var n = $('#mm'); if (n) { n.style.color = bad ? 'var(--bad)' : 'var(--muted)'; n.textContent = t; } }
  function find(id) { return (M.list || []).filter(function (c) { return c.id === id; })[0]; }
  function qr(text) {
    if (!window.qrcode) return '';
    try { var q = window.qrcode(0, 'L'); q.addData(String(text)); q.make(); return q.createDataURL(6, 3); } catch (e) { return ''; }
  }
  function copy(text) { try { navigator.clipboard.writeText(text).then(function () { toast('Copied'); }, function () { toast('Select the text and press Ctrl+C'); }); } catch (e) { toast('Select the text and press Ctrl+C'); } }
  function colors(c) {
    var t = THEMES[c.theme] || THEMES.classic, dk = t.dark;
    return { accent: c.custom_accent || t.accent, bg: c.custom_bg || (dk ? '#131110' : '#faf8f5'), surface: c.custom_surface || (dk ? '#1c1917' : '#ffffff'), text: dk ? '#f5f2ee' : '#241f1a', dim: dk ? '#a39c93' : '#8a8177', line: dk ? '#3a332c' : '#e4ded3' };
  }
  function wa(n) { return 'https://wa.me/' + String(n || '').replace(/\D/g, ''); }
  function web(u) { return /^https?:\/\//i.test(u) ? u : 'https://' + u; }

  /* ---------- vCard and contact text (same output as Card Scan) ---------- */
  function vesc(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
  function vcard(c) {
    var L = ['BEGIN:VCARD', 'VERSION:3.0'], name = c.name || '', parts = name.trim().split(/\s+/), last = parts.length > 1 ? parts[parts.length - 1] : '', first = parts.length > 1 ? parts.slice(0, -1).join(' ') : (parts[0] || '');
    L.push('FN:' + vesc(name || c.company || 'Unknown'), 'N:' + vesc(last) + ';' + vesc(first) + ';;;');
    if (c.company) L.push('ORG:' + vesc(c.company)); var ttl = c.designation || c.title; if (ttl) L.push('TITLE:' + vesc(ttl));
    [c.phone, c.phone2, c.phone3].filter(Boolean).forEach(function (p) { L.push('TEL;TYPE=WORK,VOICE:' + vesc(p)); });
    [c.whatsapp, c.whatsapp2].filter(Boolean).forEach(function (w) { L.push('TEL;TYPE=CELL:' + vesc(w)); });
    [c.email, c.email2, c.email3].filter(Boolean).forEach(function (e) { L.push('EMAIL;TYPE=WORK:' + vesc(e)); });
    if (c.website) L.push('URL:' + vesc(web(c.website)));
    if (c.address) L.push('ADR;TYPE=WORK:;;' + vesc(c.address) + ';;;;');
    if (c.notes) L.push('NOTE:' + vesc(c.notes));
    L.push('END:VCARD'); return L.join('\r\n');
  }
  function summary(c) {
    var l = [c.name || c.company || 'Contact']; if (c.designation || c.title) l.push(c.designation || c.title); if (c.company && c.name) l.push(c.company);
    [c.phone, c.phone2, c.phone3].filter(Boolean).forEach(function (p) { l.push('Tel: ' + p); }); [c.whatsapp, c.whatsapp2].filter(Boolean).forEach(function (w) { l.push('WhatsApp: ' + w); });
    [c.email, c.email2, c.email3].filter(Boolean).forEach(function (e) { l.push('Email: ' + e); }); if (c.website) l.push('Web: ' + c.website); if (c.address) l.push('Address: ' + c.address);
    return l.join('\n');
  }
  function vfile(c) { return new File([vcard(c)], (c.name || c.company || 'contact').replace(/[^a-z0-9]+/gi, '-') + '.vcf', { type: 'text/vcard' }); }
  function saveVcf(c) { var f = vfile(c), u = URL.createObjectURL(f), a = document.createElement('a'); a.href = u; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }

  /* ---------- list ---------- */
  function load() {
    M.loading = true; M.err = null;
    return api('/api/my-cards').then(function (d) { M.list = d.cards || []; }).catch(function (e) { M.err = e.message; M.list = M.list || []; }).then(function () { M.loading = false; if (S.view === 'cards') A.redraw(); });
  }
  function avatar(c, n) { return c.photo ? '<img src="' + esc(c.photo) + '" alt="" style="width:' + n + 'px;height:' + n + 'px;border-radius:14px;object-fit:cover;flex:none">' : '<div style="width:' + n + 'px;height:' + n + 'px;border-radius:14px;flex:none;display:grid;place-items:center;font-weight:800;font-size:' + Math.round(n / 2.6) + 'px;background:var(--accent-soft);color:var(--accent-text)">' + esc((c.name || '?').charAt(0).toUpperCase()) + '</div>'; }
  function view() {
    var h = '<div class="toolbar"><button class="btn primary" data-mc="new">New card</button><span class="note">Your own digital business cards, with a link and QR code you can share.</span></div>';
    if (M.err) h += '<div class="banner"><i class="dot bad"></i><span>' + esc(M.err) + '</span></div>';
    if (!M.list) return h + '<p class="note">Loading your cards...</p>';
    if (!M.list.length) return h + '<div class="empty"><h2>No cards of your own yet</h2><p>Make one, share the link or QR code, and anyone can save your details.</p></div>';
    return h + '<div class="icards">' + M.list.map(function (c) {
      var st = c.share_token ? (c.active ? 'Link active' : 'Switched off') : 'Not shared yet';
      return '<div class="card" style="display:flex;gap:14px;align-items:flex-start">' + avatar(c, 56) + '<div style="flex:1;min-width:0"><b style="font-size:16px">' + esc(c.name || 'Untitled card') + '</b>' + (c.title ? '<div style="color:var(--accent-text);font-size:13px">' + esc(c.title) + '</div>' : '') + (c.company ? '<div class="note">' + esc(c.company) + '</div>' : '') +
        '<div class="note" style="margin-top:6px">' + (c.view_count || 0) + ' view' + (c.view_count === 1 ? '' : 's') + ' · ' + st + '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" data-mc="view" data-id="' + esc(c.id) + '">View</button><button class="btn sm" data-mc="edit" data-id="' + esc(c.id) + '">Edit</button><button class="btn sm primary" data-mc="share" data-id="' + esc(c.id) + '">Share</button><button class="btn sm danger" data-mc="del" data-id="' + esc(c.id) + '">Delete</button></div></div></div>';
    }).join('') + '</div>';
  }

  /* ---------- preview (themed card) ---------- */
  function previewHtml(c) {
    var k = colors(c), r = RADIUS[c.shape_style] || 18, font = FONT_CSS[c.font_style] || 'inherit', order = (c.field_order && c.field_order.length ? c.field_order : ['phone', 'email', 'whatsapp', 'website', 'address']);
    var logo = (k.bg === '#131110' || THEMES[c.theme || 'classic'].dark) ? (c.logo_dark || c.logo_light) : (c.logo_light || c.logo_dark);
    var row = function (ico, label, val, href) { return '<a ' + (href ? 'href="' + esc(href) + '" target="_blank" rel="noopener"' : '') + ' style="display:flex;gap:12px;align-items:center;padding:11px 14px;border-radius:' + Math.min(r, 14) + 'px;background:' + k.surface + ';border:1px solid ' + k.line + ';color:' + k.text + ';text-decoration:none;margin-bottom:8px"><span style="width:30px;text-align:center;color:' + k.accent + ';font-weight:700;font-size:12px;text-transform:uppercase">' + ico + '</span><span style="min-width:0;overflow-wrap:anywhere"><span style="display:block;font-size:11px;color:' + k.dim + '">' + label + '</span>' + esc(val) + '</span></a>'; };
    var rows = '';
    order.forEach(function (f) {
      if (f === 'phone') [c.phone, c.phone2].filter(Boolean).forEach(function (v) { rows += row('Tel', 'Phone', v, 'tel:' + v); });
      if (f === 'email') [c.email, c.email2].filter(Boolean).forEach(function (v) { rows += row('@', 'Email', v, 'mailto:' + v); });
      if (f === 'whatsapp') [c.whatsapp, c.whatsapp2].filter(Boolean).forEach(function (v) { rows += row('WA', 'WhatsApp', v, wa(v)); });
      if (f === 'website' && c.website) rows += row('Web', 'Website', c.website, web(c.website));
      if (f === 'address' && c.address) rows += row('Map', 'Address', c.address, 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.address));
    });
    (c.custom_fields || []).forEach(function (f) { rows += row('•', f.label, f.value, ''); });
    var soc = (c.social_links || []).map(function (s) { var n = (SOCIAL.filter(function (x) { return x[0] === s.type; })[0] || ['', 'Link'])[1]; return '<a href="' + esc(web(s.url)) + '" target="_blank" rel="noopener" style="padding:7px 13px;border-radius:999px;border:1px solid ' + k.line + ';background:' + k.surface + ';color:' + k.text + ';text-decoration:none;font-size:13px">' + esc(n) + '</a>'; }).join('');
    var show = (c.showcase_items || []).map(function (s) { return '<a href="' + esc(web(s.url)) + '" target="_blank" rel="noopener" style="display:block;padding:11px 14px;border-radius:' + Math.min(r, 14) + 'px;border:1px solid ' + k.line + ';background:' + k.surface + ';color:' + k.accent + ';text-decoration:none;margin-bottom:8px;font-weight:600">' + esc(s.title) + '</a>'; }).join('');
    return '<div style="background:' + k.bg + ';color:' + k.text + ';border-radius:' + (r + 2) + 'px;overflow:hidden;font-family:' + font + ';border:1px solid ' + k.line + '">' +
      '<div style="padding:26px 20px 18px;text-align:center;background:linear-gradient(160deg,' + k.accent + '33,transparent 70%)">' + (logo ? '<img src="' + esc(logo) + '" alt="" style="max-height:34px;max-width:140px;margin-bottom:12px;display:block;margin-inline:auto">' : '') +
      (c.photo ? '<img src="' + esc(c.photo) + '" alt="" style="width:92px;height:92px;object-fit:cover;border-radius:' + (c.shape_style === 'sharp' ? '10px' : '50%') + ';border:3px solid ' + k.accent + ';display:block;margin:0 auto 12px">' : '') +
      '<div style="font-size:24px;font-weight:800">' + esc(c.name || '') + '</div>' + (c.title ? '<div style="color:' + k.accent + ';font-weight:600;margin-top:2px">' + esc(c.title) + '</div>' : '') + (c.company ? '<div style="color:' + k.dim + ';margin-top:2px">' + esc(c.company) + '</div>' : '') + (c.tagline ? '<div style="color:' + k.dim + ';font-size:13.5px;margin-top:8px;font-style:italic">' + esc(c.tagline) + '</div>' : '') + '</div>' +
      '<div style="padding:6px 16px 16px">' + rows + (soc ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px">' + soc + '</div>' : '') + show + '</div></div>';
  }
  function viewCard(id) {
    var c = find(id); if (!c) return; M.cur = id;
    modal(head(esc(c.name || 'My card')) + previewHtml(c) + '<p class="note" style="margin:10px 0 0">Layout style: <b>' + esc((STYLES.filter(function (s) { return s[0] === c.style; })[0] || STYLES[0])[1]) + '</b>. The shared page uses that style; this preview shows your colours, photo, fields and links.</p>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px"><button class="btn" data-mc="vcf" data-id="' + esc(id) + '">Save contact</button><button class="btn" data-mc="edit" data-id="' + esc(id) + '">Edit</button><button class="btn primary" data-mc="share" data-id="' + esc(id) + '">Share</button></div>'); box(520);
  }

  /* ---------- share ---------- */
  function shareCard(id) {
    var c = find(id); if (!c) return; M.cur = id; var u = shareUrl(c);
    var h = head('Share this card') + '<p class="note" style="margin:0 0 12px">' + esc(c.name || '') + (c.company ? ' · ' + esc(c.company) : '') + '</p>';
    if (!u) h += '<p class="note">This card has no link yet. Make one to get a permanent page and QR code.</p><div id="mm" class="note" role="status"></div><button class="btn primary" data-mc="mklink" data-id="' + esc(id) + '">Create link</button>';
    else {
      var img = qr(u), text = (c.name || 'My card') + ': ' + u;
      h += (img ? '<img src="' + img + '" alt="QR code for the card link" style="width:190px;height:190px;display:block;margin:0 auto 12px;border-radius:10px;background:#fff;image-rendering:pixelated">' : '') +
        '<div style="display:flex;gap:8px;margin-bottom:12px"><input class="input" id="mu" readonly value="' + esc(u) + '" aria-label="Card link"><button class="btn" data-mc="copyurl">Copy</button></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(text) + '">WhatsApp</a><a class="btn" href="mailto:?subject=' + encodeURIComponent((c.name || 'My card')) + '&body=' + encodeURIComponent(text) + '">Email</a><a class="btn" href="sms:' + (/iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?') + 'body=' + encodeURIComponent(text) + '">SMS</a><a class="btn" target="_blank" rel="noopener" href="' + esc(u) + '">Open page</a>' + (navigator.share ? '<button class="btn" data-mc="nshare" data-id="' + esc(id) + '">More...</button>' : '') + '</div>' +
        '<div class="ikv" style="margin-bottom:14px"><span>Views</span><b>' + (c.view_count || 0) + '</b><span>Status</span><b>' + (c.active ? 'Active' : 'Switched off, the link does not work') + '</b></div>' +
        '<div class="field"><label for="ms">Custom link (3-32 lowercase letters, numbers, hyphens)</label><div style="display:flex;gap:8px"><input class="input" id="ms" placeholder="anand" autocomplete="off"><button class="btn" data-mc="slug" data-id="' + esc(id) + '">Save</button></div></div><div id="mm" class="note" role="status"></div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px"><button class="btn' + (c.active ? ' danger' : '') + '" data-mc="toggle" data-id="' + esc(id) + '">' + (c.active ? 'Switch link off' : 'Switch link on') + '</button></div>';
    }
    modal(h); box(440);
  }
  function setCard(c) { var i = (M.list || []).findIndex(function (x) { return x.id === c.id; }); if (i >= 0) M.list[i] = Object.assign({}, M.list[i], c); else (M.list = M.list || []).push(c); }

  /* ---------- editor ---------- */
  function readImg(file, max) {
    return new Promise(function (res, rej) { var fr = new FileReader(); fr.onerror = function () { rej(new Error('Could not read that file')); }; fr.onload = function () { var im = new Image(); im.onerror = function () { rej(new Error('That file is not an image')); }; im.onload = function () { var r = Math.min(1, max / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * r); cv.height = Math.round(im.height * r); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); res(cv.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85)); }; im.src = fr.result; }; fr.readAsDataURL(file); });
  }
  function keep() {
    var E = M.edit; if (!E) return; FIELDS.forEach(function (f) { var e = $('#me_' + f[0]); if (e) E.f[f[0]] = e.value; });
    ['style', 'font', 'shape'].forEach(function (k) { var e = $('#me_' + k); if (e) E[k] = e.value; });
    ['accent', 'bg', 'surface'].forEach(function (k) { var e = $('#me_c' + k); if (e && e.getAttribute('data-set') === '1') E['c' + k] = e.value; });
    E.social = E.social.map(function (s, i) { var t = $('#ms_t' + i), u = $('#ms_u' + i); return { type: t ? t.value : s.type, url: u ? u.value : s.url }; });
    E.show = E.show.map(function (s, i) { var t = $('#mw_t' + i), u = $('#mw_u' + i); return Object.assign({}, s, { title: t ? t.value : s.title, url: u ? u.value : s.url }); });
    E.custom = E.custom.map(function (s, i) { var l = $('#mf_l' + i), v = $('#mf_v' + i); return { label: l ? l.value : s.label, value: v ? v.value : s.value }; });
  }
  function edit(id) {
    var c = id ? find(id) : null;
    M.edit = { id: id || null, f: {}, theme: c ? c.theme || 'classic' : 'classic', style: c ? c.style || 'banner-hero' : 'banner-hero', font: c ? c.font_style || 'system' : 'system', shape: c ? c.shape_style || 'rounded' : 'rounded', caccent: c ? c.custom_accent : null, cbg: c ? c.custom_bg : null, csurface: c ? c.custom_surface : null, photo: c ? c.photo : undefined, social: c ? (c.social_links || []).slice() : [], show: c ? (c.showcase_items || []).slice() : [], custom: c ? (c.custom_fields || []).slice() : [], order: c ? c.field_order : null, logoD: c ? c.logo_dark : undefined, logoL: c ? c.logo_light : undefined };
    FIELDS.forEach(function (f) { M.edit.f[f[0]] = c ? c[f[0]] || '' : ''; }); drawEdit();
  }
  function opts(list, cur) { return list.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + o[1] + '</option>'; }).join(''); }
  function drawEdit() {
    var E = M.edit, t = THEMES[E.theme] || THEMES.classic;
    var colr = function (k, label, v, def) { return '<div class="field" style="flex:1;min-width:120px"><label for="me_c' + k + '">' + label + '</label><div style="display:flex;gap:6px"><input type="color" id="me_c' + k + '" data-set="' + (v ? 1 : 0) + '" value="' + esc(v || def) + '" style="height:40px;width:100%"><button class="btn sm" data-mc="clr" data-k="' + k + '" type="button">Reset</button></div></div>'; };
    var h = head(E.id ? 'Edit card' : 'New card') +
      '<div class="field"><label>Photo</label><div style="display:flex;gap:10px;align-items:center">' + (E.photo ? '<img src="' + esc(E.photo) + '" alt="" style="width:56px;height:56px;border-radius:12px;object-fit:cover">' : '') + '<label class="btn sm" style="cursor:pointer">Choose photo<input type="file" accept="image/*" data-mf="photo" hidden></label>' + (E.photo ? '<button class="btn sm" data-mc="rmphoto" type="button">Remove</button>' : '') + '</div></div>' +
      '<div class="icform">' + FIELDS.map(function (f) { return '<div class="field"><label for="me_' + f[0] + '">' + f[1] + (f[0] === 'name' ? ' *' : '') + '</label><input class="input" id="me_' + f[0] + '" value="' + esc(E.f[f[0]]) + '" autocomplete="off"></div>'; }).join('') + '</div>' +
      '<h3 class="ih">Look</h3><div class="chips" style="margin-bottom:12px">' + THEME_NAMES.map(function (x) { return '<button class="chip" type="button" data-mc="theme" data-t="' + x[0] + '" aria-pressed="' + (E.theme === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="icform"><div class="field"><label for="me_style">Layout style</label><select class="input" id="me_style">' + opts(STYLES, E.style) + '</select></div><div class="field"><label for="me_font">Font</label><select class="input" id="me_font">' + opts(FONTS, E.font) + '</select></div><div class="field"><label for="me_shape">Shape</label><select class="input" id="me_shape">' + opts(SHAPES, E.shape) + '</select></div></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' + colr('accent', 'Accent', E.caccent, t.accent) + colr('bg', 'Background', E.cbg, t.dark ? '#131110' : '#faf8f5') + colr('surface', 'Surface', E.csurface, t.dark ? '#1c1917' : '#ffffff') + '</div>' +
      '<h3 class="ih">Social links</h3>' + E.social.map(function (s, i) { return '<div style="display:flex;gap:8px;margin-bottom:8px"><select class="input" id="ms_t' + i + '" style="flex:0 0 130px">' + opts(SOCIAL, s.type) + '</select><input class="input" id="ms_u' + i + '" value="' + esc(s.url) + '" placeholder="https://..."><button class="btn sm" type="button" data-mc="rm" data-w="social" data-i="' + i + '">Remove</button></div>'; }).join('') + '<button class="btn sm" type="button" data-mc="add" data-w="social">Add social link</button>' +
      '<h3 class="ih">Showcase (optional)</h3>' + E.show.map(function (s, i) { return '<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap"><input class="input" id="mw_t' + i + '" value="' + esc(s.title) + '" placeholder="Title" style="flex:1;min-width:120px"><input class="input" id="mw_u' + i + '" value="' + esc(s.url) + '" placeholder="https://..." style="flex:2;min-width:160px"><button class="btn sm" type="button" data-mc="rm" data-w="show" data-i="' + i + '">Remove</button></div>'; }).join('') + '<button class="btn sm" type="button" data-mc="add" data-w="show">Add showcase item</button>' +
      '<h3 class="ih">Custom fields (optional)</h3>' + E.custom.map(function (s, i) { return '<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap"><input class="input" id="mf_l' + i + '" value="' + esc(s.label) + '" placeholder="Label (Skype)" style="flex:1;min-width:110px"><input class="input" id="mf_v' + i + '" value="' + esc(s.value) + '" placeholder="Value" style="flex:2;min-width:160px"><button class="btn sm" type="button" data-mc="rm" data-w="custom" data-i="' + i + '">Remove</button></div>'; }).join('') + '<button class="btn sm" type="button" data-mc="add" data-w="custom">Add custom field</button>' +
      '<div id="mm" class="note" role="status" style="margin-top:12px"></div><div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px"><button class="btn" data-act="mx2">Cancel</button><button class="btn primary" data-mc="save">Save card</button></div>';
    modal(h); box(640);
  }
  function save() {
    keep(); var E = M.edit; if (!(E.f.name || '').trim()) return msg('Give the card a name.', true);
    var b = {}; FIELDS.forEach(function (f) { b[f[0]] = (E.f[f[0]] || '').trim(); });
    b.theme = E.theme; b.style = E.style; b.fontStyle = E.font; b.shapeStyle = E.shape; b.customAccent = E.caccent || ''; b.customBg = E.cbg || ''; b.customSurface = E.csurface || '';
    b.socialLinks = E.social.filter(function (s) { return s.url.trim(); }); b.showcaseItems = E.show.filter(function (s) { return s.title.trim() && s.url.trim(); }); b.customFields = E.custom.filter(function (s) { return s.label.trim() && s.value.trim(); });
    if (E.photo !== undefined) b.photo = E.photo;
    msg('Saving...');
    api(E.id ? '/api/my-cards/' + E.id : '/api/my-cards', { method: E.id ? 'PATCH' : 'POST', json: b }).then(function (d) { if (d.card) setCard(d.card); M.edit = null; modal(); toast('Card saved'); if (S.view === 'cards') A.redraw(); return load(); }).catch(function (e) { msg(e.message, true); });
  }

  /* ---------- contact sharing for scanned cards ---------- */
  function contactShare(c) {
    M.contact = c; var text = summary(c), q = vcard(c), img = qr(q.length < 1000 ? q : text), phone = c.phone || '', wnum = c.whatsapp || '';
    modal(head('Share ' + esc(c.name || c.company || 'contact')) +
      (img ? '<img src="' + img + '" alt="QR code with the contact details" style="width:190px;height:190px;display:block;margin:0 auto 6px;border-radius:10px;background:#fff;image-rendering:pixelated"><p class="note" style="text-align:center;margin:0 0 14px">Scan with a phone camera to add this contact.</p>' : '') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(text) + '">Send on WhatsApp</a><a class="btn" href="mailto:?subject=' + encodeURIComponent('Contact: ' + (c.name || c.company || '')) + '&body=' + encodeURIComponent(text) + '">Email</a><a class="btn" href="sms:' + (/iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?') + 'body=' + encodeURIComponent(text) + '">SMS</a><button class="btn" data-mc="cvcf">Save as contact (.vcf)</button><button class="btn" data-mc="ccopy">Copy details</button>' + (window.File && navigator.canShare && (function () { try { return navigator.canShare({ files: [vfile(c)] }); } catch (e) { return false; } })() ? '<button class="btn" data-mc="cnative">Share contact file</button>' : '') + '</div>' +
      (phone || wnum || c.email ? '<h3 class="ih">Reach out</h3><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">' + (phone ? '<a class="btn" href="tel:' + esc(phone) + '">Call</a>' : '') + (wnum ? '<a class="btn" target="_blank" rel="noopener" href="' + esc(wa(wnum)) + '">WhatsApp chat</a>' : '') + (c.email ? '<a class="btn" href="mailto:' + esc(c.email) + '">Email them</a>' : '') + '</div>' : '') +
      '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap"><button class="btn" data-mc="cback">Back to card</button><button class="btn primary" data-ca="share" data-id="' + esc(c.id) + '">Create a secure link</button></div>'); box(480);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-mc]'); if (!el) return; var a = el.getAttribute('data-mc'), id = el.getAttribute('data-id');
    if (a === 'new') return void edit(null); if (a === 'view') return void viewCard(id); if (a === 'edit') return void edit(id); if (a === 'share') return void shareCard(id);
    if (a === 'del') { var c = find(id); return void modal(head('Delete this card?') + '<p class="note" style="margin:0 0 16px">' + esc(c ? c.name : '') + ' and its link are removed from Card Scan. This cannot be undone.</p><div id="mm" class="note" role="status"></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" data-act="mx2">Keep it</button><button class="btn danger" data-mc="delyes" data-id="' + esc(id) + '">Delete</button></div>'); }
    if (a === 'delyes') return void api('/api/my-cards/' + id, { method: 'DELETE' }).then(function () { M.list = M.list.filter(function (x) { return x.id !== id; }); modal(); toast('Card deleted'); A.redraw(); }).catch(function (e) { msg(e.message, true); });
    if (a === 'vcf') { var cc = find(id); if (cc) saveVcf(cc); return; }
    if (a === 'mklink') { msg('Creating...'); return void api('/api/my-cards/' + id + '/share', { method: 'POST', json: {} }).then(function (d) { var c2 = find(id); c2.share_token = d.shareToken; c2.active = true; shareCard(id); A.redraw(); }).catch(function (e) { msg(e.message, true); }); }
    if (a === 'copyurl') { var u = $('#mu'); if (u) { u.select(); copy(u.value); } return; }
    if (a === 'nshare') { var c3 = find(id); return void navigator.share({ title: c3.name || 'My card', url: shareUrl(c3) }).catch(function () {}); }
    if (a === 'slug') { var sl = ($('#ms').value || '').trim().toLowerCase(); if (!sl) return msg('Type the link you want.', true); msg('Saving...'); return void api('/api/my-cards/' + id + '/share', { method: 'PATCH', json: { customSlug: sl } }).then(function (d) { find(id).share_token = d.shareToken; toast('Custom link set'); shareCard(id); }).catch(function (e) { msg(e.message, true); }); }
    if (a === 'toggle') { var c4 = find(id); return void api('/api/my-cards/' + id, { method: 'PATCH', json: { active: !c4.active } }).then(function (d) { c4.active = d.card ? d.card.active : !c4.active; toast(c4.active ? 'Link is on' : 'Link is off'); shareCard(id); A.redraw(); }).catch(function (e) { msg(e.message, true); }); }
    if (a === 'theme') { keep(); M.edit.theme = el.getAttribute('data-t'); return void drawEdit(); }
    if (a === 'clr') { keep(); M.edit['c' + el.getAttribute('data-k')] = null; return void drawEdit(); }
    if (a === 'rmphoto') { keep(); M.edit.photo = null; return void drawEdit(); }
    if (a === 'add') { keep(); var w = el.getAttribute('data-w'); if (w === 'social') M.edit.social.push({ type: 'linkedin', url: '' }); if (w === 'show') M.edit.show.push({ title: '', url: '' }); if (w === 'custom') M.edit.custom.push({ label: '', value: '' }); return void drawEdit(); }
    if (a === 'rm') { keep(); var w2 = el.getAttribute('data-w'), i = Number(el.getAttribute('data-i')); M.edit[w2].splice(i, 1); return void drawEdit(); }
    if (a === 'save') return void save();
    if (a === 'cvcf') return void saveVcf(M.contact); if (a === 'ccopy') return void copy(summary(M.contact));
    if (a === 'cnative') return void navigator.share({ files: [vfile(M.contact)], title: M.contact.name || 'Contact' }).catch(function () {});
    if (a === 'cback') { modal(); if (window.AOSInt) window.AOSInt.reopen(M.contact.id); return; }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (t.getAttribute && t.getAttribute('data-mf') === 'photo' && t.files && t.files[0]) { keep(); readImg(t.files[0], 480).then(function (d) { M.edit.photo = d; drawEdit(); }).catch(function (e) { msg(e.message, true); }); }
    if (t.id && /^me_c(accent|bg|surface)$/.test(t.id)) t.setAttribute('data-set', '1');
  });
  window.AOSMine = { view: view, load: load, onGo: function () { if (!M.list && !M.loading) load(); }, contactShare: contactShare, state: M };
})();
