import type { RouteId } from "./types";

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
   * Hardcoded fallback calendar embed URL used when `calendarEnvKey` is not set
   * in the environment. Lets a route ship with a guaranteed calendar (e.g. the
   * 1:1 routing to Christina) without depending on a Vercel env var being set.
   * The env var, if present, still wins. May be a full booking URL or a bare id.
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
    name: "1:1 with Tish",
    headline: "Let's talk — one on one.",
    blurb:
      "Based on your background, this is a conversation, not a presentation. Grab a time directly with Tish to talk through what a new home or partnership could look like.",
    bookingLabel: "Book your 1:1 with Tish",
    calendarEnvKey: "GHL_CALENDAR_TISH",
    tagEnvKey: "GHL_TAG_TISH",
    defaultTag: "Qualifier - 1:1 with Tish",
  },
  oneonone: {
    id: "oneonone",
    name: "1:1 Interview",
    headline: "You're a strong fit — let's go one on one.",
    blurb:
      "Your answers tell us you're ready to build. The next step is a 1:1 interview where we get specific about your path. Pick a time that works for you.",
    bookingLabel: "Book your 1:1 interview",
    calendarEnvKey: "GHL_CALENDAR_1ON1",
    // Christina is the first-round filter for 1:1s (protects Tish's calendar).
    // Ships as the default so it's guaranteed even if no env var is set.
    defaultCalendarUrl:
      "https://api.leadconnectorhq.com/widget/bookings/1on1-interview-w-christina",
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
      "Thanks for being honest with your answers. Based on where you are today, this opportunity probably isn't the right match just yet — and that's okay. When the timing and the commitment line up, we'd love to reconnect. In the meantime, here are some free resources to help you get started.",
    bookingLabel: "",
    calendarEnvKey: "GHL_CALENDAR_NOTFIT", // intentionally unset — no booking
    tagEnvKey: "GHL_TAG_NOTFIT",
    defaultTag: "Qualifier - Not a Fit",
    noBooking: true,
  },
};
