'use client';

import { useEffect } from 'react';

/**
 * One controller for every <Reveal> on the page. After hydration it hides only the blocks
 * that start below the fold (data-reveal="pending") and reveals each once as it reaches
 * the reveal line. Reads and writes are batched (no per-block forced layout).
 *
 * A scroll check is used rather than IntersectionObserver because an observer never
 * fires for a block that is jumped over between frames (anchor links, fast scrolls),
 * which would leave it hidden.
 */
export function RevealController() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const line = () => window.innerHeight * 0.92;
    const pending = new Set<HTMLElement>();
    let frame = 0;

    const check = () => {
      frame = 0;
      const limit = line();
      const due = [...pending].filter((el) => el.getBoundingClientRect().top < limit); // reads
      due.forEach((el) => {
        el.dataset.reveal = 'in'; // writes
        pending.delete(el);
      });
      if (pending.size === 0) detach();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    const detach = () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };

    const all = Array.from(document.querySelectorAll<HTMLElement>('[data-rv]'));
    const limit = line();
    const below = all.filter((el) => el.getBoundingClientRect().top >= limit); // reads
    below.forEach((el) => {
      el.dataset.reveal = 'pending'; // writes
      pending.add(el);
    });

    if (pending.size > 0) {
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      schedule(); // covers a restored scroll position
    }
    return () => {
      detach();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
