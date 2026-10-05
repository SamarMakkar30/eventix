/* ═══════════════════════════════════════════════════════════════════════════
   SMOOTH SCROLL — Lenis singleton controller.
   The scroll bug users felt: navigating to a new page left Lenis's internal
   target at the previous position, so its rAF loop dragged the fresh page
   back down. Every scroll reset must therefore go through Lenis itself.
   ═══════════════════════════════════════════════════════════════════════════ */

type LenisLike = {
  raf: (time: number) => void;
  destroy: () => void;
  scrollTo: (target: number | string | HTMLElement, options?: Record<string, unknown>) => void;
};

let instance: LenisLike | null = null;
let rafId = 0;
let starting = false;

export function isSmoothScrollActive() {
  return instance !== null;
}

/** Boots Lenis (desktop, fine pointers, motion allowed). Idempotent. */
export async function startSmoothScroll() {
  if (instance || starting) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;
  starting = true;
  try {
    const { default: Lenis } = await import("lenis");
    instance = new Lenis({ lerp: 0.11, smoothWheel: true }) as unknown as LenisLike;
    const loop = (time: number) => {
      instance?.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  } finally {
    starting = false;
  }
}

export function stopSmoothScroll() {
  cancelAnimationFrame(rafId);
  instance?.destroy();
  instance = null;
}

/**
 * Scroll to top — safe to call on every route change.
 * Goes through Lenis when active so its target resets too; otherwise the
 * native window scroll.
 */
export function scrollToTop(immediate = true) {
  if (instance) {
    instance.scrollTo(0, { immediate, force: true });
  }
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

/** Smooth scroll to an in-page anchor, Lenis-aware. */
export function scrollToAnchor(hash: string) {
  const el = document.querySelector(hash);
  if (!el) return;
  if (instance) {
    instance.scrollTo(el as HTMLElement, { offset: -96, duration: 1.1 });
  } else {
    (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
