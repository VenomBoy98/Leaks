-- pgTAP equivalents for CI (requires: CREATE EXTENSION pgtap). Mirrors t01 core assertions.
BEGIN; SELECT plan(4);
SELECT ok(NOT EXISTS (SELECT 1 FROM app.profiles), 'anon sees no profiles')
  FROM (SELECT set_config('test.jwt_sub','',false)) s;
SELECT lives_ok($$SELECT app.fn_cert_verify('NOPE')$$, 'public verify callable');
SELECT is((app.fn_cert_verify('NOPE')->>'valid'), 'false', 'unknown code uniform false');
SELECT throws_like($$INSERT INTO app.audit_events (action,target_type) VALUES ('x','y')$$,
  '%permission denied%', 'client audit insert denied');
SELECT finish(); ROLLBACK;
