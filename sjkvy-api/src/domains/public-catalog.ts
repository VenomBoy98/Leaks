// domain: applicants (public course catalog — anon)
// The only anonymous read the DB exposes for the public site's application form.
// Backed by the definer-owned view v_public_catalog (no sensitive columns).
import type { Operation } from '../operation.js';
import { obj, uuid } from '../schemas.js';

export const publicCatalogOps: Operation[] = [
  {
    domain: 'applicants',
    opId: 'catalog.centres',
    method: 'GET',
    path: '/public/centres',
    auth: 'none',
    summary: 'PUBLIC list of active centres (anon; via v_public_centres — public-safe fields only).',
    read: () => ({ text: `SELECT id, name, district FROM app.v_public_centres`, values: [] }),
    response: { type: 'object', properties: { items: { type: 'array', items: obj({ id: uuid, name: { type: 'string' }, district: { type: 'string' } }) } } },
    notes: 'anon GRANT SELECT on definer-owned view; no capacity/staff/settings exposed.',
  },

  {
    domain: 'applicants',
    opId: 'catalog.courses',
    method: 'GET',
    path: '/public/courses',
    auth: 'none',
    summary: 'PUBLIC list of active courses (anon; via v_public_catalog).',
    read: () => ({
      text: `SELECT id, code, name_en, name_hi FROM app.v_public_catalog ORDER BY code`,
      values: [],
    }),
    response: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: obj({
            id: uuid,
            code: { type: 'string' },
            name_en: { type: 'string' },
            name_hi: { type: 'string' },
          }),
        },
      },
    },
    notes: 'anon GRANT SELECT on definer-owned view; no other table is anon-readable.',
  },
];
