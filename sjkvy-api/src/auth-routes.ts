// auth-routes.ts — first-party auth endpoints. These are SERVICE-authed: only the Next BFF (which
// holds SERVICE_TOKEN) calls them, forwarding the real client IP. The BFF owns the opaque session
// cookie; these routes return data only. Generic error shapes avoid account enumeration; OTP
// values are never returned. Registered alongside the operation manifest in server.ts.
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Config } from './config.js';
import { createAuthRepo, AuthError } from './auth-repo.js';

function requireService(req: FastifyRequest, cfg: Config): void {
  const h = req.headers.authorization;
  const token = h && h.startsWith('Bearer ') ? h.slice(7) : undefined;
  if (!cfg.serviceToken || token !== cfg.serviceToken) {
    throw new AuthError(401, 'E.AUTHZ.FORBIDDEN', 'Service authentication required.');
  }
}
const clientIp = (req: FastifyRequest): string =>
  (req.headers['x-real-ip'] as string) || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '0.0.0.0';

async function handle(reply: FastifyReply, fn: () => Promise<unknown>): Promise<void> {
  try {
    const out = await fn();
    reply.send(out);
  } catch (e) {
    if (e instanceof AuthError) { reply.status(e.status).send({ code: e.code, message: e.message }); return; }
    reply.log.error({ err: (e as Error).message }, 'auth route error');
    reply.status(500).send({ code: 'E.INTERNAL', message: 'Something went wrong.' });
  }
}

export function registerAuth(app: FastifyInstance, cfg: Config): void {
  const repo = createAuthRepo(cfg);
  const body = <T>(req: FastifyRequest): T => (req.body ?? {}) as T;
  // These endpoints are hidden from the public OpenAPI (service-only) and skip the global
  // per-IP limiter (they carry the BFF's IP; real limits are per end-user email/IP in the repo).
  const opts = { schema: { hide: true }, config: { rateLimit: false } };

  app.post('/auth/register', opts, async (req, reply) => {
    requireService(req, cfg);
    const b = body<{ name: string; email: string; password: string }>(req);
    await handle(reply, () => repo.register({ name: b.name, email: b.email, password: b.password, ip: clientIp(req) }));
  });

  app.post('/auth/register/verify', opts, async (req, reply) => {
    requireService(req, cfg);
    const b = body<{ challengeId: string; otp: string }>(req);
    await handle(reply, () => repo.verify({ challengeId: b.challengeId, otp: b.otp, ip: clientIp(req) }));
  });

  app.post('/auth/login', opts, async (req, reply) => {
    requireService(req, cfg);
    const b = body<{ email: string; password: string }>(req);
    await handle(reply, () => repo.login({ email: b.email, password: b.password, ip: clientIp(req) }));
  });

  app.post('/auth/login/verify', opts, async (req, reply) => {
    requireService(req, cfg);
    const b = body<{ challengeId: string; otp: string }>(req);
    await handle(reply, () => repo.verify({ challengeId: b.challengeId, otp: b.otp, ip: clientIp(req) }));
  });

  app.post('/auth/otp/resend', opts, async (req, reply) => {
    requireService(req, cfg);
    const b = body<{ challengeId: string }>(req);
    await handle(reply, () => repo.resend({ challengeId: b.challengeId, ip: clientIp(req) }));
  });

  app.post('/auth/password/forgot', opts, async (req, reply) => {
    requireService(req, cfg);
    const b = body<{ email: string }>(req);
    await handle(reply, () => repo.forgotPassword({ email: b.email, ip: clientIp(req) }));
  });

  app.post('/auth/password/reset', opts, async (req, reply) => {
    requireService(req, cfg);
    const b = body<{ challengeId: string; otp: string; newPassword: string }>(req);
    await handle(reply, () => repo.resetPassword({ challengeId: b.challengeId, otp: b.otp, newPassword: b.newPassword, ip: clientIp(req) }));
  });

  app.post('/auth/session/introspect', opts, async (req, reply) => {
    requireService(req, cfg);
    const b = body<{ token: string; csrf?: string }>(req);
    await handle(reply, async () => {
      const s = await repo.introspect(b.token);
      if (!s) throw new AuthError(401, 'E.AUTH.SESSION', 'Session invalid or expired.');
      return { profileId: s.profileId, roles: s.roles, csrfValid: b.csrf ? s.csrfValid(b.csrf) : undefined };
    });
  });

  app.post('/auth/logout', opts, async (req, reply) => {
    requireService(req, cfg);
    const b = body<{ token: string }>(req);
    await handle(reply, async () => { await repo.logout(b.token); return { ok: true }; });
  });
}
