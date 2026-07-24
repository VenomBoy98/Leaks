// /api/proxy/* — a STRICTLY ALLOWLISTED gateway to the existing sjkvy-api. It attaches the
// httpOnly session token server-side (the browser never holds the JWT) and only forwards
// method+path combinations on an explicit allowlist of USER-facing endpoints. It can never be
// used to reach service-role operations (finalize/scan/view-url) or arbitrary paths, and it
// never accepts a caller/role/centre from the browser. UUID path params are validated.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API = (process.env.API_BASE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const U = "[0-9a-fA-F-]{36}"; // uuid path param

// Explicit allowlist: [method, RegExp for the full joined path]. Anything not listed → 403.
// Service-auth ops (documents/finalize, /scan-result, /view-url) are DELIBERATELY absent —
// they are only reachable through the dedicated, session-checked document BFF routes.
const ALLOW: Array<[string, RegExp]> = [
  ["GET", /^public\/courses$/],
  ["POST", /^public\/contact$/],
  ["GET", /^public\/centres$/],
  ["GET", /^verify\/[^/]{1,64}$/],
  ["GET", /^centres$/],
  ["GET", /^auth\/me$/],
  ["PATCH", /^auth\/me$/],
  ["GET", /^applications$/],
  ["POST", /^applications$/],
  ["GET", new RegExp(`^applications\\/${U}$`)],
  ["PATCH", new RegExp(`^applications\\/${U}\\/draft$`)],
  ["POST", new RegExp(`^applications\\/${U}\\/submit$`)],
  ["POST", new RegExp(`^applications\\/${U}\\/withdraw$`)],
  ["GET", new RegExp(`^applications\\/${U}\\/documents$`)],
  ["GET", new RegExp(`^applications\\/${U}\\/decisions$`)],
  ["GET", /^notifications$/],
  ["POST", new RegExp(`^notifications\\/${U}\\/read$`)],
  ["GET", /^enrolments$/],
  ["GET", /^verification\/cases$/],
  ["POST", new RegExp(`^verification\\/cases\\/${U}\\/assign$`)],
  ["POST", new RegExp(`^verification\\/cases\\/${U}\\/decisions$`)],
  ["POST", new RegExp(`^verification\\/cases\\/${U}\\/corrections$`)],
  ["POST", new RegExp(`^applications\\/${U}\\/admission$`)],
];

function isAllowed(method: string, path: string): boolean {
  return ALLOW.some(([m, re]) => m === method && re.test(path));
}

async function forward(req: Request, parts: string[]) {
  const path = parts.join("/");
  const method = req.method;
  if (parts.some((p) => p.includes("..") || p.toLowerCase().includes("%2f") || p.includes("\\"))) {
    return NextResponse.json({ code: "E.VAL.FAILED", message: "Bad path." }, { status: 400 });
  }
  if (!isAllowed(method, path)) {
    return NextResponse.json({ code: "E.AUTHZ.FORBIDDEN", message: "Not permitted." }, { status: 403 });
  }
  const token = cookies().get("sjkvy_token")?.value;
  const url = new URL(req.url);
  // forward only a whitelisted set of query params (pagination / filter / search)
  const allowedQ = new URLSearchParams();
  for (const k of ["limit", "cursor", "offset", "q", "status", "centre_id", "page"]) {
    const v = url.searchParams.get(k);
    if (v) allowedQ.set(k, v);
  }
  const qs = allowedQ.toString();
  const target = `${API}/${path}${qs ? `?${qs}` : ""}`;

  const headers: Record<string, string> = { accept: "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const idem = req.headers.get("idempotency-key");
  if (idem) headers["idempotency-key"] = idem;
  const body = method === "GET" || method === "HEAD" ? undefined : await req.text();
  if (body) headers["content-type"] = "application/json";

  const res = await fetch(target, { method, headers, body });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
      "x-content-type-options": "nosniff",
      "cache-control": "no-store",
    },
  });
}

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}
export async function POST(req: Request, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}
export async function PATCH(req: Request, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}
