// Contract test — every path the frontend api client calls must exist in the backend's
// generated OpenAPI (method + path), proving the client matches the implemented backend.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const openapi = JSON.parse(readFileSync(join(__dirname, "../../sjkvy-api/openapi.json"), "utf8")) as {
  paths: Record<string, Record<string, unknown>>;
};

// (method, client path template) pairs the api.ts layer uses. :id style → {id} for match.
const CALLS: Array<[string, string]> = [
  ["get", "/public/courses"],
  ["get", "/verify/{code}"],
  ["get", "/auth/me"],
  ["patch", "/auth/me"],
  ["get", "/applications"],
  ["get", "/applications/{id}"],
  ["post", "/applications"],
  ["patch", "/applications/{id}/draft"],
  ["post", "/applications/{id}/submit"],
  ["post", "/applications/{id}/withdraw"],
  ["get", "/verification/cases"],
  ["post", "/verification/cases/{caseId}/decisions"],
  ["post", "/documents/{versionId}/view-url"],
  ["post", "/applications/{id}/admission"],
  ["get", "/enrolments"],
  ["get", "/notifications"],
];

// Normalize a path template to {param} form regardless of param name.
const norm = (p: string) => p.replace(/\{[^}]+\}/g, "{}");

describe("frontend↔backend contract", () => {
  const specPaths = new Map<string, Set<string>>();
  for (const [p, methods] of Object.entries(openapi.paths)) {
    specPaths.set(norm(p), new Set(Object.keys(methods).map((m) => m.toLowerCase())));
  }
  for (const [method, path] of CALLS) {
    it(`${method.toUpperCase()} ${path} exists in the backend`, () => {
      const methods = specPaths.get(norm(path));
      expect(methods, `path ${path} missing from OpenAPI`).toBeTruthy();
      expect(methods!.has(method), `${method} not defined for ${path}`).toBe(true);
    });
  }
});
