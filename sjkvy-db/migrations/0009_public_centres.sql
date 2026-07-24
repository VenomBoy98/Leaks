-- 0009_public_centres.sql — public-safe centre listing for the campus/centres page.
-- Exposes ONLY non-sensitive fields (id, name, district) of ACTIVE centres via a
-- definer-owned view, with anon SELECT — no capacity, staff, settings or private data.
CREATE OR REPLACE VIEW app.v_public_centres
  WITH (security_invoker = false) AS
  SELECT id, name, district
  FROM app.centres
  WHERE is_active
  ORDER BY name;
REVOKE ALL ON app.v_public_centres FROM PUBLIC;
GRANT SELECT ON app.v_public_centres TO anon, authenticated;
