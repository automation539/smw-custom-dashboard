import { createClient } from "@/lib/supabase/server";

export interface DashboardStatCounts {
  totalContacts: number;
  totalOpportunities: number;
  openOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  totalUsers: number;
}

export interface PipelineStageSummary {
  pipelineId: string | null;
  pipelineStageId: string | null;
  pipelineName: string | null;
  stageName: string | null;
  opportunityCount: number;
  totalValue: number;
}

export interface StatusBreakdownItem {
  status: string;
  opportunityCount: number;
  totalValue: number;
}

export interface ContactsBySourceItem {
  source: string;
  contactCount: number;
}

export interface MessagesByDayItem {
  day: string;
  inboundCount: number;
  outboundCount: number;
}

export interface AgentLeaderboardItem {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  totalContacts: number;
  totalOpportunities: number;
  wonOpportunities: number;
  totalValue: number;
}

export interface RecentSyncLogItem {
  id: string;
  syncType: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  recordsSynced: number;
  errorMessage: string | null;
}

export interface DashboardData {
  statCounts: DashboardStatCounts;
  pipelineSummary: PipelineStageSummary[];
  statusBreakdown: StatusBreakdownItem[];
  contactsBySource: ContactsBySourceItem[];
  messagesByDay: MessagesByDayItem[];
  agentLeaderboard: AgentLeaderboardItem[];
  recentSyncLogs: RecentSyncLogItem[];
}

const EMPTY_STAT_COUNTS: DashboardStatCounts = {
  totalContacts: 0,
  totalOpportunities: 0,
  openOpportunities: 0,
  wonOpportunities: 0,
  lostOpportunities: 0,
  totalMessages: 0,
  inboundMessages: 0,
  outboundMessages: 0,
  totalUsers: 0,
};

// Reads only from Supabase (never the GHL API) via RLS-scoped RPC
// aggregation functions and a plain sync-logs query -- all tenant
// isolation comes from the caller's own session, same as the rest of
// the app.
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const [
    statCountsResult,
    pipelineSummaryResult,
    statusBreakdownResult,
    contactsBySourceResult,
    messagesByDayResult,
    agentLeaderboardResult,
    recentSyncLogsResult,
  ] = await Promise.all([
    supabase.rpc("dashboard_stat_counts"),
    supabase.rpc("dashboard_pipeline_summary"),
    supabase.rpc("dashboard_status_breakdown"),
    supabase.rpc("dashboard_contacts_by_source", { p_limit: 8 }),
    supabase.rpc("dashboard_messages_by_day", { p_days_back: 14 }),
    supabase.rpc("dashboard_agent_leaderboard"),
    supabase
      .from("ghl_sync_logs")
      .select("id, sync_type, status, started_at, finished_at, records_synced, error_message")
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const rawCounts = statCountsResult.data?.[0];

  const statCounts: DashboardStatCounts = rawCounts
    ? {
        totalContacts: rawCounts.total_contacts,
        totalOpportunities: rawCounts.total_opportunities,
        openOpportunities: rawCounts.open_opportunities,
        wonOpportunities: rawCounts.won_opportunities,
        lostOpportunities: rawCounts.lost_opportunities,
        totalMessages: rawCounts.total_messages,
        inboundMessages: rawCounts.inbound_messages,
        outboundMessages: rawCounts.outbound_messages,
        totalUsers: rawCounts.total_users,
      }
    : EMPTY_STAT_COUNTS;

  const pipelineSummary: PipelineStageSummary[] = (pipelineSummaryResult.data ?? []).map(
    (row) => ({
      pipelineId: row.pipeline_id,
      pipelineStageId: row.pipeline_stage_id,
      pipelineName: row.pipeline_name,
      stageName: row.stage_name,
      opportunityCount: row.opportunity_count,
      totalValue: row.total_value,
    })
  );

  const statusBreakdown: StatusBreakdownItem[] = (statusBreakdownResult.data ?? []).map((row) => ({
    status: row.status,
    opportunityCount: row.opportunity_count,
    totalValue: row.total_value,
  }));

  const contactsBySource: ContactsBySourceItem[] = (contactsBySourceResult.data ?? []).map(
    (row) => ({
      source: row.source,
      contactCount: row.contact_count,
    })
  );

  const messagesByDay: MessagesByDayItem[] = (messagesByDayResult.data ?? []).map((row) => ({
    day: row.day,
    inboundCount: row.inbound_count,
    outboundCount: row.outbound_count,
  }));

  const agentLeaderboard: AgentLeaderboardItem[] = (agentLeaderboardResult.data ?? []).map(
    (row) => ({
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      totalContacts: row.total_contacts,
      totalOpportunities: row.total_opportunities,
      wonOpportunities: row.won_opportunities,
      totalValue: row.total_value,
    })
  );

  const recentSyncLogs: RecentSyncLogItem[] = (recentSyncLogsResult.data ?? []).map((row) => ({
    id: row.id,
    syncType: row.sync_type,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    recordsSynced: row.records_synced,
    errorMessage: row.error_message,
  }));

  return {
    statCounts,
    pipelineSummary,
    statusBreakdown,
    contactsBySource,
    messagesByDay,
    agentLeaderboard,
    recentSyncLogs,
  };
}
