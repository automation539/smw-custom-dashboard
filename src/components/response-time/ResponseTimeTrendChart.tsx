import { TrendingUp } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDuration } from "@/lib/format";
import type { ResponseTimeByDayItem } from "@/lib/queries/response-time";

const MAX_RENDERED_DAYS = 60;

function buildDayRange(
  start: string,
  end: string,
  data: ResponseTimeByDayItem[]
): ResponseTimeByDayItem[] {
  const byDay = new Map(data.map((item) => [item.day, item]));
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dayCount = Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;

  if (dayCount > MAX_RENDERED_DAYS || dayCount < 1) {
    // Very long custom range -- render only the days with data rather than
    // enumerating (and mostly zero-filling) every day in between.
    return [...data].sort((a, b) => a.day.localeCompare(b.day));
  }

  const result: ResponseTimeByDayItem[] = [];
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push(byDay.get(key) ?? { day: key, avgSeconds: null, medianSeconds: null, sampleCount: 0 });
  }
  return result;
}

export function ResponseTimeTrendChart({
  data,
  start,
  end,
}: {
  data: ResponseTimeByDayItem[];
  start: string;
  end: string;
}) {
  const days = buildDayRange(start, end, data);
  const hasAnyData = days.some((d) => d.sampleCount > 0);
  const maxSeconds = Math.max(1, ...days.map((d) => d.avgSeconds ?? 0));

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Daily Response Time Trend"
        subtitle="Average first response time by day the lead came in"
        icon={<TrendingUp className="h-5 w-5" strokeWidth={2} />}
      />

      {!hasAnyData ? (
        <EmptyState
          icon={TrendingUp}
          title="No response data yet"
          description="No leads with a first response in this range yet."
        />
      ) : (
        <div className="mt-5 flex h-36 items-end gap-1.5 sm:gap-2">
          {days.map((day) => (
            <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-28 w-full items-end justify-center">
                <div
                  className="w-full max-w-4 rounded-t bg-indigo-600"
                  style={{ height: `${((day.avgSeconds ?? 0) / maxSeconds) * 100}%` }}
                  title={
                    day.sampleCount > 0
                      ? `${day.day}: ${formatDuration(day.avgSeconds)} avg (${day.sampleCount} leads)`
                      : `${day.day}: no responses`
                  }
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
      )}
    </Card>
  );
}
