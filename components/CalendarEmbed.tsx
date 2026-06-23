"use client";

import { useEffect, useState } from "react";

/**
 * Renders a GoHighLevel calendar booking widget inline.
 *
 * GHL's form_embed.js auto-resizes the iframe to its content height on each
 * step (calendar view → details form → confirmation) — but only if the iframe
 * carries an `id` that starts with the calendar id. Without it the script can't
 * match the iframe, so it never grows and taller steps (the details form) get
 * clipped. We set that id, let the iframe grow in normal flow, and keep a
 * min-height so it never collapses while loading.
 *
 * A direct "open booking page" link is always shown as a safety net.
 */
export default function CalendarEmbed({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);

  const calendarId = (() => {
    try {
      return new URL(url).pathname.split("/").filter(Boolean).pop() || "ghl-cal";
    } catch {
      return "ghl-cal";
    }
  })();

  useEffect(() => {
    const id = "ghl-form-embed";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://link.msgsndr.com/js/form_embed.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  return (
    <div>
      <div className="calendar-wrap">
        <iframe
          src={url}
          id={calendarId}
          title="Booking calendar"
          scrolling="no"
          onLoad={() => setLoaded(true)}
          style={{ width: "100%", border: "none" }}
        />
      </div>
      <p className="calendar-fallback-link">
        {loaded ? "Prefer a new tab? " : "Calendar not showing? "}
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open the booking page →
        </a>
      </p>
    </div>
  );
}
