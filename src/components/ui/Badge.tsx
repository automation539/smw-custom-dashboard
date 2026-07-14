import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export type TrendDirection = "up" | "down" | "neutral";

interface TrendBadgeProps {
  value: string;
  direction: TrendDirection;
}

const directionStyles: Record<TrendDirection, string> = {
  up: "bg-emerald-50 text-emerald-700",
  down: "bg-rose-50 text-rose-700",
  neutral: "bg-gray-100 text-gray-600",
};

const directionIcon: Record<TrendDirection, typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  neutral: Minus,
};

export function TrendBadge({ value, direction }: TrendBadgeProps) {
  const Icon = directionIcon[direction];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${directionStyles[direction]}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {value}
    </span>
  );
}
