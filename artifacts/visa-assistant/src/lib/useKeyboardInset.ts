import { useEffect } from 'react';

/**
 * Mirrors the on-screen keyboard height into `--keyboard-inset`.
 *
 * Mobile browsers shrink `visualViewport` instead of the layout viewport when
 * the keyboard opens, so a bottom-anchored composer would otherwise sit behind
 * it. Falls back to 0px wherever visualViewport is unavailable.
 */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const root = document.documentElement;

    const sync = () => {
      const overlap = window.innerHeight - vv.height - vv.offsetTop;
      root.style.setProperty('--keyboard-inset', `${Math.max(0, Math.round(overlap))}px`);
    };

    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      root.style.removeProperty('--keyboard-inset');
    };
  }, []);
}
