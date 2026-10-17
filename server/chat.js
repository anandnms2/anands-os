import fs from 'node:fs';
import path from 'node:path';
import { effective, SUITE } from './config.js';
import { json, readJson, fetchJson, httpError } from './util.js';
import { photoContext } from './immich.js';
import { insightsContext } from './coolify.js';
import { statusContext } from './status.js';
import { aiContext } from './aiusage.js';
import { vpnContext } from './vpn.js';
import { cardsContext } from './cardscan.js';
import { filesContext, driveContext } from './local.js';

function llm() {
  const { base, key, model } = effective().llm;
  if (!base) throw httpError(409, 'The assistant is not connected. Add your FreeLLMAPI address and key in the assistant settings.', 'not_configured');
  let b = base.replace(/\/+$/, ''); if (!/\/v1$/.test(b)) b += '/v1';
  return { b, key, model };
}
const clip = (s, n) => String(s ?? '').slice(0, n);
const DESKTOP_RULES = '\n\nYou are running inside the user\'s Anands Desktop (windows, files, apps). If the user asks you to open an app, add a final line exactly like: ACTION: open <slug> (slugs are in suiteApps). To open their Drive file, add: ACTION: openfile <path> (a path from the files list, starting with /Drive). Use an ACTION line only when they clearly ask to open something. If an attachedFile is present, answer from it.';
export async function llmChat(messages, opts = {}) {
  const c = llm();
  const msgs = (Array.isArray(messages) ? messages : []).filter((m) => m && ['system', 'user', 'assistant'].includes(m.role)).slice(-24).map((m) => ({ role: m.role, content: typeof m.content === 'string' ? clip(m.content, 60000) : clip(JSON.stringify(m.content), 20000) }));
  if (!msgs.length) throw httpError(400, 'No messages');
  const r = await fetchJson(c.b + '/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', ...(c.key ? { authorization: 'Bearer ' + c.key } : {}) }, body: JSON.stringify({ model: opts.model || c.model, messages: msgs, temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.2 }) }, 90000).catch((e) => { throw httpError(e.status === 504 ? 504 : 502, 'The language model did not answer: ' + e.message, e.code); });
  const text = r?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') throw httpError(502, 'The language model returned an unexpected reply', 'bad_reply');
  return { text, model: r.model || c.model };
}

let appsCache = null;
function appsList() {
  if (!appsCache) { try { appsCache = JSON.parse(fs.readFileSync(path.join(SUITE, 'apps.json'), 'utf8')).map((a) => ({ name: a.name, category: a.category, replaces: a.alternativeTo, available: a.hasSource })); } catch { appsCache = []; } }
  return appsCache;
}

const SYSTEM = `You are Anands Assistant, built into Anand's personal OS (Anands OS). You answer questions about what is connected to it: his photos (Immich), his server (Coolify: apps, services, databases, deployments), his servers' health (Beszel), his VPN devices (wg-easy), his business cards (Card Scan), the 48 Suite apps, and files the apps saved.
Rules: answer only from CONTEXT. If something is not in CONTEXT, or a source is marked not connected, say so plainly and say what would connect it. Never invent photos, files, resources or numbers. Be brief and direct; short "- " lists are fine. Dates are ISO; use "d Mon" style when writing.`;

export async function handleChat(req, res, url, sess) {
  const guest = !!(sess && sess.role && sess.role !== 'owner');
  if (url.pathname === '/api/chat/test') {
    if (guest) throw httpError(403, 'Only the owner can test the assistant connection', 'forbidden');
    const c = llm();
    try { const r = await llmChat([{ role: 'user', content: 'Reply with the single word: ready' }], { temperature: 0 }); return json(res, 200, { ok: true, model: r.model, reply: clip(r.text, 80) }); }
    catch (e) { return json(res, 200, { ok: false, message: e.message, code: e.code }); }
  }
  const b = await readJson(req, 256 * 1024);
  const hist = (Array.isArray(b.messages) ? b.messages : []).filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-12).map((m) => ({ role: m.role, content: clip(m.content, 6000) }));
  if (!hist.length || hist[hist.length - 1].role !== 'user') throw httpError(400, 'Send a question');
  const want = guest ? { photos: false, insights: false, cards: false, files: false } : (b.ctx || {}); const ctx = { now: new Date().toISOString(), timezone: 'Africa/Dar_es_Salaam', dateFormat: 'dd/mm/yyyy, 24-hour time. Always write dates this way.' }; const used = [];
  const jobs = [];
  if (want.photos !== false) jobs.push(photoContext().then((v) => { ctx.photos = v; used.push('photos'); }).catch((e) => { ctx.photos = { connected: false, note: e.message }; }));
  if (want.insights !== false) jobs.push(insightsContext().then((v) => { ctx.cloud = v; used.push('insights'); }));
  if (want.insights !== false) jobs.push(aiContext().then((v) => { if (v) { ctx.aiUsage = v; used.push('AI usage'); } }));
  if (want.insights !== false) jobs.push(statusContext().then((v) => { if (v) { ctx.servers = v; used.push('servers'); } }));
  if (want.insights !== false) jobs.push(vpnContext().then((v) => { if (v) { ctx.vpn = v; used.push('vpn'); } }));
  if (want.cards !== false) jobs.push(cardsContext(hist[hist.length - 1].content).then((v) => { if (v) { ctx.businessCards = v; used.push('cards'); } }));
  if (want.files !== false) jobs.push(driveContext().then((v) => { ctx.drive = v; if (v.connected) used.push('drive'); }).catch(() => {}));
  if (want.files !== false) jobs.push(filesContext().then((v) => { ctx.files = v; used.push('files'); }).catch(() => {}));
  if (want.apps !== false) { ctx.suiteApps = appsList(); used.push('apps'); }
  const dk = b.desktop && typeof b.desktop === 'object' ? b.desktop : null;
  if (dk) {
    ctx.desktop = { openWindows: (Array.isArray(dk.windows) ? dk.windows : []).slice(0, 20).map((x) => clip(String(x), 80)), currentFolder: clip(String(dk.folder || ''), 200) };
    if (dk.file && typeof dk.file.text === 'string') ctx.desktop.attachedFile = { name: clip(String(dk.file.name || ''), 150), content: clip(dk.file.text, 24000) };
    used.push('desktop');
  }
  await Promise.all(jobs);
  const text = clip(JSON.stringify(ctx), 90000);
  const r = await llmChat([{ role: 'system', content: SYSTEM + (dk ? DESKTOP_RULES : '') + '\n\nCONTEXT (JSON):\n' + text }, ...hist]);
  return json(res, 200, { text: r.text, model: r.model, used });
}
