import { PageHeader } from "@/components/layout/PageHeader";
import { GhlConnectionManager } from "@/components/ghl/GhlConnectionManager";
import { GhlSyncPanel } from "@/components/ghl/GhlSyncPanel";
import { createClient } from "@/lib/supabase/server";
import {
  triggerGhlUsersSync,
  triggerGhlContactsSync,
  triggerGhlOpportunitiesSync,
  triggerGhlMessagesSync,
  triggerGhlPipelinesSync,
} from "@/lib/actions/ghl-sync";

// Server Actions invoked from this page (saveGhlConnection, retryInitialGhlSync)
// schedule a background sync via `after()` that can take several minutes --
// match the same execution window granted to the cron endpoint.
export const maxDuration = 300;

const SYNC_LOG_COLUMNS = "status, started_at, finished_at, records_synced, error_message";

export default async function ConnectGhlPage() {
  const supabase = await createClient();
  const { data: connection } = await supabase
    .from("ghl_connections")
    .select("location_id, connected_at")
    .maybeSingle();

  const [
    { data: lastUsersSync },
    { data: lastContactsSync },
    { data: lastOpportunitiesSync },
    { data: lastMessagesSync },
    { data: lastPipelinesSync },
  ] = connection
    ? await Promise.all([
        supabase
          .from("ghl_sync_logs")
          .select(SYNC_LOG_COLUMNS)
          .eq("sync_type", "users")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("ghl_sync_logs")
          .select(SYNC_LOG_COLUMNS)
          .eq("sync_type", "contacts")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("ghl_sync_logs")
          .select(SYNC_LOG_COLUMNS)
          .eq("sync_type", "opportunities")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("ghl_sync_logs")
          .select(SYNC_LOG_COLUMNS)
          .eq("sync_type", "messages")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("ghl_sync_logs")
          .select(SYNC_LOG_COLUMNS)
          .eq("sync_type", "pipelines")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }, { data: null }, { data: null }, { data: null }];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connect GHL"
        subtitle="Link your GoHighLevel account to sync leads and conversations"
      />
      <GhlConnectionManager connection={connection ?? null} />
      {connection && (
        <>
          <GhlSyncPanel
            title="Sync users"
            subtitle="Pulls your team members from GoHighLevel into this workspace"
            buttonLabel="Sync users now"
            unitLabel="users"
            action={triggerGhlUsersSync}
            lastSync={lastUsersSync ?? null}
          />
          <GhlSyncPanel
            title="Sync contacts"
            subtitle="Pulls your leads and contacts from GoHighLevel into this workspace"
            buttonLabel="Sync contacts now"
            unitLabel="contacts"
            action={triggerGhlContactsSync}
            lastSync={lastContactsSync ?? null}
          />
          <GhlSyncPanel
            title="Sync opportunities"
            subtitle="Pulls your pipeline deals from GoHighLevel into this workspace"
            buttonLabel="Sync opportunities now"
            unitLabel="opportunities"
            action={triggerGhlOpportunitiesSync}
            lastSync={lastOpportunitiesSync ?? null}
          />
          <GhlSyncPanel
            title="Sync messages"
            subtitle="Pulls conversation messages from GoHighLevel into this workspace"
            buttonLabel="Sync messages now"
            unitLabel="messages"
            action={triggerGhlMessagesSync}
            lastSync={lastMessagesSync ?? null}
          />
          <GhlSyncPanel
            title="Sync pipelines"
            subtitle="Pulls pipeline and stage names from GoHighLevel into this workspace"
            buttonLabel="Sync pipelines now"
            unitLabel="pipeline records"
            action={triggerGhlPipelinesSync}
            lastSync={lastPipelinesSync ?? null}
          />
        </>
      )}
    </div>
  );
}
