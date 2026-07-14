import Link from "next/link";
import {
  ArrowLeft,
  Users,
  PhoneCall,
  BadgeCheck,
  Trophy,
  Percent,
  Timer,
  Gauge,
  Banknote,
  UserX,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponseTimeFilterBar } from "@/components/response-time/ResponseTimeFilterBar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import type { StatCardItem } from "@/components/dashboard/StatCard";
import { ResponseTimeTrendChart } from "@/components/response-time/ResponseTimeTrendChart";
import { AgentContactsTable } from "@/components/agents/AgentContactsTable";
import { AgentOpportunitiesTable } from "@/components/agents/AgentOpportunitiesTable";
import { AgentActivityFeed } from "@/components/agents/AgentActivityFeed";
import { getAgentDetail } from "@/lib/queries/agents";
import { resolveDateRange } from "@/lib/date-range";
import { formatCurrency, formatDuration } from "@/lib/format";

export default async function AgentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const { id } = await params;
  const searchParamsValue = await searchParams;
  const dateRange = resolveDateRange(searchParamsValue);
  const detail = await getAgentDetail(id, dateRange);

  if (!detail.agent) {
    return (
      <div className="space-y-6">
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </Link>
        <Card className="p-5 sm:p-6">
          <EmptyState
            icon={UserX}
            title="Agent not found"
            description="This agent doesn't exist, or isn't part of your workspace."
          />
        </Card>
      </div>
    );
  }

  const { agent } = detail;
  const agentName = [agent.firstName, agent.lastName].filter(Boolean).join(" ") || "Unnamed agent";

  const statItems: StatCardItem[] = [
    {
      label: "Assigned Leads",
      value: agent.assignedLeads.toLocaleString(),
      icon: Users,
      accent: "indigo",
      description: "All-time",
    },
    {
      label: "Contacted Leads",
      value: agent.contactedLeads.toLocaleString(),
      icon: PhoneCall,
      accent: "indigo",
      description: "All-time",
    },
    {
      label: "Qualified Opportunities",
      value: agent.qualifiedOpportunities.toLocaleString(),
      icon: BadgeCheck,
      accent: "indigo",
      description: "All-time",
    },
    {
      label: "Won/Signed Opportunities",
      value: agent.wonOpportunities.toLocaleString(),
      icon: Trophy,
      accent: "emerald",
      description: "All-time",
    },
    {
      label: "Win Rate",
      value: agent.winRate === null ? "—" : `${agent.winRate}%`,
      icon: Percent,
      accent: "emerald",
      description: `${agent.wonOpportunities + agent.lostOpportunities} closed deals`,
    },
    {
      label: "Average Response Time",
      value: formatDuration(agent.avgResponseSeconds),
      icon: Timer,
      accent: "sky",
      description: "Selected date range",
    },
    {
      label: "Median Response Time",
      value: formatDuration(agent.medianResponseSeconds),
      icon: Gauge,
      accent: "sky",
      description: "Selected date range",
    },
    {
      label: "Total Won Value",
      value: formatCurrency(agent.totalWonValue),
      icon: Banknote,
      accent: "emerald",
      description: "All-time",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </Link>
        <PageHeader title={agentName} subtitle="Agent performance and activity" />
      </div>

      <ResponseTimeFilterBar dateRange={dateRange} basePath={`/agents/${id}`} />
      <StatsGrid items={statItems} />
      <ResponseTimeTrendChart
        data={detail.responseTimeByDay}
        start={dateRange.start}
        end={dateRange.end}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AgentContactsTable contacts={detail.contacts} totalCount={detail.contactsTotalCount} />
        <AgentOpportunitiesTable
          opportunities={detail.opportunities}
          totalCount={detail.opportunitiesTotalCount}
        />
      </div>

      <AgentActivityFeed activity={detail.activity} />
    </div>
  );
}
