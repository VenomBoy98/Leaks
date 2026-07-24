-- 01_seed.sql — deterministic fixtures (superuser). All UUIDs valid hex.
INSERT INTO app.system_settings (key, value) VALUES
 ('default_centre_id', '"c0000000-0000-0000-0000-000000000001"'),
 ('offer_expiry_days','7'), ('idem_ttl_hours','48'), ('counselling_max_reschedules','1'),
 ('draft_expiry_days','30'), ('notif_max_attempts','3');
INSERT INTO app.eligibility_rules (min_age, max_age, required_gender) VALUES (18, 35, 'F');
INSERT INTO app.centres (id, name, address, district) VALUES
 ('c0000000-0000-0000-0000-000000000001','Hazaribagh Centre','Hurhuru Road','Hazaribagh'),
 ('c0000000-0000-0000-0000-000000000002','Other Centre','Elsewhere','Ranchi');
INSERT INTO app.courses (id, code, name_en, name_hi) VALUES
 ('aa000000-0000-0000-0000-000000000001','CRS1','Course One','Course One HI');
INSERT INTO app.course_versions (id, course_id, version_no, duration_weeks) VALUES
 ('ab000000-0000-0000-0000-000000000001','aa000000-0000-0000-0000-000000000001',1,13);
INSERT INTO app.batches (id, centre_id, course_version_id, code, capacity, start_date, end_date, status) VALUES
 ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',
  'ab000000-0000-0000-0000-000000000001','B1',2,current_date, current_date+90,'OPEN');
INSERT INTO app.document_types (code, name_en, name_hi) VALUES ('MATRIC','Matric','Matric HI');
INSERT INTO app.document_requirements (document_type_code, stage, is_required)
 VALUES ('MATRIC','APPLICATION', true);
INSERT INTO app.profiles (id, full_name, phone) VALUES
 ('a0000000-0000-0000-0000-00000000000a','Applicant A','+911111111111'),
 ('a0000000-0000-0000-0000-00000000000b','Applicant B','+912222222222'),
 ('50000000-0000-0000-0000-0000000000a1','Operator One','+913333333333'),
 ('50000000-0000-0000-0000-0000000000a2','Checker One','+914444444444'),
 ('50000000-0000-0000-0000-0000000000a3','Counsellor One','+915555555555'),
 ('50000000-0000-0000-0000-0000000000a4','CAD One','+916666666666'),
 ('50000000-0000-0000-0000-0000000000a5','CAD Two','+917777777777'),
 ('50000000-0000-0000-0000-0000000000a6','Trainer One','+918888888888'),
 ('50000000-0000-0000-0000-0000000000a7','Hostel One','+919999999999'),
 ('50000000-0000-0000-0000-0000000000a8','Placement One','+910000000000'),
 ('50000000-0000-0000-0000-0000000000a9','Super Admin','+910101010101');
INSERT INTO app.staff_memberships (profile_id, centre_id, role_code) VALUES
 ('50000000-0000-0000-0000-0000000000a1','c0000000-0000-0000-0000-000000000001','operator'),
 ('50000000-0000-0000-0000-0000000000a2','c0000000-0000-0000-0000-000000000001','checker'),
 ('50000000-0000-0000-0000-0000000000a3','c0000000-0000-0000-0000-000000000001','counsellor'),
 ('50000000-0000-0000-0000-0000000000a4','c0000000-0000-0000-0000-000000000001','centre_admin'),
 ('50000000-0000-0000-0000-0000000000a5','c0000000-0000-0000-0000-000000000002','centre_admin'),
 ('50000000-0000-0000-0000-0000000000a6','c0000000-0000-0000-0000-000000000001','trainer'),
 ('50000000-0000-0000-0000-0000000000a7','c0000000-0000-0000-0000-000000000001','hostel_manager'),
 ('50000000-0000-0000-0000-0000000000a8','c0000000-0000-0000-0000-000000000001','placement'),
 ('50000000-0000-0000-0000-0000000000a9','c0000000-0000-0000-0000-000000000001','super_admin');
INSERT INTO app.hostel_blocks (id, centre_id, name) VALUES
 ('4b000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','Block A');
INSERT INTO app.rooms (id, block_id, room_no) VALUES
 ('dd000000-0000-0000-0000-000000000001','4b000000-0000-0000-0000-000000000001','R1');
INSERT INTO app.beds (id, room_id, bed_no) VALUES
 ('4d000000-0000-0000-0000-0000000000b1','dd000000-0000-0000-0000-000000000001','1'),
 ('4d000000-0000-0000-0000-0000000000b2','dd000000-0000-0000-0000-000000000001','2');
