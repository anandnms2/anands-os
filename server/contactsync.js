/* Cards and Contacts share one database. Suite Contacts keeps each contact under the key "contact:<id>" in the OS key-value store.
 * For the owner, those keys are answered from Card Scan instead: every card is a contact, and saving or deleting a contact in the
 * Contacts app saves or deletes the card. Details that Card Scan has no field for (nickname, birthday, favourite, photo, extra phones,
 * emails, links and addresses, the structured address) live in a small side record "cs-ov:<cardId>" beside the contacts, so nothing is lost.
 * Contacts that already existed in the Contacts app before this was switched on stay where they are and keep working. */
import fs from 'node:fs';
import path from 'node:path';
import { DATA, effective } from './config.js';
import { cs } from './cardscan.js';

const MAP = path.join(DATA, 'contacts-map.json');
let map = {}; try { map = JSON.parse(fs.readFileSync(MAP, 'utf8')) || {}; } catch {}
const saveMap = () => { try { const t = MAP + '.tmp'; fs.writeFileSync(t, JSON.stringify(map), { mode: 0o600 }); fs.renameSync(t, MAP); } catch {} };
const rev = () => Object.fromEntries(Object.entries(map).map(([a, b]) => [b, a]));

export function enabled() { const c = effective().cards; return !!(c.url && c.user && c.pass && c.contacts !== false); }

const str = (v) => (v == null ? '' : String(v));
const UUID = /^[0-9a-f-]{36}$/i;
const cardIdOf = (id) => (String(id).startsWith('cs-') && UUID.test(String(id).slice(3)) ? String(id).slice(3) : map[id] || '');
const split = (n) => { n = str(n).trim().replace(/\s+/g, ' '); const i = n.lastIndexOf(' '); return i < 0 ? [n, ''] : [n.slice(0, i), n.slice(i + 1)]; };
const addrLine = (a) => [a.street, a.street2, a.poBox, [a.city, a.state, a.postalCode].filter(Boolean).join(' '), a.country].map((x) => str(x).trim()).filter(Boolean).join(', ');

/* ---- cards, cached for a short while ---- */
let cache = null;
export const invalidate = () => { cache = null; };
async function loadCards() {
  if (cache && Date.now() - cache.t < 45000) return cache.d;
  const out = [], seen = new Set(), LIM = 200;
  for (let off = 0; off < 5000; off += LIM) {
    const d = await cs('/api/cards?limit=' + LIM + '&offset=' + off); const rows = d.cards || []; let fresh = 0;
    for (const c of rows) if (c && c.id && !seen.has(c.id)) { seen.add(c.id); out.push(c); fresh++; }
    if (rows.length < LIM || !fresh) break;
  }
  cache = { t: Date.now(), d: out }; return out;
}

