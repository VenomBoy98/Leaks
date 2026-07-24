// GET /api/documents/file?p&exp&sig — serves a document only with a valid short-lived signature
// (issued by view-url). Also requires a session. The storage path is opaque to the browser.
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { getCaller, verifyViewSig } from "@/lib/serverApi";

const STORAGE_DIR = process.env.SJKVY_DOC_STORAGE ?? join(process.cwd(), ".storage");

export async function GET(req: Request) {
  const caller = await getCaller();
  if (!caller) return new NextResponse("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const p = url.searchParams.get("p") ?? "";
  const exp = url.searchParams.get("exp") ?? "";
  const sig = url.searchParams.get("sig") ?? "";
  if (!verifyViewSig(p, exp, sig)) return new NextResponse("Link expired or invalid", { status: 403 });
  // prevent path traversal — resolve and require containment within STORAGE_DIR
  const safe = normalize(p).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = join(STORAGE_DIR, safe);
  if (!full.startsWith(STORAGE_DIR)) return new NextResponse("Forbidden", { status: 403 });
  const ALLOWED: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
  const ext = safe.split(".").pop() ?? "";
  const type = ALLOWED[ext];
  if (!type) return new NextResponse("Forbidden", { status: 403 });
  try {
    const bytes = await readFile(full);
    return new NextResponse(bytes, {
      headers: {
        "content-type": type,
        "content-disposition": "inline",
        "x-content-type-options": "nosniff",
        "cache-control": "private, no-store, max-age=0",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
