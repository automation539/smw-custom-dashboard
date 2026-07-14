import { Timer, Gauge, Zap, Hourglass } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResponseTimeFilterBar } from "@/components/response-time/ResponseTimeFilterBar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import type { StatCardItem } from "@/components/dashboard/StatCard";
import { ResponseTimeTrendChart } from "@/components/response-time/ResponseTimeTrendChart";
import { ResponseTimeByAgentTable } from "@/components/response-time/ResponseTimeByAgentTable";
import { getResponseTimeData } from "@/lib/queries/response-time";
import { resolveDateRange } from "@/lib/date-range";
import { formatDuration } from "@/lib/format";

export default async function SpeedToLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const dateRange = resolveDateRange(params);
  const data = await getResponseTimeData(dateRange);
  const { stats } = data;

  const sampleDescription =
    stats.sampleCount === 1 ? "1 lead with a response" : `${stats.sampleCount} leads with a response`;

  const statItems: StatCardItem[] = [
    {
      label: "Average Response Time",
      value: formatDuration(stats.avgSeconds),
      icon: Timer,
      accent: "indigo",
      description: sampleDescription,
    },
    {
      label: "Median Response Time",
      value: formatDuration(stats.medianSeconds),
      icon: Gauge,
      accent: "indigo",
      description: sampleDescription,
    },
    {
      label: "Fastest Response",
      value: formatDuration(stats.minSeconds),
      icon: Zap,
      accent: "emerald",
      description: sampleDescription,
    },
    {
      label: "Slowest Response",
      value: formatDuration(stats.maxSeconds),
      icon: Hourglass,
      accent: "rose",
      description: sampleDescription,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Speed to Lead"
        subtitle="Intake agent performance: how quickly your team responds to new leads"
      />
      <ResponseTimeFilterBar dateRange={dateRange} basePath="/speed-to-lead" />
      <StatsGrid items={statItems} />
      <ResponseTimeTrendChart data={data.byDay} start={dateRange.start} end={dateRange.end} />
      <ResponseTimeByAgentTable agents={data.byAgent} />
    </div>
  );
}
