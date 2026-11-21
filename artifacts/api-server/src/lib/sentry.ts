import { logger } from "./logger";

/**
 * Optional Sentry reporter.
 *
 * No SDK is pulled in: events are POSTed to the store endpoint only when
 * SENTRY_DSN is set. Without the key this module is a no-op, so production
 * stays unchanged until a project is created.
 */

interface ParsedDsn {
  publicKey: string;
  host: string;
  projectId: string;
}

function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+/, "").split("/")[0];
    if (!url.username || !projectId) return null;
    return { publicKey: url.username, host: url.host, projectId };
  } catch {
    return null;
  }
}

export function isSentryConfigured(): boolean {
  return Boolean(parseDsn(process.env["SENTRY_DSN"] || ""));
}

function framesFromStack(stack?: string): Array<Record<string, unknown>> {
  if (!stack) return [];
  return stack
    .split("\n")
    .slice(1, 21)
    .map((line) => {
      const trimmed = line.trim();
      const match = /at\s+(.*?)\s+\((.*?):(\d+):(\d+)\)/.exec(trimmed)
        || /at\s+(.*?):(\d+):(\d+)/.exec(trimmed);
      if (!match) return { filename: trimmed };
      if (match.length === 5) {
        return {
          function: match[1],
          filename: match[2],
          lineno: Number(match[3]),
          colno: Number(match[4]),
        };
      }
      return {
        filename: match[1],
        lineno: Number(match[2]),
        colno: Number(match[3]),
      };
    });
}

export async function captureException(
  error: unknown,
  extras?: Record<string, unknown>,
): Promise<void> {
  const parsed = parseDsn(process.env["SENTRY_DSN"] || "");
  if (!parsed) return;

  const err = error instanceof Error ? error : new Error(String(error));
  const event = {
    timestamp: new Date().toISOString(),
    platform: "node",
    level: "error",
    server_name: "travel-al",
    environment: process.env["NODE_ENV"] || "production",
    exception: {
      values: [
        {
          type: err.name || "Error",
          value: String(err.message || err).slice(0, 400),
          stacktrace: { frames: framesFromStack(err.stack) },
        },
      ],
    },
    extra: extras || {},
  };

  try {
    const res = await fetch(`https://${parsed.host}/api/${parsed.projectId}/store/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=travel-al/1.0, sentry_key=${parsed.publicKey}`,
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "Sentry store rejected the event");
    }
  } catch (sendErr) {
    logger.warn({ err: sendErr }, "Sentry report failed");
  }
}

export function installProcessHandlers(): void {
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "uncaughtException");
    void captureException(err, { kind: "uncaughtException" });
  });
  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "unhandledRejection");
    void captureException(reason, { kind: "unhandledRejection" });
  });
}
