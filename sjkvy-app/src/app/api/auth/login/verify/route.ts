// POST /api/auth/login/verify — verify the login OTP -> opaque session cookie.
import { NextResponse } from "next/server";
import { callAuth, setSessionCookies, landingRole, ROLE_HOME } from "@/lib/authServer";
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { challengeId?: string; otp?: string };
  const { status, data } = await callAuth<{ token: string; csrf: string; roles: string[]; expiresAt: string }>(
    "login/verify", { challengeId: b.challengeId, otp: b.otp });
  if (status !== 200) return NextResponse.json(data, { status });
  setSessionCookies(data);
  return NextResponse.json({ roles: data.roles, home: ROLE_HOME[landingRole(data.roles)] });
}
