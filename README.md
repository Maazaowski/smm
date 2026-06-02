# maazaowski

Personal blog built with Next.js 16, MDX, Tailwind CSS v4, and TypeScript. Dark glassmorphism theme optimized for LinkedIn sharing.

## Features

- **MDX Blog** — Write posts in Markdown with embedded React components
- **Glassmorphism UI** — Frosted glass cards, gradient borders, cursor glow effects
- **Page Transitions** — Framer Motion fade/slide between pages
- **Scroll Animations** — Elements animate in as you scroll
- **Command Palette** — Cmd+K to search posts and navigate
- **Reactions** — Emoji reactions (🔥❤️🤯💡) per post via Upstash Redis
- **View Counter** — Deduplicated view tracking
- **Giscus Comments** — GitHub Discussions-powered comments
- **Dynamic OG Images** — Auto-generated social cards per post
- **Admin Panel** — Create/edit posts from the browser via GitHub API
- **Analytics Dashboard** — Private view/reaction analytics with charts
- **RSS Feed** — Syndication at `/rss.xml`
- **Dark/Light Theme** — Smooth toggle with animated icon
- **Reading Progress** — Gradient bar showing scroll position
- **Table of Contents** — Auto-generated with active heading tracking

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

- `UPSTASH_REDIS_REST_URL` — Upstash Redis URL (free tier at upstash.com)
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis token
- `ADMIN_PASSWORD` — Password for /admin and /dashboard
- `GITHUB_TOKEN` — GitHub PAT with repo scope (for admin post management)

## Writing Posts

Create MDX files in `content/posts/YYYY/slug.mdx` with frontmatter:

```yaml
---
title: "Post Title"
description: "Short description"
date: "2026-06-01"
tags: ["tag1", "tag2"]
category: "AI Engineering"
featured: false
draft: false
---
```

Or use the admin panel at `/admin` to create posts from the browser.

## Deploy

Push to GitHub and connect to [Vercel](https://vercel.com). Set environment variables in the Vercel dashboard.
