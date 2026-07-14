import type {
  GhlApiContact,
  GhlApiConversation,
  GhlApiMessage,
  GhlApiOpportunity,
  GhlApiPaginationMeta,
  GhlApiPipeline,
  GhlApiUser,
} from "@/lib/ghl/types";

export interface GhlClientConfig {
  locationId: string;
  privateToken: string;
}

export interface GhlClient {
  listUsers(): Promise<GhlApiUser[]>;
  listContacts(): Promise<GhlApiContact[]>;
  listOpportunities(): Promise<GhlApiOpportunity[]>;
  listMessages(): Promise<GhlApiMessage[]>;
  listPipelines(): Promise<GhlApiPipeline[]>;
}

const GHL_API_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";
const CONTACTS_PAGE_LIMIT = 100;
const CONTACTS_MAX_PAGES = 50; // safety cap against a pagination loop bug
const OPPORTUNITIES_PAGE_LIMIT = 100;
const OPPORTUNITIES_MAX_PAGES = 50; // safety cap against a pagination loop bug

// The Conversations API is versioned separately from Contacts/Users/
// Opportunities -- confirmed against GHL's published OpenAPI spec.
const CONVERSATIONS_API_VERSION = "2021-04-15";
// /conversations/search's own pagination cursor field isn't clearly
// documented (its response has no meta/nextPage object, only a `total`),
// so this fetches a single page rather than guessing at an unconfirmed
// cursor. Revisit if a location has more than this many conversations.
const CONVERSATIONS_PAGE_LIMIT = 100;
const MESSAGES_PAGE_LIMIT = 100;
const MESSAGES_MAX_PAGES_PER_CONVERSATION = 10; // safety cap against a pagination loop bug

// Based on published GHL API v2 conventions (Bearer auth + dated Version
// header against services.leadconnectorhq.com). Verified against a live
// account for /users/, /contacts/, and /opportunities/search. Note: unlike
// the others, /opportunities/search requires "location_id" (snake_case)
// instead of "locationId" -- confirmed against GHL's published OpenAPI spec.
export function createGhlClient(config: GhlClientConfig): GhlClient {
  async function ghlGet(
    path: string,
    params: Record<string, string> = {},
    version: string = GHL_API_VERSION
  ) {
    const url = new URL(path, GHL_API_BASE_URL);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.privateToken}`,
        Version: version,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GHL API error ${response.status} on ${path}: ${body}`);
    }

    return response.json();
  }

  return {
    async listUsers() {
      const data = await ghlGet("/users/", { locationId: config.locationId });
      return (data.users ?? []) as GhlApiUser[];
    },
    async listContacts() {
      const results: GhlApiContact[] = [];
      let startAfter: string | undefined;
      let startAfterId: string | undefined;

      for (let page = 0; page < CONTACTS_MAX_PAGES; page++) {
        const params: Record<string, string> = {
          locationId: config.locationId,
          limit: String(CONTACTS_PAGE_LIMIT),
        };
        if (startAfter) params.startAfter = startAfter;
        if (startAfterId) params.startAfterId = startAfterId;

        const data = await ghlGet("/contacts/", params);
        const contacts = (data.contacts ?? []) as GhlApiContact[];
        results.push(...contacts);

        const meta = (data.meta ?? {}) as GhlApiPaginationMeta;
        const gotFullPage = contacts.length === CONTACTS_PAGE_LIMIT;

        if (!gotFullPage || !meta.startAfterId || meta.startAfter === undefined) {
          break;
        }

        startAfter = String(meta.startAfter);
        startAfterId = meta.startAfterId;
      }

      return results;
    },
    async listOpportunities() {
      const results: GhlApiOpportunity[] = [];
      let startAfter: string | undefined;
      let startAfterId: string | undefined;

      for (let page = 0; page < OPPORTUNITIES_MAX_PAGES; page++) {
        const params: Record<string, string> = {
          location_id: config.locationId,
          status: "all",
          limit: String(OPPORTUNITIES_PAGE_LIMIT),
        };
        if (startAfter) params.startAfter = startAfter;
        if (startAfterId) params.startAfterId = startAfterId;

        const data = await ghlGet("/opportunities/search", params);
        const opportunities = (data.opportunities ?? []) as GhlApiOpportunity[];
        results.push(...opportunities);

        const meta = (data.meta ?? {}) as GhlApiPaginationMeta;
        const gotFullPage = opportunities.length === OPPORTUNITIES_PAGE_LIMIT;

        if (!gotFullPage || !meta.startAfterId || meta.startAfter === undefined) {
          break;
        }

        startAfter = String(meta.startAfter);
        startAfterId = meta.startAfterId;
      }

      return results;
    },
    async listMessages() {
      const conversationsData = await ghlGet(
        "/conversations/search",
        { locationId: config.locationId, limit: String(CONVERSATIONS_PAGE_LIMIT) },
        CONVERSATIONS_API_VERSION
      );
      const conversations = (Array.isArray(conversationsData.conversations)
        ? conversationsData.conversations
        : []) as GhlApiConversation[];

      const results: GhlApiMessage[] = [];

      for (const conversation of conversations) {
        let lastMessageId: string | undefined;

        for (let page = 0; page < MESSAGES_MAX_PAGES_PER_CONVERSATION; page++) {
          const params: Record<string, string> = { limit: String(MESSAGES_PAGE_LIMIT) };
          if (lastMessageId) params.lastMessageId = lastMessageId;

          const data = await ghlGet(
            `/conversations/${conversation.id}/messages`,
            params,
            CONVERSATIONS_API_VERSION
          );

          // GHL nests the paginated payload under an extra "messages" key
          // in practice, unlike its published schema which shows it flat --
          // handle both shapes rather than assume one.
          const raw = data.messages;
          const page_ = Array.isArray(raw)
            ? { messages: raw as GhlApiMessage[], nextPage: Boolean(data.nextPage), lastMessageId: data.lastMessageId as string | undefined }
            : raw && Array.isArray(raw.messages)
              ? { messages: raw.messages as GhlApiMessage[], nextPage: Boolean(raw.nextPage), lastMessageId: raw.lastMessageId as string | undefined }
              : { messages: [] as GhlApiMessage[], nextPage: false, lastMessageId: undefined };

          results.push(...page_.messages);

          if (!page_.nextPage || page_.messages.length === 0 || !page_.lastMessageId) {
            break;
          }
          lastMessageId = page_.lastMessageId;
        }
      }

      return results;
    },
    async listPipelines() {
      const data = await ghlGet("/opportunities/pipelines", { locationId: config.locationId });
      return (Array.isArray(data.pipelines) ? data.pipelines : []) as GhlApiPipeline[];
    },
  };
}
