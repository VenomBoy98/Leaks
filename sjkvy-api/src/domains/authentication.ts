// domain: authentication
// The API is the JWT trust boundary; identity issuance / OTP / sessions belong to the
// external auth provider (Supabase Auth or equivalent), NOT to this API or the DB.
// The DB exposes only: read own profile (RLS), update own profile (DW column grant),
// and confirm a phone change after the provider verified dual OTP ([SYS]).
import type { Operation } from '../operation.js';
import { reqStr } from '../operation.js';
import { obj, uuid, okResult } from '../schemas.js';

export const authenticationOps: Operation[] = [
  {
    domain: 'authentication',
    opId: 'auth.me',
    method: 'GET',
    path: '/auth/me',
    auth: 'user',
    summary: 'Return the authenticated caller’s profile (RLS: own row only).',
    read: () => ({
      text: `SELECT id, full_name, phone, email, preferred_lang, is_active,
                    created_at, updated_at
             FROM app.profiles WHERE id = auth.uid()`,
      values: [],
      single: true,
    }),
    response: obj({
      id: uuid,
      full_name: { type: 'string' },
      phone: { type: 'string' },
      email: { type: 'string', nullable: true },
      preferred_lang: { type: 'string', enum: ['hi', 'en'] },
      is_active: { type: 'boolean' },
    }),
    errors: ['E.RES.NOT_FOUND'],
    notes: 'Row scoped by policy p_profiles_sel (id = auth.uid()).',
  },
  {
    domain: 'authentication',
    opId: 'profile.update',
    method: 'PATCH',
    path: '/auth/me',
    auth: 'user',
    summary: 'Update own profile display fields (DW: full_name, preferred_lang only).',
    write: (ctx) => ({
      // Column grant permits only these two columns; policy p_profiles_upd_own checks
      // id = auth.uid(). Immutable columns (phone/email/id) are ungranted.
      text: `UPDATE app.profiles
             SET full_name = coalesce($1, full_name),
                 preferred_lang = coalesce($2, preferred_lang)
             WHERE id = auth.uid()
             RETURNING id, full_name, preferred_lang`,
      values: [ctx.body.full_name ?? null, ctx.body.preferred_lang ?? null],
      single: true,
    }),
    request: obj({
      full_name: { type: 'string' },
      preferred_lang: { type: 'string', enum: ['hi', 'en'] },
    }),
    response: obj({ id: uuid, full_name: { type: 'string' }, preferred_lang: { type: 'string' } }),
    errors: ['E.AUTHZ.FORBIDDEN'],
    notes: 'Direct write via column GRANT (full_name, preferred_lang) + policy p_profiles_upd_own.',
  },
  {
    domain: 'authentication',
    opId: 'profile.confirm_phone_change',
    method: 'POST',
    path: '/auth/phone-change/confirm',
    auth: 'service',
    summary:
      'Confirm a verified phone change ([SYS]; provider verifies dual OTP first).',
    fn: 'fn_apply_phone_change',
    args: (ctx) => [reqStr(ctx.body.caller, 'caller'), reqStr(ctx.body.new_phone, 'new_phone')],
    request: obj({ caller: uuid, new_phone: { type: 'string' } }, ['caller', 'new_phone']),
    response: okResult,
    errors: ['E.RES.NOT_FOUND', 'E.CONFLICT.DUPLICATE'],
    notes:
      'service_role only. The auth provider performs OTP on both old and new numbers; ' +
      'this endpoint just applies the already-verified change atomically.',
  },
];
