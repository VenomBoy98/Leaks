"use client";
// Applicant dashboard — all real data: application number, backend status, course, completion
// derived from actual document requirements, missing-doc count, next action, recent notices.
import Link from "next/link";
import Shell from "@/components/applicant/Shell";
import { Loading, ErrorState, EmptyState, StatusPill } from "@/components/ui/States";
import { useApplications, useDocuments, useNotifications, useCourses } from "@/lib/hooks";

const REQUIRED_TYPES = ["MATRIC"]; // application-stage required documents

export default function DashboardPage() {
  const { data: apps, error, isLoading, mutate } = useApplications();
  const app = apps?.[0];
  const { data: docs } = useDocuments(app?.id);
  const { data: courses } = useCourses();
  const { data: notifs } = useNotifications();

  return (
    <Shell title="Dashboard">
      {isLoading && <Loading label="Loading your application…" />}
      {error && <ErrorState message="Could not load your application." onRetry={() => mutate()} />}
      {!isLoading && !error && !app && (
        <EmptyState icon="assignment" title="No application yet"
          hint="Start your admission application to track its progress here." />
      )}
      {!isLoading && !error && !app && (
        <Link href="/application" className="inline-block rounded-lg bg-primary px-6 py-3 font-label-md text-on-primary hover:bg-primary-container">
          Start application
        </Link>
      )}

      {app && (() => {
        const clean = (docs ?? []).filter((d) => d.scan_status === "CLEAN").map((d) => d.document_type_code);
        const missing = REQUIRED_TYPES.filter((t) => !clean.includes(t));
        const completion = Math.round((REQUIRED_TYPES.filter((t) => clean.includes(t)).length / REQUIRED_TYPES.length) * 100);
        const ref = `SJKVY-${new Date(app.created_at).getFullYear()}-${app.id.slice(0, 8).toUpperCase()}`;
        const course = courses?.find((c) => c.id === app.course_id);
        const nextAction =
          app.status === "DRAFT" && missing.length ? { label: "Upload required documents", href: "/documents" }
          : app.status === "DRAFT" ? { label: "Review and submit", href: "/application" }
          : { label: "Track verification progress", href: "/timeline" };
        return (
          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-secondary/10 bg-surface-container-lowest p-6 museum-shadow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-label-md uppercase tracking-wider text-on-surface-variant">Application ID</p>
                  <p className="font-display-md text-headline-lg text-primary" data-testid="app-ref">{ref}</p>
                  <p className="font-body-md text-on-surface-variant">{course ? course.name_en : "Course"}</p>
                </div>
                <div className="text-right">
                  <p className="mb-1 font-label-md uppercase tracking-wider text-on-surface-variant">Status</p>
                  <StatusPill status={app.status} />
                </div>
              </div>
              <div className="mt-6">
                <div className="mb-1 flex justify-between font-caption text-on-surface-variant">
                  <span>Application completion</span><span>{completion}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion}%` }} />
                </div>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Missing documents" value={String(missing.length)} tone={missing.length ? "warn" : "ok"} />
              <Stat label="Verification" value={app.status === "SUBMITTED" || app.status === "IN_PROCESS" ? "In review" : "Not started"} />
              <Stat label="Admission" value={app.status === "DECIDED" ? "Decided" : "Pending"} />
            </div>

            <section className="rounded-xl border border-secondary/10 bg-surface-container-lowest p-6">
              <p className="font-label-md uppercase tracking-wider text-on-surface-variant">Next required action</p>
              <div className="mt-2 flex items-center justify-between gap-4">
                <p className="font-title-lg text-on-surface">{nextAction.label}</p>
                <Link href={nextAction.href} className="rounded-lg bg-primary px-5 py-2.5 font-label-md text-on-primary hover:bg-primary-container">Continue</Link>
              </div>
            </section>

            <section className="rounded-xl border border-secondary/10 bg-surface-container-lowest p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-title-lg text-primary">Recent notifications</p>
                <Link href="/notifications" className="font-label-md text-secondary hover:underline">View all</Link>
              </div>
              {(notifs ?? []).length === 0 ? (
                <p className="font-body-md text-on-surface-variant">No notifications yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {(notifs ?? []).slice(0, 4).map((n) => (
                    <li key={n.id} className="flex items-center gap-3 rounded-lg bg-surface-container-low px-4 py-3">
                      <span className="material-symbols-outlined text-secondary">campaign</span>
                      <span className="font-body-md text-on-surface">{humanTemplate(n.template_key)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        );
      })()}
    </Shell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-xl border border-secondary/10 bg-surface-container-lowest p-5">
      <p className="font-label-md uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className={`mt-1 font-display-md text-display-md ${tone === "warn" ? "text-error" : tone === "ok" ? "text-primary" : "text-on-surface"}`}>{value}</p>
    </div>
  );
}
function humanTemplate(key?: string): string {
  if (!key) return "Notification";
  return key.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
