"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Counter } from "@/components/site/chrome";
import { SectionSlug, Skeleton } from "@/components/admin/admin-shell";
import type { AnalyticsPayload } from "@/app/api/admin/analytics/route";

/*
 * Chart colours are the Signal tokens from signal.css, spelled out because
 * recharts takes colour props, not CSS variables. If the palette moves, move
 * these with it.
 */
const INK = {
  white: "#ffffff",
  text: "#b6bfc6",
  dim: "#8d979e",
  faint: "#6f797f",
  line: "#1c2126",
  near: "#07090b",
};

const REACTION_GLYPHS: { key: keyof AnalyticsPayload["postStats"][number]["reactions"]; glyph: string; label: string }[] = [
  { key: "fire", glyph: "🔥", label: "Fire" },
  { key: "heart", glyph: "❤️", label: "Love" },
  { key: "mindblown", glyph: "🤯", label: "Mind blown" },
  { key: "idea", glyph: "💡", label: "Useful" },
];

/** The daily series is keyed by UTC date, so it must be formatted as UTC. */
function fmtDay(iso: string, style: "short" | "long") {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: style === "short" ? "short" : "long",
    ...(style === "long" ? { year: "numeric" } : {}),
  });
}

/**
 * Loads /api/admin/analytics once and lets the caller refresh it. Shared by
 * the Essays list (views per row) and the Analytics section, so switching
 * between them does not fetch twice.
 */
export function useAnalytics() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Reload flips loading on here, not inside the effect, so the effect body
  // only subscribes to the request and writes state from its callbacks.
  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/analytics", { cache: "no-store" });
        // A 401 (expired session) used to be parsed as data and then crash the
        // page on `undefined.toLocaleString()`. Non-OK is an error, full stop.
        if (!res.ok) throw new Error(`Analytics failed to load (${res.status})`);
        const json = (await res.json()) as AnalyticsPayload;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return { data, error, loading, reload };
}

export function AnalyticsTab({
  data,
  error,
  loading,
  onReload,
}: {
  data: AnalyticsPayload | null;
  error: string | null;
  loading: boolean;
  onReload: () => void;
}) {
  const fact = data
    ? `as of ${new Date(data.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
    : loading
      ? "loading"
      : "unavailable";

  return (
    <>
      <SectionSlug tab="analytics" fact={fact} />

      <div className="ad-bar">
        <div>
          <h1 className="ad-title">Numbers with a source</h1>
          <p>
            Views are deduplicated per reader per essay. Reactions are one per
            reader per kind. Neither counts you while you are signed in here
            unless you open the essay in another browser.
          </p>
        </div>
        <div className="ad-actions">
          <button type="button" className="sg-cta" onClick={onReload} disabled={loading}>
            {loading ? "…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="ad-notice" data-tone="bad" role="alert">
          <span>{error}</span>
        </div>
      )}

      {!data && loading && <Skeleton rows={4} />}

      {data && (
        <>
          {!data.tracking && (
            <div className="ad-notice" data-tone="warn" role="status">
              <span>
                Redis is not configured, so nothing is being counted. Set
                UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to turn
                views and reactions on.
              </span>
            </div>
          )}

          <div className="sg-record ad-stats">
            <div className="sg-stat">
              <Counter to={data.totalViews} />
              <span className="sg-stat-k">Views, all time</span>
              <p className="sg-stat-src">
                {data.avgViewsPerPost.toLocaleString()} per published essay
              </p>
            </div>
            <div className="sg-stat">
              <Counter to={data.last7Views} />
              <span className="sg-stat-k">Views, last 7 days</span>
              <p className="sg-stat-src">{data.todayViews.toLocaleString()} today (UTC)</p>
            </div>
            <div className="sg-stat">
              <Counter to={data.subscribers} />
              <span className="sg-stat-k">Subscribers</span>
              <p className="sg-stat-src">One email per essay</p>
            </div>
            <div className="sg-stat">
              <Counter to={data.totalReactions} />
              <span className="sg-stat-k">Reactions</span>
              <p className="sg-stat-src">
                {data.publishedPosts} published · {data.draftPosts} draft
                {data.draftPosts === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <section className="ad-panel ad-chart" aria-label="Views over the last 30 days">
            <div className="ad-chart-head">
              <h2 className="ad-panel-h">Views · last 30 days</h2>
              <span className="sg-micro">
                {data.dailyViews.reduce((s, d) => s + d.views, 0).toLocaleString()} in
                the window
              </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.dailyViews} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={INK.line} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: INK.faint, fontFamily: "var(--mono)" }}
                  tickFormatter={(d: string) => fmtDay(d, "short")}
                  interval="preserveStartEnd"
                  minTickGap={40}
                  axisLine={{ stroke: INK.line }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: INK.faint, fontFamily: "var(--mono)" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={44}
                />
                <Tooltip
                  cursor={{ stroke: INK.dim, strokeDasharray: "2 3" }}
                  content={<ChartTip />}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke={INK.white}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: INK.white, stroke: INK.near, strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="ad-panel" aria-label="Views and reactions per essay">
            <div className="ad-chart-head">
              <h2 className="ad-panel-h">Per essay</h2>
              <span className="sg-micro">sorted by views</span>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th scope="col">Essay</th>
                    <th scope="col" className="num">
                      Views
                    </th>
                    {REACTION_GLYPHS.map((r) => (
                      <th key={r.key} scope="col" className="num" title={r.label}>
                        <span aria-hidden="true">{r.glyph}</span>
                        <span className="sr-only">{r.label}</span>
                      </th>
                    ))}
                    <th scope="col" className="num">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.postStats.map((post) => {
                    const total =
                      post.reactions.fire +
                      post.reactions.heart +
                      post.reactions.mindblown +
                      post.reactions.idea;
                    return (
                      <tr key={post.slug}>
                        <td>
                          <Link href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                            {post.title}
                          </Link>
                          {post.draft && (
                            <span className="ad-tag" data-tone="draft" style={{ marginLeft: 8 }}>
                              Draft
                            </span>
                          )}
                        </td>
                        <Num v={post.views} />
                        {REACTION_GLYPHS.map((r) => (
                          <Num key={r.key} v={post.reactions[r.key]} />
                        ))}
                        <Num v={total} />
                      </tr>
                    );
                  })}
                  {data.postStats.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ color: INK.faint }}>
                        No essays yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Num({ v }: { v: number }) {
  return (
    <td className="num" data-zero={v === 0 ? "true" : undefined}>
      {v.toLocaleString()}
    </td>
  );
}

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const v = payload[0].value;
  return (
    <div
      style={{
        background: INK.near,
        border: `1px solid ${INK.line}`,
        padding: "8px 10px",
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: INK.text,
        letterSpacing: "0.04em",
      }}
    >
      <div style={{ color: INK.faint, marginBottom: 2 }}>{fmtDay(label, "long")}</div>
      <div style={{ color: INK.white }}>
        {v.toLocaleString()} {v === 1 ? "view" : "views"}
      </div>
    </div>
  );
}
