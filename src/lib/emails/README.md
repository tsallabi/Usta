# Transactional emails — integrator notes

> **Tawwa note**: email is optional in the Libyan market — every route only
> calls the sender when the user actually provided an email address.
> Phone/WhatsApp is the primary channel.

## Wiring the routes

Import the safe sender + a template, spread the template into the send.
Call it **after** the successful persist (KV put / D1 insert), before the
response:

```ts
import { sendEmailSafe } from "@/lib/email";
import { waitlistWelcomeEmail } from "@/lib/emails/templates";

// waitlist route, after the successful kv.put:
await sendEmailSafe({ to: email, ...waitlistWelcomeEmail({ email, audience }) });
```

Same pattern for the other routes:

```ts
// jobs route:
await sendEmailSafe({ to: email, ...jobPostedEmail({ jobId, service, description, min, max }) });

// tradesmen route:
await sendEmailSafe({ to: email, ...tradesmanApplicationEmail({ applicationId, fullName, trade }) });
```

`sendEmailSafe` is fire-and-forget in spirit: it catches everything,
logs via `console.error`, and returns `{ sent: false, reason }` instead
of throwing — an email outage (or missing config) can **never** block or
fail the API response. Don't branch on its result in routes; the user
already succeeded.

## Env setup

1. Sign up at [resend.com](https://resend.com) (free tier is fine).
2. Verify your sending domain, e.g. `usta.ly` (Resend → Domains → add DNS records),
   **or** for testing use `onboarding@resend.dev` as the from address —
   no domain verification needed, but it only delivers to your own
   Resend account email.
3. In Cloudflare Pages → Settings → Environment variables (Production):
   - `RESEND_API_KEY` — add as **encrypted**
   - `RESEND_FROM_EMAIL` — e.g. `hello@usta.ly` (or `onboarding@resend.dev` while testing)

Both are already documented in `.env.example`. If either is missing,
sends are skipped with a `[email] Resend not configured` log line and
the app behaves exactly as before — no code changes needed to run
without email.
