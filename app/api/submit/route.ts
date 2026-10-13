import { NextResponse } from "next/server";
import { evaluate, DEFAULT_THRESHOLD } from "@/lib/scoring";
import { resolveAgentCode } from "@/lib/agents";
import { ROUTES } from "@/lib/routes";
import { getCalendarEmbedUrl } from "@/lib/calendar";
import { QUESTIONS, LABEL_BY_VALUE } from "@/lib/questions";
import { addNote, assignOwnerIfUnowned, createOpportunity, ghlConfigured, upsertContact } from "@/lib/ghl";
import type { Answers, ContactInfo, Notes } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Referral routing for 1:1s, Christina 13 Oct.
 *
 * An agent who is allowed to run their own 1:1 has a calendar id in the
 * `one_on_one_calendar` field on their contact record. Christina's "elite CFTs".
 * When such an agent refers someone and the answers qualify for a 1:1, the
 * booking goes on THAT agent's calendar instead of the route default.
 *
 * What happens when a NON-elite agent refers a 1:1-qualified candidate is the
 * one piece still open. Christina: "I don't want all of their one-on-ones
 * landing on my calendar... my initial thinking is that referrals from non-CFT
 * agents go to the group BPM. Let's settle this in our meeting."
 *
 * Flip this constant once they settle it. "bpm" is her stated leaning.
 *   "bpm"       -> downgrade the route to the group Company Overview
 *   "christina" -> keep the old behaviour, every 1:1 lands on Christina
 *
 * Note this only applies to REFERRED candidates. Someone who arrives from the
 * website with no referrer and qualifies for a 1:1 still books Christina, which
 * is the original design and is deliberately untouched.
 */
const NON_CFT_REFERRAL: "bpm" | "christina" = "bpm";

const ONE_ON_ONE_ROUTES = new Set(["oneonone", "tish"]);

interface SubmitBody {
  contact: ContactInfo;
  answers: Answers;
  notes?: Notes;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Build a readable transcript stored as a GHL note. */
function buildTranscript(
  contact: ContactInfo,
  answers: Answers,
  notes: Notes,
  result: ReturnType<typeof evaluate>,
): string {
  const lines: string[] = [];
  lines.push("BPM vs 1:1 Qualifier — submission");
  lines.push("");
  lines.push(`Route: ${ROUTES[result.route].name}`);
  lines.push(`Score: ${result.score}/${result.maxScore} (cutoff ${result.threshold})`);
  lines.push(`Why: ${result.reasons.join(" ")}`);
  lines.push("");
  for (const q of QUESTIONS) {
    const val = answers[q.id];
    const label = val ? LABEL_BY_VALUE[val] ?? val : "(no answer)";
    lines.push(`Q: ${q.prompt.replace(/&amp;/g, "&")}`);
    lines.push(`A: ${label}`);
    if (notes[q.id]) lines.push(`   ↳ "${notes[q.id]}"`);
    lines.push("");
  }
  return lines.join("\n");
}

export async function POST(req: Request) {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { contact, answers } = body;
  const notes = body.notes ?? {};

  // ---- Validation ----
  if (!contact?.firstName?.trim() || !contact?.email?.trim()) {
    return NextResponse.json({ error: "First name and email are required." }, { status: 400 });
  }
  if (!isValidEmail(contact.email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if ((contact.phone || "").replace(/\D/g, "").length < 10) {
    return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
  }
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Missing answers." }, { status: 400 });
  }

  // ---- Recompute the route server-side (never trust the client) ----
  const threshold = Number(process.env.QUALIFIER_THRESHOLD) || DEFAULT_THRESHOLD;
  const result = evaluate(answers, threshold);

  // Referral, decided 8 Sept. The client sends the agent's GHL id, never a code,
  // so a guest cannot type someone else's code into the form. Resolved here
  // because the routing below needs it, not just the CRM write.
  let referral: { name: string; code: string; calendarId: string } | null = null;
  if (contact.referred === "yes" && contact.referrerId) {
    try {
      referral = await resolveAgentCode(contact.referrerId);
    } catch (e) {
      // A lookup failure must never cost the candidate their booking.
      console.error("[qualifier] agent lookup failed:", e instanceof Error ? e.message : e);
    }
  }

  // Send the 1:1 to the referring agent when they are allowed to take one.
  let agentCalendarId: string | null = null;
  if (ONE_ON_ONE_ROUTES.has(result.route)) {
    if (referral?.calendarId) {
      agentCalendarId = referral.calendarId;
    } else if (referral && NON_CFT_REFERRAL === "bpm") {
      // Referred by someone who does not run their own 1:1s. They have already
      // been screened by a human, so the group overview is the right next step.
      result.route = "bpm";
      result.reasons.push("Referred by an agent who does not run 1:1s, so routed to the group overview.");
    }
  }

  const routeConfig = ROUTES[result.route];

  // ---- Persist to GHL (best-effort; never block the booking on a failure) ----
  let crmOk = false;
  let crmError: string | undefined;
  if (ghlConfigured()) {
    try {
      const routeTag = process.env[routeConfig.tagEnvKey] || routeConfig.defaultTag;
      const tags = [routeTag, "Qualifier Lead"];

      if (referral) tags.push("Referred By Agent");

      const { contactId } = await upsertContact({
        firstName: contact.firstName.trim(),
        lastName: (contact.lastName || "").trim(),
        email: contact.email.trim(),
        phone: (contact.phone || "").trim(),
        tags,
        customFields: referral
          ? [
              { key: "referring_agent_code", field_value: referral.code },
              { key: "referred_by_who_invited_you", field_value: referral.name },
            ]
          : undefined,
      });

      // Owner: Tish, unless someone already owns this contact. Best-effort, so an
      // ownership hiccup never costs the candidate their booking.
      try {
        await assignOwnerIfUnowned(contactId);
      } catch (e) {
        console.error("[qualifier] owner assignment failed:", e instanceof Error ? e.message : e);
      }

      await addNote(contactId, buildTranscript(contact, answers, notes, result));

      // Optional pipeline placement, keyed by route (only if configured).
      const stageEnvKey = `GHL_STAGE_${result.route.toUpperCase()}`;
      const pipelineStageId = process.env[stageEnvKey];
      if (pipelineStageId) {
        await createOpportunity({
          contactId,
          name: `${contact.firstName} ${contact.lastName} — ${routeConfig.name}`.trim(),
          pipelineStageId,
        });
      }

      crmOk = true;
    } catch (err) {
      crmError = err instanceof Error ? err.message : "Unknown CRM error";
      console.error("[qualifier] GHL sync failed:", crmError);
    }
  }

  const calendarEmbedUrl = getCalendarEmbedUrl(result.route, contact, agentCalendarId);

  // Optional "free resources" link shown on the not-a-fit screen. Set
  // NOTFIT_RESOURCE_URL in the environment to enable the button.
  const resourceUrl =
    result.route === "notfit" ? process.env.NOTFIT_RESOURCE_URL || null : null;

  return NextResponse.json({
    route: result.route,
    score: result.score,
    maxScore: result.maxScore,
    calendarEmbedUrl,
    resourceUrl,
    crmOk,
    crmError,
  });
}
