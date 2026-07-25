"use client";
// Staff reports — scoped aggregate dashboards. Every number comes from a backend GROUP BY over
// an RLS-protected table (see domain: reports), so the totals respect the staff member's centre
// and role. No raw private dataset is downloaded to be counted in the browser.
import Shell from "@/components/staff/Shell";
import { Loading, ErrorState, EmptyState } from "@/components/ui/States";
import { useReports } from "@/lib/hooks";
import type { StatusCount } from "@/lib/api";

function ReportCard({ title, icon, rows }: { title: string; icon: string; rows: StatusCount[] }) {
  const total = rows.reduce((a, r) => a + r.n, 0);
  return (
    <div className="rounded-xl border border-outline/15 bg-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <h3 className="font-display-md text-title-lg text-on-surface">{title}</h3>
        <span className="ml-auto font-display-md text-headline-md text-primary">{total}</span>
      </div>
      {rows.length === 0 ? (
        <p className="font-caption text-on-surface-variant">No data for your centre yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => {
            const pct = total ? Math.round((r.n / total) * 100) : 0;
            return (
              <li key={r.status}>
                <div className="mb-0.5 flex justify-between font-caption">
                  <span className="text-on-surface">{r.status.replace(/_/g, " ").toLowerCase()}</span>
                  <span className="font-variant-numeric tabular-nums text-on-surface-variant">{r.n}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Reports() {
  const { data, isLoading, error, mutate } = useReports();
  return (
    <Shell title="Reports" subtitle="Centre-scoped operational aggregates">
      {isLoading ? (
        <Loading label="Computing scoped aggregates…" />
      ) : error ? (
        <ErrorState message="Could not load reports." onRetry={() => mutate()} />
      ) : !data ? (
        <EmptyState icon="insights" title="No report data" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-outline/15 bg-surface p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">timer</span>
              <h3 className="font-display-md text-title-lg text-on-surface">Processing time</h3>
              <span className="ml-auto font-display-md text-headline-md text-primary">{data.processing.decided}</span>
            </div>
            <p className="mb-3 font-caption text-on-surface-variant">Applications decided (submit → decision), days</p>
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[["Average", data.processing.avg_days], ["Median", data.processing.median_days], ["Max", data.processing.max_days]].map(([label, v]) => (
                <div key={label as string} className="rounded-lg bg-surface-container-high/50 p-3">
                  <dd className="font-display-md text-title-lg tabular-nums text-on-surface">{v ?? "—"}</dd>
                  <dt className="font-caption text-on-surface-variant">{label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <ReportCard title="Verification volume" icon="fact_check" rows={data.verification} />
          <ReportCard title="Counselling outcomes" icon="forum" rows={data.counselling} />
          <ReportCard title="Hostel occupancy" icon="night_shelter" rows={data.hostel} />
          <ReportCard title="Certificate issuance" icon="workspace_premium" rows={data.certificates} />
          <ReportCard title="Placement outcomes" icon="work" rows={data.placement} />
        </div>
      )}
    </Shell>
  );
}
