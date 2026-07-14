import { MessageSquare } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MessagesByDayItem } from "@/lib/queries/dashboard";

function buildDayRange(daysBack: number, data: MessagesByDayItem[]): MessagesByDayItem[] {
  const byDay = new Map(data.map((item) => [item.day, item]));
  const today = new Date();
  const result: MessagesByDayItem[] = [];

  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push(byDay.get(key) ?? { day: key, inboundCount: 0, outboundCount: 0 });
  }

  return result;
}

export function MessagesByDayChart({ data }: { data: MessagesByDayItem[] }) {
  const days = buildDayRange(14, data);
  const hasAnyMessages = days.some((d) => d.inboundCount + d.outboundCount > 0);
  const maxCount = Math.max(1, ...days.map((d) => Math.max(d.inboundCount, d.outboundCount)));

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Messages by Day"
        subtitle="Inbound vs. outbound over the last 14 days"
        icon={<MessageSquare className="h-5 w-5" strokeWidth={2} />}
      />

      {!hasAnyMessages ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Sync messages from Connect GHL to see daily activity here."
        />
      ) : (
        <>
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Inbound
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" /> Outbound
            </span>
          </div>

          <div className="mt-4 flex h-36 items-end gap-1.5 sm:gap-2">
            {days.map((day) => (
              <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-28 w-full items-end justify-center gap-0.5">
                  <div
                    className="w-full max-w-3 rounded-t bg-sky-500"
                    style={{ height: `${(day.inboundCount / maxCount) * 100}%` }}
                    title={`${day.day}: ${day.inboundCount} inbound`}
                  />
                  <div
                    className="w-full max-w-3 rounded-t bg-indigo-600"
                    style={{ height: `${(day.outboundCount / maxCount) * 100}%` }}
                    title={`${day.day}: ${day.outboundCount} outbound`}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(`${day.day}T00:00:00Z`).toLocaleDateString("en-US", {
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
