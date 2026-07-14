import { createServiceClient } from "@/lib/supabase/service";
import { syncGhlUsers } from "@/lib/ghl/sync/users";
import { syncGhlContacts } from "@/lib/ghl/sync/contacts";
import { syncGhlOpportunities } from "@/lib/ghl/sync/opportunities";
import { syncGhlMessages } from "@/lib/ghl/sync/messages";
import { syncGhlPipelines } from "@/lib/ghl/sync/pipelines";

export type GhlSyncType =
  | "users"
  | "contacts"
  | "opportunities"
  | "messages"
  | "pipelines"
  | "full";

// Reusable sync entry point -- called today by the manual "Sync now" action,
// and intended to be called the same way from a future cron job. Every run
// is recorded in ghl_sync_logs regardless of outcome.
export async function runGhlSync(clientId: string, syncType: GhlSyncType): Promise<void> {
  const supabase = createServiceClient();

  const { data: log } = await supabase
    .from("ghl_sync_logs")
    .insert({ client_id: clientId, sync_type: syncType, status: "running" })
    .select("id")
    .single();

  try {
    let recordsSynced = 0;

    if (syncType === "users" || syncType === "full") {
      recordsSynced += (await syncGhlUsers(clientId)).recordsSynced;
    }
    if (syncType === "contacts" || syncType === "full") {
      recordsSynced += (await syncGhlContacts(clientId)).recordsSynced;
    }
    if (syncType === "opportunities" || syncType === "full") {
      recordsSynced += (await syncGhlOpportunities(clientId)).recordsSynced;
    }
    if (syncType === "messages" || syncType === "full") {
      recordsSynced += (await syncGhlMessages(clientId)).recordsSynced;
    }
    if (syncType === "pipelines" || syncType === "full") {
      recordsSynced += (await syncGhlPipelines(clientId)).recordsSynced;
    }

    if (log) {
      await supabase
        .from("ghl_sync_logs")
        .update({
          status: "success",
          finished_at: new Date().toISOString(),
          records_synced: recordsSynced,
        })
        .eq("id", log.id);
    }
  } catch (error) {
    if (log) {
      await supabase
        .from("ghl_sync_logs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : "Unknown sync error",
        })
        .eq("id", log.id);
    }
    throw error;
  }
}
