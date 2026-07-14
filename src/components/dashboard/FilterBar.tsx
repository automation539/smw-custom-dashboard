"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { dateFilterOptions } from "@/lib/mock-data";

export function FilterBar() {
  const [activeFilter, setActiveFilter] = useState(dateFilterOptions[1].id);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {dateFilterOptions.map((option) => (
          <Button
            key={option.id}
            variant="secondary"
            active={activeFilter === option.id}
            onClick={() => setActiveFilter(option.id)}
            className="border-transparent"
          >
            {option.id === "custom" && <Calendar className="h-4 w-4" />}
            {option.label}
          </Button>
        ))}
      </div>

      {activeFilter === "custom" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 sm:border-t-0 sm:pt-0">
          <label className="flex items-center gap-2 text-sm text-gray-500">
            From
            <input
              type="date"
              defaultValue="2026-06-07"
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-500">
            To
            <input
              type="date"
              defaultValue="2026-07-07"
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
        </div>
      )}
    </div>
  );
}
