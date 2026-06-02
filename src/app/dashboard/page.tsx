import { redirect } from "next/navigation";
import { verifyAuth } from "@/lib/auth";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const isAuthenticated = await verifyAuth();

  if (!isAuthenticated) {
    redirect("/admin");
  }

  return <DashboardContent />;
}
