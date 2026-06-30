// Shared domain types for the BPM vs 1:1 qualifier.

export type RouteId = "bpm" | "oneonone" | "tish" | "notfit";

export interface Option {
  value: string;
  label: string;
  /** Points contributed to the score. Gate options are 0. */
  points: number;
}

export interface Question {
  id: string;
  /** "scored" questions add to the 100-pt total; "gate" questions only route. */
  kind: "scored" | "gate";
  prompt: string;
  helper?: string;
  options: Option[];
  /** Show an optional free-text box the agent reads before the meeting. */
  allowMore?: boolean;
  morePlaceholder?: string;
  /** If this option value is selected, the free-text box becomes required. */
  moreRequiredForValue?: string;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/** Map of questionId -> selected option value. */
export type Answers = Record<string, string>;

/** Optional free-text per question (the "tell us more" boxes). */
export type Notes = Record<string, string>;

export interface QuizResult {
  route: RouteId;
  score: number;
  maxScore: number;
  threshold: number;
  /** Human-readable explanation of why this route was chosen. */
  reasons: string[];
}
