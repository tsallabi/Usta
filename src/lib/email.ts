/**
 * Minimal Resend REST client for Cloudflare Pages edge runtime.
 * Uses `fetch` directly — the official Node SDK isn't edge-friendly.
 *
 * Config comes from RESEND_API_KEY / RESEND_FROM_EMAIL (see .env.example).
 * Missing config never throws: sendEmail() logs and returns
 * { sent: false, reason: "not_configured" } so the product keeps working
 * before email is wired up — the same degradation pattern as the
 * waitlist KV route.
 */

import { getEnvVar } from "@/lib/db";

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: "not_configured" | "error" };

export class ResendError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown
  ) {
    super(message);
    this.name = "ResendError";
  }
}

/**
 * Send a transactional email via Resend's REST API.
 *
 * - Missing RESEND_API_KEY / RESEND_FROM_EMAIL → logs and returns
 *   { sent: false, reason: "not_configured" } (never throws for config).
 * - Non-2xx from Resend → throws {@link ResendError}.
 * - 2xx → returns { sent: true, id } with Resend's message id.
 *
 * Routes should normally call {@link sendEmailSafe} instead so an email
 * outage can never fail a signup.
 */
export async function sendEmail(
  opts: SendEmailOptions
): Promise<SendEmailResult> {
  const apiKey = getEnvVar("RESEND_API_KEY");
  const fromEmail = getEnvVar("RESEND_FROM_EMAIL");

  if (!apiKey || !fromEmail) {
    console.log(
      "[email] Resend not configured; skipping:",
      opts.subject,
      opts.to
    );
    return { sent: false, reason: "not_configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `أسطى <${fromEmail}>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      ...(opts.replyTo && { reply_to: opts.replyTo }),
    }),
  });

  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text().catch(() => undefined);
    }
    throw new ResendError(
      `Resend API returned ${res.status}`,
      res.status,
      detail
    );
  }

  const data = (await res.json()) as { id: string };
  return { sent: true, id: data.id };
}

/**
 * Fire-and-forget wrapper around {@link sendEmail}. Catches everything,
 * logs, and reports { sent: false, reason: "error" } instead of throwing.
 * Use this from API routes: an email failure must never fail the request.
 */
export async function sendEmailSafe(
  opts: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    return await sendEmail(opts);
  } catch (err) {
    console.error("[email] send failed:", opts.subject, opts.to, err);
    return { sent: false, reason: "error" };
  }
}
