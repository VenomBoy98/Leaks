// security-probe.mjs — penetration-style checks against a running API. Each probe
// asserts an EXPECTED secure outcome; the script exits non-zero if any control fails.
// Uses global fetch. Run against a fresh, seeded database.
//
// Usage: node scripts/security-probe.mjs <baseUrl> <jwtSecret>
import { SignJWT } from 'jose';

const base = process.argv[2] ?? 'http://127.0.0.1:8099';
const secret = new TextEncoder().encode(process.argv[3] ?? '');

const A = 'a0000000-0000-0000-0000-00000000000a'; // applicant A
const B = 'a0000000-0000-0000-0000-00000000000b'; // applicant B
const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : '  [' + detail + ']'}`);
}

async function mint(sub, opts = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ role: 'authenticated', ...(opts.claims ?? {}) })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt(opts.exp ? now - 7200 : now)
    .setExpirationTime(opts.exp ? now - 3600 : now + 3600)
    .sign(opts.secret ?? secret);
}
async function req(path, { method = 'GET', token, body, headers = {} } = {}) {
  const h = { ...headers };
  if (token) h.authorization = `Bearer ${token}`;
  if (body) h['content-type'] = 'application/json';
  const res = await fetch(base + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json };
}

// 1. Unauthenticated access to a protected endpoint
check('unauth read blocked (401)', (await req('/applications')).status === 401);

// 2. Tampered JWT (valid structure, wrong signature)
{
  const good = await mint(A);
  const tampered = good.slice(0, -3) + 'xyz';
  check('tampered JWT rejected (401)', (await req('/applications', { token: tampered })).status === 401);
}

// 3. Expired JWT
check('expired JWT rejected (401)', (await req('/auth/me', { token: await mint(A, { exp: true }) })).status === 401);

// 4. Foreign-signed JWT (attacker secret)
{
  const forged = await mint(A, { secret: new TextEncoder().encode('attacker-attacker-attacker-attacker-xx') });
  check('foreign-signed JWT rejected (401)', (await req('/auth/me', { token: forged })).status === 401);
}

// 5. Privilege-escalation claim in token
{
  const esc = await mint(A, { claims: { role: 'service_role' } });
  check('role-escalation claim rejected (403)', (await req('/auth/me', { token: esc })).status === 403);
}

// 6. Service endpoint with a user token
check('user token on [SYS] job rejected (401)', (await req('/jobs/expire-offers', { method: 'POST', token: await mint(A) })).status === 401);

// 7. IDOR — B tries to read A's data; must be scoped (no A rows leaked)
{
  const rB = await req('/applications', { token: await mint(B) });
  const items = rB.json?.items ?? [];
  check('IDOR: B sees no A applications (RLS)', Array.isArray(items) && items.every((x) => x.applicant_id !== undefined ? true : true) && items.length === 0, `B saw ${items.length} rows`);
}

// 8. SQL injection attempt in a path parameter (verify code)
{
  const r = await req(`/verify/${encodeURIComponent("' OR '1'='1")}`);
  check('SQLi in verify code → uniform invalid (200 valid:false)', r.status === 200 && r.json?.valid === false);
}

// 9. Path traversal in storage object key at finalize
{
  const r = await req('/documents/aaaaaaaa-0000-0000-0000-000000000001/finalize', {
    method: 'POST',
    token: await mint(A),
    body: { document_type: 'MATRIC', object_key: '../../etc/passwd', mime: 'image/jpeg', size: 10 },
  });
  check('path traversal object_key rejected (4xx)', r.status >= 400 && r.status < 500, `status ${r.status}`);
}

// 10. Oversized body rejected (body limit)
{
  const big = 'x'.repeat(2 * 1024 * 1024);
  const r = await req('/applications', { method: 'POST', token: await mint(A), body: { blob: big } });
  check('oversized JSON body rejected (413/400)', r.status === 413 || r.status === 400, `status ${r.status}`);
}

// 11. Unsigned/forged storage gateway token
check('forged storage upload token rejected (403)', (await req('/storage/upload/not-a-valid-token', { method: 'PUT', headers: { 'content-type': 'image/jpeg' } })).status === 403);

// 12. Error responses do not leak internals (no stack/table names)
{
  const r = await req('/applications/not-a-uuid', { token: await mint(A) });
  const s = JSON.stringify(r.json ?? {});
  check('error envelope leaks no internals', !/pg_|app\.|relation|syntax error|stack/i.test(s), s.slice(0, 80));
}

const failed = results.filter((r) => !r.pass);
console.log(`\n=== ${results.length - failed.length}/${results.length} security probes passed ===`);
console.log('JSON ' + JSON.stringify({ base, total: results.length, failed: failed.length, results }));
process.exit(failed.length === 0 ? 0 : 1);
