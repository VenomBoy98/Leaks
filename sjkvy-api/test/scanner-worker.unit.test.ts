// Scanner worker unit test with MOCKED object storage and a mocked database. Proves the worker
// is driver-agnostic: it pulls bytes via driver.readObject, records the trusted verdict
// (CLEAN/FLAGGED) via the service functions, quarantines a flagged object through the driver,
// and marks an over-cap object FAILED (never CLEAN) — all without any real DB or filesystem.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls = vi.hoisted(() => ({ fn: [] as Array<{ name: string; args: unknown[] }>, claim: [] as unknown[] }));

vi.mock('../src/db.js', () => ({
  queryRead: vi.fn(async () => calls.claim),
  callFn: vi.fn(async (_actor: unknown, name: string, args: unknown[]) => { calls.fn.push({ name, args }); return {}; }),
}));

import { ScannerWorker } from '../src/worker/scanner-worker.js';
import { FakeScanAdapter } from '../src/worker/scanner-adapter.js';
import { ObjectTooLargeError } from '../src/storage/bounded.js';
import type { StorageService } from '../src/storage/index.js';

const EICAR = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

// Mock object-storage driver: read bytes keyed by storage_path; record quarantines.
const quarantined: string[] = [];
const mockStorage = {
  driver: {
    kind: 'supabase' as const,
    async readObject(key: string, limits: { maxBytes: number }) {
      if (key === 'k/oversize') throw new ObjectTooLargeError(limits.maxBytes);
      if (key === 'k/eicar') return Buffer.from(EICAR);
      return Buffer.from('perfectly clean pdf bytes');
    },
    async quarantine(key: string) { quarantined.push(key); },
  },
} as unknown as StorageService;

beforeEach(() => { calls.fn = []; quarantined.length = 0; });

describe('ScannerWorker with mocked object storage', () => {
  it('is degraded when the driver cannot read bytes back', async () => {
    const noRead = { driver: { kind: 's3' } } as unknown as StorageService;
    const health = await new ScannerWorker(new FakeScanAdapter(), noRead).readiness();
    expect(health.degraded).toBe(true);
  });

  it('records CLEAN/FLAGGED verdicts, quarantines flagged, and FAILs an over-cap object', async () => {
    calls.claim = [
      { o_version_id: 'v-clean', o_storage_path: 'k/clean', o_size_bytes: 25, o_attempts: 0 },
      { o_version_id: 'v-eicar', o_storage_path: 'k/eicar', o_size_bytes: 68, o_attempts: 0 },
      { o_version_id: 'v-big', o_storage_path: 'k/oversize', o_size_bytes: 99, o_attempts: 0 },
    ];
    const w = new ScannerWorker(new FakeScanAdapter(), mockStorage);
    const r = await w.tick(10);

    expect(r).toMatchObject({ scanned: 3, clean: 1, flagged: 1, failed: 1, degraded: false });

    const results = calls.fn.filter((c) => c.name === 'fn_scan_result');
    expect(results).toContainEqual({ name: 'fn_scan_result', args: ['v-clean', 'CLEAN'] });
    expect(results).toContainEqual({ name: 'fn_scan_result', args: ['v-eicar', 'FLAGGED'] });
    // the over-cap object is never marked clean — it goes to fn_scan_fail
    expect(results.some((c) => c.args[0] === 'v-big')).toBe(false);
    expect(calls.fn.some((c) => c.name === 'fn_scan_fail' && c.args[0] === 'v-big')).toBe(true);
    // only the flagged object is quarantined, via the driver
    expect(quarantined).toEqual(['k/eicar']);
  });
});
