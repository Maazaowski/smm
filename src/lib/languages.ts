/**
 * Colour per language for the breakdown bar. Raw oklch strings for inline
 * style={{}}, matching the categoryColor() convention in categories.ts.
 *
 * These are warm-shifted approximations of the familiar Linguist colours —
 * recognisable enough to read at a glance without fighting the site palette.
 */
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "oklch(0.62 0.14 250)",
  JavaScript: "oklch(0.84 0.15 95)",
  Python: "oklch(0.66 0.12 235)",
  HTML: "oklch(0.66 0.17 40)",
  CSS: "oklch(0.60 0.15 285)",
  SCSS: "oklch(0.68 0.14 350)",
  Shell: "oklch(0.72 0.15 140)",
  PowerShell: "oklch(0.55 0.14 255)",
  Dockerfile: "oklch(0.64 0.12 245)",
  SQL: "oklch(0.70 0.13 60)",
  PLpgSQL: "oklch(0.70 0.13 60)",
  Kotlin: "oklch(0.66 0.16 310)",
  Java: "oklch(0.68 0.15 45)",
  Swift: "oklch(0.70 0.17 35)",
  Ruby: "oklch(0.60 0.19 25)",
  Go: "oklch(0.75 0.12 210)",
  Rust: "oklch(0.62 0.13 55)",
  MDX: "oklch(0.72 0.12 80)",
  Makefile: "oklch(0.62 0.10 130)",
};

/** Warm ramp for anything not in the map, so the bar stays on-palette. */
const FALLBACK_RAMP = [
  "oklch(0.80 0.14 72)",
  "oklch(0.70 0.16 35)",
  "oklch(0.82 0.13 92)",
  "oklch(0.68 0.12 50)",
  "oklch(0.72 0.14 20)",
  "oklch(0.76 0.10 60)",
];

export function languageColor(name: string, index = 0): string {
  return LANGUAGE_COLORS[name] ?? FALLBACK_RAMP[index % FALLBACK_RAMP.length];
}
