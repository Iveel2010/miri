// ============================================================================
// Input sanitization helpers for user-provided social / contact data.
// Guarantees that stored URLs use a safe protocol (http/https) and that
// usernames are stripped of unsafe characters before persistence.
// ============================================================================

const ALLOWED_URL_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Return a safe, absolute URL or `null` for empty/invalid input.
 * Only http(s) protocols are permitted — `javascript:`, `data:`, etc. are
 * dropped to prevent stored-XSS / protocol-smuggling via social links.
 */
export function sanitizeUrl(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (!ALLOWED_URL_PROTOCOLS.has(parsed.protocol)) return null;
  // Normalize to lowercase scheme + host for a stable, safe representation.
  parsed.protocol = parsed.protocol.toLowerCase();
  return parsed.toString();
}

/** Telegram username: leading `@` stripped, only `[a-zA-Z0-9_]`. */
export function sanitizeTelegram(handle: string | null | undefined): string | null {
  if (handle == null) return null;
  const cleaned = handle.trim().replace(/^@/, "");
  if (!cleaned) return null;
  if (!/^[a-zA-Z0-9_]{5,32}$/.test(cleaned)) return null;
  return cleaned;
}

/** Phone / WhatsApp number: keep digits, `+`, spaces, parentheses, hyphens. */
export function sanitizePhone(value: string | null | undefined): string | null {
  if (value == null) return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (!/^[+]?[\d\s().-]{6,20}$/.test(cleaned)) return null;
  return cleaned;
}
