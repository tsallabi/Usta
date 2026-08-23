/**
 * Admin authentication for the /api/admin/* routes.
 *
 * Simple bearer-key auth: the ADMIN_KEY environment variable (set as an
 * ENCRYPTED var in Cloudflare Pages) must match the Authorization header.
 * Good enough for the early-access phase where the only admin is the
 * founder; replaced by real user auth in a later phase.
 */

import { NextResponse } from "next/server";
import { getEnvVar } from "@/lib/db";

export type AdminCheck =
  | { ok: true }
  | { ok: false; response: NextResponse };

export function requireAdmin(request: Request): AdminCheck {
  const configured = getEnvVar("ADMIN_KEY");

  if (!configured || configured.length < 12) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error:
            "Admin console not configured. Set an ADMIN_KEY (12+ chars, encrypted) in Cloudflare Pages environment variables.",
        },
        { status: 503 }
      ),
    };
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token || !timingSafeEqual(token, configured)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Wrong admin key." },
        { status: 401 }
      ),
    };
  }

  return { ok: true };
}

/** Constant-time string comparison to avoid trivial timing attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still burn comparable time on mismatched lengths.
    let acc = 1;
    for (let i = 0; i < a.length; i++) acc |= a.charCodeAt(i);
    return acc === -1;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
