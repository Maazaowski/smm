import { verifyAuth } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminPanel } from "@/components/admin/admin-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isAuthenticated = await verifyAuth();

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminPanel />;
}
