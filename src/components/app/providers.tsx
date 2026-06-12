"use client";
// Gobble Maps consumer — client providers for the (app) shell.
// UserProvider: session user + saved sets + lists, hydrated from the layout's
//   server fetch (getMyData) and refreshable via the same server action.
// FiltersProvider: prototype FiltersState with sessionStorage persistence.
// AuthUIProvider: soft login prompts (never block browsing) — shows the
//   ported GLoginPrompt sheet, then the AuthScreen; runs the pending action
//   after a successful login/signup.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { AuthScreen } from "./auth-screen";
import { LoginPrompt } from "./login-prompt";
import type { ConsumerUser } from "@/lib/consumer/auth-actions";
import {
  EMPTY_FILTERS,
  countActive,
  filterChipLabels,
  type FiltersState,
} from "@/lib/consumer/filters";
import {
  getMyData,
  type ConsumerList,
  type MyData,
} from "@/lib/consumer/user-actions";

// ── User context ─────────────────────────────────────────────

export interface UserContextValue {
  user: ConsumerUser | null;
  /** Place ids saved as been-there. */
  been: Set<string>;
  /** Place ids saved as wishlist. */
  wish: Set<string>;
  lists: ConsumerList[];
  /** Re-fetches getMyData() and updates the context. */
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within <Providers>");
  return ctx;
}

function UserProvider({
  initialData,
  children,
}: {
  initialData: MyData | null;
  children: ReactNode;
}) {
  const [data, setData] = useState<MyData | null>(initialData);

  // Pick up fresh server data after router.refresh() re-renders the layout
  // (render-time state sync instead of setState inside an effect).
  const [prevInitial, setPrevInitial] = useState(initialData);
  if (prevInitial !== initialData) {
    setPrevInitial(initialData);
    setData(initialData);
  }

  const refresh = useCallback(async () => {
    setData(await getMyData());
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user: data?.user ?? null,
      been: new Set(data?.been ?? []),
      wish: new Set(data?.wish ?? []),
      lists: data?.lists ?? [],
      refresh,
    }),
    [data, refresh]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ── Filters context ──────────────────────────────────────────

const FILTERS_STORAGE_KEY = "gb_filters_v1";

/** Active filter_options labels grouped by category (from the server). */
export interface FilterOptions {
  cuisine: string[];
  vibe: string[];
  area: string[];
}

export interface FiltersContextValue {
  filters: FiltersState;
  setFilters: Dispatch<SetStateAction<FiltersState>>;
  clear: () => void;
  /** Count of active selections (badge on the sliders button). */
  activeCount: number;
  /** Labels for the active-filter chip row, e.g. ['Japanese', 'Open now']. */
  chipLabels: string[];
  /** Admin-managed options for the Cuisine / Vibe / Area groups. */
  options: FilterOptions;
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within <Providers>");
  return ctx;
}

function sanitizeFilters(raw: unknown): FiltersState {
  if (typeof raw !== "object" || raw === null) return EMPTY_FILTERS;
  const merged = { ...EMPTY_FILTERS, ...(raw as Partial<FiltersState>) };
  return merged;
}

function FiltersProvider({
  options,
  children,
}: {
  options: FilterOptions;
  children: ReactNode;
}) {
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  // Becomes true only after the sessionStorage read, so the persist effect
  // never overwrites stored filters with the initial empty state.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Deferred so the hydration restore isn't a synchronous setState in the
    // effect body (react-hooks/set-state-in-effect).
    const t = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(FILTERS_STORAGE_KEY);
        if (raw) setFilters(sanitizeFilters(JSON.parse(raw)));
      } catch {
        // Ignore bad/unavailable storage — start from empty filters.
      }
      setReady(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // Storage unavailable — filters just won't persist.
    }
  }, [filters, ready]);

  const clear = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const value = useMemo<FiltersContextValue>(
    () => ({
      filters,
      setFilters,
      clear,
      activeCount: countActive(filters),
      chipLabels: filterChipLabels(filters),
      options,
    }),
    [filters, clear, options]
  );

  return (
    <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
  );
}

// ── Auth UI context (soft login prompts, FR-7) ───────────────

export interface AuthUIContextValue {
  /**
   * Runs `then` immediately when logged in; otherwise shows the login
   * prompt sheet ("Log in to {action}") and runs `then` after a
   * successful login/signup.
   */
  requireAuth: (action: string, then?: () => void) => void;
  /** Opens the login/signup screen directly. */
  openAuth: () => void;
}

const AuthUIContext = createContext<AuthUIContextValue | null>(null);

export function useAuthUI(): AuthUIContextValue {
  const ctx = useContext(AuthUIContext);
  if (!ctx) throw new Error("useAuthUI must be used within <Providers>");
  return ctx;
}

function AuthUIProvider({ children }: { children: ReactNode }) {
  const { user, refresh } = useUser();
  const [promptAction, setPromptAction] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const pendingRef = useRef<(() => void) | null>(null);

  // Drop the pending action when both surfaces are closed without auth
  // (e.g. the user taps "Keep browsing").
  useEffect(() => {
    if (promptAction === null && !authOpen) pendingRef.current = null;
  }, [promptAction, authOpen]);

  const requireAuth = useCallback(
    (action: string, then?: () => void) => {
      if (user) {
        then?.();
        return;
      }
      pendingRef.current = then ?? null;
      setPromptAction(action);
    },
    [user]
  );

  const openAuth = useCallback(() => setAuthOpen(true), []);

  const value = useMemo<AuthUIContextValue>(
    () => ({ requireAuth, openAuth }),
    [requireAuth, openAuth]
  );

  return (
    <AuthUIContext.Provider value={value}>
      {children}
      <LoginPrompt
        open={promptAction !== null}
        action={promptAction ?? ""}
        onClose={() => setPromptAction(null)}
        onLogin={() => setAuthOpen(true)}
      />
      <AuthScreen
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthed={() => {
          setAuthOpen(false);
          const then = pendingRef.current;
          pendingRef.current = null;
          void refresh();
          then?.();
        }}
      />
    </AuthUIContext.Provider>
  );
}

// ── Composite ────────────────────────────────────────────────

export interface ProvidersProps {
  /** Session-aware getMyData() result from the (app) layout. */
  initialData: MyData | null;
  /** getActiveFilterOptions() result from the (app) layout. */
  filterOptions: FilterOptions;
  children: ReactNode;
}

export function Providers({
  initialData,
  filterOptions,
  children,
}: ProvidersProps) {
  return (
    <UserProvider initialData={initialData}>
      <FiltersProvider options={filterOptions}>
        <AuthUIProvider>{children}</AuthUIProvider>
      </FiltersProvider>
    </UserProvider>
  );
}
