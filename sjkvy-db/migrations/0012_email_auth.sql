-- 0012_email_auth.sql — first-party password + email-OTP authentication.
-- Adopted from the planned "email auth" design and numbered 0012 so it sorts AFTER every
-- already-applied migration (0000-0005, 0008-0011) — the ledger applies it last with no
-- out-of-order concern. Purely additive (new tables) plus a CHECK-preserving repair of the two
-- membership functions (signatures verified identical to the applied ones).
--
-- Secrets are stored ONLY as one-way digests (Argon2id password hash; HMAC-SHA256 OTP digest;
-- SHA-256 session/role-code token digests). All auth tables are service-only: RLS is enabled and
-- FORCED, all grants are revoked from anon/authenticated, and only service_role holds DML — the
-- API operates them inside transactions and the browser never gets direct table access.

-- Email-first accounts have no phone at registration time.
ALTER TABLE app.profiles ALTER COLUMN phone DROP NOT NULL;

CREATE TABLE app.auth_credentials (
  profile_id uuid PRIMARY KEY REFERENCES app.profiles(id) ON DELETE CASCADE,
  email_normalized text NOT NULL UNIQUE
    CHECK (email_normalized = lower(btrim(email_normalized))
       AND email_normalized ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  password_hash text NOT NULL CHECK (length(password_hash) BETWEEN 40 AND 512),
  email_verified_at timestamptz,
  failed_password_attempts integer NOT NULL DEFAULT 0
    CHECK (failed_password_attempts BETWEEN 0 AND 20),
  password_locked_until timestamptz,
  credential_version integer NOT NULL DEFAULT 1 CHECK (credential_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.auth_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES app.profiles(id) ON DELETE CASCADE,
  email_normalized text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('registration','login','password_reset')),
  otp_digest char(64) NOT NULL CHECK (otp_digest ~ '^[a-f0-9]{64}$'),
  ip_hash char(64) NOT NULL CHECK (ip_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  attempts_remaining integer NOT NULL CHECK (attempts_remaining BETWEEN 0 AND 10),
  delivered_at timestamptz,
  consumed_at timestamptz,
  credential_version integer NOT NULL CHECK (credential_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);
CREATE INDEX ix_auth_challenges_email_recent
  ON app.auth_challenges (email_normalized, created_at DESC);
CREATE INDEX ix_auth_challenges_ip_recent
  ON app.auth_challenges (ip_hash, created_at DESC);
CREATE INDEX ix_auth_challenges_profile_purpose
  ON app.auth_challenges (profile_id, purpose, created_at DESC);
-- At most one delivered, unconsumed challenge per (profile, purpose): a newly delivered OTP
-- must invalidate the previous one for the same purpose.
CREATE UNIQUE INDEX ux_auth_challenges_one_delivered_active
  ON app.auth_challenges (profile_id, purpose)
  WHERE delivered_at IS NOT NULL AND consumed_at IS NULL;

CREATE TABLE app.auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES app.profiles(id) ON DELETE CASCADE,
  token_digest char(64) NOT NULL UNIQUE CHECK (token_digest ~ '^[a-f0-9]{64}$'),
  csrf_digest char(64) NOT NULL CHECK (csrf_digest ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);
CREATE INDEX ix_auth_sessions_profile_active
  ON app.auth_sessions (profile_id, expires_at DESC) WHERE revoked_at IS NULL;

CREATE TABLE app.auth_role_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_digest char(64) NOT NULL UNIQUE CHECK (code_digest ~ '^[a-f0-9]{64}$'),
  centre_id uuid NOT NULL REFERENCES app.centres(id) ON DELETE RESTRICT,
  role_code text NOT NULL REFERENCES app.roles(code) ON DELETE RESTRICT
    CHECK (role_code <> 'super_admin'),
  expires_at timestamptz NOT NULL,
  max_uses integer NOT NULL DEFAULT 1 CHECK (max_uses BETWEEN 1 AND 1000),
  use_count integer NOT NULL DEFAULT 0 CHECK (use_count BETWEEN 0 AND max_uses),
  email_restriction text
    CHECK (email_restriction IS NULL
       OR (email_restriction = lower(btrim(email_restriction))
       AND email_restriction ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES app.profiles(id) ON DELETE RESTRICT,
  revoked_by uuid REFERENCES app.profiles(id) ON DELETE RESTRICT,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((revoked_at IS NULL AND revoked_by IS NULL)
      OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL))
);
CREATE INDEX ix_auth_role_codes_active
  ON app.auth_role_codes (expires_at) WHERE is_active AND revoked_at IS NULL;

CREATE TABLE app.auth_role_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES app.auth_role_codes(id) ON DELETE RESTRICT,
  profile_id uuid NOT NULL REFERENCES app.profiles(id) ON DELETE RESTRICT,
  membership_id uuid NOT NULL REFERENCES app.staff_memberships(id) ON DELETE RESTRICT,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code_id, profile_id)
);

CREATE TABLE app.auth_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES app.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (length(event_type) BETWEEN 3 AND 80),
  ip_hash char(64) CHECK (ip_hash IS NULL OR ip_hash ~ '^[a-f0-9]{64}$'),
  summary jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(summary) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_auth_security_events_profile
  ON app.auth_security_events (profile_id, created_at DESC);
CREATE INDEX ix_auth_security_events_type
  ON app.auth_security_events (event_type, created_at DESC);

ALTER TABLE app.auth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.auth_credentials FORCE ROW LEVEL SECURITY;
ALTER TABLE app.auth_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.auth_challenges FORCE ROW LEVEL SECURITY;
ALTER TABLE app.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.auth_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE app.auth_role_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.auth_role_codes FORCE ROW LEVEL SECURITY;
ALTER TABLE app.auth_role_code_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.auth_role_code_redemptions FORCE ROW LEVEL SECURITY;
ALTER TABLE app.auth_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.auth_security_events FORCE ROW LEVEL SECURITY;

REVOKE ALL ON app.auth_credentials, app.auth_challenges, app.auth_sessions,
  app.auth_role_codes, app.auth_role_code_redemptions, app.auth_security_events
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON app.auth_credentials, app.auth_challenges,
  app.auth_sessions, app.auth_role_codes, app.auth_role_code_redemptions
  TO service_role;
GRANT SELECT, INSERT ON app.auth_security_events TO service_role;

-- The first-party auth repository needs these narrow core-table permissions to create profiles,
-- resolve derived portal roles, and redeem staff role codes.
GRANT SELECT, INSERT, UPDATE ON app.profiles TO service_role;
GRANT SELECT ON app.roles, app.centres, app.applicants, app.students TO service_role;
GRANT SELECT, INSERT, UPDATE ON app.staff_memberships TO service_role;

-- Repair the "super admin anywhere" behavior of the manual membership console: the original
-- functions checked for a super-admin membership at the TARGET centre, preventing a platform
-- owner from managing a new centre. Centre admins remain limited to non-admin roles in their own
-- centre. (Signatures are identical to the applied versions — a safe CREATE OR REPLACE.)
CREATE OR REPLACE FUNCTION app.fn_membership_grant(
  p_profile uuid, p_centre uuid, p_role text, p_reason text
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  IF NOT (
    EXISTS (
      SELECT 1 FROM app.staff_memberships
       WHERE profile_id = auth.uid() AND role_code = 'super_admin' AND is_active
    )
    OR (
      app.fn_is_staff(p_centre, ARRAY['centre_admin'])
      AND p_role NOT IN ('centre_admin','super_admin')
    )
  ) THEN
    PERFORM app._nf();
  END IF;
  INSERT INTO app.staff_memberships (profile_id, centre_id, role_code)
  VALUES (p_profile, p_centre, p_role)
  ON CONFLICT (profile_id, centre_id, role_code)
  DO UPDATE SET is_active = true, deactivated_at = NULL, updated_at = now();
  PERFORM app.fn_audit('role.granted','profile', p_profile, p_reason,
    jsonb_build_object('role', p_role, 'centre', p_centre));
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_membership_revoke(
  p_profile uuid, p_centre uuid, p_role text, p_reason text
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  IF NOT (
    EXISTS (
      SELECT 1 FROM app.staff_memberships
       WHERE profile_id = auth.uid() AND role_code = 'super_admin' AND is_active
    )
    OR (
      app.fn_is_staff(p_centre, ARRAY['centre_admin'])
      AND p_role NOT IN ('centre_admin','super_admin')
    )
  ) THEN
    PERFORM app._nf();
  END IF;
  UPDATE app.staff_memberships
     SET is_active = false, deactivated_at = now(), updated_at = now()
   WHERE profile_id = p_profile AND centre_id = p_centre
     AND role_code = p_role AND is_active;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  PERFORM app.fn_audit('role.revoked','profile', p_profile, p_reason,
    jsonb_build_object('role', p_role, 'centre', p_centre));
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE TRIGGER tg_auth_security_events_appendonly
  BEFORE UPDATE OR DELETE ON app.auth_security_events
  FOR EACH ROW EXECUTE FUNCTION app.fn_raise_appendonly();
