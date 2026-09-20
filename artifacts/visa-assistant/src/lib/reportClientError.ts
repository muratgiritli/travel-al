/**
 * Forwards a UI crash to the API so it can be logged and, when SENTRY_DSN
 * is set, sent on to Sentry. Failures here must never throw back into the UI.
 */
export function reportClientError(error: unknown, extras?: Record<string, string>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const body = {
    message: (err.message || "Unknown error").slice(0, 400),
    stack: (err.stack || "").slice(0, 2000),
    url: typeof window !== "undefined" ? window.location.pathname : "",
    ...extras,
  };

  try {
    void fetch("/api/travel/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      /* reporting must never surface to the visitor */
    });
  } catch {
    /* ignore */
  }
}
