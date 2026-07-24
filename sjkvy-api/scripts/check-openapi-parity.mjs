// check-openapi-parity.mjs — verifies the generated OpenAPI exactly matches the route
// surface the server actually registers: every manifest operation appears in the spec
// (method + path), the storage-pipeline routes appear, and the only "extra" spec paths
// are the known operational endpoints. Exits non-zero on any mismatch.
import { readFileSync } from 'node:fs';
import { ALL_OPERATIONS } from '../src/domains/index.js';

const spec = JSON.parse(readFileSync('openapi.json', 'utf8'));
const specPaths = new Set();
for (const [p, methods] of Object.entries(spec.paths ?? {})) {
  for (const m of Object.keys(methods)) specPaths.add(`${m.toUpperCase()} ${p}`);
}

// Fastify ':param' -> OpenAPI '{param}'
const toOpenApi = (path) => path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');

const problems = [];

// 1. every manifest operation is documented
for (const op of ALL_OPERATIONS) {
  const key = `${op.method} ${toOpenApi(op.path)}`;
  if (!specPaths.has(key)) problems.push(`manifest op missing from OpenAPI: ${key} (${op.opId})`);
}

// 2. the storage pipeline + operational routes are present or intentionally hidden
const knownExtra = new Set([
  'POST {applicationId}', // placeholder guard (never real)
]);
const storageAndOps = [
  'POST /documents/{applicationId}/upload-url',
  'POST /documents/{applicationId}/finalize',
  'GET /documents/{versionId}/download-url',
];
for (const s of storageAndOps) {
  if (!specPaths.has(s)) problems.push(`storage route missing from OpenAPI: ${s}`);
}

// 3. report spec paths that map to no manifest op and are not known operational routes
const manifestKeys = new Set(ALL_OPERATIONS.map((op) => `${op.method} ${toOpenApi(op.path)}`));
const opsAllowed = new Set([
  ...storageAndOps,
  // documented operational endpoints registered directly (not manifest ops)
  'GET /health',
  'GET /ready',
]);
for (const key of specPaths) {
  if (!manifestKeys.has(key) && !opsAllowed.has(key) && !knownExtra.has(key)) {
    // hidden routes (health/ready/metrics/openapi, storage gateway) are excluded from
    // the spec via schema.hide, so anything here is an undocumented surface.
    problems.push(`OpenAPI path not backed by a manifest op or known route: ${key}`);
  }
}

console.log(`manifest operations: ${ALL_OPERATIONS.length}`);
console.log(`openapi documented method+path pairs: ${specPaths.size}`);
if (problems.length === 0) {
  console.log('PARITY OK — OpenAPI matches the implemented route surface');
  process.exit(0);
}
console.log('PARITY PROBLEMS:');
for (const p of problems) console.log('  - ' + p);
process.exit(1);
