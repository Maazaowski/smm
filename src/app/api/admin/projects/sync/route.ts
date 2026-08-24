import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { syncAllProjects } from "@/lib/github/sync";

export const dynamic = "force-dynamic";
/** The activity-stats endpoint answers 202 and needs retries; 10s is not enough. */
export const maxDuration = 60;

export async function POST() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await syncAllProjects();
    return NextResponse.json(summary);
  } catch (err) {
    const message = (err as { message?: string })?.message ?? String(err);
    console.error("[admin/projects/sync POST]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
