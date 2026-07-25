// POST /api/auth/password/reset — verify reset OTP + set new password (revokes all sessions server-side).
import { NextResponse } from "next/server";
import { callAuth, clearSessionCookies } from "@/lib/authServer";
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { challengeId?: string; otp?: string; newPassword?: string; confirmPassword?: string };
  if (b.confirmPassword !== undefined && b.newPassword !== b.confirmPassword) {
    return NextResponse.json({ code: "E.VAL.PASSWORD", message: "Passwords do not match." }, { status: 422 });
  }
  const { status, data } = await callAuth("password/reset", { challengeId: b.challengeId, otp: b.otp, newPassword: b.newPassword });
  if (status === 200) clearSessionCookies();
  return NextResponse.json(data, { status });
}
