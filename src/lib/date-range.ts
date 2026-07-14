export type DateRangePreset = "today" | "last7" | "last30" | "custom";

export interface ResolvedDateRange {
  preset: DateRangePreset;
  start: string;
  end: string;
  startInput: string;
  endInput: string;
}

interface RawDateRangeParams {
  range?: string;
  start?: string;
  end?: string;
}

function utcDayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
  );
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
  );
  return { start, end };
}

function daysAgoRange(daysBack: number, endOfToday: Date): { start: Date; end: Date } {
  const start = new Date(endOfToday);
  start.setUTCDate(start.getUTCDate() - daysBack);
  return { start: utcDayBounds(start).start, end: endOfToday };
}

export function resolveDateRange(params: RawDateRangeParams): ResolvedDateRange {
  const now = new Date();
  const { start: startOfToday, end: endOfToday } = utcDayBounds(now);

  const requestedPreset: DateRangePreset =
    params.range === "today" || params.range === "last30" || params.range === "custom"
      ? params.range
      : "last7";

  if (requestedPreset === "custom") {
    if (params.start && params.end) {
      const start = new Date(`${params.start}T00:00:00.000Z`);
      const end = new Date(`${params.end}T23:59:59.999Z`);
      return {
        preset: "custom",
        start: start.toISOString(),
        end: end.toISOString(),
        startInput: params.start,
        endInput: params.end,
      };
    }
    // Custom selected but no dates chosen yet -- show the form, default the
    // underlying query range to the last 7 days until one is submitted.
    const { start } = daysAgoRange(6, endOfToday);
    return {
      preset: "custom",
      start: start.toISOString(),
      end: endOfToday.toISOString(),
      startInput: start.toISOString().slice(0, 10),
      endInput: endOfToday.toISOString().slice(0, 10),
    };
  }

  if (requestedPreset === "today") {
    return {
      preset: "today",
      start: startOfToday.toISOString(),
      end: endOfToday.toISOString(),
      startInput: startOfToday.toISOString().slice(0, 10),
      endInput: endOfToday.toISOString().slice(0, 10),
    };
  }

  if (requestedPreset === "last30") {
    const { start } = daysAgoRange(29, endOfToday);
    return {
      preset: "last30",
      start: start.toISOString(),
      end: endOfToday.toISOString(),
      startInput: start.toISOString().slice(0, 10),
      endInput: endOfToday.toISOString().slice(0, 10),
    };
  }

  const { start } = daysAgoRange(6, endOfToday);
  return {
    preset: "last7",
    start: start.toISOString(),
    end: endOfToday.toISOString(),
    startInput: start.toISOString().slice(0, 10),
    endInput: endOfToday.toISOString().slice(0, 10),
  };
}
