// src/lib/auth.ts (or keep your filename)
import PocketBase from "pocketbase";

/** ---------- PocketBase init ---------- */
export const pb = new PocketBase("https://e0871e346ffb.ngrok-free.app");

/** ---------- Types ---------- */
export interface AppUser {
  id: string;
  email?: string;
  name?: string;
  chips: number;
  isGuest: boolean;
}

type AuthSuccess<TUser> = { success: true; user: TUser };
type AuthFailure = { success: false; error: string };

interface OAuthProvider {
  name: string;
  authUrl?: string;
  state?: string;
  codeVerifier?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

interface ListAuthMethodsResult {
  usernamePassword: boolean;
  emailPassword: boolean;
  oauth2: {
    providers: OAuthProvider[];
  } | null;
}

/** ---------- Constants ---------- */
const GUEST_STORAGE_KEY = "guest_user_v1";
const DEFAULT_CHIPS = 1000;

/** ---------- Helpers (browser-safe) ---------- */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function uuid(): string {
  // Use crypto when available, else a simple fallback
  if (isBrowser() && "crypto" in window && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `guest_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function loadGuestFromStorage(): AppUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppUser;
    // Basic shape guard
    if (parsed && typeof parsed.id === "string" && parsed.isGuest === true) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveGuestToStorage(user: AppUser): void {
  if (!isBrowser()) return;
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(user));
}

function clearGuestFromStorage(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(GUEST_STORAGE_KEY);
}

/** ---------- Auth (email/password) ---------- */
export async function login(email: string, password: string) {
  try {
    const authData = await pb.collection("users").authWithPassword(email, password);
    return { success: true as const, user: authData.record };
  } catch {
    return { success: false as const, error: "Invalid email or password" };
  }
}

/** ---------- Google OAuth ---------- */
export async function googleLogin() {
  try {
    const methods = (await pb.collection("users").listAuthMethods()) as unknown as ListAuthMethodsResult;

    const providers = methods.oauth2?.providers ?? [];
    const googleProvider = providers.find((p) => p.name === "google");
    if (!googleProvider) {
      throw new Error("Google OAuth2 provider not configured");
    }

    const authData = await pb.collection("users").authWithOAuth2({
      provider: "google",
      createData: { chips: DEFAULT_CHIPS },
    });

    return {
      success: true as const,
      user: authData?.record,
    };
  } catch (error: unknown) {
    let errorMessage = "Google login failed";
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }
    return { success: false as const, error: errorMessage };
  }
}

export async function isGoogleOAuthAvailable(): Promise<boolean> {
  try {
    const methods = (await pb.collection("users").listAuthMethods()) as unknown as ListAuthMethodsResult;
    const providers = methods.oauth2?.providers ?? [];
    return providers.some((p) => p.name === "google");
  } catch {
    return false;
  }
}

/** ---------- Session helpers ---------- */
export async function logout(): Promise<void> {
  pb.authStore.clear();
  clearGuestFromStorage();
}

export function isAuthenticated(): boolean {
  return pb.authStore.isValid;
}

/** =======================================================
 *  GUEST MODE: getGuestUser, isGuestUser, guestLogin
 *  - Local-only “account” for players without login
 *  - Persists across refresh via localStorage
 *  - Never touches PocketBase
 *  ======================================================= */

/** Returns the current guest user (if present) */
export function getGuestUser(): AppUser | null {
  return loadGuestFromStorage();
}

/** True if we are currently using a guest profile */
export function isGuestUser(): boolean {
  // If PB is authenticated, we are NOT a guest
  if (pb.authStore.isValid) return false;
  const g = loadGuestFromStorage();
  return !!g;
}

/** Creates (or reuses) a guest profile and “logs in” locally */
export async function guestLogin(preferredName?: string): Promise<AuthResult<AppUser>> {
  try {
    // reuse existing guest if present
    const existing = getGuestUser();
    if (existing) {
      return { success: true, user: existing };
    }

    // create a fresh guest profile
    const guest: AppUser = {
      id: uuid(),
      name: preferredName ?? `Guest_${Math.floor(Math.random() * 9000 + 1000)}`,
      chips: DEFAULT_CHIPS,
      isGuest: true,
    };

    saveGuestToStorage(guest);
    return { success: true, user: guest };
  } catch (e) {
    return { success: false, error: "Guest login failed" };
  }
}

/** Optional: helper to add/subtract chips for guest users only */
export function updateGuestChips(delta: number): AppUser | null {
  const g = loadGuestFromStorage();
  if (!g) return null;
  const next: AppUser = { ...g, chips: Math.max(0, g.chips + delta) };
  saveGuestToStorage(next);
  return next;
}
export type AuthResult<TUser> = AuthSuccess<TUser> | AuthFailure;

