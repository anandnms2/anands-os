/* Pair a phone: the owner makes a short-lived, single-use link (shown as a QR code). Opening it on the phone and
 * confirming signs that phone in as its own named device, which can be signed out any time in the Security center. */
import crypto from 'node:crypto';
const T = new Map(); const TTL = 5 * 60e3;
const sweep = () => { const n = Date.now(); for (const [k, v] of T) if (v.exp < n) T.delete(k); };
export function createPair(label, by) {
  sweep(); if (T.size >= 10) { const o = [...T.keys()][0]; T.delete(o); }
  const tok = crypto.randomBytes(24).toString('base64url'); T.set(tok, { exp: Date.now() + TTL, label: String(label || 'Phone').replace(/[<>\n\r]/g, '').trim().slice(0, 40) || 'Phone', by }); return { tok, expires: Date.now() + TTL };
}
export const peekPair = (tok) => { sweep(); const v = T.get(tok); return v ? { label: v.label } : null; };
export function redeemPair(tok) { sweep(); const v = T.get(tok); if (!v) return null; T.delete(tok); return v; }
export const pendingPairs = () => { sweep(); return T.size; };
