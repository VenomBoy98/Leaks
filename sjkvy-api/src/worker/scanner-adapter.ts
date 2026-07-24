// scanner-adapter.ts — configurable antivirus adapter for the document scanner worker.
// The worker records verdicts ONLY through the trusted backend (service_role); the adapter
// merely classifies bytes. If no adapter is configured the worker is DEGRADED and documents
// remain PENDING (never silently cleaned).
import net from 'node:net';

export type Verdict = 'CLEAN' | 'FLAGGED';
export interface ScanAdapter {
  readonly name: string;
  ready(): Promise<boolean>;
  scan(bytes: Buffer): Promise<Verdict>;
}

// Fake adapter for tests/dev only. Flags the EICAR test signature (and any obviously bad
// marker); everything else is CLEAN. Selected only via SCANNER_ADAPTER=fake.
export class FakeScanAdapter implements ScanAdapter {
  readonly name = 'fake';
  async ready(): Promise<boolean> { return true; }
  async scan(bytes: Buffer): Promise<Verdict> {
    const s = bytes.toString('latin1');
    return s.includes('EICAR-STANDARD-ANTIVIRUS-TEST-FILE') || s.includes('__MALWARE__') ? 'FLAGGED' : 'CLEAN';
  }
}

// ClamAV adapter — talks to clamd over TCP using the INSTREAM protocol. Production-ready when
// a clamd is reachable; ready() PINGs it. Selected via SCANNER_ADAPTER=clamav.
export class ClamAvScanAdapter implements ScanAdapter {
  readonly name = 'clamav';
  private host = process.env.CLAMAV_HOST ?? '127.0.0.1';
  private port = Number(process.env.CLAMAV_PORT ?? 3310);
  async ready(): Promise<boolean> {
    return new Promise((resolve) => {
      const sock = net.createConnection(this.port, this.host);
      const done = (v: boolean) => { sock.destroy(); resolve(v); };
      sock.setTimeout(2000);
      sock.on('connect', () => sock.write('zPING\0'));
      sock.on('data', (d) => done(d.toString().includes('PONG')));
      sock.on('timeout', () => done(false));
      sock.on('error', () => done(false));
    });
  }
  async scan(bytes: Buffer): Promise<Verdict> {
    return new Promise((resolve, reject) => {
      const sock = net.createConnection(this.port, this.host);
      let reply = '';
      sock.setTimeout(30000);
      sock.on('connect', () => {
        sock.write('zINSTREAM\0');
        const size = Buffer.alloc(4);
        size.writeUInt32BE(bytes.length, 0);
        sock.write(size);
        sock.write(bytes);
        sock.write(Buffer.from([0, 0, 0, 0])); // zero-length chunk = end
      });
      sock.on('data', (d) => { reply += d.toString(); });
      sock.on('end', () => { sock.destroy(); resolve(/FOUND/.test(reply) ? 'FLAGGED' : 'CLEAN'); });
      sock.on('timeout', () => { sock.destroy(); reject(new Error('clamav timeout')); });
      sock.on('error', (e) => { sock.destroy(); reject(e); });
    });
  }
}

// Returns the configured adapter, or null when unconfigured (worker is then DEGRADED).
export function getScanAdapter(): ScanAdapter | null {
  switch ((process.env.SCANNER_ADAPTER ?? '').toLowerCase()) {
    case 'fake': return new FakeScanAdapter();
    case 'clamav': return new ClamAvScanAdapter();
    default: return null;
  }
}
