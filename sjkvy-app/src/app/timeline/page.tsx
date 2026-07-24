"use client";
// Applicant timeline — built from real application state + decision history. Shows only
// applicant-safe events; never exposes internal audit rows or staff-only notes.
import Shell from "@/components/applicant/Shell";
import { Loading, ErrorState, EmptyState } from "@/components/ui/States";
import { useApplications } from "@/lib/hooks";
import type { Application } from "@/lib/api";

interface Event { key: string; title: string; at?: string | null; done: boolean }

function buildEvents(app: Application): Event[] {
  const decided = app.status === "DECIDED";
  const inReview = app.status === "SUBMITTED" || app.status === "IN_PROCESS" || decided;
  return [
    { key: "created", title: "Application created", at: app.created_at, done: true },
    { key: "submitted", title: "Application submitted", at: app.submitted_at, done: !!app.submitted_at },
    { key: "verification", title: "Document verification", at: null, done: inReview },
    { key: "decision", title: "Admission decision", at: null, done: decided },
  ];
}

export default function TimelinePage() {
  const { data: apps, isLoading, error, mutate } = useApplications();
  const app = apps?.[0];

  return (
    <Shell title="Timeline">
      {isLoading && <Loading />}
      {error && <ErrorState message="Could not load your timeline." onRetry={() => mutate()} />}
      {!isLoading && !error && !app && <EmptyState icon="hourglass_empty" title="Nothing yet" hint="Your application milestones will appear here." />}
      {app && (
        <ol className="relative ml-3 border-l-2 border-secondary/20">
          {buildEvents(app).map((e) => (
            <li key={e.key} className="mb-8 ml-6">
              <span className={`absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full ${e.done ? "bg-primary" : "bg-surface-container-high"}`}>
                {e.done && <span className="material-symbols-outlined text-sm text-on-primary">check</span>}
              </span>
              <p className={`font-title-lg ${e.done ? "text-on-surface" : "text-on-surface-variant"}`}>{e.title}</p>
              {e.at && <p className="font-caption text-on-surface-variant">{new Date(e.at).toLocaleString("en-IN")}</p>}
              {!e.done && <p className="font-caption text-on-surface-variant">Pending</p>}
            </li>
          ))}
        </ol>
      )}
    </Shell>
  );
}
