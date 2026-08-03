import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  decodeSession,
  encodeSession,
  mintSession,
  sessionCookieOptions,
} from "@/lib/auth/session";

/**
 * Ensure a signed demo session exists before API/UI fan-out so concurrent
 * first-paint requests share one workspace_id.
 *
 * Important: also inject the cookie into the *request* headers so the same
 * request's Route Handlers see the session (Set-Cookie alone only affects
 * subsequent browser requests).
 */
export async function proxy(req: NextRequest) {
  const existing = await decodeSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (existing) return NextResponse.next();

  const session = mintSession();
  const token = await encodeSession(session);
  const opts = sessionCookieOptions(token);

  const requestHeaders = new Headers(req.headers);
  const prior = requestHeaders.get("cookie");
  requestHeaders.set(
    "cookie",
    prior ? `${prior}; ${SESSION_COOKIE}=${token}` : `${SESSION_COOKIE}=${token}`,
  );

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  res.cookies.set(opts.name, opts.value, {
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: opts.secure,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  return res;
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
