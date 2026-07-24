// POST /api/dev-login { role } — DEVELOPMENT/TEST ONLY dev sign-in.
// Hard rule: unavailable (404) in production, regardless of any other flag. It mints the
// backend JWT for a seeded role and stores it in an httpOnly cookie. It is NOT production
// authentication — a real provider implements src/lib/auth-adapter.ts instead.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mintToken, isRole, type AppRole } from "@/lib/session";
import { ROLE_HOME } from "@/lib/nav-map";

function devAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DEV_AUTH === "true";
}

export async function POST(req: Request) {
  // In production this route does not exist.
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (!devAllowed()) {
    return NextResponse.json({ error: "Dev auth disabled" }, { status: 403 });
  }
  const { role } = (await req.json().catch(() => ({}))) as { role?: string };
  const r: AppRole = role && isRole(role) ? role : "applicant";
  const token = await mintToken(r);
  const jar = cookies();
  const opts = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 8, secure: process.env.NODE_ENV !== "development" };
  jar.set("sjkvy_token", token, opts);
  jar.set("sjkvy_role", r, { ...opts, httpOnly: false });
  return NextResponse.json({ ok: true, role: r, home: ROLE_HOME[r] });
}

// Any non-POST (and prod probing) → 404, so the endpoint is invisible in production.
export async function GET() {
  return new NextResponse("Not Found", { status: 404 });
}
