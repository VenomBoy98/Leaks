// POST /api/auth/password/forgot — always returns a generic result; issues a reset OTP only when appropriate.
import { NextResponse } from "next/server";
import { callAuth } from "@/lib/authServer";
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { email?: string };
  const { status, data } = await callAuth("password/forgot", { email: b.email });
  return NextResponse.json(data, { status });
}
