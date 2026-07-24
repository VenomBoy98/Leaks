// auth.ts — derive the Actor (role + verified profile id) for each request.
//
// The API is the trust boundary that turns a bearer token into an identity; the
// database then enforces what that identity may do. Production JWT verification
// supports both symmetric (HS256 shared secret, e.g. Supabase legacy JWT secret) and
// asymmetric providers via JWKS (RS256/ES256: Supabase JWKS, Auth0, Cognito, …). The
// verified `sub` becomes request.jwt.claims -> auth.uid(); RLS/DEFINER do the rest.
import { jwtVerify, createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';
import { timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import type { Actor } from './db.js';
import type { Config } from './config.js';
import { ApiError } from './errors.js';

export type AuthMode = 'none' | 'user' | 'service';

// Lazily-built remote JWKS (cached + auto-rotating inside jose).
let jwks: JWTVerifyGetKey | undefined;
function getJwks(uri: string): JWTVerifyGetKey {
  jwks ??= createRemoteJWKSet(new URL(uri), {
    cooldownDuration: 30_000,
    cacheMaxAge: 600_000,
  });
  return jwks;
}

function bearer(req: FastifyRequest): string | null {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice(7).trim() || null;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function resolveActor(
  req: FastifyRequest,
  mode: AuthMode,
  cfg: Config,
): Promise<Actor> {
  if (mode === 'none') return { role: 'anon', uid: null };

  if (mode === 'service') {
    const token = bearer(req);
    if (!cfg.serviceToken || !token || !safeEqual(token, cfg.serviceToken)) {
      throw new ApiError(401, 'E.AUTHZ.FORBIDDEN', 'Service authentication required');
    }
    return { role: 'service_role', uid: null };
  }

  // mode === 'user'
  const token = bearer(req);
  if (!token) throw new ApiError(401, 'E.AUTHZ.FORBIDDEN', 'Authentication required');

  const opts = {
    issuer: cfg.jwt.issuer,
    audience: cfg.jwt.audience,
    algorithms: cfg.jwt.algorithms,
    clockTolerance: cfg.jwt.clockToleranceSec,
  } as const;

  try {
    const { payload } = cfg.jwt.jwksUri
      ? await jwtVerify(token, getJwks(cfg.jwt.jwksUri), opts)
      : await jwtVerify(token, new TextEncoder().encode(cfg.jwt.secret!), opts);

    const sub = payload.sub;
    if (!sub || typeof sub !== 'string') {
      throw new ApiError(401, 'E.AUTHZ.FORBIDDEN', 'Token missing subject');
    }
    // Reject a token that claims a privileged Postgres role: the API decides the DB
    // role from the auth MODE, never from token claims. This is defense-in-depth.
    const claimedRole = (payload as { role?: unknown }).role;
    if (claimedRole === 'service_role') {
      throw new ApiError(403, 'E.AUTHZ.FORBIDDEN', 'Illegal role claim');
    }
    return { role: 'authenticated', uid: sub };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'E.AUTHZ.FORBIDDEN', 'Invalid or expired token');
  }
}
