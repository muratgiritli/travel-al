import { beforeEach, describe, expect, it } from 'vitest';
import {
  SESSION_HISTORY_KEY,
  SessionEntry,
  readSessionHistory,
  removeSessionFromHistory,
  renameSessionInHistory,
  upsertSessionInHistory,
  writeSessionHistory,
} from './sessionHistory';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create a minimal SessionEntry for tests. */
function makeSession(id: string, label = `Session ${id}`): SessionEntry {
  return { id, label, preview: 'Test preview', updatedAt: new Date().toISOString() };
}

/** Simulate a full page reload by returning a fresh call to readSessionHistory.
 *  Because we use the actual jsdom localStorage the data persists across calls
 *  within the same test, mirroring what happens across real page reloads. */
function simulateReload(): SessionEntry[] {
  return readSessionHistory();
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

// ─── readSessionHistory ───────────────────────────────────────────────────────

describe('readSessionHistory', () => {
  it('returns an empty array when localStorage has no entry', () => {
    expect(readSessionHistory()).toEqual([]);
  });

  it('returns an empty array when the stored value is not valid JSON', () => {
    localStorage.setItem(SESSION_HISTORY_KEY, 'not-json{{{');
    expect(readSessionHistory()).toEqual([]);
  });

  it('returns an empty array when the stored value is a non-array JSON type', () => {
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify({ id: '1' }));
    expect(readSessionHistory()).toEqual([]);
  });

  it('returns the stored sessions when the data is valid', () => {
    const sessions = [makeSession('a'), makeSession('b')];
    writeSessionHistory(sessions);
    expect(readSessionHistory()).toEqual(sessions);
  });
});

// ─── removeSessionFromHistory ─────────────────────────────────────────────────

describe('removeSessionFromHistory — persistence after simulated reload', () => {
  it('deleted session is absent from the history list after a simulated reload', () => {
    // Seed two sessions
    const s1 = makeSession('session-1', 'My first conversation');
    const s2 = makeSession('session-2', 'My second conversation');
    writeSessionHistory([s1, s2]);

    // Delete s1
    removeSessionFromHistory('session-1');

    // Simulate a page reload — re-read from localStorage
    const afterReload = simulateReload();

    expect(afterReload).toHaveLength(1);
    expect(afterReload.find((s) => s.id === 'session-1')).toBeUndefined();
    expect(afterReload[0].id).toBe('session-2');
  });

  it('deleting a non-existent id leaves the history unchanged', () => {
    const sessions = [makeSession('a'), makeSession('b')];
    writeSessionHistory(sessions);

    removeSessionFromHistory('does-not-exist');

    expect(simulateReload()).toHaveLength(2);
  });
});

// ─── Edge case: deleting the only remaining session ───────────────────────────

describe('removeSessionFromHistory — edge case: only session', () => {
  it('history is empty after deleting the only remaining session (panel should collapse)', () => {
    writeSessionHistory([makeSession('sole-session')]);

    removeSessionFromHistory('sole-session');

    const afterReload = simulateReload();
    expect(afterReload).toHaveLength(0);
    // Verifies that the history panel has no items to display
    expect(afterReload.length).toBe(0);
  });
});

// ─── renameSessionInHistory ───────────────────────────────────────────────────

describe('renameSessionInHistory — persistence after simulated reload', () => {
  it('renamed label survives a reload', () => {
    const session = makeSession('chat-42', 'Original name');
    writeSessionHistory([session]);

    renameSessionInHistory('chat-42', 'Updated name');

    const afterReload = simulateReload();
    expect(afterReload).toHaveLength(1);
    expect(afterReload[0].label).toBe('Updated name');
    // Other fields must remain untouched
    expect(afterReload[0].id).toBe('chat-42');
    expect(afterReload[0].preview).toBe(session.preview);
  });

  it('renaming a non-existent id is a no-op and does not corrupt the history', () => {
    const sessions = [makeSession('real-id', 'Real label')];
    writeSessionHistory(sessions);

    renameSessionInHistory('ghost-id', 'Ghost label');

    const afterReload = simulateReload();
    expect(afterReload).toHaveLength(1);
    expect(afterReload[0].label).toBe('Real label');
  });

  it('rename is reflected immediately without requiring another write', () => {
    writeSessionHistory([makeSession('x', 'Before')]);
    renameSessionInHistory('x', 'After');

    // No extra write call — renameSessionInHistory must persist on its own
    expect(readSessionHistory()[0].label).toBe('After');
  });
});

// ─── upsertSessionInHistory ───────────────────────────────────────────────────

describe('upsertSessionInHistory', () => {
  it('prepends a new session to the list', () => {
    writeSessionHistory([makeSession('old')]);
    upsertSessionInHistory(makeSession('new'));

    const history = readSessionHistory();
    expect(history[0].id).toBe('new');
    expect(history[1].id).toBe('old');
  });

  it('updates an existing session in place without duplicating', () => {
    writeSessionHistory([makeSession('a'), makeSession('b')]);
    upsertSessionInHistory({ ...makeSession('a'), label: 'Updated A' });

    const history = readSessionHistory();
    expect(history).toHaveLength(2);
    expect(history.find((s) => s.id === 'a')?.label).toBe('Updated A');
  });
});
