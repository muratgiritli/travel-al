import { useEffect, useRef } from 'react';

/**
 * Makes the Android hardware back button (and browser back) close an open
 * overlay instead of leaving the site.
 *
 * While `open` is true a throwaway history entry is pushed; popping it runs
 * `onDismiss`. Closing the overlay by other means removes that entry again.
 */
export function useBackDismiss(open: boolean, onDismiss: () => void) {
  const pushedRef = useRef(false);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!open) return;

    window.history.pushState({ overlay: true }, '');
    pushedRef.current = true;

    const onPop = () => {
      pushedRef.current = false;
      dismissRef.current();
    };

    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (pushedRef.current) {
        pushedRef.current = false;
        window.history.back();
      }
    };
  }, [open]);
}
