# join.tmwtagency.com — BPM vs 1:1 Qualifier

A branded Next.js questionnaire for **Talk Money With Tish & Associates** that
pre-screens recruits and routes each one to the correct GoHighLevel (GHL)
booking calendar — replacing GHL's unbranded native quiz.

It implements the scoring + routing logic from the *BPM vs 1:1 Qualifier* spec:
6 scored questions (100 pts) + 2 gates, resolving to one of three routes.

## Routes

| Route | Who | How it's decided |
| --- | --- | --- |
| **1:1 with Tish** | Agency owners / producers seeking a new home | Top gate (beats score) |
| **1:1 Interview** | Builder mindset, ready now | Score ≥ 60 (no gates tripped) |
| **Group BPM** | Exploring / not yet committed | Floor gate, or score < 60 |

Routing priority (see [`lib/scoring.ts`](lib/scoring.ts)):

1. **Top gate → Tish:** owns agency / has producers / licensed producer seeking a
   home, **or** has owned a business/led a team **and** is licensed.
2. **Floor gates → BPM:** "just exploring", "just gathering info", or can't
   commit ~10 hrs/week.
3. **Score:** ≥ 60 → 1:1 Interview, else → BPM. Cutoff is tunable via
   `QUALIFIER_THRESHOLD`.

## What happens on submit

`POST /api/submit` (server-side, in [`app/api/submit/route.ts`](app/api/submit/route.ts)):

1. Recomputes the route server-side (never trusts the client).
2. Upserts the contact in GHL with the route tag + `Qualifier Lead`.
3. Saves the full questionnaire transcript as a contact **note** (no custom-field
   setup required).
4. Optionally creates an opportunity in a pipeline stage (if configured).
5. Returns the matched calendar embed URL, which renders inline on the result
   screen with the contact's details prefilled.

GHL writes are **best-effort** — if the CRM call fails, the booking calendar
still shows so the lead is never blocked.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in your GHL values
npm run dev                  # http://localhost:3000
npm test                     # runs the routing logic unit tests
```

The app runs without any env vars — it just shows a placeholder where the
calendar would be and skips the CRM write. Fill `.env.local` to wire GHL.

## Configuration

All config lives in environment variables — see [`.env.example`](.env.example):

- `GHL_API_TOKEN`, `GHL_LOCATION_ID` — Private Integration token + sub-account id.
- `GHL_CALENDAR_BPM` / `GHL_CALENDAR_1ON1` / `GHL_CALENDAR_TISH` — calendar ids.
- `GHL_TAG_*` — per-route tags (defaults provided).
- `GHL_PIPELINE_ID` + `GHL_STAGE_*` — optional pipeline placement.
- `QUALIFIER_THRESHOLD` — 1:1 cutoff (default 60).

Questions and copy live in [`lib/questions.ts`](lib/questions.ts); route headlines
in [`lib/routes.ts`](lib/routes.ts); brand colors/fonts in
[`app/globals.css`](app/globals.css) and [`app/layout.tsx`](app/layout.tsx).

## Deploy (Vercel)

1. Push to GitHub (`MrMahdavi1/join.tmwtagency.com`).
2. Import the repo in Vercel — it auto-detects Next.js.
3. Add the env vars from `.env.example` in Vercel → Settings → Environment Variables.
4. Add the custom domain `join.tmwtagency.com`.
