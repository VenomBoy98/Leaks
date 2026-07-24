// Root layout — loads the exact handoff fonts (Playfair Display, Inter, Material Symbols
// Outlined) and the compiled Tailwind design system. Every screen renders inside this shell.
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SJKVY | Integrated Digital Ecosystem",
  description:
    "Saksham Jharkhand Kaushal Vikas Yojana — skill development platform: public site and role-based portals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Self-hosted fonts (Playfair Display, Inter, Material Symbols Outlined) — the
            production step the handoff README calls for; also makes the app fully offline-
            capable and avoids the Google Fonts CDN. */}
        <link href="/fonts/fonts.css" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background font-body-md selection:bg-secondary/30">
        {children}
      </body>
    </html>
  );
}
