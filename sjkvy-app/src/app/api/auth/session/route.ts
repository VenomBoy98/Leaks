// GET /api/auth/session — current auth state for the browser (roles + landing route), or 401.
import { NextResponse } from "next/server";
import { resolveCaller, landingRole, ROLE_HOME } from "@/lib/authServer";
export async function GET() {
  const caller = await resolveCaller();
  if (!caller) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, profileId: caller.profileId, roles: caller.roles, home: ROLE_HOME[landingRole(caller.roles)] });
}
