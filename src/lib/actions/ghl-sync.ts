"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runGhlSync, type GhlSyncType } from "@/lib/ghl/sync";

export interface GhlSyncActionState {
  error?: string;
  success?: boolean;
}

async function triggerSync(syncType: GhlSyncType): Promise<GhlSyncActionState> {
  const supabase = await createClient();
  const { data: clientId, error: clientError } = await supabase.rpc("current_client_id");

  if (clientError || !clientId) {
    return { error: "Could not resolve your workspace." };
  }

  try {
    await runGhlSync(clientId, syncType);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Sync failed" };
  }

  revalidatePath("/connect-ghl");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function triggerGhlUsersSync(
  _prevState: GhlSyncActionState | undefined
): Promise<GhlSyncActionState> {
  return triggerSync("users");
}

export async function triggerGhlContactsSync(
  _prevState: GhlSyncActionState | undefined
): Promise<GhlSyncActionState> {
  return triggerSync("contacts");
}

export async function triggerGhlOpportunitiesSync(
  _prevState: GhlSyncActionState | undefined
): Promise<GhlSyncActionState> {
  return triggerSync("opportunities");
}

export async function triggerGhlMessagesSync(
  _prevState: GhlSyncActionState | undefined
): Promise<GhlSyncActionState> {
  return triggerSync("messages");
}

export async function triggerGhlPipelinesSync(
  _prevState: GhlSyncActionState | undefined
): Promise<GhlSyncActionState> {
  return triggerSync("pipelines");
}
