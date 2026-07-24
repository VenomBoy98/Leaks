-- seed-demo.sql — makes the four dev sign-in users (applicant/student/staff/admin) resolve
-- to real backend relationships so their portals show live data. Run against the API's
-- database AFTER migrations + tests/plain/01_seed.sql + sql/auth_adapter.sql (the adapter
-- makes auth.uid() read request.jwt.claims — required for authenticated endpoints).
--   psql <db> -f ../sjkvy-api/sql/auth_adapter.sql
--   psql <db> -f scripts/seed-demo.sql
-- Role → profile mapping used by src/lib/session.ts:
--   applicant a0..0a · student a0..0b · staff 50..a1 (Operator) · admin 50..a4 (CAD One)
\set CID 'aa000000-0000-0000-0000-000000000001'
BEGIN;
INSERT INTO app.applicants (id, profile_id, full_name, phone, dob, gender, district, created_channel)
VALUES ('e1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000000a','Applicant A','+911111111111','2001-03-10','F','Ranchi','SELF')
ON CONFLICT (id) DO UPDATE SET profile_id=EXCLUDED.profile_id;
INSERT INTO app.applications (id, applicant_id, centre_id, course_id, status)
VALUES ('e3000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',:'CID','SUBMITTED')
ON CONFLICT (id) DO NOTHING;
INSERT INTO app.applicants (id, profile_id, full_name, phone, dob, gender, district, created_channel)
VALUES ('e1000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-00000000000b','Applicant B','+911111111112','2000-08-22','M','Dhanbad','SELF')
ON CONFLICT (id) DO UPDATE SET profile_id=EXCLUDED.profile_id;
INSERT INTO app.students (id, applicant_id, student_code, status)
VALUES ('e2000000-0000-0000-0000-000000000002','e1000000-0000-0000-0000-000000000002','SJKVY-STU-0002','ACTIVE')
ON CONFLICT (id) DO NOTHING;
INSERT INTO app.applications (id, applicant_id, centre_id, course_id, status)
VALUES ('e3000000-0000-0000-0000-000000000002','e1000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001',:'CID','DECIDED')
ON CONFLICT (id) DO NOTHING;
INSERT INTO app.enrolments (id, student_id, batch_id, application_id, status, joined_at)
VALUES ('e4000000-0000-0000-0000-000000000002','e2000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','e3000000-0000-0000-0000-000000000002','ACTIVE','2024-02-01')
ON CONFLICT (id) DO NOTHING;
COMMIT;
