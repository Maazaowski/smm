import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { getAllPosts } from "@/lib/posts";
import type { Reactions } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAYS = 30;
const EMPTY_REACTIONS: Reactions = { fire: 0, heart: 0, mindblown: 0, idea: 0 };

export interface PostStat {
  slug: string;
  title: string;
  draft: boolean;
  date: string;
  views: number;
  reactions: Reactions;
}

export interface AnalyticsPayload {
  totalViews: number;
  /** Deduplicated views recorded in the last seven UTC days, today included. */
  last7Views: number;
  todayViews: number;
  totalReactions: number;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  avgViewsPerPost: number;
  subscribers: number;
  postStats: PostStat[];
  dailyViews: { date: string; views: number }[];
  /** ISO timestamp of this response, so the UI can say how fresh it is. */
  generatedAt: string;
  /** False when Redis is not configured — every number above is then zero. */
  tracking: boolean;
}

/** The last DAYS calendar days in UTC, oldest first. Matches /api/views. */
function recentDays(): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = DAYS - 1; i >= 0; i--) {
    out.push(new Date(now - i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

function toReactions(raw: unknown): Reactions {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    fire: Number(r.fire ?? 0),
    heart: Number(r.heart ?? 0),
    mindblown: Number(r.mindblown ?? 0),
    idea: Number(r.idea ?? 0),
  };
}

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await getAllPosts(true); // drafts included: they can have views from preview links
  const days = recentDays();
  const published = posts.filter((p) => !p.frontmatter.draft).length;

  const base = {
    totalPosts: posts.length,
    publishedPosts: published,
    draftPosts: posts.length - published,
    generatedAt: new Date().toISOString(),
  };

  if (!redis) {
    const payload: AnalyticsPayload = {
      ...base,
      totalViews: 0,
      last7Views: 0,
      todayViews: 0,
      totalReactions: 0,
      avgViewsPerPost: 0,
      subscribers: 0,
      postStats: posts.map((p) => ({
        slug: p.slug,
        title: p.frontmatter.title,
        draft: p.frontmatter.draft ?? false,
        date: p.frontmatter.date,
        views: 0,
        reactions: EMPTY_REACTIONS,
      })),
      dailyViews: days.map((date) => ({ date, views: 0 })),
      tracking: false,
    };
    return NextResponse.json(payload);
  }

  /*
   * One round trip. The previous version issued 2 sequential GETs per post
   * plus 30 sequential GETs for the daily series — 40+ serial HTTP requests
   * to Upstash for a dashboard that should feel instant.
   */
  const p = redis.pipeline();
  p.scard("subscribers");
  p.mget(...days.map((d) => `daily-views:${d}`));
  if (posts.length > 0) {
    p.mget(...posts.map((post) => `views:${post.slug}`));
  }
  for (const post of posts) {
    p.hgetall(`reactions:${post.slug}`);
  }
  const results = await p.exec<unknown[]>();

  let i = 0;
  const subscribers = Number(results[i++] ?? 0);
  const dailyRaw = (results[i++] ?? []) as (number | string | null)[];
  const viewsRaw = posts.length > 0 ? ((results[i++] ?? []) as (number | string | null)[]) : [];
  const reactionsRaw = results.slice(i, i + posts.length);

  const postStats: PostStat[] = posts.map((post, idx) => ({
    slug: post.slug,
    title: post.frontmatter.title,
    draft: post.frontmatter.draft ?? false,
    date: post.frontmatter.date,
    views: Number(viewsRaw[idx] ?? 0),
    reactions: toReactions(reactionsRaw[idx]),
  }));

  const dailyViews = days.map((date, idx) => ({
    date,
    views: Number(dailyRaw[idx] ?? 0),
  }));

  const totalViews = postStats.reduce((sum, s) => sum + s.views, 0);
  const totalReactions = postStats.reduce(
    (sum, s) =>
      sum + s.reactions.fire + s.reactions.heart + s.reactions.mindblown + s.reactions.idea,
    0
  );
  const last7Views = dailyViews.slice(-7).reduce((sum, d) => sum + d.views, 0);
  const todayViews = dailyViews[dailyViews.length - 1]?.views ?? 0;

  const payload: AnalyticsPayload = {
    ...base,
    totalViews,
    last7Views,
    todayViews,
    totalReactions,
    avgViewsPerPost: published > 0 ? Math.round(totalViews / published) : 0,
    subscribers,
    postStats: postStats.sort((a, b) => b.views - a.views),
    dailyViews,
    tracking: true,
  };

  return NextResponse.json(payload);
}
