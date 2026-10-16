/* Money, Subscriptions and Investments as pages inside Anands OS (the app itself lives in /tools/money.html). */
(function () {
  'use strict';
  var TAB = { money: 'overview', subs: 'subs', invest: 'invest' }, TITLE = { money: 'Money', subs: 'Subscriptions', invest: 'Investments' };
  Object.keys(TAB).forEach(function (v) {
    window.AOSViews[v] = function () {
      return '<div class="wrap appwin" style="display:flex;flex-direction:column;height:100%;max-width:none;padding:0"><iframe class="appframe" title="' + TITLE[v] + '" src="/tools/money.html?embed=1#' + TAB[v] + '" allow="clipboard-write"></iframe></div>';
    };
  });
})();
