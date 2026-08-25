"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Reveal-on-scroll, with a failure mode that is not "the page stays blank".
 *
 * IntersectionObserver does not deliver callbacks for a document the browser
 * is not compositing. I reproduced that here: 34 of 34 elements sat at opacity
 * 0 until the tab was fronted — the same class of bug as the production
 * page-transition that ships every page at opacity:0 and waits for hydration.
 *
 * A per-element timeout would fix it and destroy the effect, because on a
 * 11,000px page the last section legitimately appears a minute after mount.
 * So the rescue is global instead: if NOTHING has revealed within two seconds
 * of the first element mounting, the observer is not working, and everything
 * is shown at once. One timer for the page, and the scroll effect is untouched
 * whenever the browser is actually drawing.
 */
let revealCount = 0;
let rescueArmed = false;
const rescueSubs = new Set<() => void>();

function armRescue() {
  if (rescueArmed) return;
  rescueArmed = true;
  setTimeout(() => {
    if (revealCount === 0) rescueSubs.forEach((fn) => fn());
  }, 2000);
}

/**
 * One IntersectionObserver per element, disconnected the moment it fires, so
 * nothing keeps recomputing on scroll. The alternative — framer-motion's
 * whileInView on every section — is what the production site does across 18
 * separate imports.
 */
export function Reveal({
  children,
  delay = 0,
  as = "div",
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "section" | "article" | "li" | "header";
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  // A single polymorphic tag with one ref type keeps the union from collapsing
  // into an unassignable intersection of every element's ref.
  const Tag = as as "div";
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          revealCount++;
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    io.observe(el);

    const rescue = () => {
      setSeen(true);
      io.disconnect();
    };
    rescueSubs.add(rescue);
    armRescue();

    return () => {
      io.disconnect();
      rescueSubs.delete(rescue);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`sg-rise ${className}`}
      data-in={seen ? "true" : undefined}
      style={{ "--d": `${delay}ms` } as React.CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Header that gains a ground once you leave the hero. */
export function Head({ nav }: { nav: { label: string; href: string }[] }) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sg-head" data-stuck={stuck ? "true" : undefined}>
      <div className="sg-head-l">
        <a href="#top" className="sg-micro" style={{ color: "var(--white)" }}>
          MAAZ/
        </a>
        <Clock />
      </div>

      <nav className="sg-head-nav" aria-label="Sections">
        {nav.map((n) => (
          <a key={n.href} href={n.href}>
            {n.label}
          </a>
        ))}
      </nav>

      <div className="sg-head-r">
        <a className="sg-cta" href="mailto:m.maaz96@gmail.com">
          Start a project
        </a>
      </div>
    </header>
  );
}

/**
 * Local time in Karachi. It is in the reference and it is worth keeping for a
 * freelancer: the first thing an overseas client wants to know is what hour it
 * is where you are.
 */
function Clock() {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setNow(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Karachi",
        }).format(new Date())
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Renders nothing until mounted, so the server and client never disagree.
  return (
    <span className="sg-clock" suppressHydrationWarning>
      {now ? `KHI ${now}` : ""}
    </span>
  );
}

/**
 * Marks the root as motion-capable once the client is running.
 *
 * The hidden-until-revealed styles hang off this attribute, so a document that
 * never executes JS — or executes it and throws — renders fully visible rather
 * than blank. Progressive enhancement in the direction that fails safe.
 */
export function MotionFlag() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".sg");
    root?.setAttribute("data-motion", "on");
  }, []);
  return null;
}

/** Reading-position bar. Two lines of state, no library. */
export function Progress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? window.scrollY / h : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sg-progress" aria-hidden="true">
      <span style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

/**
 * Count-up on first view.
 *
 * The reference's stat block reads "0K+ B2C USERS" for anyone who lands mid-page
 * or has reduced motion on, because the number only exists inside the
 * animation. Here the final value is the rendered text and the animation is an
 * enhancement on top of it — so a static reader always sees the real number.
 */
export function Counter({
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = 1100;
        const step = (t: number) => {
          const k = Math.min(1, (t - start) / dur);
          // easeOutExpo — fast, then settles, rather than a linear tick
          const eased = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
          setV(to * eased);
          if (k < 1) raf = requestAnimationFrame(step);
        };
        setV(0);
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  return (
    <span ref={ref} className="sg-stat-v">
      {prefix}
      {v.toFixed(decimals)}
      {suffix && <sub>{suffix}</sub>}
    </span>
  );
}

/** Infinite horizontal band. The list is duplicated once for a seamless loop. */
export function Marquee({ items }: { items: string[] }) {
  return (
    <div className="sg-marquee">
      <div className="sg-marquee-track">
        {[...items, ...items].map((item, i) => (
          <span key={i} aria-hidden={i >= items.length ? "true" : undefined}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
