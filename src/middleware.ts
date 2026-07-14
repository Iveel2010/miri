import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders, getCorsHeaders } from "@/lib/security";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// ============================================================================
// Global middleware.
//  - Adds security headers (Helmet-like) + CORS to every /api response.
//  - Enforces a global rate limit (per IP). For stricter per-route limits,
//    extend `clientKey` with a route scope inside controllers.
//  - Handles CORS preflight (OPTIONS).
//
// Note: JWT verification is intentionally performed in route handlers (Node
// runtime) rather than here, because the signing libs are Node-only.
// ============================================================================

export async function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");

  // CORS preflight
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    for (const [k, v] of Object.entries(getCorsHeaders(origin))) res.headers.set(k, v);
    return res;
  }

  // Global rate limit
  const limit = rateLimit(clientKey(req, "global"));
  if (!limit.success) {
    const res = NextResponse.json(
      { success: false, message: "Too many requests", code: "RATE_LIMITED" },
      { status: 429 },
    );
    res.headers.set("Retry-After", String(limit.retryAfter));
    applySecurityHeaders(res, origin);
    return res;
  }

  // Continue to the route handler, attaching security + CORS headers.
  const res = NextResponse.next();
  applySecurityHeaders(res, origin);
  res.headers.set("X-RateLimit-Remaining", String(limit.remaining));
  return res;
}

export const config = {
  // Run on all API routes (skip Next internals and static assets).
  matcher: ["/api/:path*"],
};
