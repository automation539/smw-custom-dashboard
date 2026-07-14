import { createServiceClient } from "@/lib/supabase/service";
import { createGhlClient } from "@/lib/ghl/client";

export async function syncGhlOpportunities(clientId: string): Promise<{ recordsSynced: number }> {
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

  // Resolve GHL user/contact ids to our internal ids so opportunities can be
  // linked to already-synced agents and contacts. Opportunities referencing
  // a user/contact that hasn't been synced yet are left unlinked.
  const [{ data: users }, { data: contacts }] = await Promise.all([
    supabase.from("ghl_users").select("id, ghl_user_id").eq("client_id", clientId),
    supabase.from("ghl_contacts").select("id, ghl_contact_id").eq("client_id", clientId),
  ]);

  const userIdByGhlUserId = new Map((users ?? []).map((user) => [user.ghl_user_id, user.id]));
  const contactIdByGhlContactId = new Map(
    (contacts ?? []).map((contact) => [contact.ghl_contact_id, contact.id])
  );

  const client = createGhlClient({ locationId: connection.location_id, privateToken: token });
  const opportunities = await client.listOpportunities();

  for (const opportunity of opportunities) {
    const { error } = await supabase.from("ghl_opportunities").upsert(
      {
        client_id: clientId,
        ghl_opportunity_id: opportunity.id,
        contact_id: opportunity.contactId
          ? contactIdByGhlContactId.get(opportunity.contactId) ?? null
          : null,
        assigned_to: opportunity.assignedTo
          ? userIdByGhlUserId.get(opportunity.assignedTo) ?? null
          : null,
        pipeline_id: opportunity.pipelineId ?? null,
        pipeline_stage_id: opportunity.pipelineStageId ?? null,
        name: opportunity.name ?? null,
        status: opportunity.status ?? "open",
        monetary_value: opportunity.monetaryValue ?? null,
        raw: opportunity as unknown as Record<string, unknown>,
      },
      { onConflict: "client_id,ghl_opportunity_id" }
    );

    if (error) {
      throw new Error(`Failed to upsert GHL opportunity ${opportunity.id}: ${error.message}`);
    }
  }

  return { recordsSynced: opportunities.length };
}
