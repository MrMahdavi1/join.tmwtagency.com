import { NextResponse } from "next/server";
import { evaluate, DEFAULT_THRESHOLD } from "@/lib/scoring";
import { ROUTES } from "@/lib/routes";
import { getCalendarEmbedUrl } from "@/lib/calendar";
import { QUESTIONS, LABEL_BY_VALUE } from "@/lib/questions";
import { addNote, createOpportunity, ghlConfigured, upsertContact } from "@/lib/ghl";
import type { Answers, ContactInfo, Notes } from "@/lib/types";

export const runtime = "nodejs";

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
  const routeConfig = ROUTES[result.route];

  // ---- Persist to GHL (best-effort; never block the booking on a failure) ----
  let crmOk = false;
  let crmError: string | undefined;
  if (ghlConfigured()) {
    try {
      const routeTag = process.env[routeConfig.tagEnvKey] || routeConfig.defaultTag;
      const tags = [routeTag, "Qualifier Lead"];

      const { contactId } = await upsertContact({
        firstName: contact.firstName.trim(),
        lastName: (contact.lastName || "").trim(),
        email: contact.email.trim(),
        phone: (contact.phone || "").trim(),
        tags,
      });

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

  const calendarEmbedUrl = getCalendarEmbedUrl(result.route, contact);

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
