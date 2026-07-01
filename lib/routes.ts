import type { RouteId } from "./types";

/**
 * Christina's 1:1 booking calendar. Christina is the single first-round filter
 * for EVERY 1:1 on the qualifier (agency-owner tier included) — Tish's calendar
 * must never surface here. Hardcoded via `forceCalendarUrl` so no stale Vercel
 * env var can point a 1:1 route back at Tish.
 */
const CHRISTINA_1ON1_URL =
  "https://api.leadconnectorhq.com/widget/booking/stpcAKnqCXRrOyh372GO";

/**
 * Per-route presentation + GHL wiring.
 *
 * `calendarEnvKey` / `tagEnvKey` are read server-side in the API route so the
 * actual GHL IDs never ship to the browser — only the matched route's calendar
 * embed URL is returned to the client.
 */
export interface RouteConfig {
  id: RouteId;
  /** Internal name (also used in the GHL note). */
  name: string;
  /** Headline shown on the result screen. */
  headline: string;
  /** Supporting copy under the headline. */
  blurb: string;
  /** Label for the booking section. */
  bookingLabel: string;
  calendarEnvKey: string;
  /**
   * Hardcoded calendar embed URL that ALWAYS wins — over both the env var and
   * `defaultCalendarUrl`. Use when a route must book a specific calendar no
   * matter what's configured in the environment (e.g. every 1:1 → Christina).
   */
  forceCalendarUrl?: string;
  /**
   * Fallback calendar embed URL used when `calendarEnvKey` is not set in the
   * environment. The env var, if present, wins over this. May be a full booking
   * URL or a bare id.
   */
  defaultCalendarUrl?: string;
  tagEnvKey: string;
  defaultTag: string;
  /** When true, this route books nothing — it's a polite decline. */
  noBooking?: boolean;
}

export const ROUTES: Record<RouteId, RouteConfig> = {
  tish: {
    id: "tish",
    // The premium tier still gets its own tag for segmentation, but it books
    // Christina (the first-round filter) — never Tish's calendar directly.
    name: "Priority 1:1 Interview",
    headline: "Let's talk — one on one.",
    blurb:
      "Based on your background, this is a conversation, not a presentation. Grab a time to talk through what a new home or partnership could look like.",
    bookingLabel: "Book your priority 1:1",
    calendarEnvKey: "GHL_CALENDAR_TISH",
    forceCalendarUrl: CHRISTINA_1ON1_URL,
    tagEnvKey: "GHL_TAG_TISH",
    defaultTag: "Qualifier - Priority 1:1 (Owner/Producer)",
  },
  oneonone: {
    id: "oneonone",
    name: "1:1 Interview",
    headline: "You're a strong fit — let's go one on one.",
    blurb:
      "Your answers tell us you're ready to build. The next step is a 1:1 interview where we get specific about your path. Pick a time that works for you.",
    bookingLabel: "Book your 1:1 interview",
    calendarEnvKey: "GHL_CALENDAR_1ON1",
    // Every 1:1 books Christina, guaranteed (env can't override).
    forceCalendarUrl: CHRISTINA_1ON1_URL,
    tagEnvKey: "GHL_TAG_1ON1",
    defaultTag: "Qualifier - 1:1 Interview",
  },
  bpm: {
    id: "bpm",
    name: "Group Business Presentation",
    headline: "Start with the big picture.",
    blurb:
      "The best next step for you is to attend a Company Overview, a no-pressure overview of how this works and where you could fit. Reserve your seat below.",
    bookingLabel: "Reserve your seat at the Company Overview",
    calendarEnvKey: "GHL_CALENDAR_BPM",
    tagEnvKey: "GHL_TAG_BPM",
    defaultTag: "Qualifier - Group BPM",
  },
  notfit: {
    id: "notfit",
    name: "Not a fit right now",
    headline: "This may not be the right fit — right now.",
    blurb:
      "Thanks for being honest with your answers. Based on where you are today, this opportunity probably isn't the right match just yet — and that's okay. When the timing and the commitment line up, we'd love to reconnect.",
    bookingLabel: "",
    calendarEnvKey: "GHL_CALENDAR_NOTFIT", // intentionally unset — no booking
    tagEnvKey: "GHL_TAG_NOTFIT",
    defaultTag: "Qualifier - Not a Fit",
    noBooking: true,
  },
};
