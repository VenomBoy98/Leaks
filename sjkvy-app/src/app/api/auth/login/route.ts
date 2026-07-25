// POST /api/auth/login — verify password (server-side) and, if valid, issue a login OTP.
import { NextResponse } from "next/server";
import { callAuth } from "@/lib/authServer";
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const { status, data } = await callAuth("login", { email: b.email, password: b.password });
  return NextResponse.json(data, { status });
}
