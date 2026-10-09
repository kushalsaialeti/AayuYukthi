import React, { useEffect, useState } from 'react';
import './scroll-progress.css';

/**
 * MagicUI ScrollProgress Component
 * Tracks and visualizes scroll progress across the viewport / form questionnaire.
 *
 * System Design Rules:
 * - Color: Off-green brand gradient (#34d399 -> #10b981 -> #059669 -> #0f766e)
 * - Position: Fixed top edge
 * - Animation: Hardware-accelerated transform scaleX
 * - Scope: Strictly rendered during the care-request form-filling journey
 */
export function ScrollProgress({
  className = '',
  containerRef,
  height = 4,
  ...props
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      // 1. If explicit container reference provided
      if (containerRef?.current) {
        const el = containerRef.current;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll > 0) {
          setProgress(Math.min(1, Math.max(0, el.scrollTop / maxScroll)));
          ticking = false;
          return;
        }
      }

      // 2. Viewport / document scroll progress
      const scrollElement = document.scrollingElement || document.documentElement;
      const totalDoc = scrollElement.scrollHeight - window.innerHeight;

      if (totalDoc > 0) {
        const current = window.scrollY || scrollElement.scrollTop || 0;
        const ratio = Math.min(1, Math.max(0, current / totalDoc));
        setProgress(ratio);
      } else {
        setProgress(0);
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    let containerEl = null;
    if (containerRef?.current) {
      containerEl = containerRef.current;
      containerEl.addEventListener('scroll', onScroll, { passive: true });
    }

    // Initial check
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (containerEl) {
        containerEl.removeEventListener('scroll', onScroll);
      }
    };
  }, [containerRef]);

  return (
    <div
      className={`magic-scroll-progress ${className}`}
      style={{
        transform: `scaleX(${progress})`,
        height: `${height}px`,
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Care request form scroll progress"
      {...props}
    />
  );
}

export default ScrollProgress;
