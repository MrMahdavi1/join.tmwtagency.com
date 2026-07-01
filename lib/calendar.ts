import { ROUTES } from "./routes";
import type { ContactInfo, RouteId } from "./types";

const WIDGET_BASE = "https://api.leadconnectorhq.com/widget/booking";

/**
 * Build the GHL calendar embed URL for a route, with the contact's details
 * prefilled. Returns null if the route books nothing (e.g. "not a fit") or has
 * no calendar configured yet.
 *
 * The configured value can be either:
 *   - a full booking URL  (e.g. ".../widget/bookings/1on1-interview-w-christina"), or
 *   - a bare calendar id  (e.g. "Fdsuq47BXjgpKtNacukU") → wrapped in WIDGET_BASE.
 *
 * Resolution order: `forceCalendarUrl` (always wins) → the route's env var →
 * its `defaultCalendarUrl`.
 */
export function getCalendarEmbedUrl(route: RouteId, contact?: ContactInfo): string | null {
  const cfg = ROUTES[route];
  if (cfg.noBooking) return null;

  const fromEnv = process.env[cfg.calendarEnvKey];
  const raw = cfg.forceCalendarUrl || (fromEnv && fromEnv.trim()) || cfg.defaultCalendarUrl;
  if (!raw) return null;

  const base = /^https?:\/\//i.test(raw) ? raw : `${WIDGET_BASE}/${raw}`;
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return null;
  }
  if (contact) {
    if (contact.firstName) url.searchParams.set("first_name", contact.firstName);
    if (contact.lastName) url.searchParams.set("last_name", contact.lastName);
    if (contact.email) url.searchParams.set("email", contact.email);
    if (contact.phone) url.searchParams.set("phone", contact.phone);
  }
  return url.toString();
}
