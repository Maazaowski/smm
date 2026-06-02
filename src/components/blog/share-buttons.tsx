"use client";

import { useState } from "react";
import { SITE } from "@/lib/constants";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE.url}/blog/${slug}`;

  const shareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "width=600,height=500"
    );
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}&via=${SITE.author.twitter?.replace("@", "")}`,
      "_blank",
      "width=600,height=500"
    );
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted">Share:</span>
      <button
        onClick={shareLinkedIn}
        className="rounded-full border border-glass-border bg-glass-bg px-4 py-1.5 text-sm text-secondary hover:text-primary hover:border-white/[0.15] transition-all"
      >
        LinkedIn
      </button>
      <button
        onClick={shareTwitter}
        className="rounded-full border border-glass-border bg-glass-bg px-4 py-1.5 text-sm text-secondary hover:text-primary hover:border-white/[0.15] transition-all"
      >
        Twitter
      </button>
      <button
        onClick={copyLink}
        className="rounded-full border border-glass-border bg-glass-bg px-4 py-1.5 text-sm text-secondary hover:text-primary hover:border-white/[0.15] transition-all"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
