// Consumer session — HMAC-SHA256 signed cookie. Server-only (node:crypto).
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const COOKIE_NAME = "gb_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SECRET environment variable.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/**
 * Verifies the `gb_session` cookie (`userId.expiresEpoch.tokenVersion.sigHex`)
 * and returns { userId, ver }, or null when missing/invalid/expired. Legacy
 * 3-part cookies (no version) verify as invalid — users simply re-login.
 */
export async function getSession(): Promise<{ userId: string; ver: number } | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 4) return null;
  const [userId, expiresStr, verStr, signature] = parts;
  if (
    !userId ||
    !/^\d+$/.test(expiresStr) ||
    !/^\d+$/.test(verStr) ||
    !/^[0-9a-f]+$/i.test(signature)
  ) {
    return null;
  }

  const expected = sign(`${userId}.${expiresStr}.${verStr}`);
  const sigBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  const expiresEpoch = Number(expiresStr);
  if (!Number.isFinite(expiresEpoch) || expiresEpoch * 1000 < Date.now()) {
    return null;
  }

  return { userId, ver: Number(verStr) };
}

/**
 * Returns the session user id (no DB check — cheap path), or null when
 * missing/invalid/expired.
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId ?? null;
}

/**
 * Resolves the session user id only when the cookie's token version still
 * matches profiles.token_version (the log-out-everywhere control). On a stale
 * version the session is cleared and null is returned. Use this to gate every
 * mutation; getSessionUserId stays for cheap read-only paths.
 */
export async function requireValidUser(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("token_version")
    .eq("id", session.userId)
    .maybeSingle<{ token_version: number }>();
  if (!profile || profile.token_version !== session.ver) {
    await clearSession();
    return null;
  }
  return session.userId;
}

/** Sets a signed 90-day session cookie for the given user id + token version. */
export async function setSession(userId: string, ver: number = 0): Promise<void> {
  const expiresEpoch = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = `${userId}.${expiresEpoch}.${ver}`;
  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

/** Clears the session cookie. */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}
