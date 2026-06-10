import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await getAllPosts(true); // include drafts in analytics

  if (!redis) {
    return NextResponse.json({
      totalViews: 0,
      totalReactions: 0,
      totalPosts: posts.length,
      avgViewsPerPost: 0,
      subscribers: 0,
      postStats: posts.map((p) => ({
        slug: p.slug,
        title: p.frontmatter.title,
        views: 0,
        reactions: { fire: 0, heart: 0, mindblown: 0, idea: 0 },
      })),
      dailyViews: [],
    });
  }

  const r = redis;
  const subscribers = await r.scard("subscribers");
  const postStats = await Promise.all(
    posts.map(async (post) => {
      const views = (await r.get<number>(`views:${post.slug}`)) ?? 0;
      const reactions = (await r.hgetall(`reactions:${post.slug}`)) as Record<string, number> | null;
      return {
        slug: post.slug,
        title: post.frontmatter.title,
        views,
        reactions: {
          fire: Number(reactions?.fire ?? 0),
          heart: Number(reactions?.heart ?? 0),
          mindblown: Number(reactions?.mindblown ?? 0),
          idea: Number(reactions?.idea ?? 0),
        },
      };
    })
  );

  const totalViews = postStats.reduce((sum, p) => sum + p.views, 0);
  const totalReactions = postStats.reduce(
    (sum, p) => sum + p.reactions.fire + p.reactions.heart + p.reactions.mindblown + p.reactions.idea,
    0
  );

  const dailyViews: { date: string; views: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const views = (await r.get<number>(`daily-views:${dateStr}`)) ?? 0;
    dailyViews.push({ date: dateStr, views });
  }

  return NextResponse.json({
    totalViews,
    totalReactions,
    totalPosts: posts.length,
    avgViewsPerPost: posts.length > 0 ? Math.round(totalViews / posts.length) : 0,
    subscribers,
    postStats: postStats.sort((a, b) => b.views - a.views),
    dailyViews,
  });
}
