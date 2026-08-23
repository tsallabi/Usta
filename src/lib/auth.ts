/**
 * مصادقة توّا — هاتف + كلمة سر.
 *
 * ليش مش OTP عبر SMS؟ مزوّدو الرسائل بالكاد يغطّون ليبيا وبتكلفة عالية.
 * MVP: المستخدم يختار رمزاً سرياً، ونحفظه PBKDF2-SHA256. الجلسة كوكي
 * HMAC-موقّع بدون حالة على الخادم (stateless). واتساب OTP يجي لاحقاً.
 *
 * Edge-safe: Web Crypto فقط — لا يوجد أي import من node:crypto.
 *
 * Secret: متغيّر البيئة AUTH_SECRET (مشفّر في Cloudflare Pages، 16+ حرف).
 * لو غير مضبوط، مسارات المصادقة ترجع 503 برسالة عربية — نفس فلسفة
 * ADMIN_KEY في src/lib/admin.ts.
 */

import { getEnvVar } from "@/lib/db";

export const SESSION_COOKIE = "usta_session";

/** 30 يوم بالثواني. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const PBKDF2_ITERATIONS = 100_000;

export const AUTH_NOT_CONFIGURED_MESSAGE =
  "تسجيل الدخول غير مفعّل بعد — أضف AUTH_SECRET في إعدادات Cloudflare.";

function getAuthSecret(): string | null {
  const secret = getEnvVar("AUTH_SECRET");
  if (!secret || secret.length < 16) return null;
  return secret;
}

/** هل المصادقة مفعّلة؟ (AUTH_SECRET موجود وطوله كافٍ) */
export function isAuthConfigured(): boolean {
  return getAuthSecret() !== null;
}

// ─── Base64 helpers (edge-safe, binary-clean) ───────────────────────

function toB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromB64(b64: string): Uint8Array<ArrayBuffer> | null {
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/** Constant-time byte comparison. */
function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    // Burn comparable time on mismatched lengths.
    let acc = 1;
    for (let i = 0; i < a.length; i++) acc |= a[i];
    return acc === -1;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ─── PIN hashing (PBKDF2-SHA256) ────────────────────────────────────

async function derivePinBits(
  pin: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256
  );
  return new Uint8Array(bits);
}

/** يُرجع "100000.<saltB64>.<hashB64>" — ملح عشوائي 16 بايت لكل مستخدم. */
export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePinBits(pin, salt, PBKDF2_ITERATIONS);
  return `${PBKDF2_ITERATIONS}.${toB64(salt)}.${toB64(hash)}`;
}

/** مقارنة ثابتة الزمن ضد الصيغة المخزّنة. */
export async function verifyPin(
  pin: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split(".");
  if (parts.length !== 3) return false;
  const iterations = Number.parseInt(parts[0], 10);
  if (!Number.isFinite(iterations) || iterations < 1_000) return false;
  const salt = fromB64(parts[1]);
  const expected = fromB64(parts[2]);
  if (!salt || !expected || expected.length === 0) return false;
  const actual = await derivePinBits(pin, salt, iterations);
  return timingSafeEqualBytes(actual, expected);
}

// ─── Stateless session token: phoneB64.expiresEpoch.hmacB64 ─────────

async function hmacSign(secret: string, payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return new Uint8Array(sig);
}

/** ينشئ توكن جلسة موقّع HMAC-SHA256، صالح 30 يوم. */
export async function createSession(phone: string): Promise<string> {
  const secret = getAuthSecret();
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const phoneB64 = toB64(new TextEncoder().encode(phone));
  const payload = `${phoneB64}.${expires}`;
  const sig = await hmacSign(secret, payload);
  return `${payload}.${toB64(sig)}`;
}

/** يتحقق من التوقيع والصلاحية؛ يُرجع رقم الهاتف أو null. */
export async function readSession(token: string): Promise<string | null> {
  const secret = getAuthSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [phoneB64, expiresRaw, sigB64] = parts;

  const expires = Number.parseInt(expiresRaw, 10);
  if (!Number.isFinite(expires)) return null;
  if (expires < Math.floor(Date.now() / 1000)) return null;

  const providedSig = fromB64(sigB64);
  if (!providedSig) return null;
  const expectedSig = await hmacSign(secret, `${phoneB64}.${expiresRaw}`);
  if (!timingSafeEqualBytes(providedSig, expectedSig)) return null;

  const phoneBytes = fromB64(phoneB64);
  if (!phoneBytes) return null;
  const phone = new TextDecoder().decode(phoneBytes);
  return /^09[0-9]{8}$/.test(phone) ? phone : null;
}

// ─── Cookie helpers ─────────────────────────────────────────────────

/** Set-Cookie لتسجيل الدخول (HttpOnly, Secure, SameSite=Lax, 30 يوم). */
export function buildSessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`;
}

/** Set-Cookie لمسح الجلسة (تسجيل الخروج). */
export function buildClearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

/** يقرأ كوكي الجلسة من الطلب ويُرجع رقم الهاتف أو null. */
export async function getSessionPhone(
  request: Request
): Promise<string | null> {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (name !== SESSION_COOKIE) continue;
    let token = part.slice(eq + 1).trim();
    try {
      token = decodeURIComponent(token);
    } catch {
      return null;
    }
    return readSession(token);
  }
  return null;
}
