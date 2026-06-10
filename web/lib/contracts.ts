import { isAddress, zeroAddress, type Address } from "viem";

function parseAddress(value: string | undefined): Address | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!isAddress(trimmed, { strict: false })) return undefined;
  if (trimmed.toLowerCase() === zeroAddress) return undefined;
  return trimmed as Address;
}

/**
 * Contract addresses come from the environment. Until the contracts are
 * deployed these stay undefined and the UI shows a "not deployed yet" banner.
 *
 * INTEGRATION PASS: set NEXT_PUBLIC_REGISTRY_ADDRESS and
 * NEXT_PUBLIC_HANDLEPAY_ADDRESS once deployment addresses are known.
 */
export const REGISTRY_ADDRESS = parseAddress(
  process.env.NEXT_PUBLIC_REGISTRY_ADDRESS,
);

export const HANDLEPAY_ADDRESS = parseAddress(
  process.env.NEXT_PUBLIC_HANDLEPAY_ADDRESS,
);

export const CONTRACTS_READY = Boolean(REGISTRY_ADDRESS && HANDLEPAY_ADDRESS);
