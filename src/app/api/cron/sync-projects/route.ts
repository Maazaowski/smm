import { NextRequest, NextResponse } from "next/server";
import { syncAllProjects } from "@/lib/github/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily projects sync. Vercel invokes crons with GET and injects
 * `Authorization: Bearer $CRON_SECRET` automatically when CRON_SECRET is set in
 * the project environment.
 *
 * Kept separate from the admin sync route on purpose: this path never accepts a
 * session cookie, and that one never accepts a bearer token.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  // No secret configured means closed, not open.
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { results, tokenError } = await syncAllProjects();
    const failed = results.filter((r) => !r.ok).length;
    console.log(
      "[cron/sync-projects]",
      `${results.length - failed}/${results.length} ok`,
      tokenError ? "(token error)" : ""
    );
    return NextResponse.json({ synced: results.length, failed, results });
  } catch (err) {
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[cron/sync-projects]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
