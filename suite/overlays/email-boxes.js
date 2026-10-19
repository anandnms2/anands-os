/* Email app: Gmail-style folders (Promotions, Social, Updates, Forums, your labels, All Mail) next to Inbox/Archive/Trash.
 * Runs before the app starts; the app's bundle is patched at build time to read window.__aosBoxes/__aosDirs/__aosActs. */
(function () {
  window.__aosBoxes = { main: [], labels: [] }; window.__aosDirs = {}; window.__aosActs = {};
  try {
    var x = new XMLHttpRequest(); x.open('GET', '/api/mailboxes/boxes', false); x.withCredentials = true; x.setRequestHeader('x-aos', '1'); x.send();
    if (x.status === 200) { var b = JSON.parse(x.responseText); window.__aosBoxes = { main: b.main || [], labels: b.labels || [] }; window.__aosDirs = b.dirs || {}; window.__aosActs = b.acts || {}; }
  } catch (e) {}
})();
