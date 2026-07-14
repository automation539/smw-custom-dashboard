import { createServiceClient } from "@/lib/supabase/service";
import { createGhlClient } from "@/lib/ghl/client";
import type { GhlApiMessage } from "@/lib/ghl/types";

// GHL's conversation timeline mixes real inbound/outbound messages with
// non-directional activity log entries (contact created, stage changed,
// form submitted, etc). Those don't represent an actual message direction
// and are skipped rather than force-fit, since ghl_messages.direction is
// used for response-time metrics.
const NON_DIRECTIONAL_MESSAGE_TYPES = new Set([
  "TYPE_ACTIVITY_CONTACT",
  "TYPE_ACTIVITY_INVOICE",
  "TYPE_ACTIVITY_PAYMENT",
  "TYPE_ACTIVITY_OPPORTUNITY",
  "TYPE_ACTIVITY_APPOINTMENT",
  "TYPE_ACTIVITY_EMPLOYEE_ACTION_LOG",
  "TYPE_ACTIVITY_WHATSAPP",
  "TYPE_FORM_SUBMISSION",
  "TYPE_INTERNAL_COMMENT",
  "TYPE_LIVE_CHAT_INFO_MESSAGE",
  "TYPE_FACEBOOK_COMMENT",
  "TYPE_INSTAGRAM_COMMENT",
  "TYPE_TIKTOK_COMMENT",
  "TYPE_SMS_REACTION",
]);

// Automated/business-initiated send types where GHL sometimes omits
// `direction` even though the message is unambiguously outbound.
const OUTBOUND_ONLY_MESSAGE_TYPES = new Set([
  "TYPE_CAMPAIGN_SMS",
  "TYPE_CAMPAIGN_CALL",
  "TYPE_CAMPAIGN_EMAIL",
  "TYPE_CAMPAIGN_VOICEMAIL",
  "TYPE_CAMPAIGN_FACEBOOK",
  "TYPE_CAMPAIGN_MANUAL_CALL",
  "TYPE_CAMPAIGN_MANUAL_SMS",
  "TYPE_CAMPAIGN_GMB",
  "TYPE_SMS_REVIEW_REQUEST",
  "TYPE_SMS_NO_SHOW_REQUEST",
]);

// Returns null for messages that should be skipped rather than inserted
// with a fabricated direction.
function resolveDirection(message: GhlApiMessage): "inbound" | "outbound" | null {
  const messageType = message.messageType ?? "";

  // Activity-log entries are never real conversational messages, even when
  // GHL itself attaches a direction to them (observed in practice) -- they
  // must not count toward response-time metrics.
  if (NON_DIRECTIONAL_MESSAGE_TYPES.has(messageType)) {
    return null;
  }

  if (message.direction === "inbound" || message.direction === "outbound") {
    return message.direction;
  }
  if (OUTBOUND_ONLY_MESSAGE_TYPES.has(messageType)) {
    return "outbound";
  }
  // `source` (workflow/bulk_actions/campaign/api/app) only appears on
  // business-initiated sends, so its presence implies outbound.
  if (message.source) {
    return "outbound";
  }

  return null;
}

export async function syncGhlMessages(clientId: string): Promise<{ recordsSynced: number }> {
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

  // Resolve GHL contact ids to our internal ghl_contacts.id so messages can
  // be linked to an already-synced contact.
  const { data: contacts } = await supabase
    .from("ghl_contacts")
    .select("id, ghl_contact_id")
    .eq("client_id", clientId);

  const contactIdByGhlContactId = new Map(
    (contacts ?? []).map((contact) => [contact.ghl_contact_id, contact.id])
  );

  const client = createGhlClient({ locationId: connection.location_id, privateToken: token });
  const messages = await client.listMessages();

  let recordsSynced = 0;

  for (const message of messages) {
    const direction = resolveDirection(message);

    if (!direction) {
      continue;
    }

    const { error } = await supabase.from("ghl_messages").upsert(
      {
        client_id: clientId,
        ghl_message_id: message.id,
        contact_id: message.contactId
          ? contactIdByGhlContactId.get(message.contactId) ?? null
          : null,
        conversation_id: message.conversationId ?? null,
        direction,
        message_type: message.messageType ?? null,
        body: message.body ?? null,
        status: message.status ?? null,
        sent_at: message.dateAdded ?? null,
        raw: message as unknown as Record<string, unknown>,
      },
      { onConflict: "client_id,ghl_message_id" }
    );

    if (error) {
      throw new Error(`Failed to upsert GHL message ${message.id}: ${error.message}`);
    }

    recordsSynced++;
  }

  return { recordsSynced };
}
