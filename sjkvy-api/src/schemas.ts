// schemas.ts — small reusable JSON Schema fragments for request/response bodies.
// Kept intentionally light: the database is the authoritative validator (CHECK
// constraints, enums, state machine). These schemas give clean 400s for obvious
// client mistakes and populate the OpenAPI document.
export const uuid = { type: 'string', format: 'uuid' } as const;
export const isoDate = { type: 'string', format: 'date' } as const;
export const isoDateTime = { type: 'string', format: 'date-time' } as const;

export const okResult = {
  type: 'object',
  properties: { ok: { type: 'boolean' } },
} as const;

// The uniform error envelope every 4xx/5xx returns (see src/server.ts setErrorHandler).
// additionalProperties:true so the serializer never strips requestId/detail.
export const errorResponse = {
  type: 'object',
  properties: {
    code: { type: 'string', example: 'E.STATE.INVALID_TRANSITION' },
    message: { type: 'string' },
    detail: {},
    requestId: { type: 'string' },
  },
  required: ['code', 'message'],
  additionalProperties: true,
} as const;

export function obj(
  properties: Record<string, unknown>,
  required: string[] = [],
): Record<string, unknown> {
  return { type: 'object', properties, required, additionalProperties: false };
}

export function list(itemProps: Record<string, unknown>): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      items: { type: 'array', items: { type: 'object', properties: itemProps } },
    },
  };
}
