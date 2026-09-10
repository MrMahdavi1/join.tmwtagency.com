import { NextResponse } from "next/server";
import { searchAgents } from "@/lib/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/agents?q=gon -> matching agent names for the referral typeahead. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  return NextResponse.json({ agents: await searchAgents(q) });
}
