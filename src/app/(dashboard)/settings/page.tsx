import { Settings as SettingsIcon, Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: client }] = user
    ? await Promise.all([
        supabase.from("profiles").select("full_name, email, created_at").eq("id", user.id).single(),
        supabase.from("clients").select("company_name, created_at").eq("owner_id", user.id).single(),
      ])
    : [{ data: null }, { data: null }];

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your workspace preferences" />

      <Card className="p-5 sm:p-6">
        <CardHeader
          title="Account"
          subtitle="Your profile information"
          icon={<SettingsIcon className="h-5 w-5" strokeWidth={2} />}
        />
        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Full name
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{profile?.full_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{profile?.email ?? user?.email ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-5 sm:p-6">
        <CardHeader
          title="Workspace"
          subtitle="Your tenant record"
          icon={<Building2 className="h-5 w-5" strokeWidth={2} />}
        />
        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Company name
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{client?.company_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Created
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {client?.created_at ? new Date(client.created_at).toLocaleDateString() : "—"}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
