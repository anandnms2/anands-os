/* A tiny SMTP server for tests: EHLO, AUTH PLAIN/LOGIN, MAIL, RCPT, DATA. Collects messages. Optionally rejects a recipient or the login. */
import net from 'node:net';
export function smtpMock({ user = 'mailer', pass = 'mail-secret', rejectRcpt = null, offerStartTls = false } = {}) {
  const msgs = []; const state = { auths: [], conns: 0 };
  const server = net.createServer((sock) => {
    state.conns++; let buf = '', data = null, from = '', rcpts = [], authStep = null;
    const w = (s) => sock.write(s + '\r\n'); w('220 mock ESMTP');
    sock.on('data', (c) => {
      buf += c.toString('utf8');
      for (;;) {
        if (data !== null) { const i = buf.indexOf('\r\n.\r\n'); if (i < 0) return; data = buf.slice(0, i); buf = buf.slice(i + 5); msgs.push({ from, rcpts, raw: data.replace(/\r\n\.\./g, '\r\n.') }); data = null; from = ''; rcpts = []; w('250 queued'); continue; }
        const i = buf.indexOf('\r\n'); if (i < 0) return; const line = buf.slice(0, i); buf = buf.slice(i + 2);
        if (authStep === 'user') { authStep = 'pass'; state.lu = Buffer.from(line, 'base64').toString(); w('334 ' + Buffer.from('Password:').toString('base64')); continue; }
        if (authStep === 'pass') { authStep = null; const ok = state.lu === user && Buffer.from(line, 'base64').toString() === pass; state.auths.push(ok); w(ok ? '235 ok' : '535 bad credentials'); continue; }
        const cmd = line.toUpperCase();
        if (cmd.startsWith('EHLO')) { sock.write('250-mock\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n'); }
        else if (cmd.startsWith('AUTH PLAIN')) { const [, u, p] = Buffer.from(line.slice(11), 'base64').toString().split('\0'); const ok = u === user && p === pass; state.auths.push(ok); w(ok ? '235 ok' : '535 bad credentials'); }
        else if (cmd === 'AUTH LOGIN') { authStep = 'user'; w('334 ' + Buffer.from('Username:').toString('base64')); }
        else if (cmd.startsWith('MAIL FROM')) { from = /<([^>]*)>/.exec(line)?.[1] || ''; w('250 ok'); }
        else if (cmd.startsWith('RCPT TO')) { const r = /<([^>]*)>/.exec(line)?.[1] || ''; if (rejectRcpt && rejectRcpt.test(r)) w('550 no such user'); else { rcpts.push(r); w('250 ok'); } }
        else if (cmd === 'DATA') { data = ''; w('354 go'); }
        else if (cmd === 'QUIT') { w('221 bye'); sock.end(); }
        else w('250 ok');
      }
    });
    sock.on('error', () => {});
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, msgs, state, port: server.address().port, close: () => server.close() })));
}
/* decode a captured message into { headers, parts } with base64 bodies decoded */
export function parseMail(raw) {
  const split = (s) => { const i = s.indexOf('\r\n\r\n'); return [s.slice(0, i), s.slice(i + 4)]; };
  const hdr = (h) => Object.fromEntries(h.replace(/\r\n[ \t]+/g, ' ').split('\r\n').map((l) => { const k = l.indexOf(':'); return [l.slice(0, k).toLowerCase(), l.slice(k + 1).trim()]; }));
  const walk = (s) => {
    const [h, b] = split(s); const H = hdr(h); const ct = H['content-type'] || '';
    const bm = /boundary="([^"]+)"/.exec(ct);
    if (bm) { const parts = b.split('--' + bm[1]).slice(1, -1).map((x) => x.replace(/^\r\n/, '').replace(/\r\n$/, '')); return { headers: H, parts: parts.map(walk) }; }
    const body = (H['content-transfer-encoding'] || '') === 'base64' ? Buffer.from(b.replace(/\s+/g, ''), 'base64').toString('utf8') : b;
    return { headers: H, body };
  };
  return walk(raw);
}
export const flat = (m) => (m.parts ? m.parts.flatMap(flat) : [m]);
