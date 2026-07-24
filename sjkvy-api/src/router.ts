// router.ts — registers every Operation onto Fastify. This is the single generic
// handler: resolve the actor (auth), build args/read from the manifest, run against
// the database via db.ts, translate errors. No domain logic lives here.
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { callFn, queryRead } from './db.js';
import { resolveActor } from './auth.js';
import { ApiError } from './errors.js';
import { isUuid, requestHash } from './idempotency.js';
import { errorResponse } from './schemas.js';
import type { Operation, OpCtx } from './operation.js';
import type { Config } from './config.js';

function buildCtx(req: FastifyRequest, uid: string | null, op: Operation): OpCtx {
  const body = (req.body ?? {}) as Record<string, unknown>;
  let idemKey: string | null = null;
  let idemHash: string | null = null;
  if (op.idempotent) {
    const hdr = req.headers['idempotency-key'];
    idemKey = typeof hdr === 'string' ? hdr : null;
    if (!isUuid(idemKey)) {
      throw new ApiError(
        400,
        'E.VAL.FAILED',
        'Idempotency-Key header (uuid) is required for this operation',
      );
    }
    idemHash = requestHash(op.method, req.url, body);
  }
  return {
    params: (req.params ?? {}) as Record<string, string>,
    query: (req.query ?? {}) as Record<string, unknown>,
    body,
    uid,
    idemKey,
    idemHash,
    req,
  };
}

export function registerOperations(
  app: FastifyInstance,
  cfg: Config,
  ops: Operation[],
): void {
  for (const op of ops) {
    app.route({
      method: op.method,
      url: op.path,
      // Per-route rate-limit override (e.g. public certificate verification).
      ...(op.rateLimit
        ? { config: { rateLimit: { max: op.rateLimit.max, timeWindow: op.rateLimit.timeWindow } } }
        : {}),
      // Attach the manifest schemas for Fastify validation + Swagger introspection.
      schema: {
        tags: [op.domain],
        summary: op.summary,
        operationId: op.opId.replace(/\./g, '_'),
        ...(op.paramsSchema ? { params: op.paramsSchema } : {}),
        ...(op.querySchema ? { querystring: op.querySchema } : {}),
        ...(op.request ? { body: op.request } : {}),
        response: {
          // Success schema (when declared). additionalProperties:true so the serializer
          // never strips fields the DB adds (e.g. idempotency's `replayed` marker).
          ...(op.response
            ? { [op.successStatus ?? 200]: { ...op.response, additionalProperties: true } }
            : {}),
          // Uniform error envelope documented for every endpoint (matches the global
          // error handler), so the OpenAPI is complete and error responses are consistent.
          '4xx': errorResponse,
          '5xx': errorResponse,
        },
      },
      handler: async (req: FastifyRequest, reply: FastifyReply) => {
        const actor = await resolveActor(req, op.auth, cfg);
        const ctx = buildCtx(req, actor.uid, op);

        // Read path: narrow RLS-scoped SELECT under the caller's role.
        if (op.read) {
          const q = op.read(ctx);
          const rows = await queryRead(actor, q.text, q.values);
          if (q.single) {
            if (rows.length === 0) {
              throw new ApiError(404, 'E.RES.NOT_FOUND', 'Not found');
            }
            return reply.send(rows[0]);
          }
          return reply.send({ items: rows });
        }

        // Direct-write path: column-limited INSERT/UPDATE authorized by RLS policy.
        if (op.write) {
          const q = op.write(ctx);
          const rows = await queryRead(actor, q.text, q.values);
          if (q.single) {
            if (rows.length === 0) {
              // WITH CHECK policy rejected the row (0 affected) — treat as forbidden
              // without leaking which condition failed.
              throw new ApiError(403, 'E.AUTHZ.FORBIDDEN', 'Forbidden');
            }
            return reply.status(op.successStatus ?? 200).send(rows[0]);
          }
          return reply.status(op.successStatus ?? 200).send({ items: rows });
        }

        // Mutation path: call a catalogue function positionally.
        if (op.fn && op.args) {
          const args = op.args(ctx);
          if (op.idempotent) args.push(ctx.idemKey, ctx.idemHash);
          const result = await callFn(actor, op.fn, args);
          return reply.status(op.successStatus ?? 200).send(result);
        }

        throw new ApiError(500, 'E.SRV.INTERNAL', 'Operation misconfigured');
      },
    });
  }
}
