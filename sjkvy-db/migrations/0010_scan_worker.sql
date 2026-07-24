-- 0010_scan_worker.sql — production antivirus scanning support for the existing worker
-- architecture. The scanner worker (service_role) claims PENDING document versions, scans the
-- bytes out-of-band, and records CLEAN/FLAGGED via fn_scan_result. Only this trusted backend
-- identity may set a verdict; browsers cannot. Attempts/failures are tracked for retry limits.
CREATE TABLE IF NOT EXISTS app.scan_jobs (
  version_id uuid PRIMARY KEY REFERENCES app.document_versions(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','SCANNING','DONE','FAILED')),
  attempts   int  NOT NULL DEFAULT 0,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE app.scan_jobs ENABLE ROW LEVEL SECURITY;   -- no public policies; definer-only

-- Claim a batch of pending versions for scanning (FOR UPDATE SKIP LOCKED, attempt-limited,
-- timeout-reclaimable). Marks each SCANNING and bumps attempts. Returns bytes location.
DROP FUNCTION IF EXISTS app.fn_scan_claim(int,int);
CREATE FUNCTION app.fn_scan_claim(p_limit int DEFAULT 10, p_max_attempts int DEFAULT 3)
RETURNS TABLE(o_version_id uuid, o_storage_path text, o_size_bytes int, o_attempts int)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN
  RETURN QUERY
  WITH claimable AS (
    SELECT dv.id AS vid, dv.storage_path AS sp, dv.size_bytes AS sz
    FROM app.document_versions dv
    LEFT JOIN app.scan_jobs sj ON sj.version_id = dv.id
    WHERE dv.scan_status = 'PENDING'
      AND coalesce(sj.attempts, 0) < p_max_attempts
      AND (sj.status IS NULL OR sj.status IN ('QUEUED','FAILED')
           OR (sj.status = 'SCANNING' AND sj.updated_at < now() - interval '5 minutes'))
    ORDER BY dv.created_at
    FOR UPDATE OF dv SKIP LOCKED
    LIMIT p_limit
  ), bumped AS (
    INSERT INTO app.scan_jobs (version_id, status, attempts, updated_at)
    SELECT vid, 'SCANNING', 1, now() FROM claimable
    ON CONFLICT (version_id) DO UPDATE SET status='SCANNING', attempts = app.scan_jobs.attempts + 1, updated_at = now()
    RETURNING scan_jobs.version_id AS vid, scan_jobs.attempts AS att
  )
  SELECT c.vid, c.sp, c.sz, b.att FROM claimable c JOIN bumped b ON b.vid = c.vid;
END $$;

-- Record a scan failure (worker error/timeout). Leaves the document PENDING/quarantined; when
-- attempts are exhausted the job is FAILED (still never CLEAN).
CREATE OR REPLACE FUNCTION app.fn_scan_fail(p_version uuid, p_error text, p_max_attempts int DEFAULT 3)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN
  UPDATE app.scan_jobs
     SET status = CASE WHEN attempts >= p_max_attempts THEN 'FAILED' ELSE 'QUEUED' END,
         last_error = left(coalesce(p_error,''), 500), updated_at = now()
   WHERE version_id = p_version;
END $$;

-- Mark a job DONE after a successful verdict (verdict itself recorded by fn_scan_result).
CREATE OR REPLACE FUNCTION app.fn_scan_done(p_version uuid)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN
  UPDATE app.scan_jobs SET status='DONE', last_error=NULL, updated_at=now() WHERE version_id = p_version;
END $$;

REVOKE ALL ON FUNCTION app.fn_scan_claim(int,int) FROM PUBLIC;
REVOKE ALL ON FUNCTION app.fn_scan_fail(uuid,text,int) FROM PUBLIC;
REVOKE ALL ON FUNCTION app.fn_scan_done(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.fn_scan_claim(int,int) TO service_role;
GRANT EXECUTE ON FUNCTION app.fn_scan_fail(uuid,text,int) TO service_role;
GRANT EXECUTE ON FUNCTION app.fn_scan_done(uuid) TO service_role;
