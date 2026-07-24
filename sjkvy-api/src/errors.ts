// errors.ts — translate database-raised domain errors into HTTP responses.
//
// The database is the source of truth for authorization and state-machine outcomes.
// It signals failures by RAISE EXCEPTION with a stable code prefix (see
// migrations/0001_foundation.sql helpers _nf/_inv/_req and the fn_* bodies):
//
//   E.RES.NOT_FOUND             -> 404  (also the deliberate non-leak mask for authz)
//   E.STATE.INVALID_TRANSITION  -> 409  (state machine rejected the transition)
//   E.STATE.ELIGIBILITY_FAILED  -> 422
//   E.VAL.FAILED                -> 422  (validation / missing docs)
//   E.CONFLICT.DUPLICATE        -> 409
//   E.CONFLICT.ALREADY_ACTIVE   -> 409
//   E.CONFLICT.CAPACITY_FULL    -> 409
//   E.AUTHZ.FORBIDDEN           -> 403  (rare: only where leaking existence is safe)
//   E.SRV.INTERNAL              -> 500
//
// Postgres privilege/RLS failures surface as SQLSTATE 42501 (permission denied) or
// "infinite recursion"/etc.; those are treated as 403/500 and never leak table info.

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
  }
}

interface PgError extends Error {
  code?: string; // SQLSTATE
  detail?: string;
}

const CODE_MAP: Record<string, number> = {
  'E.RES.NOT_FOUND': 404,
  'E.STATE.INVALID_TRANSITION': 409,
  'E.STATE.ELIGIBILITY_FAILED': 422,
  'E.VAL.FAILED': 422,
  'E.CONFLICT.DUPLICATE': 409,
  'E.CONFLICT.ALREADY_ACTIVE': 409,
  'E.CONFLICT.CAPACITY_FULL': 409,
  'E.AUTHZ.FORBIDDEN': 403,
  'E.SRV.INTERNAL': 500,
};

function parseDomainCode(message: string): string | undefined {
  const m = message.match(/E\.[A-Z]+\.[A-Z_]+/);
  return m?.[0];
}

// Optionally attach the structured DETAIL a function raised (e.g. {field, rule} or
// {docs_missing:[...]}), which is safe, non-PII context for the client.
function parseDetail(detail?: string): unknown {
  if (!detail) return undefined;
  try {
    return JSON.parse(detail);
  } catch {
    return undefined;
  }
}

export function mapPgError(err: unknown): ApiError {
  const e = err as PgError;
  const domain = parseDomainCode(e.message ?? '');
  if (domain && CODE_MAP[domain]) {
    return new ApiError(CODE_MAP[domain], domain, e.message, parseDetail(e.detail));
  }
  // SQLSTATE-level failures — never echo table/policy internals to the client.
  switch (e.code) {
    case '42501': // insufficient_privilege (grant/RLS deny)
      return new ApiError(403, 'E.AUTHZ.FORBIDDEN', 'Forbidden');
    case '23505': // unique_violation not caught by a function
      return new ApiError(409, 'E.CONFLICT.DUPLICATE', 'Conflict');
    case '23514': // check_violation
    case '23502': // not_null_violation (missing required column value)
    case '22P02': // invalid_text_representation (bad uuid/enum from client)
      return new ApiError(422, 'E.VAL.FAILED', 'Invalid input');
    case '23503': // foreign_key_violation
      return new ApiError(409, 'E.CONFLICT.DUPLICATE', 'Referential conflict');
    default:
      return new ApiError(500, 'E.SRV.INTERNAL', 'Internal server error');
  }
}
