-- 0011_docs_version_id.sql — expose the current document VERSION id to authorized document
-- readers so the staff verification UI can accept/reject a specific version. The checker's
-- decision (fn_decide_document) is keyed by document_version_id, but the only authenticated
-- read path (the definer view v_my_documents) previously projected the applicant_documents id
-- and version_no, not the version id. document_versions itself is RLS default-deny for
-- authenticated, so the view is the correct place to surface this.
--
-- Additive and safe: version_id is appended at the END (required by CREATE OR REPLACE VIEW),
-- the sensitive storage_path column remains excluded, and the same owner/checker/staff scope
-- is preserved verbatim. The version id is an opaque uuid, not a storage location.
CREATE OR REPLACE VIEW app.v_my_documents AS
  SELECT d.id, d.application_id, d.document_type_code, d.status,
         v.version_no, v.scan_status, v.created_at AS uploaded_at,
         v.id AS version_id
  FROM app.applicant_documents d
  LEFT JOIN app.document_versions v ON v.id = d.current_version_id
  WHERE app.fn_owns_application(d.application_id)
     OR app.fn_checker_for_app(d.application_id)
     OR app.fn_app_staff(d.application_id, ARRAY['counsellor','centre_admin']);
