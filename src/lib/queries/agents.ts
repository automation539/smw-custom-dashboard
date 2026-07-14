import { createClient } from "@/lib/supabase/server";

export interface AgentPerformanceItem {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  assignedLeads: number;
  contactedLeads: number;
  qualifiedOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  winRate: number | null;
  avgResponseSeconds: number | null;
  medianResponseSeconds: number | null;
  totalWonValue: number;
}

export interface AgentContactItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  firstContactedAt: string | null;
}

export interface AgentOpportunityItem {
  id: string;
  name: string | null;
  status: string;
  monetaryValue: number | null;
  createdAt: string;
}

export interface AgentActivityItem {
  messageId: string;
  contactId: string;
  contactFirstName: string | null;
  contactLastName: string | null;
  direction: string;
  messageType: string | null;
  body: string | null;
  sentAt: string | null;
}

export interface AgentResponseTimeByDayItem {
  day: string;
  avgSeconds: number | null;
  medianSeconds: number | null;
  sampleCount: number;
}

const CONTACTS_LIMIT = 50;
const OPPORTUNITIES_LIMIT = 50;
const ACTIVITY_LIMIT = 20;

function mapPerformanceRow(row: {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  assigned_leads: number;
  contacted_leads: number;
  qualified_opportunities: number;
  won_opportunities: number;
  lost_opportunities: number;
  win_rate: number | null;
  avg_response_seconds: number | null;
  median_response_seconds: number | null;
  total_won_value: number;
}): AgentPerformanceItem {
  return {
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    assignedLeads: row.assigned_leads,
    contactedLeads: row.contacted_leads,
    qualifiedOpportunities: row.qualified_opportunities,
    wonOpportunities: row.won_opportunities,
    lostOpportunities: row.lost_opportunities,
    winRate: row.win_rate,
    avgResponseSeconds: row.avg_response_seconds,
    medianResponseSeconds: row.median_response_seconds,
    totalWonValue: row.total_won_value,
  };
}

// Reads only from Supabase via RLS-scoped RPC aggregation functions plus
// plain filtered selects -- tenant isolation comes from the caller's own
// session, same as the rest of the app.
export async function getAgentPerformanceList(range: {
  start: string;
  end: string;
}): Promise<AgentPerformanceItem[]> {
  const supabase = await createClient();

  const { data } = await supabase.rpc("agent_performance_stats", {
    p_start: range.start,
    p_end: range.end,
  });

  return (data ?? []).map(mapPerformanceRow);
}

export interface AgentDetail {
  agent: AgentPerformanceItem | null;
  contacts: AgentContactItem[];
  contactsTotalCount: number;
  opportunities: AgentOpportunityItem[];
  opportunitiesTotalCount: number;
  activity: AgentActivityItem[];
  responseTimeByDay: AgentResponseTimeByDayItem[];
}

export async function getAgentDetail(
  agentId: string,
  range: { start: string; end: string }
): Promise<AgentDetail> {
  const supabase = await createClient();

  const [
    performanceResult,
    contactsResult,
    opportunitiesResult,
    activityResult,
    responseTimeByDayResult,
  ] = await Promise.all([
    supabase.rpc("agent_performance_stats", {
      p_start: range.start,
      p_end: range.end,
      p_user_id: agentId,
    }),
    supabase
      .from("ghl_contacts")
      .select("id, first_name, last_name, email, phone, status, source, first_contacted_at", {
        count: "exact",
      })
      .eq("assigned_to", agentId)
      .order("first_contacted_at", { ascending: false, nullsFirst: false })
      .limit(CONTACTS_LIMIT),
    supabase
      .from("ghl_opportunities")
      .select("id, name, status, monetary_value, created_at", { count: "exact" })
      .eq("assigned_to", agentId)
      .order("created_at", { ascending: false })
      .limit(OPPORTUNITIES_LIMIT),
    supabase.rpc("agent_recent_activity", { p_user_id: agentId, p_limit: ACTIVITY_LIMIT }),
    supabase.rpc("agent_response_time_by_day", {
      p_user_id: agentId,
      p_start: range.start,
      p_end: range.end,
    }),
  ]);

  const agent = performanceResult.data?.[0] ? mapPerformanceRow(performanceResult.data[0]) : null;

  const contacts: AgentContactItem[] = (contactsResult.data ?? []).map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    source: row.source,
    firstContactedAt: row.first_contacted_at,
  }));

  const opportunities: AgentOpportunityItem[] = (opportunitiesResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    monetaryValue: row.monetary_value,
    createdAt: row.created_at,
  }));

  const activity: AgentActivityItem[] = (activityResult.data ?? []).map((row) => ({
    messageId: row.message_id,
    contactId: row.contact_id,
    contactFirstName: row.contact_first_name,
    contactLastName: row.contact_last_name,
    direction: row.direction,
    messageType: row.message_type,
    body: row.body,
    sentAt: row.sent_at,
  }));

  const responseTimeByDay: AgentResponseTimeByDayItem[] = (responseTimeByDayResult.data ?? []).map(
    (row) => ({
      day: row.day,
      avgSeconds: row.avg_seconds,
      medianSeconds: row.median_seconds,
      sampleCount: row.sample_count,
    })
  );

  return {
    agent,
    contacts,
    contactsTotalCount: contactsResult.count ?? contacts.length,
    opportunities,
    opportunitiesTotalCount: opportunitiesResult.count ?? opportunities.length,
    activity,
    responseTimeByDay,
  };
}
