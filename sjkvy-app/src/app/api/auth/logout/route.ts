// POST /api/auth/logout — revoke the current opaque session and clear cookies.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { callAuth, clearSessionCookies, SESSION_COOKIE } from "@/lib/authServer";
export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) await callAuth("logout", { token });
  clearSessionCookies();
  return NextResponse.json({ ok: true });
}
