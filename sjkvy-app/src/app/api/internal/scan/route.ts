// POST /api/internal/scan — the TRUSTED SCANNER WORKER callback. Represents an internal
// antivirus/scanner service, NOT the browser. It requires a separate scanner credential
// (SCANNER_TOKEN) that the browser never holds, and it is UNAVAILABLE (404) in production —
// so a "fake clean" path is impossible in prod. A real production AV worker is a separate
// deployment that calls the backend scan-result service op directly; if none is configured,
// documents remain PENDING forever (never silently cleaned).
import { NextResponse } from "next/server";
import { scanResult } from "@/lib/serverApi";
import { timingSafeEqual } from "node:crypto";

function tokenOk(provided: string | null): boolean {
  const expected = process.env.SCANNER_TOKEN ?? "";
  if (!provided || !expected || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function POST(req: Request) {
  // The simulated scanner is impossible in production.
  if (process.env.NODE_ENV === "production") return new NextResponse("Not Found", { status: 404 });
  if (!tokenOk(req.headers.get("x-scanner-token"))) {
    return NextResponse.json({ code: "E.AUTHZ.FORBIDDEN", message: "Scanner credential required." }, { status: 401 });
  }
  const { version_id, verdict } = (await req.json().catch(() => ({}))) as { version_id?: string; verdict?: string };
  if (!version_id || !/^[0-9a-fA-F-]{36}$/.test(version_id) || (verdict !== "CLEAN" && verdict !== "FLAGGED")) {
    return NextResponse.json({ code: "E.VAL.FAILED", message: "version_id (uuid) and verdict (CLEAN|FLAGGED) required." }, { status: 422 });
  }
  const r = await scanResult(version_id, verdict);
  if (r.status >= 400) return NextResponse.json({ code: "E.SCAN.FAILED", message: "Scan callback failed." }, { status: r.status });
  return NextResponse.json({ version_id, scan_status: r.data?.scan_status ?? verdict });
}
