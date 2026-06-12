"use server";

import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearSession, getSession, getSessionUserId, setSession } from "./session";

// ── Types ────────────────────────────────────────────────────

export interface ConsumerUser {
  id: string;
  username: string;
  mobile: string | null;
  notifOptIn: boolean;
}

export type AuthResult =
  | { ok: true; user: ConsumerUser }
  | { ok: false; error: string };

export type ActionResult = { ok: true } | { ok: false; error: string };

interface ProfileRecord {
  id: string;
  username: string;
  pin_hash: string;
  mobile: string | null;
  notif_opt_in: boolean;
  token_version: number;
}

// ── Validation helpers ───────────────────────────────────────

const USERNAME_RE = /^[a-z0-9._]{3,30}$/;
const PROFILE_COLS = "id, username, pin_hash, mobile, notif_opt_in, token_version";

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function isValidUsername(uname: string): boolean {
  return USERNAME_RE.test(uname) && uname !== "gobble";
}

function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

function digits(mobile: string): string {
  return mobile.replace(/\D/g, "");
}

function toUser(profile: {
  id: string;
  username: string;
  mobile: string | null;
  notif_opt_in: boolean;
}): ConsumerUser {
  return {
    id: profile.id,
    username: profile.username,
    mobile: profile.mobile,
    notifOptIn: profile.notif_opt_in,
  };
}

// ── DB-backed auth throttle (survives serverless instances) ──
// public.auth_throttle is service-role only (RLS, no policies). All helpers
// fail OPEN on infrastructure errors so a throttle outage never locks users
// out. Keys: 'login:<username>', 'pin:<userId>', 'checkuser:<username>'.

const LOCK_MS = 10 * 60 * 1000;
const MAX_FAILS = 5;

const LOCK_MESSAGE = "Too many failed attempts — try again in 10 minutes.";

/** Returns whether the key is currently locked. Fails open on errors. */
async function checkThrottle(
  key: string,
  maxFails: number = MAX_FAILS
): Promise<{ locked: boolean; remaining: number }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("auth_throttle")
    .select("fails, locked_until")
    .eq("key", key)
    .maybeSingle<{ fails: number; locked_until: string | null }>();
  if (error) return { locked: false, remaining: maxFails };
  if (!data) return { locked: false, remaining: maxFails };

  if (data.locked_until && Date.parse(data.locked_until) > Date.now()) {
    return { locked: true, remaining: 0 };
  }
  return { locked: false, remaining: Math.max(0, maxFails - data.fails) };
}

/**
 * Increments the failure count for the key and locks it for 10 minutes once
 * `maxFails` is reached. Returns whether the key is now locked. Fails open.
 */
async function bumpThrottle(
  key: string,
  maxFails: number = MAX_FAILS
): Promise<{ locked: boolean }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("auth_throttle")
    .select("fails")
    .eq("key", key)
    .maybeSingle<{ fails: number }>();

  const fails = (data?.fails ?? 0) + 1;
  const locked = fails >= maxFails;
  const { error } = await admin.from("auth_throttle").upsert(
    {
      key,
      fails,
      locked_until: locked ? new Date(Date.now() + LOCK_MS).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) return { locked: false };
  return { locked };
}

/** Clears the throttle entry for the key on success. Fails open. */
async function clearThrottle(key: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("auth_throttle").delete().eq("key", key);
}

// Module-level dummy hash for timing equalization when an account is missing.
const DUMMY_PIN_HASH = bcrypt.hashSync("000000", 10);

// ── Actions ──────────────────────────────────────────────────

const CHECKUSER_MAX = 30;

export async function checkUsername(
  username: string
): Promise<{ ok: boolean; available: boolean }> {
  const uname = normalizeUsername(username);
  if (!isValidUsername(uname)) {
    return { ok: true, available: false };
  }

  const throttleKey = `checkuser:${uname}`;
  const { locked } = await checkThrottle(throttleKey, CHECKUSER_MAX);
  if (locked) {
    return { ok: false, available: false };
  }
  await bumpThrottle(throttleKey, CHECKUSER_MAX);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("username", uname)
    .maybeSingle();
  if (error) return { ok: false, available: false };
  return { ok: true, available: !data };
}

