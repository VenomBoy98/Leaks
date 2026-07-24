"use client";
// Applicant notifications — real list, unread count, mark-one-read, refresh after mutation.
import { useState } from "react";
import Shell from "@/components/applicant/Shell";
import { Loading, ErrorState, EmptyState } from "@/components/ui/States";
import { useNotifications, refresh } from "@/lib/hooks";
import { api, type NotificationItem } from "@/lib/api";

const human = (k?: string) => (k ? k.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Notification");

export default function NotificationsPage() {
  const { data, isLoading, error, mutate } = useNotifications();
  const [busy, setBusy] = useState<string | null>(null);
  const unread = (data ?? []).filter((n) => n.status !== "READ").length;

  async function markRead(n: NotificationItem) {
    if (n.status === "READ") return;
    setBusy(n.id);
    try { await api.markNotificationRead(n.id); await mutate(); refresh.notifications(); }
    catch { /* keep unread; user can retry */ }
    finally { setBusy(null); }
  }

  return (
    <Shell title="Notifications">
      {isLoading && <Loading />}
      {error && <ErrorState message="Could not load notifications." onRetry={() => mutate()} />}
      {!isLoading && !error && (data ?? []).length === 0 && <EmptyState icon="notifications" title="No notifications" hint="You're all caught up." />}
      {!isLoading && !error && (data ?? []).length > 0 && (
        <>
          <p className="mb-4 font-label-md text-on-surface-variant">{unread} unread</p>
          <ul className="flex flex-col gap-2">
            {(data ?? []).map((n) => (
              <li key={n.id}>
                <button onClick={() => markRead(n)} disabled={busy === n.id}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${n.status === "READ" ? "border-secondary/10 bg-surface-container-low" : "border-secondary/30 bg-surface-container-lowest"}`}>
                  <span className={`material-symbols-outlined ${n.status === "READ" ? "text-on-surface-variant" : "text-secondary"}`}>campaign</span>
                  <span className="flex-1">
                    <span className="block font-body-md text-on-surface">{human(n.template_key)}</span>
                    {n.created_at && <span className="block font-caption text-on-surface-variant">{new Date(n.created_at).toLocaleString("en-IN")}</span>}
                  </span>
                  {n.status !== "READ" && <span className="h-2.5 w-2.5 rounded-full bg-secondary" aria-label="unread" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Shell>
  );
}
