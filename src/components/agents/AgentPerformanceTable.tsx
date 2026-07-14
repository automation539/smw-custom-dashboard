import Link from "next/link";
import { Users2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDuration } from "@/lib/format";
import type { AgentPerformanceItem } from "@/lib/queries/agents";

function agentName(agent: AgentPerformanceItem) {
  const name = [agent.firstName, agent.lastName].filter(Boolean).join(" ");
  return name || "Unnamed agent";
}

function initials(agent: AgentPerformanceItem) {
  const name = agentName(agent);
  const parts = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return parts || "?";
}

const columns = [
  "Agent",
  "Assigned",
  "Contacted",
  "Qualified",
  "Won",
  "Win Rate",
  "Avg. Response",
  "Median Response",
  "Won Value",
];

export function AgentPerformanceTable({ agents }: { agents: AgentPerformanceItem[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Agents"
        subtitle="Lifetime totals per agent; response time reflects the selected date range"
        icon={<Users2 className="h-5 w-5" strokeWidth={2} />}
      />

      {agents.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No agents synced yet"
          description="Sync users from Connect GHL to see your team here."
        />
      ) : (
        <div className="mt-5 -mx-5 overflow-x-auto sm:-mx-6">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-y border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-400">
                {columns.map((col) => (
                  <th key={col} className="px-5 py-3 font-medium sm:px-6">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map((agent) => (
                <tr key={agent.userId} className="transition-colors hover:bg-gray-50">
                  <td className="px-5 py-3.5 sm:px-6">
                    <Link
                      href={`/agents/${agent.userId}`}
                      className="flex items-center gap-3 font-medium text-gray-900 hover:text-indigo-600"
                    >
                      <Avatar initials={initials(agent)} size="sm" />
                      {agentName(agent)}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">{agent.assignedLeads}</td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">{agent.contactedLeads}</td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">
                    {agent.qualifiedOpportunities}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">{agent.wonOpportunities}</td>
                  <td className="px-5 py-3.5 sm:px-6">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                      {agent.winRate === null ? "—" : `${agent.winRate}%`}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">
                    {formatDuration(agent.avgResponseSeconds)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">
                    {formatDuration(agent.medianResponseSeconds)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">
                    {formatCurrency(agent.totalWonValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
