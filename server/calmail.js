/* The Calendar's email service: invitations, cancellations and replies, sent through your SMTP server.
 * The Calendar app normally sends these through a Puter-hosted service; its requests are answered here instead. */
import fs from 'node:fs';
import path from 'node:path';
import { DATA } from './config.js';
import { httpError } from './util.js';
import { publicOrigin } from './origin.js';
import * as mail from './mail.js';

const SENT = path.join(DATA, 'mail-sent.json'); let sent = {}; try { sent = JSON.parse(fs.readFileSync(SENT, 'utf8')); } catch {}
const saveSent = () => { const ks = Object.keys(sent); if (ks.length > 5000) for (const k of ks.sort((a, b) => sent[a].at - sent[b].at).slice(0, ks.length - 4000)) delete sent[k]; try { fs.writeFileSync(SENT, JSON.stringify(sent)); } catch {} };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const line = (s, n) => String(s ?? '').replace(/[\r\n\0]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const block = (s, n) => String(s ?? '').replace(/\0/g, '').replace(/\r\n?/g, '\n').trim().slice(0, n);
const tl = (a) => a.filter((x) => typeof x === 'string').join('\n');
const httpUrl = (u) => { try { const x = new URL(String(u)); return /^https?:$/.test(x.protocol) ? x.toString() : ''; } catch { return ''; } };

function icsOf(s) {
  if (s == null || s === '') return null;
  if (typeof s !== 'string' || s.length > 200000 || !/^BEGIN:VCALENDAR/.test(s) || !/END:VCALENDAR\s*$/.test(s)) throw httpError(400, 'invalid_ics', 'invalid_ics');
  const m = /^METHOD:([A-Za-z-]+)/m.exec(s); return { text: s, method: (m ? m[1] : 'PUBLISH').toUpperCase() };
}
function eventOf(e) {
  if (!e || typeof e !== 'object') throw httpError(400, 'bad_request', 'bad_request');
  return { id: line(e.id, 200), title: line(e.title, 200) || '(No title)', when: line(e.when, 200), recur: line(e.recurLabel, 200), where: line(e.location, 300), meeting: httpUrl(e.meetingUrl), desc: block(e.description, 4000), orgName: line(e.organizerName, 100), orgEmail: line(e.organizerEmail, 254) };
}
const rsvpOk = (u) => { const o = publicOrigin(); return o && typeof u === 'string' && u.startsWith(o + '/rsvp/') && /^[0-9a-f]{40}$/.test(u.slice(o.length + 6)) ? u : ''; };
const btn = (href, label, bg, fg = '#fff') => `<a href="${esc(href)}" style="display:inline-block;padding:10px 22px;margin:0 8px 8px 0;border-radius:8px;background:${bg};color:${fg};text-decoration:none;font-weight:600;font-size:15px">${label}</a>`;
function card(inner) { return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f6f5f2;padding:24px"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:26px;color:#19181a;line-height:1.5">${inner}</div></div>`; }
const row = (k, v) => v ? `<tr><td style="padding:4px 14px 4px 0;color:#68666d;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:4px 0">${v}</td></tr>` : '';
function details(ev) { return `<table style="border-collapse:collapse;font-size:15px;margin:14px 0">${row('When', esc(ev.when) + (ev.recur ? `<br><span style="color:#68666d">${esc(ev.recur)}</span>` : ''))}${row('Where', esc(ev.where))}${row('Join', ev.meeting ? `<a href="${esc(ev.meeting)}" style="color:#a85500">${esc(ev.meeting)}</a>` : '')}${row('Host', esc(ev.orgName || ev.orgEmail))}</table>`; }
const textDetails = (ev) => [`When: ${ev.when}${ev.recur ? ' (' + ev.recur + ')' : ''}`, ev.where && `Where: ${ev.where}`, ev.meeting && `Join: ${ev.meeting}`, (ev.orgName || ev.orgEmail) && `Host: ${ev.orgName || ev.orgEmail}`].filter(Boolean).join('\n');

function requireReady() { if (!mail.configured()) throw httpError(404, 'smtp_not_configured', 'smtp_not_configured'); }
const summary = (results) => { const c = { ok: true, sent: 0, skipped: 0, failed: 0, suppressed: 0, results }; for (const r of results) { if (r.status === 'sent') c.sent++; else if (r.status === 'skipped') c.skipped++; else if (r.status === 'failed') c.failed++; } return c; };

async function fanOut(b, kind) {
  requireReady();
  const ev = eventOf(b.event); const ics = icsOf(b.ics); const note = block(b.note, 1000);
  const rs = Array.isArray(b.recipients) ? b.recipients.slice(0, 50) : []; if (!ev.id || !rs.length) throw httpError(400, 'bad_request', 'bad_request');
  const results = []; let capped = false;
  for (const r of rs) {
    const email = line(r && r.email, 254).toLowerCase(); const out = { email, at: Date.now() };
    if (!mail.validEmail(email)) { results.push({ ...out, status: 'failed', reason: 'bad_address' }); continue; }
    const key = ev.id + '|' + email;
    if (kind !== 'cancel' && !b.force && sent[key] && sent[key].v === r.version && sent[key].kind === kind) { results.push({ ...out, status: 'skipped', reason: 'already_sent' }); continue; }
    if (capped) { results.push({ ...out, status: 'skipped', reason: 'daily_limit' }); continue; }
    const name = line(r.name, 100), link = rsvpOk(r.rsvpUrl);
    const hi = name ? `Hi ${name},` : 'Hi,';
    const host = ev.orgName || ev.orgEmail || 'The organizer';
    let subject, text, html;
    if (kind === 'cancel') {
      subject = `Cancelled: ${ev.title}${ev.when ? ' @ ' + ev.when : ''}`;
      const scope = b.cancellationScope === 'guests' ? `${host} removed you from this event.` : `${host} cancelled this event.`;
      text = tl([hi, '', scope, '', ev.title, textDetails(ev), note ? '\n' + note : false]);
      html = card(`<p style="margin:0 0 6px;color:#68666d">${esc(hi)}</p><h2 style="margin:0 0 4px;font-size:21px">Cancelled: ${esc(ev.title)}</h2><p style="margin:6px 0">${esc(scope)}</p>${details(ev)}${note ? `<p style="white-space:pre-wrap">${esc(note)}</p>` : ''}`);
    } else {
      subject = `${kind === 'update' ? 'Updated invitation' : 'Invitation'}: ${ev.title}${ev.when ? ' @ ' + ev.when : ''}`;
      text = tl([hi, '', `${host} ${kind === 'update' ? 'updated this event' : 'invited you to an event'}:`, '', ev.title, textDetails(ev), ev.desc ? '\n' + ev.desc : false, note ? '\n' + note : false, link ? `\nWill you come?\nYes: ${link}/accept\nNo: ${link}/decline\nMaybe: ${link}/maybe\nOr open: ${link}` : false]);
      html = card(`<p style="margin:0 0 6px;color:#68666d">${esc(hi)}</p><h2 style="margin:0 0 4px;font-size:21px">${esc(ev.title)}</h2><p style="margin:6px 0">${esc(host)} ${kind === 'update' ? 'updated this event' : 'invited you'}.</p>${details(ev)}${ev.desc ? `<p style="white-space:pre-wrap;color:#374151">${esc(ev.desc)}</p>` : ''}${note ? `<p style="white-space:pre-wrap">${esc(note)}</p>` : ''}${link ? `<div style="margin-top:18px">${btn(link + '/accept', 'Yes', '#0f7a55')}${btn(link + '/decline', 'No', '#c2332f')}${btn(link + '/maybe', 'Maybe', '#e8e5dd', '#19181a')}</div><p style="font-size:13px;color:#68666d;margin:6px 0 0">Or <a href="${esc(link)}" style="color:#a85500">open the invitation</a> to add a note.</p>` : ''}`);
    }
    try {
      await mail.sendMail({ to: email, subject, text, html, replyTo: ev.orgEmail, fromName: ev.orgName ? ev.orgName + ' (Anands)' : '', calendar: ics ? { method: ics.method, text: ics.text } : undefined, attachments: ics ? [{ filename: kind === 'cancel' ? 'cancelled.ics' : 'invite.ics', content: Buffer.from(ics.text, 'utf8'), contentType: `text/calendar; charset=utf-8; method=${ics.method}` }] : [] });
      if (kind !== 'cancel') { sent[key] = { v: r.version, kind, at: Date.now() }; } else delete sent[key];
      results.push({ ...out, status: 'sent' });
    } catch (e) {
      if (e.code === 'daily_limit') { capped = true; results.push({ ...out, status: 'skipped', reason: 'daily_limit' }); }
      else if (e.code === 'smtp_not_configured') throw e;
      else results.push({ ...out, status: 'failed', reason: String(e.code || 'send_failed') });
    }
  }
  saveSent(); return summary(results);
}

async function reply(b) {
  requireReady();
  const ev = eventOf(b.event); const to = line(ev.orgEmail, 254).toLowerCase(); const att = b.attendee || {}; const who = line(att.name, 100) || line(att.email, 254);
  const verdict = { accepted: 'accepted', declined: 'declined', tentative: 'replied maybe to' }[b.partstat];
  if (!verdict || !mail.validEmail(to) || !mail.validEmail(line(att.email, 254))) throw httpError(400, 'bad_request', 'bad_request');
  const ics = icsOf(b.ics); const subject = `${{ accepted: 'Accepted', declined: 'Declined', tentative: 'Maybe' }[b.partstat]}: ${ev.title}`;
  const text = `${who} ${verdict} ${ev.title}.\n\n${textDetails(ev)}`;
  await mail.sendMail({ to, subject, text, html: card(`<h2 style="margin:0 0 6px;font-size:20px">${esc(who)} ${esc(verdict)} ${esc(ev.title)}</h2>${details(ev)}`), replyTo: line(att.email, 254), calendar: ics ? { method: 'REPLY', text: ics.text } : undefined, attachments: ics ? [{ filename: 'reply.ics', content: Buffer.from(ics.text, 'utf8'), contentType: 'text/calendar; charset=utf-8; method=REPLY' }] : [] });
  return { ok: true, sent: true };
}

/* path: /invites, /cancellations, /replies */
export async function handleMailService(path, body) {
  if (path === '/invites') return fanOut(body, body.kind === 'update' ? 'update' : 'invite');
  if (path === '/cancellations') return fanOut({ ...body, kind: 'cancel' }, 'cancel');
  if (path === '/replies') return reply(body);
  throw httpError(404, 'Unknown mail route');
}
