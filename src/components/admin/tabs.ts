/**
 * The desk's sections. Plain data with no "use client" directive so the server
 * page can read the section out of the URL with the same helper the client
 * uses to render the tab row.
 */

export type AdminTab = "posts" | "projects" | "about" | "testimonials" | "analytics";

export const TABS: { id: AdminTab; label: string; n: string }[] = [
  { id: "posts", label: "Essays", n: "01" },
  { id: "projects", label: "Work", n: "02" },
  { id: "about", label: "About", n: "03" },
  { id: "testimonials", label: "References", n: "04" },
  { id: "analytics", label: "Analytics", n: "05" },
];

export function toAdminTab(value: string | undefined): AdminTab {
  return TABS.some((t) => t.id === value) ? (value as AdminTab) : "posts";
}

export function tabHref(tab: AdminTab) {
  return tab === "posts" ? "/admin" : `/admin?tab=${tab}`;
}
