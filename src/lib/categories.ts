/** Warm accent color per post category, used for card dots/labels/borders. */
const CATEGORY_COLORS: Record<string, string> = {
  "AI Engineering": "oklch(0.80 0.14 72)", // amber
  "Web Development": "oklch(0.70 0.16 35)", // terracotta
  Career: "oklch(0.72 0.14 20)", // clay rose
  "Tech News": "oklch(0.82 0.13 92)", // gold
  Architecture: "oklch(0.68 0.12 50)", // ochre
};

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "oklch(0.76 0.13 60)";
}
