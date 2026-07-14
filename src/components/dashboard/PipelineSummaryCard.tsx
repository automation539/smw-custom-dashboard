import { GitBranch } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import type { PipelineStageSummary } from "@/lib/queries/dashboard";

function stageLabel(stage: PipelineStageSummary) {
  if (stage.stageName) {
    return stage.pipelineName ? `${stage.pipelineName} · ${stage.stageName}` : stage.stageName;
  }
  if (!stage.pipelineStageId) {
    return "Unassigned stage";
  }
  return `Stage ${stage.pipelineStageId.slice(0, 8)}`;
}

export function PipelineSummaryCard({ stages }: { stages: PipelineStageSummary[] }) {
  const maxCount = Math.max(1, ...stages.map((s) => s.opportunityCount));
  const hasUnresolvedNames = stages.some((s) => !s.stageName);

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Opportunity Pipeline Summary"
        subtitle="Open deals by pipeline stage"
        icon={<GitBranch className="h-5 w-5" strokeWidth={2} />}
      />

      {stages.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No open opportunities yet"
          description="Sync opportunities from Connect GHL to see your pipeline here."
        />
      ) : (
        <>
          <div className="mt-5 space-y-3">
            {stages.map((stage) => (
              <div key={`${stage.pipelineId}-${stage.pipelineStageId}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{stageLabel(stage)}</span>
                  <span className="text-gray-500">
                    {stage.opportunityCount} · {formatCurrency(stage.totalValue)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${(stage.opportunityCount / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {hasUnresolvedNames && (
            <p className="mt-4 text-xs text-gray-400">
              Some stages show a shortened id — sync pipelines from Connect GHL to resolve their
              real names.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
