// POST /api/auth/register — begin registration. Proxies to the service-authed API; returns the
// challenge (no session yet, no OTP value). The browser advances to the OTP step.
import { NextResponse } from "next/server";
import { callAuth } from "@/lib/authServer";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { name?: string; email?: string; password?: string; confirmPassword?: string };
  if (b.confirmPassword !== undefined && b.password !== b.confirmPassword) {
    return NextResponse.json({ code: "E.VAL.PASSWORD", message: "Passwords do not match." }, { status: 422 });
  }
  const { status, data } = await callAuth("register", { name: b.name, email: b.email, password: b.password });
  return NextResponse.json(data, { status });
}
