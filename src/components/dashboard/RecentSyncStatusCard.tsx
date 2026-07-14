import { History, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { RecentSyncLogItem } from "@/lib/queries/dashboard";

const statusStyles: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700",
  failed: "bg-rose-50 text-rose-700",
  running: "bg-amber-50 text-amber-700",
  pending: "bg-gray-100 text-gray-600",
};

const syncTypeLabels: Record<string, string> = {
  users: "Users",
  contacts: "Contacts",
  opportunities: "Opportunities",
  messages: "Messages",
  full: "Full sync",
};

export function RecentSyncStatusCard({ logs }: { logs: RecentSyncLogItem[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Recent Sync Status"
        subtitle="Latest sync runs across all data types"
        icon={<History className="h-5 w-5" strokeWidth={2} />}
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No syncs yet"
          description="Run a sync from Connect GHL to see activity here."
        />
      ) : (
        <div className="mt-5 divide-y divide-gray-100">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    statusStyles[log.status] ?? statusStyles.pending
                  }`}
                >
                  {log.status === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : log.status === "failed" ? (
                    <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  {log.status}
                </span>
                <span className="font-medium text-gray-700">
                  {syncTypeLabels[log.syncType] ?? log.syncType}
                </span>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>{new Date(log.startedAt).toLocaleString()}</p>
                {log.status === "success" && <p>{log.recordsSynced} synced</p>}
                {log.status === "failed" && log.errorMessage && (
                  <p className="max-w-[240px] truncate text-rose-500" title={log.errorMessage}>
                    {log.errorMessage}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
