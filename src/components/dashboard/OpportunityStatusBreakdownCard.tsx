import { PieChart } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import type { StatusBreakdownItem } from "@/lib/queries/dashboard";

const statusStyles: Record<string, { label: string; bar: string; badge: string }> = {
  open: { label: "Open", bar: "bg-indigo-600", badge: "bg-indigo-50 text-indigo-700" },
  won: { label: "Won", bar: "bg-emerald-600", badge: "bg-emerald-50 text-emerald-700" },
  lost: { label: "Lost", bar: "bg-rose-600", badge: "bg-rose-50 text-rose-700" },
  abandoned: { label: "Abandoned", bar: "bg-gray-400", badge: "bg-gray-100 text-gray-600" },
};

function styleFor(status: string) {
  return (
    statusStyles[status] ?? {
      label: status,
      bar: "bg-gray-400",
      badge: "bg-gray-100 text-gray-600",
    }
  );
}

export function OpportunityStatusBreakdownCard({ items }: { items: StatusBreakdownItem[] }) {
  const total = items.reduce((sum, item) => sum + item.opportunityCount, 0);

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Opportunity Status Breakdown"
        subtitle="All synced opportunities by status"
        icon={<PieChart className="h-5 w-5" strokeWidth={2} />}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No opportunities yet"
          description="Sync opportunities from Connect GHL to see status breakdown here."
        />
      ) : (
        <>
          <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
            {items.map((item) => (
              <div
                key={item.status}
                className={`h-full ${styleFor(item.status).bar} border-r-2 border-white last:border-r-0`}
                style={{ width: `${total > 0 ? (item.opportunityCount / total) * 100 : 0}%` }}
                title={`${styleFor(item.status).label}: ${item.opportunityCount}`}
              />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {items.map((item) => {
              const style = styleFor(item.status);
              const pct = total > 0 ? Math.round((item.opportunityCount / total) * 100) : 0;
              return (
                <div key={item.status} className="flex items-center justify-between text-sm">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.badge}`}
                  >
                    {style.label}
                  </span>
                  <span className="text-gray-500">
                    {item.opportunityCount} ({pct}%) · {formatCurrency(item.totalValue)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
