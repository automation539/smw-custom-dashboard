"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, Pencil, Plug } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  disconnectGhlConnection,
  saveGhlConnection,
  type GhlActionState,
} from "@/lib/actions/ghl";

export interface GhlConnectionSummary {
  location_id: string;
  connected_at: string;
}

const initialState: GhlActionState = {};

export function GhlConnectionManager({
  connection,
}: {
  connection: GhlConnectionSummary | null;
}) {
  const [state, formAction, isPending] = useActionState(saveGhlConnection, initialState);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (state.success) {
      setEditing(false);
    }
  }, [state]);

  const showStatus = Boolean(connection) && !editing;

  if (showStatus && connection) {
    return (
      <Card className="p-5 sm:p-6">
        <CardHeader
          title="GoHighLevel"
          subtitle="Your CRM connection for this workspace"
          icon={<Plug className="h-5 w-5" strokeWidth={2} />}
        />

        <div className="mt-5 flex items-start gap-3 rounded-lg bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} />
          <div>
            <p className="text-sm font-medium text-emerald-800">Connected</p>
            <p className="mt-0.5 text-xs text-emerald-700">
              Location ID {connection.location_id} · connected{" "}
              {new Date(connection.connected_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          Your Private Integration Token is stored encrypted and is never displayed again. Lead
          syncing is not enabled yet.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
            Update connection
          </Button>
          <form action={disconnectGhlConnection}>
            <Button type="submit" variant="secondary" className="text-rose-600 hover:bg-rose-50">
              Disconnect
            </Button>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Connect GoHighLevel"
        subtitle="Enter your sub-account credentials to link this workspace"
        icon={<Plug className="h-5 w-5" strokeWidth={2} />}
      />

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">
            Location ID
          </label>
          <input
            id="locationId"
            name="locationId"
            type="text"
            required
            defaultValue={connection?.location_id ?? ""}
            placeholder="e.g. ve9EPM428h8vShlRW1KT"
            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="privateToken" className="block text-sm font-medium text-gray-700">
            Private Integration Token
          </label>
          <input
            id="privateToken"
            name="privateToken"
            type="password"
            required
            autoComplete="off"
            placeholder="pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Stored encrypted via Supabase Vault. It is never displayed again after saving.
          </p>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
        )}

        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Saving..." : connection ? "Save changes" : "Connect GoHighLevel"}
          </Button>
          {connection && (
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
