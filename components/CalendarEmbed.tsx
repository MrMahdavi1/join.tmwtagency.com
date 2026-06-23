"use client";

import { useEffect, useState } from "react";

/**
 * Renders a GoHighLevel calendar booking widget inline. The companion
 * form_embed.js script auto-sizes the iframe once it loads.
 *
 * We always render a direct "open booking page" link as well, so that if the
 * embedded widget is slow or blocked, a high-intent lead is never left without
 * a way to book.
 */
export default function CalendarEmbed({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);

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
          title="Booking calendar"
          loading="lazy"
          onLoad={() => setLoaded(true)}
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
