"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SITE } from "@/lib/constants";

interface FloatingActionsProps {
  title: string;
  slug: string;
}

export function FloatingActions({ title, slug }: FloatingActionsProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `${SITE.url}/blog/${slug}`;

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shareLinkedIn = () =>
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "width=600,height=500"
    );

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 rounded-full border border-glass-border bg-glass-bg p-2 backdrop-blur-xl lg:flex xl:left-8"
          aria-label="Article actions"
        >
          <ActionButton label="Share on LinkedIn" onClick={shareLinkedIn}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S.02 4.88.02 3.5C.02 2.12 1.13 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8h4.52v13H.24V8zm7.5 0h4.33v1.78h.06c.6-1.14 2.07-2.34 4.26-2.34 4.56 0 5.4 3 5.4 6.9V21h-4.52v-5.9c0-1.4-.02-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21H7.74V8z" />
            </svg>
          </ActionButton>
          <ActionButton label={copied ? "Copied" : "Copy link"} onClick={copyLink}>
            {copied ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </ActionButton>
          <div className="mx-2 h-px bg-glass-border" />
          <ActionButton label="Back to top" onClick={toTop}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </ActionButton>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-all hover:bg-surface-2 hover:text-accent-blue"
    >
      {children}
    </button>
  );
}