export async function signup(
  username: string,
  pin: string,
  mobile: string
): Promise<AuthResult> {
  const uname = normalizeUsername(username);
  if (!uname) return { ok: false, error: "Pick a username first." };
  if (!isValidUsername(uname)) {
    return {
      ok: false,
      error:
        uname === "gobble"
          ? "That username is taken — try another."
          : "Usernames are 3–30 characters: lowercase letters, numbers, dots and underscores.",
    };
  }
  if (!isValidPin(pin)) {
    return { ok: false, error: "Your PIN must be exactly 6 digits." };
  }
  if (digits(mobile).length < 10) {
    return { ok: false, error: "Enter a valid mobile number for recovery." };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", uname)
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "That username is taken — try another." };
  }

  const pinHash = await bcrypt.hash(pin, 10);
  const { data: profile, error } = await admin
    .from("profiles")
    .insert({
      username: uname,
      pin_hash: pinHash,
      mobile: mobile.trim(),
      last_active_at: new Date().toISOString(),
    })
    .select(PROFILE_COLS)
    .single<ProfileRecord>();

  if (error || !profile) {
    if (error?.code === "23505") {
      return { ok: false, error: "That username is taken — try another." };
    }
    return { ok: false, error: "Something went wrong — please try again." };
  }

  await setSession(profile.id, profile.token_version);
  await admin
    .from("analytics_events")
    .insert({ event_type: "signup", user_id: profile.id });

  return { ok: true, user: toUser(profile) };
}

export async function login(username: string, pin: string): Promise<AuthResult> {
  const uname = normalizeUsername(username);
  if (!uname) return { ok: false, error: "Pick a username first." };

  const throttleKey = `login:${uname}`;
  if ((await checkThrottle(throttleKey)).locked) {
    return { ok: false, error: LOCK_MESSAGE };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select(PROFILE_COLS)
    .eq("username", uname)
    .maybeSingle<ProfileRecord>();

  // Always run bcrypt.compare (against a dummy hash when the account is
  // missing) so timing can't distinguish a missing account from a wrong PIN.
  const match =
    isValidPin(pin) &&
    (await bcrypt.compare(pin, profile?.pin_hash ?? DUMMY_PIN_HASH)) &&
    Boolean(profile);
  if (!match || !profile) {
    if ((await bumpThrottle(throttleKey)).locked) {
      return { ok: false, error: LOCK_MESSAGE };
    }
    return { ok: false, error: "Username or PIN is incorrect." };
  }

  await clearThrottle(throttleKey);
  await admin
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", profile.id);
  await setSession(profile.id, profile.token_version);

  return { ok: true, user: toUser(profile) };
}

export async function logout(): Promise<ActionResult> {
  await clearSession();
  return { ok: true };
}

export async function changePin(
  currentPin: string,
  newPin: string
): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "login_required" };
  if (!isValidPin(newPin)) {
    return { ok: false, error: "Your PIN must be exactly 6 digits." };
  }

  const throttleKey = `pin:${userId}`;
  if ((await checkThrottle(throttleKey)).locked) {
    return { ok: false, error: LOCK_MESSAGE };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, pin_hash, token_version")
    .eq("id", userId)
    .maybeSingle<Pick<ProfileRecord, "id" | "pin_hash" | "token_version">>();
  if (!profile) return { ok: false, error: "login_required" };

  const match =
    isValidPin(currentPin) && (await bcrypt.compare(currentPin, profile.pin_hash));
  if (!match) {
    if ((await bumpThrottle(throttleKey)).locked) {
      return { ok: false, error: LOCK_MESSAGE };
    }
    return { ok: false, error: "That PIN doesn't match." };
  }

  const pinHash = await bcrypt.hash(newPin, 10);
  const nextVersion = profile.token_version + 1;
  const { error } = await admin
    .from("profiles")
    .update({ pin_hash: pinHash, token_version: nextVersion })
    .eq("id", userId);
  if (error) return { ok: false, error: "Something went wrong — please try again." };

  await clearThrottle(throttleKey);
  // Re-issue the session for the current device with the new token version so
  // it stays signed in while every other session is invalidated.
  await setSession(userId, nextVersion);
  return { ok: true };
}

export async function forgotPin(): Promise<ActionResult> {
  // SMS OTP delivery is deferred — surface the support path instead.
  return {
    ok: false,
    error:
      "PIN reset requires SMS verification — contact support to reset your PIN.",
  };
}

export async function getCurrentUser(): Promise<ConsumerUser | null> {
  const session = await getSession();
  if (!session) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, mobile, notif_opt_in, token_version")
    .eq("id", session.userId)
    .maybeSingle<Omit<ProfileRecord, "pin_hash">>();
  if (!profile) return null;

  // A bumped token_version (e.g. after changePin) invalidates older sessions.
  if (profile.token_version !== session.ver) {
    await clearSession();
    return null;
  }
  return toUser(profile);
}
