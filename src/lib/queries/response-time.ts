import { createClient } from "@/lib/supabase/server";

export interface ResponseTimeStats {
  avgSeconds: number | null;
  medianSeconds: number | null;
  minSeconds: number | null;
  maxSeconds: number | null;
  sampleCount: number;
}

export interface ResponseTimeByAgentItem {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  avgSeconds: number | null;
  medianSeconds: number | null;
  sampleCount: number;
}

export interface ResponseTimeByDayItem {
  day: string;
  avgSeconds: number | null;
  medianSeconds: number | null;
  sampleCount: number;
}

export interface ResponseTimeData {
  stats: ResponseTimeStats;
  byAgent: ResponseTimeByAgentItem[];
  byDay: ResponseTimeByDayItem[];
}

const EMPTY_STATS: ResponseTimeStats = {
  avgSeconds: null,
  medianSeconds: null,
  minSeconds: null,
  maxSeconds: null,
  sampleCount: 0,
};

// Reads only from Supabase via RLS-scoped RPC aggregation functions --
// tenant isolation comes from the caller's own session, same as the rest
// of the dashboard.
export async function getResponseTimeData(range: {
  start: string;
  end: string;
}): Promise<ResponseTimeData> {
  const supabase = await createClient();

  const [statsResult, byAgentResult, byDayResult] = await Promise.all([
    supabase.rpc("dashboard_response_time_stats", { p_start: range.start, p_end: range.end }),
    supabase.rpc("dashboard_response_time_by_agent", { p_start: range.start, p_end: range.end }),
    supabase.rpc("dashboard_response_time_by_day", { p_start: range.start, p_end: range.end }),
  ]);

  const rawStats = statsResult.data?.[0];

  const stats: ResponseTimeStats = rawStats
    ? {
        avgSeconds: rawStats.avg_seconds,
        medianSeconds: rawStats.median_seconds,
        minSeconds: rawStats.min_seconds,
        maxSeconds: rawStats.max_seconds,
        sampleCount: rawStats.sample_count,
      }
    : EMPTY_STATS;

  const byAgent: ResponseTimeByAgentItem[] = (byAgentResult.data ?? []).map((row) => ({
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    avgSeconds: row.avg_seconds,
    medianSeconds: row.median_seconds,
    sampleCount: row.sample_count,
  }));

  const byDay: ResponseTimeByDayItem[] = (byDayResult.data ?? []).map((row) => ({
    day: row.day,
    avgSeconds: row.avg_seconds,
    medianSeconds: row.median_seconds,
    sampleCount: row.sample_count,
  }));

  return { stats, byAgent, byDay };
}
