"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import Giscus from "@giscus/react";
import { GlassCard } from "@/components/ui/glass-card";

interface GiscusCommentsProps {
  slug: string;
}

export function GiscusComments({ slug }: GiscusCommentsProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Lazy load: only mount when scrolled into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mt-12">
      <h2 className="text-lg font-semibold text-primary mb-4">Discussion</h2>
      <GlassCard className="p-6" hover={false}>
        {visible ? (
          <Giscus
            id="comments"
            repo="Maazaowski/smm"
            repoId="R_kgDOSt2C6A"
            category="General"
            categoryId="DIC_kwDOSt2C6M4C-VP5"
            mapping="pathname"
            strict="0"
            reactionsEnabled="1"
            emitMetadata="0"
            inputPosition="top"
            theme={theme === "dark" ? "transparent_dark" : "light"}
            lang="en"
            loading="lazy"
          />
        ) : (
          <div className="py-8 text-center text-muted text-sm">
            Loading comments...
          </div>
        )}
      </GlassCard>
    </div>
  );
}
