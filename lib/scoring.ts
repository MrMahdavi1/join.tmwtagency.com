import { QUESTIONS } from "./questions";
import type { Answers, QuizResult } from "./types";

/** 1:1 cutoff. Tunable — the spec starts at 60/100. */
export const DEFAULT_THRESHOLD = 60;

const MAX_SCORE = 100;

/**
 * Pure routing logic for the qualifier. Mirrors the spec exactly:
 *
 *   1. TOP GATE  -> "1:1 with Tish"  (premium tier, beats score)
 *        - Owns an agency / has producers / licensed producer seeking a new home, OR
 *        - Owned a business / led a team AND is licensed (active or newer).
 *
 *   2. FLOOR GATES -> "Group BPM"  (hard filters, beat score)
 *        - Can't commit ~10 hrs/week  ("No" never routes to a 1:1), OR
 *        - "Just exploring" (Q2), OR
 *        - "Just gathering information" (Q4).
 *
 *   3. SCORE
 *        - >= threshold -> "1:1 Interview"
 *        - <  threshold -> "Group BPM"
 *
 * Priority note: the top gate (Tish) is evaluated before the floor gates, since
 * an agency owner / producer is the highest-value tier and the spec routes them
 * to Tish "regardless of score." If you'd rather have "can't commit" override
 * even that, move the cantCommit check above the top-gate block.
 */
export function evaluate(answers: Answers, threshold = DEFAULT_THRESHOLD): QuizResult {
  let score = 0;
  for (const q of QUESTIONS) {
    if (q.kind !== "scored") continue;
    const selected = answers[q.id];
    const option = q.options.find((o) => o.value === selected);
    if (option) score += option.points;
  }

  const reasons: string[] = [];

  // ---- Top gate: 1:1 with Tish ----
  // Q8 (flagOwner): agency owner, producer-with-a-team, or a solo licensed
  // producer open to a new home all route to the premium tier.
  const ownerFlag =
    answers.flagOwner === "flag_agency" ||
    answers.flagOwner === "flag_producer_team" ||
    answers.flagOwner === "flag_solo";
  const owned = answers.q5 === "q5_owned";
  const licensed = answers.q1 === "q1_active" || answers.q1 === "q1_newer";

  if (ownerFlag) {
    reasons.push("Owns an agency / has producers, or is a licensed producer seeking a new home.");
    return { route: "tish", score, maxScore: MAX_SCORE, threshold, reasons };
  }
  if (owned && licensed) {
    reasons.push("Has owned a business or led a team and holds a license — top-tier conversation.");
    return { route: "tish", score, maxScore: MAX_SCORE, threshold, reasons };
  }

  // ---- Floor gates: Group BPM ----
  if (answers.gateCommit === "gate_no") {
    reasons.push("Not able to commit ~10 hrs/week right now — nurture via the group presentation.");
    return { route: "bpm", score, maxScore: MAX_SCORE, threshold, reasons };
  }
  if (answers.q2 === "q2_exploring") {
    reasons.push("“Just exploring” — start with the group presentation.");
    return { route: "bpm", score, maxScore: MAX_SCORE, threshold, reasons };
  }
  if (answers.q4 === "q4_exploring") {
    reasons.push("“Just exploring,” no real goal yet — start with the group presentation.");
    return { route: "bpm", score, maxScore: MAX_SCORE, threshold, reasons };
  }

  // ---- Score ----
  if (score >= threshold) {
    reasons.push(`Score ${score}/${MAX_SCORE} meets the ${threshold} cutoff — ready for a 1:1.`);
    return { route: "oneonone", score, maxScore: MAX_SCORE, threshold, reasons };
  }

  reasons.push(`Score ${score}/${MAX_SCORE} is below the ${threshold} cutoff — start with the group presentation.`);
  return { route: "bpm", score, maxScore: MAX_SCORE, threshold, reasons };
}
