import { StatCard, StatCardItem } from "@/components/dashboard/StatCard";

export function StatsGrid({ items }: { items: StatCardItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}
