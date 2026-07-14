import { Users } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AgentContactItem } from "@/lib/queries/agents";

function contactName(contact: AgentContactItem) {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  return name || contact.phone || contact.email || "Unnamed contact";
}

const columns = ["Contact", "Status", "Source", "First Contacted"];

export function AgentContactsTable({
  contacts,
  totalCount,
}: {
  contacts: AgentContactItem[];
  totalCount: number;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Assigned Contacts"
        subtitle={
          totalCount > contacts.length
            ? `Showing ${contacts.length} most recent of ${totalCount}`
            : `${totalCount} contact${totalCount === 1 ? "" : "s"} assigned`
        }
        icon={<Users className="h-5 w-5" strokeWidth={2} />}
      />

      {contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts assigned"
          description="This agent has no assigned contacts yet."
        />
      ) : (
        <div className="mt-5 -mx-5 overflow-x-auto sm:-mx-6">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-y border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-400">
                {columns.map((col) => (
                  <th key={col} className="px-5 py-3 font-medium sm:px-6">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts.map((contact) => (
                <tr key={contact.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-medium text-gray-900 sm:px-6">
                    {contactName(contact)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">{contact.status}</td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">{contact.source ?? "—"}</td>
                  <td className="px-5 py-3.5 text-gray-600 sm:px-6">
                    {contact.firstContactedAt
                      ? new Date(contact.firstContactedAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
