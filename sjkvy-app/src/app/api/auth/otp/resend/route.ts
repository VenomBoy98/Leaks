// POST /api/auth/otp/resend — resend an OTP for an existing challenge (respects cooldown).
import { NextResponse } from "next/server";
import { callAuth } from "@/lib/authServer";
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { challengeId?: string };
  const { status, data } = await callAuth("otp/resend", { challengeId: b.challengeId });
  return NextResponse.json(data, { status });
}
