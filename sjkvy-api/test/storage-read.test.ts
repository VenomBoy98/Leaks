// Storage read-path tests — the scanner reads objects THROUGH the driver abstraction under a
// hard size cap and timeout. Covers the local driver directly and the cloud read path
// (boundedFetch) against a mocked object-storage HTTP server. No database required.
import { describe, it, expect, afterAll } from 'vitest';
import { createServer, type Server } from 'node:http';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalDriver } from '../src/storage/local.js';
import { boundedFetch, ObjectTooLargeError } from '../src/storage/bounded.js';
import type { StorageConfig } from '../src/config.js';

const cfg: StorageConfig = {
  urlSigningSecret: 'x'.repeat(32),
  uploadTtlSec: 300,
  downloadTtlSec: 300,
  maxUploadBytes: 10 * 1024 * 1024,
  allowedMime: ['application/pdf'],
  publicBaseUrl: 'http://localhost:8080/storage',
};

describe('LocalDriver.readObject (bounded)', () => {
  const root = mkdtempSync(join(tmpdir(), 'sjkvy-lrd-'));
  const driver = new LocalDriver(cfg, root);

  it('reads an object within the size limit', async () => {
    await driver.put('app/a/doc.pdf', Buffer.from('%PDF-hello'));
    const bytes = await driver.readObject('app/a/doc.pdf', { maxBytes: 1024, timeoutMs: 5000 });
    expect(bytes.toString()).toBe('%PDF-hello');
  });

  it('rejects an object larger than the cap without returning it', async () => {
    await driver.put('app/a/big.pdf', Buffer.alloc(2048, 0x41));
    await expect(driver.readObject('app/a/big.pdf', { maxBytes: 1024, timeoutMs: 5000 }))
      .rejects.toThrow(ObjectTooLargeError);
  });

  it('blocks path traversal on read', async () => {
    await expect(driver.readObject('../../etc/passwd', { maxBytes: 1024, timeoutMs: 5000 }))
      .rejects.toThrow(/traversal/);
  });

  it('quarantine moves the object out of its servable key', async () => {
    await driver.put('app/b/flagged.pdf', Buffer.from('bad'));
    expect(await driver.exists('app/b/flagged.pdf')).toBe(true);
    await driver.quarantine('app/b/flagged.pdf');
    expect(await driver.exists('app/b/flagged.pdf')).toBe(false);
    expect(existsSync(join(root, '.quarantine', 'app/b/flagged.pdf'))).toBe(true);
  });
});

describe('boundedFetch (cloud object read path)', () => {
  const servers: Server[] = [];
  const serve = (handler: (bytes: number) => { body: Buffer; contentLength?: number; delayMs?: number }): Promise<string> =>
    new Promise((resolve) => {
      const srv = createServer((_req, res) => {
        const r = handler(0);
        if (r.contentLength !== undefined) res.setHeader('content-length', String(r.contentLength));
        const send = () => { res.statusCode = 200; res.end(r.body); };
        if (r.delayMs) setTimeout(send, r.delayMs); else send();
      });
      servers.push(srv);
      srv.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${(srv.address() as { port: number }).port}/`));
    });
  afterAll(() => { for (const s of servers) s.close(); });

  it('streams a small object under the cap', async () => {
    const url = await serve(() => ({ body: Buffer.from('clean bytes'), contentLength: 11 }));
    const b = await boundedFetch(url, { maxBytes: 1024, timeoutMs: 5000 });
    expect(b.toString()).toBe('clean bytes');
  });

  it('rejects early when Content-Length exceeds the cap', async () => {
    // advertises 5000 bytes but caps at 1024 — must reject before reading the body
    const url = await serve(() => ({ body: Buffer.alloc(5000, 1), contentLength: 5000 }));
    await expect(boundedFetch(url, { maxBytes: 1024, timeoutMs: 5000 })).rejects.toThrow(ObjectTooLargeError);
  });

  it('hard-stops the stream when a lying/absent length overflows the cap', async () => {
    // no content-length header; body is larger than the cap → caught mid-stream
    const url = await serve(() => ({ body: Buffer.alloc(5000, 2) }));
    await expect(boundedFetch(url, { maxBytes: 1024, timeoutMs: 5000 })).rejects.toThrow(ObjectTooLargeError);
  });

  it('times out a slow response', async () => {
    const url = await serve(() => ({ body: Buffer.from('late'), delayMs: 400 }));
    await expect(boundedFetch(url, { maxBytes: 1024, timeoutMs: 100 })).rejects.toThrow(/timed out/);
  });
});
