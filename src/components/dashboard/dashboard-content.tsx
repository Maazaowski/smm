"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PostStat {
  slug: string;
  title: string;
  views: number;
  reactions: {
    fire: number;
    heart: number;
    mindblown: number;
    idea: number;
  };
}

interface Analytics {
  totalViews: number;
  totalReactions: number;
  totalPosts: number;
  avgViewsPerPost: number;
  postStats: PostStat[];
  dailyViews: { date: string; views: number }[];
}

export function DashboardContent() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-shimmer" />
          ))}
        </div>
        <div className="h-64 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center">
        <p className="text-secondary">Failed to load analytics.</p>
      </div>
    );
  }

  const summaryCards = [
    { label: "Total Views", value: data.totalViews },
    { label: "Total Reactions", value: data.totalReactions },
    { label: "Total Posts", value: data.totalPosts },
    { label: "Avg Views/Post", value: data.avgViewsPerPost },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-primary">Dashboard</h1>
        <Link
          href="/admin"
          className="rounded-xl border border-glass-border bg-glass-bg px-4 py-2 text-sm text-secondary hover:text-primary transition-all"
        >
          Admin Panel
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {summaryCards.map((card) => (
          <GlassCard key={card.label} className="p-6" hover={false}>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">
              {card.label}
            </p>
            <p className="text-3xl font-semibold text-primary tabular-nums">
              {card.value.toLocaleString()}
            </p>
          </GlassCard>
        ))}
      </div>

      {/* Views Over Time Chart */}
      <GlassCard className="p-6 mb-8" hover={false}>
        <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">
          Views (Last 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.dailyViews}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "oklch(0.45 0.01 260)" }}
              tickFormatter={(d: string) =>
                new Date(d).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "oklch(0.45 0.01 260)" }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: "oklch(0.16 0.01 260)",
                border: "1px solid oklch(1 0 0 / 0.08)",
                borderRadius: "12px",
                color: "oklch(0.95 0.005 260)",
                fontSize: "13px",
              }}
              labelFormatter={(d) =>
                new Date(String(d)).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              }
            />
            <Line
              type="monotone"
              dataKey="views"
              stroke="oklch(0.70 0.15 250)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "oklch(0.70 0.15 250)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Top Posts Table */}
      <GlassCard className="p-6" hover={false}>
        <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">
          Top Posts
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-glass-border text-left">
                <th className="pb-3 text-muted font-medium">Post</th>
                <th className="pb-3 text-muted font-medium text-right">
                  Views
                </th>
                <th className="pb-3 text-muted font-medium text-right">🔥</th>
                <th className="pb-3 text-muted font-medium text-right">❤️</th>
                <th className="pb-3 text-muted font-medium text-right">🤯</th>
                <th className="pb-3 text-muted font-medium text-right">💡</th>
              </tr>
            </thead>
            <tbody>
              {data.postStats.map((post) => (
                <tr
                  key={post.slug}
                  className="border-b border-glass-border/50 last:border-0"
                >
                  <td className="py-3 text-primary">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:text-accent-blue transition-colors"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="py-3 text-secondary text-right tabular-nums">
                    {post.views.toLocaleString()}
                  </td>
                  <td className="py-3 text-secondary text-right tabular-nums">
                    {post.reactions.fire}
                  </td>
                  <td className="py-3 text-secondary text-right tabular-nums">
                    {post.reactions.heart}
                  </td>
                  <td className="py-3 text-secondary text-right tabular-nums">
                    {post.reactions.mindblown}
                  </td>
                  <td className="py-3 text-secondary text-right tabular-nums">
                    {post.reactions.idea}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
