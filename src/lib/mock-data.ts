export interface DateFilterOption {
  id: string;
  label: string;
}

export const dateFilterOptions: DateFilterOption[] = [
  { id: "today", label: "Today" },
  { id: "last7", label: "Last 7 Days" },
  { id: "last30", label: "Last 30 Days" },
  { id: "custom", label: "Custom Date Range" },
];
