#!/usr/bin/env python3
"""SJKVY static security verification (EXECUTED in CI and locally; no DB required).
Checks: definer hardening, catalogue completeness, grant-list membership, policy coverage,
config-literal audit, fixture referential integrity, known-bug pattern scans, traceability."""
import re, glob, sys, json

M = {f: open(f).read() for f in sorted(glob.glob('migrations/*.sql'))}
T = {f: open(f).read() for f in sorted(glob.glob('tests/plain/*.sql'))}
ALL_MIG = '\n'.join(M.values())
fails = []
def chk(name, ok, detail=''):
    print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail and not ok else ''))
    if not ok: fails.append((name, detail))

# 1. every SECURITY DEFINER function block pins search_path
blocks = re.split(r'(?=CREATE OR REPLACE FUNCTION)', ALL_MIG)
bad_sp = [re.search(r'FUNCTION (app\.\w+)', b).group(1)
          for b in blocks if 'SECURITY DEFINER' in b
          and 'SET search_path' not in b and re.search(r'FUNCTION (app\.\w+)', b)]
chk('definer: all have pinned search_path', not bad_sp, ','.join(bad_sp))

# 2. function inventory vs required catalogue
inv = set(re.findall(r'CREATE OR REPLACE FUNCTION app\.(\w+)', ALL_MIG))
required = set('''fn_submit_application fn_withdraw_application fn_claim_assisted fn_reassign_assistance
fn_assign_checker fn_reassign_checker fn_decide_document fn_request_correction fn_resubmit_corrections
fn_fail_verification fn_counsel_schedule fn_counsel_reschedule fn_counsel_no_show fn_counsel_outcome
fn_admission_finalize fn_waitlist_promote fn_offer_accept fn_offer_decline fn_jobs_expire_offers
fn_jobs_expire_drafts fn_confirm_joining fn_mark_not_joined fn_transfer_enrolment fn_complete_enrolment
fn_drop_enrolment fn_lock_attendance fn_correct_attendance fn_finalize_assessment fn_hostel_request
fn_hostel_cancel fn_hostel_approve fn_hostel_allocate fn_hostel_transfer fn_hostel_discharge
fn_set_bed_status fn_cert_issue fn_cert_reissue fn_cert_revoke fn_cert_verify
fn_placement_profile_create fn_placement_withdraw fn_referral_create fn_referral_status
fn_outcome_record fn_event_join fn_notice_publish fn_staff_register fn_membership_grant
fn_membership_revoke fn_staff_deactivate fn_config_set fn_export_create fn_export_mark_downloaded
fn_audit_query fn_apply_phone_change fn_create_self_application fn_create_assisted_application
fn_save_draft fn_finalize_upload fn_scan_result fn_authorize_doc_view fn_notification_enqueue
fn_outbox_claim fn_delivery_record fn_idem_purge fn_eligibility_eval'''.split())
chk('catalogue: all required functions implemented', required <= inv,
    'missing=' + ','.join(sorted(required - inv)))

# 3. grants DO-block lists reference only existing functions
do_block = M['migrations/0003_functions_remaining.sql'].split('===== ownership')[-1]
listed = set(re.findall(r"'(\w+)'", do_block)) - {'app'}
ghost = {n for n in listed if n not in inv and n.startswith(('fn_','_'))}
chk('grants: sys/owner/anon lists reference existing functions', not ghost, ','.join(sorted(ghost)))

# 4. table → policy coverage (deny-by-default allowlist for intentional no-client tables)
tables = set(re.findall(r'CREATE TABLE app\.(\w+)', M['migrations/0000_schema.sql']))
pol_tables = set(re.findall(r'CREATE POLICY \w+ ON app\.(\w+)', ALL_MIG))
no_client = {'document_versions','domain_events','idempotency_keys','system_settings',
 'eligibility_rules','audit_events','delivery_attempts','waitlist_moves','enrolment_transfers',
 'hostel_transfers','attendance_corrections','roles','document_types','document_requirements',
 'counselling_outcomes'}
uncovered = tables - pol_tables - no_client
chk('RLS: every client table has a policy or is intentionally closed', not uncovered,
    ','.join(sorted(uncovered)))
chk('RLS: counselling_outcomes has SELECT policy (staff)', 'counselling_outcomes' in pol_tables)

# 5. config-literal audit: flag scalar jsonb extraction bug + list coalesce fallbacks
bug_sites = re.findall(r"\(value->>0\)|value->>0", ALL_MIG)
chk("config: no jsonb scalar 'value->>0' extraction bug (must be #>> '{}')", not bug_sites,
    f'{len(bug_sites)} site(s)')
fallbacks = sorted(set(re.findall(r"coalesce\(app\.fn_config_int\('(\w+)'\),\s*(\d+)\)", ALL_MIG)))
print('INFO  config fallback defaults (class-A technical):',
      ', '.join(f'{k}={v}' for k,v in fallbacks))

# 6. test-suite known-bug pattern: INSERT ... RETURNING used as scalar subquery
bad_ins = [f for f,x in T.items()
           if len(re.findall(r"\(\s*INSERT\b", x)) > len(re.findall(r"AS\s*\(\s*INSERT\b", x))]
