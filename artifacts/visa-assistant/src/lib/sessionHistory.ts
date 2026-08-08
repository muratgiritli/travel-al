/**
 * Session history helpers — all persistence is backed by localStorage.
 *
 * A "session" is a past chat conversation the user can revisit.
 * The history is stored as a JSON array under SESSION_HISTORY_KEY, ordered
 * newest-first.
 */

export const SESSION_HISTORY_KEY = 'teg_entry_session_history';

export interface SessionEntry {
  /** Unique session identifier */
  id: string;
  /** Human-readable label (editable via rename) */
  label: string;
  /** Short preview of the last message, shown in the sidebar */
  preview: string;
  /** ISO timestamp of when the session was last updated */
  updatedAt: string;
}

/**
 * Read all stored sessions from localStorage.
 * Returns an empty array when storage is empty, missing, or corrupt.
 */
export function readSessionHistory(): SessionEntry[] {
  try {
    const raw = localStorage.getItem(SESSION_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SessionEntry[];
  } catch {
    return [];
  }
}

/**
 * Persist the full session list to localStorage, replacing whatever was there.
 */
export function writeSessionHistory(sessions: SessionEntry[]): void {
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(sessions));
}

/**
 * Remove the session with the given id from history.
 * If the id is not found the call is a no-op.
 */
export function removeSessionFromHistory(id: string): void {
  const sessions = readSessionHistory().filter((s) => s.id !== id);
  writeSessionHistory(sessions);
}

/**
 * Rename the session with the given id.
 * If the id is not found the call is a no-op.
 */
export function renameSessionInHistory(id: string, label: string): void {
  const sessions = readSessionHistory().map((s) =>
    s.id === id ? { ...s, label } : s,
  );
  writeSessionHistory(sessions);
}

/**
 * Add or update a session entry in history.
 * If an entry with the same id already exists it is updated in place;
 * otherwise it is prepended so the list stays newest-first.
 */
export function upsertSessionInHistory(entry: SessionEntry): void {
  const sessions = readSessionHistory();
  const idx = sessions.findIndex((s) => s.id === entry.id);
  if (idx >= 0) {
    sessions[idx] = entry;
    writeSessionHistory(sessions);
  } else {
    writeSessionHistory([entry, ...sessions]);
  }
}
