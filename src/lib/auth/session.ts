import { nanoid } from "nanoid";

export const SESSION_COOKIE = "continuum_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface DemoSession {
  sessionId: string;
  workspaceId: string;
  issuedAt: number;
  expiresAt: number;
}

function secret(): string {
  const s = process.env.CONTINUUM_SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production" && !s) {
    console.warn(
      "[continuum] CONTINUUM_SESSION_SECRET unset in production — using insecure fallback",
    );
  }
  return "continuum-demo-dev-secret-change-me";
}

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  // btoa is available in Edge + Node
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payloadB64: string): Promise<string> {
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return b64url(sig);
}

export async function encodeSession(session: DemoSession): Promise<string> {
  const payloadB64 = b64url(new TextEncoder().encode(JSON.stringify(session)));
  const sig = await sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function decodeSession(token: string | undefined | null): Promise<DemoSession | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expected = await sign(payloadB64);
  if (sig.length !== expected.length) return null;
  // timing-safe-ish compare
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const json = new TextDecoder().decode(fromB64url(payloadB64));
    const parsed = JSON.parse(json) as DemoSession;
    if (!parsed.sessionId || !parsed.workspaceId || !parsed.expiresAt) return null;
    if (Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function mintSession(workspaceId?: string): DemoSession {
  const now = Date.now();
  return {
    sessionId: `sess_${nanoid(16)}`,
    workspaceId: workspaceId ?? `ws_${nanoid(12)}`,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
}

export function sessionCookieOptions(token: string) {
  const secure =
    process.env.CONTINUUM_COOKIE_SECURE === "1" ||
    process.env.CONTINUUM_COOKIE_SECURE === "true" ||
    (process.env.NODE_ENV === "production" && process.env.CONTINUUM_COOKIE_SECURE !== "0");
  // Allow http://localhost and http://127.0.0.1 demos under next start (NODE_ENV=production)
  // by setting CONTINUUM_COOKIE_SECURE=0 (Playwright / local prod).
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.CONTINUUM_COOKIE_SECURE === "0" ? false : secure,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

/** Ensure a signed demo session exists; create workspace-scoped cookie if missing. */
export async function requireSession(): Promise<DemoSession> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const existing = await decodeSession(jar.get(SESSION_COOKIE)?.value);
  if (existing) return existing;

  const session = mintSession();
  const token = await encodeSession(session);
  jar.set(sessionCookieOptions(token));
  return session;
}

/** For tests / scripts — mint without Next cookies(). */
export async function mintTestSession(workspaceId = `ws_test_${nanoid(8)}`): Promise<{
  session: DemoSession;
  token: string;
}> {
  const session = mintSession(workspaceId);
  return { session, token: await encodeSession(session) };
}