chk('tests: no INSERT-RETURNING-as-scalar-subquery pattern', not bad_ins, ','.join(bad_ins))

# 7. fixture referential integrity: every uuid used in t0* exists in seed or is a runtime key
seed_ids = set(re.findall(r"'([0-9a-f]{8}-[0-9a-f-]{27})'", T['tests/plain/01_seed.sql']))
missing = set()
for f,s in T.items():
    if not re.search(r't0\d', f): continue
    for u in set(re.findall(r"'([0-9a-f]{8}-[0-9a-f-]{27})'", s)):
        if u in seed_ids: continue
        if u.startswith(('11111111','22222222','33333333',
           '44444444','55555555','66666666','77777777','88888888','99999999','deadbeef',
           'a5000000','b0000000-0000-0000-0000-000000000002')): continue  # idem keys / created in-test
        missing.add((f,u))
chk('tests: all fixture UUIDs resolve to seed or in-test creations', not missing,
    '; '.join(f'{f}:{u}' for f,u in sorted(missing)))

# 8. traceability: mutation API ops → implementing function (op → fn map)
op2fn = {'application.submit':'fn_submit_application','application.withdraw':'fn_withdraw_application',
 'applicant.claim_assisted':'fn_claim_assisted','admission.reassign_assistance':'fn_reassign_assistance',
 'verify.assign':'fn_assign_checker','verify.reassign':'fn_reassign_checker',
 'verify.decide_document':'fn_decide_document','verify.request_correction':'fn_request_correction',
 'application.resubmit_corrections':'fn_resubmit_corrections','verify.fail':'fn_fail_verification',
 'counsel.schedule':'fn_counsel_schedule','counsel.reschedule':'fn_counsel_reschedule',
 'counsel.mark_no_show':'fn_counsel_no_show','counsel.record_outcome':'fn_counsel_outcome',
 'admission.finalize':'fn_admission_finalize','waitlist.promote':'fn_waitlist_promote',
 'offer.accept':'fn_offer_accept','offer.decline':'fn_offer_decline',
 'enrolment.confirm_joining':'fn_confirm_joining','enrolment.mark_not_joined':'fn_mark_not_joined',
 'enrolment.transfer':'fn_transfer_enrolment','enrolment.complete':'fn_complete_enrolment',
 'enrolment.drop':'fn_drop_enrolment','attendance.lock':'fn_lock_attendance',
 'attendance.correct':'fn_correct_attendance','assessment.finalize':'fn_finalize_assessment',
 'hostel.request':'fn_hostel_request','hostel.cancel_request':'fn_hostel_cancel',
 'hostel.approve':'fn_hostel_approve','hostel.allocate':'fn_hostel_allocate',
 'hostel.transfer':'fn_hostel_transfer','hostel.discharge':'fn_hostel_discharge',
 'hostel.set_bed_status':'fn_set_bed_status','cert.issue':'fn_cert_issue',
 'cert.reissue':'fn_cert_reissue','cert.revoke':'fn_cert_revoke','cert.verify':'fn_cert_verify',
 'placement.create_profile':'fn_placement_profile_create','placement.withdraw_consent':'fn_placement_withdraw',
 'referral.create':'fn_referral_create','referral.update_status':'fn_referral_status',
 'outcome.record':'fn_outcome_record','event.join':'fn_event_join','notice.publish':'fn_notice_publish',
 'staff.create':'fn_staff_register','membership.grant':'fn_membership_grant',
 'membership.revoke':'fn_membership_revoke','staff.deactivate':'fn_staff_deactivate',
 'config.set':'fn_config_set','export.create':'fn_export_create',
 'export.download(audit)':'fn_export_mark_downloaded','audit.query':'fn_audit_query',
 'profile.confirm_phone_change':'fn_apply_phone_change',
 'application.create_self':'fn_create_self_application',
 'application.create_assisted':'fn_create_assisted_application','application.save_draft':'fn_save_draft',
 'doc.finalize_upload':'fn_finalize_upload','doc.scan_callback':'fn_scan_result',
 'doc.get_view_url(authz)':'fn_authorize_doc_view','jobs.expire_offers':'fn_jobs_expire_offers',
 'jobs.expire_drafts':'fn_jobs_expire_drafts','jobs.dispatch(enqueue)':'fn_notification_enqueue',
 'jobs.outbox_claim':'fn_outbox_claim','jobs.delivery_record':'fn_delivery_record',
 'eligibility.check':'fn_eligibility_eval'}
gaps = [(op,fn) for op,fn in op2fn.items() if fn not in inv]
chk(f'traceability: {len(op2fn)} mutation/eval ops → implementing function', not gaps,
    '; '.join(f'{o}->{f}' for o,f in gaps))
dw = ['attendance direct mark [DW p_att_ins/upd_trainer]','draft autosave [DW p_applications_upd_draft]',
 'read_at [DW p_notif_upd_read]','profile.update [DW p_profiles_upd_own]',
 'session create [DW p_sessions_ins_trainer]','results record [DW p_ares_ins_trainer]']
print('INFO  direct-write ops covered by policy (not functions):', len(dw))

print('\n===', 'ALL STATIC CHECKS PASS' if not fails else f'{len(fails)} FAILURE(S)', '===')
sys.exit(1 if fails else 0)
