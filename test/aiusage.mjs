// AI tab in Insights: FreeLLMAPI analytics through the server, with a fake FreeLLMAPI that needs a login.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-ai-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const TOKEN = 'tok-123', logins = []; let ranges = [];
const now = Date.now(), H = 3600e3, stamp = (i) => new Date(now - i * H).toISOString().slice(0, 13).replace('T', ' ') + ':00:00';
const fake = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'), send = (c, o) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (u.pathname === '/api/auth/login') { let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => { const j = JSON.parse(b || '{}'); logins.push(j.email); if (j.email === 'me@x.com' && j.password === 'secret') send(200, { token: TOKEN, email: j.email }); else send(401, { error: 'Invalid email or password' }); }); return; }
  if ((req.headers.authorization || '') !== 'Bearer ' + TOKEN) return send(401, { error: 'no' });
  const rg = u.searchParams.get('range'); if (u.pathname.startsWith('/api/analytics/')) ranges.push(rg);
  if (u.pathname === '/api/analytics/summary') return send(200, { totalRequests: 1200, successRate: 96.4, totalInputTokens: 2500000, totalOutputTokens: 410000, avgLatencyMs: 1840, p50LatencyMs: 1200, p95LatencyMs: 6100, avgTtfbMs: 640, requestTypeCounts: { chat: 1180, embedding: 20 }, estimatedCostSavings: 14.2, pinnedRequests: 30, pinHonoredRequests: 28, firstRequestAt: '2026-09-01 08:00:00', lifetimeTotalRequests: 9800 });
  if (u.pathname === '/api/analytics/timeline') return send(200, Array.from({ length: 24 }, (_, i) => ({ timestamp: stamp(23 - i), requests: 40 + i, successCount: 38 + i, failureCount: 2, inputTokens: 90000 + i * 1000, outputTokens: 15000 })));
  if (u.pathname === '/api/analytics/by-model') return send(200, [{ platform: 'groq', providerId: 'groq', endpoint: '', modelId: 'llama-3.3-70b', displayName: 'Llama 3.3 70B', requests: 700, successRate: 97, avgLatencyMs: 900, totalInputTokens: 1500000, totalOutputTokens: 200000, pinnedRequests: 10, estimatedCost: 8.1 }, { platform: 'google', providerId: 'google', endpoint: '', modelId: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', requests: 500, successRate: 95, avgLatencyMs: 2500, totalInputTokens: 1000000, totalOutputTokens: 210000, pinnedRequests: 20, estimatedCost: 6.1 }]);
  if (u.pathname === '/api/analytics/by-platform') return send(200, [{ platform: 'groq', providerId: 'groq', endpoint: '', requests: 700, successRate: 97, avgLatencyMs: 900, p95LatencyMs: 3000, avgTtfbMs: 300, errorCount: 21, avgTokensPerSecond: 210, totalInputTokens: 1500000, totalOutputTokens: 200000 }, { platform: 'google', providerId: 'google', endpoint: '', requests: 500, successRate: 95, avgLatencyMs: 2500, p95LatencyMs: 8000, avgTtfbMs: 900, errorCount: 25, avgTokensPerSecond: 90, totalInputTokens: 1000000, totalOutputTokens: 210000 }]);
  if (u.pathname === '/api/analytics/by-client') return send(200, [{ clientAgent: 'Anands AI', requests: 900, successRate: 97, avgLatencyMs: 1500, totalInputTokens: 2000000, totalOutputTokens: 300000, lastSeenAt: new Date(now - 60e3).toISOString() }]);
  if (u.pathname === '/api/analytics/by-key') return send(200, [{ keyId: 1, label: 'groq main', platform: 'groq', requests: 700, successRate: 97, avgLatencyMs: 900, totalInputTokens: 1500000, totalOutputTokens: 200000 }]);
  if (u.pathname === '/api/analytics/error-distribution') return send(200, { byCategory: [{ category: 'Rate Limited (429)', count: 40 }, { category: 'Timeout/Connection', count: 6 }], byPlatform: [{ platform: 'google', providerId: 'google', endpoint: '', count: 25 }], detailed: [{ platform: 'google', model_id: 'gemini-2.5-flash', error_category: 'Rate Limited (429)', count: 25 }] });
  if (u.pathname === '/api/analytics/errors') return send(200, [{ id: 77, platform: 'google', providerId: 'google', endpoint: '', modelId: 'gemini-2.5-flash', error: 'quota exceeded', latencyMs: 300, createdAt: '2026-10-16 09:00:00' }]);
  if (u.pathname === '/api/analytics/requests') { const st = u.searchParams.get('status'); return send(200, { total: st === 'error' ? 1 : 120, rows: [{ id: 77, platform: 'google', modelId: 'gemini-2.5-flash', requestedModel: 'auto', requestType: 'chat', status: st === 'error' ? 'error' : 'success', inputTokens: 1000, outputTokens: 200, latencyMs: 1500, error: null, clientIp: '1.2.3.4', clientUserAgent: 'x', clientAgent: 'Anands AI', createdAt: '2026-10-16 09:00:00', keyLabel: 'k', attemptCount: 2 }] }); }
  if (u.pathname === '/api/analytics/requests/77') return send(200, { id: 77, platform: 'google', modelId: 'gemini-2.5-flash', requestedModel: 'auto', servedModel: 'gemini-2.5-flash', requestType: 'chat', status: 'success', inputTokens: 1000, outputTokens: 200, latencyMs: 1500, ttfbMs: 500, error: null, clientIp: '1.2.3.4', clientAgent: 'Anands AI', createdAt: '2026-10-16 09:00:00', attempts: [{ ordinal: 1, platform: 'groq', modelId: 'llama', keyOrdinal: 1, keyLabel: 'groq main', outcome: 'rate_limited', startOffsetMs: 0, durationMs: 120, errorSummary: '429' }, { ordinal: 2, platform: 'google', modelId: 'gemini-2.5-flash', keyOrdinal: 1, keyLabel: 'g1', outcome: 'success', startOffsetMs: 130, durationMs: 1300, errorSummary: null }] });
  if (u.pathname === '/api/keys') return send(200, [{ id: 1, platform: 'groq', label: 'groq main', maskedKey: 'gsk_****abcd', status: 'healthy', enabled: true, keyless: false, lastCheckedAt: new Date(now - 120e3).toISOString(), lastHealthError: null, cooldowns: [{ modelId: 'llama-3.3-70b', expiresAtMs: now + 90e3, remainingMs: 90e3 }] }, { id: 2, platform: 'google', label: 'g1', maskedKey: 'AIza****zz', status: 'invalid', enabled: true, keyless: false, lastCheckedAt: null, lastHealthError: 'API key not valid', cooldowns: [] }]);
  if (u.pathname === '/api/models') return send(200, [{ id: 1, platform: 'groq', modelId: 'llama-3.3-70b', displayName: 'Llama 3.3 70B', enabled: true, fallbackEnabled: true, priority: 1, keyCount: 1, rpmLimit: 30, rpdLimit: 1000, tpmLimit: 6000, contextWindow: 131072, supportsVision: false, supportsTools: true, source: 'catalog', sizeLabel: '70B' }]);
  send(404, { error: 'nope' });
});
await new Promise((r) => fake.listen(0, '127.0.0.1', r)); const fport = fake.address().port;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const shots = process.env.SHOTS || '', errs = [];
let browser = null;
try {
  const { request } = await import('node:http');
  const login = await fetch(B + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: 'pw' }) }); assert.ok(login.ok);
  const cookie = login.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  const H2 = { cookie, 'x-aos': '1', 'content-type': 'application/json' };
  const get = async (p) => { const r = await fetch(B + p, { headers: H2 }); return { s: r.status, j: await r.json().catch(() => ({})) }; };
  await t('asks for the dashboard login before it connects', async () => {
    let r = await get('/api/aiusage'); assert.equal(r.s, 409); assert.equal(r.j.code, 'not_configured');
    await fetch(B + '/api/settings', { method: 'PUT', headers: H2, body: JSON.stringify({ aiusage: { url: 'http://127.0.0.1:' + fport, user: 'me@x.com', pass: 'wrong' } }) });
    r = await get('/api/aiusage'); assert.equal(r.s, 502); assert.match(r.j.error, /rejected the email or password/);
    const s = await (await fetch(B + '/api/settings', { headers: H2 })).json(); assert.equal(s.aiusage.passSet, true); assert.ok(!JSON.stringify(s).includes('wrong'));
  });
  await t('reads analytics, keys and models once the login is right', async () => {
    await fetch(B + '/api/settings', { method: 'PUT', headers: H2, body: JSON.stringify({ aiusage: { pass: 'secret' } }) });
    const tr = await fetch(B + '/api/settings/test', { method: 'POST', headers: H2, body: JSON.stringify({ target: 'aiusage' }) }).then((r) => r.json()); assert.equal(tr.connected, true); assert.equal(tr.resources, 1200);
    const r = await get('/api/aiusage?range=30d&refresh=1'); assert.equal(r.s, 200); assert.equal(r.j.range, '30d'); assert.equal(r.j.summary.totalRequests, 1200);
    assert.ok(ranges.includes('30d')); assert.equal(r.j.timeline.length, 24); assert.ok(r.j.timeline[0].t.endsWith('Z'));
    assert.equal(r.j.byModel.length, 2); assert.equal(r.j.keys.length, 2); assert.equal(r.j.keys[0].cooldowns.length, 1); assert.equal(r.j.keys[1].error, 'API key not valid'); assert.equal(r.j.models[0].name, 'Llama 3.3 70B');
    assert.ok(!JSON.stringify(r.j).includes('secret') && !JSON.stringify(r.j).includes(TOKEN));
    assert.equal((await get('/api/aiusage?range=bogus&refresh=1')).j.range, '7d');
  });
  await t('request log, filters and the fallback attempts of one request', async () => {
    let r = await get('/api/aiusage/requests?range=7d&status=error'); assert.equal(r.j.total, 1); assert.equal(r.j.rows[0].status, 'error'); assert.ok(r.j.rows[0].createdAt.endsWith('Z'));
    r = await get('/api/aiusage/request?id=77'); assert.equal(r.j.attempts.length, 2); assert.equal(r.j.attempts[0].outcome, 'rate_limited');
    assert.equal((await get('/api/aiusage/request?id=abc')).s, 400);
    const w = await fetch(B + '/api/aiusage', { method: 'POST', headers: H2, body: '{}' }); assert.equal(w.status, 405);
  });
  if (!chromium) console.log('skip  UI checks, Playwright not installed');
  else {
    browser = await chromium.launch({ args: ['--no-sandbox'] });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
    const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message));
    await t('Insights has an AI tab with the usage numbers, charts and tables', async () => {
      await page.goto(B + '/#insights'); await page.waitForSelector('.seg button');
      await page.locator('.seg button', { hasText: 'AI' }).click(); await page.waitForSelector('.kpis .kpi');
      assert.match(await page.locator('.kpis').innerText(), /1,200/); assert.match(await page.locator('.kpis').innerText(), /96\.4%/);
      assert.ok(await page.locator('.ichart').count() >= 2); if (shots) await page.screenshot({ path: shots + '/ai-overview.png', fullPage: true });
      await page.locator('[data-ai="tab"]', { hasText: 'Models' }).click(); await page.waitForSelector('table'); assert.match(await page.locator('table').first().innerText(), /Llama 3\.3 70B/);
      await page.locator('[data-ai="tab"]', { hasText: 'Keys' }).click(); await page.waitForSelector('table'); const kt = await page.locator('table').innerText(); assert.match(kt, /API key not valid/); assert.match(kt, /llama-3\.3-70b \(2 min\)/);
      if (shots) await page.screenshot({ path: shots + '/ai-keys.png' });
      await page.locator('[data-ai="tab"]', { hasText: 'Requests' }).click(); await page.waitForSelector('tr[data-ai="req"]'); await page.locator('tr[data-ai="req"]').first().click();
      await page.waitForSelector('#modal [role=dialog] table'); assert.match(await page.locator('#modal').innerText(), /rate limited/i); if (shots) await page.screenshot({ path: shots + '/ai-request.png' });
      await page.keyboard.press('Escape'); await page.locator('[data-ai="range"]', { hasText: '24 hours' }).click(); await page.waitForTimeout(400); assert.ok(ranges.includes('24h'));
    });
  }
  assert.deepEqual(errs, []);
} finally { if (browser) await browser.close(); srv.kill(); fake.close(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
