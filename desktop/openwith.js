/* "Open with" from the computer: the file is placed where the Suite apps can reach it, and every save is written back to the original file.
 * One stable copy per original (so reopening does not pile up copies). Write-back waits until the copy has stopped changing. */
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');

function create(dataDir, onError) {
  const dir = path.join(dataDir, 'fs', 'Opened from PC'), mapFile = path.join(dataDir, 'open-with.json');
  let map = {}; try { map = JSON.parse(fs.readFileSync(mapFile, 'utf8')) || {}; } catch {}
  const save = () => { try { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(mapFile, JSON.stringify(map)); } catch {} };
  const seen = {}, warned = {};
  function open(src) {
    src = path.resolve(src); const name = path.basename(src), key = crypto.createHash('sha1').update(src).digest('hex').slice(0, 8);
    const copy = path.join(dir, key, name), e = map[copy]; fs.mkdirSync(path.dirname(copy), { recursive: true });
    const so = fs.statSync(src); let sc = null; try { sc = fs.statSync(copy); } catch {}
    const copyEdited = sc && e && (Math.abs(sc.mtimeMs - e.m) > 1 || sc.size !== e.s);
    if (!sc || (!copyEdited && (so.mtimeMs > e.m + 1 || so.size !== e.s))) { fs.copyFileSync(src, copy); const t = so.mtime; fs.utimesSync(copy, t, t); sc = fs.statSync(copy); }
    map[copy] = { orig: src, m: sc.mtimeMs, s: sc.size }; save(); delete warned[copy];
    return '/Opened from PC/' + key + '/' + name;
  }
  function poll() {
    for (const copy of Object.keys(map)) {
      const e = map[copy]; let sc; try { sc = fs.statSync(copy); } catch { delete map[copy]; save(); continue; }
      if (Math.abs(sc.mtimeMs - e.m) <= 1 && sc.size === e.s) { delete seen[copy]; continue; }
      const sig = sc.mtimeMs + ':' + sc.size;
      if (seen[copy] !== sig) { seen[copy] = sig; continue; } // still changing: wait for the next check
      try {
        const tmp = e.orig + '.aos-' + process.pid + '.tmp'; fs.copyFileSync(copy, tmp); fs.renameSync(tmp, e.orig);
        e.m = sc.mtimeMs; e.s = sc.size; delete seen[copy]; save();
      } catch (err) { if (!warned[copy]) { warned[copy] = 1; if (onError) onError(e.orig, err); } }
    }
  }
  let timer = null;
  return { open, poll, start() { if (!timer) timer = setInterval(poll, 1500); }, stop() { clearInterval(timer); timer = null; }, map: () => map };
}
module.exports = { create };
