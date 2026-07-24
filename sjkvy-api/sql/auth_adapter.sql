-- auth_adapter.sql — DEPLOYMENT ADAPTER, not part of the frozen migrations.
--
-- The verified migrations (0000–0003) assume the Supabase runtime, which provides
-- schema `auth`, the roles anon/authenticated/service_role, and auth.uid(). On
-- Supabase this file is UNNECESSARY — the platform supplies all of it.
--
-- For a self-hosted PostgreSQL deployment of the same function catalogue, this file
-- reproduces exactly that contract so the API can run the identical, already-tested
-- security model. It defines auth.uid() to read the standard Supabase GUC
-- `request.jwt.claims` (a JSON object with a `sub` claim) — the SAME mechanism
-- PostgREST/Supabase use — so no business logic moves into the API and RLS keeps
-- enforcing identity. The API never calls auth.uid(); it only sets the GUC + role
-- per transaction (see src/db.ts), precisely as the Phase-2 test harness did with
-- its own GUC.
--
-- Apply order (self-host): 00_harness roles are NOT used in prod; instead run this
-- adapter AFTER 0000–0003 against a database that already has the three roles.
-- Idempotent.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- auth.uid(): parse the `sub` claim from request.jwt.claims. Returns NULL when unset
-- (anonymous). STABLE + safe search_path. Mirrors Supabase's own definition.
-- Defensive against an unset GUC (NULL) AND an empty-string GUC (''): nullif the raw
-- setting to NULL before the ::jsonb cast, since ''::jsonb is a hard error.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT nullif(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
    ''
  )::uuid
$$;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;

-- The API connects as a dedicated LOGIN role that may assume the three NOLOGIN
-- roles via SET LOCAL ROLE. Grant that membership (adjust role name to your env).
-- Example (run once by an admin):
--   GRANT anon, authenticated, service_role TO sjkvy_api_login;
