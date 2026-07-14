import { Percent } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { DashboardStatCounts } from "@/lib/queries/dashboard";

export function WinRateCard({ counts }: { counts: DashboardStatCounts }) {
  const closed = counts.wonOpportunities + counts.lostOpportunities;
  const winRate = closed > 0 ? Math.round((counts.wonOpportunities / closed) * 100) : 0;

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Win Rate"
        subtitle="Won vs. lost, among closed opportunities"
        icon={<Percent className="h-5 w-5" strokeWidth={2} />}
      />

      <p className="mt-6 text-4xl font-semibold tracking-tight text-gray-900">{winRate}%</p>

      <div className="mt-4">
        <ProgressBar value={winRate} />
      </div>

      <p className="mt-4 text-sm text-gray-500">
        {closed > 0
          ? `${counts.wonOpportunities} won out of ${closed} closed opportunities (${counts.lostOpportunities} lost).`
          : "No closed opportunities yet."}
      </p>
    </Card>
  );
}
