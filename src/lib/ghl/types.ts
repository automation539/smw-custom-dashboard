// Anticipated shapes of GoHighLevel API v2 payloads. These map to the
// ghl_* tables and will be refined once real API integration begins.

export interface GhlApiUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions?: Record<string, unknown>;
}

export interface GhlApiContact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source?: string;
  tags?: string[];
  assignedTo?: string;
  dateAdded?: string;
}

export interface GhlApiPaginationMeta {
  total?: number;
  nextPageUrl?: string;
  startAfter?: string | number;
  startAfterId?: string;
}

export interface GhlApiOpportunity {
  id: string;
  name?: string;
  pipelineId?: string;
  pipelineStageId?: string;
  status?: string;
  monetaryValue?: number;
  contactId?: string;
  assignedTo?: string;
}

export interface GhlApiConversation {
  id: string;
  contactId?: string;
}

export interface GhlApiMessage {
  id: string;
  conversationId?: string;
  contactId?: string;
  direction?: "inbound" | "outbound";
  messageType?: string;
  body?: string;
  status?: string;
  source?: string;
  dateAdded?: string;
}

export interface GhlApiPipeline {
  id: string;
  name?: string;
  // GHL's published OpenAPI spec itself can't determine this sub-shape
  // (documented as a generic array of arrays) -- parsed defensively in
  // the sync layer rather than typed here as if it were confirmed.
  stages?: unknown[];
}
