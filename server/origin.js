/* The public address of this server, used in links that go out by email. It comes from Settings (or PUBLIC_URL), and failing that from the
 * address you last signed in at. It is never taken from a visitor's own request, so a guest cannot point emailed links elsewhere. */
import fs from 'node:fs';
import path from 'node:path';
import { DATA, effective } from './config.js';
import { isHttps } from './util.js';

const FILE = path.join(DATA, 'public-origin');
let seen = ''; try { seen = fs.readFileSync(FILE, 'utf8').trim(); } catch {}
export function noteOrigin(req) {
  if (effective().public.url) return;
  const host = String(req.headers.host || ''); if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) return;
  const o = `${isHttps(req) ? 'https' : 'http'}://${host}`;
  if (o !== seen) { seen = o; try { fs.writeFileSync(FILE, o + '\n'); } catch {} }
}
export function publicOrigin() {
  const u = effective().public.url || seen; if (!u) return null;
  try { return new URL(u).origin; } catch { return null; }
}
