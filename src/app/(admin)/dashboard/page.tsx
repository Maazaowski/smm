import { redirect } from "next/navigation";

/**
 * /dashboard was the analytics half of the admin on its own page. It is now
 * the Analytics section of /admin; this keeps the old bookmark working.
 */
export default function DashboardPage() {
  redirect("/admin?tab=analytics");
}
