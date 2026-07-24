// POST /api/documents/upload — secure document upload BFF. Session-verified caller; validates
// size/extension/MIME; writes bytes to server storage; records the version via the service
// finalize op. The result is ALWAYS PENDING_SCAN — this route NEVER marks a file clean.
// Only the trusted scanner worker (separate credential, see /api/internal/scan) may set
// CLEAN/FLAGGED. Never returns or accepts a storage path, and never trusts a caller from body.
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { getCaller, finalizeUpload } from "@/lib/serverApi";

const STORAGE_DIR = process.env.SJKVY_DOC_STORAGE ?? join(process.cwd(), ".storage");
const MAX_BYTES = 10 * 1024 * 1024;
// allowed MIME → canonical extension (extension is derived server-side, never from filename)
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

// Minimal magic-byte sniff so a hostile MIME label can't smuggle a mismatched file.
function sniff(bytes: Buffer, mime: string): boolean {
  if (mime === "application/pdf") return bytes.slice(0, 5).toString("latin1") === "%PDF-";
  if (mime === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50;
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (mime === "image/webp") return bytes.slice(0, 4).toString("latin1") === "RIFF";
  return false;
}

export async function POST(req: Request) {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ code: "E.AUTHZ.FORBIDDEN", message: "Sign in required." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    application_id?: string; document_type?: string; mime?: string; content_base64?: string;
  };
  const { application_id, document_type, mime, content_base64 } = body;
  if (!application_id || !document_type || !mime || !content_base64) {
    return NextResponse.json({ code: "E.VAL.FAILED", message: "application_id, document_type, mime and content are required." }, { status: 422 });
  }
  if (!/^[0-9a-fA-F-]{36}$/.test(application_id) || !/^[A-Z_]{2,32}$/.test(document_type)) {
    return NextResponse.json({ code: "E.VAL.FAILED", message: "Invalid application id or document type." }, { status: 422 });
  }
  const ext = ALLOWED[mime];
  if (!ext) return NextResponse.json({ code: "E.VAL.FAILED", message: "Unsupported file type (PDF/JPG/PNG/WebP only)." }, { status: 422 });

  let bytes: Buffer;
  try {
    bytes = Buffer.from(content_base64, "base64");
  } catch {
    return NextResponse.json({ code: "E.VAL.FAILED", message: "Invalid file encoding." }, { status: 422 });
  }
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    return NextResponse.json({ code: "E.VAL.FAILED", message: "File is empty or too large (max 10MB)." }, { status: 422 });
  }
  if (!sniff(bytes, mime)) {
    return NextResponse.json({ code: "E.VAL.FAILED", message: "File contents do not match the declared type." }, { status: 422 });
  }

  const sha = createHash("sha256").update(bytes).digest("hex");
  // storage path is derived entirely server-side from a validated app id + content hash
  const rel = join(application_id, `${sha}.${ext}`);
  await mkdir(join(STORAGE_DIR, application_id), { recursive: true });
  await writeFile(join(STORAGE_DIR, rel), bytes);

  // Record the version (service op; caller from session, not body). Result is PENDING.
  const fin = await finalizeUpload({
    caller, application_id, document_type, storage_path: rel, mime, size: bytes.length, sha256: sha,
  });
  if (fin.status === 401 || fin.status === 403 || fin.status === 404) {
    return NextResponse.json({ code: "E.AUTHZ.FORBIDDEN", message: "You cannot upload to this application." }, { status: 403 });
  }
  if (fin.status >= 400 || !fin.data) {
    return NextResponse.json({ code: "E.DOC.FINALIZE", message: "Could not record the upload." }, { status: fin.status || 502 });
  }
  // NEVER auto-scan. The document is PENDING until the trusted scanner worker verdicts it.
  return NextResponse.json({
    document_type,
    version_id: fin.data.version_id,
    version_no: fin.data.version_no,
    scan_status: "PENDING_SCAN",
  });
}
