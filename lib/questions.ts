import type { Question } from "./types";

/**
 * The 8 questions from the TMWT "BPM vs 1:1 Qualifier" spec:
 * six scored (100 pts max) + two routing gates.
 *
 * Option `value`s are stable IDs referenced by the routing logic in
 * lib/scoring.ts — do not rename without updating that file.
 */
export const QUESTIONS: Question[] = [
  {
    id: "q1",
    kind: "scored",
    prompt: "Are you currently licensed to sell life &amp; health insurance?",
    helper: "Experience past the “training suck.” A license isn't required to move forward — it's one input, not a disqualifier.",
    options: [
      { value: "q1_active", label: "Yes — and I'm actively using it (1+ year)", points: 15 },
      { value: "q1_newer", label: "Yes — licensed, but newer or not active", points: 8 },
      { value: "q1_none", label: "Not licensed yet", points: 0 },
    ],
  },
  {
    id: "q2",
    kind: "scored",
    prompt: "How soon are you looking to make a move?",
    options: [
      { value: "q2_now", label: "Ready now / this week", points: 15 },
      { value: "q2_30", label: "Within 30 days", points: 12 },
      { value: "q2_36", label: "3–6 months", points: 5 },
      { value: "q2_exploring", label: "Just exploring for now", points: 0 },
    ],
  },
  {
    id: "q3",
    kind: "scored",
    prompt: "Besides income and control of your time, what are you looking for most in this next chapter?",
    helper: "Money and freedom are givens — this is about what you're really building toward.",
    allowMore: true,
    morePlaceholder: "Optional — tell us more in your own words.",
    options: [
      { value: "q3_build", label: "To build something of my own / lasting impact", points: 20 },
      { value: "q3_growth", label: "Growth, mentorship, and mastering a craft", points: 12 },
      { value: "q3_team", label: "A solid team to be part of / stability", points: 5 },
      { value: "q3_unsure", label: "I'm not sure yet", points: 0 },
    ],
  },
  {
    id: "q4",
    kind: "scored",
    prompt: "Which best describes your goal?",
    options: [
      { value: "q4_fulltime", label: "Build a full-time business", points: 20 },
      { value: "q4_side", label: "A significant part-time / side income", points: 8 },
      { value: "q4_info", label: "Just gathering information", points: 0 },
    ],
  },
  {
    id: "q5",
    kind: "scored",
    prompt: "Have you ever owned a business or built / led a team?",
    options: [
      { value: "q5_owned", label: "Yes — owned a business, agency, or led a team", points: 15 },
      { value: "q5_commission", label: "I have commission-sales experience", points: 10 },
      { value: "q5_w2", label: "W-2 / salaried roles only", points: 3 },
      { value: "q5_none", label: "No work history to note", points: 0 },
    ],
  },
  {
    id: "q6",
    kind: "scored",
    prompt: "Building a real business takes ongoing growth and investment in yourself in year one — time, money, and effort. How do you plan to invest in your own development?",
    helper: "There are no wrong answers — we just want to understand where you're starting from.",
    allowMore: true,
    morePlaceholder: "Optional — tell us more about your plan.",
    options: [
      { value: "q6_plan", label: "I have a specific plan — time, money, and effort", points: 15 },
      { value: "q6_willing", label: "Willing, but I'm not sure how yet", points: 8 },
      { value: "q6_provided", label: "I'd expect it to be provided for me", points: 0 },
    ],
  },
  {
    id: "gateCommit",
    kind: "gate",
    prompt: "This path is build-your-own-business — most who succeed treat it like a real commitment (roughly 10+ hours a week to start). Are you able and willing to commit?",
    options: [
      { value: "gate_yes", label: "Yes — I'm able and willing", points: 0 },
      { value: "gate_no", label: "Not right now", points: 0 },
    ],
  },
  {
    id: "flagOwner",
    kind: "gate",
    prompt: "Last one — do you currently own an agency or have producers on your team, or are you a licensed producer looking for a new “home” or partnership?",
    options: [
      { value: "flag_yes", label: "Yes — that's me", points: 0 },
      { value: "flag_no", label: "No / not yet", points: 0 },
    ],
  },
];

export const MAX_SCORE = QUESTIONS.filter((q) => q.kind === "scored").reduce(
  (sum, q) => sum + Math.max(...q.options.map((o) => o.points)),
  0,
);

/** Quick lookup: questionId -> Question. */
export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);

/** Quick lookup: optionValue -> human label (for notes / display). */
export const LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  QUESTIONS.flatMap((q) => q.options.map((o) => [o.value, o.label])),
);
