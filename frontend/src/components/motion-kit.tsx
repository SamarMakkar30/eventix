/* ═══════════════════════════════════════════════════════════════════════════
   EVENTIX MOTION KIT — bespoke interaction primitives
   Patterns inspired by motion-primitives.com / ui.aceternity.com / cult-ui.com,
   authored in-house on top of `motion/react` springs. Every component honours
   prefers-reduced-motion and cleans up after itself.
   ═══════════════════════════════════════════════════════════════════════════ */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/* ── Reveal — fade/slide in when scrolled into view ───────────────────── */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
  style,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-12% 0px" });
  const reduced = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={reduced ? false : { opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/* ── Stagger — orchestrates direct children entrances ─────────────────── */
export function Stagger({
  children,
  className,
  style,
  gap = 0.07,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  gap?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={reduced ? false : "hidden"}
      animate={inView ? "show" : undefined}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
};

export function StaggerItem({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <motion.div className={className} style={style} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

/* ── Magnetic — element gently follows the cursor ─────────────────────── */
export function Magnetic({
  children,
  strength = 0.32,
  className,
  style,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 14, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 14, mass: 0.4 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, x: sx, y: sy, display: "inline-flex" }}
      onPointerMove={(e) => {
        if (reduced || !ref.current || e.pointerType === "touch") return;
        const rect = ref.current.getBoundingClientRect();
        x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
        y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Tilt — subtle 3D perspective tilt on hover ───────────────────────── */
export function Tilt({
  children,
  className,
  style,
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const rx = useSpring(useMotionValue(0), { stiffness: 260, damping: 22 });
  const ry = useSpring(useMotionValue(0), { stiffness: 260, damping: 22 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        ...style,
        rotateX: rx,
        rotateY: ry,
        transformPerspective: 900,
        transformStyle: "preserve-3d",
      }}
      onPointerMove={(e) => {
        if (reduced || !ref.current || e.pointerType === "touch") return;
        const rect = ref.current.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        ry.set(px * max);
        rx.set(-py * max);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Spotlight — pointer-tracked radial glow (CSS var driven) ─────────── */
export function Spotlight({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`spotlight${className ? ` ${className}` : ""}`}
      style={style}
      onPointerMove={(e) => {
        if (!ref.current || e.pointerType === "touch") return;
        const rect = ref.current.getBoundingClientRect();
        ref.current.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
        ref.current.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
      }}
    >
      {children}
    </div>
  );
}

/* ── CountUp — spring-eased number that counts when in view ───────────── */
export function CountUp({
  to,
  duration = 1.6,
  format,
  className,
}: {
  to: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  const fmt = format ?? ((n: number) => n.toLocaleString("en-IN"));

  useEffect(() => {
    if (!inView || reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(Math.round(eased * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduced]);

  /* Reduced motion renders the final number directly — no effect needed */
  const shown = reduced && inView ? to : value;

  return (
    <span ref={ref} className={className}>
      {fmt(shown)}
    </span>
  );
}

/* ── Marquee — infinite horizontal ticker ─────────────────────────────── */
export function Marquee({
  children,
  duration = 42,
  className,
  fade = true,
}: {
  children: ReactNode;
  duration?: number;
  className?: string;
  fade?: boolean;
}) {
  return (
    <div
      className={`marquee${fade ? " marquee--edge-fade" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
    >
      <div className="marquee__track" aria-hidden="true">
        {children}
        {children}
      </div>
    </div>
  );
}

/* ── Parallax — scroll-linked vertical drift ──────────────────────────── */
export function Parallax({
  children,
  distance = 60,
  className,
  style,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y: MotionValue<number> = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? [0, 0] : [distance, -distance],
  );
  return (
    <motion.div ref={ref} className={className} style={{ ...style, y }}>
      {children}
    </motion.div>
  );
}

/* ── Words — headline that reveals word by word ───────────────────────── */
export function WordsReveal({
  text,
  className,
  delay = 0,
  gap = 0.055,
}: {
  text: string;
  className?: string;
  delay?: number;
  gap?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
          <motion.span
            style={{ display: "inline-block" }}
            initial={reduced ? false : { y: "110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: delay + i * gap, ease: EASE_OUT }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ── Modal/Dropdown helpers ───────────────────────────────────────────── */
export const overlayVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};
export const panelVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: EASE_OUT } },
  exit: { opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.18 } },
};
