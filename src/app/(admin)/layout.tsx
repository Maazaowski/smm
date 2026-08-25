import type { Metadata } from "next";
import { Inter } from "next/font/google";

/**
 * The admin shell.
 *
 * Deliberately separate from (site). The admin is still on the old Tailwind
 * styling and does not need — or want — the public site's display faces,
 * blueprint ground, header, footer or scroll machinery. Before the route-group
 * split it inherited all of that, which is why the login screen used to render
 * a newsletter signup form and a Guestbook link underneath the password box.
 *
 * Restyling the admin into Signal is separate work.
 */

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} dark min-h-screen bg-bg text-primary`}>
      {children}
    </div>
  );
}
