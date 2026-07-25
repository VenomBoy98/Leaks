// domain: reports — scoped aggregate reads for the staff reports screen. Every aggregate is a
// GROUP BY over an RLS-protected table, so the counts reflect ONLY the rows the caller's role
// and centre may see — the browser never downloads raw private datasets to total them itself.
import type { Operation } from '../operation.js';

const groupByStatus = (table: string) => ({
  text: `SELECT status, count(*)::int AS n FROM app.${table} GROUP BY status ORDER BY status`,
  values: [] as unknown[],
});

export const reportsOps: Operation[] = [
  {
    domain: 'reports',
    opId: 'reports.verification',
    method: 'GET',
    path: '/reports/verification',
    auth: 'user',
    summary: 'Verification case volume by status (centre-scoped aggregate).',
    read: () => groupByStatus('verification_cases'),
    notes: 'GROUP BY over app.verification_cases; scoped by policy p_vcases_sel.',
  },
  {
    domain: 'reports',
    opId: 'reports.counselling',
    method: 'GET',
    path: '/reports/counselling',
    auth: 'user',
    summary: 'Counselling appointment outcomes by status (centre-scoped aggregate).',
    read: () => groupByStatus('counselling_appointments'),
    notes: 'GROUP BY over app.counselling_appointments; scoped by policy p_counsel_sel.',
  },
  {
    domain: 'reports',
    opId: 'reports.hostel_occupancy',
    method: 'GET',
    path: '/reports/hostel-occupancy',
    auth: 'user',
    summary: 'Bed occupancy by status (centre-scoped aggregate).',
    read: () => groupByStatus('beds'),
    notes: 'GROUP BY over app.beds; scoped by policy p_beds_sel.',
  },
  {
    domain: 'reports',
    opId: 'reports.certificates',
    method: 'GET',
    path: '/reports/certificates',
    auth: 'user',
    summary: 'Certificate issuance by status (centre-scoped aggregate).',
    read: () => groupByStatus('certificates'),
    notes: 'GROUP BY over app.certificates; scoped by policy p_cert_sel.',
  },
  {
    domain: 'reports',
    opId: 'reports.placement',
    method: 'GET',
    path: '/reports/placement',
    auth: 'user',
    summary: 'Placement referral outcomes by status (centre-scoped aggregate).',
    read: () => groupByStatus('placement_referrals'),
    notes: 'GROUP BY over app.placement_referrals; scoped by placement referral RLS.',
  },
  {
    domain: 'reports',
    opId: 'reports.processing_time',
    method: 'GET',
    path: '/reports/processing-time',
    auth: 'user',
    summary: 'Application processing time (submit → decision) computed in the DB, centre-scoped.',
    read: () => ({
      // Durations are aggregated server-side over RLS-protected applications, so the numbers
      // reflect only the caller's centre and are never derived from a partial client page.
      text: `SELECT count(*)::int AS decided,
                    round(avg(extract(epoch FROM (updated_at - submitted_at)) / 86400.0)::numeric, 1) AS avg_days,
                    round((percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM (updated_at - submitted_at)) / 86400.0))::numeric, 1) AS median_days,
                    round(max(extract(epoch FROM (updated_at - submitted_at)) / 86400.0)::numeric, 1) AS max_days
             FROM app.applications
             WHERE status = 'DECIDED' AND submitted_at IS NOT NULL`,
      values: [],
      single: true,
    }),
    notes: 'Aggregate over app.applications (submitted → decided); scoped by the applications RLS.',
  },
];
