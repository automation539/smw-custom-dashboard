"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, Pencil, Plug, RefreshCw } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  disconnectGhlConnection,
  getInitialGhlSyncStatus,
  retryInitialGhlSync,
  saveGhlConnection,
  type GhlActionState,
} from "@/lib/actions/ghl";

export interface GhlConnectionSummary {
  location_id: string;
  connected_at: string;
}

const initialState: GhlActionState = {};

// Slightly above the 300s serverless budget the background sync is given
// (see maxDuration on the connect-ghl page) -- if polling runs longer than
// this, the batch likely got killed mid-run rather than merely being slow.
const SYNC_STALL_TIMEOUT_MS = 320_000;
const POLL_INTERVAL_MS = 3000;
const EPOCH_ISO = new Date(0).toISOString();

type SyncPhase = "idle" | "syncing" | "success" | "failed" | "stalled";

export function GhlConnectionManager({
  connection,
}: {
  connection: GhlConnectionSummary | null;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(saveGhlConnection, initialState);
  const [editing, setEditing] = useState(false);

  const [syncPhase, setSyncPhase] = useState<SyncPhase>("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [retryPending, setRetryPending] = useState(false);
  const pollSinceRef = useRef<string | null>(null);
  const pollStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.success) {
      setEditing(false);
      pollSinceRef.current = state.syncStartedAt ?? EPOCH_ISO;
      pollStartedAtRef.current = Date.now();
      setSyncError(null);
      setSyncPhase("syncing");
    }
  }, [state]);

  useEffect(() => {
    if (syncPhase !== "syncing") {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      const since = pollSinceRef.current;
      const startedAt = pollStartedAtRef.current;
      if (!since || !startedAt || cancelled) {
        return;
      }

      if (Date.now() - startedAt > SYNC_STALL_TIMEOUT_MS) {
        setSyncPhase("stalled");
        return;
      }

      const result = await getInitialGhlSyncStatus(since);
      if (cancelled) {
        return;
      }

      if (result.status === "success") {
        setSyncPhase("success");
      } else if (result.status === "failed") {
        setSyncError(result.error ?? "Sync failed.");
        setSyncPhase("failed");
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [syncPhase]);

  useEffect(() => {
    if (syncPhase !== "success") {
      return;
    }
    const timeout = setTimeout(() => router.push("/dashboard"), 1200);
    return () => clearTimeout(timeout);
  }, [syncPhase, router]);

  async function handleRetry() {
    setRetryPending(true);
    const result = await retryInitialGhlSync();
    setRetryPending(false);

    if (result.error || !result.syncStartedAt) {
      setSyncError(result.error ?? "Could not start sync.");
      setSyncPhase("failed");
      return;
    }

    pollSinceRef.current = result.syncStartedAt;
    pollStartedAtRef.current = Date.now();
    setSyncError(null);
    setSyncPhase("syncing");
  }

  const syncBanner =
    syncPhase === "idle" ? null : (
      <Card className="p-5 sm:p-6">
        {syncPhase === "syncing" && (
          <div className="flex items-start gap-3 rounded-lg bg-indigo-50 px-4 py-3">
            <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-indigo-600" strokeWidth={2} />
            <p className="text-sm font-medium text-indigo-800">
              GHL connected. Syncing your data...
            </p>
          </div>
        )}
        {syncPhase === "success" && (
          <div className="flex items-start gap-3 rounded-lg bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} />
            <p className="text-sm font-medium text-emerald-800">
              Sync complete! Redirecting to your dashboard...
            </p>
          </div>
        )}
        {syncPhase === "failed" && (
          <div className="flex items-start gap-3 rounded-lg bg-rose-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" strokeWidth={2} />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-800">Your connection is saved, but the initial sync failed.</p>
              <p className="mt-0.5 text-xs text-rose-700">{syncError}</p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                disabled={retryPending}
                onClick={handleRetry}
              >
                <RefreshCw className="h-4 w-4" />
                {retryPending ? "Starting retry..." : "Retry sync"}
              </Button>
            </div>
          </div>
        )}
        {syncPhase === "stalled" && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 px-4 py-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" strokeWidth={2} />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                This is taking longer than expected.
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                Your data is still syncing in the background. You can head to the dashboard now,
                or check back here for status and use the sync panels below.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                onClick={() => router.push("/dashboard")}
              >
                Go to dashboard
              </Button>
            </div>
          </div>
        )}
      </Card>
    );

  const showStatus = Boolean(connection) && !editing;

  if (showStatus && connection) {
    return (
      <>
        {syncBanner}
        <Card className="p-5 sm:p-6">
          <CardHeader
            title="GoHighLevel"
            subtitle="Your CRM connection for this workspace"
            icon={<Plug className="h-5 w-5" strokeWidth={2} />}
          />

          <div className="mt-5 flex items-start gap-3 rounded-lg bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} />
            <div>
              <p className="text-sm font-medium text-emerald-800">Connected</p>
              <p className="mt-0.5 text-xs text-emerald-700">
                Location ID {connection.location_id} · connected{" "}
                {new Date(connection.connected_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Your Private Integration Token is stored encrypted and is never displayed again. A
            full sync runs automatically whenever you connect or update this workspace.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              Update connection
            </Button>
            <form action={disconnectGhlConnection}>
              <Button type="submit" variant="secondary" className="text-rose-600 hover:bg-rose-50">
                Disconnect
              </Button>
            </form>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      {syncBanner}
      <Card className="p-5 sm:p-6">
        <CardHeader
          title="Connect GoHighLevel"
          subtitle="Enter your sub-account credentials to link this workspace"
          icon={<Plug className="h-5 w-5" strokeWidth={2} />}
        />

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">
              Location ID
            </label>
            <input
              id="locationId"
              name="locationId"
              type="text"
              required
              defaultValue={connection?.location_id ?? ""}
              placeholder="e.g. ve9EPM428h8vShlRW1KT"
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="privateToken" className="block text-sm font-medium text-gray-700">
              Private Integration Token
            </label>
            <input
              id="privateToken"
              name="privateToken"
              type="password"
              required
              autoComplete="off"
              placeholder="pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Stored encrypted via Supabase Vault. It is never displayed again after saving.
            </p>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? "Saving..." : connection ? "Save changes" : "Connect GoHighLevel"}
            </Button>
            {connection && (
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>
    </>
  );
}
