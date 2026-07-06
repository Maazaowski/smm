"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  const isPostPage =
    pathname.startsWith("/blog/") && pathname !== "/blog";

  useEffect(() => {
    if (!isPostPage) return;

    let raf: number;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    const handleScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(raf);
    };
  }, [isPostPage]);

  if (!isPostPage) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px]">
      <div
        className="h-full transition-[width] duration-100 ease-out"
        style={{
          width: `${progress}%`,
          background:
            "linear-gradient(90deg, oklch(0.80 0.14 72), oklch(0.70 0.16 32))",
        }}
      />
    </div>
  );
}
