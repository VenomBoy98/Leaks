// StitchContent — renders a Stitch page's exact exported markup (header, nav, sidebar,
// content, footer — everything, verbatim) plus its scoped CSS. The Stitch HTML is the
// canonical visual implementation and is preserved pixel-for-pixel; only the inline
// <script> behaviors are re-wired in React and a few unambiguous links are made to route
// (with NO change to any visible markup).
import { useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  html: string;
  css: string;
}

export default function StitchContent({ html, css }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Inject this page's original <style> only while the page is mounted, so page-specific
  // animation classes (e.g. .stagger-in, defined differently per page) never collide.
  useLayoutEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-stitch-page", "");
    el.textContent = css;
    document.head.appendChild(el);
    return () => {
      document.head.removeChild(el);
    };
  }, [css]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    window.scrollTo(0, 0);

    // Scroll-reveal: match each page's CSS (.reveal-up -> .active, .stagger-in -> .visible).
    const activate = (t: Element) => {
      if (t.classList.contains("reveal-up")) t.classList.add("active");
      if (t.classList.contains("stagger-in")) t.classList.add("visible");
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && activate(e.target)),
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    root.querySelectorAll(".reveal-up, .stagger-in").forEach((el) => io.observe(el));

    // Behavior re-wiring — NONE of this changes the rendered markup:
    //  - FAQ accordion (Stitch: onclick="toggleAccordion(this)" toggling .active)
    //  - in-page anchor smooth scroll
    //  - unambiguous cross-page routing (brand logo -> home, Portal/Applicant login -> /login)
    const onClick = (ev: Event) => {
      const el = ev.target as HTMLElement;

      const accBtn = el.closest(".accordion-item button");
      if (accBtn) {
        accBtn.closest(".accordion-item")?.classList.toggle("active");
        return;
      }

      const clickable = el.closest("a, button") as HTMLElement | null;
      if (clickable) {
        const text = (clickable.textContent || "").trim().toLowerCase();
        if (/portal login|login to portal|applicant portal|^login$|sign in/.test(text)) {
          ev.preventDefault();
          navigate("/login");
          return;
        }
        if (text === "sjkvy") {
          ev.preventDefault();
          navigate("/");
          return;
        }
        const href = clickable.getAttribute("href");
        if (href && href.startsWith("#") && href.length > 1) {
          const dest = root.querySelector(href) || document.querySelector(href);
          if (dest) {
            ev.preventDefault();
            dest.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    };
    root.addEventListener("click", onClick);
    return () => {
      io.disconnect();
      root.removeEventListener("click", onClick);
    };
  }, [html, navigate]);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
