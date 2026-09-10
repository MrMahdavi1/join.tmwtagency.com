/**
 * Agent lookup for the "who referred you" typeahead.
 *
 * Lives in lib rather than the route file because Next.js route modules may only
 * export handlers, and the submit route needs resolveAgentCode too.
 *
 * WHY THIS READS FROM GHL RATHER THAN A LIST WE MAINTAIN.
 *
 * Christina, 5 Sept, on a hand-kept table: "we're adding those constantly...
 * that's going to be a nightmare." She is right, and a list someone has to
 * remember to update is a list that goes stale.
 *
 * Tish, 8 Sept: "essentially any agent that ICAs can be a referring agent. So
 * when they ICA, they're going to be in the system anyways."
 *
 * So the source of truth is the recruiting sub-account: any contact with an
 * Agent Code Number is referrable. Nobody maintains anything. An agent becomes
 * selectable the moment their code is set, which already happens at ICA.
 *
 * WHY IT RETURNS NAMES, NOT A DROPDOWN OF EVERYONE.
 *
 * Christina rejected a plain dropdown twice: "then they'll just pick one if they
 * don't know" and "they'll just pick a name, whether it's real or not." Tish
 * agreed. A typeahead needs the guest to know roughly who referred them, which a
 * dropdown does not.
 *
 * The code is never shown to the guest and never sent to the browser. The client
 * picks a name; the server resolves the code on submit.
 */

const GHL = "https://services.leadconnectorhq.com";
const AGENT_CODE_KEY = "agent_code_number";

export interface AgentMatch {
  /** Shown in the dropdown. */
  name: string;
  /** Opaque handle the client sends back. Not the agent code. */
  id: string;
}

/** Cached for a minute. The list changes at ICA pace, not per keystroke. */
let cache: { at: number; rows: { name: string; code: string; id: string }[] } | null = null;
const TTL_MS = 60_000;

async function loadAgents(): Promise<{ name: string; code: string; id: string }[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;

  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) return [];

  const headers = {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0 (TMWT qualifier)",
  };

  // Which custom field holds the code.
  const defsRes = await fetch(`${GHL}/locations/${locationId}/customFields?model=contact`, {
    headers,
    cache: "no-store",
  });
  if (!defsRes.ok) return [];
  const defs = await defsRes.json();
  const field = (defs?.customFields || []).find(
    (f: { fieldKey?: string }) => String(f.fieldKey || "").replace(/^contact\./, "") === AGENT_CODE_KEY
  );
  if (!field) return [];

  const rows: { name: string; code: string; id: string }[] = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`${GHL}/contacts/?locationId=${locationId}&limit=100&page=${page}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) break;
    const batch = (await res.json())?.contacts || [];
    for (const c of batch) {
      const code = (c.customFields || []).find((f: { id: string }) => f.id === field.id)?.value;
      if (!code) continue;
      const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
      if (name) rows.push({ name, code: String(code), id: c.id });
    }
    if (batch.length < 100) break;
  }

  cache = { at: Date.now(), rows };
  return rows;
}

/** Server-side resolution of a picked agent to their code. Used by the submit route. */
export async function resolveAgentCode(id: string): Promise<{ name: string; code: string } | null> {
  if (!id) return null;
  try {
    const rows = await loadAgents();
    const hit = rows.find((r) => r.id === id);
    return hit ? { name: hit.name, code: hit.code } : null;
  } catch {
    return null;
  }
}

/** Names matching a query, for the typeahead. Codes never leave the server. */
export async function searchAgents(q: string): Promise<AgentMatch[]> {
  const needle = q.trim().toLowerCase();
  // Two characters minimum, so this cannot be used to enumerate the roster.
  if (needle.length < 2) return [];
  try {
    const rows = await loadAgents();
    return rows
      .filter((r) => r.name.toLowerCase().includes(needle))
      .slice(0, 8)
      .map((r) => ({ name: r.name, id: r.id }));
  } catch {
    // A lookup failure must never block someone booking.
    return [];
  }
}
