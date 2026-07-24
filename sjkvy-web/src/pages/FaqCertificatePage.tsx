// FaqCertificatePage — renders the faqCertificate Stitch page VERBATIM, and wires its
// certificate-verification form to the real backend (GET /verify/:code). The Stitch export
// shipped this form as a mock (a 1.5s timeout that always revealed the same static result);
// here the exact same UI — same button spinner, same #verifyResult container, same classes —
// is driven by a live API call. No markup is redesigned: on a hit we fill the existing
// result card with the real holder/date; on a miss we reuse the same card with a "not found"
// state. The page renders identically until the user submits.
import { useEffect, useRef } from "react";
import StitchContent from "@/lib/StitchContent";
import { html, css } from "./generated/faqCertificate";
import { verifyCertificate } from "@/lib/api";

// Exact button innerHTML from the Stitch export (restored after validating).
const BTN_IDLE =
  '<span>Verify Credentials</span><span class="material-symbols-outlined">arrow_forward</span>';
const BTN_BUSY =
  '<span class="material-symbols-outlined animate-spin">progress_activity</span> Validating...';

function formatIssued(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function FaqCertificatePage() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const form = root.querySelector<HTMLFormElement>("#verifyForm");
    const input = root.querySelector<HTMLInputElement>("#certId");
    const result = root.querySelector<HTMLElement>("#verifyResult");
    if (!form || !input || !result) return;

    // The result card's two lines (icon, title, subtitle) — reused for both states.
    const icon = result.querySelector<HTMLElement>(".material-symbols-outlined");
    const lines = result.querySelectorAll<HTMLElement>("p");
    const title = lines[0];
    const subtitle = lines[1];

    const onSubmit = async (e: Event) => {
      e.preventDefault();
      const code = input.value.trim();
      if (!code) return;
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (btn) {
        btn.innerHTML = BTN_BUSY;
        btn.disabled = true;
      }
      try {
        const r = await verifyCertificate(code);
        if (r.valid) {
          if (icon) icon.textContent = "check_circle";
          if (title) title.textContent = "Valid Certificate Found";
          if (subtitle) {
            const when = formatIssued(r.issued_on);
            subtitle.textContent =
              `Issued to: ${r.holder_name ?? "—"}` +
              (r.course_code ? ` • ${r.course_code}` : "") +
              (when ? ` • ${when}` : "");
          }
        } else {
          // Same card, "not found" state — no new design, just icon + copy swapped.
          if (icon) icon.textContent = "cancel";
          if (title) title.textContent = "No Valid Certificate Found";
          if (subtitle) subtitle.textContent = `No certificate matches “${code}”.`;
        }
      } catch {
        if (icon) icon.textContent = "error";
        if (title) title.textContent = "Verification Unavailable";
        if (subtitle) subtitle.textContent = "Could not reach the verification service. Please try again.";
      } finally {
        if (btn) {
          btn.innerHTML = BTN_IDLE;
          btn.disabled = false;
        }
        result.classList.remove("hidden");
        result.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  return (
    <div ref={wrapRef}>
      <StitchContent html={html} css={css} />
    </div>
  );
}
