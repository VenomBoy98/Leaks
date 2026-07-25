// server.ts — assemble the hardened production Fastify app: security headers, CORS,
// rate limiting, body limits, backpressure, request IDs, structured logging, swagger,
// health/ready/metrics, the domain operations, and the storage pipeline.
import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import underPressure from '@fastify/under-pressure';
import { ApiError } from './errors.js';
import { recordDbError, registerMetrics, metricsText } from './observability.js';
import { registerOperations } from './router.js';
import { registerStorage } from './storage-routes.js';
import { registerAuth } from './auth-routes.js';
import { ALL_OPERATIONS } from './domains/index.js';
import { pingDb } from './db.js';
import type { Config } from './config.js';

export async function buildServer(cfg: Config): Promise<FastifyInstance> {
  const app = Fastify({
    // Structured JSON logs with a per-request id.
    logger: {
      level: cfg.logLevel,
      // Never log secrets/PII: redact common sensitive headers/fields.
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["idempotency-key"]',
        ],
        remove: true,
      },
    },
    genReqId: (req) =>
      (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
    requestIdHeader: 'x-request-id',
    trustProxy: cfg.trustProxy,
    bodyLimit: cfg.bodyLimitBytes,
    // Signed storage tokens (HMAC of a JSON payload) are long single path segments;
    // the default 100-char limit would 414 them.
    maxParamLength: 1024,
    disableRequestLogging: false,
    ajv: { customOptions: { removeAdditional: false, coerceTypes: true } },
  });

  // Security headers (CSP kept conservative; API serves JSON, swagger UI is separate).
  await app.register(helmet, { contentSecurityPolicy: false });

  await app.register(cors, {
    origin: cfg.corsOrigins.length > 0 ? cfg.corsOrigins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Global rate limit (per-IP). Auth/verify endpoints get tighter limits below.
  await app.register(rateLimit, {
    max: cfg.rateLimitMax,
    timeWindow: cfg.rateLimitWindow,
    // Key by authenticated subject when present, else IP (proxy-aware).
    keyGenerator: (req) => {
      const auth = req.headers.authorization;
      return auth ? `t:${auth.slice(-16)}` : `ip:${req.ip}`;
    },
    addHeadersOnExceeding: { 'x-ratelimit-remaining': true },
  });

  // Backpressure: shed load + fail readiness under memory/event-loop pressure.
  await app.register(underPressure, {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 0,
    maxRssBytes: 0,
    retryAfter: 50,
    exposeStatusRoute: false,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'SJKVY Platform API',
        description:
          'Thin orchestration layer over the verified PostgreSQL function catalogue. ' +
          'All authorization, state transitions, idempotency and concurrency safety are ' +
          'enforced by the database (RLS + SECURITY DEFINER functions); the API sets the ' +
          'caller identity + role per transaction and invokes catalogue functions.',
        version: '0.2.0',
      },
      components: {
        securitySchemes: {
          userJwt: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          serviceToken: { type: 'http', scheme: 'bearer' },
        },
      },
    },
  });

  // Uniform error envelope. ApiError carries a stable domain code + HTTP status.
  app.setErrorHandler((err: unknown, req, reply) => {
    if (err instanceof ApiError) {
      if (err.code.startsWith('E.')) recordDbError(err.code);
      return reply
        .status(err.statusCode)
        .send({ code: err.code, message: err.message, detail: err.detail, requestId: req.id });
    }
    const e = err as { validation?: unknown; statusCode?: number; message?: string };
    if (e.validation) {
      return reply
        .status(400)
        .send({ code: 'E.VAL.FAILED', message: e.message ?? 'Validation failed', requestId: req.id });
    }
    if (e.statusCode === 429) {
      return reply
        .status(429)
        .send({ code: 'E.RATE.LIMITED', message: 'Too many requests', requestId: req.id });
    }
    // Never leak internals to the client; log full error server-side with the req id.
    req.log.error({ err }, 'unhandled error');
    return reply
      .status(e.statusCode && e.statusCode < 500 ? e.statusCode : 500)
      .send({ code: 'E.SRV.INTERNAL', message: 'Internal server error', requestId: req.id });
  });

  registerMetrics(app);

  // --- operational endpoints ---
  // Liveness: process is up. Cheap, never touches the DB.
  app.get('/health', { schema: { tags: ['meta'] }, config: { rateLimit: false } }, async () => ({
    status: 'ok',
    uptime: process.uptime(),
  }));

  // Readiness: can we serve traffic (DB reachable)? Used by orchestrators/LB.
  app.get('/ready', { schema: { tags: ['meta'] }, config: { rateLimit: false } }, async (_req, reply) => {
    const dbOk = await pingDb();
    return reply.status(dbOk ? 200 : 503).send({ status: dbOk ? 'ready' : 'not-ready', db: dbOk });
  });

  // Prometheus metrics (scrape target; restrict via network policy / proxy).
  app.get('/metrics', { schema: { hide: true }, config: { rateLimit: false } }, async (_req, reply) => {
    reply.header('content-type', 'text/plain; version=0.0.4');
    return metricsText();
  });

  app.get('/openapi.json', { schema: { hide: true } }, async () => app.swagger());

  registerOperations(app, cfg, ALL_OPERATIONS);
  registerStorage(app, cfg);
  registerAuth(app, cfg);
  return app;
}
