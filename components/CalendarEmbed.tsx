"use client";

import { useEffect } from "react";

/**
 * Renders a GoHighLevel calendar booking widget inline. The companion
 * form_embed.js script auto-sizes the iframe once it loads.
 */
export default function CalendarEmbed({ url }: { url: string }) {
  useEffect(() => {
    const id = "ghl-form-embed";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://link.msgsndr.com/js/form_embed.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return (
    <div className="calendar-wrap">
      <iframe
        src={url}
        title="Booking calendar"
        scrolling="no"
        loading="lazy"
      />
    </div>
  );
}
