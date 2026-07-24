"use client";
// Public centres/campus page — real active-centre list from GET /public/centres (public-safe
// fields only). No hardcoded centre ids or availability claims. Editorial framing kept minimal.
import Link from "next/link";
import { Loading, ErrorState, EmptyState } from "@/components/ui/States";
import { useCentres } from "@/lib/hooks";

export default function CampusPage() {
  const { data, isLoading, error, mutate } = useCentres();
  return (
    <main className="min-h-screen bg-background text-on-background">
      <header className="flex h-topbar-height items-center justify-between border-b border-secondary/10 px-margin-mobile md:px-margin-desktop">
        <Link href="/" className="font-display-md text-display-md font-semibold text-primary">SJKVY</Link>
        <nav className="hidden gap-6 font-body-md text-on-surface-variant md:flex">
          <Link href="/schemes" className="hover:text-secondary">Programs</Link>
          <Link href="/support" className="hover:text-secondary">Support</Link>
          <Link href="/contact" className="hover:text-secondary">Contact</Link>
        </nav>
      </header>
      <div className="mx-auto max-w-max-width px-margin-mobile py-12 md:px-margin-desktop">
        <p className="font-label-md uppercase tracking-widest text-secondary">Our network</p>
        <h1 className="mt-2 font-display-md text-display-md text-primary">Skill development centres</h1>
        <p className="mt-2 max-w-2xl font-body-lg text-on-surface-variant">Training centres delivering SJKVY programs across Jharkhand.</p>

        <div className="mt-8">
          {isLoading && <Loading label="Loading centres…" />}
          {error && <ErrorState message="Could not load centres." onRetry={() => mutate()} />}
          {!isLoading && !error && (data ?? []).length === 0 && <EmptyState icon="apartment" title="No centres listed yet" />}
          {!isLoading && !error && (data ?? []).length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(data ?? []).map((c) => (
                <li key={c.id} className="rounded-xl border border-secondary/10 bg-surface-container-lowest p-6 museum-shadow">
                  <span className="material-symbols-outlined text-primary">apartment</span>
                  <p className="mt-2 font-title-lg text-on-surface">{c.name}</p>
                  <p className="font-body-md text-on-surface-variant">{c.district}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
