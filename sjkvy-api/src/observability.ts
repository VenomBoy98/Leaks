// observability.ts — Prometheus metrics + per-request instrumentation. Structured
// logging and request IDs are provided by Fastify's pino logger (configured in
// server.ts); this module adds the /metrics registry and HTTP histograms.
import client from 'prom-client';
import type { FastifyInstance } from 'fastify';

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

const httpRequests = new client.Counter({
  name: 'sjkvy_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [registry],
});

const httpDuration = new client.Histogram({
  name: 'sjkvy_http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

const dbErrors = new client.Counter({
  name: 'sjkvy_db_errors_total',
  help: 'Database-origin errors mapped to HTTP responses',
  labelNames: ['code'] as const,
  registers: [registry],
});

export function recordDbError(code: string): void {
  dbErrors.inc({ code });
}

export function registerMetrics(app: FastifyInstance): void {
  app.addHook('onResponse', async (req, reply) => {
    // Use the matched route template (low cardinality), not the raw URL.
    const route = (req.routeOptions?.url ?? req.url.split('?')[0]) as string;
    const labels = {
      method: req.method,
      route,
      status: String(reply.statusCode),
    };
    httpRequests.inc(labels);
    httpDuration.observe(labels, reply.elapsedTime / 1000);
  });
}

export async function metricsText(): Promise<string> {
  return registry.metrics();
}
