// Dev-login must be unavailable (404) in production. The route reads NODE_ENV at call time,
// so we just toggle it and invoke the handlers. server-only is stubbed for the node test env.
import { describe, it, expect, afterEach, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: () => ({ set: () => {}, get: () => undefined, delete: () => {} }) }));

import { POST, GET } from "../src/app/api/dev-login/route";

const ORIG = process.env.NODE_ENV;
afterEach(() => { (process.env as Record<string, string>).NODE_ENV = ORIG ?? "test"; });

const post = () =>
  POST(new Request("http://localhost/api/dev-login", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: "admin" }),
  }));

describe("dev-login production restriction", () => {
  it("returns 404 when NODE_ENV=production", async () => {
    (process.env as Record<string, string>).NODE_ENV = "production";
    expect((await post()).status).toBe(404);
  });
  it("GET is always 404 (endpoint invisible to probing)", async () => {
    expect((await GET()).status).toBe(404);
  });
  it("is 403 (not 200) when DEV_AUTH is not enabled in non-prod", async () => {
    (process.env as Record<string, string>).NODE_ENV = "test";
    const prev = process.env.DEV_AUTH;
    delete (process.env as Record<string, string>).DEV_AUTH;
    expect((await post()).status).toBe(403);
    if (prev) (process.env as Record<string, string>).DEV_AUTH = prev;
  });
});
