"use client";
// Admin (centre admin / super admin) portal shell — same handoff design language, real routing
// and the signed-in admin's identity. Nav mirrors the admin routes in nav-map.ts.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMe } from "@/lib/hooks";
import { logout } from "@/lib/api";

const NAV = [
  { href: "/admin-dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin-admissions", label: "Admissions", icon: "how_to_reg" },
  { href: "/admin-applications", label: "Applications", icon: "assignment" },
  { href: "/admin-programs", label: "Programs", icon: "school" },
  { href: "/admin-certificates", label: "Certificates", icon: "workspace_premium" },
  { href: "/admin-hostel", label: "Hostel", icon: "night_shelter" },
  { href: "/admin-reports", label: "Reports", icon: "insights" },
  { href: "/admin-settings", label: "Settings", icon: "settings" },
];

export default function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = useMe();
  return (
    <div className="min-h-screen bg-background text-on-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-sidebar-width flex-col bg-primary text-on-primary md:flex">
        <div className="px-6 py-6">
          <Link href="/admin-dashboard" className="font-display-md text-display-md font-bold text-on-primary">SJKVY</Link>
          <p className="font-caption text-on-primary/70">Centre Admin</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-3 font-body-md transition-colors ${active ? "bg-on-primary/15 font-semibold" : "hover:bg-on-primary/10"}`}>
                <span className="material-symbols-outlined">{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <button onClick={() => logout().finally(() => router.push("/login"))}
          className="m-3 flex items-center gap-3 rounded-lg px-3 py-3 font-body-md text-on-primary/90 hover:bg-on-primary/10">
          <span className="material-symbols-outlined">logout</span> Sign out
        </button>
      </aside>
      <div className="md:pl-sidebar-width">
        <header className="flex h-topbar-height items-center justify-between border-b border-secondary/10 bg-surface/70 px-margin-mobile backdrop-blur-md md:px-margin-desktop">
          <div>
            <h1 className="font-display-md text-headline-lg text-primary">{title}</h1>
            {subtitle && <p className="font-caption text-on-surface-variant">{subtitle}</p>}
          </div>
          <div className="text-right">
            <p className="font-label-md text-on-surface">{me?.full_name ?? "—"}</p>
            <p className="font-caption text-on-surface-variant">Administrator</p>
          </div>
        </header>
        <main className="mx-auto max-w-max-width px-margin-mobile py-8 md:px-margin-desktop">{children}</main>
      </div>
    </div>
  );
}
