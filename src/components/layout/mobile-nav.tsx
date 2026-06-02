"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="sm:hidden">
      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-glass-border bg-glass-bg"
        aria-label="Toggle menu"
      >
        <div className="flex flex-col gap-1">
          <span
            className={cn(
              "block h-0.5 w-4 bg-secondary transition-transform duration-200",
              open && "translate-y-[3px] rotate-45"
            )}
          />
          <span
            className={cn(
              "block h-0.5 w-4 bg-secondary transition-opacity duration-200",
              open && "opacity-0"
            )}
          />
          <span
            className={cn(
              "block h-0.5 w-4 bg-secondary transition-transform duration-200",
              open && "-translate-y-[3px] -rotate-45"
            )}
          />
        </div>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-64 border-l border-glass-border bg-surface-1/95 backdrop-blur-xl p-6"
            >
              <nav className="flex flex-col gap-2 mt-16">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-4 py-3 text-base font-medium transition-colors",
                      pathname === link.href
                        ? "text-primary bg-surface-2"
                        : "text-secondary hover:text-primary hover:bg-surface-2/50"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
