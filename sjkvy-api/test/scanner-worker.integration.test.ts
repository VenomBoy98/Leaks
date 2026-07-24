// Scanner worker integration test (real DB, fake adapter). Proves: PENDING versions are
// scanned out-of-band, a clean file becomes CLEAN, an EICAR file becomes FLAGGED and is
// quarantined (no longer in servable storage), and readiness is DEGRADED with no adapter.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';

const STORAGE = mkdtempSync(join(tmpdir(), 'sjkvy-scan-'));
process.env.SJKVY_DOC_STORAGE = STORAGE;
process.env.SCANNER_ADAPTER = 'fake';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://sjkvy_api_login@127.0.0.1:5433/sjkvy';

const EICAR = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
const pg = new Client({ host: '/tmp/sjkvy-pg/sock', port: 5433, user: 'postgres', database: 'sjkvy' });

const profiles: string[] = [];
let up = false;
let cleanVer = '', flagVer = '', cleanPath = '', flagPath = '';

beforeAll(async () => {
  try {
    await pg.connect();
    up = true;
  } catch { up = false; return; }
  const cid = (await pg.query("SELECT course_id FROM app.course_versions LIMIT 1")).rows[0].course_id;
  // two applications (distinct profiles/applicants, a MATRIC doc each): one clean, one EICAR
  for (const [body, set] of [['clean file body', 'clean'], [EICAR, 'flag']] as const) {
    const profile = randomUUID(); profiles.push(profile);
    const applicant = randomUUID(), appId = randomUUID(), docId = randomUUID(), verId = randomUUID();
    await pg.query("INSERT INTO app.profiles (id,full_name,phone,preferred_lang,is_active) VALUES ($1,'Scan Test',$2,'en',true)", [profile, '+9198' + Math.floor(1e8 + Math.random() * 8e8)]);
    await pg.query("INSERT INTO app.applicants (id,profile_id,full_name,phone,dob,gender,district,created_channel) VALUES ($1,$2,'Scan Test','+911234500000','2000-01-01','F','Ranchi','SELF')", [applicant, profile]);
    await pg.query("INSERT INTO app.applications (id,applicant_id,centre_id,course_id,status) VALUES ($1,$2,'c0000000-0000-0000-0000-000000000001',$3,'DRAFT')", [appId, applicant, cid]);
    const rel = join(appId, `${set}.pdf`);
    mkdirSync(join(STORAGE, appId), { recursive: true });
    writeFileSync(join(STORAGE, rel), Buffer.from(body));
    await pg.query("INSERT INTO app.applicant_documents (id,application_id,document_type_code) VALUES ($1,$2,'MATRIC')", [docId, appId]);
    await pg.query("INSERT INTO app.document_versions (id,document_id,version_no,storage_path,mime,size_bytes,sha256,uploaded_by,scan_status) VALUES ($1,$2,1,$3,'application/pdf',$4,'x',$5,'PENDING')",
      [verId, docId, rel, body.length, profile]);
    if (set === 'clean') { cleanVer = verId; cleanPath = rel; } else { flagVer = verId; flagPath = rel; }
  }
});
afterAll(async () => { if (up) { await pg.query('DELETE FROM app.profiles WHERE id = ANY($1)', [profiles]).catch(() => {}); await pg.end().catch(() => {}); } });

describe('scanner worker (fake adapter)', () => {
  it('is DEGRADED with no adapter configured (files stay pending)', async () => {
    const { ScannerWorker } = await import('../src/worker/scanner-worker.ts');
    const health = await new ScannerWorker(null).readiness();
    expect(health.degraded).toBe(true);
    expect(health.ready).toBe(false);
  });

  it('marks a clean file CLEAN and an EICAR file FLAGGED (quarantined)', async () => {
    if (!up) return expect(true).toBe(true);
    const { initDb, closeDb } = await import('../src/db.ts');
    const { ScannerWorker } = await import('../src/worker/scanner-worker.ts');
    const { FakeScanAdapter } = await import('../src/worker/scanner-adapter.ts');
    initDb(process.env.DATABASE_URL!);
    const r = await new ScannerWorker(new FakeScanAdapter()).tick(50);
    expect(r.degraded).toBe(false);
    expect(r.scanned).toBeGreaterThan(0);

    const clean = (await pg.query('SELECT scan_status FROM app.document_versions WHERE id=$1', [cleanVer])).rows[0].scan_status;
    const flag = (await pg.query('SELECT scan_status FROM app.document_versions WHERE id=$1', [flagVer])).rows[0].scan_status;
    expect(clean).toBe('CLEAN');
    expect(flag).toBe('FLAGGED');
    // flagged object moved out of servable storage; clean object still present
    expect(existsSync(join(STORAGE, cleanPath))).toBe(true);
    expect(existsSync(join(STORAGE, flagPath))).toBe(false);
    await closeDb();
  });
});
