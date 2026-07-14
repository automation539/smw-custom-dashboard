import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { ResolvedDateRange } from "@/lib/date-range";

const PRESETS: { id: "today" | "last7" | "last30"; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "last7", label: "Last 7 Days" },
  { id: "last30", label: "Last 30 Days" },
];

function tabClass(active: boolean) {
  return `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
    active ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
  }`;
}

// No client JS: presets are plain links (the App Router re-renders the
// Server Component page with fresh data for the new searchParams), and
// custom range is a native GET form that navigates to ?range=custom&...
// basePath lets this be reused across any page with a date-filtered view.
export function ResponseTimeFilterBar({
  dateRange,
  basePath,
}: {
  dateRange: ResolvedDateRange;
  basePath: string;
}) {
  return (
    <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <Link
            key={preset.id}
            href={`${basePath}?range=${preset.id}`}
            className={tabClass(dateRange.preset === preset.id)}
          >
            {preset.label}
          </Link>
        ))}
        <Link href={`${basePath}?range=custom`} className={tabClass(dateRange.preset === "custom")}>
          Custom Range
        </Link>
      </div>

      {dateRange.preset === "custom" && (
        <form
          method="GET"
          action={basePath}
          className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 sm:border-t-0 sm:pt-0"
        >
          <input type="hidden" name="range" value="custom" />
          <label className="flex items-center gap-2 text-sm text-gray-500">
            From
            <input
              type="date"
              name="start"
              defaultValue={dateRange.startInput}
              required
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-500">
            To
            <input
              type="date"
              name="end"
              defaultValue={dateRange.endInput}
              required
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Apply
          </button>
        </form>
      )}
    </Card>
  );
}
