// domain: applicants (public contact/enquiry — anon). Minimal enquiry capture backed by the
// definer function app.fn_contact_submit (0008_contact_enquiry). Rate-limited; generic result.
import type { Operation } from '../operation.js';
import { reqStr } from '../operation.js';
import { obj, okResult } from '../schemas.js';

export const publicContactOps: Operation[] = [
  {
    domain: 'applicants',
    opId: 'contact.submit',
    method: 'POST',
    path: '/public/contact',
    auth: 'none',
    summary: 'PUBLIC contact/enquiry submission (anon; via fn_contact_submit).',
    fn: 'fn_contact_submit',
    rateLimit: { max: 5, timeWindow: '1 minute' },
    args: (ctx) => [
      reqStr(ctx.body.name, 'name'),
      reqStr(ctx.body.email, 'email'),
      reqStr(ctx.body.subject, 'subject'),
      reqStr(ctx.body.message, 'message'),
    ],
    request: obj(
      {
        name: { type: 'string', minLength: 1, maxLength: 120 },
        email: { type: 'string', minLength: 3, maxLength: 200 },
        subject: { type: 'string', minLength: 1, maxLength: 160 },
        message: { type: 'string', minLength: 5, maxLength: 4000 },
      },
      ['name', 'email', 'subject', 'message'],
    ),
    response: okResult,
    errors: ['E.VAL.FAILED'],
    notes: 'anon EXECUTE on definer fn; text stored raw, rendered escaped by consumers only.',
  },
];
