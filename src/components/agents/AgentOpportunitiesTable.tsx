import { Briefcase } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import type { AgentOpportunityItem } from "@/lib/queries/agents";

const statusBadge: Record<string, string> = {
  open: "bg-indigo-50 text-indigo-700",
  won: "bg-emerald-50 text-emerald-700",
  lost: "bg-rose-50 text-rose-700",
  abandoned: "bg-gray-100 text-gray-600",
};

const columns = ["Opportunity", "Status", "Value", "Created"];

export function AgentOpportunitiesTable({
  opportunities,
  totalCount,
}: {
  opportunities: AgentOpportunityItem[];
  totalCount: number;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Opportunities"
        subtitle={
          totalCount > opportunities.length
            ? `Showing ${opportunities.length} most recent of ${totalCount}`
            : `${totalCount} opportunit${totalCount === 1 ? "y" : "ies"} assigned`
        }
        icon={<Briefcase className="h-5 w-5" strokeWidth={2} />}
      />

      {opportunities.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No opportunities assigned"
          description="This agent has no assigned opportunities yet."
        />
      ) : (
        <div className="mt-5 -mx-5 overflow-x-auto sm:-mx-6">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
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
              {opportunities.map((opp) => (
                <tr key={opp.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-medium text-gray-900 sm:px-6">
                    {opp.name ?? "Untitled opportunity"}
                  </td>
                  <td className="px-5 py-3.5 sm:px-6">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusBadge[opp.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {opp.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">
                    {opp.monetaryValue !== null ? formatCurrency(opp.monetaryValue) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">
                    {new Date(opp.createdAt).toLocaleDateString()}
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
