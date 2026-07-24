// domains/index.ts — the complete operation manifest, assembled from all 14 domains.
// Order here is the order routes register and the order domains appear in docs/OpenAPI.
import type { Operation } from '../operation.js';
import { authenticationOps } from './authentication.js';
import { applicantsOps } from './applicants.js';
import { publicCatalogOps } from './public-catalog.js';
import { publicContactOps } from './public-contact.js';
import { documentsOps } from './documents.js';
import { verificationOps } from './verification.js';
import { counsellingOps } from './counselling.js';
import { admissionsOps } from './admissions.js';
import { joiningOps } from './joining.js';
import { attendanceOps } from './attendance.js';
import { hostelOps } from './hostel.js';
import { assessmentsOps } from './assessments.js';
import { certificatesOps } from './certificates.js';
import { placementOps } from './placement.js';
import { notificationsOps } from './notifications.js';
import { centreAdminOps } from './centre-administration.js';
import { reportsOps } from './reports.js';

export const ALL_OPERATIONS: Operation[] = [
  ...authenticationOps,
  ...applicantsOps,
  ...publicCatalogOps,
  ...publicContactOps,
  ...documentsOps,
  ...verificationOps,
  ...counsellingOps,
  ...admissionsOps,
  ...joiningOps,
  ...attendanceOps,
  ...hostelOps,
  ...assessmentsOps,
  ...certificatesOps,
  ...placementOps,
  ...notificationsOps,
  ...centreAdminOps,
  ...reportsOps,
];

export const DOMAINS = [
  'authentication',
  'applicants',
  'documents',
  'verification',
  'counselling',
  'admissions',
  'joining',
  'attendance',
  'hostel',
  'assessments',
  'certificates',
  'placement',
  'notifications',
  'centre-administration',
  'reports',
] as const;
