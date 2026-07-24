// POST /api/documents/:versionId/view-url — returns a short-lived signed URL for viewing a
// document. Session-verified caller; the backend service op re-checks ownership/authorization;
// the raw storage path is never returned. A document that is not CLEAN (PENDING or FLAGGED)
// is never viewable. Body: { application_id, document_type } to confirm the CLEAN status of
// the exact document (version id is validated as a uuid path param).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCaller, authorizeView, signViewUrl } from "@/lib/serverApi";

const API = (process.env.API_BASE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");

export async function POST(req: Request, { params }: { params: { versionId: string } }) {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ code: "E.AUTHZ.FORBIDDEN", message: "Sign in required." }, { status: 401 });
  if (!/^[0-9a-fA-F-]{36}$/.test(params.versionId)) {
    return NextResponse.json({ code: "E.VAL.FAILED", message: "Invalid document reference." }, { status: 422 });
  }
  const { application_id, document_type } = (await req.json().catch(() => ({}))) as { application_id?: string; document_type?: string };
  if (!application_id || !document_type) {
    return NextResponse.json({ code: "E.VAL.FAILED", message: "application_id and document_type are required." }, { status: 422 });
  }

  // Confirm this document is CLEAN for the caller (their own token, RLS-scoped). PENDING or
  // FLAGGED documents are never viewable.
  const token = cookies().get("sjkvy_token")?.value;
  const list = await fetch(`${API}/applications/${application_id}/documents`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/json" },
  });
  if (!list.ok) return NextResponse.json({ code: "E.AUTHZ.FORBIDDEN", message: "Not authorized." }, { status: 403 });
  const rows = ((await list.json()).items ?? []) as Array<{ document_type_code: string; scan_status: string }>;
  const row = rows.find((d) => d.document_type_code === document_type);
  if (!row) return NextResponse.json({ code: "E.RES.NOT_FOUND", message: "Document not found." }, { status: 404 });
  if (row.scan_status !== "CLEAN") {
    return NextResponse.json({ code: "E.DOC.NOT_CLEAN", message: "This document is not available to view until it passes scanning." }, { status: 409 });
  }

  const r = await authorizeView(params.versionId, caller);
  if (r.status >= 400 || !r.data?.storage_path) {
    return NextResponse.json({ code: "E.AUTHZ.FORBIDDEN", message: "Not authorized to view this document." }, { status: r.status || 403 });
  }
  return NextResponse.json({ url: signViewUrl(r.data.storage_path), expires_in: 120 });
}
