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
];
