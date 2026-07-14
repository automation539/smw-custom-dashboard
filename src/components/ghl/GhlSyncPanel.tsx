"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { GhlSyncActionState } from "@/lib/actions/ghl-sync";

export interface GhlSyncLogSummary {
  status: "pending" | "running" | "success" | "failed";
  started_at: string;
  finished_at: string | null;
  records_synced: number;
  error_message: string | null;
}

const initialState: GhlSyncActionState = {};

const statusStyles: Record<GhlSyncLogSummary["status"], string> = {
  success: "bg-emerald-50 text-emerald-700",
  failed: "bg-rose-50 text-rose-700",
  running: "bg-amber-50 text-amber-700",
  pending: "bg-gray-100 text-gray-600",
};

interface GhlSyncPanelProps {
  title: string;
  subtitle: string;
  buttonLabel: string;
  unitLabel: string;
  action: (
    prevState: GhlSyncActionState | undefined,
    formData: FormData
  ) => Promise<GhlSyncActionState>;
  lastSync: GhlSyncLogSummary | null;
}

export function GhlSyncPanel({
  title,
  subtitle,
  buttonLabel,
  unitLabel,
  action,
  lastSync,
}: GhlSyncPanelProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title={title}
        subtitle={subtitle}
        icon={<RefreshCw className="h-5 w-5" strokeWidth={2} />}
      />

      {lastSync && (
        <div className="mt-5 flex items-start gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[lastSync.status]}`}
          >
            {lastSync.status === "success" ? (
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
            ) : lastSync.status === "failed" ? (
              <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
            ) : null}
            {lastSync.status}
          </span>
          <div className="text-xs text-gray-500">
            <p>
              Last run {new Date(lastSync.started_at).toLocaleString()}
              {lastSync.status === "success" &&
                ` · ${lastSync.records_synced} ${unitLabel} synced`}
            </p>
            {lastSync.error_message && (
              <p className="mt-1 text-rose-600">{lastSync.error_message}</p>
            )}
          </div>
        </div>
      )}

      {state?.error && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      )}

      <form action={formAction} className="mt-5">
        <Button type="submit" variant="primary" disabled={isPending}>
          <RefreshCw className="h-4 w-4" />
          {isPending ? "Syncing..." : buttonLabel}
        </Button>
      </form>
    </Card>
  );
}
