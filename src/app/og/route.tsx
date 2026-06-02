import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") ?? "maazaowski";
  const date = searchParams.get("date") ?? "";
  const readingTime = searchParams.get("readingTime") ?? "";
  const category = searchParams.get("category") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top: Category */}
        {category && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                background: "rgba(88, 166, 255, 0.15)",
                border: "1px solid rgba(88, 166, 255, 0.3)",
                borderRadius: "9999px",
                padding: "6px 16px",
                color: "#58a6ff",
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              {category}
            </div>
          </div>
        )}

        {/* Middle: Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              fontSize: title.length > 50 ? "42px" : "52px",
              fontWeight: 700,
              color: "#e6edf3",
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h1>
        </div>

        {/* Bottom: Author + Meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #58a6ff, #a371f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              M
            </div>
            <span
              style={{
                color: "#e6edf3",
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              maazaowski
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              color: "#8b949e",
              fontSize: "16px",
            }}
          >
            {date && (
              <span>
                {new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            {readingTime && <span>· {readingTime}</span>}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
