/**
 * Integration tests for stale-session recovery in Home.tsx.
 *
 * Scenario: localStorage holds a session ID that no longer exists on the
 * server.  The component must detect the 404, clear localStorage, and
 * show the passport selector so the user can start fresh.
 *
 * Edge cases covered:
 *  - 404 response  → clear localStorage, show selector
 *  - Network error → keep localStorage, do NOT show selector prematurely
 *  - Rapid country re-selection after clearing → new session created cleanly
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ─── Mock the generated API-client hooks ─────────────────────────────────────
// We mock the entire module so the Home component never makes real HTTP calls.

vi.mock('@workspace/api-client-react', () => ({
  useCreateChatSession: vi.fn(),
  useDeleteChatSession: vi.fn(),
  useGetChatMessages: vi.fn(),
  useGetChatSession: vi.fn(),
  useListCountries: vi.fn(),
  useListChatSessions: vi.fn(),
}));

import {
  useCreateChatSession,
  useDeleteChatSession,
  useGetChatMessages,
  useGetChatSession,
  useListCountries,
  useListChatSessions,
} from '@workspace/api-client-react';

import Home from '../Home';

// ─── localStorage keys (must match Home.tsx) ──────────────────────────────────
const LS_CURRENT = 'turkey_travel_session';
const LS_HISTORY = 'turkey_travel_sessions';

const STALE_SESSION_ID = 'stale-session-00000000-0000-0000-0000-000000000001';
const STALE_COUNTRY = 'US';

// ─── Fake error constructors ──────────────────────────────────────────────────

function make404Error() {
  const err = new Error('Not Found') as Error & { status: number };
  err.status = 404;
  return err;
}

function makeNetworkError() {
  // No .status → treated as a transient network error, not a 404
  return new TypeError('Failed to fetch');
}

// ─── Default (happy-path) mock return values ──────────────────────────────────

function setupDefaultMocks(overrides: {
  sessionError?: Error | null;
} = {}) {
  (useListCountries as Mock).mockReturnValue({ data: undefined });
  (useListChatSessions as Mock).mockReturnValue({ data: undefined });
  (useGetChatMessages as Mock).mockReturnValue({ data: undefined });
  (useGetChatSession as Mock).mockReturnValue({
    data: undefined,
    error: overrides.sessionError ?? null,
  });
  (useCreateChatSession as Mock).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  });
  (useDeleteChatSession as Mock).mockReturnValue({ mutate: vi.fn() });
}

// ─── Test wrapper (provides QueryClient) ─────────────────────────────────────

function renderHome() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>,
  );
}

// ─── Helpers to seed / inspect localStorage ──────────────────────────────────

function seedStaleSession() {
  localStorage.setItem(
    LS_CURRENT,
    JSON.stringify({ sessionId: STALE_SESSION_ID, passportCountryCode: STALE_COUNTRY }),
  );
  localStorage.setItem(
    LS_HISTORY,
    JSON.stringify([
      {
        id: STALE_SESSION_ID,
        passportCountryCode: STALE_COUNTRY,
        snippet: 'Can I travel to Cappadocia?',
        createdAt: new Date().toISOString(),
      },
    ]),
  );
}

function getCurrentSession() {
  const raw = localStorage.getItem(LS_CURRENT);
  return raw ? JSON.parse(raw) : null;
}

function getSessionHistory(): { id: string }[] {
  const raw = localStorage.getItem(LS_HISTORY);
  return raw ? JSON.parse(raw) : [];
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Home – stale session recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ── 1. 404 clears localStorage and shows the passport selector ────────────

  it('clears localStorage and shows the passport selector when the server returns 404', async () => {
    seedStaleSession();
    setupDefaultMocks({ sessionError: make404Error() });

    renderHome();

    // After the 404 effect fires, the passport selector must become visible
    await waitFor(() => {
      expect(screen.getByTestId('passport-selector')).toBeInTheDocument();
    });

    // Current session must be wiped from localStorage
    expect(getCurrentSession()).toBeNull();

    // Stale session must be removed from history
    const history = getSessionHistory();
    expect(history.some(s => s.id === STALE_SESSION_ID)).toBe(false);
  });

  // ── 2. 404 when there is no stored session → no crash, selector visible ──

  it('is a no-op and shows the selector normally when there is no stored session', async () => {
    // No localStorage seed — fresh visit
    setupDefaultMocks({ sessionError: make404Error() });

    renderHome();

    await waitFor(() => {
      expect(screen.getByTestId('passport-selector')).toBeInTheDocument();
    });

    // Nothing was written to localStorage
    expect(getCurrentSession()).toBeNull();
  });

  // ── 3. Network error must NOT clear a valid stored session ────────────────

  it('preserves localStorage when the error is a network error (not 404)', async () => {
    seedStaleSession();
    setupDefaultMocks({ sessionError: makeNetworkError() });

    renderHome();

    // Give React time to run effects
    await new Promise(r => setTimeout(r, 50));

    // The current session must still be in localStorage
    const stored = getCurrentSession();
    expect(stored).not.toBeNull();
    expect(stored?.sessionId).toBe(STALE_SESSION_ID);
  });

  // ── 4. Other HTTP errors (e.g. 500) must NOT clear localStorage ───────────

  it('preserves localStorage when the server returns a 500 error', async () => {
    seedStaleSession();
    const serverErr = new Error('Internal Server Error') as Error & { status: number };
    serverErr.status = 500;
    setupDefaultMocks({ sessionError: serverErr });

    renderHome();

    await new Promise(r => setTimeout(r, 50));

    const stored = getCurrentSession();
    expect(stored).not.toBeNull();
    expect(stored?.sessionId).toBe(STALE_SESSION_ID);
  });

  // ── 5. No error at all (session exists) → selector NOT shown initially ────

  it('does not show the passport selector when the session is valid (no error)', async () => {
    seedStaleSession();
    setupDefaultMocks({ sessionError: null });

    renderHome();

    // Allow effects to settle
    await new Promise(r => setTimeout(r, 50));

    // Selector should be hidden because we're in a restored (unlocked) session
    expect(screen.queryByTestId('passport-selector')).not.toBeInTheDocument();

    // localStorage still intact
    const stored = getCurrentSession();
    expect(stored?.sessionId).toBe(STALE_SESSION_ID);
  });

  // ── 6. Rapid re-selection after clearing ─────────────────────────────────
  // After a 404 clears the session, the user can immediately pick a country
  // and the mutation is called exactly once.

  it('allows re-selecting a country immediately after a stale session is cleared', async () => {
    seedStaleSession();

    const mutateSpy = vi.fn();
    (useCreateChatSession as Mock).mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
    });
    setupDefaultMocks({ sessionError: make404Error() });
    // Override the create mock set by setupDefaultMocks
    (useCreateChatSession as Mock).mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
    });

    renderHome();

    // Wait for 404 recovery — selector appears
    const selector = await screen.findByTestId('passport-selector');
    expect(selector).toBeInTheDocument();

    // Tap the first popular country button (SA)
    const saBtn = await screen.findByTestId('btn-popular-SA');
    await userEvent.click(saBtn);

    // createSession.mutate should have been called once
    expect(mutateSpy).toHaveBeenCalledTimes(1);
    expect(mutateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passportCountryCode: 'SA' }),
      }),
      expect.any(Object),
    );
  });
});
