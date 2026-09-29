import { verifyAuth } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminPanel } from "@/components/admin/admin-panel";
import { toAdminTab } from "@/components/admin/tabs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Desk",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

/**
 * One route for the whole desk. The section is in the URL (`?tab=`) so a
 * section can be bookmarked, refreshed, and linked to from anywhere — the old
 * arrangement kept the tab in component state and put analytics on a second
 * page, so a refresh always landed on Posts and "the dashboard" was a
 * different place.
 */
export default async function AdminPage({ searchParams }: Props) {
  const isAuthenticated = await verifyAuth();

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  const { tab } = await searchParams;
  return <AdminPanel tab={toAdminTab(tab)} />;
}
