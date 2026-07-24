// loadtest.mjs — dependency-free load test against a running API. Measures throughput
// and latency percentiles for representative endpoints under controlled concurrency, and
// checks the DB connection pool holds up. Uses Node's global fetch (undici).
//
// Usage: node scripts/loadtest.mjs <baseUrl> <jwt> [durationSec] [concurrency]
import { performance } from 'node:perf_hooks';

const base = process.argv[2] ?? 'http://127.0.0.1:8099';
const jwt = process.argv[3] ?? '';
const durationSec = Number(process.argv[4] ?? 10);
const concurrency = Number(process.argv[5] ?? 50);

const scenarios = [
  { name: 'GET /health', method: 'GET', path: '/health', auth: false },
  { name: 'GET /public/courses (anon)', method: 'GET', path: '/public/courses', auth: false },
  { name: 'GET /applications (RLS read)', method: 'GET', path: '/applications', auth: true },
  { name: 'GET /verify/:code (public fn)', method: 'GET', path: '/verify/NONEXISTENTCODE', auth: false },
];

function pct(sorted, p) {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

async function runScenario(sc) {
  const headers = sc.auth && jwt ? { authorization: `Bearer ${jwt}` } : {};
  const url = base + sc.path;
  const latencies = [];
  let ok = 0;
  let errors = 0;
  let statusCounts = {};
  const end = performance.now() + durationSec * 1000;

  async function worker() {
    while (performance.now() < end) {
      const t0 = performance.now();
      try {
        const res = await fetch(url, { method: sc.method, headers });
        // drain body
        await res.text();
        const dt = performance.now() - t0;
        latencies.push(dt);
        statusCounts[res.status] = (statusCounts[res.status] ?? 0) + 1;
        if (res.status < 500) ok++;
        else errors++;
      } catch {
        errors++;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  latencies.sort((a, b) => a - b);
  const total = latencies.length;
  const rps = total / durationSec;
  return {
    name: sc.name,
    total,
    rps: Math.round(rps),
    ok,
    errors,
    p50: +pct(latencies, 50).toFixed(2),
    p95: +pct(latencies, 95).toFixed(2),
    p99: +pct(latencies, 99).toFixed(2),
    max: +(latencies[latencies.length - 1] ?? 0).toFixed(2),
    statusCounts,
  };
}

const results = [];
for (const sc of scenarios) {
  // warmup
  await fetch(base + sc.path, { method: sc.method, headers: sc.auth && jwt ? { authorization: `Bearer ${jwt}` } : {} }).then((r) => r.text()).catch(() => {});
  const r = await runScenario(sc);
  results.push(r);
  console.log(
    `${r.name.padEnd(34)} rps=${String(r.rps).padStart(6)}  p50=${String(r.p50).padStart(7)}ms  p95=${String(r.p95).padStart(7)}ms  p99=${String(r.p99).padStart(7)}ms  errors=${r.errors}  ${JSON.stringify(r.statusCounts)}`,
  );
}
console.log('\nJSON ' + JSON.stringify({ base, durationSec, concurrency, results }));
