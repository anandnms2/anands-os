// Puter branding is removed from everything served; the shim keeps the PDF editor from looping.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { rebrand } from '../server/rebrand.js';
let pass = 0; const t = (n, f) => { try { f(); pass++; console.log('ok   ' + n); } catch (e) { console.log('FAIL ' + n + '\n     ' + e.message); process.exitCode = 1; } };
t('visible names become Anands', () => {
  for (const [a, b] of [['Built with Puter', 'Built with Anands'], ['Powered by Puter.com', 'Powered by Anands'], ['PUTER', 'ANANDS'], ['Puter Mail', 'Email'], ['Puter Email', 'Email'], ['Puter Meetings', 'Anands Meeting'], ['Compose mail from your @puter.email address, to any address on Puter or off.', 'Compose mail from your email address, to any address.']]) assert.equal(rebrand(a), b);
});
t('links to puter.com and its subdomains go to this site', () => { assert.ok(!/puter/i.test(rebrand('<a href="https://puter.com/x">a</a> https://docs.puter.com/y cal.puter.com'))); });
t('code the apps need is kept', () => { const s = 'window.puter.kv.get("a"); https://js.puter.com/v2/'; assert.equal(rebrand(s), s); });
t('shim provides authToken (PDF editor no longer spins)', () => { assert.match(fs.readFileSync(new URL('../suite/shim/puter.js', import.meta.url), 'utf8'), /authToken:\s*'anands-local'/); });
console.log(pass + ' passed');
t('Email app text no longer mentions a Puter account', () => { const r = rebrand('Your mail lives in your own Puter account. Messages delivered to your Puter mailbox appear here.'); assert.ok(!/puter/i.test(r) && !/Anands account/.test(r), r); });
