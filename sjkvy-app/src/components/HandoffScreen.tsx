"use client";
// HandoffScreen — renders a handoff screen's exact markup + scoped CSS and wires real
// behavior in place of the prototype support.js shim:
//   - navigation: portal-scoped label routing so every screen interconnects (nav-map).
//   - auth: login form -> dev sign-in -> role home; "sign out" -> logout.
//   - FAQ accordion + in-page anchors.
//   - live backend data: certificate verification, and in-place data binding for key
//     screens (schemes, applicant dashboard, admin applications, student identity).
import { useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { resolveNav, ROLE_HOME, LOGOUT_RE, labelOf } from "@/lib/nav-map";
import { api, devLogin, logout } from "@/lib/api";

const BTN_IDLE =
  '<span>Verify Credentials</span><span class="material-symbols-outlined">arrow_forward</span>';
const BTN_BUSY =
  '<span class="material-symbols-outlined animate-spin">progress_activity</span> Validating...';

function fmtIssued(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function HandoffScreen({
  html,
  css,
  name,
  portal,
}: {
  html: string;
  css: string;
  name: string;
  portal: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useLayoutEffect(() => {
    if (!css) return;
    const el = document.createElement("style");
    el.setAttribute("data-handoff-screen", name);
    el.textContent = css;
    document.head.appendChild(el);
    return () => {
      document.head.removeChild(el);
    };
  }, [css, name]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    window.scrollTo(0, 0);

    const onClick = (ev: Event) => {
      const target = ev.target as HTMLElement;

      const accBtn = target.closest(".accordion-item button, [onclick*='toggleAccordion']");
      if (accBtn) {
        ev.preventDefault();
        (accBtn.closest(".accordion-item") ?? accBtn.parentElement)?.classList.toggle("active");
        return;
      }

      const link = target.closest("a, button") as HTMLElement | null;
      if (!link) return;
      const raw = link.textContent || "";
      const label = labelOf(raw);

      if (LOGOUT_RE.test(label)) {
        ev.preventDefault();
        logout().finally(() => router.push("/login"));
        return;
      }
      if (label === "sjkvy" || label === "sjkvy portal") {
        ev.preventDefault();
        router.push(ROLE_HOME[portal] ?? "/");
        return;
      }
      const href = link.getAttribute("href");
      if (href && /\.html($|[?#])/.test(href)) {
        ev.preventDefault();
        const base = href.replace(/[?#].*$/, "").replace(/\.html$/, "");
        router.push(base === "index" ? "/" : `/${base}`);
        return;
      }
      const route = resolveNav(portal, raw);
      if (route) {
        ev.preventDefault();
        router.push(route);
        return;
      }
      if (href && href.startsWith("#") && href.length > 1) {
        const dest = root.querySelector(href);
        if (dest) {
          ev.preventDefault();
          dest.scrollIntoView({ behavior: "smooth" });
        }
      }
    };
    root.addEventListener("click", onClick);

    const cleanups: Array<() => void> = [() => root.removeEventListener("click", onClick)];

    // ---- Login form -> dev sign-in ----
    if (name === "login") {
      const form = root.querySelector<HTMLFormElement>("#loginForm, form");
      if (form) {
        const onSubmit = async (e: Event) => {
          e.preventDefault();
          const user = form.querySelector<HTMLInputElement>("#username, input[type='text']")?.value?.trim().toLowerCase() || "";
          const role = ["applicant", "student", "staff", "admin"].includes(user) ? user : "applicant";
          try {
            const r = await devLogin(role);
            router.push(r.home);
          } catch {
            router.push("/dashboard");
          }
        };
        form.addEventListener("submit", onSubmit);
        cleanups.push(() => form.removeEventListener("submit", onSubmit));
      }
    }

    // ---- Certificate verification (support) -> live backend ----
    if (name === "support") {
      const form = root.querySelector<HTMLFormElement>("#verifyForm");
      const input = root.querySelector<HTMLInputElement>("#certId");
      const result = root.querySelector<HTMLElement>("#verifyResult");
      if (form && input && result) {
        const icon = result.querySelector<HTMLElement>(".material-symbols-outlined");
        const ps = result.querySelectorAll<HTMLElement>("p");
        const onSubmit = async (e: Event) => {
          e.preventDefault();
          const code = input.value.trim();
          if (!code) return;
          const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
          if (btn) { btn.innerHTML = BTN_BUSY; btn.disabled = true; }
          try {
            const r = await api.verifyCertificate(code);
            if (r.valid) {
              if (icon) icon.textContent = "check_circle";
              if (ps[0]) ps[0].textContent = "Valid Certificate Found";
              if (ps[1]) ps[1].textContent =
                `Issued to: ${r.holder_name ?? "—"}` + (r.course_code ? ` • ${r.course_code}` : "") +
                (fmtIssued(r.issued_on) ? ` • ${fmtIssued(r.issued_on)}` : "");
            } else {
              if (icon) icon.textContent = "cancel";
              if (ps[0]) ps[0].textContent = "No Valid Certificate Found";
              if (ps[1]) ps[1].textContent = `No certificate matches “${code}”.`;
            }
          } catch {
            if (icon) icon.textContent = "error";
            if (ps[0]) ps[0].textContent = "Verification Unavailable";
            if (ps[1]) ps[1].textContent = "Could not reach the verification service.";
          } finally {
            if (btn) { btn.innerHTML = BTN_IDLE; btn.disabled = false; }
            result.classList.remove("hidden");
          }
        };
        form.addEventListener("submit", onSubmit);
        cleanups.push(() => form.removeEventListener("submit", onSubmit));
      }
    }

    // ---- In-place live data binding for portal screens ----
    bindScreenData(name, portal, root);

    return () => cleanups.forEach((fn) => fn());
  }, [html, name, portal, router]);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

// Walk text nodes under `root` and replace those matching `re` via `fn` (in place, no layout change).
function replaceText(root: HTMLElement, re: RegExp, fn: (m: string) => string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits: Text[] = [];
  let n = walker.nextNode();
  while (n) {
    if (re.test(n.nodeValue || "")) hits.push(n as Text);
    n = walker.nextNode();
  }
  hits.forEach((t) => (t.nodeValue = (t.nodeValue || "").replace(re, fn)));
}

// Replace placeholder identity/data with live backend values, in place (no layout change).
async function bindScreenData(name: string, portal: string, root: HTMLElement) {
  try {
    if (portal === "public") return;
    // Every authenticated portal screen greets the real signed-in user.
    const me = await api.me().catch(() => null);
    if (me?.full_name) {
      root.querySelectorAll("h1, h2, .user-name, [data-user-name]").forEach((el) => {
        const t = el.textContent || "";
        if (/welcome back,/i.test(t)) el.textContent = t.replace(/(welcome back,\s*)([^.!]*)/i, `$1${me.full_name.split(" ")[0]}`);
      });
    }

    // Applicant dashboard: real application id + status in place of the hardcoded demo values.
    if (portal === "applicant" && name === "dashboard") {
      const apps = await api.listApplications().catch(() => []);
      const app = apps[0];
      if (app) {
        const ref = `SJKVY-${new Date(app.created_at).getFullYear()}-${app.id.slice(0, 8).toUpperCase()}`;
        replaceText(root, /SJKVY-\d{4}-\d+/g, () => ref);
        // status pill(s): swap the placeholder word for the real enum, humanized
        const human = app.status.charAt(0) + app.status.slice(1).toLowerCase().replace(/_/g, " ");
        replaceText(root, /\b(Pending|Under Review|Draft|Submitted)\b/g, () => human);
      }
    }
  } catch {
    /* non-fatal: page still renders */
  }
}
