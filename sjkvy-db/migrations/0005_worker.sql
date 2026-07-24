-- 0005_worker.sql — outbox worker support (additive; frozen migrations untouched).
-- The notification worker (src/worker) claims events via fn_outbox_claim and enqueues
-- notifications via fn_notification_enqueue (which marks the event processed). But an
-- event with no recipient/template needs to be marked processed too, otherwise it is
-- re-claimed forever. fn_notification_enqueue returns early for INAPP+null-recipient
-- WITHOUT marking processed, so we add an explicit, idempotent, service-only helper.
-- Same discipline as 0002/0003: SECURITY DEFINER, owner sjkvy_def, pinned search_path,
-- EXECUTE granted to service_role only.

CREATE OR REPLACE FUNCTION app.fn_outbox_mark_processed(p_event uuid) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN  -- [SYS] mark a claimed domain event processed (no-op if already processed)
  UPDATE app.domain_events SET processed_at = now()
   WHERE id = p_event AND processed_at IS NULL;
END $$;

-- [SYS] narrow recipient resolver so the worker never needs broad table grants:
-- returns ONLY the owning applicant's profile id for an application aggregate. This is
-- a purpose-built definer read (not a table grant); service_role keeps zero table access.
CREATE OR REPLACE FUNCTION app.fn_application_owner(p_app uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT ap.profile_id FROM app.applications a
   JOIN app.applicants ap ON ap.id = a.applicant_id WHERE a.id = p_app $$;

-- [SYS] PENDING notification feed for the delivery worker. Definer read so service_role
-- needs no SELECT grant on app.notifications (function-only access preserved).
-- NB: columns are alias-qualified (n.*) because RETURNS TABLE output-parameter names
-- (id, channel, …) would otherwise be ambiguous with the notifications columns.
CREATE OR REPLACE FUNCTION app.fn_pending_notifications(p_limit int)
RETURNS TABLE(id uuid, channel text, recipient_phone text, recipient_profile_id uuid,
              template_key text, params jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT n.id, n.channel, n.recipient_phone, n.recipient_profile_id, n.template_key, n.params
   FROM app.notifications n WHERE n.status = 'PENDING'
   ORDER BY n.created_at LIMIT coalesce(p_limit, 50) $$;

-- [SYS] resolve a recipient's email for the email channel provider (narrow definer read;
-- no table grant for service_role). Returns NULL when the profile has no email.
CREATE OR REPLACE FUNCTION app.fn_profile_email(p_profile uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT email FROM app.profiles WHERE id = p_profile AND is_active $$;

DO $$
DECLARE f record;
  fns text[] := ARRAY['fn_outbox_mark_processed','fn_application_owner',
                      'fn_pending_notifications','fn_profile_email'];
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p
           JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='app' AND p.proname = ANY(fns) LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO sjkvy_def', f.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
  END LOOP;
END $$;
