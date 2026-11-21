import { useEffect } from "react";
import { reportClientError } from "./reportClientError";

/**
 * Captures window-level errors. The API stores them and forwards to Sentry
 * only when SENTRY_DSN is configured — nothing extra loads in the browser.
 */
export function useErrorTracking() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError(event.error || new Error(event.message), { kind: "window" });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      reportClientError(event.reason, { kind: "unhandledrejection" });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
}
