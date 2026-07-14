import { Users2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDuration } from "@/lib/format";
import type { ResponseTimeByAgentItem } from "@/lib/queries/response-time";

function agentName(agent: ResponseTimeByAgentItem) {
  const name = [agent.firstName, agent.lastName].filter(Boolean).join(" ");
  return name || "Unnamed agent";
}

function initials(agent: ResponseTimeByAgentItem) {
  const name = agentName(agent);
  const parts = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return parts || "?";
}

const columns = ["Agent", "Avg. Response Time", "Median Response Time", "Leads Responded To"];

export function ResponseTimeByAgentTable({ agents }: { agents: ResponseTimeByAgentItem[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Response Time by Agent"
        subtitle="First response speed per assigned agent, for this date range"
        icon={<Users2 className="h-5 w-5" strokeWidth={2} />}
      />

      {agents.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No response data yet"
          description="No assigned leads with a first response in this range yet."
        />
      ) : (
        <div className="mt-5 -mx-5 overflow-x-auto sm:-mx-6">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
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
                    <div className="flex items-center gap-3">
                      <Avatar initials={initials(agent)} size="sm" />
                      <span className="font-medium text-gray-900">{agentName(agent)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">
                    {formatDuration(agent.avgSeconds)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">
                    {formatDuration(agent.medianSeconds)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">{agent.sampleCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
