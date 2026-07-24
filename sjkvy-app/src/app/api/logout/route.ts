import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export async function POST() {
  const jar = cookies();
  jar.delete("sjkvy_token");
  jar.delete("sjkvy_role");
  return NextResponse.json({ ok: true });
}
