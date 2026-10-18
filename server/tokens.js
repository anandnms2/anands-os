/* Access tokens for phone shortcuts and other apps: each one is limited to Money or Household, shows up as a device
 * in the Security center, and stops working the moment it is signed out there. Only a hash is kept. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA } from './config.js';

const F = path.join(DATA, 'tokens.json'); let T; try { T = JSON.parse(fs.readFileSync(F, 'utf8')); } catch { T = {}; }
const save = () => { try { fs.mkdirSync(DATA, { recursive: true }); const t = F + '.tmp'; fs.writeFileSync(t, JSON.stringify(T), { mode: 0o600 }); fs.renameSync(t, F); } catch {} };
const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');
export const SCOPES = { money: ['/api/money'], house: ['/api/house'], both: ['/api/money', '/api/house'] };
export function addToken(sid, name, scope) { const tok = 'aos_' + crypto.randomBytes(24).toString('base64url'); T[hash(tok)] = { sid, name, scope, created: Date.now() }; save(); return tok; }
export function lookup(tok) { const r = T[hash(String(tok))]; return r || null; }
export function allowsPath(r, p) { return (SCOPES[r.scope] || []).some((x) => p === x || p.startsWith(x + '/')); }
export function forgetSid(sid) { let ch = false; for (const k of Object.keys(T)) if (T[k].sid === sid) { delete T[k]; ch = true; } if (ch) save(); }
