import { ROUTES } from "./routes";
import type { ContactInfo, RouteId } from "./types";

const WIDGET_BASE = "https://api.leadconnectorhq.com/widget/booking";

/**
 * Build the GHL calendar embed URL for a route, with the contact's details
 * prefilled. Returns null if no calendar id is configured for that route yet
 * (lets the app run before the GHL ids are filled in).
 */
export function getCalendarEmbedUrl(route: RouteId, contact?: ContactInfo): string | null {
  const calendarId = process.env[ROUTES[route].calendarEnvKey];
  if (!calendarId) return null;

  const url = new URL(`${WIDGET_BASE}/${calendarId}`);
  if (contact) {
    if (contact.firstName) url.searchParams.set("first_name", contact.firstName);
    if (contact.lastName) url.searchParams.set("last_name", contact.lastName);
    if (contact.email) url.searchParams.set("email", contact.email);
    if (contact.phone) url.searchParams.set("phone", contact.phone);
  }
  return url.toString();
}
