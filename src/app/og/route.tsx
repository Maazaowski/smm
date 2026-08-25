import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Social cards, in the Signal language.
 *
 * The previous version rendered a #0d1117 ground with a #58a6ff → #a371f7
 * gradient rule — the exact purple-blue that the whole redesign was a reaction
 * against, sitting on every link ever shared.
 *
 * No webfont is fetched. @vercel/og cannot run canvas, so the generative plates
 * are out, and pulling a display face over the network on every card render
 * would add a failure mode for a 1200x630 PNG. The identity is carried by
 * layout instead: black ground, the blueprint grid, the slug line, and type set
 * as large as it will go. That degrades to "still unmistakably this site" on any
 * renderer rather than to "broken".
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") ?? "Syed Muhammad Maaz";
  const date = searchParams.get("date") ?? "";
  const readingTime = searchParams.get("readingTime") ?? "";
  const category = searchParams.get("category") ?? "";

  // Long titles need to step down or they overflow the plate.
  const size = title.length > 68 ? 60 : title.length > 42 ? 74 : 92;

  const mono =
    'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace';

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000000",
          padding: "56px 64px",
          position: "relative",
        }}
      >
        {/* blueprint ground */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "68px 68px",
          }}
        />

        {/* slug line: [--] // CATEGORY .......... MAAZ */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #2b3238",
            paddingTop: 16,
            fontFamily: mono,
            fontSize: 20,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#6f797f",
          }}
        >
          <span style={{ color: "#ffffff" }}>
            {category ? `// ${category}` : "// Maaz"}
          </span>
          <span>{[date, readingTime].filter(Boolean).join("  ·  ")}</span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: size,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
            color: "#ffffff",
            textTransform: "uppercase",
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px solid #2b3238",
            paddingTop: 16,
            fontFamily: mono,
            fontSize: 20,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#8d979e",
          }}
        >
          <span style={{ color: "#ffffff", fontWeight: 700 }}>MAAZ</span>
          <span
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: "#3fd7e8",
                display: "flex",
              }}
            />
            maazaowski.com
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
