"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runGhlSyncSequence, FULL_SYNC_ORDER } from "@/lib/ghl/sync";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface GhlActionState {
  error?: string;
  success?: boolean;
  syncStartedAt?: string;
}

export interface InitialSyncStatus {
  status: "running" | "success" | "failed";
  error?: string;
}

// A fixed point safely before any real sync log row, used as the poll
// baseline for a brand-new tenant that has no prior ghl_sync_logs rows.
const EPOCH_ISO = new Date(0).toISOString();

// Schedules the full sync sequence to run after this request's response is
// sent, unless a sync for this tenant is already running -- this is what
// prevents a double-submit (or a retry click while the previous batch is
// still in flight) from starting overlapping sync batches for the same
// tenant. Returns the started_at of the most recent pre-existing log row (or
// EPOCH_ISO if there is none) for the caller to poll strictly-after, or null
// if nothing was scheduled because a sync was already running.
//
// This baseline is read from the database rather than computed as
// `new Date().toISOString()` in this Node process deliberately: comparing an
// app-clock timestamp against `started_at` (populated by Postgres's own
// clock) is vulnerable to clock skew between the two machines, which in
// testing was enough to make the very first log row of a batch look like it
// started before its own "since" marker, so the status poll never saw it.
// Reading the baseline from the same clock that writes started_at avoids
// that entirely.
async function scheduleInitialSyncIfIdle(supabase: SupabaseServerClient): Promise<string | null> {
  const { data: clientId } = await supabase.rpc("current_client_id");
  if (!clientId) {
    return null;
  }

  const { data: lastLog } = await supabase
    .from("ghl_sync_logs")
    .select("status, started_at")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastLog?.status === "running") {
    return null;
  }

  const baselineStartedAt = lastLog?.started_at ?? EPOCH_ISO;
  after(async () => {
    await runGhlSyncSequence(clientId);
  });
  return baselineStartedAt;
}

export async function saveGhlConnection(
  _prevState: GhlActionState | undefined,
  formData: FormData
): Promise<GhlActionState> {
  const locationId = String(formData.get("locationId") ?? "").trim();
  const token = String(formData.get("privateToken") ?? "").trim();

  if (!locationId || !token) {
    return { error: "Location ID and Private Integration Token are both required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_ghl_connection", {
    p_location_id: locationId,
    p_token: token,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/connect-ghl");

  const syncStartedAt = await scheduleInitialSyncIfIdle(supabase);
  return { success: true, syncStartedAt: syncStartedAt ?? undefined };
}

export async function disconnectGhlConnection() {
  const supabase = await createClient();
  await supabase.rpc("disconnect_ghl_connection");
  revalidatePath("/connect-ghl");
}

// Re-runs the full sync sequence against the already-saved connection --
// used by the "Retry sync" button shown when the automatic post-connect sync
// fails. Reuses the same idle-check as the initial trigger so it can't stack
// a second batch on top of one that's still running.
export async function retryInitialGhlSync(): Promise<GhlActionState> {
  const supabase = await createClient();
  const syncStartedAt = await scheduleInitialSyncIfIdle(supabase);

  if (!syncStartedAt) {
    return {
      error: "A sync is already running for this workspace. Please wait for it to finish.",
    };
  }

  return { success: true, syncStartedAt };
}

// Polled by the connect-ghl UI while the automatic post-connect sync is in
// flight. Looks at the latest ghl_sync_logs row for each of the 5 sync types
// since syncStartedAt to determine whether the whole batch is still running,
// has failed (any step failed), or has fully succeeded.
export async function getInitialGhlSyncStatus(syncStartedAt: string): Promise<InitialSyncStatus> {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("ghl_sync_logs")
    .select("sync_type, status, error_message")
    .gt("started_at", syncStartedAt)
    .in("sync_type", FULL_SYNC_ORDER)
    .order("started_at", { ascending: false });

  const latestByType = new Map<string, { status: string; error_message: string | null }>();
  for (const row of logs ?? []) {
    if (!latestByType.has(row.sync_type)) {
      latestByType.set(row.sync_type, row);
    }
  }

  if (latestByType.size < FULL_SYNC_ORDER.length) {
    return { status: "running" };
  }

  for (const syncType of FULL_SYNC_ORDER) {
    const row = latestByType.get(syncType);
    if (row?.status === "failed") {
      return { status: "failed", error: row.error_message ?? `${syncType} sync failed.` };
    }
  }

  const stillRunning = FULL_SYNC_ORDER.some((syncType) => {
    const status = latestByType.get(syncType)?.status;
    return status === "running" || status === "pending";
  });

  return stillRunning ? { status: "running" } : { status: "success" };
}
