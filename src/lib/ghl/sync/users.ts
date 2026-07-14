import { createServiceClient } from "@/lib/supabase/service";
import { createGhlClient } from "@/lib/ghl/client";

export async function syncGhlUsers(clientId: string): Promise<{ recordsSynced: number }> {
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

  const client = createGhlClient({ locationId: connection.location_id, privateToken: token });
  const users = await client.listUsers();

  for (const user of users) {
    const { error } = await supabase.from("ghl_users").upsert(
      {
        client_id: clientId,
        ghl_user_id: user.id,
        first_name: user.firstName ?? null,
        last_name: user.lastName ?? null,
        email: user.email ?? null,
        phone: user.phone ?? null,
        role: user.role ?? null,
        permissions: user.permissions ?? {},
        raw: user as unknown as Record<string, unknown>,
      },
      { onConflict: "client_id,ghl_user_id" }
    );

    if (error) {
      throw new Error(`Failed to upsert GHL user ${user.id}: ${error.message}`);
    }
  }

  return { recordsSynced: users.length };
}
