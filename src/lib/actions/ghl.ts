"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface GhlActionState {
  error?: string;
  success?: boolean;
}

export async function saveGhlConnection(
  _prevState: GhlActionState | undefined,
  formData: FormData
): Promise<GhlActionState> {
  const locationId = String(formData.get("locationId") ?? "").trim();
  const token = String(formData.get("privateToken") ?? "").trim();

  if (!locationId || !token) {
    return { error: "Location ID and Private Integration Token are both required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_ghl_connection", {
    p_location_id: locationId,
    p_token: token,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/connect-ghl");
  return { success: true };
}

export async function disconnectGhlConnection() {
  const supabase = await createClient();
  await supabase.rpc("disconnect_ghl_connection");
  revalidatePath("/connect-ghl");
}
