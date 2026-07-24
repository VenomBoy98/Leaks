// gen-docs.ts — generate API_ENDPOINTS.md from the same operation manifest, so the
// endpoint-by-endpoint documentation can never drift from the implementation.
import { writeFileSync } from 'node:fs';
import { ALL_OPERATIONS, DOMAINS } from '../src/domains/index.js';
import type { Operation } from '../src/operation.js';

const AUTH_LABEL: Record<string, string> = {
  none: 'Public (anon)',
  user: 'User JWT (authenticated)',
  service: 'Service token (service_role)',
};

function dbBinding(op: Operation): string {
  if (op.fn) return `\`app.${op.fn}(...)\`${op.idempotent ? ' *(idempotent)*' : ''}`;
  if (op.write) return 'Direct write (column-limited RLS policy)';
  if (op.read) return 'RLS-scoped SELECT';
  return '—';
}

function schemaFields(schema: unknown): string {
  const s = schema as { properties?: Record<string, unknown>; required?: string[] } | undefined;
  if (!s?.properties) return '—';
  const req = new Set(s.required ?? []);
  return Object.keys(s.properties)
    .map((k) => (req.has(k) ? `\`${k}\`*` : `\`${k}\``))
    .join(', ');
}

function main(): void {
  const lines: string[] = [];
  lines.push('# SJKVY API — Endpoint Reference');
  lines.push('');
  lines.push(
    'Generated from the operation manifest (`src/domains/*`). Every mutation maps to a ' +
      'verified PostgreSQL catalogue function; reads are RLS-scoped SELECTs; a small set of ' +
      'direct writes use column-limited RLS policies. `*` marks required request fields. ' +
      'Idempotent operations require an `Idempotency-Key: <uuid>` header.',
  );
  lines.push('');
  lines.push(`**Total operations:** ${ALL_OPERATIONS.length}`);
  lines.push('');

  for (const domain of DOMAINS) {
    const ops = ALL_OPERATIONS.filter((o) => o.domain === domain);
    if (ops.length === 0) continue;
    lines.push(`## ${domain}`);
    lines.push('');
    for (const op of ops) {
      lines.push(`### \`${op.method} ${op.path}\` — ${op.summary}`);
      lines.push('');
      lines.push(`- **Operation id:** \`${op.opId}\``);
      lines.push(`- **Auth:** ${AUTH_LABEL[op.auth]}`);
      lines.push(`- **Database binding:** ${dbBinding(op)}`);
      if (op.request) lines.push(`- **Request body:** ${schemaFields(op.request)}`);
      if (op.paramsSchema) lines.push(`- **Path params:** ${schemaFields(op.paramsSchema)}`);
      if (op.querySchema) lines.push(`- **Query params:** ${schemaFields(op.querySchema)}`);
      lines.push(`- **Response:** ${op.response ? 'object' : op.read ? '`{ items: [...] }` (or single)' : 'object'}`);
      if (op.errors?.length) lines.push(`- **Error conditions:** ${op.errors.map((e) => `\`${e}\``).join(', ')}`);
      if (op.notes) lines.push(`- **Notes:** ${op.notes}`);
      lines.push('');
    }
  }

  writeFileSync('API_ENDPOINTS.md', lines.join('\n'));
  console.log(`wrote API_ENDPOINTS.md (${ALL_OPERATIONS.length} operations)`);
}

main();
