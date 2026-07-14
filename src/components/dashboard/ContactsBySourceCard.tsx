import { Users } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ContactsBySourceItem } from "@/lib/queries/dashboard";

export function ContactsBySourceCard({ sources }: { sources: ContactsBySourceItem[] }) {
  const maxCount = Math.max(1, ...sources.map((s) => s.contactCount));

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Contacts by Source"
        subtitle="Where your synced contacts came from"
        icon={<Users className="h-5 w-5" strokeWidth={2} />}
      />

      {sources.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Sync contacts from Connect GHL to see source breakdown here."
        />
      ) : (
        <div className="mt-5 space-y-3">
          {sources.map((item) => (
            <div key={item.source}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.source}</span>
                <span className="text-gray-500">{item.contactCount}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${(item.contactCount / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
