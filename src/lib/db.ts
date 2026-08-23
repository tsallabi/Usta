/**
 * Cloudflare D1 access helper for the edge runtime.
 *
 * The D1 database is bound as `DB` in the Cloudflare Pages dashboard
 * (Settings -> Functions -> D1 database bindings). Until the binding is
 * attached, getDb() returns null and callers degrade gracefully —
 * the same pattern the waitlist KV route uses.
 *
 * Schema: migrations/0001_initial.sql
 */

import { getRequestContext } from "@cloudflare/next-on-pages";

export function getDb(): D1Database | null {
  try {
    const { env } = getRequestContext();
    const db = (env as unknown as { DB?: D1Database }).DB;
    return db ?? null;
  } catch {
    return null;
  }
}

export function getKv(binding: string): KVNamespace | null {
  try {
    const { env } = getRequestContext();
    const kv = (env as unknown as Record<string, KVNamespace | undefined>)[
      binding
    ];
    return kv ?? null;
  } catch {
    return null;
  }
}

export function getEnvVar(name: string): string | undefined {
  try {
    const { env } = getRequestContext();
    const value = (env as unknown as Record<string, string | undefined>)[name];
    if (value) return value;
  } catch {
    // fall through to process.env (local dev)
  }
  return process.env[name];
}

/** Crypto-random id, URL-safe, 21 chars — nanoid-shaped without the dep. */
export function newId(prefix?: string): string {
  const alphabet =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = new Uint8Array(21);
  crypto.getRandomValues(bytes);
  let id = "";
  for (const b of bytes) id += alphabet[b % alphabet.length];
  return prefix ? `${prefix}_${id}` : id;
}
