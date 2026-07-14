import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

export interface StatCardItem {
  label: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  accent?: "indigo" | "emerald" | "rose" | "amber" | "sky" | "gray";
}

const accentClasses: Record<NonNullable<StatCardItem["accent"]>, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  gray: "bg-gray-100 text-gray-500",
};

export function StatCard({ label, value, icon: Icon, description, accent = "indigo" }: StatCardItem) {
  return (
    <Card className="p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentClasses[accent]}`}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <p className="mt-4 text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
      {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
    </Card>
  );
}
