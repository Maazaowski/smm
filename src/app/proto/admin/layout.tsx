import { getProtoSnapshot, toSubject } from "@/lib/proto-data";
import { DeskProvider } from "@/components/proto/desk/store";

export const revalidate = 60;
export const metadata = { title: "Desk", robots: { index: false, follow: false } };

/**
 * Seeds the Desk with the real published essays, then hands off to in-memory
 * state. Nothing under here writes to the database.
 */
export default async function DeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { essays } = await getProtoSnapshot();
  const seed = essays.map((e) => ({ ...e, subject: toSubject(e.tags, e.category) }));
  return <DeskProvider seed={seed}>{children}</DeskProvider>;
}
