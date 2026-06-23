import type { Question } from "./types";

/**
 * The 8 questions from the TMWT "BPM vs 1:1 Qualifier" spec, with the
 * client-requested copy edits (v04, 2026-06-26):
 * six scored (100 pts max) + two routing gates.
 *
 * Option `value`s are stable IDs referenced by the routing logic in
 * lib/scoring.ts — do not rename without updating that file.
 */
export const QUESTIONS: Question[] = [
  {
    id: "q1",
    kind: "scored",
    prompt: "Are you currently licensed to sell life and/or health insurance?",
    helper: "Experience here goes beyond initial training and the early growing pains of building.",
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
      { value: "q2_now", label: "I'm ready right now, this week.", points: 15 },
      { value: "q2_2wk", label: "Within the next 1–2 weeks.", points: 13 },
      { value: "q2_30", label: "Within 30 days.", points: 11 },
      { value: "q2_exploring", label: "Just exploring for now.", points: 0 },
    ],
  },
  {
    id: "q3",
    kind: "scored",
    prompt: "In addition to income and control of your time, what are you looking for most in your next venture?",
    allowMore: true,
    moreRequiredForValue: "q3_else",
    morePlaceholder: "Tell us in your own words…",
    options: [
      { value: "q3_build", label: "To build my own business and have lasting impact", points: 20 },
      { value: "q3_growth", label: "Personal & professional growth to master a craft", points: 12 },
      { value: "q3_team", label: "To be a part of a winning team / culture", points: 5 },
      { value: "q3_else", label: "Something else (please tell us in your own words)", points: 0 },
    ],
  },
  {
    id: "q4",
    kind: "scored",
    prompt: "Which of these best describes your main goal?",
    options: [
      { value: "q4_fulltime", label: "I want to build a full-time business", points: 20 },
      { value: "q4_side", label: "I want to add a significant part-time income", points: 8 },
      { value: "q4_exploring", label: "I don't really have a goal, I'm just exploring", points: 0 },
    ],
  },
  {
    id: "q5",
    kind: "scored",
    prompt: "Do you have leadership experience? Have you ever owned a business, built and led a team, or worked in commission sales?",
    options: [
      { value: "q5_owned", label: "Yes, I've owned my own business/agency AND built a team.", points: 15 },
      { value: "q5_commission", label: "I have experience and success in commission sales.", points: 10 },
      { value: "q5_w2", label: "I have only had salaried / W2 roles, but am open to new opportunities.", points: 3 },
      { value: "q5_none", label: "I don't have leadership or sales experience to note as of now.", points: 0 },
    ],
  },
  {
    id: "q6",
    kind: "scored",
    prompt: "Building and scaling a real business takes ongoing investment in yourself — your time, money, and effort. When it comes to investing in your own growth, which sounds most like you?",
    options: [
      { value: "q6_already", label: "I already invest in my own growth (coaching, courses, tools) and plan to keep doing it.", points: 15 },
      { value: "q6_ready", label: "I'm fully ready to invest my time, money, and effort — I just want guidance on where to put it.", points: 12 },
      { value: "q6_results", label: "I'll invest more once I start seeing results.", points: 5 },
      { value: "q6_provided", label: "I'd expect that investment to be provided for me.", points: 0 },
    ],
  },
  {
    id: "gateCommit",
    kind: "gate",
    prompt: "Building this, whether as your own business or a serious side income, takes at least 10 hours per week to start, and your results follow the time you put in. Looking at your work, family, and personal responsibilities, do you realistically see yourself committing at that level consistently?",
    options: [
      { value: "gate_yes", label: "Yes — I can realistically commit at least 10 hours a week, consistently.", points: 0 },
      { value: "gate_no", label: "Not right now — I can't commit to that level yet.", points: 0 },
    ],
  },
  {
    id: "flagOwner",
    kind: "gate",
    prompt: "Last one — so we match you well, where are you in your journey right now?",
    options: [
      { value: "flag_agency", label: "I own an agency with producers on my team.", points: 0 },
      { value: "flag_producer_team", label: "I'm a successful producer with a team.", points: 0 },
      { value: "flag_solo", label: "I'm a licensed producer working solo — open to a new home or partnership.", points: 0 },
      { value: "flag_newer", label: "I'm newer or just getting started.", points: 0 },
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
