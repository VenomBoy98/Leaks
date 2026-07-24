"use client";
// Applicant portal shell — preserves the handoff design language (Sal-Forest-Green sidebar,
// ivory content, Playfair headings) with REAL routing (Next Link) and the signed-in user's
// real identity. Wraps every functional applicant screen.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMe, useNotifications } from "@/lib/hooks";
import { logout } from "@/lib/api";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/application", label: "Application", icon: "edit_note" },
  { href: "/documents", label: "Documents", icon: "description" },
  { href: "/timeline", label: "Timeline", icon: "hourglass_empty" },
  { href: "/notifications", label: "Notifications", icon: "notifications" },
  { href: "/profile", label: "Profile", icon: "person" },
];

export default function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = useMe();
  const { data: notifs } = useNotifications();
  const unread = (notifs ?? []).filter((n) => n.status !== "READ").length;

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-sidebar-width flex-col bg-primary text-on-primary md:flex">
        <div className="px-6 py-6">
          <Link href="/dashboard" className="font-display-md text-display-md font-bold text-on-primary">SJKVY</Link>
          <p className="font-caption text-on-primary/70">Applicant Portal</p>
        </div>
        <nav className="flex-1 px-3">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-3 font-body-md transition-colors ${active ? "bg-on-primary/15 font-semibold" : "hover:bg-on-primary/10"}`}>
                <span className="material-symbols-outlined">{n.icon}</span>
                <span>{n.label}</span>
                {n.href === "/notifications" && unread > 0 && (
                  <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 font-caption text-on-secondary">{unread}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <button onClick={() => logout().finally(() => router.push("/login"))}
          className="m-3 flex items-center gap-3 rounded-lg px-3 py-3 font-body-md text-on-primary/90 hover:bg-on-primary/10">
          <span className="material-symbols-outlined">logout</span> Sign out
        </button>
      </aside>

      {/* Main */}
      <div className="md:pl-sidebar-width">
        <header className="flex h-topbar-height items-center justify-between border-b border-secondary/10 bg-surface/70 px-margin-mobile backdrop-blur-md md:px-margin-desktop">
          <h1 className="font-display-md text-headline-lg text-primary">{title}</h1>
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="relative" aria-label="Notifications">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
              {unread > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-error" />}
            </Link>
            <div className="text-right">
              <p className="font-label-md text-on-surface">{me?.full_name ?? "—"}</p>
              <p className="font-caption text-on-surface-variant">Applicant</p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-max-width px-margin-mobile py-8 md:px-margin-desktop">{children}</main>
      </div>
    </div>
  );
}