function toContact(c, ov, id) {
  ov = ov || {}; const x = ov.extra || {}, [fn, ln] = split(c.name);
  const phones = [[c.phone, 'Work'], [c.phone2, 'Mobile'], [c.phone3, 'Other']].filter((p) => p[0]).map((p) => ({ label: p[1], value: str(p[0]) }));
  if (c.whatsapp) phones.push({ label: 'WhatsApp', value: str(c.whatsapp) });
  const emails = [c.email, c.email2, c.email3].filter(Boolean).map((v) => ({ label: 'Work', value: str(v) }));
  const urls = c.website ? [{ label: 'Website', value: str(c.website) }] : [];
  let addresses = [];
  if (c.address) { const a = ov.addr0; addresses = [a && addrLine(a) === str(c.address) ? a : { label: 'Work', country: '', street: str(c.address), street2: '', city: '', state: '', postalCode: '', poBox: '' }]; }
  const t = (v) => { const n = Date.parse(v); return Number.isFinite(n) ? n : Date.now(); };
  return {
    id, firstName: fn, lastName: ln, nickname: ov.nickname || '', company: str(c.company), jobTitle: str(c.designation),
    emails: emails.concat(x.emails || []), phones: phones.concat(x.phones || []), urls: urls.concat(x.urls || []), addresses: addresses.concat(x.addresses || []),
    birthday: ov.birthday || '', notes: str(c.notes), tags: Array.isArray(c.tags) ? c.tags : [], photo: ov.photo || '', favorite: !!ov.favorite,
    createdAt: t(c.created_at), updatedAt: t(c.updated_at || c.created_at)
  };
}
function fromContact(ct, rowHadNotes) {
  const ph = (ct.phones || []).filter((p) => p && p.value), wa = ph.find((p) => /^whats ?app$/i.test(p.label || ''));
  const plain = ph.filter((p) => p !== wa), em = (ct.emails || []).filter((e) => e && e.value), ur = (ct.urls || []).filter((u) => u && u.value), ad = (ct.addresses || []);
  const name = (str(ct.firstName) + ' ' + str(ct.lastName)).trim() || str(ct.nickname) || str(ct.company);
  const card = {
    name, designation: str(ct.jobTitle), company: str(ct.company), phone: str(plain[0]?.value), phone2: str(plain[1]?.value), phone3: str(plain[2]?.value),
    email: str(em[0]?.value), email2: str(em[1]?.value), email3: str(em[2]?.value), whatsapp: str(wa?.value), website: str(ur[0]?.value), address: ad[0] ? addrLine(ad[0]) : ''
  };
  if (rowHadNotes || str(ct.notes)) card.notes = str(ct.notes);
  if (Array.isArray(ct.tags)) card.tags = ct.tags.map(str).filter(Boolean);
  const ov = { nickname: str(ct.nickname), birthday: str(ct.birthday), photo: str(ct.photo), favorite: !!ct.favorite, extra: { phones: plain.slice(3), emails: em.slice(3), urls: ur.slice(1), addresses: ad.slice(1) } };
  if (ad[0]) ov.addr0 = ad[0];
  return { card, ov };
}
const parse = (v) => { if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } } return v && typeof v === 'object' ? v : null; };

/* Returns { result } when this call is answered here, or null to let the normal key-value store answer. kv is that store for this app. */
export async function contactsKv(kv, b) {
  const op = b && b.op, key = typeof (b && b.key) === 'string' ? b.key : '';
  if (op === 'list' && String(b.pattern || '') === 'contact:*') {
    const local = kv.list('contact:*', true); let cards = [];
    try { cards = await loadCards(); } catch { cards = cache ? cache.d : []; }
    const ovs = Object.fromEntries(kv.list('cs-ov:*', true).map((e) => [e.key.slice(6), parse(e.value)])), r = rev();
    const items = cards.map((c) => { const id = r[c.id] || 'cs-' + c.id; return { key: 'contact:' + id, value: toContact(c, ovs[c.id], id) }; });
    const all = items.concat(local.filter((e) => !items.some((i) => i.key === e.key))).sort((a, c) => (a.key < c.key ? -1 : 1));
    return { result: b.values ? all : all.map((e) => e.key) };
  }
  if (!key.startsWith('contact:') || !['get', 'set', 'del'].includes(op)) return null;
  const id = key.slice(8), local = kv.get(key);
  if (local != null && op !== 'del') return null;
  let cardId = cardIdOf(id);
  if (op === 'get') {
    if (!cardId) return null;
    const c = (await loadCards()).find((x) => x.id === cardId); if (!c) return { result: null };
    return { result: toContact(c, parse(kv.get('cs-ov:' + cardId)), id) };
  }
  if (op === 'del') {
    if (!cardId) return null;
    try { await cs('/api/cards/' + cardId, { method: 'DELETE' }); } catch (e) { if (e.status !== 404) throw e; }
    kv.del('cs-ov:' + cardId); delete map[id]; saveMap(); invalidate(); return { result: true };
  }
  const ct = parse(b.value); if (!ct) return null;
  if (cardId) {
    const row = (await loadCards()).find((x) => x.id === cardId), { card, ov } = fromContact(ct, !row || row.notes !== undefined);
    await cs('/api/cards/' + cardId, { method: 'PATCH', body: JSON.stringify(card) });
    kv.set('cs-ov:' + cardId, ov); invalidate(); return { result: true };
  }
  const { card, ov } = fromContact(ct, true);
  if (!card.name) return null;
  let d; try { d = await cs('/api/cards', { method: 'POST', body: JSON.stringify(card) }); } catch { return null; }
  cardId = d && (d.card ? d.card.id : d.id); if (!cardId || !UUID.test(cardId)) return null;
  map[id] = cardId; saveMap(); kv.set('cs-ov:' + cardId, ov); invalidate(); return { result: true };
}
