import { createServiceClient } from "@/lib/supabase/service";
import { createGhlClient } from "@/lib/ghl/client";

export async function syncGhlContacts(clientId: string): Promise<{ recordsSynced: number }> {
  const supabase = createServiceClient();

  const { data: connection } = await supabase
    .from("ghl_connections")
    .select("location_id")
    .eq("client_id", clientId)
    .single();

  if (!connection) {
    throw new Error("No GHL connection found for this client");
  }

  const { data: token } = await supabase.rpc("get_ghl_token", { p_client_id: clientId });

  if (!token) {
    throw new Error("No GHL token found for this client");
  }

  // Resolve GHL user ids to our internal ghl_users.id so contacts can be
  // linked to an already-synced agent. Contacts assigned to a user that
  // hasn't been synced yet are left unassigned.
  const { data: users } = await supabase
    .from("ghl_users")
    .select("id, ghl_user_id")
    .eq("client_id", clientId);

  const userIdByGhlUserId = new Map((users ?? []).map((user) => [user.ghl_user_id, user.id]));

  const client = createGhlClient({ locationId: connection.location_id, privateToken: token });
  const contacts = await client.listContacts();

  for (const contact of contacts) {
    const { error } = await supabase.from("ghl_contacts").upsert(
      {
        client_id: clientId,
        ghl_contact_id: contact.id,
        assigned_to: contact.assignedTo ? userIdByGhlUserId.get(contact.assignedTo) ?? null : null,
        first_name: contact.firstName ?? null,
        last_name: contact.lastName ?? null,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        source: contact.source ?? null,
        tags: contact.tags ?? [],
        first_contacted_at: contact.dateAdded ?? null,
        raw: contact as unknown as Record<string, unknown>,
      },
      { onConflict: "client_id,ghl_contact_id" }
    );

    if (error) {
      throw new Error(`Failed to upsert GHL contact ${contact.id}: ${error.message}`);
    }
  }

  return { recordsSynced: contacts.length };
}
