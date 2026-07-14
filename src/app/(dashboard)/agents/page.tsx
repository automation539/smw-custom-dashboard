import { PageHeader } from "@/components/layout/PageHeader";
import { ResponseTimeFilterBar } from "@/components/response-time/ResponseTimeFilterBar";
import { AgentPerformanceTable } from "@/components/agents/AgentPerformanceTable";
import { getAgentPerformanceList } from "@/lib/queries/agents";
import { resolveDateRange } from "@/lib/date-range";

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const dateRange = resolveDateRange(params);
  const agents = await getAgentPerformanceList(dateRange);

  return (
    <div className="space-y-6">
      <PageHeader title="Agents" subtitle="Manage your team and review individual performance" />
      <ResponseTimeFilterBar dateRange={dateRange} basePath="/agents" />
      <AgentPerformanceTable agents={agents} />
    </div>
  );
}
