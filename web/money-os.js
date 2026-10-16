/* Money, Subscriptions and Investments as pages inside Anands OS (the app itself lives in /tools/money.html). */
(function () {
  'use strict';
  var TAB = { money: 'overview', subs: 'subs', invest: 'invest' }, TITLE = { money: 'Money', subs: 'Subscriptions', invest: 'Investments' };
  Object.keys(TAB).forEach(function (v) {
    window.AOSViews[v] = function () {
      return '<div class="wrap appwin" style="display:flex;flex-direction:column;height:100%;max-width:none;padding:0"><iframe class="appframe" title="' + TITLE[v] + '" src="/tools/money.html?embed=1#' + TAB[v] + '" allow="clipboard-write"></iframe></div>';
    };
  });
  var PAGES = { editor: ['Editor', 'editor.html'], player: ['Player', 'player.html'], recorder: ['Recorder', 'recorder.html'], terminal: ['Terminal', 'terminal.html'], belong: ['Belongings', 'home.html#belong'], house: ['Household', 'home.html#house'] };
  Object.keys(PAGES).forEach(function (v) {
    window.AOSViews[v] = function () {
      return '<div class="wrap appwin" style="display:flex;flex-direction:column;height:100%;max-width:none;padding:0"><iframe class="appframe" title="' + PAGES[v][0] + '" src="/tools/' + PAGES[v][1] + (PAGES[v][1].indexOf('#') < 0 ? '?embed=1' : '') + '" allow="clipboard-read; clipboard-write; fullscreen; microphone; camera; display-capture; autoplay"></iframe></div>';
    };
  });
})();
