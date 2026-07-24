-- 00_harness.sql — TEST-ONLY environment stub. NEVER run in production/Supabase.
-- Provides: roles (anon/authenticated/service_role), auth.uid() reading a session GUC,
-- and an assertion framework. Run BEFORE migrations in a scratch database.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('test.jwt_sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth TO PUBLIC; GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;

CREATE SCHEMA IF NOT EXISTS app_test;
CREATE TABLE IF NOT EXISTS app_test.results (seq serial, name text, ok boolean, detail text);
GRANT USAGE ON SCHEMA app_test TO PUBLIC;
GRANT INSERT, SELECT ON app_test.results TO PUBLIC; GRANT USAGE ON SEQUENCE app_test.results_seq_seq TO PUBLIC;
CREATE OR REPLACE FUNCTION app_test.as_user(p uuid) RETURNS void LANGUAGE sql AS
$$ SELECT set_config('test.jwt_sub', coalesce(p::text,''), false) $$;
GRANT EXECUTE ON FUNCTION app_test.as_user(uuid) TO PUBLIC;
CREATE OR REPLACE FUNCTION app_test.check(p_name text, p_ok boolean, p_detail text DEFAULT '')
RETURNS void LANGUAGE sql AS
$$ INSERT INTO app_test.results(name, ok, detail) VALUES (p_name, coalesce(p_ok,false), p_detail) $$;
GRANT EXECUTE ON FUNCTION app_test.check(text,boolean,text) TO PUBLIC;
CREATE OR REPLACE FUNCTION app_test.expect_err(p_name text, p_sql text, p_want text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  PERFORM app_test.check(p_name, false, 'expected error, none raised');
EXCEPTION WHEN OTHERS THEN
  PERFORM app_test.check(p_name, position(p_want in SQLERRM) = 1, SQLERRM);
END $$;
GRANT EXECUTE ON FUNCTION app_test.expect_err(text,text,text) TO PUBLIC;
