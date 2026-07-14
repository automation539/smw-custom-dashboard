import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { runGhlSync, type GhlSyncType } from "@/lib/ghl/sync";

// Vercel Cron Jobs invoke this via GET. Long-running: several tenants, each
// running 5 sequential syncs that can individually take minutes (messages
// sync in particular). Request the longest execution window available.
export const maxDuration = 300;

// Required order per this milestone -- deliberately NOT the "full" sync
// type's own internal order, so this file controls sequencing explicitly
// while still reusing runGhlSync for every actual sync (no duplicated logic).
const SYNC_ORDER: GhlSyncType[] = ["users", "pipelines", "contacts", "opportunities", "messages"];

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
    for (const syncType of SYNC_ORDER) {
      try {
        await runGhlSync(connection.client_id, syncType);
        results.push({ clientId: connection.client_id, syncType, success: true });
      } catch (error) {
        // A single tenant/sync-type failure must never stop the rest of
        // this tenant's syncs or any other tenant's. runGhlSync has already
        // recorded the failure in ghl_sync_logs -- just keep going.
        results.push({
          clientId: connection.client_id,
          syncType,
          success: false,
          error: error instanceof Error ? error.message : "Unknown sync error",
        });
      }
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
