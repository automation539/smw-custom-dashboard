import { Activity, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AgentActivityItem } from "@/lib/queries/agents";

function contactName(item: AgentActivityItem) {
  const name = [item.contactFirstName, item.contactLastName].filter(Boolean).join(" ");
  return name || "Unnamed contact";
}

export function AgentActivityFeed({ activity }: { activity: AgentActivityItem[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Recent Activity"
        subtitle="Latest messages across this agent's assigned contacts"
        icon={<Activity className="h-5 w-5" strokeWidth={2} />}
      />

      {activity.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="No messages for this agent's contacts yet."
        />
      ) : (
        <div className="mt-5 divide-y divide-gray-100">
          {activity.map((item) => (
            <div key={item.messageId} className="flex items-start gap-3 py-3 text-sm">
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  item.direction === "inbound"
                    ? "bg-sky-50 text-sky-600"
                    : "bg-indigo-50 text-indigo-600"
                }`}
              >
                {item.direction === "inbound" ? (
                  <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={2} />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">{contactName(item)}</span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {item.sentAt ? new Date(item.sentAt).toLocaleString() : "—"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {item.messageType ?? "Message"}
                  {item.body ? ` · ${item.body}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
