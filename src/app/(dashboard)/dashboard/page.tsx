import {
  Users,
  Briefcase,
  CircleDot,
  Trophy,
  XCircle,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  UserCog,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import type { StatCardItem } from "@/components/dashboard/StatCard";
import { WinRateCard } from "@/components/dashboard/WinRateCard";
import { OpportunityStatusBreakdownCard } from "@/components/dashboard/OpportunityStatusBreakdownCard";
import { PipelineSummaryCard } from "@/components/dashboard/PipelineSummaryCard";
import { MessagesByDayChart } from "@/components/dashboard/MessagesByDayChart";
import { ContactsBySourceCard } from "@/components/dashboard/ContactsBySourceCard";
import { RecentSyncStatusCard } from "@/components/dashboard/RecentSyncStatusCard";
import { AgentLeaderboardTable } from "@/components/dashboard/AgentLeaderboardTable";
import { getDashboardData } from "@/lib/queries/dashboard";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const c = data.statCounts;

  const statItems: StatCardItem[] = [
    { label: "Total Contacts", value: c.totalContacts.toLocaleString(), icon: Users, accent: "indigo" },
    {
      label: "Total Opportunities",
      value: c.totalOpportunities.toLocaleString(),
      icon: Briefcase,
      accent: "indigo",
    },
    {
      label: "Open Opportunities",
      value: c.openOpportunities.toLocaleString(),
      icon: CircleDot,
      accent: "amber",
    },
    {
      label: "Won Opportunities",
      value: c.wonOpportunities.toLocaleString(),
      icon: Trophy,
      accent: "emerald",
    },
    {
      label: "Lost Opportunities",
      value: c.lostOpportunities.toLocaleString(),
      icon: XCircle,
      accent: "rose",
    },
    {
      label: "Total Messages",
      value: c.totalMessages.toLocaleString(),
      icon: MessageSquare,
      accent: "indigo",
    },
    {
      label: "Inbound Messages",
      value: c.inboundMessages.toLocaleString(),
      icon: ArrowDownLeft,
      accent: "sky",
    },
    {
      label: "Outbound Messages",
      value: c.outboundMessages.toLocaleString(),
      icon: ArrowUpRight,
      accent: "indigo",
    },
    {
      label: "Total Users (Agents)",
      value: c.totalUsers.toLocaleString(),
      icon: UserCog,
      accent: "gray",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Overview of your synced GoHighLevel data" />
      <FilterBar />
      <StatsGrid items={statItems} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WinRateCard counts={data.statCounts} />
        <OpportunityStatusBreakdownCard items={data.statusBreakdown} />
      </div>

      <PipelineSummaryCard stages={data.pipelineSummary} />
      <MessagesByDayChart data={data.messagesByDay} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ContactsBySourceCard sources={data.contactsBySource} />
        <RecentSyncStatusCard logs={data.recentSyncLogs} />
      </div>

      <AgentLeaderboardTable agents={data.agentLeaderboard} />
    </div>
  );
}
