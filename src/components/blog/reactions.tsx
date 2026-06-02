"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import type { ReactionType, Reactions as ReactionsType } from "@/lib/types";

const REACTION_EMOJIS: Record<ReactionType, string> = {
  fire: "🔥",
  heart: "❤️",
  mindblown: "🤯",
  idea: "💡",
};

interface ReactionsProps {
  slug: string;
}

export function Reactions({ slug }: ReactionsProps) {
  const [reactions, setReactions] = useState<ReactionsType>({
    fire: 0,
    heart: 0,
    mindblown: 0,
    idea: 0,
  });
  const [reacted, setReacted] = useState<Set<ReactionType>>(new Set());
  const [particles, setParticles] = useState<
    { id: number; type: ReactionType; x: number; y: number }[]
  >([]);

  useEffect(() => {
    // Load saved reactions from localStorage
    const saved = localStorage.getItem(`reactions:${slug}`);
    if (saved) {
      setReacted(new Set(JSON.parse(saved)));
    }

    // Fetch current counts
    fetch(`/api/reactions?slug=${slug}`)
      .then((r) => r.json())
      .then(setReactions)
      .catch(() => {});
  }, [slug]);

  const handleReaction = useCallback(
    async (type: ReactionType, e: React.MouseEvent) => {
      if (reacted.has(type)) return;

      // Optimistic update
      setReactions((prev) => ({ ...prev, [type]: prev[type] + 1 }));

      // Track locally
      const newReacted = new Set(reacted);
      newReacted.add(type);
      setReacted(newReacted);
      localStorage.setItem(
        `reactions:${slug}`,
        JSON.stringify(Array.from(newReacted))
      );

      // Particle burst
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const newParticles = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        type,
        x: rect.left + rect.width / 2,
        y: rect.top,
      }));
      setParticles((prev) => [...prev, ...newParticles]);
      setTimeout(
        () =>
          setParticles((prev) =>
            prev.filter((p) => !newParticles.find((np) => np.id === p.id))
          ),
        1000
      );

      // POST to API
      try {
        const res = await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, type }),
        });
        const data = await res.json();
        setReactions(data);
      } catch {
        // Keep optimistic value
      }
    },
    [reacted, slug]
  );

  return (
    <>
      {/* Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
            animate={{
              y: p.y - 80 - Math.random() * 40,
              x: p.x + (Math.random() - 0.5) * 80,
              opacity: 0,
              scale: 0.5,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed pointer-events-none text-lg z-50"
          >
            {REACTION_EMOJIS[p.type]}
          </motion.div>
        ))}
      </AnimatePresence>

      <GlassCard className="p-4" hover={false}>
        <div className="flex items-center justify-center gap-2">
          {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map((type) => (
            <motion.button
              key={type}
              onClick={(e) => handleReaction(type, e)}
              whileTap={{ scale: 1.3 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              disabled={reacted.has(type)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all ${
                reacted.has(type)
                  ? "bg-accent-blue/10 border border-accent-blue/20"
                  : "hover:bg-surface-2 border border-transparent"
              }`}
            >
              <span className="text-base">{REACTION_EMOJIS[type]}</span>
              <span className="text-secondary font-medium tabular-nums">
                {reactions[type]}
              </span>
            </motion.button>
          ))}
        </div>
      </GlassCard>
    </>
  );
}
