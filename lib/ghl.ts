// Minimal GoHighLevel (LeadConnector) v2 API client — server-side only.
// Uses a Private Integration token (Bearer). Never import this from a client
// component; it reads secrets from process.env.

const API_BASE = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";

function authHeaders(): HeadersInit {
  const token = process.env.GHL_API_TOKEN;
  if (!token) throw new Error("GHL_API_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    Version: API_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export function ghlConfigured(): boolean {
  return Boolean(process.env.GHL_API_TOKEN && process.env.GHL_LOCATION_ID);
}

export interface UpsertContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags: string[];
  /** id -> field value; ids come from your GHL custom fields (optional). */
  customFields?: { id: string; value: string }[];
}

export interface UpsertContactResult {
  contactId: string;
}

/**
 * Create or update a contact by email/phone within the location.
 * Docs: POST /contacts/upsert
 */
export async function upsertContact(input: UpsertContactInput): Promise<UpsertContactResult> {
  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId) throw new Error("GHL_LOCATION_ID is not set");

  const body: Record<string, unknown> = {
    locationId,
    firstName: input.firstName,
    lastName: input.lastName,
    name: `${input.firstName} ${input.lastName}`.trim(),
    email: input.email,
    phone: input.phone || undefined,
    tags: input.tags,
    source: "BPM vs 1:1 Qualifier",
  };
  if (input.customFields?.length) body.customFields = input.customFields;

  const res = await fetch(`${API_BASE}/contacts/upsert`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL upsert failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { contact?: { id?: string } };
  const contactId = data.contact?.id;
  if (!contactId) throw new Error("GHL upsert returned no contact id");
  return { contactId };
}

/**
 * Attach a note (we use this to persist the full questionnaire transcript so no
 * custom-field setup is required in GHL).
 * Docs: POST /contacts/{contactId}/notes
 */
export async function addNote(contactId: string, body: string): Promise<void> {
  const res = await fetch(`${API_BASE}/contacts/${contactId}/notes`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL addNote failed (${res.status}): ${text}`);
  }
}

/**
 * Optionally create an opportunity in a pipeline stage, if both
 * GHL_PIPELINE_ID and a stage id are configured. No-op otherwise.
 * Docs: POST /opportunities/
 */
export async function createOpportunity(args: {
  contactId: string;
  name: string;
  pipelineStageId: string;
}): Promise<void> {
  const locationId = process.env.GHL_LOCATION_ID;
  const pipelineId = process.env.GHL_PIPELINE_ID;
  if (!locationId || !pipelineId || !args.pipelineStageId) return;

  const res = await fetch(`${API_BASE}/opportunities/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      locationId,
      pipelineId,
      pipelineStageId: args.pipelineStageId,
      contactId: args.contactId,
      name: args.name,
      status: "open",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL createOpportunity failed (${res.status}): ${text}`);
  }
}
