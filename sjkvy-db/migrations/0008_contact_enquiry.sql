-- 0008_contact_enquiry.sql — minimal public contact/enquiry capture, using the existing
-- security model (RLS + a SECURITY DEFINER function; anon may only INSERT via the function,
-- never read). NOTE: 0006_security_repair.sql and 0007_email_auth.sql were referenced by the
-- integration brief but were never supplied to this repository; this contact migration is
-- numbered 0008 to avoid colliding with those reserved slots.
CREATE TABLE IF NOT EXISTS app.contact_enquiries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  subject     text NOT NULL,
  message     text NOT NULL,
  status      text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','READ','CLOSED')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE app.contact_enquiries ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated SELECT/INSERT policies: the table is reachable only through the
-- definer function below (so raw inserts and reads are impossible for public roles).
REVOKE ALL ON app.contact_enquiries FROM PUBLIC;

CREATE OR REPLACE FUNCTION app.fn_contact_submit(p_name text, p_email text, p_subject text, p_message text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_id uuid;
BEGIN
  -- server-side validation (defence in depth; the API validates too)
  IF p_name    IS NULL OR btrim(p_name)    = '' OR length(p_name)    > 120  THEN RAISE EXCEPTION 'E.VAL.FAILED'; END IF;
  IF p_email   IS NULL OR length(p_email)  > 200 OR p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN RAISE EXCEPTION 'E.VAL.FAILED'; END IF;
  IF p_subject IS NULL OR btrim(p_subject) = '' OR length(p_subject) > 160  THEN RAISE EXCEPTION 'E.VAL.FAILED'; END IF;
  IF p_message IS NULL OR length(btrim(p_message)) < 5 OR length(p_message) > 4000 THEN RAISE EXCEPTION 'E.VAL.FAILED'; END IF;
  -- text is stored raw and only ever rendered escaped by consumers (no HTML execution here)
  INSERT INTO app.contact_enquiries (name, email, subject, message)
  VALUES (btrim(p_name), lower(btrim(p_email)), btrim(p_subject), p_message)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true);  -- generic success; never leaks the row id to anon
END $$;
REVOKE ALL ON FUNCTION app.fn_contact_submit(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.fn_contact_submit(text,text,text,text) TO anon, authenticated;
