import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { runGhlSyncSequence, type GhlSyncType } from "@/lib/ghl/sync";

// Vercel Cron Jobs invoke this via GET. Long-running: several tenants, each
// running 5 sequential syncs that can individually take minutes (messages
// sync in particular). Request the longest execution window available.
export const maxDuration = 300;

// Minimal courtesy delay between tenants -- each tenant syncs against its
// own GHL location/token, so this isn't working around a shared rate limit,
// just avoiding back-to-back bursts from a single cron invocation.
const DELAY_BETWEEN_TENANTS_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

interface SyncOutcome {
  clientId: string;
  syncType: GhlSyncType;
  success: boolean;
  error?: string;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const supabase = createServiceClient();

  const { data: connections, error: connectionsError } = await supabase
    .from("ghl_connections")
    .select("client_id");

  if (connectionsError) {
    return NextResponse.json(
      { error: `Failed to list connected tenants: ${connectionsError.message}` },
      { status: 500 }
    );
  }

  const results: SyncOutcome[] = [];

  for (const connection of connections ?? []) {
    // A single tenant's total failure must never stop any other tenant's
    // syncs -- runGhlSyncSequence already isolates per-step failures within
    // one tenant and has recorded each outcome in ghl_sync_logs.
    const stepResults = await runGhlSyncSequence(connection.client_id);
    for (const step of stepResults) {
      results.push({ clientId: connection.client_id, ...step });
    }

    await sleep(DELAY_BETWEEN_TENANTS_MS);
  }

  return NextResponse.json({
    startedAt,
    finishedAt: new Date().toISOString(),
    tenantsProcessed: connections?.length ?? 0,
    results,
  });
}
