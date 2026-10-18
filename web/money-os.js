/* Native Anands apps (Money, Subscriptions, Investments, Belongings, Household, Editor, Player, Recorder, Terminal) as pages inside
 * the OS. Each page is a tool in /tools; the bar on top offers the same "New tab" as the Suite apps. */
(function () {
  'use strict';
  var PAGES = {
    money: ['Money', 'money.html#overview'], subs: ['Subscriptions', 'money.html#subs'], invest: ['Investments', 'money.html#invest'],
    belong: ['Belongings', 'home.html#belong'], paperless: ['Paperless', 'paperless.html'], bookmarks: ['Links', 'bookmarks.html'], house: ['Household', 'home.html#house'],
    editor: ['Editor', 'editor.html'], player: ['Player', 'player.html'], recorder: ['Recorder', 'recorder.html'], terminal: ['Terminal', 'terminal.html']
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  Object.keys(PAGES).forEach(function (v) {
    var p = PAGES[v], url = '/tools/' + p[1], src = url + (url.indexOf('#') < 0 ? '?embed=1' : '');
    window.AOSViews[v] = function () {
      return '<div class="wrap appwin" style="display:flex;flex-direction:column;height:100%;max-width:none"><div class="winbar"><button class="btn sm" data-act="nav" data-v="apps">Suite</button><img src="/oicons/' + v + '.svg" alt=""><b style="font-family:var(--display);font-size:20px;font-weight:500">' + esc(p[0]) + '</b><span style="flex:1"></span><span class="pill ok" title="Runs on your own server"><i class="dot"></i>Local mode</span><a class="btn sm" href="' + url + '" target="_blank" rel="noopener">New tab</a></div>' +
        '<iframe class="appframe" title="' + esc(p[0]) + '" src="' + src + '" allow="clipboard-read; clipboard-write; fullscreen; microphone; camera; display-capture; autoplay"></iframe></div>';
    };
  });
})();
