import { formatEther } from "viem";

/**
 * Native USDC on Arc uses 18 decimals, so amounts travel as wei-style bigints
 * (parseEther / formatEther) and render as dollars.
 */
export function formatUsd(wei: bigint): string {
  const value = Number(formatEther(wei));
  const options =
    value > 0 && value < 0.01
      ? { minimumFractionDigits: 2, maximumFractionDigits: 6 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return `$${value.toLocaleString("en-US", options)}`;
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function shortHash(hash: string): string {
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-4)}`;
}

/** Strip a leading "@" and lowercase — handles are stored lowercase on-chain. */
export function normalizeHandle(input: string): string {
  return input.trim().replace(/^@+/, "").toLowerCase();
}

/** X (Twitter) usernames: 1–15 chars of [A-Za-z0-9_]. */
export const HANDLE_REGEX = /^[a-z0-9_]{1,15}$/;

export function isValidHandle(handle: string): boolean {
  return HANDLE_REGEX.test(handle);
}
