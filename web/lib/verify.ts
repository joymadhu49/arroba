import { createHmac } from "node:crypto";

/**
 * Deterministic verification code shared by both verify API routes:
 * "arc-" + first 10 hex chars of HMAC-SHA256("handle|address", VERIFY_SECRET).
 * Handle and address are lowercased so the code is stable regardless of casing.
 */
export function verificationCode(
  handle: string,
  address: string,
  secret: string,
): string {
  const digest = createHmac("sha256", secret)
    .update(`${handle.toLowerCase()}|${address.toLowerCase()}`)
    .digest("hex");
  return `arc-${digest.slice(0, 10)}`;
}

/** The exact tweet text the user is asked to post. */
export function tweetText(handle: string, code: string): string {
  return `Verifying my @${handle} for Arroba on Arc: ${code}`;
}
